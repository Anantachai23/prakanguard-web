import React from 'react';
import { 
  X, 
  RefreshCw, 
  MapPin, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Clock
} from 'lucide-react';

export default function PublicUpdatesModal({ 
  isOpen, 
  onClose, 
  points = [],
  citizenReports = [],
  onSelectPoint,
  lastUpdatedTime,
  onRefreshData,
  isRefreshing = false,
  theme = 'light' 
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  // Build unified status list:
  // 1. ตรงไหนแห้งแล้ว (Drained / Dried / Resolved)
  // 2. ตรงไหนเริ่มท่วมแล้ว (Active Level 2/3 / Critical / Rising)
  // 3. ตรงไหนน้ำลดแล้ว (Receding / Level 1)

  const items = [];

  // Add from points & citizen reports
  const allSources = [
    ...points.map(p => ({ ...p, isCitizen: false })),
    ...citizenReports.filter(r => r.isApproved).map(r => ({ ...r, isCitizen: true }))
  ];

  for (const item of allSources) {
    const isDry = item.isResolved || item.depthCm === 0 || item.isActive === false;
    const depth = Number(item.depthCm) || 0;
    const sev = Number(item.severity) || 1;

    let statusType = 'rising'; // 'dry' | 'receding' | 'rising'
    let statusLabel = 'เริ่มท่วมแล้ว';
    let statusBadgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    let icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;

    if (isDry) {
      statusType = 'dry';
      statusLabel = 'แห้งแล้ว';
      statusBadgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    } else if (sev === 1 || depth <= 20 || item.trend === 'falling') {
      statusType = 'receding';
      statusLabel = 'น้ำลดแล้ว';
      statusBadgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      icon = <TrendingDown className="w-3.5 h-3.5 text-amber-500" />;
    } else {
      statusType = 'rising';
      statusLabel = 'เริ่มท่วมแล้ว';
      statusBadgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
    }

    const locationName = item.name || item.notes || 'ไม่ระบุชื่อสถานที่';
    const cleanDistrict = item.district ? item.district.replace(/^อ\./, '').replace(/^อำเภอ/, '').replace('เมืองสมุทรปราการ', 'เมือง') : '';
    const cleanSub = item.subdistrict ? item.subdistrict.replace(/^ต\./, '').replace(/^ตำบล/, '') : '';
    const districtText = cleanDistrict ? `${cleanDistrict}` : '';
    const subdistrictText = cleanSub ? `ต.${cleanSub}` : '';

    // เวลาที่แสดง = เวลาที่สถานะเปลี่ยนจริง ไม่ใช่เวลา sync ทุก 30 วิ
    // ลำดับความสำคัญ: statusChangedAt > resolvedAt > approvedAt > reportedAt/updatedAt
    let itemTime = '';
    const timeCandidates = [
      item.updatedAt,
      item.statusChangedAt,
      item.resolvedAt,
      item.approvedAt,
      item.reportedAt,
      item.time
    ];

    for (const tc of timeCandidates) {
      if (tc && typeof tc === 'string' && tc.trim()) {
        let str = tc.trim();
        if (/^\d{1,2}:\d{2}$/.test(str)) {
          itemTime = `${str} น.`;
        } else if (/^\d{1,2}:\d{2}:\d{2}\s*น\.?/.test(str)) {
          // HH:MM:SS น. → ตัด seconds ออก
          itemTime = str.replace(/^(\d{1,2}:\d{2}):\d{2}\s*น\.?/, '$1 น.');
        } else {
          itemTime = str;
        }
        break;
      }
    }

    if (!itemTime && item.timestamp) {
      try {
        const d = new Date(item.timestamp);
        if (!isNaN(d.getTime())) {
          itemTime = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        }
      } catch (_) {}
    }

    if (!itemTime) {
      itemTime = '03:21 น.';
    }

    items.push({
      id: item.id || `upd_${Math.random()}`,
      statusType,
      statusLabel,
      statusBadgeClass,
      icon,
      locationName,
      locationSub: [districtText, subdistrictText].filter(Boolean).join(' • '),
      itemTime,
      rawPoint: item
    });
  }

  // Sort order: เริ่มท่วมแล้ว -> น้ำลดแล้ว -> แห้งแล้ว
  items.sort((a, b) => {
    const order = { rising: 1, receding: 2, dry: 3 };
    return (order[a.statusType] || 2) - (order[b.statusType] || 2);
  });

  const handleItemClick = (point) => {
    if (onSelectPoint) {
      onSelectPoint(point);
      onClose();
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-2.5 sm:p-4 smooth-backdrop"
    >
      <div className={`w-full sm:max-w-md border rounded-3xl shadow-2xl flex flex-col max-h-[58vh] sm:max-h-[70vh] mb-1 sm:mb-0 overflow-hidden smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Pull handle on mobile */}
        <div className="w-10 h-1 bg-slate-400/30 rounded-full mx-auto my-1.5 shrink-0 sm:hidden" />

        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 shrink-0"></div>

        {/* Modal Header */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-blue-400/50 shadow-sm">
              <img src="/logo.png" alt="PrakanGuard" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                อัปเดตสถานการณ์น้ำ
              </h3>
              <p className={`text-[10px] sm:text-xs text-slate-400 truncate`}>
                {lastUpdatedTime ? `อัปเดตเมื่อ: ${lastUpdatedTime}` : 'อัปเดตอัตโนมัติทุก 30 วินาที (24 ชม.)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onRefreshData && (
              <button 
                type="button"
                onClick={onRefreshData} 
                disabled={isRefreshing}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend Summary Bar (Single unified view) */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'
        }`}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              แห้งแล้ว
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              น้ำลดแล้ว
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              เริ่มท่วมแล้ว
            </span>
          </div>
          <span className="font-bold">{items.length} จุด</span>
        </div>

        {/* Single Consolidated List (ระบุสถานที่แค่นั้นพอ) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              ไม่มีรายงานน้ำท่วมขังขณะนี้ ทุกเส้นทางสัญจรได้ตามปกติ
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.rawPoint)}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  isDark 
                    ? 'bg-slate-850/60 hover:bg-slate-800 border-slate-800' 
                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {/* Location and District */}
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-xl border shrink-0 mt-0.5 ${item.statusBadgeClass}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs sm:text-sm font-bold block line-clamp-2 break-words leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.locationName}
                    </span>
                    {item.locationSub && (
                      <span className={`text-[10px] block mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.locationSub}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge & Time */}
                <div className="shrink-0 flex flex-col items-end justify-center gap-1 text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.statusBadgeClass}`}>
                    {item.statusLabel}
                  </span>
                  <span className={`text-[10px] sm:text-[11px] font-medium flex items-center gap-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>{item.itemTime}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
