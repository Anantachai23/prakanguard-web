import React from 'react';
import { ROOM_CATEGORIES } from '../data/roomsData';
import { 
  Users, 
  Sparkles, 
  Filter, 
  CheckCircle2, 
  Ban, 
  RotateCcw, 
  SlidersHorizontal,
  Home,
  Crown,
  Coffee
} from 'lucide-react';

export const RoomSidebar = ({
  selectedCategory,
  setSelectedCategory,
  onlyAvailable,
  setOnlyAvailable,
  priceRange,
  setPriceRange,
  allRooms
}) => {
  // Compute counts per category
  const getCategoryCount = (catId) => {
    if (catId === 'all') return allRooms.length;
    return allRooms.filter((r) => r.category === catId).length;
  };

  const getAvailableCount = (catId) => {
    if (catId === 'all') return allRooms.filter((r) => r.isAvailable).length;
    return allRooms.filter((r) => r.category === catId && r.isAvailable).length;
  };

  const getCategoryIcon = (catId) => {
    switch (catId) {
      case 'large':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'medium':
        return <Users className="w-5 h-5 text-emerald-400" />;
      case 'small':
        return <Coffee className="w-5 h-5 text-sky-400" />;
      default:
        return <Home className="w-5 h-5 text-[#C5A880]" />;
    }
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setOnlyAvailable(false);
    setPriceRange(30000);
  };

  return (
    <aside className="w-full lg:w-72 bg-[#0B132B] border border-[#C5A880]/30 rounded-2xl p-5 shadow-xl text-white space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-[#C5A880]" />
          <h3 className="font-serif font-bold text-lg text-white">เลือกประเภทห้องพัก</h3>
        </div>
        <button
          onClick={resetFilters}
          className="text-[11px] text-slate-400 hover:text-[#C5A880] flex items-center gap-1 transition-colors"
          title="รีเซ็ตตัวกรองทั้งหมด"
        >
          <RotateCcw className="w-3 h-3" /> ล้างตัวกรอง
        </button>
      </div>

      {/* Main Requirement: 3 Categories on Left Sidebar */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> ระดับขนาดห้อง (แถบเลือก)
        </label>
        
        <div className="space-y-2">
          {ROOM_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const total = getCategoryCount(cat.id);
            const avail = getAvailableCount(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 group flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-[#1C2541] border-[#C5A880] shadow-md shadow-[#C5A880]/10 ring-1 ring-[#C5A880]/40'
                    : 'bg-[#0E1738] border-white/10 hover:border-[#C5A880]/40 hover:bg-[#152042]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {getCategoryIcon(cat.id)}
                    <span className={`text-sm font-semibold ${isSelected ? 'text-[#C5A880]' : 'text-slate-200'}`}>
                      {cat.label}
                    </span>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    isSelected ? 'bg-[#C5A880] text-[#0B132B] font-bold' : 'bg-white/10 text-slate-300'
                  }`}>
                    {cat.badge}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pl-7">
                  <span>{cat.description.substring(0, 32)}...</span>
                  <span className="shrink-0 text-emerald-400">ว่าง {avail}/{total}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Requirement: System for Room Availability (ห้องเต็ม vs ห้องว่าง) */}
      <div className="pt-4 border-t border-white/10">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#C5A880] flex items-center gap-1.5 mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" /> สถานะความพร้อมห้องพัก
        </label>
        
        <div className="p-3 rounded-xl bg-[#0E1738] border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-white">แสดงเฉพาะห้องที่ว่าง</div>
            <div className="text-[10px] text-slate-400">ซ่อนห้องที่ถูกจองเต็มแล้ว (Sold Out)</div>
          </div>
          <button
            type="button"
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              onlyAvailable ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                onlyAvailable ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#C5A880]">
            งบประมาณสูงสุด / คืน
          </label>
          <span className="text-xs font-bold text-white bg-[#1C2541] px-2 py-0.5 rounded border border-white/10">
            ฿{priceRange.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min="3000"
          max="30000"
          step="1000"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full accent-[#C5A880] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>฿3,000</span>
          <span>฿30,000+</span>
        </div>
      </div>

      {/* Live Hotel Guarantee Notice */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1C2541] to-[#0B132B] border border-[#C5A880]/30 text-xs text-slate-300 space-y-1.5">
        <div className="font-semibold text-[#C5A880] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> บริการระดับ 5 ดาว การันตี
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300">
          ราคารวมอาหารเช้าพรีเมียม สัญญาณอินเทอร์เน็ตความเร็วสูง และบริการต้อนรับ 24 ชั่วโมง ยกเลิกฟรีล่วงหน้า 48 ชม.
        </p>
      </div>

    </aside>
  );
};
