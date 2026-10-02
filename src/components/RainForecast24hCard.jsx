import React, { useState } from 'react';
import { 
  CloudRain, 
  ChevronRight, 
  RefreshCw, 
  Droplets, 
  Target, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function RainForecast24hCard({
  forecast,
  userDistrict,
  userLocation,
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
  
  // On mobile (< 640px), default to compact collapsed mode so it doesn't block the map
  const [isExpanded, setIsExpanded] = useState(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (typeof window !== 'undefined' && window.innerWidth < 640) return false;
    return true;
  });

  if (!forecast) {
    return null;
  }

  const status = forecast.status || 'ไม่มีฝน';
  const isHeavy = status.includes('หนัก');
  const isModerate = status.includes('ปานกลาง');
  const isLight = status.includes('เล็กน้อย') || status.includes('โอกาส');
  const isDry = status.includes('ไม่มี');

  // Ground rain status from forecast
  const isRainingRightNow = forecast.isRainingNow || (forecast.startTimeText && forecast.startTimeText.includes('มีฝนตกอยู่ในขณะนี้'));

  // 6 Districts Rain Forecast Data
  const districtList = forecast.districtRainAnalysis || [
    { district: "เมืองสมุทรปราการ", isRainingNow: false, probability: 90, timeWindow: "ช่วงบ่าย 13:00 - 17:00 น.", icon: "🌦️" },
    { district: "บางพลี", isRainingNow: false, probability: 92, timeWindow: "ช่วงบ่าย 13:00 - 17:00 น.", icon: "🌦️" },
    { district: "พระประแดง", isRainingNow: false, probability: 85, timeWindow: "ช่วงบ่าย 13:30 - 17:00 น.", icon: "🌦️" },
    { district: "บางเสาธง", isRainingNow: false, probability: 75, timeWindow: "ช่วงบ่าย 14:00 - 18:00 น.", icon: "🌦️" },
    { district: "บางบ่อ", isRainingNow: false, probability: 70, timeWindow: "ช่วงบ่าย 14:00 - 18:00 น.", icon: "🌦️" },
    { district: "พระสมุทรเจดีย์", isRainingNow: false, probability: 65, timeWindow: "ช่วงบ่าย 14:30 - 18:00 น.", icon: "🌦️" }
  ];

  const activeRaining = districtList.filter(d => d.isRainingNow);
  const rainChanceDistricts = districtList.filter(d => !d.isRainingNow);

  // Find user's current district rain telemetry
  const myDistrictData = userDistrict 
    ? (districtList.find(d => d.district === userDistrict || userDistrict.includes(d.district) || d.district.includes(userDistrict)) || null)
    : null;

  // Status Badge Colors (High-contrast for readability)
  const badgeStyle = isHeavy
    ? (isDark ? 'bg-rose-950 text-rose-200 border-rose-700' : 'bg-rose-100 text-rose-900 border-rose-300 font-bold')
    : isModerate
    ? (isDark ? 'bg-amber-950 text-amber-200 border-amber-700' : 'bg-amber-100 text-amber-900 border-amber-300 font-bold')
    : isLight
    ? (isDark ? 'bg-blue-950 text-cyan-200 border-blue-700' : 'bg-blue-100 text-blue-900 border-blue-300 font-bold')
    : (isDark ? 'bg-emerald-950 text-emerald-200 border-emerald-700' : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold');

  // Collapsed View (Slim 1-line chip so it never blocks the map on mobile)
  if (collapsible && !isExpanded) {
    return (
      <div
        className={`rounded-2xl border shadow-md transition-all duration-200 pointer-events-auto select-none p-2 sm:p-2.5 backdrop-blur-xl ${
          isDark 
            ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-slate-950/40' 
            : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-300/30'
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
            title="แตะเพื่อดูคาดการณ์ฝนตก 6 อำเภอ"
          >
            <div className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60' : 'bg-blue-100 text-blue-700 border border-blue-300'
            }`}>
              <CloudRain className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
            </div>
            <div className="min-w-0 truncate">
              <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">
                {myDistrictData ? (
                  <span>
                    📍 อ.{myDistrictData.district.replace('เมืองสมุทรปราการ', 'เมือง')} (ที่คุณอยู่):{' '}
                    <strong className={myDistrictData.isRainingNow ? 'text-blue-600 dark:text-cyan-400 font-extrabold' : 'text-amber-600 dark:text-amber-400 font-extrabold'}>
                      {myDistrictData.isRainingNow ? '🌧️ กำลังตก' : `เสี่ยงตก ${myDistrictData.probability}% (บ่ายนี้)`}
                    </strong>
                  </span>
                ) : activeRaining.length > 0 ? (
                  <span>🌧️ ฝนตกขณะนี้: <strong className="text-blue-600 dark:text-cyan-400 font-extrabold">{activeRaining.map(d => `อ.${d.district}`).join(", ")}</strong></span>
                ) : (
                  <span>คาดการณ์ฝนตก: <strong className="text-blue-600 dark:text-cyan-400 font-bold">{status}</strong> (โอกาส {forecast.maxProbability ?? 0}%)</span>
                )}
              </span>
              <span className={`text-[10px] block truncate font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {myDistrictData
                  ? (myDistrictData.isRainingNow ? 'มีฝนตกอยู่ในพื้นที่ของคุณขณะนี้' : `คาดเริ่มตกช่วง ${myDistrictData.timeWindow ? myDistrictData.timeWindow.replace('ช่วงบ่าย ', '') : '13:00 น.'} • แตะเพื่อดู`)
                  : (activeRaining.length > 0 ? `พื้นที่กำลังตก ${activeRaining.length} อำเภอ • แตะเพื่อดู` : `${forecast.startTimeText ? forecast.startTimeText : 'ครอบคลุม 6 อำเภอ'} • แตะเพื่อดูรายละเอียด`)
                }
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 ${
              isDark 
                ? 'bg-blue-950/80 hover:bg-blue-900 border-blue-800 text-cyan-300' 
                : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-800'
            }`}
          >
            <span>ขยาย</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded View (Clean, Decluttered, readable and personalized)
  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border shadow-md transition-all duration-200 pointer-events-auto select-none ${
        isDark 
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-slate-950/40 backdrop-blur-xl' 
          : 'bg-white/98 border-slate-300 text-slate-900 shadow-slate-300/30 backdrop-blur-xl'
      } ${className}`}
    >
      <div className="p-3 sm:p-3.5">
        
        {/* Header: Title + Status Badge + Collapse Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60' : 'bg-blue-100 text-blue-700 border border-blue-300'
            }`}>
              <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 animate-pulse shrink-0" />
            </div>
            <div className="truncate">
              <span className={`font-bold text-xs sm:text-sm tracking-tight block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                คาดการณ์ฝนตก
              </span>
              <span className={`text-[10px] sm:text-[11px] font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                จ.สมุทรปราการ (ครอบคลุม 6 อำเภอ)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border shrink-0 flex items-center gap-1.5 ${badgeStyle}`}>
              <span className={`w-2 h-2 rounded-full ${
                activeRaining.length > 0 ? 'bg-rose-500 animate-ping' : isModerate ? 'bg-amber-500' : isLight ? 'bg-blue-500' : 'bg-emerald-500'
              }`} />
              <span>{status}</span>
            </div>

            {collapsible && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
                title="ย่อหน้าต่างลง"
                aria-label="ย่อหน้าต่างพยากรณ์ฝน"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 3 Metric Pills: ปริมาณฝน • โอกาสสูงสุด • คาดเริ่มตก */}
        <div className="grid grid-cols-3 gap-1.5 mt-2.5">
          <div className={`p-2 rounded-xl border flex flex-col justify-center ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-[10px] flex items-center gap-1 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Droplets className="w-3 h-3 text-blue-600 shrink-0" />
              <span>ปริมาณฝน</span>
            </div>
            <span className={`text-xs font-extrabold mt-0.5 ${isDark ? 'text-cyan-300' : 'text-blue-900'}`}>
              ~{forecast.totalRainMm ?? 0} มม.
            </span>
          </div>

          <div className={`p-2 rounded-xl border flex flex-col justify-center ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-[10px] flex items-center gap-1 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Target className="w-3 h-3 text-amber-600 shrink-0" />
              <span>โอกาสสูงสุด</span>
            </div>
            <span className={`text-xs font-extrabold mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
              {forecast.maxProbability ?? 0}%
            </span>
          </div>

          <div className={`p-2 rounded-xl border flex flex-col justify-center ${
            activeRaining.length > 0
              ? (isDark ? 'bg-blue-950/70 border-blue-600/80' : 'bg-blue-50 border-blue-300')
              : (isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200')
          }`}>
            <div className={`text-[10px] flex items-center gap-1 font-bold ${
              activeRaining.length > 0 
                ? (isDark ? 'text-cyan-300' : 'text-blue-900') 
                : (isDark ? 'text-slate-300' : 'text-slate-700')
            }`}>
              <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{activeRaining.length > 0 ? 'ขณะนี้' : 'คาดเริ่มตก'}</span>
            </div>
            <span className={`text-[11px] font-extrabold mt-0.5 truncate ${
              activeRaining.length > 0 
                ? (isDark ? 'text-cyan-200' : 'text-blue-950') 
                : (isDark ? 'text-emerald-300' : 'text-emerald-800')
            }`}>
              {activeRaining.length > 0 ? 'ฝนตกอยู่ขณะนี้' : (forecast.startTimeText ? forecast.startTimeText.replace('เริ่มราว ', '') : 'ไม่มีฝน')}
            </span>
          </div>
        </div>

        {/* PERSONAL DISTRICT RAIN RISK REPORT (รายงานสภาพฝนเฉพาะอำเภอที่ผู้ใช้งานอยู่) */}
        {myDistrictData && (
          <div className={`mt-2.5 p-2.5 rounded-2xl border text-xs flex flex-col gap-1 shadow-sm transition-all ${
            myDistrictData.isRainingNow
              ? (isDark ? 'bg-blue-950/80 border-blue-600 text-blue-100' : 'bg-blue-50 border-blue-300 text-blue-950')
              : myDistrictData.probability >= 70
              ? (isDark ? 'bg-amber-950/60 border-amber-600 text-amber-100' : 'bg-amber-50/95 border-amber-300 text-amber-950')
              : (isDark ? 'bg-emerald-950/60 border-emerald-700 text-emerald-100' : 'bg-emerald-50/95 border-emerald-300 text-emerald-950')
          }`}>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1.5 font-bold">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs">
                  อำเภอที่คุณอยู่: <strong className="underline decoration-blue-500 font-extrabold">อ.{myDistrictData.district}</strong>
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-2xs ${
                myDistrictData.isRainingNow
                  ? 'bg-blue-600 text-white animate-pulse'
                  : myDistrictData.probability >= 70
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {myDistrictData.isRainingNow ? '🌧️ กำลังตก' : `เสี่ยงฝนตก ${myDistrictData.probability}%`}
              </span>
            </div>
            <div className="text-[11px] leading-relaxed font-semibold">
              {myDistrictData.isRainingNow ? (
                <span className="text-blue-700 dark:text-cyan-300 font-bold">
                  ⚠️ มีฝนตกอยู่ในพื้นที่ อ.{myDistrictData.district} ขณะนี้ โปรดระวังถนนลื่นและน้ำท่วมขังรอระบาย
                </span>
              ) : myDistrictData.probability >= 70 ? (
                <span>
                  🌤️ ขณะนี้ยังไม่มีฝนตก แต่ใน <strong>อ.{myDistrictData.district}</strong> มีความเสี่ยงฝนตกสูง <strong>{myDistrictData.probability}%</strong> ({myDistrictData.timeWindow || 'ช่วงบ่าย 13:00 - 17:00 น.'})
                </span>
              ) : (
                <span>
                  ☀️ ขณะนี้ใน <strong>อ.{myDistrictData.district}</strong> สภาพอากาศปกติ ยังไม่มีแนวโน้มฝนตกหนัก ({myDistrictData.probability}%)
                </span>
              )}
            </div>
          </div>
        )}

        {/* SECTION 1: อำเภอที่ตกขณะนี้ */}
        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="text-[11px] font-bold flex items-center justify-between text-slate-900 dark:text-slate-100">
            <span className="flex items-center gap-1.5">
              <span>🌧️</span>
              <span>อำเภอที่ตกขณะนี้</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
              activeRaining.length > 0 
                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30' 
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
            }`}>
              {activeRaining.length > 0 ? `กำลังตก ${activeRaining.length} อำเภอ` : 'ยังไม่มีฝนตก'}
            </span>
          </div>

          {activeRaining.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activeRaining.map(d => (
                <span 
                  key={d.district}
                  className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>อ.{d.district}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              isDark ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300' : 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
            }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ขณะนี้ยังไม่มีฝนตกในพื้นที่ (สภาพอากาศปกติ / มีเมฆมาก)</span>
            </div>
          )}
        </div>

        {/* SECTION 2: อำเภอที่มีโอกาสตก (ช่วงบ่าย-ค่ำ) */}
        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="text-[11px] font-bold flex items-center justify-between text-slate-900 dark:text-slate-100">
            <span className="flex items-center gap-1.5">
              <span>🌦️</span>
              <span>อำเภอที่มีโอกาสตก (ช่วงบ่าย-ค่ำ)</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              6 อำเภอ
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {rainChanceDistricts.map((item) => {
              const isMyDistrict = myDistrictData && myDistrictData.district === item.district;
              return (
                <div
                  key={item.district}
                  className={`p-2 rounded-xl border transition-all text-left ${
                    isMyDistrict
                      ? (isDark ? 'bg-blue-900/30 border-blue-500 ring-1 ring-blue-500/50' : 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400/40')
                      : (isDark ? 'bg-slate-800/60 border-slate-700/70' : 'bg-slate-50 border-slate-200')
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className={`text-xs font-extrabold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        อ.{item.district}
                      </span>
                      {isMyDistrict && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-blue-600 text-white font-bold shrink-0">
                          คุณอยู่นี่
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                      item.probability >= 80 
                        ? (isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-900 font-extrabold border border-amber-300')
                        : (isDark ? 'bg-blue-500/20 text-cyan-300' : 'bg-blue-100 text-blue-900 font-extrabold border border-blue-300')
                    }`}>
                      {item.probability}%
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mt-1 truncate">
                    {item.timeWindow || 'ช่วงบ่าย'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`p-1.5 rounded-lg text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 ${
            isDark ? 'bg-slate-800/40' : 'bg-slate-100'
          }`}>
            <span>🕒</span>
            <span>คาดการณ์กลุ่มฝนฟ้าคะนองเริ่มก่อตัวช่วง 13:00 - 17:00 น.</span>
          </div>
        </div>

        {/* Footer: Quick Links & Sync */}
        <div className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-1 text-[11px] sm:text-xs font-semibold ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          {onOpenRadar && (
            <button
              type="button"
              onClick={onOpenRadar}
              className={`inline-flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-700 hover:text-blue-900'
              }`}
              title="เปิดดูเรดาร์ตรวจฝนสด TMD"
            >
              <span>ดูเรดาร์สด TMD</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-1">
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                className={`p-1.5 rounded-lg border font-bold cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-800 hover:text-black'
                }`}
                title="ซิงก์ข้อมูลสภาพอากาศสด"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {onOpenPublicUpdates && (
              <button
                type="button"
                onClick={onOpenPublicUpdates}
                className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-blue-950/70 hover:bg-blue-900/80 text-cyan-300 border-blue-800/60' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300'
                }`}
                title="ดูรายงานสถานการณ์น้ำท่วม"
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
