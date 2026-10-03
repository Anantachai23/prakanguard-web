import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ImageIcon,
  ArrowRight,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { SAMUT_PRAKAN_DISTRICTS_DATA } from '../data/samutPrakanDistricts';
import { detectDistrictForCoordinates } from '../data/samutPrakanBoundary';
import { getDetailedDeviceInfo } from '../services/cloudSyncService';

// 3 ระดับน้ำกระชับชัดเจน ตรงตามเกณฑ์มาตรฐาน (ปกติ, ปานกลาง, วิกฤต)
export const WATER_LEVEL_OPTIONS = [
  {
    id: 'level1',
    level: 1,
    label: 'ปกติ',
    title: 'ระดับ 1: ปกติ',
    range: '5 - 20 ซม.',
    depthCm: 15,
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    selectedClass: 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500',
    desc: 'น้ำท่วมเสมอข้อเท้า ผิวถนนเปียกขัง รถทุกชนิดสัญจรได้'
  },
  {
    id: 'level2',
    level: 2,
    label: 'ปานกลาง',
    title: 'ระดับ 2: ปานกลาง',
    range: '21 - 50 ซม.',
    depthCm: 35,
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    selectedClass: 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500',
    desc: 'น้ำท่วมเสมอหน้าแข้งถึงครึ่งล้อ รถเก๋งและรถเล็กควรเลี่ยง'
  },
  {
    id: 'level3',
    level: 3,
    label: 'วิกฤต',
    title: 'ระดับ 3: วิกฤต',
    range: '> 50 ซม.',
    depthCm: 65,
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    selectedClass: 'ring-2 ring-rose-500 bg-rose-500/10 border-rose-500',
    desc: 'น้ำท่วมมิดล้อรถเก๋ง เข้าห้องโดยสาร ห้ามรถเล็กผ่านเด็ดขาด'
  }
];

