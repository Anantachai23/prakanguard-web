import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  EyeOff, 
  MapPin, 
  AlertTriangle, 
  FileCheck, 
  Lock, 
  CheckCircle2, 
  Building2, 
  Scale, 
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { playCloseSound, playClickSound, playTabSound } from '../services/soundEffects';
import { 
  CivicCrest, 
  CivicShield, 
  CivicStandards, 
  CivicCompass, 
  CivicWeather, 
  CivicEmergencyPhone 
} from './CivicIcons';

export default function PrivacyPolicyModal({ 
  isOpen, 
  onClose, 
  theme = 'light' 
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'privacy', 'sources', 'safety'

  const handleClose = () => {
    try { playCloseSound(); } catch (e) {}
    if (onClose) onClose();
  };

  const handleTabChange = (tabId) => {
    try { playTabSound(); } catch (e) {}
    setActiveTab(tabId);
  };

  // 4 สาระสำคัญที่ประชาชนควรรู้ (Key Highlights)
  const keyHighlights = [
    {
      icon: EyeOff,
      iconColor: isDark ? 'text-cyan-400' : 'text-blue-600',
      bgColor: isDark ? 'bg-cyan-950/40 border-cyan-800/60' : 'bg-blue-50/80 border-blue-200/80',
      title: 'ไม่เก็บข้อมูลระบุตัวตน (Zero PII)',
      description: 'ระบบไม่ขอ ไม่เก็บชื่อ-นามสกุล เลขบัตรประชาชน หรือเบอร์โทรศัพท์ของผู้เข้าชมทั่วไป เข้าใช้งานได้ทันทีโดยไม่ต้องลงทะเบียน'
    },
    {
      icon: CivicCompass,
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
      bgColor: isDark ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-emerald-50/80 border-emerald-200/80',
      title: 'พิกัด GPS ประมวลผลบนอุปกรณ์',
      description: 'คำนวณระยะห่างจุดเสี่ยงภายในเบราว์เซอร์ของท่านเท่านั้น ไม่มีการบันทึกประวัติการเดินทางหรือจัดเก็บเส้นทางลงเซิร์ฟเวอร์'
    },
    {
      icon: Scale,
      iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
      bgColor: isDark ? 'bg-amber-950/40 border-amber-800/60' : 'bg-amber-50/80 border-amber-200/80',
      title: 'บริการสาธารณะ ไม่แสวงหากำไร',
      description: 'จัดทำโดยกลุ่มนักเรียนเพื่อสาธารณประโยชน์ ให้บริการฟรีตลอด 24 ชั่วโมง ไม่มีโฆษณา และไม่มีการส่งต่อข้อมูลเชิงพาณิชย์'
    },
    {
      icon: AlertTriangle,
      iconColor: isDark ? 'text-rose-400' : 'text-rose-600',
      bgColor: isDark ? 'bg-rose-950/40 border-rose-800/60' : 'bg-rose-50/80 border-rose-200/80',
      title: 'ข้อมูลเพื่อการวางแผนเบื้องต้น',
      description: 'ระดับน้ำใช้ประกอบการตัดสินใจสัญจร ในสถานการณ์จริงโปรดปฏิบัติตามคำสั่งของเจ้าหน้าที่ตำรวจและ ปภ. ประจำจุดอย่างเคร่งครัด'
    }
  ];

  // หมวดข้อบังคับทางการทั้ง ๕ หมวด
  const officialSections = [
    {
      id: 'purpose',
      category: 'privacy',
      num: 'หมวดที่ ๑',
      title: 'เจตนารมณ์และวัตถุประสงค์แห่งการให้บริการ',
      subtitle: 'Project Purpose & Public Service Mandate',
      content: (
        <div className="space-y-2.5">
          <p className="leading-relaxed">
            ระบบสารสนเทศเฝ้าระวังอุทกภัย <strong>PrakanGuard</strong> พัฒนาขึ้นโดยกลุ่มนักเรียน เพื่อเป็นเครื่องมือดิจิทัลสาธารณประโยชน์ในการติดตามสถานการณ์น้ำท่วมขังบนผิวจราจรและน้ำทะเลหนุนในพื้นที่ 6 อำเภอของจังหวัดสมุทรปราการ
          </p>
          <div className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
            isDark ? 'bg-slate-850/60 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200/80 text-slate-700'
          }`}>
            <div className="font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>เป้าหมายหลักของโครงการ:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>ให้ประชาชนเข้าถึงข้อมูลระดับน้ำและเรดาร์ฝนแบบเรียลไทม์ได้ฟรีตลอด 24 ชั่วโมง</li>
              <li>ช่วยวางแผนเส้นทางสัญจรเพื่อหลีกเลี่ยงถนนที่มีน้ำท่วมขังสูงเกินความปลอดภัยของยานพาหนะ</li>
              <li>ลดความเสียหายต่อชีวิต ยานพาหนะ และทรัพย์สินของประชาชนในเขตจังหวัดสมุทรปราการ</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'privacy',
      category: 'privacy',
      num: 'หมวดที่ ๒',
      title: 'การคุ้มครองข้อมูลส่วนบุคคลตามกฎหมาย (PDPA Compliance)',
      subtitle: 'Personal Data Protection Act Compliance',
      content: (
        <div className="space-y-3">
          <p className="leading-relaxed">
            ระบบ PrakanGuard ให้ความสำคัญสูงสุดต่อสิทธิความเป็นส่วนตัวของผู้ใช้งาน โดยออกแบบระบบตามหลักการ <em>Privacy by Design</em> และปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (PDPA) อย่างเคร่งครัด ดังนี้:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-blue-600 dark:text-cyan-300">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>การไม่เก็บข้อมูลระบุตัวตน (No PII)</span>
              </div>
              <p className="text-[11.5px] leading-relaxed opacity-90">
                ระบบไม่ขอและไม่จัดเก็บข้อมูลส่วนบุคคล เช่น ชื่อ นามสกุล เลขประจำตัวประชาชน อีเมล หรือหมายเลขโทรศัพท์ของผู้เข้าชมทั่วไป
              </p>
            </div>

            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-emerald-600 dark:text-emerald-300">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>พิกัดตำแหน่งทางภูมิศาสตร์ (GPS)</span>
              </div>
              <p className="text-[11.5px] leading-relaxed opacity-90">
                ระบบร้องขอพิกัดเฉพาะเมื่อผู้ใช้กดอนุญาต โดยการประมวลผลระยะทางกระทำบนเบราว์เซอร์ของผู้ใช้เท่านั้น ไม่มีการส่งบันทึกประวัติการเดินทางกลับสู่ฐานข้อมูล
              </p>
            </div>

            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-amber-600 dark:text-amber-300">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>รายงานสถานการณ์ภาคประชาชน</span>
              </div>
              <p className="text-[11.5px] leading-relaxed opacity-90">
                ข้อมูลภาพถ่ายและระดับน้ำที่แจ้งเหตุ จะถูกใช้เพื่อวัตถุประสงค์ในการเตือนภัยสาธารณะเท่านั้น และได้รับการคัดกรองโดยผู้ดูแลระบบก่อนเผยแพร่
              </p>
            </div>

            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-slate-850/80 border-slate-750' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-purple-600 dark:text-purple-300">
                <Lock className="w-4 h-4 shrink-0" />
                <span>ความปลอดภัยในการรับส่งข้อมูล</span>
              </div>
              <p className="text-[11.5px] leading-relaxed opacity-90">
                การรับส่งข้อมูลทั้งหมดผ่านการเข้ารหัสลับมาตรฐานสากล HTTPS / TLS 1.3 และระบบความปลอดภัยอัตโนมัติ 50 รายการ
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sources',
      category: 'sources',
      num: 'หมวดที่ ๓',
      title: 'แหล่งข้อมูลอ้างอิงและการบูรณาการระบบ',
      subtitle: 'Authoritative Sources & Data Integration',
      content: (
        <div className="space-y-3">
          <p className="leading-relaxed">
            ข้อมูลที่แสดงในระบบ PrakanGuard เชื่อมโยงและอ้างอิงจากหน่วยงานภาครัฐและแบบจำลองมาตรฐาน เพื่อให้ประชาชนได้รับข้อมูลที่มีความน่าเชื่อถือสูง:
          </p>

          <div className="space-y-2">
            <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-start gap-3 ${
              isDark ? 'bg-slate-850/60 border-slate-750' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <CivicWeather className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  แบบจำลองอุตุนิยมวิทยา & เรดาร์ตรวจอากาศ
                </div>
                <div className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  เชื่อมโยงข้อมูลพยากรณ์ฝนรายชั่วโมงจาก Open-Meteo API และข้อมูลเรดาร์ตรวจสภาพอากาศ กรมอุตุนิยมวิทยา
                </div>
              </div>
            </div>

            <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-start gap-3 ${
              isDark ? 'bg-slate-850/60 border-slate-750' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <CivicStandards className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  จุดเฝ้าระวังผิวจราจรบนโครงข่ายทางหลวง
                </div>
                <div className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  อ้างอิงข้อมูลสถิติจุดน้ำท่วมซ้ำซากจาก แขวงทางหลวงสมุทรปราการ และระบบโทรมาตรระดับน้ำแม่น้ำเจ้าพระยา
                </div>
              </div>
            </div>

            <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-start gap-3 ${
              isDark ? 'bg-slate-850/60 border-slate-750' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <CivicEmergencyPhone className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  ศูนย์ป้องกันและบรรเทาสาธารณภัย (ปภ. สายด่วน 1784)
                </div>
                <div className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  อ้างอิงแนวทางการเผชิญเหตุและการแจ้งเตือนภัยสาธารณะ พร้อมเชื่อมโยงการแจ้งเรื่องสู่ระบบ Traffy Fondue
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'safety',
      category: 'safety',
      num: 'หมวดที่ ๔',
      title: 'ข้อจำกัดความรับผิดชอบและคู่มือความปลอดภัยการสัญจร',
      subtitle: 'Public Safety Disclaimer & Traffic Guidance',
      content: (
        <div className="space-y-3">
          <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
            isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <div className="text-[11.5px] leading-relaxed">
              <strong>ข้อควรระวังสำคัญ:</strong> ระดับน้ำที่แสดงในระบบเป็นค่าประมาณการ ณ เวลาที่ตรวจวัด สภาพน้ำท่วมจริงอาจเปลี่ยนแปลงอย่างรวดเร็วตามปริมาณน้ำฝนสะสม อัตราการระบายน้ำของเครื่องสูบน้ำ และระดับน้ำทะเลหนุน
            </div>
          </div>

          <div className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
            isDark ? 'bg-slate-850/60 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">
              คำแนะนำความปลอดภัยสำหรับผู้ขับขี่:
            </div>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span><strong>ระดับ 1 (5 - 20 ซม.):</strong> น้ำรอระบายท่วมผิวจราจร รถทุกชนิดสามารถผ่านได้ ควรชะลอความเร็วเพื่อป้องกันน้ำกระเด็น</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span><strong>ระดับ 2 (21 - 50 ซม.):</strong> ท่วมปานกลางระดับครึ่งล้อ รถเก๋งและรถโหลดเตี้ยมีความเสี่ยงสูง ควรเลี่ยงเส้นทาง</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span><strong>ระดับ 3 (มากกว่า 50 ซม.):</strong> วิกฤต ห้ามรถเล็กสัญจรผ่านโดยเด็ดขาด ผ่านได้เฉพาะรถยกสูงและรถบรรทุกใหญ่</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      category: 'safety',
      num: 'หมวดที่ ๕',
      title: 'ความมั่นคงปลอดภัยสารสนเทศและสิทธิ์การเข้าถึง',
      subtitle: 'Information Security & Access Control',
      content: (
        <div className="space-y-2.5">
          <p className="leading-relaxed">
            ระบบ PrakanGuard มีการรักษาความมั่นคงปลอดภัยสารสนเทศตามมาตรฐานสากล เพื่อป้องกันการแทรกแซงข้อมูลและรักษาความถูกต้องแม่นยำของระบบเตือนภัย:
          </p>
          <div className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-1 ${
            isDark ? 'bg-slate-850/60 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span>การจำกัดสิทธิ์ผู้ดูแลระบบ (Admin Control):</span>
            </div>
            <p className="text-[11.5px] leading-relaxed">
              สงวนสิทธิ์การเข้าถึงและจัดการฐานข้อมูลสถานการณ์น้ำเฉพาะเจ้าหน้าที่ผู้ดูแลระบบที่ผ่านการยืนยันตัวตนระดับความปลอดภัยสูง (Cryptographic Session Verification) เท่านั้น เพื่อป้องกันข้อมูลบิดเบือนต่อสาธารณะ
            </p>
          </div>
        </div>
      )
    }
  ];

  // คัดกรองตาม Tab ที่เลือก
  const filteredSections = activeTab === 'all' 
    ? officialSections 
    : officialSections.filter(s => s.category === activeTab);

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 py-6 sm:py-8 overflow-y-auto overscroll-contain select-none bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className={`w-full max-w-[calc(100vw-20px)] xs:max-w-[460px] sm:max-w-2xl my-auto m-auto max-h-[85vh] sm:max-h-[88vh] shrink-0 border rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isDark 
            ? 'bg-slate-900/98 border-slate-800 text-slate-100 shadow-cyan-950/20' 
            : 'bg-white border-slate-200/90 text-slate-900 shadow-slate-900/10'
        }`}
      >
        {/* Top Institutional Header Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-sky-500 to-emerald-500 shrink-0" />

        {/* 1. OFFICIAL HEADER */}
        <div className={`px-4 py-3 sm:px-6 sm:py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/70 border-slate-150'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
              isDark 
                ? 'bg-blue-950/70 border-blue-800/80 text-cyan-400' 
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <CivicCrest className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold border ${
                  isDark ? 'bg-blue-950/60 border-blue-800 text-cyan-300' : 'bg-blue-100/70 border-blue-200 text-blue-800'
                }`}>
                  <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                  เอกสารทางการ • PDPA 2562
                </span>
                <span className="hidden xs:inline-block text-[10px] text-slate-400">• ฉบับปรับปรุง ๒๕๖๙</span>
              </div>
              <h2 className={`text-sm sm:text-base font-bold leading-tight tracking-tight mt-0.5 truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว
              </h2>
              <p className={`text-[11px] leading-tight truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ศูนย์สารสนเทศเฝ้าระวังอุทกภัยจังหวัดสมุทรปราการ (PrakanGuard)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 border active:scale-95 ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
            title="ปิดหน้าต่าง"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. SUB-NAV / QUICK TOPIC SELECTOR (ทำให้ผู้ใช้อ่านแยกหัวข้อได้ง่ายขึ้น) */}
        <div className={`px-4 sm:px-6 py-2 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 ${
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/60 border-slate-200/80'
        }`}>
          {[
            { id: 'all', label: 'ทั้งหมด (5 หมวด)' },
            { id: 'privacy', label: 'การคุ้มครองข้อมูล (PDPA)' },
            { id: 'sources', label: 'แหล่งข้อมูลอ้างอิง' },
            { id: 'safety', label: 'ความปลอดภัย & ความรับผิดชอบ' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? (isDark 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-blue-700 text-white shadow-xs')
                  : (isDark 
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70')
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3. MODAL BODY (อ่านง่าย ลื่นไหล แบ่งสัดส่วนชัดเจน) */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4.5 text-[11.5px] sm:text-xs leading-relaxed space-y-4 custom-scrollbar-thin">

          {/* HIGHLIGHT BANNER: 4 สาระสำคัญที่ประชาชนควรรู้ (ยกหัวข้อสำคัญให้เด่นขึ้นมาทันที) */}
          {activeTab === 'all' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  สาระสำคัญ 4 ข้อที่ประชาชนควรรู้
                </span>
                <span className="text-[10px] text-slate-400">เข้าใจง่ายใน 30 วินาที</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {keyHighlights.map((hl, idx) => {
                  const Icon = hl.icon;
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-2xl border transition-all ${hl.bgColor}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 shrink-0 ${hl.iconColor}`} />
                        <h4 className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {hl.title}
                        </h4>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {hl.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* OFFICIAL REGULATORY SECTIONS (ข้อบังคับและข้อกำหนดทางการ) */}
          <div className="space-y-3 pt-1">
            {filteredSections.map((sec) => (
              <div 
                key={sec.id}
                className={`p-3.5 sm:p-4 rounded-3xl border transition-all ${
                  isDark 
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' 
                    : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Section Header */}
                <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                        isDark 
                          ? 'bg-blue-950/70 text-cyan-300 border-blue-800' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {sec.num}
                      </span>
                      <h3 className={`font-bold text-[12.5px] sm:text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {sec.title}
                      </h3>
                    </div>
                    <p className={`text-[10px] mt-0.5 ml-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {sec.subtitle}
                    </p>
                  </div>
                </div>

                {/* Section Content */}
                <div className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {sec.content}
                </div>
              </div>
            ))}
          </div>

          {/* OFFICIAL VERIFICATION STAMP & SIGN-OFF (ตราประทับรับรองความเป็นทางการ) */}
          <div className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark 
              ? 'bg-slate-950/60 border-slate-800 text-slate-300' 
              : 'bg-slate-50 border-slate-200/80 text-slate-700'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <span className="text-[11px] font-bold block text-slate-900 dark:text-white leading-tight">
                  รับรองมาตรฐานความปลอดภัย & PDPA Compliance
                </span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block">
                  ศูนย์สารสนเทศเฝ้าระวังอุทกภัย PrakanGuard จังหวัดสมุทรปราการ
                </span>
              </div>
            </div>
            <span className="font-mono text-[9.5px] px-2 py-1 rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0">
              พ.ศ. ๒๕๖๙
            </span>
          </div>

        </div>

        {/* 4. OFFICIAL FOOTER ACTION BAR */}
        <div className={`px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between gap-2 shrink-0 border-t ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200/80 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span className="truncate">บริการสาธารณะเพื่อความปลอดภัยของประชาชน</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-all cursor-pointer shrink-0 active:scale-95 shadow-md shadow-blue-700/20 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>รับทราบและเข้าใจข้อกำหนด</span>
          </button>
        </div>

      </div>
    </div>
  );
}
