import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  Navigation, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Image as ImageIcon,
  Compass,
  ArrowRight,
  ShieldCheck,
  LocateFixed,
  CloudRain,
  CloudHail,
  Sparkles
} from 'lucide-react';
import { DISTRICTS } from '../data/samutPrakanPoints';
import { validateCoordinatePrecision, detectDistrictForCoordinates } from '../data/samutPrakanBoundary';

// Standard 5 Body-Landmark Water Levels (Aligned with Official 3-Tier Criteria: 5-20, 21-50, >50 cm)
export const BODY_WATER_LEVELS = [
  {
    id: 'ankle',
    label: 'ข้อเท้า/ใต้ท้องรถ',
    range: '5 – 20 ซม.',
    depthApprox: 15,
    severity: 1,
    emoji: '🦶',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    darkBadgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    desc: 'น้ำท่วมเสมอตาตุ่มถึงใต้ท้องรถเก๋ง ผิวจราจรเปียกขัง',
    traffic: '🟢 ระดับ 1 (5-20 ซม.): รถทุกประเภทสัญจรได้ตามปกติ ชะลอความเร็วเมื่อเข้าใกล้จุดขัง',
    guidance: 'ระมัดระวังการลื่นไถล ชะลอความเร็วเพื่อไม่ให้น้ำกระเซ็น'
  },
  {
    id: 'knee',
    label: 'หน้าแข้งถึงหัวเข่า',
    range: '21 – 50 ซม.',
    depthApprox: 35,
    severity: 2,
    emoji: '🦵',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    darkBadgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800',
    desc: 'น้ำท่วมครึ่งแข้งถึงหัวเข่า ท่วมแตะขอบประตูล่างถึงครึ่งล้อรถเก๋ง',
    traffic: '🟠 ระดับ 2 (21-50 ซม.): รถเก๋ง/อีโคคาร์เสี่ยงสูงมาก ควรเลี่ยงเส้นทาง ปิดแอร์ทันที',
    guidance: 'รถกระบะ/SUV ผ่านได้ในช่องทางขวา ห้ามสตาร์ทรถซ้ำหากเครื่องยนต์ดับ'
  },
  {
    id: 'waist',
    label: 'ระดับเอว/มิดล้อรถ',
    range: '> 50 ซม.',
    depthApprox: 70,
    severity: 3,
    emoji: '🩳',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    darkBadgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800',
    desc: 'น้ำท่วมสูงเสมอเอว ท่วมมิดล้อรถเก๋ง (>50 ซม.) และเข้าห้องโดยสาร',
    traffic: '🔴 ระดับ 3 (>50 ซม.): วิกฤต! ห้ามรถเก๋งและรถเล็กทุกชนิดผ่านเด็ดขาด ท่อไอเสียและห้องเครื่องจมน้ำ',
    guidance: 'แนะนำยกของขึ้นที่สูง ตัดกระแสไฟชั้นล่าง หลีกเลี่ยงกระแสน้ำเชี่ยว'
  },
  {
    id: 'chest',
    label: 'ระดับอก',
    range: '100 – 120 ซม.',
    depthApprox: 110,
    severity: 3,
    emoji: '👕',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    darkBadgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800',
    desc: 'น้ำท่วมสูงระดับหน้าอก มิดกระโปรงหน้ารถยนต์',
    traffic: '🚫 วิกฤตสูงสุด (>50 ซม.)! รถทุกชนิดห้ามผ่าน สัญจรได้เฉพาะเรือท้องแบนยกสูง',
    guidance: 'อพยพผู้ป่วยติดเตียงและผู้สูงอายุทันที ประสานสายด่วน ปภ. 1784'
  },
  {
    id: 'neck',
    label: 'ระดับคอ',
    range: '> 140 ซม.',
    depthApprox: 150,
    severity: 3,
    emoji: '🧣',
    badgeClass: 'bg-red-100 text-red-900 border-red-400 font-extrabold',
    darkBadgeClass: 'bg-red-950 text-red-200 border-red-700 font-extrabold',
    desc: 'ระดับน้ำท่วมถึงคอ ท่วมมิดหลังคารถยนต์และชั้นหนึ่งของอาคาร',
    traffic: '🚨 ภัยพิบัติฉุกเฉินระดับร้ายแรง (>50 ซม.) ห้ามลงเล่นน้ำหรือเดินลุยน้ำเด็ดขาด',
    guidance: 'ติดต่อหน่วยกู้ภัยร่วมกตัญญู 02-751-0951 หรือ ปภ. 1784 เพื่อเข้าช่วยเหลือด่วน'
  }
];

