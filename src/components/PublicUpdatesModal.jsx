import React from 'react';
import { 
  X, 
  RefreshCw, 
  MapPin, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingDown
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
    const districtText = item.district ? `อ.${item.district}` : '';
    const subdistrictText = item.subdistrict ? `ต.${item.subdistrict}` : '';

    items.push({
      id: item.id || `upd_${Math.random()}`,
      statusType,
      statusLabel,
      statusBadgeClass,
      icon,
      locationName,
      locationSub: [districtText, subdistrictText].filter(Boolean).join(' • '),
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 smooth-backdrop">
      <div className={`w-full sm:max-w-lg border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 shrink-0"></div>

        {/* Modal Header */}
        <div className={`p-4 sm:p-5 pb-3 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h3 className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                อัปเดตสถานการณ์น้ำล่าสุด
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lastUpdatedTime ? `อัปเดตเมื่อ ${lastUpdatedTime}` : 'ตรวจสอบสถานะทุก 15 วินาที'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onRefreshData && (
              <button 
                type="button"
                onClick={onRefreshData} 
                disabled={isRefreshing}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              className={`p-2 rounded-xl transition-all cursor-pointer ${
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
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isDark 
                    ? 'bg-slate-850/60 hover:bg-slate-800 border-slate-800' 
                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {/* Location and District */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-xl border shrink-0 ${item.statusBadgeClass}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs sm:text-sm font-bold block truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.locationName}
                    </span>
                    {item.locationSub && (
                      <span className={`text-[11px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.locationSub}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.statusBadgeClass}`}>
                    {item.statusLabel}
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
