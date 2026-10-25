import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  ExternalLink,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MapPin,
  VideoOff
} from 'lucide-react';
import { playClickSound, playCloseSound, playSelectSound } from '../services/soundEffects';
import { CCTV_CAMERAS } from '../data/cctvCameras';

const FEED_TIMEOUT_MS = 12000;
const FEED_REFRESH_MS = 30000;

const AGENCY_LABELS = {
  DOH: 'กรมทางหลวง',
  EXAT: 'การทางพิเศษฯ',
  RID: 'กรมชลประทาน'
};

const pad2 = (n) => String(n).padStart(2, '0');
const formatOsdTime = (d) =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

/* --------------------------------------------------------------------------
 * CameraFeed – renders a live snapshot when available; otherwise (missing URL,
 * load error, or connection timeout) shows a clean "No signal" screen.
 * ------------------------------------------------------------------------ */
function CameraFeed({ camera, clock, resetKey = 0, large = false }) {
  const baseUrl = camera.directCameraUrl || null;
  const [status, setStatus] = useState(baseUrl ? 'loading' : 'offline');
  const [tick, setTick] = useState(0);

  // Reset when camera changes or user forces a refresh
  useEffect(() => {
    setStatus(baseUrl ? 'loading' : 'offline');
    setTick(0);
  }, [camera.id, baseUrl, resetKey]);

  // Connection timeout → No signal
  useEffect(() => {
    if (status !== 'loading') return undefined;
    const t = setTimeout(() => {
      setStatus((s) => (s === 'loading' ? 'offline' : s));
    }, FEED_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [status]);

  // Periodic snapshot refresh while online
  useEffect(() => {
    if (status !== 'live') return undefined;
    const i = setInterval(() => setTick((v) => v + 1), FEED_REFRESH_MS);
    return () => clearInterval(i);
  }, [status]);

  const src = baseUrl
    ? tick > 0
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}_t=${tick}`
      : baseUrl
    : null;

  const osdText = large ? 'text-[10px] sm:text-[11px]' : 'text-[8.5px] sm:text-[9px]';
  const camCode = camera.id.replace(/^cctv-/, '').toUpperCase();

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-[#0b0d10] select-none">
      {src && status !== 'offline' && (
        <img
          src={src}
          alt={camera.name}
          loading="lazy"
          onLoad={() => setStatus('live')}
          onError={() => setStatus('offline')}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            status === 'live' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Connecting */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
          <div className="w-5 h-5 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
          {large && <span className="text-[11px] tracking-wide">กำลังเชื่อมต่อสัญญาณ</span>}
        </div>
      )}

      {/* No signal */}
      {status === 'offline' && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="cctv-noise" />
          <div className="cctv-scanlines" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-white">
            <VideoOff className={`${large ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-4 h-4'} text-white/45`} strokeWidth={1.5} />
            <span className={`font-mono font-semibold tracking-[0.32em] text-white/85 ${large ? 'text-sm sm:text-base' : 'text-[10px] sm:text-[11px]'}`}>
              NO SIGNAL
            </span>
            {large && (
              <span className="text-[10.5px] sm:text-xs text-white/45 px-6 text-center">
                ไม่สามารถรับภาพจากกล้องนี้ได้ในขณะนี้
              </span>
            )}
          </div>
        </div>
      )}

      {/* On-screen display */}
      <div className={`absolute top-1.5 left-2 sm:top-2 sm:left-2.5 font-mono text-white/70 ${osdText} drop-shadow`}>
        CAM {camCode}
      </div>
      <div className={`absolute top-1.5 right-2 sm:top-2 sm:right-2.5 flex items-center gap-1 font-mono font-semibold ${osdText}`}>
        {status === 'live' ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 cctv-blink" />
            <span className="text-white/90">LIVE</span>
          </>
        ) : (
          <span className="text-white/45">{status === 'loading' ? 'CONNECTING' : 'OFFLINE'}</span>
        )}
      </div>
      <div className={`absolute bottom-1.5 left-2 sm:bottom-2 sm:left-2.5 font-mono text-white/60 tabular-nums ${osdText} drop-shadow`}>
        {formatOsdTime(clock)}
      </div>
    </div>
  );
}

