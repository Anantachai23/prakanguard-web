import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  MoreVertical, 
  ChevronDown, 
  Activity, 
  RefreshCw, 
  CheckCircle2 
} from 'lucide-react';
import {
  CivicReportCamera,
  CivicFeedback,
  CivicShield,
  CivicBroadcast,
  CivicWeather,
  CivicEmergencyPhone,
  CivicStandards
} from './CivicIcons';
import RealTimeClock from './RealTimeClock';
import { 
  playToggleSound, 
  playSelectSound, 
  playReportSound, 
  playEmergencySound, 
  playModalOpenSound, 
  playTabSound, 
  playRefreshSound 
} from '../services/soundEffects';

export default function Navbar({ 
  points = [], 
  citizenReports = [],
  levelCounts = null,
  weather,
  severityFilter = 'all',
  onSelectSeverityFilter,
  onOpenEmergency, 
  onOpenAiForecast,
  onOpenStandards,
  onOpenWelcome,
  onOpenCitizenReport,
  onOpenFeedback,
  onOpenAdmin,
  onOpenPublicUpdates,
  onOpenCctv,
  onOpenAnnouncement,
  hasAnnouncement = false,
  onOpenPrivacyPolicy,
  lastUpdatedTime,
  lastUpdatedTimeDetailed,
  pendingReportsCount = 0,
  theme = 'light',
  onToggleTheme,
  onRefreshData,
  isRefreshing = false,
  refreshCountdown = 300,
  isSidebarOpen = true,
  onToggleSidebar
}) {
  const isDark = theme === 'dark';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Stateful Refresh Indicator
  const [isJustSynced, setIsJustSynced] = useState(false);
  const prevRefreshingRef = useRef(isRefreshing);

  useEffect(() => {
    if (prevRefreshingRef.current && !isRefreshing) {
      setIsJustSynced(true);
      const timer = setTimeout(() => setIsJustSynced(false), 2200);
      return () => clearTimeout(timer);
    }
    prevRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target) && 
        !e.target.closest('[data-menu-trigger]')
      ) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Use precomputed levelCounts synchronized 1:1 with map pins
  const minor = levelCounts ? levelCounts.minor : points.filter(p => p.level === 1 && p.isActive !== false && !p.isResolved).length;
  const moderate = levelCounts ? levelCounts.moderate : points.filter(p => p.level === 2 && p.isActive !== false && !p.isResolved).length;
  const severe = levelCounts ? levelCounts.severe : points.filter(p => p.level === 3 && p.isActive !== false && !p.isResolved).length;
  const falling = levelCounts ? levelCounts.falling : points.filter(p => p.waterTrend === 'falling' && p.isActive !== false && !p.isResolved).length;

  return (
    <header className={`sticky top-0 z-[1001] w-full border-b transition-colors select-none ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="w-full max-w-full h-14 px-3 sm:px-4 flex items-center justify-between gap-2 relative">
        
        {/* ========================================================= */}
        {/* 1. BRAND AREA (LEFT) — Official Civic Identity             */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          {/* Provincial Crest / Official Logo */}
          <div className="relative w-8 h-8 rounded-full p-0.5 border border-slate-200 dark:border-slate-750 shrink-0 flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <img 
              src="/logo.png" 
              alt="PrakanGuard Logo" 
              className="w-full h-full rounded-full object-cover select-none pointer-events-none" 
            />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white leading-none shrink-0">
              PrakanGuard
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 shrink-0">
              สมุทรปราการ
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. CENTER AREA: SEVERITY FILTERS (Desktop lg+)            */}
        {/* ========================================================= */}
        <div className="hidden lg:flex items-center shrink-0">
          <div className="h-[34px] px-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-0.5 shadow-2xs">
            
            {/* Level 1: ปกติ */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === '1' ? 'all' : '1');
              }}
              className={`h-[28px] px-2.5 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                severityFilter === '1'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 font-medium'
              }`}
              title="กรองแสดงเฉพาะจุดน้ำท่วมปกติ (5-20 ซม.)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>ปกติ</span>
              <span className="font-mono text-[11px] opacity-80">{minor}</span>
            </button>

            {/* Level 2: ปานกลาง */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === '2' ? 'all' : '2');
              }}
              className={`h-[28px] px-2.5 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                severityFilter === '2'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 font-medium'
              }`}
              title="กรองแสดงเฉพาะจุดน้ำท่วมปานกลาง (21-50 ซม.)"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>ปานกลาง</span>
              <span className="font-mono text-[11px] opacity-80">{moderate}</span>
            </button>

            {/* Level 3: วิกฤต */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === '3' ? 'all' : '3');
              }}
              className={`h-[28px] px-2.5 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                severityFilter === '3'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 font-medium'
              }`}
              title="กรองแสดงเฉพาะจุดน้ำท่วมวิกฤต (>50 ซม.)"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>วิกฤต</span>
              <span className="font-mono text-[11px] opacity-80">{severe}</span>
            </button>

            {/* Falling: น้ำลด */}
            {falling > 0 && (
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === 'falling' ? 'all' : 'falling');
                }}
                className={`h-[28px] px-2.5 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  severityFilter === 'falling'
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold shadow-xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 font-medium'
                }`}
                title="กรองแสดงเฉพาะจุดที่น้ำกำลังลด"
              >
                <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                <span>น้ำลด</span>
                <span className="font-mono text-[11px] opacity-80">{falling}</span>
              </button>
            )}

            {/* Clear Filter Button */}
            {severityFilter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  if (onSelectSeverityFilter) onSelectSeverityFilter('all');
                }}
                className="h-[26px] px-2 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-semibold cursor-pointer transition-all active:scale-95 ml-0.5"
                title="ล้างตัวกรองและแสดงระดับน้ำทั้งหมด"
              >
                ✕ ทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RIGHT AREA: UTILITIES & ACTIONS                        */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* --- MOBILE ONLY (< 768px): Clean, Uncluttered, No Duplicate Report Button --- */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {/* Mobile Telemetry Sync */}
            {onRefreshData && (
              <button
                type="button"
                onClick={() => {
                  playRefreshSound();
                  onRefreshData();
                }}
                disabled={isRefreshing}
                className="w-8 h-8 rounded-full border text-xs flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 shrink-0"
                title="ซิงก์ข้อมูลโทรมาตรล่าสุดทันที"
              >
                {isJustSynced ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : 'text-blue-600 dark:text-cyan-400'}`} />
                )}
              </button>
            )}

            {/* Mobile Menu Dropdown (Services) */}
            <button
              type="button"
              data-menu-trigger="true"
              onClick={() => {
                playTabSound();
                setIsMenuOpen(prev => !prev);
              }}
              className={`w-8 h-8 rounded-full border text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 ${
                isMenuOpen
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
              title="เมนูบริการ"
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Mobile Theme Toggle */}
            <button
              type="button"
              onClick={() => {
                playToggleSound(!isDark);
                if (onToggleTheme) onToggleTheme();
              }}
              className="w-8 h-8 rounded-full border text-xs flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 shrink-0"
              title={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>
          </div>

          {/* --- TABLET & DESKTOP (>= 768px) --- */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            
            {/* 1. Unified Telemetry Status Capsule (Weather · Clock · Sync) */}
            <div className="flex items-center h-[34px] rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200 overflow-hidden shadow-2xs">
              {/* Weather sub-segment */}
              {weather && weather.temp !== undefined && (
                <button 
                  type="button"
                  onClick={() => {
                    playModalOpenSound();
                    if (onOpenAiForecast) onOpenAiForecast();
                  }}
                  className="h-full px-2.5 flex items-center gap-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                  title={`สภาพอากาศจริง จ.สมุทรปราการ: ${weather.weatherDesc || 'มีเมฆบางส่วน'} • ${weather.temp}°C (แตะดูพยากรณ์อากาศ 24 ชม.)`}
                >
                  <CivicWeather className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0" />
                  <span className="font-mono font-bold text-xs">
                    {weather.temp}°C
                  </span>
                </button>
              )}

              {/* Real-time Clock sub-segment */}
              <div className="h-full flex items-center px-2.5">
                <RealTimeClock theme={theme} variant="bare" />
              </div>

              {/* Civic Telemetry Sync sub-segment */}
              {onRefreshData && (
                <button 
                  type="button"
                  onClick={() => {
                    playRefreshSound();
                    onRefreshData();
                  }}
                  disabled={isRefreshing}
                  className="h-full px-2.5 flex items-center justify-center hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-slate-600 dark:text-slate-300 disabled:opacity-50"
                  title="ซิงก์ข้อมูลโทรมาตรระดับน้ำและสภาพอากาศล่าสุด (ระบบอัปเดตอัตโนมัติทุก 5 นาที)"
                >
                  {isJustSynced ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-in zoom-in-75 duration-200" />
                  ) : (
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                  )}
                  <span className="hidden xl:inline ml-1 text-xs font-semibold">
                    {isRefreshing ? 'กำลังซิงก์...' : isJustSynced ? 'ซิงก์แล้ว' : 'ซิงก์ข้อมูล'}
                  </span>
                </button>
              )}
            </div>

            {/* 2. Official Broadcast Announcement Button (if active) */}
            {hasAnnouncement && (
              <button 
                type="button"
                onClick={() => {
                  playModalOpenSound();
                  if (onOpenAnnouncement) onOpenAnnouncement();
                }}
                className="h-[34px] px-3 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 active:scale-95"
                title="ดูประกาศล่าสุดจากเจ้าหน้าที่"
              >
                <CivicBroadcast className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                <span>ประกาศ</span>
              </button>
            )}

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

            {/* 3. แจ้งน้ำท่วม (Primary Citizen Action Button) */}
            {onOpenCitizenReport && (
              <button
                type="button"
                onClick={() => {
                  playReportSound();
                  onOpenCitizenReport();
                }}
                className="h-[34px] px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                title="แจ้งรายงานจุดน้ำท่วมสำหรับประชาชน"
              >
                <CivicReportCamera className="w-3.5 h-3.5 text-white" />
                <span>แจ้งน้ำท่วม</span>
              </button>
            )}

            {/* 4. Official Services Dropdown Button */}
            <button
              type="button"
              data-menu-trigger="true"
              onClick={() => {
                playTabSound();
                setIsMenuOpen(prev => !prev);
              }}
              className={`h-[34px] px-3 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 ${
                isMenuOpen
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              title="บริการและข้อมูลทางการ"
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
              <span>บริการ</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 5. Theme Switcher */}
            <button
              type="button"
              onClick={() => {
                playToggleSound(!isDark);
                if (onToggleTheme) onToggleTheme();
              }}
              className="w-[34px] h-[34px] rounded-full border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95 shrink-0"
              title={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

        </div>

        {/* ========================================================= */}
        {/* 4. SERVICES DROPDOWN (Positioned relative to header)       */}
        {/* ========================================================= */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className={`absolute right-3 sm:right-4 top-full mt-1.5 w-[calc(100vw-24px)] max-w-[270px] sm:w-68 rounded-3xl border p-2 z-[1002] shadow-2xl animate-in zoom-in-95 duration-150 ${
              isDark 
                ? 'bg-slate-900 border-slate-750 text-slate-100 shadow-black/90 ring-1 ring-white/10' 
                : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/15 ring-1 ring-black/5'
            }`}
          >
            {/* Public Feedback */}
            <button
              type="button"
              onClick={() => {
                playModalOpenSound();
                setIsMenuOpen(false);
                if (onOpenFeedback) onOpenFeedback();
              }}
              className={`w-full p-2.5 rounded-2xl text-xs font-semibold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-100 hover:text-white' : 'hover:bg-slate-100 text-slate-800 hover:text-slate-950'
              }`}
            >
              <CivicFeedback className="w-4 h-4 text-teal-400 shrink-0" />
              <span>กล่องข้อเสนอแนะประชาชน</span>
            </button>

            {/* Public Situation Updates */}
            <button
              type="button"
              onClick={() => {
                playModalOpenSound();
                setIsMenuOpen(false);
                if (onOpenPublicUpdates) onOpenPublicUpdates();
              }}
              className={`w-full p-2.5 rounded-2xl text-xs font-semibold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-100 hover:text-white' : 'hover:bg-slate-100 text-slate-800 hover:text-slate-950'
              }`}
            >
              <Activity className="w-4 h-4 text-blue-400 shrink-0" />
              <span>อัปเดตสถานการณ์น้ำท่วม</span>
            </button>

            {/* Flood Standards */}
            <button
              type="button"
              onClick={() => {
                playModalOpenSound();
                setIsMenuOpen(false);
                if (onOpenStandards) onOpenStandards();
              }}
              className={`w-full p-2.5 rounded-2xl text-xs font-semibold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-100 hover:text-white' : 'hover:bg-slate-100 text-slate-800 hover:text-slate-950'
              }`}
            >
              <CivicStandards className="w-4 h-4 text-amber-500 shrink-0" />
              <span>เกณฑ์ระดับน้ำ & ยานพาหนะ</span>
            </button>

            {/* Emergency Hotline 1784 */}
            <button
              type="button"
              onClick={() => {
                playEmergencySound();
                setIsMenuOpen(false);
                if (onOpenEmergency) onOpenEmergency();
              }}
              className={`w-full p-2.5 rounded-2xl text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-100 hover:text-white' : 'hover:bg-slate-100 text-slate-800 hover:text-slate-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CivicEmergencyPhone className="w-4 h-4 text-rose-500 shrink-0" />
                <span>สายด่วนสาธารณภัย 1784</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                24 ชม.
              </span>
            </button>

            {/* Privacy Policy */}
            <button
              type="button"
              onClick={() => {
                playModalOpenSound();
                setIsMenuOpen(false);
                if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
              }}
              className={`w-full p-2.5 rounded-2xl text-xs font-semibold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-100 hover:text-white' : 'hover:bg-slate-100 text-slate-800 hover:text-slate-950'
              }`}
            >
              <CivicShield className="w-4 h-4 text-sky-400 shrink-0" />
              <span>นโยบาย & แหล่งข้อมูลอ้างอิง</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
