import React, { useState } from 'react';
import { 
  playClickSound, 
  playToggleSound, 
  playReportSound, 
  playEmergencySound, 
  playCloseSound 
} from '../services/soundEffects';
import { 
  Navigation, 
  CloudRain, 
  Camera, 
  Activity, 
  PhoneCall, 
  MessageSquare, 
  Search, 
  Grid, 
  X, 
  BookOpen, 
  Sun, 
  Moon,
  Sparkles
} from 'lucide-react';

export default function MobileBottomNav({
  onLocateMe,
  onOpenAiForecast,
  onOpenCitizenReport,
  onOpenPublicUpdates,
  onOpenFeedback,
  onOpenEmergency,
  onOpenStandards,
  onToggleTheme,
  hasGps = false,
  theme = 'light',
  onToggleSearch,
  isSearchOpen = false,
}) {
  const isDark = theme === 'dark';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuAction = (actionFn, soundFn) => {
    if (typeof soundFn === 'function') soundFn();
    setIsMenuOpen(false);
    if (typeof actionFn === 'function') actionFn();
  };

  return (
    <>
      {/* ===== BOTTOM SHEET QUICK MENU (เมื่อกดปุ่ม "เมนู") ===== */}
      {isMenuOpen && (
        <div 
          className="sm:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            playCloseSound();
            setIsMenuOpen(false);
          }}
        >
          <div 
            className={`absolute bottom-0 left-0 right-0 rounded-t-3xl border-t p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl transition-all transform animate-in slide-in-from-bottom duration-300 ${
              isDark 
                ? 'bg-slate-900 border-slate-700 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full inline-block"></span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  เมนูช่วยเหลือ
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCloseSound();
                  setIsMenuOpen(false);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 active:scale-90 transition-transform"
                aria-label="ปิดเมนู"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Grid (Clean Touch Targets, NO ADMIN) */}
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* 1. Emergency Hotline 1784 */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenEmergency, playEmergencySound)}
                className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-3 transition-all active:scale-95 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <PhoneCall className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-white">สายด่วนฉุกเฉิน</span>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">โทรฟรี 1784</span>
                </div>
              </button>

              {/* 2. Water Standards Guide */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenStandards, playClickSound)}
                className="p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center gap-3 transition-all active:scale-95 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-900 dark:text-white">เกณฑ์ระดับน้ำ</span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">เขียว / เหลือง / แดง</span>
                </div>
              </button>

              {/* 3. Dark / Light Theme Toggle (Full Width) */}
              <button
                type="button"
                onClick={() => handleMenuAction(onToggleTheme, () => playToggleSound(!isDark))}
                className="col-span-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-slate-900 dark:text-white">ธีมหน้าจอ</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{isDark ? 'แตะเพื่อเปลี่ยนเป็นโหมดสว่าง' : 'แตะเพื่อเปลี่ยนเป็นโหมดมืด'}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {isDark ? 'โหมดมืด 🌙' : 'โหมดสว่าง ☀️'}
                </span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN 5-BUTTON BAR (HIGHER LEGIBILITY, CRISP FONTS) ===== */}
      <nav
        aria-label="เมนูหลักสำหรับมือถือ"
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl transition-all duration-200 select-none pb-[calc(env(safe-area-inset-bottom,0px)+2px)] ${
          isDark
            ? 'bg-slate-950/95 border-slate-800 text-slate-200 shadow-[0_-8px_25px_rgba(0,0,0,0.6)]'
            : 'bg-white border-slate-300 text-slate-900 shadow-[0_-6px_20px_rgba(15,23,42,0.12)]'
        }`}
      >
        <div className="flex items-stretch justify-around px-2 max-w-md mx-auto" style={{ height: '62px' }}>

          {/* 1. ข้อเสนอแนะประชาชน */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              if (onOpenFeedback) onOpenFeedback();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-95 cursor-pointer py-1 ${
              isDark ? 'text-slate-200 hover:text-cyan-400' : 'text-slate-800 hover:text-teal-700'
            }`}
            title="ข้อเสนอแนะ"
          >
            <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-bold leading-none">ข้อเสนอแนะ</span>
          </button>

          {/* 2. อัปเดตสถานการณ์สด */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenPublicUpdates?.();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-95 cursor-pointer py-1 ${
              isDark ? 'text-slate-200 hover:text-emerald-400' : 'text-slate-800 hover:text-emerald-700'
            }`}
          >
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold leading-none">อัปเดต</span>
          </button>

          {/* 3. CENTER HERO — แจ้งน้ำท่วม */}
          <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-20px' }}>
            <button
              type="button"
              onClick={() => {
                playReportSound();
                if (onOpenCitizenReport) onOpenCitizenReport();
              }}
              className="flex flex-col items-center justify-center w-[60px] h-[60px] rounded-3xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-500 text-white shadow-xl shadow-blue-500/40 border-[3.5px] active:scale-90 transition-transform cursor-pointer"
              style={{ borderColor: isDark ? '#020617' : '#ffffff' }}
              title="แตะเพื่อแจ้งจุดน้ำท่วม"
            >
              <Camera className="w-6 h-6 drop-shadow-sm" />
              <span className="text-[10px] font-extrabold mt-0.5 leading-none">แจ้งท่วม</span>
            </button>
          </div>

          {/* 4. ฝนวันนี้ */}
          <button
            type="button"
            onClick={() => {
              playToggleSound();
              if (onOpenAiForecast) onOpenAiForecast();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-95 cursor-pointer py-1 ${
              isDark ? 'text-slate-200 hover:text-cyan-400' : 'text-slate-800 hover:text-blue-700'
            }`}
          >
            <CloudRain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold leading-none">ฝนวันนี้</span>
          </button>

          {/* 5. เมนู */}
          <button
            type="button"
            onClick={() => {
              playToggleSound();
              setIsMenuOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-95 cursor-pointer py-1 ${
              isMenuOpen
                ? (isDark ? 'text-amber-400 font-bold' : 'text-amber-700 font-bold')
                : (isDark ? 'text-slate-200 hover:text-white' : 'text-slate-800 hover:text-slate-950')
            }`}
          >
            <Grid className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold leading-none">เมนู</span>
          </button>

        </div>
      </nav>
    </>
  );
}
