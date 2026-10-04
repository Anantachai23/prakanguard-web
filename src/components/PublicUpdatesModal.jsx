import React from 'react';
import { 
  X, 
  RefreshCw, 
  MapPin, 
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function PublicUpdatesModal({ 
  isOpen, 
  onClose, 
  dailyUpdates = [],
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

  // เรียงลำดับเวลาจากล่างขึ้นบน: รายงานที่ใหม่กว่าจะดันขึ้นมาอยู่บนสุดเสมอ และเวลาด้านล่างต้องไม่มากกว่าด้านบน
  const items = [...(dailyUpdates || [])].sort((a, b) => {
    const timeA = Number(a.timestamp) || 0;
    const timeB = Number(b.timestamp) || 0;
    if (timeB !== timeA) return timeB - timeA;
    return String(b.itemTime || '').localeCompare(String(a.itemTime || ''));
  });

  const dryCount = items.filter(i => i.statusType === 'dry').length;
  const recedingCount = items.filter(i => i.statusType === 'receding').length;
  const risingCount = items.filter(i => i.statusType === 'rising').length;

  const handleItemClick = (item) => {
    const target = item.rawPoint || item;
    if (onSelectPoint && target && target.lat && target.lng) {
      onSelectPoint(target);
      onClose();
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 smooth-backdrop"
    >
      <div className={`w-full max-w-[92vw] sm:max-w-md border rounded-3xl shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[82vh] overflow-hidden smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>

        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 shrink-0"></div>

        {/* Modal Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-blue-400/50 shadow-sm bg-blue-500/10 flex items-center justify-center">
              <img src="/logo.png" alt="PrakanGuard" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className={`text-sm sm:text-base font-bold leading-tight break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  อัปเดตสถานการณ์น้ำ
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30 shrink-0">
                  รายวัน
                </span>
              </div>
              <p className={`text-[10px] sm:text-xs text-slate-400 break-words whitespace-normal leading-tight mt-0.5`}>
                รีเซ็ตเที่ยงคืน (00:00 น.) อัตโนมัติ • อัปเดตตามจุดจริง
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

        {/* Legend Summary Bar (Counts 100% matched to items in the list) */}
        <div className={`px-4 py-2 border-b flex items-center justify-between text-xs ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-600'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              แห้งแล้ว ({dryCount})
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              น้ำลดแล้ว ({recedingCount})
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              เริ่มท่วมแล้ว ({risingCount})
            </span>
          </div>
          <span className="font-bold text-[11px] sm:text-xs text-blue-500">{items.length} จุด</span>
        </div>

        {/* List of Real Timestamped Flood Updates */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500 opacity-60" />
              <span>รีเซ็ตสถานะประจำวันแล้ว ยังไม่มีรายงานน้ำท่วมใหม่หลังเที่ยงคืน</span>
              <span className="text-[10px] text-slate-400">ทุกเส้นทางในจังหวัดสมุทรปราการสัญจรได้ตามปกติ</span>
            </div>
          ) : (
            items.map((item) => {
              const isDry = item.statusType === 'dry';
              const isReceding = item.statusType === 'receding';
              const isRising = item.statusType === 'rising';

              let icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
              let badgeBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';

              if (isDry) {
                icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
                badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
              } else if (isReceding) {
                icon = <TrendingDown className="w-3.5 h-3.5 text-amber-500" />;
                badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isDark 
                      ? 'bg-slate-850/60 hover:bg-slate-800 border-slate-800' 
                      : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {/* Location & Details */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-xl border shrink-0 mt-0.5 ${badgeBg}`}>
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs sm:text-sm font-bold block line-clamp-2 break-words leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.locationName}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {item.locationSub && (
                          <span className={`text-[10px] break-words whitespace-normal leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.locationSub}
                          </span>
                        )}
                        {item.depthCm > 0 && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                            item.depthCm > 50 
                              ? 'bg-rose-500/15 text-rose-500' 
                              : item.depthCm > 20 
                                ? 'bg-amber-500/15 text-amber-500' 
                                : 'bg-emerald-500/15 text-emerald-500'
                          }`}>
                            {item.depthCm} ซม.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Single Exact Event Time */}
                  <div className="shrink-0 flex flex-col items-end justify-center gap-1 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeBg}`}>
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
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
