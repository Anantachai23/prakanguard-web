import React from 'react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Clock
} from 'lucide-react';
import { CivicBroadcast, CivicShield } from './CivicIcons';

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
  latestAnnouncement = null,
  theme = 'light' 
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

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
    const all = [...(citizenReports || []), ...(points || [])];
    const found = all.find(p => 
      String(p.id) === String(item.locationKey || item.id) ||
      (p.name && item.locationName && p.name.trim().toLowerCase() === item.locationName.trim().toLowerCase()) ||
      (p.lat && item.lat && Math.abs(p.lat - item.lat) < 0.003 && Math.abs(p.lng - item.lng) < 0.003)
    );

    const photo = item.photoUrl || item.rawPoint?.photoUrl || found?.photoUrl || found?.photo_url || found?.photo || null;

    const target = {
      ...(found || item.rawPoint || {}),
      ...item,
      id: found?.id || item.rawPoint?.id || item.id || item.locationKey,
      name: found?.name || item.locationName || 'จุดน้ำท่วม',
      district: found?.district || item.district || 'สมุทรปราการ',
      subdistrict: found?.subdistrict || item.subdistrict || '',
      depthCm: Number(found?.depthCm !== undefined ? found.depthCm : item.depthCm) || 0,
      level: Number(item.depthCm) > 50 ? 3 : (Number(item.depthCm) > 20 ? 2 : 1),
      depthRange: Number(item.depthCm) > 50 ? '> 50 ซม.' : (Number(item.depthCm) > 20 ? '21 - 50 ซม.' : (Number(item.depthCm) > 0 ? '5 - 20 ซม.' : '0 ซม.')),
      statusLabel: item.statusLabel,
      trafficStatus: item.trafficStatus || item.statusLabel,
      source: item.source || 'รายงานสถานการณ์น้ำ',
      photoUrl: photo,
      lat: found?.lat || item.lat || item.rawPoint?.lat,
      lng: found?.lng || item.lng || item.rawPoint?.lng
    };

    if (onSelectPoint && target && target.lat && target.lng) {
      onSelectPoint(target);
      onClose();
    }
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pointer-events-auto overflow-y-auto"
    >
      <div className={`w-[92vw] max-w-[440px] sm:max-w-lg my-auto m-auto border rounded-xl shadow-2xl flex flex-col max-h-[84vh] sm:max-h-[86vh] overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Top Institutional Bar */}
        <div className="h-1 w-full bg-blue-700 shrink-0" />

        {/* Header */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-white text-blue-700 border-slate-200 shadow-2xs'
            }`}>
              <CivicBroadcast className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className={`text-sm sm:text-base font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  บันทึกการเปลี่ยนแปลงสถานการณ์น้ำ
                </h3>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border shrink-0 ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  รายวัน
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ติดตามความเคลื่อนไหวระดับน้ำประจำวัน (รีเซ็ต 00:00 น.)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onRefreshData && (
              <button 
                type="button"
                onClick={onRefreshData}
                disabled={isRefreshing}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className={`px-4 py-2 sm:px-5 border-b flex items-center justify-between text-xs shrink-0 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50/50 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>แห้งปกติ ({dryCount})</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>น้ำลดลง ({recedingCount})</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>เฝ้าระวัง ({risingCount})</span>
            </span>
          </div>
          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
            รวม {items.length} รายการ
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4 space-y-3">
          {latestAnnouncement && (
            <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
              isDark ? 'bg-amber-950/30 border-amber-800/80 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <CivicBroadcast className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    ประกาศจากศูนย์ควบคุมระบบ
                  </span>
                  {latestAnnouncement.created_at && (
                    <span className="text-[10px] opacity-75 font-mono">
                      {new Date(latestAnnouncement.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 whitespace-pre-line leading-relaxed">
                  {latestAnnouncement.message}
                </p>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <CivicShield className="w-7 h-7 text-emerald-500 opacity-75" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ยังไม่มีรายงานการเปลี่ยนแปลงระดับน้ำหลังเวลา 00:00 น.
              </span>
              <span className="text-[11px] text-slate-400">
                เส้นทางหลักในจังหวัดสมุทรปราการสามารถสัญจรได้ตามปกติ
              </span>
            </div>
          ) : (
            <div className={`rounded-lg border divide-y overflow-hidden ${
              isDark ? 'border-slate-800 divide-slate-800 bg-slate-950/40' : 'border-slate-200 divide-slate-200 bg-white'
            }`}>
              {items.map((item) => {
                const isDry = item.statusType === 'dry';
                const isReceding = item.statusType === 'receding';

                let icon = <AlertTriangle className="w-4 h-4 text-rose-500" />;
                let badgeBg = isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200';

                if (isDry) {
                  icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                  badgeBg = isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                } else if (isReceding) {
                  icon = <TrendingDown className="w-4 h-4 text-amber-500" />;
                  badgeBg = isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isDark ? 'hover:bg-slate-800/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${badgeBg}`}>
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-bold block leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.locationName}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {item.locationSub && (
                            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {item.locationSub}
                            </span>
                          )}
                          {item.depthCm > 0 && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                              isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {item.depthCm} ซม.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end justify-center gap-1 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeBg}`}>
                        {item.statusLabel}
                      </span>
                      <span className={`text-[10.5px] font-mono flex items-center gap-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{item.itemTime}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-2.5 sm:px-5 sm:py-3 border-t flex items-center justify-between text-xs shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-500'
        }`}>
          <span className="flex items-center gap-1.5 text-[11px]">
            <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>แตะที่รายการเพื่อดูตำแหน่งบนแผนที่</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs border transition-colors cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
