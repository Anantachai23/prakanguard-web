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
  Bell,
  Waves
} from 'lucide-react';

export default function PublicUpdatesModal({ 
  isOpen, 
  onClose, 
  points = [],
  citizenReports = [],
  changelog = [],
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
  const resolvedCitizenReports = citizenReports.filter(r => r.isResolved);

  // Official points active vs drained/safe
  const activeOfficialPoints = points.filter(p => p.isActive !== false && !p.isResolved);
  const drainedOfficialPoints = points.filter(p => p.isActive === false || p.isResolved);

  const totalDrainedCount = drainedOfficialPoints.length + resolvedCitizenReports.length;

  // Pre-seed realistic timeline events from today
  const staticTimelineEvents = [
    {
      id: 'event-radar',
      time: 'สด 24 ชม.',
      title: 'เรดาร์ตรวจอากาศ TMD สุวรรณภูมิ/สมุทรปราการ',
      detail: `สแกนกลุ่มเมฆฝนครอบคลุม 6 อำเภอ • โอกาสฝน ${weather.rainProbabilityToday || 40}% • สภาพอากาศ: ${weather.weatherDesc || 'มีเมฆบางส่วน'}`,
      type: 'weather',
      agency: 'กรมอุตุนิยมวิทยา'
    },
    {
      id: 'event-tide',
      time: 'สถานีป้อมพระจุลฯ',
      title: 'สถานีอุทกศาสตร์ กองทัพเรือ ปากอ่าวไทย',
      detail: 'เฝ้าระวังระดับน้ำทะเลหนุนแม่น้ำเจ้าพระยา ตรวจวัดอัตโนมัติ 24 ชม. จุดที่น้ำลดสู่ระดับปกติจะปลดออกจากแผนที่ทันที',
      type: 'tide',
      agency: 'กรมอุทกศาสตร์ กองทัพเรือ'
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
                  อัปเดตสถานการณ์น้ำท่วมและจุดคลี่คลาย (24 ชั่วโมง)
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ระบบเฝ้าระวังอัตโนมัติ • ปลดจุดน้ำแห้ง/ไม่มีฝนตกออกจากแผนที่ทันที
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
              <span className="text-[11px] text-slate-400 block mb-0.5">จุดเฝ้าระวังคงอยู่</span>
              <strong className="text-base sm:text-lg font-bold text-blue-500">
                {activeOfficialPoints.length} จุด
              </strong>
            </div>

            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[11px] text-slate-400 block mb-0.5">รายงานประชาชน</span>
              <strong className="text-base sm:text-lg font-bold text-amber-500">
                {approvedReports.length} จุด
              </strong>
            </div>

            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-[11px] text-slate-400 block mb-0.5">น้ำแห้ง/นำออกแล้ว</span>
              <strong className="text-base sm:text-lg font-bold text-emerald-500">
                {totalDrainedCount} จุด
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
                      isDark ? 'bg-slate-855/80 hover:bg-slate-800 border-amber-900/60' : 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200'
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

          {/* Drained / Resolved Points (Taken off the active risk map) */}
          {totalDrainedCount > 0 && (
            <div className="space-y-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-emerald-300' : 'text-emerald-800'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>จุดที่น้ำแห้ง/คลี่คลายแล้ว นำออกจากแผนที่เสี่ยงภัย ({totalDrainedCount})</span>
              </h4>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {/* Official Cleared Points */}
                {drainedOfficialPoints.map(point => (
                  <div 
                    key={point.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-855/60 border-slate-750 text-slate-300' : 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <strong className="truncate">{point.name}</strong>
                      <span className="text-[11px] text-slate-400 shrink-0">(อ.{point.district})</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold shrink-0">
                      {point.statusLabel || 'สัญจรปกติ (น้ำแห้งแล้ว)'}
                    </span>
                  </div>
                ))}

                {/* Citizen Resolved Reports */}
                {resolvedCitizenReports.map(report => (
                  <div 
                    key={report.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-855/60 border-slate-750 text-slate-300' : 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <strong className="truncate">{report.name}</strong>
                      <span className="text-[11px] text-slate-400 shrink-0">(อ.{report.district})</span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold shrink-0">
                      แห้งแล้ว ({report.resolvedAt || 'วันนี้'})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 24-Hour Autonomous Activity Changelog */}
          {changelog.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-cyan-300' : 'text-blue-800'
              }`}>
                <Waves className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>ประวัติการปรับปรุงสถานะจุดเสี่ยงอัตโนมัติ 24 ชม.</span>
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {changelog.slice(0, 5).map(item => (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                      item.type === 'cleared'
                        ? isDark ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : isDark ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="font-bold flex items-center gap-1.5">
                        {item.type === 'cleared' ? '💧' : '⚠️'} {item.title}
                      </strong>
                      <span className="text-[10px] opacity-75 font-mono shrink-0">{item.time}</span>
                    </div>
                    <p className="text-[11px] opacity-90">{item.detail}</p>
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
              <span>สถานะเรดาร์และระดับน้ำทะเลหนุนปากอ่าวไทย</span>
            </h4>

            <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {staticTimelineEvents.map(event => (
                <div key={event.id} className="relative">
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900 shadow"></span>
                  <div className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-855/70 border-slate-750' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="font-bold">{event.title}</strong>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{event.time}</span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{event.detail}</p>
                    <span className={`text-[10px] font-semibold mt-1 block ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                      แหล่งข้อมูล: [{event.agency}]
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
          <span>ระบบสารสนเทศเปิดเพื่อประโยชน์สาธารณะ เฝ้าระวัง 24 ชั่วโมง</span>
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
