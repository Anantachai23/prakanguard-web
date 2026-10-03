import React, { useState, useRef } from 'react';
import { X, Car, Bike, Truck, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { FLOOD_STANDARDS, VEHICLE_TOLERANCES } from '../data/floodStandards';

const LEVEL_COLORS = {
  1: { dot: 'bg-emerald-500', badge: 'emerald', ring: 'ring-emerald-400', bar: 'bg-emerald-500', text: 'text-emerald-600', darkText: 'text-emerald-300', bg: 'bg-emerald-50', darkBg: 'bg-emerald-950/60', border: 'border-emerald-200', darkBorder: 'border-emerald-800' },
  2: { dot: 'bg-amber-500',   badge: 'amber',   ring: 'ring-amber-400',   bar: 'bg-amber-500',   text: 'text-amber-600',   darkText: 'text-amber-300',   bg: 'bg-amber-50',   darkBg: 'bg-amber-950/60',   border: 'border-amber-200',   darkBorder: 'border-amber-800'   },
  3: { dot: 'bg-rose-500',    badge: 'rose',    ring: 'ring-rose-400',    bar: 'bg-rose-500',    text: 'text-rose-600',    darkText: 'text-rose-300',    bg: 'bg-rose-50',    darkBg: 'bg-rose-950/60',    border: 'border-rose-200',    darkBorder: 'border-rose-800'    },
};

function StatusBadge({ status, isDark }) {
  const map = {
    safe:    { label: 'ผ่านได้', cls: isDark ? 'bg-emerald-900/80 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    warning: { label: 'เสี่ยง',   cls: isDark ? 'bg-amber-900/80 text-amber-300 border-amber-700'     : 'bg-amber-50 text-amber-700 border-amber-300'     },
    danger:  { label: 'อันตราย', cls: isDark ? 'bg-rose-900/80 text-rose-300 border-rose-700'         : 'bg-rose-50 text-rose-700 border-rose-300'         },
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
  const tabsRef = useRef(null);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const cs = FLOOD_STANDARDS.find(s => s.level === activeTab) || FLOOD_STANDARDS[0];
  const lc = LEVEL_COLORS[activeTab] || LEVEL_COLORS[1];

  const scrollTabs = (dir) => {
    if (tabsRef.current) tabsRef.current.scrollBy({ left: dir * 100, behavior: 'smooth' });
  };

  const vehicles = [
    { key: 'sedan',      icon: <Car className="w-4 h-4" />,   data: cs.vehicleImpact?.sedan },
    { key: 'motorcycle', icon: <Bike className="w-4 h-4" />,  data: cs.vehicleImpact?.motorcycle },
    { key: 'suv',        icon: <Truck className="w-4 h-4" />, data: cs.vehicleImpact?.suv },
    { key: 'truck',      icon: <Truck className="w-4 h-4" />, data: { ...cs.vehicleImpact?.truck, status: cs.vehicleImpact?.truck?.status || 'safe' } },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`w-full sm:max-w-xl flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] transition-colors ${
        isDark ? 'bg-slate-900 border border-slate-700 text-slate-100' : 'bg-white text-slate-800'
      }`}>

        {/* ── HEADER ── */}
        <div className={`flex items-center gap-3 px-4 pt-5 pb-3 ${isDark ? 'border-b border-slate-800' : 'border-b border-slate-100'}`}>
          {/* Drag handle on mobile */}
          <span className="sm:hidden absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 block" />
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${isDark ? 'bg-blue-950 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              <path d="M6 14c1.5-1 3.5-1 5 0s3.5 1 5 0" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              เกณฑ์มาตรฐานระดับน้ำท่วม
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ปภ. / กรมทางหลวง — ผลกระทบต่อยานพาหนะ</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl cursor-pointer transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SCROLLABLE TAB PILLS ── */}
        <div className={`flex items-center gap-1 px-2 py-2 ${isDark ? 'bg-slate-950/40 border-b border-slate-800' : 'bg-slate-50 border-b border-slate-100'}`}>
          <button
            onClick={() => scrollTabs(-1)}
            className={`p-1.5 rounded-lg shrink-0 cursor-pointer ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div ref={tabsRef} className="flex gap-2 overflow-x-auto flex-1 no-scrollbar scroll-smooth px-1">
            {FLOOD_STANDARDS.map(s => {
              const c = LEVEL_COLORS[s.level];
              const isActive = activeTab === s.level;
              return (
                <button
                  key={s.level}
                  onClick={() => setActiveTab(s.level)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? (isDark ? `${c.darkBg} ${c.darkText} ${c.darkBorder}` : `${c.bg} ${c.text} ${c.border}`)
                      : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500')
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                  {s.shortName}
                  <span className={`font-mono text-[10px] opacity-80`}>{s.depthRange}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollTabs(1)}
            className={`p-1.5 rounded-lg shrink-0 cursor-pointer ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-slate-900' : 'bg-white'}`}>

          {/* Level Summary Card */}
          <div className={`mx-4 mt-4 p-4 rounded-2xl border ${isDark ? `${lc.darkBg} ${lc.darkBorder}` : `${lc.bg} ${lc.border}`}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className={`flex items-center gap-2 mb-1`}>
                  <span className={`w-3 h-3 rounded-full shrink-0 ${lc.dot}`} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? lc.darkText : lc.text}`}>
                    {cs.name}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>ความลึก:</strong> {cs.waterDepthVisual}
                </p>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>คำแนะนำ:</strong> {cs.trafficAdvice}
                </p>
              </div>
              <div className={`text-right shrink-0`}>
                <div className={`text-[10px] font-medium mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ช่วงความลึก</div>
                <div className={`text-2xl font-black font-mono ${isDark ? lc.darkText : lc.text}`}>
                  {cs.depthRange}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Cards */}
          <div className="mx-4 mt-3">
            <p className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ผลกระทบต่อยานพาหนะ
            </p>
            <div className="grid grid-cols-2 gap-2">
              {vehicles.map(({ key, icon, data }) => data && (
                <div
                  key={key}
                  className={`p-3 rounded-xl border flex flex-col gap-1.5 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-1 rounded-lg ${isDark ? 'bg-slate-700 text-cyan-400' : 'bg-white text-blue-600 border border-slate-200'}`}>
                      {icon}
                    </div>
                    <StatusBadge status={data.status} isDark={isDark} />
                  </div>
                  <div>
                    <p className={`text-[11px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.label}</p>
                    <p className={`text-[10px] leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{data.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ground Clearance Table */}
          <div className={`mx-4 mt-3 mb-2 p-3 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-[11px] font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ขีดจำกัดความลึกปลอดภัย (Ground Clearance)
            </p>
            <div className="space-y-1">
              {VEHICLE_TOLERANCES.map((v, i) => (
                <div key={i} className={`flex items-center justify-between text-[11px] py-1 border-b last:border-0 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{v.type}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{v.note}</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>&le; {v.limitCm} ซม.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OIC Reference */}
          <div className={`mx-4 mb-4 p-3 rounded-xl border text-[11px] flex items-center gap-2 ${isDark ? 'bg-blue-950/40 border-blue-900 text-blue-200' : 'bg-blue-50 border-blue-200 text-slate-600'}`}>
            <Info className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span>คปภ.: <strong className={isDark ? 'text-white' : 'text-slate-800'}>{cs.oicDamageLevel}</strong></span>
            <span className={`ml-auto text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>อ้างอิง: {cs.officialRef}</span>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className={`flex items-center justify-between gap-3 px-4 py-3 border-t ${isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
          <p className="text-[11px] leading-snug flex-1">
            🚗 น้ำท่วมทาง: ปิดแอร์ทันที · ไม่เร่งเครื่อง · ไม่สตาร์ทซ้ำ
          </p>
          <button
            onClick={onClose}
            className="shrink-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            เข้าใจแล้ว
          </button>
        </div>

      </div>
    </div>
  );
}
