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
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className={`w-[92vw] max-w-[440px] sm:max-w-lg my-auto m-auto border rounded-xl shadow-2xl relative max-h-[84vh] sm:max-h-[86vh] flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Top Institutional Bar */}
        <div className="h-1 w-full bg-rose-600 shrink-0" />
        
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border-b shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-rose-950/60 text-rose-400 border-rose-800/80' : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
              <CivicEmergencyPhone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                หมายเลขสายด่วนฉุกเฉิน 24 ชั่วโมง
              </h3>
              <p className={`text-[11px] sm:text-xs leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ศูนย์ประสานงานช่วยเหลือผู้ประสบอุทกภัย จ.สมุทรปราการ
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hotlines Table List */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4 overscroll-contain">
          <div className={`rounded-lg border divide-y overflow-hidden ${
            isDark ? 'border-slate-800 divide-slate-800 bg-slate-950/40' : 'border-slate-200 divide-slate-200 bg-white'
          }`}>
            {hotlines.map((item, idx) => (
              <a 
                key={idx} 
                href={`tel:${item.tel.replace(/-/g, '')}`} 
                className={`p-3 transition-colors flex items-center justify-between gap-3 group cursor-pointer ${
                  isDark 
                    ? 'hover:bg-slate-800/70' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-bold text-xs transition-colors ${
                      isDark ? 'text-slate-100 group-hover:text-rose-400' : 'text-slate-900 group-hover:text-rose-600'
                    }`}>
                      {item.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                      isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  </div>
                  <span className={`text-[11px] block leading-snug mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.desc}
                  </span>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors shrink-0 ${
                  isDark 
                    ? 'bg-rose-950/50 border-rose-800/80 text-rose-300 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600' 
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
        <div className={`px-4 py-2.5 sm:px-5 sm:py-3 border-t flex items-center justify-between text-xs shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-500'
        }`}>
          <span className="flex items-center gap-1.5 text-[11px]">
            <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>แตะที่รายการเพื่อโทรออกฉุกเฉินทันที</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs border transition-colors cursor-pointer ${
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