// Hail Sizes Standard
export const HAIL_SIZES = [
  {
    id: 'small',
    label: 'เม็ดเล็ก (< 1 ซม.)',
    sub: 'เท่าเม็ดถั่ว / ลูกแก้ว',
    severity: 1,
    emoji: '🧊',
    desc: 'ลูกเห็บตกประปราย เม็ดเล็ก ยังไม่ส่งผลต่อหลังคาหรือกระจกรถยนต์',
    traffic: '⚠️ ถนนลื่นจากเม็ดน้ำแข็งและน้ำฝน ชะลอความเร็ว ไม่เบรกกะทันหัน',
    guidance: 'ระวังการลื่นไถล ชะลอความเร็ว เปิดไฟหน้ารถ'
  },
  {
    id: 'medium',
    label: 'เม็ดกลาง (1 – 2.5 ซม.)',
    sub: 'เท่าเหรียญ 5 - 10 บาท',
    severity: 2,
    emoji: '🧊',
    desc: 'ลูกเห็บตกหนาแน่น หลังคาสังกะสีหรือกันสาดพลาสติกอาจแตกร้าว กระจกรถเสี่ยงกระเทาะ',
    traffic: '🟠 สภาพอากาศรุนแรง ชะลอความเร็ว จอดหลบในที่ร่มหรือใต้ชายคาที่ปลอดภัย',
    guidance: 'ห้ามจอดใต้ต้นไม้ใหญ่หรือป้ายโฆษณาที่เสี่ยงหักโค่น'
  },
  {
    id: 'large',
    label: 'เม็ดใหญ่ (> 2.5 ซม.)',
    sub: 'เท่าลูกปิงปอง / มะนาว / ลูกกอล์ฟ',
    severity: 3,
    emoji: '💥',
    desc: 'วิกฤตพายุลูกเห็บรุนแรง! หลังคาบ้านทะลุ กระจกรถยนต์แตกร้าว เป็นอันตรายต่อศีรษะ',
    traffic: '🔴 วิกฤตพายุลูกเห็บรุนแรง ห้ามขับขี่หรืออยู่นอกอาคารเด็ดขาด',
    guidance: 'หลบเข้าในอาคารปูนแข็งแรงทันที ระวังเศษกระจกแตกและกระแสลมกระโชกแรง'
  }
];

const DISTRICT_DEFAULT_COORDS = {
  'เมืองสมุทรปราการ': { lat: '13.5991', lng: '100.6012' },
  'บางพลี': { lat: '13.6052', lng: '100.7088' },
  'พระประแดง': { lat: '13.6550', lng: '100.5340' },
  'บางบ่อ': { lat: '13.5875', lng: '100.8250' },
  'บางเสาธง': { lat: '13.5850', lng: '100.8200' },
  'พระสมุทรเจดีย์': { lat: '13.5412', lng: '100.5845' }
};

