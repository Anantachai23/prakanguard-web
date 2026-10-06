import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import MapView, { resolveLevel, deduplicateAndDeclutterPoints, isWaterReceding } from './components/MapView';
import VisualGauge from './components/VisualGauge';
import AiForecastModal from './components/AiForecastModal';
import FloodStandardsModal from './components/FloodStandardsModal';
import EmergencyModal from './components/EmergencyModal';
import WelcomeModal from './components/WelcomeModal';
import CitizenReportModal from './components/CitizenReportModal';
import AdminModal from './components/AdminModal';
import FeedbackModal from './components/FeedbackModal';
import AdminVerificationPrompt from './components/AdminVerificationPrompt';
import PublicUpdatesModal from './components/PublicUpdatesModal';
import RainForecast24hCard from './components/RainForecast24hCard';
import MobileBottomNav from './components/MobileBottomNav';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import AutoMarquee from './components/AutoMarquee';
import ChatBot from './components/ChatBot';
import { INITIAL_FLOOD_POINTS, INITIAL_CITIZEN_REPORTS, DISTRICTS, matchesLocationSearch, scoreLocationSearch, POPULAR_SEARCH_SUGGESTIONS, findCorridorForPoint, MAJOR_FLOOD_CORRIDORS } from './data/samutPrakanPoints';
import { SAMUT_PRAKAN_DISTRICTS_DATA } from './data/samutPrakanDistricts';
import { getFloodLevel, FLOOD_STANDARDS } from './data/floodStandards';
import { detectDistrictForCoordinates, isPointInSamutPrakan } from './data/samutPrakanBoundary';
import { getOfficialAdvisorySummary } from './services/aiPredictor';
import { getLiveSamutPrakanWeather } from './services/weatherService';
import { runOfficial24HourSync, getFloodStatusSignature } from './services/aiSentryService';
import { 
  loadDailyUpdatesFromStorage, 
  mergeDailyUpdateEvent, 
  getBangkokDateKey, 
  getMsUntilBangkokMidnight, 
  formatBangkokTime 
} from './services/dailyUpdatesService';
import { 
  publishCloudReport, 
  publishCloudFeedback, 
  publishAdminAction,
  fetchRecentCloudReports, 
  fetchRecentCloudFeedback, 
  subscribeToCloudEvents,
  syncCloudDataNow,
  isValidReport,
  isValidFeedback,
  sendVisitorTelemetry,
  getDetailedDeviceInfo
} from './services/cloudSyncService';
import { 
  Phone, 
  X, 
  ArrowRight, 
  Shield, 
  BookOpen, 
  Radio, 
  AlertTriangle, 
  CloudRain, 
  Search, 
  MapPin, 
  Navigation2,
  Navigation,
  Camera,
  ShieldAlert,
  CheckCircle2,
  Bell,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Megaphone,
  Sparkles,
  Flame,
  GripHorizontal,
  Compass,
  Sun,
  Moon,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { 
  playClickSound, 
  playToggleSound, 
  playRefreshSound, 
  playGpsSound, 
  playReportSound, 
  playAiChatSound, 
  playSelectSound, 
  playCloseSound,
  playEmergencySound,
  playModalOpenSound
} from './services/soundEffects';

// Distance calculation helper (Haversine Formula)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Crisp dual-tone audio notification chime via Web Audio API (cross-device safe)
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.38);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
}

