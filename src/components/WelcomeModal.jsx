import React from 'react';
import { X, Shield, CheckCircle2, Navigation2, Info, MapPin } from 'lucide-react';

export default function WelcomeModal({ isOpen, onClose, onEnterWithLocation, theme = 'light' }) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const handleEnter = () => {
    if (onEnterWithLocation) {
      onEnterWithLocation();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-lg border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh] relative smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 shrink-0"></div>

        {/* Modal Header */}
        <div className={`p-4 sm:p-6 pb-2.5 sm:pb-3 flex items-start justify-between gap-3 shrink-0 ${isDark ? 'bg-slate-950/40' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border ${
              isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase border ${
                isDark ? 'bg-blue-950/80 text-cyan-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                สารสนเทศสาธารณประโยชน์
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

        {/* Modal Body (Scrollable with finger swipe on mobile) */}
        <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-2 sm:py-3 space-y-3 text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          
          {/* GPS Auto-Prompt Highlight for Precision */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 shadow-xs ${
            isDark 
              ? 'bg-blue-950/60 border-blue-800/80 text-cyan-200' 
              : 'bg-blue-50/90 border-blue-200 text-blue-900'
          }`}>
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-sm">
              <Navigation2 className="w-4 h-4 animate-pulse" />
            </div>
            <div className="space-y-1">
              <strong className="block text-xs sm:text-sm font-bold">
                📍 เรียกขอตำแหน่ง GPS อัตโนมัติเพื่อความแม่นยำ
              </strong>
              <p className="text-[11px] sm:text-xs leading-relaxed opacity-90">
                เมื่อเข้าสู่ระบบ อุปกรณ์ของคุณจะขออนุญาตเข้าถึงตำแหน่ง เพื่อระบุพิกัดและคำนวณระยะห่างจุดน้ำท่วมใกล้ตัวที่สุดแบบเรียลไทม์
              </p>
            </div>
          </div>

          {/* Project Purpose Statement */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs space-y-2 ${
            isDark ? 'bg-slate-855/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <Info className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                วัตถุประสงค์ระบบสารสนเทศ
              </h4>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              เว็บไซต์นี้จัดทำขึ้นเพื่อเป็นสื่อกลางในการรวบรวมและเผยแพร่ข้อมูลสารสนเทศเกี่ยวกับสถานการณ์น้ำท่วมขังบนผิวจราจรในพื้นที่จังหวัดสมุทรปราการ โดยมีวัตถุประสงค์เพื่อสนับสนุนการวางแผนการเดินทางและความปลอดภัยในการสัญจรของประชาชน
            </p>
          </div>

          {/* Data Reference & Disclaimers */}
          <div className={`space-y-2 p-3.5 sm:p-4 rounded-2xl border ${
            isDark ? 'bg-slate-855/80 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Shield className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span>การอ้างอิงแหล่งข้อมูลและการเฝ้าระวัง 24 ชั่วโมง</span>
            </h4>

            <div className={`space-y-2 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>
                  <strong className={isDark ? 'text-white' : 'text-slate-800'}>อัปเดต 24 ชั่วโมง:</strong> ระบบตรวจสภาพอากาศ เรดาร์ฝน และน้ำทะเลหนุนอัตโนมัติตลอด 24 ชม. จุดไหนน้ำระบายแห้งจะถูกนำออกจากแผนที่เสี่ยงภัยทันที
                </span>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                <span>
                  <strong className={isDark ? 'text-white' : 'text-slate-800'}>การรวบรวมข้อมูล:</strong> ข้อมูลสถิติ พิกัดจุดเสี่ยง เกณฑ์ระดับน้ำ และพยากรณ์อากาศ เป็นการรวบรวมจากแหล่งข้อมูลเปิดและประกาศที่เป็นประโยชน์ต่อสาธารณชน เพื่อประกอบการติดตามสถานการณ์เบื้องต้น
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

        {/* Modal Footer (Pinned at bottom, ALWAYS accessible on any mobile device) */}
        <div className={`p-3.5 sm:p-5 border-t flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <span className={`text-[11px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            PrakanGuard • ระบบสารสนเทศเพื่อความปลอดภัยในการสัญจร จ.สมุทรปราการ
          </span>
          <button
            onClick={handleEnter}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-blue-600/30 hover:scale-102 active:scale-98 text-center flex items-center justify-center gap-2"
          >
            <Navigation2 className="w-4 h-4 fill-white" />
            <span>เข้าสู่ระบบสารสนเทศ (เปิดพิกัด GPS)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
