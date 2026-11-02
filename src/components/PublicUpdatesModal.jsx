import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  PhoneCall,
  MapPin,
  Radio,
  ChevronDown,
  ChevronUp,
  Navigation
} from 'lucide-react';
import { CivicBroadcast } from './CivicIcons';
import { isTimestampTodayBangkok, getBangkokDateKey } from '../services/dailyUpdatesService';
import { playCloseSound, playEmergencySound, playRefreshSound, playClickSound } from '../services/soundEffects';

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
  const [expandedItemId, setExpandedItemId] = useState(null);

  const todayDateObj = new Date();
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const todayThaiShort = `${todayDateObj.getDate()} ${thaiMonths[todayDateObj.getMonth()]} ${todayDateObj.getFullYear() + 543}`;

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

  const getTargetPoint = (item) => {
    const all = [...(citizenReports || []), ...(points || [])];
    const found = all.find(p => 
      String(p.id) === String(item.locationKey || item.id) ||
      (p.name && item.locationName && p.name.trim().toLowerCase() === item.locationName.trim().toLowerCase()) ||
      (p.lat && item.lat && Math.abs(p.lat - item.lat) < 0.003 && Math.abs(p.lng - item.lng) < 0.003)
    );

    return {
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
      lat: found?.lat || item.lat || item.rawPoint?.lat,
      lng: found?.lng || item.lng || item.rawPoint?.lng
    };
  };

  const toggleItemExpansion = (itemId) => {
    try { playClickSound(); } catch (_) {}
    setExpandedItemId(prev => prev === itemId ? null : itemId);
  };

  return (
    <div 
      onClick={(e) => { 
        if (e.target === e.currentTarget) {
          playCloseSound();
          onClose(); 
        }
      }}
      className="fixed inset-0 z-[2000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in-50 duration-150"
    >
      <div className={`w-full max-w-[calc(100vw-24px)] xs:max-w-[420px] sm:max-w-[480px] my-auto flex flex-col rounded-3xl shadow-2xl border overflow-hidden max-h-[84vh] shrink-0 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header — Rounded & Concise */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 shrink-0 border-b ${
          isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <CivicBroadcast className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-[15px] font-bold leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                อัปเดตสถานการณ์น้ำประจำวัน
              </h3>
              <p className={`text-[11px] leading-tight mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {todayThaiShort} • สรุปข้อมูลสด {lastUpdatedTime || 'เรียลไทม์'}
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
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="ซิงก์ข้อมูลล่าสุด"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            )}

            <button 
              type="button"
              onClick={() => {
                playCloseSound();
                onClose();
              }} 
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
              title="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body — Streamlined Update Feed (ไม่ซูมแผนที่ แตะเพื่อดูอัปเดต) */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 space-y-3 custom-scrollbar-thin">
          
          {/* Quick Overall Status Capsule */}
          <div className={`p-3 rounded-2xl border transition-colors ${
            isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-bold">
                ทุกเส้นทางหลักสัญจรได้ปกติ ผิวทางแห้ง
              </span>
            </div>
            <p className={`text-[11.5px] leading-relaxed pl-4.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              ไม่มีน้ำท่วมขังบนถนนทางบก มีเพียงเฝ้าระวังน้ำหนุน 2 จุดริมเจ้าพระยา (ปากน้ำ และ ป้อมพระจุลฯ) ซึ่งน้ำลดลงต่อเนื่อง
            </p>
          </div>

          {/* Broadcast Alert (if any) */}
          {latestAnnouncement && (
            <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
              isDark ? 'bg-amber-950/20 border-amber-800/50 text-amber-200' : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <Radio className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 min-w-0 text-xs">
                <strong className="block text-amber-700 dark:text-amber-300">ประกาศเจ้าหน้าที่:</strong>
                <p className="mt-0.5 leading-relaxed">{latestAnnouncement.message}</p>
              </div>
            </div>
          )}

          {/* 6 Districts Quick Status Pills */}
          <div className="space-y-1.5">
            <span className={`text-[11px] font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              สถานะรายอำเภอ (สมุทรปราการ)
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { name: 'เมืองสมุทรปราการ', desc: 'ปกติ (เฝ้าระวังปากน้ำ)' },
                { name: 'บางพลี', desc: 'ผิวทางแห้ง สัญจรปกติ' },
                { name: 'บางบ่อ', desc: 'ผิวทางแห้ง สัญจรปกติ' },
                { name: 'บางเสาธง', desc: 'ผิวทางแห้ง สัญจรปกติ' },
                { name: 'พระประแดง', desc: 'ผิวทางแห้ง สัญจรปกติ' },
                { name: 'พระสมุทรเจดีย์', desc: 'ปกติ (ป้อมพระจุลฯ น้ำลด)' },
              ].map((d, i) => (
                <div 
                  key={i} 
                  className={`p-2 rounded-xl flex items-center justify-between gap-1 border ${
                    isDark ? 'bg-slate-800/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-700'
                  }`}
                >
                  <span className="font-semibold truncate text-[11.5px]">{d.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Chronological Incident Feed: แสดงข้อมูลอัปเดต ไม่แตะแล้วซูม */}
          <div className="space-y-1.5 pt-1">
            <span className={`text-[11px] font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              บันทึกการอัปเดตสถานการณ์น้ำล่าสุด ({items.length})
            </span>

            {items.length === 0 ? (
              <div className={`p-4 rounded-2xl border text-center text-xs ${
                isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <Check className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                <p className="font-bold text-slate-800 dark:text-slate-200">ยังไม่มีรายงานน้ำท่วมขังรุนแรงวันนี้</p>
                <p className="text-[11px] mt-0.5 opacity-80">ทุกจุดใน 6 อำเภอสัญจรได้ตามปกติ ระบบติดตามข้อมูลตลอด 24 ชม.</p>
              </div>
            ) : (
              <div className={`rounded-2xl border divide-y overflow-hidden ${
                isDark ? 'border-slate-800 divide-slate-800 bg-slate-900/60' : 'border-slate-200 divide-slate-100 bg-slate-50/40'
              }`}>
                {items.map(item => {
                  const isExpanded = expandedItemId === item.id;
                  const isDry = item.statusType === 'dry';
                  const isReceding = item.statusType === 'receding';
                  const depth = Number(item.depthCm) || 0;
                  const target = getTargetPoint(item);

                  return (
                    <div
                      key={item.id}
                      className="transition-colors"
                    >
                      {/* Item Main Row — Tapping toggles update details */}
                      <div
                        onClick={() => toggleItemExpansion(item.id)}
                        className={`p-3 flex items-center justify-between gap-2.5 cursor-pointer ${
                          isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-100/70'
                        } ${isExpanded ? (isDark ? 'bg-slate-800/40' : 'bg-blue-50/50') : ''}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              isDry ? 'bg-emerald-500' : isReceding ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {item.locationName}
                            </span>
                            {depth > 0 && (
                              <span className="text-[10.5px] font-mono font-bold text-blue-600 dark:text-cyan-400 shrink-0">
                                {depth} ซม.
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatDisplayTime(item.itemTime, item.timestamp)}</span>
                            </span>
                            {item.district && (
                              <span>• อ.{item.district.replace(/^อ\./, '')}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDry
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : isReceding
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}>
                            {item.statusLabel || (isDry ? 'แห้งแล้ว' : 'น้ำลด')}
                          </span>
                          <span className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Update Details Card (แสดงอัปเดตให้อ่านในนี้ ไม่ซูมหนี) */}
                      {isExpanded && (
                        <div className={`px-3.5 py-3 border-t text-xs space-y-2 ${
                          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-white border-slate-150 text-slate-700'
                        }`}>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className={`p-2 rounded-xl border ${
                              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className="text-[10px] text-slate-400 block">ระดับน้ำตรวจวัด</span>
                              <strong className="text-xs text-blue-600 dark:text-cyan-400 font-bold">
                                {depth > 0 ? `${depth} เซนติเมตร` : 'ระบายแห้งสนิท (0 ซม.)'}
                              </strong>
                            </div>

                            <div className={`p-2 rounded-xl border ${
                              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className="text-[10px] text-slate-400 block">การสัญจร</span>
                              <strong className="text-xs font-bold text-slate-900 dark:text-white">
                                {depth <= 20 ? 'รถทุกชนิดผ่านได้' : depth <= 50 ? 'รถเล็กควรหลีกเลี่ยง' : 'ห้ามรถเล็กผ่าน'}
                              </strong>
                            </div>
                          </div>

                          {item.details && (
                            <p className="text-[11px] leading-relaxed opacity-90">
                              {item.details}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[10.5px]">
                            <span className="text-slate-400">
                              แหล่งข้อมูล: {item.source || 'แขวงทางหลวงสมุทรปราการ / รายงานพื้นที่'}
                            </span>
                            {onSelectPoint && target && target.lat && target.lng && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectPoint(target);
                                  onClose();
                                }}
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
                              >
                                <Navigation className="w-3 h-3" />
                                <span>ดูบนแผนที่</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer — Rounded Pill Actions */}
        <div className={`px-4 py-2.5 sm:px-5 flex items-center justify-between gap-2 shrink-0 border-t ${
          isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button
            type="button"
            onClick={() => {
              playEmergencySound();
              window.location.href = 'tel:1784';
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer active:scale-95"
            title="โทรสายด่วนสาธารณภัย ปภ. 1784 ฟรี 24 ชม."
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
            <span>สายด่วน 1784</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playCloseSound();
              onClose();
            }}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-colors cursor-pointer active:scale-95 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                : 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
            }`}
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
}
