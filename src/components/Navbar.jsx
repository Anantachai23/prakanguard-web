import React, { useState, useRef, useEffect } from 'react';
import { 
  PhoneCall, 
  Radio, 
  BookOpen, 
  Activity, 
  Info, 
  Sun, 
  Moon, 
  Camera, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AutoMarquee from './AutoMarquee';
import RealTimeClock from './RealTimeClock';

export default function Navbar({ 
  points, 
  onOpenEmergency, 
  onOpenAiForecast,
  onOpenStandards,
  onOpenWelcome,
  onOpenCitizenReport,
  onOpenAdmin,
  onOpenPublicUpdates,
  lastUpdatedTime,
  pendingReportsCount = 0,
  theme = 'light',
  onToggleTheme
}) {
  const isDark = theme === 'dark';
  const minor = points.filter(p => p.level === 1).length;
  const moderate = points.filter(p => p.level === 2).length;
  const severe = points.filter(p => p.level === 3).length;

  // Responsive Horizontal Slider Controller for Top Navigation Bar
  const sliderRef = useRef(null);
  const animRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollBounds = () => {
    const el = sliderRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    checkScrollBounds();
    const handleResize = () => checkScrollBounds();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [points, pendingReportsCount]);

  // 60fps Butter-Smooth Eased Slide Gliding
  const scrollSlider = (direction) => {
    const el = sliderRef.current;
    if (!el) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const distance = direction === 'left' ? -240 : 240;
    const startPos = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetPos = Math.max(0, Math.min(maxScroll, startPos + distance));
    const delta = targetPos - startPos;

    if (Math.abs(delta) < 1) return;

    const duration = 420;
    const startTime = performance.now();
    const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.scrollLeft = startPos + delta * easeOutQuint(progress);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
        checkScrollBounds();
      }
    };

    animRef.current = requestAnimationFrame(step);
  };

  // Wheel horizontal scroll integration
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.9;
        checkScrollBounds();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', checkScrollBounds);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', checkScrollBounds);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-40 w-full max-w-full overflow-hidden border-b shadow-sm backdrop-blur-xl transition-colors duration-200 select-none ${
      isDark ? 'bg-slate-950/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      <div className="w-full px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2.5 overflow-hidden">
        
        {/* Brand Area with Animated Marquee Text (Pinned on Left) */}
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
            <span className={`text-xs sm:text-sm md:text-base font-bold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              PrakanGuard
            </span>

            {/* Responsive Animated Marquee Scrolling Left */}
            <div className="w-24 xs:w-36 sm:w-48 md:w-56 lg:w-64 overflow-hidden mt-0.5">
              <AutoMarquee speedSeconds={20} gapPx={32} force={true}>
                <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] whitespace-nowrap">
                  <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    ระบบเฝ้าระวังอุทกภัย จ.สมุทรปราการ
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className={`px-1.5 py-0.2 rounded-full font-bold inline-flex items-center gap-1 ${
                    isDark ? 'bg-blue-950/90 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>อ้างอิงเกณฑ์ ปภ. / กรมทางหลวง</span>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    เฝ้าระวังผิวจราจร 6 อำเภอ
                  </span>
                  <span className="text-slate-400">•</span>
                  <button 
                    onClick={onOpenWelcome}
                    className={`underline underline-offset-2 font-bold cursor-pointer transition-colors ${
                      isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-800'
                    }`}
                    title="คลิกอ่านคำชี้แจงกลุ่มนักเรียน"
                  >
                    กลุ่มนักเรียน
                  </button>
                </div>
              </AutoMarquee>
            </div>
          </div>
        </div>

        {/* Responsive Horizontal Action Strip Slider (Balanced alignment, Starts naturally after brand) */}
        <div className="flex-1 min-w-0 relative flex items-center justify-start overflow-hidden ml-2 sm:ml-4">
          
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollSlider('left')}
              className={`absolute left-0 z-30 p-1.5 rounded-xl shadow-lg border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800' 
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
              title="เลื่อนดูเมนูก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Left Gradient Fade Mask */}
          {canScrollLeft && (
            <div className={`absolute left-0 top-0 bottom-0 w-8 z-20 pointer-events-none ${
              isDark ? 'bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent' : 'bg-gradient-to-r from-white via-white/80 to-transparent'
            }`} />
          )}

          {/* Scrollable Track containing Real-Time Clock, Status & All Buttons */}
          <div
            ref={sliderRef}
            className="w-full flex items-center justify-start gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Real-Time Thai Date & Digital Clock */}
            <div className="shrink-0 whitespace-nowrap">
              <RealTimeClock theme={theme} />
            </div>

            {/* Status Indicator with Detailed Labels (เขียนบอกว่าแต่ละจุดคืออะไร) */}
            <div 
              onClick={onOpenStandards}
              className={`shrink-0 flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-medium cursor-pointer transition-all hover:scale-[1.01] whitespace-nowrap ${
                isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="คลิกเพื่อดูเกณฑ์ระดับน้ำมาตรฐาน ปภ./กรมทางหลวง"
            >
              <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="flex items-center gap-1" title="ระดับ 1: ท่วมขังเล็กน้อย/ระบายได้ดี">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">ปกติ</span>
                <span>{minor}</span>
              </span>
              <span className="text-slate-400 text-[10px]">•</span>
              <span className="flex items-center gap-1" title="ระดับ 2: ปานกลาง/เฝ้าระวังพิเศษ">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">เสี่ยงสูง</span>
                <span>{moderate}</span>
              </span>
              <span className="text-slate-400 text-[10px]">•</span>
              <span className="flex items-center gap-1" title="ระดับ 3: วิกฤต/ห้ามสัญจร">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">วิกฤต</span>
                <strong className="text-rose-600 dark:text-rose-400">{severe}</strong>
              </span>
            </div>

            {/* Theme Switcher Button */}
            <button
              onClick={onToggleTheme}
              className={`shrink-0 p-1.5 sm:p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700 hover:border-amber-400/50' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
              title={isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Official Standards Button */}
            <button 
              onClick={onOpenStandards}
              className={`shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="เกณฑ์วัดระดับน้ำมาตรฐาน ปภ./กรมทางหลวง"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>เกณฑ์ ปภ.</span>
            </button>

            {/* Real-time Stations & Radar Button */}
            <button 
              onClick={onOpenAiForecast}
              className={`shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                isDark 
                  ? 'bg-blue-950/60 hover:bg-blue-900/60 text-cyan-300 border-blue-800' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
              }`}
              title="เรดาร์ฝน TMD และสถานีตรวจวัดน้ำขึ้น-น้ำลงกองทัพเรือ"
            >
              <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
              <span>เรดาร์สด</span>
            </button>

            {/* Public Live Situation Updates Button */}
            <button 
              onClick={onOpenPublicUpdates}
              className={`shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                isDark 
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800' 
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
              title="อัปเดตสถานการณ์น้ำท่วมและเส้นทางสำหรับประชาชน"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>อัปเดตสด</span>
            </button>

            {/* Citizen Flood Report Button (Crowdsourced Reporting) */}
            <button 
              onClick={onOpenCitizenReport}
              title="แจ้งจุดน้ำท่วม/รายงานสถานการณ์ (ภาคประชาชน)"
              className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-violet-600/25 whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>แจ้งน้ำท่วม</span>
            </button>

            {/* Admin Management System Button - Explicitly Labeled ADMIN */}
            <button 
              onClick={onOpenAdmin}
              title="ระบบจัดการ ADMIN (ตรวจสอบและอนุมัติจุดรายงานน้ำท่วม)"
              className={`shrink-0 relative px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700 hover:border-amber-400' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-bold tracking-wider">ADMIN</span>
              {pendingReportsCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1"></span>
              )}
              {pendingReportsCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 absolute -top-0.5 -right-0.5"></span>
              )}
            </button>

            {/* Emergency Hotline Button */}
            <button 
              onClick={onOpenEmergency}
              title="เบอร์สายด่วน ปภ. และกู้ภัยสมุทรปราการ"
              className="shrink-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-rose-600/30 whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span>สายด่วน</span>
            </button>

          </div>

          {/* Right Gradient Fade Mask */}
          {canScrollRight && (
            <div className={`absolute right-0 top-0 bottom-0 w-8 z-20 pointer-events-none ${
              isDark ? 'bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent' : 'bg-gradient-to-l from-white via-white/80 to-transparent'
            }`} />
          )}

          {/* Right Arrow Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollSlider('right')}
              className={`absolute right-0 z-30 p-1.5 rounded-xl shadow-lg border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800' 
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
              title="เลื่อนดูเมนูถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
