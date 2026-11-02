import React, { useState } from 'react';
import { X, Check, AlertTriangle, Ban, PhoneCall, ShieldCheck } from 'lucide-react';
import {
  CivicStandards,
  CivicVehicleSedan,
  CivicVehicleMoto,
  CivicVehicleSuv,
  CivicVehicleTruck
} from './CivicIcons';
import { playTabSound, playCloseSound, playEmergencySound } from '../services/soundEffects';

const STANDARDS_DATA = [
  {
    level: 1,
    name: 'ระดับ 1: น้ำรอระบาย',
    range: '5 - 20 ซม.',
    color: 'emerald',
    dot: 'bg-emerald-500',
    humanLevel: 'ระดับข้อเท้า',
    vehicleLevel: 'ใต้ท้องรถเก๋ง (ยังไม่ถึงดุมล้อ)',
    advice: 'ขับช้าๆ เพื่อความปลอดภัย ระวังแอ่งน้ำขังเลนซ้าย',
    vehicles: [
      { name: 'รถเก๋ง / Eco Car', status: 'safe', label: 'ผ่านได้', icon: <CivicVehicleSedan className="w-4 h-4" /> },
      { name: 'รถจักรยานยนต์', status: 'safe', label: 'ผ่านได้', icon: <CivicVehicleMoto className="w-4 h-4" /> },
      { name: 'รถกระบะ / SUV', status: 'safe', label: 'ผ่านได้', icon: <CivicVehicleSuv className="w-4 h-4" /> },
      { name: 'รถบรรทุก / รถบัส', status: 'safe', label: 'ผ่านได้', icon: <CivicVehicleTruck className="w-4 h-4" /> },
    ]
  },
  {
    level: 2,
    name: 'ระดับ 2: น้ำท่วมปานกลาง',
    range: '21 - 50 ซม.',
    color: 'amber',
    dot: 'bg-amber-500',
    humanLevel: 'ระดับหน้าแข้งถึงหัวเข่า',
    vehicleLevel: 'แตะดุมล้อถึงใต้ขอบประตู (ท่อไอเสียเริ่มจม)',
    advice: 'รถเล็กควรเลี่ยงเส้นทาง หากจำเป็นต้องผ่านให้ปิดแอร์ ใช้เกียร์ต่ำ (L)',
    vehicles: [
      { name: 'รถเก๋ง / Eco Car', status: 'warning', label: 'ควรเลี่ยง', note: 'เสี่ยงน้ำเข้าท่อไอเสีย', icon: <CivicVehicleSedan className="w-4 h-4" /> },
      { name: 'รถจักรยานยนต์', status: 'warning', label: 'ควรเลี่ยง', note: 'เสี่ยงเครื่องดับ', icon: <CivicVehicleMoto className="w-4 h-4" /> },
      { name: 'รถกระบะ / SUV', status: 'safe', label: 'ผ่านได้', note: 'ใช้ช่องทางขวา', icon: <CivicVehicleSuv className="w-4 h-4" /> },
      { name: 'รถบรรทุก / รถบัส', status: 'safe', label: 'ผ่านได้', icon: <CivicVehicleTruck className="w-4 h-4" /> },
    ]
  },
  {
    level: 3,
    name: 'ระดับ 3: น้ำท่วมวิกฤต',
    range: 'มากกว่า 50 ซม.',
    color: 'rose',
    dot: 'bg-rose-500',
    humanLevel: 'ระดับเหนือเข่าถึงระดับเอว',
    vehicleLevel: 'มิดล้อรถยนต์ น้ำทะลักเข้าห้องโดยสาร',
    advice: 'ห้ามรถเล็กผ่านเด็ดขาด! หากเครื่องดับกลางน้ำห้ามสตาร์ทซ้ำ',
    vehicles: [
      { name: 'รถเก๋ง / Eco Car', status: 'danger', label: 'ห้ามผ่าน', note: 'น้ำท่วมมิดล้อ', icon: <CivicVehicleSedan className="w-4 h-4" /> },
      { name: 'รถจักรยานยนต์', status: 'danger', label: 'ห้ามผ่าน', note: 'อันตรายสูง', icon: <CivicVehicleMoto className="w-4 h-4" /> },
      { name: 'รถกระบะ / SUV', status: 'warning', label: 'เฝ้าระวัง', note: 'เฉพาะยกสูงพิเศษ', icon: <CivicVehicleSuv className="w-4 h-4" /> },
      { name: 'รถบรรทุก / รถบัส', status: 'safe', label: 'ผ่านได้', note: 'ใช้ความระมัดระวัง', icon: <CivicVehicleTruck className="w-4 h-4" /> },
    ]
  }
];

