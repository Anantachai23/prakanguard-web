import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Trash2,
  Minus,
  Plus,
  AlertTriangle,
  Navigation,
  MapPin
} from 'lucide-react';
import { detectDistrictForCoordinates, isPointInSamutPrakan, detectSubdistrictForLocation } from '../data/samutPrakanBoundary';
import { getDetailedDeviceInfo } from '../services/cloudSyncService';
import { checkRateLimit, sanitizeReportPayload } from '../services/securityService';
import { CivicReportCamera } from './CivicIcons';

// เกณฑ์อ้างอิงระดับน้ำมาตรฐาน (คงไว้เพื่อความเข้ากันได้กับโมดูลอื่น)
export const OFFICIAL_BENCHMARK_LEVELS = [
  {
    id: 'ankle',
    part: 'ผิวจราจร / ขอบฟุตบาท',
    icon: '15 ซม.',
    label: 'ระดับผิวจราจร / ขอบฟุตบาท',
    defaultCm: 15,
    range: '5 - 20 ซม.',
    level: 1,
    color: 'emerald',
    desc: 'สัญจรได้ตามปกติ (ชะลอความเร็ว)'
  },
  {
    id: 'knee',
    part: 'ครึ่งล้อรถยนต์',
    icon: '35 ซม.',
    label: 'ระดับครึ่งล้อรถยนต์',
    defaultCm: 35,
    range: '21 - 50 ซม.',
    level: 2,
    color: 'amber',
    desc: 'การจราจรชะลอตัว รถเล็กควรเลี่ยงช่องซ้าย'
  },
  {
    id: 'thigh',
    part: 'มิดล้อรถยนต์ขึ้นไป',
    icon: '60 ซม.',
    label: 'ระดับมิดล้อรถยนต์ขึ้นไป',
    defaultCm: 60,
    range: '> 50 ซม.',
    level: 3,
    color: 'rose',
    desc: 'วิกฤต รถเล็กไม่สามารถสัญจรผ่านได้'
  }
];

export const BODY_WATER_LEVELS = OFFICIAL_BENCHMARK_LEVELS;
export const WATER_LEVEL_OPTIONS = OFFICIAL_BENCHMARK_LEVELS;

// เกณฑ์มาตรฐาน 3 ระดับ (เรียบง่าย ชัดเจน เป็นทางการ)
export const OFFICIAL_SEVERITY_TIERS = [
  {
    level: 1,
    id: 'ankle',
    title: 'ระดับ 1 : เล็กน้อย',
    rangeText: '5 – 20 ซม.',
    defaultCm: 15,
    reference: 'ไม่เกินขอบฟุตบาท',
    traffic: 'สัญจรได้ตามปกติ',
    dotColor: 'bg-emerald-500',
    activeClass: 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300',
    badgeStyle: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  },
  {
    level: 2,
    id: 'knee',
    title: 'ระดับ 2 : ปานกลาง',
    rangeText: '21 – 50 ซม.',
    defaultCm: 35,
    reference: 'ประมาณครึ่งล้อรถยนต์',
    traffic: 'รถเล็กควรเลี่ยงช่องซ้าย',
    dotColor: 'bg-amber-500',
    activeClass: 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300',
    badgeStyle: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  },
  {
    level: 3,
    id: 'thigh',
    title: 'ระดับ 3 : วิกฤต',
    rangeText: '> 50 ซม.',
    defaultCm: 60,
    reference: 'มิดล้อรถยนต์ขึ้นไป',
    traffic: 'รถเล็กไม่สามารถผ่านได้',
    dotColor: 'bg-rose-500',
    activeClass: 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300',
    badgeStyle: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
  }
];

