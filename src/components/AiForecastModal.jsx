import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ShieldCheck, Radio, Waves, CloudRain, MapPin, Compass, Thermometer, Droplets, AlertTriangle } from 'lucide-react';
import { OFFICIAL_DATA_SOURCES } from '../services/aiPredictor';
import { getLiveSamutPrakanWeather } from '../services/weatherService';
import RainForecast24hCard from './RainForecast24hCard';

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-2xl border rounded-3xl shadow-2xl p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl border ${
              isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>ศูนย์ข้อมูลสภาพอากาศและเรดาร์ฝน</span>
              </h3>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                อ้างอิงข้อมูลเปิดและประกาศสาธารณะ: TMD • กรมอุทกศาสตร์ • ECMWF
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

        {/* 1. Next 24h Rain Forecast (Google Weather Model) */}
        {weather?.forecast24h && (
          <div className="mt-4">
            <RainForecast24hCard 
              forecast={weather.forecast24h} 
              theme={theme} 
            />
          </div>
        )}

        {/* 1. Live Weather & Rain Forecast Card */}
        <div className={`mt-4 p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`flex flex-wrap items-center justify-between gap-1.5 pb-2.5 border-b ${isDark ? 'border-slate-750' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <CloudRain className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                สถานการณ์ฝนและสภาพอากาศ จ.สมุทรปราการ (สด)
              </span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
              isDark ? 'bg-blue-950/80 text-cyan-300 border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              พยากรณ์สด Real-time
            </span>
          </div>

          {loadingWeather ? (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              <span>กำลังดึงข้อมูลพยากรณ์อากาศสดจากดาวเทียมและเรดาร์...</span>
            </div>
          ) : weather ? (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className={`p-2.5 rounded-xl border shadow-xs ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>อุณหภูมิผิวพื้น</span>
                  <span className={`text-base sm:text-lg font-bold flex items-center gap-1 mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Thermometer className="w-4 h-4 text-amber-500" />
                    <span>{weather.temp}°C</span>
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{weather.weatherDesc}</span>
                </div>

                <div className={`p-2.5 rounded-xl border shadow-xs ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>โอกาสฝนตกวันนี้</span>
                  <span className={`text-base sm:text-lg font-bold flex items-center gap-1 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                    <CloudRain className="w-4 h-4" />
                    <span>{weather.rainProbabilityToday}%</span>
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ฝนสะสม ~{weather.rainSumToday} มม.</span>
                </div>

                <div className={`p-2.5 rounded-xl border shadow-xs ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ช่วงเสี่ยงสูงสุด</span>
                  <span className={`text-xs sm:text-sm font-bold mt-1 block truncate ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    {weather.peakHour}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>เฝ้าระวังน้ำท่วมขัง</span>
                </div>

                <div className={`p-2.5 rounded-xl border shadow-xs ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ระดับการแจ้งเตือน</span>
                  <span className={`text-xs sm:text-sm font-bold mt-1 block ${
                    weather.rainAlertLevel.includes('หนัก') ? 'text-rose-500' :
                    weather.rainAlertLevel.includes('เฝ้าระวัง') ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {weather.rainAlertLevel}
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ความชื้น {weather.humidity}%</span>
                </div>
              </div>

              {/* Rain Probability Progress Bar */}
              <div>
                <div className={`flex justify-between text-[11px] mb-1 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <span>ดัชนีโอกาสฝนตกในพื้นที่:</span>
                  <strong className={`font-bold ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>{weather.rainProbabilityToday}%</strong>
                </div>
                <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      weather.rainProbabilityToday >= 70 ? 'bg-gradient-to-r from-amber-500 to-rose-500' :
                      weather.rainProbabilityToday >= 40 ? 'bg-gradient-to-r from-blue-500 to-amber-500' :
                      'bg-gradient-to-r from-teal-500 to-blue-500'
                    }`}
                    style={{ width: `${weather.rainProbabilityToday}%` }}
                  ></div>
                </div>
              </div>

              <p className={`text-[11px] flex flex-wrap items-center justify-between gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span>แหล่งข้อมูล: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{weather.sourceAgency}</strong></span>
                <span>อัปเดต: {weather.lastUpdated}</span>
              </p>
            </div>
          ) : null}
        </div>

        {/* 2. Advisory Card */}
        <div className={`mt-4 p-4 rounded-2xl border ${
          isDark ? 'bg-blue-950/40 border-blue-900 text-blue-200' : 'bg-blue-50/80 border-blue-200'
        }`}>
          <div className="flex items-start gap-2.5">
            <Waves className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ช่องทางตรวจสอบประกาศและข้อมูลเปิดของทางการ
              </h4>
              <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                เพื่อความแม่นยำสูงสุดในการติดตามสถานการณ์ ประชาชนสามารถกดเข้าตรวจสอบตารางระดับน้ำขึ้น-น้ำลง และภาพเรดาร์กลุ่มฝนสด จากเว็บไซต์ทางการของแต่ละหน่วยงานได้โดยตรงผ่านลิงก์ด้านล่างนี้ครับ
              </p>
            </div>
          </div>
        </div>

        {/* 3. Official Channels Grid */}
        <div className="mt-4 space-y-3">
          <h5 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            ช่องทางตรวจสอบข้อมูลและประกาศของหน่วยงานภาครัฐ
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OFFICIAL_DATA_SOURCES.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer shadow-xs ${
                  isDark 
                    ? 'bg-slate-850/80 border-slate-750 hover:border-blue-400 hover:bg-slate-800' 
                    : 'bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-xs ${
                      isDark ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'bg-white text-blue-700 border-slate-200'
                    }`}>
                      {source.badge}
                    </span>
                    <ExternalLink className={`w-4 h-4 transition-colors ${
                      isDark ? 'text-slate-500 group-hover:text-cyan-400' : 'text-slate-400 group-hover:text-blue-600'
                    }`} />
                  </div>

                  <h6 className={`text-sm font-bold mt-2 transition-colors ${
                    isDark ? 'text-white group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-blue-600'
                  }`}>
                    {source.agency}
                  </h6>
                  <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                    {source.station}
                  </p>
                  <p className={`text-xs mt-1.5 leading-relaxed line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {source.desc}
                  </p>
                </div>

                <div className={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-slate-750 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}>
                  <span>ประเภท: {source.type}</span>
                  <span className={`font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${
                    isDark ? 'text-cyan-400' : 'text-blue-600'
                  }`}>
                    เปิดดู &rarr;
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 4. Tide Knowledge for Samut Prakan */}
        <div className={`mt-4 p-4 rounded-2xl border text-xs sm:text-sm space-y-2 ${
          isDark ? 'bg-slate-850/80 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <h5 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Compass className="w-4 h-4 text-amber-500" />
            <span>เกร็ดความรู้เรื่องน้ำทะเลหนุนในสมุทรปราการ [กรมอุทกศาสตร์ กองทัพเรือ]</span>
          </h5>
          <p className="leading-relaxed">
            • <strong>ช่วงน้ำเกิด (Spring Tide):</strong> มักเกิดขึ้นช่วง <strong>วันขึ้น 15 ค่ำ และ แรม 15 ค่ำ</strong> (วันเพ็ญและวันเดือนดับ) ระดับน้ำทะเลจะหนุนสูงที่สุดในรอบเดือน ส่งผลกระทบต่อ อ.พระประแดง, ตลาดปากน้ำ และ อ.บางบ่อ
          </p>
          <p className="leading-relaxed">
            • <strong>สถานีตรวจวัดป้อมพระจุลจอมเกล้า:</strong> หากระดับน้ำสูงเกิน <strong>+1.70 เมตร รทก.</strong> มักจะเริ่มมีน้ำเอ่อล้นเข้าท่วมถนนสายหลักริมแม่น้ำเจ้าพระยา
          </p>
        </div>

        {/* Close Button */}
        <div className={`mt-5 pt-3 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-750 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
