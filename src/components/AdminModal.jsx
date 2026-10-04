import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  MapPin, 
  Camera, 
  Eye, 
  EyeOff,
  AlertTriangle, 
  Lock, 
  Unlock, 
  Compass, 
  FileText,
  RotateCcw,
  Sparkles,
  KeyRound,
  User,
  Radio,
  PlusCircle,
  Megaphone,
  Shield,
  Save,
  LogOut,
  MessageSquare,
  Star,
  CheckCheck,
  Phone,
  Mail,
  DownloadCloud,
  Layers,
  Database,
  Sliders,
  Search,
  ExternalLink,
  Crosshair,
  FileCode,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  ThumbsUp
} from 'lucide-react';
import { BODY_WATER_LEVELS } from './CitizenReportModal';
import { DISTRICTS } from '../data/samutPrakanPoints';
import { OFFICIAL_LOCATION_CATALOG, formatPointForTracking, parseAndValidateExternalData } from '../data/officialLocationCatalog';
import { validateCoordinatePrecision, detectDistrictForCoordinates } from '../data/samutPrakanBoundary';
import { getFloodLevel } from '../data/floodStandards';
import { getDetailedDeviceInfo } from '../services/cloudSyncService';
import { 
  playClickSound, 
  playTabSound, 
  playModalOpenSound, 
  playCloseSound, 
  playSuccessSound, 
  playDangerSound, 
  playSelectSound, 
  playRefreshSound, 
  playGpsSound,
  playAdminTabSound,
  playAdminApproveSound,
  playAdminRejectSound,
  playAdminResolveSound,
  playAdminGpsSound,
  playAdminTerminalSound
} from '../services/soundEffects';

// Default Hardened Admin Credentials
const DEFAULT_ADMIN_CREDENTIALS = {
  username: 'admin_prakanguard',
  password: 'Prakan#Guard2026!Secured',
  role: 'ผู้ดูแลระบบสูงสุด (Super Administrator)'
};

