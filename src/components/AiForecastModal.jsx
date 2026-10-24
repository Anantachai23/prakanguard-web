import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Droplets, 
  Wind, 
  CloudRain, 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudLightning,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { getLiveSamutPrakanWeather } from '../services/weatherService';
import { playClickSound, playCloseSound } from '../services/soundEffects';
import { CivicRadar, CivicWeather, CivicStationPin } from './CivicIcons';

export default function AiForecastModal({ isOpen, onClose, userDistrict, theme = 'light' }) {
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const isDark = theme === 'dark';

  // ตรวจสอบการรีเซ็ตเที่ยงคืนแบบอัตโนมัติ
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

  const fetchWeather = (force = false) => {
    setLoadingWeather(true);
    getLiveSamutPrakanWeather(force)
      .then(data => {
        setWeather(data);
        setLoadingWeather(false);
      })
      .catch(err => {
        console.warn("Error fetching weather in modal:", err);
        setLoadingWeather(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchWeather(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayDate = currentDate;
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiYear = todayDate.getFullYear() + 543;
  const todayTitle = `วัน${thaiDays[todayDate.getDay()]}ที่ ${todayDate.getDate()} ${thaiMonths[todayDate.getMonth()]} ${thaiYear}`;

  const isRainingNow = Boolean(weather?.forecast24h?.isRainingNow);
  const maxProb = weather?.forecast24h?.maxProbability ?? weather?.rainProbabilityToday ?? 50;

  // ค้นหาช่วงเวลาที่คาดการณ์ว่าฝนจะตก
  let rainTimeToday = "ไม่มีแนวโน้มฝนตกหนัก";
  if (weather?.forecast24h?.startTimeText && weather.forecast24h.startTimeText !== 'ไม่มีแนวโน้มฝนตกหนัก') {
    rainTimeToday = weather.forecast24h.startTimeText.replace('เริ่มราว ', '').replace('เริ่มประมาณ ', '');
  } else if (weather?.peakHour) {
    rainTimeToday = weather.peakHour;
  } else if (maxProb >= 60) {
    rainTimeToday = "ช่วงบ่ายถึงเย็น (15:00 - 18:30 น.)";
  } else if (maxProb >= 40) {
    rainTimeToday = "ช่วงเย็นถึงค่ำ (16:30 - 19:30 น.)";
  }

  const defaultDuration = maxProb >= 50 ? "คาดการณ์ตกต่อเนื่อง ~30 - 60 นาที" : "ไม่มีสัญญาณฝนต่อเนื่อง";

  // ดึงข้อมูล 6 อำเภอ
  const storedDistrictTemps = (() => {
    try {
      const s = localStorage.getItem('prakanguard_live_district_temps');
      return s ? JSON.parse(s) : null;
    } catch (_) { return null; }
  })();

  const districtAnalysis = (Array.isArray(weather?.forecast24h?.districtRainAnalysis) && weather.forecast24h.districtRainAnalysis.length > 0)
    ? weather.forecast24h.districtRainAnalysis
    : (Array.isArray(storedDistrictTemps) && storedDistrictTemps.length > 0)
      ? storedDistrictTemps
      : [
          { district: "เมืองสมุทรปราการ", probability: maxProb, temperature: 29, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "บางพลี", probability: maxProb, temperature: 29, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "พระประแดง", probability: maxProb, temperature: 29, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "บางเสาธง", probability: maxProb, temperature: 28, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "บางบ่อ", probability: maxProb, temperature: 28, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "พระสมุทรเจดีย์", probability: maxProb, temperature: 29, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration }
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

  // ไทม์ไลน์รายชั่วโมง 24 ชั่วโมง
  const hourlyData = Array.isArray(weather?.forecast24h?.hourly) ? weather.forecast24h.hourly : [];

  const getWeatherIcon = (code, precip = 0, isLarge = false) => {
    const size = isLarge ? "w-5 h-5" : "w-3.5 h-3.5";
    if (code >= 95) return <CloudLightning className={`${size} text-amber-500`} />;
    if (precip >= 1.5 || [80, 81, 82, 63, 65].includes(code)) return <CloudRain className={`${size} text-blue-500`} />;
    if (precip > 0 || [51, 53, 55, 61].includes(code)) return <CloudRain className={`${size} text-sky-400`} />;
    if (code === 3) return <Cloud className={`${size} text-slate-400`} />;
    if (code === 1 || code === 2) return <CloudSun className={`${size} text-amber-400`} />;
    return <Sun className={`${size} text-amber-400`} />;
  };

  return (
    <div 
      onClick={(e) => { 
        if (e.target === e.currentTarget) {
          playCloseSound();
          onClose();
        } 
      }}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
    >
      <div className={`w-[88vw] max-w-[340px] sm:max-w-xl md:max-w-2xl my-auto m-auto border rounded-xl sm:rounded-2xl shadow-2xl relative max-h-[73vh] sm:max-h-[84vh] flex flex-col overflow-hidden transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Top Gradient Stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 shrink-0" />
        
        {/* Header */}
        <div className={`flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-b shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-blue-950/70 text-blue-400 border-blue-800/80' : 'bg-blue-50 text-blue-600 border-blue-200 shadow-2xs'
            }`}>
              <CivicWeather className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className={`text-[12.5px] sm:text-sm font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  พยากรณ์ฝนและสภาพอากาศ 24 ชม.
                </h3>
                <span className="px-1 py-0.2 rounded text-[8.5px] sm:text-[9.5px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  Open-Meteo & TMD
                </span>
              </div>
              <p className={`text-[9.5px] sm:text-xs leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {todayTitle} • จ.สมุทรปราการ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button 
              type="button"
              onClick={() => {
                playClickSound();
                fetchWeather(true);
              }}
              disabled={loadingWeather}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="รีเฟรชข้อมูลสภาพอากาศ"
            >
              <RefreshCw className={`w-3 h-3 ${loadingWeather ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <button 
              type="button"
              onClick={() => {
                playCloseSound();
                onClose();
              }} 
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
              title="ปิดหน้าต่าง"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2.5 sm:py-3.5 space-y-2.5 sm:space-y-3.5">
          {loadingWeather && !weather ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <span className="font-medium text-[11px]">กำลังปรับเทียบข้อมูลโทรมาตรสภาพอากาศ...</span>
            </div>
          ) : (
            <>
              {/* 1. HERO WEATHER & RAIN RISK CARD */}
              <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border relative overflow-hidden transition-all ${
                isDark 
                  ? 'bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/40 border-slate-800' 
                  : 'bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-indigo-50/30 border-blue-200/70 shadow-2xs'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Left: Main Temp & Sky */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
                        {weather?.temp ?? 29}°C
                      </span>
                      <div className="flex flex-col">
                        <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                          isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
                        }`}>
                          {getWeatherIcon(weather?.weatherCode ?? 2, weather?.precipitation ?? 0)}
                          <span className="truncate max-w-[130px] sm:max-w-none">{weather?.weatherDesc || 'ท้องฟ้าโปร่ง มีเมฆบางส่วน'}</span>
                        </span>
                        {weather?.feelsLike && (
                          <span className={`text-[9.5px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            รู้สึกเหมือน {weather.feelsLike}°C
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Micro Telemetry Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2 text-[9px] sm:text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        isDark ? 'bg-slate-850 text-slate-300 border-slate-700' : 'bg-white/90 text-slate-600 border-slate-200'
                      }`}>
                        <Droplets className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                        <span>ความชื้น {weather?.humidity ?? 72}%</span>
                      </span>
                      <span className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        isDark ? 'bg-slate-850 text-slate-300 border-slate-700' : 'bg-white/90 text-slate-600 border-slate-200'
                      }`}>
                        <Wind className="w-2.5 h-2.5 text-cyan-500 shrink-0" />
                        <span>ลม {weather?.windSpeed ?? 14} กม./ชม.</span>
                      </span>
                      {weather?.thunderstormRisk && (
                        <span className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                          weather.thunderstormRisk === 'สูง' || weather.thunderstormRisk === 'สูงมาก'
                            ? (isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-800 border-amber-200')
                            : (isDark ? 'bg-slate-850 text-slate-300 border-slate-700' : 'bg-white/90 text-slate-600 border-slate-200')
                        }`}>
                          <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                          <span>ฟ้าคะนอง: {weather.thunderstormRisk}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Rain Probability & Peak Status */}
                  <div className={`p-2 sm:p-2.5 rounded-lg border flex flex-col justify-center sm:min-w-[170px] shrink-0 ${
                    isRainingNow
                      ? (isDark ? 'bg-rose-950/50 border-rose-800/80' : 'bg-rose-50 border-rose-200')
                      : maxProb >= 60
                      ? (isDark ? 'bg-amber-950/40 border-amber-800/70' : 'bg-amber-50 border-amber-200')
                      : (isDark ? 'bg-emerald-950/30 border-emerald-800/60' : 'bg-emerald-50/80 border-emerald-200')
                  }`}>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider ${
                        isRainingNow
                          ? 'text-rose-600 dark:text-rose-400'
                          : maxProb >= 60
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {isRainingNow ? 'สถานะปัจจุบัน' : 'ความเสี่ยงฝนวันนี้'}
                      </span>
                      {isRainingNow && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      {isRainingNow ? (
                        <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                          ฝนตกในพื้นที่ขณะนี้
                        </span>
                      ) : (
                        <>
                          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                            {maxProb}%
                          </span>
                          <span className={`text-[10.5px] font-semibold ${
                            maxProb >= 60 ? 'text-rose-600 dark:text-rose-400' : maxProb >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {maxProb >= 60 ? 'เสี่ยงฝนตกหนัก' : maxProb >= 30 ? 'เฝ้าระวังฝนฟ้าคะนอง' : 'โอกาสฝนน้อย'}
                          </span>
                        </>
                      )}
                    </div>

                    <div className={`mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[9.5px] sm:text-[10px] ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      <div className="flex items-center gap-1 truncate font-medium">
                        <Clock className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                        <span className="truncate">{rainTimeToday}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 15-Minute Imminent Rain Notice (if any) */}
                {weather?.nextRainIn15Min && (
                  <div className={`mt-2 p-1.5 rounded-md border flex items-center gap-1.5 text-[10.5px] font-semibold ${
                    isDark ? 'bg-blue-950/80 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <CloudRain className="w-3.5 h-3.5 text-blue-500 animate-bounce shrink-0" />
                    <span className="truncate">สัญญาณเรดาร์: คาดการณ์กลุ่มฝนเริ่มแตะพื้นที่ ~{weather.nextRainIn15Min}</span>
                  </div>
                )}
              </div>

              {/* 2. 24-HOUR HOURLY TIMELINE (HORIZONTAL SCROLLER) */}
              {hourlyData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <h4 className={`text-[11px] sm:text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        ไทม์ไลน์คาดการณ์ฝน 24 ชั่วโมงข้างหน้า
                      </h4>
                    </div>
                    <span className="text-[9px] text-slate-400">เลื่อนซ้าย-ขวา</span>
                  </div>

                  <div className="relative">
                    <div className={`flex gap-1.5 overflow-x-auto pb-1.5 pt-0.5 px-0.5 no-scrollbar snap-x scroll-smooth rounded-lg border p-1.5 ${
                      isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/60 border-slate-200'
                    }`}>
                      {hourlyData.map((h, i) => {
                        const isHighRain = h.probability >= 60;
                        const isModerateRain = h.probability >= 30;

                        return (
                          <div
                            key={i}
                            className={`flex flex-col items-center justify-between min-w-[54px] sm:min-w-[64px] p-1.5 rounded-lg border text-center snap-start transition-all shrink-0 ${
                              h.isNow
                                ? (isDark 
                                    ? 'bg-blue-950/70 border-blue-600 ring-1 ring-blue-500/30 text-white font-bold' 
                                    : 'bg-blue-50 border-blue-400 ring-1 ring-blue-500/20 text-blue-950 font-bold shadow-2xs')
                                : (isDark 
                                    ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700' 
                                    : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 shadow-2xs')
                            }`}
                          >
                            <span className="text-[9px] font-mono leading-tight">
                              {h.isNow ? (
                                <span className="text-blue-600 dark:text-blue-400 font-bold block">ตอนนี้</span>
                              ) : (
                                <span>{h.time}</span>
                              )}
                              {h.isTomorrow && (
                                <span className="block text-[8px] opacity-70">พรุ่งนี้</span>
                              )}
                            </span>

                            <div className="my-1 flex items-center justify-center">
                              {getWeatherIcon(h.weatherCode, h.precipitation)}
                            </div>

                            <span className={`text-[10px] font-mono font-bold ${
                              isHighRain 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : isModerateRain 
                                ? 'text-amber-600 dark:text-amber-400' 
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {h.probability}%
                            </span>

                            <span className="text-[8.5px] font-mono mt-0.5 text-slate-400">
                              {h.precipitation > 0 ? `${h.precipitation}m` : '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. 6 DISTRICTS TELEMETRY GRID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <CivicStationPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <h4 className={`text-[11px] sm:text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      สถานการณ์และโอกาสเกิดฝนแยก 6 อำเภอ
                    </h4>
                  </div>
                  <span className="text-[9px] text-slate-400">อัปเดตรายชั่วโมง</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {districtAnalysis.map((d, i) => {
                    const rawName = d.district.replace(/^(อ\.|อำเภอ)/, '').trim();
                    const fullName = rawName.includes('เมือง') ? 'อำเภอเมืองสมุทรปราการ' : `อำเภอ${rawName}`;
                    const isUserDistrict = currentDistrict && (currentDistrict.includes(rawName) || rawName.includes(currentDistrict));
                    const isHigh = d.probability >= 60;
                    const isMed = d.probability >= 40;

                    let badgeTheme = isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200';
                    let barColor = 'bg-emerald-500';

                    if (d.isRainingNow) {
                      badgeTheme = isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200';
                      barColor = 'bg-rose-500';
                    } else if (isHigh) {
                      badgeTheme = isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200';
                      barColor = 'bg-rose-500';
                    } else if (isMed) {
                      badgeTheme = isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200';
                      barColor = 'bg-amber-500';
                    } else {
                      badgeTheme = isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      barColor = 'bg-emerald-500';
                    }

                    return (
                      <div 
                        key={i}
                        className={`p-2 sm:p-2.5 rounded-lg border text-xs transition-all ${
                          isUserDistrict
                            ? (isDark 
                                ? 'bg-blue-950/50 border-blue-600/80 shadow-2xs ring-1 ring-blue-500/20' 
                                : 'bg-blue-50/70 border-blue-300 shadow-2xs ring-1 ring-blue-500/10')
                            : (isDark 
                                ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' 
                                : 'bg-white border-slate-200/90 hover:border-slate-300')
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className={`font-bold text-[11px] sm:text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {fullName}
                            </span>
                            {isUserDistrict && (
                              <span className="px-1 py-0.2 rounded text-[8px] sm:text-[8.5px] font-bold bg-blue-600 text-white shrink-0">
                                ตำแหน่งท่าน
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {d.temperature && (
                              <span className={`text-[9.5px] sm:text-[10px] font-mono px-1 py-0.2 rounded border ${
                                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {d.temperature}°C
                              </span>
                            )}
                            <span className={`px-1.5 py-0.2 rounded font-bold text-[9.5px] border font-mono ${badgeTheme}`}>
                              {d.isRainingNow ? 'ฝนตกขณะนี้' : `โอกาส ${d.probability}%`}
                            </span>
                          </div>
                        </div>

                        {/* Rain Probability Bar */}
                        <div className="mt-1.5 w-full h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.max(5, Math.min(100, d.probability))}%` }}
                          />
                        </div>

                        {/* Forecast Timing & Duration */}
                        <div className={`mt-1.5 flex items-center justify-between gap-1.5 text-[9.5px] sm:text-[10px] ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <span className="flex items-center gap-1 truncate font-medium">
                            <Clock className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                            <span className="truncate">{d.timeWindow || 'ไม่มีแนวโน้มฝนตกหนัก'}</span>
                          </span>
                          <span className="shrink-0 text-right text-[9px] opacity-80">
                            {d.durationText || 'ไม่มีสัญญาณฝน'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`px-3 py-2 sm:px-4 sm:py-2.5 border-t flex items-center justify-between gap-2 text-xs shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <a
            href="https://weather.bangkok.go.th/radar"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playClickSound()}
            className={`font-semibold flex items-center gap-1 text-[10.5px] sm:text-xs transition-colors group cursor-pointer ${
              isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <CivicRadar className="w-3 h-3 shrink-0" />
            <span className="group-hover:underline">เรดาร์ตรวจฝนสด (กทม.-สมุทรปราการ)</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
          </a>

          <button
            type="button"
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className={`px-3 py-1 rounded-md sm:rounded-lg font-semibold text-[11px] sm:text-xs border transition-colors cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
            }`}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
