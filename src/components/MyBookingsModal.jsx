import React from 'react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { X, CalendarCheck, MapPin, Trash2, Printer, Bed, AlertCircle } from 'lucide-react';

export const MyBookingsModal = () => {
  const { isMyBookingsOpen, setIsMyBookingsOpen, userBookings, cancelBooking } = useBooking();
  const { user } = useAuth();

  if (!isMyBookingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-[#0B132B] border border-[#C5A880]/40 rounded-2xl shadow-2xl text-white overflow-hidden my-auto max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-[#1C2541] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">รายการจองห้องพักของฉัน</h3>
              <p className="text-xs text-slate-300">
                ประวัติการจองของผู้ใช้: <span className="text-[#C5A880] font-medium">{user?.name}</span> ({user?.email})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMyBookingsOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {userBookings.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <CalendarCheck className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-slate-300 text-sm font-medium">ยังไม่มีรายการจองห้องพักในขณะนี้</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ท่านสามารถเลือกดูห้องพักทั้ง 3 ขนาด (ห้องใหญ่ 6+ คน, ห้องกลาง 4-5 คน, ห้องเล็ก 1-3 คน) แล้วกดจองได้ทันที
              </p>
            </div>
          ) : (
            userBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-[#152042] border border-white/10 hover:border-[#C5A880]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={b.roomImage}
                    alt={b.roomName}
                    className="w-20 h-20 rounded-lg object-cover border border-[#C5A880]/30 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#C5A880]">{b.bookingRef}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {b.paymentStatus}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-white text-sm sm:text-base mt-0.5">{b.roomName}</h4>
                    <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>📅 {b.checkIn} ถึง {b.checkOut} ({b.nights} คืน)</span>
                      <span>👥 {b.guestsCount} ท่าน</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      วิธีชำระ: <span className="text-slate-200">{b.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">ยอดรวม</span>
                    <span className="text-base sm:text-lg font-bold text-[#C5A880]">฿{b.totalAmount?.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1 border border-white/10"
                      title="พิมพ์ใบเสร็จ"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs flex items-center gap-1 border border-rose-500/20"
                      title="ยกเลิกการจอง"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ยกเลิก</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1C2541] border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={() => setIsMyBookingsOpen(false)}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] font-semibold text-xs hover:brightness-110 shadow-md"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
