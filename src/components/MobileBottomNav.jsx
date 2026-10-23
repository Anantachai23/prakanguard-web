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
  Activity, 
  Search, 
  Grid, 
  X
} from 'lucide-react';
import {
  CivicCctv,
  CivicReportCamera,
  CivicFeedback,
  CivicWeather,
  CivicEmergencyPhone,
  CivicStandards,
  CivicShield
} from './CivicIcons';

export default function MobileBottomNav({
  onLocateMe,
  onOpenAiForecast,
  onOpenCitizenReport,
  onOpenPublicUpdates,
  onOpenCctv,
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
          className="md:hidden fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs"
          onClick={() => {
            playCloseSound();
            setIsMenuOpen(false);
          }}
        >
          <div 
            className={`absolute bottom-0 left-0 right-0 max-h-[62vh] overflow-y-auto overscroll-contain rounded-t-xl border-t p-2.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-1 bg-slate-300 dark:bg-slate-700 rounded-md inline-block"></span>
                <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 tracking-wide">
                  ศูนย์เมนูช่วยเหลือ & ข้อมูลทางการ
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCloseSound();
                  setIsMenuOpen(false);
                }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800"
                aria-label="ปิดเมนู"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              
              {/* 1. Emergency Hotline 1784 */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenEmergency, playEmergencySound)}
                className="col-span-2 p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-between transition-colors text-left cursor-pointer border border-rose-700/60"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-white/15 flex items-center justify-center shrink-0">
                    <CivicEmergencyPhone className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block text-white leading-tight">สายด่วนสาธารณภัย 1784</span>
                    <span className="text-[9.5px] text-rose-100 block">แจ้งเหตุฉุกเฉินและขอความช่วยเหลือ (24 ชม.)</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-mono font-bold shrink-0">
                  โทรฟรี
                </span>
              </button>

              {/* CCTV 24 Hours Live Cameras */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenCctv, playModalOpenSound)}
                className={`col-span-2 p-2 rounded-lg border flex items-center justify-between transition-colors text-left cursor-pointer ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-700 text-white flex items-center justify-center shrink-0">
                    <CivicCctv className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold block leading-tight">กล้องวงจรปิด CCTV 24 ชม.</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-700 text-white">21 จุด</span>
                    </div>
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block">จุดตรวจการณ์จริงทั่ว 6 อำเภอ (DOH • EXAT • RID)</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-700 text-white text-[10px] font-bold shrink-0">
                  เปิดดู
                </span>
              </button>

              {/* 2. Water Standards Guide */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenStandards, playModalOpenSound)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-blue-700 text-white flex items-center justify-center shrink-0">
                  <CivicStandards className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold block text-slate-900 dark:text-white truncate">เกณฑ์ระดับน้ำ</span>
                  <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block truncate">คู่มือสัญจร</span>
                </div>
              </button>

              {/* 3. Search / District Filters Toggle */}
              <button
                type="button"
                onClick={() => handleMenuAction(onToggleSearch, playTabSound)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <Search className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold block text-slate-900 dark:text-white truncate">ค้นหาจุดเสี่ยง</span>
                  <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block truncate">กรองรายอำเภอ</span>
                </div>
              </button>

              {/* 4. Privacy Policy & Terms */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenPrivacyPolicy, playModalOpenSound)}
                className="col-span-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <CivicShield className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-medium text-slate-900 dark:text-white truncate">
                  นโยบายความเป็นส่วนตัวและแหล่งข้อมูลอ้างอิง
                </span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN 5-BUTTON BAR (COMPACT MOBILE PROPORTIONS) ===== */}
      <nav
        aria-label="เมนูหลักสำหรับมือถือ"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md transition-all duration-200 select-none pb-[calc(env(safe-area-inset-bottom,0px)+1px)] ${
          isDark
            ? 'bg-slate-950/95 border-slate-800 text-slate-200 shadow-md'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-stretch justify-around px-1.5 max-w-md mx-auto" style={{ height: '46px' }}>

          {/* 1. ข้อเสนอแนะประชาชน */}
          <button
            type="button"
            onClick={() => {
              playModalOpenSound();
              if (onOpenFeedback) onOpenFeedback();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md transition-all active:scale-95 cursor-pointer py-0.5 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
            title="ข้อเสนอแนะ"
          >
            <CivicFeedback className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-[9.5px] font-medium leading-none">ข้อเสนอแนะ</span>
          </button>

          {/* 2. อัปเดตสถานการณ์สด */}
          <button
            type="button"
            onClick={() => {
              playModalOpenSound();
              onOpenPublicUpdates?.();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md transition-all active:scale-95 cursor-pointer py-0.5 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[9.5px] font-medium leading-none">อัปเดต</span>
          </button>

          {/* 3. CENTER HERO — แจ้งน้ำท่วม (Compact Authoritative Blue Button) */}
          <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-8px' }}>
            <button
              type="button"
              onClick={() => {
                playReportSound();
                if (onOpenCitizenReport) onOpenCitizenReport();
              }}
              className="flex flex-col items-center justify-center w-[40px] h-[40px] rounded-lg bg-blue-700 hover:bg-blue-800 text-white shadow-md border-2 border-white dark:border-slate-900 active:scale-90 transition-transform cursor-pointer"
              title="แตะเพื่อแจ้งจุดน้ำท่วม"
            >
              <CivicReportCamera className="w-3.5 h-3.5" />
              <span className="text-[8px] font-bold mt-0.5 leading-none">แจ้งท่วม</span>
            </button>
          </div>

          {/* 4. ฝนวันนี้ */}
          <button
            type="button"
            onClick={() => {
              playModalOpenSound();
              if (onOpenAiForecast) onOpenAiForecast();
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md transition-all active:scale-95 cursor-pointer py-0.5 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <CivicWeather className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-[9.5px] font-medium leading-none">ฝนวันนี้</span>
          </button>

          {/* 5. เมนู */}
          <button
            type="button"
            onClick={() => {
              playTabSound();
              setIsMenuOpen(true);
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md transition-all active:scale-95 cursor-pointer py-0.5 ${
              isMenuOpen
                ? (isDark ? 'text-amber-400 font-bold' : 'text-amber-700 font-bold')
                : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950')
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="text-[9.5px] font-medium leading-none">เมนู</span>
          </button>

        </div>
      </nav>
    </>
  );
}
