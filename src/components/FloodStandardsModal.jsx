import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FLOOD_STANDARDS } from '../data/floodStandards';
import {
  CivicStandards,
  CivicVehicleSedan,
  CivicVehicleMoto,
  CivicVehicleSuv,
  CivicVehicleTruck,
  CivicShield
} from './CivicIcons';

const LEVEL_COLORS = {
  1: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/70 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/80' },
  2: { dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50/70 dark:bg-amber-950/30',     border: 'border-amber-200 dark:border-amber-800/80'   },
  3: { dot: 'bg-rose-500',    text: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50/70 dark:bg-rose-950/30',       border: 'border-rose-200 dark:border-rose-800/80'    },
};

function StatusBadge({ status, isDark }) {
  const map = {
    safe:    { label: 'ผ่านได้', cls: isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    warning: { label: 'ควรเลี่ยง', cls: isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200' },
    danger:  { label: 'ห้ามผ่าน', cls: isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200' },
  };
  const s = map[status] || map.safe;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function FloodStandardsModal({ isOpen, onClose, theme = 'light' }) {
  const [activeTab, setActiveTab] = useState(1);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const currentStandard = FLOOD_STANDARDS.find(s => s.level === activeTab) || FLOOD_STANDARDS[0];
  const lc = LEVEL_COLORS[activeTab] || LEVEL_COLORS[1];

  const vehicles = [
    { key: 'sedan',      icon: <CivicVehicleSedan className="w-4 h-4" />, data: currentStandard.vehicleImpact?.sedan },
    { key: 'motorcycle', icon: <CivicVehicleMoto className="w-4 h-4" />,  data: currentStandard.vehicleImpact?.motorcycle },
    { key: 'suv',        icon: <CivicVehicleSuv className="w-4 h-4" />,   data: currentStandard.vehicleImpact?.suv },
    { key: 'truck',      icon: <CivicVehicleTruck className="w-4 h-4" />, data: currentStandard.vehicleImpact?.truck },
  ];

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
    >
      <div className={`w-[88vw] max-w-[335px] sm:max-w-lg my-auto m-auto flex flex-col rounded-xl border shadow-2xl overflow-hidden max-h-[72vh] sm:max-h-[84vh] transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Top Institutional Bar */}
        <div className="h-1 w-full bg-blue-700 shrink-0" />

        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-white border-slate-200 text-blue-700 shadow-2xs'
            }`}>
              <CivicStandards className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-xs sm:text-sm font-bold leading-tight tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                เกณฑ์มาตรฐานระดับน้ำท่วมขัง
              </h3>
              <p className={`text-[9.5px] sm:text-xs leading-tight mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ข้อแนะนำการสัญจรตามประเภทยานพาหนะ
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Segmented Level Selector */}
        <div className={`px-3.5 py-2 sm:px-5 border-b grid grid-cols-3 gap-1.5 sm:gap-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50/40'
        }`}>
          {FLOOD_STANDARDS.map(s => {
            const isActive = activeTab === s.level;
            const c = LEVEL_COLORS[s.level];
            return (
              <button
                key={s.level}
                type="button"
                onClick={() => setActiveTab(s.level)}
                className={`py-1.5 px-1.5 sm:py-2 sm:px-2 rounded-lg border text-center transition-colors cursor-pointer ${
                  isActive
                    ? `${c.bg} ${c.border}`
                    : (isDark ? 'bg-slate-800/50 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${c.dot}`} />
                  <span className={`text-[11px] sm:text-xs font-bold ${isActive ? (isDark ? 'text-white' : 'text-slate-900') : ''}`}>
                    {s.shortName}
                  </span>
                </div>
                <span className={`text-[10px] sm:text-[11px] font-mono block font-semibold ${c.text}`}>
                  {s.depthRange}
                </span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-3 sm:py-4 space-y-2.5 sm:space-y-3.5">
          {/* Summary Card */}
          <div className={`p-3 rounded-lg border ${lc.bg} ${lc.border}`}>
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <span className={`text-[11.5px] sm:text-xs font-bold ${lc.text}`}>
                {currentStandard.name}
              </span>
              <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${
                isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-200'
              }`}>
                {currentStandard.depthRange}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 py-2 border-b border-slate-200/60 dark:border-slate-700/60 text-[11px] sm:text-xs">
              <div>
                <span className={`text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  เทียบระดับร่างกาย
                </span>
                <span className={`font-semibold mt-0.5 block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {currentStandard.humanLevel}
                </span>
              </div>
              <div>
                <span className={`text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  เทียบระดับตัวรถ
                </span>
                <span className={`font-semibold mt-0.5 block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {currentStandard.vehicleLevel}
                </span>
              </div>
            </div>

            <p className={`text-[11px] sm:text-xs pt-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {currentStandard.trafficAdvice}
            </p>
          </div>

          {/* Vehicle Matrix */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className={`text-[11px] sm:text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                เกณฑ์ประเมินตามประเภทยานพาหนะ
              </h4>
              <span className="text-[9.5px] text-slate-400">มาตรฐานกรมทางหลวง / ปภ.</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {vehicles.map(({ key, icon, data }) => data && (
                <div
                  key={key}
                  className={`p-2.5 sm:p-3 rounded-lg border flex flex-col justify-between gap-1.5 ${
                    isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border flex items-center justify-center ${
                      isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-white border-slate-200 text-blue-700'
                    }`}>
                      {icon}
                    </div>
                    <StatusBadge status={data.status} isDark={isDark} />
                  </div>
                  <div>
                    <span className={`text-[11px] sm:text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {data.label}
                    </span>
                    <span className={`text-[10px] sm:text-[11px] block mt-0.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {data.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-3.5 py-2 sm:px-5 sm:py-3 border-t flex items-center justify-between text-xs shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-500'
        }`}>
          <span className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] truncate">
            <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">คู่มือความปลอดภัยการจราจร</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] sm:text-xs border transition-colors cursor-pointer shrink-0 ${
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
