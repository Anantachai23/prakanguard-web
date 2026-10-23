import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  ExternalLink,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Navigation
} from 'lucide-react';
import { playClickSound, playCloseSound, playSelectSound } from '../services/soundEffects';
import { CCTV_CAMERAS } from '../data/cctvCameras';
import {
  CivicCctv,
  CivicStationPin,
  CivicShield,
  CivicRadar
} from './CivicIcons';

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
  const [failedImageIds, setFailedImageIds] = useState(new Set());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setLiveClock(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (initialCameraId && isOpen) {
      const cam = CCTV_CAMERAS.find(c => c.id === initialCameraId);
      if (cam) {
        setFocusedCamera(cam);
        setSelectedDistrict('ทั้งหมด');
        setSelectedAgency('ทั้งหมด');
      }
    } else if (!isOpen) {
      setFocusedCamera(null);
    }
  }, [initialCameraId, isOpen]);

  const handleImageError = useCallback((camId) => {
    setFailedImageIds(prev => new Set(prev).add(camId));
  }, []);

  const filteredCameras = useMemo(() => {
    return CCTV_CAMERAS.filter(c => {
      if (selectedAgency !== 'ทั้งหมด' && c.agency !== selectedAgency) return false;
      if (selectedDistrict !== 'ทั้งหมด' && !c.district.includes(selectedDistrict)) return false;
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

  const agencyCounts = useMemo(() => ({
    ALL: CCTV_CAMERAS.length,
    DOH: CCTV_CAMERAS.filter(c => c.agency === 'DOH').length,
    EXAT: CCTV_CAMERAS.filter(c => c.agency === 'EXAT').length,
    RID: CCTV_CAMERAS.filter(c => c.agency === 'RID').length
  }), []);

  const currentCameraIndex = useMemo(() => {
    if (!focusedCamera) return -1;
    return filteredCameras.findIndex(c => c.id === focusedCamera.id);
  }, [focusedCamera, filteredCameras]);

  const handlePrevCamera = useCallback(() => {
    const list = filteredCameras.length > 0 ? filteredCameras : CCTV_CAMERAS;
    if (!focusedCamera || list.length === 0) return;
    playClickSound();
    const idx = list.findIndex(c => c.id === focusedCamera.id);
    const prevIdx = idx <= 0 ? list.length - 1 : idx - 1;
    setFocusedCamera(list[prevIdx]);
  }, [focusedCamera, filteredCameras]);

  const handleNextCamera = useCallback(() => {
    const list = filteredCameras.length > 0 ? filteredCameras : CCTV_CAMERAS;
    if (!focusedCamera || list.length === 0) return;
    playClickSound();
    const idx = list.findIndex(c => c.id === focusedCamera.id);
    const nextIdx = idx === -1 || idx >= list.length - 1 ? 0 : idx + 1;
    setFocusedCamera(list[nextIdx]);
  }, [focusedCamera, filteredCameras]);

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
  }, [isOpen, focusedCamera, handlePrevCamera, handleNextCamera, onClose]);

  const handleManualRefresh = () => {
    playClickSound();
    setIsRefreshing(true);
    setFailedImageIds(new Set());
    setTimeout(() => {
      setIsRefreshing(false);
      setLiveClock(new Date());
    }, 350);
  };

  if (!isOpen) return null;

  const districts = ['ทั้งหมด', 'เมืองสมุทรปราการ', 'บางพลี', 'พระประแดง', 'บางเสาธง', 'บางบ่อ', 'พระสมุทรเจดีย์'];
  const formattedTime = liveClock.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const getAgencyBadgeStyle = (agency) => {
    if (agency === 'DOH') {
      return isDark
        ? 'bg-blue-950/70 text-blue-300 border-blue-800/80'
        : 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (agency === 'EXAT') {
      return isDark
        ? 'bg-amber-950/70 text-amber-300 border-amber-800/80'
        : 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return isDark
      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getAgencyLabel = (agency) => {
    if (agency === 'DOH') return 'กรมทางหลวง (DOH)';
    if (agency === 'EXAT') return 'การทางพิเศษฯ (EXAT)';
    if (agency === 'RID') return 'กรมชลประทาน (RID)';
    return agency;
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/65 backdrop-blur-xs"
      onClick={() => {
        playCloseSound();
        onClose();
      }}
    >
      <div
        className={`w-[88vw] max-w-[355px] sm:max-w-2xl lg:max-w-4xl max-h-[76vh] sm:max-h-[85vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Institutional Accent Bar */}
        <div className="h-1 w-full bg-blue-700 shrink-0" />

        {/* ========================================================= */}
        {/* MODAL HEADER                                              */}
        {/* ========================================================= */}
        <div className={`px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-2.5 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {focusedCamera ? (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setFocusedCamera(null);
                }}
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="กลับไปหน้ารายการกล้อง"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                isDark ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-slate-50 text-blue-700 border-slate-200'
              }`}>
                <CivicCctv className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold truncate leading-tight">
                  {focusedCamera ? focusedCamera.shortName || focusedCamera.name : 'โครงข่ายกล้องโทรทัศน์วงจรปิด (CCTV)'}
                </h2>
                <span className={`hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {focusedCamera ? focusedCamera.agency : `${CCTV_CAMERAS.length} สถานี`}
                </span>
              </div>
              <p className={`text-[10px] sm:text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {focusedCamera
                  ? `${focusedCamera.agencyFull} • อ.${focusedCamera.district}`
                  : 'จุดตรวจการณ์จราจรและสถานีสูบน้ำหลัก 6 อำเภอ จ.สมุทรปราการ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>{formattedTime} น.</span>
            </div>

            {!focusedCamera && (
              <button
                type="button"
                onClick={handleManualRefresh}
                className={`w-7 h-7 sm:w-auto sm:h-8 sm:px-2.5 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title="รีเฟรชข้อมูลสถานี"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
                <span className="hidden sm:inline text-[11px]">รีเฟรช</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playCloseSound();
                onClose();
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
              }`}
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: STATION INSPECTOR (WHEN A CAMERA IS SELECTED)      */}
        {/* ========================================================= */}
        {focusedCamera ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4">
            {/* Live Image Preview ONLY if directCameraUrl exists and is valid */}
            {Boolean(focusedCamera.directCameraUrl) && !failedImageIds.has(focusedCamera.id) && (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                <img
                  src={focusedCamera.directCameraUrl}
                  alt={focusedCamera.name}
                  onError={() => handleImageError(focusedCamera.id)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>LIVE STREAM</span>
                </div>
              </div>
            )}

            {/* Station Overview Card */}
            <div className={`p-3 sm:p-4 rounded-lg border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getAgencyBadgeStyle(focusedCamera.agency)}`}>
                    {getAgencyLabel(focusedCamera.agency)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    อ.{focusedCamera.district}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                  {focusedCamera.resolution || '1080p HD'}
                </span>
              </div>

              <h3 className={`text-xs sm:text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {focusedCamera.name}
              </h3>
              <p className={`text-[11px] sm:text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {focusedCamera.description}
              </p>
            </div>

            {/* Technical Specifications Divided Table */}
            <div className={`rounded-lg border divide-y text-[11px] sm:text-xs ${
              isDark ? 'border-slate-800 divide-slate-800 bg-slate-900' : 'border-slate-200 divide-slate-200 bg-white'
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>สายทาง / ตำแหน่ง</span>
                  <span className="font-semibold text-right truncate max-w-[65%]">{focusedCamera.road}</span>
                </div>
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>มุมกล้องตรวจการณ์</span>
                  <span className="font-semibold text-right truncate max-w-[65%]">{focusedCamera.direction}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>รหัสอ้างอิงสถานี</span>
                  <span className="font-mono font-semibold">{focusedCamera.id.toUpperCase()}</span>
                </div>
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>พิกัดภูมิศาสตร์ (GPS)</span>
                  <span className="font-mono font-semibold">{focusedCamera.lat.toFixed(4)}, {focusedCamera.lng.toFixed(4)}</span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>โครงข่ายต้นสังกัด</span>
                <span className="font-semibold text-right">{focusedCamera.sourcePlatform}</span>
              </div>
            </div>

            {/* Official Portal Stream Notice & Primary Action */}
            <div className={`p-3 sm:p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? 'bg-blue-950/25 border-blue-900/60' : 'bg-blue-50/70 border-blue-200'
            }`}>
              <div className="flex items-start gap-2.5 min-w-0">
                <CivicShield className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
                <div className="text-[11px] sm:text-xs leading-relaxed">
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    การเชื่อมต่อสัญญาณภาพสด (Official Portal Stream)
                  </span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    ระบบสัญญาณภาพสดของ {focusedCamera.agency} ให้บริการผ่านหน้าพอร์ทัลทางการของหน่วยงานโดยตรงเพื่อความปลอดภัยของโครงข่าย
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${focusedCamera.lat},${focusedCamera.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3 py-2 rounded-lg border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>แผนที่</span>
                </a>

                <a
                  href={focusedCamera.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>เปิดพอร์ทัล {focusedCamera.agency}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: FILTER BAR & STATION DIRECTORY GRID               */
          /* ========================================================= */
          <>
            {/* Filter Controls */}
            <div className={`px-3.5 py-2.5 sm:px-5 sm:py-3 border-b space-y-2 shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/60'
            }`}>
              {/* Row 1: Search Input + District Select */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อแยก, ถนน หรือสถานีสูบน้ำ (เช่น สำโรง, ศรีเทพา, บางนา)..."
                    className={`w-full pl-8 pr-7 py-1.5 text-[11px] sm:text-xs rounded-lg border transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* District Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
                  {districts.map(dist => {
                    const active = selectedDistrict === dist;
                    return (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => {
                          playSelectSound();
                          setSelectedDistrict(dist);
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                          active
                            ? 'bg-blue-700 text-white border-blue-700'
                            : isDark
                              ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {dist === 'ทั้งหมด' ? 'ทุกอำเภอ' : dist.replace('เมืองสมุทรปราการ', 'เมืองฯ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Segmented Agency Selector */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'ทั้งหมด', label: 'ทั้งหมด', count: agencyCounts.ALL },
                  { id: 'DOH', label: 'กรมทางหลวง (DOH)', count: agencyCounts.DOH },
                  { id: 'EXAT', label: 'การทางพิเศษ (EXAT)', count: agencyCounts.EXAT },
                  { id: 'RID', label: 'กรมชลประทาน (RID)', count: agencyCounts.RID }
                ].map(tab => {
                  const active = selectedAgency === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setSelectedAgency(tab.id);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        active
                          ? (isDark ? 'bg-slate-800 text-white border-slate-600' : 'bg-slate-900 text-white border-slate-900')
                          : (isDark ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`font-mono text-[9.5px] px-1 rounded ${
                        active ? 'bg-white/20 text-white' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Station Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {filteredCameras.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CivicCctv className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-500">
                    ไม่พบสถานีกล้องวงจรปิดตามเงื่อนไขที่ระบุ
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAgency('ทั้งหมด');
                      setSelectedDistrict('ทั้งหมด');
                      setSearchQuery('');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {filteredCameras.map((cam) => {
                    const hasDirectFeed = Boolean(cam.directCameraUrl) && !failedImageIds.has(cam.id);

                    return (
                      <div
                        key={cam.id}
                        onClick={() => {
                          playClickSound();
                          setFocusedCamera(cam);
                        }}
                        className={`group rounded-lg border p-2.5 sm:p-3.5 flex flex-col justify-between gap-2.5 transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
                        }`}
                      >
                        {/* Optional Live Thumbnail if direct feed exists */}
                        {hasDirectFeed && (
                          <div className="relative aspect-video w-full rounded-md overflow-hidden bg-slate-950 border border-slate-800">
                            <img
                              src={cam.directCameraUrl}
                              alt={cam.name}
                              onError={() => handleImageError(cam.id)}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-mono font-bold">
                              LIVE
                            </span>
                          </div>
                        )}

                        {/* Card Top Metadata Row */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border shrink-0 ${getAgencyBadgeStyle(cam.agency)}`}>
                                {cam.agency}
                              </span>
                              <span className={`text-[10px] font-semibold truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                อ.{cam.district}
                              </span>
                            </div>
                            <span className="font-mono text-[9.5px] text-slate-400 shrink-0">
                              {cam.type === 'waterway' ? 'สถานีชลประทาน' : 'จราจร'}
                            </span>
                          </div>

                          {/* Station Name & Road */}
                          <div className="flex items-start gap-2">
                            <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                              isDark ? 'bg-slate-900 border-slate-800 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-700'
                            }`}>
                              <CivicCctv className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className={`text-xs sm:text-[13px] font-bold leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}>
                                {cam.name}
                              </h3>
                              <p className={`text-[10.5px] sm:text-[11px] truncate mt-0.5 flex items-center gap-1 ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                <CivicStationPin className="w-3 h-3 shrink-0 text-blue-500" />
                                <span className="truncate">{cam.road}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Row: Direction & Actions */}
                        <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
                          isDark ? 'border-slate-800/80' : 'border-slate-100'
                        }`}>
                          <span className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {cam.direction}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              รายละเอียด
                            </span>
                            <a
                              href={cam.streamUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title={`เปิดพอร์ทัลทางการ (${cam.agency})`}
                            >
                              <span>พอร์ทัลสด</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* MODAL FOOTER                                              */}
        {/* ========================================================= */}
        <div className={`px-3.5 py-2.5 sm:px-5 sm:py-3 border-t flex items-center justify-between gap-2 shrink-0 text-[11px] sm:text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-600'
        }`}>
          {focusedCamera ? (
            <>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevCamera}
                  className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>ก่อนหน้า</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextCamera}
                  className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>ถัดไป</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setFocusedCamera(null);
                }}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                ดูสถานีทั้งหมด
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 truncate">
                <CivicRadar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">
                  แสดง {filteredCameras.length} จาก {CCTV_CAMERAS.length} สถานี (DOH • EXAT • RID)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  playCloseSound();
                  onClose();
                }}
                className={`px-3.5 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer shrink-0 ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                ปิดหน้าต่าง
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
