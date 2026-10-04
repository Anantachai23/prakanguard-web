import React from 'react';
import { 
  PhoneCall, 
  Sun, 
  Moon, 
  Camera 
} from 'lucide-react';
import RealTimeClock from './RealTimeClock';
import { 
  playToggleSound, 
  playSelectSound, 
  playReportSound, 
  playEmergencySound,
  playModalOpenSound
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
  onOpenPrivacyPolicy,
  lastUpdatedTime,
  lastUpdatedTimeDetailed,
  pendingReportsCount = 0,
  theme = 'light',
  onToggleTheme,
  onRefreshData,
  isRefreshing = false,
  refreshCountdown = 300
}) {
  const isDark = theme === 'dark';

  // Use precomputed levelCounts synchronized 1:1 with map pins
  const minor = levelCounts ? levelCounts.minor : points.filter(p => p.level === 1 && p.isActive !== false && !p.isResolved).length;
  const moderate = levelCounts ? levelCounts.moderate : points.filter(p => p.level === 2 && p.isActive !== false && !p.isResolved).length;
  const severe = levelCounts ? levelCounts.severe : points.filter(p => p.level === 3 && p.isActive !== false && !p.isResolved).length;
  const falling = levelCounts ? levelCounts.falling : points.filter(p => p.waterTrend === 'falling' && p.isActive !== false && !p.isResolved).length;

  return (
    <header className={`sticky top-0 z-[1001] w-full border-b backdrop-blur-md transition-colors select-none ${
      isDark ? 'bg-slate-950/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      <div className="w-full max-w-full px-2.5 sm:px-4 py-2 flex items-center justify-between gap-1.5 sm:gap-2 overflow-hidden">
        
        {/* Brand Area (Left) */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 min-w-0">
          {/* PrakanGuard Official Mascot Emblem */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-blue-600 via-cyan-400 to-teal-300 shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="PrakanGuard Logo" 
              className="w-full h-full rounded-full object-cover" 
            />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm sm:text-base font-black tracking-tight leading-tight shrink-0 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                PrakanGuard
              </span>
              <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                isDark ? 'bg-blue-950 text-cyan-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                สมุทรปราการ
              </span>
            </div>
            <span className={`hidden xl:block text-[11px] font-medium leading-none mt-0.5 truncate ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              ระบบเฝ้าระวังน้ำท่วมและเส้นทางสัญจร อัปเดตสด 24 ชม.
            </span>
          </div>
        </div>

        {/* Center Area: Level Filter Buttons & Live Temperature & Clock (PC & Tablet) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          
          {/* Level Filter Buttons: เลือกดูเฉพาะระดับน้ำแต่ละระดับ */}
          <div className={`flex items-center gap-1 p-0.5 sm:p-1 rounded-2xl border backdrop-blur-md shadow-2xs select-none ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200/80'
          }`}>
            {/* Level 1: ปกติ Filter Button */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === '1' ? 'all' : '1');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                severityFilter === '1'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-400/40'
                  : isDark 
                    ? 'hover:bg-slate-800 text-emerald-400' 
                    : 'hover:bg-white text-emerald-700'
              }`}
              title="คลิกเพื่อกรองแสดงเฉพาะจุดน้ำท่วมปกติ (5-20 ซม.)"
            >
              <span className={`w-2 h-2 rounded-full ${severityFilter === '1' ? 'bg-white' : 'bg-emerald-500'}`}></span>
              <span>ปกติ</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                severityFilter === '1' ? 'bg-white/20 text-white' : (isDark ? 'bg-emerald-950/80 text-emerald-300' : 'bg-emerald-100 text-emerald-800')
              }`}>{minor}</span>
            </button>

            {/* Level 2: ปานกลาง Filter Button */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === '2' ? 'all' : '2');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                severityFilter === '2'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold ring-2 ring-amber-300/50'
                  : isDark 
                    ? 'hover:bg-slate-800 text-amber-400' 
                    : 'hover:bg-white text-amber-700'
              }`}
              title="คลิกเพื่อกรองแสดงเฉพาะจุดน้ำท่วมปานกลาง (21-50 ซม.)"
            >
              <span className={`w-2 h-2 rounded-full ${severityFilter === '2' ? 'bg-slate-950' : 'bg-amber-500'}`}></span>
              <span>ปานกลาง</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                severityFilter === '2' ? 'bg-black/15 text-slate-950' : (isDark ? 'bg-amber-950/80 text-amber-300' : 'bg-amber-100 text-amber-800')
              }`}>{moderate}</span>
            </button>

            {/* Level 3: วิกฤต Filter Button */}
            <button
              type="button"
              onClick={() => {
                playSelectSound();
                if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === '3' ? 'all' : '3');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                severityFilter === '3'
                  ? 'bg-rose-600 text-white shadow-xs font-bold ring-2 ring-rose-400/40'
                  : isDark 
                    ? 'hover:bg-slate-800 text-rose-400' 
                    : 'hover:bg-white text-rose-700'
              }`}
              title="คลิกเพื่อกรองแสดงเฉพาะจุดน้ำท่วมวิกฤต (>50 ซม.)"
            >
              <span className={`w-2 h-2 rounded-full ${severityFilter === '3' ? 'bg-white' : 'bg-rose-500 animate-pulse'}`}></span>
              <span>วิกฤต</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                severityFilter === '3' ? 'bg-white/20 text-white' : (isDark ? 'bg-rose-950/80 text-rose-300' : 'bg-rose-100 text-rose-800')
              }`}>{severe}</span>
            </button>

            {/* Falling: น้ำลด Filter Button */}
            {falling > 0 && (
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  if (onSelectSeverityFilter) onSelectSeverityFilter(severityFilter === 'falling' ? 'all' : 'falling');
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                  severityFilter === 'falling'
                    ? 'bg-teal-600 text-white shadow-xs font-bold ring-2 ring-teal-400/40'
                    : isDark 
                      ? 'hover:bg-slate-800 text-teal-400' 
                      : 'hover:bg-white text-teal-700'
                }`}
                title="คลิกเพื่อกรองแสดงเฉพาะจุดที่น้ำกำลังลด"
              >
                <span>📉</span>
                <span>น้ำลด</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  severityFilter === 'falling' ? 'bg-white/20 text-white' : (isDark ? 'bg-teal-950/80 text-teal-300' : 'bg-teal-100 text-teal-800')
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
                className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                title="ล้างตัวกรองและแสดงระดับน้ำทั้งหมด"
              >
                แสดงทั้งหมด ✕
              </button>
            )}
          </div>

          {/* Live Real-Time Weather & Temperature Badge (Shown on wide screens >= 1280px) */}
          {weather && weather.temp !== undefined && (
            <div 
              className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-xs font-bold transition-all shadow-2xs select-none shrink-0 ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-700 text-sky-300' 
                  : 'bg-sky-50/90 border-sky-200 text-sky-800'
              }`}
              title={`สภาพอากาศจริง จ.สมุทรปราการ: ${weather.weatherDesc || 'มีเมฆบางส่วน'} • อุณหภูมิจริง ${weather.temp}°C (รู้สึกเหมือน ${weather.feelsLike || weather.temp}°C)`}
            >
              <span className="text-sm shrink-0">
                {weather.forecast24h?.isRainingNow ? '🌧️' : (weather.temp >= 33 ? '☀️' : (weather.temp <= 26 ? '🌦️' : '⛅'))}
              </span>
              <span className="font-extrabold font-mono tracking-tight text-xs">
                {weather.temp}°C
              </span>
              {weather.weatherDesc && (
                <span className="hidden 2xl:inline text-[11px] font-medium opacity-85 max-w-[90px] truncate">
                  {weather.weatherDesc}
                </span>
              )}
            </div>
          )}

          {/* Clock for Tablet/PC */}
          <div className="shrink-0">
            <RealTimeClock theme={theme} />
          </div>
        </div>

        {/* Right Area: Action Buttons (Responsive & Clean) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Mobile Clock: Clean & Compact */}
          <div className="md:hidden shrink-0">
            <RealTimeClock theme={theme} />
          </div>

          {/* Desktop Live Updates Button (Wide screens >= 1280px) */}
          <button 
            type="button"
            onClick={() => {
              playModalOpenSound();
              if (onOpenPublicUpdates) onOpenPublicUpdates();
            }}
            className={`hidden xl:inline-flex px-2.5 py-1.5 rounded-xl border text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
            title="อัปเดตสถานการณ์น้ำล่าสุดตลอด 24 ชม."
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>อัปเดต</span>
          </button>

          {/* Citizen Flood Report Button */}
          <button 
            type="button"
            onClick={() => {
              playReportSound();
              if (onOpenCitizenReport) onOpenCitizenReport();
            }}
            title="รายงานจุดน้ำท่วม"
            className="hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-600/25 active:scale-95"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>แจ้งจุดท่วม</span>
          </button>

          {/* Emergency Hotline */}
          <button 
            type="button"
            onClick={() => {
              playEmergencySound();
              if (onOpenEmergency) onOpenEmergency();
            }}
            title="สายด่วนฉุกเฉิน 1784"
            className="hidden sm:inline-flex px-2 sm:px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-600/25 active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">สายด่วน</span>
            <span>1784</span>
          </button>

          {/* Theme Switcher Button (Always accessible) */}
          <button
            type="button"
            onClick={() => {
              playToggleSound(!isDark);
              if (onToggleTheme) onToggleTheme();
            }}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700 hover:border-amber-400/50' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300'
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
    </header>
  );
}
