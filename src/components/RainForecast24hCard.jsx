import React, { useState, useEffect } from 'react';
import { playClickSound, playToggleSound } from '../services/soundEffects';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Timer
} from 'lucide-react';
import { CivicWeather, CivicCompass } from './CivicIcons';

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
    title: "พยากรณ์ฝนตก",
    status: "ท้องฟ้าโปร่ง",
    temp: 29,
    feelsLike: 32,
    maxProbability: 45,
    todayProbability: 45,
    todayTimeWindow: "16:00 – 18:00 น.",
    todayContinuousHours: 2,
    todayContinuousDuration: "ต่อเนื่อง ~2 ชั่วโมง",
    startTimeText: "16:00 – 18:00 น.",
    isRainingNow: false,
    hourly: [],
    districtRainAnalysis: []
  };

  const todayDate = currentDate;
  const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const todayLabel = `${thaiDays[todayDate.getDay()]} ${todayDate.getDate()} ${thaiMonths[todayDate.getMonth()]}`;

  const isRainingNow = Boolean(activeForecast.isRainingNow);
  const todayProb = activeForecast.todayProbability ?? activeForecast.todayMaxProb ?? activeForecast.maxProbability ?? 30;
  const tomorrowProb = activeForecast.tomorrowProbability ?? activeForecast.tomorrowMaxProb ?? 50;

  let rainTimeToday = activeForecast.todayTimeWindow || activeForecast.startTimeText || "ไม่มีฝนตก";
  if (rainTimeToday.includes('ไม่มีเกณฑ์ฝนตก')) rainTimeToday = 'ไม่มีฝนตก';
  if (!isRainingNow && todayProb < 35 && rainTimeToday.includes('ขณะนี้')) {
    rainTimeToday = 'ไม่มีฝนตก';
  }

  let todayContDuration = activeForecast.todayContinuousDuration || (
    todayProb >= 35 ? 'ต่อเนื่อง ~1–2 ชั่วโมง' : 'ไม่มีฝนต่อเนื่อง'
  );
  if (todayContDuration.includes('ไม่ตกต่อเนื่อง')) todayContDuration = 'ไม่มีฝนต่อเนื่อง';
  if (!isRainingNow && todayProb < 35) todayContDuration = 'ไม่มีฝนต่อเนื่อง';

  let rainTimeTomorrow = activeForecast.tomorrowTimeWindow || "15:00 – 17:00 น.";
  if (rainTimeTomorrow.includes('ไม่มีเกณฑ์ฝนตก')) rainTimeTomorrow = 'ไม่มีฝนตก';

  let tomorrowContDuration = activeForecast.tomorrowContinuousDuration || (
    tomorrowProb >= 35 ? 'ต่อเนื่อง ~1–2 ชั่วโมง' : 'ไม่มีฝนต่อเนื่อง'
  );
  if (tomorrowContDuration.includes('ไม่ตกต่อเนื่อง')) tomorrowContDuration = 'ไม่มีฝนต่อเนื่อง';

  const storedDistrictTemps = (() => {
    try {
      const s = localStorage.getItem('prakanguard_live_district_temps_v3');
      return s ? JSON.parse(s) : null;
    } catch (_) { return null; }
  })();

  const districtList = (Array.isArray(activeForecast.districtRainAnalysis) && activeForecast.districtRainAnalysis.length > 0)
    ? activeForecast.districtRainAnalysis
    : (Array.isArray(storedDistrictTemps) && storedDistrictTemps.length > 0)
      ? storedDistrictTemps
      : [
          { district: "เมืองสมุทรปราการ", probability: todayProb, todayProbability: todayProb, todayTimeWindow: rainTimeToday, todayContinuousDuration: todayContDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 29 },
          { district: "บางพลี", probability: todayProb, todayProbability: todayProb, todayTimeWindow: rainTimeToday, todayContinuousDuration: todayContDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 29 },
          { district: "พระประแดง", probability: todayProb, todayProbability: todayProb, todayTimeWindow: rainTimeToday, todayContinuousDuration: todayContDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 29 },
          { district: "บางเสาธง", probability: todayProb, todayProbability: todayProb, todayTimeWindow: rainTimeToday, todayContinuousDuration: todayContDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 28 },
          { district: "บางบ่อ", probability: todayProb, todayProbability: todayProb, todayTimeWindow: rainTimeToday, todayContinuousDuration: todayContDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 28 },
          { district: "พระสมุทรเจดีย์", probability: todayProb, todayProbability: todayProb, todayTimeWindow: rainTimeToday, todayContinuousDuration: todayContDuration, tomorrowProbability: tomorrowProb, tomorrowTimeWindow: rainTimeTomorrow, temperature: 29 }
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
  const displayDistrictLabel = currentDistrict ? `อ.${currentDistrict}` : 'จังหวัดสมุทรปราการ';

  const todayHourlySlots = Array.isArray(activeForecast.hourly)
    ? activeForecast.hourly.filter(h => !h.isTomorrow).slice(0, 6)
    : [];

  if (collapsible && !isExpanded) {
    return (
      <div className={`rounded-2xl border transition-all duration-200 pointer-events-auto select-none p-3 ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      } ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              playToggleSound(true);
              setIsExpanded(true);
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
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
              <span className={`text-[11px] block truncate font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {todayContDuration}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              playToggleSound(true);
              setIsExpanded(true);
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <span>ขยาย</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border transition-all duration-200 pointer-events-auto select-none overflow-hidden ${
      isDark
        ? 'bg-slate-900 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200 text-slate-900 shadow-xs'
    } ${className}`}>
      <div className="p-3.5 space-y-3">

        {/* 1. TODAY SUMMARY CARD */}
        <div className={`p-3.5 rounded-2xl border-2 transition-all ${
          isRainingNow
            ? (isDark ? 'bg-rose-950/30 border-rose-500/80' : 'bg-rose-50/50 border-rose-500')
            : todayProb >= 60
            ? (isDark ? 'bg-slate-850 border-amber-500/80' : 'bg-white border-slate-900')
            : (isDark ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-900')
        }`}>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div>
              <span className={`text-[11px] font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                พยากรณ์วันนี้ ({todayLabel})
              </span>
              <h4 className={`text-sm font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isLocatedInDistrict ? displayDistrictLabel : 'ภาพรวมสมุทรปราการ'}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                isRainingNow
                  ? 'bg-rose-600 text-white'
                  : todayProb >= 60
                  ? 'bg-amber-400 text-slate-950'
                  : todayProb >= 35
                  ? 'bg-[#b8f338] text-slate-950'
                  : (isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-emerald-50 text-emerald-800 border border-emerald-200')
              }`}>
                {isRainingNow ? 'กำลังตก' : `โอกาสตก ${todayProb}%`}
              </span>
              {collapsible && (
                <button
                  type="button"
                  onClick={() => {
                    playToggleSound(false);
                    setIsExpanded(false);
                  }}
                  className={`p-1.5 rounded-full border cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                  title="ย่อการ์ด"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
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

          {/* 2 Key Boxes: เวลาที่คาดว่าจะตก & ระยะเวลาตกต่อเนื่อง */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>เวลาที่คาดว่าจะตก</span>
              </div>
              <div className={`text-[13px] font-extrabold mt-1 leading-snug ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {rainTimeToday}
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <Timer className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>ตกติดกันต่อเนื่อง</span>
              </div>
              <div className={`text-[13px] font-extrabold mt-1 leading-snug ${
                todayProb >= 35
                  ? (isDark ? 'text-sky-300' : 'text-blue-700')
                  : (isDark ? 'text-emerald-400' : 'text-emerald-700')
              }`}>
                {todayContDuration}
              </div>
            </div>
          </div>

          {/* Today's Mini Hourly Strip */}
          {todayHourlySlots.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-6 gap-1">
                {todayHourlySlots.map((slot, idx) => {
                  const isRainSlot = slot.probability >= 40 || slot.precipitation >= 0.3;
                  return (
                    <div
                      key={idx}
                      className={`py-1.5 px-1 rounded-full text-center border text-[10.5px] transition-colors ${
                        isRainSlot
                          ? (isDark
                              ? 'bg-sky-950 border-sky-500/70 text-sky-200 font-bold'
                              : 'bg-slate-900 border-slate-900 text-white font-bold')
                          : (isDark
                              ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                              : 'bg-slate-50 border-slate-200/70 text-slate-600')
                      }`}
                    >
                      <span className="block font-mono leading-tight">{slot.isNow ? 'ตอนนี้' : slot.time}</span>
                      <span className={`block font-mono text-[11px] font-bold mt-0.5 ${
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

        {/* 2. 6 DISTRICTS BREAKDOWN */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              แยกตามอำเภอ (6 อำเภอ)
            </span>
            {lastUpdatedTime && (
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                อัปเดต {lastUpdatedTime}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {districtList.map((d, idx) => {
              const raw = d.district.replace(/^(อ\.|อำเภอ)/, '').trim();
              const fullName = raw.includes('เมือง') ? 'อ.เมืองสมุทรปราการ' : `อ.${raw}`;
              const isMatched = userDistrict && (userDistrict.includes(raw) || raw.includes(userDistrict.replace(/^(อ\.|อำเภอ)/, '').trim()));
              const dTodayProb = d.todayProbability ?? d.probability ?? todayProb;
              const hasRainToday = Boolean(d.isRainingNow || dTodayProb >= 35);

              let dTodayWin = d.todayTimeWindow || d.timeWindow || rainTimeToday;
              if (dTodayWin.includes('ไม่มีเกณฑ์ฝนตก') || (!hasRainToday && dTodayWin.includes('ขณะนี้'))) {
                dTodayWin = 'ไม่มีฝนตก';
              }

              let dTodayCont = d.todayContinuousDuration || d.durationText || todayContDuration;
              if (dTodayCont.includes('ไม่ตกต่อเนื่อง') || !hasRainToday) {
                dTodayCont = 'ไม่มีฝนต่อเนื่อง';
              }

              const dTomProb = d.tomorrowProbability ?? tomorrowProb;
              let dTomWin = d.tomorrowTimeWindow || rainTimeTomorrow;
              if (dTomWin.includes('ไม่มีเกณฑ์ฝนตก')) dTomWin = 'ไม่มีฝนตก';

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    isMatched
                      ? (isDark ? 'bg-slate-850 border-sky-400' : 'bg-white border-2 border-slate-900 shadow-xs')
                      : (isDark ? 'bg-slate-850/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80')
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-bold text-[13px] truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {fullName}
                      </span>
                      {d.temperature && (
                        <span className={`text-[11px] font-mono shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {d.temperature}°C
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono shrink-0 ${
                      d.isRainingNow
                        ? 'bg-rose-600 text-white'
                        : dTodayProb >= 60
                        ? 'bg-amber-400 text-slate-950'
                        : dTodayProb >= 35
                        ? 'bg-[#b8f338] text-slate-950'
                        : (isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {d.isRainingNow ? `กำลังตก ${dTodayProb}%` : `วันนี้ ${dTodayProb}%`}
                    </span>
                  </div>

                  {hasRainToday ? (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10.5px] text-slate-400 block">เวลาที่คาดว่าจะตก</span>
                        <span className={`font-bold block mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {dTodayWin}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10.5px] text-slate-400 block">ตกติดกันต่อเนื่อง</span>
                        <span className={`font-bold block mt-0.5 ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>
                          {dTodayCont}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between text-[11.5px]">
                      <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                        วันนี้: ไม่มีเกณฑ์ฝนตก
                      </span>
                      <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        พรุ่งนี้ {dTomProb}% ({dTomWin})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. TOMORROW SUMMARY STRIP */}
        <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              แนวโน้มวันพรุ่งนี้
            </span>
            <span className="text-xs font-bold block truncate mt-0.5">
              {rainTimeTomorrow} • {tomorrowContDuration}
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs shrink-0 ${
            isDark ? 'bg-slate-800 text-sky-300' : 'bg-white border border-slate-200 text-slate-900'
          }`}>
            โอกาส {tomorrowProb}%
          </span>
        </div>

        {/* 4. FULL FORECAST MODAL BUTTON */}
        {onOpenRadar && (
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenRadar();
            }}
            className={`w-full py-2.5 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <span>ดูตารางพยากรณ์รายชั่วโมง (24 ชม.)</span>
          </button>
        )}

      </div>
    </div>
  );
}
