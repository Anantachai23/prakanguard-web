import React from 'react';
import { X, GraduationCap, Shield, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function WelcomeModal({ isOpen, onClose, theme = 'light' }) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-lg border rounded-3xl shadow-2xl overflow-hidden flex flex-col relative smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600"></div>

        {/* Modal Header */}
        <div className={`p-5 sm:p-6 pb-3 flex items-start justify-between gap-3 ${isDark ? 'bg-slate-950/40' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border ${
              isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase border ${
                isDark ? 'bg-blue-950/80 text-cyan-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                กลุ่มนักเรียน
              </span>
              <h3 className={`text-base sm:text-lg font-bold mt-0.5 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ระบบสารสนเทศและเฝ้าระวังอุทกภัย จ.สมุทรปราการ
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className={`px-5 sm:px-6 py-2 space-y-3 text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          
          {/* Formal Student Group Purpose Statement */}
          <div className={`p-4 rounded-2xl border shadow-xs space-y-2 ${
            isDark ? 'bg-slate-855/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                วัตถุประสงค์การพัฒนาโดยกลุ่มนักเรียน
              </h4>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              เว็บไซต์นี้จัดทำขึ้นโดย <strong>กลุ่มนักเรียน</strong> เพื่อเป็นสื่อกลางในการรวบรวมและเผยแพร่ข้อมูลสารสนเทศเกี่ยวกับสถานการณ์น้ำท่วมขังบนผิวจราจรในพื้นที่จังหวัดสมุทรปราการ โดยมีวัตถุประสงค์เพื่อสนับสนุนการวางแผนการเดินทางและความปลอดภัยในการสัญจรของประชาชน
            </p>
            <p className={`text-xs leading-relaxed pt-1.5 border-t font-medium ${
              isDark ? 'border-slate-700 text-cyan-300' : 'border-slate-200 text-blue-800'
            }`}>
              *หากมีข้อผิดพลาดหรือข้อเสนอแนะประการใด คณะผู้จัดทำขอน้อมรับเพื่อนำไปพัฒนาและปรับปรุงระบบให้เกิดประโยชน์สูงสุดต่อไปครับ
            </p>
          </div>

          {/* Data Reference & Disclaimers */}
          <div className={`space-y-2 p-4 rounded-2xl border ${
            isDark ? 'bg-slate-855/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Shield className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span>การอ้างอิงแหล่งข้อมูลและข้อกำหนดการใช้งาน</span>
            </h4>

            <div className={`space-y-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>
                  <strong className={isDark ? 'text-white' : 'text-slate-800'}>การรวบรวมข้อมูล:</strong> ข้อมูลสถิติ พิกัดจุดเสี่ยง เกณฑ์ระดับน้ำ และพยากรณ์อากาศ เป็นการรวบรวมจากแหล่งข้อมูลเปิดและประกาศที่เป็นประโยชน์ต่อสาธารณชน เพื่อประกอบการติดตามสถานการณ์เบื้องต้น
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>
                  <strong className={isDark ? 'text-white' : 'text-slate-800'}>เจตนารมณ์ในการจัดทำ:</strong> ระบบนี้จัดทำขึ้นเพื่อการศึกษาและการบริการข้อมูลเพื่อความปลอดภัยของสาธารณชน มิได้มีเจตนาพาดพิงหรือส่งผลกระทบต่อหน่วยงานหรือบุคคลใด
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>
                  <strong className={isDark ? 'text-white' : 'text-slate-800'}>ข้อแนะนำการใช้งาน:</strong> ข้อมูลนี้จัดทำขึ้นเพื่อเป็นข้อมูลประกอบการตัดสินใจเบื้องต้น ในสถานการณ์ฉุกเฉิน ขอแนะนำให้ประชาชนติดตามประกาศอย่างเป็นทางการจากหน่วยงานในพื้นที่ควบคู่กันไปด้วย
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <span className={`text-[11px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            PrakanGuard • จัดทำโดยกลุ่มนักเรียน
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-blue-600/30 hover:scale-102 active:scale-98"
          >
            เข้าสู่ระบบสารสนเทศ
          </button>
        </div>

      </div>
    </div>
  );
}
