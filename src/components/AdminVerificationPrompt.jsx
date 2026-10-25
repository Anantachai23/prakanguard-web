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
import {
  CivicShield,
  CivicReportCamera,
  CivicCompass,
  CivicHailCrystal
} from './CivicIcons';

export default function AdminVerificationPrompt({
  pendingReports = [],
  unreadFeedbackCount = 0,
  onApproveReport,
  onRejectReport,
  onFlyToCoords,
  onOpenFullAdmin,
  theme = 'light'
}) {
  const isDark = theme === 'dark';
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const hasPendingReports = Array.isArray(pendingReports) && pendingReports.length > 0;
  const hasUnreadFeedback = unreadFeedbackCount > 0;

  // If nothing pending and no unread feedback, nothing to prompt
  if (!hasPendingReports && !hasUnreadFeedback) return null;

  // If no pending reports but has unread feedback, show compact feedback alert banner
  if (!hasPendingReports && hasUnreadFeedback) {
    return (
      <div className="fixed top-14 sm:top-16 right-3 sm:right-6 z-50">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('prakanguard_open_admin_tab', { detail: 'feedback' }));
            if (onOpenFullAdmin) onOpenFullAdmin();
          }}
          className={`px-3.5 py-2 rounded-lg shadow-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
            isDark 
              ? 'bg-slate-900 border-teal-500/80 text-teal-200 hover:bg-slate-800' 
              : 'bg-white border-teal-300 text-teal-900 hover:bg-teal-50'
          }`}
          title="มีข้อเสนอแนะใหม่จากประชาชนรอตรวจสอบ"
        >
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-xs font-bold flex items-center gap-1.5">
            <span>ข้อเสนอแนะใหม่</span>
            <span className="px-1.5 py-0.2 rounded bg-teal-600 text-white text-[10px] font-mono">
              +{unreadFeedbackCount}
            </span>
          </span>
        </button>
      </div>
    );
  }

  // Active report being reviewed (first pending in queue)
  const currentReport = pendingReports[0];
  const pendingCount = pendingReports.length;

  // Minimized floating banner if user dismissed the prompt temporarily
  if (isDismissed) {
    return (
      <div className="fixed top-14 sm:top-16 right-3 sm:right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsDismissed(false)}
          className={`px-3.5 py-2 rounded-lg shadow-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
            isDark 
              ? 'bg-slate-900 border-amber-600/80 text-amber-200 hover:bg-slate-800' 
              : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-50'
          }`}
          title="มีรายงานน้ำท่วมจากประชาชนรอแอดมินตรวจสอบ"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs font-bold flex items-center gap-1.5">
            <span>รอตรวจสอบ</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-600 text-white text-[10px] font-mono">
              {pendingCount}
            </span>
          </span>
        </button>

        {hasUnreadFeedback && (
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('prakanguard_open_admin_tab', { detail: 'feedback' }));
              if (onOpenFullAdmin) onOpenFullAdmin();
            }}
            className={`px-2.5 py-2 rounded-lg shadow-xl border flex items-center gap-1.5 cursor-pointer transition-colors ${
              isDark 
                ? 'bg-slate-900 border-teal-500/80 text-teal-200 hover:bg-slate-800' 
                : 'bg-white border-teal-300 text-teal-900 hover:bg-teal-50'
            }`}
            title="ดูข้อเสนอแนะจากประชาชน"
          >
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-bold">
              +{unreadFeedbackCount} ข้อเสนอแนะ
            </span>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
        <div 
          className={`w-[92vw] max-w-[420px] sm:max-w-lg my-auto m-auto rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[88vh] transition-colors ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-100' 
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Top Institutional Bar */}
          <div className="h-1 w-full bg-amber-500 shrink-0" />

          {/* Header */}
          <div className={`px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-2.5 shrink-0 ${
            isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-amber-950/60 text-amber-400 border-amber-800/80' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <CivicShield className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-[13px] sm:text-base font-bold flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span>ตรวจสอบรายงานภาคประชาชน</span>
                  {pendingCount > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-white font-mono font-bold">
                      +{pendingCount - 1} คิว
                    </span>
                  )}
                </h3>
                <p className={`text-[10.5px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  พิจารณาอนุมัติข้อมูลเพื่อแสดงบนแผนที่สาธารณะ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
              }`}
              title="ย่อหน้าต่าง"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Report Details Content */}
          <div className="px-3.5 sm:px-5 py-3 sm:py-4 overflow-y-auto space-y-2.5 text-xs sm:text-sm">
            
            {/* Location & District Badge */}
            <div className={`p-3.5 rounded-lg border ${
              isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  isDark ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-white text-blue-700 border-slate-200'
                }`}>
                  อ.{currentReport.district}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{currentReport.reportedAt || 'เมื่อสักครู่'}</span>
                </span>
              </div>

              <h4 className="font-bold text-sm sm:text-base leading-snug">
                {currentReport.name}
              </h4>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                พิกัด: {currentReport.subdistrict || `${currentReport.lat.toFixed(5)}, ${currentReport.lng.toFixed(5)}`}
              </p>
            </div>

            {/* Severity & Water Depth / Hail Size */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
              }`}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  {currentReport.hazardType === 'hail' ? 'ขนาดลูกเห็บ' : 'ระดับน้ำที่รายงาน'}
                </span>
                <span className="font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  {currentReport.hazardType === 'hail' ? (
                    <>
                      <CivicHailCrystal className="w-3.5 h-3.5 shrink-0" />
                      <span>{currentReport.hailSizeLabel || 'ลูกเห็บตก'}</span>
                    </>
                  ) : (currentReport.bodyLevelLabel ? `${currentReport.bodyLevelLabel}` : `ระดับ ${currentReport.levelLabel || 'เฝ้าระวัง'}`)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">
                  {currentReport.hazardType === 'hail' 
                    ? 'พายุลูกเห็บ' 
                    : `ประมาณ ${currentReport.depthCm ? `${currentReport.depthCm} ซม.` : (currentReport.depthRange || 'เฝ้าระวัง')}`}
                </span>
              </div>

              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
              }`}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  การจำแนกความรุนแรง
                </span>
                <span className={`font-bold text-xs sm:text-sm flex items-center gap-1.5 ${
                  currentReport.level === 3 ? 'text-rose-500' :
                  currentReport.level === 2 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    currentReport.level === 3 ? 'bg-rose-500' :
                    currentReport.level === 2 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <span>
                    {currentReport.level === 3 ? 'ระดับ 3 (วิกฤต)' :
                     currentReport.level === 2 ? 'ระดับ 2 (ปานกลาง)' : 'ระดับ 1 (ปกติ)'}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  เกณฑ์ประเมินมาตรฐาน
                </span>
              </div>
            </div>

            {/* Traffic Guidance / Comments */}
            {currentReport.trafficStatus && (
              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
              }`}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  รายละเอียดสภาพจราจร
                </span>
                <p className="text-xs leading-relaxed">
                  {currentReport.trafficStatus}
                </p>
              </div>
            )}

            {/* Photo Preview if uploaded */}
            {currentReport.photoUrl && (
              <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="relative group cursor-pointer" onClick={() => setSelectedPhoto(currentReport.photoUrl)}>
                  <img 
                    src={currentReport.photoUrl} 
                    alt="ภาพถ่ายจากประชาชน" 
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold gap-1.5">
                    <CivicReportCamera className="w-4 h-4" />
                    <span>ดูภาพขนาดเต็ม</span>
                  </div>
                </div>
              </div>
            )}

            {/* Location Navigation Preview */}
            {onFlyToCoords && (
              <button
                type="button"
                onClick={() => onFlyToCoords(currentReport.lat, currentReport.lng)}
                className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <CivicCompass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>ตรวจสอบตำแหน่งบนแผนที่</span>
              </button>
            )}

          </div>

          {/* Action Decision Buttons */}
          <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`ยืนยันปฏิเสธรายงานจุด "${currentReport.name}" และลบออกจากระบบ?`)) {
                  onRejectReport(currentReport.id);
                }
              }}
              className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              ปฏิเสธรายการ
            </button>

            <div className="w-full sm:w-auto flex items-center gap-2">
              {onOpenFullAdmin && (
                <button
                  type="button"
                  onClick={onOpenFullAdmin}
                  className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ศูนย์ควบคุม
                </button>
              )}

              <button
                type="button"
                onClick={() => onApproveReport(currentReport.id)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>อนุมัติแสดงผล</span>
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
