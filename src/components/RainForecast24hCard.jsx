import React, { useState } from 'react';
import { 
  CloudRain, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Compass,
  Radio,
  Calendar
} from 'lucide-react';

export default function RainForecast24hCard({
  forecast,
  userDistrict,
  onOpenRadar,
  theme = 'light',
  className = '',
  collapsible = true,
  defaultExpanded
}) {
  const isDark = theme === 'dark';
  
  // Default to compact pill on mobile so it never blocks the map
  const [isExpanded, setIsExpanded] = useState(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (typeof window !== 'undefined' && window.innerWidth < 640) return false;
    return true;
  });

  if (!forecast) return null;

  const todayDate = new Date();
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const todayLabel = `วัน${thaiDays[todayDate.getDay()]}ที่ ${todayDate.getDate()} ${thaiMonths[todayDate.getMonth()]}`;

  const isRainingNow = forecast.isRainingNow;
  const status = forecast.status || (isRainingNow ? 'ฝนตกในพื้นที่' : 'โอกาสฝนตกปานกลาง');
  const maxProb = forecast.maxProbability ?? 50;

  // Clean time window text for today
  let rainTimeToday = "ไม่มีสัญญาณฝนตกหนัก";
  if (isRainingNow) {
    rainTimeToday = "มีฝนตกอยู่ในพื้นที่ขณะนี้";
  } else if (forecast.startTimeText) {
    rainTimeToday = forecast.startTimeText.replace('เริ่มราว ', '').replace('เริ่มประมาณ ', '');
  } else if (maxProb >= 60) {
    rainTimeToday = "ช่วงบ่าย-เย็น (15:00 - 18:30 น.)";
  } else if (maxProb >= 40) {
    rainTimeToday = "ช่วงเย็น-ค่ำ (16:30 - 19:30 น.)";
  }

  // 6 Districts Simple List
  const districtList = forecast.districtRainAnalysis || [
    { district: "เมืองสมุทรปราการ", probability: 70, timeWindow: "15:00 - 17:30 น." },
    { district: "บางพลี", probability: 65, timeWindow: "15:30 - 18:00 น." },
    { district: "พระประแดง", probability: 60, timeWindow: "16:00 - 18:00 น." },
    { district: "บางเสาธง", probability: 55, timeWindow: "16:00 - 18:30 น." },
    { district: "บางบ่อ", probability: 50, timeWindow: "16:30 - 18:30 น." },
    { district: "พระสมุทรเจดีย์", probability: 45, timeWindow: "17:00 - 19:00 น." }
  ];

  // Collapsed Minimal Pill
  if (collapsible && !isExpanded) {
    return (
      <div className={`rounded-2xl border shadow-sm transition-all duration-200 pointer-events-auto select-none p-2 sm:p-2.5 backdrop-blur-xl ${
        isDark 
          ? 'bg-slate-900/90 border-slate-700/80 text-slate-100 shadow-slate-950/40' 
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50'
      } ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
          >
            <div className={`p-1.5 rounded-xl shrink-0 ${
              isDark ? 'bg-blue-950 text-cyan-400 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-4 h-4 animate-pulse shrink-0" />
            </div>
            <div className="min-w-0 truncate">
              <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">
                ฝนตกวันนี้: <span className="text-blue-600 dark:text-cyan-400 font-extrabold">{rainTimeToday}</span>
              </span>
              <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {todayLabel} • โอกาส {maxProb}% (แตะเพื่อดูรายอำเภอ)
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={`px-2 py-1 rounded-xl text-xs font-semibold border flex items-center gap-0.5 cursor-pointer transition-all shrink-0 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            <span>ดูเวลา</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded Minimal Card
  return (
    <div className={`rounded-3xl border shadow-lg transition-all duration-200 pointer-events-auto select-none overflow-hidden backdrop-blur-xl ${
      isDark 
        ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-slate-950/40' 
        : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50'
    } ${className}`}>
      <div className="p-3.5 sm:p-4">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-xl shrink-0 ${
              isDark ? 'bg-blue-950 text-cyan-400 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 animate-pulse shrink-0" />
            </div>
            <div className="min-w-0">
              <span className={`font-bold text-xs sm:text-sm block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                คาดการณ์ฝนตกวันนี้
              </span>
              <span className={`text-[10px] sm:text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {todayLabel} • จ.สมุทรปราการ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              isRainingNow 
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                : maxProb >= 60
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800'
            }`}>
              โอกาส {maxProb}%
            </span>

            {collapsible && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                }`}
                title="ย่อขนาด"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Hero Spotlight: วันนี้มีโอกาสตกกี่โมง */}
        <div className={`mt-3 p-3 rounded-2xl border flex items-center justify-between gap-3 ${
          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-blue-50/60 border-blue-200/80'
        }`}>
          <div className="min-w-0">
            <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-blue-900'}`}>
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>ช่วงเวลาที่มีโอกาสฝนตก:</span>
            </span>
            <span className={`text-sm sm:text-base font-extrabold mt-0.5 block ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
              {rainTimeToday}
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>สภาพอากาศ</span>
            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{status}</span>
          </div>
        </div>

        {/* 6 Districts Compact List */}
        <div className="mt-3">
          <span className={`text-[11px] font-bold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            คาดการณ์แยก 6 อำเภอ (ช่วงเวลา & โอกาส):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {districtList.map((d, idx) => (
              <div
                key={idx}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  userDistrict && userDistrict.includes(d.district)
                    ? (isDark ? 'bg-blue-950/80 border-cyan-500/60 text-cyan-200' : 'bg-blue-50 border-blue-400 text-blue-900 font-bold')
                    : (isDark ? 'bg-slate-850/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs">🌦️</span>
                  <span className="font-semibold truncate">อ.{d.district.replace('เมืองสมุทรปราการ', 'เมือง')}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-mono ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                    {d.timeWindow ? d.timeWindow.replace('ช่วงบ่าย ', '').replace('ช่วงเย็น ', '') : 'บ่าย-เย็น'}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    d.probability >= 60 
                      ? (isDark ? 'bg-amber-950 text-amber-300' : 'bg-amber-100 text-amber-800')
                      : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600')
                  }`}>
                    {d.probability}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Quick Button (Optional) */}
        {onOpenRadar && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onOpenRadar}
              className={`text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>เปิดดูภาพเรดาร์ตรวจฝนสด &rarr;</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
