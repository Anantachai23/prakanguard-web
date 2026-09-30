import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ROOMS } from '../data/roomsData';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const { user, isLoggedIn, openLoginModal } = useAuth();
  const { addToast } = useToast();

  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('happy_hotel_rooms_inventory');
      return saved ? JSON.parse(saved) : INITIAL_ROOMS;
    } catch {
      return INITIAL_ROOMS;
    }
  });

  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('happy_hotel_bookings_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('happy_hotel_rooms_inventory', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('happy_hotel_bookings_history', JSON.stringify(bookings));
  }, [bookings]);

  // Initiate Booking flow
  const initiateBooking = (room) => {
    if (!room.isAvailable || room.remainingRooms <= 0) {
      addToast('ขออภัย ห้องพักประเภทนี้ถูกจองเต็มแล้วในขณะนี้', 'warning', 'ห้องพักเต็ม');
      return;
    }

    if (!isLoggedIn) {
      addToast('กรุณาเข้าสู่ระบบก่อนทำการจองห้องพัก เพื่อรับสิทธิ์และบันทึกประวัติการจอง', 'warning', 'จำเป็นต้องเข้าสู่ระบบ');
      openLoginModal(() => {
        // Auto-open booking modal after successful login
        setSelectedRoomForBooking(room);
        setIsBookingModalOpen(true);
      });
      return;
    }

    setSelectedRoomForBooking(room);
    setIsBookingModalOpen(true);
    addToast(`เลือกห้องพัก: ${room.name} พร้อมสำหรับการจอง`, 'info');
  };

  // Complete Booking & Payment Simulation
  const completeBooking = (bookingDetails) => {
    const bookingRef = 'HH-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);

    const newBooking = {
      id: 'bk-' + Date.now(),
      bookingRef,
      roomId: bookingDetails.room.id,
      roomName: bookingDetails.room.name,
      roomCategory: bookingDetails.room.categoryLabel,
      roomImage: bookingDetails.room.image,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      nights: bookingDetails.nights,
      guestsCount: bookingDetails.guestsCount,
      specialRequests: bookingDetails.specialRequests || 'ไม่มี',
      paymentMethod: bookingDetails.paymentMethod, // 'promptpay' | 'credit_card' | 'bank_transfer'
      paymentStatus: 'PAID (ชำระแล้ว - โหมดทดลอง)',
      totalAmount: bookingDetails.totalAmount,
      basePrice: bookingDetails.basePrice,
      taxAmount: bookingDetails.taxAmount,
      discountAmount: bookingDetails.discountAmount || 0,
      customerName: user?.name || bookingDetails.customerName,
      customerEmail: user?.email || bookingDetails.customerEmail,
      customerPhone: user?.phone || bookingDetails.customerPhone,
      bookedAt: new Date().toISOString()
    };

    // Update room inventory
    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        if (r.id === bookingDetails.room.id) {
          const newRemaining = Math.max(0, r.remainingRooms - 1);
          return {
            ...r,
            remainingRooms: newRemaining,
            isAvailable: newRemaining > 0
          };
        }
        return r;
      })
    );

    // Save to user's bookings
    setBookings((prev) => [newBooking, ...prev]);
    setLatestReceipt(newBooking);

    // Confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C5A880', '#0B132B', '#E6D5B8', '#10B981']
      });
    } catch (e) {
      // safe fallback
    }

    addToast(`การจองหมายเลข ${bookingRef} สำเร็จเรียบร้อยแล้ว`, 'success', 'ชำระเงินจำลองสำเร็จ!');
    return newBooking;
  };

  const cancelBooking = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Restore room availability
    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        if (r.id === booking.roomId) {
          return {
            ...r,
            remainingRooms: r.remainingRooms + 1,
            isAvailable: true
          };
        }
        return r;
      })
    );

    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    addToast(`ยกเลิกการจองรหัส ${booking.bookingRef} เรียบร้อยแล้ว`, 'info', 'ยกเลิกการจอง');
  };

  const userBookings = bookings.filter(
    (b) => b.customerEmail?.toLowerCase() === user?.email?.toLowerCase()
  );

  return (
    <BookingContext.Provider
      value={{
        rooms,
        bookings,
        userBookings,
        selectedRoomForBooking,
        setSelectedRoomForBooking,
        isBookingModalOpen,
        setIsBookingModalOpen,
        isMyBookingsOpen,
        setIsMyBookingsOpen,
        latestReceipt,
        setLatestReceipt,
        initiateBooking,
        completeBooking,
        cancelBooking
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};
