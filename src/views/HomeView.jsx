import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { useToast } from '../context/ToastContext';
import { 
  Sparkles, 
  Star, 
  Calendar, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Waves, 
  UtensilsCrossed, 
  HeartHandshake, 
  Clock, 
  Crown,
  ChevronRight,
  BedDouble
} from 'lucide-react';
import { RoomCard } from '../components/RoomCard';

export const HomeView = ({ setCurrentView, setSelectedCategory }) => {
  const { rooms } = useBooking();
  const { addToast } = useToast();

  const [searchCheckIn, setSearchCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [searchCheckOut, setSearchCheckOut] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [searchCapacity, setSearchCapacity] = useState('all');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCapacity !== 'all') {
      setSelectedCategory(searchCapacity);
    }
    setCurrentView('rooms');
    addToast('กำลังค้นหาห้องพักตามเงื่อนไขที่เลือก...', 'info');
  };

  const navigateToCategory = (catId) => {
    setSelectedCategory(catId);
    setCurrentView('rooms');
  };

  // Featured 3 rooms (one from each category)
  const featuredLarge = rooms.find(r => r.category === 'large' && r.isAvailable);
  const featuredMedium = rooms.find(r => r.category === 'medium' && r.isAvailable);
  const featuredSmall = rooms.find(r => r.category === 'small' && r.isAvailable);
  const featuredRooms = [featuredLarge, featuredMedium, featuredSmall].filter(Boolean);

  return (
    <div className="space-y-20 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-[#0B132B] text-white overflow-hidden">
        {/* Background Image with luxury dark gradient */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=85"
            alt="Happy Hotel Luxury Resort"
            className="w-full h-full object-cover opacity-35 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-[#0B132B]/60 to-black/70" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16 space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#C5A880] text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> โรงแรมและรีสอร์ทระดับพรีเมียม 5 ดาว (Happy Hotel)
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-tight">
            นิยามแห่งการพักผ่อน <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E6D5B8] via-[#C5A880] to-[#FAF7F2]">
              เหนือระดับและอบอุ่นใจ
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            สัมผัสประสบการณ์แห่งความสุขที่แท้จริง พร้อมการต้อนรับอย่างเป็นทางการ ด้วยห้องพักหรู 3 ระดับความจุ ตั้งแต่ห้องส่วนตัวสำหรับ 1-3 ท่าน จนถึงแกรนด์พูลวิลล่าสำหรับครอบครัวใหญ่ 6 ท่านขึ้นไป
          </p>

          {/* Quick Booking Search Bar */}
          <form 
            onSubmit={handleSearchSubmit}
            className="max-w-4xl mx-auto bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 text-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end text-left"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#9A7B4F]" /> เช็คอิน
              </label>
              <input
                type="date"
                value={searchCheckIn}
                onChange={(e) => setSearchCheckIn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#9A7B4F]" /> เช็คเอาท์
              </label>
              <input
                type="date"
                value={searchCheckOut}
                onChange={(e) => setSearchCheckOut(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#9A7B4F]" /> ขนาดห้อง / จำนวนคน
              </label>
              <select
                value={searchCapacity}
                onChange={(e) => setSearchCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#C5A880]"
              >
                <option value="all">ทุกระดับขนาดห้อง</option>
                <option value="large">🌟 ห้องใหญ่ (6 ท่านขึ้นไป)</option>
                <option value="medium">🌿 ห้องกลาง (4-5 ท่าน)</option>
                <option value="small">☕ ห้องเล็ก (1-3 ท่าน)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B132B] to-[#1C2541] hover:from-[#C5A880] hover:to-[#9A7B4F] text-white hover:text-[#0B132B] font-semibold text-xs tracking-wider uppercase transition-all duration-300 shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span>ค้นหาห้องว่าง</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Category Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs text-slate-300">
            <span className="text-slate-400">เลือกดูตามหมวดหมู่ได้ทันที:</span>
            <button
              onClick={() => navigateToCategory('large')}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#C5A880]/20 border border-white/10 hover:border-[#C5A880]/40 transition-all text-white flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" /> ห้องใหญ่ (6 คนขึ้นไป)
            </button>
            <button
              onClick={() => navigateToCategory('medium')}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#C5A880]/20 border border-white/10 hover:border-[#C5A880]/40 transition-all text-white flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" /> ห้องกลาง (4-5 คน)
            </button>
            <button
              onClick={() => navigateToCategory('small')}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#C5A880]/20 border border-white/10 hover:border-[#C5A880]/40 transition-all text-white flex items-center gap-1.5"
            >
              <BedDouble className="w-3.5 h-3.5 text-sky-400" /> ห้องเล็ก (1-3 คน)
            </button>
          </div>

        </div>
      </section>

      {/* 3 ROOM CATEGORIES SHOWCASE (ตามโจทย์หลัก) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="text-xs font-semibold tracking-widest text-[#9A7B4F] uppercase">
            ACCOMMODATION TIERS
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
            เลือกห้องพักที่เหมาะกับขนาดกลุ่มของคุณ
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            ออกแบบพื้นที่อย่างประณีตเพื่อตอบโจทย์ทุกจำนวนผู้เข้าพัก แบ่งสัดส่วนชัดเจน 3 ระดับความจุ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: ห้องใหญ่ 6 คนขึ้นไป */}
          <div 
            onClick={() => navigateToCategory('large')}
            className="group cursor-pointer rounded-3xl overflow-hidden bg-white border border-amber-200/80 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
                alt="Large Suite"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-amber-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow">
                🌟 ห้องใหญ่ (6 คนขึ้นไป)
              </div>
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-amber-300 text-xs px-3 py-1 rounded-lg">
                เริ่มต้น ฿14,200 / คืน
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900 group-hover:text-amber-600 transition-colors">
                  Grand Family & Pool Villa
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  วิลล่าส่วนตัวและเพนต์เฮาส์ขนาดใหญ่พิเศษ 210-340 ตร.ม. พร้อมสระว่ายน้ำส่วนตัวและบัตเลอร์บริการ 24 ชม.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600">
                <span>เลือกดูห้องใหญ่ทั้งหมด &rarr;</span>
                <span className="text-slate-400 font-normal">ความจุ 6 - 10 ท่าน</span>
              </div>
            </div>
          </div>

          {/* Card 2: ห้องกลาง 4-5 คน */}
          <div 
            onClick={() => navigateToCategory('medium')}
            className="group cursor-pointer rounded-3xl overflow-hidden bg-white border border-emerald-200/80 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
                alt="Medium Suite"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow">
                🌿 ห้องกลาง (4-5 คน)
              </div>
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-emerald-300 text-xs px-3 py-1 rounded-lg">
                เริ่มต้น ฿7,600 / คืน
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Executive Family & Duplex
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  สวีทสองชั้นและห้องสำหรับครอบครัวขนาดกลาง แบ่งห้องนอนและห้องนั่งเล่นเป็นสัดส่วน พร้อมระเบียงชมสวน
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                <span>เลือกดูห้องกลางทั้งหมด &rarr;</span>
                <span className="text-slate-400 font-normal">ความจุ 4 - 5 ท่าน</span>
              </div>
            </div>
          </div>

          {/* Card 3: ห้องเล็ก 1-3 คน */}
          <div 
            onClick={() => navigateToCategory('small')}
            className="group cursor-pointer rounded-3xl overflow-hidden bg-white border border-sky-200/80 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"
                alt="Small Cozy Room"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-sky-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow">
                ☕ ห้องเล็ก (1-3 คน)
              </div>
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-sky-300 text-xs px-3 py-1 rounded-lg">
                เริ่มต้น ฿3,200 / คืน
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900 group-hover:text-sky-700 transition-colors">
                  Premier Horizon & Studio
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  ห้องพักแสนอบอุ่นสำหรับคู่รักหรือเดินทางเดี่ยว กระจกบานใหญ่ชมวิวขอบฟ้า เตียงนอนนุ่มสบายเพื่อการผ่อนคลาย
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600">
                <span>เลือกดูห้องเล็กทั้งหมด &rarr;</span>
                <span className="text-slate-400 font-normal">ความจุ 1 - 3 ท่าน</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURED ROOMS CAROUSEL/GRID */}
      <section className="bg-[#FAF7F2] py-16 border-y border-[#C5A880]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-[#9A7B4F] uppercase">
                RECOMMENDED ROOMS
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
                ห้องพักยอดนิยมประจำสัปดาห์
              </h2>
            </div>
            <button
              onClick={() => setCurrentView('rooms')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B132B] hover:text-[#9A7B4F] transition-colors"
            >
              <span>ดูห้องพักทั้งหมดในระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      </section>

      {/* LUXURY AMENITIES & SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-semibold tracking-widest text-[#9A7B4F] uppercase">
            WORLD-CLASS SERVICES
          </span>
          <h2 className="text-3xl font-serif font-bold text-slate-900">
            บริการระดับสากลเพื่อความสุขของคุณ
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Waves className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-slate-900">สระว่ายน้ำ Infinity Pool</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              สระว่ายน้ำระบบเกลือลอยฟ้าทอดยาวมองเห็นวิวทะเล พร้อมบาร์เครื่องดื่มริมสระ
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-slate-900">ห้องอาหาร The Royal Feast</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              บุฟเฟต์นานาชาติและเชฟมิชลิน รังสรรค์เมนูวัตถุดิบพรีเมียมจากทั่วทุกมุมโลก
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-slate-900">Serenity Aromatherapy Spa</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ทรีตเมนต์สปาแผนโบราณผสานศาสตร์บำบัดอโรมา เพื่อคืนความสดชื่นให้กับร่างกาย
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-base text-slate-900">ผู้ช่วยส่วนตัว Butler 24 ชม.</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              บริการดูแลและอำนวยความสะดวกเฉพาะบุคคลตลอดการเข้าพักด้วยความใส่ใจสูงสุด
            </p>
          </div>
        </div>
      </section>

      {/* OFFICIAL REGISTRATION & CERTIFICATES BANNER (DEMO) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] text-white border border-[#C5A880]/30 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A880]/20 text-[#C5A880] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> ตรวจสอบความถูกต้องและโปร่งใส (Official Verification)
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">
              โรงแรมที่ได้รับการรับรองจดทะเบียนถูกต้องตามกฎหมาย
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Happy Hotel ดำเนินธุรกิจภายใต้ใบอนุญาตประกอบธุรกิจโรงแรม เลขที่ รร.ทท. 0422/2567 พร้อมผ่านการรับรองความปลอดภัยสุขอนามัย SHA Extra Plus และมาตรฐาน DBD Verified มั่นใจได้ในทุกการจอง
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => setCurrentView('registration')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] font-semibold text-xs hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
            >
              <span>ดูเอกสารการจดทะเบียน & ที่อยู่จัดตั้ง</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white font-medium text-xs flex items-center justify-center gap-2"
            >
              <span>สถิติแนวโน้มการตลาด</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
