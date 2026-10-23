import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import {
  CivicCrest,
  CivicGauge,
  CivicRadar,
  CivicReportCamera,
  CivicShield
} from './CivicIcons';

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
    setIsExiting(true);

    setTimeout(() => {
      if (onEnterWebsite) {
        onEnterWebsite();
      }
    }, 150);

    setTimeout(() => {
      if (onClose) onClose();
    }, 650);
  };

  const capabilities = [
    {
      icon: <CivicGauge className="w-4 h-4" />,
      title: 'ตรวจวัดและจำแนกระดับน้ำ 3 ระดับ',
      desc: 'แสดงสถานะจุดน้ำท่วมขัง (ปกติ, ปานกลาง, วิกฤต) พร้อมแนวโน้มระดับน้ำและภาพถ่ายหน้างานจริง'
    },
    {
      icon: <CivicRadar className="w-4 h-4" />,
      title: 'พยากรณ์ฝนและอุตุนิยมวิทยา 6 อำเภอ',
      desc: 'เชื่อมโยงข้อมูลสภาพอากาศ อุณหภูมิ และความน่าจะเป็นของฝนรายชั่วโมงตลอด 24 ชั่วโมง'
    },
    {
      icon: <CivicReportCamera className="w-4 h-4" />,
      title: 'ระบบรายงานสถานการณ์ภาคประชาชน',
      desc: 'แจ้งพิกัดจุดน้ำท่วมขังพร้อมภาพถ่ายเพื่อให้ศูนย์ควบคุมตรวจสอบและแจ้งเตือนผู้ใช้เส้นทาง'
    }
  ];

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none transition-all duration-500 ${
        isEntering && !isExiting 
          ? 'bg-slate-950/65 backdrop-blur-xs opacity-100 pointer-events-auto' 
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
        className={`w-[92vw] max-w-[440px] sm:max-w-lg my-auto m-auto max-h-[84vh] sm:max-h-[86vh] border rounded-xl shadow-2xl overflow-hidden flex flex-col relative transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{
          transform: !isEntering 
            ? 'translate3d(0, 20px, 0) scale(0.98)' 
            : isExiting 
              ? 'translate3d(0, -40px, 0) scale(0.98)' 
              : 'translate3d(0, 0, 0) scale(1)',
          opacity: !isEntering || isExiting ? 0 : 1,
          transitionProperty: 'transform, opacity',
          transitionDuration: isExiting ? '500ms' : '450ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform, opacity'
        }}
      >
        {/* Top Institutional Bar */}
        <div className="h-1 w-full bg-blue-700 shrink-0" />

        {/* Header */}
        <div className={`px-4 py-3.5 sm:px-5 sm:py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-white border-slate-200 text-blue-700 shadow-2xs'
            }`}>
              <CivicCrest className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  isDark 
                    ? 'bg-slate-800 text-slate-300 border-slate-700' 
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  PRAKANGUARD GIS
                </span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  จ.สมุทรปราการ
                </span>
              </div>
              <h2 className={`text-sm sm:text-base font-bold mt-0.5 leading-snug tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                ระบบสารสนเทศเฝ้าระวังอุทกภัยและสภาพจราจร
              </h2>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleEnter} 
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4 space-y-3 text-xs sm:text-sm">
          <p className={`text-xs leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            ศูนย์ข้อมูลสารสนเทศภูมิศาสตร์เพื่อการติดตามระดับน้ำท่วมขังผิวจราจรในพื้นที่ <strong className={isDark ? 'text-white font-semibold' : 'text-slate-900 font-semibold'}>6 อำเภอ จังหวัดสมุทรปราการ</strong> แบบเรียลไทม์ สำหรับวางแผนการเดินทางและแจ้งเตือนภัยล่วงหน้า
          </p>

          <div className={`rounded-lg border divide-y ${
            isDark ? 'bg-slate-950/40 border-slate-800 divide-slate-800' : 'bg-slate-50/60 border-slate-200 divide-slate-200'
          }`}>
            {capabilities.map((item, idx) => (
              <div key={idx} className="p-3 flex items-start gap-3">
                <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-white border-slate-200 text-blue-700'
                }`}>
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-[11px] leading-relaxed mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>ข้อมูลอ้างอิงมาตรฐาน ปภ. และแขวงทางหลวงสมุทรปราการ</span>
          </div>

          <button
            type="button"
            onClick={handleEnter}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>เข้าสู่แผนที่สถานการณ์</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
