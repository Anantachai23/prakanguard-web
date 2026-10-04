import React, { useState, useEffect } from 'react';
import { X, Radio, CloudRain, Clock, Thermometer, Droplets, ExternalLink, Calendar } from 'lucide-react';
import { getLiveSamutPrakanWeather } from '../services/weatherService';
import { playClickSound, playCloseSound } from '../services/soundEffects';

export default function AiForecastModal({ isOpen, onClose, userDistrict, theme = 'light' }) {
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const isDark = theme === 'dark';

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

  useEffect(() => {
    if (isOpen) {
      setLoadingWeather(true);
      getLiveSamutPrakanWeather()
        .then(data => {
          setWeather(data);
          setLoadingWeather(false);
        })
        .catch(err => {
          console.warn("Error fetching weather in modal:", err);
          setLoadingWeather(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayDate = currentDate;
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const todayTitle = `วัน${thaiDays[todayDate.getDay()]}ที่ ${todayDate.getDate()} ${thaiMonths[todayDate.getMonth()]}`;

  const isRainingNow = weather?.forecast24h?.isRainingNow;
  const maxProb = weather?.rainProbabilityToday ?? 50;

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
          { district: "เมืองสมุทรปราการ", probability: maxProb, temperature: 26, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "บางพลี", probability: maxProb, temperature: 26, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "พระประแดง", probability: maxProb, temperature: 26, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "บางเสาธง", probability: maxProb, temperature: 25, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "บางบ่อ", probability: maxProb, temperature: 25, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration },
          { district: "พระสมุทรเจดีย์", probability: maxProb, temperature: 27, status: weather?.weatherDesc || "ปกติ", timeWindow: rainTimeToday, durationText: defaultDuration }
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
  const matchedDistrict = isAllDistricts ? null : (districtAnalysis.find(d => d.district.includes(currentDistrict) || currentDistrict.includes(d.district)) || districtAnalysis[0]);
  const userDistrictProb = matchedDistrict ? matchedDistrict.probability : maxProb;
  const displayDistrictLabel = isAllDistricts ? 'ทุกอำเภอ (จ.สมุทรปราการ)' : `อ.${currentDistrict}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-[92vw] sm:max-w-lg border rounded-3xl shadow-2xl p-3.5 sm:p-6 relative max-h-[80vh] sm:max-h-[85vh] overflow-y-auto smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`p-2.5 rounded-2xl shrink-0 ${
              isDark ? 'bg-blue-950 text-cyan-400 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-base sm:text-lg font-bold break-words leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                คาดการณ์ฝนตก
              </h3>
              <p className={`text-xs break-words whitespace-normal leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {todayTitle} • จ.สมุทรปราการ
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingWeather ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></span>
            <span>กำลังดึงข้อมูลคาดการณ์สภาพอากาศล่าสุด...</span>
          </div>
        ) : (
          <div className="mt-4 space-y-3.5">
            
            {/* User District Highlight Banner */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? 'bg-blue-950/60 border-cyan-500/40 text-cyan-200' : 'bg-blue-50/90 border-blue-300 text-blue-900'
            }`}>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold flex items-center gap-1.5 opacity-90">
                  <span className="text-sm">📍</span>
                  <span>ตำแหน่งปัจจุบันของคุณ:</span>
                </span>
                <span className="text-sm sm:text-base font-extrabold mt-0.5 block leading-tight">
                  {isAllDistricts ? 'ภาพรวมพื้นที่สมุทรปราการ' : 'ตำแหน่งของท่าน '}{displayDistrictLabel}
                </span>
              </div>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold shrink-0 ${
                userDistrictProb >= 60 
                  ? (isDark ? 'bg-amber-900/60 text-amber-300 border border-amber-600' : 'bg-amber-100 text-amber-900 border border-amber-300')
                  : (isDark ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-600' : 'bg-blue-100 text-blue-800 border border-blue-200')
              }`}>
                {userDistrictProb >= 60 ? 'เฝ้าระวัง' : 'ปกติ'}
              </span>
            </div>

            {/* Primary Spotlight Card: วันนี้มีโอกาสตกกี่โมง */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-blue-50/70 border-blue-200'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-blue-900'}`}>
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>เวลาที่มีโอกาสฝนตกวันนี้</span>
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isRainingNow
                    ? 'bg-rose-500 text-white'
                    : (userDistrictProb || maxProb) >= 60
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  โอกาส {userDistrictProb || maxProb}%
                </span>
              </div>
              <div className={`text-lg sm:text-xl font-black break-words leading-snug ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                {rainTimeToday}
              </div>
              <div className={`text-xs mt-1 font-medium break-words leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {weather?.weatherDesc || 'มีเมฆเป็นส่วนมาก'} • อุณหภูมิ {weather?.temp || 32}°C
              </div>
            </div>

            {/* 6 Districts Simple Breakdown */}
            <div>
              <h4 className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                คาดการณ์โอกาสเกิดฝนและช่วงเวลาแยกตามอำเภอ:
              </h4>
              <div className="space-y-2">
                {districtAnalysis.map((d, i) => {
                  const districtName = d.district.startsWith('อำเภอ') || d.district.startsWith('อ.') 
                    ? d.district 
                    : `อำเภอ${d.district}`;
                  return (
                    <div 
                      key={i}
                      className={`p-2.5 rounded-2xl border flex flex-col justify-between text-xs transition-colors ${
                        isDark ? 'bg-slate-850/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="shrink-0">{d.icon || '🌦️'}</span>
                          <span className="font-bold break-words text-slate-900 dark:text-white">{districtName}</span>
                          {d.temperature && (
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              {d.temperature}°C
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg font-bold text-[11px] border shrink-0 ${
                          d.probability >= 60 
                            ? (isDark ? 'bg-amber-950/90 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-900 border-amber-300')
                            : (isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300')
                        }`}>
                          โอกาส {d.probability}%
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 text-[11px] pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80">
                        <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
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

            {/* Clean Radar Link */}
            <div className={`pt-3 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <a
                href="https://weather.bangkok.go.th/radar"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playClickSound()}
                className={`font-semibold flex items-center gap-1.5 transition-colors active:scale-95 ${
                  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>เปิดดูเรดาร์ตรวจฝนสด (กทม./สมุทรปราการ)</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => {
                  playCloseSound();
                  onClose();
                }}
                className={`px-4 py-1.5 rounded-xl font-medium transition-all cursor-pointer active:scale-95 ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                ปิด
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
