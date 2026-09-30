import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  MapPin, 
  Clock, 
  Compass, 
  Camera, 
  AlertTriangle,
  ExternalLink,
  Shield
} from 'lucide-react';

export default function AdminVerificationPrompt({
  pendingReports = [],
  onApproveReport,
  onRejectReport,
  onFlyToCoords,
  onOpenFullAdmin,
  theme = 'light'
}) {
  const isDark = theme === 'dark';
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // If no pending reports, nothing to ask
  if (!pendingReports || pendingReports.length === 0) return null;

  // Active report being reviewed (first pending in queue)
  const currentReport = pendingReports[0];
  const pendingCount = pendingReports.length;

  // Minimized floating banner if user dismissed the prompt temporarily
  if (isDismissed) {
    return (
      <div className="fixed top-14 sm:top-16 right-3 sm:right-6 z-50 animate-in slide-in-from-top-4 duration-300">
        <button
          onClick={() => setIsDismissed(false)}
          className={`px-3.5 py-2 rounded-2xl shadow-xl border flex items-center gap-2.5 cursor-pointer backdrop-blur-xl transition-transform hover:scale-105 active:scale-95 ${
            isDark 
              ? 'bg-amber-950/95 border-amber-600 text-amber-200' 
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
          title="มีรายงานน้ำท่วมจากประชาชนรอแอดมินตรวจสอบ"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-xs font-bold flex items-center gap-1">
            <span>🚨 มีรายงานรอคุณอนุมัติ</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
              {pendingCount}
            </span>
          </span>
          <span className="text-[11px] underline font-medium">กดตรวจสอบ</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Full Interactive Verification Dialog Asking the Admin */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[92vh] ${
            isDark 
              ? 'bg-slate-900/98 border-amber-600/70 text-slate-100 shadow-amber-500/10' 
              : 'bg-white border-amber-300 text-slate-800 shadow-xl'
          }`}
        >
          {/* Header */}
          <div className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between ${
            isDark ? 'bg-amber-950/60 border-slate-800' : 'bg-amber-50/80 border-amber-100'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
                <ShieldAlert className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-amber-300' : 'text-amber-950'
                }`}>
                  <span>🚨 มีผู้รายงานสถานการณ์ใหม่เข้ามา!</span>
                  {pendingCount > 1 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold">
                      +{pendingCount - 1} รายการในคิว
                    </span>
                  )}
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-amber-400/80' : 'text-amber-800'}`}>
                  ระบบส่งให้คุณพิจารณาอนุมัติก่อนขึ้นแสดงบนแผนที่สาธารณะ
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDismissed(true)}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              }`}
              title="ย่อหน้านี้ไว้ก่อน"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Report Details Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
            
            {/* Location & District Badge */}
            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  isDark ? 'bg-blue-950 text-cyan-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  อ.{currentReport.district}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>แจ้งเมื่อ: {currentReport.reportedAt || 'เมื่อสักครู่'}</span>
                </span>
              </div>

              <h4 className="font-bold text-sm sm:text-base leading-snug">
                {currentReport.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                พิกัด: {currentReport.subdistrict || `[${currentReport.lat.toFixed(4)}, ${currentReport.lng.toFixed(4)}]`}
              </p>
            </div>

            {/* Severity & Water Depth */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[11px] text-slate-400 block mb-0.5">ระดับน้ำที่แจ้ง:</span>
                <span className="font-bold text-sm text-blue-600 dark:text-cyan-400 block">
                  ระดับ{currentReport.bodyLevelLabel}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  (ประมาณ {currentReport.depthRange})
                </span>
              </div>

              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[11px] text-slate-400 block mb-0.5">ระดับความเสี่ยง:</span>
                <span className={`font-bold text-sm block ${
                  currentReport.level === 3 ? 'text-rose-500' :
                  currentReport.level === 2 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {currentReport.level === 3 ? '🔴 วิกฤต (ห้ามผ่าน)' :
                   currentReport.level === 2 ? '🟡 เฝ้าระวังสูง' : '🟢 ปกติ/ท่วมเล็กน้อย'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  เกณฑ์ ปภ. / กรมทางหลวง
                </span>
              </div>
            </div>

            {/* Traffic Guidance / Comments */}
            {currentReport.trafficStatus && (
              <div className={`p-3 rounded-2xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  คำอธิบายสภาพการจราจรจากผู้แจ้ง:
                </span>
                <p className="leading-relaxed font-medium">
                  {currentReport.trafficStatus}
                </p>
              </div>
            )}

            {/* Photo Preview if uploaded */}
            {currentReport.photoUrl && (
              <div className="rounded-2xl border overflow-hidden">
                <div className="relative group cursor-pointer" onClick={() => setSelectedPhoto(currentReport.photoUrl)}>
                  <img 
                    src={currentReport.photoUrl} 
                    alt="ภาพถ่ายจากประชาชน" 
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold gap-1">
                    <Camera className="w-4 h-4" />
                    <span>คลิกเพื่อดูรูปขนาดเต็ม</span>
                  </div>
                </div>
                <div className={`p-2 text-[11px] text-center font-medium ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  📷 มีภาพถ่ายสถานที่จริงยืนยัน (เพิ่มความน่าเชื่อถือ)
                </div>
              </div>
            )}

            {/* Location Navigation Preview */}
            {onFlyToCoords && (
              <button
                type="button"
                onClick={() => onFlyToCoords(currentReport.lat, currentReport.lng)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-blue-700'
                }`}
              >
                <Compass className="w-4 h-4 text-blue-500" />
                <span>ส่องดูตำแหน่งนี้บนแผนที่</span>
              </button>
            )}

          </div>

          {/* Action Decision Buttons */}
          <div className={`p-3.5 sm:p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`ยืนยันปฏิเสธรายงานจุด "${currentReport.name}" และลบออกจากระบบ?`)) {
                  onRejectReport(currentReport.id);
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
            >
              ✕ ไม่อนุมัติ / ปฏิเสธ
            </button>

            <div className="w-full sm:w-auto flex items-center gap-2">
              {onOpenFullAdmin && (
                <button
                  type="button"
                  onClick={onOpenFullAdmin}
                  className={`flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  เปิดแผง ADMIN
                </button>
              )}

              <button
                type="button"
                onClick={() => onApproveReport(currentReport.id)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>อนุมัติขึ้นเว็บทันที</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img src={selectedPhoto} alt="ภาพถ่ายขยายใหญ่" className="max-w-full max-h-[85vh] object-contain" />
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
