import React, { useState } from 'react';
import { 
  playClickSound, 
  playToggleSound, 
  playReportSound, 
  playEmergencySound, 
  playCloseSound, 
  playModalOpenSound,
  playTabSound
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
  Sparkles,
  ShieldCheck,
  Bell,
  Lock
} from 'lucide-react';

export default function MobileBottomNav({
  onLocateMe,
  onOpenAiForecast,
  onOpenCitizenReport,
  onOpenPublicUpdates,
  onOpenAnnouncement,
  hasAnnouncement = false,
  onOpenFeedback,
  onOpenEmergency,
  onOpenStandards,
  onOpenPrivacyPolicy,
  onOpenAdmin,
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
          className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            playCloseSound();
            setIsMenuOpen(false);
          }}
        >
          <div 
            className={`absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto overscroll-contain rounded-t-lg border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-2xl transition-all transform animate-in slide-in-from-bottom duration-300 ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-md inline-block"></span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  ศูนย์เมนูช่วยเหลือ & ข้อมูลทางการ
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCloseSound();
                  setIsMenuOpen(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 active:scale-90 transition-transform"
                aria-label="ปิดเมนู"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions Grid (Enterprise shadcn style) */}
            <div className="grid grid-cols-2 gap-2">
              
              {/* 0. Emergency Hotline 1784 (Polite Crimson/Rose - เข้าถึงง่ายชิดบนเมนู) */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenEmergency, playEmergencySound)}
                className="col-span-2 p-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-between transition-all active:scale-98 text-left cursor-pointer border border-rose-700/60 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">สายด่วนสาธารณภัย 1784</span>
                    <span className="text-[10px] text-rose-100 block">แจ้งเหตุฉุกเฉินและขอความช่วยเหลือเร่งด่วน (โทรฟรี 24 ชม.)</span>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-white/20 text-white text-xs font-mono font-bold shrink-0">
                  โทรฟรี
                </span>
              </button>

              {/* 1. Admin Announcement (ปุ่มดูประกาศทางการจากแอดมิน) */}
              {hasAnnouncement && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenAnnouncement, playModalOpenSound)}
                  className="col-span-2 p-2.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-2.5 transition-all active:scale-98 text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold block text-slate-900 dark:text-white">ประกาศจากเจ้าหน้าที่แอดมิน</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate block">แตะเพื่ออ่านประกาศทางการล่าสุด</span>
                  </div>
                </button>
              )}

              {/* 1.5 Weather Forecast & Radar Option */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenAiForecast, playModalOpenSound)}
                className="col-span-2 p-2.5 rounded-md bg-cyan-50/70 hover:bg-cyan-100/70 dark:bg-cyan-950/30 dark:hover:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/80 text-cyan-900 dark:text-cyan-200 flex items-center justify-between transition-all active:scale-98 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-cyan-600 text-white flex items-center justify-center shrink-0">
                    <CloudRain className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block text-slate-900 dark:text-white truncate">พยากรณ์สภาพอากาศ & เรดาร์ฝน</span>
                    <span className="text-[10px] text-cyan-700 dark:text-cyan-300 truncate block">คาดการณ์ AI 24 ชม. และกลุ่มฝน TMD</span>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 shrink-0">
                  AI + TMD ↗
                </span>
              </button>

              {/* 2. Water Standards Guide */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenStandards, playModalOpenSound)}
                className="p-2.5 rounded-md bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-95 text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold block text-slate-900 dark:text-white">เกณฑ์ระดับน้ำ</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">คู่มือสัญจรปลอดภัย</span>
                </div>
              </button>

              {/* 3. Search / District Filters Toggle */}
              <button
                type="button"
                onClick={() => handleMenuAction(onToggleSearch, playTabSound)}
                className="p-2.5 rounded-md bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all active:scale-95 text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold block text-slate-900 dark:text-white">ค้นหาจุดเสี่ยง</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">เปิดแผงกรองอำเภอ</span>
                </div>
              </button>

              {/* 4. Staff / Admin Login */}
              {onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => handleMenuAction(onOpenAdmin, playModalOpenSound)}
                  className="col-span-2 p-2.5 rounded-md bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all active:scale-98 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block text-slate-900 dark:text-white truncate">สำหรับเจ้าหน้าที่ / แอดมิน</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">เข้าสู่ระบบควบคุมและจัดการสถานการณ์</span>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 shrink-0">
                    ADMIN
                  </span>
                </button>
              )}

              {/* 5. Privacy Policy & Terms */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenPrivacyPolicy, playModalOpenSound)}
                className="col-span-2 p-2.5 rounded-md bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-2.5 transition-all active:scale-98 text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-slate-900 dark:text-white">
                  นโยบายข้อกำหนดความเป็นส่วนตัวและแหล่งข้อมูล
                </span>
              </button>

              {/* 5. Dark / Light Theme Toggle */}
              <button
                type="button"
                onClick={() => handleMenuAction(onToggleTheme, () => playToggleSound(!isDark))}
                className="col-span-2 p-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-slate-800 dark:bg-slate-700 text-amber-300 flex items-center justify-center shrink-0">
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-200" />}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-medium block text-slate-900 dark:text-white">ธีมหน้าจอแสดงผล</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {isDark ? 'โหมดมืด 🌙' : 'โหมดสว่าง ☀️'}
                </span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN 5-BUTTON BAR (OFFICIAL ENTERPRISE GIS STYLE) ===== */}
      <nav
        aria-label="เมนูหลักสำหรับมือถือ"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md transition-all duration-200 select-none pb-[calc(env(safe-area-inset-bottom,0px)+2px)] ${
          isDark
            ? 'bg-slate-950/95 border-slate-800 text-slate-200 shadow-md'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-stretch justify-around px-2 max-w-md mx-auto" style={{ height: '54px' }}>

          {/* 1. ข้อเสนอแนะประชาชน */}
          <button
            type="button"
            onClick={() => {
              playModalOpenSound();
              if (onOpenFeedback) onOpenFeedback();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md transition-all active:scale-95 cursor-pointer py-1 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
            title="ข้อเสนอแนะ"
          >
            <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-[10px] font-medium leading-none">ข้อเสนอแนะ</span>
          </button>

          {/* 2. อัปเดตสถานการณ์สด */}
          <button
            type="button"
            onClick={() => {
              playModalOpenSound();
              onOpenPublicUpdates?.();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md transition-all active:scale-95 cursor-pointer py-1 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] font-medium leading-none">อัปเดต</span>
          </button>

          {/* 3. CENTER HERO — แจ้งน้ำท่วม (Solid, Authoritative Blue Button) */}
          <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-12px' }}>
            <button
              type="button"
              onClick={() => {
                playReportSound();
                if (onOpenCitizenReport) onOpenCitizenReport();
              }}
              className="flex flex-col items-center justify-center w-[46px] h-[46px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md border-2 border-white dark:border-slate-900 active:scale-90 transition-transform cursor-pointer"
              title="แตะเพื่อแจ้งจุดน้ำท่วม"
            >
              <Camera className="w-4 h-4" />
              <span className="text-[8.5px] font-bold mt-0.5 leading-none">แจ้งท่วม</span>
            </button>
          </div>

          {/* 4. ฝนวันนี้ */}
          <button
            type="button"
            onClick={() => {
              playModalOpenSound();
              if (onOpenAiForecast) onOpenAiForecast();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md transition-all active:scale-95 cursor-pointer py-1 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <CloudRain className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-[10px] font-medium leading-none">ฝนวันนี้</span>
          </button>

          {/* 5. เมนู */}
          <button
            type="button"
            onClick={() => {
              playTabSound();
              setIsMenuOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md transition-all active:scale-95 cursor-pointer py-1 ${
              isMenuOpen
                ? (isDark ? 'text-amber-400 font-bold' : 'text-amber-700 font-bold')
                : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950')
            }`}
          >
            <Grid className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-[10px] font-medium leading-none">เมนู</span>
          </button>

        </div>
      </nav>
    </>
  );
}
