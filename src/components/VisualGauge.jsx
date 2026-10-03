import React from 'react';
import { Activity } from 'lucide-react';
import { FLOOD_STANDARDS, getFloodLevel } from '../data/floodStandards';

export default function VisualGauge({ depthCm = 0, level, theme = 'light' }) {
  const isDark = theme === 'dark';
  
  const computedLevel = getFloodLevel(depthCm);
  const activeLevel = level || computedLevel;
  const standard = FLOOD_STANDARDS.find(s => s.level === activeLevel) || FLOOD_STANDARDS[0];

  // Scale: Ground = Y:180, Top = Y:0. Max height = 180cm.
  const MAX_HEIGHT_CM = 180;
  const safeDepth = Math.max(0, Math.min(depthCm, MAX_HEIGHT_CM));
  const waterY = 180 - safeDepth;
  const waterHeight = safeDepth;

  let levelTheme = {
    badge: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-800 border-emerald-300",
    waterFill: "url(#waterGradEmerald)",
    tag: "🟢 ระดับ 1: น้ำท่วมปกติ (5 - 20 cm) • รถทุกชนิดผ่านได้",
    tagStyle: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-100 text-emerald-800 border-emerald-300"
  };

  if (activeLevel === 2) {
    levelTheme = {
      badge: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-800 border-amber-300",
      waterFill: "url(#waterGradAmber)",
      tag: "🟠 ระดับ 2: น้ำท่วมปานกลาง (21 - 50 cm) • รถเล็กควรเลี่ยง",
      tagStyle: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-100 text-amber-800 border-amber-300"
    };
  } else if (activeLevel === 3) {
    levelTheme = {
      badge: isDark ? "bg-rose-950/80 text-rose-300 border-rose-800" : "bg-rose-50 text-rose-800 border-rose-300",
      waterFill: "url(#waterGradRose)",
      tag: "🔴 ระดับ 3: น้ำท่วมวิกฤต (มากกว่า 50 cm) • ห้ามรถเล็กผ่านเด็ดขาด",
      tagStyle: isDark ? "bg-rose-950/80 text-rose-300 border-rose-800" : "bg-rose-100 text-rose-800 border-rose-300"
    };
  }

  return (
    <div className={`border rounded-2xl p-3 sm:p-4 shadow-sm transition-colors ${
      isDark ? 'bg-slate-850/95 border-slate-700/80' : 'bg-slate-50/95 border-slate-200'
    }`}>
      
      {/* Top Header: Level & Current Depth */}
      <div className={`flex items-center justify-between pb-2.5 border-b mb-3 ${
        isDark ? 'border-slate-700/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner shrink-0 ${levelTheme.badge}`}>
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md border inline-block ${levelTheme.badge}`}>
              {standard.name}
            </span>
            <span className={`text-[11px] block mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              เกณฑ์ระดับน้ำ: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{standard.depthRange}</strong>
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 pl-2">
          <span className={`text-[10px] block font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ระดับน้ำปัจจุบัน</span>
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              activeLevel === 3 ? 'text-rose-500' : activeLevel === 2 ? 'text-amber-500' : (isDark ? 'text-cyan-400' : 'text-emerald-600')
            }`}>
              {depthCm}
            </span>
            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>ซม.</span>
          </div>
        </div>
      </div>

      {/* SVG VISUAL GAUGE (170cm scale illustration with Person & Car) */}
      <div className={`w-full rounded-2xl border overflow-hidden shadow-inner relative ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300/80'
      }`}>
        <svg 
          viewBox="0 -8 350 200" 
          className="w-full h-auto select-none"
          style={{ maxHeight: '250px' }}
        >
          <defs>
            {/* Water Gradients */}
            <linearGradient id="waterGradEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.90" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="waterGradAmber" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.88" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.90" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="waterGradRose" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" stopOpacity="0.90" />
              <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.98" />
            </linearGradient>

            {/* Car Glass */}
            <linearGradient id="carGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.90" />
            </linearGradient>

            {/* Wheel Metallic Rim */}
            <radialGradient id="carRimGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
          </defs>

          {/* Background Zone Bands */}
          <rect x="0" y="-8" width="350" height="138" fill={isDark ? "#f43f5e" : "#ffe4e6"} opacity={isDark ? "0.04" : "0.30"} />
          <rect x="0" y="130" width="350" height="30" fill={isDark ? "#f59e0b" : "#fef3c7"} opacity={isDark ? "0.05" : "0.40"} />
          <rect x="0" y="160" width="350" height="15" fill={isDark ? "#10b981" : "#ecfdf5"} opacity={isDark ? "0.06" : "0.50"} />

          {/* Ruler Benchmarks */}
          <line x1="8" y1="10" x2="265" y2="10" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="270" y="13" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="7.5" fontFamily="monospace" fontWeight="bold">170cm ศีรษะคน</text>

          <line x1="8" y1="40" x2="265" y2="40" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="270" y="43" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="7.5" fontFamily="monospace">140cm หลังคารถ</text>

          <line x1="8" y1="80" x2="265" y2="80" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="270" y="83" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="7.5" fontFamily="monospace">100cm ระดับเอว</text>

          <line x1="0" y1="130" x2="265" y2="130" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="270" y="133" fill="#e11d48" fontSize="8" fontFamily="monospace" fontWeight="bold">50cm 🔴 วิกฤต</text>

          <line x1="8" y1="145" x2="265" y2="145" stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="270" y="148" fill={isDark ? "#fbbf24" : "#b45309"} fontSize="7.5" fontFamily="monospace">35cm ครึ่งล้อรถ</text>

          <line x1="0" y1="160" x2="265" y2="160" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="270" y="163" fill="#d97706" fontSize="8" fontFamily="monospace" fontWeight="bold">20cm 🟠 ปานกลาง</text>

          <line x1="8" y1="175" x2="265" y2="175" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2 2" />
          <text x="270" y="177.5" fill="#059669" fontSize="7.5" fontFamily="monospace">5cm 🟢 ปกติ</text>

          {/* Ground Line */}
          <line x1="0" y1="180" x2="350" y2="180" stroke={isDark ? "#64748b" : "#334155"} strokeWidth="2.5" />
          <text x="270" y="186" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="7.5" fontFamily="monospace" fontWeight="bold">0cm พื้นถนน</text>

          {/* ----------------- HUMAN SILHOUETTE (Standing 170 cm) ----------------- */}
          {/* Ground at Y=180. Head top at Y=10. */}
          <g>
            {/* LABEL: "170 CM" อยู่บนหัวคน อ่านได้ชัดเจนตามที่ผู้ใช้สั่ง */}
            <g>
              <rect 
                x="28" 
                y="-4" 
                width="44" 
                height="11" 
                rx="5.5" 
                fill={isDark ? "#0f172a" : "#ffffff"} 
                stroke={isDark ? "#38bdf8" : "#0284c7"} 
                strokeWidth="1.2" 
                filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.25))"
              />
              <text 
                x="50" 
                y="4.5" 
                textAnchor="middle" 
                fill={isDark ? "#38bdf8" : "#0284c7"} 
                fontSize="7.5" 
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.4px"
              >
                170 CM
              </text>
              {/* Pointer indicator to head */}
              <polygon points="48,7 52,7 50,9.5" fill={isDark ? "#38bdf8" : "#0284c7"} />
            </g>

            {/* Hair & Head (Top at Y=10, Chin at Y=30) */}
            <ellipse cx="50" cy="20" rx="8" ry="9.5" fill={isDark ? "#e2e8f0" : "#334155"} />
            {/* Modern Hair contour */}
            <path d="M 42 18 Q 50 8 58 18 Q 57 11 50 9 Q 43 11 42 18 Z" fill={isDark ? "#94a3b8" : "#0f172a"} />

            {/* Neck (Y=29.5 to 35) */}
            <rect x="47" y="29.5" width="6" height="5.5" rx="2" fill={isDark ? "#cbd5e1" : "#475569"} />

            {/* Stylish Upper Body / Jacket (Y=35 to 88) */}
            <path d="
              M 47 35
              Q 50 37 53 35
              L 67 39
              Q 70 42 69 46
              L 65 82
              Q 64 88 62 88
              L 38 88
              Q 36 88 35 82
              L 31 46
              Q 30 42 33 39
              Z
            " fill={isDark ? "#94a3b8" : "#334155"} />
            
            {/* Jacket Center Zipper / Seam Line */}
            <line x1="50" y1="36" x2="50" y2="88" stroke={isDark ? "#475569" : "#64748b"} strokeWidth="1" strokeDasharray="2 1.5" />

            {/* Left Arm (Relaxed at side) */}
            <path d="M 31 42 Q 27 58 27 75 L 27 91 Q 27 95 30 95 Q 33 95 33 91 L 34 75 Q 35 58 36 46 Z" fill={isDark ? "#cbd5e1" : "#475569"} />

            {/* Right Arm (Relaxed at side) */}
            <path d="M 69 42 Q 73 58 73 75 L 73 91 Q 73 95 70 95 Q 67 95 67 91 L 66 75 Q 65 58 64 46 Z" fill={isDark ? "#cbd5e1" : "#475569"} />

            {/* Modern Trousers / Pants (Y=88 to 172) */}
            <path d="
              M 38 88
              L 62 88
              L 61 130
              Q 60 148 59 172
              L 52 172
              Q 51 140 50 102
              Q 49 140 48 172
              L 41 172
              Q 40 148 39 130
              Z
            " fill={isDark ? "#475569" : "#1e293b"} />

            {/* Left Sneaker (Firmly on ground Y=180) */}
            <path d="M 40 172 L 48 172 L 48 177 L 49 180 L 34 180 Q 32 179 34 176 L 39 173 Z" fill={isDark ? "#38bdf8" : "#0284c7"} />
            <rect x="33" y="178" width="16" height="2" rx="1" fill="#ffffff" />

            {/* Right Sneaker (Firmly on ground Y=180) */}
            <path d="M 52 172 L 60 172 L 61 173 L 66 176 Q 68 179 66 180 L 51 180 L 52 177 Z" fill={isDark ? "#38bdf8" : "#0284c7"} />
            <rect x="51" y="178" width="16" height="2" rx="1" fill="#ffffff" />
          </g>

          {/* ----------------- MODERN SLEEK CAR (Sedan / EV) ----------------- */}
          <g>
            {/* Label บนหลังคารถ (Y=28 ถึง Y=37) น้ำไม่บัง */}
            <g>
              <rect 
                x="147" 
                y="28" 
                width="66" 
                height="9" 
                rx="4.5" 
                fill={isDark ? "#0f172a" : "#ffffff"} 
                stroke={isDark ? "#60a5fa" : "#2563eb"} 
                strokeWidth="1" 
                filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.25))"
              />
              <text 
                x="180" 
                y="35" 
                textAnchor="middle" 
                fill={isDark ? "#60a5fa" : "#2563eb"} 
                fontSize="6.5" 
                fontWeight="bold"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                รถยนต์ (ล้อ 60 cm)
              </text>
            </g>

            {/* Rear Wheel (X=135, Ground Y=180, Radius 28, Diameter 56cm ~ 60cm tire) */}
            <circle cx="135" cy="152" r="28" fill="#090d16" stroke="#334155" strokeWidth="2.5" />
            <circle cx="135" cy="152" r="16" fill="url(#carRimGrad)" stroke="#475569" strokeWidth="1" />
            {/* 5-Spoke Alloy Details */}
            <line x1="135" y1="138" x2="135" y2="166" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <line x1="122" y1="145" x2="148" y2="159" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <line x1="125" y1="161" x2="145" y2="143" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <circle cx="135" cy="152" r="5" fill="#0f172a" />
            {/* Red Sport Caliper */}
            <path d="M 125 142 A 14 14 0 0 1 133 139" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

            {/* Front Wheel (X=225, Ground Y=180, Radius 28) */}
            <circle cx="225" cy="152" r="28" fill="#090d16" stroke="#334155" strokeWidth="2.5" />
            <circle cx="225" cy="152" r="16" fill="url(#carRimGrad)" stroke="#475569" strokeWidth="1" />
            {/* 5-Spoke Alloy Details */}
            <line x1="225" y1="138" x2="225" y2="166" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <line x1="212" y1="145" x2="238" y2="159" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <line x1="215" y1="161" x2="235" y2="143" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <circle cx="225" cy="152" r="5" fill="#0f172a" />
            {/* Red Sport Caliper */}
            <path d="M 215 142 A 14 14 0 0 1 223 139" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

            {/* Underside Rocker Line (17 cm Clearance at Y=163) */}
            <path d="M 98 158 L 105 158 C 105 138 120 125 135 125 C 150 125 165 138 165 158 L 195 158 C 195 138 210 125 225 125 C 240 125 255 138 255 158 L 263 158" fill="none" stroke="#0f172a" strokeWidth="3" />

            {/* Sleek Aerodynamic Body Shell (Coupe / Modern Fastback Sedan) */}
            <path d="
              M 96 156
              L 97 126
              Q 99 116 112 112
              L 125 110
              L 155 44
              Q 160 40 178 40
              L 196 40
              Q 206 40 216 52
              L 230 96
              L 258 108
              Q 266 112 266 122
              L 264 154
              L 255 154
              C 255 132 238 122 225 122
              C 212 122 195 132 195 154
              L 165 154
              C 165 132 148 122 135 122
              C 122 122 105 132 105 154
              Z
            " fill={isDark ? "#1e293b" : "#475569"} stroke={isDark ? "#38bdf8" : "#0284c7"} strokeWidth="1.2" />

            {/* Window Greenhouse Area with Smooth Rake */}
            <path d="
              M 157 46
              L 132 104
              L 173 104
              L 173 45
              Z
            " fill="url(#carGlassGrad)" />
            <path d="
              M 177 45
              L 177 104
              L 225 104
              L 209 52
              Q 202 45 194 45
              Z
            " fill="url(#carGlassGrad)" />

            {/* B-Pillar */}
            <rect x="173" y="44" width="4" height="61" fill="#090d16" />

            {/* Aerodynamic Side Mirror */}
            <ellipse cx="212" cy="98" rx="4.5" ry="2.5" fill={isDark ? "#38bdf8" : "#0284c7"} />

            {/* Sleek LED Headlight Strip */}
            <path d="M 255 116 L 265 118 L 264 124 L 253 121 Z" fill="#38bdf8" filter="drop-shadow(0 0 3px #38bdf8)" />

            {/* Sleek LED Taillight Strip */}
            <path d="M 97 120 L 107 118 L 108 123 L 97 124 Z" fill="#ef4444" filter="drop-shadow(0 0 3px #ef4444)" />

            {/* Door Handle Accents */}
            <rect x="156" y="112" width="7" height="2" rx="1" fill="#cbd5e1" opacity="0.8" />
            <rect x="194" y="112" width="7" height="2" rx="1" fill="#cbd5e1" opacity="0.8" />
          </g>

          {/* ----------------- DYNAMIC WATER LAYER ----------------- */}
          {depthCm > 0 && (
            <g className="transition-all duration-700 ease-out">
              {/* Water Body */}
              <rect 
                x="0" 
                y={waterY} 
                width="350" 
                height={waterHeight} 
                fill={levelTheme.waterFill} 
                className="transition-all duration-700"
              />

              {/* Surface Wave Crest */}
              <path 
                d={`M 0 ${waterY} Q 45 ${waterY - 2}, 90 ${waterY} T 180 ${waterY} T 270 ${waterY} T 350 ${waterY}`} 
                fill="none" 
                stroke="#ffffff" 
                strokeWidth="2.5" 
                strokeOpacity="0.95"
              />

              {/* Depth Pointer Badge right on the water line */}
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

      {/* Traffic Impact Status Tag (Clean & Compact) */}
      <div className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${levelTheme.tagStyle}`}>
        <span>{levelTheme.tag}</span>
      </div>

    </div>
  );
}
