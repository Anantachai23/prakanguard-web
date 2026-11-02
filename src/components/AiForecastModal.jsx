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
  let todayTimeWindow = weather?.forecast24h?.todayTimeWindow ?? weather?.rainTimeWindowToday ?? "ไม่มีฝนตก";
  if (todayTimeWindow.includes('ไม่มีเกณฑ์ฝนตก') || (!isRainingNow && todayProb < 35 && todayTimeWindow.includes('ขณะนี้'))) {
    todayTimeWindow = 'ไม่มีฝนตก';
  }
  let todayContDuration = weather?.forecast24h?.todayContinuousDuration ?? weather?.rainContinuousDurationToday ?? (todayProb >= 35 ? "ต่อเนื่อง ~1–2 ชั่วโมง" : "ไม่มีฝนต่อเนื่อง");
  if (todayContDuration.includes('ไม่ตกต่อเนื่อง') || (!isRainingNow && todayProb < 35)) {
    todayContDuration = 'ไม่มีฝนต่อเนื่อง';
  }

  const tomorrowProb = weather?.forecast24h?.tomorrowProbability ?? weather?.rainProbabilityTomorrow ?? 50;
  let tomorrowTimeWindow = weather?.forecast24h?.tomorrowTimeWindow ?? weather?.rainTimeWindowTomorrow ?? "15:00 – 17:00 น.";
  if (tomorrowTimeWindow.includes('ไม่มีเกณฑ์ฝนตก')) tomorrowTimeWindow = 'ไม่มีฝนตก';
  let tomorrowContDuration = weather?.forecast24h?.tomorrowContinuousDuration ?? weather?.rainContinuousDurationTomorrow ?? (tomorrowProb >= 35 ? "ต่อเนื่อง ~1–2 ชั่วโมง" : "ไม่มีฝนต่อเนื่อง");
  if (tomorrowContDuration.includes('ไม่ตกต่อเนื่อง')) tomorrowContDuration = 'ไม่มีฝนต่อเนื่อง';

  const defaultDuration = todayContDuration;

  // ดึงข้อมูล 6 อำเภอ
  const storedDistrictTemps = (() => {
    try {
      const s = localStorage.getItem('prakanguard_live_district_temps_v3');
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
      className="fixed inset-0 z-[2000] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 py-8 sm:py-8 overflow-y-auto overscroll-contain"
    >
      <div className={`w-full max-w-[calc(100vw-28px)] xs:max-w-[460px] sm:max-w-2xl lg:max-w-3xl my-auto m-auto border rounded-2xl shadow-2xl relative max-h-[76vh] sm:max-h-[82vh] shrink-0 flex flex-col overflow-hidden transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between gap-2 px-4 py-3 border-b shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-800 text-sky-400 border-slate-700' : 'bg-white text-slate-900 border-slate-200 shadow-2xs'
            }`}>
              <CivicWeather className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                พยากรณ์ฝนและสภาพอากาศ 24 ชั่วโมง
              </h3>
              <p className={`text-[11px] sm:text-xs leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
              <div className={`p-3 sm:p-4 rounded-xl border relative overflow-hidden transition-all ${
                isDark 
                  ? 'bg-slate-900 border-slate-800' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Top Row: Current Temperature & Telemetry */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
                      {weather?.temp ?? 29}°C
                    </span>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                        isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-200'
                      }`}>
                        {getWeatherIcon(weather?.weatherCode ?? 2, weather?.precipitation ?? 0)}
                        <span>{weather?.weatherDesc || 'ท้องฟ้าโปร่ง'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Micro Telemetry Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                      isDark ? 'bg-slate-850 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'
                    }`}>
                      <Droplets className="w-3 h-3 text-sky-500 shrink-0" />
                      <span>ความชื้น {weather?.humidity ?? 72}%</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
                      isDark ? 'bg-slate-850 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'
                    }`}>
                      <Wind className="w-3 h-3 text-cyan-500 shrink-0" />
                      <span>ลม {weather?.windSpeedKmh ?? weather?.windSpeed ?? 14} กม./ชม.</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Explicitly Separated TODAY vs TOMORROW Forecast Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                  {/* Card 1: TODAY (วันนี้) */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isRainingNow
                      ? (isDark ? 'bg-rose-950/50 border-rose-800/80' : 'bg-rose-50 border-rose-200')
                      : todayProb >= 60
                      ? (isDark ? 'bg-amber-950/40 border-amber-800/70' : 'bg-amber-50 border-amber-200')
                      : (isDark ? 'bg-slate-900 border-slate-700/80' : 'bg-white border-slate-200')
                  }`}>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        พยากรณ์{todayShortLabel}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                        isRainingNow
                          ? 'bg-rose-600 text-white'
                          : todayProb >= 60
                          ? 'bg-amber-400 text-slate-950'
                          : todayProb >= 35
                          ? 'bg-[#b8f338] text-slate-950'
                          : (isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-100 text-emerald-800')
                      }`}>
                        {isRainingNow ? 'กำลังตก' : `โอกาส ${todayProb}%`}
                      </span>
                    </div>

                    <div className={`mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs`}>
                      <div>
                        <span className="text-[11px] text-slate-400 block">เวลาที่คาดว่าจะตก</span>
                        <strong className="text-slate-900 dark:text-white block mt-0.5">{todayTimeWindow}</strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">ตกติดกันต่อเนื่อง</span>
                        <strong className={`block mt-0.5 ${todayProb >= 35 ? 'text-sky-600 dark:text-sky-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {todayContDuration}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: TOMORROW (พรุ่งนี้) */}
                  <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isDark ? 'bg-slate-900 border-slate-700/80' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        แนวโน้ม{tomorrowShortLabel}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                        tomorrowProb >= 60
                          ? 'bg-amber-400 text-slate-950'
                          : (isDark ? 'bg-slate-800 text-sky-300' : 'bg-slate-100 text-slate-800')
                      }`}>
                        โอกาส {tomorrowProb}%
                      </span>
                    </div>

                    <div className={`mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs`}>
                      <div>
                        <span className="text-[11px] text-slate-400 block">ช่วงเวลาพรุ่งนี้</span>
                        <strong className="text-slate-900 dark:text-white block mt-0.5">{tomorrowTimeWindow}</strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">ตกติดกันต่อเนื่อง</span>
                        <strong className={`block mt-0.5 ${tomorrowProb >= 35 ? 'text-sky-600 dark:text-sky-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {tomorrowContDuration}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. 24-HOUR HOURLY TIMELINE (HORIZONTAL SCROLLER WITH PC ARROWS & WHEEL SUPPORT) */}
              {hourlyData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      ไทม์ไลน์รายชั่วโมง (24 ชม.)
                    </h4>

                    {/* Desktop Scroll Controls */}
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 ml-1">
                        <button
                          type="button"
                          onClick={() => handleScrollTimeline('left')}
                          className={`w-6 h-6 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                              : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
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
                              : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
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
                      className={`timeline-scrollbar flex gap-1.5 overflow-x-auto pb-2 pt-0.5 px-0.5 scroll-smooth rounded-xl border p-2 cursor-grab active:cursor-grabbing select-none ${
                        isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {hourlyData.map((h, i) => {
                        const isHighRain = h.probability >= 60;
                        const isModerateRain = h.probability >= 35;

                        return (
                          <div
                            key={i}
                            className={`flex flex-col items-center justify-between min-w-[60px] sm:min-w-[68px] p-2 rounded-lg border text-center transition-all shrink-0 pointer-events-none select-none ${
                              h.isNow
                                ? (isDark 
                                    ? 'bg-slate-800 border-sky-500 text-white font-bold' 
                                    : 'bg-slate-900 border-slate-900 text-white font-bold')
                                : (isDark 
                                    ? 'bg-slate-900/80 border-slate-800 text-slate-300' 
                                    : 'bg-white border-slate-200/90 text-slate-700')
                            }`}
                          >
                            <span className="text-[10.5px] font-mono leading-tight">
                              {h.isNow ? 'ตอนนี้' : h.time}
                              {h.isTomorrow && (
                                <span className="block text-[9px] opacity-70">พรุ่งนี้</span>
                              )}
                            </span>

                            <div className="my-1.5 flex items-center justify-center">
                              {getWeatherIcon(h.weatherCode, h.precipitation)}
                            </div>

                            <span className={`text-[11px] font-mono font-bold ${
                              isHighRain 
                                ? 'text-rose-500' 
                                : isModerateRain 
                                ? 'text-amber-500' 
                                : 'text-emerald-500'
                            }`}>
                              {h.probability}%
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
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    พยากรณ์แยก 6 อำเภอ
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {districtAnalysis.map((d, i) => {
                    const rawName = d.district.replace(/^(อ\.|อำเภอ)/, '').trim();
                    const fullName = rawName.includes('เมือง') ? 'อ.เมืองสมุทรปราการ' : `อ.${rawName}`;
                    const isUserDistrict = currentDistrict && (currentDistrict.includes(rawName) || rawName.includes(currentDistrict));
                    const dTodayProb = d.todayProbability ?? d.probability ?? todayProb;
                    const hasRainToday = Boolean(d.isRainingNow || dTodayProb >= 35);

                    let dTodayWin = d.todayTimeWindow || d.timeWindow || todayTimeWindow;
                    if (dTodayWin.includes('ไม่มีเกณฑ์ฝนตก') || (!hasRainToday && dTodayWin.includes('ขณะนี้'))) {
                      dTodayWin = 'ไม่มีฝนตก';
                    }

                    let dTodayCont = d.todayContinuousDuration || d.durationText || todayContDuration;
                    if (dTodayCont.includes('ไม่ตกต่อเนื่อง') || !hasRainToday) {
                      dTodayCont = 'ไม่มีฝนต่อเนื่อง';
                    }

                    const dTomProb = d.tomorrowProbability ?? tomorrowProb;
                    let dTomWin = d.tomorrowTimeWindow || tomorrowTimeWindow;
                    if (dTomWin.includes('ไม่มีเกณฑ์ฝนตก')) dTomWin = 'ไม่มีฝนตก';

                    return (
                      <div 
                        key={i}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isUserDistrict
                            ? (isDark 
                                ? 'bg-slate-850 border-sky-400' 
                                : 'bg-white border-2 border-slate-900 shadow-xs')
                            : (isDark 
                                ? 'bg-slate-950/40 border-slate-800' 
                                : 'bg-white border-slate-200/90')
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`font-bold text-xs sm:text-[13px] truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {fullName}
                            </span>
                            {d.temperature && (
                              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {d.temperature}°C
                              </span>
                            )}
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ${
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
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>วันนี้: ไม่มีเกณฑ์ฝนตก</span>
                            <span className="text-slate-400">
                              พรุ่งนี้ {dTomProb}% ({dTomWin})
                            </span>
                          </div>
                        )}
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
