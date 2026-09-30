import React from 'react';
import { PhoneForwarded, X, Shield, PhoneCall } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose, theme = 'light' }) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const hotlines = [
    { name: "ศูนย์กู้ชีพการแพทย์ฉุกเฉิน (EMS)", desc: "เจ็บป่วยฉุกเฉิน อุบัติเหตุทางน้ำ รถพยาบาล", tel: "1669", badge: "24 ชม. ทั่วประเทศ" },
    { name: "สายด่วนนิรภัย กรมป้องกันและบรรเทาสาธารณภัย (ปภ.)", desc: "แจ้งเหตุด่วนสาธารณภัย อุทกภัย วาตภัย ระดับชาติ", tel: "1784", badge: "โทรฟรี 24 ชม." },
    { name: "สำนักงาน ปภ. จังหวัดสมุทรปราการ", desc: "ศูนย์อำนวยการใหญ่ ประสานเรือท้องแบนและเครื่องสูบน้ำ", tel: "02-382-6040", badge: "ศูนย์บัญชาการจังหวัด" },
    { name: "เทศบาลนครสมุทรปราการ (ศูนย์ป้องกันน้ำท่วม)", desc: "สถานีสูบน้ำหลักและหน่วยแจกกระสอบทรายฉุกเฉิน", tel: "02-382-6199", badge: "อ.เมืองสมุทรปราการ" },
    { name: "สายด่วนจราจร บก.02", desc: "ตรวจสอบเส้นทางเลี่ยงน้ำท่วมขังและสอบถามสภาพทาง", tel: "1197", badge: "บก.จร." },
    { name: "สายด่วนกรมทางหลวง (HDMS)", desc: "แจ้งน้ำท่วมทางหลวง ทางคู่ขนาน และมอเตอร์เวย์", tel: "1586", badge: "โทรฟรี 24 ชม." },
    { name: "มูลนิธิร่วมกตัญญู จุดปากน้ำ/บางพลี", desc: "หน่วยกู้ภัยลากรถเสีย ช่วยเหลือประชาชนยกสิ่งของ", tel: "02-751-0951", badge: "กู้ภัยสมุทรปราการ" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-lg border rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl border ${
              isDark ? 'bg-rose-950/80 text-rose-400 border-rose-800' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <PhoneForwarded className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>หมายเลขโทรศัพท์สายด่วนฉุกเฉิน 24 ชม.</span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                จังหวัดสมุทรปราการ (อ้างอิง: แผนเผชิญเหตุอุทกภัย ปภ.สมุทรปราการ)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hotlines List */}
        <div className="mt-4 space-y-2.5 text-xs sm:text-sm">
          {hotlines.map((item, idx) => (
            <a 
              key={idx} 
              href={`tel:${item.tel.replace(/-/g, '')}`} 
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between group shadow-xs cursor-pointer block ${
                isDark 
                  ? 'bg-slate-850/80 border-slate-750 hover:border-rose-400 hover:bg-rose-950/20' 
                  : 'bg-slate-50 border-slate-200 hover:border-rose-400 hover:bg-rose-50/30'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-xs sm:text-sm group-hover:text-rose-500 transition-colors truncate ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    {item.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded shrink-0 font-medium ${
                    isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                    {item.badge}
                  </span>
                </div>
                <span className={`text-xs mt-0.5 block leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.desc}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-600/10 group-hover:bg-rose-600 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 group-hover:text-white transition-all shrink-0">
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="font-bold font-mono text-xs sm:text-sm">{item.tel}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Footer Citation */}
        <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
          isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>ศูนย์ข้อมูลช่วยเหลือผู้ประสบภัย จ.สมุทรปราการ</span>
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
}
