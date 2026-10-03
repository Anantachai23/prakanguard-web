import React, { useState, useEffect } from 'react';
import { X, Radio, CloudRain, Clock, Thermometer, Droplets, ExternalLink, Calendar } from 'lucide-react';
import { getLiveSamutPrakanWeather } from '../services/weatherService';

export default function AiForecastModal({ isOpen, onClose, theme = 'light' }) {
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const isDark = theme === 'dark';

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

  const todayDate = new Date();
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const todayTitle = `วัน${thaiDays[todayDate.getDay()]}ที่ ${todayDate.getDate()} ${thaiMonths[todayDate.getMonth()]}`;

  const isRainingNow = weather?.forecast24h?.isRainingNow;
  const maxProb = weather?.rainProbabilityToday ?? 50;

  let rainTimeToday = "ไม่มีสัญญาณฝนตกหนัก";
  if (isRainingNow) {
    rainTimeToday = "ขณะนี้มีฝนตกอยู่ในพื้นที่";
  } else if (weather?.forecast24h?.startTimeText) {
    rainTimeToday = weather.forecast24h.startTimeText.replace('เริ่มราว ', '').replace('เริ่มประมาณ ', '');
  } else if (weather?.peakHour) {
    rainTimeToday = weather.peakHour;
  } else if (maxProb >= 60) {
    rainTimeToday = "ช่วงบ่ายถึงเย็น (15:00 - 18:30 น.)";
  } else if (maxProb >= 40) {
    rainTimeToday = "ช่วงเย็นถึงค่ำ (16:30 - 19:30 น.)";
  }

  const districtAnalysis = weather?.forecast24h?.districtRainAnalysis || [
    { district: "เมืองสมุทรปราการ", probability: 70, timeWindow: "15:00 - 17:30 น." },
    { district: "บางพลี", probability: 65, timeWindow: "15:30 - 18:00 น." },
    { district: "พระประแดง", probability: 60, timeWindow: "16:00 - 18:00 น." },
    { district: "บางเสาธง", probability: 55, timeWindow: "16:00 - 18:30 น." },
    { district: "บางบ่อ", probability: 50, timeWindow: "16:30 - 18:30 น." },
    { district: "พระสมุทรเจดีย์", probability: 45, timeWindow: "17:00 - 19:00 น." }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-lg border rounded-3xl shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2.5 rounded-2xl shrink-0 ${
              isDark ? 'bg-blue-950 text-cyan-400 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                คาดการณ์ฝนตก
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
          <div className="mt-4 space-y-4">
            
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
                    : maxProb >= 60
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  โอกาส {maxProb}%
                </span>
              </div>
              <div className={`text-lg sm:text-xl font-black ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
                {rainTimeToday}
              </div>
              <div className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {weather?.weatherDesc || 'มีเมฆเป็นส่วนมาก'} • อุณหภูมิ {weather?.temp || 32}°C
              </div>
            </div>

            {/* 6 Districts Simple Breakdown */}
            <div>
              <h4 className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                คาดการณ์แยกตามอำเภอ:
              </h4>
              <div className="space-y-1.5">
                {districtAnalysis.map((d, i) => (
                  <div 
                    key={i}
                    className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isDark ? 'bg-slate-850/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>🌦️</span>
                      <span className="font-semibold">อ.{d.district}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono ${isDark ? 'text-cyan-300' : 'text-blue-600'}`}>
                        {d.timeWindow ? d.timeWindow.replace('ช่วงบ่าย ', '').replace('ช่วงเย็น ', '') : 'บ่าย-เย็น'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        d.probability >= 60 
                          ? (isDark ? 'bg-amber-950 text-amber-300' : 'bg-amber-100 text-amber-800')
                          : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600')
                      }`}>
                        {d.probability}%
                      </span>
                    </div>
                  </div>
                ))}
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
                className={`font-semibold flex items-center gap-1.5 transition-colors ${
                  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>เปิดดูเรดาร์ตรวจฝนสด (กทม./สมุทรปราการ)</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={onClose}
                className={`px-4 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
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
