import React from 'react';
import { 
  X, 
  ShieldCheck, 
  EyeOff, 
  MapPin, 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Database,
  Radio,
  Sparkles
} from 'lucide-react';
import { playCloseSound, playClickSound } from '../services/soundEffects';
import { 
  CivicCrest, 
  CivicShield, 
  CivicStandards, 
  CivicWeather, 
  CivicEmergencyPhone 
} from './CivicIcons';

export default function PrivacyPolicyModal({ 
  isOpen, 
  onClose, 
  theme = 'light' 
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const handleClose = () => {
    try { playCloseSound(); } catch (e) {}
    if (onClose) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-5 py-6 sm:py-8 overflow-y-auto overscroll-contain select-none bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
    >
      <div 
        className={`w-full max-w-[calc(100vw-24px)] xs:max-w-[480px] sm:max-w-2xl my-auto m-auto max-h-[84vh] sm:max-h-[86vh] shrink-0 border rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-cyan-950/20' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10'
        }`}
      >
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 shrink-0" />

        {/* 1. Header: Clean & Authoritative */}
        <div className={`px-4 py-3.5 sm:px-6 sm:py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
              isDark 
                ? 'bg-blue-950/80 border-blue-800/80 text-cyan-400' 
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <CivicCrest className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isDark ? 'bg-blue-950/60 border-blue-800 text-cyan-300' : 'bg-blue-100/80 border-blue-200 text-blue-800'
                }`}>
                  <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                  พ.ร.บ. ข้อมูลส่วนบุคคล (PDPA 2562)
                </span>
                <span className="hidden xs:inline-block text-[10px] text-slate-400">อัปเดต ๒๕๖๙</span>
              </div>
              <h2 
                id="privacy-policy-title"
                className={`text-sm sm:text-base font-bold leading-tight tracking-tight mt-0.5 truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว
              </h2>
              <p className={`text-[11px] leading-tight truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ศูนย์สารสนเทศเฝ้าระวังอุทกภัยจังหวัดสมุทรปราการ (PrakanGuard)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 border active:scale-95 ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
            title="ปิดหน้าต่าง"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Scrollable Body: Uncluttered, Spaced & Easy to Read */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 text-xs sm:text-[13px] leading-relaxed space-y-5 custom-scrollbar-thin">

          {/* Quick 3-Pillar Summary: ไม่รก อ่านเข้าใจในทันที */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border ${
            isDark 
              ? 'bg-blue-950/30 border-blue-800/40' 
              : 'bg-blue-50/60 border-blue-200/70'
          }`}>
            <div className="flex items-center gap-1.5 mb-2.5 font-bold text-xs text-blue-700 dark:text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>สรุป 3 คำมั่นสัญญาสำคัญเพื่อประชาชน (Zero-Hassle Guarantee)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  <EyeOff className="w-3 h-3" />
                </div>
                <div>
                  <span className="font-bold block text-xs">ไม่เก็บข้อมูลส่วนตัว (100% Zero PII)</span>
                  <p className="text-[11px] opacity-80 mt-0.5">ไม่ต้องสมัครสมาชิก ไม่เก็บชื่อ บัตร ปชช. หรือเบอร์โทร</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <MapPin className="w-3 h-3" />
                </div>
                <div>
                  <span className="font-bold block text-xs">GPS คำนวณบนเครื่อง</span>
                  <p className="text-[11px] opacity-80 mt-0.5">ประมวลผลบนเบราว์เซอร์เท่านั้น ไม่บันทึกเส้นทางการเดินทาง</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isDark ? 'bg-amber-950 text-amber-300' : 'bg-amber-100 text-amber-700'
                }`}>
                  <CivicStandards className="w-3 h-3" />
                </div>
                <div>
                  <span className="font-bold block text-xs">บริการสาธารณะฟรี 100%</span>
                  <p className="text-[11px] opacity-80 mt-0.5">เพื่อชาวสมุทรปราการ ไม่มีโฆษณา ไม่แสวงหากำไร</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: เจตนารมณ์โครงการ */}
          <div className="space-y-1.5">
            <h3 className={`font-bold text-[13px] sm:text-sm flex items-center gap-2 ${
              isDark ? 'text-cyan-300' : 'text-blue-700'
            }`}>
              <span className="w-1.5 h-4 rounded-full bg-blue-600 inline-block" />
              ๑. เจตนารมณ์และวัตถุประสงค์แห่งการให้บริการ
            </h3>
            <p className={`pl-3.5 text-xs sm:text-[12.5px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              ระบบสารสนเทศเฝ้าระวังอุทกภัย <strong>PrakanGuard</strong> พัฒนาขึ้นโดยกลุ่มนักเรียนเพื่อสาธารณประโยชน์ ช่วยให้ประชาชนชาวจังหวัดสมุทรปราการติดตามสถานการณ์น้ำท่วมขังบนผิวจราจรและภาวะน้ำทะเลหนุนสูงใน 6 อำเภอ ได้อย่างรวดเร็วและแม่นยำตลอด 24 ชั่วโมง เพื่อใช้ประกอบการวางแผนสัญจรอย่างปลอดภัยและลดความสูญเสียต่อทรัพย์สิน
            </p>
          </div>

          {/* Section 2: การคุ้มครองข้อมูลส่วนบุคคล (PDPA) */}
          <div className="space-y-1.5">
            <h3 className={`font-bold text-[13px] sm:text-sm flex items-center gap-2 ${
              isDark ? 'text-cyan-300' : 'text-blue-700'
            }`}>
              <span className="w-1.5 h-4 rounded-full bg-blue-600 inline-block" />
              ๒. การคุ้มครองข้อมูลส่วนบุคคลตามกฎหมาย (PDPA 2562)
            </h3>
            <div className={`pl-3.5 space-y-2 text-xs sm:text-[12.5px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <p>
                ระบบปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ ภายใต้หลักการ <em>Privacy by Design</em> อย่างเคร่งครัด:
              </p>
              <ul className="space-y-1.5 list-none">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span><strong>การไม่เก็บข้อมูลระบุตัวตน (No PII):</strong> ผู้ใช้งานทั่วไปสามารถเปิดใช้งานแผนที่และตรวจสอบระดับน้ำได้ทันทีโดยไม่ต้องลงทะเบียนเข้าสู่ระบบ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span><strong>พิกัดตำแหน่งทางภูมิศาสตร์ (GPS):</strong> ร้องขอพิกัดเฉพาะเมื่อผู้ใช้กดค้นหาตำแหน่งตนเอง เพื่อคำนวณระยะห่างจากจุดเสี่ยงเท่านั้น ข้อมูลพิกัดจะถูกประมวลผลบนหน่วยความจำของอุปกรณ์และไม่มีการจัดเก็บบนเซิร์ฟเวอร์</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <span><strong>ความมั่นคงปลอดภัยสารสนเทศ:</strong> เข้ารหัสการรับส่งข้อมูลทั้งหมดผ่านโปรโตคอลมาตรฐาน HTTPS / TLS 1.3 พร้อมระบบตรวจสอบความปลอดภัยอัตโนมัติ</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3: แหล่งข้อมูลอ้างอิงและการบูรณาการ */}
          <div className="space-y-1.5">
            <h3 className={`font-bold text-[13px] sm:text-sm flex items-center gap-2 ${
              isDark ? 'text-cyan-300' : 'text-blue-700'
            }`}>
              <span className="w-1.5 h-4 rounded-full bg-blue-600 inline-block" />
              ๓. แหล่งข้อมูลอ้างอิงและการบูรณาการ
            </h3>
            <div className={`pl-3.5 space-y-2 text-xs sm:text-[12.5px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <p>
                ข้อมูลสภาพอากาศและระดับน้ำบนโครงข่ายคมนาคม อ้างอิงและเชื่อมโยงจากหน่วยงานหลัก:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isDark ? 'bg-slate-800/60 border-slate-750' : 'bg-slate-50 border-slate-200'
                }`}>
                  <CivicWeather className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold block text-xs">เรดาร์และพยากรณ์อากาศ</span>
                    <span className="text-[11px] opacity-75 block truncate">กรมอุตุนิยมวิทยา / Open-Meteo</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isDark ? 'bg-slate-800/60 border-slate-750' : 'bg-slate-50 border-slate-200'
                }`}>
                  <CivicStandards className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold block text-xs">จุดเฝ้าระวังทางหลวง & โทรมาตร</span>
                    <span className="text-[11px] opacity-75 block truncate">แขวงทางหลวงสมุทรปราการ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: ข้อแนะนำความปลอดภัยและข้อจำกัดความรับผิดชอบ */}
          <div className="space-y-1.5">
            <h3 className={`font-bold text-[13px] sm:text-sm flex items-center gap-2 ${
              isDark ? 'text-cyan-300' : 'text-blue-700'
            }`}>
              <span className="w-1.5 h-4 rounded-full bg-blue-600 inline-block" />
              ๔. ข้อแนะนำความปลอดภัยในการสัญจร & ข้อจำกัดความรับผิดชอบ
            </h3>
            <div className={`pl-3.5 space-y-2 text-xs sm:text-[12.5px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isDark ? 'bg-amber-950/30 border-amber-800/50 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-[11.5px] leading-relaxed">
                  <strong>ข้อควรระวัง:</strong> ข้อมูลระดับน้ำเป็นค่าตรวจวัดและประมาณการเพื่อการวางแผนเบื้องต้น สภาพจริงอาจเปลี่ยนแปลงตามปริมาณฝนสะสมและน้ำทะเลหนุน ในสถานการณ์จริงโปรดปฏิบัติตามคำสั่งและสัญญาณจราจรของเจ้าหน้าที่ตำรวจและ ปภ. หน้างานเป็นหลัก
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <span className="font-bold text-xs block">เกณฑ์ประเมินระดับน้ำสำหรับยานพาหนะ:</span>
                <ul className="space-y-1 list-none pl-1">
                  <li className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span><strong>ระดับ 1 (5–20 ซม.):</strong> น้ำรอระบาย รถทุกชนิดสัญจรได้ ควรชะลอความเร็ว</span>
                  </li>
                  <li className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span><strong>ระดับ 2 (21–50 ซม.):</strong> ท่วมปานกลาง รถเก๋ง/โหลดเตี้ยมีความเสี่ยง ควรหลีกเลี่ยง</span>
                  </li>
                  <li className="flex items-center gap-2 text-[11.5px]">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span><strong>ระดับ 3 (มากกว่า 50 ซม.):</strong> วิกฤต ห้ามรถเล็กสัญจรโดยเด็ดขาด ผ่านได้เฉพาะรถใหญ่</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Footer: Simple & Uncluttered Action */}
        <div className={`px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 shrink-0 border-t ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200/90 bg-slate-50/90'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">รับรองมาตรฐานความปลอดภัย & PDPA Compliance</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-all cursor-pointer shrink-0 active:scale-95 shadow-md shadow-blue-700/20 flex items-center gap-1.5"
          >
            <span>เข้าใจและรับทราบ</span>
          </button>
        </div>

      </div>
    </div>
  );
}
