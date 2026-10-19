import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Video, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  MapPin, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Radio,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { playClickSound, playCloseSound, playSelectSound } from '../services/soundEffects';
import { CCTV_CAMERAS } from '../data/cctvCameras';

export default function CctvModal({
  isOpen,
  onClose,
  initialCameraId = null,
  onFlyToMap,
  theme = 'light'
}) {
  const isDark = theme === 'dark';
  const [selectedDistrict, setSelectedDistrict] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCamera, setFocusedCamera] = useState(null);
  const [liveClock, setLiveClock] = useState(() => new Date());
  const [refreshCountdown, setRefreshCountdown] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTimestamp, setRefreshTimestamp] = useState(() => Date.now());
  const [failedImages, setFailedImages] = useState({});

  // Live 1-second ticking clock for real 24/7 CCTV surveillance feel
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setLiveClock(new Date());
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          setRefreshTimestamp(Date.now());
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Set initial camera when opened from map pin or external click
  useEffect(() => {
    if (initialCameraId && isOpen) {
      const cam = CCTV_CAMERAS.find(c => c.id === initialCameraId);
      if (cam) {
        setFocusedCamera(cam);
        setSelectedDistrict('ทั้งหมด');
      }
    }
  }, [initialCameraId, isOpen]);

  // Keyboard navigation for Theater Mode (Left/Right arrow to switch cameras, Escape to close)
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, focusedCamera]);

  // Filtered cameras based on District and Search query
  const filteredCameras = useMemo(() => {
    return CCTV_CAMERAS.filter(c => {
      if (selectedDistrict !== 'ทั้งหมด') {
        if (!c.district.includes(selectedDistrict)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchRoad = c.road.toLowerCase().includes(q);
        const matchDist = c.district.toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchAgency = (c.agency || '').toLowerCase().includes(q);
        if (!matchName && !matchRoad && !matchDist && !matchDesc && !matchAgency) return false;
      }
      return true;
    });
  }, [selectedDistrict, searchQuery]);

  // Previous & Next navigation in Theater Mode
  const currentCameraIndex = useMemo(() => {
    if (!focusedCamera) return -1;
    return CCTV_CAMERAS.findIndex(c => c.id === focusedCamera.id);
  }, [focusedCamera]);

  const handlePrevCamera = useCallback(() => {
    if (currentCameraIndex === -1) return;
    playClickSound();
    const prevIndex = (currentCameraIndex - 1 + CCTV_CAMERAS.length) % CCTV_CAMERAS.length;
    setFocusedCamera(CCTV_CAMERAS[prevIndex]);
  }, [currentCameraIndex]);

  const handleNextCamera = useCallback(() => {
    if (currentCameraIndex === -1) return;
    playClickSound();
    const nextIndex = (currentCameraIndex + 1) % CCTV_CAMERAS.length;
    setFocusedCamera(CCTV_CAMERAS[nextIndex]);
  }, [currentCameraIndex]);

  const handleManualRefresh = () => {
    playClickSound();
    setIsRefreshing(true);
    setRefreshCountdown(15);
    setRefreshTimestamp(Date.now());
    setTimeout(() => {
      setIsRefreshing(false);
      setLiveClock(new Date());
    }, 500);
  };

  const handleImageError = (camId) => {
    setFailedImages(prev => ({ ...prev, [camId]: true }));
  };

  if (!isOpen) return null;

  const districts = ['ทั้งหมด', 'เมืองสมุทรปราการ', 'บางพลี', 'พระประแดง', 'บางเสาธง', 'บางบ่อ', 'พระสมุทรเจดีย์'];
  const formattedTime = liveClock.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = liveClock.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        playCloseSound();
        onClose();
      }}
    >
      <div 
        className={`w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 animate-in zoom-in-95 duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================================= */}
        {/* MODAL HEADER: Clean, concise & informative               */}
        {/* ========================================================= */}
        <div className={`p-3 sm:p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-slate-50/90'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Video className="w-5 h-5 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold truncate leading-tight">
                  กล้องวงจรปิด CCTV สด 24 ชม. ทั่วสมุทรปราการ
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  LIVE
                </span>
              </div>
              <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                กรมทางหลวง (DOH) • การทางพิเศษ (EXAT) • กรมชลประทาน (ThaiWater)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Timestamp & Sync Button */}
            <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${
              isDark ? 'bg-slate-800 border-slate-700 text-cyan-300' : 'bg-white border-slate-200 text-blue-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
              <span>{formattedTime} น.</span>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-md border flex items-center gap-1 text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="รีเฟรชสัญญาณภาพสด"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playCloseSound();
                onClose();
              }}
              className={`p-1.5 rounded-md border transition-all cursor-pointer active:scale-95 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
              }`}
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SIMPLE SEARCH & DISTRICT FILTER BAR                       */}
        {/* ========================================================= */}
        <div className={`p-2.5 sm:p-3 border-b space-y-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
        }`}>
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหากล้อง (เช่น บางนา, สำโรง, ศรีเทพา, สะพานภูมิพล, กาญจนา, คลองด่าน)..."
              className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border transition-all outline-hidden ${
                isDark 
                  ? 'bg-slate-850 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* District Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {districts.map(dist => {
              const count = dist === 'ทั้งหมด' 
                ? CCTV_CAMERAS.length 
                : CCTV_CAMERAS.filter(c => c.district.includes(dist)).length;

              return (
                <button
                  key={dist}
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setSelectedDistrict(dist);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    selectedDistrict === dist
                      ? (isDark ? 'bg-blue-600/25 border-blue-500 text-blue-300 font-bold' : 'bg-blue-50 border-blue-600 text-blue-700 font-bold')
                      : (isDark ? 'bg-slate-850 border-slate-700/80 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')
                  }`}
                >
                  <span>{dist === 'ทั้งหมด' ? 'ทั้งหมด' : `อ.${dist}`}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedDistrict === dist
                      ? 'bg-blue-600 text-white'
                      : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700')
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CCTV CAMERAS GRID: Clean, clickable cards showing images  */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>แสดง {filteredCameras.length} จุดกล้อง (กดที่กล้องเพื่อดูภาพขยายเต็มจอ)</span>
            <span className="font-mono text-[11px]">อัตโนมัติ 24 ชม.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCameras.map((cam) => {
              const hasFailed = failedImages[cam.id];

              return (
                <div
                  key={cam.id}
                  onClick={() => {
                    playClickSound();
                    setFocusedCamera(cam);
                  }}
                  className={`group rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5 ${
                    isDark 
                      ? 'bg-slate-850 border-slate-800 hover:border-blue-500' 
                      : 'bg-white border-slate-200 hover:border-blue-400'
                  }`}
                  role="button"
                  tabIndex={0}
                  title="คลิกเพื่อดูภาพขยายเต็มจอ"
                >
                  {/* Camera Live Snapshot Screen */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden select-none">
                    
                    {/* Real Image Feed */}
                    {!hasFailed && cam.snapshotUrl ? (
                      <img
                        src={`${cam.snapshotUrl}&_t=${refreshTimestamp}`}
                        alt={cam.name}
                        loading="lazy"
                        onError={() => handleImageError(cam.id)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      /* Graceful Fallback if offline/error */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4 text-center">
                        <Video className="w-8 h-8 text-slate-600 mb-1" />
                        <span className="text-[11px] font-mono text-slate-400 font-bold">{cam.id.toUpperCase()}</span>
                        <span className="text-[10px] text-slate-500">กำลังเชื่อมต่อสัญญาณสด...</span>
                      </div>
                    )}

                    {/* Subtle CCTV vignette gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/60 pointer-events-none" />

                    {/* Top OSD Bar: LIVE badge & Agency */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white z-10">
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE 24H
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-slate-300 font-semibold border border-white/10">
                        {cam.agency} • {cam.resolution}
                      </span>
                    </div>

                    {/* Hover Expand Hint Overlay */}
                    <div className="absolute inset-0 bg-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold pointer-events-none z-10 backdrop-blur-[2px]">
                      <Maximize2 className="w-4 h-4 text-cyan-300 animate-pulse" />
                      <span>คลิกเพื่อดูภาพขยาย</span>
                    </div>

                    {/* Bottom OSD Bar: Live seconds & Location code */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/90 z-10">
                      <span className="text-cyan-300 font-semibold truncate max-w-[60%]">
                        {cam.id.toUpperCase()}
                      </span>
                      <span className="bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs font-bold text-emerald-400">
                        {formattedTime} น.
                      </span>
                    </div>
                  </div>

                  {/* Camera Details Card Body */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          cam.agency === 'DOH'
                            ? (isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700')
                            : cam.agency === 'EXAT'
                            ? (isDark ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-50 text-amber-700')
                            : (isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                        }`}>
                          {cam.agency}
                        </span>

                        <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          อ.{cam.district}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-blue-500 transition-colors">
                        {cam.name}
                      </h3>
                      <p className={`text-[11px] mt-0.5 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        📍 {cam.road}
                      </p>
                    </div>

                    {/* Action Bar (Clean: Expand button + Map Pin button, NO external URL clutter) */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:underline">
                        <Maximize2 className="w-3 h-3" />
                        <span>ดูภาพขยาย</span>
                      </span>

                      {onFlyToMap && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                            onClose();
                            onFlyToMap({
                              lat: cam.lat,
                              lng: cam.lng,
                              zoom: 16.5,
                              duration: 1.8,
                              ts: Date.now()
                            });
                          }}
                          className={`p-1 px-2 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                            isDark 
                              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          }`}
                          title="บินไปตำแหน่งกล้องบนแผนที่"
                        >
                          <MapPin className="w-3 h-3 text-cyan-500" />
                          <span>แผนที่</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCameras.length === 0 && (
            <div className="text-center py-12">
              <Video className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                ไม่พบกล้องวงจรปิดตามเงื่อนไขที่ค้นหา
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedDistrict('ทั้งหมด');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                ล้างการค้นหาทั้งหมด
              </button>
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* MODAL FOOTER: Summary info                                */}
        {/* ========================================================= */}
        <div className={`p-2.5 sm:p-3 border-t flex items-center justify-between gap-2 shrink-0 text-xs ${
          isDark ? 'border-slate-800 bg-slate-900/90 text-slate-400' : 'border-slate-200 bg-slate-50/90 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>ภาพกล้องระบบ 24 ชม.</span>
            </span>
            <span className="hidden sm:inline">• รวม {CCTV_CAMERAS.length} จุดกล้องทั่วสมุทรปราการ</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono">
              ซิงค์ใน {refreshCountdown}วิ
            </span>
            <button
              type="button"
              onClick={() => {
                playCloseSound();
                onClose();
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold border cursor-pointer active:scale-95 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              ปิด
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* THEATER LIGHTBOX MODAL: Focused Big Screen View           */}
      {/* ========================================================= */}
      {focusedCamera && (
        <div 
          className="fixed inset-0 z-[10100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            playCloseSound();
            setFocusedCamera(null);
          }}
        >
          <div 
            className="w-full max-w-4xl max-h-[95vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Theater Header */}
            <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-600 text-white">
                    {focusedCamera.agency}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    อ.{focusedCamera.district}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    สด 24 ชม.
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-white mt-1 truncate">
                  {focusedCamera.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  playCloseSound();
                  setFocusedCamera(null);
                }}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title="ปิดหน้าต่างขยาย (Esc)"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">ปิด</span>
              </button>
            </div>

            {/* Theater Big Screen with Controls */}
            <div className="relative aspect-video w-full bg-black overflow-hidden select-none flex items-center justify-center">
              
              {/* Real Camera Image */}
              {focusedCamera.snapshotUrl ? (
                <img
                  src={`${focusedCamera.snapshotUrl}&_t=${refreshTimestamp}`}
                  alt={focusedCamera.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Video className="w-12 h-12 text-blue-500 animate-pulse mb-2" />
                  <span className="text-sm font-bold">สัญญาณกล้องออนไลน์</span>
                </div>
              )}

              {/* CRT / Surveillance HUD Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

              {/* OSD Top-Left: REC indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10 text-xs font-mono font-bold text-white">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  REC ● LIVE
                </span>
                <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs text-slate-300">
                  {focusedCamera.id.toUpperCase()}
                </span>
              </div>

              {/* OSD Top-Right: Date & Time */}
              <div className="absolute top-3 right-3 z-10 text-xs font-mono font-bold text-cyan-300 bg-black/60 px-2.5 py-1 rounded backdrop-blur-xs border border-white/10">
                {formattedDate} {formattedTime} น.
              </div>

              {/* OSD Bottom-Left: Camera Road & Location */}
              <div className="absolute bottom-3 left-3 z-10 text-xs text-white drop-shadow-md max-w-[70%]">
                <div className="font-extrabold text-white text-xs sm:text-sm">{focusedCamera.name}</div>
                <div className="text-[11px] text-slate-300 font-mono mt-0.5">📍 {focusedCamera.road} • {focusedCamera.direction}</div>
              </div>

              {/* OSD Bottom-Right: Resolution & Bitrate */}
              <div className="absolute bottom-3 right-3 z-10 text-[11px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                {focusedCamera.resolution} • 30 FPS
              </div>

              {/* Previous / Next Camera Floating Buttons */}
              <button
                type="button"
                onClick={handlePrevCamera}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-blue-600 border border-white/20 text-white transition-all cursor-pointer active:scale-90 z-20"
                title="กล้องก่อนหน้า (ลูกศรซ้าย)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNextCamera}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-blue-600 border border-white/20 text-white transition-all cursor-pointer active:scale-90 z-20"
                title="กล้องถัดไป (ลูกศรขวา)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Theater Footer Info Panel: Location details & THE ONLY EXTERNAL LINK */}
            <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="text-slate-300 font-medium">
                    {focusedCamera.description}
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono">
                    พิกัด GPS: [{focusedCamera.lat.toFixed(4)}, {focusedCamera.lng.toFixed(4)}] • แหล่งข้อมูล: {focusedCamera.sourcePlatform}
                  </div>
                </div>

                {/* THE ONLY EXTERNAL LINK BUTTON IN THE ENTIRE CCTV FEATURE */}
                <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                  <a
                    href={focusedCamera.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    title={`เปิดดูสัญญาณสดทางการ 24 ชม. บนเว็บไซต์ ${focusedCamera.agency}`}
                  >
                    <span>เปิดดูสดทางการ ({focusedCamera.agency})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {onFlyToMap && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setFocusedCamera(null);
                        onClose();
                        onFlyToMap({
                          lat: focusedCamera.lat,
                          lng: focusedCamera.lng,
                          zoom: 16.5,
                          duration: 1.8,
                          ts: Date.now()
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ดูบนแผนที่</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Jump Bar across cameras */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span className="font-mono">
                  กล้องที่ {currentCameraIndex + 1} จากทั้งหมด {CCTV_CAMERAS.length} จุด
                </span>
                <span className="text-[10px] text-slate-500">
                  (กดลูกศร ◀ ▶ เพื่อสลับดูกล้องอื่นได้อย่างรวดเร็ว)
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
