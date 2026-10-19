import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Video, 
  ExternalLink, 
  Navigation, 
  Search, 
  Radio, 
  RefreshCw, 
  Filter, 
  ChevronRight, 
  MapPin, 
  Eye, 
  Maximize2, 
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight
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
  const [selectedAgency, setSelectedAgency] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedCamera, setFocusedCamera] = useState(null);
  const [liveClock, setLiveClock] = useState(() => new Date());
  const [refreshCountdown, setRefreshCountdown] = useState(15);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live seconds clock & countdown for 24h CCTV realism
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setLiveClock(new Date());
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Set initial camera if provided
  useEffect(() => {
    if (initialCameraId) {
      const cam = CCTV_CAMERAS.find(c => c.id === initialCameraId);
      if (cam) {
        setFocusedCamera(cam);
        setSelectedDistrict('ทั้งหมด');
      }
    }
  }, [initialCameraId, isOpen]);

  // Filtered cameras
  const filteredCameras = useMemo(() => {
    return CCTV_CAMERAS.filter(c => {
      // District filter
      if (selectedDistrict !== 'ทั้งหมด') {
        if (!c.district.includes(selectedDistrict)) return false;
      }
      // Agency filter
      if (selectedAgency !== 'all') {
        if (c.agency !== selectedAgency) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchRoad = c.road.toLowerCase().includes(q);
        const matchDist = c.district.toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        if (!matchName && !matchRoad && !matchDist && !matchDesc) return false;
      }
      return true;
    });
  }, [selectedDistrict, selectedAgency, searchQuery]);

  const handleManualRefresh = () => {
    playClickSound();
    setIsRefreshing(true);
    setRefreshCountdown(15);
    setTimeout(() => {
      setIsRefreshing(false);
      setLiveClock(new Date());
    }, 600);
  };

  if (!isOpen) return null;

  const districts = ['ทั้งหมด', 'เมืองสมุทรปราการ', 'บางพลี', 'พระประแดง', 'บางเสาธง', 'บางบ่อ', 'พระสมุทรเจดีย์'];
  const formattedTime = liveClock.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        playCloseSound();
        onClose();
      }}
    >
      <div 
        className={`w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-all duration-200 animate-in zoom-in-95 duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================================= */}
        {/* MODAL HEADER                                              */}
        {/* ========================================================= */}
        <div className={`p-3 sm:p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Video className="w-5 h-5 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold truncate leading-tight">
                  กล้องวงจรปิด CCTV สด 24 ชม. ทั่วสมุทรปราการ
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  LIVE 24 ชม.
                </span>
              </div>
              <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                แหล่งข้อมูลจริง: กรมทางหลวง (DOH) • การทางพิเศษ (EXAT) • กรมชลประทาน (ThaiWater)
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
              className={`p-1.5 rounded-md border transition-all cursor-pointer active:scale-95 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="รีเฟรชสัญญาณภาพสด"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
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
        {/* FILTER CONTROLS & SEARCH BAR                              */}
        {/* ========================================================= */}
        <div className={`p-2.5 sm:p-3 border-b space-y-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
        }`}>
          {/* Search + Agency Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อจุดกล้อง, ถนน (เช่น บางนา, ลัดโพธิ์, สุขุมวิท, คลองด่าน)..."
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Agency filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'ทุกหน่วยงาน' },
                { id: 'DOH', label: 'กรมทางหลวง (DOH)' },
                { id: 'EXAT', label: 'ทางพิเศษ (EXAT)' },
                { id: 'RID', label: 'ชลประทาน (RID)' }
              ].map(ag => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedAgency(ag.id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap border transition-all cursor-pointer active:scale-95 ${
                    selectedAgency === ag.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {ag.label}
                </button>
              ))}
            </div>
          </div>

          {/* District Pills Bar */}
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
                      ? (isDark ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold' : 'bg-blue-50 border-blue-600 text-blue-700 font-bold')
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
        {/* CAMERA FEED GRID / FOCUSED VIEW                           */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          
          {/* FOCUSED EXPANDED CAMERA (IF SELECTED) */}
          {focusedCamera && (
            <div className={`p-3 sm:p-4 rounded-xl border shadow-lg space-y-3 ${
              isDark ? 'bg-slate-850/90 border-blue-500/50' : 'bg-blue-50/50 border-blue-300'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-600 text-white">
                      {focusedCamera.agency}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      อ.{focusedCamera.district}
                    </span>
                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                      {focusedCamera.resolution}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold mt-1 text-slate-900 dark:text-white">
                    {focusedCamera.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    📍 {focusedCamera.road} • {focusedCamera.direction}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFocusedCamera(null)}
                  className={`p-1.5 rounded-md text-xs font-semibold border cursor-pointer active:scale-95 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                  title="ปิดมุมมองขยาย"
                >
                  ✕ ย่อกลับ
                </button>
              </div>

              {/* Simulated Live Broadcast Display */}
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col justify-between p-3 select-none">
                {/* Background road/telemetry canvas art */}
                <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Top overlay metadata */}
                <div className="relative z-10 flex items-center justify-between gap-2 text-[11px] font-mono text-white/90">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                    <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs font-semibold">
                      {focusedCamera.id.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-xs font-mono font-bold text-cyan-400">
                    {formattedTime} น. (24 ชม.)
                  </div>
                </div>

                {/* Center Road/Camera Graphic & Status */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center px-4">
                  <div className="w-14 h-14 rounded-full bg-blue-600/20 border-2 border-blue-400/60 flex items-center justify-center mb-2 animate-pulse">
                    <Video className="w-7 h-7 text-cyan-400" />
                  </div>
                  <span className="text-white text-xs sm:text-sm font-bold shadow-black">
                    {focusedCamera.name}
                  </span>
                  <span className="text-cyan-300 text-[11px] mt-1 font-mono">
                    พิกัด GPS: [{focusedCamera.lat.toFixed(4)}, {focusedCamera.lng.toFixed(4)}]
                  </span>
                  <span className="text-slate-300 text-[11px] mt-0.5 max-w-md">
                    {focusedCamera.description}
                  </span>
                </div>

                {/* Bottom overlay: Action launcher buttons right on feed */}
                <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-white/10 text-xs">
                  <span className="text-slate-400 text-[10px] font-mono">
                    แหล่งถ่ายทอดสด: {focusedCamera.sourcePlatform}
                  </span>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <a
                      href={focusedCamera.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <span>เปิดดูสดช่องทางทางการ 24 ชม.</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {onFlyToMap && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          onClose();
                          onFlyToMap({
                            lat: focusedCamera.lat,
                            lng: focusedCamera.lng,
                            zoom: 16.5,
                            duration: 1.8,
                            ts: Date.now()
                          });
                        }}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>บินไปจุดนี้บนแผนที่</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CAMERAS GRID (18 POINTS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCameras.map((cam) => {
              const isCurrentFocused = focusedCamera?.id === cam.id;

              return (
                <div
                  key={cam.id}
                  className={`rounded-lg border overflow-hidden flex flex-col justify-between transition-all duration-200 group hover:shadow-md ${
                    isCurrentFocused
                      ? (isDark ? 'border-cyan-500 bg-slate-850 ring-2 ring-cyan-500/30' : 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/30')
                      : (isDark ? 'bg-slate-850/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300')
                  }`}
                >
                  {/* Top Live Screen Preview Container */}
                  <div className="relative aspect-video w-full bg-slate-950 flex flex-col justify-between p-2 select-none overflow-hidden">
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />

                    {/* Header info overlay */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-white/90">
                      <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-bold flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                      <span className="bg-black/60 px-1.5 py-0.2 rounded backdrop-blur-xs font-semibold text-slate-300">
                        {cam.agency} • 24H
                      </span>
                    </div>

                    {/* Center Icon & Road label */}
                    <div className="relative z-10 text-center my-auto">
                      <div className="w-10 h-10 mx-auto rounded-full bg-blue-600/20 border border-blue-400/40 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Video className="w-5 h-5 text-cyan-400" />
                      </div>
                      <span className="text-white text-xs font-bold block truncate px-2">
                        {cam.shortName}
                      </span>
                      <span className="text-slate-400 text-[10px] block truncate px-2">
                        {cam.direction}
                      </span>
                    </div>

                    {/* Bottom overlay status */}
                    <div className="relative z-10 flex items-center justify-between text-[9.5px] font-mono text-slate-400 pt-1 border-t border-white/10">
                      <span className="text-cyan-400 font-semibold truncate">
                        {formattedTime}
                      </span>
                      <span className="truncate">
                        อ.{cam.district}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          cam.agency === 'DOH'
                            ? (isDark ? 'bg-blue-950/60 text-cyan-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200')
                            : cam.agency === 'EXAT'
                            ? (isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200')
                            : (isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                        }`}>
                          {cam.agencyFull.split(' ')[0]}
                        </span>

                        <span className={`text-[10.5px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          อ.{cam.district}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {cam.name}
                      </h4>
                      <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {cam.description}
                      </p>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setFocusedCamera(cam);
                        }}
                        className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        }`}
                        title="ดูรายละเอียดและขยายกล้องนี้"
                      >
                        <Maximize2 className="w-3 h-3 text-cyan-400" />
                        <span>ดูขยาย</span>
                      </button>

                      <a
                        href={cam.streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-2.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                        title={`เปิดดูสดทางการ 24 ชม. บนเว็บไซต์ ${cam.agency}`}
                      >
                        <span>เปิดดูสด</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {onFlyToMap && (
                        <button
                          type="button"
                          onClick={() => {
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
                          className={`p-1 rounded-md border transition-all cursor-pointer active:scale-95 ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-blue-600'
                          }`}
                          title="บินไปตำแหน่งกล้องบนแผนที่"
                        >
                          <MapPin className="w-3.5 h-3.5" />
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
              <Video className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                ไม่พบกล้อง CCTV ตามเงื่อนไขที่ค้นหา
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedDistrict('ทั้งหมด');
                  setSelectedAgency('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-blue-600 hover:underline cursor-pointer"
              >
                ล้างการค้นหาทั้งหมด
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
              <span>ระบบตรวจสอบสด 24 ชม.</span>
            </span>
            <span className="hidden sm:inline">• รวมกล้องหลัก {CCTV_CAMERAS.length} จุดครอบคลุม 6 อำเภอ</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono">
              รีเฟรชใน {refreshCountdown}วิ
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
    </div>
  );
}
