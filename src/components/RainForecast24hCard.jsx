import React, { useState, useEffect } from 'react';
import { playClickSound, playToggleSound } from '../services/soundEffects';
import { 
  CloudRain, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Radio,
  Timer,
  Activity
} from 'lucide-react';
import { CivicWeather, CivicCompass, CivicStationPin } from './CivicIcons';

export default function RainForecast24hCard({
  forecast,
  userDistrict,
  userLocation,
  onRequestGps,
  onOpenRadar,
  theme = 'light',
  className = '',
  collapsible = true,
  defaultExpanded,
  onManualSync,
  isSyncing = false,
  onOpenPublicUpdates,
  lastUpdatedTime
}) {
  const isDark = theme === 'dark';

  const [isExpanded, setIsExpanded] = useState(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return false;
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

  const activeForecast = forecast || {
    title: "คาดการณ์สภาพอากาศ",
    status: "ท้องฟ้าโปร่ง มีเมฆบางส่วน",
    temp: 29,
    feelsLike: 32,
    maxProbability: 45,
    todayProbability: 45,
    todayTimeWindow: "16:00 – 18:00 น.",
    todayContinuousHours: 2,
    todayContinuousDuration: "ตกติดต่อกัน ~2 ชั่วโมงต่อเนื่อง",
    startTimeText: "16:00 – 18:00 น.",
    isRainingNow: false,
    hourly: [],
    districtRainAnalysis: []
  };

  const todayDate = currentDate;
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const todayLabel = `วัน${thaiDays[todayDate.getDay()]}ที่ ${todayDate.getDate()} ${thaiMonths[todayDate.getMonth()]}`;

  const isRainingNow = Boolean(activeForecast.isRainingNow);
  const status = activeForecast.status || (isRainingNow ? 'ฝนตกในพื้นที่' : 'โอกาสฝนตกปานกลาง');
  const todayProb = activeForecast.todayProbability ?? activeForecast.maxProbability ?? 35;
  const tomorrowProb = activeForecast.tomorrowProbability ?? 50;

  let rainTimeToday = activeForecast.todayTimeWindow || activeForecast.startTimeText || "ไม่มีเกณฑ์ฝนตกวันนี้";
  if (rainTimeToday.startsWith('เริ่มราว ') || rainTimeToday.startsWith('เริ่มประมาณ ')) {
    rainTimeToday = rainTimeToday.replace('เริ่มราว ', '').replace('เริ่มประมาณ ', '');
  }
  const todayContDuration = activeForecast.todayContinuousDuration || (
    todayProb >= 40 ? 'ตกติดต่อกัน ~1–2 ชั่วโมง' : 'ไม่ตกต่อเนื่อง (0 ชม.)'
  );
  const rainTimeTomorrow = activeForecast.tomorrowTimeWindow || "15:00 – 17:00 น.";
  const tomorrowContDuration = activeForecast.tomorrowContinuousDuration || (
    tomorrowProb >= 40 ? 'ตกติดต่อกัน ~1–2 ชั่วโมง' : 'ไม่ตกต่อเนื่อง (0 ชม.)'
  );

  // 6 Districts List
  const defaultTimeWindow = rainTimeToday;
  const defaultDuration = todayContDuration;
  const storedDistrictTemps = (() => {
    try {
      const s = localStorage.getItem('prakanguard_live_district_temps');
      return s ? JSON.parse(s) : null;
    } catch (_) { return null; }
  })();

  const districtList = (Array.isArray(activeForecast.districtRainAnalysis) && activeForecast.districtRainAnalysis.length > 0)
    ? activeForecast.districtRainAnalysis
    : (Array.isArray(storedDistrictTemps) && storedDistrictTemps.length > 0)
      ? storedDistrictTemps
      : [
          { district: "เมืองสมุทรปราการ", probability: todayProb, todayProbability: todayProb, todayTimeWindow: defaultTimeWindow, todayContinuousDuration: defaultDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 28, status: activeForecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "บางพลี", probability: todayProb, todayProbability: todayProb, todayTimeWindow: defaultTimeWindow, todayContinuousDuration: defaultDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 28, status: activeForecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "พระประแดง", probability: todayProb, todayProbability: todayProb, todayTimeWindow: defaultTimeWindow, todayContinuousDuration: defaultDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 28, status: activeForecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "บางเสาธง", probability: todayProb, todayProbability: todayProb, todayTimeWindow: defaultTimeWindow, todayContinuousDuration: defaultDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 27, status: activeForecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "บางบ่อ", probability: todayProb, todayProbability: todayProb, todayTimeWindow: defaultTimeWindow, todayContinuousDuration: defaultDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 27, status: activeForecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration },
          { district: "พระสมุทรเจดีย์", probability: todayProb, todayProbability: todayProb, todayTimeWindow: defaultTimeWindow, todayContinuousDuration: defaultDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 29, status: activeForecast?.status || "ปกติ", timeWindow: defaultTimeWindow, durationText: defaultDuration }
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

  const hasGpsLocation = Boolean(
    userLocation &&
    typeof userLocation.lat === 'number' &&
    typeof userLocation.lng === 'number'
  );

  const currentDistrict = cleanDistrictName(userDistrict);
  const isLocatedInDistrict = Boolean(hasGpsLocation && currentDistrict);
  const matchedDistrict = isLocatedInDistrict
    ? (districtList.find(d => d.district.includes(currentDistrict) || currentDistrict.includes(d.district)) || districtList[0])
    : null;
  const isUserAreaRaining = Boolean(
    matchedDistrict?.isRainingNow ||
    (typeof matchedDistrict?.precipitationMm === 'number' && matchedDistrict.precipitationMm > 0.1)
  );
  const displayDistrictLabel = currentDistrict ? `อ.${currentDistrict}` : 'ทุกอำเภอ (จ.สมุทรปราการ)';

  // Today's hourly slots for visual continuous rain timeline
  const todayHourlySlots = Array.isArray(activeForecast.hourly)
    ? activeForecast.hourly.filter(h => !h.isTomorrow).slice(0, 8)
    : [];

  // Collapsed Minimal Pill
  if (collapsible && !isExpanded) {
    return (
      <div className={`rounded-2xl border shadow-xs transition-all duration-200 pointer-events-auto select-none p-2.5 backdrop-blur-md ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200/90 text-slate-900'
      } ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              playToggleSound(true);
              setIsExpanded(true);
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group active:scale-95 transition-transform"
          >
            <div className={`p-2 rounded-xl shrink-0 border ${
              isDark ? 'bg-slate-800 text-sky-400 border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-200'
            }`}>
              <CivicWeather className="w-4 h-4 shrink-0" />
            </div>
            <div className="min-w-0 truncate">
              <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">
                วันนี้โอกาสฝน {todayProb}% • {rainTimeToday}
              </span>
              <span className={`text-[10.5px] block truncate font-medium ${isDark ? 'text-sky-300' : 'text-slate-600'}`}>
                ⏱️ {todayContDuration}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              playToggleSound(true);
              setIsExpanded(true);
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <span>ดูรายละเอียด</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border transition-all duration-200 pointer-events-auto select-none overflow-hidden ${
      isDark
        ? 'bg-slate-900/95 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
    } ${className}`}>
      <div className="p-3.5 space-y-3">

        {/* 1. Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-slate-800 text-sky-400 border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-200'
            }`}>
              <CivicWeather className="w-4 h-4 shrink-0" />
            </div>
            <div className="min-w-0">
              <span className={`font-bold text-xs sm:text-sm block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                พยากรณ์เวลาฝนตก & ระยะเวลาตกต่อเนื่อง
              </span>
              <span className={`text-[10.5px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {todayLabel} • อัปเดตเรดาร์รายชั่วโมง
              </span>
            </div>
          </div>

          {collapsible && (
            <button
              type="button"
              onClick={() => {
                playToggleSound(false);
                setIsExpanded(false);
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="ย่อแถบนี้"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. TODAY'S CLEAR 3-POINT SUMMARY CARD (ไม่งง อ่านเข้าใจใน 3 วินาที) */}
        <div className={`p-3.5 rounded-2xl border-2 transition-all ${
          isRainingNow
            ? (isDark ? 'bg-rose-950/30 border-rose-500/80' : 'bg-rose-50/50 border-rose-500')
            : todayProb >= 60
            ? (isDark ? 'bg-slate-850 border-amber-500/80' : 'bg-white border-slate-900 shadow-sm')
            : (isDark ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-900 shadow-sm')
        }`}>
          {/* Top Row: Title + Pill Badge (Globetrans style) */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div>
              <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                สรุปพยากรณ์ฝนวันนี้ ({todayLabel})
              </span>
              <h4 className={`text-sm font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isLocatedInDistrict ? displayDistrictLabel : 'ภาพรวมจังหวัดสมุทรปราการ'}
              </h4>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-tight shrink-0 ${
              isRainingNow
                ? 'bg-rose-600 text-white'
                : todayProb >= 60
                ? 'bg-amber-400 text-slate-950'
                : todayProb >= 35
                ? 'bg-[#b8f338] text-slate-950'
                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
            }`}>
              {isRainingNow ? '🌧️ ตกขณะนี้' : `โอกาสตก ${todayProb}%`}
            </span>
          </div>

          {/* Progress Bar (Visual Rain Probability Bar like Reference Image) */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isRainingNow || todayProb >= 65
                  ? 'bg-rose-500'
                  : todayProb >= 35
                  ? 'bg-[#84cc16]'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(8, Math.min(100, todayProb))}%` }}
            />
          </div>

          {/* 2 Key Boxes: 1) วันนี้ตกตอนกี่โมง  2) ตกติดกันต่อเนื่องนานเท่าใด */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/90 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>1. วันนี้มีโอกาสตกตอนกี่โมง</span>
              </div>
              <div className={`text-xs sm:text-[13px] font-extrabold mt-1 leading-snug ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {rainTimeToday}
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/90 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>2. คาดว่าจะตกติดกันนานเท่าใด</span>
              </div>
              <div className={`text-xs sm:text-[13px] font-extrabold mt-1 leading-snug ${
                todayProb >= 40
                  ? (isDark ? 'text-amber-300' : 'text-slate-950')
                  : (isDark ? 'text-emerald-400' : 'text-emerald-700')
              }`}>
                {todayContDuration}
              </div>
            </div>
          </div>

          {/* Today's Mini Hourly Strip (if available) */}
          {todayHourlySlots.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="font-bold">ไทม์ไลน์ช่วงเวลาฝนวันนี้ (รายชั่วโมง):</span>
                <span>สีเข้ม = ช่วงเวลาที่ฝนตกต่อเนื่อง</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {todayHourlySlots.map((slot, idx) => {
                  const isRainSlot = slot.probability >= 40 || slot.precipitation >= 0.3;
                  return (
                    <div
                      key={idx}
                      className={`py-1 px-1 rounded-lg text-center border text-[9.5px] transition-colors ${
                        isRainSlot
                          ? (isDark
                              ? 'bg-sky-950/90 border-sky-500/70 text-sky-200 font-bold'
                              : 'bg-slate-900 border-slate-900 text-white font-bold')
                          : (isDark
                              ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                              : 'bg-slate-50 border-slate-200/70 text-slate-500')
                      }`}
                    >
                      <span className="block font-mono leading-tight">{slot.isNow ? 'ตอนนี้' : slot.time}</span>
                      <span className={`block font-mono text-[10px] mt-0.5 ${
                        isRainSlot
                          ? (isDark ? 'text-sky-300' : 'text-[#b8f338]')
                          : ''
                      }`}>
                        {slot.probability}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. GPS User Location Strip */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
          !hasGpsLocation
            ? (isDark ? 'bg-amber-950/20 border-amber-800/60 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900')
            : isDark
              ? 'bg-slate-850/80 border-slate-800 text-slate-200'
              : 'bg-slate-50 border-slate-200/80 text-slate-800'
        }`}>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold flex items-center gap-1 opacity-80">
              <CivicCompass className="w-3 h-3 shrink-0 text-blue-500" />
              <span>พิกัดของท่าน:</span>
            </span>
            <span className="text-xs font-bold block truncate text-slate-900 dark:text-white">
              {!hasGpsLocation
                ? 'ยังไม่ได้เปิดตำแหน่ง GPS'
                : isLocatedInDistrict
                  ? `${displayDistrictLabel} (${isUserAreaRaining ? 'ฝนกำลังตก' : 'ขณะนี้ฝนไม่ตก'})`
                  : 'อยู่นอกพื้นที่สมุทรปราการ'}
            </span>
          </div>
          {!hasGpsLocation && onRequestGps && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onRequestGps();
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer shrink-0 ${
                isDark ? 'bg-sky-500 text-slate-950 hover:bg-sky-400' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              ระบุพิกัด GPS
            </button>
          )}
        </div>

        {/* 4. 6 DISTRICTS BREAKDOWN (บอกเวลาตก & ระยะเวลาตกต่อเนื่องครบ 6 อำเภอ) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              พยากรณ์เวลาเริ่มตก & ระยะเวลาตกต่อเนื่อง 6 อำเภอ (วันนี้):
            </span>
            {lastUpdatedTime && (
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                อัปเดต {lastUpdatedTime}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {districtList.map((d, idx) => {
              const raw = d.district.replace(/^(อ\.|อำเภอ)/, '').trim();
              const fullName = raw.includes('เมือง') ? 'อ.เมืองสมุทรปราการ' : `อ.${raw}`;
              const isMatched = userDistrict && (userDistrict.includes(raw) || raw.includes(userDistrict.replace(/^(อ\.|อำเภอ)/, '').trim()));
              const dTodayProb = d.todayProbability ?? d.probability ?? todayProb;
              const dTodayWin = d.todayTimeWindow || d.timeWindow || rainTimeToday;
              const dTodayCont = d.todayContinuousDuration || d.durationText || todayContDuration;
              const dTomProb = d.tomorrowProbability ?? tomorrowProb;
              const dTomWin = d.tomorrowTimeWindow || rainTimeTomorrow;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-xs transition-all ${
                    isMatched
                      ? (isDark ? 'bg-slate-850 border-sky-400 ring-1 ring-sky-400/30' : 'bg-white border-2 border-slate-900 shadow-xs')
                      : (isDark ? 'bg-slate-850/50 border-slate-800 hover:border-slate-700' : 'bg-slate-50/80 border-slate-200/80 hover:bg-white')
                  }`}
                >
                  {/* District Title & Today Probability Pill */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {fullName}
                      </span>
                      {d.temperature && (
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          • {d.temperature}°C
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono shrink-0 ${
                      d.isRainingNow
                        ? 'bg-rose-600 text-white'
                        : dTodayProb >= 60
                        ? 'bg-amber-400 text-slate-950'
                        : dTodayProb >= 35
                        ? 'bg-[#b8f338] text-slate-950'
                        : (isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {d.isRainingNow ? `ตกขณะนี้ (${dTodayProb}%)` : `วันนี้ ${dTodayProb}%`}
                    </span>
                  </div>

                  {/* Today's Time & Continuous Duration Grid */}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-[9.5px] text-slate-400 block">เวลาที่คาดว่าจะตกวันนี้</span>
                      <span className={`font-bold block mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {dTodayWin}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-slate-400 block">ระยะเวลาตกต่อเนื่อง</span>
                      <span className={`font-bold block mt-0.5 ${
                        dTodayProb >= 40
                          ? (isDark ? 'text-sky-300' : 'text-blue-700')
                          : (isDark ? 'text-emerald-400' : 'text-emerald-700')
                      }`}>
                        {dTodayCont}
                      </span>
                    </div>
                  </div>

                  {/* Subtle Tomorrow Reference Footer */}
                  <div className="mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>แนวโน้มพรุ่งนี้: {dTomWin}</span>
                    <span className="font-mono font-semibold">โอกาส {dTomProb}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Tomorrow Summary Strip (แยกส่วนชัดเจนอยู่ด้านล่างสุด ไม่ปนกับวันนี้) */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-100/80 border-slate-200 text-slate-700'
        }`}>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
              แนวโน้มวันพรุ่งนี้ (แยกจากวันนี้)
            </span>
            <span className="text-[11px] font-semibold block truncate mt-0.5">
              ช่วงเวลา {rainTimeTomorrow} • {tomorrowContDuration}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 shrink-0">
            {tomorrowProb}%
          </span>
        </div>

        {/* 6. Action Footer */}
        <div className="pt-1 flex items-center justify-between text-xs">
          {onOpenPublicUpdates && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenPublicUpdates();
              }}
              className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>สรุปสถานการณ์รายวัน</span>
            </button>
          )}

          {onOpenRadar && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenRadar();
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ml-auto ${
                isDark ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>เปิดเรดาร์ & ไทม์ไลน์ 24 ชม. &rarr;</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