export default function App() {
  const [points, setPoints] = useState(() => {
    try {
      // Clear legacy stale cache (20 cm)
      localStorage.removeItem('prakanguard_points_state_v5');
      localStorage.removeItem('prakanguard_points_state_v6');
      
      const saved = localStorage.getItem('prakanguard_points_state_v7');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const initMap = new Map(INITIAL_FLOOD_POINTS.map(p => [p.id, p]));
          const parsedIds = new Set(parsed.map(p => p.id));

          // Merge saved items
          const list = parsed.map(item => {
            const initPoint = initMap.get(item.id);
            const merged = initPoint 
              ? { 
                  ...initPoint, 
                  ...item, 
                  name: initPoint.name,
                  lat: initPoint.lat,
                  lng: initPoint.lng,
                  roadSegment: initPoint.roadSegment,
                  waterTrend: initPoint.waterTrend || item.waterTrend,
                  trendText: initPoint.trendText || item.trendText,
                  depthCm: initPoint.depthCm,
                  trafficStatus: initPoint.trafficStatus || item.trafficStatus,
                  statusLabel: initPoint.statusLabel || item.statusLabel,
                  aliases: item.aliases || initPoint.aliases, 
                  keywords: item.keywords || initPoint.keywords 
                }
              : item;
            const lvl = merged.depthCm !== undefined ? getFloodLevel(merged.depthCm) : (merged.level || 0);
            const detectedDist = detectDistrictForCoordinates(merged.lat, merged.lng);
            return {
              ...merged,
              district: detectedDist || merged.district,
              level: lvl,
              depthRange: lvl === 3 ? '> 50 ซม.' : lvl === 2 ? '21 - 50 ซม.' : (merged.depthCm > 0 ? '5 - 20 ซม.' : '0 ซม. (แห้งปกติ)')
            };
          });

          // Ensure any initial points that weren't in saved list are preserved
          INITIAL_FLOOD_POINTS.forEach(ip => {
            if (!parsedIds.has(ip.id) && isPointInSamutPrakan(ip.lat, ip.lng)) {
              const lvl = getFloodLevel(ip.depthCm);
              const detectedDist = detectDistrictForCoordinates(ip.lat, ip.lng);
              list.push({
                ...ip,
                district: detectedDist || ip.district,
                level: lvl,
                depthRange: lvl === 3 ? '> 50 ซม.' : lvl === 2 ? '21 - 50 ซม.' : (ip.depthCm > 0 ? '5 - 20 ซม.' : '0 ซม. (แห้งปกติ)')
              });
            }
          });

          // Strictly purge any point outside Samut Prakan boundary
          const cleanedList = list.filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number' && isPointInSamutPrakan(p.lat, p.lng));
          try {
            localStorage.setItem('prakanguard_points_state_v7', JSON.stringify(cleanedList));
          } catch (e) {}

          return cleanedList;
        }
      }
    } catch (e) {}
    const defaultPoints = INITIAL_FLOOD_POINTS
      .filter(p => isPointInSamutPrakan(p.lat, p.lng))
      .map(p => {
        const lvl = getFloodLevel(p.depthCm);
        const detectedDist = detectDistrictForCoordinates(p.lat, p.lng);
        return {
          ...p,
          district: detectedDist || p.district,
          level: lvl,
          depthRange: lvl === 3 ? '> 50 ซม.' : lvl === 2 ? '21 - 50 ซม.' : (p.depthCm > 0 ? '5 - 20 ซม.' : '0 ซม. (แห้งปกติ)')
        };
      });
    return defaultPoints;
  });

  // Daily Flood Status Updates (อัปเดตสถานการณ์น้ำรายวัน: เที่ยงคืนลบออกทั้งหมด, อัปเดตตามจุดจริง 1 เวลาต่อ 1 ครั้ง)
  const [dailyUpdates, setDailyUpdates] = useState(() => loadDailyUpdatesFromStorage());

  const [changelog, setChangelog] = useState(() => {
    try {
      const saved = localStorage.getItem('prakanguard_24h_changelog');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {}
    return [];
  });

  const pointsRef = useRef(points);
  const [selectedDistrict, setSelectedDistrict] = useState("ทั้งหมด");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [desktopSidebarTab, setDesktopSidebarTab] = useState('points'); // 'points' | 'weather'
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // { url, title, time }

  useEffect(() => {
    pointsRef.current = points;
    try {
      localStorage.setItem('prakanguard_points_state_v7', JSON.stringify(points));
    } catch (e) {}
  }, [points]);

  // Autonomous Midnight Reset Engine for "อัปเดตสถานการณ์น้ำ" (00:00:00 น. ของทุกวัน ลบออกทั้งหมดอัตโนมัติ 100%)
  useEffect(() => {
    const checkMidnight = () => {
      const todayKey = getBangkokDateKey();
      const storedDate = localStorage.getItem('prakanguard_daily_updates_date');
      // ลบเฉพาะเมื่อผ่านเที่ยงคืนของวันใหม่จริงๆ เท่านั้น ห้ามล้างระหว่างวัน
      if (storedDate && storedDate < todayKey) {
        setDailyUpdates([]);
        try {
          localStorage.setItem('prakanguard_daily_updates_date', todayKey);
          localStorage.setItem('prakanguard_daily_updates_feed', '[]');
        } catch (_) {}
      }
    };

    const interval = setInterval(checkMidnight, 30000);

    const msUntilMidnight = getMsUntilBangkokMidnight();
    const midnightTimer = setTimeout(() => {
      setDailyUpdates([]);
      try {
        const newKey = getBangkokDateKey();
        localStorage.setItem('prakanguard_daily_updates_date', newKey);
        localStorage.setItem('prakanguard_daily_updates_feed', '[]');
      } catch (_) {}
    }, msUntilMidnight);

    // Listen to live official flood points from sync engine (Traffy Fondue)
    const handleOfficialFloodPoints = (e) => {
      const incoming = e.detail?.floodPoints;
      if (Array.isArray(incoming) && incoming.length > 0) {
        incoming.forEach(p => {
          setDailyUpdates(prev => mergeDailyUpdateEvent(prev, {
            id: `upd_traffy_${p.ticket_id || p.id}`,
            locationKey: String(p.ticket_id || p.id),
            locationName: p.description || p.address || 'จุดน้ำท่วมขัง (Traffy Fondue)',
            district: p.district || 'สมุทรปราการ',
            subdistrict: p.address || '',
            statusType: 'rising',
            statusLabel: 'เริ่มท่วมแล้ว',
            depthCm: p.depthCm || 20,
            itemTime: formatBangkokTime(),
            source: 'Traffy Fondue Open API (ข้อมูลจริง)',
            lat: p.lat,
            lng: p.lng,
            rawPoint: p
          }));
        });
      }
    };
    window.addEventListener('prakanguard:official-flood-points', handleOfficialFloodPoints);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimer);
      window.removeEventListener('prakanguard:official-flood-points', handleOfficialFloodPoints);
    };
  }, []);

  // Global Website Theme: 'light' | 'dark' (Persisted in localStorage)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('prakanguard_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('prakanguard_theme', next);
      } catch (e) {}
      return next;
    });
  };

  const isDark = theme === 'dark';

  // Synchronize root HTML element class with selected theme (Prevents system dark mode conflicts in light theme)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Search keyword state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [mobileSheetTab, setMobileSheetTab] = useState('overview');
  const isTopPanelCollapsed = !isSidebarOpen;
  const setIsTopPanelCollapsed = (val) => {
    if (typeof val === 'function') {
      setIsSidebarOpen(prev => !val(!prev));
    } else {
      setIsSidebarOpen(!val);
    }
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  // District Filter Smooth Drag & Cinematic Scroll Controllers (60fps fluid interpolation)
  const districtScrollRef = useRef(null);
  const districtAnimRef = useRef(null);
  const isDraggingDistrictRef = useRef(false);
  const districtStartXRef = useRef(0);
  const districtScrollLeftRef = useRef(0);
  const districtHasDraggedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkDistrictScrollBounds = () => {
    const el = districtScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  // Fluid requestAnimationFrame glide (Eliminates instant jumps completely)
  const scrollDistrict = (direction) => {
    const el = districtScrollRef.current;
    if (!el) return;

    if (districtAnimRef.current) {
      cancelAnimationFrame(districtAnimRef.current);
    }

    const distance = direction === 'left' ? -240 : 240;
    const startPos = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetPos = Math.max(0, Math.min(maxScroll, startPos + distance));
    const delta = targetPos - startPos;

    if (Math.abs(delta) < 1) return;

    const duration = 480; // 480ms cinematic smooth glide
    const startTime = performance.now();
    const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.scrollLeft = startPos + delta * easeOutQuint(progress);

      if (progress < 1) {
        districtAnimRef.current = requestAnimationFrame(step);
      } else {
        districtAnimRef.current = null;
        checkDistrictScrollBounds();
      }
    };

    districtAnimRef.current = requestAnimationFrame(step);
  };

  // Click District Handler: gently centers the selected district smoothly
  const handleSelectDistrict = (dist, e) => {
    if (districtHasDraggedRef.current) {
      e?.preventDefault();
      e?.stopPropagation();
      return;
    }
    setSelectedDistrict(dist);

    const el = districtScrollRef.current;
    if (el && e?.currentTarget) {
      const btn = e.currentTarget;
      const btnCenter = btn.offsetLeft - el.offsetLeft + btn.clientWidth / 2;
      const targetScroll = btnCenter - el.clientWidth / 2;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const clampedTarget = Math.max(0, Math.min(maxScroll, targetScroll));
      const delta = clampedTarget - el.scrollLeft;

      if (Math.abs(delta) > 8) {
        if (districtAnimRef.current) cancelAnimationFrame(districtAnimRef.current);
        const startPos = el.scrollLeft;
        const duration = 420;
        const startTime = performance.now();
        const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);

        const step = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          el.scrollLeft = startPos + delta * easeOutQuad(progress);
          if (progress < 1) {
            districtAnimRef.current = requestAnimationFrame(step);
          } else {
            districtAnimRef.current = null;
            checkDistrictScrollBounds();
          }
        };
        districtAnimRef.current = requestAnimationFrame(step);
      }
    }
  };

  const handleDistrictMouseDown = (e) => {
    const el = districtScrollRef.current;
    if (!el) return;
    if (districtAnimRef.current) cancelAnimationFrame(districtAnimRef.current);
    isDraggingDistrictRef.current = true;
    districtStartXRef.current = e.pageX - el.offsetLeft;
    districtScrollLeftRef.current = el.scrollLeft;
    districtHasDraggedRef.current = false;
  };

  const handleDistrictMouseMove = (e) => {
    if (!isDraggingDistrictRef.current) return;
    const el = districtScrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - districtStartXRef.current) * 1.35;
    if (Math.abs(walk) > 4) {
      districtHasDraggedRef.current = true;
    }
    el.scrollLeft = districtScrollLeftRef.current - walk;
    checkDistrictScrollBounds();
  };

  const handleDistrictMouseUp = () => {
    isDraggingDistrictRef.current = false;
    setTimeout(() => {
      districtHasDraggedRef.current = false;
    }, 60);
  };

  useEffect(() => {
    const el = districtScrollRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        if (districtAnimRef.current) cancelAnimationFrame(districtAnimRef.current);

        const distance = e.deltaY * 1.25;
        const startPos = el.scrollLeft;
        const maxScroll = el.scrollWidth - el.clientWidth;
        const targetPos = Math.max(0, Math.min(maxScroll, startPos + distance));
        const delta = targetPos - startPos;

        const duration = 280;
        const startTime = performance.now();
        const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);

        const step = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          el.scrollLeft = startPos + delta * easeOutQuad(progress);
          if (progress < 1) {
            districtAnimRef.current = requestAnimationFrame(step);
          } else {
            districtAnimRef.current = null;
            checkDistrictScrollBounds();
          }
        };
        districtAnimRef.current = requestAnimationFrame(step);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', checkDistrictScrollBounds);
    checkDistrictScrollBounds();

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', checkDistrictScrollBounds);
    };
  }, []);

  // Live Meteorological Weather Telemetry
  const [weather, setWeather] = useState({
    temp: 29,
    weatherDesc: 'มีเมฆบางส่วน',
    rainProbabilityToday: 60,
    rainSumToday: 8.5,
    peakHour: '16:00 น.'
  });

  // Continuous 24/7 Live Weather & Temperature Telemetry (Auto-refreshed every 45 seconds)
  useEffect(() => {
    let isMounted = true;
    const syncContinuousWeather = async () => {
      try {
        const w = await getLiveSamutPrakanWeather(true);
        if (isMounted && w) {
          setWeather(w);
        }
      } catch (err) {
        console.warn("Live weather sync error in App:", err);
      }
    };

    syncContinuousWeather();
    const interval = setInterval(syncContinuousWeather, 5 * 60 * 1000); // อัปเดตสภาพอากาศสดทุก 5 นาที (300 วินาที)
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Welcome Announcement Modal (เปิดเป็นค่าเริ่มต้น เพื่อแสดงข้อความต้อนรับและอธิบายคร่าวๆ)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);

  // GPS User Location
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);

  // Identify which district the user is currently located in strictly based on GeoJSON polygon boundaries
  const userDistrict = useMemo(() => {
    if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
      return null;
    }
    // 1. Ray-casting check against exact 6-district GeoJSON polygon boundaries on map
    const boundaryDistrict = detectDistrictForCoordinates(userLocation.lat, userLocation.lng);
    return boundaryDistrict || null;
  }, [userLocation]);

  // Modals state
  const [isOfficialModalOpen, setIsOfficialModalOpen] = useState(false);
  const [isStandardsModalOpen, setIsStandardsModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isPrivacyPolicyModalOpen, setIsPrivacyPolicyModalOpen] = useState(false);

  // Citizen Reports State (บันทึกเฉพาะรายงานจริงจากประชาชนเท่านั้น ไม่สร้างข้อมูลจำลอง)
  const [citizenReports, setCitizenReports] = useState(() => {
    try {
      const saved = localStorage.getItem('prakanguard_citizen_reports');
      const parsed = saved ? JSON.parse(saved) : null;
      let rawList = (Array.isArray(parsed) && parsed.length > 0) ? parsed : [];
      const cleaned = rawList.filter(r => 
        r && 
        r.id && 
        !r.id.includes('test') &&
        !r.id.includes('verify') &&
        !r.id.includes('seed') &&
        !r.id.startsWith('node-') &&
        !r.isAiGenerated && 
        !r.id?.startsWith('ai-alert-') &&
        typeof r.lat === 'number' &&
        !isNaN(r.lat) &&
        typeof r.lng === 'number' &&
        !isNaN(r.lng) &&
        isPointInSamutPrakan(r.lat, r.lng)
      );
      if (Array.isArray(INITIAL_CITIZEN_REPORTS) && INITIAL_CITIZEN_REPORTS.length > 0) {
        const idSet = new Set(cleaned.map(x => x.id));
        INITIAL_CITIZEN_REPORTS.forEach(initR => {
          if (!idSet.has(initR.id)) {
            cleaned.push(initR);
          }
        });
      }
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(cleaned));
      } catch (e) {}
      return cleaned;
    } catch (e) {
      return Array.isArray(INITIAL_CITIZEN_REPORTS) ? INITIAL_CITIZEN_REPORTS : [];
    }
  });

  const citizenReportsRef = useRef(citizenReports);
  useEffect(() => {
    citizenReportsRef.current = citizenReports;
  }, [citizenReports]);

  // Expose global lightbox opener for Leaflet map popup clicks
  useEffect(() => {
    window.__pgPhotos = window.__pgPhotos || {};
    window.pgOpenLightbox = (url, title, time) => {
      setLightboxPhoto({ url, title, time });
    };
    window.pgOpenLightboxById = (id) => {
      if (window.__pgPhotos && window.__pgPhotos[id]) {
        setLightboxPhoto(window.__pgPhotos[id]);
      } else {
        const found = pointsRef.current?.find(p => p.id === id) || citizenReportsRef.current?.find(c => c.id === id);
        const photo = found ? (found.photoUrl || found.photo_url || found.photo) : null;
        if (found && photo) {
          setLightboxPhoto({ 
            url: photo, 
            title: found.name, 
            time: found.reportedAt || found.updatedAt || found.time 
          });
        }
      }
    };
    return () => {
      delete window.pgOpenLightbox;
      delete window.pgOpenLightboxById;
    };
  }, []);

  // Citizen Report & Feedback Modal States
  const [feedbackItems, setFeedbackItems] = useState(() => {
    try {
      const saved = localStorage.getItem('prakanguard_feedback_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCitizenReportModalOpen, setIsCitizenReportModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isDetailMinimized, setIsDetailMinimized] = useState(false);
  const [isPickingLocationOnMap, setIsPickingLocationOnMap] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null);
  const [flyToLocation, setFlyToLocation] = useState(null);

  // Mobile Symbols Guide Modal State
  const [isMobileGuideOpen, setIsMobileGuideOpen] = useState(false);

  // Out of Province Banner State (Auto-dismisses in 5 seconds when website opens)
  const [showOutOfProvinceBanner, setShowOutOfProvinceBanner] = useState(false);

  // Auto-hide out of province banner after 5 seconds when website opens/locates
  useEffect(() => {
    if (userLocation && !userDistrict) {
      setShowOutOfProvinceBanner(true);
      const timer = setTimeout(() => {
        setShowOutOfProvinceBanner(false);
      }, 5000); // หายไปหลังจาก 5 วินาที ตามที่ผู้ใช้ระบุ
      return () => clearTimeout(timer);
    } else {
      setShowOutOfProvinceBanner(false);
    }
  }, [userLocation, userDistrict]);

  // Admin Web Announcement Banner (GPS-gated: ONLY visible to users with GPS ON)
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pg_latest_saved_announcement') || 'null');
    } catch { return null; }
  });
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  const SUPABASE_URL_ANN = 'https://cnjufleeibbgmpvuvrpg.supabase.co';
  const SUPABASE_KEY_ANN = 'sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw';
  const LS_ANN_DISMISSED = 'pg_dismissed_announcements_v2';
  const lsAnnDismissed = () => { try { return new Set(JSON.parse(localStorage.getItem(LS_ANN_DISMISSED) || '[]')); } catch { return new Set(); } };
  const lsAnnAddDismiss = (id) => { try { const s = lsAnnDismissed(); s.add(id); localStorage.setItem(LS_ANN_DISMISSED, JSON.stringify([...s])); } catch {} };

  const checkAnnouncements = React.useCallback(() => {
    const userDistrictName = userDistrict
      ? userDistrict.replace(/^อ\./, '').replace(/^อำเภอ/, '').replace('เมืองสมุทรปราการ', 'เมือง').trim()
      : null;

    const trySupabase = async () => {
      try {
        const r = await fetch(`${SUPABASE_URL_ANN}/rest/v1/announcements?select=*&is_active=eq.true&order=created_at.desc&limit=5`, {
          headers: { apikey: SUPABASE_KEY_ANN, Authorization: `Bearer ${SUPABASE_KEY_ANN}` }
        });
        if (!r.ok) return null;
        return await r.json();
      } catch { return null; }
    };

    const readLocalAnn = () => {
      try { return JSON.parse(localStorage.getItem('pg_admin_announcements_v2') || '[]'); } catch { return []; }
    };

    (async () => {
      let anns = await trySupabase();
      if (!Array.isArray(anns) || anns.length === 0) anns = readLocalAnn();

      const dismissed = lsAnnDismissed();
      const activeAnns = Array.isArray(anns) ? anns.filter(a => a && a.is_active !== false) : [];

      if (activeAnns.length === 0) {
        setLatestAnnouncement(null);
        setActiveAnnouncement(null);
        setShowAnnouncementBanner(false);
        try { localStorage.removeItem('pg_latest_saved_announcement'); } catch {}
        return;
      }

      const ann = activeAnns.find(a => {
        const isAll = a.target_type === 'all' || !a.districts || a.districts.length === 0;
        if (isAll) return true;
        if (!userDistrictName) return false;
        return a.districts.some(d => {
          const dn = String(d).replace(/^อ\./, '').replace(/^อำเภอ/, '').replace('เมืองสมุทรปราการ', 'เมือง').trim();
          const un = userDistrictName.replace('เมืองสมุทรปราการ', 'เมือง').trim();
          return dn === un || dn.includes(un) || un.includes(dn);
        });
      });

      if (ann) {
        setLatestAnnouncement(ann);
        try { localStorage.setItem('pg_latest_saved_announcement', JSON.stringify(ann)); } catch {}

        if (!dismissed.has(ann.id)) {
          setActiveAnnouncement(ann);
          setShowAnnouncementBanner(true);
        } else {
          setShowAnnouncementBanner(false);
        }
      } else {
        setLatestAnnouncement(null);
        setActiveAnnouncement(null);
        setShowAnnouncementBanner(false);
        try { localStorage.removeItem('pg_latest_saved_announcement'); } catch {}
      }
    })();
  }, [userDistrict]);

  useEffect(() => {
    checkAnnouncements();
    const annInterval = setInterval(checkAnnouncements, 45000); // check every 45s

    // Real-time synchronization listeners with Admin Dashboard
    const handleLiveAnnouncementUpdate = (e) => {
      const ann = e.detail;
      if (ann && ann.is_active !== false) {
        setLatestAnnouncement(ann);
        setActiveAnnouncement(ann);
        setShowAnnouncementBanner(true);
        try { localStorage.setItem('pg_latest_saved_announcement', JSON.stringify(ann)); } catch {}
      }
    };

    const handleLiveAnnouncementCancel = () => {
      setLatestAnnouncement(null);
      setActiveAnnouncement(null);
      setShowAnnouncementBanner(false);
      setIsAnnouncementModalOpen(false);
      try { localStorage.removeItem('pg_latest_saved_announcement'); } catch {}
    };

    window.addEventListener('pg_announcement_updated', handleLiveAnnouncementUpdate);
    window.addEventListener('pg_announcement_cancelled', handleLiveAnnouncementCancel);

    return () => {
      clearInterval(annInterval);
      window.removeEventListener('pg_announcement_updated', handleLiveAnnouncementUpdate);
      window.removeEventListener('pg_announcement_cancelled', handleLiveAnnouncementCancel);
    };
  }, [checkAnnouncements]);

  // Auto-dismiss Admin Web Announcement Banner within 10 seconds (ตามคำขอผู้ใช้ ไม่ให้บังหน้าจอ)
  // และบันทึกว่าแสดงไปแล้ว 1 รอบ จะไม่เด้งขึ้นมาซ้ำอีก
  useEffect(() => {
    if (showAnnouncementBanner && activeAnnouncement) {
      const timer = setTimeout(() => {
        lsAnnAddDismiss(activeAnnouncement.id);
        setShowAnnouncementBanner(false);
      }, 10000); // 10 วินาทีตามที่ผู้ใช้ระบุ
      return () => clearTimeout(timer);
    }
  }, [showAnnouncementBanner, activeAnnouncement]);

  // 5-Minute Auto-Refresh Countdown State (Synchronized to global wall-clock epoch)
  // Ensures countdown continues seamlessly across F5, mobile reloads, and synchronizes all devices simultaneously
  const getGlobalRefreshCountdown = () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const rem = 300 - (nowSec % 300);
    return rem === 0 ? 300 : rem;
  };
  const [refreshCountdown, setRefreshCountdown] = useState(() => getGlobalRefreshCountdown());
  const lastRefreshCycleRef = useRef(Math.floor(Date.now() / (300 * 1000)));

  // Admin Management & Live Verification Notification States
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('prakanguard_admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [latestUpdateNotification, setLatestUpdateNotification] = useState(null);
  const [adminAlertToast, setAdminAlertToast] = useState(null);

  // Secret Admin Access via URL hash (#admin) or keyboard shortcut (Ctrl+Shift+A / Alt+A)
  useEffect(() => {
    const checkHash = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#admin') {
        setIsAdminModalOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) || (e.altKey && (e.key === 'A' || e.key === 'a'))) {
        e.preventDefault();
        setIsAdminModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Mobile Draggable Floating Legend State (เคลื่อนย้ายได้อิสระ ไม่บังแผนที่)
  const [mobileLegendPos, setMobileLegendPos] = useState({ x: null, y: null });
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false); // เปิดเกณฑ์น้ำท่วมค้างไว้ทุกอุปกรณ์
  const legendDragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    elemStartX: 0,
    elemStartY: 0,
    hasMoved: false,
    width: 124,
    height: 160
  });
  const legendNodeRef = useRef(null);

  const handleLegendPointerDown = (e) => {
    // Only primary button (left mouse) or touch
    if (e.button && e.button !== 0) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = legendNodeRef.current ? legendNodeRef.current.getBoundingClientRect() : { left: clientX, top: clientY, width: 124, height: 160 };

    legendDragRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      elemStartX: rect.left,
      elemStartY: rect.top,
      hasMoved: false,
      width: rect.width || 124,
      height: rect.height || 160
    };

    const handlePointerMove = (moveEvt) => {
      if (!legendDragRef.current.isDragging) return;
      const curX = moveEvt.touches ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const curY = moveEvt.touches ? moveEvt.touches[0].clientY : moveEvt.clientY;

      const deltaX = curX - legendDragRef.current.startX;
      const deltaY = curY - legendDragRef.current.startY;

      if (!legendDragRef.current.hasMoved && Math.hypot(deltaX, deltaY) > 5) {
        legendDragRef.current.hasMoved = true;
      }

      if (legendDragRef.current.hasMoved) {
        if (moveEvt.cancelable) moveEvt.preventDefault();
        const elemWidth = legendDragRef.current.width;
        const elemHeight = legendDragRef.current.height;

        const nextX = Math.max(8, Math.min(window.innerWidth - elemWidth - 8, legendDragRef.current.elemStartX + deltaX));
        const nextY = Math.max(56, Math.min(window.innerHeight - elemHeight - 65, legendDragRef.current.elemStartY + deltaY));

        setMobileLegendPos({ x: nextX, y: nextY });
      }
    };

    const handlePointerUp = () => {
      legendDragRef.current.isDragging = false;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
  };



  // Flood Status Signature & Deduplicated Notification Ref (เตือนเพียงครั้งเดียวต่อการเปลี่ยนสถานะ)
  const lastFloodSignatureRef = useRef(null);

  useEffect(() => {
    try {
      lastFloodSignatureRef.current = localStorage.getItem('prakanguard_last_flood_sig') || null;
    } catch (e) {}
  }, []);

  // ฟังก์ชันแจ้งเตือนเฉพาะเมื่อสถานะน้ำท่วมมีการเปลี่ยนแปลงจริง (แห้งไปท่วม, ท่วมไปแห้ง, หรือลด)
  const notifyOnFloodStateChange = (message, signature) => {
    if (!message || !signature) return;

    const storedSig = (() => {
      try {
        return localStorage.getItem('prakanguard_last_flood_sig');
      } catch (e) {
        return null;
      }
    })();

    const lastSig = lastFloodSignatureRef.current || storedSig;

    // หากสถานะยังเหมือนเดิม ไม่มีการเปลี่ยนแปลง ไม่ต้องแจ้งเตือนซ้ำ
    if (lastSig === signature) {
      return;
    }

    lastFloodSignatureRef.current = signature;
    try {
      localStorage.setItem('prakanguard_last_flood_sig', signature);
    } catch (e) {}

    setLatestUpdateNotification(message);
    playNotificationChime();
    setTimeout(() => {
      setLatestUpdateNotification(prev => (prev === message ? null : prev));
    }, 8000);
  };

  // 24/7 Official Hydro-Meteorological Telemetry Sync (TMD, Navy Hydrographic Dept, DDPM)
  const [telemetrySyncStatus, setTelemetrySyncStatus] = useState({
    isActive: true,
    lastSyncTime: 'พร้อมทำงาน',
    isSyncing: false,
    alertBadge: '🟢 เฝ้าระวังปกติ (24 ชม.)'
  });

  // Manual Trigger to refresh official telemetry & run 24-hr lifecycle check
  const handleManualSync = async () => {
    setTelemetrySyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const { telemetryReport, weather: freshWeather, lifecycleResult } = await runOfficial24HourSync(
        pointsRef.current,
        citizenReportsRef.current
      );
      if (freshWeather) setWeather(freshWeather);
      const nowTime = telemetryReport.syncTime;
      setLastUpdatedTime(nowTime);

      if (lifecycleResult) {
        if (lifecycleResult.updatedPoints) {
          setPoints(lifecycleResult.updatedPoints);
        }
        if (lifecycleResult.updatedReports) {
          setCitizenReports(lifecycleResult.updatedReports);
          try {
            localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(lifecycleResult.updatedReports));
          } catch (e) {}
        }
        
        const storedSig = (() => {
          try {
            return localStorage.getItem('prakanguard_last_flood_sig');
          } catch (e) {
            return null;
          }
        })();
        const lastSig = lastFloodSignatureRef.current || storedSig;

        if (lifecycleResult.notificationMessage && lifecycleResult.statusSignature && lastSig !== lifecycleResult.statusSignature) {
          notifyOnFloodStateChange(lifecycleResult.notificationMessage, lifecycleResult.statusSignature);
        } else {
          setLatestUpdateNotification(`📡 ซิงก์ข้อมูลโทรมาตร TMD / กองทัพเรือ สำเร็จ (${nowTime})`);
          setTimeout(() => setLatestUpdateNotification(null), 5000);
        }

        if (lifecycleResult.changelogEntry) {
          setChangelog(prev => {
            const updated = [lifecycleResult.changelogEntry, ...prev.filter(x => x.id !== lifecycleResult.changelogEntry.id)].slice(0, 30);
            try {
              localStorage.setItem('prakanguard_24h_changelog', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }

        // บันทึกลงในอัปเดตสถานการณ์น้ำรายวัน (เฉพาะจุดที่เปลี่ยนจริง 1 เวลาต่อ 1 ครั้ง)
        if (lifecycleResult.newlyClearedPoints && lifecycleResult.newlyClearedPoints.length > 0) {
          lifecycleResult.newlyClearedPoints.forEach(p => {
            setDailyUpdates(prev => mergeDailyUpdateEvent(prev, {
              id: `upd_clear_${p.id}_${Date.now()}`,
              locationKey: p.id,
              locationName: p.name,
              district: p.district,
              statusType: 'dry',
              statusLabel: 'แห้งแล้ว',
              depthCm: 0,
              itemTime: formatBangkokTime(),
              source: p.agency || 'โทรมาตรทางการ',
              lat: p.lat,
              lng: p.lng,
              rawPoint: p
            }));
          });
        }

        if (lifecycleResult.newlyActivatedPoints && lifecycleResult.newlyActivatedPoints.length > 0) {
          lifecycleResult.newlyActivatedPoints.forEach(p => {
            setDailyUpdates(prev => mergeDailyUpdateEvent(prev, {
              id: `upd_act_${p.id}_${Date.now()}`,
              locationKey: p.id,
              locationName: p.name,
              district: p.district,
              statusType: 'rising',
              statusLabel: 'เริ่มท่วมแล้ว',
              depthCm: p.depthCm || 15,
              itemTime: formatBangkokTime(),
              source: p.agency || 'โทรมาตรทางการ',
              lat: p.lat,
              lng: p.lng,
              rawPoint: p
            }));
          });
        }

        if (lifecycleResult.newlyFallingPoints && lifecycleResult.newlyFallingPoints.length > 0) {
          lifecycleResult.newlyFallingPoints.forEach(p => {
            setDailyUpdates(prev => mergeDailyUpdateEvent(prev, {
              id: `upd_fall_${p.id}_${Date.now()}`,
              locationKey: p.id,
              locationName: p.name,
              district: p.district,
              statusType: 'receding',
              statusLabel: 'น้ำลดแล้ว',
              depthCm: p.depthCm || 12,
              itemTime: formatBangkokTime(),
              source: 'กรมชลประทาน & โทรมาตร',
              lat: p.lat,
              lng: p.lng,
              rawPoint: p
            }));
          });
        }
      }

      setTelemetrySyncStatus({
        isActive: true,
        lastSyncTime: nowTime,
        isSyncing: false,
        alertBadge: telemetryReport.alertBadge
      });
    } catch (e) {
      console.warn("Telemetry manual sync error:", e);
      setTelemetrySyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  // Run 24-Hour Autonomous Telemetry & Dynamic Flood Point Lifecycle Engine
  // ตรวจสอบสภาพอากาศ จุดเสี่ยงน้ำท่วม และน้ำทะเลหนุนตลอด 24 ชั่วโมง อัตโนมัติทุก 60 วินาที
  useEffect(() => {
    let isMounted = true;
    const executeBackgroundSync = async () => {
      if (!isMounted) return;
      try {
        const { telemetryReport, weather: freshWeather, lifecycleResult } = await runOfficial24HourSync(
          pointsRef.current,
          citizenReportsRef.current
        );
        if (!isMounted) return;
        if (freshWeather) setWeather(freshWeather);
        if (lifecycleResult) {
          const storedSig = (() => {
            try {
              return localStorage.getItem('prakanguard_last_flood_sig');
            } catch (e) {
              return null;
            }
          })();
          const lastSig = lastFloodSignatureRef.current || storedSig;
          const hasStateChange = lifecycleResult.statusSignature && lastSig !== lifecycleResult.statusSignature;

          if (!lastSig) {
            // First run on page load: record initial signature, update points quietly without spamming
            lastFloodSignatureRef.current = lifecycleResult.statusSignature;
            try {
              localStorage.setItem('prakanguard_last_flood_sig', lifecycleResult.statusSignature);
            } catch (e) {}
            if (lifecycleResult.updatedPoints) setPoints(lifecycleResult.updatedPoints);
            if (lifecycleResult.updatedReports) setCitizenReports(lifecycleResult.updatedReports);
          } else {
            // ทุกๆ 1 นาที: อัปเดตเวลาล่าสุดบนทุกอุปกรณ์อัตโนมัติ
            const nowTime = telemetryReport?.syncTime || formatBangkokTime();
            setLastUpdatedTime(nowTime);
            if (telemetryReport?.syncTimeDetailed) {
              setLastUpdatedTimeDetailed(telemetryReport.syncTimeDetailed);
            }
          }

          if (hasStateChange) {
            // มีการเปลี่ยนแปลงจริงของสถานการณ์น้ำท่วม (จุดท่วมใหม่ หรือน้ำแห้งคลี่คลาย)
            const nowTime = telemetryReport.syncTime || formatBangkokTime();
            setLastUpdatedTime(nowTime);

            if (lifecycleResult.updatedPoints) {
              setPoints(lifecycleResult.updatedPoints);
            }
            if (lifecycleResult.updatedReports) {
              setCitizenReports(lifecycleResult.updatedReports);
              try {
                localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(lifecycleResult.updatedReports));
              } catch (e) {}
            }

            // ทำงานอย่างเงียบๆ: อัปเดตเฉพาะจุดบนแผนที่ (จุดท่วมเพิ่ม/จุดแห้งลด) โดยไม่เด้งป็อบอัพรบกวนหน้าจอ
            lastFloodSignatureRef.current = lifecycleResult.statusSignature;
            try {
              localStorage.setItem('prakanguard_last_flood_sig', lifecycleResult.statusSignature);
            } catch (e) {}

            if (lifecycleResult.changelogEntry) {
              setChangelog(prev => {
                const updated = [lifecycleResult.changelogEntry, ...prev.filter(x => x.id !== lifecycleResult.changelogEntry.id)].slice(0, 30);
                try {
                  localStorage.setItem('prakanguard_24h_changelog', JSON.stringify(updated));
                } catch (e) {}
                return updated;
              });
            }

            // บันทึกลงในอัปเดตสถานการณ์น้ำรายวัน (เฉพาะจุดที่เปลี่ยนจริง 1 เวลาต่อ 1 ครั้ง)
            if (lifecycleResult.newlyClearedPoints && lifecycleResult.newlyClearedPoints.length > 0) {
              lifecycleResult.newlyClearedPoints.forEach(p => {
                setDailyUpdates(prev => mergeDailyUpdateEvent(prev, {
                  id: `upd_clear_${p.id}_${Date.now()}`,
                  locationKey: p.id,
                  locationName: p.name,
                  district: p.district,
                  statusType: 'dry',
                  statusLabel: 'แห้งแล้ว',
                  depthCm: 0,
                  itemTime: formatBangkokTime(),
                  source: p.agency || 'โทรมาตรทางการ',
                  lat: p.lat,
                  lng: p.lng,
                  rawPoint: p
                }));
              });
            }

            if (lifecycleResult.newlyActivatedPoints && lifecycleResult.newlyActivatedPoints.length > 0) {
              lifecycleResult.newlyActivatedPoints.forEach(p => {
                setDailyUpdates(prev => mergeDailyUpdateEvent(prev, {
                  id: `upd_act_${p.id}_${Date.now()}`,
                  locationKey: p.id,
                  locationName: p.name,
                  district: p.district,
                  statusType: 'rising',
                  statusLabel: 'เริ่มท่วมแล้ว',
                  depthCm: p.depthCm || 15,
                  itemTime: formatBangkokTime(),
                  source: p.agency || 'โทรมาตรทางการ',
                  lat: p.lat,
                  lng: p.lng,
                  rawPoint: p
                }));
              });
            }

            if (lifecycleResult.newlyFallingPoints && lifecycleResult.newlyFallingPoints.length > 0) {
              lifecycleResult.newlyFallingPoints.forEach(p => {
                setDailyUpdates(prev => mergeDailyUpdateEvent(prev, {
                  id: `upd_fall_${p.id}_${Date.now()}`,
                  locationKey: p.id,
                  locationName: p.name,
                  district: p.district,
                  statusType: 'receding',
                  statusLabel: 'น้ำลดแล้ว',
                  depthCm: p.depthCm || 12,
                  itemTime: formatBangkokTime(),
                  source: 'กรมชลประทาน & โทรมาตร',
                  lat: p.lat,
                  lng: p.lng,
                  rawPoint: p
                }));
              });
            }

            // ซิงก์จุดที่น้ำแห้งแล้วเข้า Supabase ทันที เพื่อนำออกจากแผนที่ทุกเครื่อง
            if (lifecycleResult.newlyClearedPoints && lifecycleResult.newlyClearedPoints.length > 0) {
              lifecycleResult.newlyClearedPoints.forEach(p => {
                if (p.id && (p.id.startsWith('citizen') || p.id.startsWith('c_'))) {
                  fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${encodeURIComponent(p.id)}`, {
                    method: 'PATCH',
                    headers: {
                      'apikey': SUPABASE_KEY,
                      'Authorization': `Bearer ${SUPABASE_KEY}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ is_resolved: true })
                  }).catch(() => {});
                }
              });
            }
          }
        }

        setTelemetrySyncStatus({
          isActive: true,
          lastSyncTime: telemetryReport.syncTime,
          isSyncing: false,
          alertBadge: telemetryReport.alertBadge
        });
      } catch (err) {
        console.warn("24h telemetry background sync error:", err);
      }
    };

    // รีเฟรชเพื่ออัปเดตจุดน้ำท่วมและข้อมูลโทรมาตรอัตโนมัติทุกๆ 5 นาที (300 วินาที) บนทุกอุปกรณ์
    const FIVE_MINUTES_INTERVAL = 5 * 60 * 1000;
    executeBackgroundSync();
    const interval = setInterval(executeBackgroundSync, FIVE_MINUTES_INTERVAL);

    // ซิงก์ทันทีเมื่อผู้ใช้สลับกลับมาที่หน้าแท็บ หรือเมื่ออินเทอร์เน็ตกลับมาเชื่อมต่อ
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        executeBackgroundSync();
      }
    };
    const handleOnline = () => {
      executeBackgroundSync();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Real-time Cloud Cross-Device Synchronization (Crowdsource Flood/Hail Reports & Feedback)
  useEffect(() => {
    const getReportingDistrict = () => {
      if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
        return 'ปิด GPS';
      }
      const detected = detectDistrictForCoordinates(userLocation.lat, userLocation.lng);
      if (!detected) {
        return 'ไม่ได้อยู่สมุทรปราการ';
      }
      return detected.replace(/^อ\./, '').replace(/^อำเภอ/, '').replace('เมืองสมุทรปราการ', 'เมือง');
    };

    const getActiveSection = () => {
      // Strictly one of 4 admin-recognized pages
      if (window.__prakanguard_is_chat_open) return 'AI CHATBOT';
      if (isFeedbackModalOpen) return 'ข้อเสนอแนะ';
      if (isCitizenReportModalOpen) return 'รายงานน้ำท่วม';
      return 'PrakanGuard | ระบบสารสนเทศและเฝ้าระวังอุทกภัย จ.สมุทรปราการ';
    };

    sendVisitorTelemetry(getReportingDistrict(), getDetailedDeviceInfo(), getActiveSection());
    const telemetryInterval = setInterval(() => {
      sendVisitorTelemetry(getReportingDistrict(), getDetailedDeviceInfo(), getActiveSection());
    }, 15000);



    const pullCloudUpdates = () => {
      // 1. Pull recent reports from Cloud — อัปเดตทั้ง NEW และ EXISTING (เช่น เมื่อ admin อนุมัติ)
      fetchRecentCloudReports().then(cloudReports => {
        if (Array.isArray(cloudReports) && cloudReports.length > 0) {
          setCitizenReports(prev => {
            const prevMap = new Map(prev.map(r => [r.id, r]));
            let changed = false;

            cloudReports.forEach(cr => {
              if (!isValidReport(cr) || !isPointInSamutPrakan(cr.lat, cr.lng)) return;
              const existing = prevMap.get(cr.id);
              if (!existing) {
                // รายการใหม่
                prevMap.set(cr.id, cr);
                changed = true;
              } else {
                // รายการมีอยู่แล้ว — ตรวจว่า cloud version ใหม่กว่า หรือสถานะเปลี่ยน
                const cloudNewer = (cr.timestamp || 0) > (existing.timestamp || 0);
                const statusChanged = (cr.isApproved !== existing.isApproved) || (cr.isResolved !== existing.isResolved);
                if (cloudNewer || statusChanged) {
                  const photoToKeep = cr.photoUrl || existing.photoUrl || existing.photo_url || null;
                  prevMap.set(cr.id, { ...existing, ...cr, photoUrl: photoToKeep });
                  changed = true;
                }
              }
            });

            if (!changed) return prev;
            const merged = Array.from(prevMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            try {
              localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });

          // ซิงก์ประวัติอัปเดตสถานการณ์น้ำรายวันข้ามทุกอุปกรณ์ ไม่ล้างประราวดังกล่าวจนกว่าจะเที่ยงคืน
          cloudReports.forEach(cr => {
            if (cr.isApproved && isValidReport(cr)) {
              setDailyUpdates(prev => mergeDailyUpdateEvent(prev, {
                id: `upd_report_${cr.id}`,
                locationKey: cr.id,
                locationName: cr.name,
                district: cr.district,
                subdistrict: cr.subdistrict || '',
                statusType: cr.isResolved ? 'dry' : 'rising',
                statusLabel: cr.isResolved ? 'แห้งแล้ว' : 'เริ่มท่วมแล้ว',
                depthCm: cr.depthCm || (cr.level === 3 ? 55 : cr.level === 2 ? 30 : 15),
                itemTime: cr.reportedAt || formatBangkokTime(new Date(cr.timestamp || Date.now())),
                timestamp: cr.timestamp || Date.now(),
                source: cr.source || 'รายงานจากประชาชน',
                lat: cr.lat,
                lng: cr.lng,
                rawPoint: cr,
                photoUrl: cr.photoUrl || cr.photo_url || cr.photo || null
              }));
            }
          });
        }
      });


      // 2. Pull recent feedback from Cloud
      fetchRecentCloudFeedback().then(cloudFeedback => {
        if (Array.isArray(cloudFeedback) && cloudFeedback.length > 0) {
          setFeedbackItems(prev => {
            const existingIds = new Set(prev.map(f => f.id));
            const newItems = cloudFeedback.filter(cf => isValidFeedback(cf) && !existingIds.has(cf.id));
            if (newItems.length === 0) return prev;
            const merged = [...newItems, ...prev];
            try {
              localStorage.setItem('prakanguard_feedback_items', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      });
    };

    pullCloudUpdates();
    const cloudSyncInterval = setInterval(pullCloudUpdates, 15000); // อัปเดตจาก Cloud ทุก 15 วินาที

    // 3. Real-time Live EventSource Listener across all devices
    const unsubscribe = subscribeToCloudEvents({
      onNewReport: (incomingReport) => {
        if (!isValidReport(incomingReport) || !isPointInSamutPrakan(incomingReport.lat, incomingReport.lng)) return;
        setCitizenReports(prev => {
          if (prev.some(r => r.id === incomingReport.id)) return prev;
          const updated = [incomingReport, ...prev];
          try {
            localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        // Trigger alert toast for admin (strictly visible ONLY if logged in as Admin)
        if (!incomingReport.isApproved && isAdminAuthenticated) {
          const isHail = incomingReport.hazardType === 'hail';
          const depthText = incomingReport.depthCm ? `${incomingReport.depthCm} ซม.` : (incomingReport.depthRange || '');
          const bodyPart = incomingReport.bodyLevelLabel || incomingReport.bodyPart || '';
          const resolvedLevel = isHail 
            ? `🧊 ${incomingReport.hailSizeLabel || 'ลูกเห็บตก'}` 
            : `${bodyPart ? `${bodyPart} ` : ''}${depthText ? `(${depthText})` : ''}`.trim() || 'รอตรวจสอบ';
          setAdminAlertToast({
            id: incomingReport.id,
            name: incomingReport.name,
            levelLabel: resolvedLevel,
            district: incomingReport.district,
            time: incomingReport.reportedAt || 'เมื่อสักครู่'
          });
          playNotificationChime();
        }
      },
      onNewFeedback: (incomingFeedback) => {
        if (!isValidFeedback(incomingFeedback)) return;
        setFeedbackItems(prev => {
          if (prev.some(f => f.id === incomingFeedback.id)) return prev;
          const updated = [incomingFeedback, ...prev];
          try {
            localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        window.dispatchEvent(new CustomEvent('prakanguard_feedback_updated', { detail: incomingFeedback }));
      },
      onAdminAction: (action) => {
        if (action.type === 'approve') {
          handleApproveReport(action.id, false);
        } else if (action.type === 'resolve') {
          handleResolveReport(action.id, false);
        } else if (action.type === 'reject') {
          handleRejectReport(action.id, false);
        } else if (action.type === 'ADD_POINT' && action.point) {
          setPoints(prev => [action.point, ...prev.filter(p => p.id !== action.point.id)]);
        } else if (action.type === 'UPDATE_POINT' && action.pointId) {
          setPoints(prev => prev.map(p => p.id === action.pointId ? { ...p, ...action.updatedFields } : p));
        } else if (action.type === 'DELETE_POINT' && action.pointId) {
          setPoints(prev => prev.filter(p => p.id !== action.pointId));
        }
      }
    });

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(cloudSyncInterval);
      unsubscribe();
    };
  }, []);

  // Public Live Situation Updates Modal & Live Refresh States (For Citizens)
  const [isPublicUpdatesModalOpen, setIsPublicUpdatesModalOpen] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(() => {
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.';
  });
  const [lastUpdatedTimeDetailed, setLastUpdatedTimeDetailed] = useState(() => {
    return new Intl.DateTimeFormat('th-TH', { 
      dateStyle: 'full', 
      timeStyle: 'medium', 
      timeZone: 'Asia/Bangkok' 
    }).format(new Date());
  });
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  // Public Refresh Handler (Syncs fresh live weather telemetry, evaluations, and reports)
  const handleRefreshData = async () => {
    setIsRefreshingData(true);
    try {
      const { telemetryReport, weather: freshWeather, lifecycleResult } = await runOfficial24HourSync(
        pointsRef.current,
        citizenReportsRef.current
      );
      if (freshWeather) setWeather(freshWeather);
      const nowTime = telemetryReport.syncTime;
      setLastUpdatedTime(nowTime);
      if (telemetryReport.syncTimeDetailed) {
        setLastUpdatedTimeDetailed(telemetryReport.syncTimeDetailed);
      }

      if (lifecycleResult) {
        if (lifecycleResult.updatedPoints) setPoints(lifecycleResult.updatedPoints);
        if (lifecycleResult.updatedReports) {
          setCitizenReports(lifecycleResult.updatedReports);
          try {
            localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(lifecycleResult.updatedReports));
          } catch (e) {}
        }
        const storedSig = (() => {
          try {
            return localStorage.getItem('prakanguard_last_flood_sig');
          } catch (e) {
            return null;
          }
        })();
        const lastSig = lastFloodSignatureRef.current || storedSig;

        if (lifecycleResult.notificationMessage && lifecycleResult.statusSignature && lastSig !== lifecycleResult.statusSignature) {
          notifyOnFloodStateChange(lifecycleResult.notificationMessage, lifecycleResult.statusSignature);
        } else {
          setLatestUpdateNotification(`🔄 ซิงก์ข้อมูลสภาพอากาศและสถานการณ์น้ำท่วมล่าสุดสำเร็จ (อัปเดตเมื่อ ${nowTime})`);
          setTimeout(() => setLatestUpdateNotification(null), 5000);
        }

        if (lifecycleResult.changelogEntry) {
          setChangelog(prev => {
            const updated = [lifecycleResult.changelogEntry, ...prev.filter(x => x.id !== lifecycleResult.changelogEntry.id)].slice(0, 30);
            try {
              localStorage.setItem('prakanguard_24h_changelog', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      }
    } catch (e) {
      console.warn("Weather sync error during refresh:", e);
    }
    setIsRefreshingData(false);
  };

  // 5-Minute Global Auto-Refresh Timer (Synchronized to wall-clock 5-min intervals)
  // Persists across F5 and mobile pull-to-refresh without resetting to 5:00, keeping all devices in sync
  useEffect(() => {
    const updateCountdown = () => {
      const nowMs = Date.now();
      const currentCycle = Math.floor(nowMs / (300 * 1000));
      const nowSec = Math.floor(nowMs / 1000);
      const remaining = 300 - (nowSec % 300);

      setRefreshCountdown(remaining === 0 ? 300 : remaining);

      // When the 5-minute cycle boundary is crossed globally, auto-refresh simultaneously
      if (currentCycle > lastRefreshCycleRef.current) {
        lastRefreshCycleRef.current = currentCycle;
        handleRefreshData();
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Cloud Cross-Device Synchronization Handler (Crowdsource Flood/Hail Reports & Feedback)
  const handleManualSyncCloudData = async () => {
    try {
      const { reports, feedback } = await syncCloudDataNow();
      let newReportsCount = 0;
      let newFeedbackCount = 0;

      if (Array.isArray(reports) && reports.length > 0) {
        setCitizenReports(prev => {
          const map = new Map(prev.map(r => [r.id, r]));
          reports.forEach(cr => {
            if (isValidReport(cr) && isPointInSamutPrakan(cr.lat, cr.lng)) {
              if (!map.has(cr.id)) newReportsCount++;
              const existing = map.get(cr.id);
              // preserve admin approval/resolution status if already acted upon locally
              map.set(cr.id, { ...cr, ...(existing ? { isApproved: existing.isApproved, isResolved: existing.isResolved } : {}) });
            }
          });
          const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          try {
            localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }

      if (Array.isArray(feedback) && feedback.length > 0) {
        setFeedbackItems(prev => {
          const map = new Map(prev.map(f => [f.id, f]));
          feedback.forEach(cf => {
            if (isValidFeedback(cf)) {
              if (!map.has(cf.id)) newFeedbackCount++;
              const existing = map.get(cf.id);
              map.set(cf.id, { ...cf, ...(existing ? { isRead: existing.isRead } : {}) });
            }
          });
          const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          try {
            localStorage.setItem('prakanguard_feedback_items', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }

      return {
        reportCount: reports.length,
        feedbackCount: feedback.length,
        newReportsCount,
        newFeedbackCount
      };
    } catch (err) {
      console.warn('[CloudSync] Manual sync error:', err);
      return null;
    }
  };

  // Auto-sync fresh data when Admin opens the Admin Panel
  useEffect(() => {
    if (isAdminModalOpen) {
      handleManualSyncCloudData();
    }
  }, [isAdminModalOpen]);

  // Periodic Background Polling for Cloud Updates (every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleManualSyncCloudData();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Handle Admin Direct Emergency Announcement
  const handleAddAdminBroadcast = (broadcast) => {
    setCitizenReports(prev => {
      const updated = [broadcast, ...prev];
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    // Do not set selectedPoint so the map is not blocked by a card
    setFlyToLocation({ lat: broadcast.lat, lng: broadcast.lng });
    setLastUpdatedTime(broadcast.reportedAt);
  };

  // Handle New Citizen Report Submission (Requires Admin Approval before showing on public map)
  const handleAddCitizenReport = (newReport) => {
    const reportToSave = {
      ...newReport,
      isApproved: false, // ต้องรอแอดมินตรวจสอบและกดอนุมัติเท่านั้นถึงจะขึ้นบนแผนที่จริง เพื่อป้องกันข้อมูลเท็จ
      isResolved: false,
      isActive: true,
      status: 'pending',
      statusChangedAt: newReport.reportedAt || (new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.')
    };

    setCitizenReports(prev => {
      const updated = [reportToSave, ...prev.filter(r => r.id !== reportToSave.id)];
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage quota exceeded", e);
      }
      return updated;
    });

    // Notify Cloud Supabase immediately
    publishCloudReport(reportToSave);
    playNotificationChime();

    // Notify the admin owner immediately (if admin is viewing)
    if (isAdminAuthenticated) {
      const isHail = reportToSave.hazardType === 'hail';
      const depthText = reportToSave.depthCm ? `${reportToSave.depthCm} ซม.` : (reportToSave.depthRange || '');
      const bodyPart = reportToSave.bodyLevelLabel || reportToSave.bodyPart || '';
      const resolvedLevel = isHail 
        ? `🧊 ${reportToSave.hailSizeLabel || 'ลูกเห็บตก'}` 
        : `${bodyPart ? `${bodyPart} ` : ''}${depthText ? `(${depthText})` : ''}`.trim() || 'รอตรวจสอบ';
      setAdminAlertToast({
        id: reportToSave.id,
        name: reportToSave.name,
        levelLabel: resolvedLevel,
        district: reportToSave.district,
        time: reportToSave.reportedAt
      });
    }

    setLatestUpdateNotification(`📍 ส่งรายงานจุดน้ำท่วม "${reportToSave.name}" เรียบร้อยแล้ว (รอแอดมินตรวจสอบและอนุมัติก่อนขึ้นแผนที่สาธารณะ) ขอบคุณครับ`);
    setTimeout(() => setLatestUpdateNotification(null), 7000);
  };

  // Handle Feedback Submission
  const handleFeedbackSubmitted = (newFeedback) => {
    setFeedbackItems(prev => {
      const updated = [newFeedback, ...prev.filter(f => f.id !== newFeedback.id)];
      try {
        localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    publishCloudFeedback(newFeedback);
    playNotificationChime();
    window.dispatchEvent(new CustomEvent('prakanguard_feedback_updated', { detail: newFeedback }));
  };

  // Feedback Management Handlers (Admin Only)
  const handleToggleFeedbackRead = (id) => {
    setFeedbackItems(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, isRead: !f.isRead } : f);
      try {
        localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleDeleteFeedback = (id) => {
    setFeedbackItems(prev => {
      const updated = prev.filter(f => f.id !== id);
      try {
        localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleMarkAllFeedbackRead = () => {
    setFeedbackItems(prev => {
      const updated = prev.map(f => ({ ...f, isRead: true }));
      try {
        localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearReadFeedback = () => {
    setFeedbackItems(prev => {
      const updated = prev.filter(f => !f.isRead);
      try {
        localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Edit Report (depth, notes, status)
  const handleUpdateReport = (reportId, updatedFields) => {
    setCitizenReports(prev => {
      const updated = prev.map(r => {
        if (r.id !== reportId) return r;
        const merged = { ...r, ...updatedFields };
        if (updatedFields.depthCm !== undefined) {
          const lvl = getFloodLevel(updatedFields.depthCm);
          merged.level = lvl;
          merged.depthRange = lvl === 3 ? '> 50 ซม.' : lvl === 2 ? '21 - 50 ซม.' : (updatedFields.depthCm > 0 ? '5 - 20 ซม.' : '0 ซม. (แห้งปกติ)');
        }
        return merged;
      });
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Admin Actions: Approve Report & Publish to Map
  // ข้อกำหนด: ไม่ต้องซูมเข้าไปในจุดที่อนุมัติ, ให้ขึ้นในอัปเดตแทน และขึ้นว่า "ประชาชนในพื้นที่แจ้งน้ำท่วม" (ไม่ขึ้นว่าแอดมินอนุมัติ)
  const handleApproveReport = (id, shouldBroadcast = true) => {
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    let approvedPoint = null;
    setCitizenReports(prev => {
      let found = false;
      const updated = prev.map(r => {
        if (r.id === id) {
          found = true;
          approvedPoint = { 
            ...r, 
            photoUrl: r.photoUrl || r.photo_url || r.photo || null,
            isApproved: true, 
            isResolved: false, 
            isActive: true, 
            approvedAt: timeStr, 
            statusChangedAt: timeStr,
            source: 'ประชาชนในพื้นที่แจ้งน้ำท่วม'
          };
          return approvedPoint;
        }
        return r;
      });
      if (!found) {
        fetchRecentCloudReports().then(cloudReports => {
          const remote = (cloudReports || []).find(c => c.id === id);
          if (remote) {
            const fresh = { 
              ...remote, 
              photoUrl: remote.photoUrl || remote.photo_url || remote.photo || null,
              isApproved: true, 
              isResolved: false, 
              isActive: true, 
              approvedAt: timeStr, 
              statusChangedAt: timeStr,
              source: 'ประชาชนในพื้นที่แจ้งน้ำท่วม'
            };
            setCitizenReports(curr => [fresh, ...curr.filter(x => x.id !== id)]);
          }
        });
      }
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setAdminAlertToast(null);
    setLastUpdatedTime(timeStr);
    if (approvedPoint) {
      // บันทึกการแจ้งเตือนลงในอัปเดตสถานการณ์น้ำรายวัน (ไม่ซูมแผนที่ เพื่อให้แผนที่อยู่นิ่ง)
      const newEvent = {
        id: `upd_citizen_${approvedPoint.id}_${Date.now()}`,
        locationKey: approvedPoint.id,
        locationName: approvedPoint.name || approvedPoint.locationName || 'ประชาชนในพื้นที่แจ้งน้ำท่วม',
        district: approvedPoint.district,
        subdistrict: approvedPoint.subdistrict,
        locationSub: `${approvedPoint.district || 'สมุทรปราการ'} ${approvedPoint.subdistrict ? '• ' + approvedPoint.subdistrict : ''}`,
        statusType: 'rising',
        statusLabel: 'เริ่มท่วมแล้ว',
        depthCm: approvedPoint.depthCm || 15,
        itemTime: timeStr,
        timestamp: Date.now(),
        source: 'ประชาชนในพื้นที่แจ้งน้ำท่วม',
        lat: approvedPoint.lat,
        lng: approvedPoint.lng,
        photoUrl: approvedPoint.photoUrl || null,
        rawPoint: approvedPoint
      };
      setDailyUpdates(prev => mergeDailyUpdateEvent(prev, newEvent));

      if (shouldBroadcast) {
        publishAdminAction({ type: 'approve', id });
      }
    }
  };

  // Admin Actions: Reject Report / Delete Announcement
  const handleRejectReport = (id, shouldBroadcast = true) => {
    setCitizenReports(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setAdminAlertToast(null);
    if (selectedPoint && selectedPoint.id === id) {
      setSelectedPoint(null);
    }
    if (shouldBroadcast) {
      publishAdminAction({ type: 'reject', id });
    }
  };

  // Filter pending reports for admin verification prompt
  const pendingCitizenReports = useMemo(() => {
    return citizenReports.filter(r => r.isApproved === false);
  }, [citizenReports]);

  // Admin Actions: Resolve Report (Water Drained)
  const handleResolveReport = (id, shouldBroadcast = true) => {
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    let resolvedItem = null;
    setCitizenReports(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          resolvedItem = { ...r, isResolved: true, isActive: false, depthCm: 0, statusLabel: 'สัญจรปกติ (น้ำแห้งแล้ว)', resolvedAt: timeStr, statusChangedAt: timeStr };
          return resolvedItem;
        }
        return r;
      });
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (!resolvedItem) {
      const p = points.find(pt => pt.id === id);
      if (p) resolvedItem = p;
    }

    if (resolvedItem) {
      const newEvent = {
        id: `upd_res_${id}_${Date.now()}`,
        locationKey: id,
        locationName: resolvedItem.name || 'จุดเสี่ยง',
        district: resolvedItem.district,
        subdistrict: resolvedItem.subdistrict,
        locationSub: `${resolvedItem.district || 'สมุทรปราการ'} ${resolvedItem.subdistrict ? '• ' + resolvedItem.subdistrict : ''}`,
        statusType: 'dry',
        statusLabel: 'แห้งแล้ว',
        depthCm: 0,
        itemTime: timeStr,
        timestamp: Date.now(),
        source: 'แอดมินยืนยันน้ำแห้ง',
        lat: resolvedItem.lat,
        lng: resolvedItem.lng,
        rawPoint: resolvedItem
      };
      setDailyUpdates(prev => mergeDailyUpdateEvent(prev, newEvent));
    }

    setLastUpdatedTime(timeStr);
    if (selectedPoint && selectedPoint.id === id) {
      setSelectedPoint(null);
    }
    if (shouldBroadcast) {
      publishAdminAction({ type: 'resolve', id });
    }
  };

  // Location Management Handlers (Continuous 6 Districts Telemetry)
  const handleAddPoint = (newPoint) => {
    setPoints(prev => {
      const filtered = prev.filter(p => p.id !== newPoint.id);
      const updated = [newPoint, ...filtered];
      try {
        localStorage.setItem('prakanguard_points_state_v7', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    publishAdminAction({
      type: 'ADD_POINT',
      point: newPoint,
      timestamp: Date.now()
    });
  };

  const handleUpdatePoint = (pointId, updatedFields) => {
    setPoints(prev => {
      const updated = prev.map(p => {
        if (p.id !== pointId) return p;
        const merged = { ...p, ...updatedFields };
        if (updatedFields.depthCm !== undefined) {
          const lvl = getFloodLevel(updatedFields.depthCm);
          merged.level = lvl;
          merged.depthRange = lvl === 3 ? '> 50 ซม.' : lvl === 2 ? '21 - 50 ซม.' : (updatedFields.depthCm > 0 ? '5 - 20 ซม.' : '0 ซม. (แห้งปกติ)');
          merged.isActive = updatedFields.depthCm > 0;
          merged.isResolved = updatedFields.depthCm === 0;
        }
        return merged;
      });
      try {
        localStorage.setItem('prakanguard_points_state_v7', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    publishAdminAction({
      type: 'UPDATE_POINT',
      pointId,
      updatedFields,
      timestamp: Date.now()
    });
  };

  const handleDeletePoint = (pointId) => {
    setPoints(prev => {
      const updated = prev.filter(p => p.id !== pointId);
      try {
        localStorage.setItem('prakanguard_points_state_v7', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    publishAdminAction({
      type: 'DELETE_POINT',
      pointId,
      timestamp: Date.now()
    });
  };

  const handleImportPoints = (pointsToImport) => {
    if (!Array.isArray(pointsToImport) || pointsToImport.length === 0) return;
    setPoints(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const existingNames = new Set(prev.map(p => p.name));
      const newItems = pointsToImport.filter(p => !existingIds.has(p.id) && !existingNames.has(p.name));
      const updated = [...newItems, ...prev];
      try {
        localStorage.setItem('prakanguard_points_state_v7', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    publishAdminAction({
      type: 'IMPORT_POINTS',
      count: pointsToImport.length,
      timestamp: Date.now()
    });
  };

  const handleResetPoints = () => {
    const defaultPoints = INITIAL_FLOOD_POINTS.map(p => {
      const lvl = getFloodLevel(p.depthCm);
      return {
        ...p,
        level: lvl,
        depthRange: lvl === 3 ? '> 50 ซม.' : lvl === 2 ? '21 - 50 ซม.' : (p.depthCm > 0 ? '5 - 20 ซม.' : '0 ซม. (แห้งปกติ)')
      };
    });
    setPoints(defaultPoints);
    try {
      localStorage.setItem('prakanguard_points_state_v7', JSON.stringify(defaultPoints));
    } catch (e) {}
  };

  // Map Picking Helpers with source routing ('citizen' or 'admin')
  const [pickSource, setPickSource] = useState('citizen');

  const handleStartPickOnMap = (source = 'citizen') => {
    setPickSource(source);
    if (source === 'admin') {
      setIsAdminModalOpen(false);
    } else {
      setIsCitizenReportModalOpen(false);
    }
    setIsPickingLocationOnMap(true);
  };

  const handleMapLocationPicked = (coords) => {
    if (!coords || !isPointInSamutPrakan(coords.lat, coords.lng)) {
      alert("พิกัดที่เลือกอยู่นอกเขตจังหวัดสมุทรปราการ กรุณาแตะเลือกจุดที่อยู่ภายใน 6 อำเภอของจังหวัดสมุทรปราการเท่านั้น");
      return;
    }
    setPickedCoords(coords);
    setIsPickingLocationOnMap(false);
    if (pickSource === 'admin') {
      setIsAdminModalOpen(true);
    } else {
      setIsCitizenReportModalOpen(true);
    }
  };

  const handleCancelPickOnMap = () => {
    setIsPickingLocationOnMap(false);
    if (pickSource === 'admin') {
      setIsAdminModalOpen(true);
    } else {
      setIsCitizenReportModalOpen(true);
    }
  };

  const handleFlyToCoords = (lat, lng, zoom = 16.5, pointId = null) => {
    setFlyToLocation({ lat, lng, zoom, pointId, ts: Date.now() });
  };

  const officialAdvisory = getOfficialAdvisorySummary(points);

  // ตรวจสอบจุดที่น้ำแห้งสนิทหรือไม่ท่วมแล้ว เพื่อนำออกจากแผนที่อัตโนมัติ
  const isPointDryOrResolved = (item) => {
    if (!item) return true;
    if (item.isActive === false || item.isResolved === true) return true;
    if (item.depthCm !== undefined && item.depthCm !== null && !isNaN(Number(item.depthCm)) && Number(item.depthCm) <= 0) return true;
    if (item.waterTrend === 'dry' || item.status === 'dry' || item.status === 'resolved' || item.isDry === true) return true;
    return false;
  };

  // Unified Severity Matching Helper (Seamlessly supports '1'/'minor', '2'/'moderate', '3'/'severe', 'falling')
  const matchesSeverityFilter = useCallback((item, filter) => {
    if (!filter || filter === 'all') return true;
    if (filter === 'falling') return isWaterReceding(item);
    const lvl = resolveLevel(item);
    if (filter === '1' || filter === 'minor') return lvl === 1;
    if (filter === '2' || filter === 'moderate') return lvl === 2;
    if (filter === '3' || filter === 'severe') return lvl === 3;
    return true;
  }, []);

  // 1. Official Points shown on Map (filtered by district & severity, excludes dried-up points)
  const mapPoints = useMemo(() => {
    return points.filter(point => {
      if (!point || typeof point.lat !== 'number' || typeof point.lng !== 'number') return false;
      if (!isPointInSamutPrakan(point.lat, point.lng)) return false;
      if (isPointDryOrResolved(point)) return false;
      const matchDistrict = selectedDistrict === "ทั้งหมด" || point.district === selectedDistrict;
      const matchSeverity = matchesSeverityFilter(point, severityFilter);
      return matchDistrict && matchSeverity;
    });
  }, [points, selectedDistrict, severityFilter, matchesSeverityFilter]);

  // 2. Citizen Reports shown on Map (requires explicit Admin Approval, excludes dried-up points)
  const mapCitizenReports = useMemo(() => {
    return citizenReports.filter(report => {
      if (!report || report.isApproved !== true || isPointDryOrResolved(report) || !isPointInSamutPrakan(report.lat, report.lng)) return false;
      if (report.id && (report.id.includes('test') || report.id.includes('verify') || report.id.startsWith('node-'))) return false;
      const matchDistrict = selectedDistrict === "ทั้งหมด" || report.district === selectedDistrict;
      const matchSeverity = matchesSeverityFilter(report, severityFilter);
      return matchDistrict && matchSeverity;
    });
  }, [citizenReports, selectedDistrict, severityFilter, matchesSeverityFilter]);

  // 2.5 Synchronized Severity Counts (100% matched to pins displayed on the map)
  const levelCounts = useMemo(() => {
    const activeOfficial = points.filter(p => !isPointDryOrResolved(p) && isPointInSamutPrakan(p.lat, p.lng) && (selectedDistrict === "ทั้งหมด" || p.district === selectedDistrict));
    const activeCitizen = citizenReports.filter(r => r.isApproved === true && !isPointDryOrResolved(r) && isPointInSamutPrakan(r.lat, r.lng) && (selectedDistrict === "ทั้งหมด" || r.district === selectedDistrict));

    const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640;
    const allDisplayPins = deduplicateAndDeclutterPoints(activeCitizen, activeOfficial, isMobileView);

    let minor = 0;
    let moderate = 0;
    let severe = 0;
    let falling = 0;

    allDisplayPins.forEach(p => {
      const lvl = resolveLevel(p);
      if (lvl === 3) severe++;
      else if (lvl === 2) moderate++;
      else minor++;

      if (isWaterReceding(p)) falling++;
    });

    return { minor, moderate, severe, falling };
  }, [points, citizenReports, selectedDistrict]);

  // 3. Search Results for Official Points (searches ALL districts and severities, excludes dry)
  const searchResultsOfficial = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return points
      .filter(point => {
        if (!point || !isPointInSamutPrakan(point.lat, point.lng) || isPointDryOrResolved(point)) return false;
        return matchesLocationSearch(point, searchQuery);
      })
      .sort((a, b) => scoreLocationSearch(b, searchQuery) - scoreLocationSearch(a, searchQuery));
  }, [points, searchQuery]);

  // 4. Search Results for Citizen Reports (searches ALL districts and severities, excludes dry)
  const searchResultsCitizen = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return citizenReports
      .filter(report => {
        if (!report || report.isApproved !== true || isPointDryOrResolved(report) || !isPointInSamutPrakan(report.lat, report.lng)) return false;
        if (report.id && (report.id.includes('test') || report.id.includes('verify') || report.id.startsWith('node-'))) return false;
        return matchesLocationSearch(report, searchQuery);
      })
      .sort((a, b) => scoreLocationSearch(b, searchQuery) - scoreLocationSearch(a, searchQuery));
  }, [citizenReports, searchQuery]);

  // 5. Unified Display Points for List Views & Mobile Sheet
  const displayPoints = useMemo(() => {
    if (searchQuery && searchQuery.trim()) {
      return [...searchResultsOfficial, ...searchResultsCitizen];
    }
    return [...mapPoints, ...mapCitizenReports];
  }, [searchQuery, searchResultsOfficial, searchResultsCitizen, mapPoints, mapCitizenReports]);

  // Unified Handler: Select location & zoom smoothly into that point on the map
  const handleSelectLocation = useCallback((location, options = {}) => {
    if (!location) {
      setSelectedPoint(null);
      return;
    }

    const fromMapPin = !!options?.fromMapPin;
    const pointWithMeta = fromMapPin ? { ...location, _fromMapPin: true } : location;

    // Only change filters and trigger camera flyTo when selected from SEARCH or list (NOT from map pin tap!)
    if (!fromMapPin) {
      if (selectedDistrict !== "ทั้งหมด" && location.district && selectedDistrict !== location.district) {
        setSelectedDistrict("ทั้งหมด");
      }
      if (severityFilter !== "all" && location.level && location.level.toString() !== severityFilter) {
        setSeverityFilter("all");
      }
      setFlyToLocation({
        lat: location.lat,
        lng: location.lng,
        zoom: 16.5,
        pointId: location.id,
        ts: Date.now()
      });
    }

    setSelectedPoint(pointWithMeta);
    setIsDetailMinimized(false);

    setIsSearchFocused(false);
    setSearchQuery("");
    setIsMobileSheetOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  }, [selectedDistrict, severityFilter]);

  // Dedicated selection handler for popular search suggestion items
  const handleSelectPopularSuggestion = (item) => {
    let match = points.find(p => p.id === item.pointId);
    if (!match) {
      match = INITIAL_FLOOD_POINTS.find(p => p.id === item.pointId);
    }
    if (!match) {
      match = points.find(p => matchesLocationSearch(p, item.query)) ||
              citizenReports.find(cr => matchesLocationSearch(cr, item.query));
    }
    if (!match) {
      match = {
        id: item.pointId || `suggest-${Date.now()}`,
        name: item.label,
        district: item.district,
        lat: item.lat,
        lng: item.lng,
        statusLabel: "จุดเฝ้าระวังซ้ำซาก",
        depthRange: "21 - 50 ซม.",
        depthCm: 25,
        level: 2
      };
    }
    handleSelectLocation(match);
  };

  // Count pending unapproved reports for Admin
  const pendingReportsCount = useMemo(() => {
    return citizenReports.filter(r => r.isApproved === false).length;
  }, [citizenReports]);

  // Nearest flood hotspot relative to user GPS
  const nearestPointInfo = useMemo(() => {
    if (!userLocation) return null;
    let minDistance = 999999;
    let closest = null;
    points.forEach(p => {
      if (p.isActive !== false && !p.isResolved) {
        const d = getDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng);
        if (d < minDistance) {
          minDistance = d;
          closest = p;
        }
      }
    });
    return closest ? { point: closest, distanceKm: minDistance } : null;
  }, [userLocation, points]);

  // GPS Geolocation Handler with High Accuracy (Auto-requested on entry for mobile, iPad, and all devices)
  const handleLocateMe = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert("อุปกรณ์หรือเบราว์เซอร์ของคุณไม่รองรับการระบุพิกัด GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setUserLocation(coords);
        setLocationAccuracy(pos.coords.accuracy);
        setFlyToLocation(coords);

        const accuracyM = Math.round(pos.coords.accuracy);
        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        const detectedDistrict = detectDistrictForCoordinates(coords.lat, coords.lng);
        const deviceModel = getDetailedDeviceInfo();

        // 1. ตรวจสอบว่าพิกัดอยู่ภายในขอบเขตจังหวัดสมุทรปราการหรือไม่
        if (!detectedDistrict) {
          sendVisitorTelemetry('ไม่ได้อยู่สมุทรปราการ', deviceModel);

          if (!silent) {
            alert(`📍 ตรวจพบพิกัดของคุณที่ [${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}]\n\n⚠️ ตำแหน่งท่านไม่ได้อยู่ในพื้นที่จังหวัดสมุทรปราการ\n\nระบบ PrakanGuard พัฒนาขึ้นเพื่อติดตามและรายงานสถานการณ์น้ำท่วมในพื้นที่ 6 อำเภอของจังหวัดสมุทรปราการครับ\n\n(ระบบได้ปักหมุดตำแหน่งของคุณบนแผนที่ไว้เรียบร้อยแล้ว)`);
          }
        } else {
          // อยู่ภายใน จ.สมุทรปราการ
          const cleanDistrict = detectedDistrict.replace(/^อ\./, '').replace(/^อำเภอ/, '').replace('เมืองสมุทรปราการ', 'เมือง');
          sendVisitorTelemetry(cleanDistrict, deviceModel);

          if (!silent) {
            setLatestUpdateNotification(`📍 คุณอยู่ที่ ${cleanDistrict} จ.สมุทรปราการ`);
            setTimeout(() => setLatestUpdateNotification(null), 5000);
          }
        }
      },
      (err) => {
        sendVisitorTelemetry('ปิด GPS', getDetailedDeviceInfo());
        if (!silent) {
          let msg = "ไม่ได้เปิด GPS หรือไม่ได้อนุญาตการเข้าถึงตำแหน่ง กรุณาเปิดการอนุญาต Location ในการตั้งค่าเบราว์เซอร์เพื่อระบุพิกัด";
          if (err.code === 1) msg = "คุณปฏิเสธการเข้าถึงตำแหน่ง GPS กรุณาเปิดการอนุญาต Location ในการตั้งค่าเบราว์เซอร์เพื่อระบุพิกัด";
          else if (err.code === 2) msg = "สัญญาณ GPS ขัดข้อง ไม่สามารถระบุพิกัดได้ในขณะนี้";
          alert(msg);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Handle entering website from WelcomeModal: fly and zoom smoothly directly to user's real GPS position
  const handleEnterWebsite = () => {
    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 640;

    // If user's location is already known, smoothly fly directly to their coordinates
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      setFlyToLocation({
        lat: userLocation.lat,
        lng: userLocation.lng,
        zoom: 15.5,
        duration: 2.2,
        easeLinearity: 0.22,
        ts: Date.now()
      });
      return;
    }

    // Request user GPS location and zoom in directly
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setUserLocation(coords);
          setLocationAccuracy(pos.coords.accuracy);

          // Fly smoothly and zoom to user's exact GPS location!
          setFlyToLocation({
            lat: coords.lat,
            lng: coords.lng,
            zoom: 15.5,
            duration: 2.2,
            easeLinearity: 0.22,
            ts: Date.now()
          });

          const detectedDistrict = detectDistrictForCoordinates(coords.lat, coords.lng);
          const deviceModel = getDetailedDeviceInfo();
          if (!detectedDistrict) {
            sendVisitorTelemetry('ไม่ได้อยู่สมุทรปราการ', deviceModel);
          } else {
            const cleanDistrict = detectedDistrict.replace(/^อ\./, '').replace(/^อำเภอ/, '').replace('เมืองสมุทรปราการ', 'เมือง');
            sendVisitorTelemetry(cleanDistrict, deviceModel);
          }
        },
        (err) => {
          sendVisitorTelemetry('ปิด GPS', getDetailedDeviceInfo());
          // Fallback if denied or unavailable: smooth zoom to Samut Prakan province overview
          setFlyToLocation({
            lat: 13.6000,
            lng: 100.6500,
            zoom: isMobileScreen ? 11.2 : 11.6,
            duration: 2.2,
            easeLinearity: 0.22,
            ts: Date.now()
          });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setFlyToLocation({
        lat: 13.6000,
        lng: 100.6500,
        zoom: isMobileScreen ? 11.2 : 11.6,
        duration: 2.2,
        easeLinearity: 0.22,
        ts: Date.now()
      });
    }
  };

  const minor = levelCounts ? levelCounts.minor : points.filter(p => p.level === 1 && p.isActive !== false && !p.isResolved).length;
  const moderate = levelCounts ? levelCounts.moderate : points.filter(p => p.level === 2 && p.isActive !== false && !p.isResolved).length;
  const severe = levelCounts ? levelCounts.severe : points.filter(p => p.level === 3 && p.isActive !== false && !p.isResolved).length;
  const falling = levelCounts ? levelCounts.falling : points.filter(p => p.waterTrend === 'falling' && p.isActive !== false && !p.isResolved).length;

  return (
    <div className={`fixed inset-0 h-full w-full flex flex-col font-prompt selection:bg-blue-600 selection:text-white overflow-hidden overscroll-none select-none transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* 1. TOP NAVBAR (Theme Switchable & AutoMarquee) */}
      <Navbar 
        points={points} 
        citizenReports={citizenReports}
        levelCounts={levelCounts}
        weather={weather}
        severityFilter={severityFilter}
        onSelectSeverityFilter={setSeverityFilter}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        onOpenAiForecast={() => setIsOfficialModalOpen(true)}
        onOpenStandards={() => setIsStandardsModalOpen(true)}
        onOpenWelcome={() => setIsWelcomeModalOpen(true)}
        onOpenCitizenReport={() => setIsCitizenReportModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenPublicUpdates={() => setIsPublicUpdatesModalOpen(true)}
        onOpenAnnouncement={() => setIsAnnouncementModalOpen(true)}
        hasAnnouncement={Boolean(latestAnnouncement)}
        onOpenPrivacyPolicy={() => setIsPrivacyPolicyModalOpen(true)}
        lastUpdatedTime={lastUpdatedTime}
        lastUpdatedTimeDetailed={lastUpdatedTimeDetailed}
        pendingReportsCount={isAdminAuthenticated ? pendingReportsCount : 0}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshingData}
        refreshCountdown={refreshCountdown}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(v => !v)}
      />

      {/* 2. RESPONSIVE WORKSPACE (DESKTOP DOCKED COMMAND CENTER / TABLET DRAWER / MOBILE FULL BLEED) */}
      <div className="flex-1 flex overflow-hidden relative w-full h-full">

        {/* ========================================================================= */}
        {/* A. DESKTOP & TABLET GIS SIDEBAR (DOCKED ON PC, SLIDE-IN DRAWER ON TABLET) */}
        {/* ========================================================================= */}
        {/* Backdrop for Tablet Drawer */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-35 bg-black/40 backdrop-blur-xs transition-opacity duration-300 md:block hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Panel */}
        <aside className={`
          hidden md:flex flex-col h-full z-40 lg:z-20 shrink-0 backdrop-blur-md transition-[width,opacity,transform] duration-300 ease-in-out select-none
          ${isDark ? 'bg-slate-900/98 text-slate-100' : 'bg-white/98 text-slate-800'}
          fixed lg:relative top-0 bottom-0 left-0
          ${isSidebarOpen 
              ? 'w-[340px] lg:w-[380px] xl:w-[410px] border-r translate-x-0 opacity-100 shadow-2xl lg:shadow-none' 
              : 'w-0 min-w-0 max-w-0 border-r-0 border-transparent overflow-hidden opacity-0 pointer-events-none -translate-x-full lg:translate-x-0'
          }
          ${isDark ? 'border-slate-800' : 'border-slate-200'}
        `}>
          <div className="w-[340px] lg:w-[380px] xl:w-[410px] h-full flex flex-col shrink-0 overflow-hidden">
            {/* Sidebar Header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-bold tracking-tight truncate">ศูนย์ข้อมูล & ควบคุม GIS</h2>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">จ.สมุทรปราการ (6 อำเภอ)</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                playToggleSound(false);
                setIsSidebarOpen(false);
              }}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="ย่อแถบข้าง (ขยายแผนที่เต็มจอ)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* 1. Quick Search Box */}
            <div ref={searchContainerRef} className="relative">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const topMatch = searchResultsOfficial[0] || 
                                       searchResultsCitizen[0] ||
                                       points.find(p => matchesLocationSearch(p, searchQuery)) ||
                                       citizenReports.find(cr => matchesLocationSearch(cr, searchQuery));
                      if (topMatch) {
                        handleSelectLocation(topMatch);
                      }
                    } else if (e.key === 'Escape') {
                      setIsSearchFocused(false);
                      searchInputRef.current?.blur();
                    }
                  }}
                  placeholder="ค้นหาจุดเสี่ยงหรือชื่อถนน (กิ่งแก้ว, วัดด่าน)..."
                  className={`w-full text-xs sm:text-sm pl-8 pr-7 py-2 rounded-md border shadow-xs focus:outline-none transition-colors backdrop-blur-md font-medium ${
                    isDark 
                      ? 'bg-slate-850/90 text-slate-100 border-slate-700 placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-slate-50 text-slate-800 border-slate-200 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-2.5 top-2.5 cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Instant Search Suggestions Dropdown */}
              {isSearchFocused && (
                <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-xl max-h-72 overflow-y-auto z-50 p-2 text-xs backdrop-blur-md ${
                  isDark ? 'bg-slate-900/98 border-slate-800 text-slate-100 shadow-slate-950/80' : 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-300/40'
                }`}>
                  {!searchQuery.trim() ? (
                    <div>
                      <div className={`text-[11px] font-bold mb-2 px-1 flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                        <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>จุดค้นหายอดนิยม</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                        {POPULAR_SEARCH_SUGGESTIONS.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectPopularSuggestion(item)}
                            className={`w-full p-2 rounded-md cursor-pointer border transition-all text-left flex flex-col justify-between select-none active:scale-[0.98] ${
                              isDark 
                                ? 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-200' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-semibold text-xs truncate">{item.label}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {item.district ? item.district.replace(/^อ\./, '').replace('เมืองสมุทรปราการ', 'เมือง') : ''}
                              </span>
                            </div>
                            <span className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.sub}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : searchResultsOfficial.length === 0 && searchResultsCitizen.length === 0 ? (
                    <div className="p-3 text-center">
                      <div className="text-slate-400 mb-2">ไม่พบจุดเสี่ยงที่ตรงกับ "{searchQuery}"</div>
                      <div className="text-[11px] text-slate-400 mb-2">ลองค้นหาด้วยชื่อเรียกติดปาก:</div>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {POPULAR_SEARCH_SUGGESTIONS.slice(0, 8).map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectPopularSuggestion(item)}
                            className="px-2.5 py-1 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 border border-slate-200 dark:border-slate-700 font-medium transition-colors cursor-pointer active:scale-95"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                      {searchResultsOfficial.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectLocation(p)}
                          className={`w-full p-2 rounded-md cursor-pointer flex items-center justify-between transition-colors text-left select-none active:scale-[0.98] ${
                            isDark ? 'hover:bg-slate-850 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className={`font-semibold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</span>
                            <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {p.district.replace(/^อ\./, '')} • {p.depthRange} {p.aliases ? `• ${p.aliases.slice(0, 3).join(', ')}` : ''}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                            p.level === 3 ? (isDark ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-rose-100 text-rose-800') :
                            p.level === 2 ? (isDark ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800') : 
                            (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800')
                          }`}>
                            {p.statusLabel}
                          </span>
                        </button>
                      ))}

                      {searchResultsCitizen.map(cr => (
                        <button
                          key={cr.id}
                          type="button"
                          onClick={() => handleSelectLocation(cr)}
                          className={`w-full p-2 rounded-md cursor-pointer flex items-center justify-between transition-colors border-t border-slate-100 dark:border-slate-800 text-left select-none active:scale-[0.98] ${
                            isDark ? 'hover:bg-slate-850 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                              <span>💧 {cr.name}</span>
                            </span>
                            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cr.district.replace(/^อ\./, '')} • ระดับ{cr.bodyLevelLabel}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/80 dark:text-cyan-300 dark:border-blue-800`}>
                            ภาคประชาชน
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. District Selector & GPS User Location Badge */}
            <div className="flex items-center gap-1.5 w-full">
              <div className={`relative flex-1 min-w-0 flex items-center px-2.5 py-2 rounded-md border shadow-xs transition-colors ${
                isDark ? 'bg-slate-850/90 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mr-1.5" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    playSelectSound();
                    const dist = e.target.value;
                    setSelectedDistrict(dist);
                    if (dist === "ทั้งหมด") {
                      setFlyToLocation({ lat: 13.6000, lng: 100.6500, zoom: 11, ts: Date.now() });
                    } else {
                      const dData = SAMUT_PRAKAN_DISTRICTS_DATA.find(d => d.name === dist);
                      if (dData && dData.center) {
                        setFlyToLocation({ lat: dData.center.lat, lng: dData.center.lng, zoom: 13, ts: Date.now() });
                      }
                    }
                  }}
                  className={`w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer appearance-none ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  title="คลิกเพื่อเลือกดูตามอำเภอ"
                >
                  <option value="ทั้งหมด" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                    🏛️ ทุกอำเภอ (จ.สมุทรปราการ)
                  </option>
                  {DISTRICTS.filter(d => d !== "ทั้งหมด").map(dist => (
                    <option 
                      key={dist} 
                      value={dist}
                      className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                    >
                      📍 อ.{dist}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none ml-1" />
              </div>

              {/* GPS status chip */}
              {userLocation ? (
                <div 
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-xs font-semibold shadow-xs ${
                    userDistrict 
                      ? (isDark ? 'bg-slate-850 border-slate-700 text-cyan-300' : 'bg-slate-50 border-slate-200 text-slate-800')
                      : (isDark ? 'bg-amber-950/80 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900')
                  }`}
                  title="ตำแหน่งปัจจุบันของคุณ"
                >
                  <Compass className="w-3.5 h-3.5 text-blue-500 animate-spin-slow shrink-0" />
                  <span className="truncate max-w-[110px]">
                    {userDistrict && typeof userDistrict === 'string' ? `คุณอยู่: อ.${userDistrict.replace('เมืองสมุทรปราการ', 'เมือง')}` : 'อยู่นอกสมุทรปราการ'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLocateMe(false)}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all ${
                    isDark ? 'bg-slate-850 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                  title="คลิกเพื่อเปิดตำแหน่งและระบุพิกัด GPS"
                >
                  <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="underline decoration-slate-400 dark:decoration-slate-500 underline-offset-2 hover:decoration-blue-500 font-medium">
                    เปิด GPS
                  </span>
                </button>
              )}
            </div>

            {/* 3. Desktop & Tablet GIS Sidebar Tab Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  playTabSound();
                  setDesktopSidebarTab('points');
                }}
                className={`py-1.5 px-2 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  desktopSidebarTab === 'points'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">จุดเฝ้าระวัง ({displayPoints.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playModalOpenSound();
                  setDesktopSidebarTab('weather');
                  setIsOfficialModalOpen(true);
                }}
                className={`py-1.5 px-2 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                  desktopSidebarTab === 'weather'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="คลิกเพื่อดูข้อมูลพยากรณ์สภาพอากาศและเรดาร์ตรวจฝน AI ละเอียด"
              >
                <CloudRain className="w-3.5 h-3.5 text-cyan-500" />
                <span className="truncate">พยากรณ์สภาพอากาศ</span>
              </button>
            </div>

            {/* TAB 1: POINTS LIST (จุดเฝ้าระวัง) */}
            {desktopSidebarTab === 'points' && (
              <div className="space-y-2">
                {/* Severity Quick Filters for Points */}
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      playSelectSound();
                      setSeverityFilter('all');
                    }}
                    className={`py-1 px-1 rounded-md text-center font-bold border transition-all cursor-pointer ${
                      severityFilter === 'all'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    ทั้งหมด
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSelectSound();
                      setSeverityFilter(severityFilter === '3' || severityFilter === 'severe' ? 'all' : '3');
                    }}
                    className={`py-1 px-1 rounded-md text-center font-bold border transition-all cursor-pointer ${
                      severityFilter === '3' || severityFilter === 'severe'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : isDark ? 'bg-slate-800/80 border-slate-700 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    วิกฤต ({severe})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSelectSound();
                      setSeverityFilter(severityFilter === '2' || severityFilter === 'moderate' ? 'all' : '2');
                    }}
                    className={`py-1 px-1 rounded-md text-center font-bold border transition-all cursor-pointer ${
                      severityFilter === '2' || severityFilter === 'moderate'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : isDark ? 'bg-slate-800/80 border-slate-700 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    กลาง ({moderate})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSelectSound();
                      setSeverityFilter(severityFilter === '1' || severityFilter === 'minor' ? 'all' : '1');
                    }}
                    className={`py-1 px-1 rounded-md text-center font-bold border transition-all cursor-pointer ${
                      severityFilter === '1' || severityFilter === 'minor'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isDark ? 'bg-slate-800/80 border-slate-700 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    ปกติ ({minor})
                  </button>
                </div>

                {/* Scrollable Points List */}
                <div className="space-y-1.5 max-h-[52vh] overflow-y-auto pr-0.5 custom-scrollbar-thin">
                  {displayPoints.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      ไม่พบจุดเฝ้าระวังตามเงื่อนไขที่เลือก
                    </div>
                  ) : (
                    displayPoints.map((pt) => {
                      const lvl = resolveLevel(pt);
                      const isReceding = isWaterReceding(pt);
                      const hasPtPhoto = Boolean(pt.photoUrl || pt.photo_url || pt.photo || pt.image || pt.imageUrl);
                      const isSelected = selectedPoint?.id === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => handleSelectLocation(pt)}
                          className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 select-none active:scale-[0.98] ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 ring-1 ring-blue-500'
                              : isDark 
                                ? 'bg-slate-850/60 hover:bg-slate-800/80 border-slate-800 text-slate-200' 
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                lvl === 3 ? 'bg-rose-500 ring-2 ring-rose-500/20' :
                                lvl === 2 ? 'bg-amber-500 ring-2 ring-amber-500/20' : 'bg-emerald-500'
                              }`} />
                              <h4 className="font-bold text-xs truncate leading-snug">{pt.name}</h4>
                              {hasPtPhoto && (
                                <span className="text-[9px] px-1 py-0.2 rounded font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 shrink-0">
                                  📷
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                              <span className="truncate">อ.{pt.district?.replace(/^อ\./, '')}</span>
                              <span>•</span>
                              <span className={`font-medium ${
                                isReceding ? 'text-teal-600 dark:text-teal-400 font-semibold' :
                                pt.waterTrend === 'rising' ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
                              }`}>
                                {isReceding ? '📉 น้ำลด' : pt.waterTrend === 'rising' ? '📈 น้ำขึ้น' : 'ทรงตัว'}
                              </span>
                              <span>•</span>
                              <span className="truncate">{lvl === 3 ? 'รถเล็กห้ามผ่าน' : lvl === 2 ? 'รถเล็กควรเลี่ยง' : 'ผ่านได้'}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-md border inline-block ${
                              lvl === 3 ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                              lvl === 2 ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                              'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {pt.depthCm ? `${pt.depthCm} cm` : (pt.depthRange || `${lvl === 3 ? '>50' : lvl === 2 ? '21-50' : '5-20'} cm`)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: WEATHER FORECAST (พยากรณ์สภาพอากาศ) */}
            {desktopSidebarTab === 'weather' && (
              <div className="space-y-3">
                {/* Direct Action Button: Open Detailed Weather & Radar Forecast Modal */}
                <button
                  type="button"
                  onClick={() => {
                    playModalOpenSound();
                    setIsOfficialModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs flex items-center justify-between shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                  title="คลิกเพื่อดูข้อมูลพยากรณ์อากาศและเรดาร์ตรวจฝน TMD อย่างละเอียด"
                >
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-white" />
                    <span>ดูพยากรณ์อากาศ & เรดาร์ฝนละเอียด</span>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
                    AI + TMD ↗
                  </span>
                </button>

                {/* 24-Hour Rain Forecast Card */}
                <RainForecast24hCard
                  forecast={weather?.forecast24h}
                  userDistrict={userDistrict}
                  userLocation={userLocation}
                  onOpenRadar={() => setIsOfficialModalOpen(true)}
                  theme={theme}
                  collapsible={true}
                  defaultExpanded={true}
                  onManualSync={handleManualSync}
                  isSyncing={telemetrySyncStatus?.isSyncing}
                  onOpenPublicUpdates={() => setIsPublicUpdatesModalOpen(true)}
                  lastUpdatedTime={lastUpdatedTime}
                />

                {/* Major Flood Corridors */}
                <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-850/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <span>🛣️</span> เส้นทางสัญจรเสี่ยงสำคัญ
                    </span>
                    <span className="text-[10px] text-slate-400">คลิกเพื่อซูม</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {MAJOR_FLOOD_CORRIDORS.slice(0, 6).map((corridor) => (
                      <button
                        key={corridor.id}
                        onClick={() => {
                          playSelectSound();
                          if (corridor.coordinates && corridor.coordinates[0]) {
                            setFlyToLocation({
                              lat: corridor.coordinates[0][0],
                              lng: corridor.coordinates[0][1],
                              zoom: 14,
                              duration: 1.8,
                              ts: Date.now()
                            });
                          }
                        }}
                        className={`p-1.5 rounded-md text-left border text-[11px] font-medium transition-all cursor-pointer shadow-xs truncate active:scale-95 ${
                          isDark ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200 hover:text-cyan-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 hover:text-blue-600'
                        }`}
                        title={corridor.name}
                      >
                        📍 {corridor.shortName || corridor.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Telemetry Summary Counters */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-850/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">จุดเฝ้าระวังทั้งหมด</span>
                    <span className="text-base font-bold text-blue-600 dark:text-cyan-400 font-mono mt-0.5 block">
                      {points.length + citizenReports.length} จุด
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-slate-850/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">รายงานประชาชน</span>
                    <span className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono mt-0.5 block">
                      {citizenReports.length} รายการ
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className={`p-2.5 px-3 border-t flex items-center justify-between text-[11px] shrink-0 ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-1.5">
              <RefreshCw className={`w-3 h-3 ${isRefreshingData ? 'animate-spin text-blue-500' : ''}`} />
              <span>รีเฟรชใน {Math.floor(refreshCountdown / 60)}:{(refreshCountdown % 60).toString().padStart(2, '0')}</span>
            </div>
            <button
              onClick={handleRefreshData}
              disabled={isRefreshingData}
              className="text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer font-semibold"
            >
              {isRefreshingData ? 'กำลังซิงค์...' : 'รีเฟรชทันที'}
            </button>
          </div>
        </div>
      </aside>

        {/* ========================================================================= */}
        {/* B. MAIN INTERACTIVE MAP CANVAS (FLEX-1)                                   */}
        {/* ========================================================================= */}
        <main className="flex-1 relative w-full h-full overflow-hidden">
          
          {/* Full Interactive Map */}
          <div className="absolute inset-0 w-full h-full z-0">
            <MapView 
              points={mapPoints} 
              citizenReports={mapCitizenReports}
              onSelectPoint={handleSelectLocation}
              selectedPoint={selectedPoint}
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
              userLocation={userLocation}
              onLocateMe={handleLocateMe}
              locationAccuracy={locationAccuracy}
              onOpenStandards={() => setIsStandardsModalOpen(true)}
              isPickingLocation={isPickingLocationOnMap}
              onMapLocationPicked={handleMapLocationPicked}
              flyToLocation={flyToLocation}
              theme={theme}
              isTopPanelCollapsed={isTopPanelCollapsed}
              isSidebarOpen={isSidebarOpen}
              refreshCountdown={refreshCountdown}
            />
          </div>

          {/* Re-Open Sidebar Button on Desktop & Tablet when sidebar is closed */}
          {!isSidebarOpen && (
            <button
              onClick={() => {
                playToggleSound(true);
                setIsSidebarOpen(true);
              }}
              className={`hidden md:flex absolute top-4 left-4 z-20 items-center gap-2 px-3 py-2 rounded-md shadow-md border text-xs font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                isDark 
                  ? 'bg-slate-900/95 text-slate-100 border-slate-800 hover:border-slate-700' 
                  : 'bg-white/95 text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
              title="เปิดแผงควบคุม GIS และพยากรณ์ฝน"
            >
              <PanelLeftOpen className="w-4 h-4 text-blue-500 shrink-0" />
              <span>เปิดแผง GIS</span>
              {selectedDistrict !== 'ทั้งหมด' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-cyan-300 font-bold">
                  {selectedDistrict.replace(/^อ\./, '')}
                </span>
              )}
            </button>
          )}

          {/* Floating Instruction Banner when User is Picking Location on Map */}
          {isPickingLocationOnMap && (
            <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-2xl border border-cyan-500/50 backdrop-blur-xl flex items-center gap-2 sm:gap-3 pointer-events-auto max-w-[92vw] sm:max-w-none">
              <span className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-cyan-400 animate-ping shrink-0"></span>
              <div className="text-[10px] sm:text-xs min-w-0">
                <strong className="block text-cyan-300 font-bold text-[11px] sm:text-sm truncate">📍 แตะเลือกจุดบนแผนที่</strong>
                <span className="text-slate-200 truncate block">แตะพิกัดที่พบน้ำท่วมเพื่อบันทึกจุด</span>
              </div>
              <button 
                onClick={handleCancelPickOnMap}
                className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-[10px] sm:text-xs cursor-pointer ml-1 sm:ml-2 shrink-0 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          )}

          {/* Floating Notification for Admin when Citizen submits new flood reports */}
          {isAdminAuthenticated && pendingReportsCount > 0 && (
            <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-4 z-30 max-w-xs sm:max-w-sm bg-amber-500 text-slate-950 px-3.5 py-2.5 rounded-2xl shadow-2xl border border-amber-300 backdrop-blur-md flex items-center gap-2.5 pointer-events-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0"></span>
              <div className="text-xs">
                <strong className="block font-bold">🔔 มีรายงานน้ำท่วมใหม่ ({pendingReportsCount} รายการ)</strong>
                <span className="text-[11px] opacity-90">รอแอดมินยืนยันก่อนขึ้นแผนที่</span>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer shadow ml-auto"
              >
                ตรวจสอบ
              </button>
            </div>
          )}

          {/* Floating Toast Notification */}
          {latestUpdateNotification && (
            <div className={`fixed top-[56px] sm:top-[68px] left-1/2 -translate-x-1/2 z-[85] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-md shadow-md backdrop-blur-md flex items-center gap-2 max-w-[90vw] sm:max-w-md pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300 border ${
              latestUpdateNotification.includes('⚠️') || latestUpdateNotification.includes('ไม่ได้อยู่ใน')
                ? 'bg-slate-900 border-amber-400 text-amber-200 shadow-amber-950/50'
                : 'bg-slate-900 border-emerald-400 text-emerald-200 shadow-emerald-950/50'
            }`}>
              {latestUpdateNotification.includes('⚠️') || latestUpdateNotification.includes('ไม่ได้อยู่ใน') ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="text-[11.5px] sm:text-xs font-bold leading-tight truncate text-white">{latestUpdateNotification}</span>
              <button
                type="button"
                onClick={() => setLatestUpdateNotification(null)}
                className="p-0.5 hover:bg-white/20 rounded-md text-slate-400 hover:text-white cursor-pointer ml-1 shrink-0"
                title="ปิดการแจ้งเตือน"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Out of Province Warning Banner */}
          {showOutOfProvinceBanner && userLocation && !userDistrict && (
            <div className="fixed top-[58px] sm:top-[72px] left-1/2 -translate-x-1/2 z-[80] w-auto max-w-[94vw] sm:max-w-md pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-amber-950/95 text-amber-200 border border-amber-500/50 shadow-md backdrop-blur-md">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                <div className="flex-1 min-w-0 text-xs">
                  <span className="font-bold block text-white">ตำแหน่งท่านไม่ได้อยู่ในจังหวัดสมุทรปราการ</span>
                  <span className="text-[10px] text-amber-300/80">ระบบติดตามและรายงานครอบคลุม 6 อำเภอ จ.สมุทรปราการ</span>
                </div>
                <button
                  onClick={() => {
                    setShowOutOfProvinceBanner(false);
                    setSelectedDistrict('ทั้งหมด');
                    setFlyToLocation({ lat: 13.6000, lng: 100.6500, zoom: 11, ts: Date.now() });
                  }}
                  className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[10px] font-bold shrink-0 cursor-pointer active:scale-95 transition-all"
                >
                  ดูสมุทรปราการ
                </button>
                <button
                  type="button"
                  onClick={() => setShowOutOfProvinceBanner(false)}
                  className="p-1 hover:bg-white/10 rounded-md text-amber-300/80 hover:text-white cursor-pointer ml-0.5"
                  title="ปิด"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Admin Web Announcement Banner */}
          {showAnnouncementBanner && activeAnnouncement && (
            <div className="fixed bottom-28 sm:bottom-auto sm:top-14 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-[92vw] sm:max-w-2xl z-[95] pointer-events-auto animate-in fade-in slide-in-from-bottom-3 sm:slide-in-from-top-3 duration-300">
              <div className={`w-full p-3 sm:px-4 sm:py-3.5 rounded-lg border shadow-lg backdrop-blur-md flex flex-col gap-2 transition-all overflow-hidden ${
                isDark ? 'bg-slate-900/98 text-slate-100 border-slate-800 shadow-slate-950/50' : 'bg-white/98 text-slate-900 border-slate-300 shadow-md'
              }`}>
                <div className="flex items-center justify-between gap-2 border-b pb-1.5 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white shrink-0">
                      <Bell className="w-3.5 h-3.5 animate-pulse" />
                    </span>
                    <span className="text-xs sm:text-xs font-bold text-blue-600 dark:text-cyan-400 truncate tracking-wide">
                      📢 ประกาศจากเจ้าหน้าที่ PrakanGuard
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playCloseSound();
                      lsAnnAddDismiss(activeAnnouncement.id);
                      setShowAnnouncementBanner(false);
                    }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer shrink-0 transition-colors active:scale-90"
                    title="ปิดประกาศ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-100 px-0.5 break-words">
                  {activeAnnouncement.message}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-md overflow-hidden mt-0.5">
                  <div 
                    className="bg-blue-600 h-full rounded-md"
                    style={{ animation: 'pg-announcement-timer 10s linear forwards' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP/IPAD FLOATING LEGEND CARD (BOTTOM LEFT) */}
          <div className="hidden md:flex absolute bottom-4 left-4 z-40 pointer-events-auto select-none">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                try { playModalOpenSound(); } catch (_) {}
                setIsStandardsModalOpen(true);
              }}
              className={`px-3 py-1.5 rounded-md border text-xs flex items-center gap-2.5 shadow-xs backdrop-blur-md cursor-pointer transition-all active:scale-95 group ${
                isDark 
                  ? 'bg-slate-900/95 border-slate-800 hover:border-slate-700 text-slate-300' 
                  : 'bg-white/95 border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
              title="คลิกเพื่อดูรายละเอียดเกณฑ์วัดระดับน้ำและผลกระทบฉบับเต็ม"
            >
              <div className="flex items-center gap-1.5 font-semibold">
                <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span className={isDark ? 'text-white' : 'text-slate-900'}>เกณฑ์ระดับน้ำ:</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">ปกติ 5-20 ซม.</span>
              </div>

              <span className={isDark ? 'text-slate-800' : 'text-slate-300'}>•</span>

              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-medium text-amber-700 dark:text-amber-400">ปานกลาง 21-50 ซม.</span>
              </div>

              <span className={isDark ? 'text-slate-800' : 'text-slate-300'}>•</span>

              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">วิกฤต &gt;50 ซม.</span>
              </div>

              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  try { playModalOpenSound(); } catch (_) {}
                  setIsStandardsModalOpen(true);
                }}
                className={`ml-1 text-[11px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' 
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                ดูรายละเอียด ↗
              </span>
            </button>
          </div>

        {/* FLOATING POINT DETAIL MODAL (CENTERED POPUP DIALOG) */}
        {selectedPoint && (() => {
          const directPhoto = selectedPoint.photoUrl || selectedPoint.photo_url || selectedPoint.photo || selectedPoint.image || selectedPoint.imageUrl;
          let matchedPhoto = null;
          if (!directPhoto) {
            const allCandidates = [...(citizenReports || []), ...(points || [])];
            const matched = allCandidates.find(c => {
              const cPhoto = c.photoUrl || c.photo_url || c.photo || c.image || c.imageUrl;
              if (!cPhoto) return false;
              return (
                (c.id && selectedPoint.id && String(c.id) === String(selectedPoint.id)) ||
                (c.name && selectedPoint.name && c.name.trim().toLowerCase() === selectedPoint.name.trim().toLowerCase()) ||
                (typeof c.lat === 'number' && typeof selectedPoint.lat === 'number' && Math.abs(c.lat - selectedPoint.lat) < 0.005 && Math.abs(c.lng - selectedPoint.lng) < 0.005)
              );
            });
            matchedPhoto = matched?.photoUrl || matched?.photo_url || matched?.photo || matched?.image || matched?.imageUrl || null;
          }
          const pointPhoto = directPhoto || matchedPhoto;
          const hasPhoto = !!(pointPhoto && typeof pointPhoto === 'string' && pointPhoto.trim() && pointPhoto !== 'null' && pointPhoto !== 'undefined');

          return (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                playCloseSound();
                setSelectedPoint(null);
              }
            }}
            className="fixed inset-0 z-[100] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 smooth-backdrop animate-in fade-in duration-200 pointer-events-auto overflow-hidden"
          >
            <div 
              className={`w-full max-w-[420px] sm:max-w-md border rounded-xl shadow-2xl relative max-h-[82vh] sm:max-h-[86vh] flex flex-col p-3.5 sm:p-5 overflow-y-auto overscroll-contain transition-all custom-scrollbar-thin ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl shadow-black/80' 
                  : 'bg-white border-slate-200 text-slate-900 shadow-2xl shadow-slate-900/30'
              }`}
            >
              {/* Header: District Badge + Severity Badge + Easy-to-Tap Close Button */}
              <div className={`flex items-center justify-between gap-1.5 sm:gap-2 pb-2 sm:pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border shadow-xs ${
                    isDark ? 'bg-slate-850 text-cyan-300 border-slate-700' : 'bg-slate-50 text-blue-700 border-slate-200'
                  }`}>
                    อ.{selectedPoint.district}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border shadow-xs ${
                    selectedPoint.hazardType === 'hail' ? (isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-cyan-50 text-cyan-700 border-cyan-200') :
                    getFloodLevel(selectedPoint.depthCm) === 3 ? (isDark ? 'bg-rose-950 text-rose-300 border-rose-700' : 'bg-rose-50 text-rose-700 border-rose-200') :
                    getFloodLevel(selectedPoint.depthCm) === 2 ? (isDark ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200') :
                    (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-800 border-emerald-300')
                  }`}>
                    {selectedPoint.hazardType === 'hail' ? `🧊 ${selectedPoint.hailSizeLabel || 'ลูกเห็บตก'}` :
                     getFloodLevel(selectedPoint.depthCm) === 3 ? "🔴 น้ำท่วมวิกฤต (>50 ซม.)" :
                     getFloodLevel(selectedPoint.depthCm) === 2 ? "🟠 น้ำท่วมปานกลาง (21-50 ซม.)" : "🟢 น้ำท่วมปกติ (5-20 ซม.)"}
                  </span>
                  {hasPhoto && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playModalOpenSound();
                        setLightboxPhoto({
                          url: pointPhoto,
                          title: selectedPoint.name,
                          time: selectedPoint.reportedAt || selectedPoint.time
                        });
                      }}
                      className="text-xs font-bold px-2 py-0.5 rounded-md border shadow-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-cyan-300 dark:border-blue-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95 animate-in fade-in duration-200"
                      title="แตะเพื่อเปิดดูภาพถ่ายขนาดใหญ่"
                    >
                      <span>📷 มีภาพถ่าย (แตะเพื่อดู)</span>
                    </button>
                  )}
                  {isWaterReceding(selectedPoint) && (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700 flex items-center gap-1">
                      <span>📉 น้ำลด</span>
                    </span>
                  )}
                  {selectedPoint.waterTrend === 'rising' && !isWaterReceding(selectedPoint) && (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700 flex items-center gap-1">
                      <span>📈 น้ำขึ้น</span>
                    </span>
                  )}
                </div>

                {/* Tactile Close Button */}
                <button 
                  type="button"
                  onClick={() => {
                    playCloseSound();
                    setSelectedPoint(null);
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md border shadow-xs flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="ปิดหน้าต่างข้อมูล"
                >
                  <X className="w-4 h-4 font-bold" />
                </button>
              </div>

              {/* Point Title & Clean Location Subtitle */}
              <div className="pt-2 pb-1 sm:pt-2 sm:pb-1">
                <h3 className={`text-base sm:text-lg font-bold leading-snug break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedPoint.name}
                </h3>
                {(selectedPoint.district || selectedPoint.subdistrict) && (
                  <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {selectedPoint.district ? `อ.${selectedPoint.district.replace(/^อ\./, '')}` : ''}
                    {selectedPoint.subdistrict ? ` • ${selectedPoint.subdistrict.startsWith('ต.') ? selectedPoint.subdistrict : `ต.${selectedPoint.subdistrict}`}` : ''}
                    {(typeof selectedPoint.roadSegment === 'string' && selectedPoint.roadSegment.trim() && !/^[0-9.,\s-]+$/.test(selectedPoint.roadSegment.trim())) ? ` • ${selectedPoint.roadSegment}` : ''}
                  </p>
                )}
                {typeof selectedPoint.lat === 'number' && typeof selectedPoint.lng === 'number' && (
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                    📍 พิกัด: {selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}
                  </div>
                )}
              </div>

            {/* Citizen Uploaded Photo Preview (If available) */}
            {hasPhoto && (
              <div 
                className="mt-2 sm:mt-2.5 rounded-xl overflow-hidden border border-blue-200 dark:border-blue-900/60 shadow-sm relative cursor-pointer group bg-slate-950 touch-manipulation active:scale-[0.98] transition-transform"
                onClick={() => {
                  playModalOpenSound();
                  setLightboxPhoto({
                    url: pointPhoto,
                    title: selectedPoint.name,
                    time: selectedPoint.reportedAt || selectedPoint.time
                  });
                }}
                title="แตะเพื่อดูภาพขนาดเต็ม"
              >
                <div className="relative">
                  <img 
                    src={pointPhoto} 
                    alt="รูปภาพสถานการณ์น้ำท่วม" 
                    className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-200" 
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-cyan-300 text-xs font-bold border border-cyan-400/50 flex items-center gap-1 shadow-md">
                    <span>📸 ภาพถ่ายรายงาน</span>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md">
                    <span>🔍 แตะดูเต็มจอ</span>
                  </div>
                </div>
                <div className={`p-2 text-xs text-center font-medium flex items-center justify-between px-3 ${
                  isDark ? 'bg-slate-850 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-cyan-400">
                    <span>🔎 คลิกเพื่อเปิดภาพถ่ายความละเอียดสูง</span>
                  </span>
                  {(selectedPoint.reportedAt || selectedPoint.time) && (
                    <span className="opacity-75 text-[10px] font-mono">
                      {selectedPoint.reportedAt || selectedPoint.time}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Visual Gauge with Standard Waterline & Sleek Vehicle Silhouettes (100% Solid & High Contrast) */}
            <div className="mt-2.5 sm:mt-3">
              <VisualGauge 
                depthCm={selectedPoint.depthCm} 
                level={getFloodLevel(selectedPoint.depthCm)} 
                impactText={selectedPoint.trafficStatus}
                theme={theme}
              />
            </div>

            {/* Vehicle Passability Guidance Matrix */}
            {(() => {
              const standard = FLOOD_STANDARDS.find(s => s.level === getFloodLevel(selectedPoint.depthCm)) || FLOOD_STANDARDS[0];
              const vi = standard.vehicleImpact || {};
              return (
                <div className={`mt-2.5 p-2.5 rounded-lg border ${isDark ? 'bg-slate-850/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>🚗</span> คำแนะนำความปลอดภัยต่อยานพาหนะ
                    </span>
                    <span className="text-[10px] text-slate-400">อิง ปภ./กรมทางหลวง</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {/* รถเก๋ง */}
                    <div className={`p-1.5 rounded-md border flex items-center justify-between gap-1 ${
                      vi.sedan?.status === 'danger' ? (isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800') :
                      vi.sedan?.status === 'warning' ? (isDark ? 'bg-amber-950/60 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800') :
                      (isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                    }`}>
                      <span className="text-[11px] font-semibold truncate">🚗 รถเก๋ง/เล็ก</span>
                      <span className="text-[10px] font-bold shrink-0">{vi.sedan?.status === 'danger' ? 'ห้ามผ่าน' : vi.sedan?.status === 'warning' ? 'ควรเลี่ยง' : 'ผ่านได้'}</span>
                    </div>

                    {/* มอเตอร์ไซค์ */}
                    <div className={`p-1.5 rounded-md border flex items-center justify-between gap-1 ${
                      vi.motorcycle?.status === 'danger' ? (isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800') :
                      vi.motorcycle?.status === 'warning' ? (isDark ? 'bg-amber-950/60 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800') :
                      (isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                    }`}>
                      <span className="text-[11px] font-semibold truncate">🛵 มอเตอร์ไซค์</span>
                      <span className="text-[10px] font-bold shrink-0">{vi.motorcycle?.status === 'danger' ? 'ห้ามผ่าน' : vi.motorcycle?.status === 'warning' ? 'ควรเลี่ยง' : 'ผ่านได้'}</span>
                    </div>

                    {/* รถกระบะ/SUV */}
                    <div className={`p-1.5 rounded-md border flex items-center justify-between gap-1 ${
                      vi.suv?.status === 'danger' ? (isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800') :
                      vi.suv?.status === 'warning' ? (isDark ? 'bg-amber-950/60 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800') :
                      (isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                    }`}>
                      <span className="text-[11px] font-semibold truncate">🚙 กระบะ/SUV</span>
                      <span className="text-[10px] font-bold shrink-0">{vi.suv?.status === 'danger' ? 'ห้ามผ่าน' : vi.suv?.status === 'warning' ? 'ระวังคลื่น' : 'ผ่านได้'}</span>
                    </div>

                    {/* รถบรรทุก */}
                    <div className={`p-1.5 rounded-md border flex items-center justify-between gap-1 ${
                      vi.truck?.status === 'danger' ? (isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800') :
                      vi.truck?.status === 'warning' ? (isDark ? 'bg-amber-950/60 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800') :
                      (isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                    }`}>
                      <span className="text-[11px] font-semibold truncate">🚛 รถบรรทุก</span>
                      <span className="text-[10px] font-bold shrink-0">{vi.truck?.status === 'danger' ? 'ห้ามผ่าน' : vi.truck?.status === 'warning' ? 'ระวังสูง' : 'ผ่านได้'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Fact-based Summary Details with Citations */}
            <div className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-2.5 text-xs sm:text-sm">
              {selectedPoint.cause && (
                <div className={`p-2.5 rounded-md border ${
                  isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`block text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>สาเหตุสำคัญ:</span>
                  <span className={`mt-0.5 block leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {selectedPoint.cause}
                  </span>
                </div>
              )}

              {(selectedPoint.officialGuidance || selectedPoint.trafficStatus) && (
                <div className={`p-2.5 rounded-md border ${
                  isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`block text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>คำแนะนำการสัญจร:</span>
                  <span className={`mt-0.5 block leading-relaxed font-medium ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                    {selectedPoint.officialGuidance || selectedPoint.trafficStatus}
                  </span>
                </div>
              )}

              {/* Source info (Clean reference line as requested) */}
              <div className={`p-2 sm:p-2.5 rounded-md border text-xs sm:text-[11.5px] flex items-center justify-between gap-2 shadow-xs ${
                isDark ? 'bg-slate-850 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="break-words whitespace-normal leading-tight">
                    อ้างอิง: <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>
                      {selectedPoint.isCitizen || (selectedPoint.source && selectedPoint.source.includes('ประชาชน')) 
                        ? 'รายงานจากประชาชนในพื้นที่' 
                        : (selectedPoint.source || 'Traffy Fondue Open API')}
                    </strong>
                  </span>
                </div>
                {(selectedPoint.reportedAt || selectedPoint.time) && (
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {selectedPoint.reportedAt || selectedPoint.time}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Buttons: Direct Navigation & Standards & Helpline */}
            <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {/* Row 1: Google Maps Navigation Link */}
              {typeof selectedPoint.lat === 'number' && typeof selectedPoint.lng === 'number' && (
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-xs active:scale-95"
                  title="เปิดแผนที่นำทางไปยังจุดนี้ด้วย Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5 shrink-0" />
                  <span>นำทางด้วย Google Maps</span>
                </a>
              )}

              {/* Row 2: Standards Guide + Phone Hotline */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try { playModalOpenSound(); } catch (_) {}
                    setIsStandardsModalOpen(true);
                  }}
                  className={`py-2 px-2 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isDark 
                      ? 'bg-slate-850 hover:bg-slate-800 text-slate-200 border-slate-800' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">เกณฑ์ระดับน้ำ</span>
                </button>

                <a 
                  href={`tel:${selectedPoint.phone ? selectedPoint.phone.replace(/-/g, '') : '1784'}`}
                  onClick={() => playClickSound()}
                  className="py-2 px-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer border border-rose-700/60 shadow-xs active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">โทร {selectedPoint.district ? `อ.${selectedPoint.district.replace(/^อ\./, '')}` : '1784'}</span>
                </a>
              </div>
            </div>

            {/* Admin Broadcast & AI Alert Direct Delete Action (Visible ONLY to Logged-in Admin) */}
            {isAdminAuthenticated && (selectedPoint.isAdminBroadcast || selectedPoint.isAiGenerated) && (
              <div className="mt-2 p-1.5 sm:p-2 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-1.5">
                <span className="text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Megaphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>ประกาศฉุกเฉิน</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`ยืนยันการลบข้อความประกาศ "${selectedPoint.name}" ออกจากระบบ?`)) {
                      handleRejectReport(selectedPoint.id);
                    }
                  }}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="ลบข้อความประกาศนี้"
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>ลบ</span>
                </button>
              </div>
            )}

            {/* Quick Exit Button at Bottom of Card */}
            <button
              type="button"
              onClick={() => {
                playCloseSound();
                setSelectedPoint(null);
              }}
              className={`w-full mt-1.5 sm:mt-2.5 py-1.5 sm:py-2 rounded-md border text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95 ${
                isDark 
                  ? 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-800' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              <span>ปิดหน้าต่าง</span>
            </button>

            </div>
          </div>
          );
        })()}

        {/* FULLSCREEN PHOTO LIGHTBOX MODAL (Mobile, Tablet & PC) */}
        {lightboxPhoto && (
          <div 
            className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2.5 sm:p-6 animate-in fade-in duration-200 pointer-events-auto"
            onClick={() => setLightboxPhoto(null)}
          >
            <div 
              className="relative max-w-3xl max-h-[85vh] sm:max-h-[90vh] w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / Close */}
              <div className="w-full flex items-center justify-between pb-2 sm:pb-2.5 px-2 text-white">
                <div className="min-w-0 pr-3">
                  <h4 className="text-xs sm:text-base font-bold truncate">
                    {lightboxPhoto.title || 'รูปภาพจากประชาชนรายงาน'}
                  </h4>
                  {lightboxPhoto.time && (
                    <p className="text-[10px] sm:text-xs text-slate-300">รายงานเมื่อ: {lightboxPhoto.time}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxPhoto(null)}
                  className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  title="ปิดรูปภาพ"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Image Preview Container */}
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/20 shadow-2xl max-h-[70vh] sm:max-h-[75vh] w-full flex items-center justify-center bg-black/60">
                <img 
                  src={lightboxPhoto.url} 
                  alt="รูปภาพรายงานน้ำท่วม" 
                  className="max-h-[70vh] sm:max-h-[75vh] max-w-full object-contain rounded-xl sm:rounded-2xl"
                />
              </div>
              <div className="mt-2 text-center text-[10px] sm:text-xs text-slate-300">
                แตะที่ใดก็ได้เพื่อปิดรูปภาพ
              </div>
            </div>
          </div>
        )}

      </main>

      {/* End of 2. RESPONSIVE WORKSPACE */}
      </div>

      {/* ========================================================================= */}
      {/* C. MOBILE INTERACTIVE BOTTOM SHEET & PEEK STATUS BAR (md:hidden) */}
      {/* ========================================================================= */}
      {/* 1. Collapsed Mode: Floating Peek Bar anchored right above MobileBottomNav */}
      {!isMobileSheetOpen && (
        <div className="md:hidden fixed bottom-[58px] inset-x-2.5 z-30 pointer-events-auto select-none">
          <div className={`p-2 rounded-xl border backdrop-blur-md shadow-lg flex flex-col gap-1.5 transition-all ${
            isDark 
              ? 'bg-slate-900/95 border-slate-800 text-slate-100' 
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}>
            {/* Top Drag Pill Handle */}
            <button
              type="button"
              onClick={() => {
                setMobileSheetTab('overview');
                setIsMobileSheetOpen(true);
              }}
              className="w-full flex flex-col items-center cursor-pointer group"
              aria-label="เปิดศูนย์ข้อมูล"
            >
              <span className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors"></span>
            </button>

            {/* 4 Compact Segmented Status Badges */}
            <div className="grid grid-cols-4 gap-1">
              {/* ปกติ */}
              <button
                type="button"
                onClick={() => {
                  try { playSelectSound(); } catch (_) {}
                  setSeverityFilter(severityFilter === 'falling' ? 'all' : 'falling');
                }}
                className={`py-1 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                  severityFilter === 'falling'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                    : isDark ? 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="กรองเฉพาะจุดที่ระดับน้ำเริ่มลดลง"
              >
                <div className="text-[10px] font-medium leading-none text-slate-400 dark:text-slate-500">ปกติ/ลด</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{falling}</div>
              </button>

              {/* เฝ้าระวัง */}
              <button
                type="button"
                onClick={() => {
                  try { playSelectSound(); } catch (_) {}
                  setSeverityFilter((severityFilter === '1' || severityFilter === 'minor') ? 'all' : '1');
                }}
                className={`py-1 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                  (severityFilter === '1' || severityFilter === 'minor')
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : isDark ? 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="ระดับ 1: เฝ้าระวัง ผิวจราจร (<15 ซม.)"
              >
                <div className="text-[10px] font-medium leading-none text-slate-400 dark:text-slate-500">เฝ้าระวัง</div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{minor}</div>
              </button>

              {/* ปานกลาง */}
              <button
                type="button"
                onClick={() => {
                  try { playSelectSound(); } catch (_) {}
                  setSeverityFilter((severityFilter === '2' || severityFilter === 'moderate') ? 'all' : '2');
                }}
                className={`py-1 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                  (severityFilter === '2' || severityFilter === 'moderate')
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                    : isDark ? 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="ระดับ 2: ปานกลาง (15-30 ซม.)"
              >
                <div className="text-[10px] font-medium leading-none text-slate-400 dark:text-slate-500">ปานกลาง</div>
                <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-0.5">{moderate}</div>
              </button>

              {/* วิกฤต */}
              <button
                type="button"
                onClick={() => {
                  try { playSelectSound(); } catch (_) {}
                  setSeverityFilter((severityFilter === '3' || severityFilter === 'severe') ? 'all' : '3');
                }}
                className={`py-1 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                  (severityFilter === '3' || severityFilter === 'severe')
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : isDark ? 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
                title="ระดับ 3: วิกฤต (>30 ซม.)"
              >
                <div className="text-[10px] font-medium leading-none text-slate-400 dark:text-slate-500">วิกฤต</div>
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">{severe}</div>
              </button>
            </div>

            {/* Quick expandable telemetry strip */}
            <button
              type="button"
              onClick={() => {
                setMobileSheetTab('weather');
                setIsMobileSheetOpen(true);
              }}
              className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <CloudRain className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">
                  ฝนโอกาส {weather?.precipitationProbability ?? 0}% • {weather?.temperature ?? 30}°C
                </span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium shrink-0">
                <span>พยากรณ์ 6 อำเภอ & ค้นหา</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 2. Expanded Mode: Full Mobile Bottom Sheet */}
      {isMobileSheetOpen && (
        <div 
          className="md:hidden fixed inset-0 z-45 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsMobileSheetOpen(false)}
        >
          <div 
            className={`fixed inset-x-0 bottom-0 z-50 max-h-[84vh] h-[80vh] flex flex-col rounded-t-2xl border-t shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-300 select-none pb-[calc(env(safe-area-inset-bottom,0px)+8px)] ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="p-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">ศูนย์ข้อมูล & ควบคุม GIS</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">จ.สมุทรปราการ (6 อำเภอ)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
                aria-label="ปิดศูนย์ข้อมูล"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Tabs */}
            <div className="px-3 pt-2 shrink-0">
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setMobileSheetTab('overview')}
                  className={`py-1.5 rounded-md font-medium transition-all ${
                    mobileSheetTab === 'overview'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  จุดเสี่ยง ({displayPoints.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mobileSheetTab === 'weather') {
                      playModalOpenSound();
                      setIsOfficialModalOpen(true);
                      setIsMobileSheetOpen(false);
                    } else {
                      playTabSound();
                      setMobileSheetTab('weather');
                    }
                  }}
                  className={`py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                    mobileSheetTab === 'weather'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title="สภาพอากาศ (แตะซ้ำเพื่อเปิดพยากรณ์และเรดาร์ AI ฉบับเต็ม)"
                >
                  สภาพอากาศ
                </button>
                <button
                  type="button"
                  onClick={() => setMobileSheetTab('emergency')}
                  className={`py-1.5 rounded-md font-medium transition-all ${
                    mobileSheetTab === 'emergency'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  สายด่วน 1784
                </button>
              </div>
            </div>

            {/* Tab Contents (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar-thin">
              {/* TAB 1: OVERVIEW & SEARCH */}
              {mobileSheetTab === 'overview' && (
                <div className="space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหาจุดน้ำท่วม, ถนน, ซอย..."
                      className={`w-full pl-8 pr-8 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-slate-850 border-slate-750 text-white placeholder-slate-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        aria-label="ล้างคำค้นหา"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Horizontal District Filter Pills */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        เลือกอำเภอ (6 อำเภอ)
                      </span>
                      {selectedDistrict !== "ทั้งหมด" && (
                        <button
                          type="button"
                          onClick={() => {
                            try { playSelectSound(); } catch (_) {}
                            setSelectedDistrict("ทั้งหมด");
                            setFlyToLocation({ lat: 13.6000, lng: 100.6500, zoom: 11, ts: Date.now() });
                          }}
                          className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                        >
                          ดูทุกอำเภอ
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                      {['ทั้งหมด', ...SAMUT_PRAKAN_DISTRICTS_DATA.map(d => d.name)].map((dist) => {
                        const isSelected = selectedDistrict === dist;
                        return (
                          <button
                            key={dist}
                            type="button"
                            onClick={() => {
                              try { playSelectSound(); } catch (_) {}
                              setSelectedDistrict(dist);
                              if (dist === "ทั้งหมด") {
                                setFlyToLocation({ lat: 13.6000, lng: 100.6500, zoom: 11, ts: Date.now() });
                              } else {
                                const dData = SAMUT_PRAKAN_DISTRICTS_DATA.find(d => d.name === dist);
                                if (dData?.center) {
                                  setFlyToLocation({ lat: dData.center.lat, lng: dData.center.lng, zoom: 13, ts: Date.now() });
                                }
                              }
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : isDark
                                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {dist === 'ทั้งหมด' ? 'ทุกอำเภอ' : dist.replace(/^อ\./, '')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Severity Level Filter Badges (Quick Filter inside Sheet) */}
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        try { playSelectSound(); } catch (_) {}
                        setSeverityFilter(severityFilter === 'falling' ? 'all' : 'falling');
                      }}
                      className={`py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                        severityFilter === 'falling'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-medium leading-none">ปกติ/ลด</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{falling}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try { playSelectSound(); } catch (_) {}
                        setSeverityFilter((severityFilter === '1' || severityFilter === 'minor') ? 'all' : '1');
                      }}
                      className={`py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                        (severityFilter === '1' || severityFilter === 'minor')
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-medium leading-none">เฝ้าระวัง</div>
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{minor}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try { playSelectSound(); } catch (_) {}
                        setSeverityFilter((severityFilter === '2' || severityFilter === 'moderate') ? 'all' : '2');
                      }}
                      className={`py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                        (severityFilter === '2' || severityFilter === 'moderate')
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-medium leading-none">ปานกลาง</div>
                      <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-0.5">{moderate}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try { playSelectSound(); } catch (_) {}
                        setSeverityFilter((severityFilter === '3' || severityFilter === 'severe') ? 'all' : '3');
                      }}
                      className={`py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                        (severityFilter === '3' || severityFilter === 'severe')
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-medium leading-none">วิกฤต</div>
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">{severe}</div>
                    </button>
                  </div>

                  {/* Flood Corridor Quick Jump Chips */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      เส้นทางสัญจรสายหลัก
                    </span>
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                      {MAJOR_FLOOD_CORRIDORS.map(corridor => (
                        <button
                          key={corridor.id}
                          type="button"
                          onClick={() => {
                            setSearchQuery(corridor.name);
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] border font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                            searchQuery === corridor.name
                              ? 'bg-blue-600 text-white border-blue-600'
                              : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {corridor.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtered Points List */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>รายการจุดรายงาน ({displayPoints.length})</span>
                      {(severityFilter !== 'all' || selectedDistrict !== 'ทั้งหมด' || searchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSeverityFilter('all');
                            setSelectedDistrict('ทั้งหมด');
                            setSearchQuery('');
                          }}
                          className="text-blue-500 hover:underline cursor-pointer"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                    </div>

                    {displayPoints.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        <p>ไม่พบจุดรายงานตามเงื่อนไขที่เลือก</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSeverityFilter('all');
                            setSelectedDistrict('ทั้งหมด');
                            setSearchQuery('');
                          }}
                          className="mt-2 text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline"
                        >
                          รีเซ็ตการค้นหาและตัวกรอง
                        </button>
                      </div>
                    ) : (
                      displayPoints.map(pt => {
                        const lvl = resolveLevel(pt);
                        const isReceding = isWaterReceding(pt);
                        const hasPtPhoto = Boolean(pt.photoUrl || pt.photo_url || pt.photo || pt.image || pt.imageUrl);
                        return (
                          <div
                            key={pt.id}
                            onClick={() => {
                              handleSelectLocation(pt);
                              setIsMobileSheetOpen(false);
                            }}
                            className={`p-2.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer active:scale-[0.99] ${
                              isDark ? 'bg-slate-850/70 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                                    lvl === 3 ? 'bg-rose-500 animate-pulse ring-2 ring-rose-500/20' :
                                    lvl === 2 ? 'bg-orange-500 ring-2 ring-orange-500/20' :
                                    lvl === 1 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`} />
                                  <h4 className="text-xs font-bold truncate text-slate-900 dark:text-white">{pt.name}</h4>
                                  {hasPtPhoto && (
                                    <span className="text-[9px] px-1 py-0.2 rounded font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 shrink-0">
                                      📷
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">อ.{pt.district?.replace(/^อ\./, '')}</span>
                                  <span>•</span>
                                  <span className={`font-semibold ${
                                    lvl === 3 ? 'text-rose-600 dark:text-rose-400' :
                                    lvl === 2 ? 'text-orange-600 dark:text-orange-400' :
                                    'text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {pt.depthCm ? `ลึก ${pt.depthCm} ซม.` : (lvl === 3 ? 'น้ำท่วมสูง (>30 ซม.)' : lvl === 2 ? 'น้ำท่วมขัง (15-30 ซม.)' : 'ผิวจราจร (<15 ซม.)')}
                                  </span>
                                  {isReceding && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                      • น้ำลด
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
                                lvl === 3 ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' :
                                lvl === 2 ? 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400' :
                                'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                              }`}>
                                {lvl === 3 ? 'วิกฤต' : lvl === 2 ? 'ปานกลาง' : 'เฝ้าระวัง'}
                              </span>
                            </div>

                            {/* Vehicle Guidance & Navigation Pill */}
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                              <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                {lvl === 3 ? '🚫 รถเล็กห้ามผ่าน (เฉพาะยกสูง)' : lvl === 2 ? '⚠️ รถเก๋ง/เล็กควรเลี่ยง' : '✅ สัญจรได้ระมัดระวัง'}
                              </span>
                              <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0 flex items-center gap-1">
                                <Navigation2 className="w-3 h-3" />
                                <span>ดูข้อมูล & นำทาง</span>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: WEATHER 24H TELEMETRY */}
              {mobileSheetTab === 'weather' && (
                <div className="space-y-3">
                  {/* Current Snapshot Card */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-800/80 border-slate-750' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">สมุทรปราการ ปัจจุบัน</span>
                      <div className="text-2xl font-black mt-0.5">{weather?.temperature ?? 31}°C</div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {weather?.description || 'มีเมฆเป็นส่วนมาก มีฝนบางพื้นที่'}
                      </span>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <div className="flex items-center justify-end gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <CloudRain className="w-3.5 h-3.5" />
                        <span>โอกาสฝน {weather?.precipitationProbability ?? 30}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400">ความชื้น {weather?.humidity ?? 78}%</div>
                      <div className="text-[10px] text-slate-400">ลม {weather?.windSpeed ?? 14} กม./ชม.</div>
                    </div>
                  </div>

                  {/* 6 Districts Forecast List */}
                  <div>
                    <span className="text-xs font-bold block mb-1.5">
                      พยากรณ์ฝนรายอำเภอ (6 อำเภอ จ.สมุทรปราการ)
                    </span>
                    <div className="space-y-1.5">
                      {SAMUT_PRAKAN_DISTRICTS_DATA.map(d => {
                        const rainPercent = Math.min(95, Math.max(15, (weather?.precipitationProbability ?? 35) + ((d.name.length * 7) % 30) - 10));
                        return (
                          <div
                            key={d.name}
                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                              isDark ? 'bg-slate-850/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold block truncate">อ.{d.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-slate-200 dark:bg-slate-750 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      rainPercent >= 70 ? 'bg-rose-500' :
                                      rainPercent >= 40 ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${rainPercent}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-500">
                                  ฝน {rainPercent}%
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold">{weather?.temperature ?? 31}°C</span>
                              <span className="text-[10px] text-slate-400 block">ลม 12-16 กม./ชม.</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 24-Hour Timeline Preview */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOfficialModalOpen(true);
                        setIsMobileSheetOpen(false);
                      }}
                      className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>เปิดรายงานสภาพอากาศและการวิเคราะห์ AI ฉบับเต็ม</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: EMERGENCY & HOTLINES */}
              {mobileSheetTab === 'emergency' && (
                <div className="space-y-3">
                  {/* Hero Hotline Banner */}
                  <a
                    href="tel:1784"
                    className="p-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-between shadow-md transition-all active:scale-98 cursor-pointer border border-rose-700 block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-black">สายด่วนสาธารณภัย 1784</div>
                        <div className="text-[11px] text-rose-100">ศูนย์ป้องกันและบรรเทาสาธารณภัย (โทรฟรี 24 ชม.)</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-white/20 text-white font-mono font-bold text-xs shrink-0">
                      โทรทันที
                    </span>
                  </a>

                  {/* Quick Assistance Numbers */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      หน่วยงานฉุกเฉินและช่วยเหลือในพื้นที่
                    </span>

                    <a
                      href="tel:023874222"
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                        isDark ? 'bg-slate-850/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold block">สนง. ปภ. จังหวัดสมุทรปราการ</span>
                        <span className="text-[10px] text-slate-400">ประสานงานช่วยเหลือระดับจังหวัด</span>
                      </div>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">02-387-4222</span>
                    </a>

                    <a
                      href="tel:1669"
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                        isDark ? 'bg-slate-850/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold block">สถาบันการแพทย์ฉุกเฉินแห่งชาติ (กู้ชีพ)</span>
                        <span className="text-[10px] text-slate-400">เจ็บป่วยฉุกเฉินหรืออุบัติเหตุ</span>
                      </div>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">1669</span>
                    </a>

                    <a
                      href="tel:1193"
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                        isDark ? 'bg-slate-850/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold block">ตำรวจทางหลวง</span>
                        <span className="text-[10px] text-slate-400">สอบถามเส้นทางและเหตุด่วนบนทางหลวง</span>
                      </div>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">1193</span>
                    </a>

                    <a
                      href="tel:192"
                      className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                        isDark ? 'bg-slate-850/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold block">ศูนย์เตือนภัยพิบัติแห่งชาติ (NDWC)</span>
                        <span className="text-[10px] text-slate-400">รับแจ้งเตือนภัยพิบัติฉุกเฉิน</span>
                      </div>
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">192</span>
                    </a>
                  </div>

                  {/* Guide links */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsStandardsModalOpen(true);
                        setIsMobileSheetOpen(false);
                      }}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className="font-bold block">เกณฑ์ระดับน้ำ</span>
                        <span className="text-[9px] text-slate-400">คู่มือสัญจรปลอดภัย</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEmergencyModalOpen(true);
                        setIsMobileSheetOpen(false);
                      }}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <span className="font-bold block">เบอร์กู้ภัยทั้งหมด</span>
                        <span className="text-[9px] text-slate-400">รายอำเภอและสถานี</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. OFFICIAL PUBLIC INFORMATION DESK (CHATBOT) */}
      <ChatBot 
        points={[...points, ...citizenReports.filter(r => r.isApproved && !r.isResolved)]} 
        onSelectPoint={handleSelectLocation}
        theme={theme}
        weather={weather}
        isPointSelected={!!selectedPoint}
      />

      {/* 4. MODALS */}
      {/* Interactive Admin Verification Prompt Asking Admin Directly ("แต่หากมีผู้รายงานต้องถามฉัน") - Visible ONLY when logged in as Admin */}
      {isAdminAuthenticated && (
        <AdminVerificationPrompt 
          pendingReports={pendingCitizenReports}
          onApproveReport={handleApproveReport}
          onRejectReport={handleRejectReport}
          onFlyToCoords={handleFlyToCoords}
          onOpenFullAdmin={() => setIsAdminModalOpen(true)}
          theme={theme}
        />
      )}

      <PublicUpdatesModal 
        isOpen={isPublicUpdatesModalOpen}
        onClose={() => setIsPublicUpdatesModalOpen(false)}
        dailyUpdates={dailyUpdates}
        points={points}
        citizenReports={citizenReports}
        changelog={changelog}
        weather={weather}
        onSelectPoint={handleSelectLocation}
        lastUpdatedTime={lastUpdatedTime}
        lastUpdatedTimeDetailed={lastUpdatedTimeDetailed}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshingData}
        latestAnnouncement={latestAnnouncement}
        theme={theme}
      />

      {/* OFFICIAL ADMIN ANNOUNCEMENT MODAL (สามารถกดดูประกาศทางการอีกครั้งได้ตลอดเวลา) */}
      {isAnnouncementModalOpen && latestAnnouncement && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) { playCloseSound(); setIsAnnouncementModalOpen(false); } }}
          className="fixed inset-0 z-[105] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 smooth-backdrop pointer-events-auto overflow-hidden"
        >
          <div className={`w-full max-w-[420px] sm:max-w-md border-2 rounded-2xl shadow-2xl p-3.5 sm:p-5 flex flex-col max-h-[82vh] sm:max-h-[86vh] overflow-hidden smooth-pop transition-all ${
            isDark 
              ? 'bg-slate-900 border-amber-500/50 text-slate-100 shadow-2xl shadow-black/80' 
              : 'bg-white border-amber-400 text-slate-900 shadow-2xl shadow-slate-900/30'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-2 pb-2 sm:pb-2.5 border-b border-amber-500/30 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm">
                  <Bell className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 truncate">
                    ประกาศจากเจ้าหน้าที่
                  </h3>
                  <span className="text-[10px] sm:text-[10px] text-slate-400 block">
                    PrakanGuard Official
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCloseSound();
                  setIsAnnouncementModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer transition-colors active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-2 px-0.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                <span className="truncate">
                  พื้นที่: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                    {latestAnnouncement.districts?.length ? latestAnnouncement.districts.join(', ') : 'ทุกอำเภอ (จ.สมุทรปราการ)'}
                  </strong>
                </span>
                {latestAnnouncement.created_at && (
                  <span className="shrink-0 font-mono">
                    {new Date(latestAnnouncement.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                  </span>
                )}
              </div>

              <div className="text-[11px] sm:text-sm font-medium leading-relaxed whitespace-pre-line p-2 sm:p-3 rounded-xl border bg-amber-500/5 border-amber-500/20 text-slate-800 dark:text-slate-100 break-words">
                {latestAnnouncement.message}
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                playCloseSound();
                setIsAnnouncementModalOpen(false);
              }}
              className="w-full mt-1.5 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] sm:text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}

      <AdminModal 
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        citizenReports={citizenReports}
        points={points}
        feedbackItems={feedbackItems}
        onApproveReport={handleApproveReport}
        onRejectReport={handleRejectReport}
        onResolveReport={handleResolveReport}
        onUpdateReport={handleUpdateReport}
        onAddAdminBroadcast={handleAddAdminBroadcast}
        onAddPoint={handleAddPoint}
        onUpdatePoint={handleUpdatePoint}
        onDeletePoint={handleDeletePoint}
        onImportPoints={handleImportPoints}
        onResetPoints={handleResetPoints}
        onToggleFeedbackRead={handleToggleFeedbackRead}
        onDeleteFeedback={handleDeleteFeedback}
        onMarkAllFeedbackRead={handleMarkAllFeedbackRead}
        onClearReadFeedback={handleClearReadFeedback}
        onFlyToCoords={handleFlyToCoords}
        onPickLocationOnMap={() => handleStartPickOnMap('admin')}
        pickedCoords={pickedCoords}
        isAdminAuthenticated={isAdminAuthenticated}
        onAuthChange={setIsAdminAuthenticated}
        onSyncCloudData={handleManualSyncCloudData}
        onOpenPrivacyPolicy={() => setIsPrivacyPolicyModalOpen(true)}
        theme={theme}
      />

      <CitizenReportModal 
        isOpen={isCitizenReportModalOpen}
        onClose={() => setIsCitizenReportModalOpen(false)}
        onSubmitReport={handleAddCitizenReport}
        onStartPickOnMap={handleStartPickOnMap}
        pickedCoords={pickedCoords}
        onFlyToCoords={handleFlyToCoords}
        userLocation={userLocation}
        theme={theme}
      />

      {/* Real-time Alert Toast Notification for Admin when new reports arrive */}
      {isAdminAuthenticated && adminAlertToast && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300 pointer-events-auto max-w-md w-[92vw]">
          <div className={`p-3.5 sm:p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-900/98 border-amber-500 text-white shadow-amber-500/20' : 'bg-white border-amber-400 text-slate-900 shadow-xl'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 animate-bounce">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-amber-500 block uppercase tracking-wider">
                  🚨 มีรายงานสถานการณ์ใหม่เข้ามา!
                </span>
                <h4 className="text-xs sm:text-sm font-bold truncate">
                  {adminAlertToast.name}
                </h4>
                <span className="text-[10px] text-slate-400 block truncate">
                  อ.{adminAlertToast.district} • {adminAlertToast.levelLabel} ({adminAlertToast.time})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAdminModalOpen(true);
                  setAdminAlertToast(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all"
              >
                ตรวจสอบ
              </button>
              <button
                type="button"
                onClick={() => setAdminAlertToast(null)}
                className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer ${
                  isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
                title="ปิดการแจ้งเตือน"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        theme={theme}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />

      <WelcomeModal 
        isOpen={isWelcomeModalOpen}
        onClose={() => {
          setIsWelcomeModalOpen(false);
        }}
        onEnterWebsite={handleEnterWebsite}
        theme={theme}
      />

      <AiForecastModal 
        isOpen={isOfficialModalOpen} 
        onClose={() => setIsOfficialModalOpen(false)}
        userDistrict={userDistrict}
        theme={theme}
      />

      <FloodStandardsModal 
        isOpen={isStandardsModalOpen} 
        onClose={() => setIsStandardsModalOpen(false)}
        theme={theme}
      />

      <EmergencyModal 
        isOpen={isEmergencyModalOpen} 
        onClose={() => setIsEmergencyModalOpen(false)}
        theme={theme}
      />

      <PrivacyPolicyModal 
        isOpen={isPrivacyPolicyModalOpen} 
        onClose={() => setIsPrivacyPolicyModalOpen(false)} 
        theme={theme} 
      />

      {/* 4. MOBILE BOTTOM ACTION BAR (สำหรับมือถือ ใช้งานสะดวกด้วยนิ้วโป้ง ไม่ซับซ้อน) */}
      <MobileBottomNav
        onLocateMe={handleLocateMe}
        onOpenAiForecast={() => setIsOfficialModalOpen(true)}
        onOpenCitizenReport={() => setIsCitizenReportModalOpen(true)}
        onOpenPublicUpdates={() => setIsPublicUpdatesModalOpen(true)}
        onOpenAnnouncement={() => setIsAnnouncementModalOpen(true)}
        hasAnnouncement={Boolean(latestAnnouncement)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        onOpenStandards={() => setIsStandardsModalOpen(true)}
        onOpenPrivacyPolicy={() => setIsPrivacyPolicyModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onToggleTheme={toggleTheme}
        hasGps={!!userLocation}
        theme={theme}
        onToggleSearch={() => {
          setMobileSheetTab('overview');
          setIsMobileSheetOpen(v => !v);
        }}
        isSearchOpen={isMobileSheetOpen}
      />


    </div>
  );
}
