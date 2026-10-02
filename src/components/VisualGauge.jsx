import React from 'react';
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, Info, Car, User } from 'lucide-react';
import { FLOOD_STANDARDS, getFloodLevel } from '../data/floodStandards';

export default function VisualGauge({ depthCm = 0, level, impactText = '', theme = 'light' }) {
  const isDark = theme === 'dark';
  
  // Enforce new 3-Tier Official Criteria:
  // Level 1: 5 - 20 cm
  // Level 2: 21 - 50 cm
  // Level 3: > 50 cm
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
  if (depthCm < 5) {
    humanImpact = 'ผิวถนนเปียกชื้น / น้ำขังตื้น (< 5 ซม.)';
    humanImpactBadge = 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
  } else if (depthCm <= 20) {
    humanImpact = 'ระดับ 1 (5-20 ซม.): สูงเสมอตาตุ่มถึงใต้ท้องรถเก๋ง — เดินลุยได้ปกติ ร่างกายและเสื้อผ้าพ้นน้ำ';
    humanImpactBadge = 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700 font-bold';
  } else if (depthCm <= 50) {
    humanImpact = 'ระดับ 2 (21-50 ซม.): สูงระดับหน้าแข้งถึงหัวเข่า/ครึ่งล้อ — ศีรษะและลำตัวพ้นน้ำปลอดภัย 100%';
    humanImpactBadge = 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 font-bold';
  } else if (depthCm <= 90) {
    humanImpact = 'ระดับ 3 (>50 ซม.): สูงระดับสะโพก/เอว — วิกฤต ห้ามเดินลุยน้ำเด็ดขาด เสี่ยงถูกกระแสน้ำพัด';
    humanImpactBadge = 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700 font-bold animate-pulse';
  } else if (depthCm <= 130) {
    humanImpact = 'ระดับ 3 (>50 ซม.): สูงระดับหน้าอก (100-130 ซม.) — ภัยพิบัติร้ายแรง ห้ามเข้าใกล้แนวลำน้ำ';
    humanImpactBadge = 'bg-purple-100 text-purple-900 border-purple-400 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700 font-bold animate-pulse';
  } else {
    humanImpact = 'ระดับ 3 (>50 ซม.): สูงถึงระดับคอและมิดศีรษะ (>140 ซม.) — ภัยพิบัติฉุกเฉินสูงสุด อพยพทันที';
    humanImpactBadge = 'bg-red-200 text-red-950 border-red-500 dark:bg-red-950 dark:text-red-100 dark:border-red-600 font-extrabold animate-pulse';
  }

  // Real-world Vehicle Impact Assessment based on new standard
  let carImpact = '';
  if (depthCm < 5) {
    carImpact = 'น้ำขังตื้นผิวทาง — สัญจรได้ตามปกติ';
  } else if (depthCm <= 20) {
    carImpact = 'ระดับ 1 (5-20 ซม.): น้ำแตะใต้ท้องรถ (15 ซม.) ยังไม่ถึงขอบประตูล่าง — รถเก๋งและรถทุกประเภทผ่านได้ปกติ';
  } else if (depthCm <= 50) {
    carImpact = 'ระดับ 2 (21-50 ซม.): น้ำท่วมเสมอชายประตูล่างถึงครึ่งล้อ — รถเก๋งเสี่ยงสูงมาก แนะนำเลี่ยงเส้นทาง ปิดแอร์ทันที';
  } else {
    carImpact = 'ระดับ 3 (>50 ซม.): น้ำท่วมมิดล้อรถเก๋ง (>50 ซม.) ท่วมห้องโดยสารและฝากระโปรง — ห้ามรถเก๋งผ่านเด็ดขาด รถจมน้ำถาวร';
  }

  // Level Theme Configuration
  let levelTheme = {
    badge: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-800 border-emerald-300",
    waterFill: "url(#waterGradientEmerald)",
    waterColor: "#10b981",
    tag: "🟢 ระดับ 1: ปกติ (5 - 20 ซม.) • รถทุกชนิดผ่านได้ปกติ",
    tagStyle: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-100 text-emerald-800 border-emerald-300"
  };

  if (activeLevel === 2) {
    levelTheme = {
      badge: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-800 border-amber-300",
      waterFill: "url(#waterGradientAmber)",
      waterColor: "#f59e0b",
      tag: "🟠 ระดับ 2: เสี่ยงสูง (21 - 50 ซม.) • รถเล็กเสี่ยงสูง ควรเลี่ยงเส้นทาง",
      tagStyle: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-100 text-amber-800 border-amber-300"
    };
  } else if (activeLevel === 3) {
    levelTheme = {
      badge: isDark ? "bg-rose-950/80 text-rose-300 border-rose-800" : "bg-rose-50 text-rose-800 border-rose-300",
      waterFill: "url(#waterGradientRose)",
      waterColor: "#f43f5e",
      tag: "🔴 ระดับ 3: วิกฤต (>50 ซม.) • ท่วมมิดล้อ ห้ามผ่านเด็ดขาด",
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
            {/* Emerald Gradient (Level 1: 5 - 20 cm) */}
            <linearGradient id="waterGradientEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.82" />
              <stop offset="30%" stopColor="#10b981" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.95" />
            </linearGradient>

            {/* Amber Gradient (Level 2: 21 - 50 cm) */}
            <linearGradient id="waterGradientAmber" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.95" />
            </linearGradient>

            {/* Rose/Crimson Gradient (Level 3: > 50 cm) */}
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
          {/* Level 3 Zone: Y=0 to 130 (>50 cm) */}
          <rect x="0" y="0" width="350" height="130" fill={isDark ? "#f43f5e" : "#ffe4e6"} opacity={isDark ? "0.04" : "0.35"} />
          
          {/* Level 2 Zone: Y=130 to 160 (21 - 50 cm) */}
          <rect x="0" y="130" width="350" height="30" fill={isDark ? "#f59e0b" : "#fef3c7"} opacity={isDark ? "0.05" : "0.45"} />
          
          {/* Level 1 Zone: Y=160 to 175 (5 - 20 cm) */}
          <rect x="0" y="160" width="350" height="15" fill={isDark ? "#10b981" : "#ecfdf5"} opacity={isDark ? "0.06" : "0.55"} />


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

          {/* 50 cm - KEY THRESHOLD: Level 3 Limit (>50 cm is Critical / Submerged Tires) */}
          <line x1="0" y1="130" x2="270" y2="130" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="274" y="133" fill="#e11d48" fontSize="8" fontFamily="monospace" fontWeight="bold">50cm 🔴 วิกฤต ห้ามผ่าน</text>

          {/* 35 cm - Shin / Half Wheel Level */}
          <line x1="8" y1="145" x2="270" y2="145" stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="274" y="148" fill={isDark ? "#fbbf24" : "#b45309"} fontSize="7.5" fontFamily="monospace" fontWeight="semibold">35cm ครึ่งล้อรถ</text>

          {/* 20 cm - KEY THRESHOLD: Level 2 / Level 1 Boundary (20 cm Car Door Sill) */}
          <line x1="0" y1="160" x2="270" y2="160" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="274" y="163" fill="#d97706" fontSize="8" fontFamily="monospace" fontWeight="bold">20cm 🟠 เสี่ยงสูง ชายประตู</text>

          {/* 5 cm - Level 1 Start Threshold */}
          <line x1="8" y1="175" x2="270" y2="175" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2 2" />
          <text x="274" y="177.5" fill="#059669" fontSize="7" fontFamily="monospace">5cm 🟢 เริ่มท่วมขัง</text>

          {/* 0 cm - Ground Line */}
          <line x1="0" y1="180" x2="350" y2="180" stroke={isDark ? "#64748b" : "#334155"} strokeWidth="2.5" />
          <text x="274" y="186" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="7.5" fontFamily="monospace" fontWeight="bold">0cm พื้นผิวทาง</text>


          {/* ----------------- HUMAN ATHLETIC VECTOR SILHOUETTE (Standing 170 cm) ----------------- */}
          {/* Ground is at Y=180. Head top is at Y=10. Height = exactly 170 units */}
          {/* Proportioned naturally, athletic, and NOT too skinny/slender */}
          <g className={isDark ? "text-slate-300" : "text-slate-700"}>
            
            {/* Head & Hair (Y=10 to 33) */}
            <ellipse cx="50" cy="21.5" rx="11" ry="11.5" fill="currentColor" />
            <path d="M 39 19 Q 50 8 61 19 Q 62 13 50 10 Q 38 13 39 19 Z" fill={isDark ? "#f1f5f9" : "#1e293b"} opacity="0.65" />
            
            {/* Neck (Y=33 to 39) */}
            <path d="M 46 33 L 46 40 L 54 40 L 54 33 Z" fill="currentColor" />

            {/* Athletic Torso & Shoulders (Y=39 to 98) */}
            {/* Natural broad shoulders (width 42px), athletic chest taper to waist */}
            <path d="
              M 46 40
              Q 50 43 54 40
              L 71 45
              Q 73 48 72 52
              L 67 85
              Q 67 92 68 98
              L 32 98
              Q 33 92 33 85
              L 28 52
              Q 27 48 29 45
              Z
            " fill="currentColor" />

            {/* Left Arm (Relaxed, athletic thickness) */}
            <path d="
              M 29 45
              Q 24 58 24 72
              L 24 92
              Q 23 98 26 98
              Q 29 98 30 92
              L 31 72
              Q 32 58 34 50
              Z
            " fill="currentColor" opacity="0.95" />

            {/* Right Arm (Relaxed, athletic thickness) */}
            <path d="
              M 71 45
              Q 76 58 76 72
              L 76 92
              Q 77 98 74 98
              Q 71 98 70 92
              L 69 72
              Q 68 58 66 50
              Z
            " fill="currentColor" opacity="0.95" />

            {/* Athletic Pants & Strong Legs (Y=98 to 180) */}
            {/* Left Leg: Athletic Quad (98-138), Knee (138-145), Calf (145-172), Sneaker (172-180) */}
            <path d="
              M 32 98
              L 32 135
              Q 33 144 35 145
              Q 33 156 34 165
              L 37 172
              L 30 174
              Q 28 178 30 180
              L 48 180
              Q 49 177 47 172
              L 46 165
              Q 48 156 46 145
              Q 47 140 48 135
              L 49 104
              Z
            " fill="currentColor" />

            {/* Right Leg: Athletic Quad (98-138), Knee (138-145), Calf (145-172), Sneaker (172-180) */}
            <path d="
              M 51 104
              L 52 135
              Q 53 140 54 145
              Q 52 156 54 165
              L 53 172
              Q 51 177 52 180
              L 70 180
              Q 72 178 70 174
              L 63 172
              L 66 165
              Q 67 156 65 145
              Q 67 144 68 135
              L 68 98
              Z
            " fill="currentColor" />

            {/* Subtle T-shirt Hem line */}
            <line x1="33" y1="86" x2="67" y2="86" stroke={isDark ? "#1e293b" : "#ffffff"} strokeWidth="1" opacity="0.4" />

            {/* Human Label Pill */}
            <rect x="22" y="171.5" width="56" height="8" rx="4" fill={isDark ? "#1e293b" : "#ffffff"} stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
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
            <rect x="142" y="171.5" width="66" height="8" rx="4" fill={isDark ? "#1e293b" : "#ffffff"} stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="0.8" />
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
        <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col gap-1.5 transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-700/80' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base shrink-0">🚶‍♂️</span>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                เทียบสรีระคนยืน 170 ซม.:
              </span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-md border shrink-0 ${humanImpactBadge}`}>
              {depthCm <= 50 ? 'ศีรษะพ้นน้ำ 100%' : depthCm <= 90 ? 'เอวถึงอก' : 'เสี่ยงจมน้ำ'}
            </span>
          </div>
          <p className="text-xs font-bold leading-relaxed text-slate-800 dark:text-slate-200 break-words m-0">
            {humanImpact}
          </p>
        </div>

        {/* Vehicle Impact Landmark */}
        <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col gap-1.5 transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-700/80' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="text-base shrink-0">🚗</span>
            <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              เทียบรถยนต์นั่งทั่วไป (ใต้ท้อง 15 ซม. / ล้อ 60 ซม.):
            </span>
          </div>
          <p className="text-xs font-medium leading-relaxed text-slate-800 dark:text-slate-200 break-words m-0">
            {carImpact}
          </p>
        </div>

      </div>

      {/* Traffic Impact Status Card - Clean Vertical Framing */}
      <div className={`mt-3 p-3 sm:p-3.5 rounded-xl border flex flex-col gap-2 shadow-sm transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-700/90' : 'bg-white border-slate-200/90'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 shadow-2xs ${levelTheme.tagStyle}`}>
            {levelTheme.tag}
          </span>
        </div>
        <p className={`text-xs sm:text-[13px] leading-relaxed font-medium break-words m-0 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {impactText || standard.trafficAdvice}
        </p>
      </div>

      {/* Official Standard Citation */}
      <div className={`mt-2 pt-2 border-t flex flex-wrap items-center justify-between gap-1 text-[10px] ${
        isDark ? 'border-slate-700/80 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span>เกณฑ์: ปภ. ระดับ 1 (5-20) • 2 (21-50) • 3 (&gt;50ซม.)</span>
        <span>คปภ. ประเมินความเสียหาย</span>
      </div>

    </div>
  );
}
