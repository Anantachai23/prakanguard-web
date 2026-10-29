import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getLiveSamutPrakanWeather } from '../services/weatherService';
import { playClickSound, playCloseSound } from '../services/soundEffects';
import { CivicRadar, CivicWeather, CivicStationPin } from './CivicIcons';

export default function AiForecastModal({ isOpen, onClose, userDistrict, theme = 'light' }) {
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Ref และสถานะสำหรับเลื่อนไทม์ไลน์บนคอมพิวเตอร์และมือถือ
  const timelineRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

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

  // ฟังก์ชันเลื่อนไทม์ไลน์สำหรับ PC (ปุ่มซ้าย-ขวา)
  const handleScrollTimeline = (direction) => {
    if (!timelineRef.current) return;
    try { playClickSound(); } catch (_) {}
    const distance = 240;
    timelineRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  // ฟังก์ชันหมุนลูกกลิ้งเมาส์ (Mouse Wheel) ให้เลื่อนแนวนอนบนคอม
  const handleTimelineWheel = (e) => {
    if (!timelineRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      timelineRef.current.scrollLeft += e.deltaY * 1.2;
    }
  };

  // ฟังก์ชันคลิกเมาส์แล้วลากเลื่อน (Mouse Drag to Scroll) สำหรับคอมพิวเตอร์
  const handleMouseDown = (e) => {
    if (!timelineRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - timelineRef.current.offsetLeft);
    setScrollLeftPos(timelineRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !timelineRef.current) return;
    e.preventDefault();
    const x = e.pageX - timelineRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    timelineRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
  };

  if (!isOpen) return null;

  const todayDate = currentDate;
  const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiShortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const thaiYear = todayDate.getFullYear() + 543;
  const todayTitle = `วัน${thaiDays[todayDate.getDay()]}ที่ ${todayDate.getDate()} ${thaiMonths[todayDate.getMonth()]} ${thaiYear}`;
  const todayShortLabel = `วันนี้ (${todayDate.getDate()} ${thaiShortMonths[todayDate.getMonth()]})`;
  const tomorrowShortLabel = `พรุ่งนี้ (${tomorrowDate.getDate()} ${thaiShortMonths[tomorrowDate.getMonth()]})`;

  const isRainingNow = Boolean(weather?.forecast24h?.isRainingNow);
  const todayProb = weather?.forecast24h?.todayProbability ?? weather?.rainProbabilityToday ?? 30;
  const todayTimeWindow = weather?.forecast24h?.todayTimeWindow ?? weather?.rainTimeWindowToday ?? "ไม่มีแนวโน้มฝนตกหนัก";
  const tomorrowProb = weather?.forecast24h?.tomorrowProbability ?? weather?.rainProbabilityTomorrow ?? 50;
  const tomorrowTimeWindow = weather?.forecast24h?.tomorrowTimeWindow ?? weather?.rainTimeWindowTomorrow ?? "15:00 - 18:00 น.";

  const defaultDuration = todayProb >= 50 ? "คาดการณ์ตกต่อเนื่อง ~30 - 60 นาที" : "ไม่มีสัญญาณฝนต่อเนื่อง";

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
          { district: "เมืองสมุทรปราการ", probability: todayProb, todayProbability: todayProb, todayTimeWindow, tomorrowProbability: tomorrowProb, tomorrowTimeWindow, temperature: 29, status: weather?.weatherDesc || "ปกติ", timeWindow: todayTimeWindow, durationText: defaultDuration },
          { district: "บางพลี", probability: todayProb, todayProbability: todayProb, todayTimeWindow, tomorrowProbability: tomorrowProb, tomorrowTimeWindow, temperature: 29, status: weather?.weatherDesc || "ปกติ", timeWindow: todayTimeWindow, durationText: defaultDuration },
          { district: "พระประแดง", probability: todayProb, todayProbability: todayProb, todayTimeWindow, tomorrowProbability: tomorrowProb, tomorrowTimeWindow, temperature: 29, status: weather?.weatherDesc || "ปกติ", timeWindow: todayTimeWindow, durationText: defaultDuration },
          { district: "บางเสาธง", probability: todayProb, todayProbability: todayProb, todayTimeWindow, tomorrowProbability: tomorrowProb, tomorrowTimeWindow, temperature: 28, status: weather?.weatherDesc || "ปกติ", timeWindow: todayTimeWindow, durationText: defaultDuration },
          { district: "บางบ่อ", probability: todayProb, todayProbability: todayProb, todayTimeWindow, tomorrowProbability: tomorrowProb, tomorrowTimeWindow, temperature: 28, status: weather?.weatherDesc || "ปกติ", timeWindow: todayTimeWindow, durationText: defaultDuration },
          { district: "พระสมุทรเจดีย์", probability: todayProb, todayProbability: todayProb, todayTimeWindow, tomorrowProbability: tomorrowProb, tomorrowTimeWindow, temperature: 29, status: weather?.weatherDesc || "ปกติ", timeWindow: todayTimeWindow, durationText: defaultDuration }
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
      className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto"
    >
      <div className={`w-[90vw] max-w-[395px] sm:max-w-2xl lg:max-w-3xl my-auto m-auto border rounded-xl sm:rounded-2xl shadow-2xl relative max-h-[74vh] sm:max-h-[85vh] shrink-0 flex flex-col overflow-hidden transition-all ${
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
                <h3 className={`text-[12.5px] sm:text-base font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
        <div className="flex-1 overflow-y-auto custom-scrollbar-thin px-3 sm:px-5 py-2.5 sm:py-4 space-y-3 sm:space-y-4">
          {loadingWeather && !weather ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <span className="font-medium text-[11px]">กำลังปรับเทียบข้อมูลโทรมาตรสภาพอากาศ...</span>
            </div>
          ) : (
            <>
              {/* 1. HERO WEATHER & SEPARATED TODAY / TOMORROW RAIN RISK CARDS */}
              <div className={`p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border relative overflow-hidden transition-all ${
                isDark 
                  ? 'bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/40 border-slate-800' 
                  : 'bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-indigo-50/30 border-blue-200/70 shadow-2xs'
              }`}>
                {/* Top Row: Current Temperature & Telemetry */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
                      {weather?.temp ?? 29}°C
                    </span>
                    <div className="flex flex-col">
                      <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                        isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
                      }`}>
                        {getWeatherIcon(weather?.weatherCode ?? 2, weather?.precipitation ?? 0)}
                        <span>{weather?.weatherDesc || 'ท้องฟ้าโปร่ง มีเมฆบางส่วน'}</span>
                      </span>
                      {weather?.feelsLike && (
                        <span className={`text-[9.5px] sm:text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          รู้สึกเหมือน {weather.feelsLike}°C
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Micro Telemetry Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[9.5px] sm:text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                      isDark ? 'bg-slate-850 text-slate-300 border-slate-700' : 'bg-white/90 text-slate-600 border-slate-200'
                    }`}>
                      <Droplets className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-500 shrink-0" />
                      <span>ความชื้น {weather?.humidity ?? 72}%</span>
                    </span>
                    <span className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                      isDark ? 'bg-slate-850 text-slate-300 border-slate-700' : 'bg-white/90 text-slate-600 border-slate-200'
                    }`}>
                      <Wind className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-500 shrink-0" />
                      <span>ลม {weather?.windSpeedKmh ?? weather?.windSpeed ?? 14} กม./ชม.</span>
                    </span>
                    {weather?.thunderstormRisk && (
                      <span className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        weather.thunderstormRisk === 'สูง' || weather.thunderstormRisk === 'สูงมาก'
                          ? (isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-800 border-amber-200')
                          : (isDark ? 'bg-slate-850 text-slate-300 border-slate-700' : 'bg-white/90 text-slate-600 border-slate-200')
                      }`}>
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
                        <span>ฟ้าคะนอง: {weather.thunderstormRisk}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Explicitly Separated TODAY vs TOMORROW Forecast Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-2.5">
                  {/* Card 1: TODAY (วันนี้) */}
                  <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                    isRainingNow
                      ? (isDark ? 'bg-rose-950/50 border-rose-800/80' : 'bg-rose-50 border-rose-200')
                      : todayProb >= 60
                      ? (isDark ? 'bg-amber-950/40 border-amber-800/70' : 'bg-amber-50 border-amber-200')
                      : (isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200/90')
                  }`}>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 ${
                        isRainingNow
                          ? 'text-rose-600 dark:text-rose-400'
                          : todayProb >= 60
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-blue-700 dark:text-sky-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isRainingNow ? 'bg-rose-500 animate-ping' : todayProb >= 60 ? 'bg-amber-500' : 'bg-sky-500'
                        }`} />
                        <span>โอกาสฝนตก{todayShortLabel}</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/25">
                        วันนี้
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 my-0.5">
                      <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                        {todayProb}%
                      </span>
                      <span className={`text-[11px] sm:text-xs font-bold ${
                        isRainingNow
                          ? 'text-rose-600 dark:text-rose-400'
                          : todayProb >= 60
                          ? 'text-rose-600 dark:text-rose-400'
                          : todayProb >= 35
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isRainingNow ? 'ฝนกำลังตกขณะนี้' : todayProb >= 60 ? 'เสี่ยงฝนตกหนัก' : todayProb >= 35 ? 'เฝ้าระวังฝนฟ้าคะนอง' : 'โอกาสฝนน้อย'}
                      </span>
                    </div>

                    <div className={`mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[10px] sm:text-[11px] ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                        <span>ช่วงเวลาวันนี้: <strong className="text-slate-900 dark:text-white">{todayTimeWindow}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: TOMORROW (พรุ่งนี้) */}
                  <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                    tomorrowProb >= 60
                      ? (isDark ? 'bg-amber-950/35 border-amber-800/70' : 'bg-amber-50/80 border-amber-200')
                      : (isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-white border-slate-200/90')
                  }`}>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 ${
                        tomorrowProb >= 60
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-indigo-700 dark:text-indigo-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          tomorrowProb >= 60 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`} />
                        <span>แนวโน้มฝน{tomorrowShortLabel}</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25">
                        พรุ่งนี้
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 my-0.5">
                      <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                        {tomorrowProb}%
                      </span>
                      <span className={`text-[11px] sm:text-xs font-bold ${
                        tomorrowProb >= 60
                          ? 'text-rose-600 dark:text-rose-400'
                          : tomorrowProb >= 35
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {tomorrowProb >= 60 ? 'เสี่ยงฝนตกหนัก' : tomorrowProb >= 35 ? 'เฝ้าระวังฝนฟ้าคะนอง' : 'โอกาสฝนน้อย'}
                      </span>
                    </div>

                    <div className={`mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[10px] sm:text-[11px] ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span>ช่วงเวลาพรุ่งนี้: <strong className="text-slate-900 dark:text-white">{tomorrowTimeWindow}</strong></span>
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

              {/* 2. 24-HOUR HOURLY TIMELINE (HORIZONTAL SCROLLER WITH PC ARROWS & WHEEL SUPPORT) */}
              {hourlyData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <h4 className={`text-[11px] sm:text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        ไทม์ไลน์คาดการณ์ฝน 24 ชั่วโมงข้างหน้า
                      </h4>
                    </div>

                    {/* Desktop Scroll Controls */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-400 hidden sm:inline">หมุนเมาส์หรือคลิกลาก</span>
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          type="button"
                          onClick={() => handleScrollTimeline('left')}
                          className={`w-6 h-6 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                              : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-2xs'
                          }`}
                          title="เลื่อนไปทางซ้าย"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScrollTimeline('right')}
                          className={`w-6 h-6 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                              : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-2xs'
                          }`}
                          title="เลื่อนไปทางขวา"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div 
                      ref={timelineRef}
                      onWheel={handleTimelineWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUpOrLeave}
                      onMouseLeave={handleMouseUpOrLeave}
                      className={`timeline-scrollbar flex gap-1.5 overflow-x-auto pb-2 pt-0.5 px-0.5 scroll-smooth rounded-lg border p-1.5 cursor-grab active:cursor-grabbing select-none ${
                        isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      {hourlyData.map((h, i) => {
                        const isHighRain = h.probability >= 60;
                        const isModerateRain = h.probability >= 30;

                        return (
                          <div
                            key={i}
                            className={`flex flex-col items-center justify-between min-w-[56px] sm:min-w-[66px] p-1.5 rounded-lg border text-center transition-all shrink-0 pointer-events-none select-none ${
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

              {/* 3. 6 DISTRICTS TELEMETRY GRID (SEPARATED TODAY & TOMORROW) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    <CivicStationPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <h4 className={`text-[11px] sm:text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      โอกาสเกิดฝนและช่วงเวลา แยก 6 อำเภอ (วันนี้ vs พรุ่งนี้)
                    </h4>
                  </div>
                  <span className="text-[9px] text-slate-400">อัปเดตรายชั่วโมง</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {districtAnalysis.map((d, i) => {
                    const rawName = d.district.replace(/^(อ\.|อำเภอ)/, '').trim();
                    const fullName = rawName.includes('เมือง') ? 'อำเภอเมืองสมุทรปราการ' : `อำเภอ${rawName}`;
                    const isUserDistrict = currentDistrict && (currentDistrict.includes(rawName) || rawName.includes(currentDistrict));
                    const dTodayProb = d.todayProbability ?? d.probability ?? todayProb;
                    const dTodayWin = d.todayTimeWindow || d.timeWindow || todayTimeWindow;
                    const dTomProb = d.tomorrowProbability ?? tomorrowProb;
                    const dTomWin = d.tomorrowTimeWindow || tomorrowTimeWindow;

                    const getProbColor = (p, raining = false) => {
                      if (raining || p >= 60) return 'text-rose-600 dark:text-rose-400 font-bold';
                      if (p >= 35) return 'text-amber-600 dark:text-amber-400 font-bold';
                      return 'text-emerald-600 dark:text-emerald-400 font-bold';
                    };

                    return (
                      <div 
                        key={i}
                        className={`p-2.5 rounded-lg border text-xs transition-all ${
                          isUserDistrict
                            ? (isDark 
                                ? 'bg-blue-950/50 border-blue-600/80 shadow-2xs ring-1 ring-blue-500/20' 
                                : 'bg-blue-50/70 border-blue-300 shadow-2xs ring-1 ring-blue-500/10')
                            : (isDark 
                                ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' 
                                : 'bg-white border-slate-200/90 hover:border-slate-300')
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-slate-200/60 dark:border-slate-800/80">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className={`font-bold text-[11.5px] sm:text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
                              <span className={`text-[9.5px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {d.temperature}°C
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Separated Today & Tomorrow Rows */}
                        <div className="mt-1.5 space-y-1 text-[10px] sm:text-[10.5px]">
                          {/* Row 1: Today */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/25 shrink-0">
                                วันนี้
                              </span>
                              <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                {dTodayWin}
                              </span>
                            </div>
                            <span className={`font-mono shrink-0 ${getProbColor(dTodayProb, d.isRainingNow)}`}>
                              {d.isRainingNow ? `ตกขณะนี้ (${dTodayProb}%)` : `โอกาส ${dTodayProb}%`}
                            </span>
                          </div>

                          {/* Row 2: Tomorrow */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 shrink-0">
                                พรุ่งนี้
                              </span>
                              <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                {dTomWin}
                              </span>
                            </div>
                            <span className={`font-mono shrink-0 ${getProbColor(dTomProb, false)}`}>
                              โอกาส {dTomProb}%
                            </span>
                          </div>
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
        <div className={`px-3 py-2 sm:px-5 sm:py-3 border-t flex items-center justify-between gap-2 text-xs shrink-0 ${
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
            <CivicRadar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="group-hover:underline">เรดาร์ตรวจฝนสด (กทม.-สมุทรปราการ)</span>
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 opacity-70" />
          </a>

          <button
            type="button"
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-md sm:rounded-lg font-semibold text-[11px] sm:text-xs border transition-colors cursor-pointer ${
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
