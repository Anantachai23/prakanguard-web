import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertOctagon, PhoneCall, ShieldCheck } from 'lucide-react';
import { FLOOD_STANDARDS } from '../data/floodStandards';
import {
  CivicStandards,
  CivicVehicleSedan,
  CivicVehicleMoto,
  CivicVehicleSuv,
  CivicVehicleTruck,
  CivicShield
} from './CivicIcons';
import { playTabSound, playCloseSound, playEmergencySound } from '../services/soundEffects';

const LEVEL_CONFIG = {
  1: {
    badge: 'ปกติ / รอการระบาย',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/80 dark:border-emerald-800/80',
    indicator: 'bg-emerald-500',
    title: 'ระดับ 1: น้ำท่วมขังรอการระบาย (5 - 20 ซม.)',
    overview: 'สภาวะน้ำรอการระบายบนผิวจราจรระยะเริ่มต้น ไม่ส่งผลกระทบต่อระบบเครื่องยนต์ รถทุกประเภทสามารถสัญจรผ่านได้ตามปกติโดยลดความเร็วลง',
    accentBorder: 'border-emerald-500',
    gaugeBg: 'bg-emerald-500',
    humanText: 'ระดับหลังเท้าถึงระดับข้อเท้า',
    vehicleText: 'ระดับขอบยางล่างถึงใต้ท้องรถเก๋ง (ยังไม่ถึงดุมล้อ)',
  },
  2: {
    badge: 'ปานกลาง / เฝ้าระวัง',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300/80 dark:border-amber-800/80',
    indicator: 'bg-amber-500',
    title: 'ระดับ 2: น้ำท่วมขังปานกลาง (21 - 50 ซม.)',
    overview: 'สภาวะน้ำท่วมขังระดับเฝ้าระวัง เริ่มมีความเสี่ยงต่อระบบไฟฟ้าและท่อไอเสียของรถยนต์ขนาดเล็กและรถจักรยานยนต์ แนะนำให้หลีกเลี่ยงหรือใช้เส้นทางสำรอง',
    accentBorder: 'border-amber-500',
    gaugeBg: 'bg-amber-500',
    humanText: 'ระดับหน้าแข้งถึงระดับหัวเข่า',
    vehicleText: 'ระดับแตะดุมล้อถึงใต้ขอบประตู (ท่อไอเสียจมน้ำบางส่วน)',
  },
  3: {
    badge: 'วิกฤต / อันตรายสูง',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300/80 dark:border-rose-800/80',
    indicator: 'bg-rose-500',
    title: 'ระดับ 3: น้ำท่วมขังระดับวิกฤต (มากกว่า 50 ซม.)',
    overview: 'สภาวะน้ำท่วมขังวิกฤต มวลน้ำเอ่อล้นเต็มทุกช่องทาง ห้ามรถยนต์ขนาดเล็กและรถจักรยานยนต์ผ่านโดยเด็ดขาด สัญจรได้เฉพาะรถยกสูงพิเศษหรือรถบรรทุกขนาดใหญ่',
    accentBorder: 'border-rose-500',
    gaugeBg: 'bg-rose-500',
    humanText: 'ระดับเหนือหัวเข่า ต้นขา ถึงระดับเอว/สะโพก',
    vehicleText: 'ระดับมิดล้อรถยนต์ พ้นขอบล่างประตู เข้าท่วมห้องโดยสาร',
  }
};

function VehicleImpactCard({ vehicle, data, isDark }) {
  if (!data) return null;

  const statusConfig = {
    safe: {
      label: 'ผ่านได้ปกติ',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
    },
    warning: {
      label: 'ควรเลี่ยง / เฝ้าระวัง',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
    },
    danger: {
      label: 'ห้ามผ่านเด็ดขาด',
      badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
    }
  };

  const status = statusConfig[data.status] || statusConfig.safe;

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      isDark 
        ? 'bg-slate-850/90 border-slate-750 hover:border-slate-700' 
        : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
            isDark ? 'bg-slate-800 border-slate-700 text-sky-400' : 'bg-white border-slate-200 text-blue-700 shadow-2xs'
          }`}>
            {vehicle.icon}
          </div>
          <span className={`text-xs font-bold leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {data.label}
          </span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${status.badgeClass}`}>
          {status.icon}
          <span>{status.label}</span>
        </span>
      </div>
      <p className={`text-[11.5px] leading-relaxed pl-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {data.desc}
      </p>
    </div>
  );
}

