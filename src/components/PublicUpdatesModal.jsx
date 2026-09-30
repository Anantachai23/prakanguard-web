import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Radio, 
  CloudRain, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Droplets,
  Bell
} from 'lucide-react';

export default function PublicUpdatesModal({ 
  isOpen, 
  onClose, 
  citizenReports = [],
  weather = {},
  onSelectPoint,
  lastUpdatedTime,
  onRefreshData,
  isRefreshing = false,
  theme = 'light' 
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  // Filter approved and resolved reports for public view
  const approvedReports = citizenReports.filter(r => r.isApproved && !r.isResolved);
  const resolvedReports = citizenReports.filter(r => r.isResolved);

  // Pre-seed realistic timeline events from today if user just started
  const staticTimelineEvents = [
    {
      id: 'event-weather',
      time: '04:00 น.',
      title: 'กรมอุตุนิยมวิทยา (TMD) ออกประกาศสภาพอากาศ',
      detail: `คาดการณ์โอกาสฝนตก ${weather.rainProbabilityToday || 60}% ช่วงเวลาเฝ้าระวังสูงสุด ${weather.peakHour || '16:00 น.'}`,
      type: 'weather',
      agency: 'กรมอุตุนิยมวิทยา'
    },
    {
      id: 'event-tide',
      time: '03:30 น.',
      title: 'กองทัพเรือ รายงานระดับน้ำทะเลหนุนสถานีป้อมพระจุลฯ',
      detail: 'ระดับน้ำคาดการณ์ช่วงน้ำขึ้นสูงสุด +1.68 ม. รทก. แนวคันกั้นน้ำแม่น้ำเจ้าพระยายังสามารถรองรับได้',
      type: 'tide',
      agency: 'กรมอุทกศาสตร์ กองทัพเรือ'
    },
    {
      id: 'event-drainage',
      time: '03:00 น.',
      title: 'พร้อมเดินเครื่องสถานีสูบน้ำคลองสำโรงและคลองลัดโพธิ์',
      detail: 'เตรียมความพร้อมรองรับการระบายน้ำผิวจราจร 6 อำเภอ พร้อมเจ้าหน้าที่เฝ้าระวังตลอด 24 ชั่วโมง',
      type: 'official',
      agency: 'สำนักชลประทาน & ปภ.สมุทรปราการ'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-2xl border rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600"></div>

        {/* Modal Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Bell className="w-5 h-5 animate-bounce-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  อัปเดตสถานการณ์น้ำท่วมและเส้นทาง (สำหรับประชาชน)
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                กระดานรายงานสถานะแบบเรียลไทม์ • อ้างอิงข้อมูลเปิดภาครัฐและการยืนยันจุด
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Sync Status Banner & Refresh Button */}
        <div className={`px-5 py-3 border-b flex items-center justify-between gap-3 ${
          isDark ? 'bg-blue-950/40 border-blue-900/50' : 'bg-blue-50/80 border-blue-100'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <Clock className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span>
              อัปเดตล่าสุด: <strong className={isDark ? 'text-cyan-300' : 'text-blue-900'}>{lastUpdatedTime || 'สด ณ ปัจจุบัน'}</strong>
            </span>
          </div>

          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isDark 
                ? 'bg-blue-900/80 hover:bg-blue-800 text-cyan-200 border border-blue-700' 
                : 'bg-white hover:bg-blue-100/60 text-blue-700 border border-blue-200'
            } ${isRefreshing ? 'opacity-60 cursor-wait' : ''}`}
            title="รีเฟรชเพื่อดึงข้อมูลสถานะล่าสุด"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'กำลังซิงก์...' : 'รีเฟรชข้อมูล'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Quick Metrics Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[11px] text-slate-400 block mb-0.5">จุดเฝ้าระวังหลัก</span>
              <strong className="text-base sm:text-lg font-bold text-blue-500">16 จุด</strong>
            </div>

            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[11px] text-slate-400 block mb-0.5">รายงานที่ยืนยันแล้ว</span>
              <strong className="text-base sm:text-lg font-bold text-amber-500">
                {approvedReports.length} จุด
              </strong>
            </div>

            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[11px] text-slate-400 block mb-0.5">น้ำแห้ง/เปิดทาง</span>
              <strong className="text-base sm:text-lg font-bold text-emerald-500">
                {resolvedReports.length} จุด
              </strong>
            </div>
          </div>

          {/* Active Live Confirmed Citizen Reports */}
          {approvedReports.length > 0 && (
            <div className="space-y-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-amber-300' : 'text-amber-800'
              }`}>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>รายงานสถานการณ์น้ำท่วมผิวจราจรที่ยืนยันแล้ว ({approvedReports.length})</span>
              </h4>

              <div className="space-y-2">
                {approvedReports.map(report => (
                  <div 
                    key={report.id}
                    onClick={() => {
                      if (onSelectPoint) {
                        onSelectPoint(report);
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                      isDark ? 'bg-slate-850/80 hover:bg-slate-800 border-amber-900/60' : 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500 text-white shrink-0">
                          ระดับ{report.bodyLevelLabel} ({report.depthRange})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {report.approvedAt ? `ยืนยันเมื่อ ${report.approvedAt}` : `รายงานเมื่อ ${report.reportedAt}`}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs sm:text-sm truncate">{report.name}</h5>
                      <p className={`text-xs line-clamp-1 mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {report.trafficStatus || report.cause}
                      </p>
                    </div>

                    <div className="flex items-center text-blue-500 group-hover:translate-x-1 transition-transform shrink-0 text-xs font-bold">
                      <span className="hidden sm:inline mr-1">ดูบนแผนที่</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drained / Resolved Points (Water Receded) */}
          {resolvedReports.length > 0 && (
            <div className="space-y-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-emerald-300' : 'text-emerald-800'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>จุดที่น้ำลดและคืนผิวจราจรแล้ว ({resolvedReports.length})</span>
              </h4>

              <div className="space-y-2">
                {resolvedReports.map(report => (
                  <div 
                    key={report.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-850/60 border-slate-750 text-slate-300' : 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <strong className="truncate">{report.name}</strong>
                      <span className="text-[11px] text-slate-400 shrink-0">(อ.{report.district})</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold shrink-0">
                      น้ำแห้งเมื่อ {report.resolvedAt || report.approvedAt || report.reportedAt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline of Official Situation Updates */}
          <div className="space-y-2.5 pt-2">
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
              <span>ไทม์ไลน์ประกาศและข้อมูลสารสนเทศรอบวัน</span>
            </h4>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {staticTimelineEvents.map(event => (
                <div key={event.id} className="relative">
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 shadow"></span>
                  <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-850/70 border-slate-750' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="font-bold">{event.title}</strong>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{event.time}</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{event.detail}</p>
                    <span className={`text-[10px] font-semibold mt-1 block ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                      อ้างอิง: [{event.agency}]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}>
          <span>ระบบสารสนเทศเปิดเพื่อประโยชน์สาธารณะ</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
