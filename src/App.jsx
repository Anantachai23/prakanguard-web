import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
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
import AutoMarquee from './components/AutoMarquee';
import ChatBot from './components/ChatBot';
import { INITIAL_FLOOD_POINTS, DISTRICTS, matchesLocationSearch, scoreLocationSearch, POPULAR_SEARCH_SUGGESTIONS, findCorridorForPoint, MAJOR_FLOOD_CORRIDORS } from './data/samutPrakanPoints';
import { SAMUT_PRAKAN_DISTRICTS_DATA } from './data/samutPrakanDistricts';
import { getFloodLevel, FLOOD_STANDARDS } from './data/floodStandards';
import { detectDistrictForCoordinates } from './data/samutPrakanBoundary';
import { getOfficialAdvisorySummary } from './services/aiPredictor';
import { getLiveSamutPrakanWeather } from './services/weatherService';
import { runOfficial24HourSync } from './services/aiSentryService';
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
  Compass
} from 'lucide-react';

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
      const saved = localStorage.getItem('prakanguard_points_state_v4');
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
                  depthCm: initPoint.waterTrend === 'falling' ? initPoint.depthCm : (item.depthCm !== undefined ? item.depthCm : initPoint.depthCm),
                  trafficStatus: initPoint.waterTrend === 'falling' ? initPoint.trafficStatus : (item.trafficStatus || initPoint.trafficStatus),
                  statusLabel: initPoint.waterTrend === 'falling' ? initPoint.statusLabel : (item.statusLabel || initPoint.statusLabel),
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
            if (!parsedIds.has(ip.id)) {
              const lvl = getFloodLevel(ip.depthCm);
              const detectedDist = detectDistrictForCoordinates(ip.lat, ip.lng);
              list.push({
                ...ip,
                district: detectedDist || ip.district,
                level: lvl,
                depthRange: lvl === 3 ? '> 50 ซม.' : lvl === 2 ? '21 - 50 ซม.' : '5 - 20 ซม.'
              });
            }
          });

          return list;
        }
      }
    } catch (e) {}
    return INITIAL_FLOOD_POINTS.map(p => {
      const lvl = getFloodLevel(p.depthCm);
      const detectedDist = detectDistrictForCoordinates(p.lat, p.lng);
      return {
        ...p,
        district: detectedDist || p.district,
        level: lvl,
        depthRange: lvl === 3 ? '> 50 ซม.' : lvl === 2 ? '21 - 50 ซม.' : '5 - 20 ซม.'
      };
    });
  });

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
  const [lightboxPhoto, setLightboxPhoto] = useState(null); // { url, title, time }

  // Expose global lightbox opener for Leaflet map popup clicks
  useEffect(() => {
    window.pgOpenLightbox = (url, title, time) => {
      setLightboxPhoto({ url, title, time });
    };
    return () => {
      delete window.pgOpenLightbox;
    };
  }, []);

  useEffect(() => {
    pointsRef.current = points;
    try {
      localStorage.setItem('prakanguard_points_state_v4', JSON.stringify(points));
    } catch (e) {}
  }, [points]);

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
  const [isTopPanelCollapsed, setIsTopPanelCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  );

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
    const interval = setInterval(syncContinuousWeather, 30000); // อัปเดตสภาพอากาศสดทุก 30 วินาที
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Welcome Announcement Modal (ปิดเป็นค่าเริ่มต้น เพื่อไม่ให้รกหน้าจอเมื่อเปิดเข้ามา)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  // GPS User Location
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);

  // Modals state
  const [isOfficialModalOpen, setIsOfficialModalOpen] = useState(false);
  const [isStandardsModalOpen, setIsStandardsModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Citizen Reports State (Persisted in localStorage)
  // Ensures only genuine citizen and admin reports exist with valid coordinates
  const [citizenReports, setCitizenReports] = useState(() => {
    try {
      const saved = localStorage.getItem('prakanguard_citizen_reports');
      const parsed = saved ? JSON.parse(saved) : [];
      const cleaned = (Array.isArray(parsed) ? parsed : []).filter(r => 
        r && 
        r.id && 
        !r.id.includes('test') &&
        !r.id.includes('verify') &&
        !r.id.startsWith('node-') &&
        !r.isAiGenerated && 
        !r.id?.startsWith('ai-alert-') &&
        typeof r.lat === 'number' &&
        !isNaN(r.lat) &&
        typeof r.lng === 'number' &&
        !isNaN(r.lng)
      );
      if (cleaned.length !== (parsed ? parsed.length : 0)) {
        try {
          localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(cleaned));
        } catch (e) {}
      }
      return cleaned;
    } catch (e) {
      return [];
    }
  });

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



  // 24/7 Official Hydro-Meteorological Telemetry Sync (TMD, Navy Hydrographic Dept, DDPM)
  const [telemetrySyncStatus, setTelemetrySyncStatus] = useState({
    isActive: true,
    lastSyncTime: 'พร้อมทำงาน',
    isSyncing: false,
    alertBadge: '🟢 เฝ้าระวังปกติ (24 ชม.)'
  });

  const citizenReportsRef = useRef(citizenReports);
  useEffect(() => {
    citizenReportsRef.current = citizenReports;
  }, [citizenReports]);

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
        if (lifecycleResult.notificationMessage) {
          setLatestUpdateNotification(lifecycleResult.notificationMessage);
        } else {
          setLatestUpdateNotification(`📡 อัปเดตข้อมูลสภาพอากาศและเรดาร์สดจาก TMD / กองทัพเรือ สำเร็จ (${nowTime})`);
        }
        setTimeout(() => setLatestUpdateNotification(null), 7000);

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
        setLastUpdatedTime(telemetryReport.syncTime);

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
          if (lifecycleResult.notificationMessage) {
            setLatestUpdateNotification(lifecycleResult.notificationMessage);
            setTimeout(() => setLatestUpdateNotification(null), 9000);
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

    executeBackgroundSync();
    const interval = setInterval(executeBackgroundSync, 30 * 1000); // ซิงก์ข้อมูลอ้างอิงจากแหล่งข้อมูลสดทุก 30 วินาที ตลอด 24 ชม. อัตโนมัติ

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
      if (isCitizenReportModalOpen) return 'แบบฟอร์มแจ้งจุดท่วม';
      if (isFeedbackModalOpen) return 'กล่องข้อเสนอแนะ';
      if (isOfficialModalOpen) return 'เรดาร์ฝนและพยากรณ์';
      if (isStandardsModalOpen) return 'เกณฑ์ระดับน้ำ';
      if (isPublicUpdatesModalOpen) return 'อัปเดตสดสถานการณ์';
      if (isEmergencyModalOpen) return 'สายด่วนฉุกเฉิน 1784';
      if (isAdminModalOpen) return 'ศูนย์บัญชาการแอดมิน';
      return 'หน้าหลัก (แผนที่)';
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
              if (!isValidReport(cr)) return;
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
                  prevMap.set(cr.id, { ...existing, ...cr });
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
        if (!isValidReport(incomingReport)) return;
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
          const resolvedLevel = incomingReport.bodyLevelLabel || (incomingReport.level === 3 || incomingReport.severity === 3 ? 'วิกฤต' : incomingReport.level === 2 || incomingReport.severity === 2 ? 'ปานกลาง' : 'ปกติ');
          setAdminAlertToast({
            id: incomingReport.id,
            name: incomingReport.name,
            levelLabel: isHail ? `🧊 ${incomingReport.hailSizeLabel || 'ลูกเห็บตก'}` : `ระดับ${resolvedLevel}`,
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
        if (lifecycleResult.notificationMessage) {
          setLatestUpdateNotification(lifecycleResult.notificationMessage);
        } else {
          setLatestUpdateNotification(`🔄 ซิงก์ข้อมูลสภาพอากาศและสถานการณ์น้ำท่วมล่าสุดสำเร็จ (อัปเดตเมื่อ ${nowTime})`);
        }
        setTimeout(() => setLatestUpdateNotification(null), 7000);

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
            if (isValidReport(cr)) {
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
    setSelectedPoint(broadcast);
    setFlyToLocation({ lat: broadcast.lat, lng: broadcast.lng });
    setLastUpdatedTime(broadcast.reportedAt);
  };

  // Handle New Citizen Report Submission (Hold in pending queue for admin review)
  const handleAddCitizenReport = (newReport) => {
    setCitizenReports(prev => {
      const updated = [newReport, ...prev.filter(r => r.id !== newReport.id)];
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage quota exceeded", e);
      }
      return updated;
    });

    // Notify Cloud Pub/Sub immediately so Admin on any device receives it!
    publishCloudReport(newReport);
    playNotificationChime();

    // Notify the admin owner immediately (only if logged in as Admin)
    if (isAdminAuthenticated) {
      const isHail = newReport.hazardType === 'hail';
      const resolvedLevel = newReport.bodyLevelLabel || (newReport.level === 3 || newReport.severity === 3 ? 'วิกฤต' : newReport.level === 2 || newReport.severity === 2 ? 'ปานกลาง' : 'ปกติ');
      setAdminAlertToast({
        id: newReport.id,
        name: newReport.name,
        levelLabel: isHail ? `🧊 ${newReport.hailSizeLabel || 'ลูกเห็บตก'}` : `ระดับ${resolvedLevel}`,
        district: newReport.district,
        time: newReport.reportedAt
      });
    }

    setLatestUpdateNotification(`📍 บันทึกรายงานจุดน้ำท่วม "${newReport.name}" เรียบร้อยแล้ว ขอบคุณที่ร่วมแจ้งข้อมูลครับ`);
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
  const handleApproveReport = (id, shouldBroadcast = true) => {
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    let approvedPoint = null;
    setCitizenReports(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          approvedPoint = { ...r, isApproved: true, approvedAt: timeStr };
          return approvedPoint;
        }
        return r;
      });
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setAdminAlertToast(null);
    setLastUpdatedTime(timeStr);
    if (approvedPoint) {
      setSelectedPoint(approvedPoint);
      setFlyToLocation({ lat: approvedPoint.lat, lng: approvedPoint.lng });
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
    setCitizenReports(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          return { ...r, isResolved: true, resolvedAt: timeStr };
        }
        return r;
      });
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setLastUpdatedTime(timeStr);
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
        localStorage.setItem('prakanguard_points_state_v4', JSON.stringify(updated));
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
        localStorage.setItem('prakanguard_points_state_v4', JSON.stringify(updated));
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
        localStorage.setItem('prakanguard_points_state_v4', JSON.stringify(updated));
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
        localStorage.setItem('prakanguard_points_state_v4', JSON.stringify(updated));
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
        depthRange: lvl === 3 ? '> 50 ซม.' : lvl === 2 ? '21 - 50 ซม.' : '5 - 20 ซม.'
      };
    });
    setPoints(defaultPoints);
    try {
      localStorage.setItem('prakanguard_points_state_v4', JSON.stringify(defaultPoints));
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

  const handleFlyToCoords = (lat, lng) => {
    setFlyToLocation({ lat, lng });
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

  // 1. Official Points shown on Map (filtered by district & severity, excludes dried-up points)
  const mapPoints = useMemo(() => {
    return points.filter(point => {
      if (isPointDryOrResolved(point)) return false;
      const matchDistrict = selectedDistrict === "ทั้งหมด" || point.district === selectedDistrict;
      let matchSeverity = true;
      if (severityFilter === "all") {
        matchSeverity = true;
      } else if (severityFilter === "falling") {
        matchSeverity = point.waterTrend === 'falling';
      } else {
        matchSeverity = point.level.toString() === severityFilter;
      }
      return matchDistrict && matchSeverity;
    });
  }, [points, selectedDistrict, severityFilter]);

  // 2. Citizen Reports shown on Map (requires explicit Admin Approval, excludes dried-up points)
  const mapCitizenReports = useMemo(() => {
    return citizenReports.filter(report => {
      if (!report || report.isApproved !== true || isPointDryOrResolved(report)) return false;
      if (report.id && (report.id.includes('test') || report.id.includes('verify') || report.id.startsWith('node-'))) return false;
      const matchDistrict = selectedDistrict === "ทั้งหมด" || report.district === selectedDistrict;
      let matchSeverity = true;
      if (severityFilter === "all") {
        matchSeverity = true;
      } else if (severityFilter === "falling") {
        matchSeverity = report.waterTrend === 'falling';
      } else {
        matchSeverity = report.level.toString() === severityFilter;
      }
      return matchDistrict && matchSeverity;
    });
  }, [citizenReports, selectedDistrict, severityFilter]);

  // 3. Search Results for Official Points (searches ALL districts and severities, excludes dry)
  const searchResultsOfficial = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return points
      .filter(point => {
        if (isPointDryOrResolved(point)) return false;
        return matchesLocationSearch(point, searchQuery);
      })
      .sort((a, b) => scoreLocationSearch(b, searchQuery) - scoreLocationSearch(a, searchQuery));
  }, [points, searchQuery]);

  // 4. Search Results for Citizen Reports (searches ALL districts and severities, excludes dry)
  const searchResultsCitizen = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return citizenReports
      .filter(report => {
        if (!report || report.isApproved !== true || isPointDryOrResolved(report)) return false;
        if (report.id && (report.id.includes('test') || report.id.includes('verify') || report.id.startsWith('node-'))) return false;
        return matchesLocationSearch(report, searchQuery);
      })
      .sort((a, b) => scoreLocationSearch(b, searchQuery) - scoreLocationSearch(a, searchQuery));
  }, [citizenReports, searchQuery]);

  // Unified Handler: Select location & zoom smoothly into that point on the map
  const handleSelectLocation = (location) => {
    if (!location) {
      setSelectedPoint(null);
      return;
    }

    // Ensure district filter does not hide this point on the map
    if (selectedDistrict !== "ทั้งหมด" && location.district && selectedDistrict !== location.district) {
      setSelectedDistrict("ทั้งหมด");
    }

    // Ensure severity filter does not hide this point on the map
    if (severityFilter !== "all" && location.level && location.level.toString() !== severityFilter) {
      setSeverityFilter("all");
    }

    setSelectedPoint(location);
    // บนมือถือ: default แสดงแบบย่อ (minimized) ก่อน ผู้ใช้กดเพื่อดูรายละเอียด
    const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640;
    setIsDetailMinimized(isMobileView);

    setFlyToLocation({
      lat: location.lat,
      lng: location.lng,
      zoom: 16.5,
      pointId: location.id,
      ts: Date.now()
    });

    setIsSearchFocused(false);
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

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

  // Identify which district the user is currently located in strictly based on GeoJSON polygon boundaries
  const userDistrict = useMemo(() => {
    if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
      return null;
    }
    // 1. Ray-casting check against exact 6-district GeoJSON polygon boundaries on map
    const boundaryDistrict = detectDistrictForCoordinates(userLocation.lat, userLocation.lng);
    return boundaryDistrict || null;
  }, [userLocation]);

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

  // Auto-request location on website entry across all devices (Mobile, iPad, Desktop)
  useEffect(() => {
    handleLocateMe(true);
  }, []);

  return (
    <div className={`fixed inset-0 h-full w-full flex flex-col font-prompt selection:bg-blue-600 selection:text-white overflow-hidden overscroll-none select-none transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* 1. TOP NAVBAR (Theme Switchable & AutoMarquee) */}
      <Navbar 
        points={points} 
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
        lastUpdatedTime={lastUpdatedTime}
        lastUpdatedTimeDetailed={lastUpdatedTimeDetailed}
        pendingReportsCount={isAdminAuthenticated ? pendingReportsCount : 0}
      />

      {/* 2. MAIN MAP CANVAS */}
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
          />
        </div>

        {/* Floating Instruction Banner when User is Picking Location on Map */}
        {isPickingLocationOnMap && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-cyan-500/50 backdrop-blur-xl flex items-center gap-3 pointer-events-auto">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shrink-0"></span>
            <div className="text-xs sm:text-sm">
              <strong className="block text-cyan-300 font-bold">📍 โหมดแตะเลือกจุดบนแผนที่</strong>
              <span className="text-slate-200">แตะบนถนนหรือพิกัดที่พบน้ำท่วมเพื่อบันทึกจุด</span>
            </div>
            <button 
              onClick={handleCancelPickOnMap}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer ml-2 shrink-0 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        )}

        {/* Floating Notification for Admin when Citizen submits new flood reports (Visible ONLY to Logged-in Admin) */}
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



        {/* Floating Toast Notification — ขึ้นใต้ Navbar ไม่ซ้อนทับ */}
        {latestUpdateNotification && (
          <div className={`fixed top-[58px] sm:top-[72px] left-1/2 -translate-x-1/2 z-[85] text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 w-auto max-w-[92vw] sm:max-w-lg pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-300 border ${
            latestUpdateNotification.includes('⚠️') || latestUpdateNotification.includes('ไม่ได้อยู่ใน')
              ? 'bg-amber-700/98 border-amber-300 shadow-amber-900/50'
              : 'bg-emerald-600/98 border-emerald-300 shadow-emerald-900/50'
          }`}>
            {latestUpdateNotification.includes('⚠️') || latestUpdateNotification.includes('ไม่ได้อยู่ใน') ? (
              <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold leading-snug">{latestUpdateNotification}</span>
            <button
              onClick={() => setLatestUpdateNotification(null)}
              className="p-1 hover:bg-white/20 rounded-lg text-white/90 cursor-pointer ml-auto shrink-0"
              title="ปิดการแจ้งเตือน"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Out of Province Warning Banner (เมื่อ GPS ระบุได้ว่าอยู่นอกพื้นที่ จ.สมุทรปราการ) */}
        {userLocation && !userDistrict && (
          <div className="fixed top-[58px] sm:top-[72px] left-1/2 -translate-x-1/2 z-[80] w-auto max-w-[94vw] sm:max-w-md pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-amber-950/95 text-amber-200 border border-amber-500/50 shadow-xl backdrop-blur-xl">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
              <div className="flex-1 min-w-0 text-xs">
                <span className="font-bold block text-white">ตำแหน่งท่านไม่ได้อยู่ในจังหวัดสมุทรปราการ</span>
                <span className="text-[10px] text-amber-300/80">ระบบติดตามและรายงานครอบคลุม 6 อำเภอ จ.สมุทรปราการ</span>
              </div>
              <button
                onClick={() => {
                  setSelectedDistrict('ทั้งหมด');
                  setFlyToLocation({ lat: 13.6000, lng: 100.6500, zoom: 11, ts: Date.now() });
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[10px] font-bold shrink-0 cursor-pointer active:scale-95 transition-all"
              >
                ดูสมุทรปราการ
              </button>
            </div>
          </div>
        )}

        {/* Active District Mobile Indicator with Quick Reset (กดครั้งเดียวกลับดูทั้งจังหวัด ไม่สับสน) */}
        {selectedDistrict !== 'ทั้งหมด' && isTopPanelCollapsed && (
          <div className="sm:hidden absolute top-2.5 right-14 z-20 pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-blue-600/95 text-white shadow-lg border border-blue-400 text-xs font-bold animate-in fade-in">
            <span className="truncate max-w-[120px]">📍 {selectedDistrict.replace(/^อ\./, '').replace('เมืองสมุทรปราการ', 'เมือง')}</span>
            <button
              onClick={() => setSelectedDistrict('ทั้งหมด')}
              className="px-1.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] cursor-pointer"
              title="ล้างตัวกรองอำเภอ กลับสู่มุมมองรวม"
            >
              ✕ ดูทั้งหมด
            </button>
          </div>
        )}

        {/* Toggle Button to RE-OPEN the collapsed panel (Appears docked at top-left when collapsed) */}
        {isTopPanelCollapsed && (
          <button
            onClick={() => setIsTopPanelCollapsed(false)}
            className={`absolute top-2.5 sm:top-3 left-2.5 sm:left-4 z-20 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl shadow-xl border text-xs font-bold backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-slate-900/95 text-slate-100 border-slate-700 hover:border-blue-500' 
                : 'bg-white/95 text-slate-800 border-slate-200 hover:border-blue-500'
            }`}
            title="คลิกเพื่อขยายแถบค้นหาและตัวกรองอำเภอ"
          >
            <PanelLeftOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-xs font-bold">
              {selectedDistrict === 'ทั้งหมด' ? 'ค้นหา / กรอง' : selectedDistrict.replace(/^อ\./, '').replace('เมืองสมุทรปราการ','เมือง')}
            </span>
          </button>
        )}

        {/* FLOATING TOP BAR: SEARCH, TICKER & DISTRICT PILLS */}
        <div className={`absolute top-2.5 sm:top-3 left-2.5 sm:left-4 right-2.5 sm:right-auto z-20 flex flex-col gap-2 w-auto sm:w-[350px] md:w-[340px] lg:w-[380px] xl:w-[420px] pointer-events-none transition-all duration-300 ease-in-out ${
          isTopPanelCollapsed ? '-translate-x-[120%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        }`}>
          
          {/* Quick Search Bar (Clean & Focused, Share Removed) */}
          <div ref={searchContainerRef} className="pointer-events-auto flex items-center gap-1.5 relative">
            <div className="relative flex-1">
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
                className={`w-full text-xs sm:text-sm pl-9 pr-8 py-2 rounded-2xl border shadow-md focus:outline-none transition-colors backdrop-blur-md font-medium ${
                  isDark 
                    ? 'bg-slate-900/95 text-slate-100 border-slate-700 placeholder-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-900/50' 
                    : 'bg-white/95 text-slate-800 border-slate-300 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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

              {/* Instant Search Suggestions & Popular Colloquial Shortcuts Dropdown */}
              {isSearchFocused && (
                <div className={`absolute top-full left-0 right-0 mt-1 border rounded-2xl shadow-2xl max-h-72 overflow-y-auto z-50 p-2 text-xs backdrop-blur-xl ${
                  isDark ? 'bg-slate-900/98 border-slate-700 text-slate-100 shadow-slate-950/80' : 'bg-white/98 border-slate-200 text-slate-800 shadow-slate-400/40'
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
                            className={`w-full p-2.5 rounded-xl cursor-pointer border transition-all text-left flex flex-col justify-between select-none active:scale-[0.98] ${
                              isDark 
                                ? 'bg-slate-800/80 hover:bg-blue-900/40 border-slate-700/80 hover:border-blue-500/60 text-slate-200' 
                                : 'bg-slate-50 hover:bg-blue-50 border-slate-200/80 hover:border-blue-300 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-bold text-xs truncate">{item.label}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                                isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {item.district.replace(/^อ\./, '').replace('เมืองสมุทรปราการ', 'เมือง')}
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
                            className="px-2.5 py-1 rounded-lg text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-400/20 font-medium transition-colors cursor-pointer active:scale-95"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                      {/* Official points */}
                      {searchResultsOfficial.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectLocation(p)}
                          className={`w-full p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors text-left select-none active:scale-[0.98] ${
                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-blue-50 text-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className={`font-bold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</span>
                            <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {p.district.replace(/^อ\./, '')} • {p.depthRange} {p.aliases ? `• ${p.aliases.slice(0, 3).join(', ')}` : ''}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                            p.level === 3 ? (isDark ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-rose-100 text-rose-800') :
                            p.level === 2 ? (isDark ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800') : 
                            (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800')
                          }`}>
                            {p.statusLabel}
                          </span>
                        </button>
                      ))}

                      {/* Citizen reports */}
                      {searchResultsCitizen.map(cr => (
                        <button
                          key={cr.id}
                          type="button"
                          onClick={() => handleSelectLocation(cr)}
                          className={`w-full p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors border-t border-dashed text-left select-none active:scale-[0.98] ${
                            isDark ? 'hover:bg-blue-950/50 text-slate-200 border-slate-800' : 'hover:bg-blue-50 text-slate-800 border-slate-100'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className={`font-bold flex items-center gap-1 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                              <span>💧 {cr.name}</span>
                            </span>
                            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cr.district.replace(/^อ\./, '')} • ระดับ{cr.bodyLevelLabel}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/80 dark:text-cyan-300 dark:border-blue-800`}>
                            ภาคประชาชน
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapse Side Button (Icon Only with Folding Symbol) */}
            <button
              onClick={() => setIsTopPanelCollapsed(true)}
              className={`p-2 sm:p-2.5 rounded-2xl border shadow-md flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl shrink-0 group ${
                isDark 
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-blue-500/50' 
                  : 'bg-white/90 hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:border-blue-400'
              }`}
              title="ย่อแถบเมนู (พับเก็บเข้าด้านข้าง)"
              aria-label="ย่อแถบเมนู"
            >
              <PanelLeftClose className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-blue-500" />
            </button>
          </div>

          {/* 24-HOUR RAIN FORECAST & LIVE METEOROLOGICAL TELEMETRY CARD (ซ่อนบนมือถือตามสั่ง ให้เหลือแค่ด้านล่าง/เปิดดูได้บนจอใหญ่) */}
          <div className="pointer-events-auto w-full hidden sm:block">
            <RainForecast24hCard
              forecast={weather?.forecast24h}
              userDistrict={userDistrict}
              userLocation={userLocation}
              onOpenRadar={() => setIsOfficialModalOpen(true)}
              theme={theme}
              collapsible={true}
              defaultExpanded={typeof window !== 'undefined' ? window.innerWidth >= 768 : false}
              onManualSync={handleManualSync}
              isSyncing={telemetrySyncStatus?.isSyncing}
              onOpenPublicUpdates={() => setIsPublicUpdatesModalOpen(true)}
              lastUpdatedTime={lastUpdatedTime}
            />
          </div>

          {/* Nearest Spot to GPS (Appears when GPS active) */}
          {nearestPointInfo && (
            <div 
              onClick={() => handleSelectLocation(nearestPointInfo.point)}
              className={`pointer-events-auto text-[11px] sm:text-xs px-3 py-1.5 rounded-2xl border shadow-xs flex items-center justify-between gap-2 cursor-pointer transition-all backdrop-blur-md ${
                isDark 
                  ? 'bg-blue-950/70 hover:bg-blue-900/70 border-blue-800/80 text-blue-200' 
                  : 'bg-blue-50/90 hover:bg-blue-100/90 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Navigation2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">
                  จุดเสี่ยงใกล้คุณ: <strong>{nearestPointInfo.point.name}</strong> (~{nearestPointInfo.distanceKm} กม.)
                </span>
              </div>
              <span className="text-[10px] text-blue-500 font-bold shrink-0 underline">
                ดูข้อมูล
              </span>
            </div>
          )}

          {/* District Dropdown Selector (แถบเลือกอำเภอแบบกดแถบลงมาตามรูปที่ 2 พร้อมระบุตำแหน่ง) */}
          <div className="pointer-events-auto flex items-center gap-1.5 w-full max-w-full">
            <div className={`relative flex-1 min-w-0 flex items-center px-3 py-2 rounded-2xl border shadow-md backdrop-blur-xl transition-colors ${
              isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
            }`}>
              <MapPin className="w-4 h-4 text-blue-500 shrink-0 mr-2" />
              <select
                value={selectedDistrict}
                onChange={(e) => {
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
                className={`w-full bg-transparent text-xs sm:text-sm font-bold focus:outline-hidden cursor-pointer appearance-none ${
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
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 pointer-events-none ml-1" />
            </div>

            {/* User GPS Location Badge (ระบุว่าอยู่อำเภอไหน) */}
            {userLocation ? (
              <div 
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold shadow-md backdrop-blur-xl ${
                  userDistrict 
                    ? (isDark ? 'bg-blue-950/90 border-blue-800 text-cyan-300' : 'bg-blue-50/95 border-blue-200 text-blue-900')
                    : (isDark ? 'bg-amber-950/90 border-amber-800 text-amber-300' : 'bg-amber-50/95 border-amber-200 text-amber-900')
                }`}
                title="ตำแหน่งปัจจุบันของคุณ"
              >
                <Compass className="w-3.5 h-3.5 text-blue-500 animate-spin-slow shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">
                  {userDistrict ? `คุณอยู่: อ.${userDistrict.replace('เมืองสมุทรปราการ', 'เมือง')}` : 'อยู่นอกสมุทรปราการ'}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleLocateMe(false)}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-2xl border text-[11px] sm:text-xs font-semibold shadow-md backdrop-blur-xl cursor-pointer active:scale-95 transition-all ${
                  isDark ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100/95 border-slate-200 text-slate-700 hover:text-slate-900'
                }`}
                title="กดเพื่อแชร์ตำแหน่ง GPS และดูว่าคุณอยู่อำเภอไหน"
              >
                <Navigation2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>ระบุตำแหน่ง</span>
              </button>
            )}
          </div>

        </div>

        {/* MOBILE DOCKED WATER LEVEL STRIP (เกณฑ์ระดับน้ำ - อยู่ชิดด้านล่างเหนือเมนู ไม่บังแผนที่ ใช้งานง่ายด้วยนิ้วโป้ง) */}
        {/* MOBILE DOCKED WATER LEVEL STRIP (จัดวางเกณฑ์ใหม่ให้เล็กกะทัดรัด ไม่รก ไม่มีคำว่าคู่มือ) */}
        <div className="sm:hidden fixed bottom-[66px] left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none">
          <div className={`px-2 py-1 rounded-full border shadow-md backdrop-blur-xl flex items-center gap-1.5 text-[9.5px] font-bold ${
            isDark 
              ? 'bg-slate-950/90 border-slate-800 text-slate-300' 
              : 'bg-white/90 border-slate-200 text-slate-700'
          }`}>
            {/* Green: 5-20 cm */}
            <button
              type="button"
              onClick={() => setSeverityFilter(prev => prev === '1' ? 'all' : '1')}
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                severityFilter === '1'
                  ? 'bg-emerald-500 text-white font-extrabold shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400'
              }`}
              title="5-20 ซม."
            >
              <span className={`w-1.5 h-1.5 rounded-full ${severityFilter === '1' ? 'bg-white' : 'bg-emerald-500'}`}></span>
              <span>5-20ซม.</span>
            </button>

            {/* Amber: 21-50 cm */}
            <button
              type="button"
              onClick={() => setSeverityFilter(prev => prev === '2' ? 'all' : '2')}
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                severityFilter === '2'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400'
              }`}
              title="21-50 ซม."
            >
              <span className={`w-1.5 h-1.5 rounded-full ${severityFilter === '2' ? 'bg-slate-950' : 'bg-amber-500'}`}></span>
              <span>21-50ซม.</span>
            </button>

            {/* Red: >50 cm */}
            <button
              type="button"
              onClick={() => setSeverityFilter(prev => prev === '3' ? 'all' : '3')}
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                severityFilter === '3'
                  ? 'bg-rose-500 text-white font-extrabold shadow-xs'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400'
              }`}
              title=">50 ซม."
            >
              <span className={`w-1.5 h-1.5 rounded-full ${severityFilter === '3' ? 'bg-white' : 'bg-rose-500 animate-pulse'}`}></span>
              <span>&gt;50ซม.</span>
            </button>

            {severityFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSeverityFilter('all')}
                className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-bold cursor-pointer active:scale-95"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* CLICK-OUTSIDE BACKDROP FOR EASY EXIT ON MOBILE */}
        {selectedPoint && (
          <div 
            className="fixed inset-0 z-25 bg-black/20 backdrop-blur-[1px] sm:hidden" 
            onClick={() => setSelectedPoint(null)} 
          />
        )}

        {/* FLOATING POINT DETAIL CARD (COMPACT & NON-INTRUSIVE & EASY TO EXIT) */}
        {selectedPoint && (
          <div className={`absolute bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:bottom-4 sm:left-auto sm:right-4 z-30 sm:w-[360px] md:w-[340px] lg:w-[380px] max-w-md mx-auto border rounded-3xl shadow-2xl backdrop-blur-2xl smooth-sheet transition-all max-h-[44vh] sm:max-h-[78vh] flex flex-col p-3.5 sm:p-4 overflow-y-auto ${
            isDark 
              ? 'bg-slate-900/95 border-slate-700 text-slate-100' 
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}>

            {/* Header: District + Severity + Name + Close Button */}
            <div className={`flex items-start justify-between gap-2 pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    อ.{selectedPoint.district}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    selectedPoint.hazardType === 'hail' ? (isDark ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800' : 'bg-cyan-50 text-cyan-700 border-cyan-200') :
                    getFloodLevel(selectedPoint.depthCm) === 3 ? (isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200') :
                    getFloodLevel(selectedPoint.depthCm) === 2 ? (isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200') :
                    (isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                  }`}>
                    {selectedPoint.hazardType === 'hail' ? `🧊 ${selectedPoint.hailSizeLabel || 'ลูกเห็บตก'}` :
                     getFloodLevel(selectedPoint.depthCm) === 3 ? "🔴 น้ำท่วมวิกฤต (>50 ซม.)" :
                     getFloodLevel(selectedPoint.depthCm) === 2 ? "🟠 น้ำท่วมปานกลาง (21-50 ซม.)" : "🟢 น้ำท่วมปกติ (5-20 ซม.)"}
                  </span>
                  {selectedPoint.waterTrend === 'falling' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-300 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800 flex items-center gap-1">
                      <span>📉 น้ำลดลง</span>
                    </span>
                  )}
                  {selectedPoint.waterTrend === 'rising' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 flex items-center gap-1">
                      <span>📈 เฝ้าระวังน้ำขึ้น</span>
                    </span>
                  )}
                </div>
                <h3 className={`text-sm sm:text-base font-bold mt-1 leading-snug line-clamp-2 break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedPoint.name}
                </h3>
              </div>

              {/* Prominent Easy-to-Tap Close Button */}
              <button 
                type="button"
                onClick={() => setSelectedPoint(null)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                }`}
                title="ปิดหน้าต่างข้อมูล"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Citizen Uploaded Photo Preview (Tap to open full lightbox) */}
            {selectedPoint.photoUrl && (
              <div 
                className="mt-2.5 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm relative cursor-pointer group bg-black/10"
                onClick={() => setLightboxPhoto({
                  url: selectedPoint.photoUrl,
                  title: selectedPoint.name,
                  time: selectedPoint.reportedAt || selectedPoint.time
                })}
                title="แตะเพื่อดูภาพขนาดเต็ม"
              >
                <img 
                  src={selectedPoint.photoUrl} 
                  alt="รูปภาพจากประชาชนรายงาน" 
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200" 
                />
                <div className={`p-1.5 text-[11px] text-center font-bold flex items-center justify-center gap-1.5 ${
                  isDark ? 'bg-slate-800/90 text-cyan-300' : 'bg-slate-100/90 text-blue-700'
                }`}>
                  <span>🔍 แตะเพื่อดูรูปภาพขนาดใหญ่</span>
                  {selectedPoint.reportedAt && <span className="opacity-70 text-[10px]">({selectedPoint.reportedAt})</span>}
                </div>
              </div>
            )}

            {/* Visual Gauge with Standard Waterline & Sleek Vehicle Silhouettes (Person with 170 CM Badge) */}
            <div className="mt-2">
              <VisualGauge 
                depthCm={selectedPoint.depthCm} 
                level={getFloodLevel(selectedPoint.depthCm)} 
                impactText={selectedPoint.trafficStatus}
                theme={theme}
              />
            </div>

            {/* Concise Cause Only (ตามที่ระบุ: มีแค่สาเหตุ ไม่รก) */}
            {selectedPoint.cause && (
              <div className={`mt-2 p-2 px-3 rounded-xl border text-xs leading-relaxed ${
                isDark ? 'bg-slate-800/60 border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="font-bold text-slate-400 dark:text-slate-400 mr-1.5">สาเหตุ:</span>
                <span>{selectedPoint.cause}</span>
              </div>
            )}

            {/* Admin Broadcast & AI Alert Direct Delete Action (Visible ONLY to Logged-in Admin) */}
            {isAdminAuthenticated && (selectedPoint.isAdminBroadcast || selectedPoint.isAiGenerated) && (
              <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Megaphone className="w-3.5 h-3.5 shrink-0" />
                  <span>ประกาศฉุกเฉิน</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`ยืนยันการลบข้อความประกาศ "${selectedPoint.name}" ออกจากระบบ?`)) {
                      handleRejectReport(selectedPoint.id);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="ลบข้อความประกาศนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบ</span>
                </button>
              </div>
            )}

            {/* Quick Exit Button at Bottom of Card */}
            <button
              type="button"
              onClick={() => setSelectedPoint(null)}
              className={`w-full mt-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              <span>ปิดหน้าต่าง</span>
            </button>

          </div>
        )}

        {/* FULLSCREEN PHOTO LIGHTBOX MODAL (Mobile, Tablet & PC) */}
        {lightboxPhoto && (
          <div 
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 pointer-events-auto"
            onClick={() => setLightboxPhoto(null)}
          >
            <div 
              className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / Close */}
              <div className="w-full flex items-center justify-between pb-2.5 px-2 text-white">
                <div className="min-w-0 pr-3">
                  <h4 className="text-sm sm:text-base font-bold truncate">
                    {lightboxPhoto.title || 'รูปภาพจากประชาชนรายงาน'}
                  </h4>
                  {lightboxPhoto.time && (
                    <p className="text-xs text-slate-300">รายงานเมื่อ: {lightboxPhoto.time}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxPhoto(null)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                  title="ปิดรูปภาพ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview Container */}
              <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl max-h-[75vh] w-full flex items-center justify-center bg-black/60">
                <img 
                  src={lightboxPhoto.url} 
                  alt="รูปภาพรายงานน้ำท่วม" 
                  className="max-h-[75vh] max-w-full object-contain rounded-2xl"
                />
              </div>
              <div className="mt-2.5 text-center text-xs text-slate-300">
                แตะที่ใดก็ได้เพื่อปิดรูปภาพ
              </div>
            </div>
          </div>
        )}

      </main>

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
        points={points}
        citizenReports={citizenReports}
        changelog={changelog}
        weather={weather}
        onSelectPoint={handleSelectLocation}
        lastUpdatedTime={lastUpdatedTime}
        lastUpdatedTimeDetailed={lastUpdatedTimeDetailed}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshingData}
        theme={theme}
      />

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
        theme={theme}
      />

      <CitizenReportModal 
        isOpen={isCitizenReportModalOpen}
        onClose={() => setIsCitizenReportModalOpen(false)}
        onSubmitReport={handleAddCitizenReport}
        onStartPickOnMap={handleStartPickOnMap}
        pickedCoords={pickedCoords}
        onFlyToCoords={handleFlyToCoords}
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
          handleLocateMe(false);
        }}
        onEnterWithLocation={() => {
          setIsWelcomeModalOpen(false);
          handleLocateMe(false);
        }}
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

      {/* 4. MOBILE BOTTOM ACTION BAR (สำหรับมือถือ ใช้งานสะดวกด้วยนิ้วโป้ง ไม่ซับซ้อน) */}
      <MobileBottomNav
        onLocateMe={handleLocateMe}
        onOpenAiForecast={() => setIsOfficialModalOpen(true)}
        onOpenCitizenReport={() => setIsCitizenReportModalOpen(true)}
        onOpenPublicUpdates={() => setIsPublicUpdatesModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        onOpenStandards={() => setIsStandardsModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onToggleTheme={toggleTheme}
        hasGps={!!userLocation}
        theme={theme}
        onToggleSearch={() => setIsTopPanelCollapsed(v => !v)}
        isSearchOpen={!isTopPanelCollapsed}
      />


    </div>
  );
}
