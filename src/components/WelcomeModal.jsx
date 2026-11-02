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
      className={`fixed inset-0 z-[2000] flex items-center justify-center p-3.5 sm:p-5 py-8 sm:py-8 overflow-y-auto overscroll-contain select-none transition-all duration-400 ${
        isEntering && !isExiting 
          ? 'bg-slate-950/75 backdrop-blur-xs opacity-100 pointer-events-auto' 
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
        className={`w-full max-w-[calc(100vw-28px)] xs:max-w-[420px] sm:max-w-md my-auto m-auto max-h-[76vh] sm:max-h-[82vh] shrink-0 border rounded-2xl shadow-2xl overflow-hidden flex flex-col relative transition-all ${
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

        {/* Header Banner */}
        <div className={`px-5 pt-6 pb-4 flex flex-col items-center text-center border-b shrink-0 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="relative mb-3">
            <div 
              className={`w-14 h-14 rounded-full p-0.5 flex items-center justify-center border shadow-sm overflow-hidden ${
                isDark 
                  ? 'bg-slate-900 border-slate-700' 
                  : 'bg-white border-slate-200'
              }`}
              style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', maxWidth: '56px', maxHeight: '56px' }}
            >
              <img 
                src="/logo.png" 
                alt="PrakanGuard Logo" 
                className="w-full h-full object-cover rounded-full block select-none pointer-events-none" 
                style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
          </div>

          <h2 className={`text-base sm:text-lg font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            PrakanGuard สมุทรปราการ
          </h2>
          <p className={`text-xs mt-1 font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            ติดตามระดับน้ำท่วมขังและพยากรณ์ฝนครบ 6 อำเภอ
          </p>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <MapPin className="w-4 h-4 text-blue-500 mb-1 shrink-0" />
              <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                6 อำเภอ
              </span>
              <span className={`text-[10.5px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                จุดเสี่ยงน้ำท่วม
              </span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <Eye className="w-4 h-4 text-sky-500 mb-1 shrink-0" />
              <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                กล้อง CCTV
              </span>
              <span className={`text-[10.5px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ถนนสายหลัก
              </span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <Radio className="w-4 h-4 text-emerald-500 mb-1 shrink-0" />
              <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                พยากรณ์ฝน
              </span>
              <span className={`text-[10.5px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                อัปเดตรายชั่วโมง
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-5 py-3.5 border-t flex flex-col gap-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button
            type="button"
            onClick={handleEnter}
            className={`w-full py-2.5 px-4 rounded-xl active:scale-[0.98] font-bold text-xs sm:text-[13px] transition-all cursor-pointer flex items-center justify-center gap-2 group ${
              isDark ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <span>เข้าสู่แผนที่</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
