import React, { useState, useRef, useEffect } from 'react';
import { 
  PhoneCall, 
  Sun, 
  Moon, 
  Camera,
  MessageSquare, 
  ShieldCheck, 
  Activity,
  Bell,
  MoreVertical,
  BookOpen,
  CloudRain,
  Shield,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import RealTimeClock from './RealTimeClock';
import { 
  playToggleSound, 
  playSelectSound, 
  playReportSound, 
  playEmergencySound, 
  playModalOpenSound,
  playCloseSound,
  playTabSound
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
    <header className={`sticky top-0 z-[1001] w-full border-b backdrop-blur-md transition-colors select-none ${
      isDark ? 'bg-slate-950/90 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900'
    }`}>
      <div className="w-full max-w-full px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2.5 overflow-hidden relative">
        
        {/* ========================================================= */}
        {/* 1. BRAND AREA (LEFT) — Clean Official Style               */}
        {/* ========================================================= */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 min-w-0">
          {/* PrakanGuard Emblem */}
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md p-0.5 border shadow-xs shrink-0 flex items-center justify-center overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <img 
              src="/logo.png" 
              alt="PrakanGuard Logo" 
              className="w-full h-full rounded-[3px] object-cover" 
            />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs sm:text-base font-black tracking-tight leading-none shrink-0 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                PrakanGuard
              </span>
              <span className={`text-[8.5px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 border ${
                isDark ? 'bg-slate-850 text-cyan-300 border-slate-700' : 'bg-slate-100 text-blue-700 border-slate-200'
              }`}>
                สมุทรปราการ
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. CENTER AREA: STATS FILTER BAR & WEATHER (Desktop only) */}
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
                <span className="text-xs shrink-0">📉</span>
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
              title={`สภาพอากาศจริง จ.สมุทรปราการ: ${weather.weatherDesc || 'มีเมฆบางส่วน'} • ${weather.temp}°C (คลิกดูพยากรณ์อากาศและเรดาร์ฝน AI)`}
            >
              <span className="text-sm shrink-0">
                {weather.forecast24h?.isRainingNow ? '🌧️' : (weather.temp >= 33 ? '☀️' : (weather.temp <= 26 ? '🌦️' : '⛅'))}
              </span>
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
          <div className="flex md:hidden items-center gap-1 sm:gap-1.5 shrink-0">
            <RealTimeClock theme={theme} />

            {/* Theme Switcher Button */}
            <button
              type="button"
              onClick={() => {
                playToggleSound(!isDark);
                if (onToggleTheme) onToggleTheme();
              }}
              className={`p-1.5 rounded-md border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

          {/* --- TABLET (768px - 1023px): Primary 1-Tap + More Menu Dropdown --- */}
          <div className="hidden md:flex lg:hidden items-center gap-1.5 shrink-0">
            <RealTimeClock theme={theme} />

            {/* Tablet Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => {
                playTabSound();
                if (onToggleSidebar) onToggleSidebar();
              }}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                isSidebarOpen
                  ? 'bg-blue-600 text-white border-blue-600'
                  : isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isSidebarOpen ? "ปิดแถบข้อมูลและพยากรณ์" : "เปิดแถบข้อมูลและพยากรณ์"}
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
              <span>แผงข้อมูล</span>
            </button>

            {/* Citizen Flood Report Button */}
            <button 
              type="button"
              onClick={() => {
                playReportSound();
                if (onOpenCitizenReport) onOpenCitizenReport();
              }}
              title="รายงานจุดน้ำท่วม"
              className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-700/50 shadow-xs active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>แจ้งท่วม</span>
            </button>

            {/* Emergency Hotline 1784 (Polite Crimson/Rose) */}
            <button 
              type="button"
              onClick={() => {
                playEmergencySound();
                if (onOpenEmergency) onOpenEmergency();
              }}
              title="สายด่วนฉุกเฉิน 1784 (โทรฟรี)"
              className="px-2.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-700/50 shadow-xs active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold">1784</span>
            </button>

            {/* TABLET MORE ACTIONS DROPDOWN (จัดเก็บเมนูเสริมเรียบร้อย ไม่ล้นจอ) */}
            <div className="relative" ref={tabletMenuRef}>
              <button
                type="button"
                onClick={() => {
                  playTabSound();
                  setIsTabletMenuOpen(prev => !prev);
                }}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isTabletMenuOpen
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isDark 
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="เมนูเพิ่มเติม"
              >
                <MoreVertical className="w-3.5 h-3.5" />
                <span>เพิ่มเติม</span>
              </button>

              {/* Dropdown Menu Popup for Tablet */}
              {isTabletMenuOpen && (
                <div className={`absolute right-0 top-full mt-1.5 w-56 rounded-lg border shadow-xl p-1 z-50 backdrop-blur-md animate-in zoom-in-95 duration-150 ${
                  isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/80' : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/40'
                }`}>
                  {/* Public Updates Option */}
                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsTabletMenuOpen(false);
                      if (onOpenPublicUpdates) onOpenPublicUpdates();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-semibold text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>อัปเดตสถานการณ์สดรายวัน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsTabletMenuOpen(false);
                      if (onOpenFeedback) onOpenFeedback();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>กล่องข้อเสนอแนะประชาชน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsTabletMenuOpen(false);
                      if (onOpenStandards) onOpenStandards();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>เกณฑ์วัดระดับน้ำ & ยานพาหนะ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsTabletMenuOpen(false);
                      if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>นโยบาย & ข้อมูลอ้างอิง</span>
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
              className={`p-1.5 sm:p-2 rounded-md border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

          {/* --- DESKTOP (Screen >= 1024px): Zero-Overflow Streamlined Command Bar --- */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            {/* Official Announcement Button (if present) */}
            {hasAnnouncement && (
              <button 
                type="button"
                onClick={() => {
                  playModalOpenSound();
                  if (onOpenAnnouncement) onOpenAnnouncement();
                }}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isDark 
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-700/80 shadow-amber-950/40' 
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/10'
                }`}
                title="ดูประกาศล่าสุดจากเจ้าหน้าที่แอดมิน"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                <span className="hidden xl:inline">ประกาศแอดมิน</span>
                <span className="xl:hidden">ประกาศ</span>
              </button>
            )}

            {/* Citizen Flood Report Primary Button */}
            <button 
              type="button"
              onClick={() => {
                playReportSound();
                if (onOpenCitizenReport) onOpenCitizenReport();
              }}
              title="รายงานจุดน้ำท่วม"
              className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-700/50 shadow-xs active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">แจ้งจุดท่วม</span>
              <span className="xl:hidden">แจ้งท่วม</span>
            </button>

            {/* Emergency Hotline 1784 (Polite Crimson/Rose) */}
            <button 
              type="button"
              onClick={() => {
                playEmergencySound();
                if (onOpenEmergency) onOpenEmergency();
              }}
              title="สายด่วนฉุกเฉิน 1784 (โทรฟรี)"
              className="px-2.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-700/50 shadow-xs active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span>1784</span>
            </button>

            {/* DESKTOP MORE ACTIONS DROPDOWN (จัดเก็บเมนูเสริมเรียบร้อย ไม่ล้นขอบจอเด็ดขาด) */}
            <div className="relative" ref={desktopMenuRef}>
              <button
                type="button"
                onClick={() => {
                  playTabSound();
                  setIsDesktopMenuOpen(prev => !prev);
                }}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isDesktopMenuOpen
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isDark 
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="เมนูเพิ่มเติม"
              >
                <MoreVertical className="w-3.5 h-3.5" />
                <span>เมนู</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDesktopMenuOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* Dropdown Menu Popup for Desktop */}
              {isDesktopMenuOpen && (
                <div className={`absolute right-0 top-full mt-1.5 w-56 rounded-lg border shadow-xl p-1 z-50 backdrop-blur-md animate-in zoom-in-95 duration-150 ${
                  isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/80' : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/40'
                }`}>
                  {/* Public Updates Option */}
                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsDesktopMenuOpen(false);
                      if (onOpenPublicUpdates) onOpenPublicUpdates();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-semibold text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>อัปเดตสถานการณ์สดรายวัน</span>
                  </button>

                  {/* Feedback Option */}
                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsDesktopMenuOpen(false);
                      if (onOpenFeedback) onOpenFeedback();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>กล่องข้อเสนอแนะประชาชน</span>
                  </button>

                  {/* Water Standards Option */}
                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsDesktopMenuOpen(false);
                      if (onOpenStandards) onOpenStandards();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>เกณฑ์วัดระดับน้ำ & ยานพาหนะ</span>
                  </button>

                  {/* Privacy Policy Option */}
                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsDesktopMenuOpen(false);
                      if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>นโยบาย & ข้อมูลอ้างอิง</span>
                  </button>
                </div>
              )}
            </div>

            {/* Theme Switcher Button */}
            <button
              type="button"
              onClick={() => {
                playToggleSound(!isDark);
                if (onToggleTheme) onToggleTheme();
              }}
              className={`p-2 rounded-md border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800 hover:border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
              title={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
              aria-label="เปลี่ยนธีมสี"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
