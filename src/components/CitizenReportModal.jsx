import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Trash2,
  Minus,
  Plus,
  AlertTriangle,
  ShieldCheck,
  Navigation,
  MapPin
} from 'lucide-react';
import { detectDistrictForCoordinates, isPointInSamutPrakan, detectSubdistrictForLocation } from '../data/samutPrakanBoundary';
import { getDetailedDeviceInfo } from '../services/cloudSyncService';
import { checkRateLimit, sanitizeReportPayload } from '../services/securityService';
import { CivicGauge, CivicStationPin, CivicCompass, CivicReportCamera, CivicShield } from './CivicIcons';

// เกณฑ์มาตรฐานการวัดระดับน้ำและจุดอ้างอิงทางวิศวกรรมจราจร (มาตรฐาน ปภ. และแขวงทางหลวง)
export const OFFICIAL_BENCHMARK_LEVELS = [
  {
    id: 'ankle',
    part: 'ผิวจราจร / ร่องระบายน้ำ',
    icon: '10 ซม.',
    label: 'ระดับผิวจราจร / ร่องระบายน้ำ',
    refStandard: 'น้ำขังผิวจราจร ไม่เกินขอบทางเท้า',
    defaultCm: 10,
    range: '5 - 15 ซม.',
    level: 1,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    selectedClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500',
    desc: 'น้ำขังผิวทาง รถทุกชนิดสัญจรได้ตามปกติ'
  },
  {
    id: 'shin',
    part: 'เสมอสันฟุตบาทมาตรฐาน',
    icon: '20 ซม.',
    label: 'ระดับเสมอสันขอบฟุตบาทมาตรฐาน',
    refStandard: 'ท่วมถึงระดับขอบทางเท้ามาตรฐาน (~15-20 ซม.)',
    defaultCm: 20,
    range: '15 - 20 ซม.',
    level: 1,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    selectedClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500',
    desc: 'น้ำขังรอการระบาย ช่องทางซ้ายควรชะลอความเร็ว'
  },
  {
    id: 'knee',
    part: 'ครึ่งล้อรถยนต์ / ท่อไอเสีย',
    icon: '30 ซม.',
    label: 'ระดับครึ่งล้อรถยนต์ / ปริ่มท่อไอเสีย',
    refStandard: 'ท่วมเกินขอบฟุตบาทถึงกึ่งกลางล้อรถยนต์',
    defaultCm: 30,
    range: '21 - 35 ซม.',
    level: 2,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    selectedClass: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-600 dark:border-amber-500',
    desc: 'น้ำท่วมปานกลาง รถเล็กและรถจักรยานยนต์ควรหลีกเลี่ยงช่องซ้าย'
  },
  {
    id: 'door_sill',
    part: 'ขอบล่างประตูรถเก๋ง',
    icon: '45 ซม.',
    label: 'ระดับเสมอขอบล่างประตูรถเก๋ง',
    refStandard: 'ท่วมเกือบมิดล้อรถเก๋ง เสี่ยงน้ำเข้าห้องโดยสาร',
    defaultCm: 45,
    range: '36 - 50 ซม.',
    level: 2,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    selectedClass: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-600 dark:border-amber-500',
    desc: 'น้ำท่วมขังสูง รถเก๋งโหลดเตี้ยและรถจักรยานยนต์ไม่ควรผ่าน'
  },
  {
    id: 'thigh',
    part: 'ท่วมมิดล้อรถยนต์',
    icon: '60 ซม.',
    label: 'ระดับท่วมมิดล้อรถยนต์นั่งส่วนบุคคล',
    refStandard: 'เกิน 50 ซม. ท่วมมิดยางรถยนต์มาตรฐาน',
    defaultCm: 60,
    range: '51 - 70 ซม.',
    level: 3,
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
    selectedClass: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-600 dark:border-rose-500',
    desc: 'วิกฤต ห้ามรถเล็กสัญจรผ่านเด็ดขาด เสี่ยงเครื่องยนต์ดับ'
  },
  {
    id: 'waist',
    part: 'ระดับฝากระโปรงรถ / วิกฤต',
    icon: '80+ ซม.',
    label: 'ระดับฝากระโปรงรถยนต์ขึ้นไป (วิกฤต)',
    refStandard: 'น้ำท่วมสูงวิกฤตเกิน 75 ซม. การจราจรถูกตัดขาด',
    defaultCm: 80,
    range: '> 75 ซม.',
    level: 3,
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
    selectedClass: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-600 dark:border-rose-500',
    desc: 'วิกฤตสูงสุด ห้ามยานพาหนะทุกชนิดสัญจรผ่าน'
  }
];

