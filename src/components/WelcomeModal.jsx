import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  Waves, 
  CloudRain, 
  Camera, 
  ArrowRight, 
  MapPin, 
  Sparkles,
  Compass
} from 'lucide-react';

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
      // Small frame delay to trigger entrance transition
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
    setIsExiting(true);

    // 1. First the card begins sliding up; then after 150ms the map smoothly zooms in
    setTimeout(() => {
      if (onEnterWebsite) {
        onEnterWebsite();
      }
    }, 150);

    // 2. Allow 850ms for the card to slide up smoothly from bottom to top and fade out
    setTimeout(() => {
      if (onClose) onClose();
    }, 850);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none transition-all duration-700 ${
        isEntering && !isExiting 
          ? 'bg-slate-950/75 backdrop-blur-md opacity-100 pointer-events-auto' 
          : 'bg-slate-950/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleEnter();
      }}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Welcome Card Container with Smooth Slide-Up Exit Animation */}
      <div 
        className={`w-[90vw] max-w-[360px] sm:max-w-xl my-auto m-auto max-h-[75vh] sm:max-h-[88vh] border rounded-2xl shadow-2xl overflow-hidden flex flex-col relative transition-all duration-800 ${
          isDark 
            ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-cyan-950/40' 
            : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-blue-900/20'
        }`}
        style={{
          transform: !isEntering 
            ? 'translate3d(0, 32px, 0) scale(0.96)' 
            : isExiting 
              ? 'translate3d(0, -120vh, 0) scale(0.95)' 
              : 'translate3d(0, 0, 0) scale(1)',
          opacity: !isEntering || isExiting ? 0 : 1,
          transitionProperty: 'transform, opacity',
          transitionDuration: isExiting ? '850ms' : '650ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity'
        }}
      >
        {/* Glowing Top Rainbow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-400 shrink-0"></div>

        {/* Modal Header */}
        <div className={`p-3 sm:p-6 pb-2 sm:pb-3 flex items-start justify-between gap-2.5 shrink-0 ${
          isDark ? 'bg-slate-950/40' : 'bg-slate-50/60'
        }`}>
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full p-[1px] sm:p-[1.5px] bg-gradient-to-tr from-blue-600 via-cyan-400 to-teal-300 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0">
                <img 
                  src="/logo.png" 
                  alt="PrakanGuard Mascot" 
                  className="w-full h-full rounded-full object-cover" 
                />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-cyan-500"></span>
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[9.5px] sm:text-[11px] font-extrabold px-2 py-0.2 sm:px-2.5 sm:py-0.5 rounded-full uppercase tracking-wider border ${
                  isDark 
                    ? 'bg-blue-950/80 text-cyan-300 border-blue-800/80' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  ยินดีต้อนรับสู่ระบบ
                </span>
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-500">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>PrakanGuard</span>
                </span>
              </div>
              <h2 className={`text-xs sm:text-lg font-black mt-0.5 leading-snug tracking-tight break-words whitespace-normal ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                ระบบสารสนเทศและเฝ้าระวังอุทกภัย จ.สมุทรปราการ
              </h2>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleEnter} 
            className={`p-1 sm:p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิดหน้าต่างและเข้าสู่แผนที่"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Modal Body: Concise explanation of what the web app does */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2.5 sm:py-3.5 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
          
          <p className={`text-xs sm:text-[13px] leading-relaxed font-medium ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            เว็บไซต์นี้พัฒนาขึ้นเพื่อติดตาม เฝ้าระวัง และรายงานสถานการณ์น้ำท่วมขังบนผิวจราจรในพื้นที่ <strong className={isDark ? 'text-white' : 'text-slate-900'}>6 อำเภอ จังหวัดสมุทรปราการ</strong> แบบเรียลไทม์ ตลอด 24 ชั่วโมง เพื่อความปลอดภัยและสนับสนุนการเดินทางของประชาชน
          </p>

          {/* 3 Core Highlights */}
          <div className="grid grid-cols-1 gap-2 sm:gap-2.5 pt-1">
            
            {/* Feature 1: Real-time Flood Hotspots */}
            <div className={`p-3 rounded-2xl border flex items-start gap-3 transition-colors ${
              isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-blue-50/50 border-blue-100'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-white text-blue-600 border-blue-200 shadow-xs'
              }`}>
                <Waves className="w-4 h-4 text-blue-500" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-xs sm:text-[13px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  เฝ้าระวังระดับน้ำ 3 ระดับ พร้อมรูปถ่ายจริง
                </h3>
                <p className={`text-[11px] sm:text-xs leading-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  ตรวจสอบจุดเสี่ยงน้ำท่วม (ปกติ, ปานกลาง, วิกฤต) จุดที่น้ำกำลังลด (📉) และจุดที่มีประชาชนถ่ายภาพรายงาน (📷)
                </p>
              </div>
            </div>

            {/* Feature 2: Weather & Rain Radar */}
            <div className={`p-3 rounded-2xl border flex items-start gap-3 transition-colors ${
              isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-sky-50/50 border-sky-100'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-sky-950 text-sky-400 border-sky-800' : 'bg-white text-sky-600 border-sky-200 shadow-xs'
              }`}>
                <CloudRain className="w-4 h-4 text-sky-500" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-xs sm:text-[13px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  พยากรณ์ฝน 24 ชม. & อุณหภูมิสด
                </h3>
                <p className={`text-[11px] sm:text-xs leading-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  อุณหภูมิจริงตามสภาพอากาศอัปเดตอัตโนมัติ พร้อมเรดาร์ฝนและสถิติน้ำทะเลหนุนตลอดทั้งวัน
                </p>
              </div>
            </div>

            {/* Feature 3: Citizen Crowdsource Reporting */}
            <div className={`p-3 rounded-2xl border flex items-start gap-3 transition-colors ${
              isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-teal-50/50 border-teal-100'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-teal-950 text-teal-400 border-teal-800' : 'bg-white text-teal-600 border-teal-200 shadow-xs'
              }`}>
                <Camera className="w-4 h-4 text-teal-500" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-xs sm:text-[13px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  ร่วมปักหมุดรายงานน้ำท่วม
                </h3>
                <p className={`text-[11px] sm:text-xs leading-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  ประชาชนสามารถถ่ายรูปและปักหมุดแจ้งเตือนจุดน้ำท่วมได้ทันที เพื่อความปลอดภัยของทุกคนในชุมชน
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer with the Hero "เข้าสู่เว็บ" Button */}
        <div className={`p-2.5 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50/90'
        }`}>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            <Compass className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" />
            <span>PrakanGuard • แผนที่สารสนเทศอัจฉริยะ</span>
          </div>

          <button
            type="button"
            onClick={handleEnter}
            className="w-full sm:w-auto px-5 sm:px-7 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs sm:text-base transition-all duration-300 cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/30 hover:scale-102 active:scale-98 flex items-center justify-center gap-2 group"
          >
            <span>เข้าสู่ระบบเว็บไซต์</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </div>
  );
}
