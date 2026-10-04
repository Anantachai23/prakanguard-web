import React, { useState } from 'react';
import { X, Car, Bike, Truck, ShieldAlert } from 'lucide-react';
import { FLOOD_STANDARDS } from '../data/floodStandards';

const LEVEL_COLORS = {
  1: { dot: 'bg-emerald-500', badge: 'emerald', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-emerald-200 dark:border-emerald-800' },
  2: { dot: 'bg-amber-500',   badge: 'amber',   text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/50',   border: 'border-amber-200 dark:border-amber-800'   },
  3: { dot: 'bg-rose-500',    badge: 'rose',    text: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-950/50',    border: 'border-rose-200 dark:border-rose-800'    },
};

function StatusBadge({ status, isDark }) {
  const map = {
    safe:    { label: 'ผ่านได้', cls: isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    warning: { label: 'ควรเลี่ยง', cls: isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-300' },
    danger:  { label: 'ห้ามผ่าน', cls: isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-300' },
  };
  const s = map[status] || map.safe;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${s.cls}`}>
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
    { key: 'sedan',      icon: <Car className="w-4 h-4" />,   data: currentStandard.vehicleImpact?.sedan },
    { key: 'motorcycle', icon: <Bike className="w-4 h-4" />,  data: currentStandard.vehicleImpact?.motorcycle },
    { key: 'suv',        icon: <Truck className="w-4 h-4" />, data: currentStandard.vehicleImpact?.suv },
    { key: 'truck',      icon: <Truck className="w-4 h-4" />, data: currentStandard.vehicleImpact?.truck },
  ];

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[110] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 smooth-backdrop animate-in fade-in duration-200"
    >
      <div className={`w-full max-w-md flex flex-col rounded-3xl shadow-2xl overflow-hidden max-h-[65vh] sm:max-h-[75vh] smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-white border border-slate-200 text-slate-900'
      }`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-blue-400/50 shadow-sm">
              <img src="/logo.png" alt="PrakanGuard" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                เกณฑ์ระดับน้ำท่วม
              </h3>
              <p className={`text-[10px] sm:text-xs text-slate-400`}>
                คำแนะนำความปลอดภัยต่อยานพาหนะ
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`p-2 rounded-xl cursor-pointer transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Large Level Selector Buttons */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
          {FLOOD_STANDARDS.map(s => {
            const isActive = activeTab === s.level;
            const c = LEVEL_COLORS[s.level];
            return (
              <button
                key={s.level}
                type="button"
                onClick={() => setActiveTab(s.level)}
                className={`py-2 px-1 rounded-2xl border text-center transition-all cursor-pointer ${
                  isActive
                    ? `${c.bg} ${c.border} ring-2 ring-blue-500/50 shadow-sm`
                    : (isDark ? 'bg-slate-800/60 border-slate-700/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={`text-xs font-bold ${isActive ? (isDark ? 'text-white' : 'text-slate-900') : ''}`}>
                    {s.shortName}
                  </span>
                </div>
                <span className={`text-[11px] font-mono block ${c.text} font-bold`}>
                  {s.depthRange}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">

          {/* Level Info Banner */}
          <div className={`p-3.5 rounded-2xl border ${lc.bg} ${lc.border}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${lc.text}`}>
                {currentStandard.name}
              </span>
              <span className={`text-xs font-extrabold font-mono px-2 py-0.5 rounded-md ${isDark ? 'bg-slate-900/80 text-white' : 'bg-white/90 text-slate-800'}`}>
                {currentStandard.depthRange}
              </span>
            </div>
            <div className="space-y-1.5 mt-2">
              <div className="flex items-start gap-1.5 text-xs">
                <span className="font-bold shrink-0 text-blue-600 dark:text-cyan-400">🚶 ระดับร่างกายมนุษย์:</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{currentStandard.humanLevel}</span>
              </div>
              <div className="flex items-start gap-1.5 text-xs">
                <span className="font-bold shrink-0 text-amber-600 dark:text-amber-400">🚗 ระดับส่วนของรถยนต์:</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{currentStandard.vehicleLevel}</span>
              </div>
            </div>
            {currentStandard.descriptionFormal && (
              <p className={`text-xs mt-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed border-t border-slate-200/50 dark:border-slate-700/50 pt-1.5`}>
                <strong className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">คำอธิบายสถานการณ์อย่างเป็นทางการ:</strong>
                {currentStandard.descriptionFormal}
              </p>
            )}
            <p className={`text-xs mt-2 text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-slate-700/50 pt-1.5`}>
              <strong className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">คำแนะนำด้านความปลอดภัย:</strong>
              {currentStandard.trafficAdvice}
            </p>
          </div>

          {/* Vehicle Impact Grid */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              คำแนะนำรายประเภทรถ
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {vehicles.map(({ key, icon, data }) => data && (
                <div
                  key={key}
                  className={`p-3 rounded-2xl border flex flex-col justify-between gap-1.5 ${
                    isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-1.5 rounded-xl ${isDark ? 'bg-slate-700 text-cyan-400' : 'bg-white text-blue-600 border border-slate-200'}`}>
                      {icon}
                    </div>
                    <StatusBadge status={data.status} isDark={isDark} />
                  </div>
                  <div>
                    <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {data.label}
                    </span>
                    <span className={`text-[11px] block mt-0.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {data.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