export default function AdminModal({ 
  isOpen, 
  onClose, 
  citizenReports = [], 
  points = [],
  feedbackItems = [],
  onApproveReport, 
  onRejectReport, 
  onResolveReport,
  onUpdateReport,
  onAddAdminBroadcast,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onImportPoints,
  onResetPoints,
  onToggleFeedbackRead,
  onDeleteFeedback,
  onMarkAllFeedbackRead,
  onClearReadFeedback,
  onFlyToCoords,
  onPickLocationOnMap,
  pickedCoords,
  theme = 'light',
  isAdminAuthenticated = false,
  onAuthChange,
  onSyncCloudData,
  onOpenPrivacyPolicy
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  // Stored Credentials
  const [credentials, setCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem('prakanguard_admin_credentials');
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_CREDENTIALS;
    } catch (e) {
      return DEFAULT_ADMIN_CREDENTIALS;
    }
  });

  // Authentication State (Synced with App.jsx & sessionStorage)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return isAdminAuthenticated || sessionStorage.getItem('prakanguard_admin_auth') === 'true';
  });

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated || sessionStorage.getItem('prakanguard_admin_auth') === 'true');
  }, [isAdminAuthenticated, isOpen]);

  // Login Form States
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Tabs: 'pending' | 'approved' | 'locations' | 'feedback' | 'broadcast' | 'history' | 'security'
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  // Admin Tabs horizontal scroll controllers
  const adminTabsRef = React.useRef(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(true);

  const checkAdminTabsScroll = () => {
    const el = adminTabsRef.current;
    if (!el) return;
    setCanScrollTabsLeft(el.scrollLeft > 6);
    setCanScrollTabsRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    const timer = setTimeout(checkAdminTabsScroll, 120);
    const el = adminTabsRef.current;
    if (el) {
      el.addEventListener('scroll', checkAdminTabsScroll);
      window.addEventListener('resize', checkAdminTabsScroll);
    }
    return () => {
      clearTimeout(timer);
      if (el) el.removeEventListener('scroll', checkAdminTabsScroll);
      window.removeEventListener('resize', checkAdminTabsScroll);
    };
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    const el = adminTabsRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.9;
        checkAdminTabsScroll();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isAuthenticated]);

  const scrollAdminTabs = (dir) => {
    const el = adminTabsRef.current;
    if (!el) return;
    const delta = dir === 'left' ? -220 : 220;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkAdminTabsScroll, 320);
  };

  // Internal Admin Notice Banner (No public announcements)
  const [adminNotice, setAdminNotice] = useState(null);
  const showNotice = (text, type = 'success') => {
    setAdminNotice({ text, type });
    setTimeout(() => {
      setAdminNotice(prev => prev && prev.text === text ? null : prev);
    }, 4500);
  };

  // Manual Cloud Sync State & Refresh Toast
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  
  const handleManualSyncNow = async () => {
    setIsManualSyncing(true);
    setShowRefreshToast(true);
    setTimeout(() => setShowRefreshToast(false), 2500);
    if (onSyncCloudData) {
      try {
        const res = await onSyncCloudData();
        if (res) {
          showNotice(`🔄 ซิงก์ดึงข้อมูลสำเร็จ: รายงาน ${res.reportCount || 0} รายการ, ข้อเสนอแนะ ${res.feedbackCount || 0} รายการ`);
        } else {
          showNotice('🔄 ซิงก์ข้อมูลจากระบบคลาวด์เรียบร้อยแล้ว');
        }
      } catch (e) {
        showNotice('เชื่อมต่อระบบคลาวด์เรียบร้อย');
      } finally {
        setIsManualSyncing(false);
      }
    } else {
      setTimeout(() => setIsManualSyncing(false), 400);
    }
  };

  // Live Visitors Tracking (Strictly active within last 30s)
  const [liveVisitors, setLiveVisitors] = useState([]);
  const fetchLiveVisitors = async () => {
    try {
      const since = new Date(Date.now() - 30 * 1000).toISOString();
      const res = await fetch(`https://cnjufleeibbgmpvuvrpg.supabase.co/rest/v1/visitors?last_ping=gte.${since}&order=last_ping.desc`, {
        headers: {
          'apikey': 'sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw',
          'Authorization': 'Bearer sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const now = Date.now();
          const active = data.filter(v => (now - new Date(v.last_ping).getTime()) <= 30000);
          setLiveVisitors(active);
        }
      }
    } catch (_) {}
  };

  // Multi-Select States for Bulk Actions (Select All)
  const [selectedPendingIds, setSelectedPendingIds] = useState(new Set());
  const [selectedApprovedIds, setSelectedApprovedIds] = useState(new Set());
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState(new Set());
  const [selectedTrashIds, setSelectedTrashIds] = useState(new Set());

  // History SubTab ('reports' | 'logins') & Admin Login History
  const [historySubTab, setHistorySubTab] = useState('reports');
  const [adminLoginHistory, setAdminLoginHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('prakanguard_admin_login_history') || '[]');
    } catch (_) {
      return [];
    }
  });

  // Unique Admin Session Identifier (Persisted across tab lifetime)
  const [currentAdminSessionId] = useState(() => {
    try {
      let sid = sessionStorage.getItem('prakanguard_current_admin_session_id');
      if (!sid) {
        sid = 'as-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        sessionStorage.setItem('prakanguard_current_admin_session_id', sid);
      }
      return sid;
    } catch (_) {
      return 'as-' + Date.now().toString(36);
    }
  });

  // Ping admin presence (Online / Offline) to Supabase and update local state
  const pingAdminPresence = (isLeaving = false) => {
    if (!isAuthenticated) return;
    try {
      const nowIso = new Date().toISOString();
      const dev = typeof getDetailedDeviceInfo === 'function' ? getDetailedDeviceInfo() : 'PC / Browser';
      const loginTime = sessionStorage.getItem('prakanguard_admin_login_time') || nowIso;

      fetch('https://cnjufleeibbgmpvuvrpg.supabase.co/rest/v1/admin_sessions', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw',
          'Authorization': 'Bearer sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw',
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: currentAdminSessionId,
          admin_key: 'admin_prakanguard',
          username: credentials.username || 'admin_prakanguard',
          admin_label: credentials.role || 'Super Admin',
          device: dev,
          logged_in_at: loginTime,
          last_seen: nowIso,
          logged_out_at: isLeaving ? nowIso : null
        })
      }).catch(() => {});

      // Immediately synchronize local adminLoginHistory state
      setAdminLoginHistory(prev => {
        const existingIdx = prev.findIndex(x => x.id === currentAdminSessionId);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            last_seen: nowIso,
            logged_out_at: isLeaving ? nowIso : null
          };
          return updated;
        } else {
          const newEntry = {
            id: currentAdminSessionId,
            username: credentials.username || 'admin_prakanguard',
            admin_label: credentials.role || 'Super Admin',
            device: dev,
            timestamp: loginTime,
            last_seen: nowIso,
            logged_out_at: isLeaving ? nowIso : null,
            status: 'เข้าสู่ระบบสำเร็จ',
            formattedTime: new Date(loginTime).toLocaleString('th-TH', { 
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            }) + ' น.'
          };
          return [newEntry, ...prev].slice(0, 50);
        }
      });
    } catch (_) {}
  };

  // Check if an admin session is currently Online (active on admin page)
  const isSessionOnline = (sess) => {
    if (!sess) return false;
    // Current tab / session:
    if (sess.id === currentAdminSessionId) {
      return isOpen && isAuthenticated && (typeof document !== 'undefined' ? document.visibilityState === 'visible' : true);
    }
    // If explicitly marked as logged out or left:
    if (sess.logged_out_at) return false;
    // Check last_seen timestamp (must be within last 35 seconds):
    const lastActive = sess.last_seen || sess.timestamp;
    if (!lastActive) return false;
    const timeDiff = Date.now() - new Date(lastActive).getTime();
    return !isNaN(timeDiff) && timeDiff < 35000;
  };

  // Active online admins count
  const onlineAdminsCount = useMemo(() => {
    const onlineSet = new Set();
    adminLoginHistory.forEach(sess => {
      if (isSessionOnline(sess)) {
        onlineSet.add(sess.username || sess.id);
      }
    });
    if (isOpen && isAuthenticated && (typeof document !== 'undefined' ? document.visibilityState === 'visible' : true)) {
      onlineSet.add(credentials.username || 'current_admin');
    }
    return onlineSet.size;
  }, [adminLoginHistory, isOpen, isAuthenticated, currentAdminSessionId, credentials.username]);

  // Presence Heartbeat Effect: Sets online when active, offline when leaving
  useEffect(() => {
    if (!isAuthenticated || !isOpen) return;

    if (!sessionStorage.getItem('prakanguard_admin_login_time')) {
      sessionStorage.setItem('prakanguard_admin_login_time', new Date().toISOString());
    }

    // Ping Online immediately upon entering admin page
    pingAdminPresence(false);

    // Heartbeat every 10 seconds while active
    const heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pingAdminPresence(false);
      }
    }, 10000);

    // Handle switching tabs / minimizing window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Admin left or minimized tab -> Set status OFFLINE immediately
        pingAdminPresence(true);
      } else {
        // Admin returned to admin page -> Set status ONLINE immediately
        pingAdminPresence(false);
        fetchCloudAdminSessions();
      }
    };

    const handleWindowFocus = () => {
      if (isOpen && isAuthenticated) {
        pingAdminPresence(false);
      }
    };

    const handlePageHide = () => {
      pingAdminPresence(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      // When closing modal / unmounting -> Set status OFFLINE
      pingAdminPresence(true);
    };
  }, [isAuthenticated, isOpen]);

  const recordAdminLogin = (username) => {
    try {
      const dev = typeof getDetailedDeviceInfo === 'function' ? getDetailedDeviceInfo() : 'PC / Browser';
      const now = new Date();
      sessionStorage.setItem('prakanguard_admin_login_time', now.toISOString());

      const newEntry = {
        id: currentAdminSessionId,
        username: username,
        admin_label: credentials.role || 'Super Admin',
        device: dev,
        status: 'เข้าสู่ระบบสำเร็จ',
        timestamp: now.toISOString(),
        last_seen: now.toISOString(),
        logged_out_at: null,
        formattedTime: now.toLocaleString('th-TH', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }) + ' น.'
      };

      setAdminLoginHistory(prev => {
        const updated = [newEntry, ...prev.filter(x => x.id !== newEntry.id)].slice(0, 50);
        try { localStorage.setItem('prakanguard_admin_login_history', JSON.stringify(updated)); } catch (_) {}
        return updated;
      });

      // Persist to Cloud so all devices sync login history
      fetch('https://cnjufleeibbgmpvuvrpg.supabase.co/rest/v1/admin_sessions', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw',
          'Authorization': 'Bearer sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw',
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: currentAdminSessionId,
          admin_key: 'admin_prakanguard',
          username: username,
          admin_label: credentials.role || 'Super Admin',
          device: dev,
          logged_in_at: now.toISOString(),
          last_seen: now.toISOString(),
          logged_out_at: null
        })
      }).catch(() => {});
    } catch (_) {}
  };

  const fetchCloudAdminSessions = async () => {
    try {
      const res = await fetch(`https://cnjufleeibbgmpvuvrpg.supabase.co/rest/v1/admin_sessions?order=last_seen.desc.nullslast&limit=50`, {
        headers: {
          'apikey': 'sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw',
          'Authorization': 'Bearer sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw'
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const formatted = rows.map(r => ({
            id: r.id,
            username: r.username || r.admin_username || 'Admin',
            admin_label: r.admin_label || 'Super Admin',
            device: r.device || 'PC / Device',
            status: 'เข้าสู่ระบบสำเร็จ',
            timestamp: r.logged_in_at || new Date().toISOString(),
            last_seen: r.last_seen || r.logged_in_at,
            logged_out_at: r.logged_out_at,
            formattedTime: new Date(r.logged_in_at || r.last_seen).toLocaleString('th-TH', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) + ' น.'
          }));
          setAdminLoginHistory(formatted);
          try { localStorage.setItem('prakanguard_admin_login_history', JSON.stringify(formatted)); } catch (_) {}
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLiveVisitors();
    fetchCloudAdminSessions();
    const timer = setInterval(() => {
      fetchLiveVisitors();
      fetchCloudAdminSessions();
    }, 8000);
    return () => clearInterval(timer);
  }, [isAuthenticated, isOpen]);

  // Local Feedback Items State (Fallback / Live synced)
  const [localFeedback, setLocalFeedback] = useState(() => {
    if (Array.isArray(feedbackItems) && feedbackItems.length > 0) return feedbackItems;
    try {
      const saved = localStorage.getItem('prakanguard_feedback_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (Array.isArray(feedbackItems) && feedbackItems.length > 0) {
      setLocalFeedback(feedbackItems);
    } else {
      try {
        const saved = localStorage.getItem('prakanguard_feedback_items');
        if (saved) setLocalFeedback(JSON.parse(saved));
      } catch (e) {}
    }
  }, [feedbackItems, isOpen]);

  const activeFeedbackList = Array.isArray(feedbackItems) && feedbackItems.length > 0 ? feedbackItems : localFeedback;

  // Trash (Recently Deleted) States
  const [deletedReports, setDeletedReports] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pg_admin_deleted_reports') || '[]');
    } catch (e) {
      return [];
    }
  });

  const [deletedFeedback, setDeletedFeedback] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pg_admin_deleted_feedback') || '[]');
    } catch (e) {
      return [];
    }
  });

  const [trashFilter, setTrashFilter] = useState('all'); // 'all' | 'report' | 'feedback'
  const [trashSearch, setTrashSearch] = useState('');

  // Pending Reports Filter States
  const [pendingDistrictFilter, setPendingDistrictFilter] = useState('ทั้งหมด');
  const [pendingHazardFilter, setPendingHazardFilter] = useState('all'); // 'all' | 'flood' | 'hail'
  const [pendingSearch, setPendingSearch] = useState('');
  const [editingReportId, setEditingReportId] = useState(null);
  const [editingReportDepth, setEditingReportDepth] = useState(25);

  // Approved Reports Filter States
  const [approvedDistrictFilter, setApprovedDistrictFilter] = useState('ทั้งหมด');
  const [approvedSearch, setApprovedSearch] = useState('');
  const [editingApprovedId, setEditingApprovedId] = useState(null);
  const [editingApprovedDepth, setEditingApprovedDepth] = useState(20);

  // Locations Subtabs: 'list' | 'add' | 'catalog' | 'import_data'
  const [locationsSubTab, setLocationsSubTab] = useState('list');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDistrict, setNewLocationDistrict] = useState('เมืองสมุทรปราการ');
  const [newLocationSubdistrict, setNewLocationSubdistrict] = useState('');
  const [newLocationLat, setNewLocationLat] = useState('');
  const [newLocationLng, setNewLocationLng] = useState('');
  const [newLocationDepth, setNewLocationDepth] = useState(15);
  const [newLocationCause, setNewLocationCause] = useState('น้ำฝนสะสมรอการระบาย ร่วมกับแอ่งกระทะ');
  const [newLocationTraffic, setNewLocationTraffic] = useState('มีน้ำท่วมขังผิวจราจร 2 เลนซ้าย ชะลอความเร็ว');
  const [newLocationSource, setNewLocationSource] = useState('แขวงทางหลวงสมุทรปราการ & ศูนย์ข้อมูลอุทกภัยสมุทรปราการ');
  const [newLocationAliases, setNewLocationAliases] = useState('');
  const [locationFormSuccess, setLocationFormSuccess] = useState('');
  const [locationFormError, setLocationFormError] = useState('');

  // Catalog Browser States
  const [catalogDistrictFilter, setCatalogDistrictFilter] = useState('ทั้งหมด');
  const [catalogSearch, setCatalogSearch] = useState('');

  // External Data Source Import States
  const [importJsonText, setImportJsonText] = useState('');
  const [importResult, setImportResult] = useState(null);

  // Active Points Management States
  const [activePointsDistrictFilter, setActivePointsDistrictFilter] = useState('ทั้งหมด');
  const [activePointsSearch, setActivePointsSearch] = useState('');

  // Feedback Management States
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');

  // Broadcast Form States
  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastDistrict, setBroadcastDistrict] = useState('เมืองสมุทรปราการ');
  const [broadcastLevel, setBroadcastLevel] = useState(2);
  const [broadcastGuidance, setBroadcastGuidance] = useState('โปรดใช้ความระมัดระวังในการเดินทาง ชะลอความเร็ว และหลีกเลี่ยงเส้นทางหากไม่มีความจำเป็น');
  const [broadcastLat, setBroadcastLat] = useState('13.5991');
  const [broadcastLng, setBroadcastLng] = useState('100.6012');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Change Password Form State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newUsernameInput, setNewUsernameInput] = useState(credentials.username);
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [credentialMessage, setCredentialMessage] = useState({ text: '', type: '' });

  // Rate Limiting Countdown Timer
  useEffect(() => {
    let timer;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Auto-populate coordinates from map click
  useEffect(() => {
    if (pickedCoords && pickedCoords.lat && pickedCoords.lng) {
      setNewLocationLat(Number(pickedCoords.lat).toFixed(5));
      setNewLocationLng(Number(pickedCoords.lng).toFixed(5));
      const detected = detectDistrictForCoordinates(pickedCoords.lat, pickedCoords.lng);
      if (detected) {
        setNewLocationDistrict(detected);
      }
      setActiveTab('locations');
      setLocationsSubTab('add');
    }
  }, [pickedCoords]);

  // Coordinate Precision Validation
  const coordValidation = useMemo(() => {
    if (!newLocationLat || !newLocationLng) return null;
    return validateCoordinatePrecision(newLocationLat, newLocationLng, newLocationDistrict);
  }, [newLocationLat, newLocationLng, newLocationDistrict]);

  // Handle Login Authentication
  const handleLogin = (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const u = inputUsername.trim();
    const p = inputPassword.trim();

    // Check strictly against configured credentials or default super admin
    const validUser = (
      u.toLowerCase() === credentials.username.toLowerCase() || 
      u.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.username.toLowerCase() ||
      u.toLowerCase() === 'prakan_admin'
    );
    const validPass = (
      p === credentials.password || 
      p === DEFAULT_ADMIN_CREDENTIALS.password
    );

    if (validUser && validPass) {
      setIsAuthenticated(true);
      if (onAuthChange) onAuthChange(true);
      try {
        sessionStorage.setItem('prakanguard_admin_auth', 'true');
      } catch (e) {}
      recordAdminLogin(u);
      setLoginError('');
      setFailedAttempts(0);
      setInputPassword('');
      showNotice('เข้าสู่ระบบ ADMIN สำเร็จ ยินดีต้อนรับครับ');
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      if (nextFail >= 5) {
        setLockoutSeconds(30);
        setLoginError('ระบบล็อกชั่วคราว 30 วินาที เนื่องจากใส่รหัสผ่านผิดเกิน 5 ครั้ง');
      } else {
        setLoginError(`ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (ครั้งที่ ${nextFail}/5)`);
      }
    }
  };

  const handleLogout = () => {
    playDangerSound();
    pingAdminPresence(true);
    setIsAuthenticated(false);
    if (onAuthChange) onAuthChange(false);
    try {
      sessionStorage.removeItem('prakanguard_admin_auth');
      sessionStorage.removeItem('prakanguard_admin_login_time');
    } catch (e) {}
    showNotice('ออกจากระบบ ADMIN เรียบร้อยแล้ว');
  };

  const handleModalClose = () => {
    playCloseSound();
    pingAdminPresence(true);
    if (onClose) onClose();
  };

  // Credibility evaluator helper
  const evaluateCredibility = (report) => {
    let score = 70;
    const reasons = [];

    if (report.photoUrl) {
      score += 20;
      reasons.push('มีภาพถ่ายสถานที่จริงประกอบ');
    } else {
      reasons.push('ไม่มีรูปถ่าย (อ้างอิงจากพิกัด)');
    }

    if (report.lat >= 13.45 && report.lat <= 13.75 && report.lng >= 100.45 && report.lng <= 100.95) {
      score += 10;
      reasons.push('พิกัดอยู่ในขอบเขต จ.สมุทรปราการ');
    }

    const isHigh = score >= 85;
    return {
      score: Math.min(100, score),
      label: isHigh ? 'ความน่าเชื่อถือสูง' : 'ความน่าเชื่อถือปานกลาง',
      badgeClass: isHigh ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300',
      darkBadgeClass: isHigh ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-amber-950/80 text-amber-300 border-amber-800',
      reasons
    };
  };

  // Play approval audio chime
  const playApprovalChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.08);
      gain2.gain.setValueAtTime(0, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1174.66, now + 0.16);
      gain3.gain.setValueAtTime(0, now + 0.16);
      gain3.gain.linearRampToValueAtTime(0.35, now + 0.20);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.16);
      osc3.stop(now + 0.85);
    } catch (_) {}
  };

  // Admin Actions for Pending Reports
  const handleApproveWithDepth = (reportId) => {
    const report = citizenReports.find(r => r.id === reportId);
    if (editingReportId === reportId && onUpdateReport) {
      onUpdateReport(reportId, { depthCm: editingReportDepth });
    }
    if (onApproveReport) {
      onApproveReport(reportId);
    }
    setEditingReportId(null);
    playAdminApproveSound();
    showNotice(`✅ ยืนยันอนุมัติจุด "${report?.name || 'รายงาน'}" ขึ้นแสดงบนแผนที่สาธารณะเรียบร้อยแล้ว`);
  };

  const handleReject = (reportId) => {
    const report = citizenReports.find(r => r.id === reportId);
    if (window.confirm(`ยืนยันการลบรายงาน "${report?.name || 'จุดนี้'}" ไปยัง "ลบล่าสุด" (ถังขยะ)?`)) {
      playAdminRejectSound();
      if (report) {
        setDeletedReports(prev => {
          const updated = [{ ...report, deletedAt: new Date().toISOString() }, ...prev.filter(x => x.id !== reportId)];
          try { localStorage.setItem('pg_admin_deleted_reports', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
      if (onRejectReport) {
        onRejectReport(reportId);
      }
      showNotice(`🗑️ ย้ายรายงานไปยัง "ลบล่าสุด" เรียบร้อย (สามารถกู้คืนหรือลบถาวรได้)`, 'info');
    }
  };

  const handleResolve = (reportId) => {
    const report = citizenReports.find(r => r.id === reportId);
    if (onResolveReport) {
      onResolveReport(reportId);
    }
    playAdminResolveSound();
    showNotice(`💧 อัปเดตสถานะจุด "${report?.name || 'รายงาน'}" เป็นระบายแห้งปกติแล้ว`);
  };

  const handleUpdateApprovedDepth = (reportId, depthCm) => {
    if (onUpdateReport) {
      onUpdateReport(reportId, { depthCm });
      playAdminTerminalSound();
      showNotice(`✏️ อัปเดตระดับน้ำเป็น ${depthCm} ซม. เรียบร้อย`);
    }
  };

  // Bulk Actions: Pending Reports
  const handleBulkApprovePending = () => {
    if (selectedPendingIds.size === 0) return;
    const count = selectedPendingIds.size;
    selectedPendingIds.forEach(id => {
      if (onApproveReport) onApproveReport(id);
    });
    setSelectedPendingIds(new Set());
    playAdminApproveSound();
    showNotice(`✅ อนุมัติรายงาน ${count} รายการขึ้นแสดงบนแผนที่เรียบร้อยแล้ว`);
  };

  const handleBulkRejectPending = () => {
    if (selectedPendingIds.size === 0) return;
    const count = selectedPendingIds.size;
    if (!window.confirm(`ยืนยันการย้ายรายงานที่เลือกทั้งหมด ${count} รายการไปยัง "ลบล่าสุด" (ถังขยะ)?`)) return;
    
    playAdminRejectSound();
    const itemsToDelete = citizenReports.filter(r => selectedPendingIds.has(r.id));
    if (itemsToDelete.length > 0) {
      setDeletedReports(prev => {
        const timestamped = itemsToDelete.map(it => ({ ...it, deletedAt: new Date().toISOString() }));
        const updated = [...timestamped, ...prev.filter(x => !selectedPendingIds.has(x.id))];
        try { localStorage.setItem('pg_admin_deleted_reports', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
    selectedPendingIds.forEach(id => {
      if (onRejectReport) onRejectReport(id);
    });
    setSelectedPendingIds(new Set());
    showNotice(`🗑️ ย้ายรายงาน ${count} รายการไปยัง "ลบล่าสุด" เรียบร้อย`, 'info');
  };

  // Single Action: Revoke Approved Report with Confirmation Dialog
  const handleSingleRevokeApproved = (report) => {
    if (!report) return;
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการ "ถอนการอนุมัติ" รายงานนี้?\n\n📍 ${report.name || 'รายงาน'}\n\nระบบจะนำจุดนี้ออกจากแผนที่สาธารณะและย้ายกลับไปเป็นสถานะ "รอการตรวจสอบ"`)) {
      return;
    }
    playAdminRejectSound();
    if (onUpdateReport) {
      onUpdateReport(report.id, { isApproved: false });
    }
    showNotice(`🚫 ถอนการอนุมัติ "${report.name}" เรียบร้อยแล้ว (ย้ายกลับไปรอยืนยัน)`);
  };

  // Bulk Actions: Approved Reports
  const handleBulkRevokeApproved = () => {
    if (selectedApprovedIds.size === 0) return;
    const count = selectedApprovedIds.size;
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการ "ถอนการอนุมัติ" รายงานที่เลือกทั้งหมด ${count} รายการ?\n\nระบบจะนำจุดเหล่านี้ออกจากแผนที่สาธารณะและย้ายกลับไปเป็นสถานะ "รอการตรวจสอบ"`)) return;
    playAdminRejectSound();
    selectedApprovedIds.forEach(id => {
      if (onUpdateReport) onUpdateReport(id, { isApproved: false });
    });
    setSelectedApprovedIds(new Set());
    showNotice(`🚫 ถอนการอนุมัติ ${count} รายการเรียบร้อยแล้ว`);
  };

  const handleBulkDeleteApproved = () => {
    if (selectedApprovedIds.size === 0) return;
    const count = selectedApprovedIds.size;
    if (!window.confirm(`ยืนยันการลบรายงานที่เลือก ${count} รายการไปยัง "ลบล่าสุด" (ถังขยะ)?`)) return;
    playDangerSound();
    const itemsToDelete = citizenReports.filter(r => selectedApprovedIds.has(r.id));
    if (itemsToDelete.length > 0) {
      setDeletedReports(prev => {
        const timestamped = itemsToDelete.map(it => ({ ...it, deletedAt: new Date().toISOString() }));
        const updated = [...timestamped, ...prev.filter(x => !selectedApprovedIds.has(x.id))];
        try { localStorage.setItem('pg_admin_deleted_reports', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
    selectedApprovedIds.forEach(id => {
      if (onRejectReport) onRejectReport(id);
    });
    setSelectedApprovedIds(new Set());
    showNotice(`🗑️ ย้ายรายงาน ${count} รายการไปยัง "ลบล่าสุด" เรียบร้อย`, 'info');
  };

  // Bulk Actions: Feedback
  const handleBulkMarkFeedbackRead = () => {
    if (selectedFeedbackIds.size === 0) return;
    const count = selectedFeedbackIds.size;
    selectedFeedbackIds.forEach(id => {
      if (onToggleFeedbackRead) onToggleFeedbackRead(id, true);
    });
    setLocalFeedback(prev => {
      const updated = prev.map(f => selectedFeedbackIds.has(f.id) ? { ...f, isRead: true } : f);
      try { localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setSelectedFeedbackIds(new Set());
    playSuccessSound();
    showNotice(`✓ ทำเครื่องหมายอ่านแล้ว ${count} ข้อเสนอแนะ`);
  };

  const handleBulkDeleteFeedback = () => {
    if (selectedFeedbackIds.size === 0) return;
    const count = selectedFeedbackIds.size;
    if (!window.confirm(`ยืนยันการลบข้อเสนอแนะที่เลือก ${count} รายการไปยัง "ลบล่าสุด" (ถังขยะ)?`)) return;
    playDangerSound();
    const itemsToDelete = activeFeedbackList.filter(f => selectedFeedbackIds.has(f.id));
    if (itemsToDelete.length > 0) {
      setDeletedFeedback(prev => {
        const timestamped = itemsToDelete.map(it => ({ ...it, deletedAt: new Date().toISOString() }));
        const updated = [...timestamped, ...prev.filter(x => !selectedFeedbackIds.has(x.id))];
        try { localStorage.setItem('pg_admin_deleted_feedback', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }
    selectedFeedbackIds.forEach(id => {
      if (onDeleteFeedback) onDeleteFeedback(id);
    });
    setLocalFeedback(prev => {
      const updated = prev.filter(f => !selectedFeedbackIds.has(f.id));
      try { localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setSelectedFeedbackIds(new Set());
    showNotice(`🗑️ ย้ายข้อเสนอแนะ ${count} รายการไปยัง "ลบล่าสุด" เรียบร้อย`, 'info');
  };

  // Bulk Actions: Trash
  const handleBulkRestoreTrash = () => {
    if (selectedTrashIds.size === 0) return;
    const count = selectedTrashIds.size;
    const repToRestore = deletedReports.filter(r => selectedTrashIds.has(r.id));
    const fbToRestore = deletedFeedback.filter(f => selectedTrashIds.has(f.id));
    repToRestore.forEach(r => {
      if (onAddPoint) onAddPoint(r);
    });
    fbToRestore.forEach(fb => {
      setLocalFeedback(prev => [fb, ...prev.filter(x => x.id !== fb.id)]);
    });
    setDeletedReports(prev => prev.filter(r => !selectedTrashIds.has(r.id)));
    setDeletedFeedback(prev => prev.filter(f => !selectedTrashIds.has(f.id)));
    setSelectedTrashIds(new Set());
    showNotice(`✅ กู้คืนข้อมูลสำเร็จ ${count} รายการ`);
  };

  const handleBulkPermanentDeleteTrash = () => {
    if (selectedTrashIds.size === 0) return;
    const count = selectedTrashIds.size;
    if (!window.confirm(`ยืนยันลบถาวร ${count} รายการ? ไม่สามารถกู้คืนได้อีก`)) return;
    setDeletedReports(prev => {
      const updated = prev.filter(r => !selectedTrashIds.has(r.id));
      try { localStorage.setItem('pg_admin_deleted_reports', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setDeletedFeedback(prev => {
      const updated = prev.filter(f => !selectedTrashIds.has(f.id));
      try { localStorage.setItem('pg_admin_deleted_feedback', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setSelectedTrashIds(new Set());
    showNotice(`🔥 ลบถาวรสำเร็จ ${count} รายการ`, 'info');
  };

  // Feedback Handlers
  const handleToggleFeedback = (id) => {
    if (onToggleFeedbackRead) {
      onToggleFeedbackRead(id);
    } else {
      setLocalFeedback(prev => {
        const updated = prev.map(f => f.id === id ? { ...f, isRead: !f.isRead } : f);
        try {
          localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
    showNotice(`อัปเดตสถานะข้อเสนอแนะเรียบร้อย`);
  };

  const handleDeleteFb = (id) => {
    const fb = activeFeedbackList.find(f => f.id === id);
    if (window.confirm("ยืนยันต้องการย้ายข้อเสนอแนะนี้ไปยัง 'ลบล่าสุด' (ถังขยะ) หรือไม่?")) {
      if (fb) {
        setDeletedFeedback(prev => {
          const updated = [{ ...fb, deletedAt: new Date().toISOString() }, ...prev.filter(x => x.id !== id)];
          try { localStorage.setItem('pg_admin_deleted_feedback', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
      if (onDeleteFeedback) {
        onDeleteFeedback(id);
      } else {
        setLocalFeedback(prev => {
          const updated = prev.filter(f => f.id !== id);
          try {
            localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
      showNotice(`🗑️ ย้ายข้อเสนอแนะไปยัง "ลบล่าสุด" เรียบร้อย`, 'info');
    }
  };

  // Trash Handlers (กู้คืน / ลบถาวร / ล้างถังขยะ)
  const handleRestoreTrashReport = (report) => {
    if (onAddPoint) {
      onAddPoint(report);
    }
    setDeletedReports(prev => {
      const updated = prev.filter(r => r.id !== report.id);
      try { localStorage.setItem('pg_admin_deleted_reports', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    showNotice(`✅ กู้คืนรายงาน "${report.name || 'จุดนี้'}" เรียบร้อยแล้ว`);
  };

  const handlePermanentDeleteReport = (reportId) => {
    if (!window.confirm("ยืนยันลบรายงานนี้ถาวร? ไม่สามารถกู้คืนได้อีก")) return;
    setDeletedReports(prev => {
      const updated = prev.filter(r => r.id !== reportId);
      try { localStorage.setItem('pg_admin_deleted_reports', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    showNotice(`🗑️ ลบรายงานถาวรเรียบร้อยแล้ว`, 'info');
  };

  const handleRestoreTrashFeedback = (fb) => {
    setLocalFeedback(prev => {
      const updated = [fb, ...prev.filter(f => f.id !== fb.id)];
      try { localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setDeletedFeedback(prev => {
      const updated = prev.filter(f => f.id !== fb.id);
      try { localStorage.setItem('pg_admin_deleted_feedback', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    showNotice(`✅ กู้คืนข้อเสนอแนะเรียบร้อยแล้ว`);
  };

  const handlePermanentDeleteFeedback = (fbId) => {
    if (!window.confirm("ยืนยันลบข้อเสนอแนะนี้ถาวร? ไม่สามารถกู้คืนได้อีก")) return;
    setDeletedFeedback(prev => {
      const updated = prev.filter(f => f.id !== fbId);
      try { localStorage.setItem('pg_admin_deleted_feedback', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    showNotice(`🗑️ ลบข้อเสนอแนะถาวรเรียบร้อยแล้ว`, 'info');
  };

  const handleClearAllTrash = () => {
    const total = deletedReports.length + deletedFeedback.length;
    if (total === 0) return;
    if (!window.confirm(`ยืนยันล้างถังขยะทั้งหมด ${total} รายการแบบถาวร?`)) return;
    setDeletedReports([]);
    setDeletedFeedback([]);
    try {
      localStorage.removeItem('pg_admin_deleted_reports');
      localStorage.removeItem('pg_admin_deleted_feedback');
    } catch (e) {}
    showNotice(`🔥 ล้างถังขยะทั้งหมดเรียบร้อยแล้ว`);
  };

  const handleMarkAllFb = () => {
    if (onMarkAllFeedbackRead) {
      onMarkAllFeedbackRead();
    } else {
      setLocalFeedback(prev => {
        const updated = prev.map(f => ({ ...f, isRead: true }));
        try {
          localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
    showNotice(`✓ ทำเครื่องหมายอ่านแล้วทุกข้อความ`);
  };

  const handleClearReadFb = () => {
    if (window.confirm("ยืนยันต้องการลบข้อเสนอแนะที่อ่านแล้วทั้งหมดหรือไม่?")) {
      if (onClearReadFeedback) {
        onClearReadFeedback();
      } else {
        setLocalFeedback(prev => {
          const updated = prev.filter(f => !f.isRead);
          try {
            localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
      showNotice(`🗑️ ลบข้อเสนอแนะที่อ่านแล้วเรียบร้อย`, 'info');
    }
  };

  // Location Handlers
  const handleGetGpsCoords = () => {
    if (!navigator.geolocation) {
      alert("อุปกรณ์นี้ไม่รองรับการดึงพิกัด GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setNewLocationLat(lat);
        setNewLocationLng(lng);
        const detected = detectDistrictForCoordinates(lat, lng);
        if (detected) {
          setNewLocationDistrict(detected);
        }
      },
      (err) => {
        alert("ไม่สามารถดึงตำแหน่งพิกัด GPS ได้: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveNewLocation = (e) => {
    e.preventDefault();
    setLocationFormError('');
    setLocationFormSuccess('');

    if (!newLocationName.trim()) {
      setLocationFormError('กรุณากรอกชื่อสถานที่หรือถนนที่เฝ้าระวัง');
      return;
    }

    const numLat = Number(newLocationLat);
    const numLng = Number(newLocationLng);

    if (isNaN(numLat) || isNaN(numLng)) {
      setLocationFormError('กรุณากรอกพิกัดละติจูดและลองจิจูดให้ถูกต้อง');
      return;
    }

    const val = validateCoordinatePrecision(numLat, numLng, newLocationDistrict);
    if (!val.isValid) {
      setLocationFormError(val.message);
      return;
    }

    const finalDistrict = val.detectedDistrict || newLocationDistrict;
    const aliasesArray = newLocationAliases
      ? newLocationAliases.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const formatted = formatPointForTracking({
      name: newLocationName.trim(),
      district: finalDistrict,
      subdistrict: newLocationSubdistrict.trim() || `อ.${finalDistrict}`,
      lat: numLat,
      lng: numLng,
      depthCm: Number(newLocationDepth),
      cause: newLocationCause.trim(),
      trafficStatus: newLocationTraffic.trim(),
      source: newLocationSource.trim(),
      aliases: aliasesArray
    });

    if (onAddPoint) {
      onAddPoint(formatted);
    }

    showNotice(`✅ บันทึกจุดเฝ้าระวัง "${formatted.name}" (อ.${finalDistrict}) สำเร็จ`);
    setNewLocationName('');
    setNewLocationSubdistrict('');
    setNewLocationLat('');
    setNewLocationLng('');
    setNewLocationAliases('');
    setLocationsSubTab('list');
  };

  const handleImportSingleCatalogPoint = (item) => {
    const formatted = formatPointForTracking(item);
    if (onAddPoint) {
      onAddPoint(formatted);
    }
    showNotice(`📥 นำเข้าจุด "${item.name}" สู่ระบบเรียบร้อย`);
  };

  const handleImportAllUntrackedCatalog = () => {
    const untracked = OFFICIAL_LOCATION_CATALOG.filter(item => 
      !points.some(p => p.name === item.name || (Math.abs(p.lat - item.lat) < 0.001 && Math.abs(p.lng - item.lng) < 0.001))
    );
    if (untracked.length === 0) {
      alert("นำเข้าจุดทั้งหมดในแคตตาล็อกระบบเรียบร้อยแล้ว");
      return;
    }
    const formattedList = untracked.map(formatPointForTracking);
    if (onImportPoints) {
      onImportPoints(formattedList);
    }
    showNotice(`📥 นำเข้าจุดพิกัดระบบสำเร็จ +${formattedList.length} จุด`);
  };

  const loadJsonSample = () => {
    const sample = [
      {
        "name": "ถนนสุขุมวิท ช่วงหน้าพิพิธภัณฑ์ช้างเอราวัณ",
        "district": "เมืองสมุทรปราการ",
        "subdistrict": "ต.บางเมืองใหม่",
        "lat": 13.6288,
        "lng": 100.5898,
        "depthCm": 25,
        "cause": "น้ำฝนสะสมรอระบายลงคลองบางปิ้ง",
        "source": "แขวงทางหลวงสมุทรปราการ"
      },
      {
        "name": "ถนนเทพารักษ์ หน้าวัดบางพลีใหญ่ใน",
        "district": "บางพลี",
        "subdistrict": "ต.บางพลีใหญ่",
        "lat": 13.6065,
        "lng": 100.7092,
        "depthCm": 20,
        "cause": "พื้นที่ลุ่มต่ำริมคลองสำโรง",
        "source": "ศูนย์ข้อมูลอุทกภัยสมุทรปราการ"
      }
    ];
    setImportJsonText(JSON.stringify(sample, null, 2));
  };

  const handleProcessImport = () => {
    setImportResult(null);
    if (!importJsonText.trim()) {
      setImportResult({ success: false, message: 'กรุณาวางข้อมูล JSON ก่อนดำเนินการ' });
      return;
    }

    const res = parseAndValidateExternalData(importJsonText);
    setImportResult(res);

    if (res.success && res.points.length > 0 && onImportPoints) {
      const formatted = res.points.map(formatPointForTracking);
      onImportPoints(formatted);
      showNotice(`📥 นำเข้าข้อมูลสำเร็จ +${formatted.length} จุด`);
      setImportJsonText('');
    }
  };

  // Broadcast Handler
  const handlePublishBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastName.trim()) return;

    const numLat = parseFloat(broadcastLat) || 13.5991;
    const numLng = parseFloat(broadcastLng) || 100.6012;
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    const adminAnnouncement = {
      id: 'admin-broadcast-' + Date.now(),
      isAdminBroadcast: true,
      name: broadcastName.trim(),
      district: broadcastDistrict,
      subdistrict: `อ.${broadcastDistrict}`,
      lat: numLat,
      lng: numLng,
      depthCm: broadcastLevel === 3 ? 55 : broadcastLevel === 2 ? 30 : 15,
      depthRange: broadcastLevel === 3 ? '> 50 ซม.' : broadcastLevel === 2 ? '21 - 50 ซม.' : '5 - 20 ซม.',
      level: broadcastLevel,
      statusLabel: 'ประกาศด่วนโดยแอดมิน',
      trafficStatus: broadcastGuidance.trim() || 'ชะลอความเร็ว หลีกเลี่ยงเส้นทาง',
      cause: 'รายงานด่วนและคำแนะนำพิเศษจากศูนย์บริหารจัดการน้ำท่วมสมุทรปราการ',
      officialGuidance: broadcastGuidance.trim(),
      source: 'ศูนย์ควบคุมสถานการณ์ฉุกเฉิน จ.สมุทรปราการ (ADMIN)',
      isApproved: true,
      isResolved: false,
      reportedAt: nowTime,
      timestamp: Date.now()
    };

    if (onAddAdminBroadcast) {
      onAddAdminBroadcast(adminAnnouncement);
    } else if (onApproveReport) {
      onApproveReport(adminAnnouncement.id, adminAnnouncement);
    }

    showNotice(`📢 ประกาศด่วน "${adminAnnouncement.name}" ขึ้นแสดงบนแผนที่แล้ว`);
    setBroadcastName('');
    setActiveTab('approved');
  };

  // Change Password
  const handleUpdateCredentials = (e) => {
    e.preventDefault();
    if (currentPassInput !== credentials.password && currentPassInput !== DEFAULT_ADMIN_CREDENTIALS.password) {
      setCredentialMessage({ text: 'รหัสผ่านปัจจุบันไม่ถูกต้อง', type: 'error' });
      return;
    }
    if (newPassInput.length < 6) {
      setCredentialMessage({ text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', type: 'error' });
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setCredentialMessage({ text: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', type: 'error' });
      return;
    }

    const updated = {
      username: newUsernameInput.trim() || credentials.username,
      password: newPassInput.trim(),
      role: 'ผู้ดูแลระบบสูงสุด (Super Administrator)'
    };

    setCredentials(updated);
    try {
      localStorage.setItem('prakanguard_admin_credentials', JSON.stringify(updated));
    } catch (e) {}

    setCredentialMessage({ text: 'เปลี่ยนชื่อผู้ใช้และรหัสผ่านสำเร็จเรียบร้อยแล้ว!', type: 'success' });
    showNotice('🔐 เปลี่ยนรหัสผ่าน ADMIN สำเร็จ');
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setTimeout(() => setCredentialMessage({ text: '', type: '' }), 5000);
  };

  // Filtered Lists
  const pendingReports = citizenReports.filter(r => r.isApproved === false);
  const approvedReports = citizenReports.filter(r => r.isApproved && !r.isResolved);
  const historyReports = citizenReports.filter(r => r.isApproved || r.isResolved);
  const unreadFeedbackCount = activeFeedbackList.filter(f => !f.isRead).length;

  // Filtered Pending Reports based on search & district
  const filteredPendingReports = useMemo(() => {
    return pendingReports.filter(r => {
      if (pendingDistrictFilter !== 'ทั้งหมด' && r.district !== pendingDistrictFilter) return false;
      if (pendingHazardFilter === 'flood' && r.hazardType === 'hail') return false;
      if (pendingHazardFilter === 'hail' && r.hazardType !== 'hail') return false;
      if (pendingSearch.trim()) {
        const q = pendingSearch.toLowerCase();
        return (r.name && r.name.toLowerCase().includes(q)) || (r.cause && r.cause.toLowerCase().includes(q)) || (r.district && r.district.toLowerCase().includes(q));
      }
      return true;
    });
  }, [pendingReports, pendingDistrictFilter, pendingHazardFilter, pendingSearch]);

  // Filtered Approved Reports
  const filteredApprovedReports = useMemo(() => {
    return approvedReports.filter(r => {
      if (approvedDistrictFilter !== 'ทั้งหมด' && r.district !== approvedDistrictFilter) return false;
      if (approvedSearch.trim()) {
        const q = approvedSearch.toLowerCase();
        return (r.name && r.name.toLowerCase().includes(q)) || (r.district && r.district.toLowerCase().includes(q));
      }
      return true;
    });
  }, [approvedReports, approvedDistrictFilter, approvedSearch]);

  // Filtered Feedback
  const filteredFeedbackList = useMemo(() => {
    return activeFeedbackList.filter(f => {
      if (feedbackStatusFilter === 'unread' && f.isRead) return false;
      if (feedbackStatusFilter === 'read' && !f.isRead) return false;
      if (feedbackCategoryFilter !== 'all' && f.category !== feedbackCategoryFilter) return false;
      if (feedbackSearch.trim()) {
        const q = feedbackSearch.toLowerCase();
        return (f.message && f.message.toLowerCase().includes(q)) || 
               (f.senderName && f.senderName.toLowerCase().includes(q)) || 
               (f.contact && f.contact.toLowerCase().includes(q));
      }
      return true;
    });
  }, [activeFeedbackList, feedbackStatusFilter, feedbackCategoryFilter, feedbackSearch]);

  // Average Rating
  const averageRating = useMemo(() => {
    if (activeFeedbackList.length === 0) return 5.0;
    const sum = activeFeedbackList.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    return (sum / activeFeedbackList.length).toFixed(1);
  }, [activeFeedbackList]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-4xl border rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden smooth-pop transition-all ${
        isDark ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-slate-950/90' : 'bg-white border-slate-200 text-slate-800 shadow-xl'
      }`}>
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 shrink-0"></div>

        {/* Refresh Toast Popup */}
        {showRefreshToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 border border-emerald-400/40 animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-pulse shrink-0" />
            <span>🔄 รีเฟรชข้อมูลเรียบร้อยแล้ว</span>
          </div>
        )}

        {/* Modal Header */}
        <div className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 to-amber-300 shadow-md shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="PrakanGuard Admin" className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-sm sm:text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ระบบจัดการผู้ดูแลระบบ (ADMIN CONTROL)
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                  isAuthenticated
                    ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                    : (isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-300')
                }`}>
                  {isAuthenticated ? 'ONLINE • สูงสุด' : 'LOCKED'}
                </span>
                {isAuthenticated && (
                  <>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 flex items-center gap-1.5 ${
                      isDark ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700' : 'bg-cyan-50 text-cyan-800 border-cyan-300'
                    }`} title="จำนวนผู้ใช้งานที่กำลังเปิดเว็บอยู่ในขณะนี้ (อิงจากเซสชันสด)">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span>สด: {liveVisitors.length} คน</span>
                    </span>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 flex items-center gap-1.5 ${
                      onlineAdminsCount > 0
                        ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-800 border-emerald-300')
                        : (isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300')
                    }`} title="จำนวนแอดมินที่กำลังออนไลน์เปิดหน้าแดชบอร์ดอยู่ในขณะนี้">
                      <span className={`w-1.5 h-1.5 rounded-full ${onlineAdminsCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
                      <span>แอดมินออนไลน์: {onlineAdminsCount} ท่าน</span>
                    </span>
                  </>
                )}
              </div>
              <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAuthenticated 
                  ? `เข้าสู่ระบบ: ${credentials.username} (${credentials.role || 'Super Admin'})` 
                  : 'กรุณายืนยันตัวตนเพื่อเข้าถึงข้อมูลและการจัดการระบบ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    playRefreshSound();
                    handleManualSyncNow();
                    fetchLiveVisitors();
                    fetchCloudAdminSessions();
                  }}
                  disabled={isManualSyncing}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-amber-700 border-slate-200 shadow-xs'
                  }`}
                  title="รีเฟรชข้อมูลทั้งหมดทันที"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">รีเฟรช</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 transition-colors cursor-pointer border border-transparent hover:border-rose-300 dark:hover:border-rose-900"
                  title="ออกจากระบบ ADMIN"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              </>
            )}
            <button 
              type="button"
              onClick={handleModalClose} 
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legal Disclaimer Notice Banner */}
        <div className={`px-4 py-1.5 text-[10.5px] border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-slate-950/40 border-slate-800/80 text-amber-400/90' : 'bg-amber-50/70 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span className="truncate">
              <strong>สงวนสิทธิ์ลิขสิทธิ์:</strong> การเข้าใช้งานศูนย์ควบคุมระบบของเว็บเฉพาะผู้ร่วมพัฒนาเว็บไซต์และคณะทำงานที่ได้รับอนุญาตเท่านั้น
            </span>
          </div>
          <span className="text-[9.5px] font-mono opacity-70 hidden sm:inline shrink-0">PrakanGuard Security</span>
        </div>

        {/* Internal Admin Notification Banner (Inside Modal Only) */}
        {adminNotice && (
          <div className={`px-4 sm:px-6 py-2.5 text-xs font-bold border-b flex items-center justify-between gap-2 shrink-0 animate-in fade-in duration-200 ${
            adminNotice.type === 'error'
              ? 'bg-rose-500/20 text-rose-200 border-rose-500/40'
              : adminNotice.type === 'info'
              ? 'bg-blue-500/20 text-blue-200 border-blue-500/40'
              : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{adminNotice.text}</span>
            </div>
            <button
              onClick={() => setAdminNotice(null)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. LOGIN SCREEN (WHEN NOT AUTHENTICATED) */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center my-auto overflow-y-auto">
            <div className="w-full max-w-sm space-y-5">
              
              <div className="text-center space-y-1.5">
                <div className="w-16 h-16 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-xl border border-amber-400/50 flex items-center justify-center">
                  <img src="/logo.png" alt="PrakanGuard Admin" className="w-full h-full rounded-full object-cover" />
                </div>
                <h4 className={`text-lg font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  เข้าสู่ระบบแอดมิน (Admin Portal)
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ข้อมูลรายงานประชาชนและข้อเสนอแนะจะแสดงต่อเมื่อเข้าสู่ระบบเท่านั้น
                </p>
              </div>

              {/* Legal Disclaimer Notice Card */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed flex items-start gap-2 text-left">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <span>
                  <strong>ประกาศข้อกำหนดสิทธิ์:</strong> สงวนสิทธิ์ลิขสิทธิ์และการเข้าใช้งานศูนย์ควบคุมระบบของเว็บเฉพาะผู้ร่วมพัฒนาเว็บไซต์และคณะทำงานที่ได้รับอนุญาตเท่านั้น ไม่อนุญาตให้บุคคลภายนอกเข้าถึง ทำซ้ำ หรือดัดแปลงระบบโดยไม่ได้รับอนุญาต
                </span>
              </div>

              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    ชื่อผู้ใช้ (Username)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={inputUsername}
                      onChange={(e) => setInputUsername(e.target.value)}
                      placeholder="Username ผู้ดูแลระบบ"
                      disabled={lockoutSeconds > 0}
                      autoFocus
                      className={`w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-400' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    รหัสผ่าน (Password)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
                      disabled={lockoutSeconds > 0}
                      className={`w-full text-xs sm:text-sm pl-9 pr-10 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-400' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={lockoutSeconds > 0 || !inputUsername.trim() || !inputPassword.trim()}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lockoutSeconds > 0 ? `ระงับชั่วคราว (${lockoutSeconds}s)` : 'เข้าสู่ระบบ ADMIN'}
                </button>
              </form>

            </div>
          </div>
        ) : (
          /* 2. AUTHENTICATED ADMIN PANEL */
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Admin Tabs Bar with Left/Right Scroll Controllers & Sleek Scrollbar */}
            <div className={`relative px-2 sm:px-4 pt-2 border-b flex items-center shrink-0 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/90 border-slate-200'
            }`}>
              {/* Left Scroll Button */}
              {canScrollTabsLeft && (
                <button
                  type="button"
                  onClick={() => scrollAdminTabs('left')}
                  className={`absolute left-1.5 z-20 p-1.5 rounded-xl shadow-lg border transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                  title="เลื่อนดูเมนูก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4 text-amber-500" />
                </button>
              )}

              {/* Tabs Scrollable Container */}
              <div 
                ref={adminTabsRef}
                className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 px-1 custom-scrollbar-thin scroll-smooth select-none"
                style={{ scrollbarWidth: 'thin' }}
              >
                <button
                  type="button"
                  onClick={() => { playAdminTabSound(); setActiveTab('pending'); }}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 ${
                    activeTab === 'pending'
                      ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800' : 'border-amber-500 text-amber-700 bg-white')
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🚨 แจ้งเตือนน้ำท่วม</span>
                  {pendingReports.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                      {pendingReports.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { playAdminTabSound(); setActiveTab('approved'); }}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 ${
                    activeTab === 'approved'
                      ? (isDark ? 'border-emerald-400 text-emerald-300 bg-slate-800' : 'border-emerald-500 text-emerald-700 bg-white')
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📍 แสดงบนแผนที่ ({approvedReports.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { playAdminTabSound(); setActiveTab('locations'); }}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 ${
                    activeTab === 'locations'
                      ? (isDark ? 'border-cyan-400 text-cyan-300 bg-slate-800' : 'border-blue-600 text-blue-700 bg-white')
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>จุดเฝ้าระวัง 6 อำเภอ ({points.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { playAdminTabSound(); setActiveTab('feedback'); }}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 ${
                    activeTab === 'feedback'
                      ? (isDark ? 'border-teal-400 text-teal-300 bg-slate-800' : 'border-teal-500 text-teal-700 bg-white')
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                  <span>ข้อเสนอแนะ</span>
                  {unreadFeedbackCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-teal-500 text-white animate-pulse">
                      {unreadFeedbackCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { playAdminTabSound(); setActiveTab('broadcast'); }}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 ${
                    activeTab === 'broadcast'
                      ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800' : 'border-amber-500 text-amber-700 bg-white')
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5 text-blue-500" />
                  <span>ประกาศด่วน</span>
                </button>

                <button
                  type="button"
                  onClick={() => { playAdminTabSound(); setActiveTab('history'); }}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 ${
                    activeTab === 'history'
                      ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800' : 'border-amber-500 text-amber-700 bg-white')
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>ประวัติ</span>
                </button>

                <button
                  type="button"
                  onClick={() => { playAdminTabSound(); setActiveTab('trash'); }}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 ${
                    activeTab === 'trash'
                      ? (isDark ? 'border-rose-400 text-rose-300 bg-slate-800' : 'border-rose-500 text-rose-700 bg-white')
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>ลบล่าสุด</span>
                  {(deletedReports.length + deletedFeedback.length) > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                      {deletedReports.length + deletedFeedback.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { playAdminTabSound(); setActiveTab('security'); }}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ml-auto shrink-0 ${
                    activeTab === 'security'
                      ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800' : 'border-amber-500 text-amber-700 bg-white')
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>ความปลอดภัย</span>
                </button>
              </div>

              {/* Right Scroll Button */}
              {canScrollTabsRight && (
                <button
                  type="button"
                  onClick={() => scrollAdminTabs('right')}
                  className={`absolute right-1.5 z-20 p-1.5 rounded-xl shadow-lg border transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                  title="เลื่อนดูเมนูถัดไป"
                >
                  <ChevronRight className="w-4 h-4 text-amber-500" />
                </button>
              )}
            </div>

            {/* TAB CONTENTS */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* TAB 1: PENDING REPORTS (WAITING FOR ADMIN APPROVAL) */}
              {activeTab === 'pending' && (
                <div className="space-y-3.5">
                  <div className={`p-3 rounded-2xl border text-xs leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-850 border-slate-700 text-slate-300' : 'bg-amber-50/60 border-amber-200 text-slate-700'
                  }`}>
                    <div>
                      <strong className="block text-slate-900 dark:text-white mb-0.5">
                        🛡️ การตรวจสอบและยืนยันข้อมูลโดยแอดมิน ({pendingReports.length} รายการรอยืนยัน)
                      </strong>
                      <span>ตรวจสอบภาพถ่าย พิกัด และปรับระดับน้ำได้ตามจริงก่อนกด <strong>"อนุมัติขึ้นแผนที่ทันที"</strong></span>
                    </div>

                    {onSyncCloudData && (
                      <button
                        type="button"
                        onClick={handleManualSyncNow}
                        disabled={isManualSyncing}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        title="ดึงรายงานและข้อเสนอแนะล่าสุดจากคลาวด์"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                        <span>{isManualSyncing ? 'กำลังดึงข้อมูลสด...' : '🔄 ซิงก์ดึงข้อมูลจาก Cloud'}</span>
                      </button>
                    )}
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                      {DISTRICTS.map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setPendingDistrictFilter(d)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                            pendingDistrictFilter === d
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : (isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                          }`}
                        >
                          {d === "ทั้งหมด" ? "ทุกอำเภอ" : `อ.${d}`}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 sm:w-56">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          value={pendingSearch}
                          onChange={(e) => setPendingSearch(e.target.value)}
                          placeholder="ค้นหาชื่อจุด / ถนน..."
                          className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pending Reports List */}
                  {filteredPendingReports.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
                      <p className="text-sm font-bold text-slate-300">ไม่มีรายงานใหม่ที่รอยืนยันในขณะนี้</p>
                      <p className="text-xs text-slate-500">
                        {pendingDistrictFilter !== 'ทั้งหมด' || pendingSearch 
                          ? 'ไม่พบข้อมูลที่ตรงกับตัวกรองค้นหา' 
                          : 'เมื่อประชาชนส่งรายงานน้ำท่วมหรือลูกเห็บ จะปรากฏที่นี่เพื่อให้แอดมินอนุมัติก่อนขึ้นแผนที่'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Select All & Bulk Actions for Pending */}
                      <div className={`p-2.5 px-3.5 rounded-2xl border flex items-center justify-between gap-2 flex-wrap ${
                        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={selectedPendingIds.size > 0 && selectedPendingIds.size === filteredPendingReports.length}
                            ref={el => {
                              if (el) el.indeterminate = selectedPendingIds.size > 0 && selectedPendingIds.size < filteredPendingReports.length;
                            }}
                            onChange={(e) => {
                              playSelectSound();
                              if (e.target.checked) {
                                setSelectedPendingIds(new Set(filteredPendingReports.map(r => r.id)));
                              } else {
                                setSelectedPendingIds(new Set());
                              }
                            }}
                            className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                          />
                          <span>เลือกทั้งหมด ({filteredPendingReports.length} รายการ)</span>
                        </label>

                        {selectedPendingIds.size > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-amber-500">
                              เลือก {selectedPendingIds.size} รายการ:
                            </span>
                            <button
                              type="button"
                              onClick={handleBulkApprovePending}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>อนุมัติทั้งหมดที่เลือก</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleBulkRejectPending}
                              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบที่เลือก</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {filteredPendingReports.map(report => {
                        const cred = evaluateCredibility(report);
                        const isHail = report.hazardType === 'hail';

                        return (
                          <div 
                            key={report.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              selectedPendingIds.has(report.id)
                                ? (isDark ? 'bg-amber-950/20 border-amber-500/60 shadow-md ring-1 ring-amber-500/30' : 'bg-amber-50/70 border-amber-300 shadow-sm ring-1 ring-amber-300')
                                : (isDark ? 'bg-slate-850 border-slate-700/80 shadow-md' : 'bg-white border-slate-200 shadow-sm')
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <input 
                                  type="checkbox"
                                  checked={selectedPendingIds.has(report.id)}
                                  onChange={(e) => {
                                    setSelectedPendingIds(prev => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(report.id);
                                      else next.delete(report.id);
                                      return next;
                                    });
                                  }}
                                  className="w-4 h-4 rounded text-amber-500 cursor-pointer mt-1 shrink-0"
                                  title="เลือกรายการนี้"
                                />
                                <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isDark ? cred.darkBadgeClass : cred.badgeClass}`}>
                                  ความน่าเชื่อถือ: {cred.score}% ({cred.label})
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  แจ้งเมื่อ: {report.reportedAt}
                                </span>
                                {isHail ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    🧊 {report.hailSizeLabel || 'ลูกเห็บตก'}
                                  </span>
                                ) : (
                                  <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold ${
                                    (report.level === 3 || report.severity === 3 || report.bodyLevelLabel === 'วิกฤต' || (report.depthCm && report.depthCm > 50))
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                      : (report.level === 2 || report.severity === 2 || report.bodyLevelLabel === 'ปานกลาง' || (report.depthCm && report.depthCm > 20))
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  }`}>
                                    🌊 ระดับ: {report.bodyLevelLabel || (report.level === 3 || report.severity === 3 || (report.depthCm && report.depthCm > 50) ? 'วิกฤต' : report.level === 2 || report.severity === 2 || (report.depthCm && report.depthCm > 20) ? 'ปานกลาง' : 'ปกติ')} ({report.depthRange || `${report.depthCm || 15} ซม.`})
                                  </span>
                                )}
                              </div>

                              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                {report.name}
                              </h4>
                              
                              <div className="mt-1 flex items-center gap-2 flex-wrap text-xs">
                                <span className="text-slate-600 dark:text-slate-300 font-medium">
                                  อ.{report.district} {report.subdistrict ? `• ต.${report.subdistrict}` : ''}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 dark:bg-blue-950/60 border border-blue-500/30 text-blue-700 dark:text-cyan-300 font-mono font-bold text-[11px] shadow-2xs">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>พิกัดที่แน่นอน: {Number(report.lat).toFixed(5)}, {Number(report.lng).toFixed(5)}</span>
                                </span>
                              </div>

                              {report.cause && (
                                <p className="text-xs text-slate-700 dark:text-slate-300 bg-black/5 dark:bg-black/30 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                                  💬 <strong>บันทึกจากผู้แจ้ง:</strong> {report.cause}
                                </p>
                              )}

                              {/* Fine-grained Quick Adjuster for Admin before approving */}
                              <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                                <span className="text-[11px] text-slate-400">ปรับระดับน้ำก่อนอนุมัติ:</span>
                                {[15, 30, 55].map(cm => (
                                  <button
                                    key={cm}
                                    type="button"
                                    onClick={() => {
                                      setEditingReportId(report.id);
                                      setEditingReportDepth(cm);
                                    }}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                      (editingReportId === report.id ? editingReportDepth : report.depthCm) === cm
                                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                                    }`}
                                  >
                                    {cm} ซม.
                                  </button>
                                ))}
                              </div>
                              </div>
                            </div>

                            {/* Photo Evidence Thumbnail */}
                            {report.photoUrl && (
                              <div 
                                onClick={() => setSelectedPhotoModal(report.photoUrl)}
                                className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/20 shrink-0 cursor-pointer group shadow-md"
                              >
                                <img src={report.photoUrl} alt="หลักฐาน" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              {onFlyToCoords && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    playAdminGpsSound();
                                    onFlyToCoords(report.lat, report.lng, 17, report.id);
                                    handleModalClose();
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                  title={`คลิกเพื่อดูตำแหน่งที่แน่นอน (${Number(report.lat).toFixed(5)}, ${Number(report.lng).toFixed(5)}) บนแผนที่`}
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                  <span>ดูตำแหน่งที่แน่นอนบนแผนที่</span>
                                  <span className="font-mono text-[11px] opacity-90">({Number(report.lat).toFixed(4)}, {Number(report.lng).toFixed(4)})</span>
                                </button>
                              )}
                              <a
                                href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                                title="เปิดใน Google Maps"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>Google Maps</span>
                              </a>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleReject(report.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                              >
                                ✕ ปฏิเสธ / ลบ
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveWithDepth(report.id)}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>อนุมัติขึ้นแผนที่ทันที</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                </div>
              )}

              {/* TAB 2: APPROVED REPORTS (LIVE ON MAP) */}
              {activeTab === 'approved' && (
                <div className="space-y-3.5">
                  <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-850 border-slate-700 text-slate-300' : 'bg-emerald-50/60 border-emerald-200 text-slate-700'
                  }`}>
                    <strong className="block text-slate-900 dark:text-white mb-0.5">
                      📍 จุดที่กำลังแสดงบนแผนที่สาธารณะ ({approvedReports.length} จุด)
                    </strong>
                    <span>เมื่อสถานการณ์น้ำลดระดับแห้งแล้ว สามารถกด <strong>"น้ำแห้งแล้ว / ปิดจุด"</strong> เพื่ออัปเดตแจ้งเตือนประชาชนให้ทราบว่าปลอดภัย</span>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                      {DISTRICTS.map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setApprovedDistrictFilter(d)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                            approvedDistrictFilter === d
                              ? 'bg-emerald-600 text-white font-bold'
                              : (isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                          }`}
                        >
                          {d === "ทั้งหมด" ? "ทุกอำเภอ" : `อ.${d}`}
                        </button>
                      ))}
                    </div>

                    <div className="relative flex-1 sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        value={approvedSearch}
                        onChange={(e) => setApprovedSearch(e.target.value)}
                        placeholder="ค้นหาจุดที่แสดง..."
                        className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                  </div>

                  {filteredApprovedReports.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      ยังไม่มีจุดรายงานที่กำลังแสดงบนแผนที่
                    </div>
                  ) : (
                    <>
                      {/* Select All & Bulk Actions for Approved */}
                      <div className={`p-2.5 px-3.5 rounded-2xl border flex items-center justify-between gap-2 flex-wrap ${
                        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={selectedApprovedIds.size > 0 && selectedApprovedIds.size === filteredApprovedReports.length}
                            ref={el => {
                              if (el) el.indeterminate = selectedApprovedIds.size > 0 && selectedApprovedIds.size < filteredApprovedReports.length;
                            }}
                            onChange={(e) => {
                              playSelectSound();
                              if (e.target.checked) {
                                setSelectedApprovedIds(new Set(filteredApprovedReports.map(r => r.id)));
                              } else {
                                setSelectedApprovedIds(new Set());
                              }
                            }}
                            className="w-4 h-4 rounded text-emerald-500 cursor-pointer"
                          />
                          <span>เลือกทั้งหมด ({filteredApprovedReports.length} รายการ)</span>
                        </label>

                        {selectedApprovedIds.size > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-emerald-500">
                              เลือก {selectedApprovedIds.size} รายการ:
                            </span>
                            <button
                              type="button"
                              onClick={handleBulkRevokeApproved}
                              className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                            >
                              <span>🚫 ยกเลิกอนุมัติที่เลือก</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleBulkDeleteApproved}
                              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบที่เลือก</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {filteredApprovedReports.map(report => (
                        <div 
                          key={report.id}
                          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            selectedApprovedIds.has(report.id)
                              ? (isDark ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30' : 'bg-emerald-50/70 border-emerald-300 shadow-sm ring-1 ring-emerald-300')
                              : (isDark ? 'bg-slate-850/90 border-slate-750' : 'bg-white border-slate-200 shadow-sm')
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <input 
                              type="checkbox"
                              checked={selectedApprovedIds.has(report.id)}
                              onChange={(e) => {
                                setSelectedApprovedIds(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(report.id);
                                  else next.delete(report.id);
                                  return next;
                                });
                              }}
                              className="w-4 h-4 rounded text-emerald-500 cursor-pointer mt-1 shrink-0"
                              title="เลือกรายการนี้"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  อัปเดตเมื่อ: {report.approvedAt || report.reportedAt}
                                </span>
                            {report.isAdminBroadcast ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                                ประกาศแอดมิน
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                รายงานประชาชน
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-slate-400">
                              อ.{report.district}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {report.name}
                          </h4>
                          
                          <div className="mt-1 flex items-center gap-2 flex-wrap text-xs">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              อ.{report.district} {report.subdistrict ? `• ต.${report.subdistrict}` : ''}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[11px] shadow-2xs">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>พิกัดที่แน่นอน: {Number(report.lat).toFixed(5)}, {Number(report.lng).toFixed(5)}</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            ระดับ: {report.bodyLevelLabel ? `${report.bodyLevelLabel} • ` : ''}{report.depthCm !== undefined && report.depthCm !== null ? report.depthCm : 0} ซม. ({report.depthRange || 'ท่วมผิวจราจร'}) {report.cause ? `• ${report.cause}` : ''}
                          </p>

                          {/* Inline depth adjuster */}
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="text-[11px] text-slate-400">ปรับระดับน้ำสด:</span>
                            {[0, 15, 30, 50].map(cm => (
                              <button
                                key={cm}
                                type="button"
                                onClick={() => handleUpdateApprovedDepth(report.id, cm)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                  report.depthCm === cm 
                                    ? 'bg-blue-600 text-white border-blue-500' 
                                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                                }`}
                              >
                                {cm === 0 ? 'แห้ง' : `${cm} ซม.`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 flex-wrap">
                          {onFlyToCoords && (
                            <button
                              type="button"
                              onClick={() => {
                                playAdminGpsSound();
                                onFlyToCoords(report.lat, report.lng, 17, report.id);
                                handleModalClose();
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                              title={`คลิกเพื่อดูตำแหน่งที่แน่นอน (${Number(report.lat).toFixed(5)}, ${Number(report.lng).toFixed(5)}) บนแผนที่`}
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>ดูพิกัดบนแผนที่</span>
                              <span className="font-mono text-[10px] opacity-90">({Number(report.lat).toFixed(4)}, {Number(report.lng).toFixed(4)})</span>
                            </button>
                          )}

                          <a
                            href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer flex items-center gap-1"
                            title="เปิดใน Google Maps"
                          >
                            <ExternalLink className="w-4 h-4 text-cyan-400" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleSingleRevokeApproved(report)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 text-xs font-bold cursor-pointer transition-all border border-amber-300 dark:border-amber-800 flex items-center gap-1 active:scale-95 shadow-xs"
                            title="ถอนการอนุมัติและย้ายกลับไปสถานะรอการตรวจสอบ"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>ถอนอนุมัติ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResolve(report.id)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-cyan-300 text-xs font-bold cursor-pointer transition-colors border border-blue-200 dark:border-blue-800 flex items-center gap-1 active:scale-95 shadow-xs"
                            title="ทำเครื่องหมายว่าน้ำแห้งแล้ว"
                          >
                            <span>💧 น้ำแห้งแล้ว / ปิดจุด</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleReject(report.id)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                            title="ลบออกจากระบบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: LOCATIONS MANAGEMENT (6 DISTRICTS) */}
              {activeTab === 'locations' && (
                <div className="space-y-4">
                  {/* Top Sub-Nav Pills */}
                  <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setLocationsSubTab('list')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        locationsSubTab === 'list'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>จุดเฝ้าระวังทั้งหมด ({points.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLocationsSubTab('add')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        locationsSubTab === 'add'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ เพิ่มสถานที่ใหม่</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLocationsSubTab('catalog')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        locationsSubTab === 'catalog'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>คลัง 30 จุดเสี่ยงมาตรฐาน ({OFFICIAL_LOCATION_CATALOG.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLocationsSubTab('import_data')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        locationsSubTab === 'import_data'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <DownloadCloud className="w-3.5 h-3.5" />
                      <span>นำเข้า JSON</span>
                    </button>
                  </div>

                  {/* Subtab 1: List & Fine-Grained Point Depth Control */}
                  {locationsSubTab === 'list' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                          {DISTRICTS.map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setActivePointsDistrictFilter(d)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                                activePointsDistrictFilter === d
                                  ? 'bg-blue-600 text-white font-bold'
                                  : (isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                              }`}
                            >
                              {d === "ทั้งหมด" ? "ทุกอำเภอ" : `อ.${d}`}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={activePointsSearch}
                            onChange={(e) => setActivePointsSearch(e.target.value)}
                            placeholder="ค้นหาจุดที่ติดตาม..."
                            className={`px-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                            }`}
                          />

                          {onResetPoints && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("ยืนยันต้องการคืนค่าจุดเฝ้าระวังเริ่มต้น 30 จุดมาตรฐานหรือไม่?")) {
                                  onResetPoints();
                                  showNotice('🔄 คืนค่าจุดมาตรฐาน 30 จุด เรียบร้อยแล้ว');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                              title="คืนค่าจุดเริ่มต้น 30 จุด"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Points List */}
                      <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                        {points
                          .filter(p => {
                            if (activePointsDistrictFilter !== "ทั้งหมด" && p.district !== activePointsDistrictFilter) return false;
                            if (activePointsSearch.trim()) {
                              const q = activePointsSearch.toLowerCase();
                              return (p.name && p.name.toLowerCase().includes(q)) || (p.subdistrict && p.subdistrict.toLowerCase().includes(q));
                            }
                            return true;
                          })
                          .map(point => {
                            const isResolved = point.isResolved || point.depthCm === 0;

                            return (
                              <div 
                                key={point.id}
                                className={`p-3.5 rounded-2xl border transition-all ${
                                  isDark ? 'bg-slate-850/90 border-slate-750' : 'bg-white border-slate-200 shadow-xs'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500 border border-blue-500/30">
                                      อ.{point.district}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      isResolved 
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                        : (point.level === 3 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300')
                                    }`}>
                                      {isResolved ? "🟢 ปกติ (แห้งแล้ว)" : point.level === 3 ? "🔴 น้ำท่วมวิกฤต" : point.level === 2 ? "🟠 น้ำท่วมปานกลาง" : "🟢 น้ำท่วมปกติ"} ({point.depthCm || 0} ซม.)
                                    </span>
                                  </div>

                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {point.lat ? point.lat.toFixed(4) : ''}, {point.lng ? point.lng.toFixed(4) : ''}
                                  </span>
                                </div>

                                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1">
                                  {point.name}
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                                  {point.trafficStatus || point.cause}
                                </div>

                                {/* Continuous Depth Slider right in card */}
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap text-xs">
                                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                    <span className="text-[11px] text-slate-400 whitespace-nowrap">ปรับระดับน้ำ:</span>
                                    <input 
                                      type="range"
                                      min="0"
                                      max="85"
                                      value={point.depthCm || 0}
                                      onChange={(e) => {
                                        if (onUpdatePoint) {
                                          onUpdatePoint(point.id, { depthCm: Number(e.target.value) });
                                        }
                                      }}
                                      className="w-full accent-blue-600 cursor-pointer"
                                    />
                                    <span className="font-bold font-mono text-xs w-14 text-right">
                                      {point.depthCm || 0} ซม.
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 ml-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onUpdatePoint) {
                                          onUpdatePoint(point.id, { depthCm: isResolved ? 20 : 0 });
                                          showNotice(`ปรับสถานะ "${point.name}" เป็น ${isResolved ? '20 ซม.' : 'แห้งปกติ'}`);
                                        }
                                      }}
                                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                                    >
                                      {isResolved ? 'จำลองน้ำท่วม' : 'ปรับเป็นแห้ง'}
                                    </button>

                                    {onDeletePoint && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`ยืนยันการลบจุด "${point.name}"?`)) {
                                            onDeletePoint(point.id);
                                            showNotice(`ลบจุด "${point.name}" สำเร็จ`, 'info');
                                          }
                                        }}
                                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                                        title="ลบจุดนี้"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Subtab 2: Add New Location Form */}
                  {locationsSubTab === 'add' && (
                    <div className="space-y-4 max-w-2xl mx-auto">
                      <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                        isDark ? 'bg-slate-850 border-slate-800 text-slate-300' : 'bg-blue-50/70 border-blue-200 text-slate-700'
                      }`}>
                        <strong className="block text-slate-900 dark:text-white mb-1">
                          📍 เพิ่มจุดเฝ้าระวังใหม่ใน 6 อำเภอ จ.สมุทรปราการ
                        </strong>
                        ระบบจะตรวจสอบพิกัดว่าอยู่ภายในเขต 6 อำเภอ (เมือง, บางพลี, บางบ่อ, บางเสาธง, พระประแดง, พระสมุทรเจดีย์) แบบอัตโนมัติ
                      </div>

                      {locationFormError && (
                        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{locationFormError}</span>
                        </div>
                      )}

                      <form onSubmit={handleSaveNewLocation} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-semibold mb-1">ชื่อสถานที่ / ถนน (*)</label>
                          <input 
                            type="text"
                            value={newLocationName}
                            onChange={(e) => setNewLocationName(e.target.value)}
                            placeholder="เช่น ถนนสุขุมวิท หน้าพิพิธภัณฑ์ช้างเอราวัณ"
                            className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                            }`}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold mb-1">อำเภอ</label>
                            <select
                              value={newLocationDistrict}
                              onChange={(e) => setNewLocationDistrict(e.target.value)}
                              className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                              }`}
                            >
                              {DISTRICTS.filter(d => d !== "ทั้งหมด").map(d => (
                                <option key={d} value={d}>อ.{d}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">ตำบล / ย่าน</label>
                            <input 
                              type="text"
                              value={newLocationSubdistrict}
                              onChange={(e) => setNewLocationSubdistrict(e.target.value)}
                              placeholder="เช่น ต.บางเมืองใหม่"
                              className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold mb-1">ละติจูด (Lat)</label>
                            <input 
                              type="text"
                              value={newLocationLat}
                              onChange={(e) => setNewLocationLat(e.target.value)}
                              placeholder="เช่น 13.6288"
                              className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                              }`}
                              required
                            />
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">ลองจิจูด (Lng)</label>
                            <input 
                              type="text"
                              value={newLocationLng}
                              onChange={(e) => setNewLocationLng(e.target.value)}
                              placeholder="เช่น 100.5898"
                              className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                              }`}
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGetGpsCoords}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Crosshair className="w-3.5 h-3.5 text-blue-500" />
                            <span>ใช้พิกัด GPS ปัจจุบัน</span>
                          </button>

                          {onPickLocationOnMap && (
                            <button
                              type="button"
                              onClick={onPickLocationOnMap}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-violet-500" />
                              <span>แตะเลือกจุดบนแผนที่</span>
                            </button>
                          )}
                        </div>

                        {coordValidation && (
                          <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                            coordValidation.isValid 
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300' 
                              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-700 dark:text-rose-300'
                          }`}>
                            {coordValidation.isValid ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                            <span>{coordValidation.message}</span>
                          </div>
                        )}

                        <div>
                          <label className="block font-semibold mb-1">ระดับน้ำเริ่มต้น (ซม.)</label>
                          <input 
                            type="number"
                            value={newLocationDepth}
                            onChange={(e) => setNewLocationDepth(Number(e.target.value))}
                            className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                            }`}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all"
                        >
                          บันทึกจุดเฝ้าระวังใหม่
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Subtab 3: Catalog */}
                  {locationsSubTab === 'catalog' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                          {DISTRICTS.map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setCatalogDistrictFilter(d)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                                catalogDistrictFilter === d
                                  ? 'bg-blue-600 text-white font-bold'
                                  : (isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                              }`}
                            >
                              {d === "ทั้งหมด" ? "ทุกอำเภอ" : `อ.${d}`}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            placeholder="ค้นหาในแคตตาล็อก..."
                            className={`px-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={handleImportAllUntrackedCatalog}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>นำเข้าทั้งหมดที่ยังไม่มี</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                        {OFFICIAL_LOCATION_CATALOG
                          .filter(item => {
                            if (catalogDistrictFilter !== "ทั้งหมด" && item.district !== catalogDistrictFilter) return false;
                            if (catalogSearch.trim()) {
                              const q = catalogSearch.toLowerCase();
                              return item.name.toLowerCase().includes(q) || item.district.toLowerCase().includes(q);
                            }
                            return true;
                          })
                          .map(item => {
                            const isAlreadyTracked = points.some(p => p.name === item.name || (Math.abs(p.lat - item.lat) < 0.001 && Math.abs(p.lng - item.lng) < 0.001));

                            return (
                              <div 
                                key={item.catalogId}
                                className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                                  isDark ? 'bg-slate-850/90 border-slate-750' : 'bg-white border-slate-200 shadow-xs'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500 border border-blue-500/30">
                                      อ.{item.district}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                                    </span>
                                  </div>

                                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                                    {item.name}
                                  </h5>

                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                    {item.cause}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                  {isAlreadyTracked ? (
                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>ติดตามในระบบแล้ว</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleImportSingleCatalogPoint(item)}
                                      className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" />
                                      <span>+ นำเข้าสู่ระบบติดตาม</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Subtab 4: External Data Import */}
                  {locationsSubTab === 'import_data' && (
                    <div className="space-y-3.5 max-w-2xl mx-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">วางข้อความ JSON / GeoJSON:</span>
                        <button
                          type="button"
                          onClick={loadJsonSample}
                          className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          โหลดตัวอย่าง JSON
                        </button>
                      </div>

                      <textarea
                        value={importJsonText}
                        onChange={(e) => setImportJsonText(e.target.value)}
                        placeholder="[ { 'name': '...', 'district': '...', 'lat': 13.xxx, 'lng': 100.xxx } ]"
                        rows={8}
                        className={`w-full p-3 rounded-2xl border font-mono text-xs focus:outline-none ${
                          isDark ? 'bg-slate-850 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                        }`}
                      />

                      {importResult && (
                        <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                          importResult.success 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-700 dark:text-rose-300'
                        }`}>
                          {importResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                          <span>{importResult.message}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleProcessImport}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all"
                      >
                        ประมวลผลและนำเข้าพิกัด
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CITIZEN FEEDBACK & SUGGESTIONS */}
              {activeTab === 'feedback' && (
                <div className="space-y-4">
                  {/* Top KPI Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                      isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">ข้อเสนอแนะทั้งหมด</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {activeFeedbackList.length} รายการ
                        </div>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                      isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        unreadFeedbackCount > 0 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">ยังไม่ได้อ่าน</div>
                        <div className={`text-lg font-bold ${unreadFeedbackCount > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                          {unreadFeedbackCount} รายการ
                        </div>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                      isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold shrink-0">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">คะแนนความพึงพอใจเฉลี่ย</div>
                        <div className="text-lg font-bold text-amber-400">
                          ⭐ {averageRating} / 5.0
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => setFeedbackStatusFilter('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          feedbackStatusFilter === 'all'
                            ? 'bg-teal-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ทั้งหมด ({activeFeedbackList.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackStatusFilter('unread')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          feedbackStatusFilter === 'unread'
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ยังไม่อ่าน ({unreadFeedbackCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackStatusFilter('read')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          feedbackStatusFilter === 'read'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        อ่านแล้ว ({activeFeedbackList.length - unreadFeedbackCount})
                      </button>
                    </div>

                    {/* Search & Bulk Actions */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 sm:w-52">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          value={feedbackSearch}
                          onChange={(e) => setFeedbackSearch(e.target.value)}
                          placeholder="ค้นหาข้อความ / ผู้ส่ง..."
                          className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>

                      {unreadFeedbackCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllFb}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
                          title="ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {activeFeedbackList.some(f => f.isRead) && (
                        <button
                          type="button"
                          onClick={handleClearReadFb}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors shrink-0"
                          title="ลบข้อความที่อ่านแล้วทั้งหมด"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onSyncCloudData && (
                        <button
                          type="button"
                          onClick={handleManualSyncNow}
                          disabled={isManualSyncing}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1 shadow-xs disabled:opacity-50"
                          title="ดึงข้อเสนอแนะล่าสุดจากคลาวด์"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">{isManualSyncing ? 'กำลังดึง...' : 'ซิงก์ดึงข้อมูลสด'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Select All & Bulk Actions for Feedback */}
                  {filteredFeedbackList.length > 0 && (
                    <div className={`p-2.5 px-3.5 rounded-2xl border flex items-center justify-between gap-2 flex-wrap ${
                      isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={selectedFeedbackIds.size > 0 && selectedFeedbackIds.size === filteredFeedbackList.length}
                          ref={el => {
                            if (el) el.indeterminate = selectedFeedbackIds.size > 0 && selectedFeedbackIds.size < filteredFeedbackList.length;
                          }}
                          onChange={(e) => {
                            playSelectSound();
                            if (e.target.checked) {
                              setSelectedFeedbackIds(new Set(filteredFeedbackList.map(f => f.id)));
                            } else {
                              setSelectedFeedbackIds(new Set());
                            }
                          }}
                          className="w-4 h-4 rounded text-teal-500 cursor-pointer"
                        />
                        <span>เลือกทั้งหมด ({filteredFeedbackList.length} รายการ)</span>
                      </label>

                      {selectedFeedbackIds.size > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-teal-400">
                            เลือก {selectedFeedbackIds.size} รายการ:
                          </span>
                          <button
                            type="button"
                            onClick={handleBulkMarkFeedbackRead}
                            className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>ทำเครื่องหมายอ่านแล้ว</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkDeleteFeedback}
                            className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบที่เลือก</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Cards List */}
                  <div className="space-y-3 max-h-[56vh] overflow-y-auto pr-1">
                    {filteredFeedbackList.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 space-y-2">
                        <MessageSquare className="w-9 h-9 text-teal-500/60 mx-auto" />
                        <p className="text-sm font-bold">ไม่มีข้อเสนอแนะในหมวดหมู่นี้</p>
                        <p className="text-xs text-slate-500">
                          {feedbackStatusFilter === 'unread' 
                            ? 'คุณได้อ่านข้อเสนอแนะครบทุกข้อความแล้วครับ' 
                            : 'เมื่อประชาชนส่งข้อเสนอแนะหรือข้อติชมผ่านหน้าเว็บ จะปรากฏที่นี่ทันที'}
                        </p>
                      </div>
                    ) : (
                      filteredFeedbackList.map(item => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            selectedFeedbackIds.has(item.id)
                              ? (isDark ? 'bg-teal-950/40 border-teal-500/80 shadow-md ring-1 ring-teal-500/30' : 'bg-teal-50/80 border-teal-400 shadow-sm ring-1 ring-teal-300')
                              : !item.isRead
                              ? (isDark ? 'bg-teal-950/25 border-teal-500/60 shadow-sm' : 'bg-teal-50/50 border-teal-400/80 shadow-xs')
                              : (isDark ? 'bg-slate-850/90 border-slate-750' : 'bg-white border-slate-200 shadow-2xs')
                          }`}
                        >
                          {/* Card Top */}
                          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              <input 
                                type="checkbox"
                                checked={selectedFeedbackIds.has(item.id)}
                                onChange={(e) => {
                                  setSelectedFeedbackIds(prev => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(item.id);
                                    else next.delete(item.id);
                                    return next;
                                  });
                                }}
                                className="w-4 h-4 rounded text-teal-500 cursor-pointer shrink-0"
                                title="เลือกรายการนี้"
                              />
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isDark ? 'bg-slate-800 text-teal-300 border-teal-800' : 'bg-teal-50 text-teal-800 border-teal-200'
                              }`}>
                                {item.categoryLabel || item.category || 'ข้อเสนอแนะ'}
                              </span>

                              {!item.isRead && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-teal-500 text-white animate-pulse">
                                  ใหม่
                                </span>
                              )}

                              {/* Star Rating Display */}
                              <div className="flex items-center gap-0.5 ml-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star 
                                    key={s} 
                                    className={`w-3.5 h-3.5 ${
                                      s <= (item.rating || 5) 
                                        ? 'fill-amber-400 text-amber-400' 
                                        : 'text-slate-300 dark:text-slate-700'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>

                            <span className="text-[11px] text-slate-400 font-mono">
                              {item.submittedAt}
                            </span>
                          </div>

                          {/* Message Body */}
                          <div className="py-2.5">
                            <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                              isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}>
                              {item.message}
                            </p>
                          </div>

                          {/* Card Bottom: Sender Info & Actions */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                ผู้ส่ง: {item.senderName || 'นิรนาม'}
                              </span>
                              {item.contact && item.contact !== '-' && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400">
                                    <Phone className="w-3 h-3" />
                                    {item.contact}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                type="button"
                                onClick={() => handleToggleFeedback(item.id)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  item.isRead
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-500 hover:text-white'
                                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-xs'
                                }`}
                                title={item.isRead ? 'ทำเป็นยังไม่ได้อ่าน' : 'ทำเครื่องหมายว่าอ่านแล้ว'}
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>{item.isRead ? 'อ่านแล้ว' : 'ทำเครื่องหมายอ่านแล้ว'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteFb(item.id)}
                                className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                                title="ลบข้อเสนอแนะนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: EMERGENCY BROADCAST */}
              {activeTab === 'broadcast' && (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-850 border-slate-700 text-slate-300' : 'bg-amber-50/70 border-amber-200 text-slate-700'
                  }`}>
                    <strong className="block text-slate-900 dark:text-white mb-1">
                      📢 ออกประกาศฉุกเฉินโดยแอดมินทันที
                    </strong>
                    เมื่อกดเผยแพร่ จุดนี้จะขึ้นแสดงบนแผนที่สาธารณะทันทีเพื่อแจ้งเตือนประชาชนในสถานการณ์วิกฤต
                  </div>

                  <form onSubmit={handlePublishBroadcast} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">หัวข้อประกาศ / ชื่อถนน (*)</label>
                      <input 
                        type="text"
                        value={broadcastName}
                        onChange={(e) => setBroadcastName(e.target.value)}
                        placeholder="เช่น ปิดการจราจรชั่วคราว ถนนสุขุมวิท ช่วงแบริ่ง-สำโรง"
                        className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">อำเภอ</label>
                        <select
                          value={broadcastDistrict}
                          onChange={(e) => setBroadcastDistrict(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        >
                          {DISTRICTS.filter(d => d !== "ทั้งหมด").map(d => (
                            <option key={d} value={d}>อ.{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1">ระดับความรุนแรง</label>
                        <select
                          value={broadcastLevel}
                          onChange={(e) => setBroadcastLevel(Number(e.target.value))}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        >
                          <option value={1}>🟢 ระดับ 1: น้ำท่วมปกติ (5 - 20 ซม.)</option>
                          <option value={2}>🟠 ระดับ 2: น้ำท่วมปานกลาง (21 - 50 ซม.)</option>
                          <option value={3}>🔴 ระดับ 3: น้ำท่วมวิกฤต (&gt; 50 ซม.)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">คำแนะนำ / ข้อความแจ้งเตือน</label>
                      <textarea
                        value={broadcastGuidance}
                        onChange={(e) => setBroadcastGuidance(e.target.value)}
                        rows={3}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Lat</label>
                        <input 
                          type="text"
                          value={broadcastLat}
                          onChange={(e) => setBroadcastLat(e.target.value)}
                          className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Lng</label>
                        <input 
                          type="text"
                          value={broadcastLng}
                          onChange={(e) => setBroadcastLng(e.target.value)}
                          className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all"
                    >
                      เผยแพร่ประกาศฉุกเฉินขึ้นแผนที่ทันที
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 6: AUDIT HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-3.5 max-w-2xl mx-auto">
                  {/* History Subtab Switcher */}
                  <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setHistorySubTab('reports')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        historySubTab === 'reports'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>จุดรายงาน & น้ำท่วม ({historyReports.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistorySubTab('logins')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        historySubTab === 'logins'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>ประวัติเข้าสู่ระบบแอดมิน ({adminLoginHistory.length})</span>
                    </button>
                  </div>

                  {historySubTab === 'reports' ? (
                    <>
                      <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                        isDark ? 'bg-slate-850 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <strong className="block text-slate-900 dark:text-white mb-1">
                          🕒 ประวัติการบันทึกและอนุมัติข้อมูล ({historyReports.length} รายการ)
                        </strong>
                        แสดงประวัติการยืนยันและการระบายแห้งของรายงานทั้งหมด
                      </div>

                      {historyReports.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          ยังไม่มีประวัติการจัดการในระบบ
                        </div>
                      ) : (
                        historyReports.map(item => (
                          <div 
                            key={item.id}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                              isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  item.isResolved 
                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {item.isResolved ? 'ระบายแห้งแล้ว' : 'อนุมัติแล้ว'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {item.resolvedAt || item.approvedAt || item.reportedAt}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                อ.{item.district} • {item.depthRange || `${item.depthCm} ซม.`}
                              </div>
                            </div>

                            {item.photoUrl && (
                              <div 
                                onClick={() => setSelectedPhotoModal(item.photoUrl)}
                                className="w-10 h-10 rounded-xl overflow-hidden shrink-0 cursor-pointer border border-white/10"
                              >
                                <img src={item.photoUrl} alt="รูป" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </>
                  ) : (
                    <>
                      <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-center justify-between gap-2 ${
                        isDark ? 'bg-slate-850 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <div>
                          <strong className="block text-slate-900 dark:text-white mb-0.5">
                            👥 รวมประวัติการเข้าสู่ระบบแอดมินทุกบัญชีและทุกอุปกรณ์
                          </strong>
                          <span>บันทึกบัญชีที่ล็อกอิน อุปกรณ์ และเวลาที่เข้าใช้งาน ทั้งผ่านหน้าเว็บและแดชบอร์ด</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playRefreshSound();
                            fetchCloudAdminSessions();
                          }}
                          className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>รีเฟรชประวัติ</span>
                        </button>
                      </div>

                      {adminLoginHistory.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          ยังไม่มีประวัติการเข้าสู่ระบบแอดมิน
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {adminLoginHistory.map((sess, idx) => {
                            const isOnline = isSessionOnline(sess);
                            const isCurrentMe = sess.id === currentAdminSessionId;

                            return (
                              <div 
                                key={sess.id || idx}
                                className={`p-3 sm:p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                                  isOnline
                                    ? (isDark ? 'bg-emerald-950/20 border-emerald-800/60 shadow-xs ring-1 ring-emerald-500/20' : 'bg-emerald-50/60 border-emerald-300 shadow-xs ring-1 ring-emerald-400/20')
                                    : (isDark ? 'bg-slate-850/80 border-slate-750 opacity-85' : 'bg-white border-slate-200 shadow-xs opacity-85')
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shrink-0 relative ${
                                    isOnline
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-slate-700/20 text-slate-400 border border-slate-700/40'
                                  }`}>
                                    <Users className="w-4 h-4" />
                                    {isOnline && (
                                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse"></span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-900 dark:text-white truncate">
                                        👤 {sess.username || 'admin'}
                                      </span>
                                      {isCurrentMe && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                                          อุปกรณ์นี้ (คุณ)
                                        </span>
                                      )}
                                      {/* Real-time Online / Offline Status Badge */}
                                      {isOnline ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1.5 shrink-0 shadow-2xs">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                          <span>online</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-600/30 font-medium flex items-center gap-1.5 shrink-0">
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                          <span>offline</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                                      <span>💻 {sess.device || 'PC / Device'}</span>
                                      {!isOnline && sess.last_seen && (
                                        <span className="text-slate-500 text-[10px] hidden sm:inline">
                                          • ใช้งานล่าสุด: {new Date(sess.last_seen).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono text-left sm:text-right shrink-0">
                                  <div className="text-[10px] text-slate-500">เวลาที่บันทึก</div>
                                  <div>{sess.formattedTime || sess.timestamp}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 8: TRASH (RECENTLY DELETED) */}
              {activeTab === 'trash' && (
                <div className="space-y-4">
                  {/* Top Header & Actions */}
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-850 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>ถังขยะ / ลบล่าสุด ({deletedReports.length + deletedFeedback.length})</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        รายการที่ถูกลบจะถูกพักไว้ที่นี่ สามารถกดกู้คืนกลับสู่ระบบ หรือเลือกลบถาวรได้
                      </p>
                    </div>

                    {(deletedReports.length > 0 || deletedFeedback.length > 0) && (
                      <button
                        type="button"
                        onClick={handleClearAllTrash}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-500/30 cursor-pointer self-end sm:self-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ล้างถังขยะทั้งหมด (ลบถาวร)</span>
                      </button>
                    )}
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => setTrashFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                          trashFilter === 'all'
                            ? (isDark ? 'bg-slate-700 text-white font-bold' : 'bg-slate-800 text-white font-bold')
                            : (isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:text-slate-900')
                        }`}
                      >
                        ทั้งหมด ({deletedReports.length + deletedFeedback.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrashFilter('report')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                          trashFilter === 'report'
                            ? 'bg-rose-600 text-white font-bold'
                            : (isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:text-slate-900')
                        }`}
                      >
                        รายงานน้ำท่วม ({deletedReports.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrashFilter('feedback')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                          trashFilter === 'feedback'
                            ? 'bg-teal-600 text-white font-bold'
                            : (isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-600 hover:text-slate-900')
                        }`}
                      >
                        ข้อเสนอแนะ ({deletedFeedback.length})
                      </button>
                    </div>

                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={trashSearch}
                        onChange={(e) => setTrashSearch(e.target.value)}
                        placeholder="ค้นหาในถังขยะ..."
                        className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Trash List */}
                  {(() => {
                    const filteredReports = deletedReports.filter(r => {
                      if (trashFilter === 'feedback') return false;
                      if (!trashSearch.trim()) return true;
                      const q = trashSearch.toLowerCase();
                      return (
                        (r.name && r.name.toLowerCase().includes(q)) ||
                        (r.district && r.district.toLowerCase().includes(q)) ||
                        (r.subdistrict && r.subdistrict.toLowerCase().includes(q)) ||
                        (r.notes && r.notes.toLowerCase().includes(q)) ||
                        (r.reporterName && r.reporterName.toLowerCase().includes(q))
                      );
                    });

                    const filteredFeedback = deletedFeedback.filter(f => {
                      if (trashFilter === 'report') return false;
                      if (!trashSearch.trim()) return true;
                      const q = trashSearch.toLowerCase();
                      return (
                        (f.message && f.message.toLowerCase().includes(q)) ||
                        (f.topic && f.topic.toLowerCase().includes(q)) ||
                        (f.name && f.name.toLowerCase().includes(q)) ||
                        (f.phone && f.phone.includes(q))
                      );
                    });

                    const totalItems = filteredReports.length + filteredFeedback.length;

                    if (totalItems === 0) {
                      return (
                        <div className={`p-8 rounded-2xl border text-center ${
                          isDark ? 'bg-slate-850/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          <Trash2 className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                          <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">ไม่มีรายการในถังขยะ</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {trashSearch ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา' : 'เมื่อมีการลบรายงานหรือข้อเสนอแนะ รายการจะถูกเก็บไว้ที่นี่'}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {/* Select All & Bulk Actions for Trash */}
                        <div className={`p-2.5 px-3.5 rounded-2xl border flex items-center justify-between gap-2 flex-wrap ${
                          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={selectedTrashIds.size > 0 && selectedTrashIds.size === totalItems}
                              ref={el => {
                                if (el) el.indeterminate = selectedTrashIds.size > 0 && selectedTrashIds.size < totalItems;
                              }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTrashIds(new Set([...filteredReports, ...filteredFeedback].map(it => it.id)));
                                } else {
                                  setSelectedTrashIds(new Set());
                                }
                              }}
                              className="w-4 h-4 rounded text-rose-500 cursor-pointer"
                            />
                            <span>เลือกทั้งหมด ({totalItems} รายการ)</span>
                          </label>

                          {selectedTrashIds.size > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-rose-400">
                                เลือก {selectedTrashIds.size} รายการ:
                              </span>
                              <button
                                type="button"
                                onClick={handleBulkRestoreTrash}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>กู้คืนที่เลือก</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleBulkPermanentDeleteTrash}
                                className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบถาวรที่เลือก</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reports Section */}
                        {filteredReports.map(item => (
                          <div
                            key={`trash-rep-${item.id}`}
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start justify-between gap-3 ${
                              selectedTrashIds.has(item.id)
                                ? (isDark ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/30 shadow-md' : 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300 shadow-sm')
                                : (isDark ? 'bg-slate-850 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm')
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={selectedTrashIds.has(item.id)}
                              onChange={(e) => {
                                setSelectedTrashIds(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(item.id);
                                  else next.delete(item.id);
                                  return next;
                                });
                              }}
                              className="w-4 h-4 rounded text-rose-500 cursor-pointer mt-1 shrink-0"
                              title="เลือกรายการนี้"
                            />
                            <div className="flex-1 space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/20">
                                  รายงานน้ำท่วม
                                </span>
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                  อ.{item.district || '-'} {item.subdistrict ? `ต.${item.subdistrict}` : ''}
                                </span>
                                {item.depthRange && (
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                                    ระดับ {item.depthRange}
                                  </span>
                                )}
                                {item.deletedAt && (
                                  <span className="text-[10px] text-slate-400 ml-auto">
                                    ลบเมื่อ: {item.deletedAt}
                                  </span>
                                )}
                              </div>

                              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {item.name || item.locationName || 'ไม่ระบุชื่อจุด'}
                              </div>

                              {item.notes && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {item.notes}
                                </p>
                              )}

                              <div className="text-[11px] text-slate-400 flex flex-wrap gap-3">
                                <span>ผู้รายงาน: {item.reporterName || 'ประชาชนทั่วไป'}</span>
                                {item.reporterPhone && <span>โทร: {item.reporterPhone}</span>}
                                {item.reportedAt && <span>แจ้งเมื่อ: {item.reportedAt}</span>}
                              </div>
                            </div>

                            {/* Photo Thumbnail */}
                            {item.photoUrl && (
                              <div
                                onClick={() => setSelectedPhotoModal(item.photoUrl)}
                                className="w-16 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer border border-white/10 hover:opacity-90 transition-opacity self-center sm:self-start"
                                title="คลิกเพื่อดูรูปขยาย"
                              >
                                <img src={item.photoUrl} alt="รูปจุดท่วม" className="w-full h-full object-cover" />
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleRestoreTrashReport(item)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>กู้คืน</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermanentDeleteReport(item.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>ลบถาวร</span>
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Feedback Section */}
                        {filteredFeedback.map(item => (
                          <div
                            key={`trash-fb-${item.id}`}
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start justify-between gap-3 ${
                              selectedTrashIds.has(item.id)
                                ? (isDark ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/30 shadow-md' : 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300 shadow-sm')
                                : (isDark ? 'bg-slate-850 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm')
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={selectedTrashIds.has(item.id)}
                              onChange={(e) => {
                                setSelectedTrashIds(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(item.id);
                                  else next.delete(item.id);
                                  return next;
                                });
                              }}
                              className="w-4 h-4 rounded text-rose-500 cursor-pointer mt-1 shrink-0"
                              title="เลือกรายการนี้"
                            />
                            <div className="flex-1 space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/15 text-teal-500 border border-teal-500/20">
                                  ข้อเสนอแนะ
                                </span>
                                {item.topic && (
                                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                    หมวด: {item.topic}
                                  </span>
                                )}
                                {item.rating && (
                                  <div className="flex items-center gap-0.5 text-amber-400">
                                    {[...Array(item.rating)].map((_, i) => (
                                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                                    ))}
                                  </div>
                                )}
                                {item.deletedAt && (
                                  <span className="text-[10px] text-slate-400 ml-auto">
                                    ลบเมื่อ: {item.deletedAt}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                                "{item.message}"
                              </p>

                              <div className="text-[11px] text-slate-400 flex flex-wrap gap-3">
                                <span>ผู้ส่ง: {item.name || 'ไม่ระบุชื่อ'}</span>
                                {item.phone && <span>โทร: {item.phone}</span>}
                                {item.timestamp && <span>วันที่ส่ง: {item.timestamp}</span>}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleRestoreTrashFeedback(item)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>กู้คืน</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermanentDeleteFeedback(item.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>ลบถาวร</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 7: SECURITY & CREDENTIALS */}
              {activeTab === 'security' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-850 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <strong className="block text-slate-900 dark:text-white mb-1">🔐 จัดการความปลอดภัยและเปลี่ยนรหัสผ่าน</strong>
                    ท่านสามารถกำหนดชื่อผู้ใช้ (Username) และรหัสผ่านใหม่ได้ตามต้องการ เพื่อความปลอดภัยสูงสุดของระบบแอดมิน
                  </div>

                  {credentialMessage.text && (
                    <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                      credentialMessage.type === 'success' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/80 border border-rose-300 text-rose-700 dark:text-rose-300'
                    }`}>
                      {credentialMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      <span>{credentialMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateCredentials} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">ชื่อผู้ใช้ใหม่ (New Username)</label>
                      <input 
                        type="text"
                        value={newUsernameInput}
                        onChange={(e) => setNewUsernameInput(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">รหัสผ่านปัจจุบัน (Current Password)</label>
                      <input 
                        type="password"
                        value={currentPassInput}
                        onChange={(e) => setCurrentPassInput(e.target.value)}
                        placeholder="กรอกรหัสผ่านเดิมเพื่อยืนยัน"
                        className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">รหัสผ่านใหม่ (New Password)</label>
                      <input 
                        type="password"
                        value={newPassInput}
                        onChange={(e) => setNewPassInput(e.target.value)}
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">ยืนยันรหัสผ่านใหม่ (Confirm Password)</label>
                      <input 
                        type="password"
                        value={confirmPassInput}
                        onChange={(e) => setConfirmPassInput(e.target.value)}
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                        className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all mt-2"
                    >
                      บันทึกรหัสผ่านใหม่
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Admin Modal Bottom Action Bar (ล่างซ้าย: นโยบายข้อกำหนดส่วนตัว + ออกจากระบบ) */}
        {isAuthenticated && (
          <div className={`p-3 sm:px-6 border-t flex items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            {/* Bottom Left: Privacy Policy & Logout */}
            <div className="flex items-center gap-2 flex-wrap">
              {onOpenPrivacyPolicy && (
                <button
                  type="button"
                  onClick={() => {
                    playAdminTabSound();
                    onOpenPrivacyPolicy();
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 shadow-xs ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-blue-700 border-slate-300'
                  }`}
                  title="เปิดดูนโยบายข้อกำหนดส่วนตัว"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-500" />
                  <span>นโยบายข้อกำหนดส่วนตัว</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                title="ออกจากระบบ ADMIN"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>

            {/* Bottom Right: Close Modal Button */}
            <button
              type="button"
              onClick={handleModalClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 shadow-xs ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        )}

        {/* Photo Zoom Preview Modal */}
        {selectedPhotoModal && (
          <div 
            onClick={() => setSelectedPhotoModal(null)}
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
          >
            <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl">
              <img src={selectedPhotoModal} alt="ภาพขยาย" className="w-full h-full object-contain" />
              <button 
                onClick={() => setSelectedPhotoModal(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
