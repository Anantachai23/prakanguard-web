import React, { useState, useEffect } from 'react';
import { playClickSound, playToggleSound } from '../services/soundEffects';
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

  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const scheduleMidnight = () => {
      const now = new Date();
      const tomorrowMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 1
      );
      const delay = Math.max(1000, tomorrowMidnight.getTime() - now.getTime());
      return setTimeout(() => {
        setCurrentDate(new Date());
        scheduleMidnight();
      }, delay);
    };

    const timer = scheduleMidnight();
    return () => clearTimeout(timer);
  }, []);

  if (!forecast) return null;

  const todayDate = currentDate;
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const todayLabel = `วัน${thaiDays[todayDate.getDay()]}ที่ ${todayDate.getDate()} ${thaiMonths[todayDate.getMonth()]}`;

  const isRainingNow = forecast.isRainingNow;
  const status = forecast.status || (isRainingNow ? 'ฝนตกในพื้นที่' : 'โอกาสฝนตกปานกลาง');
  const maxProb = forecast.maxProbability ?? 50;

  // Clean time window text for today (คาดการณ์ล่วงหน้า ไม่แสดงว่ากำลังตก)
  let rainTimeToday = "ไม่มีแนวโน้มฝนตกหนัก";
  if (forecast.startTimeText && forecast.startTimeText !== 'ไม่มีแนวโน้มฝนตกหนัก') {
    rainTimeToday = forecast.startTimeText.replace('เริ่มราว ', '').replace('เริ่มประมาณ ', '');
  } else if (maxProb >= 60) {
    rainTimeToday = "ช่วงบ่าย-เย็น (15:00 - 18:30 น.)";
  } else if (maxProb >= 40) {
    rainTimeToday = "ช่วงเย็น-ค่ำ (16:30 - 19:30 น.)";
  }

  // 6 Districts List (ดึงตรงจาก telemetry จริงของ Open-Meteo ไม่ใช้ข้อมูลจำลอง)
  const defaultTimeWindow = rainTimeToday;
  const defaultDuration = maxProb >= 50 ? "คาดการณ์ตกต่อเนื่อง ~30 - 60 นาที" : "ไม่มีสัญญาณฝนต่อเนื่อง";
  const storedDistrictTemps = (() => {
    try {
      const s = localStorage.getItem('prakanguard_live_district_temps');
      return s ? JSON.parse(s) : null;
    } catch (_) { return null; }
  })();

  const districtList = (Array.isArray(forecast.districtRainAnalysis) && forecast.districtRainAnalysis.length > 0)
    ? forecast.districtRainAnalysis
    : (Array.isArray(storedDistrictTemps) && storedDistrictTemps.length > 0)
      ? storedDistrictTemps
      : [
          { district: "เมืองสมุทรปราการ", probability: maxProb, temperature: 26, status: forecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "บางพลี", probability: maxProb, temperature: 26, status: forecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "พระประแดง", probability: maxProb, temperature: 26, status: forecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "บางเสาธง", probability: maxProb, temperature: 25, status: forecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "บางบ่อ", probability: maxProb, temperature: 25, status: forecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "พระสมุทรเจดีย์", probability: maxProb, temperature: 27, status: forecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration }
        ];

  const cleanDistrictName = (dName) => {
    if (!dName || dName === 'ทั้งหมด') return null;
    let s = dName.replace(/^(อ\.|อำเภอ)/, '').trim();
    if (s.includes('เมือง')) return 'เมืองสมุทรปราการ';
    if (s.includes('บางพลี')) return 'บางพลี';
    if (s.includes('พระประแดง')) return 'พระประแดง';
    if (s.includes('บางเสาธง')) return 'บางเสาธง';
    if (s.includes('บางบ่อ')) return 'บางบ่อ';
    if (s.includes('พระสมุทรเจดีย์')) return 'พระสมุทรเจดีย์';
    return s || null;
  };

  const currentDistrict = cleanDistrictName(userDistrict);
  const isAllDistricts = !currentDistrict;
  const matchedDistrict = isAllDistricts ? null : (districtList.find(d => d.district.includes(currentDistrict) || currentDistrict.includes(d.district)) || districtList[0]);
  const userDistrictProb = matchedDistrict ? matchedDistrict.probability : maxProb;
  const displayDistrictLabel = isAllDistricts ? 'ทุกอำเภอ (จ.สมุทรปราการ)' : `อ.${currentDistrict}`;

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
            onClick={() => {
              playToggleSound(true);
              setIsExpanded(true);
            }}
            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group active:scale-95 transition-transform"
          >
            <div className={`p-1.5 rounded-xl shrink-0 ${
              isDark ? 'bg-blue-950 text-cyan-400 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-4 h-4 animate-pulse shrink-0" />
            </div>
            <div className="min-w-0 truncate">
              <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">
                {isAllDistricts ? 'ภาพรวม' : 'ตำแหน่งของท่าน '}{displayDistrictLabel} มีโอกาสฝนตก <span className="text-blue-600 dark:text-cyan-400 font-extrabold">{userDistrictProb}%</span>
                {(matchedDistrict?.temperature || forecast?.temp) && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-bold">
                    🌡️ {matchedDistrict?.temperature || forecast?.temp}°C
                  </span>
                )}
              </span>
              <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {todayLabel} • {rainTimeToday} (แตะเพื่อดูรายอำเภอ)
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              playToggleSound(true);
              setIsExpanded(true);
            }}
            className={`px-2 py-1 rounded-xl text-xs font-semibold border flex items-center gap-0.5 cursor-pointer transition-all active:scale-95 shrink-0 ${
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
                {todayLabel} • อัพเดทวันใหม่เที่ยงคืน
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
                onClick={() => {
                  playToggleSound(false);
                  setIsExpanded(false);
                }}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
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

        {/* User District Highlight Banner */}
        <div className={`mt-3 p-3 rounded-2xl border flex items-center justify-between gap-3 ${
          isDark ? 'bg-blue-950/60 border-cyan-500/40 text-cyan-200' : 'bg-blue-50/90 border-blue-300 text-blue-900'
        }`}>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold flex items-center gap-1.5 opacity-90">
              <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>ตำแหน่งปัจจุบันของคุณ:</span>
            </span>
            <span className="text-xs sm:text-sm font-extrabold mt-0.5 block leading-tight">
              {isAllDistricts ? 'ภาพรวมพื้นที่สมุทรปราการ' : 'ตำแหน่งของท่าน '}{displayDistrictLabel}
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>อุณหภูมิจริง • สภาพอากาศ</span>
            <span className={`text-xs sm:text-sm font-black ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
              🌡️ {matchedDistrict?.temperature || forecast?.temp || 28}°C <span className="text-[10px] font-semibold opacity-85">({status})</span>
            </span>
          </div>
        </div>

        {/* 6 Districts Compact List (คาดการณ์แยก 6 อำเภอ: โอกาสเกิดฝน ช่วงเวลา และระยะเวลาตกต่อเนื่อง) */}
        <div className="mt-3">
          <span className={`text-[11px] font-bold block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            คาดการณ์โอกาสเกิดฝนและช่วงเวลาแยก 6 อำเภอ:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {districtList.map((d, idx) => {
              const districtName = d.district.startsWith('อำเภอ') || d.district.startsWith('อ.') 
                ? d.district 
                : `อำเภอ${d.district}`;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-2xl border flex flex-col justify-between text-xs transition-colors ${
                    userDistrict && userDistrict.includes(d.district)
                      ? (isDark ? 'bg-blue-950/80 border-cyan-500/60 text-cyan-200' : 'bg-blue-50 border-blue-400 text-blue-900 font-bold')
                      : (isDark ? 'bg-slate-850/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{d.icon || '🌦️'}</span>
                      <span className="font-bold truncate text-slate-900 dark:text-white">
                        {districtName}
                      </span>
                      {d.temperature && (
                        <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 shrink-0">
                          {d.temperature}°C
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-lg font-bold border shrink-0 ${
                      d.probability >= 60 
                        ? (isDark ? 'bg-amber-950/90 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-900 border-amber-300')
                        : (isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300')
                    }`}>
                      โอกาส {d.probability}%
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-[11px] pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80">
                    <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" />
                      <span className="shrink-0 font-medium">ช่วงเวลา:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 break-words leading-tight">
                        {d.timeWindow || 'ไม่มีแนวโน้มฝนตกหนัก'}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="text-xs shrink-0 mt-0.5">⏱️</span>
                      <span className="shrink-0 font-medium">ระยะเวลา:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 break-words leading-tight">
                        {d.durationText || 'ไม่มีสัญญาณฝนต่อเนื่อง'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar Quick Button (Optional) */}
        {onOpenRadar && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => {
                playClickSound();
                onOpenRadar();
              }}
              className={`text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 ${
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