export const BODY_WATER_LEVELS = OFFICIAL_BENCHMARK_LEVELS;
export const WATER_LEVEL_OPTIONS = OFFICIAL_BENCHMARK_LEVELS;

// เกณฑ์มาตรฐานความรุนแรง 3 ระดับ (มาตรฐานกรมป้องกันและบรรเทาสาธารณภัย)
export const OFFICIAL_SEVERITY_TIERS = [
  {
    level: 1,
    code: 'LEVEL 1',
    title: 'ระดับ 1 : น้ำขังรอการระบาย',
    rangeText: '5 – 20 ซม.',
    defaultCm: 15,
    reference: 'ไม่เกินสันขอบฟุตบาทมาตรฐาน',
    traffic: 'สัญจรได้ตามปกติ (ชะลอความเร็ว)',
    accentColor: 'emerald',
    dotColor: 'bg-emerald-500',
    activeBg: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500',
    badgeStyle: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  },
  {
    level: 2,
    code: 'LEVEL 2',
    title: 'ระดับ 2 : น้ำท่วมขังปานกลาง',
    rangeText: '21 – 50 ซม.',
    defaultCm: 30,
    reference: 'เกินขอบฟุตบาท – ครึ่งล้อรถยนต์',
    traffic: 'การจราจรติดขัด / รถเล็กควรเลี่ยงช่องซ้าย',
    accentColor: 'amber',
    dotColor: 'bg-amber-500',
    activeBg: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-600 dark:border-amber-500',
    badgeStyle: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  },
  {
    level: 3,
    code: 'LEVEL 3',
    title: 'ระดับ 3 : น้ำท่วมสูงวิกฤต',
    rangeText: 'มากกว่า 50 ซม.',
    defaultCm: 60,
    reference: 'ท่วมมิดล้อรถยนต์ / ขอบประตูรถ',
    traffic: 'รถเล็กไม่สามารถสัญจรผ่านได้',
    accentColor: 'rose',
    dotColor: 'bg-rose-600',
    activeBg: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-600 dark:border-rose-500',
    badgeStyle: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
  }
];

const TRAFFIC_STATUS_OPTIONS = [
  'สัญจรได้ตามปกติ (ชะลอความเร็ว)',
  'การจราจรติดขัด / เสียช่องจราจรบางส่วน',
  'รถเล็กไม่สามารถสัญจรผ่านได้'
];