export default function FloodStandardsModal({ isOpen, onClose, theme = 'light' }) {
  const [activeLevel, setActiveLevel] = useState(1);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const currentStandard = FLOOD_STANDARDS.find(s => s.level === activeLevel) || FLOOD_STANDARDS[0];
  const cfg = LEVEL_CONFIG[activeLevel] || LEVEL_CONFIG[1];

  const vehicles = [
    { key: 'sedan',      name: 'รถเก๋ง / Eco Car', icon: <CivicVehicleSedan className="w-4 h-4" />, data: currentStandard.vehicleImpact?.sedan },
    { key: 'motorcycle', name: 'รถจักรยานยนต์',     icon: <CivicVehicleMoto className="w-4 h-4" />,  data: currentStandard.vehicleImpact?.motorcycle },
    { key: 'suv',        name: 'รถกระบะ / SUV',    icon: <CivicVehicleSuv className="w-4 h-4" />,   data: currentStandard.vehicleImpact?.suv },
    { key: 'truck',      name: 'รถบรรทุก / รถบัส', icon: <CivicVehicleTruck className="w-4 h-4" />, data: currentStandard.vehicleImpact?.truck },
  ];

  return (
    <div 
      onClick={(e) => { 
        if (e.target === e.currentTarget) {
          playCloseSound();
          onClose(); 
        }
      }}
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in-50 duration-150"
    >
      <div className={`w-full max-w-[calc(100vw-24px)] xs:max-w-[430px] sm:max-w-xl my-auto flex flex-col rounded-2xl border shadow-2xl overflow-hidden max-h-[88vh] shrink-0 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Institutional Blue Top Bar */}
        <div className="h-1 w-full bg-blue-600 shrink-0" />

        {/* Header */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-850 border-slate-700 text-sky-400' : 'bg-white border-slate-200 text-blue-700 shadow-2xs'
            }`}>
              <CivicStandards className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold leading-tight tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                เกณฑ์มาตรฐานระดับน้ำ & ความปลอดภัยยานพาหนะ
              </h3>
              <p className={`text-[11px] leading-tight mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                มาตรฐานกรมทางหลวง และกรมป้องกันและบรรเทาสาธารณภัย (ปภ.)
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => {
              playCloseSound();
              onClose();
            }} 
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Level Segmented Control Tabs */}
        <div className={`p-2 sm:p-2.5 border-b shrink-0 ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'}`}>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            {[
              { level: 1, range: '5 - 20 ซม.', label: 'ปกติ / รอระบาย', color: 'emerald' },
              { level: 2, range: '21 - 50 ซม.', label: 'ปานกลาง / เฝ้าระวัง', color: 'amber' },
              { level: 3, range: '> 50 ซม.', label: 'วิกฤต / อันตราย', color: 'rose' },
            ].map(tab => {
              const isActive = activeLevel === tab.level;
              return (
                <button
                  key={tab.level}
                  type="button"
                  onClick={() => {
                    playTabSound();
                    setActiveLevel(tab.level);
                  }}
                  className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                    isActive
                      ? (isDark 
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                          : 'bg-white text-slate-900 shadow-sm border border-slate-200/80')
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <span className={`w-2 h-2 rounded-full ${
                      tab.level === 1 ? 'bg-emerald-500' : tab.level === 2 ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <span className="text-xs font-bold leading-none">
                      ระดับ {tab.level}
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono font-bold block ${
                    isActive 
                      ? (tab.level === 1 ? 'text-emerald-600 dark:text-emerald-400' : tab.level === 2 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')
                      : 'opacity-80'
                  }`}>
                    {tab.range}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar-thin">
          
          {/* Situation Overview Banner */}
          <div className={`p-3.5 sm:p-4 rounded-xl border relative overflow-hidden ${
            activeLevel === 1 
              ? (isDark ? 'bg-emerald-950/25 border-emerald-800/60' : 'bg-emerald-50/70 border-emerald-200/80')
              : activeLevel === 2
                ? (isDark ? 'bg-amber-950/25 border-amber-800/60' : 'bg-amber-50/70 border-amber-200/80')
                : (isDark ? 'bg-rose-950/25 border-rose-800/60' : 'bg-rose-50/70 border-rose-200/80')
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className={`text-xs sm:text-[13px] font-bold ${
                activeLevel === 1 
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : activeLevel === 2
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-rose-700 dark:text-rose-400'
              }`}>
                {cfg.title}
              </h4>
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${cfg.badgeClass}`}>
                {cfg.badge}
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {cfg.overview}
            </p>
          </div>

          {/* Physical Reference Benchmarks (เทียบระดับร่างกาย & ตัวรถ) */}
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <h5 className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>เกณฑ์สังเกตระดับความลึกทางกายภาพ</span>
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <span className={`text-[10px] font-semibold block uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  🚶 ระดับคนเดินถนน
                </span>
                <span className={`text-xs font-bold block mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {cfg.humanText}
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <span className={`text-[10px] font-semibold block uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  🚗 ระดับตัวรถยนต์
                </span>
                <span className={`text-xs font-bold block mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {cfg.vehicleText}
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle Impact Matrix */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h5 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                คำแนะนำตามประเภทยานพาหนะ
              </h5>
              <span className="text-[10px] text-slate-500">
                ประเมินความปลอดภัยขณะขับขี่
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {vehicles.map(v => (
                <VehicleImpactCard key={v.key} vehicle={v} data={v.data} isDark={isDark} />
              ))}
            </div>
          </div>

          {/* Official Road Safety Protocol Callout */}
          <div className={`p-3 sm:p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-850/60 border-slate-800 text-slate-300' : 'bg-blue-50/50 border-blue-200/80 text-slate-700'
          }`}>
            <h6 className="text-xs font-bold text-blue-700 dark:text-sky-400 flex items-center gap-1.5 mb-1.5">
              <span>ข้อควรปฏิบัติเมื่อจำเป็นต้องขับผ่านจุดน้ำท่วม</span>
            </h6>
            <ul className="text-[11.5px] leading-relaxed space-y-1 list-disc list-inside">
              <li><strong>ปิดระบบปรับอากาศ (A/C) ทันที</strong> เพื่อป้องกันพัดลมหม้อน้ำพัดน้ำเข้าสู่ห้องเครื่องยนต์</li>
              <li><strong>ใช้เกียร์ต่ำสม่ำเสมอ (L หรือ 1-2)</strong> รักษารอบเครื่องยนต์ให้นิ่ง ห้ามเหยียบเบรกกะทันหัน</li>
              <li><strong>หากเครื่องยนต์ดับกลางน้ำ ห้ามสตาร์ทรถซ้ำเด็ดขาด</strong> เพื่อป้องกันน้ำเข้ากระบอกสูบเสียหายถาวร</li>
            </ul>
          </div>

        </div>

        {/* Institutional Footer */}
        <div className={`px-4 py-2.5 sm:px-5 sm:py-3 border-t flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/70 text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playEmergencySound();
                window.location.href = 'tel:1784';
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer transition-colors active:scale-95"
              title="โทรสายด่วนสาธารณภัย ปภ. 1784 ฟรีตลอด 24 ชม."
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>สายด่วน 1784 (24 ชม.)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs border transition-colors cursor-pointer shrink-0 active:scale-95 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs'
            }`}
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
