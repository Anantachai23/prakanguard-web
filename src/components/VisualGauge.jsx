import React from 'react';
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Info, Car, User } from 'lucide-react';
import { FLOOD_STANDARDS, getFloodLevel } from '../data/floodStandards';

export default function VisualGauge({ depthCm = 0, level, impactText = '', theme = 'light' }) {
  const isDark = theme === 'dark';
  
  // Enforce new 3-Tier Official Criteria:
  // Level 1: 8 - 20 cm
  // Level 2: 21 - 60 cm
  // Level 3: > 60 cm
  const computedLevel = getFloodLevel(depthCm);
  const activeLevel = level || computedLevel;
  const standard = FLOOD_STANDARDS.find(s => s.level === activeLevel) || FLOOD_STANDARDS[0];

  // Mathematical Coordinate Mapping (Max Gauge Height = 180cm, Ground = 180, Top = 0)
  const MAX_HEIGHT_CM = 180;
  const safeDepth = Math.max(0, Math.min(depthCm, MAX_HEIGHT_CM));
  const waterY = 180 - safeDepth;
  const waterHeight = safeDepth;

  // Real-world Anatomical Landmark Assessment for 170cm Human
  let humanImpact = '';
  let humanImpactBadge = '';
  if (depthCm <= 7) {
    humanImpact = 'ผิวถนนเปียกชื้น / น้ำขังตื้น (<8 ซม.)';
    humanImpactBadge = 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
  } else if (depthCm <= 20) {
    humanImpact = 'ระดับ 1 (8-20 ซม.): สูงเสมอตาตุ่มถึงหน้าแข้งตอนล่าง — เดินลุยได้ปกติ ร่างกายและเสื้อผ้าพ้นน้ำ';
    humanImpactBadge = 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700 font-bold';
  } else if (depthCm <= 45) {
    humanImpact = 'ระดับ 2 (21-45 ซม.): สูงระดับหน้าแข้งถึงหัวเข่า — ลำตัวและศีรษะพ้นน้ำปลอดภัย 100%';
    humanImpactBadge = 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 font-bold';
  } else if (depthCm <= 60) {
    humanImpact = 'ระดับ 2 (46-60 ซม.): สูงแตะหัวเข่าถึงต้นขาตอนล่าง — ศีรษะและลำตัวพ้นน้ำปลอดภัย';
    humanImpactBadge = 'bg-orange-100 text-orange-900 border-orange-400 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-700 font-bold';
  } else if (depthCm <= 90) {
    humanImpact = 'ระดับ 3 (>60 ซม.): สูงระดับสะโพก/เอว — วิกฤต ห้ามเดินลุยน้ำเด็ดขาด เสี่ยงถูกกระแสน้ำพัด';
    humanImpactBadge = 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700 font-bold animate-pulse';
  } else if (depthCm <= 130) {
    humanImpact = 'ระดับ 3 (>60 ซม.): สูงระดับหน้าอก (100-130 ซม.) — ภัยพิบัติร้ายแรง ห้ามเข้าใกล้แนวลำน้ำ';
    humanImpactBadge = 'bg-purple-100 text-purple-900 border-purple-400 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700 font-bold animate-pulse';
  } else {
    humanImpact = 'ระดับ 3 (>60 ซม.): สูงถึงระดับคอและมิดศีรษะ (>140 ซม.) — ภัยพิบัติฉุกเฉินสูงสุด อพยพทันที';
    humanImpactBadge = 'bg-red-200 text-red-950 border-red-500 dark:bg-red-950 dark:text-red-100 dark:border-red-600 font-extrabold animate-pulse';
  }

  // Real-world Vehicle Impact Assessment based on new standard
  let carImpact = '';
  if (depthCm < 8) {
    carImpact = 'น้ำขังตื้นผิวทาง — สัญจรได้ตามปกติ';
  } else if (depthCm <= 20) {
    carImpact = 'ระดับ 1 (8-20 ซม.): น้ำแตะใต้ท้องรถ (15 ซม.) ยังไม่ถึงขอบประตูล่าง — รถเก๋งและรถทุกประเภทผ่านได้ปกติ';
  } else if (depthCm <= 40) {
    carImpact = 'ระดับ 2 (21-40 ซม.): น้ำท่วมเสมอชายประตูล่างและท่วมครึ่งล้อ — รถเก๋งเสี่ยงสูงมาก แนะนำเลี่ยงเส้นทาง ปิดแอร์ทันที';
  } else if (depthCm <= 60) {
    carImpact = 'ระดับ 2 (41-60 ซม.): น้ำท่วมสูงปริ่มขอบบนล้อรถเก๋ง (แตะ 60 ซม.) — รถเก๋งเสี่ยงเครื่องดับสูง รถกระบะผ่านได้ชิดขวา';
  } else {
    carImpact = 'ระดับ 3 (>60 ซม.): น้ำท่วมมิดล้อรถเก๋ง (>60 ซม.) ท่วมห้องโดยสารและฝากระโปรง — ห้ามรถเก๋งผ่านเด็ดขาด รถจมน้ำถาวร';
  }

  // Level Theme Configuration
  let levelTheme = {
    badge: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-800 border-emerald-300",
    waterFill: "url(#waterGradientEmerald)",
    waterColor: "#10b981",
    tag: "🟢 ระดับ 1: ปกติ (8 - 20 ซม.) • รถทุกชนิดผ่านได้ปกติ",
    tagStyle: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-100 text-emerald-800 border-emerald-300"
  };

  if (activeLevel === 2) {
    levelTheme = {
      badge: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-800 border-amber-300",
      waterFill: "url(#waterGradientAmber)",
      waterColor: "#f59e0b",
      tag: "🟠 ระดับ 2: เสี่ยงสูง (21 - 60 ซม.) • รถเล็กเสี่ยงสูง ควรเลี่ยงเส้นทาง",
      tagStyle: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-100 text-amber-800 border-amber-300"
    };
  } else if (activeLevel === 3) {
    levelTheme = {
      badge: isDark ? "bg-rose-950/80 text-rose-300 border-rose-800" : "bg-rose-50 text-rose-800 border-rose-300",
      waterFill: "url(#waterGradientRose)",
      waterColor: "#f43f5e",
      tag: "🔴 ระดับ 3: วิกฤต (>60 ซม.) • มิดล้อรถ ห้ามผ่านเด็ดขาด",
      tagStyle: isDark ? "bg-rose-950/80 text-rose-300 border-rose-800" : "bg-rose-100 text-rose-800 border-rose-300"
    };
  }

  return (
    <div className={`border rounded-2xl p-3 sm:p-4 shadow-sm transition-colors ${
      isDark ? 'bg-slate-850/95 border-slate-700/80' : 'bg-slate-50/95 border-slate-200'
    }`}>
      
      {/* Top Header: Standard & Water Depth */}
      <div className={`flex items-center justify-between pb-2.5 sm:pb-3 border-b mb-3 ${
        isDark ? 'border-slate-700/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner shrink-0 ${levelTheme.badge}`}>
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border inline-block ${levelTheme.badge}`}>
                {standard.name}
              </span>
              <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded border font-semibold ${
                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'
              }`}>
                สัดส่วนจริง 170 ซม.
              </span>
            </div>
            <span className={`text-[9px] sm:text-xs block mt-0.5 font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              เกณฑ์มาตรฐาน: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{standard.depthRange}</strong>
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 pl-2">
          <span className={`text-[9px] sm:text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ระดับน้ำปัจจุบัน</span>
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              activeLevel === 3 ? 'text-rose-500' : activeLevel === 2 ? 'text-amber-500' : (isDark ? 'text-cyan-400' : 'text-emerald-600')
            }`}>
              {depthCm}
            </span>
            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ซม.</span>
          </div>
        </div>
      </div>

      {/* SVG VISUAL GAUGE TANK - HIGH-FIDELITY 170 CM SCALE (0-180 cm Scale) */}
      <div className={`w-full rounded-2xl border overflow-hidden shadow-inner relative ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300/80'
      }`}>
        <svg 
          viewBox="0 0 350 192" 
          className="w-full h-auto select-none"
          style={{ maxHeight: '250px' }}
        >
          <defs>
            {/* Emerald Gradient (Level 1: 8 - 20 cm) */}
            <linearGradient id="waterGradientEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.82" />
              <stop offset="30%" stopColor="#10b981" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.95" />
            </linearGradient>

            {/* Amber Gradient (Level 2: 21 - 60 cm) */}
            <linearGradient id="waterGradientAmber" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.95" />
            </linearGradient>

            {/* Rose/Crimson Gradient (Level 3: > 60 cm) */}
            <linearGradient id="waterGradientRose" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" stopOpacity="0.88" />
              <stop offset="25%" stopColor="#f43f5e" stopOpacity="0.90" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.96" />
            </linearGradient>

            {/* Car Window Tint Gradient */}
            <linearGradient id="carGlassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.85" />
            </linearGradient>

            {/* Wheel Metallic Rim Radial Gradient */}
            <radialGradient id="rimGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
          </defs>

          {/* 3-TIER OFFICIAL BACKGROUND ZONE BANDS */}
          {/* Level 3 Zone: Y=0 to 120 (>60 cm) */}
          <rect x="0" y="0" width="350" height="120" fill={isDark ? "#f43f5e" : "#ffe4e6"} opacity={isDark ? "0.04" : "0.35"} />
          
          {/* Level 2 Zone: Y=120 to 160 (21 - 60 cm) */}
          <rect x="0" y="120" width="350" height="40" fill={isDark ? "#f59e0b" : "#fef3c7"} opacity={isDark ? "0.05" : "0.45"} />
          
          {/* Level 1 Zone: Y=160 to 180 (8 - 20 cm) */}
          <rect x="0" y="160" width="350" height="20" fill={isDark ? "#10b981" : "#ecfdf5"} opacity={isDark ? "0.06" : "0.55"} />


          {/* ----------------- RULER BENCHMARKS (Across Width) ----------------- */}
          {/* 170 cm - Human Head Top */}
          <line x1="8" y1="10" x2="270" y2="10" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="274" y="13" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="7.5" fontFamily="monospace" fontWeight="bold">170cm ศีรษะคน</text>

          {/* 140 cm - Car Roof Top */}
          <line x1="8" y1="40" x2="270" y2="40" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="274" y="43" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="7.5" fontFamily="monospace">140cm หลังคารถ</text>

          {/* 100 cm - Waist Level */}
          <line x1="8" y1="80" x2="270" y2="80" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="274" y="83" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="7.5" fontFamily="monospace">100cm ระดับเอว</text>

          {/* 60 cm - KEY THRESHOLD: Level 3 Limit (>60 cm is Critical / Submerged Tires) */}
          <line x1="0" y1="120" x2="270" y2="120" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="274" y="123" fill="#e11d48" fontSize="8" fontFamily="monospace" fontWeight="bold">60cm 🔴 วิกฤต มิดล้อ</text>

          {/* 40 cm - Knee Level */}
          <line x1="8" y1="140" x2="270" y2="140" stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="274" y="143" fill={isDark ? "#fbbf24" : "#b45309"} fontSize="7.5" fontFamily="monospace" fontWeight="semibold">40cm หัวเข่า</text>

          {/* 20 cm - KEY THRESHOLD: Level 2 / Level 1 Boundary (20 cm Car Door Sill) */}
          <line x1="0" y1="160" x2="270" y2="160" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="274" y="163" fill="#d97706" fontSize="8" fontFamily="monospace" fontWeight="bold">20cm 🟠 เสี่ยงสูง ท้องรถ</text>

          {/* 8 cm - Level 1 Start Threshold */}
          <line x1="8" y1="172" x2="270" y2="172" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2 2" />
          <text x="274" y="174.5" fill="#059669" fontSize="7" fontFamily="monospace">8cm 🟢 เริ่มท่วมขัง</text>

          {/* 0 cm - Ground Line */}
          <line x1="0" y1="180" x2="350" y2="180" stroke={isDark ? "#64748b" : "#334155"} strokeWidth="2.5" />
          <text x="274" y="186" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="7.5" fontFamily="monospace" fontWeight="bold">0cm พื้นผิวทาง</text>


          {/* ----------------- HUMAN VECTOR SILHOUETTE (Standing 170 cm) ----------------- */}
          {/* Ground is at Y=180. Head top is at Y=10. Height = exactly 170 units */}
          <g className={isDark ? "text-slate-300" : "text-slate-700"}>
            {/* Head (Y=10 to 32) */}
            <ellipse cx="50" cy="21" rx="10" ry="11" fill="currentColor" />
            
            {/* Neck (Y=32 to 38) */}
            <rect x="47" y="32" width="6" height="6" rx="2" fill="currentColor" />

            {/* Torso & Shoulders (Y=38 to 86) */}
            <path d="M 36 42 Q 50 36 64 42 L 61 86 Q 50 88 39 86 Z" fill="currentColor" />

            {/* Left Arm */}
            <path d="M 36 42 L 31 78 Q 30 84 34 84 Q 37 84 38 78 L 40 46 Z" fill="currentColor" opacity="0.9" />

            {/* Right Arm */}
            <path d="M 64 42 L 69 78 Q 70 84 66 84 Q 63 84 62 78 L 60 46 Z" fill="currentColor" opacity="0.9" />

            {/* Pelvis / Waist (Y=86 to 98) */}
            <path d="M 39 86 L 61 86 L 58 100 L 42 100 Z" fill="currentColor" />

            {/* Left Leg: Thigh (98-138), Knee (138-144), Shin (144-172), Foot (172-180) */}
            <path d="M 42 100 L 41 138 Q 41 142 42 144 L 43 174 L 38 174 Q 36 177 38 180 L 48 180 Q 49 177 47 174 L 47 144 Q 48 142 48 138 L 49 100 Z" fill="currentColor" />

            {/* Right Leg: Thigh (98-138), Knee (138-144), Shin (144-172), Foot (172-180) */}
            <path d="M 51 100 L 52 138 Q 52 142 53 144 L 53 174 L 52 174 Q 51 177 52 180 L 62 180 Q 64 177 62 174 L 57 174 Q 57 174 57 144 Q 58 142 58 138 L 59 100 Z" fill="currentColor" />

            {/* Human Label Pill */}
            <rect x="22" y="172" width="56" height="7.5" rx="3.5" fill={isDark ? "#1e293b" : "#ffffff"} stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
            <text x="50" y="177.5" textAnchor="middle" fill={isDark ? "#cbd5e1" : "#334155"} fontSize="6.2" fontWeight="bold">คน 170 ซม.</text>
          </g>


          {/* ----------------- MODERN SEDAN CAR SILHOUETTE ----------------- */}
          {/* Ground is at Y=180. Wheels diameter 60cm (Y=120 to 180). Roof at Y=40 (140cm). Clearance at Y=165 (15cm). */}
          <g className={isDark ? "text-slate-400" : "text-slate-600"}>
            
            {/* Rear Wheel (Tire diameter = 60cm from Y=120 to 180) */}
            <circle cx="132" cy="150" r="30" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <circle cx="132" cy="150" r="16" fill="url(#rimGradient)" stroke="#64748b" strokeWidth="1" />
            <circle cx="132" cy="150" r="5" fill="#0f172a" />

            {/* Front Wheel (Tire diameter = 60cm from Y=120 to 180) */}
            <circle cx="218" cy="150" r="30" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <circle cx="218" cy="150" r="16" fill="url(#rimGradient)" stroke="#64748b" strokeWidth="1" />
            <circle cx="218" cy="150" r="5" fill="#0f172a" />

            {/* Chassis Underside / Clearance (15cm at Y=165) */}
            <path d="M 92 156 L 92 165 L 102 165 C 102 143 118 128 132 128 C 146 128 162 143 162 165 L 188 165 C 188 143 204 128 218 128 C 232 128 248 143 248 165 L 258 165 L 258 152 Z" fill="#0f172a" opacity="0.45" />

            {/* Car Exterior Body Shell */}
            <path d="
              M 90 152
              L 92 130
              Q 94 116 110 114
              L 126 112
              L 148 52
              Q 152 42 168 42
              L 200 42
              Q 210 42 218 52
              L 238 110
              L 254 114
              Q 260 116 260 126
              L 258 154
              L 248 154
              C 248 134 233 121 218 121
              C 203 121 188 134 188 154
              L 162 154
              C 162 134 147 121 132 121
              C 117 121 102 134 102 154
              Z
            " fill={isDark ? "#334155" : "#64748b"} stroke={isDark ? "#475569" : "#475569"} strokeWidth="1.2" />

            {/* Side Windows with Glass Reflection */}
            <path d="M 150 55 L 134 108 L 172 108 L 172 52 L 162 50 Z" fill="url(#carGlassGradient)" />
            <path d="M 176 52 L 176 108 L 228 108 L 212 55 Q 206 50 196 50 Z" fill="url(#carGlassGradient)" />

            {/* Headlights & Taillights */}
            <rect x="256" y="120" width="4" height="9" rx="2" fill="#38bdf8" />
            <rect x="90" y="122" width="3" height="8" rx="1.5" fill="#ef4444" />

            {/* Sedan Label Pill */}
            <rect x="142" y="172" width="66" height="7.5" rx="3.5" fill={isDark ? "#1e293b" : "#ffffff"} stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
            <text x="175" y="177.5" textAnchor="middle" fill={isDark ? "#cbd5e1" : "#334155"} fontSize="6.2" fontWeight="bold">รถเก๋ง (ล้อ 60ซม.)</text>
          </g>


          {/* ----------------- DYNAMIC WATER LAYER WITH REALISTIC SURFACE ----------------- */}
          {depthCm > 0 && (
            <g className="transition-all duration-700 ease-out">
              {/* Semi-transparent Fluid Water Body */}
              <rect 
                x="0" 
                y={waterY} 
                width="350" 
                height={waterHeight} 
                fill={levelTheme.waterFill} 
                className="transition-all duration-700"
              />

              {/* Primary Surface Crest Wave */}
              <path 
                d={`M 0 ${waterY} Q 45 ${waterY - 2}, 90 ${waterY} T 180 ${waterY} T 270 ${waterY} T 350 ${waterY}`} 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="2.5" 
                strokeOpacity="0.95"
              />

              {/* Secondary Sub-surface Wave Reflection */}
              <path 
                d={`M 0 ${waterY + 2} Q 50 ${waterY + 3}, 100 ${waterY + 1} T 200 ${waterY + 2} T 300 ${waterY + 1} T 350 ${waterY + 2}`} 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="1.2" 
                strokeOpacity="0.4"
              />

              {/* Surface Reflection Highlight Band */}
              <rect 
                x="0" 
                y={waterY + 2} 
                width="350" 
                height="3" 
                fill="#ffffff" 
                fillOpacity="0.25" 
              />

              {/* Floating Depth Pointer Badge right on the water line */}
              <g transform={`translate(268, ${Math.max(4, Math.min(166, waterY - 7))})`}>
                <rect 
                  x="0" 
                  y="0" 
                  width="48" 
                  height="15" 
                  rx="7.5" 
                  fill={activeLevel === 3 ? "#e11d48" : activeLevel === 2 ? "#d97706" : "#059669"} 
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.35))"
                />
                <text 
                  x="24" 
                  y="10.5" 
                  textAnchor="middle" 
                  fill="#ffffff" 
                  fontSize="8" 
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
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-700/80' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🚶‍♂️</span>
            <div className="min-w-0">
              <span className={`text-[10px] block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                เทียบสรีระคนยืน 170 ซม.:
              </span>
              <span className="text-xs font-bold truncate block text-slate-800 dark:text-slate-200">
                {humanImpact}
              </span>
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-md border shrink-0 ${humanImpactBadge}`}>
            {depthCm <= 60 ? 'ศีรษะพ้นน้ำ 100%' : depthCm <= 100 ? 'เอวถึงอก' : 'เสี่ยงจมน้ำ'}
          </span>
        </div>

        {/* Vehicle Impact Landmark */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-700/80' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🚗</span>
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
      <div className={`mt-2.5 p-2.5 rounded-xl border flex items-start gap-2.5 shadow-2xs transition-all ${
        isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${levelTheme.tagStyle}`}>
          {levelTheme.tag}
        </span>
        <span className={`text-xs sm:text-sm leading-snug font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {impactText || standard.trafficAdvice}
        </span>
      </div>

      {/* Official Standard Citation */}
      <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
        isDark ? 'border-slate-700/80 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span>เกณฑ์: ปภ. ระดับ 1 (8-20) • 2 (21-60) • 3 (&gt;60ซม.)</span>
        <span>คปภ. ประเมินความเสียหาย</span>
      </div>

    </div>
  );
}
