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
  CivicCrest,
  CivicCctv,
  CivicRadar,
  CivicGauge,
  CivicReportCamera,
  CivicFeedback,
  CivicDatabase,
  CivicShield,
  CivicBroadcast,
  CivicCompass,
  CivicWeather,
  CivicEmergencyPhone,
  CivicStandards,
  CivicDrawerToggle
} from './CivicIcons';
import RealTimeClock from './RealTimeClock';
import { 
  playToggleSound, 
  playSelectSound, 
  playReportSound, 
  playEmergencySound, 
  playModalOpenSound,
  playCloseSound, 
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
  const [isTabletMenuOpen, setIsTabletMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const tabletMenuRef = useRef(null);
  const desktopMenuRef = useRef(null);

  // Stateful Refresh Indicator (Civic Synchronized State)
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

  // Close dropdown menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (tabletMenuRef.current && !tabletMenuRef.current.contains(e.target)) {
        setIsTabletMenuOpen(false);
      }
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target)) {
        setIsDesktopMenuOpen(false);
      }
    }
    if (isTabletMenuOpen || isDesktopMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTabletMenuOpen, isDesktopMenuOpen]);

  // Use precomputed levelCounts synchronized 1:1 with map pins
  const minor = levelCounts ? levelCounts.minor : points.filter(p => p.level === 1 && p.isActive !== false && !p.isResolved).length;
  const moderate = levelCounts ? levelCounts.moderate : points.filter(p => p.level === 2 && p.isActive !== false && !p.isResolved).length;
  const severe = levelCounts ? levelCounts.severe : points.filter(p => p.level === 3 && p.isActive !== false && !p.isResolved).length;
  const falling = levelCounts ? levelCounts.falling : points.filter(p => p.waterTrend === 'falling' && p.isActive !== false && !p.isResolved).length;

  return (
    <header className={`sticky top-0 z-[1001] w-full border-b transition-colors select-none ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="w-full max-w-full px-2 sm:px-4 py-1 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2.5 relative">
        
        {/* ========================================================= */}
        {/* 1. BRAND AREA (LEFT) — Official Civic Command Center       */}
        {/* ========================================================= */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 min-w-0">
          {/* Official Provincial Crest / Logo */}
          <div 
            className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0.5 border shadow-xs shrink-0 flex items-center justify-center overflow-hidden ${
              isDark ? 'bg-slate-900 border-blue-500/40 shadow-blue-950/40' : 'bg-white border-blue-300/60 shadow-blue-500/10'
            }`}
            style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px' }}
          >
            <img 
              src="/logo.png" 
              alt="PrakanGuard Logo" 
              className="w-full h-full rounded-full object-cover block select-none pointer-events-none" 
              style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[13px] sm:text-[15px] font-extrabold tracking-tight leading-none shrink-0 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              PrakanGuard
            </span>
            <span className={`text-[8.5px] sm:text-[9.5px] px-1.5 py-0.5 rounded font-bold shrink-0 border ${
              isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              จ.สมุทรปราการ
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. CENTER AREA: EXECUTIVE TELEMETRY STATUS (Desktop only) */}
        {/* ========================================================= */}
        <div className="hidden lg:flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Segmented Compact Status Bar (แท่งเดียว เรียบหรู ไม่ล้นจอ) */}
          <div className={`inline-flex items-center p-0.5 rounded-lg border backdrop-blur-md shadow-xs select-none gap-0.5 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
          }`}>
            {/* Level 1: ปกติ */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === '1' ? 'all' : '1');
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                severityFilter === '1'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                  : isDark 
                    ? 'hover:bg-slate-800/60 text-slate-300 hover:text-white' 
                    : 'hover:bg-white/70 text-slate-700 hover:text-slate-900'
              }`}
              title="คลิกเพื่อกรองแสดงเฉพาะจุดน้ำท่วมปกติ (5-20 ซม.)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="font-semibold">ปกติ</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                severityFilter === '1'
                  ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800')
                  : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700')
              }`}>{minor}</span>
            </button>

            {/* Level 2: ปานกลาง */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === '2' ? 'all' : '2');
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                severityFilter === '2'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                  : isDark 
                    ? 'hover:bg-slate-800/60 text-slate-300 hover:text-white' 
                    : 'hover:bg-white/70 text-slate-700 hover:text-slate-900'
              }`}
              title="คลิกเพื่อกรองแสดงเฉพาะจุดน้ำท่วมปานกลาง (21-50 ซม.)"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span className="font-semibold">ปานกลาง</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                severityFilter === '2'
                  ? (isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800')
                  : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700')
              }`}>{moderate}</span>
            </button>

            {/* Level 3: วิกฤต */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === '3' ? 'all' : '3');
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                severityFilter === '3'
                  ? 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                  : isDark 
                    ? 'hover:bg-slate-800/60 text-slate-300 hover:text-white' 
                    : 'hover:bg-white/70 text-slate-700 hover:text-slate-900'
              }`}
              title="คลิกเพื่อกรองแสดงเฉพาะจุดน้ำท่วมวิกฤต (>50 ซม.)"
            >
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0"></span>
              <span className="font-semibold">วิกฤต</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                severityFilter === '3'
                  ? (isDark ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-rose-100 text-rose-800')
                  : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700')
              }`}>{severe}</span>
            </button>

            {/* Falling: น้ำลด */}
            {falling > 0 && (
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === 'falling' ? 'all' : 'falling');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                  severityFilter === 'falling'
                    ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                    : isDark 
                      ? 'hover:bg-slate-800/60 text-slate-300 hover:text-white' 
                      : 'hover:bg-white/70 text-slate-700 hover:text-slate-900'
                }`}
                title="คลิกเพื่อกรองแสดงเฉพาะจุดที่น้ำกำลังลด"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                <span className="hidden lg:inline">น้ำลด</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  severityFilter === 'falling'
                    ? (isDark ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-teal-100 text-teal-800')
                    : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700')
                }`}>{falling}</span>
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
                className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer transition-all active:scale-95 ml-0.5"
                title="ล้างตัวกรองและแสดงระดับน้ำทั้งหมด"
              >
                ✕ ทั้งหมด
              </button>
            )}
          </div>

          {/* Live Weather & Temperature (Shown on xl >= 1280px) */}
          {weather && weather.temp !== undefined && (
            <button 
              type="button"
              onClick={() => {
                playModalOpenSound();
                if (onOpenAiForecast) onOpenAiForecast();
              }}
              className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold select-none shrink-0 cursor-pointer transition-all active:scale-95 ${
                isDark 
                  ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-cyan-300' 
                  : 'bg-white/90 hover:bg-slate-50 border-slate-200 text-slate-800 hover:text-blue-600'
              }`}
              title={`สภาพอากาศจริง จ.สมุทรปราการ: ${weather.weatherDesc || 'มีเมฆบางส่วน'} • ${weather.temp}°C (คลิกดูพยากรณ์อากาศและเรดาร์ฝน)`}
            >
              <CivicWeather className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0" />
              <span className="font-mono font-bold text-xs">
                {weather.temp}°C
              </span>
            </button>
          )}

          {/* Clock for Desktop (Shown on xl >= 1280px) */}
          <div className="hidden xl:block shrink-0">
            <RealTimeClock theme={theme} />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RIGHT AREA: RESPONSIVE ACTIONS ACCORDING TO DEVICE     */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* --- MOBILE (Screen < 768px): Minimal, Clean, 0 Horizontal Overflow --- */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            <RealTimeClock theme={theme} />

            {/* Mobile Official Telemetry Sync Button */}
            {onRefreshData && (
              <button
                type="button"
                onClick={() => {
                  playRefreshSound();
                  onRefreshData();
                }}
                disabled={isRefreshing}
                className={`w-7 h-7 rounded-md border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                  isRefreshing
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30'
                    : isJustSynced
                    ? (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-800 border-emerald-300')
                    : isDark 
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="ซิงก์ข้อมูลโทรมาตรล่าสุดทันที"
              >
                {isJustSynced ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-in zoom-in-75 duration-200" />
                ) : (
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : 'text-blue-600 dark:text-cyan-400'}`} />
                )}
              </button>
            )}

            {/* Theme Switcher Button */}
            <button
              type="button"
              onClick={() => {
                playToggleSound(!isDark);
                if (onToggleTheme) onToggleTheme();
              }}
              className={`w-7 h-7 rounded-md border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>
          </div>

          {/* --- TABLET & DESKTOP (Screen >= 768px): Clean Institutional Header --- */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Live Weather & Temperature (Tablet & Desktop) */}
            {weather && weather.temp !== undefined && (
              <button 
                type="button"
                onClick={() => {
                  playModalOpenSound();
                  if (onOpenAiForecast) onOpenAiForecast();
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold select-none shrink-0 cursor-pointer transition-all active:scale-95 ${
                  isDark 
                    ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-cyan-300' 
                    : 'bg-white/90 hover:bg-slate-50 border-slate-200 text-slate-800 hover:text-blue-600'
                }`}
                title={`สภาพอากาศจริง จ.สมุทรปราการ: ${weather.weatherDesc || 'มีเมฆบางส่วน'} • ${weather.temp}°C (แตะดูพยากรณ์อากาศ 24 ชม.)`}
              >
                <CivicWeather className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0" />
                <span className="font-mono font-bold text-xs">
                  {weather.temp}°C
                </span>
              </button>
            )}

            {/* Official Clock */}
            <div className="shrink-0">
              <RealTimeClock theme={theme} />
            </div>

            {/* Official Civic Telemetry Sync Button */}
            {onRefreshData && (
              <button 
                type="button"
                onClick={() => {
                  playRefreshSound();
                  onRefreshData();
                }}
                disabled={isRefreshing}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                  isRefreshing
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/30'
                    : isJustSynced
                    ? (isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-800 border-emerald-300')
                    : isDark 
                    ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800 hover:text-white' 
                    : 'bg-white/90 hover:bg-slate-50 text-slate-700 border-slate-200 hover:text-slate-900'
                }`}
                title="ซิงก์ข้อมูลโทรมาตรสภาพอากาศและระดับน้ำล่าสุด (อัปเดตอัตโนมัติทุก 5 นาที)"
              >
                {isJustSynced ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-in zoom-in-75 duration-200" />
                ) : (
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-500 dark:text-cyan-400 shrink-0 ${isRefreshing ? 'animate-spin text-white dark:text-white' : ''}`} />
                )}
                <span>
                  {isRefreshing ? 'กำลังซิงก์...' : isJustSynced ? 'ซิงก์สำเร็จ' : 'ซิงก์ข้อมูล'}
                </span>
              </button>
            )}

            {/* Official Announcement Button (if present) */}
            {hasAnnouncement && (
              <button 
                type="button"
                onClick={() => {
                  playModalOpenSound();
                  if (onOpenAnnouncement) onOpenAnnouncement();
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isDark 
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-700/80 shadow-amber-950/40' 
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/10'
                }`}
                title="ดูประกาศล่าสุดจากเจ้าหน้าที่แอดมิน"
              >
                <CivicBroadcast className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                <span>ประกาศ</span>
              </button>
            )}

            {/* Prominent Citizen Report Action Button */}
            {onOpenCitizenReport && (
              <button
                type="button"
                onClick={() => {
                  playReportSound();
                  onOpenCitizenReport();
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
                title="แจ้งรายงานจุดน้ำท่วมสำหรับประชาชน"
              >
                <CivicReportCamera className="w-3.5 h-3.5 text-white" />
                <span>แจ้งน้ำท่วม</span>
              </button>
            )}

            {/* Official Services Dropdown Menu */}
            <div className="relative" ref={desktopMenuRef}>
              <button
                type="button"
                onClick={() => {
                  playTabSound();
                  setIsDesktopMenuOpen(prev => !prev);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isDesktopMenuOpen
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isDark 
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="บริการและข้อมูลทางการ"
              >
                <MoreVertical className="w-3.5 h-3.5" />
                <span>บริการ</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDesktopMenuOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* Dropdown Menu Popup (100% Solid Opaque & High-Contrast) */}
              {isDesktopMenuOpen && (
                <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl border p-1.5 z-[1002] shadow-2xl animate-in zoom-in-95 duration-150 ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/90 ring-1 ring-white/10' 
                    : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/15 ring-1 ring-black/5'
                }`}>
                  {/* Public Feedback */}
                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsDesktopMenuOpen(false);
                      if (onOpenFeedback) onOpenFeedback();
                    }}
                    className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
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
                      setIsDesktopMenuOpen(false);
                      if (onOpenPublicUpdates) onOpenPublicUpdates();
                    }}
                    className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-100 hover:text-white' : 'hover:bg-slate-100 text-slate-800 hover:text-slate-950'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>บันทึกสถานการณ์น้ำประจำวัน</span>
                  </button>

                  {/* Emergency Hotline 1784 */}
                  <button
                    type="button"
                    onClick={() => {
                      playEmergencySound();
                      setIsDesktopMenuOpen(false);
                      if (onOpenEmergency) onOpenEmergency();
                    }}
                    className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-100 hover:text-white' : 'hover:bg-slate-100 text-slate-800 hover:text-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CivicEmergencyPhone className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>สายด่วนสาธารณภัย 1784</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                      24 ชม.
                    </span>
                  </button>

                  {/* Privacy Policy */}
                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsDesktopMenuOpen(false);
                      if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                    }}
                    className={`w-full p-2.5 rounded-lg text-xs font-semibold text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-100 hover:text-white' : 'hover:bg-slate-100 text-slate-800 hover:text-slate-950'
                    }`}
                  >
                    <CivicShield className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>นโยบาย & แหล่งข้อมูลอ้างอิง</span>
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => {
                playToggleSound(!isDark);
                if (onToggleTheme) onToggleTheme();
              }}
              className={`w-8 h-8 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
