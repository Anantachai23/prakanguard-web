import React from 'react';
import { Building2, Phone, Mail, MapPin, ShieldCheck, Award, Heart } from 'lucide-react';
import { LEGAL_DATA } from '../data/legalData';

export const Footer = ({ setCurrentView }) => {
  return (
    <footer className="bg-[#0B132B] text-slate-300 border-t border-[#C5A880]/30 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A880] to-[#9A7B4F] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#0B132B]" />
              </div>
              <div>
                <span className="text-xl font-serif font-bold tracking-wider text-white">HAPPY HOTEL</span>
                <span className="block text-[10px] text-[#C5A880] tracking-widest uppercase">Luxury & Spa Resort</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              โรงแรมและรีสอร์ทระดับ 5 ดาว มอบประสบการณ์การพักผ่อนเหนือระดับที่ผสานความอบอุ่นและสะดวกสบาย พร้อมการบริการอันเป็นเลิศตลอด 24 ชั่วโมง
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1C2541] text-[#C5A880] border border-[#C5A880]/30">
                <Award className="w-3.5 h-3.5" /> 5-Star Luxury Standard
              </span>
            </div>
          </div>

          {/* Col 2: Room Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-[#C5A880] pl-2.5">
              ระดับห้องพัก (Room Categories)
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button 
                  onClick={() => setCurrentView('rooms')}
                  className="hover:text-[#C5A880] transition-colors text-left flex items-center justify-between w-full"
                >
                  <span>🌟 ห้องใหญ่ (6 ท่านขึ้นไป)</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">Pool Villa / Suite</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('rooms')}
                  className="hover:text-[#C5A880] transition-colors text-left flex items-center justify-between w-full"
                >
                  <span>🌿 ห้องกลาง (4 - 5 ท่าน)</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">Family Suite</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentView('rooms')}
                  className="hover:text-[#C5A880] transition-colors text-left flex items-center justify-between w-full"
                >
                  <span>☕ ห้องเล็ก (1 - 3 ท่าน)</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">Deluxe & Studio</span>
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => setCurrentView('analytics')}
                  className="text-[#C5A880] hover:underline flex items-center gap-1"
                >
                  📊 รายงานสถิติและแนวโน้มการตลาด
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Official Verification (Demo) */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-[#C5A880] pl-2.5">
              การจดทะเบียน & นิติการ (Demo)
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                <span>
                  <strong>ใบอนุญาต รร.:</strong> {LEGAL_DATA.hotelLicenseNumber}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                <span>
                  <strong>ทะเบียนนิติบุคคล:</strong> {LEGAL_DATA.registrationNumber}
                </span>
              </p>
              <button
                onClick={() => setCurrentView('registration')}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C5A880]/10 text-[#C5A880] border border-[#C5A880]/40 hover:bg-[#C5A880]/20 transition-all"
              >
                ดูเอกสารจดทะเบียนและที่อยู่จัดตั้ง &rarr;
              </button>
            </div>
          </div>

          {/* Col 4: Contact & Location */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-[#C5A880] pl-2.5">
              ที่อยู่และการติดต่อ
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                <span>{LEGAL_DATA.registeredAddress.street} {LEGAL_DATA.registeredAddress.subdistrict} {LEGAL_DATA.registeredAddress.district} {LEGAL_DATA.registeredAddress.province} {LEGAL_DATA.registeredAddress.postalCode}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span>02-888-9999 (ต้อนรับ 24 ชั่วโมง)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C5A880] shrink-0" />
                <span>reservation@happyhotel-resorts.com</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Happy Hotel & Resorts Co., Ltd. สงวนลิขสิทธิ์ทั้งหมด (Demo System for Evaluation)
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('registration')} className="hover:text-slate-300">นโยบายความเป็นส่วนตัว</button>
            <span>•</span>
            <button onClick={() => setCurrentView('registration')} className="hover:text-slate-300">ข้อกำหนดการใช้บริการ</button>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Happy Hotel
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