export default function CitizenReportModal({ 
  isOpen, 
  onClose, 
  onSubmitReport, 
  onStartPickOnMap,
  pickedCoords,
  userLocation,
  theme = 'light' 
}) {
  const isDark = theme === 'dark';

  const [district, setDistrict] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [customCoords, setCustomCoords] = useState(null);
  const [notes, setNotes] = useState('');
  const [customCm, setCustomCm] = useState('35');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (pickedCoords && typeof pickedCoords.lat === 'number' && typeof pickedCoords.lng === 'number') {
      setCustomCoords(pickedCoords);
      setFormError('');
      const subDetected = detectSubdistrictForLocation(pickedCoords.lat, pickedCoords.lng, notes);
      if (subDetected) {
        setDistrict(subDetected.district);
        setSubdistrict(subDetected.subdistrict);
      } else {
        const detected = detectDistrictForCoordinates(pickedCoords.lat, pickedCoords.lng);
        setDistrict(detected || 'เมืองสมุทรปราการ');
        setSubdistrict('');
      }
    }
  }, [pickedCoords]);

  const parsedDepthNum = Math.max(1, Math.min(250, Math.round(parseFloat(customCm) || 35)));
  const currentSeverityLevel = parsedDepthNum > 50 ? 3 : parsedDepthNum >= 21 ? 2 : 1;
  const activeTierMeta = OFFICIAL_SEVERITY_TIERS.find(t => t.level === currentSeverityLevel) || OFFICIAL_SEVERITY_TIERS[1];

  const syncDepthValue = (cmVal) => {
    const num = Math.max(1, Math.min(250, Math.round(Number(cmVal) || 15)));
    setCustomCm(String(num));
  };

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    if (formError) setFormError('');
    const subDetected = detectSubdistrictForLocation(customCoords?.lat, customCoords?.lng, val, district);
    if (subDetected) {
      if (subDetected.district) setDistrict(subDetected.district);
      if (subDetected.subdistrict) setSubdistrict(subDetected.subdistrict);
    }
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.65) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result;
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
            return;
          }
          resolve(rawResult);
        };
        img.onerror = () => resolve(rawResult && typeof rawResult === 'string' && rawResult.length < 500000 ? rawResult : null);
        img.src = rawResult;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setFormError('ไฟล์รูปภาพมีขนาดใหญ่เกินไป (ไม่เกิน 20 MB)');
      return;
    }
    try {
      const optimized = await compressImage(file, 640, 640, 0.55);
      if (optimized) setPhotoPreview(optimized);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!customCoords || typeof customCoords.lat !== 'number' || typeof customCoords.lng !== 'number') {
      setFormError('กรุณาเลือกตำแหน่งจุดเกิดเหตุ ("ปักหมุดบนแผนที่" หรือ "พิกัดปัจจุบัน")');
      return;
    }

    if (!notes.trim()) {
      setFormError('กรุณาระบุชื่อถนน ซอย หรือจุดสังเกตของจุดน้ำท่วม');
      return;
    }

    const rateCheck = checkRateLimit('citizen_report', 30);
    if (!rateCheck.allowed) {
      setFormError(`กรุณารออีก ${rateCheck.waitSeconds} วินาที ก่อนส่งรายงานถัดไป`);
      return;
    }

    const finalLat = customCoords.lat;
    const finalLng = customCoords.lng;

    if (!isPointInSamutPrakan(finalLat, finalLng)) {
      setFormError('พิกัดที่เลือกอยู่นอกเขตจังหวัดสมุทรปราการ');
      return;
    }

    setIsSubmitting(true);

    const parsedCm = parsedDepthNum;
    const computedLevel = currentSeverityLevel;

    let reporterDistrict = 'ปิด GPS';
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      const detected = detectDistrictForCoordinates(userLocation.lat, userLocation.lng);
      reporterDistrict = detected ? detected.replace(/^อ\./, '').replace(/^อำเภอ/, '').replace('เมืองสมุทรปราการ', 'เมือง').trim() : 'ผู้ใช้อยู่นอกขอบเขตจังหวัด';
    }
    const reporterDevice = getDetailedDeviceInfo();

    const smartCheck = detectSubdistrictForLocation(finalLat, finalLng, notes.trim(), district)
      || { district: detectDistrictForCoordinates(finalLat, finalLng) || 'เมืองสมุทรปราการ', subdistrict: '' };
    const finalDistrict = smartCheck.district || detectDistrictForCoordinates(finalLat, finalLng) || 'เมืองสมุทรปราการ';
    const finalSubdistrict = smartCheck.subdistrict || '';

    const newReport = {
      id: `citizen_${Date.now()}`,
      name: notes.trim(),
      district: finalDistrict,
      subdistrict: finalSubdistrict,
      notes: notes.trim(),
      level: computedLevel,
      severity: computedLevel,
      bodyPart: activeTierMeta.reference,
      bodyPartId: activeTierMeta.id,
      bodyLevelLabel: `${activeTierMeta.reference} (${parsedCm} ซม.)`,
      body_level_label: `${activeTierMeta.reference} (${parsedCm} ซม.)`,
      levelLabel: `${activeTierMeta.title} (${parsedCm} ซม.)`,
      waterLevel: `${activeTierMeta.reference} (${parsedCm} ซม.)`,
      depthCm: parsedCm,
      depth_cm: parsedCm,
      depthRange: `${parsedCm} ซม.`,
      trafficStatus: activeTierMeta.traffic,
      traffic_status: activeTierMeta.traffic,
      lat: finalLat,
      lng: finalLng,
      photoUrl: photoPreview || null,
      reportedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'pending',
      reporterName: 'ประชาชนผู้ใช้เส้นทาง',
      reporterDevice,
      reporterDistrict,
      reporter_device: reporterDevice,
      reporter_district: reporterDistrict,
      source: 'รายงานจากประชาชนในพื้นที่'
    };

    const sanitizedReport = sanitizeReportPayload(newReport) || newReport;

    if (onSubmitReport) {
      onSubmitReport(sanitizedReport);
    }

    setIsSubmitting(false);
    setSubmitSuccess(true);

    setTimeout(() => {
      setSubmitSuccess(false);
      setNotes('');
      setPhotoPreview(null);
      setFormError('');
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
    >
      <div className={`w-[92vw] max-w-[440px] my-auto rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[86vh] transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700/90 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-blue-950/60 text-blue-400 border-blue-800/60' : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              <CivicReportCamera className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                รายงานจุดน้ำท่วมขัง
              </h3>
              <p className={`text-[11px] leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ศูนย์ข้อมูลอุทกภัย จังหวัดสมุทรปราการ
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mb-2.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ส่งรายงานเรียบร้อยแล้ว
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              บันทึกข้อมูลระดับน้ำ {parsedDepthNum} ซม. เข้าสู่ระบบแล้ว
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. ตำแหน่งและชื่อสถานที่ */}
            <div className="space-y-2.5">
              <label className={`block text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                1. ตำแหน่งและสถานที่เกิดเหตุ <span className="text-rose-500">*</span>
              </label>

              {customCoords ? (
                <div className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  isDark ? 'bg-emerald-950/30 border-emerald-800/70 text-emerald-200' : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                }`}>
                  <div className="min-w-0 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold">อ.{district || 'เมืองสมุทรปราการ'}</span>
                      <span className="font-mono text-[11px] opacity-75 ml-2">
                        ({customCoords.lat.toFixed(4)}, {customCoords.lng.toFixed(4)})
                      </span>
                    </div>
                  </div>
                  {onStartPickOnMap && (
                    <button
                      type="button"
                      onClick={() => onStartPickOnMap('citizen')}
                      className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer shrink-0 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      เปลี่ยนจุด
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {onStartPickOnMap && (
                    <button
                      type="button"
                      onClick={() => onStartPickOnMap('citizen')}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>ปักหมุดบนแผนที่</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!userLocation) {
                        onStartPickOnMap?.('citizen');
                        return;
                      }
                      setCustomCoords(userLocation);
                      setFormError('');
                      const detected = detectDistrictForCoordinates(userLocation.lat, userLocation.lng);
                      if (detected) setDistrict(detected);
                    }}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-500" />
                    <span>พิกัดปัจจุบัน</span>
                  </button>
                </div>
              )}

              <input
                type="text"
                value={notes}
                onChange={handleNotesChange}
                placeholder="ชื่อถนน / ซอย / จุดสังเกต (เช่น ถ.สุขุมวิท หน้าสำโรง)"
                className={`w-full px-3 py-2 rounded-lg text-xs border transition-colors outline-none ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                }`}
                required
              />
            </div>

            {/* 2. ระดับน้ำท่วมขัง (เรียบง่าย เลือกได้ 3 ระดับ หรือระบุ ซม.) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  2. ระดับน้ำท่วมขัง <span className="text-rose-500">*</span>
                </label>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${activeTierMeta.badgeStyle}`}>
                  {activeTierMeta.title}
                </span>
              </div>

              {/* ปุ่มเลือก 3 ระดับมาตรฐาน */}
              <div className="grid grid-cols-3 gap-2">
                {OFFICIAL_SEVERITY_TIERS.map((tier) => {
                  const isSelected = currentSeverityLevel === tier.level;
                  return (
                    <button
                      key={tier.level}
                      type="button"
                      onClick={() => syncDepthValue(tier.defaultCm)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? tier.activeClass
                          : (isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100')
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${tier.dotColor}`} />
                        <span className="truncate">{tier.title.replace(/^ระดับ \d+ : /, '')}</span>
                      </div>
                      <div className="font-mono text-[11px] font-semibold mt-1 opacity-90">
                        {tier.rangeText}
                      </div>
                      <div className="text-[10px] opacity-75 mt-0.5 truncate">
                        {tier.reference}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ช่องปรับตัวเลขความลึก (ซม.) แบบกะทัดรัด */}
              <div className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-2 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    ความลึกโดยประมาณ (ซม.)
                  </div>
                  <div className={`text-[10.5px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {activeTierMeta.reference} • {activeTierMeta.traffic}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => syncDepthValue(Math.max(5, parsedDepthNum - 5))}
                    className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative w-20">
                    <input
                      type="number"
                      min="1"
                      max="250"
                      value={customCm}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setCustomCm(raw);
                        if (raw !== '' && !isNaN(Number(raw))) {
                          syncDepthValue(Number(raw));
                        }
                      }}
                      className={`w-full pl-2 pr-7 py-1 rounded-md border text-center text-xs font-bold font-mono outline-none ${
                        isDark 
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                      }`}
                      required
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] font-semibold text-slate-400">
                      ซม.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => syncDepthValue(Math.min(200, parsedDepthNum + 5))}
                    className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. รูปภาพประกอบ (ถ้ามี) */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
                id="pg-citizen-photo-input"
              />

              {photoPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 h-28">
                  <img src={photoPreview} alt="รูปภาพน้ำท่วม" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/45 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-md bg-white text-slate-900 text-xs font-semibold cursor-pointer"
                    >
                      เปลี่ยนรูป
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 rounded-md bg-rose-600 text-white cursor-pointer"
                      title="ลบรูป"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-2 px-3 rounded-lg border border-dashed flex items-center justify-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isDark 
                      ? 'border-slate-700 hover:border-blue-500 bg-slate-950/40 text-slate-300' 
                      : 'border-slate-300 hover:border-blue-600 bg-slate-50 text-slate-700'
                  }`}
                >
                  <CivicReportCamera className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>3. แนบรูปภาพจุดเกิดเหตุ (ถ้ามี)</span>
                </button>
              )}
            </div>

            {/* ปุ่มยืนยัน */}
            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'กำลังส่ง...' : 'ส่งรายงานน้ำท่วม'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
