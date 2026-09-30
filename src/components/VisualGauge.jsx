import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Info, Scale } from 'lucide-react';
import { FLOOD_STANDARDS } from '../data/floodStandards';

export default function VisualGauge({ depthCm, level, impactText, theme = 'light' }) {
  const isDark = theme === 'dark';
  // Percentage based on 60cm max gauge height
  const percentage = Math.min(Math.round((depthCm / 60) * 100), 96);
  const standard = FLOOD_STANDARDS.find(s => s.level === level) || FLOOD_STANDARDS[0];

  let levelTheme = {
    badge: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-800 border-emerald-300",
    gradient: "from-emerald-400 via-teal-500 to-emerald-600",
    glow: "#10b981",
    tag: "🟢 ผ่านได้ปกติ",
    tagStyle: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-800" : "bg-emerald-100 text-emerald-800 border-emerald-300"
  };

  if (level === 2) {
    levelTheme = {
      badge: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-800 border-amber-300",
      gradient: "from-amber-400 via-orange-500 to-amber-600",
      glow: "#f59e0b",
      tag: "🟠 รถเล็กเสี่ยงสูง",
      tagStyle: isDark ? "bg-amber-950/80 text-amber-300 border-amber-800" : "bg-amber-100 text-amber-800 border-amber-300"
    };
  } else if (level === 3) {
    levelTheme = {
      badge: isDark ? "bg-rose-950/80 text-rose-300 border-rose-800" : "bg-rose-50 text-rose-800 border-rose-300",
      gradient: "from-rose-500 via-red-600 to-rose-700",
      glow: "#f43f5e",
      tag: "🔴 วิกฤตห้ามผ่าน",
      tagStyle: isDark ? "bg-rose-950/80 text-rose-300 border-rose-800" : "bg-rose-100 text-rose-800 border-rose-300"
    };
  }

  return (
    <div className={`border rounded-2xl p-3.5 sm:p-4 shadow-sm transition-colors ${
      isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
    }`}>
      
      {/* Top Level Logo & Depth Header */}
      <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
        isDark ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner ${levelTheme.badge}`}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              <path d="M7 14.5c1.2-.8 2.8-.8 4 0s2.8.8 4 0" />
            </svg>
          </div>
          <div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border inline-block ${levelTheme.badge}`}>
              {standard.name}
            </span>
            <span className={`text-[10px] sm:text-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              เกณฑ์มาตรฐาน ปภ.: {standard.depthRange}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-[10px] sm:text-xs block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ระดับน้ำเฉลี่ยเมื่อท่วม</span>
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
              {depthCm}
            </span>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ซม.</span>
          </div>
        </div>
      </div>

      {/* Visual Water Level Gauge Tank */}
      <div className={`h-44 w-full rounded-xl relative flex items-end justify-between px-3 sm:px-5 pb-2 border overflow-hidden shadow-inner ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        
        {/* Metric Ruler Lines (Left & Background Grid) */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-40">
          <div className={`w-full border-b border-dashed flex items-center justify-end pr-8 text-[9px] font-mono ${
            isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-500'
          }`}>60 cm (มิดล้อรถเก๋ง)</div>
          <div className={`w-full border-b border-dashed flex items-center justify-end pr-8 text-[9px] font-mono ${
            isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-500'
          }`}>40 cm (ระดับเข่า)</div>
          <div className={`w-full border-b border-dashed flex items-center justify-end pr-8 text-[9px] font-mono ${
            isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-500'
          }`}>20 cm (ชายประตูล่าง)</div>
          <div className={`w-full border-b ${isDark ? 'border-slate-700' : 'border-slate-300'}`}></div>
        </div>

        {/* Dynamic Water Animation Layer */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${levelTheme.gradient} transition-all duration-700 ease-out z-10 opacity-90`}
          style={{ height: `${percentage}%` }}
        >
          {/* Surface Ripples & Light Reflection */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse"></div>
          <div className="absolute top-1 left-0 right-0 h-2 bg-blue-100/30"></div>
        </div>

        {/* Human Silhouette Comparison (Scale ~170cm) */}
        <div className="relative z-20 flex flex-col items-center">
          <svg className={`w-12 h-28 drop-shadow ${isDark ? 'text-slate-400' : 'text-slate-600'}`} viewBox="0 0 24 64" fill="currentColor">
            <circle cx="12" cy="7" r="4.5" />
            <path d="M9 13h6c2.2 0 4 1.8 4 4v16h-3V58c0 1.1-.9 2-2 2h-1c-1.1 0-2-.9-2-2V36h-1v22c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V33H3V17c0-2.2 1.8-4 4-4h2z" />
          </svg>
          <span className={`text-[9px] font-semibold mt-0.5 px-1.5 py-0.2 rounded border shadow-sm ${
            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white/95 text-slate-700 border-slate-200'
          }`}>
            คนยืน 170 ซม.
          </span>
        </div>

        {/* Modern Car Vector Silhouette */}
        <div className="relative z-20 flex flex-col items-center">
          <svg className={`w-24 h-18 drop-shadow ${isDark ? 'text-slate-400' : 'text-slate-600'}`} viewBox="0 0 100 48" fill="currentColor">
            <path d="M12 28l7-12c1.5-2.5 4-4 7-4h38c3 0 5.5 1.5 7 4l8 12h14c2.2 0 4 1.8 4 4v4c0 1.1-.9 2-2 2h-4c0-5-4-9-9-9s-9 4-9 9H34c0-5-4-9-9-9s-9 4-9 9H6c-2.2 0-4-.9-4-2v-4c0-2.2 1.8-4 4-4h6z" />
            <circle cx="25" cy="38" r="8" fill="#334155" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="25" cy="38" r="3" fill="#cbd5e1" />
            <circle cx="75" cy="38" r="8" fill="#334155" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="75" cy="38" r="3" fill="#cbd5e1" />
            <path d="M28 15h18v10H22l6-10zM49 15h18l6 10H49V15z" fill="#0f172a" opacity="0.6" />
          </svg>
          <span className={`text-[9px] font-semibold mt-0.5 px-1.5 py-0.2 rounded border shadow-sm ${
            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white/95 text-slate-700 border-slate-200'
          }`}>
            รถเก๋ง (ท้องรถ 15 ซม.)
          </span>
        </div>

        {/* Precision Ruler (Right Side) */}
        <div className={`absolute right-2 top-2 bottom-2 w-7 flex flex-col justify-between text-[9px] font-mono z-20 border-l pl-1.5 ${
          isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'
        }`}>
          <span className="font-bold">60cm</span>
          <span className="font-bold">40cm</span>
          <span className="font-bold">20cm</span>
          <span className="font-bold">0cm</span>
        </div>
      </div>

      {/* Traffic Impact Status Pill */}
      <div className={`mt-3 p-2.5 rounded-xl border flex items-start gap-2.5 shadow-sm ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${levelTheme.tagStyle}`}>
          {levelTheme.tag}
        </span>
        <span className={`text-xs sm:text-sm leading-snug font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {impactText}
        </span>
      </div>

      {/* Official Standard Citation */}
      <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
        isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span>อ้างอิง: สำนักการระบายน้ำ & กรมทางหลวง</span>
        <span>คปภ. ประเมินความเสียหาย</span>
      </div>

    </div>
  );
}
