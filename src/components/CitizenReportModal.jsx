import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Trash2
} from 'lucide-react';
import { detectDistrictForCoordinates, isPointInSamutPrakan, detectSubdistrictForLocation } from '../data/samutPrakanBoundary';
import { getDetailedDeviceInfo } from '../services/cloudSyncService';
import { checkRateLimit, sanitizeReportPayload } from '../services/securityService';
import { CivicGauge, CivicStationPin, CivicCompass, CivicReportCamera, CivicShield } from './CivicIcons';

// ระดับน้ำตามส่วนของร่างกาย (อวัยวะ) ตามมาตรฐานการประเมินภาคสนาม
export const BODY_WATER_LEVELS = [
  {
    id: 'ankle',
    part: 'ข้อเท้า',
    icon: '10cm',
    label: 'ระดับข้อเท้า / ตาตุ่ม',
    defaultCm: 10,
    range: '5 - 15 ซม.',
    level: 1,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    selectedClass: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500',
    desc: 'น้ำขังผิวทาง รถทุกชนิดสัญจรได้'
  },
  {
    id: 'shin',
    part: 'ครึ่งหน้าแข้ง',
    icon: '25cm',
    label: 'ระดับครึ่งหน้าแข้ง',
    defaultCm: 25,
    range: '16 - 30 ซม.',
    level: 2,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    selectedClass: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500',
    desc: 'ปริ่มท่อไอเสีย รถเล็กควรใช้ความระมัดระวัง'
  },
  {
    id: 'knee',
    part: 'หัวเข่า',
    icon: '45cm',
    label: 'ระดับหัวเข่า',
    defaultCm: 45,
    range: '31 - 50 ซม.',
    level: 2,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    selectedClass: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500',
    desc: 'ครึ่งล้อรถยนต์ รถเก๋งและมอเตอร์ไซค์ควรเลี่ยง'
  },
  {
    id: 'thigh',
    part: 'ต้นขา / สะโพก',
    icon: '65cm',
    label: 'ระดับต้นขา / สะโพก',
    defaultCm: 65,
    range: '51 - 75 ซม.',
    level: 3,
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    selectedClass: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500',
    desc: 'ท่วมมิดล้อรถเก๋ง ห้ามรถเล็กผ่านเด็ดขาด'
  },
  {
    id: 'waist',
    part: 'ระดับเอวขึ้นไป / อก',
    icon: '85cm+',
    label: 'ระดับเอวขึ้นไป',
    defaultCm: 85,
    range: '> 75 ซม.',
    level: 3,
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    selectedClass: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500',
    desc: 'วิกฤต น้ำท่วมสูง ห้ามยานพาหนะทุกชนิดสัญจร'
  }
];

