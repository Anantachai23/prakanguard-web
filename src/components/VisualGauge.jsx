import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Info, Scale, ArrowRight, Activity } from 'lucide-react';
import { FLOOD_STANDARDS } from '../data/floodStandards';

export default function VisualGauge({ depthCm = 0, level = 1, impactText = '', theme = 'light' }) {
  const isDark = theme === 'dark';
  const standard = FLOOD_STANDARDS.find(s => s.level === level) || FLOOD_STANDARDS[0];

  // Mathematical Coordinate Mapping (Max Gauge Height = 180cm, Ground = 180, Top = 0)
  const MAX_HEIGHT_CM = 180;
  const safeDepth = Math.max(0, Math.min(depthCm, MAX_HEIGHT_CM));
  const waterY = 180 - safeDepth;
  const waterHeight = safeDepth;

  // Real-world Anatomical Landmark Assessment for 170cm Human
  let humanImpact = '';
  let humanImpactBadge = '';
  if (depthCm <= 5) {
    humanImpact = 'ระดับพื้น/เปียกชื้น (ผิวทางลื่น)';
    humanImpactBadge = 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
  } else if (depthCm <= 15) {
    humanImpact = 'ระดับข้อเท้า/ตาตุ่ม (Ankle ~10-15 ซม.)';
    humanImpactBadge = 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
  } else if (depthCm <= 35) {
    humanImpact = 'ระดับหน้าแข้ง (Shin ~20-35 ซม.)';
    humanImpactBadge = 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
  } else if (depthCm <= 50) {
    humanImpact = 'ระดับหัวเข่า (Knee ~40-50 ซม.) — ลำตัวและศีรษะพ้นน้ำปลอดภัย';
    humanImpactBadge = 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 font-bold';
  } else if (depthCm <= 80) {
    humanImpact = 'ระดับต้นขา/สะโพก (Thigh/Hip ~60-80 ซม.)';
    humanImpactBadge = 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';
  } else if (depthCm <= 110) {
    humanImpact = 'ระดับเอว/สะดือ (Waist ~90-110 ซม.)';
    humanImpactBadge = 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700 font-bold';
  } else if (depthCm <= 140) {
    humanImpact = 'ระดับหน้าอก (Chest ~120-140 ซม.) — วิกฤต ห้ามเดินลุยน้ำ';
    humanImpactBadge = 'bg-purple-100 text-purple-900 border-purple-400 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700 font-bold';
  } else {
    humanImpact = 'ระดับคอถึงมิดศีรษะ (Neck/Head >150 ซม.) — ภัยพิบัติฉุกเฉิน';
    humanImpactBadge = 'bg-red-200 text-red-950 border-red-500 dark:bg-red-950 dark:text-red-100 dark:border-red-600 font-extrabold animate-pulse';
  }

  // Real-world Vehicle Impact Assessment
  let carImpact = '';
  if (depthCm < 15) {
    carImpact = 'ยังไม่ถึงท้องรถเก๋ง (15 ซม.) — สัญจรได้ปกติ';
  } else if (depthCm < 30) {
    carImpact = 'ท่วมแตะท้องรถเก๋ง (15-30 ซม.) — เสี่ยงน้ำเข้าท่อไอเสีย ชะลอความเร็ว';
  } else if (depthCm < 60) {
    carImpact = 'ท่วมครึ่งล้อถึง 3/4 ล้อ (30-55 ซม.) — รถเล็กเสี่ยงเครื่องดับสูง เลี่ยงเส้นทาง';
  } else if (depthCm < 90) {
    carImpact = 'ท่วมมิดล้อรถเก๋ง (60-80 ซม.) — รถยนต์นั่งห้ามผ่านเด็ดขาด ท่อและห้องโดยสารจมน้ำ';
  } else {
    carImpact = 'ท่วมมิดกระโปรง/หลังคารถ (>90 ซม.) — รถทุกชนิดห้ามผ่าน สัญจรได้เฉพาะเรือยกสูง';
  }

  // Color themes based on flood level
  let levelTheme = {
    badge: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-800 border-emerald-300",
    waterFill: "url(#waterGradientEmerald)",
    waterStroke: "#10b981",
    tag: "🟢 รถทุกชนิดผ่านได้ปกติ",
    tagStyle: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-100 text-emerald-800 border-emerald-300"
  };

  if (level === 2) {
    levelTheme = {
      badge: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-800 border-amber-300",
      waterFill: "url(#waterGradientAmber)",
      waterStroke: "#f59e0b",
      tag: "🟠 รถเล็กเสี่ยงสูง ควรเลี่ยง",
      tagStyle: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-100 text-amber-800 border-amber-300"
    };
  } else if (level === 3) {
    levelTheme = {
      badge: isDark ? "bg-rose-950/80 text-rose-300 border-rose-800" : "bg-rose-50 text-rose-800 border-rose-300",
      waterFill: "url(#waterGradientRose)",
      waterStroke: "#f43f5e",
      tag: "🔴 วิกฤต ห้ามรถเล็กผ่านเด็ดขาด",
      tagStyle: isDark ? "bg-rose-950/80 text-rose-300 border-rose-800" : "bg-rose-100 text-rose-800 border-rose-300"
    };
  }

  return (
    <div className={`border rounded-2xl p-2.5 sm:p-4 shadow-sm transition-colors ${
      isDark ? 'bg-slate-850/90 border-slate-700' : 'bg-slate-50 border-slate-200'
    }`}>
      
      {/* Top Header: Standard & Water Depth */}
      <div className={`flex items-center justify-between pb-2 sm:pb-3 border-b mb-2.5 sm:mb-3 ${
        isDark ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border shadow-inner shrink-0 ${levelTheme.badge}`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border inline-block ${levelTheme.badge}`}>
                {standard.name}
              </span>
              <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded border ${
                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'
              }`}>
                สัดส่วนกายวิภาคจริง 170 ซม.
              </span>
            </div>
            <span className={`text-[9px] sm:text-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              เกณฑ์ ปภ.: {standard.depthRange}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-[9px] sm:text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ความลึกน้ำ</span>
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
              level === 3 ? 'text-rose-500' : level === 2 ? 'text-amber-500' : (isDark ? 'text-cyan-400' : 'text-blue-600')
            }`}>
              {depthCm}
            </span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ซม.</span>
          </div>
        </div>
      </div>

      {/* SVG VISUAL GAUGE TANK - 100% MATHEMATICAL & PROPORTIONAL ACCURACY (0-180 cm Scale) */}
      <div className={`w-full rounded-2xl border overflow-hidden shadow-inner relative ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100/90 border-slate-300'
      }`}>
        <svg 
          viewBox="0 0 340 190" 
          className="w-full h-auto select-none"
          style={{ maxHeight: '240px' }}
        >
          <defs>
            {/* Emerald Gradient */}
            <linearGradient id="waterGradientEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.95" />
            </linearGradient>
            {/* Amber Gradient */}
            <linearGradient id="waterGradientAmber" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
            </linearGradient>
            {/* Rose Gradient */}
            <linearGradient id="waterGradientRose" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.95" />
            </linearGradient>

            {/* Car Window Gradient */}
            <linearGradient id="carGlassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* RULER BENCHMARK GUIDELINES (Across Canvas) */}
          {/* 170 cm - Human Head Top */}
          <line x1="10" y1="10" x2="265" y2="10" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3 3" />
          <text x="268" y="13" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="8" fontFamily="monospace" fontWeight="bold">170cm (ศีรษะคน)</text>

          {/* 140 cm - Car Roof Top */}
          <line x1="10" y1="40" x2="265" y2="40" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3 3" />
          <text x="268" y="43" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="8" fontFamily="monospace">140cm (หลังคารถ)</text>

          {/* 100 cm - Human Waist / Car Hood */}
          <line x1="10" y1="80" x2="265" y2="80" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3 3" />
          <text x="268" y="83" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="8" fontFamily="monospace">100cm (ระดับเอว)</text>

          {/* 60 cm - Car Tire Top (Critical Limit for Sedans) */}
          <line x1="10" y1="120" x2="265" y2="120" stroke={level === 3 ? "#f43f5e" : isDark ? "#475569" : "#94a3b8"} strokeWidth="1.2" strokeDasharray="4 2" />
          <text x="268" y="123" fill={isDark ? "#f87171" : "#dc2626"} fontSize="8" fontFamily="monospace" fontWeight="bold">60cm (มิดล้อรถ)</text>

          {/* 40 cm - Human Knee Level */}
          <line x1="10" y1="140" x2="265" y2="140" stroke={level >= 2 ? "#f59e0b" : isDark ? "#334155" : "#cbd5e1"} strokeWidth="1.2" strokeDasharray="4 2" />
          <text x="268" y="143" fill={isDark ? "#fbbf24" : "#d97706"} fontSize="8" fontFamily="monospace" fontWeight="bold">40cm (ระดับเข่า)</text>

          {/* 20 cm - Under Chassis / Ankle */}
          <line x1="10" y1="160" x2="265" y2="160" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3 3" />
          <text x="268" y="163" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="8" fontFamily="monospace">20cm (ใต้ท้องรถ)</text>

          {/* 0 cm - Ground Line */}
          <line x1="0" y1="180" x2="340" y2="180" stroke={isDark ? "#64748b" : "#475569"} strokeWidth="2.5" />
          <text x="268" y="186" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="8" fontFamily="monospace" fontWeight="bold">0cm (พื้นถนน)</text>


          {/* ----------------- HUMAN VECTOR SILHOUETTE (Standing 170 cm) ----------------- */}
          {/* Ground is at Y=180. Head top is at Y=10. Height = exactly 170 units */}
          <g className={isDark ? "text-slate-300" : "text-slate-700"}>
            {/* Head (Top: Y=10, Chin: Y=32) */}
            <circle cx="50" cy="21" r="11" fill="currentColor" />
            
            {/* Neck */}
            <rect x="47" y="31" width="6" height="7" rx="2" fill="currentColor" />

            {/* Torso & Upper Body (Shoulders to Waist: Y=37 to 86) */}
            <path d="M 36 42 Q 50 36 64 42 L 61 86 Q 50 88 39 86 Z" fill="currentColor" />

            {/* Left Arm */}
            <path d="M 36 42 L 31 78 Q 30 84 34 84 Q 37 84 38 78 L 40 46 Z" fill="currentColor" opacity="0.9" />

            {/* Right Arm */}
            <path d="M 64 42 L 69 78 Q 70 84 66 84 Q 63 84 62 78 L 60 46 Z" fill="currentColor" opacity="0.9" />

            {/* Pelvis / Hips (Y=86 to 98) */}
            <path d="M 39 86 L 61 86 L 58 100 L 42 100 Z" fill="currentColor" />

            {/* Left Leg: Thigh (98-138), Knee (138-144), Shin (144-172), Foot (172-180) */}
            {/* Knee center is right at Y=140 (which matches 40cm ruler line perfectly!) */}
            <path d="M 42 100 L 41 138 Q 41 142 42 144 L 43 174 L 38 174 Q 36 177 38 180 L 48 180 Q 49 177 47 174 L 47 144 Q 48 142 48 138 L 49 100 Z" fill="currentColor" />

            {/* Right Leg: Thigh (98-138), Knee (138-144), Shin (144-172), Foot (172-180) */}
            <path d="M 51 100 L 52 138 Q 52 142 53 144 L 53 174 L 52 174 Q 51 177 52 180 L 62 180 Q 64 177 62 174 L 57 174 Q 57 174 57 144 Q 58 142 58 138 L 59 100 Z" fill="currentColor" />

            {/* Human Label Pill */}
            <rect x="22" y="171" width="56" height="8" rx="4" fill={isDark ? "#1e293b" : "#ffffff"} stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
            <text x="50" y="177" textAnchor="middle" fill={isDark ? "#cbd5e1" : "#334155"} fontSize="6.5" fontWeight="bold">คน 170 ซม.</text>
          </g>


          {/* ----------------- SEDAN CAR VECTOR SILHOUETTE ----------------- */}
          {/* Ground is at Y=180. Wheels diameter 60cm (Y=120 to 180). Roof at Y=40 (140cm). Clearance at Y=165 (15cm). */}
          <g className={isDark ? "text-slate-400" : "text-slate-600"}>
            
            {/* Front & Rear Wheels (Tires diameter = 60cm) */}
            {/* Rear Wheel (Left side in profile) */}
            <circle cx="130" cy="150" r="30" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
            <circle cx="130" cy="150" r="16" fill={isDark ? "#334155" : "#94a3b8"} />
            <circle cx="130" cy="150" r="6" fill="#0f172a" />

            {/* Front Wheel (Right side in profile) */}
            <circle cx="215" cy="150" r="30" fill="#1e293b" stroke="#475569" strokeWidth="2.5" />
            <circle cx="215" cy="150" r="16" fill={isDark ? "#334155" : "#94a3b8"} />
            <circle cx="215" cy="150" r="6" fill="#0f172a" />

            {/* Car Chassis Underside (Clearance 15cm at Y=165) */}
            <path d="M 90 156 L 90 165 L 102 165 C 102 144 116 130 130 130 C 144 130 158 144 158 165 L 187 165 C 187 144 201 130 215 130 C 229 130 243 144 243 165 L 255 165 L 255 152 Z" fill="#0f172a" opacity="0.4" />

            {/* Car Main Body Exterior Shell */}
            <path d="
              M 88 152
              L 90 130
              Q 92 118 108 116
              L 125 114
              L 146 54
              Q 150 42 165 42
              L 198 42
              Q 208 42 216 54
              L 236 112
              L 252 116
              Q 258 118 258 128
              L 256 154
              L 245 154
              C 245 136 231 123 215 123
              C 199 123 185 136 185 154
              L 160 154
              C 160 136 146 123 130 123
              C 114 123 100 136 100 154
              Z
            " fill={isDark ? "#334155" : "#64748b"} stroke={isDark ? "#475569" : "#475569"} strokeWidth="1" />

            {/* Front & Rear Side Windows */}
            <path d="M 148 57 L 132 110 L 170 110 L 170 54 L 160 52 Z" fill="url(#carGlassGradient)" />
            <path d="M 174 54 L 174 110 L 226 110 L 210 57 Q 205 52 195 52 Z" fill="url(#carGlassGradient)" />

            {/* Headlights and Taillights */}
            <rect x="254" y="122" width="4" height="9" rx="2" fill="#38bdf8" />
            <rect x="88" y="124" width="3" height="8" rx="1.5" fill="#ef4444" />

            {/* Sedan Label Pill */}
            <rect x="140" y="171" width="65" height="8" rx="4" fill={isDark ? "#1e293b" : "#ffffff"} stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
            <text x="172.5" y="177" textAnchor="middle" fill={isDark ? "#cbd5e1" : "#334155"} fontSize="6.5" fontWeight="bold">รถเก๋ง (ท้องรถ 15ซม.)</text>
          </g>


          {/* ----------------- DYNAMIC WATER LAYER (Exact Height = depthCm) ----------------- */}
          {depthCm > 0 && (
            <g className="transition-all duration-700 ease-out">
              {/* Semi-transparent Water Volume */}
              <rect 
                x="0" 
                y={waterY} 
                width="340" 
                height={waterHeight} 
                fill={levelTheme.waterFill} 
                className="transition-all duration-700"
              />

              {/* Water Surface Wave Line */}
              <path 
                d={`M 0 ${waterY} Q 40 ${waterY - 1.5}, 85 ${waterY} T 170 ${waterY} T 255 ${waterY} T 340 ${waterY}`} 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="2.2" 
                strokeOpacity="0.9"
              />

              {/* Surface Reflection Highlight */}
              <rect 
                x="0" 
                y={waterY + 2} 
                width="340" 
                height="3" 
                fill="#ffffff" 
                fillOpacity="0.25" 
              />

              {/* Depth Pointer Badge right on the water line */}
              <g transform={`translate(262, ${waterY - 7})`}>
                <rect 
                  x="0" 
                  y="0" 
                  width="44" 
                  height="14" 
                  rx="7" 
                  fill={level === 3 ? "#e11d48" : level === 2 ? "#d97706" : "#059669"} 
                  filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))"
                />
                <text 
                  x="22" 
                  y="9.5" 
                  textAnchor="middle" 
                  fill="#ffffff" 
                  fontSize="7.5" 
                  fontFamily="monospace" 
                  fontWeight="bold"
                >
                  {depthCm} cm
                </text>
              </g>
            </g>
          )}

        </svg>
      </div>

      {/* DETAILED REALISTIC ANATOMICAL & VEHICLE ASSESSMENT */}
      <div className="mt-3 space-y-2">
        
        {/* Human Comparison Landmark */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
          isDark ? 'bg-slate-900/60 border-slate-700/80' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0">🚶‍♂️</span>
            <div className="min-w-0">
              <span className={`text-[10px] block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                เทียบสัดส่วนคนยืน (สูง 170 ซม.):
              </span>
              <span className="text-xs font-bold truncate block text-slate-800 dark:text-slate-200">
                {humanImpact}
              </span>
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-md border shrink-0 ${humanImpactBadge}`}>
            {depthCm <= 50 ? 'ศีรษะพ้นน้ำ 100%' : depthCm <= 100 ? 'เอวถึงอก' : 'เสี่ยงจมน้ำ'}
          </span>
        </div>

        {/* Vehicle Impact Landmark */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
          isDark ? 'bg-slate-900/60 border-slate-700/80' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm shrink-0">🚗</span>
            <div className="min-w-0">
              <span className={`text-[10px] block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                เทียบรถยนต์นั่งทั่วไป (ท้องรถ 15ซม. / ล้อ 60ซม.):
              </span>
              <span className="text-xs font-medium truncate block text-slate-800 dark:text-slate-200">
                {carImpact}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Traffic Impact Status Pill */}
      <div className={`mt-2.5 p-2.5 rounded-xl border flex items-start gap-2.5 shadow-xs ${
        isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${levelTheme.tagStyle}`}>
          {levelTheme.tag}
        </span>
        <span className={`text-xs sm:text-sm leading-snug font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {impactText || 'โปรดขับขี่ด้วยความระมัดระวังและปฏิบัติตามคำแนะนำของเจ้าหน้าที่'}
        </span>
      </div>

      {/* Official Standard Citation */}
      <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
        isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span>มาตรฐาน: สำนักการระบายน้ำ & ปภ.</span>
        <span>คปภ. เกณฑ์ประกันวินาศภัย</span>
      </div>

    </div>
  );
}