export const BODY_WATER_LEVELS = WATER_LEVEL_OPTIONS;

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

  // Form States: อำเภอ, ตำบล, จุดสังเกต, ระดับน้ำ, รูปภาพ, พิกัดแผนที่
  const [district, setDistrict] = useState(SAMUT_PRAKAN_DISTRICTS_DATA[0].name);
  const [subdistrict, setSubdistrict] = useState(SAMUT_PRAKAN_DISTRICTS_DATA[0].subdistricts[0].name);
  const [customCoords, setCustomCoords] = useState(null);
  const [notes, setNotes] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('level2');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Sync picked coordinates from map
  useEffect(() => {
    if (pickedCoords && typeof pickedCoords.lat === 'number' && typeof pickedCoords.lng === 'number') {
      setCustomCoords(pickedCoords);
      const detected = detectDistrictForCoordinates(pickedCoords.lat, pickedCoords.lng);
      if (detected) {
        setDistrict(detected);
        const distObj = SAMUT_PRAKAN_DISTRICTS_DATA.find(d => d.name === detected);
        if (distObj && distObj.subdistricts.length > 0) {
          setSubdistrict(distObj.subdistricts[0].name);
        }
      }
    }
  }, [pickedCoords]);

  // Available subdistricts based on selected district
  const currentDistrictObj = SAMUT_PRAKAN_DISTRICTS_DATA.find(d => d.name === district) || SAMUT_PRAKAN_DISTRICTS_DATA[0];
  const availableSubdistricts = currentDistrictObj.subdistricts;

  // When district changes, update subdistrict automatically
  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setDistrict(newDistrict);
    const targetDistrict = SAMUT_PRAKAN_DISTRICTS_DATA.find(d => d.name === newDistrict);
    if (targetDistrict && targetDistrict.subdistricts.length > 0) {
      setSubdistrict(targetDistrict.subdistricts[0].name);
    } else {
      setSubdistrict('');
    }
  };

  // Image Upload Handler
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 12MB
    if (file.size > 12 * 1024 * 1024) {
      alert("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (กรุณาเลือกรูปขนาดไม่เกิน 12 MB)");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setPhotoPreview(uploadEvent.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!notes.trim()) {
      alert("กรุณากรอกหมายเหตุหรือจุดที่สังเกต เช่น ชื่อถนน หรือหน้าปากซอย");
      return;
    }

    setIsSubmitting(true);

    const levelObj = WATER_LEVEL_OPTIONS.find(l => l.id === selectedLevelId) || WATER_LEVEL_OPTIONS[1];
    const subdistrictObj = availableSubdistricts.find(s => s.name === subdistrict) || {
      lat: currentDistrictObj.center.lat,
      lng: currentDistrictObj.center.lng
    };

    const finalLat = customCoords ? customCoords.lat : subdistrictObj.lat;
    const finalLng = customCoords ? customCoords.lng : subdistrictObj.lng;

    let reporterDistrict = 'ปิด GPS';
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      const detected = detectDistrictForCoordinates(userLocation.lat, userLocation.lng);
      reporterDistrict = detected ? detected.replace(/^อ\./, '').replace(/^อำเภอ/, '').replace('เมืองสมุทรปราการ', 'เมือง').trim() : 'ผู้ใช้อยู่นอกขอบเขตจังหวัด';
    }
    const reporterDevice = getDetailedDeviceInfo();

    const newReport = {
      id: `citizen_${Date.now()}`,
      name: `${notes.trim()}`,
      district: district,
      subdistrict: subdistrict,
      notes: notes.trim(),
      level: levelObj.level,
      severity: levelObj.level,
      bodyLevelLabel: levelObj.label,
      levelLabel: levelObj.label,
      waterLevel: levelObj.label,
      depthCm: levelObj.depthCm,
      depthRange: levelObj.range,
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
      source: `รายงานจากประชาชน [อุปกรณ์: ${reporterDevice} | พิกัดผู้แจ้ง: ${reporterDistrict}]`
    };

    if (onSubmitReport) {
      onSubmitReport(newReport);
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 smooth-backdrop">
      <div className={`w-full sm:max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[72vh] sm:max-h-[82vh] mb-2 sm:mb-0 smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Accent Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 shrink-0"></div>

        {/* Modal Header */}
        <div className={`p-4 sm:p-5 pb-3 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border ${
              isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                แจ้งจุดน้ำท่วม
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ส่งข้อมูลเตือนภัยเพื่อนร่วมทางใน จ.สมุทรปราการ
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Overlay */}
        {submitSuccess ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4 ring-8 ring-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              ส่งข้อมูลเรียบร้อยแล้ว
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              ขอบคุณที่ร่วมรายงานสถานการณ์เพื่อความปลอดภัยของพี่น้องชาวสมุทรปราการ
            </p>
          </div>
        ) : (
          /* Form Content (Clean & Streamlined) */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4">

            {/* Location & Map Point Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  เลือกพื้นที่รายงาน หรือ จิ้มจุดบนแผนที่
                </label>
                {onStartPickOnMap && (
                  <button
                    type="button"
                    onClick={() => onStartPickOnMap('citizen')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
                    title="แตะเพื่อเลือกจุดบนแผนที่โดยตรง"
                  >
                    <MapPin className="w-3.5 h-3.5 text-white" />
                    <span>📍 เลือกจุดบนแผนที่</span>
                  </button>
                )}
              </div>

              {customCoords && (
                <div className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
                  isDark ? 'bg-blue-950/80 border-blue-800 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">
                      ปักหมุดแล้ว: <strong>อ.{district}</strong> ต.{subdistrict} [{customCoords.lat.toFixed(4)}, {customCoords.lng.toFixed(4)}]
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomCoords(null)}
                    className="text-[10px] text-rose-500 font-bold hover:underline shrink-0 cursor-pointer"
                  >
                    ล้างพิกัด
                  </button>
                </div>
              )}
            </div>

            {/* 1. เลือกอำเภอ & ตำบล (Cascading Dropdown) */}
            <div className="grid grid-cols-2 gap-3">
              {/* เลือกอำเภอ */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  เลือกอำเภอ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={handleDistrictChange}
                  className={`w-full px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {SAMUT_PRAKAN_DISTRICTS_DATA.map(d => (
                    <option key={d.name} value={d.name}>
                      อ.{d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* เลือกตำบล (ขึ้นตามอำเภอที่เลือก) */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  เลือกตำบล <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {availableSubdistricts.map(s => (
                    <option key={s.name} value={s.name}>
                      ต.{s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. หมายเหตุจุดที่สังเกต */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                หมายเหตุจุดที่สังเกต <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น ถนนสุขุมวิท หน้าปากซอยวัดด่านสำโรง มุ่งหน้าบางนา"
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm border transition-all outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                required
              />
            </div>

            {/* 3. เลือกระดับน้ำ */}
            <div>
              <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                เลือกระดับน้ำ <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2">
                {WATER_LEVEL_OPTIONS.map((lvl) => {
                  const isSelected = selectedLevelId === lvl.id;
                  return (
                    <div
                      key={lvl.id}
                      onClick={() => setSelectedLevelId(lvl.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? lvl.selectedClass 
                          : (isDark ? 'bg-slate-850/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300')
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected 
                            ? (lvl.color === 'emerald' ? 'border-emerald-500 bg-emerald-500' : lvl.color === 'amber' ? 'border-amber-500 bg-amber-500' : 'border-rose-500 bg-rose-500')
                            : (isDark ? 'border-slate-600' : 'border-slate-400')
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {lvl.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${lvl.badgeClass}`}>
                              {lvl.range}
                            </span>
                          </div>
                          <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {lvl.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. ใส่รูปภาพสถานการณ์จริง */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                ใส่รูปภาพประกอบ (ถ้ามี)
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
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 aspect-video max-h-48 group">
                  <img 
                    src={photoPreview} 
                    alt="รูปภาพน้ำท่วม" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-semibold shadow-lg"
                    >
                      เปลี่ยนรูป
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 rounded-xl bg-rose-600 text-white text-xs shadow-lg"
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
                  className={`w-full py-4 px-3 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isDark 
                      ? 'border-slate-700 hover:border-blue-500 hover:bg-blue-950/20 text-slate-400' 
                      : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-500'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    แตะเพื่อถ่ายรูป หรือ เลือกรูปภาพจากเครื่อง
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (รองรับ JPG, PNG ไม่เกิน 12 MB)
                  </span>
                </button>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งรายงานน้ำท่วมทันที'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