export const WATER_LEVEL_OPTIONS = BODY_WATER_LEVELS;

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
  const [selectedBodyPartId, setSelectedBodyPartId] = useState('shin');
  const [customCm, setCustomCm] = useState('25');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (pickedCoords && typeof pickedCoords.lat === 'number' && typeof pickedCoords.lng === 'number') {
      setCustomCoords(pickedCoords);
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

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
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
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
            return;
          }
          resolve(rawResult);
        };
        img.onerror = () => {
          if (rawResult && typeof rawResult === 'string' && rawResult.length < 500000) {
            resolve(rawResult);
          } else {
            resolve(null);
          }
        };
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
      alert("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (กรุณาเลือกรูปขนาดไม่เกิน 20 MB)");
      return;
    }

    setPhotoFile(file);
    try {
      const optimized = await compressImage(file, 640, 640, 0.55);
      if (optimized) {
        setPhotoPreview(optimized);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setPhotoPreview(uploadEvent.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!customCoords || typeof customCoords.lat !== 'number' || typeof customCoords.lng !== 'number') {
      alert("กรุณาแตะปุ่ม 'ปักหมุดบนแผนที่' หรือ 'ใช้พิกัดปัจจุบัน' เพื่อระบุตำแหน่งจุดน้ำท่วม");
      return;
    }

    if (!notes.trim()) {
      alert("กรุณากรอกชื่อถนนหรือจุดสังเกต");
      return;
    }

    const rateCheck = checkRateLimit('citizen_report', 30);
    if (!rateCheck.allowed) {
      alert(`กรุณารออีก ${rateCheck.waitSeconds} วินาที ก่อนส่งรายงานถัดไป`);
      return;
    }

    setIsSubmitting(true);

    const bodyPartObj = BODY_WATER_LEVELS.find(l => l.id === selectedBodyPartId) || BODY_WATER_LEVELS[1];
    const parsedCm = Math.max(1, Math.round(parseFloat(customCm) || bodyPartObj.defaultCm));
    const computedLevel = parsedCm > 50 ? 3 : (parsedCm >= 21 ? 2 : 1);

    const finalLat = customCoords.lat;
    const finalLng = customCoords.lng;

    if (!isPointInSamutPrakan(finalLat, finalLng)) {
      alert("พิกัดที่ระบุอยู่นอกพื้นที่ 6 อำเภอของจังหวัดสมุทรปราการ");
      setIsSubmitting(false);
      return;
    }

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
      name: `${notes.trim()}`,
      district: finalDistrict,
      subdistrict: finalSubdistrict,
      notes: notes.trim(),
      level: computedLevel,
      severity: computedLevel,
      bodyPart: bodyPartObj.part,
      bodyPartId: bodyPartObj.id,
      bodyLevelLabel: bodyPartObj.label,
      body_level_label: bodyPartObj.label,
      levelLabel: `${bodyPartObj.part} (~${parsedCm} ซม.)`,
      waterLevel: `${bodyPartObj.part} (~${parsedCm} ซม.)`,
      depthCm: parsedCm,
      depth_cm: parsedCm,
      depthRange: `${parsedCm} ซม.`,
      lat: finalLat,
      lng: finalLng,
      photoUrl: photoPreview || null,
      reportedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'pending',
      reporterName: 'ประชาชนผู้ใช้เส้นทาง',
      reporterDevice: reporterDevice,
      reporterDistrict: reporterDistrict,
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
      setPhotoFile(null);
      onClose();
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className={`w-[92vw] max-w-[440px] sm:max-w-lg my-auto m-auto rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[84vh] sm:max-h-[86vh] transition-colors ${
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
              <CivicReportCamera className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm sm:text-base font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                รายงานจุดน้ำท่วมขังภาคประชาชน
              </h3>
              <p className={`text-[11px] sm:text-xs leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ระบุพิกัดและระดับน้ำเพื่อแจ้งเตือนผู้ใช้เส้นทางใน จ.สมุทรปราการ
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              ส่งรายงานเข้าสู่ระบบเรียบร้อยแล้ว
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              ขอบคุณสำหรับข้อมูล ระบบได้ส่งพิกัดไปยังศูนย์ควบคุมเพื่อตรวจสอบและแสดงผลบนแผนที่
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 sm:py-4 space-y-3.5">
            {/* Step 1: Map Coordinates */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  1. พิกัดตำแหน่งที่เกิดเหตุ <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">วิเคราะห์อำเภอ/ตำบลอัตโนมัติ</span>
              </div>

              {customCoords ? (
                <div className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  isDark ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200' : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-bold text-xs">
                        อ.{district || 'เมืองสมุทรปราการ'} {subdistrict ? `• ต.${subdistrict}` : ''}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      พิกัด: {customCoords.lat.toFixed(5)}, {customCoords.lng.toFixed(5)}
                    </span>
                  </div>
                  {onStartPickOnMap && (
                    <button
                      type="button"
                      onClick={() => onStartPickOnMap('citizen')}
                      className={`px-2.5 py-1.5 rounded-md border text-[11px] font-semibold cursor-pointer shrink-0 transition-colors ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      เปลี่ยนพิกัด
                    </button>
                  )}
                </div>
              ) : (
                <div className={`p-3 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
                  isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                }`}>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ระบุตำแหน่งจุดน้ำท่วมบนแผนที่หรือใช้ GPS
                  </span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onStartPickOnMap && (
                      <button
                        type="button"
                        onClick={() => onStartPickOnMap('citizen')}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <CivicStationPin className="w-3.5 h-3.5 text-white" />
                        <span>ปักหมุดแผนที่</span>
                      </button>
                    )}
                    {userLocation && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCoords(userLocation);
                          const subDetected = detectSubdistrictForLocation(userLocation.lat, userLocation.lng, notes);
                          if (subDetected) {
                            setDistrict(subDetected.district);
                            setSubdistrict(subDetected.subdistrict);
                          } else {
                            const detected = detectDistrictForCoordinates(userLocation.lat, userLocation.lng);
                            if (detected) setDistrict(detected);
                          }
                        }}
                        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <CivicCompass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>ใช้ GPS ปัจจุบัน</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Location Note */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                2. ชื่อถนนและจุดสังเกต <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={handleNotesChange}
                placeholder="เช่น ถ.สุขุมวิท หน้าปากซอยวัดด่านสำโรง มุ่งหน้าแยกเทพารักษ์"
                className={`w-full px-3 py-2 rounded-lg text-xs sm:text-sm border transition-colors outline-none ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                }`}
                required
              />
            </div>

            {/* Step 3: Water Level Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  3. ประเมินระดับน้ำท่วมขัง <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">เลือกเกณฑ์เทียบระดับร่างกาย</span>
              </div>

              <div className={`rounded-lg border divide-y overflow-hidden ${
                isDark ? 'border-slate-800 divide-slate-800 bg-slate-950/40' : 'border-slate-200 divide-slate-200 bg-white'
              }`}>
                {BODY_WATER_LEVELS.map((lvl) => {
                  const isSelected = selectedBodyPartId === lvl.id;
                  return (
                    <div
                      key={lvl.id}
                      onClick={() => {
                        setSelectedBodyPartId(lvl.id);
                        setCustomCm(String(lvl.defaultCm));
                      }}
                      className={`px-3 py-2 transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected 
                          ? lvl.selectedClass 
                          : (isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50')
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`w-12 py-1 rounded text-center text-[10px] font-mono font-bold border shrink-0 ${lvl.badgeClass}`}>
                          {lvl.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {lvl.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({lvl.range})
                            </span>
                          </div>
                          <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {lvl.desc}
                          </p>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-600'
                          : (isDark ? 'border-slate-600' : 'border-slate-300')
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Numeric Depth Input + Presets */}
              <div className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <CivicGauge className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>ความลึกประมาณ (ซม.):</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="relative w-24">
                    <input
                      type="number"
                      min="1"
                      max="250"
                      value={customCm}
                      onChange={(e) => setCustomCm(e.target.value)}
                      className={`w-full pl-2.5 pr-7 py-1 rounded border text-xs font-bold font-mono outline-none ${
                        isDark 
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' 
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                      }`}
                      required
                    />
                    <span className="absolute right-2 top-1 text-[10px] font-mono text-slate-400">
                      cm
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[10, 25, 45, 65, 85].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setCustomCm(String(preset));
                          const matching = BODY_WATER_LEVELS.find(b => preset >= b.defaultCm - 10 && preset <= b.defaultCm + 10);
                          if (matching) setSelectedBodyPartId(matching.id);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold font-mono border transition-colors cursor-pointer ${
                          customCm === String(preset)
                            ? 'bg-blue-700 text-white border-blue-700'
                            : (isDark ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100')
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Photo Attachment */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                4. ภาพถ่ายประกอบสถานการณ์จริง (ถ้ามี)
              </label>
              
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
                <div className="relative rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 h-36 group">
                  <img 
                    src={photoPreview} 
                    alt="รูปภาพน้ำท่วม" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-semibold shadow-sm cursor-pointer"
                    >
                      เปลี่ยนรูปภาพ
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 rounded-lg bg-rose-600 text-white text-xs shadow-sm cursor-pointer"
                      title="ลบรูป"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-3 px-3.5 rounded-lg border border-dashed flex items-center justify-center gap-2.5 transition-colors cursor-pointer ${
                    isDark 
                      ? 'border-slate-700 hover:border-blue-500 bg-slate-950/30 text-slate-300' 
                      : 'border-slate-300 hover:border-blue-600 bg-slate-50/60 text-slate-700'
                  }`}
                >
                  <CivicReportCamera className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold">
                    แตะเพื่อถ่ายภาพ หรือ เลือกรูปจากอุปกรณ์
                  </span>
                </button>
              )}
            </div>

            {/* Submit Footer */}
            <div className="pt-1 flex items-center justify-between gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>ตรวจสอบโดยศูนย์ควบคุมก่อนแสดงผล</span>
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CivicReportCamera className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งรายงานสถานการณ์'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
