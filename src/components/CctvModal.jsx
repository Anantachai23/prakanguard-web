import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Video, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Tv,
  Info
} from 'lucide-react';
import { playClickSound, playCloseSound, playSelectSound } from '../services/soundEffects';
import { CCTV_CAMERAS } from '../data/cctvCameras';

export default function CctvModal({
  isOpen,
  onClose,
  initialCameraId = null,
  theme = 'light'
}) {
  const isDark = theme === 'dark';
  const [selectedDistrict, setSelectedDistrict] = useState('ทั้งหมด');
  const [selectedAgency, setSelectedAgency] = useState('ทั้งหมด'); // 'ทั้งหมด' | 'DOH' | 'EXAT' | 'RID'
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCamera, setFocusedCamera] = useState(null);
  const [liveClock, setLiveClock] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState(new Set());

  // Live 1-second surveillance clock
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setLiveClock(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Set initial camera when opened
  useEffect(() => {
    if (initialCameraId && isOpen) {
      const cam = CCTV_CAMERAS.find(c => c.id === initialCameraId);
      if (cam) {
        setFocusedCamera(cam);
        setSelectedDistrict('ทั้งหมด');
        setSelectedAgency('ทั้งหมด');
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

  // Mark an image as failed so it gracefully renders NO SIGNAL
  const handleImageError = useCallback((camId) => {
    setFailedImageIds(prev => new Set(prev).add(camId));
  }, []);

  // Filtered cameras based on Agency, District, and Search query
  const filteredCameras = useMemo(() => {
    return CCTV_CAMERAS.filter(c => {
      // Agency filter
      if (selectedAgency !== 'ทั้งหมด' && c.agency !== selectedAgency) return false;

      // District filter
      if (selectedDistrict !== 'ทั้งหมด') {
        if (!c.district.includes(selectedDistrict)) return false;
      }

      // Search query
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
  }, [selectedAgency, selectedDistrict, searchQuery]);

  // Agency Counts
  const dohCount = useMemo(() => CCTV_CAMERAS.filter(c => c.agency === 'DOH').length, []);
  const exatCount = useMemo(() => CCTV_CAMERAS.filter(c => c.agency === 'EXAT').length, []);
  const ridCount = useMemo(() => CCTV_CAMERAS.filter(c => c.agency === 'RID').length, []);

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
    setFailedImageIds(new Set());
    setTimeout(() => {
      setIsRefreshing(false);
      setLiveClock(new Date());
    }, 400);
  };

  if (!isOpen) return null;

  const districts = ['ทั้งหมด', 'เมืองสมุทรปราการ', 'บางพลี', 'พระประแดง', 'บางเสาธง', 'บางบ่อ', 'พระสมุทรเจดีย์'];
  const formattedTime = liveClock.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = liveClock.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
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
        {/* MODAL HEADER                                              */}
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
                  กล้องวงจรปิด CCTV ตรวจการณ์จริง 24 ชม.
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1 shrink-0">
                  <Radio className="w-3 h-3 animate-pulse" />
                  แหล่งข้อมูลจริง
                </span>
              </div>
              <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                จุดตรวจการณ์จราจรและประตูระบายน้ำ สมุทรปราการ (DOH • EXAT • RID)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Clock with Ticking Seconds */}
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
              title="ตรวจสอบสัญญาณกล้อง"
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
        {/* AGENCY FILTER TABS & SEARCH BAR                           */}
        {/* ========================================================= */}
        <div className={`p-2.5 sm:p-3 border-b space-y-2.5 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
        }`}>
          {/* Agency Filter Tabs: กรมทางหลวง / การทางพิเศษ / กรมชลประทาน */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setSelectedAgency('ทั้งหมด');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                selectedAgency === 'ทั้งหมด'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>กล้องทั้งหมด</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
                {CCTV_CAMERAS.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setSelectedAgency('DOH');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                selectedAgency === 'DOH'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                  : isDark
                  ? 'bg-blue-950/40 border-blue-800 text-blue-300 hover:bg-blue-950/70'
                  : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <span>กรมทางหลวง (DOH)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
                {dohCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setSelectedAgency('EXAT');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                selectedAgency === 'EXAT'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : isDark
                  ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-950/70'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span>การทางพิเศษ (EXAT)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
                {exatCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setSelectedAgency('RID');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                selectedAgency === 'RID'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : isDark
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 hover:bg-emerald-950/70'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span>กรมชลประทาน (RID)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono">
                {ridCount}
              </span>
            </button>
          </div>

          {/* Search Box + District Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
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

            {/* District Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
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
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                      selectedDistrict === dist
                        ? (isDark ? 'bg-blue-600/25 border-blue-500 text-blue-300 font-bold' : 'bg-blue-50 border-blue-600 text-blue-700 font-bold')
                        : (isDark ? 'bg-slate-850 border-slate-700/80 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')
                    }`}
                  >
                    <span>{dist === 'ทั้งหมด' ? 'ทั้งหมด' : `อ.${dist}`}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CCTV CAMERAS GRID                                         */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          
          {/* Transparency info banner */}
          <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
            isDark ? 'bg-slate-850/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                แสดง <strong>{filteredCameras.length}</strong> จุดตรวจการณ์จริง • สัญญาณสดจากกล้องภาครัฐสงวนสิทธิ์เฉพาะพอร์ทัลทางการของหน่วยงาน
              </span>
            </div>
            <span className="font-mono text-[11px] text-cyan-500 hidden sm:inline shrink-0">
              {formattedDate} {formattedTime} น.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCameras.map((cam) => {
              const hasDirectFeed = Boolean(cam.directCameraUrl) && !failedImageIds.has(cam.id);

              return (
                <div
                  key={cam.id}
                  onClick={() => {
                    playClickSound();
                    setFocusedCamera(cam);
                  }}
                  className={`group rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-0.5 ${
                    isDark 
                      ? 'bg-slate-850 border-slate-800 hover:border-blue-500' 
                      : 'bg-white border-slate-200 hover:border-blue-400'
                  }`}
                  role="button"
                  tabIndex={0}
                  title="คลิกเพื่อขยายจอใหญ่ (Esc ปิด)"
                >
                  {/* Camera Monitor Screen: Genuine direct feed OR Authentic NO SIGNAL Screen */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden select-none">
                    
                    {hasDirectFeed ? (
                      /* GENUINE DIRECT CAMERA IMAGE FEED */
                      <div className="w-full h-full relative bg-black flex items-center justify-center">
                        <img
                          src={cam.directCameraUrl}
                          alt={cam.name}
                          onError={() => handleImageError(cam.id)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />
                        
                        {/* Top OSD */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white z-10 pointer-events-none">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold flex items-center gap-1 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            LIVE
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-slate-200 font-semibold border border-white/10">
                            {cam.agency} • ออนไลน์
                          </span>
                        </div>

                        {/* Bottom OSD */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/90 z-10 pointer-events-none">
                          <span className="text-cyan-300 font-semibold truncate max-w-[60%]">
                            {cam.id.toUpperCase()}
                          </span>
                          <span className="bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs font-bold text-emerald-400">
                            {formattedTime} น.
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* AUTHENTIC CCTV NO SIGNAL SCREEN (Broadcast SMPTE Bars + Static OSD) */
                      <div className="w-full h-full relative bg-slate-950 flex flex-col justify-between p-2.5 select-none overflow-hidden">
                        {/* SMPTE Broadcast Color Bars */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                          <div className="flex-1 bg-slate-200" />
                          <div className="flex-1 bg-yellow-400" />
                          <div className="flex-1 bg-cyan-400" />
                          <div className="flex-1 bg-emerald-500" />
                          <div className="flex-1 bg-pink-500" />
                          <div className="flex-1 bg-red-600" />
                          <div className="flex-1 bg-blue-700" />
                        </div>

                        {/* CRT Scanline Effect */}
                        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(0deg,#000,#000_2px,transparent_2px,transparent_4px)]" />

                        {/* Top OSD Bar */}
                        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-white/90 pt-1">
                          <span className="px-1.5 py-0.5 rounded bg-rose-700 text-white font-bold flex items-center gap-1 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            NO SIGNAL
                          </span>
                          <span className="bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-xs text-slate-300 font-semibold border border-white/10">
                            {cam.agency} • สงวนสิทธิ์
                          </span>
                        </div>

                        {/* Center No Signal Notice */}
                        <div className="relative z-10 text-center my-auto px-2">
                          <div className="w-9 h-9 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-1 text-rose-400">
                            <Tv className="w-4 h-4" />
                          </div>
                          <span className="text-white text-xs font-bold block truncate">
                            {cam.shortName}
                          </span>
                          <span className="text-rose-400 text-[10px] font-mono block mt-0.5">
                            สัญญาณสดเข้ารหัสเฉพาะพอร์ทัลทางการ
                          </span>
                        </div>

                        {/* Bottom OSD Bar */}
                        <div className="relative z-10 flex items-center justify-between text-[9.5px] font-mono text-slate-400 pt-1 border-t border-white/10">
                          <span className="text-cyan-400 font-semibold truncate">
                            {cam.id.toUpperCase()}
                          </span>
                          <span className="text-slate-300">
                            {formattedTime} น.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Hover Expand Hint */}
                    <div className="absolute inset-0 bg-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold pointer-events-none z-20 backdrop-blur-[2px]">
                      <Maximize2 className="w-4 h-4 text-cyan-300 animate-pulse" />
                      <span>คลิกเพื่อขยายจอใหญ่</span>
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

                    {/* Action Row: Status badge & THE ONLY EXTERNAL LINK BUTTON PER CARD */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                      <span className={`text-[10.5px] font-medium flex items-center gap-1 ${
                        hasDirectFeed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'
                      }`}>
                        {hasDirectFeed ? '🟢 มีสัญญาณภาพ' : '🔴 NO SIGNAL'}
                      </span>

                      {/* Direct link button to official data source */}
                      <a
                        href={cam.streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1 px-2.5 rounded text-[11px] font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-600 dark:hover:text-white flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                        title={`เปิดดูสัญญาณสดที่แหล่งข้อมูลต้นทาง (${cam.agency})`}
                      >
                        <span>แหล่งข้อมูลต้นทาง</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCameras.length === 0 && (
            <div className="text-center py-12">
              <Tv className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                ไม่พบกล้องวงจรปิดตามเงื่อนไขที่เลือก
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedAgency('ทั้งหมด');
                  setSelectedDistrict('ทั้งหมด');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* MODAL FOOTER                                              */}
        {/* ========================================================= */}
        <div className={`p-2.5 sm:p-3 border-t flex items-center justify-between gap-2 shrink-0 text-xs ${
          isDark ? 'border-slate-800 bg-slate-900/90 text-slate-400' : 'border-slate-200 bg-slate-50/90 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>ข้อมูลกล้องจริง 100%</span>
            </span>
            <span className="hidden sm:inline">• รวม {CCTV_CAMERAS.length} จุดตรวจการณ์ทั่วสมุทรปราการ</span>
          </div>

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

      {/* ========================================================= */}
      {/* THEATER LIGHTBOX MODAL                                    */}
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
                  {Boolean(focusedCamera.directCameraUrl) && !failedImageIds.has(focusedCamera.id) ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      สัญญาณออนไลน์
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                      NO SIGNAL (สงวนสิทธิ์ต้นทาง)
                    </span>
                  )}
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
              
              {Boolean(focusedCamera.directCameraUrl) && !failedImageIds.has(focusedCamera.id) ? (
                /* DIRECT LIVE CAMERA FEED */
                <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
                  <img
                    src={focusedCamera.directCameraUrl}
                    alt={focusedCamera.name}
                    onError={() => handleImageError(focusedCamera.id)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />
                  
                  {/* Top OSD */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-white pointer-events-none">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                    <span className="bg-black/70 px-2 py-0.5 rounded text-cyan-300 border border-white/10">
                      {formattedDate} {formattedTime} น.
                    </span>
                  </div>

                  {/* Bottom OSD */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-white/90 pointer-events-none">
                    <span className="text-cyan-300 font-bold">
                      {focusedCamera.id.toUpperCase()}
                    </span>
                    <span className="bg-black/60 px-2 py-0.5 rounded text-slate-300">
                      {focusedCamera.resolution}
                    </span>
                  </div>
                </div>
              ) : (
                /* AUTHENTIC NO SIGNAL TEST SCREEN */
                <div className="w-full h-full relative bg-slate-950 flex flex-col justify-between p-4 select-none overflow-hidden">
                  {/* SMPTE Color Bars */}
                  <div className="absolute top-0 left-0 right-0 h-3 flex">
                    <div className="flex-1 bg-slate-200" />
                    <div className="flex-1 bg-yellow-400" />
                    <div className="flex-1 bg-cyan-400" />
                    <div className="flex-1 bg-emerald-500" />
                    <div className="flex-1 bg-pink-500" />
                    <div className="flex-1 bg-red-600" />
                    <div className="flex-1 bg-blue-700" />
                  </div>

                  {/* Scanline CRT Pattern */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(0deg,#000,#000_2px,transparent_2px,transparent_4px)]" />

                  {/* Top OSD */}
                  <div className="relative z-10 flex items-center justify-between text-xs font-mono font-bold text-white pt-2">
                    <span className="px-2 py-0.5 rounded bg-rose-700 text-white flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      NO SIGNAL
                    </span>
                    <span className="bg-black/70 px-2 py-0.5 rounded text-cyan-300">
                      {formattedDate} {formattedTime} น.
                    </span>
                  </div>

                  {/* Center No Signal Explanation & Direct Action */}
                  <div className="relative z-10 text-center my-auto max-w-lg mx-auto space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-rose-600/20 border-2 border-rose-500/60 flex items-center justify-center text-rose-400 mb-2">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <h3 className="text-white text-base sm:text-lg font-extrabold">
                      ไม่มีสัญญาณสตรีมภายนอก (No Direct Signal)
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      กล้องจุดนี้มีอยู่จริงในระบบการดูแลของ <strong>{focusedCamera.agencyFull}</strong> แต่ระบบต้นทางเข้ารหัสและสงวนสิทธิ์การรับชมสัญญาณสดเฉพาะบนพอร์ทัลทางการ
                    </p>
                    <div className="pt-2">
                      <a
                        href={focusedCamera.streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        <span>เปิดดูสัญญาณสดบนเว็บไซต์ {focusedCamera.agency} โดยตรง</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Bottom OSD */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/10">
                    <span className="text-cyan-400">
                      CAM ID: {focusedCamera.id.toUpperCase()}
                    </span>
                    <span className="text-slate-300">
                      STATUS: OFFLINE_PORTAL_ENCRYPTED
                    </span>
                  </div>
                </div>
              )}

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

            {/* Theater Footer Info Panel: Source link and metadata */}
            <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="text-slate-300 font-medium">
                    {focusedCamera.description}
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono">
                    📍 {focusedCamera.road} • {focusedCamera.direction}
                  </div>
                  <div className="text-cyan-400 text-[11px] font-mono">
                    แหล่งข้อมูลต้นทาง: {focusedCamera.sourcePlatform}
                  </div>
                </div>

                {/* Direct link button to official data source */}
                <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                  <a
                    href={focusedCamera.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    title={`เปิดดูสัญญาณสดทางการ 24 ชม. บนเว็บไซต์ ${focusedCamera.agency}`}
                  >
                    <span>ไปยังแหล่งข้อมูลต้นทาง ({focusedCamera.agency})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
