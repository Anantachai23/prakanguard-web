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
  Lock,
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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  // Close tablet dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setIsMoreMenuOpen(false);
      }
    }
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Use precomputed levelCounts synchronized 1:1 with map pins
  const minor = levelCounts ? levelCounts.minor : points.filter(p => p.level === 1 && p.isActive !== false && !p.isResolved).length;
  const moderate = levelCounts ? levelCounts.moderate : points.filter(p => p.level === 2 && p.isActive !== false && !p.isResolved).length;
  const severe = levelCounts ? levelCounts.severe : points.filter(p => p.level === 3 && p.isActive !== false && !p.isResolved).length;
  const falling = levelCounts ? levelCounts.falling : points.filter(p => p.waterTrend === 'falling' && p.isActive !== false && !p.isResolved).length;

  return (
    <header className={`sticky top-0 z-[1001] w-full border-b backdrop-blur-md transition-colors select-none ${
      isDark ? 'bg-slate-950/90 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900'
    }`}>
      <div className="w-full max-w-full px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2.5 overflow-visible relative">
        
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
            {/* Extended Brand Subtitle on Wide Desktop */}
            <span className={`hidden xl:block text-[11px] font-medium leading-none mt-1 truncate ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              ศูนย์เฝ้าระวังน้ำท่วมและข้อมูลเส้นทางสัญจร 24 ชม.
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. CENTER AREA: STATS FILTER BAR & WEATHER (Desktop only) */}
        {/* ========================================================= */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          
          {/* Segmented Compact Status Bar (แท่งเดียว ไม่ปล่อยลอยเป็นก้อนๆ) */}
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                severityFilter === '1'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                  : isDark 
                    ? 'hover:bg-slate-800/60 text-slate-300 hover:text-white' 
                    : 'hover:bg-white/70 text-slate-700 hover:text-slate-900'
              }`}
              title="คลิกเพื่อกรองแสดงเฉพาะจุดน้ำท่วมปกติ (5-20 ซม.)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="hidden lg:inline">ปกติ 5-20ซม.</span>
              <span className="lg:hidden">5-20ซม.</span>
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                severityFilter === '2'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                  : isDark 
                    ? 'hover:bg-slate-800/60 text-slate-300 hover:text-white' 
                    : 'hover:bg-white/70 text-slate-700 hover:text-slate-900'
              }`}
              title="คลิกเพื่อกรองแสดงเฉพาะจุดน้ำท่วมปานกลาง (21-50 ซม.)"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span className="hidden lg:inline">ปานกลาง 21-50ซม.</span>
              <span className="lg:hidden">21-50ซม.</span>
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                severityFilter === '3'
                  ? 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 shadow-xs border border-slate-200 dark:border-slate-700 font-bold'
                  : isDark 
                    ? 'hover:bg-slate-800/60 text-slate-300 hover:text-white' 
                    : 'hover:bg-white/70 text-slate-700 hover:text-slate-900'
              }`}
              title="คลิกเพื่อกรองแสดงเฉพาะจุดน้ำท่วมวิกฤต (>50 ซม.)"
            >
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0"></span>
              <span className="hidden lg:inline">วิกฤต &gt;50ซม.</span>
              <span className="lg:hidden">&gt;50ซม.</span>
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

          {/* Live Weather & Temperature */}
          {weather && weather.temp !== undefined && (
            <div 
              className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold select-none shrink-0 ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800 text-slate-200' 
                  : 'bg-white/90 border-slate-200 text-slate-800'
              }`}
              title={`สภาพอากาศจริง จ.สมุทรปราการ: ${weather.weatherDesc || 'มีเมฆบางส่วน'} • ${weather.temp}°C`}
            >
              <span className="text-sm shrink-0">
                {weather.forecast24h?.isRainingNow ? '🌧️' : (weather.temp >= 33 ? '☀️' : (weather.temp <= 26 ? '🌦️' : '⛅'))}
              </span>
              <span className="font-mono font-bold text-xs">
                {weather.temp}°C
              </span>
            </div>
          )}

          {/* Clock for Desktop */}
          <div className="hidden lg:block shrink-0">
            <RealTimeClock theme={theme} />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RIGHT AREA: RESPONSIVE ACTIONS ACCORDING TO DEVICE     */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* --- MOBILE (Screen < 768px): Minimal, Clean, 0 Map Blocking --- */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            <RealTimeClock theme={theme} />

            {/* Mobile Announcement Button on Navbar */}
            {hasAnnouncement && (
              <button 
                type="button"
                onClick={() => {
                  playModalOpenSound();
                  if (onOpenAnnouncement) onOpenAnnouncement();
                }}
                className={`px-2 py-1 rounded-md border text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                  isDark 
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-700/80 shadow-amber-950/40' 
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/10'
                }`}
                title="ดูประกาศล่าสุดจากเจ้าหน้าที่แอดมิน"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                <span>ประกาศ</span>
              </button>
            )}

            {/* Theme Switcher Button */}
            <button
              type="button"
              onClick={() => {
                playToggleSound(!isDark);
                if (onToggleTheme) onToggleTheme();
              }}
              className={`p-1.5 rounded-md border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
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
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => {
                  playTabSound();
                  setIsMoreMenuOpen(prev => !prev);
                }}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isMoreMenuOpen
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
              {isMoreMenuOpen && (
                <div className={`absolute right-0 top-full mt-1.5 w-56 rounded-lg border shadow-xl p-1 z-50 backdrop-blur-md animate-in zoom-in-95 duration-150 ${
                  isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-black/80' : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/40'
                }`}>
                  {/* Public Updates Option */}
                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsMoreMenuOpen(false);
                      if (onOpenPublicUpdates) onOpenPublicUpdates();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-semibold text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>อัปเดตสถานการณ์สดรายวัน</span>
                  </button>

                  {hasAnnouncement && (
                    <button
                      type="button"
                      onClick={() => {
                        playModalOpenSound();
                        setIsMoreMenuOpen(false);
                        if (onOpenAnnouncement) onOpenAnnouncement();
                      }}
                      className={`w-full p-2 rounded-md text-xs font-semibold text-left flex items-center gap-2 transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-amber-950/60 text-amber-300' : 'hover:bg-amber-50 text-amber-800'
                      }`}
                    >
                      <Bell className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                      <span>📢 ประกาศแอดมิน</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsMoreMenuOpen(false);
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
                      setIsMoreMenuOpen(false);
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
                      setIsMoreMenuOpen(false);
                      if (onOpenAiForecast) onOpenAiForecast();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <CloudRain className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span>คาดการณ์ฝนตก AI 24 ชม.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsMoreMenuOpen(false);
                      if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>นโยบาย & ข้อมูลอ้างอิง</span>
                  </button>

                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-1"></div>

                  <button
                    type="button"
                    onClick={() => {
                      playModalOpenSound();
                      setIsMoreMenuOpen(false);
                      if (onOpenAdmin) onOpenAdmin();
                    }}
                    className={`w-full p-2 rounded-md text-xs font-medium text-left flex items-center gap-2 transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-indigo-950/60 text-indigo-300' : 'hover:bg-indigo-50 text-indigo-800'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>สำหรับเจ้าหน้าที่ / แอดมิน</span>
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

          {/* --- DESKTOP (Screen >= 1024px): Spacious Full Command Center Bar --- */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            {/* Desktop Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => {
                playToggleSound(!isSidebarOpen);
                if (onToggleSidebar) onToggleSidebar();
              }}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                isSidebarOpen
                  ? isDark ? 'bg-slate-900 text-cyan-400 border-slate-700' : 'bg-slate-100 text-blue-700 border-slate-300'
                  : isDark ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-white text-slate-700 border-slate-200'
              }`}
              title={isSidebarOpen ? "ย่อแถบด้านข้าง (ขยายแผนที่เต็มจอ)" : "เปิดแถบด้านข้าง (ค้นหาและพยากรณ์)"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5 text-blue-500" /> : <PanelLeftOpen className="w-3.5 h-3.5 text-blue-500" />}
              <span className="hidden xl:inline">{isSidebarOpen ? "ย่อแผง GIS" : "เปิดแผง GIS"}</span>
            </button>

            {/* Desktop Public Updates Button */}
            <button 
              type="button"
              onClick={() => {
                playModalOpenSound();
                if (onOpenPublicUpdates) onOpenPublicUpdates();
              }}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-medium items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="อัปเดตสถานการณ์น้ำท่วมสดรายวัน"
            >
              <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>อัปเดต</span>
            </button>

            {/* Official Announcement Button (if present) */}
            {hasAnnouncement && (
              <button 
                type="button"
                onClick={() => {
                  playModalOpenSound();
                  if (onOpenAnnouncement) onOpenAnnouncement();
                }}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isDark 
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-700/80 shadow-amber-950/40' 
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/10'
                }`}
                title="ดูประกาศล่าสุดจากเจ้าหน้าที่แอดมิน"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                <span>ประกาศแอดมิน</span>
              </button>
            )}

            {/* Desktop Feedback Button */}
            <button 
              type="button"
              onClick={() => {
                playModalOpenSound();
                if (onOpenFeedback) onOpenFeedback();
              }}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-medium items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="กล่องข้อเสนอแนะและติชมจากประชาชน"
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span className="hidden xl:inline">ข้อเสนอแนะ</span>
              <span className="xl:hidden">ข้อเสนอ</span>
            </button>

            {/* Desktop Privacy Policy Button */}
            <button 
              type="button"
              onClick={() => {
                playModalOpenSound();
                if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
              }}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-medium items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="นโยบายความเป็นส่วนตัวและแหล่งข้อมูลอ้างอิง"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="hidden xl:inline">นโยบาย & ข้อมูล</span>
              <span className="xl:hidden">นโยบาย</span>
            </button>

            {/* Citizen Flood Report Primary Button */}
            <button 
              type="button"
              onClick={() => {
                playReportSound();
                if (onOpenCitizenReport) onOpenCitizenReport();
              }}
              title="รายงานจุดน้ำท่วม"
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-700/50 shadow-xs active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>แจ้งจุดท่วม</span>
            </button>

            {/* Emergency Hotline 1784 (Polite Crimson/Rose - ชัดเจนแต่ไม่ขัดตา) */}
            <button 
              type="button"
              onClick={() => {
                playEmergencySound();
                if (onOpenEmergency) onOpenEmergency();
              }}
              title="สายด่วนฉุกเฉิน 1784 (โทรฟรี)"
              className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-700/50 shadow-xs active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">สายด่วน</span>
              <span className="font-bold">1784</span>
            </button>

            {/* Desktop Staff / Admin Login Button */}
            <button 
              type="button"
              onClick={() => {
                playModalOpenSound();
                if (onOpenAdmin) onOpenAdmin();
              }}
              title="สำหรับเจ้าหน้าที่ / ผู้ดูแลระบบ (ADMIN)"
              className={`p-2 rounded-md border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-indigo-400 border-slate-800 hover:border-indigo-700' 
                  : 'bg-white hover:bg-slate-100 text-indigo-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
            </button>

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
