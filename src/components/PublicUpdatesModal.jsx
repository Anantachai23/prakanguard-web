import React from 'react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  PhoneCall,
  MapPin,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { CivicBroadcast, CivicShield } from './CivicIcons';
import { isTimestampTodayBangkok, getBangkokDateKey } from '../services/dailyUpdatesService';
import { playCloseSound, playEmergencySound, playRefreshSound } from '../services/soundEffects';

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

  const todayDateObj = new Date();
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const todayThaiFull = `${todayDateObj.getDate()} ${thaiMonths[todayDateObj.getMonth()]} ${todayDateObj.getFullYear() + 543}`;

  const formatDisplayTime = (timeStr, timestamp) => {
    if (!timeStr && !timestamp) return 'เมื่อสักครู่';
    if (typeof timeStr === 'string' && timeStr.includes('น.') && !timeStr.includes('T')) {
      return timeStr;
    }
    try {
      const d = timeStr ? new Date(timeStr) : new Date(Number(timestamp) || Date.now());
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('th-TH', { 
          hour: '2-digit', 
          minute: '2-digit', 
          timeZone: 'Asia/Bangkok' 
        }) + ' น.';
      }
    } catch (_) {}
    return 'เมื่อสักครู่';
  };

  const isRealUpdateItem = (item) => {
    if (!item) return false;
    if (item.timestamp && !isTimestampTodayBangkok(item.timestamp)) return false;
    if (item.dateKey && item.dateKey !== getBangkokDateKey()) return false;

    const name = String(item.locationName || '').toLowerCase();
    const id = String(item.id || '').toLowerCase();
    if (name.includes('security-probe') || name.includes('auto-deleted') || name.includes('probe') || name.includes('ทดสอบ')) return false;
    if (id.includes('probe') || id.includes('test-inspect') || id.includes('test-check')) return false;
    return true;
  };

  const items = [...(dailyUpdates || [])]
    .filter(isRealUpdateItem)
    .sort((a, b) => {
      const timeA = Number(a.timestamp) || 0;
      const timeB = Number(b.timestamp) || 0;
      if (timeB !== timeA) return timeB - timeA;
      return String(b.itemTime || '').localeCompare(String(a.itemTime || ''));
    });

  // Calculate live district telemetry metrics
  const activeRiverfrontCount = points.filter(p => p.isActive && !p.isResolved).length;
  const dryRoadsCount = points.filter(p => !p.isActive || p.isResolved).length;

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
      onClick={(e) => { 
        if (e.target === e.currentTarget) {
          playCloseSound();
          onClose(); 
        }
      }}
      className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in-50 duration-150"
    >
      <div className={`w-full max-w-[calc(100vw-24px)] xs:max-w-[430px] sm:max-w-xl my-auto flex flex-col rounded-2xl border shadow-2xl overflow-hidden max-h-[88vh] shrink-0 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Institutional Accent Line */}
        <div className="h-1 w-full bg-blue-600 shrink-0" />

        {/* Header */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-850 border-slate-700 text-sky-400' : 'bg-white border-slate-200 text-blue-700 shadow-2xs'
            }`}>
              <CivicBroadcast className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className={`text-sm sm:text-base font-bold leading-tight tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  รายงานสถานการณ์น้ำประจำวัน
                </h3>
                <span className={`hidden xs:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                  isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800/80' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  สมุทรปราการ
                </span>
              </div>
              <p className={`text-[11px] leading-tight mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {todayThaiFull} • ซิงก์โทรมาตรล่าสุด {lastUpdatedTime || 'แบบเรียลไทม์'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onRefreshData && (
              <button 
                type="button"
                onClick={() => {
                  playRefreshSound();
                  onRefreshData();
                }}
                disabled={isRefreshing}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title="ซิงก์ข้อมูลโทรมาตรล่าสุด"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}

            <button 
              type="button"
              onClick={() => {
                playCloseSound();
                onClose();
              }} 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
              }`}
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Operational Situation Summary Bar */}
        <div className={`px-4 py-2.5 sm:px-5 border-b flex items-center justify-between text-xs shrink-0 ${
          isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-100/60 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>เส้นทางหลักสัญจรได้ปกติ</span>
          </div>
          <div className="flex items-center gap-2 text-[10.5px]">
            <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              แห้งปกติ {dryRoadsCount} จุด
            </span>
            {activeRiverfrontCount > 0 && (
              <span className="font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                เฝ้าระวังริมน้ำ {activeRiverfrontCount} จุด
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar-thin">
          
          {/* Official Admin Broadcast Announcement (if present) */}
          {latestAnnouncement && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isDark 
                ? 'bg-amber-950/25 border-amber-800/80 text-amber-200' 
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    ประกาศด่วนจากศูนย์บัญชาการ
                  </span>
                  {latestAnnouncement.created_at && (
                    <span className="text-[10.5px] opacity-75 font-mono">
                      {new Date(latestAnnouncement.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-line">
                  {latestAnnouncement.message}
                </p>
              </div>
            </div>
          )}

          {/* Today's Situational Dispatch (เมื่อทุกเส้นทางแห้งปกติ) */}
          {items.length === 0 ? (
            <div className="space-y-3">
              {/* Comprehensive All-Clear Reassurance Card */}
              <div className={`p-4 rounded-xl border text-left ${
                isDark 
                  ? 'bg-slate-850/80 border-slate-750' 
                  : 'bg-slate-50/90 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs sm:text-[13px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      สถานการณ์ภาพรวม 6 อำเภอ จังหวัดสมุทรปราการ
                    </h4>
                    <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                      ทุกเส้นทางสัญจรได้คล่องตัว ผิวจราจรแห้งสนิท
                    </span>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-3`}>
                  จากการตรวจวัดด้วยระบบโทรมาตรเรดาร์สภาพอากาศและสถานีวัดระดับน้ำ ปัจจุบันไม่มีจุดน้ำท่วมขังบนถนนสายหลักในพื้นที่สมุทรปราการ โดยมีเพียงการเฝ้าระวังน้ำขึ้น-น้ำลงตามรอบธรรมชาติบริเวณแนวเขื่อนริมแม่น้ำเจ้าพระยา (ปากน้ำ และ ป้อมพระจุลจอมเกล้า) ซึ่งระดับน้ำกำลังลดลงอย่างต่อเนื่อง
                </p>

                {/* 6 Districts Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[11px]">
                  {[
                    { d: 'เมืองสมุทรปราการ', s: 'สุขุมวิท • ศรีนครินทร์ ปกติ' },
                    { d: 'บางพลี', s: 'บางนา-ตราด • กิ่งแก้ว แห้ง' },
                    { d: 'บางบ่อ', s: 'ปานวิถี • สุขุมวิทสายเก่า แห้ง' },
                    { d: 'บางเสาธง', s: 'เคหะบางเสาธง สัญจรปกติ' },
                    { d: 'พระประแดง', s: 'ปู่เจ้าฯ • สุขสวัสดิ์ ปกติ' },
                    { d: 'พระสมุทรเจดีย์', s: 'สถานีป้อมพระจุลฯ น้ำลดลง' },
                  ].map((dist, idx) => (
                    <div 
                      key={idx}
                      className={`p-2 rounded-lg border ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <strong className={`block text-[11px] truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {dist.d}
                      </strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                        {dist.s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Chronological Updates Feed */
            <div className="space-y-2.5">
              <h4 className={`text-xs font-bold flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>บันทึกเหตุการณ์วันนี้ ({items.length} รายการ)</span>
                <span className="text-[10.5px] font-normal text-slate-500">แตะเพื่อซูมดูพิกัดบนแผนที่</span>
              </h4>

              <div className="space-y-2">
                {items.map((item) => {
                  const isDry = item.statusType === 'dry';
                  const isReceding = item.statusType === 'receding';

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>{item.statusLabel || 'เฝ้าระวังน้ำท่วม'}</span>
                    </span>
                  );

                  if (isDry) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{item.statusLabel || 'สัญจรปกติ (น้ำแห้งแล้ว)'}</span>
                      </span>
                    );
                  } else if (isReceding) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                        <TrendingDown className="w-3 h-3 text-amber-600" />
                        <span>{item.statusLabel || 'ระดับน้ำลดลง'}</span>
                      </span>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isDark 
                          ? 'bg-slate-850/80 border-slate-750 hover:border-slate-700 hover:bg-slate-800' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {item.locationName}
                            </span>
                            {item.district && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {item.district}
                              </span>
                            )}
                          </div>
                          {item.locationSub && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {item.locationSub}
                            </p>
                          )}
                        </div>
                        {statusBadge}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{formatDisplayTime(item.itemTime, item.timestamp)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold text-[10.5px]">
                          <MapPin className="w-3 h-3" />
                          <span>ดูจุดบนแผนที่ &rarr;</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Institutional Footer */}
        <div className={`px-4 py-2.5 sm:px-5 sm:py-3 border-t flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/70 text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-600'
        }`}>
          <button
            type="button"
            onClick={() => {
              playEmergencySound();
              window.location.href = 'tel:1784';
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer transition-colors active:scale-95"
            title="โทรสายด่วนสาธารณภัย ปภ. 1784 ฟรีตลอด 24 ชม."
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>สายด่วน 1784 (24 ชม.)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs border transition-colors cursor-pointer shrink-0 active:scale-95 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs'
            }`}
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
