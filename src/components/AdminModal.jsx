import React, { useState, useEffect } from 'react';
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
  Mail
} from 'lucide-react';
import { BODY_WATER_LEVELS } from './CitizenReportModal';
import { DISTRICTS } from '../data/samutPrakanPoints';

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
  onApproveReport, 
  onRejectReport, 
  onResolveReport,
  onAddAdminBroadcast,
  onFlyToCoords,
  theme = 'light',
  onAuthChange
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  // Stored Credentials (allows admin to change them)
  const [credentials, setCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem('prakanguard_admin_credentials');
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_CREDENTIALS;
    } catch (e) {
      return DEFAULT_ADMIN_CREDENTIALS;
    }
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('prakanguard_admin_auth') === 'true';
  });

  // Login Form States
  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Tabs: 'pending' | 'approved' | 'broadcast' | 'history' | 'feedback' | 'security'
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  // Feedback Management States (Citizen Feedback & Suggestion Box)
  const [feedbackItems, setFeedbackItems] = useState(() => {
    try {
      const saved = localStorage.getItem('prakanguard_feedback_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all' | 'unread' | 'read'

  const refreshFeedbackItems = () => {
    try {
      const saved = localStorage.getItem('prakanguard_feedback_items');
      setFeedbackItems(saved ? JSON.parse(saved) : []);
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      refreshFeedbackItems();
    }
  }, [isOpen]);

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
    if (window.confirm("ยืนยันต้องการลบข้อเสนอแนะนี้หรือไม่?")) {
      setFeedbackItems(prev => {
        const updated = prev.filter(f => f.id !== id);
        try {
          localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
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
    if (window.confirm("ยืนยันต้องการลบข้อเสนอแนะที่อ่านแล้วทั้งหมดหรือไม่?")) {
      setFeedbackItems(prev => {
        const updated = prev.filter(f => !f.isRead);
        try {
          localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  };

  const unreadFeedbackCount = feedbackItems.filter(f => !f.isRead).length;

  // Broadcast Form State (Admin Direct Flood Announcement)
  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastDistrict, setBroadcastDistrict] = useState('เมืองสมุทรปราการ');
  const [broadcastLevel, setBroadcastLevel] = useState('knee');
  const [broadcastGuidance, setBroadcastGuidance] = useState('');
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

  // Handle Login Authentication
  const handleLogin = (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const u = inputUsername.trim();
    const p = inputPassword.trim();

    // Check against configured credentials (or fallback aliases)
    const validUser = (u === credentials.username || u === 'admin' || u === 'prakan_admin');
    const validPass = (p === credentials.password || p === DEFAULT_ADMIN_CREDENTIALS.password);

    if (validUser && validPass) {
      setIsAuthenticated(true);
      if (onAuthChange) onAuthChange(true);
      sessionStorage.setItem('prakanguard_admin_auth', 'true');
      setLoginError('');
      setFailedAttempts(0);
      setInputPassword('');
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
    setIsAuthenticated(false);
    if (onAuthChange) onAuthChange(false);
    sessionStorage.removeItem('prakanguard_admin_auth');
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

  // Handle Admin Direct Emergency Announcement
  const handlePublishBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastName.trim()) {
      alert("กรุณาระบุชื่อถนนหรือจุดที่ต้องการประกาศ");
      return;
    }

    const levelMeta = BODY_WATER_LEVELS.find(l => l.id === broadcastLevel) || BODY_WATER_LEVELS[1];
    const pLat = parseFloat(broadcastLat) || 13.5991;
    const pLng = parseFloat(broadcastLng) || 100.6012;
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    const adminAnnouncement = {
      id: 'admin-' + Date.now(),
      isCitizenReport: true,
      isAdminBroadcast: true,
      isApproved: true,
      isResolved: false,
      approvedAt: nowTime,
      name: broadcastName.trim(),
      subdistrict: 'ประกาศโดยแอดมิน',
      district: broadcastDistrict,
      lat: pLat,
      lng: pLng,
      bodyLevel: broadcastLevel,
      bodyLevelLabel: levelMeta.label,
      depthCm: levelMeta.depthApprox,
      depthRange: levelMeta.range,
      level: levelMeta.severity,
      statusLabel: `ระดับ${levelMeta.label} (ประกาศทางการ)`,
      trafficStatus: broadcastGuidance.trim() || levelMeta.traffic,
      cause: 'รายงานยืนยันสถานการณ์ด่วนโดยผู้ดูแลระบบ (Admin Broadcast)',
      officialGuidance: broadcastGuidance.trim() || levelMeta.guidance,
      source: 'ศูนย์ควบคุมและสั่งการแอดมิน (Admin)',
      phone: '1784',
      reportedAt: nowTime,
      timestamp: Date.now()
    };

    if (onApproveReport) {
      // Add and approve immediately
      if (onAddAdminBroadcast) {
        onAddAdminBroadcast(adminAnnouncement);
      } else {
        onApproveReport(adminAnnouncement.id, adminAnnouncement);
      }
    }

    setBroadcastSuccess(true);
    setBroadcastName('');
    setBroadcastGuidance('');
    setTimeout(() => setBroadcastSuccess(false), 4000);
    setActiveTab('approved');
  };

  // Handle Changing Credentials
  const handleUpdateCredentials = (e) => {
    e.preventDefault();
    if (currentPassInput !== credentials.password && currentPassInput !== DEFAULT_ADMIN_CREDENTIALS.password) {
      setCredentialMessage({ text: 'รหัสผ่านปัจจุบันไม่ถูกต้อง', type: 'error' });
      return;
    }
    if (newPassInput.length < 8) {
      setCredentialMessage({ text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร', type: 'error' });
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
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setTimeout(() => setCredentialMessage({ text: '', type: '' }), 5000);
  };

  const pendingReports = citizenReports.filter(r => r.isApproved === false);
  const approvedReports = citizenReports.filter(r => r.isApproved && !r.isResolved);
  const historyReports = citizenReports.filter(r => r.isApproved || r.isResolved);
  const broadcastReports = citizenReports.filter(r => r.isAdminBroadcast);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-3xl border rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600"></div>

        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ADMIN CONTROL CENTER (ระบบจัดการแอดมิน)
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  ADMIN ONLY
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isAuthenticated 
                  ? `เข้าสู่ระบบในชื่อ: ${credentials.username} (ระดับ ADMIN สูงสุด)` 
                  : 'กรุณายืนยันตัวตนด้วยชื่อผู้ใช้และรหัสผ่าน ADMIN'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 transition-colors cursor-pointer"
                title="ออกจากระบบ ADMIN"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ออกจากระบบ ADMIN</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LOGIN FORM (WHEN NOT AUTHENTICATED) */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center my-auto">
            <div className="w-full max-w-sm space-y-5">
              
              <div className="text-center space-y-1">
                <div className={`w-14 h-14 mx-auto rounded-3xl flex items-center justify-center shadow-lg border ${
                  isDark ? 'bg-amber-950/60 border-amber-800/80 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
                }`}>
                  <Lock className="w-7 h-7" />
                </div>
                <h4 className={`text-base font-bold mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  เข้าสู่ระบบ ADMIN
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ระบบความปลอดภัยสำหรับผู้ดูแลระบบ (ADMIN ACCESS ONLY)
                </p>
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
                      placeholder="Password ผู้ดูแลระบบ"
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
          /* AUTHENTICATED ADMIN PANEL */
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Admin Tabs */}
            <div className={`px-5 pt-3 border-b flex items-center gap-1 overflow-x-auto no-scrollbar ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                  activeTab === 'pending'
                    ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800' : 'border-amber-500 text-amber-700 bg-white')
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>รอยืนยัน</span>
                {pendingReports.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                    {pendingReports.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('approved')}
                className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                  activeTab === 'approved'
                    ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800' : 'border-amber-500 text-amber-700 bg-white')
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>แสดงบนแผนที่ ({approvedReports.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('broadcast')}
                className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                  activeTab === 'broadcast'
                    ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800' : 'border-amber-500 text-amber-700 bg-white')
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5 text-blue-500" />
                <span>ประกาศด่วนโดยแอดมิน</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                  activeTab === 'history'
                    ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800' : 'border-amber-500 text-amber-700 bg-white')
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>ประวัติการอัปเดต</span>
              </button>

              <button
                onClick={() => { setActiveTab('feedback'); refreshFeedbackItems(); }}
                className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                  activeTab === 'feedback'
                    ? (isDark ? 'border-teal-400 text-teal-300 bg-slate-800' : 'border-teal-500 text-teal-700 bg-white')
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                <span>ข้อเสนอแนะ & ติชม</span>
                {unreadFeedbackCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-teal-500 text-white animate-pulse">
                    {unreadFeedbackCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 whitespace-nowrap ml-auto ${
                  activeTab === 'security'
                    ? (isDark ? 'border-amber-400 text-amber-300 bg-slate-800' : 'border-amber-500 text-amber-700 bg-white')
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>ความปลอดภัย & รหัสผ่าน</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              
              {/* TAB 1: PENDING REPORTS */}
              {activeTab === 'pending' && (
                <div className="space-y-3">
                  <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <strong className="block text-slate-900 dark:text-white mb-1">🛡️ การตรวจสอบและยืนยันข้อมูลโดยแอดมิน</strong>
                    ระบบประเมินความน่าเชื่อถือเบื้องต้นจากภาพถ่ายและพิกัด GPS จุดที่น่าเชื่อถือสามารถกด <strong>"อนุมัติเผยแพร่ทันที"</strong> เพื่อเพิ่มลงในแผนที่สาธารณะได้ทันทีครับ
                  </div>

                  {pendingReports.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold">ไม่มีรายงานน้ำท่วมใหม่ที่รอยืนยันในขณะนี้</p>
                      <p className="text-[11px] text-slate-500">เมื่อประชาชนส่งข้อมูลใหม่ ระบบจะแจ้งเตือนให้แอดมินตรวจสอบทันที</p>
                    </div>
                  ) : (
                    pendingReports.map(report => {
                      const cred = evaluateCredibility(report);
                      return (
                        <div 
                          key={report.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isDark ? 'bg-slate-850/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isDark ? cred.darkBadgeClass : cred.badgeClass}`}>
                                  ความน่าเชื่อถือ: {cred.score}% ({cred.label})
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  แจ้งเมื่อ: {report.reportedAt}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  ระดับ{report.bodyLevelLabel} ({report.depthRange})
                                </span>
                              </div>

                              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                                {report.name}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                พิกัด: {report.lat.toFixed(4)}, {report.lng.toFixed(4)} • อ.{report.district}
                              </p>
                              {report.cause && (
                                <p className="text-xs text-slate-700 dark:text-slate-300 bg-black/5 dark:bg-black/30 p-2 rounded-xl">
                                  💬 <strong>บันทึกจากผู้แจ้ง:</strong> {report.cause}
                                </p>
                              )}
                            </div>

                            {/* Photo Preview if available */}
                            {report.photoUrl && (
                              <div 
                                onClick={() => setSelectedPhotoModal(report.photoUrl)}
                                className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/20 shrink-0 cursor-pointer group"
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
                            <div className="flex items-center gap-1.5">
                              {onFlyToCoords && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onFlyToCoords(report.lat, report.lng);
                                    onClose();
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                                >
                                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                                  <span>ส่องพิกัดบนแผนที่</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onRejectReport(report.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                              >
                                ✕ ปฏิเสธ / ลบ
                              </button>
                              <button
                                type="button"
                                onClick={() => onApproveReport(report.id)}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>อนุมัติเผยแพร่ทันที</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: APPROVED REPORTS (LIVE ON MAP) */}
              {activeTab === 'approved' && (
                <div className="space-y-3">
                  <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <strong className="block text-slate-900 dark:text-white mb-1">📍 จุดที่กำลังแสดงบนแผนที่สาธารณะ ({approvedReports.length} จุด)</strong>
                    เมื่อสถานการณ์น้ำลดระดับแห้งแล้ว สามารถกด <strong>"น้ำแห้งแล้ว / ปิดจุด"</strong> เพื่ออัปเดตแจ้งเตือนประชาชนครับ
                  </div>

                  {approvedReports.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      ยังไม่มีจุดรายงานที่กำลังแสดงบนแผนที่
                    </div>
                  ) : (
                    approvedReports.map(report => (
                      <div 
                        key={report.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                          isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[11px] text-slate-400">
                              อัปเดตเมื่อ: {report.approvedAt || report.reportedAt}
                            </span>
                            {report.isAdminBroadcast && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                                ประกาศแอดมิน
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm truncate">{report.name}</h4>
                          <p className="text-xs text-slate-500">ระดับ{report.bodyLevelLabel} ({report.depthRange}) • อ.{report.district}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onResolveReport(report.id)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-cyan-300 text-xs font-bold cursor-pointer transition-colors border border-blue-200 dark:border-blue-800"
                            title="ทำเครื่องหมายว่าน้ำแห้งแล้ว"
                          >
                            <span>💧 น้ำแห้งแล้ว / ปิดจุด</span>
                          </button>
                          
                          {report.isAdminBroadcast ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`ยืนยันการลบประกาศแอดมิน "${report.name}" ออกจากระบบ?`)) {
                                  onRejectReport(report.id);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 text-xs font-bold cursor-pointer transition-colors border border-rose-200 dark:border-rose-800 flex items-center gap-1"
                              title="ลบข้อความประกาศนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบประกาศ</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`ยืนยันการลบรายงานจุด "${report.name}"?`)) {
                                  onRejectReport(report.id);
                                }
                              }}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                              title="ลบออกจากระบบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ADMIN DIRECT EMERGENCY BROADCAST */}
              {activeTab === 'broadcast' && (
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-blue-950/40 border-blue-900 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <strong className="block font-bold mb-1 flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4" />
                      <span>ศูนย์ประกาศสถานการณ์ด่วนโดยตรงจากแอดมิน</span>
                    </strong>
                    แอดมินสามารถปักหมุดรายงานน้ำท่วมหรือประกาศแจ้งเตือนผิวจราจรฉุกเฉินได้ทันที โดยไม่ต้องรอรายงานจากประชาชน ข้อมูลจะขึ้นแสดงบนแผนที่สาธารณะทันทีที่กดเผยแพร่
                  </div>

                  {broadcastSuccess && (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>ประกาศสถานการณ์ด่วนขึ้นแสดงบนแผนที่สาธารณะเรียบร้อยแล้ว!</span>
                    </div>
                  )}

                  <form onSubmit={handlePublishBroadcast} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">ชื่อถนน / จุดสังเกตน้ำท่วม (*)</label>
                      <input 
                        type="text"
                        value={broadcastName}
                        onChange={(e) => setBroadcastName(e.target.value)}
                        placeholder="เช่น ถนนสุขุมวิท ช่วงทางลอดแยกสำโรง หรือ ซอยวัดด่าน 113"
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
                          className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        >
                          {DISTRICTS.filter(d => d !== "ทั้งหมด").map(d => (
                            <option key={d} value={d}>อ.{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1">ระดับความสูงน้ำท่วม</label>
                        <select
                          value={broadcastLevel}
                          onChange={(e) => setBroadcastLevel(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                          }`}
                        >
                          {BODY_WATER_LEVELS.map(l => (
                            <option key={l.id} value={l.id}>{l.emoji} ระดับ{l.label} ({l.range})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">คำแนะนำการสัญจรและเส้นทางเลี่ยง</label>
                      <textarea
                        value={broadcastGuidance}
                        onChange={(e) => setBroadcastGuidance(e.target.value)}
                        rows={2}
                        placeholder="เช่น รถเก๋งโปรดชิดเลนขวา ปิดแอร์ทันที แนะนำเลี่ยงไปใช้ถนนศรีนครินทร์"
                        className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Megaphone className="w-4 h-4" />
                      <span>เผยแพร่ประกาศขึ้นแผนที่ทันที</span>
                    </button>
                  </form>

                  {/* Active Admin Announcements List with Delete Controls */}
                  <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-amber-500" />
                        <span>รายการประกาศปัจจุบันของแอดมิน ({broadcastReports.length} รายการ)</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">กดปุ่มสีแดงเพื่อลบประกาศ</span>
                    </div>

                    {broadcastReports.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
                        ยังไม่มีข้อความประกาศจากแอดมินที่กำลังแสดงผล
                      </div>
                    ) : (
                      broadcastReports.map(b => (
                        <div 
                          key={b.id}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                            isDark ? 'bg-slate-850/90 border-slate-750' : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                ประกาศแอดมิน
                              </span>
                              <span className="text-[11px] text-slate-400">
                                อ.{b.district} • เผยแพร่เมื่อ {b.reportedAt}
                              </span>
                              {b.isAiGenerated && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30">
                                  🤖 AI ตรวจการณ์ 24 ชม.
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{b.name}</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{b.officialGuidance || b.trafficStatus}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`ยืนยันการลบประกาศ "${b.name}" ออกจากระบบและแผนที่สาธารณะ?`)) {
                                onRejectReport(b.id);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 shrink-0"
                            title="ลบข้อความประกาศนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบข้อความประกาศ</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT LOG & TIMESTAMPS */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <strong className="block text-slate-900 dark:text-white mb-1">⏱️ บันทึกประวัติและช่วงเวลาอัปเดตข้อมูล (Audit Log)</strong>
                    ระบบจะบันทึกเวลาที่ประชาชนแจ้งและเวลาที่แอดมินยืนยันข้อมูลทุกครั้ง เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้
                  </div>

                  {historyReports.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      ยังไม่มีประวัติการอัปเดต
                    </div>
                  ) : (
                    historyReports.map(report => (
                      <div 
                        key={report.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          isDark ? 'bg-slate-850/60 border-slate-750' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${report.isResolved ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          <span className="font-bold truncate">{report.name}</span>
                          <span className="text-slate-400 shrink-0">(อ.{report.district})</span>
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] shrink-0">
                          {report.resolvedAt ? `น้ำแห้ง: ${report.resolvedAt}` : (report.approvedAt ? `อัปเดต: ${report.approvedAt}` : `แจ้ง: ${report.reportedAt}`)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: CITIZEN FEEDBACK & SUGGESTIONS (READABLE ONLY BY AUTHENTICATED ADMIN) */}
              {activeTab === 'feedback' && (
                <div className="space-y-4">
                  {/* Info & Privacy Notice */}
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-teal-500 shrink-0" />
                      <strong className="text-slate-900 dark:text-white">💬 กล่องรับข้อเสนอแนะ & ติชมจากภาคประชาชน</strong>
                    </div>
                    ข้อความทั้งหมดถูกส่งมาจากประชาชนผ่านกล่องรับฟังความคิดเห็น <strong>เปิดอ่านและจัดการได้เฉพาะผู้ดูแลระบบ (Admin) ที่เข้าสู่ระบบแล้วเท่านั้น</strong> เพื่อนำข้อมูลไปปรับปรุงและพัฒนาเว็บให้ดียิ่งขึ้น
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className={`p-3 rounded-2xl border text-center ${
                      isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-200 shadow-2xs'
                    }`}>
                      <span className="text-[10px] text-slate-400 block font-semibold">ข้อเสนอแนะทั้งหมด</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">{feedbackItems.length}</span>
                    </div>

                    <div className={`p-3 rounded-2xl border text-center ${
                      isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-200 shadow-2xs'
                    }`}>
                      <span className="text-[10px] text-slate-400 block font-semibold">ยังไม่ได้อ่าน</span>
                      <span className={`text-lg font-black ${unreadFeedbackCount > 0 ? 'text-teal-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                        {unreadFeedbackCount}
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl border text-center ${
                      isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-200 shadow-2xs'
                    }`}>
                      <span className="text-[10px] text-slate-400 block font-semibold">คะแนนเฉลี่ย</span>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-lg font-black text-amber-500">
                          {feedbackItems.length > 0 
                            ? (feedbackItems.reduce((acc, f) => acc + (f.rating || 5), 0) / feedbackItems.length).toFixed(1) 
                            : '5.0'}
                        </span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  {/* Filter & Batch Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {/* Filters */}
                    <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setFeedbackFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          feedbackFilter === 'all'
                            ? (isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs')
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        ทั้งหมด ({feedbackItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackFilter('unread')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          feedbackFilter === 'unread'
                            ? (isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs')
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        ยังไม่อ่าน ({unreadFeedbackCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackFilter('read')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          feedbackFilter === 'read'
                            ? (isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs')
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        อ่านแล้ว ({feedbackItems.length - unreadFeedbackCount})
                      </button>
                    </div>

                    {/* Batch Actions */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      {unreadFeedbackCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllFeedbackRead}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 transition-all cursor-pointer"
                        >
                          อ่านแล้วทั้งหมด
                        </button>
                      )}
                      {feedbackItems.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearReadFeedback}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                        >
                          ล้างที่อ่านแล้ว
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback List */}
                  <div className="space-y-3">
                    {feedbackItems
                      .filter(f => {
                        if (feedbackFilter === 'unread') return !f.isRead;
                        if (feedbackFilter === 'read') return f.isRead;
                        return true;
                      })
                      .length === 0 ? (
                      <div className="p-10 text-center text-slate-400 space-y-2">
                        <MessageSquare className="w-8 h-8 text-teal-500/60 mx-auto" />
                        <p className="text-xs font-semibold">ไม่มีข้อเสนอแนะในหมวดหมู่นี้</p>
                        <p className="text-[11px] text-slate-500">
                          {feedbackFilter === 'unread' 
                            ? 'คุณได้อ่านข้อเสนอแนะครบทุกข้อความแล้ว' 
                            : 'เมื่อประชาชนส่งข้อเสนอแนะหรือข้อติชม จะปรากฏที่นี่ทันที'}
                        </p>
                      </div>
                    ) : (
                      feedbackItems
                        .filter(f => {
                          if (feedbackFilter === 'unread') return !f.isRead;
                          if (feedbackFilter === 'read') return f.isRead;
                          return true;
                        })
                        .map(item => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              !item.isRead
                                ? (isDark ? 'bg-teal-950/20 border-teal-500/50 shadow-sm' : 'bg-teal-50/40 border-teal-400/60 shadow-xs')
                                : (isDark ? 'bg-slate-850/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-2xs')
                            }`}
                          >
                            {/* Card Top: Category, Rating & Status */}
                            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                              <div className="flex items-center gap-2 flex-wrap">
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
                                      className={`w-3 h-3 ${
                                        s <= (item.rating || 5) 
                                          ? 'fill-amber-400 text-amber-400' 
                                          : 'text-slate-300 dark:text-slate-700'
                                      }`} 
                                    />
                                  ))}
                                </div>
                              </div>

                              <span className="text-[10px] text-slate-400 font-mono">
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
                              {/* Sender Identity */}
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

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFeedbackRead(item.id)}
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
                                  onClick={() => handleDeleteFeedback(item.id)}
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

              {/* TAB 5: SECURITY & CHANGE PASSWORD */}
              {activeTab === 'security' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
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
                      <label className="block font-semibold mb-1">รหัสผ่านปัจจุบัน (*)</label>
                      <input 
                        type="password"
                        value={currentPassInput}
                        onChange={(e) => setCurrentPassInput(e.target.value)}
                        placeholder="กรอกรหัสผ่านปัจจุบันเพื่อยืนยัน"
                        className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">รหัสผ่านใหม่ (New Password - อย่างน้อย 8 ตัวอักษร)</label>
                      <input 
                        type="password"
                        value={newPassInput}
                        onChange={(e) => setNewPassInput(e.target.value)}
                        placeholder="กรอกรหัสผ่านใหม่"
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
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>บันทึกการเปลี่ยนแปลงรหัสผ่าน</span>
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              <span>สถานะ: เชื่อมต่อระบบจัดการแอดมินสมบูรณ์</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Expanded Photo Preview Modal */}
      {selectedPhotoModal && (
        <div 
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedPhotoModal} 
              alt="ภาพขยาย" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20" 
            />
            <button 
              type="button"
              onClick={() => setSelectedPhotoModal(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
