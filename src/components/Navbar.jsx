import React from 'react';
import { 
  PhoneCall, 
  Radio, 
  BookOpen, 
  Activity, 
  Sun, 
  Moon, 
  Camera, 
  MessageSquare
} from 'lucide-react';
import RealTimeClock from './RealTimeClock';

export default function Navbar({ 
  points, 
  onOpenEmergency, 
  onOpenAiForecast,
  onOpenStandards,
  onOpenWelcome,
  onOpenCitizenReport,
  onOpenFeedback,
  onOpenAdmin,
  onOpenPublicUpdates,
  lastUpdatedTime,
  lastUpdatedTimeDetailed,
  pendingReportsCount = 0,
  theme = 'light',
  onToggleTheme
}) {
  const isDark = theme === 'dark';
  const minor = points.filter(p => p.level === 1 && p.isActive !== false && !p.isResolved).length;
  const moderate = points.filter(p => p.level === 2 && p.isActive !== false && !p.isResolved).length;
  const severe = points.filter(p => p.level === 3 && p.isActive !== false && !p.isResolved).length;
  const falling = points.filter(p => p.waterTrend === 'falling' && p.isActive !== false && !p.isResolved).length;

  return (
    <header className={`relative z-40 w-full shrink-0 border-b shadow-sm backdrop-blur-xl transition-colors duration-200 select-none ${
      isDark ? 'bg-slate-950/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      <div className="w-full px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2">
        
        {/* Brand Area (Left) */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 min-w-0">
          {/* Hydro Telemetry Shield Crest */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 p-[1.5px] shadow-md shadow-blue-500/20 shrink-0">
            <div className={`w-full h-full rounded-[14px] flex items-center justify-center relative overflow-hidden ${
              isDark ? 'bg-slate-950' : 'bg-white'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent"></div>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" fillOpacity="0.25" />
                <path d="M8 13.5c1-.6 2.2-.6 3.2 0s2.2.6 3.2 0" stroke={isDark ? "#38bdf8" : "#0284c7"} strokeWidth="1.8" />
                <path d="M7 17c1.3-.7 2.8-.7 4.1 0s2.8.7 4.1 0" stroke={isDark ? "#38bdf8" : "#0284c7"} strokeWidth="1.8" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm sm:text-base font-black tracking-tight leading-tight ${
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
            <span className={`hidden lg:block text-[11px] font-medium leading-none mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              ระบบเฝ้าระวังน้ำท่วมและเส้นทางสัญจร อัปเดตสด 24 ชม.
            </span>
          </div>
        </div>

        {/* Center Area: Status Indicator & Clock (iPad & PC) */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {/* Status Indicator Pill */}
          <button 
            type="button"
            onClick={onOpenStandards}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-2xl border text-xs font-medium cursor-pointer transition-all hover:scale-[1.02] shadow-xs ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="คลิกเพื่อดูเกณฑ์ระดับน้ำมาตรฐาน"
          >
            <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">ปกติ</span>
              <span className="font-bold">{minor}</span>
            </span>
            <span className="text-slate-400 text-[10px]">•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">ปานกลาง</span>
              <span className="font-bold">{moderate}</span>
            </span>
            <span className="text-slate-400 text-[10px]">•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">วิกฤต</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{severe}</span>
            </span>
            {falling > 0 && (
              <>
                <span className="text-slate-400 text-[10px]">•</span>
                <span className="flex items-center gap-1">
                  <span className="text-xs">📉</span>
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">น้ำลด</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">{falling}</span>
                </span>
              </>
            )}
          </button>

          {/* Clock */}
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

          {/* Desktop/Tablet Standards Button */}
          <button 
            type="button"
            onClick={onOpenStandards}
            className={`hidden xl:inline-flex px-2.5 py-1.5 rounded-xl border text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isDark 
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="เกณฑ์วัดระดับน้ำและผลกระทบต่อยานพาหนะ"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>เกณฑ์ระดับน้ำ</span>
          </button>

          {/* Desktop/Tablet Feedback Button */}
          <button 
            type="button"
            onClick={onOpenFeedback}
            className={`hidden lg:inline-flex px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isDark 
                ? 'bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border-teal-800' 
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
            }`}
            title="กล่องข้อเสนอแนะและติชมจากประชาชน"
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            <span>ข้อเสนอแนะ</span>
          </button>

          {/* Desktop/Tablet Live Updates Button */}
          <button 
            type="button"
            onClick={onOpenPublicUpdates}
            className={`hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isDark 
                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
            title="อัปเดตสถานการณ์น้ำท่วมสด"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>อัปเดตสด</span>
          </button>

          {/* Desktop/Tablet Citizen Flood Report Button */}
          <button 
            type="button"
            onClick={onOpenCitizenReport}
            title="รายงานจุดน้ำท่วม"
            className="hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-600/25"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>แจ้งจุดท่วม</span>
          </button>

          {/* Desktop Emergency Hotline */}
          <button 
            type="button"
            onClick={onOpenEmergency}
            title="สายด่วนฉุกเฉิน 1784"
            className="hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-600/25"
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
            <span>สายด่วน 1784</span>
          </button>

          {/* Theme Switcher Button (Always accessible) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-1.5 sm:p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs ${
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
