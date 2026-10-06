import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Target, 
  Database, 
  Lock, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Compass, 
  Layers, 
  Sparkles,
  MapPin,
  HeartHandshake
} from 'lucide-react';
import { playClickSound, playCloseSound } from '../services/soundEffects';

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className={`w-[90vw] max-w-[360px] sm:max-w-2xl my-auto m-auto max-h-[75vh] sm:max-h-[88vh] border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${
          isDark 
            ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-cyan-950/40' 
            : 'bg-white border-slate-200 text-slate-800 shadow-blue-900/20'
        }`}
      >
        {/* Accent Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-400 shrink-0"></div>

        {/* Header with Official Logo */}
        <div className={`p-3 sm:p-5 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Logo Emblem */}
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl p-[1px] sm:p-[1.5px] bg-gradient-to-tr from-blue-600 via-cyan-400 to-teal-300 shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="PrakanGuard Logo" 
                className="w-full h-full rounded-xl sm:rounded-2xl object-cover" 
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <span className={`text-[8.5px] sm:text-[11px] font-extrabold px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full border shrink-0 ${
                  isDark 
                    ? 'bg-blue-950 text-cyan-300 border-blue-800' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  จัดทำโดยกลุ่มนักเรียน • เพื่อสังคม
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-500 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>PrakanGuard</span>
                </span>
              </div>
              <h2 className={`text-xs sm:text-base font-black mt-0.5 tracking-tight break-words whitespace-normal leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                นโยบายข้อกำหนด & ความเป็นส่วนตัว
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`p-1 sm:p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed custom-scrollbar-thin">
          
          {/* Section 1: จุดประสงค์และผู้จัดทำ (กลุ่มนักเรียน) */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-850/80 border-slate-700' : 'bg-blue-50/60 border-blue-100'
          }`}>
            <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-cyan-400 text-sm mb-2">
              <Users className="w-4 h-4" />
              <span>1. ผู้จัดทำและเจตนารมณ์ของโครงการ</span>
            </div>
            <p className={`text-xs sm:text-[13px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              เว็บไซต์รายงานสถานการณ์น้ำท่วม <strong>PrakanGuard</strong> จัดทำขึ้นโดย<strong>กลุ่มนักเรียน</strong> 
              ที่มีความตั้งใจนำความรู้ด้านเทคโนโลยีสารสนเทศ การวิเคราะห์ข้อมูล และระบบสารสนเทศภูมิศาสตร์ (GIS) 
              มาพัฒนาเป็นเครื่องมือสาธารณประโยชน์เพื่อแก้ไขปัญหาความเดือดร้อนของประชาชนในจังหวัดสมุทรปราการ
            </p>
            <div className="mt-3 pt-2.5 border-t border-blue-200/50 dark:border-slate-700 flex items-start gap-2">
              <Target className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <strong>เป้าหมายเพื่อแก้ปัญหา:</strong> บรรเทาปัญหาความเดือดร้อนจากปัญหาน้ำท่วมขังผิวจราจรและน้ำทะเลหนุนสูงซ้ำซาก 
                ช่วยให้ประชาชนและผู้ใช้รถใช้ถนนสามารถตรวจสอบระดับน้ำล่วงหน้า หลีกเลี่ยงเส้นทางวิกฤต และเดินทางได้อย่างปลอดภัยแบบเรียลไทม์ 24 ชม.
              </div>
            </div>
          </div>

          {/* Section 2: แหล่งข้อมูลอ้างอิง (Data Sources) */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-850/80 border-slate-700' : 'bg-emerald-50/60 border-emerald-100'
          }`}>
            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-2">
              <Database className="w-4 h-4" />
              <span>2. การอ้างอิงแหล่งข้อมูล (Data Sources & Attribution)</span>
            </div>
            <p className={`text-xs mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              ข้อมูลทั้งหมดบนเว็บไซต์นี้อ้างอิงจากแหล่งข้อมูลและหน่วยงานมาตรฐาน ดังต่อไปนี้:
            </p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  <strong>ข้อมูลสภาพอากาศและเรดาร์ฝน:</strong> เชื่อมต่อข้อมูลจริงจากแบบจำลองพยากรณ์อากาศมาตรฐานสากล Open-Meteo API และข้อมูลกรมอุตุนิยมวิทยา
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  <strong>พิกัดจุดเฝ้าระวังน้ำท่วมขังถนนสายหลัก:</strong> อ้างอิงจากข้อมูลประชาสัมพันธ์ แขวงทางหลวงสมุทรปราการ (กรมทางหลวง), กรมป้องกันและบรรเทาสาธารณภัย (ปภ.), และศูนย์ข้อมูลอุทกภัยสมุทรปราการ
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  <strong>ข้อมูลรายงานภาคประชาชน (Crowdsourcing):</strong> ภาพถ่ายและระดับน้ำที่ได้รับแจ้งจากประชาชนในพื้นที่จริง 6 อำเภอ ผ่านการตรวจสอบยืนยันโดยแอดมินระบบ
                </span>
              </li>
            </ul>
          </div>

          {/* Section 3: นโยบายความเป็นส่วนตัว (Privacy Policy) */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-850/80 border-slate-700' : 'bg-sky-50/60 border-sky-100'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sky-600 dark:text-cyan-400 text-sm mb-2">
              <Lock className="w-4 h-4" />
              <span>3. นโยบายคุ้มครองข้อมูลส่วนบุคคล (Privacy Policy)</span>
            </div>
            <div className="space-y-2 text-xs leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0"></span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  <strong>ไม่มีการเก็บข้อมูลส่วนบุคคลระบุตัวตน (No PII):</strong> เว็บไซต์ไม่มีการจัดเก็บชื่อ-นามสกุล เลขบัตรประชาชน บัญชีผู้ใช้งาน หรือข้อมูลส่วนบุคคลใดๆ ของผู้เข้าใช้งานทั่วไป
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0"></span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  <strong>การใช้งานตำแหน่ง GPS:</strong> หากท่านอนุญาตเปิดใช้งาน Location พิกัดจะถูกนำมาใช้เพื่อคำนวณระยะห่างระหว่างจุดที่ท่านอยู่กับจุดน้ำท่วมที่ใกล้ที่สุดเท่านั้น โดยการคำนวณเกิดขึ้นภายในอุปกรณ์ของท่าน (Client-side) และไม่มีการบันทึกประวัติเส้นทางการเดินทางส่วนบุคคลใดๆ ทั้งสิ้น
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0"></span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  <strong>ไม่จำหน่ายหรือส่งต่อข้อมูล:</strong> ระบบไม่มีนโยบายการจำหน่าย แลกเปลี่ยน หรือส่งต่อข้อมูลพฤติกรรมการใช้งานแก่บุคคลภายนอกหรือเชิงพาณิชย์
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: ข้อจำกัดความรับผิดชอบ (Disclaimer) */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-850/80 border-slate-700' : 'bg-amber-50/60 border-amber-100'
          }`}>
            <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 text-sm mb-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>4. ข้อจำกัดความรับผิดชอบ (Disclaimer)</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              ข้อมูลระดับน้ำและสภาพจราจรที่แสดงบนเว็บไซต์ จัดทำขึ้นเพื่อเป็นข้อมูลประกอบการตัดสินใจเบื้องต้น 
              ระดับน้ำอาจมีการเปลี่ยนแปลงอย่างรวดเร็วตามสภาพฝนและการระบายน้ำของแต่ละพื้นที่ 
              ขอให้ผู้ขับขี่ใช้ความระมัดระวังและปฏิบัติตามคำแนะนำของเจ้าหน้าที่ผู้ปฏิบัติงานในพื้นที่เป็นสำคัญ
            </p>
          </div>

          {/* Section 5: สงวนสิทธิ์ระบบศูนย์ควบคุมแอดมิน */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-850/80 border-slate-700' : 'bg-slate-100/70 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-sm mb-1.5">
              <FileText className="w-4 h-4 text-rose-500" />
              <span>5. ลิขสิทธิ์และสิทธิ์การเข้าถึงศูนย์ควบคุมระบบ</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              สงวนสิทธิ์ลิขสิทธิ์และการเข้าใช้งานศูนย์ควบคุมระบบ (Admin Control Center) ของเว็บไซต์ 
              เฉพาะผู้ร่วมพัฒนาเว็บไซต์และคณะทำงานที่ได้รับอนุญาตเท่านั้น ไม่อนุญาตให้บุคคลภายนอกเข้าถึง 
              ทำซ้ำ ดัดแปลง หรือเจาะระบบโดยไม่ได้รับอนุญาต
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>PrakanGuard • พัฒนาเพื่อสมุทรปราการ</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
          >
            รับทราบและปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