export default function CctvModal({
  isOpen,
  onClose,
  initialCameraId = null,
  theme = 'light'
}) {
  const isDark = theme === 'dark';
  const [selectedDistrict, setSelectedDistrict] = useState('ทั้งหมด');
  const [selectedAgency, setSelectedAgency] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCamera, setFocusedCamera] = useState(null);
  const [liveClock, setLiveClock] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return undefined;
    const interval = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (initialCameraId && isOpen) {
      const cam = CCTV_CAMERAS.find((c) => c.id === initialCameraId);
      if (cam) {
        setFocusedCamera(cam);
        setSelectedDistrict('ทั้งหมด');
        setSelectedAgency('ทั้งหมด');
      }
    } else if (!isOpen) {
      setFocusedCamera(null);
    }
  }, [initialCameraId, isOpen]);

  const filteredCameras = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CCTV_CAMERAS.filter((c) => {
      if (selectedAgency !== 'ทั้งหมด' && c.agency !== selectedAgency) return false;
      if (selectedDistrict !== 'ทั้งหมด' && !c.district.includes(selectedDistrict)) return false;
      if (q) {
        const haystack = [c.name, c.road, c.district, c.description || '', c.agency || '', c.shortName || '']
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [selectedAgency, selectedDistrict, searchQuery]);

  const agencyCounts = useMemo(() => ({
    ALL: CCTV_CAMERAS.length,
    DOH: CCTV_CAMERAS.filter((c) => c.agency === 'DOH').length,
    EXAT: CCTV_CAMERAS.filter((c) => c.agency === 'EXAT').length,
    RID: CCTV_CAMERAS.filter((c) => c.agency === 'RID').length
  }), []);

  const navList = filteredCameras.length > 0 ? filteredCameras : CCTV_CAMERAS;
  const currentIndex = focusedCamera ? navList.findIndex((c) => c.id === focusedCamera.id) : -1;

  const handlePrevCamera = useCallback(() => {
    if (!focusedCamera || navList.length === 0) return;
    playClickSound();
    const idx = navList.findIndex((c) => c.id === focusedCamera.id);
    setFocusedCamera(navList[idx <= 0 ? navList.length - 1 : idx - 1]);
  }, [focusedCamera, navList]);

  const handleNextCamera = useCallback(() => {
    if (!focusedCamera || navList.length === 0) return;
    playClickSound();
    const idx = navList.findIndex((c) => c.id === focusedCamera.id);
    setFocusedCamera(navList[idx === -1 || idx >= navList.length - 1 ? 0 : idx + 1]);
  }, [focusedCamera, navList]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (focusedCamera) {
        if (e.key === 'Escape') {
          playCloseSound();
          setFocusedCamera(null);
        } else if (e.key === 'ArrowLeft') {
          handlePrevCamera();
        } else if (e.key === 'ArrowRight') {
          handleNextCamera();
        }
      } else if (e.key === 'Escape') {
        playCloseSound();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedCamera, handlePrevCamera, handleNextCamera, onClose]);

  const handleManualRefresh = () => {
    playClickSound();
    setIsRefreshing(true);
    setResetKey((k) => k + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      setLiveClock(new Date());
    }, 500);
  };

  if (!isOpen) return null;

  const districts = ['ทั้งหมด', 'เมืองสมุทรปราการ', 'บางพลี', 'พระประแดง', 'บางเสาธง', 'บางบ่อ', 'พระสมุทรเจดีย์'];

  const ghostBtn = `w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
  }`;
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const agencyTone = (agency) => {
    if (agency === 'EXAT') return isDark ? 'text-amber-300 bg-amber-400/10' : 'text-amber-700 bg-amber-50';
    if (agency === 'RID') return isDark ? 'text-emerald-300 bg-emerald-400/10' : 'text-emerald-700 bg-emerald-50';
    return isDark ? 'text-sky-300 bg-sky-400/10' : 'text-blue-700 bg-blue-50';
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm smooth-backdrop"
      onClick={() => {
        playCloseSound();
        onClose();
      }}
    >
      <div
        className={`smooth-pop w-[92vw] max-w-[440px] sm:max-w-3xl lg:max-w-5xl max-h-[82vh] sm:max-h-[88vh] flex flex-col rounded-xl sm:rounded-2xl border shadow-2xl overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="กล้อง CCTV"
      >
        {/* ===================== HEADER ===================== */}
        <div className={`px-3 py-2 sm:px-4 sm:py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200/80'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            {focusedCamera && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setFocusedCamera(null);
                }}
                className={`${ghostBtn} -ml-1 shrink-0`}
                title="กลับไปหน้ารายการ"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-[13px] sm:text-[15px] font-semibold tracking-tight truncate leading-tight">
                {focusedCamera ? focusedCamera.shortName || focusedCamera.name : 'กล้อง CCTV'}
              </h2>
              <p className={`text-[10.5px] sm:text-xs truncate mt-0.5 ${mutedText}`}>
                {focusedCamera
                  ? `${AGENCY_LABELS[focusedCamera.agency] || focusedCamera.agency} · อ.${focusedCamera.district}`
                  : `${CCTV_CAMERAS.length} จุด · จังหวัดสมุทรปราการ`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <span className={`hidden md:inline font-mono text-[11px] tabular-nums mr-2 ${mutedText}`}>
              {liveClock.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button type="button" onClick={handleManualRefresh} className={ghostBtn} title="รีเฟรชสัญญาณภาพ">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                playCloseSound();
                onClose();
              }}
              className={ghostBtn}
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {focusedCamera ? (
          /* ===================== DETAIL VIEW ===================== */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sm:p-5 lg:grid lg:grid-cols-[1.6fr_1fr] lg:gap-5 space-y-3 lg:space-y-0">
                <div className="rounded-xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
                  <CameraFeed camera={focusedCamera} clock={liveClock} resetKey={resetKey} large />
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${agencyTone(focusedCamera.agency)}`}>
                        {focusedCamera.agency}
                      </span>
                      <span className={`text-[10.5px] ${mutedText}`}>
                        {focusedCamera.type === 'waterway' ? 'สถานีชลประทาน' : 'จุดตรวจการจราจร'}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold leading-snug">{focusedCamera.name}</h3>
                    {focusedCamera.description && (
                      <p className={`text-xs sm:text-[13px] mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {focusedCamera.description}
                      </p>
                    )}
                  </div>

                  <dl className={`rounded-xl border divide-y text-xs ${
                    isDark ? 'border-slate-800 divide-slate-800' : 'border-slate-200 divide-slate-100'
                  }`}>
                    {[
                      ['ถนน / ตำแหน่ง', focusedCamera.road],
                      ['มุมกล้อง', focusedCamera.direction],
                      ['พิกัด', `${focusedCamera.lat.toFixed(4)}, ${focusedCamera.lng.toFixed(4)}`, true],
                      ['แหล่งข้อมูล', focusedCamera.sourcePlatform]
                    ].filter(([, v]) => Boolean(v)).map(([label, value, mono]) => (
                      <div key={label} className="flex items-start justify-between gap-3 px-3 py-2.5">
                        <dt className={`shrink-0 ${mutedText}`}>{label}</dt>
                        <dd className={`text-right font-medium min-w-0 break-words ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="flex items-center gap-2">
                    <a
                      href={focusedCamera.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>ดูภาพสดจาก {focusedCamera.agency}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${focusedCamera.lat},${focusedCamera.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-9 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>แผนที่</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className={`px-3 py-2 sm:px-5 sm:py-2.5 border-t flex items-center justify-between gap-2 shrink-0 ${
              isDark ? 'border-slate-800' : 'border-slate-200/80'
            }`}>
              <button
                type="button"
                onClick={handlePrevCamera}
                className={`h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ก่อนหน้า</span>
              </button>
              <span className={`font-mono text-[11px] tabular-nums ${mutedText}`}>
                {currentIndex + 1} / {navList.length}
              </span>
              <button
                type="button"
                onClick={handleNextCamera}
                className={`h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>ถัดไป</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          /* ===================== GRID VIEW ===================== */
          <>
            <div className={`px-3 py-2.5 sm:px-5 sm:py-3 border-b space-y-2 shrink-0 ${
              isDark ? 'border-slate-800' : 'border-slate-200/80'
            }`}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาแยก ถนน หรือสถานี"
                    className={`w-full h-9 pl-8 pr-8 text-xs rounded-lg border transition-colors focus:outline-none focus:ring-2 ${
                      isDark
                        ? 'bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-blue-500/15'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label="ล้างคำค้นหา"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    playSelectSound();
                    setSelectedDistrict(e.target.value);
                  }}
                  className={`h-9 pl-2.5 pr-7 text-xs rounded-lg border cursor-pointer focus:outline-none max-w-[42%] sm:max-w-none ${
                    isDark ? 'bg-slate-950/50 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                  aria-label="เลือกอำเภอ"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>{d === 'ทั้งหมด' ? 'ทุกอำเภอ' : d}</option>
                  ))}
                </select>
              </div>

              <div className={`inline-flex p-0.5 rounded-lg max-w-full overflow-x-auto no-scrollbar ${isDark ? 'bg-slate-800/70' : 'bg-slate-100'}`}>
                {[
                  { id: 'ทั้งหมด', label: 'ทั้งหมด', count: agencyCounts.ALL },
                  { id: 'DOH', label: 'กรมทางหลวง', count: agencyCounts.DOH },
                  { id: 'EXAT', label: 'การทางพิเศษ', count: agencyCounts.EXAT },
                  { id: 'RID', label: 'ชลประทาน', count: agencyCounts.RID }
                ].map((tab) => {
                  const active = selectedAgency === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSelectedAgency(tab.id);
                      }}
                      className={`h-7 px-2.5 rounded-md text-[11px] font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                        active
                          ? isDark ? 'bg-slate-950 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`tabular-nums text-[10px] ${active ? (isDark ? 'text-slate-400' : 'text-slate-500') : 'opacity-60'}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-5">
              {filteredCameras.length === 0 ? (
                <div className="text-center py-14">
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>ไม่พบกล้องที่ตรงกับการค้นหา</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAgency('ทั้งหมด');
                      setSelectedDistrict('ทั้งหมด');
                      setSearchQuery('');
                    }}
                    className="mt-2 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredCameras.map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setFocusedCamera(cam);
                      }}
                      className={`group text-left rounded-xl overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 ${
                        isDark
                          ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-black/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/70'
                      }`}
                    >
                      <CameraFeed camera={cam} clock={liveClock} resetKey={resetKey} />
                      <div className="px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[12.5px] sm:text-[13px] font-semibold truncate">{cam.shortName || cam.name}</h3>
                          <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9.5px] font-semibold ${agencyTone(cam.agency)}`}>
                            {cam.agency}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${mutedText}`}>
                          {cam.road} · อ.{cam.district}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`px-3 py-2 sm:px-5 border-t shrink-0 text-[10.5px] sm:text-[11px] flex items-center justify-between gap-2 ${
              isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200/80 text-slate-500'
            }`}>
              <span>แสดง {filteredCameras.length} จาก {CCTV_CAMERAS.length} จุด</span>
              <span className="truncate">ข้อมูล: กรมทางหลวง · การทางพิเศษฯ · กรมชลประทาน</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
