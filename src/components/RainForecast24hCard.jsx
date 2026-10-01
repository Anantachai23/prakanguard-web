import React, { useState } from 'react';
import { CloudRain, ChevronRight, RefreshCw, ArrowRight } from 'lucide-react';

export default function RainForecast24hCard({
  forecast,
  onOpenRadar,
  theme = 'light',
  className = '',
  collapsible = false,
  defaultExpanded = true,
  onManualSync,
  isSyncing = false,
  onOpenPublicUpdates,
  lastUpdatedTime
}) {
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hoveredHour, setHoveredHour] = useState(null);

  if (!forecast || !forecast.hourly || forecast.hourly.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-3xl border shadow-sm transition-all duration-300 pointer-events-auto select-none ${
        isDark 
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-slate-950/40 backdrop-blur-xl' 
          : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-300/30 backdrop-blur-xl'
      } ${className}`}
    >
      <div className="p-3.5 sm:p-4">
        {/* Header Row: Cloud Rain Icon & "ฝน 24 ชม. ข้างหน้า" */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-5 h-5 animate-pulse" />
            </div>
            <span className={`text-xs sm:text-sm font-semibold tracking-wide ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {forecast.title || 'ฝน 24 ชม. ข้างหน้า'}
            </span>
          </div>

          {collapsible && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-semibold cursor-pointer transition-colors ${
                isDark ? 'border-slate-700 text-slate-400 hover:text-white bg-slate-800/60' : 'border-slate-200 text-slate-500 hover:text-slate-800 bg-slate-50'
              }`}
            >
              {isExpanded ? 'ย่อกราฟ' : 'ดูกราฟ 24 ชม.'}
            </button>
          )}
        </div>

        {/* Main Status Text (e.g. "ฝนเล็กน้อย" in vibrant bold blue) */}
        <div className="mt-1.5">
          <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight ${
            isDark ? 'text-cyan-400' : 'text-blue-600'
          }`}>
            {forecast.status || 'ฝนเล็กน้อย'}
          </h3>

          {/* Subtitle Details: "รวมประมาณ 1.9 มม. · โอกาสสูงสุด 90% · เริ่มราว พรุ่งนี้ 15:00 น." */}
          <p className={`text-xs sm:text-[13px] mt-1 flex flex-wrap items-center gap-1 font-medium leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <span>รวมประมาณ {forecast.totalRainMm ?? 0} มม.</span>
            <span className="text-slate-400">•</span>
            <span>โอกาสสูงสุด {forecast.maxProbability ?? 0}%</span>
            <span className="text-slate-400">•</span>
            <span>{forecast.startTimeText || 'ไม่มีแนวโน้มฝนตกหนัก'}</span>
          </p>

          {/* Action Link: "ดูเรดาร์ฝนและพยากรณ์ ฝน ลม >" */}
          {onOpenRadar && (
            <button
              type="button"
              onClick={onOpenRadar}
              className={`inline-flex items-center gap-1 text-xs sm:text-sm font-bold mt-1.5 group cursor-pointer transition-all ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              <span>ดูเรดาร์ฝนและพยากรณ์ ฝน ลม</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>

        {/* 24-Hour Precipitation Bar Chart Section */}
        {isExpanded && (
          <div className="mt-3 pt-2">
            {/* Active Bar Hover/Touch Details Banner */}
            {hoveredHour && (
              <div className={`mb-2 px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center justify-between border ${
                isDark ? 'bg-slate-800 border-slate-700 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <span>{hoveredHour.dayLabel} {hoveredHour.time} น.</span>
                <span>
                  {hoveredHour.precipitation > 0 
                    ? `ฝน ${hoveredHour.precipitation} มม. (โอกาส ${hoveredHour.probability}%)` 
                    : `ไม่มีฝน (โอกาส ${hoveredHour.probability}%)`}
                </span>
              </div>
            )}

            {/* Visual Bar Chart: 24 hourly vertical bars */}
            <div className="relative h-14 sm:h-16 flex items-end justify-between gap-[2px] sm:gap-[3px] px-0.5">
              {forecast.hourly.map((h, idx) => {
                const hasRain = h.precipitation > 0;
                const isHovered = hoveredHour === h;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredHour(h)}
                    onMouseLeave={() => setHoveredHour(null)}
                    onClick={() => setHoveredHour(hoveredHour === h ? null : h)}
                    className="relative flex-1 h-full flex flex-col justify-end items-center cursor-pointer group py-0.5"
                    title={`${h.dayLabel} ${h.time} น. | ฝน ${h.precipitation} มม. (โอกาส ${h.probability}%)`}
                  >
                    {/* Tooltip on Desktop hover */}
                    <div className="absolute bottom-full mb-1 hidden md:group-hover:flex flex-col items-center z-40 pointer-events-none transition-all duration-150">
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-medium shadow-xl border whitespace-nowrap ${
                        isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-900 text-white border-slate-800'
                      }`}>
                        <div className="font-bold">{h.time} น. ({h.dayLabel})</div>
                        <div className="text-cyan-300">
                          {hasRain ? `ฝน: ${h.precipitation} มม. (${h.probability}%)` : `โอกาสฝน: ${h.probability}%`}
                        </div>
                      </div>
                      <div className="w-1.5 h-1.5 rotate-45 -mt-1 bg-slate-900 border-r border-b border-slate-800"></div>
                    </div>

                    {/* Bar Render: Solid Blue for Rain, Pale flat bar for 0mm baseline */}
                    {hasRain ? (
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isHovered 
                            ? (isDark ? 'bg-cyan-300' : 'bg-blue-700 ring-2 ring-blue-400')
                            : (isDark ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-blue-600 hover:bg-blue-500')
                        }`}
                        style={{ height: `${h.barHeightPercent || 25}%` }}
                      />
                    ) : (
                      <div
                        className={`w-full h-1 rounded-full transition-colors ${
                          isHovered
                            ? (isDark ? 'bg-slate-600 h-1.5' : 'bg-blue-300 h-1.5')
                            : (isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-blue-100 group-hover:bg-blue-200')
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-Axis Time Labels (4 spaced markers: e.g. 23:00, 05:00, 11:00, 17:00) */}
            <div className="flex justify-between items-center px-1 mt-2 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium select-none">
              {(forecast.timeLabels || ['23:00', '05:00', '11:00', '17:00']).map((timeStr, idx) => (
                <span key={idx} className="tracking-tight">{timeStr}</span>
              ))}
            </div>
          </div>
        )}

        {/* Optional Sub-Footer: Live Telemetry Sync & Flood Updates */}
        {(onManualSync || onOpenPublicUpdates) && (
          <div className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] ${
            isDark ? 'border-slate-850' : 'border-slate-100'
          }`}>
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all cursor-pointer font-medium truncate ${
                  isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-cyan-300' : 'hover:bg-slate-100 text-slate-600 hover:text-blue-600'
                }`}
                title="คลิกเพื่อซิงก์ข้อมูลเรดาร์สด TMD / กองทัพเรือ ทันที"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500 animate-pulse'} shrink-0`} />
                <span className="truncate">{isSyncing ? 'กำลังซิงก์...' : 'เรดาร์สด TMD'}</span>
                <RefreshCw className={`w-3 h-3 text-cyan-500 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {onOpenPublicUpdates && (
              <button
                type="button"
                onClick={onOpenPublicUpdates}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
                  isDark 
                    ? 'bg-blue-950/70 hover:bg-blue-900/80 text-cyan-300 border border-blue-800/60' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
                title="คลิกเพื่อดูบันทึกการอัปเดตสถานการณ์น้ำท่วม"
              >
                <span>อัปเดต: {lastUpdatedTime || 'สด'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
