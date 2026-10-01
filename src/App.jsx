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
import AdminVerificationPrompt from './components/AdminVerificationPrompt';
import PublicUpdatesModal from './components/PublicUpdatesModal';
import AutoMarquee from './components/AutoMarquee';
import ChatBot from './components/ChatBot';
import { INITIAL_FLOOD_POINTS, DISTRICTS, matchesLocationSearch, scoreLocationSearch, POPULAR_SEARCH_SUGGESTIONS } from './data/samutPrakanPoints';
import { getOfficialAdvisorySummary } from './services/aiPredictor';
import { getLiveSamutPrakanWeather } from './services/weatherService';
import { runOfficial24HourSync } from './services/aiSentryService';
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
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Megaphone,
  Sparkles,
  Flame
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

export default function App() {
  const [points, setPoints] = useState(() => {
    try {
      const saved = localStorage.getItem('prakanguard_points_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_FLOOD_POINTS;
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

  useEffect(() => {
    pointsRef.current = points;
    try {
      localStorage.setItem('prakanguard_points_state', JSON.stringify(points));
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

  // Search keyword state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const [isTopPanelCollapsed, setIsTopPanelCollapsed] = useState(false);

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
    const interval = setInterval(syncContinuousWeather, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Welcome Announcement Modal (Pops up automatically on first entry)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);

  // GPS User Location
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);

  // Modals state
  const [isOfficialModalOpen, setIsOfficialModalOpen] = useState(false);
  const [isStandardsModalOpen, setIsStandardsModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Citizen Reports State (Persisted in localStorage)
  // Ensures only genuine citizen and admin reports exist (NO fabricated AI reports)
  const [citizenReports, setCitizenReports] = useState(() => {
    try {
      const saved = localStorage.getItem('prakanguard_citizen_reports');
      const parsed = saved ? JSON.parse(saved) : [];
      const cleaned = parsed.filter(r => !r.isAiGenerated && !r.id?.startsWith('ai-alert-'));
      if (cleaned.length !== parsed.length) {
        try {
          localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(cleaned));
        } catch (e) {}
      }
      return cleaned;
    } catch (e) {
      return [];
    }
  });

  // Citizen Report Modal & Picking on Map States
  const [isCitizenReportModalOpen, setIsCitizenReportModalOpen] = useState(false);
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
    const interval = setInterval(executeBackgroundSync, 35 * 1000); // Heartbeat ซิงก์ข้อมูลสดทุก 35 วินาที ตลอด 24 ชม.

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
    setLatestUpdateNotification(`📢 ประกาศด่วนแอดมิน: จุด "${broadcast.name}" เผยแพร่ขึ้นแผนที่แล้ว (อัปเดตเมื่อ ${broadcast.reportedAt})`);
    setTimeout(() => setLatestUpdateNotification(null), 8000);
  };

  // Handle New Citizen Report Submission (Hold in pending queue for admin review)
  const handleAddCitizenReport = (newReport) => {
    setCitizenReports(prev => {
      const updated = [newReport, ...prev];
      try {
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage quota exceeded", e);
      }
      return updated;
    });

    // Notify the admin owner immediately
    setAdminAlertToast({
      id: newReport.id,
      name: newReport.name,
      levelLabel: newReport.bodyLevelLabel,
      district: newReport.district,
      time: newReport.reportedAt
    });
  };

  // Admin Actions: Approve Report & Publish to Map
  const handleApproveReport = (id) => {
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
      setLatestUpdateNotification(`✅ ยืนยันจุด "${approvedPoint.name}" ขึ้นแสดงบนแผนที่แล้ว (อัปเดตเมื่อ ${timeStr})`);
      setTimeout(() => setLatestUpdateNotification(null), 8000);
    }
  };

  // Admin Actions: Reject Report / Delete Announcement
  const handleRejectReport = (id) => {
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
  };

  // Filter pending reports for admin verification prompt
  const pendingCitizenReports = useMemo(() => {
    return citizenReports.filter(r => r.isApproved === false);
  }, [citizenReports]);

  // Admin Actions: Resolve Report (Water Drained)
  const handleResolveReport = (id) => {
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    let resolvedName = '';
    setCitizenReports(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          resolvedName = r.name;
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
    setLatestUpdateNotification(`💧 อัปเดตสถานะ: จุด "${resolvedName}" ระบายแห้งสู่ภาวะปกติแล้ว (อัปเดตเมื่อ ${timeStr})`);
    setTimeout(() => setLatestUpdateNotification(null), 8000);
  };

  // Map Picking Helpers
  const handleStartPickOnMap = () => {
    setIsCitizenReportModalOpen(false);
    setIsPickingLocationOnMap(true);
  };

  const handleMapLocationPicked = (coords) => {
    setPickedCoords(coords);
    setIsPickingLocationOnMap(false);
    setIsCitizenReportModalOpen(true);
  };

  const handleCancelPickOnMap = () => {
    setIsPickingLocationOnMap(false);
    setIsCitizenReportModalOpen(true);
  };

  const handleFlyToCoords = (lat, lng) => {
    setFlyToLocation({ lat, lng });
  };

  const officialAdvisory = getOfficialAdvisorySummary(points);

  // 1. Official Points shown on Map (filtered by district & severity)
  const mapPoints = useMemo(() => {
    return points.filter(point => {
      if (point.isActive === false || point.isResolved) return false;
      const matchDistrict = selectedDistrict === "ทั้งหมด" || point.district === selectedDistrict;
      const matchSeverity = severityFilter === "all" || point.level.toString() === severityFilter;
      return matchDistrict && matchSeverity;
    });
  }, [points, selectedDistrict, severityFilter]);

  // 2. Citizen Reports shown on Map (filtered by district & severity, requires Admin Approval)
  const mapCitizenReports = useMemo(() => {
    return citizenReports.filter(report => {
      if (report.isApproved === false || report.isResolved) return false;
      const matchDistrict = selectedDistrict === "ทั้งหมด" || report.district === selectedDistrict;
      const matchSeverity = severityFilter === "all" || report.level.toString() === severityFilter;
      return matchDistrict && matchSeverity;
    });
  }, [citizenReports, selectedDistrict, severityFilter]);

  // 3. Search Results for Official Points (searches ALL districts and severities)
  const searchResultsOfficial = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return points
      .filter(point => {
        if (point.isActive === false || point.isResolved) return false;
        return matchesLocationSearch(point, searchQuery);
      })
      .sort((a, b) => scoreLocationSearch(b, searchQuery) - scoreLocationSearch(a, searchQuery));
  }, [points, searchQuery]);

  // 4. Search Results for Citizen Reports (searches ALL districts and severities)
  const searchResultsCitizen = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return citizenReports
      .filter(report => {
        if (report.isApproved === false || report.isResolved) return false;
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

        // Find nearest active danger hotspot
        let minDistance = 999999;
        let closest = null;
        pointsRef.current.forEach(p => {
          if (p.isActive !== false && !p.isResolved) {
            const d = getDistanceKm(coords.lat, coords.lng, p.lat, p.lng);
            if (d < minDistance) {
              minDistance = d;
              closest = p;
            }
          }
        });

        if (closest && minDistance <= 3.0) {
          setLatestUpdateNotification(`📍 ตำแหน่งของคุณ (±${accuracyM} ม.) ใกล้จุดเสี่ยง "${closest.name}" (${minDistance} กม.)`);
        } else {
          setLatestUpdateNotification(`📍 ระบุพิกัด GPS ของคุณสำเร็จ (ความแม่นยำ ±${accuracyM} ม. อัปเดต ${timeStr})`);
        }
        setTimeout(() => setLatestUpdateNotification(null), 7000);

        const isInside = coords.lat >= 13.45 && coords.lat <= 13.75 && coords.lng >= 100.45 && coords.lng <= 100.95;
        if (!isInside && !silent) {
          alert(`ตรวจพบตำแหน่งของคุณที่ [${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}]\n\nหมายเหตุ: พิกัดของคุณอยู่นอกพื้นที่จังหวัดสมุทรปราการ แต่ระบบได้แสดงตำแหน่งของคุณบนแผนที่เรียบร้อยแล้วครับ`);
        }
      },
      (err) => {
        if (!silent) {
          let msg = "ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาอนุญาต Location บนเบราว์เซอร์เพื่อความแม่นยำ";
          if (err.code === 1) msg = "คุณปฏิเสธการเข้าถึงตำแหน่ง GPS กรุณาเปิดการอนุญาต Location ในการตั้งค่าเบราว์เซอร์ (Settings > Site Permissions > Location) เพื่อระบุพิกัดและเตือนจุดน้ำท่วมใกล้ตัวแม่นยำ";
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
    <div className={`h-screen w-screen flex flex-col font-prompt selection:bg-blue-600 selection:text-white overflow-hidden transition-colors duration-200 ${
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-violet-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-violet-400/50 backdrop-blur-xl flex items-center gap-3 pointer-events-auto">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shrink-0"></span>
            <div className="text-xs sm:text-sm">
              <strong className="block text-violet-200 font-bold">📍 โหมดแตะเลือกจุดบนแผนที่</strong>
              <span>แตะบนถนนหรือพิกัดที่พบน้ำท่วมเพื่อบันทึกจุด</span>
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

        {/* Floating Toast Notification when Updates occur with timestamp */}
        {latestUpdateNotification && (
          <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-600/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400 backdrop-blur-md flex items-center gap-2.5 max-w-md pointer-events-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="text-xs font-semibold">{latestUpdateNotification}</span>
            <button 
              onClick={() => setLatestUpdateNotification(null)}
              className="p-1 hover:bg-white/20 rounded-lg text-emerald-100 cursor-pointer ml-auto shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toggle Button to RE-OPEN the collapsed panel (Appears docked at top-left when collapsed) */}
        {isTopPanelCollapsed && (
          <button
            onClick={() => setIsTopPanelCollapsed(false)}
            className={`absolute top-2.5 sm:top-3 left-2.5 sm:left-4 z-20 pointer-events-auto p-2 sm:px-3.5 sm:py-2 rounded-2xl shadow-xl border flex items-center gap-2 text-xs sm:text-sm font-bold backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-slate-900/95 text-slate-100 border-slate-700 hover:border-blue-500' 
                : 'bg-white/95 text-slate-800 border-slate-200 hover:border-blue-500'
            }`}
            title="คลิกเพื่อขยายแถบเมนูค้นหาและตัวกรอง"
          >
            <PanelLeftOpen className="w-4 h-4 text-blue-500" />
            <span className="hidden xs:inline sm:inline">ค้นหา / ตัวกรอง</span>
          </button>
        )}

        {/* FLOATING TOP BAR: SEARCH, TICKER & DISTRICT PILLS */}
        <div className={`absolute top-2.5 sm:top-3 left-2.5 sm:left-4 right-2.5 sm:right-auto z-20 flex flex-col gap-2 max-w-xl pointer-events-none transition-all duration-300 ease-in-out ${
          isTopPanelCollapsed ? '-translate-x-[120%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
        }`}>
          
          {/* Quick Search Bar (Clean & Focused, Share Removed) */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
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
                placeholder="ค้นหาจุดเสี่ยงหรือชื่อเรียกติดปาก (เช่น บางฉโลง, สำโรง, ทรัพย์บุญชัย, กิ่งแก้ว, หนามแดง)..."
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery("");
                  }}
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
                        <span>สถานที่ค้นหายอดนิยมที่คนเรียกติดปาก (คลิกเลือกดูได้ทันที)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                        {POPULAR_SEARCH_SUGGESTIONS.map((item, idx) => (
                          <div
                            key={idx}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const match = points.find(p => matchesLocationSearch(p, item.query)) ||
                                            citizenReports.find(cr => matchesLocationSearch(cr, item.query));
                              if (match) {
                                handleSelectLocation(match);
                              } else {
                                setSearchQuery(item.query);
                              }
                            }}
                            className={`p-2 rounded-xl cursor-pointer border transition-all text-left flex flex-col justify-between ${
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
                                อ.{item.district.replace('เมืองสมุทรปราการ', 'เมือง')}
                              </span>
                            </div>
                            <span className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.sub}
                            </span>
                          </div>
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
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const match = points.find(p => matchesLocationSearch(p, item.query)) ||
                                            citizenReports.find(cr => matchesLocationSearch(cr, item.query));
                              if (match) {
                                handleSelectLocation(match);
                              } else {
                                setSearchQuery(item.query);
                              }
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-400/20 font-medium transition-colors cursor-pointer"
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
                        <div
                          key={p.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectLocation(p);
                          }}
                          className={`p-2 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-blue-50 text-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className={`font-bold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</span>
                            <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              อ.{p.district} • {p.depthRange} {p.aliases ? `• ${p.aliases.slice(0, 3).join(', ')}` : ''}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                            p.level === 3 ? (isDark ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-rose-100 text-rose-800') :
                            p.level === 2 ? (isDark ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800') : 
                            (isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800')
                          }`}>
                            {p.statusLabel}
                          </span>
                        </div>
                      ))}

                      {/* Citizen reports */}
                      {searchResultsCitizen.map(cr => (
                        <div
                          key={cr.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectLocation(cr);
                          }}
                          className={`p-2 rounded-xl cursor-pointer flex items-center justify-between transition-colors border-t border-dashed ${
                            isDark ? 'hover:bg-violet-950/50 text-slate-200 border-slate-800' : 'hover:bg-violet-50 text-slate-800 border-slate-100'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className={`font-bold flex items-center gap-1 ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                              <span>📢 {cr.name}</span>
                            </span>
                            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>อ.{cr.district} • ระดับ{cr.bodyLevelLabel}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 bg-violet-100 text-violet-800 border border-violet-200`}>
                            ภาคประชาชน
                          </span>
                        </div>
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

          {/* UNIFIED COMPACT LIVE TELEMETRY & STATUS CARD */}
          <div className="pointer-events-auto w-full">
            <div className={`p-2 sm:p-2.5 rounded-2xl border shadow-md backdrop-blur-xl flex flex-col gap-1.5 transition-all ${
              isDark 
                ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 shadow-slate-950/40' 
                : 'bg-white/90 border-slate-200/90 text-slate-800 shadow-slate-300/40'
            }`}>
              
              {/* Row 1: Weather & Rain Radar Telemetry */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div 
                  onClick={() => setIsOfficialModalOpen(true)}
                  className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer group"
                  title="คลิกดูเรดาร์ตรวจฝนและพยากรณ์อากาศสด TMD"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-cyan-950/90 text-cyan-400 border border-cyan-800/60' : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}>
                    <CloudRain className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {weather?.weatherDesc || 'มีเมฆบางส่วน'} ({weather?.temp ?? 29}°C)
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-blue-600 dark:text-cyan-400 font-bold whitespace-nowrap">
                      ฝน {weather?.rainProbabilityToday ?? 50}%
                    </span>
                    <span className="text-[10px] text-slate-400 hidden md:inline">
                      (~{weather?.rainSumToday ?? 0} มม.)
                    </span>
                  </div>
                </div>

                {/* Risk Window Badge */}
                <div 
                  onClick={() => setIsOfficialModalOpen(true)}
                  className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 cursor-pointer ${
                    isDark 
                      ? 'bg-amber-950/70 text-amber-300 border-amber-800/80' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                  title="ช่วงเวลาเฝ้าระวังฝนตกหนักสูงสุด"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  <span>ช่วงเสี่ยง {weather?.peakHour && typeof weather.peakHour === 'string' ? weather.peakHour.split(' ')[0] : '16:00'}</span>
                </div>
              </div>

              {/* Row 2: Live Sync Telemetry & Flood Updates Trigger */}
              <div className={`pt-1.5 border-t flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] ${
                isDark ? 'border-slate-800/80' : 'border-slate-100'
              }`}>
                {/* 24h Telemetry Sync Button */}
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={telemetrySyncStatus?.isSyncing}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all cursor-pointer font-medium truncate ${
                    isDark 
                      ? 'hover:bg-slate-800/80 text-slate-300 hover:text-cyan-300' 
                      : 'hover:bg-slate-100 text-slate-600 hover:text-blue-600'
                  }`}
                  title="คลิกเพื่อซิงก์ข้อมูลเรดาร์สด TMD / กองทัพเรือ ทันที"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${telemetrySyncStatus?.isSyncing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500 animate-pulse'} shrink-0`}></span>
                  <span className="truncate">
                    {telemetrySyncStatus?.isSyncing ? 'กำลังซิงก์...' : `เรดาร์สด (${telemetrySyncStatus?.lastSyncTime || 'สด'})`}
                  </span>
                  <RefreshCw className={`w-3 h-3 text-cyan-500 shrink-0 ${telemetrySyncStatus?.isSyncing ? 'animate-spin' : ''}`} />
                </button>

                {/* Flood Updates Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setIsPublicUpdatesModalOpen(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
                    isDark 
                      ? 'bg-blue-950/70 hover:bg-blue-900/80 text-cyan-300 border border-blue-800/60' 
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                  title="คลิกเพื่อดูบันทึกการอัปเดตสถานการณ์น้ำท่วม"
                >
                  <span>สถานการณ์: {lastUpdatedTime || 'สด'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
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

          {/* District & Severity Filter Pills (Fully Responsive on All Devices) */}
          <div className="pointer-events-auto flex items-center gap-1.5 w-full max-w-full">
            
            {/* Scrollable Districts Container with Navigation Arrows */}
            <div className={`relative flex-1 min-w-0 flex items-center p-1 rounded-2xl border shadow-md backdrop-blur-md transition-colors ${
              isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'
            }`}>
              
              {/* Left Scroll Arrow */}
              <button
                type="button"
                onClick={() => scrollDistrict('left')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 mr-0.5 ${
                  isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
                }`}
                title="เลื่อนดูอำเภอก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* District Pills Strip (Touch, Wheel & Drag Scrollable with Butter-Smooth Gliding) */}
              <div 
                ref={districtScrollRef}
                onMouseDown={handleDistrictMouseDown}
                onMouseMove={handleDistrictMouseMove}
                onMouseUp={handleDistrictMouseUp}
                onMouseLeave={handleDistrictMouseUp}
                className="flex items-center gap-1 overflow-x-auto smooth-slider no-scrollbar py-0.5 touch-pan-x cursor-grab active:cursor-grabbing select-none"
              >
                {DISTRICTS.map(dist => (
                  <button
                    key={dist}
                    onClick={(e) => handleSelectDistrict(dist, e)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 select-none ${
                      selectedDistrict === dist 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : isDark
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {dist === "ทั้งหมด" ? "ทุกอำเภอ" : dist}
                  </button>
                ))}
              </div>

              {/* Right Scroll Arrow */}
              <button
                type="button"
                onClick={() => scrollDistrict('right')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ml-0.5 ${
                  isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
                }`}
                title="เลื่อนดูอำเภอถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Severity Minimalist Dropdown */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={`text-xs font-semibold rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 border focus:outline-none shadow-sm cursor-pointer backdrop-blur-md shrink-0 transition-colors ${
                isDark 
                  ? 'bg-slate-900 text-slate-200 border-slate-700 focus:border-blue-400' 
                  : 'bg-white text-slate-800 border-slate-200 focus:border-blue-500'
              }`}
              title="กรองตามระดับความรุนแรง (เกณฑ์ ปภ.)"
            >
              <option value="all">ทุกระดับเสี่ยง</option>
              <option value="1">🟢 ปกติ (&lt;15ซม.)</option>
              <option value="2">🟠 เสี่ยงสูง (16-35ซม.)</option>
              <option value="3">🔴 วิกฤต (&gt;35ซม.)</option>
            </select>
          </div>

        </div>

        {/* FLOATING POINT DETAIL CARD (CLEAN & SENIOR-FRIENDLY) */}
        {selectedPoint && (
          <div className={`absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-auto sm:right-4 z-30 sm:w-[420px] border rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-2xl smooth-sheet max-h-[82vh] overflow-y-auto ${
            isDark 
              ? 'bg-slate-900/95 border-slate-700 text-slate-100' 
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}>
            
            {/* Card Header */}
            <div className={`flex items-start justify-between gap-3 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                    isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    อ.{selectedPoint.district}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                    selectedPoint.level === 3 ? (isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200') :
                    selectedPoint.level === 2 ? (isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200') :
                    (isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                  }`}>
                    {selectedPoint.statusLabel}
                  </span>
                </div>
                <h3 className={`text-base sm:text-lg font-bold mt-1.5 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedPoint.name}
                </h3>
                <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedPoint.subdistrict}</p>
              </div>
              <button 
                onClick={() => setSelectedPoint(null)}
                className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                }`}
                title="ปิดหน้าต่างข้อมูล"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Citizen Uploaded Photo Preview (If available) */}
            {selectedPoint.photoUrl && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-300 shadow-md">
                <img 
                  src={selectedPoint.photoUrl} 
                  alt="ภาพถ่ายน้ำท่วมจากประชาชน" 
                  className="w-full h-44 object-cover" 
                />
                <div className={`p-2 text-[11px] text-center font-medium ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  📷 ภาพถ่ายจากผู้ใช้ในพื้นที่ • แจ้งเมื่อ {selectedPoint.reportedAt || 'วันนี้'}
                </div>
              </div>
            )}

            {/* Visual Gauge with Standard Waterline & Vehicle Silhouettes */}
            <div className="mt-3.5">
              <VisualGauge 
                depthCm={selectedPoint.depthCm} 
                level={selectedPoint.level} 
                impactText={selectedPoint.trafficStatus}
                theme={theme}
              />
            </div>

            {/* Fact-based Summary Details with Citations */}
            <div className="space-y-2 mt-3 text-xs sm:text-sm">
              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>สาเหตุสำคัญที่ทำให้เกิดน้ำท่วม:</span>
                <span className={`mt-0.5 block leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedPoint.cause}</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>คำแนะนำความปลอดภัยในการสัญจร:</span>
                <span className={`mt-0.5 block leading-relaxed font-medium ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>{selectedPoint.officialGuidance}</span>
              </div>
            </div>

            {/* Official Source & Verification Citation */}
            <div className={`mt-2.5 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
              isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div className="flex items-center gap-1.5 truncate">
                <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate">อ้างอิงข้อมูล: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{selectedPoint.source}</strong></span>
              </div>
              {selectedPoint.reportedAt && (
                <span className="text-[10px] text-slate-400 shrink-0">
                  {selectedPoint.reportedAt}
                </span>
              )}
            </div>

            {/* Admin Broadcast & AI Alert Direct Delete Action (Visible ONLY to Logged-in Admin) */}
            {isAdminAuthenticated && (selectedPoint.isAdminBroadcast || selectedPoint.isAiGenerated) && (
              <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Megaphone className="w-3.5 h-3.5 shrink-0" />
                    <span>ข้อความประกาศแอดมิน / AI</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                    สามารถลบประกาศนี้ออกจากแผนที่และระบบได้ทันที
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`ยืนยันการลบข้อความประกาศ "${selectedPoint.name}" ออกจากระบบ?`)) {
                      handleRejectReport(selectedPoint.id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/25 flex items-center gap-1 shrink-0 cursor-pointer"
                  title="ลบข้อความประกาศนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบประกาศ</span>
                </button>
              </div>
            )}

            {/* Senior-Friendly Action Buttons */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setIsStandardsModalOpen(true)}
                className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>เกณฑ์มาตรฐาน ปภ.</span>
              </button>

              <a 
                href={`tel:${selectedPoint.phone.replace(/-/g, '')}`}
                className="py-3 px-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all text-center cursor-pointer shadow-md shadow-rose-600/30"
              >
                <Phone className="w-4 h-4" />
                <span>โทรศูนย์ {selectedPoint.district}</span>
              </a>
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
        onApproveReport={handleApproveReport}
        onRejectReport={handleRejectReport}
        onResolveReport={handleResolveReport}
        onAddAdminBroadcast={handleAddAdminBroadcast}
        onFlyToCoords={handleFlyToCoords}
        onAuthChange={setIsAdminAuthenticated}
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

    </div>
  );
}
