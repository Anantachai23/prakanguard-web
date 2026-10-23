import React, { useState, useEffect } from 'react';
import { X, Clock, ExternalLink } from 'lucide-react';
import { getLiveSamutPrakanWeather } from '../services/weatherService';
import { playClickSound, playCloseSound } from '../services/soundEffects';
import { CivicRadar, CivicWeather, CivicStationPin } from './CivicIcons';

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
  const maxProb = weather?.forecast24h?.maxProbability ?? weather?.rainProbabilityToday ?? 50;

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
  const displayDistrictLabel = isAllDistricts ? 'ภาพรวม 6 อำเภอ จ.สมุทรปราการ' : `อำเภอ${currentDistrict}`;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className={`w-[92vw] max-w-[440px] sm:max-w-lg my-auto m-auto border rounded-xl shadow-2xl relative max-h-[84vh] sm:max-h-[86vh] flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Top Institutional Bar */}
        <div className="h-1 w-full bg-blue-700 shrink-0" />
        
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border-b shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-white text-blue-700 border-slate-200 shadow-2xs'
            }`}>
              <CivicWeather className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                พยากรณ์ฝนและสภาพอากาศรายอำเภอ
              </h3>
              <p className={`text-[11px] sm:text-xs leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {todayTitle} • จ.สมุทรปราการ (Open-Meteo API)
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4">
          {loadingWeather ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span>กำลังดึงข้อมูลพยากรณ์อากาศล่าสุด...</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Top Summary Card */}
              <div className={`p-3.5 rounded-lg border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CivicStationPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-xs font-bold truncate">
                      {displayDistrictLabel}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                    isRainingNow || matchedDistrict?.isRainingNow
                      ? (isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200')
                      : (userDistrictProb || maxProb) >= 60
                      ? (isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200')
                      : (isDark ? 'bg-blue-950 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200')
                  }`}>
                    {isRainingNow || matchedDistrict?.isRainingNow ? 'ฝนตกขณะนี้' : `โอกาสฝน ${userDistrictProb || maxProb}%`}
                  </span>
                </div>

                <div className="pt-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ช่วงเวลาที่คาดว่าจะมีฝน
                    </span>
                    <div className={`text-sm sm:text-base font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {matchedDistrict?.timeWindow ? matchedDistrict.timeWindow : rainTimeToday}
                    </div>
                  </div>
                  <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {matchedDistrict?.durationText || defaultDuration} • {matchedDistrict?.temperature || weather?.temp || 30}°C
                  </div>
                </div>
              </div>

              {/* 6 Districts Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    ตารางคาดการณ์รายอำเภอ (6 อำเภอ)
                  </h4>
                  <span className="text-[10px] text-slate-400">อัปเดตอัตโนมัติรายชั่วโมง</span>
                </div>

                <div className={`rounded-lg border divide-y overflow-hidden ${
                  isDark ? 'border-slate-800 divide-slate-800 bg-slate-950/40' : 'border-slate-200 divide-slate-200 bg-white'
                }`}>
                  {districtAnalysis.map((d, i) => {
                    const districtName = d.district.startsWith('อำเภอ') || d.district.startsWith('อ.') 
                      ? d.district 
                      : `อ.${d.district}`;
                    return (
                      <div 
                        key={i}
                        className="p-3 flex flex-col gap-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                              {districtName}
                            </span>
                            {d.temperature && (
                              <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded border ${
                                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {d.temperature}°C
                              </span>
                            )}
                            {d.rainIntensityText && !d.isRainingNow && d.hasForecastRain && (
                              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                {d.rainIntensityText}
                              </span>
                            )}
                          </div>

                          <span className={`px-2 py-0.5 rounded font-bold text-[10.5px] border shrink-0 font-mono ${
                            d.isRainingNow
                              ? (isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200')
                              : d.probability >= 60 
                              ? (isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200')
                              : d.probability >= 40
                              ? (isDark ? 'bg-blue-950 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200')
                              : (isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200')
                          }`}>
                            {d.isRainingNow ? 'ฝนตกขณะนี้' : `โอกาส ${d.probability}%`}
                          </span>
                        </div>

                        <div className={`flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>{d.timeWindow || 'ไม่มีแนวโน้มฝนตกหนัก'}</span>
                          </span>
                          <span>{d.durationText || 'ไม่มีสัญญาณฝนต่อเนื่อง'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-2.5 sm:px-5 sm:py-3 border-t flex items-center justify-between text-xs shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <a
            href="https://weather.bangkok.go.th/radar"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playClickSound()}
            className={`font-semibold flex items-center gap-1.5 text-[11px] sm:text-xs transition-colors ${
              isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'
            }`}
          >
            <CivicRadar className="w-3.5 h-3.5 shrink-0" />
            <span>เปิดเรดาร์ตรวจอากาศสด (กทม./สมุทรปราการ)</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>

          <button
            type="button"
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs border transition-colors cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
