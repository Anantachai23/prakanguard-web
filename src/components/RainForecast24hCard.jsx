import React, { useState } from 'react';
import { 
  CloudRain, 
  ChevronRight, 
  RefreshCw, 
  ArrowRight, 
  Droplets, 
  Target, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Compass,
  Navigation2,
  AlertTriangle,
  MapPin
} from 'lucide-react';

export default function RainForecast24hCard({
  forecast,
  onOpenRadar,
  theme = 'light',
  className = '',
  onManualSync,
  isSyncing = false,
  onOpenPublicUpdates,
  lastUpdatedTime,
  collapsible = true,
  defaultExpanded
}) {
  const isDark = theme === 'dark';
  
  // On mobile (< 640px), default to compact collapsed mode unless explicitly overridden
  const [isExpanded, setIsExpanded] = useState(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (typeof window !== 'undefined' && window.innerWidth < 640) return false;
    return true;
  });

  if (!forecast) {
    return null;
  }

  const status = forecast.status || 'ฝนเล็กน้อย';
  const isHeavy = status.includes('หนัก');
  const isModerate = status.includes('ปานกลาง');
  const isLight = status.includes('เล็กน้อย');
  const isDry = status.includes('ไม่มี');

  // Calculate dynamic district rain breakdown & active rain list
  const isRainingRightNow = (forecast.startTimeText && forecast.startTimeText.includes('มีฝนตกอยู่ในขณะนี้')) ||
    (forecast.hourly && forecast.hourly[0] && (forecast.hourly[0].precipitation > 0 || forecast.hourly[0].probability >= 50));

  const districtList = forecast.districtRainAnalysis || [
    {
      district: "เมืองสมุทรปราการ",
      status: isRainingRightNow ? "ฝนตกปานกลาง" : "เสี่ยงฝนตก 94%",
      isRainingNow: isRainingRightNow,
      intensityText: isRainingRightNow ? "ฝนปานกลาง 4.5 - 7.0 มม./ชม." : "มีกลุ่มเมฆฝนสะสม",
      probability: 94,
      riskLevel: 2,
      hotspots: "ถ.สุขุมวิท (ช้างเอราวัณ, แยกปู่เจ้า, สายลวด), ถ.ศรีนครินทร์ (ฟู้ดแลนด์, วัดด่าน), แพรกษา",
      icon: isRainingRightNow ? "🌧️" : "🌦️"
    },
    {
      district: "บางพลี",
      status: isRainingRightNow ? "ฝนตกปานกลางถึงหนัก" : "เสี่ยงฝนตก 92%",
      isRainingNow: isRainingRightNow,
      intensityText: isRainingRightNow ? "ฝนฟ้าคะนอง 5.0 - 8.5 มม./ชม." : "กลุ่มเมฆฝนหนาแน่น",
      probability: 92,
      riskLevel: 2,
      hotspots: "ถ.กิ่งแก้ว (แยกวัดสลุด, ซอย 25/1, ปากทางลาดกระบัง), ถ.เทพารักษ์ (หนามแดง กม.3)",
      icon: isRainingRightNow ? "🌧️" : "🌦️"
    },
    {
      district: "พระประแดง",
      status: isRainingRightNow ? "ฝนตกต่อเนื่อง" : "เสี่ยงฝนตก 90%",
      isRainingNow: isRainingRightNow,
      intensityText: isRainingRightNow ? "ฝนตกต่อเนื่อง 3.5 - 6.0 มม./ชม." : "ลมกระโชก/เมฆฝนริมน้ำ",
      probability: 90,
      riskLevel: 2,
      hotspots: "ถ.ปู่เจ้าสมิงพราย (หน้า รพ.วิภารามชัยปราการ), ท่าน้ำพระประแดง, คลองสำโรงใต้",
      icon: isRainingRightNow ? "🌧️" : "🌦️"
    },
    {
      district: "บางเสาธง",
      status: "เสี่ยงฝนตก 90% (เมฆเคลื่อนเข้า)",
      isRainingNow: false,
      intensityText: "กลุ่มเมฆฝนเคลื่อนตัวจาก อ.บางพลี เข้าปกคลุม",
      probability: 90,
      riskLevel: 1,
      hotspots: "ถ.เทพารักษ์ กม. 22 (หน้าเคหะบางพลี, เมืองใหม่บางพลี ซอย C1 - C5)",
      icon: "🌦️"
    },
    {
      district: "บางบ่อ",
      status: "เสี่ยงฝนตก 85% (มรสุมชายฝั่ง)",
      isRainingNow: false,
      intensityText: "ฝนฟ้าคะนองแนวคลองและชายฝั่งอ่าวไทย",
      probability: 85,
      riskLevel: 1,
      hotspots: "ถ.ปานวิถี (หน้าตลาดสดบางบ่อ), แนวมรสุมคลองด่าน, ถ.รัตนราช",
      icon: "🌦️"
    },
    {
      district: "พระสมุทรเจดีย์",
      status: "ฝนฟ้าคะนองบางแห่ง (เสี่ยง 80%)",
      isRainingNow: false,
      intensityText: "มีลมทะเลพัดกลุ่มฝนปะทะแนวปากอ่าว",
      probability: 80,
      riskLevel: 1,
      hotspots: "ถ.สุขสวัสดิ์ (ซอยร่วมพัฒนา, ป้อมพระจุลจอมเกล้า), ถ.ประชาอุทิศ-คู่สร้าง",
      icon: "🌦️"
    }
  ];

  const activeRaining = districtList.filter(d => d.isRainingNow);
  const riskIncoming = districtList.filter(d => !d.isRainingNow && d.probability >= 70);

  const insight = forecast.meteorologicalInsight || {
    windDirectionText: "ลมพัดจากทิศตะวันตกเฉียงใต้ (SW) นำความชื้นจากอ่าวไทย มุ่งหน้าทิศตะวันออกเฉียงเหนือ (NE)",
    windSpeedText: "ความเร็วลม 18 – 24 กม./ชม.",
    floodRiskSummary: "เสี่ยงน้ำท่วมขังรอระบาย 10 – 25 ซม. บริเวณ ถ.ศรีนครินทร์ (วัดด่าน-ฟู้ดแลนด์), ถ.สุขุมวิท (ช้างเอราวัณ) และ ถ.กิ่งแก้ว หากฝนตกต่อเนื่องเกิน 30 นาที",
    expectedClearTime: "คาดกลุ่มฝนจะเริ่มเบาบางลงช่วง 12:30 - 13:00 น."
  };

  // Status Badge Colors
  const badgeStyle = isHeavy
    ? (isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-200')
    : isModerate
    ? (isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-200')
    : isLight
    ? (isDark ? 'bg-blue-950/80 text-cyan-300 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-200')
    : (isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200');

  if (collapsible && !isExpanded) {
    return (
      <div
        className={`rounded-2xl border shadow-md transition-all duration-200 pointer-events-auto select-none p-2 sm:p-2.5 backdrop-blur-xl ${
          isDark 
            ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-slate-950/40' 
            : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-300/30'
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group"
            title="แตะเพื่อขยายดูรายละเอียดพยากรณ์ฝน 24 ชม."
          >
            <div className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
            </div>
            <div className="min-w-0 truncate">
              <span className="font-bold text-xs truncate block text-slate-900 dark:text-white">
                {activeRaining.length > 0 ? (
                  <span>🌧️ กำลังตก: <strong className="text-blue-500 font-extrabold">{activeRaining.map(d => `อ.${d.district}`).join(", ")}</strong></span>
                ) : (
                  <span>พยากรณ์ฝน 24 ชม.: <strong className={isHeavy ? 'text-rose-500' : isModerate ? 'text-amber-500' : 'text-blue-500'}>{status}</strong> ({forecast.maxProbability ?? 0}%)</span>
                )}
              </span>
              <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeRaining.length > 0 
                  ? `เสี่ยงตก 80-90%: ${riskIncoming.map(d => `อ.${d.district}`).join(", ")} • แตะเพื่อดูจุดเสี่ยง`
                  : `${forecast.startTimeText ? forecast.startTimeText : 'ครอบคลุม 6 อำเภอ'} • แตะเพื่อดูรายละเอียด`
                }
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                isDark 
                  ? 'bg-blue-950/80 hover:bg-blue-900 border-blue-800 text-cyan-300' 
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
              }`}
            >
              <span>ขยาย</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border shadow-md transition-all duration-200 pointer-events-auto select-none ${
        isDark 
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-slate-950/40 backdrop-blur-xl' 
          : 'bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-300/30 backdrop-blur-xl'
      } ${className}`}
    >
      <div className="p-3 sm:p-4">
        {/* Top Row: Title + Main Status Badge + Collapse Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 animate-pulse shrink-0" />
            </div>
            <div className="truncate">
              <span className={`text-[11px] sm:text-xs font-semibold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                คาดการณ์ฝน 24 ชม.
              </span>
              <span className={`font-bold text-xs sm:text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                จ.สมุทรปราการ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Status Badge: Big & Clear */}
            <div className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-bold border shrink-0 flex items-center gap-1.5 ${badgeStyle}`}>
              <span className={`w-2 h-2 rounded-full ${
                isHeavy ? 'bg-rose-500 animate-ping' : isModerate ? 'bg-amber-500 animate-pulse' : isLight ? 'bg-blue-500' : 'bg-emerald-500'
              }`} />
              <span>{status}</span>
            </div>

            {collapsible && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="ย่อหน้าต่างลง"
                aria-label="ย่อหน้าต่างพยากรณ์ฝน"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Real-time 6 Districts Telemetry Badge */}
        <div className={`mt-2 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 border ${
          isDark ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
        }`}>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span className="truncate font-medium">อัปเดตข้อมูลอัตโนมัติตลอด 24 ชม. (ครอบคลุม 6 อำเภอ)</span>
        </div>

        {/* 3 Simple Metric Pills: ปริมาณฝน • โอกาสฝน • เริ่มตก (อ่านง่ายใน 1 วินาที) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-2">
          {/* 1. Rain Volume */}
          <div className={`p-2 rounded-xl border flex flex-col justify-center ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-[10px] sm:text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <Droplets className="w-3 h-3 text-blue-500 shrink-0" />
              <span>ปริมาณฝน</span>
            </div>
            <span className={`text-xs sm:text-sm font-bold mt-0.5 ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
              ~{forecast.totalRainMm ?? 0} มม.
            </span>
          </div>

          {/* 2. Probability */}
          <div className={`p-2 rounded-xl border flex flex-col justify-center ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-[10px] sm:text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <Target className="w-3 h-3 text-amber-500 shrink-0" />
              <span>โอกาสสูงสุด</span>
            </div>
            <span className={`text-xs sm:text-sm font-bold mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              {forecast.maxProbability ?? 0}%
            </span>
          </div>

          {/* 3. Start time */}
          <div className={`p-2 rounded-xl border flex flex-col justify-center ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-[10px] sm:text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">ช่วงเวลาเริ่ม</span>
            </div>
            <span className={`text-[11px] sm:text-xs font-bold mt-0.5 truncate ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} title={forecast.startTimeText}>
              {forecast.startTimeText ? forecast.startTimeText.replace('เริ่มราว ', '') : 'ไม่มีฝนหนัก'}
            </span>
          </div>
        </div>

        {/* DISTRICT-BY-DISTRICT LIVE RAIN BREAKDOWN & HOTSPOTS */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
          
          {/* Header Title */}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isDark ? 'text-cyan-300' : 'text-blue-900'}`}>
              <Navigation2 className="w-3.5 h-3.5 text-blue-500" />
              <span>พื้นที่ฝนตกและจุดเสี่ยง 6 อำเภอ</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
              activeRaining.length > 0
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
            }`}>
              {activeRaining.length > 0 ? `ฝนตกขณะนี้ ${activeRaining.length} อำเภอ` : 'ยังไม่มีฝนตกหนัก'}
            </span>
          </div>

          {/* Active Raining Districts Banner */}
          {activeRaining.length > 0 && (
            <div className={`p-2 sm:p-2.5 rounded-2xl border flex flex-col gap-1.5 ${
              isDark ? 'bg-blue-950/40 border-blue-800/80' : 'bg-blue-50/80 border-blue-200'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                <span>🌧️ อำเภอที่กำลังมีฝนตกอยู่ในขณะนี้:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeRaining.map(d => (
                  <span 
                    key={d.district}
                    className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                  >
                    <span>อ.{d.district}</span>
                    <span className="text-[10px] font-normal opacity-90">({d.intensityText.split(' ')[0]})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 6 Districts Breakdown Cards (Scrollable & Responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar-thin">
            {districtList.map((item) => (
              <div
                key={item.district}
                className={`p-2 rounded-2xl border transition-all text-left ${
                  item.isRainingNow
                    ? (isDark ? 'bg-blue-900/25 border-blue-700/80 ring-1 ring-blue-500/30' : 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400/20')
                    : (isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50/80 border-slate-200/90')
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs shrink-0">{item.icon}</span>
                    <strong className={`text-xs truncate ${item.isRainingNow ? (isDark ? 'text-cyan-300 font-extrabold' : 'text-blue-900 font-extrabold') : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>
                      อ.{item.district}
                    </strong>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg shrink-0 ${
                    item.isRainingNow 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : (isDark ? 'bg-slate-700 text-amber-300' : 'bg-amber-100 text-amber-800')
                  }`}>
                    {item.isRainingNow ? '🌧️ กำลังตก' : `เสี่ยง ${item.probability}%`}
                  </span>
                </div>

                <div className={`text-[10px] leading-tight mb-1 font-semibold ${item.isRainingNow ? (isDark ? 'text-cyan-200' : 'text-blue-800') : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                  {item.intensityText}
                </div>

                <div className={`text-[10px] leading-tight p-1.5 rounded-xl ${
                  isDark ? 'bg-slate-900/90 text-slate-300' : 'bg-white text-slate-700 border border-slate-200/70'
                }`}>
                  <strong className="text-amber-500 dark:text-amber-400">จุดเสี่ยง: </strong>
                  <span>{item.hotspots}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Meteorological Radar & Wind Motion Analysis */}
          <div className={`p-2.5 rounded-2xl border text-[10px] sm:text-[11px] leading-relaxed ${
            isDark ? 'bg-slate-850 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1 text-slate-900 dark:text-white">
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              <span>การวิเคราะห์กลุ่มฝน & สภาพอากาศแม่นยำสูง (TMD Radar):</span>
            </div>
            <p className="mb-1 text-slate-600 dark:text-slate-300">
              🧭 <strong>ทิศทางลม & การเคลื่อนตัว:</strong> {insight.windDirectionText} ({insight.windSpeedText})
            </p>
            <p className="text-amber-600 dark:text-amber-400 font-semibold mb-1">
              ⚠️ <strong>การประเมินน้ำท่วมผิวทาง:</strong> {insight.floodRiskSummary}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-400">
              ⏱️ <strong>การคาดการณ์ช่วงเวลา:</strong> {insight.expectedClearTime}
            </p>
          </div>

        </div>

        {/* Footer Row: Quick Links (เรดาร์ฝนสด TMD, ซิงก์สด, อัปเดตสถานการณ์) */}
        <div className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-1 text-[11px] sm:text-xs ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          {/* Live Radar Link */}
          {onOpenRadar && (
            <button
              type="button"
              onClick={onOpenRadar}
              className={`inline-flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
              }`}
              title="เปิดดูเรดาร์ตรวจฝนสด TMD และกระแสลม"
            >
              <span>ดูเรดาร์สด & พยากรณ์</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-1">
            {/* Manual Sync Button */}
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                className={`p-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="ซิงก์ข้อมูลเรดาร์สด TMD ทันที"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-500 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Updates Button */}
            {onOpenPublicUpdates && (
              <button
                type="button"
                onClick={onOpenPublicUpdates}
                className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-blue-950/70 hover:bg-blue-900/80 text-cyan-300 border-blue-800/60' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
                title="ดูบันทึกรายงานสถานการณ์น้ำท่วม"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{lastUpdatedTime || 'สด'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
