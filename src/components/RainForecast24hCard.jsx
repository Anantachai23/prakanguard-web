import React, { useState } from 'react';
import { CloudRain, ChevronRight, RefreshCw, ArrowRight, Droplets, Target, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function RainForecast24hCard({
  forecast,
  onOpenRadar,
  theme = 'light',
  className = '',
  onManualSync,
  isSyncing = false,
  onOpenPublicUpdates,
  lastUpdatedTime,
  collapsible = true,
  defaultExpanded
}) {
  const isDark = theme === 'dark';
  
  // On mobile (< 640px), default to compact collapsed mode unless explicitly overridden
  const [isExpanded, setIsExpanded] = useState(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (typeof window !== 'undefined' && window.innerWidth < 640) return false;
    return true;
  });

  if (!forecast) {
    return null;
  }

  const status = forecast.status || 'ฝนเล็กน้อย';
  const isHeavy = status.includes('หนัก');
  const isModerate = status.includes('ปานกลาง');
  const isLight = status.includes('เล็กน้อย');
  const isDry = status.includes('ไม่มี');

  // Status Badge Colors
  const badgeStyle = isHeavy
    ? (isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-200')
    : isModerate
    ? (isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-200')
    : isLight
    ? (isDark ? 'bg-blue-950/80 text-cyan-300 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-200')
    : (isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200');

  if (collapsible && !isExpanded) {
    return (
      <div
        className={`rounded-2xl border shadow-md transition-all duration-200 pointer-events-auto select-none p-2 sm:p-2.5 backdrop-blur-xl ${
          isDark 
            ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-slate-950/40' 
            : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-300/30'
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
            title="แตะเพื่อขยายดูรายละเอียดพยากรณ์ฝน 24 ชม."
          >
            <div className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
            </div>
            <div className="min-w-0 truncate">
              <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">
                พยากรณ์ฝน 24 ชม.: <strong className={isHeavy ? 'text-rose-500' : isModerate ? 'text-amber-500' : 'text-blue-500'}>{status}</strong> ({forecast.maxProbability ?? 0}%)
              </span>
              <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {forecast.startTimeText ? forecast.startTimeText : 'ครอบคลุม 6 อำเภอ'} • แตะเพื่อดูรายละเอียด
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                isDark 
                  ? 'bg-blue-950/80 hover:bg-blue-900 border-blue-800 text-cyan-300' 
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
              }`}
            >
              <span>ขยาย</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border shadow-md transition-all duration-200 pointer-events-auto select-none ${
        isDark 
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-slate-950/40 backdrop-blur-xl' 
          : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-300/30 backdrop-blur-xl'
      } ${className}`}
    >
      <div className="p-3 sm:p-4">
        {/* Top Row: Title + Main Status Badge + Collapse Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-pulse shrink-0" />
            </div>
            <div className="truncate">
              <span className={`text-[11px] sm:text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                คาดการณ์ฝน 24 ชม.
              </span>
              <span className={`font-bold text-xs sm:text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                จ.สมุทรปราการ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status Badge: Big & Clear */}
            <div className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-bold border shrink-0 flex items-center gap-1.5 ${badgeStyle}`}>
              <span className={`w-2 h-2 rounded-full ${
                isHeavy ? 'bg-rose-500 animate-ping' : isModerate ? 'bg-amber-500 animate-pulse' : isLight ? 'bg-blue-500' : 'bg-emerald-500'
              }`} />
              <span>{status}</span>
            </div>

            {collapsible && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="ย่อหน้าต่างลง"
                aria-label="ย่อหน้าต่างพยากรณ์ฝน"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Real-time 6 Districts Telemetry Badge */}
        <div className={`mt-2 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 border ${
          isDark ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
        }`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span className="truncate font-medium">อัปเดตข้อมูลอัตโนมัติตลอด 24 ชม. (ครอบคลุม 6 อำเภอ)</span>
        </div>

        {/* 3 Simple Metric Pills: ปริมาณฝน • โอกาสฝน • เริ่มตก (อ่านง่ายใน 1 วินาที) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-2">
          {/* 1. Rain Volume */}
          <div className={`p-2 rounded-xl border flex flex-col justify-center ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-[10px] sm:text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <Droplets className="w-3 h-3 text-blue-500 shrink-0" />
              <span>ปริมาณฝน</span>
            </div>
            <span className={`text-xs sm:text-sm font-bold mt-0.5 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
              ~{forecast.totalRainMm ?? 0} มม.
            </span>
          </div>

          {/* 2. Probability */}
          <div className={`p-2 rounded-xl border flex flex-col justify-center ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-[10px] sm:text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <Target className="w-3 h-3 text-amber-500 shrink-0" />
              <span>โอกาสสูงสุด</span>
            </div>
            <span className={`text-xs sm:text-sm font-bold mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              {forecast.maxProbability ?? 0}%
            </span>
          </div>

          {/* 3. Start time */}
          <div className={`p-2 rounded-xl border flex flex-col justify-center ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-[10px] sm:text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">ช่วงเวลาเริ่ม</span>
            </div>
            <span className={`text-[11px] sm:text-xs font-bold mt-0.5 truncate ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} title={forecast.startTimeText}>
              {forecast.startTimeText ? forecast.startTimeText.replace('เริ่มราว ', '') : 'ไม่มีฝนหนัก'}
            </span>
          </div>
        </div>

        {/* Footer Row: Quick Links (เรดาร์ฝนสด TMD, ซิงก์สด, อัปเดตสถานการณ์) */}
        <div className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-1 text-[11px] sm:text-xs ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          {/* Live Radar Link */}
          {onOpenRadar && (
            <button
              type="button"
              onClick={onOpenRadar}
              className={`inline-flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
              }`}
              title="เปิดดูเรดาร์ตรวจฝนสด TMD และกระแสลม"
            >
              <span>ดูเรดาร์สด & พยากรณ์</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-1">
            {/* Manual Sync Button */}
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                className={`p-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="ซิงก์ข้อมูลเรดาร์สด TMD ทันที"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Updates Button */}
            {onOpenPublicUpdates && (
              <button
                type="button"
                onClick={onOpenPublicUpdates}
                className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-blue-950/70 hover:bg-blue-900/80 text-cyan-300 border-blue-800/60' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
                title="ดูบันทึกรายงานสถานการณ์น้ำท่วม"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{lastUpdatedTime || 'สด'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
