import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { 
  Users, 
  Maximize2, 
  Bed, 
  Star, 
  Check, 
  Sparkles, 
  Info, 
  Lock, 
  AlertCircle,
  X
} from 'lucide-react';

export const RoomCard = ({ room }) => {
  const { initiateBooking } = useBooking();
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'large':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          accent: 'text-amber-400'
        };
      case 'medium':
        return {
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          accent: 'text-emerald-400'
        };
      case 'small':
        return {
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          accent: 'text-sky-400'
        };
      default:
        return {
          badgeBg: 'bg-[#C5A880]/20 text-[#C5A880] border-[#C5A880]/40',
          accent: 'text-[#C5A880]'
        };
    }
  };

  const theme = getCategoryTheme(room.category);

  return (
    <>
      <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between transform hover:-translate-y-1">
        
        {/* Room Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
          <img
            src={room.image}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            {/* Category Badge (6+, 4-5, 1-3) */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md border ${theme.badgeBg}`}>
              {room.categoryLabel}
            </span>

            {/* Availability Status: Requirement (บอกห้องเต็มกับห้องว่าง) */}
            {room.isAvailable && room.remainingRooms > 0 ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white shadow-md flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>ว่าง ({room.remainingRooms} ห้อง)</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white shadow-md flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>ห้องเต็ม (Sold Out)</span>
              </span>
            )}
          </div>

          {/* Bottom Overlay on Image: Capacity & Size */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
            <span className="flex items-center gap-1 font-medium bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md">
              <Users className="w-3.5 h-3.5 text-[#C5A880]" /> {room.capacityText}
            </span>
            <span className="flex items-center gap-1 font-medium bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md">
              <Maximize2 className="w-3.5 h-3.5 text-[#C5A880]" /> {room.size}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            {/* Title & Rating */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-[#9A7B4F] transition-colors leading-snug">
                {room.name}
              </h3>
              <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs shrink-0 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{room.rating}</span>
                <span className="text-slate-400 font-normal">({room.reviewsCount})</span>
              </div>
            </div>

            {/* Bed Type */}
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
              <Bed className="w-4 h-4 text-slate-400" />
              <span>{room.bed}</span>
            </p>

            {/* Highlights / Features pills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {room.features.slice(0, 3).map((feat, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60"
                >
                  ✓ {feat}
                </span>
              ))}
            </div>
          </div>

          {/* Pricing & Booking Actions */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-[11px] text-slate-400">ราคาเริ่มต้น</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-[#0B132B]">
                    ฿{room.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    ฿{room.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">/ คืน</span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(true)}
                className="text-xs text-[#9A7B4F] hover:text-[#0B132B] font-medium underline flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" /> รายละเอียด
              </button>
            </div>

            {/* Action Buttons: Minimalist & Fluid */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 active:scale-95 transition-all text-center"
              >
                ดูข้อมูลห้อง
              </button>

              {room.isAvailable && room.remainingRooms > 0 ? (
                <button
                  type="button"
                  onClick={() => initiateBooking(room)}
                  className="flex-[1.5] py-2.5 rounded-xl bg-gradient-to-r from-[#0B132B] to-[#1C2541] hover:from-[#C5A880] hover:to-[#9A7B4F] text-white hover:text-[#0B132B] font-semibold text-xs transition-all duration-300 shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>จองห้องนี้ทันที</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  disabled
                  className="flex-[1.5] py-2.5 rounded-xl bg-slate-200 text-slate-400 font-medium text-xs cursor-not-allowed text-center flex items-center justify-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>ห้องพักเต็มแล้ว</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Room Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative w-full max-w-2xl bg-[#0B132B] border border-[#C5A880]/40 rounded-2xl shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900 shrink-0">
              <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold backdrop-blur-md border ${theme.badgeBg}`}>
                  {room.categoryLabel}
                </span>
                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs text-white">
                  ขนาดห้อง {room.size} • สูงสุด {room.capacity} ท่าน
                </span>
              </div>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-white">{room.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Bed className="w-4 h-4 text-[#C5A880]" /> {room.bed}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#C5A880]">฿{room.price.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">ราคาต่อคืน (รวมภาษี)</div>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed bg-[#1C2541]/40 p-4 rounded-xl border border-white/10">
                {room.description}
              </p>

              {/* Amenities */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C5A880] mb-3">
                  สิ่งอำนวยความสะดวกในห้องพัก
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                  {room.amenities.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[#1C2541]/50 border border-white/5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1C2541] border border-[#C5A880]/30 text-xs">
                <span className="text-slate-300">สถานะห้องพักปัจจุบัน:</span>
                {room.isAvailable && room.remainingRooms > 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    ✓ เปิดให้จอง (เหลือเพียง {room.remainingRooms} ห้อง)
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    ✕ ขออภัย ห้องเต็มแล้วสำหรับช่วงนี้
                  </span>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-[#1C2541] border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-slate-300 text-xs font-medium hover:bg-white/10"
              >
                ปิดหน้าต่าง
              </button>
              {room.isAvailable && room.remainingRooms > 0 && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    initiateBooking(room);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] font-semibold text-xs hover:brightness-110 shadow-lg active:scale-95"
                >
                  ดำเนินการจองห้องนี้
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
