import React from 'react';
import { X } from 'lucide-react';
import { playCloseSound } from '../services/soundEffects';
import { CivicCrest, CivicShield } from './CivicIcons';

export default function PrivacyPolicyModal({ 
  isOpen, 
  onClose, 
  theme = 'light' 
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const handleClose = () => {
    playCloseSound();
    if (onClose) onClose();
  };

  const sections = [
    {
      num: '01',
      title: 'ผู้จัดทำและเจตนารมณ์ของโครงการ',
      body: 'ระบบสารสนเทศเฝ้าระวังอุทกภัย PrakanGuard พัฒนาขึ้นโดยกลุ่มนักเรียน เพื่อเป็นเครื่องมือสาธารณประโยชน์ในการติดตามระดับน้ำท่วมขังบนผิวจราจรและน้ำทะเลหนุนในจังหวัดสมุทรปราการ ช่วยให้ประชาชนวางแผนการเดินทางและหลีกเลี่ยงเส้นทางเสี่ยงภัยได้อย่างปลอดภัยตลอด 24 ชั่วโมง'
    },
    {
      num: '02',
      title: 'แหล่งข้อมูลอ้างอิงและการเชื่อมโยงระบบ',
      items: [
        'ข้อมูลอุตุนิยมวิทยาและเรดาร์ฝน: เชื่อมต่อจากแบบจำลองสภาพอากาศมาตรฐานสากล Open-Meteo API และกรมอุตุนิยมวิทยา',
        'พิกัดจุดเฝ้าระวังบนทางหลวง: อ้างอิงจากแขวงทางหลวงสมุทรปราการ กรมป้องกันและบรรเทาสาธารณภัย (ปภ.) และระบบ Traffy Fondue',
        'รายงานภาคประชาชน: ข้อมูลพิกัดและภาพถ่ายจากผู้ใช้เส้นทางในพื้นที่ 6 อำเภอ ที่ผ่านการคัดกรองโดยผู้ดูแลระบบ'
      ]
    },
    {
      num: '03',
      title: 'การคุ้มครองข้อมูลส่วนบุคคล (Privacy Policy)',
      items: [
        'ไม่มีการจัดเก็บข้อมูลระบุตัวตน (No PII): ระบบไม่เก็บชื่อ-นามสกุล เลขประจำตัวประชาชน หรือประวัติส่วนบุคคลของผู้เข้าชมทั่วไป',
        'การประมวลผลพิกัด GPS: ใช้เพื่อคำนวณระยะห่างจากจุดน้ำท่วมบนอุปกรณ์ของผู้ใช้เท่านั้น ไม่มีการบันทึกประวัติการเดินทางลงฐานข้อมูล',
        'ไม่มีการส่งต่อข้อมูลเชิงพาณิชย์: ข้อมูลทั้งหมดใช้เพื่อการแจ้งเตือนสาธารณภัยและพัฒนาคุณภาพระบบเท่านั้น'
      ]
    },
    {
      num: '04',
      title: 'ข้อจำกัดความรับผิดชอบและสิทธิ์การเข้าถึง',
      body: 'ข้อมูลระดับน้ำใช้ประกอบการตัดสินใจเบื้องต้น ซึ่งอาจเปลี่ยนแปลงตามปริมาณฝนและการระบายน้ำในพื้นที่จริง ผู้ใช้รถใช้ถนนควรปฏิบัติตามสัญญาณเตือนและคำแนะนำของเจ้าหน้าที่ในพื้นที่ ทั้งนี้ สงวนสิทธิ์การเข้าถึงระบบจัดการข้อมูล (Admin Control Center) เฉพาะผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto select-none bg-slate-950/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className={`w-[90vw] max-w-[385px] sm:max-w-xl my-auto m-auto max-h-[74vh] sm:max-h-[85vh] shrink-0 border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Institutional Bar */}
        <div className="h-1 w-full bg-blue-700 shrink-0" />

        {/* Header */}
        <div className={`px-3 py-2 sm:px-4 sm:py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-white border-slate-200 text-blue-700 shadow-2xs'
            }`}>
              <CivicCrest className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-xs sm:text-sm font-bold leading-tight tracking-tight truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว
              </h2>
              <p className={`text-[9.5px] sm:text-xs leading-tight mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                โครงการเทคโนโลยีสารสนเทศเพื่อสังคม (PrakanGuard)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-3 sm:py-4 text-[11px] sm:text-xs leading-relaxed">
          <div className={`rounded-lg border divide-y ${
            isDark ? 'bg-slate-950/40 border-slate-800 divide-slate-800' : 'bg-slate-50/50 border-slate-200 divide-slate-200'
          }`}>
            {sections.map((sec) => (
              <div key={sec.num} className="p-2.5 sm:p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`font-mono text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    isDark ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-white text-blue-700 border-slate-200'
                  }`}>
                    {sec.num}
                  </span>
                  <h3 className={`font-bold text-[11.5px] sm:text-[13px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {sec.title}
                  </h3>
                </div>
                {sec.body && (
                  <p className={`text-[11px] sm:text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {sec.body}
                  </p>
                )}
                {sec.items && (
                  <ul className={`space-y-1 pt-0.5 text-[11px] sm:text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {sec.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-3.5 py-2 sm:px-5 sm:py-3 border-t flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">มาตรฐานความปลอดภัย PrakanGuard</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-[11px] sm:text-xs transition-colors cursor-pointer shrink-0"
          >
            รับทราบและปิด
          </button>
        </div>
      </div>
    </div>
  );
}