export default function CitizenReportModal({ 
  isOpen, 
  onClose, 
  onSubmitReport, 
  onStartPickOnMap,
  pickedCoords,
  onFlyToCoords,
  theme = 'light' 
}) {
  const isDark = theme === 'dark';

  // Hazard Type: 'flood' | 'hail'
  const [hazardType, setHazardType] = useState('flood');

  // Form States
  const [selectedLevel, setSelectedLevel] = useState('knee');
  const [selectedHail, setSelectedHail] = useState('medium');
  const [locationName, setLocationName] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [district, setDistrict] = useState('เมืองสมุทรปราการ');
  const [lat, setLat] = useState('13.5991');
  const [lng, setLng] = useState('100.6012');
  const [hasCustomPicked, setHasCustomPicked] = useState(false);
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const fileInputRef = useRef(null);

  // Sync picked coordinates from map & auto-detect district
  useEffect(() => {
    if (pickedCoords && pickedCoords.lat && pickedCoords.lng) {
      setLat(Number(pickedCoords.lat).toFixed(5));
      setLng(Number(pickedCoords.lng).toFixed(5));
      setHasCustomPicked(true);
      const detected = detectDistrictForCoordinates(pickedCoords.lat, pickedCoords.lng);
      if (detected) {
        setDistrict(detected);
      }
    }
  }, [pickedCoords]);

  const handleDistrictChange = (newDistrict) => {
    setDistrict(newDistrict);
    if (!hasCustomPicked && DISTRICT_DEFAULT_COORDS[newDistrict]) {
      setLat(DISTRICT_DEFAULT_COORDS[newDistrict].lat);
      setLng(DISTRICT_DEFAULT_COORDS[newDistrict].lng);
    }
  };

  // Real-time Coordinate Precision Validation against Samut Prakan 6 Districts
  const coordValidation = useMemo(() => {
    if (!lat || !lng) return null;
    return validateCoordinatePrecision(lat, lng, district);
  }, [lat, lng, district]);

  if (!isOpen) return null;

  // Handle Photo Selection & Compression via Canvas
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 400;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.55);
        setPhotoPreview(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Get GPS Location & Auto-detect District
  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError("เบราว์เซอร์ไม่รองรับ GPS");
      return;
    }
    setIsLocatingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const cLat = pos.coords.latitude.toFixed(5);
        const cLng = pos.coords.longitude.toFixed(5);
        setLat(cLat);
        setLng(cLng);
        setHasCustomPicked(true);
        const detected = detectDistrictForCoordinates(parseFloat(cLat), parseFloat(cLng));
        if (detected) {
          setDistrict(detected);
        }
        setIsLocatingGps(false);
        if (onFlyToCoords) {
          onFlyToCoords(parseFloat(cLat), parseFloat(cLng));
        }
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsError("ไม่สามารถดึงพิกัด GPS ได้ กรุณาอนุญาตตำแหน่งบนเบราว์เซอร์");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Handle Form Submission with Boundary & Precision Guard
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!locationName.trim()) {
      alert(hazardType === 'hail' ? "กรุณาระบุชื่อถนนหรือจุดสังเกตบริเวณลูกเห็บตก" : "กรุณาระบุชื่อถนนหรือจุดสังเกตบริเวณน้ำท่วม");
      return;
    }

    let pLat = parseFloat(lat);
    let pLng = parseFloat(lng);
    if (isNaN(pLat) || isNaN(pLng)) {
      const fallback = DISTRICT_DEFAULT_COORDS[district] || DISTRICT_DEFAULT_COORDS['เมืองสมุทรปราการ'];
      pLat = parseFloat(fallback.lat);
      pLng = parseFloat(fallback.lng);
    }

    if (coordValidation && !coordValidation.isValid) {
      alert(`⚠️ พิกัดที่ระบุอยู่นอกพื้นที่ 6 อำเภอของจังหวัดสมุทรปราการ\n\nระบบเปิดรับข้อมูลและรายงานเฉพาะในขอบเขตจังหวัดสมุทรปราการเท่านั้น เพื่อรักษาความถูกต้องของข้อมูลตามขอบเขตพื้นที่จริง\n\nกรุณาใช้ปุ่ม "ใช้พิกัดปัจจุบัน (GPS)" หรือ "แตะเลือกจุดบนแผนที่" เพื่อเลือกจุดที่ถูกต้องครับ`);
      return;
    }

    setIsSubmitting(true);
    
    let newReport;
    if (hazardType === 'hail') {
      const hailMeta = HAIL_SIZES.find(h => h.id === selectedHail) || HAIL_SIZES[1];
      newReport = {
        id: 'citizen-' + Date.now(),
        isCitizenReport: true,
        hazardType: 'hail',
        name: locationName.trim(),
        subdistrict: subdistrict.trim() || 'แจ้งโดยประชาชน',
        district: district,
        lat: pLat,
        lng: pLng,
        hailSize: selectedHail,
        hailSizeLabel: hailMeta.label,
        depthCm: 0,
        depthRange: hailMeta.sub,
        level: hailMeta.severity,
        statusLabel: `🧊 ลูกเห็บ: ${hailMeta.label}`,
        trafficStatus: hailMeta.traffic,
        cause: notes.trim() || 'พายุฝนฟ้าคะนองและลูกเห็บตก รายงานโดยประชาชนในพื้นที่',
        officialGuidance: hailMeta.guidance,
        source: 'รายงานลูกเห็บจากประชาชน (Crowdsource)',
        phone: '1784',
        photoUrl: photoPreview,
        isApproved: false,
        isResolved: false,
        reportedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        timestamp: Date.now()
      };
    } else {
      const levelMeta = BODY_WATER_LEVELS.find(l => l.id === selectedLevel) || BODY_WATER_LEVELS[1];
      newReport = {
        id: 'citizen-' + Date.now(),
        isCitizenReport: true,
        hazardType: 'flood',
        name: locationName.trim(),
        subdistrict: subdistrict.trim() || 'แจ้งโดยประชาชน',
        district: district,
        lat: pLat,
        lng: pLng,
        bodyLevel: selectedLevel,
        bodyLevelLabel: levelMeta.label,
        depthCm: levelMeta.depthApprox,
        depthRange: levelMeta.range,
        level: levelMeta.severity,
        statusLabel: `ระดับ${levelMeta.label}`,
        trafficStatus: levelMeta.traffic,
        cause: notes.trim() || 'น้ำท่วมขังรายงานโดยประชาชนในพื้นที่',
        officialGuidance: levelMeta.guidance,
        source: 'รายงานน้ำท่วมจากประชาชน (Crowdsource)',
        phone: '1784',
        photoUrl: photoPreview,
        isApproved: false,
        isResolved: false,
        reportedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        timestamp: Date.now()
      };
    }

    onSubmitReport(newReport);
    setIsSubmitting(false);
    alert(hazardType === 'hail'
      ? "✅ ส่งข้อมูลรายงานลูกเห็บตกเรียบร้อยแล้ว!\n\nข้อมูลของคุณถูกส่งต่อไปยังระบบผู้ดูแลระบบ (Admin) เพื่อตรวจสอบความถูกต้องก่อนแสดงผลบนแผนที่สาธารณะ\n\nขอบคุณที่ร่วมแจ้งข้อมูลสถานการณ์เพื่อความปลอดภัยของผู้สัญจรครับ"
      : "✅ ส่งข้อมูลรายงานน้ำท่วมเรียบร้อยแล้ว!\n\nข้อมูลของคุณถูกส่งต่อไปยังระบบผู้ดูแลระบบ (Admin) เพื่อตรวจสอบความถูกต้องก่อนแสดงผลบนแผนที่สาธารณะ\n\nขอบคุณที่ร่วมแจ้งข้อมูลสถานการณ์เพื่อความปลอดภัยของผู้สัญจรครับ");
    onClose();
  };

  const selectedFloodMeta = BODY_WATER_LEVELS.find(l => l.id === selectedLevel) || BODY_WATER_LEVELS[1];
  const selectedHailMeta = HAIL_SIZES.find(h => h.id === selectedHail) || HAIL_SIZES[1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 smooth-backdrop">
      <div className={`w-full max-w-xl border rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Top Accent Gradient */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${
          hazardType === 'hail' 
            ? 'from-cyan-500 via-blue-500 to-indigo-500' 
            : 'from-violet-600 via-indigo-500 to-cyan-500'
        }`}></div>

        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-inner ${
              hazardType === 'hail'
                ? (isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800' : 'bg-cyan-50 text-cyan-600 border border-cyan-200')
                : (isDark ? 'bg-violet-950/80 text-violet-400 border border-violet-800' : 'bg-violet-50 text-violet-600 border border-violet-200')
            }`}>
              {hazardType === 'hail' ? <CloudHail className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {hazardType === 'hail' ? 'แจ้งเตือนพายุลูกเห็บ' : 'แจ้งเตือนน้ำท่วม'}
              </h2>
              <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ร่วมแจ้งข้อมูลจุดน้ำท่วมเพื่อความปลอดภัยในการสัญจรใน 6 อำเภอสมุทรปราการ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* HAZARD TYPE SWITCHER: FLOOD vs HAIL */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              ประเภทภัยพิบัติ / เหตุการณ์สภาพอากาศ
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHazardType('flood')}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  hazardType === 'flood'
                    ? (isDark ? 'bg-violet-950/90 border-violet-500 text-violet-200 ring-2 ring-violet-500/40 shadow-sm' : 'bg-violet-50 border-violet-500 text-violet-900 ring-2 ring-violet-200 shadow-sm')
                    : (isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                }`}
              >
                <CloudRain className="w-4 h-4 text-blue-500" />
                <span>🌊 น้ำท่วมขังบนถนน</span>
              </button>

              <button
                type="button"
                onClick={() => setHazardType('hail')}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  hazardType === 'hail'
                    ? (isDark ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/40 shadow-sm' : 'bg-cyan-50 border-cyan-500 text-cyan-900 ring-2 ring-cyan-200 shadow-sm')
                    : (isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                }`}
              >
                <CloudHail className="w-4 h-4 text-cyan-400" />
                <span>🧊 พายุลูกเห็บตก</span>
              </button>
            </div>
          </div>

          {/* 1. SEVERITY / LEVEL SELECTION */}
          {hazardType === 'flood' ? (
            /* FLOOD BODY LEVELS */
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                <span>1. ประเมินระดับความสูงของน้ำ (5-20, 21-50, &gt;50 ซม.) *</span>
                <span className="text-[11px] font-semibold text-violet-500">
                  {selectedFloodMeta.emoji} {selectedFloodMeta.label} ({selectedFloodMeta.range})
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {BODY_WATER_LEVELS.map(level => {
                  const isSelected = selectedLevel === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setSelectedLevel(level.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 shadow-xs ${
                        isSelected
                          ? (isDark 
                              ? 'bg-violet-950/80 border-violet-500 text-white ring-2 ring-violet-500/50' 
                              : 'bg-violet-50 border-violet-500 text-violet-900 ring-2 ring-violet-200')
                          : (isDark 
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                      }`}
                    >
                      <span className="text-xl sm:text-2xl">{level.emoji}</span>
                      <span className="font-bold text-xs truncate">{level.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isDark ? 'text-slate-400 bg-slate-900' : 'text-slate-500 bg-slate-100'
                      }`}>
                        {level.range}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Level guidance callout */}
              <div className={`mt-2 p-2.5 rounded-xl border text-xs leading-snug flex items-start gap-2 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  selectedFloodMeta.severity === 3 ? 'text-rose-500' : selectedFloodMeta.severity === 2 ? 'text-amber-500' : 'text-emerald-500'
                }`} />
                <div>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedFloodMeta.desc}</strong>
                  <p className="mt-0.5 text-[11px] text-slate-500">{selectedFloodMeta.traffic}</p>
                </div>
              </div>
            </div>
          ) : (
            /* HAIL SIZES */
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                <span>1. ประเมินขนาดเม็ดลูกเห็บ *</span>
                <span className="text-[11px] font-semibold text-cyan-500">
                  {selectedHailMeta.emoji} {selectedHailMeta.label}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {HAIL_SIZES.map(hail => {
                  const isSelected = selectedHail === hail.id;
                  return (
                    <button
                      key={hail.id}
                      type="button"
                      onClick={() => setSelectedHail(hail.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 shadow-xs ${
                        isSelected
                          ? (isDark 
                              ? 'bg-cyan-950/80 border-cyan-500 text-white ring-2 ring-cyan-500/50' 
                              : 'bg-cyan-50 border-cyan-500 text-cyan-900 ring-2 ring-cyan-200')
                          : (isDark 
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{hail.emoji}</span>
                        <div>
                          <span className="font-bold text-xs block">{hail.label}</span>
                          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{hail.sub}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hail Guidance Callout */}
              <div className={`mt-2 p-2.5 rounded-xl border text-xs leading-snug flex items-start gap-2 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  selectedHailMeta.severity === 3 ? 'text-rose-500' : selectedHailMeta.severity === 2 ? 'text-amber-500' : 'text-cyan-500'
                }`} />
                <div>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>{selectedHailMeta.desc}</strong>
                  <p className="mt-0.5 text-[11px] text-slate-500">{selectedHailMeta.traffic}</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PHOTO UPLOAD (OPTIONAL) */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <span>2. แนบรูปถ่ายสถานการณ์จริง (ไม่บังคับ)</span>
              <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                รองรับกล้องมือถือ / ไฟล์ภาพ
              </span>
            </label>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoSelect} 
              accept="image/*" 
              className="hidden" 
            />

            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md max-h-48 group">
                <img 
                  src={photoPreview} 
                  alt="ตัวอย่างรูปถ่ายสถานการณ์" 
                  className="w-full h-44 object-cover" 
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-800 font-semibold text-xs shadow-md cursor-pointer hover:bg-slate-100"
                  >
                    เปลี่ยนรูป
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-md cursor-pointer hover:bg-rose-500"
                  >
                    ลบรูป
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                  title="ลบรูปภาพ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDark 
                    ? 'border-slate-700 hover:border-violet-400 bg-slate-850/50 hover:bg-slate-800' 
                    : 'border-slate-300 hover:border-violet-500 bg-slate-50 hover:bg-violet-50/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
                  isDark ? 'bg-slate-800 text-violet-400' : 'bg-white text-violet-600 border border-slate-200'
                }`}>
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    กดเพื่อถ่ายภาพ หรือเลือกรูปจากมือถือ
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    (หากไม่มีรูป สามารถข้ามขั้นตอนนี้ได้เลยครับ)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. LOCATION & COORDINATES SELECTION */}
          <div className="space-y-3">
            <label className={`block text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              3. ระบุสถานที่ตั้ง / ถนน *
            </label>

            {/* Quick Actions Bar for Picking Location */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onStartPickOnMap();
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="ย่อหน้าต่างแล้วแตะบนแผนที่เพื่อเลือกจุด"
              >
                <MapPin className="w-4 h-4" />
                <span>แตะเลือกจุดบนแผนที่</span>
              </button>

              <button
                type="button"
                onClick={handleGetGps}
                disabled={isLocatingGps}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="ดึงพิกัดจาก GPS เครื่องของคุณ"
              >
                <LocateFixed className={`w-4 h-4 ${isLocatingGps ? 'animate-spin text-violet-400' : 'text-blue-500'}`} />
                <span>{isLocatingGps ? 'กำลังค้นหา GPS...' : 'ใช้พิกัดปัจจุบัน (GPS)'}</span>
              </button>
            </div>

            {gpsError && (
              <p className="text-[11px] text-rose-500 font-medium">{gpsError}</p>
            )}

            {/* Road/Location Name & District Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <span className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  ชื่อถนน / ซอย / จุดสังเกต *
                </span>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={hazardType === 'hail' ? "เช่น ตลาดปากน้ำ, ซอยมังกรขันดี" : "เช่น ซอยวัดด่านสำโรง, ถนนกิ่งแก้ว หน้าปั๊ม ปตท."}
                  className={`w-full rounded-xl px-3 py-2 text-xs sm:text-sm border focus:outline-none transition-colors ${
                    isDark 
                      ? 'border-slate-700 focus:border-violet-400' 
                      : 'border-slate-300 focus:border-violet-500'
                  }`}
                  style={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}
                />
              </div>

              <div>
                <span className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  อำเภอ *
                </span>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs sm:text-sm border focus:outline-none transition-colors font-medium ${
                    isDark 
                      ? 'border-slate-700 focus:border-violet-400' 
                      : 'border-slate-300 focus:border-violet-500'
                  }`}
                  style={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}
                >
                  {DISTRICTS.filter(d => d !== "ทั้งหมด").map(d => (
                    <option key={d} value={d}>อ.{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Friendly Location Indicator (No Raw Latitude/Longitude Shown) */}
            {hasCustomPicked && (
              <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                isDark ? 'bg-violet-950/40 border-violet-800 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">บันทึกตำแหน่งบนแผนที่แล้ว (อ.{district})</span>
                </div>
                {onFlyToCoords && (
                  <button
                    type="button"
                    onClick={() => onFlyToCoords(parseFloat(lat), parseFloat(lng))}
                    className="text-[11px] underline font-bold cursor-pointer hover:opacity-80"
                  >
                    ดูจุดบนแผนที่
                  </button>
                )}
              </div>
            )}

            {/* Additional Notes */}
            <div>
              <span className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                ข้อสังเกตเพิ่มเติม / คำเตือนสำหรับผู้สัญจร (ไม่บังคับ)
              </span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={hazardType === 'hail' ? "เช่น ลูกเห็บตกหนัก ลมกระโชกแรง มีกิ่งไม้หักขวางถนน..." : "เช่น มีรถจอดเสียเลนซ้าย, ฝาท่อเปิดอยู่, น้ำไหลเชี่ยวมาก..."}
                className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none transition-colors"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  color: isDark ? '#f8fafc' : '#0f172a'
                }}
              ></textarea>
            </div>

          </div>

          {/* Modal Footer Buttons */}
          <div className={`pt-3 border-t flex items-center justify-between gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-violet-600/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{hazardType === 'hail' ? 'แจ้งเตือนลูกเห็บ' : 'แจ้งเตือนน้ำท่วม'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
