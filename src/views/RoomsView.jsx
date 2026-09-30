import React, { useState, useMemo } from 'react';
import { useBooking } from '../context/BookingContext';
import { RoomSidebar } from '../components/RoomSidebar';
import { RoomCard } from '../components/RoomCard';
import { Search, Sparkles, SlidersHorizontal, BedDouble, AlertCircle } from 'lucide-react';

export const RoomsView = ({ selectedCategory, setSelectedCategory }) => {
  const { rooms } = useBooking();

  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [priceRange, setPriceRange] = useState(30000);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Category filter (large, medium, small, all)
      if (selectedCategory !== 'all' && room.category !== selectedCategory) {
        return false;
      }
      // Availability filter
      if (onlyAvailable && (!room.isAvailable || room.remainingRooms <= 0)) {
        return false;
      }
      // Price range
      if (room.price > priceRange) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = room.name.toLowerCase().includes(query);
        const matchDesc = room.description.toLowerCase().includes(query);
        const matchCategory = room.categoryLabel.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCategory) return false;
      }
      return true;
    });
  }, [rooms, selectedCategory, onlyAvailable, priceRange, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] rounded-3xl p-6 sm:p-8 text-white border border-[#C5A880]/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-[#C5A880] uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> ระบบเลือกห้องพัก Happy Hotel
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            รายการห้องพัก & การจองห้อง
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            ท่านสามารถเลือกชมห้องพักได้ตามความต้องการ โดยเลือกแถบขนาดความจุด้านซ้ายมือ (ห้องใหญ่ 6+ คน / ห้องกลาง 4-5 คน / ห้องเล็ก 1-3 คน)
          </p>
        </div>

        {/* Quick Search Input */}
        <div className="w-full md:w-72 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อห้องพักหรือประเภท..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0B132B] border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#C5A880]"
          />
        </div>
      </div>

      {/* Main Layout: Left Sidebar + Right Room Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Sidebar (Requirement: มีการแบ่งห้องที่ต้องการเช่าอย่างชัดเจนเป็นทีละแถบด้านซ้ายมือ) */}
        <div className="w-full lg:w-72 shrink-0 sticky top-28">
          <RoomSidebar
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onlyAvailable={onlyAvailable}
            setOnlyAvailable={setOnlyAvailable}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            allRooms={rooms}
          />
        </div>

        {/* Right Content Area */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Status summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-xs text-slate-600">
            <div>
              พบห้องพักที่ตรงตามเงื่อนไข <strong className="text-slate-900">{filteredRooms.length}</strong> ห้อง
              {selectedCategory !== 'all' && (
                <span className="ml-2 font-medium text-[#9A7B4F]">
                  (หมวด: {selectedCategory === 'large' ? 'ห้องใหญ่ 6 คนขึ้นไป' : selectedCategory === 'medium' ? 'ห้องกลาง 4-5 คน' : 'ห้องเล็ก 1-3 คน'})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>ว่าง: {filteredRooms.filter(r => r.isAvailable).length}</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>ห้องเต็ม: {filteredRooms.filter(r => !r.isAvailable).length}</span>
              </span>
            </div>
          </div>

          {/* Rooms Grid */}
          {filteredRooms.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-slate-800">ไม่พบห้องพักตามเงื่อนไขที่เลือก</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ลองปรับเปลี่ยนช่วงราคา ปิดตัวกรองห้องว่าง หรือเลือกหมวดหมู่อื่นจากแถบด้านซ้ายมือ
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setOnlyAvailable(false);
                  setPriceRange(30000);
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-[#0B132B] text-[#C5A880] text-xs font-semibold hover:bg-slate-800"
              >
                ล้างเงื่อนไขการค้นหา
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
