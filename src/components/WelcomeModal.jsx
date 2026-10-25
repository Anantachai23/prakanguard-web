import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ShieldCheck, MapPin, Radio, Eye } from 'lucide-react';
import { CivicCrest, CivicShield } from './CivicIcons';
import { playSelectSound } from '../services/soundEffects';

/**
 * PrakanGuard Official Welcome & Telemetry Portal Modal
 * Redesigned for official civic authority aesthetic, minimal elegance, and smooth transitions
 */
export default function WelcomeModal({ 
  isOpen, 
  onClose, 
  onEnterWebsite, 
  theme = 'light' 
}) {
  const isDark = theme === 'dark';
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsExiting(false);
      const timer = setTimeout(() => {
        setIsEntering(true);
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setIsEntering(false);
      setIsExiting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnter = () => {
    if (isExiting) return;
    try {
      playSelectSound();
    } catch (_) {}
    setIsExiting(true);

    setTimeout(() => {
      if (onEnterWebsite) {
        onEnterWebsite();
      }
    }, 150);

    setTimeout(() => {
      if (onClose) onClose();
    }, 450);
  };

  return (
    <div 
      className={`fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto select-none transition-all duration-400 ${
        isEntering && !isExiting 
          ? 'bg-slate-950/65 backdrop-blur-sm opacity-100 pointer-events-auto' 
          : 'bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleEnter();
      }}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div 
        className={`w-[90vw] max-w-[380px] sm:max-w-md my-auto m-auto max-h-[74vh] sm:max-h-[85vh] shrink-0 border rounded-2xl shadow-2xl overflow-hidden flex flex-col relative transition-all ${
          isDark 
            ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/60' 
            : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-900/20'
        }`}
        style={{
          transform: !isEntering 
            ? 'translate3d(0, 18px, 0) scale(0.97)' 
            : isExiting 
              ? 'translate3d(0, -20px, 0) scale(0.98)' 
              : 'translate3d(0, 0, 0) scale(1)',
          opacity: !isEntering || isExiting ? 0 : 1,
          transitionProperty: 'transform, opacity',
          transitionDuration: isExiting ? '400ms' : '380ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity'
        }}
      >
        {/* Top Institutional Royal Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-sky-500 to-blue-700 shrink-0" />

        {/* Modal Close Icon */}
        <button 
          type="button"
          onClick={handleEnter} 
          className={`absolute top-3 right-3 w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer z-10 ${
            isDark 
              ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' 
              : 'bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-slate-200'
          }`}
          title="เข้าสู่เว็บไซต์"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Executive Header Banner */}
        <div className={`px-5 pt-6 pb-4 flex flex-col items-center text-center border-b shrink-0 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50/70 border-slate-100'
        }`}>
          {/* Institutional Crest / Logo */}
          <div className="relative mb-3">
            <div className={`w-14 h-14 rounded-full p-0.5 flex items-center justify-center border shadow-md overflow-hidden ${
              isDark 
                ? 'bg-slate-900 border-blue-500/40 text-blue-400 shadow-blue-950/40' 
                : 'bg-white border-blue-300/60 text-blue-700 shadow-blue-500/10'
            }`}>
              <img src="/logo.png" alt="PrakanGuard Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs" title="ระบบเปิดออนไลน์พร้อมใช้งาน">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </div>

          {/* Department / System Title */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className={`text-[10.5px] font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              ศูนย์บัญชาการข้อมูล • PRAKANGUARD
            </span>
          </div>

          <h2 className={`text-base sm:text-lg font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            ระบบสารสนเทศเฝ้าระวังอุทกภัย
          </h2>
          <p className={`text-xs mt-0.5 font-medium ${
            isDark ? 'text-blue-400' : 'text-blue-700'
          }`}>
            จังหวัดสมุทรปราการ (Real-time GIS Telemetry)
          </p>
        </div>

        {/* Modal Body - Official, Clean & Non-Cluttered */}
        <div className="px-5 py-4 space-y-3.5">
          {/* Formal Summary Statement */}
          <p className={`text-xs sm:text-[12.5px] leading-relaxed text-center ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            ระบบติดตามสถานการณ์ระดับน้ำท่วมขังผิวจราจร กล้องวงจรปิด CCTV ตรวจจับ และพยากรณ์สภาพอากาศรายชั่วโมง เพื่อความปลอดภัยในการเดินทางของประชาชน
          </p>

          {/* 3 Compact Official Metric Chips */}
          <div className="grid grid-cols-3 gap-2 py-0.5">
            <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-colors ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <MapPin className="w-4 h-4 text-blue-500 mb-1 shrink-0" />
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                6 อำเภอ
              </span>
              <span className={`text-[9.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ครอบคลุมทั้งจังหวัด
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-colors ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <Eye className="w-4 h-4 text-sky-500 mb-1 shrink-0" />
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                กล้อง CCTV
              </span>
              <span className={`text-[9.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ภาพสดถนนสายหลัก
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-colors ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <Radio className="w-4 h-4 text-emerald-500 mb-1 shrink-0" />
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                เรียลไทม์
              </span>
              <span className={`text-[9.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                อัปเดตตลอด 24 ชม.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-5 py-3.5 border-t flex flex-col gap-2.5 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button
            type="button"
            onClick={handleEnter}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-xs sm:text-[13px] shadow-md shadow-blue-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>เข้าสู่ระบบแผนที่สถานการณ์</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>มาตรฐานข้อมูล ปภ. และแขวงทางหลวงสมุทรปราการ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
