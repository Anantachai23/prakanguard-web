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
          viewBox="0 0 350 192" 
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
          <rect x="0" y="0" width="350" height="130" fill={isDark ? "#f43f5e" : "#ffe4e6"} opacity={isDark ? "0.04" : "0.30"} />
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
          {/* Ground at Y=180. Head at Y=10. */}
          <g className={isDark ? "text-slate-300" : "text-slate-700"}>
            
            {/* LABEL: "คน 170 cm" อยู่บนหัวคน (Y=2 ถึง Y=8) น้ำไม่มีวันบัง! */}
            <g>
              <rect 
                x="22" 
                y="1" 
                width="56" 
                height="8" 
                rx="4" 
                fill={isDark ? "#0f172a" : "#ffffff"} 
                stroke={isDark ? "#38bdf8" : "#0284c7"} 
                strokeWidth="0.9" 
              />
              <text 
                x="50" 
                y="7" 
                textAnchor="middle" 
                fill={isDark ? "#38bdf8" : "#0284c7"} 
                fontSize="6" 
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                คน 170 cm
              </text>
            </g>

            {/* Head & Hair (Y=10 to 32) */}
            <ellipse cx="50" cy="21" rx="10.5" ry="11" fill="currentColor" />
            <path d="M 39.5 19 Q 50 9 60.5 19 Q 61 14 50 10.5 Q 39 14 39.5 19 Z" fill={isDark ? "#f8fafc" : "#1e293b"} opacity="0.75" />

            {/* Neck (Y=32 to 38) */}
            <path d="M 46.5 32 L 46.5 39 L 53.5 39 L 53.5 32 Z" fill="currentColor" />

            {/* Athletic Torso & Shoulders (Y=38 to 98) */}
            <path d="
              M 46.5 39
              Q 50 42 53.5 39
              L 70 44
              Q 72 47 71 52
              L 66 84
              Q 66 91 67 98
              L 33 98
              Q 34 91 34 84
              L 29 52
              Q 28 47 30 44
              Z
            " fill="currentColor" />

            {/* Arms */}
            <path d="M 29 44 Q 24 58 24 72 L 24 92 Q 23 97 26 97 Q 29 97 30 92 L 31 72 Q 32 58 34 49 Z" fill="currentColor" opacity="0.95" />
            <path d="M 70 44 Q 75 58 75 72 L 75 92 Q 76 97 73 97 Q 70 97 69 92 L 68 72 Q 67 58 65 49 Z" fill="currentColor" opacity="0.95" />

            {/* Legs & Shoes (Y=98 to 180) */}
            <path d="
              M 33 98 L 33 135 Q 34 144 36 145 Q 34 156 35 165 L 38 172 L 31 174 Q 29 178 31 180 L 48 180 Q 49 177 47 172 L 46 165 Q 48 156 46 145 Q 47 140 48 135 L 49 104 Z
            " fill="currentColor" />
            <path d="
              M 51 104 L 52 135 Q 53 140 54 145 Q 52 156 54 165 L 53 172 Q 51 177 52 180 L 69 180 Q 71 178 69 174 L 62 172 L 65 165 Q 66 156 64 145 Q 66 144 67 135 L 67 98 Z
            " fill="currentColor" />
          </g>

          {/* ----------------- MODERN CAR SILHOUETTE ----------------- */}
          <g className={isDark ? "text-slate-400" : "text-slate-600"}>
            {/* Label บนหลังคารถ (Y=31) น้ำไม่บัง */}
            <g>
              <rect 
                x="147" 
                y="31" 
                width="66" 
                height="8" 
                rx="4" 
                fill={isDark ? "#0f172a" : "#ffffff"} 
                stroke={isDark ? "#60a5fa" : "#2563eb"} 
                strokeWidth="0.9" 
              />
              <text 
                x="180" 
                y="37" 
                textAnchor="middle" 
                fill={isDark ? "#60a5fa" : "#2563eb"} 
                fontSize="6" 
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                รถยนต์ (ล้อ 60 cm)
              </text>
            </g>

            {/* Rear Wheel (Y=120 to 180) */}
            <circle cx="132" cy="150" r="30" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
            <circle cx="132" cy="150" r="16" fill="url(#carRimGrad)" stroke="#64748b" strokeWidth="1" />
            <circle cx="132" cy="150" r="5" fill="#0f172a" />

            {/* Front Wheel (Y=120 to 180) */}
            <circle cx="220" cy="150" r="30" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
            <circle cx="220" cy="150" r="16" fill="url(#carRimGrad)" stroke="#64748b" strokeWidth="1" />
            <circle cx="220" cy="150" r="5" fill="#0f172a" />

            {/* Underside Clearance (15cm at Y=165) */}
            <path d="M 92 156 L 92 165 L 102 165 C 102 143 118 128 132 128 C 146 128 162 143 162 165 L 190 165 C 190 143 206 128 220 128 C 234 128 250 143 250 165 L 260 165 L 260 152 Z" fill="#0f172a" opacity="0.5" />

            {/* Aerodynamic Body Shell */}
            <path d="
              M 90 152
              L 92 130
              Q 94 116 110 114
              L 126 112
              L 148 52
              Q 152 42 168 42
              L 202 42
              Q 212 42 220 52
              L 240 110
              L 256 114
              Q 262 116 262 126
              L 260 154
              L 250 154
              C 250 134 235 121 220 121
              C 205 121 190 134 190 154
              L 162 154
              C 162 134 147 121 132 121
              C 117 121 102 134 102 154
              Z
            " fill={isDark ? "#334155" : "#64748b"} stroke={isDark ? "#475569" : "#475569"} strokeWidth="1.2" />

            {/* Windows */}
            <path d="M 150 55 L 134 108 L 172 108 L 172 52 L 162 50 Z" fill="url(#carGlassGrad)" />
            <path d="M 176 52 L 176 108 L 228 108 L 214 55 Q 208 50 198 50 Z" fill="url(#carGlassGrad)" />

            {/* Headlights & Taillights */}
            <rect x="258" y="120" width="4" height="9" rx="2" fill="#38bdf8" />
            <rect x="90" y="122" width="3" height="8" rx="1.5" fill="#ef4444" />
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
