import React from 'react';
import { X, PhoneCall } from 'lucide-react';
import { CivicEmergencyPhone, CivicShield } from './CivicIcons';

export default function EmergencyModal({ isOpen, onClose, theme = 'light' }) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const hotlines = [
    { name: "ศูนย์กู้ชีพการแพทย์ฉุกเฉิน (EMS)", desc: "เจ็บป่วยฉุกเฉิน อุบัติเหตุทางน้ำ รถพยาบาล", tel: "1669", badge: "24 ชม." },
    { name: "สายด่วนนิรภัย กรมป้องกันและบรรเทาสาธารณภัย", desc: "แจ้งเหตุด่วนสาธารณภัย อุทกภัย วาตภัย", tel: "1784", badge: "ปภ." },
    { name: "สำนักงาน ปภ. จังหวัดสมุทรปราการ", desc: "ศูนย์อำนวยการจังหวัด ประสานเครื่องสูบน้ำ", tel: "02-382-6040", badge: "จ.สมุทรปราการ" },
    { name: "ศูนย์ป้องกันน้ำท่วม เทศบาลนครสมุทรปราการ", desc: "สถานีสูบน้ำหลักและหน่วยกระสอบทรายฉุกเฉิน", tel: "02-382-6199", badge: "อ.เมือง" },
    { name: "ศูนย์ควบคุมและสั่งการจราจร (บก.02)", desc: "ตรวจสอบเส้นทางเลี่ยงน้ำท่วมขังและสภาพจราจร", tel: "1197", badge: "จราจร" },
    { name: "สายด่วนกรมทางหลวง (HDMS)", desc: "แจ้งน้ำท่วมทางหลวงแผ่นดินและทางคู่ขนาน", tel: "1586", badge: "กรมทางหลวง" },
    { name: "มูลนิธิร่วมกตัญญู จุดปากน้ำ / บางพลี", desc: "หน่วยกู้ภัยช่วยเหลือรถเสียและเคลื่อนย้ายฉุกเฉิน", tel: "02-751-0951", badge: "กู้ภัย" }
  ];

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[2000] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 py-8 sm:py-8 overflow-y-auto overscroll-contain"
    >
      <div className={`w-full max-w-[calc(100vw-24px)] xs:max-w-[420px] sm:max-w-lg my-auto m-auto border rounded-3xl shadow-2xl relative max-h-[78vh] sm:max-h-[84vh] shrink-0 flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Top Institutional Bar */}
        <div className="h-1.5 w-full bg-rose-600 shrink-0" />
        
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border-b shrink-0 ${
          isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-rose-950/60 text-rose-400' : 'bg-rose-50 text-rose-600'
            }`}>
              <CivicEmergencyPhone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-[15px] font-bold leading-tight tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                หมายเลขสายด่วนฉุกเฉิน 24 ชั่วโมง
              </h3>
              <p className={`text-[11px] leading-tight mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ศูนย์ประสานงานช่วยเหลืออุทกภัย จ.สมุทรปราการ
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hotlines Table List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 overscroll-contain custom-scrollbar-thin space-y-3">
          <div className={`rounded-2xl border divide-y overflow-hidden ${
            isDark ? 'border-slate-800 divide-slate-800 bg-slate-900/60' : 'border-slate-200 divide-slate-100 bg-slate-50/40'
          }`}>
            {hotlines.map((item, idx) => (
              <a 
                key={idx} 
                href={`tel:${item.tel.replace(/-/g, '')}`} 
                className={`p-3 transition-colors flex items-center justify-between gap-2.5 group cursor-pointer ${
                  isDark 
                    ? 'hover:bg-slate-800/70' 
                    : 'hover:bg-slate-100/70'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-bold text-xs sm:text-[13px] transition-colors ${
                      isDark ? 'text-slate-100 group-hover:text-rose-400' : 'text-slate-900 group-hover:text-rose-600'
                    }`}>
                      {item.name}
                    </span>
                    <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold border ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  </div>
                  <span className={`text-[10.5px] sm:text-[11px] block leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.desc}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors shrink-0 shadow-2xs ${
                  isDark 
                    ? 'bg-rose-950/60 border-rose-800/80 text-rose-300 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600' 
                    : 'bg-rose-50 border-rose-200 text-rose-700 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600'
                }`}>
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span className="font-bold font-mono text-xs tabular-nums">{item.tel}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-4 py-2.5 sm:px-5 flex items-center justify-between text-xs shrink-0 border-t ${
          isDark ? 'border-slate-800/80 bg-slate-900/60 text-slate-400' : 'border-slate-100 bg-slate-50/50 text-slate-500'
        }`}>
          <span className="flex items-center gap-1.5 text-[11px] truncate">
            <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">แตะรายการเพื่อโทรออกฉุกเฉินทันที</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-colors cursor-pointer active:scale-95 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
            }`}
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
}