const QUICK_ROAD_TAGS = [
  'ถ.สุขุมวิท',
  'ถ.ศรีนครินทร์',
  'ถ.เทพารักษ์',
  'ถ.เทพรัตน (บางนา-ตราด)',
  'ถ.แพรกษา',
  'ถ.กิ่งแก้ว',
  'ถ.ปู่เจ้าสมิงพราย',
  'ถ.สุขสวัสดิ์'
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
  const [selectedBodyPartId, setSelectedBodyPartId] = useState('knee');
  const [customCm, setCustomCm] = useState('30');
  const [trafficStatus, setTrafficStatus] = useState(TRAFFIC_STATUS_OPTIONS[1]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
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

  const syncDepthValue = (cmVal) => {
    const num = Math.max(1, Math.min(250, Math.round(Number(cmVal) || 10)));
    setCustomCm(String(num));

    // จับคู่เกณฑ์มาตรฐานที่ใกล้เคียงที่สุดโดยอัตโนมัติ
    let matchedId = 'ankle';
    if (num >= 75) matchedId = 'waist';
    else if (num >= 51) matchedId = 'thigh';
    else if (num >= 38) matchedId = 'door_sill';
    else if (num >= 21) matchedId = 'knee';
    else if (num >= 16) matchedId = 'shin';
    else matchedId = 'ankle';
    setSelectedBodyPartId(matchedId);

    // อัปเดตสถานะการจราจรตามเกณฑ์ความลึกอัตโนมัติ
    if (num > 50) {
      setTrafficStatus(TRAFFIC_STATUS_OPTIONS[2]);
    } else if (num >= 21) {
      setTrafficStatus(TRAFFIC_STATUS_OPTIONS[1]);
    } else {
      setTrafficStatus(TRAFFIC_STATUS_OPTIONS[0]);
    }
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

  const handleAppendRoadTag = (road) => {
    if (notes.includes(road)) return;
    const nextVal = notes.trim() ? `${road} ${notes.trim()}` : `${road} บริเวณ`;
    setNotes(nextVal);
    if (formError) setFormError('');
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
      setFormError('ไฟล์รูปภาพมีขนาดใหญ่เกินไป (กรุณาเลือกรูปขนาดไม่เกิน 20 MB)');
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

  const parsedDepthNum = Math.max(1, Math.min(250, Math.round(parseFloat(customCm) || 30)));
  const currentSeverityLevel = parsedDepthNum > 50 ? 3 : parsedDepthNum >= 21 ? 2 : 1;
  const activeTierMeta = OFFICIAL_SEVERITY_TIERS.find(t => t.level === currentSeverityLevel) || OFFICIAL_SEVERITY_TIERS[1];

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!customCoords || typeof customCoords.lat !== 'number' || typeof customCoords.lng !== 'number') {
      setFormError('กรุณาระบุตำแหน่งพิกัดจุดเกิดเหตุ โดยกดปุ่ม "ปักหมุดบนแผนที่" หรือ "ใช้พิกัด GPS ปัจจุบัน"');
      return;
    }

    if (!notes.trim()) {
      setFormError('กรุณาระบุชื่อถนน ซอย หรือจุดสังเกตสำคัญของจุดที่เกิดน้ำท่วมขัง');
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
      setFormError('พิกัดที่ระบุอยู่นอกเขตพื้นที่ 6 อำเภอของจังหวัดสมุทรปราการ');
      return;
    }

    setIsSubmitting(true);

    const bodyPartObj = OFFICIAL_BENCHMARK_LEVELS.find(l => l.id === selectedBodyPartId) || OFFICIAL_BENCHMARK_LEVELS[2];
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
      name: `${notes.trim()}`,
      district: finalDistrict,
      subdistrict: finalSubdistrict,
      notes: notes.trim(),
      level: computedLevel,
      severity: computedLevel,
      bodyPart: bodyPartObj.part,
      bodyPartId: bodyPartObj.id,
      bodyLevelLabel: `${bodyPartObj.part} (${parsedCm} ซม.)`,
      body_level_label: `${bodyPartObj.part} (${parsedCm} ซม.)`,
      levelLabel: `${activeTierMeta.title} (${parsedCm} ซม.)`,
      waterLevel: `${bodyPartObj.part} (${parsedCm} ซม.)`,
      depthCm: parsedCm,
      depth_cm: parsedCm,
      depthRange: `${parsedCm} ซม.`,
      trafficStatus: trafficStatus,
      traffic_status: trafficStatus,
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
      setFormError('');
      onClose();
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[2000] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-y-auto"
    >
      <div className={`w-[92vw] max-w-[410px] sm:max-w-xl my-auto m-auto rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[88vh] shrink-0 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700/90 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        {/* Top Official Institutional Header Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-900 via-blue-700 to-sky-600 shrink-0" />

        {/* Header */}
        <div className={`px-3.5 py-2.5 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-blue-950/60 text-blue-400 border-blue-800/60' : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <CivicReportCamera className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-xs sm:text-sm font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  แบบฟอร์มแจ้งเหตุน้ำท่วมขังผิวจราจร
                </h3>
                <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  FORM-SPK-01
                </span>
              </div>
              <p className={`text-[10px] sm:text-xs leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ศูนย์ปฏิบัติการข้อมูลอุทกภัย จังหวัดสมุทรปราการ (มาตรฐาน ปภ.)
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className={`text-sm sm:text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              รับเรื่องรายงานสถานการณ์น้ำท่วมเรียบร้อยแล้ว
            </h4>
            <p className={`text-xs max-w-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              ข้อมูลพิกัดและระดับน้ำ ({parsedDepthNum} ซม.) ถูกส่งไปยังศูนย์ควบคุมกลางเพื่อตรวจสอบและเผยแพร่แจ้งเตือนประชาชน
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-3.5 sm:py-4 space-y-4">
            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-snug">{formError}</span>
              </div>
            )}

            {/* ส่วนที่ 1: พิกัดภูมิศาสตร์และสถานที่เกิดเหตุ */}
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span className="w-4 h-4 rounded bg-blue-700 text-white text-[10px] font-mono flex items-center justify-center">1</span>
                  <span>พิกัดตำแหน่งที่เกิดเหตุ (GIS Coordinates)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-medium text-slate-400">เขตพื้นที่ 6 อำเภอ</span>
              </div>

              {customCoords ? (
                <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  isDark ? 'bg-emerald-950/30 border-emerald-800/70 text-emerald-200' : 'bg-white border-emerald-300 text-emerald-950 shadow-2xs'
                }`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-bold text-xs">
                        อ.{district || 'เมืองสมุทรปราการ'} {subdistrict ? `• ต.${subdistrict}` : ''}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      LAT/LNG: {customCoords.lat.toFixed(5)}, {customCoords.lng.toFixed(5)}
                    </span>
                  </div>
                  {onStartPickOnMap && (
                    <button
                      type="button"
                      onClick={() => onStartPickOnMap('citizen')}
                      className={`px-2.5 py-1.5 rounded-md border text-[11px] font-semibold cursor-pointer shrink-0 transition-colors ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      เปลี่ยนพิกัด
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    กรุณาเลือกวิธีระบุตำแหน่งจุดน้ำท่วมขัง:
                  </span>
                  <div className="flex items-center gap-2">
                    {onStartPickOnMap && (
                      <button
                        type="button"
                        onClick={() => onStartPickOnMap('citizen')}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-white" />
                        <span>ปักหมุดบนแผนที่</span>
                      </button>
                    )}
                    {userLocation && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCoords(userLocation);
                          setFormError('');
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
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>พิกัด GPS ปัจจุบัน</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ชื่อถนนและจุดสังเกต */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800">
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  ชื่อถนน / ช่วงซอย / จุดสังเกตสำคัญ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="ระบุชื่อถนน ซอย หรือจุดสังเกต เช่น ถ.สุขุมวิท หน้าช้างสามเศียร มุ่งหน้าสำโรง"
                  className={`w-full px-3 py-2 rounded-lg text-xs sm:text-sm border transition-colors outline-none ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  }`}
                  required
                />
                {/* ปุ่มลัดชื่อสายทางหลัก */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 mr-0.5">สายทางหลัก:</span>
                  {QUICK_ROAD_TAGS.map((road) => (
                    <button
                      key={road}
                      type="button"
                      onClick={() => handleAppendRoadTag(road)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500/50 hover:text-blue-300'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700'
                      }`}
                    >
                      {road}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ส่วนที่ 2: การระบุระดับน้ำท่วมขังแบบทางการ (Official Hydrological Depth Input) */}
            <div className={`p-3 sm:p-3.5 rounded-lg border space-y-3 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span className="w-4 h-4 rounded bg-blue-700 text-white text-[10px] font-mono flex items-center justify-center">2</span>
                  <span>ระบุระดับน้ำท่วมขังตามเกณฑ์มาตรฐานอุทกวิทยา</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${activeTierMeta.badgeStyle}`}>
                  {activeTierMeta.title}
                </span>
              </div>

              {/* 2.1 กล่องกรอกตัวเลขความลึก (เซนติเมตร) + แถบสเกลวัดระดับน้ำ */}
              <div className={`p-3 rounded-lg border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <CivicGauge className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        ความลึกน้ำท่วมขังสุทธิ (เซนติเมตร)
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      เกณฑ์อ้างอิง: {activeTierMeta.reference}
                    </p>
                  </div>

                  {/* ตัวควบคุมตัวเลข [-5] [Input ซม.] [+5] */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => syncDepthValue(Math.max(5, parsedDepthNum - 5))}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="ลดลง 5 ซม."
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative w-28">
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
                        className={`w-full pl-3 pr-9 py-1.5 rounded-lg border text-center text-sm font-extrabold font-mono outline-none ${
                          isDark 
                            ? 'bg-slate-950 border-blue-500/60 text-white focus:border-blue-400' 
                            : 'bg-slate-50 border-blue-600/60 text-slate-900 focus:border-blue-700'
                        }`}
                        required
                      />
                      <span className="absolute right-2.5 top-2 text-[11px] font-bold text-slate-400">
                        ซม.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => syncDepthValue(Math.min(200, parsedDepthNum + 5))}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="เพิ่มขึ้น 5 ซม."
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* แถบสเกลวัดระดับน้ำ (Hydrological Scale Bar 5 - 100 ซม.) */}
                <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={Math.min(100, Math.max(5, parsedDepthNum))}
                    onChange={(e) => syncDepthValue(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-700 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>5 ซม. (ผิวทาง)</span>
                    <span>20 ซม. (ฟุตบาท)</span>
                    <span>35 ซม. (ครึ่งล้อ)</span>
                    <span>50 ซม. (วิกฤต)</span>
                    <span>80+ ซม.</span>
                  </div>
                </div>
              </div>

              {/* 2.2 การ์ดเลือกเกณฑ์มาตรฐานความรุนแรง 3 ระดับ (Official 3-Tier Standard Selector) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    จำแนกตามเกณฑ์มาตรฐาน 3 ระดับ:
                  </span>
                  <span className="text-[10px] text-slate-400">แตะเพื่อเลือกช่วงระดับน้ำ</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {OFFICIAL_SEVERITY_TIERS.map((tier) => {
                    const isSelected = currentSeverityLevel === tier.level;
                    return (
                      <button
                        key={tier.level}
                        type="button"
                        onClick={() => syncDepthValue(tier.defaultCm)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? tier.activeBg
                            : (isDark ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50')
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                              <span className={`w-2 h-2 rounded-full ${tier.dotColor}`} />
                              <span className={isDark ? 'text-white' : 'text-slate-900'}>ระดับที่ {tier.level}</span>
                            </span>
                            <span className="font-mono text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                              {tier.rangeText}
                            </span>
                          </div>
                          <div className={`text-[11px] font-semibold leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {tier.reference}
                          </div>
                        </div>
                        <div className={`text-[10px] mt-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {tier.traffic}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2.3 ปุ่มเทียบระดับความสูงจากสิ่งปลูกสร้างและยานพาหนะมาตรฐาน (Engineering Reference Benchmarks) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    เทียบความสูงกับจุดสังเกตมาตรฐานภาคสนาม:
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {OFFICIAL_BENCHMARK_LEVELS.map((bm) => {
                    const isSelected = selectedBodyPartId === bm.id && Math.abs(parsedDepthNum - bm.defaultCm) <= 5;
                    return (
                      <button
                        key={bm.id}
                        type="button"
                        onClick={() => {
                          setSelectedBodyPartId(bm.id);
                          syncDepthValue(bm.defaultCm);
                        }}
                        className={`px-2.5 py-2 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-blue-700 border-blue-700 text-white shadow-2xs'
                            : (isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100')
                        }`}
                      >
                        <span className="text-[11px] font-semibold truncate">{bm.part}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected
                            ? 'bg-blue-800 text-blue-100'
                            : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                        }`}>
                          {bm.defaultCm} ซม.
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2.4 สถานะผลกระทบต่อการจราจร */}
              <div>
                <label className={`block text-[11px] font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  สภาพการสัญจร ณ จุดเกิดเหตุ:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {TRAFFIC_STATUS_OPTIONS.map((opt) => {
                    const active = trafficStatus === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setTrafficStatus(opt)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold text-left transition-colors cursor-pointer ${
                          active
                            ? (isDark ? 'bg-blue-950/70 border-blue-500 text-blue-200' : 'bg-blue-50 border-blue-600 text-blue-900')
                            : (isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ส่วนที่ 3: ภาพถ่ายหลักฐานประกอบสถานการณ์จริง */}
            <div className={`p-3 rounded-lg border ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
            }`}>
              <label className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <span className="w-4 h-4 rounded bg-blue-700 text-white text-[10px] font-mono flex items-center justify-center">3</span>
                <span>ภาพถ่ายหลักฐานประกอบสถานการณ์จริง (ถ้ามี)</span>
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
                  className={`w-full py-2.5 px-3.5 rounded-lg border border-dashed flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isDark 
                      ? 'border-slate-700 hover:border-blue-500 bg-slate-900/60 text-slate-300' 
                      : 'border-slate-300 hover:border-blue-600 bg-white text-slate-700'
                  }`}
                >
                  <CivicReportCamera className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold">
                    แนบภาพถ่ายจุดเกิดเหตุ หรือ ถ่ายภาพจากกล้องอุปกรณ์
                  </span>
                </button>
              )}
            </div>

            {/* Submit Footer */}
            <div className="pt-1 flex items-center justify-between gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>ข้อมูลจะถูกส่งไปยังศูนย์ควบคุมเพื่อตรวจสอบความถูกต้อง</span>
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CivicReportCamera className="w-4 h-4" />
                  <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันการส่งรายงาน'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