export default function FloodStandardsModal({ isOpen, onClose, theme = 'light' }) {
  const [activeLevel, setActiveLevel] = useState(1);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const current = STANDARDS_DATA.find(s => s.level === activeLevel) || STANDARDS_DATA[0];

  return (
    <div 
      onClick={(e) => { 
        if (e.target === e.currentTarget) {
          playCloseSound();
          onClose(); 
        }
      }}
      className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in-50 duration-150"
    >
      <div className={`w-full max-w-[calc(100vw-24px)] xs:max-w-[400px] sm:max-w-[460px] my-auto flex flex-col rounded-3xl shadow-2xl border overflow-hidden max-h-[84vh] shrink-0 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>

        {/* Header — Clean, Friendly & Rounded */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 shrink-0 border-b ${
          isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <CivicStandards className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-[15px] font-bold leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                เกณฑ์ระดับน้ำ & ยานพาหนะ
              </h3>
              <p className={`text-[11px] leading-tight mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                คู่มือประเมินความปลอดภัยขณะสัญจร
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => {
              playCloseSound();
              onClose();
            }} 
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Level Pill Segmented Selector (Rounded Pill Design) */}
        <div className="px-3.5 pt-3 pb-1 shrink-0">
          <div className={`p-1 rounded-full flex items-center gap-1 ${
            isDark ? 'bg-slate-800/80' : 'bg-slate-100'
          }`}>
            {STANDARDS_DATA.map(tab => {
              const isActive = activeLevel === tab.level;
              return (
                <button
                  key={tab.level}
                  type="button"
                  onClick={() => {
                    playTabSound();
                    setActiveLevel(tab.level);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-full text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isActive
                      ? (isDark 
                          ? 'bg-slate-900 text-white shadow-xs font-bold' 
                          : 'bg-white text-slate-900 shadow-xs font-bold')
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tab.dot}`} />
                  <span className="text-xs">{tab.range}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body — Compact, Concise, Clean */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 space-y-3 custom-scrollbar-thin">
          
          {/* Level Summary Pill Card */}
          <div className={`p-3 rounded-2xl border transition-colors ${
            activeLevel === 1 
              ? (isDark ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300' : 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900')
              : activeLevel === 2
                ? (isDark ? 'bg-amber-950/20 border-amber-800/50 text-amber-300' : 'bg-amber-50/70 border-amber-200/70 text-amber-900')
                : (isDark ? 'bg-rose-950/20 border-rose-800/50 text-rose-300' : 'bg-rose-50/70 border-rose-200/70 text-rose-900')
          }`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold">
                {current.name} ({current.range})
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                activeLevel === 1 
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : activeLevel === 2
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}>
                {activeLevel === 1 ? 'ผ่านได้สบาย' : activeLevel === 2 ? 'เฝ้าระวังรถเล็ก' : 'อันตรายสูง'}
              </span>
            </div>

            {/* Quick Human & Car comparison */}
            <div className="text-[11.5px] space-y-0.5 opacity-90 leading-tight">
              <div>• <strong>เทียบคน:</strong> {current.humanLevel}</div>
              <div>• <strong>เทียบรถ:</strong> {current.vehicleLevel}</div>
            </div>
          </div>

          {/* Vehicle Passage List — Clean Round-bordered Group */}
          <div className={`rounded-2xl border divide-y overflow-hidden ${
            isDark ? 'border-slate-800 divide-slate-800 bg-slate-900/60' : 'border-slate-200 divide-slate-100 bg-slate-50/40'
          }`}>
            {current.vehicles.map((v, idx) => {
              const isSafe = v.status === 'safe';
              const isWarning = v.status === 'warning';

              return (
                <div key={idx} className="p-2.5 sm:px-3 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 shadow-2xs border border-slate-100'
                    }`}>
                      {v.icon}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-semibold block leading-tight truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {v.name}
                      </span>
                      {v.note && (
                        <span className={`text-[10px] leading-tight block ${
                          isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {v.note}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                    isSafe
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                      : isWarning
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                  }`}>
                    {isSafe && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                    {isWarning && <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                    {!isSafe && !isWarning && <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                    <span>{v.label}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Practical Advice — 1-2 Short Lines */}
          <div className={`p-2.5 sm:p-3 rounded-2xl flex items-start gap-2 text-xs leading-relaxed ${
            isDark ? 'bg-slate-800/40 text-slate-300' : 'bg-slate-100/70 text-slate-700'
          }`}>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>คำแนะนำ:</strong> {current.advice}
            </div>
          </div>

        </div>

        {/* Footer — Rounded Pill Buttons */}
        <div className={`px-4 py-2.5 sm:px-5 flex items-center justify-between gap-2 shrink-0 border-t ${
          isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button
            type="button"
            onClick={() => {
              playEmergencySound();
              window.location.href = 'tel:1784';
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer active:scale-95"
            title="โทรสายด่วนสาธารณภัย ปภ. 1784 ฟรี 24 ชม."
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
            <span>สายด่วน 1784</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-colors cursor-pointer active:scale-95 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                : 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
            }`}
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
}
