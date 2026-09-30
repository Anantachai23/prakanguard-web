import React, { useState } from 'react';
import { LEGAL_DATA } from '../data/legalData';
import { useToast } from '../context/ToastContext';
import { 
  ShieldCheck, 
  Building2, 
  MapPin, 
  FileCheck2, 
  Award, 
  Copy, 
  Printer, 
  ExternalLink, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Calendar,
  Sparkles,
  Leaf,
  Building
} from 'lucide-react';

export const RegistrationView = () => {
  const { addToast } = useToast();
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    addToast(`คัดลอก ${fieldName} สำเร็จ: ${text}`, 'success');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const getCertIcon = (iconName) => {
    switch (iconName) {
      case 'Award': return <Award className="w-6 h-6 text-amber-500" />;
      case 'Leaf': return <Leaf className="w-6 h-6 text-emerald-500" />;
      case 'Building': return <Building className="w-6 h-6 text-sky-500" />;
      default: return <ShieldCheck className="w-6 h-6 text-[#C5A880]" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Top Title Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" /> ระบบแสดงข้อมูลการจดทะเบียนและการรับรองอย่างเป็นทางการ (Demo)
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          ข้อมูลการจดทะเบียนโรงแรมและที่อยู่จัดตั้ง
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          เอกสารแสดงความถูกต้องตามกฎหมาย ใบอนุญาตประกอบธุรกิจโรงแรม และที่อยู่จัดตั้งสำนักงานใหญ่ เพื่อความโปร่งใสและสร้างความมั่นใจสูงสุดแก่ผู้เข้าพักทุกท่าน
        </p>
      </div>

      {/* Official Certificate Box Mockup */}
      <div className="bg-white rounded-3xl border-2 border-[#C5A880]/60 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Luxury Gold Watermark / Header */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#C5A880]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0B132B] text-[#C5A880] flex items-center justify-center border-2 border-[#C5A880] shadow-md shrink-0">
              <FileCheck2 className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[#9A7B4F] font-bold">
                KINGDOM OF THAILAND • OFFICIAL HOTEL LICENSE
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                ใบอนุญาตประกอบธุรกิจโรงแรม (แบบ ร.ร. ๒)
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                ออกให้ตามพระราชบัญญัติโรงแรม พ.ศ. 2547
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.print();
                addToast('กำลังพิมพ์สำเนาเอกสารการจดทะเบียน...', 'info');
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์สำเนาเอกสาร</span>
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>สถานะ: ใช้งานได้ปกติ (Active)</span>
            </div>
          </div>
        </div>

        {/* Certificate Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-sm text-slate-700">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs text-slate-400 font-medium">ชื่อสถานประกอบการ (ภาษาไทยและอังกฤษ)</div>
            <div className="font-serif font-bold text-slate-900 text-base">{LEGAL_DATA.hotelName}</div>
            <div className="text-xs text-slate-500">HAPPY HOTEL & RESORT COMPLEX</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>เลขที่ใบอนุญาตประกอบธุรกิจโรงแรม</span>
              <button 
                onClick={() => handleCopy(LEGAL_DATA.hotelLicenseNumber, 'เลขที่ใบอนุญาต')}
                className="text-[11px] text-[#9A7B4F] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> คัดลอก
              </button>
            </div>
            <div className="font-mono font-bold text-slate-900 text-base text-[#9A7B4F]">
              {LEGAL_DATA.hotelLicenseNumber}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>นิติบุคคลผู้รับใบอนุญาต</span>
              <button 
                onClick={() => handleCopy(LEGAL_DATA.registrationNumber, 'เลขทะเบียนนิติบุคคล')}
                className="text-[11px] text-[#9A7B4F] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> ทะเบียน: {LEGAL_DATA.registrationNumber}
              </button>
            </div>
            <div className="font-semibold text-slate-900">{LEGAL_DATA.companyName}</div>
            <div className="text-xs text-slate-500 font-mono">เลขผู้เสียภาษี: {LEGAL_DATA.taxId}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs text-slate-400 font-medium">ระยะเวลาอนุญาตและการต่ออายุ</div>
            <div className="font-semibold text-slate-900">
              วันที่ออก: {LEGAL_DATA.licenseIssueDate}
            </div>
            <div className="text-xs text-emerald-700 font-medium">
              หมดอายุ: {LEGAL_DATA.licenseExpiryDate}
            </div>
          </div>

        </div>

        {/* Official Issuing Authority Footer */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-amber-900">หน่วยงานผู้ออกใบอนุญาต:</span>
            <span className="text-amber-800 ml-1.5">{LEGAL_DATA.issuingAuthority}</span>
          </div>
          <span className="text-[11px] font-mono text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-md">
            Security Hash: SHA256:7a9c8e4f1b...[VERIFIED]
          </span>
        </div>
      </div>

      {/* REGISTERED ADDRESS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Address Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-900">ที่อยู่จดทะเบียนจัดตั้งโรงแรม</h3>
              <p className="text-xs text-slate-500">Official Registered Business Headquarters</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-sm font-semibold text-slate-900">{LEGAL_DATA.companyName}</div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {LEGAL_DATA.registeredAddress.building} <br />
              {LEGAL_DATA.registeredAddress.street} {LEGAL_DATA.registeredAddress.subdistrict} <br />
              {LEGAL_DATA.registeredAddress.district} {LEGAL_DATA.registeredAddress.province} {LEGAL_DATA.registeredAddress.postalCode}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="inline-flex items-center gap-1 font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                พิกัด: {LEGAL_DATA.registeredAddress.coordinates}
              </span>
              <button
                onClick={() => handleCopy(`${LEGAL_DATA.registeredAddress.street} ${LEGAL_DATA.registeredAddress.subdistrict} ${LEGAL_DATA.registeredAddress.district} ${LEGAL_DATA.registeredAddress.province} ${LEGAL_DATA.registeredAddress.postalCode}`, 'ที่อยู่จัดตั้ง')}
                className="text-[#9A7B4F] hover:underline font-medium flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" /> คัดลอกที่อยู่นี้
              </button>
            </div>
          </div>

          {/* Interactive Mock Map Area */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-52 bg-slate-100 flex items-center justify-center group">
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
              alt="Map Location"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span className="font-semibold">ทำเลใจกลางเมือง ติดชายหาดและศูนย์การค้า</span>
              </div>
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px]">
                Google Maps Verified
              </span>
            </div>
          </div>
        </div>

        {/* Contact Legal / Directors Card */}
        <div className="bg-[#0B132B] text-white rounded-3xl p-6 sm:p-8 border border-[#C5A880]/30 shadow-xl space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#1C2541] text-[#C5A880] flex items-center justify-center border border-[#C5A880]/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-lg text-white">ฝ่ายนิติกรรมและกำกับดูแล</h4>
                <p className="text-[11px] text-slate-400">Legal & Compliance Affairs</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#1C2541]/70 border border-white/10 space-y-1">
                <span className="text-slate-400">โทรศัพท์สำนักงานกฎหมาย:</span>
                <div className="font-mono font-bold text-[#C5A880] text-sm">{LEGAL_DATA.contactLegal.phone}</div>
                <div className="text-[11px] text-slate-400">เวลาทำการ: {LEGAL_DATA.contactLegal.serviceHours}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#1C2541]/70 border border-white/10 space-y-1">
                <span className="text-slate-400">อีเมลฝ่ายตรวจสอบสัญญา:</span>
                <div className="font-mono text-white text-xs">{LEGAL_DATA.contactLegal.email}</div>
              </div>

              <div className="pt-2">
                <span className="text-slate-400 block mb-2 font-medium">กรรมการผู้มีอำนาจลงนาม:</span>
                <div className="space-y-1.5 text-slate-200">
                  {LEGAL_DATA.authorizedDirectors.map((d, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] border-b border-white/5 pb-1">
                      <span>• {d.name}</span>
                      <span className="text-[#C5A880]">{d.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#C5A880]/15 border border-[#C5A880]/30 text-[11px] text-[#E6D5B8]">
            ✓ ข้อมูลทั้งหมดในหน้านี้เป็นระบบสาธิต (Demo Verification) เพื่อแสดงความพร้อมและการจัดโครงสร้างระบบโรงแรมระดับมืออาชีพ
          </div>
        </div>

      </div>

      {/* ACCREDITATIONS & BADGES SECTION */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h3 className="font-serif font-bold text-2xl text-slate-900">
            มาตรฐานและการรับรองระดับสากล (Accredited Standards)
          </h3>
          <p className="text-xs text-slate-500">
            ผ่านเกณฑ์การประเมินคุณภาพจากหน่วยงานภาครัฐและองค์กรอิสระ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEGAL_DATA.certifications.map((cert, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  {getCertIcon(cert.icon)}
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {cert.code}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{cert.title}</h4>
                <p className="text-xs text-[#9A7B4F] mt-0.5">{cert.issuer}</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{cert.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
