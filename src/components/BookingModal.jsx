import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  X, 
  Calendar, 
  Users, 
  CreditCard, 
  QrCode, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Download, 
  ArrowRight,
  Clock
} from 'lucide-react';

export const BookingModal = () => {
  const { 
    isBookingModalOpen, 
    setIsBookingModalOpen, 
    selectedRoomForBooking, 
    completeBooking,
    latestReceipt,
    setLatestReceipt,
    setIsMyBookingsOpen
  } = useBooking();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Success Receipt
  
  // Date calculation defaults
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [guestCount, setGuestCount] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('promptpay'); // 'promptpay' | 'card' | 'transfer'
  
  // Mock Card fields
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isBookingModalOpen || !selectedRoomForBooking) return null;

  // Calculate nights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.max(1, checkOutDate - checkInDate);
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const basePrice = selectedRoomForBooking.price * nights;
  const serviceAndTax = Math.round(basePrice * 0.07); // 7% VAT
  const totalAmount = basePrice + serviceAndTax;

  const handleNextToPayment = (e) => {
    e.preventDefault();
    if (checkOut <= checkIn) {
      addToast('วันเช็คเอาท์ต้องอยู่หลังวันเช็คอินอย่างน้อย 1 วัน', 'warning');
      return;
    }
    setStep(2);
    addToast('กรุณาเลือกช่องทางและจำลองการชำระเงิน', 'info');
  };

  const handleFillDemoCard = () => {
    setCardData({
      number: '4111 2222 3333 4444',
      holder: user?.name || 'SOMCHAI CHAROENSUK',
      expiry: '12/28',
      cvv: '888'
    });
    addToast('กรอกข้อมูลบัตรเครดิตทดสอบเรียบร้อยแล้ว', 'success');
  };

  const handleConfirmMockPayment = () => {
    setIsProcessing(true);
    addToast('กำลังดำเนินการประมวลผลการชำระเงินจำลอง...', 'info');

    setTimeout(() => {
      setIsProcessing(false);
      const bookingData = {
        room: selectedRoomForBooking,
        checkIn,
        checkOut,
        nights,
        guestsCount: guestCount,
        specialRequests,
        paymentMethod: paymentMethod === 'promptpay' ? 'QR พร้อมเพย์ (PromptPay)' : paymentMethod === 'card' ? 'บัตรเครดิต/เดบิต' : 'โอนเงินธนาคาร',
        basePrice,
        taxAmount: serviceAndTax,
        totalAmount,
        customerName: user?.name,
        customerEmail: user?.email,
        customerPhone: user?.phone
      };

      completeBooking(bookingData);
      setStep(3); // Go to receipt
    }, 1200);
  };

  const handleClose = () => {
    setIsBookingModalOpen(false);
    setStep(1);
    setLatestReceipt(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#0B132B] border border-[#C5A880]/40 rounded-2xl shadow-2xl text-white overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-white/10 bg-[#1C2541] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#C5A880] uppercase tracking-widest font-semibold">
              HAPPY HOTEL • SECURE BOOKING SYSTEM (DEMO)
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
              {step === 1 && 'ขั้นตอนที่ 1: กำหนดวันเข้าพักและรายละเอียด'}
              {step === 2 && 'ขั้นตอนที่ 2: ระบบชำระเงินจำลอง (Mock Checkout)'}
              {step === 3 && 'ขั้นตอนที่ 3: ใบเสร็จยืนยันการจองสำเร็จ (E-Voucher)'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Details */}
        {step === 1 && (
          <form onSubmit={handleNextToPayment} className="p-6 space-y-5">
            {/* Selected Room Summary */}
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#1C2541]/70 border border-[#C5A880]/30">
              <img
                src={selectedRoomForBooking.image}
                alt={selectedRoomForBooking.name}
                className="w-20 h-20 rounded-lg object-cover shrink-0 border border-[#C5A880]/40"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-[#C5A880] uppercase font-bold">{selectedRoomForBooking.categoryLabel}</span>
                <h4 className="text-sm sm:text-base font-serif font-bold text-white truncate">{selectedRoomForBooking.name}</h4>
                <div className="text-xs text-slate-300 mt-0.5">
                  ความจุ {selectedRoomForBooking.capacityText} • ฿{selectedRoomForBooking.price.toLocaleString()} / คืน
                </div>
              </div>
            </div>

            {/* Check-in / Check-out inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#C5A880]" /> วันที่เช็คอิน (Check-in)
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1C2541] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#C5A880]" /> วันที่เช็คเอาท์ (Check-out)
                </label>
                <input
                  type="date"
                  required
                  min={checkIn}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1C2541] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            {/* Guests Count & Special Requests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#C5A880]" /> จำนวนผู้เข้าพัก (ท่าน)
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedRoomForBooking.capacity}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#1C2541] border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-[#C5A880]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  สูงสุดไม่เกิน {selectedRoomForBooking.capacity} ท่าน สำหรับห้องนี้
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  คำขอพิเศษ (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น เตียงเสริม, หมอนเพื่อสุขภาพ, เช็คอินช่วงบ่าย"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1C2541] border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            {/* Price Breakdown Calculation */}
            <div className="p-4 rounded-xl bg-[#152042] border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>ราคาห้องพัก (฿{selectedRoomForBooking.price.toLocaleString()} x {nights} คืน)</span>
                <span>฿{basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>ภาษีมูลค่าเพิ่มและค่าบริการ (VAT & Service 7%)</span>
                <span>฿{serviceAndTax.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between text-sm sm:text-base font-bold text-white">
                <span className="text-[#C5A880]">ยอดรวมสุทธิทั้งสิ้น:</span>
                <span className="text-xl text-[#C5A880]">฿{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-xs font-medium text-slate-300 hover:bg-white/10"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] font-semibold text-xs hover:brightness-110 shadow-lg flex items-center gap-2 active:scale-95"
              >
                <span>ต่อไป: เลือกวิธีชำระเงิน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Mock Payment System */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            {/* Payment Methods tabs */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#C5A880] block mb-2">
                เลือกรูปแบบการชำระเงิน (จำลองระบบทดสอบ)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('promptpay')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'promptpay'
                      ? 'bg-[#1C2541] border-[#C5A880] text-[#C5A880] ring-1 ring-[#C5A880]'
                      : 'bg-[#0E1738] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs font-medium">QR PromptPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-[#1C2541] border-[#C5A880] text-[#C5A880] ring-1 ring-[#C5A880]'
                      : 'bg-[#0E1738] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-medium">บัตรเครดิต/เดบิต</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'transfer'
                      ? 'bg-[#1C2541] border-[#C5A880] text-[#C5A880] ring-1 ring-[#C5A880]'
                      : 'bg-[#0E1738] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs font-medium">โอนผ่านธนาคาร</span>
                </button>
              </div>
            </div>

            {/* Payment Content Panels */}
            {paymentMethod === 'promptpay' && (
              <div className="p-4 rounded-xl bg-[#152042] border border-[#C5A880]/30 text-center space-y-3">
                <div className="text-xs text-slate-300">สแกนจ่ายผ่านแอปธนาคารทุกธนาคาร (ระบบจำลอง)</div>
                {/* Mock QR graphic */}
                <div className="inline-block p-3 bg-white rounded-xl shadow-lg border-2 border-[#C5A880]">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=HappyHotel-MockPayment-Demo-2026"
                    alt="Mock PromptPay QR"
                    className="w-36 h-36 mx-auto"
                  />
                  <div className="text-[10px] text-slate-800 font-bold mt-1">PromptPay • Thai QR</div>
                </div>
                <div className="text-lg font-bold text-[#C5A880]">ยอดที่ต้องชำระ: ฿{totalAmount.toLocaleString()}</div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 py-1.5 px-3 rounded-lg border border-amber-500/20 max-w-xs mx-auto">
                  <Clock className="w-3.5 h-3.5" />
                  <span>รหัสชำระมีอายุ 15:00 นาที (โหมดทดสอบ)</span>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-4 rounded-xl bg-[#152042] border border-[#C5A880]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">กรอกข้อมูลบัตรเครดิต หรือกดปุ่มกรอกอัตโนมัติ</span>
                  <button
                    type="button"
                    onClick={handleFillDemoCard}
                    className="text-xs text-[#C5A880] hover:underline flex items-center gap-1 font-medium bg-[#C5A880]/10 px-2.5 py-1 rounded-md border border-[#C5A880]/30"
                  >
                    <Sparkles className="w-3 h-3" /> กรอกบัตรทดสอบอัตโนมัติ
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">หมายเลขบัตร</label>
                    <input
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0B132B] border border-white/15 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">ชื่อผู้ถือบัตร</label>
                      <input
                        type="text"
                        placeholder="NAME SURNAME"
                        value={cardData.holder}
                        onChange={(e) => setCardData({ ...cardData, holder: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0B132B] border border-white/15 rounded-lg text-white uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">หมดอายุ</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          className="w-full px-3 py-2 bg-[#0B132B] border border-white/15 rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength="3"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          className="w-full px-3 py-2 bg-[#0B132B] border border-white/15 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div className="p-4 rounded-xl bg-[#152042] border border-[#C5A880]/30 space-y-3 text-xs">
                <div className="text-slate-300 font-medium">บัญชีธนาคารสำหรับโอนเงิน (จำลอง):</div>
                <div className="p-3 rounded-lg bg-[#0B132B] border border-white/10 space-y-1">
                  <div className="text-slate-400">ธนาคารกสิกรไทย (KBANK)</div>
                  <div className="text-base font-bold text-white font-mono">088-2-99887-1</div>
                  <div className="text-[#C5A880]">ชื่อบัญชี: บมจ. แฮปปี้ โฮเทล แอนด์ รีสอร์ท</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-center">
                  ✓ ระบบจำลองการตรวจจับสลิปโอนเงินอัตโนมัติ (สามารถกดยืนยันชำระได้ทันที)
                </div>
              </div>
            )}

            {/* Total recap and Pay button */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div>
                <span className="text-[11px] text-slate-400">ยอดชำระจำลองทั้งสิ้น</span>
                <div className="text-xl font-bold text-[#C5A880]">฿{totalAmount.toLocaleString()}</div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-white/20 text-xs font-medium text-slate-300 hover:bg-white/10"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmMockPayment}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-semibold text-xs shadow-lg active:scale-95 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>กำลังจำลองการชำระเงิน...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ยืนยันจำลองชำระเงินทันที</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: E-Voucher / Receipt Confirmation */}
        {step === 3 && latestReceipt && (
          <div className="p-6 space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">การจองห้องพักสำเร็จเรียบร้อย!</h3>
              <p className="text-xs text-slate-300">
                ขอขอบคุณที่ไว้วางใจเลือกพักผ่อนกับ Happy Hotel ระบบได้บันทึกการจองและออกใบยืนยันแล้ว
              </p>
            </div>

            {/* Receipt Card */}
            <div className="p-5 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 relative overflow-hidden font-sans">
              {/* Luxury stamp */}
              <div className="absolute top-4 right-4 border-2 border-emerald-600 text-emerald-700 font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded uppercase tracking-wider rotate-6 opacity-90">
                PAID • CONFIRMED
              </div>

              <div className="border-b border-slate-200 pb-3 mb-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">BOOKING CONFIRMATION</div>
                <div className="text-xl font-serif font-bold text-[#0B132B]">{latestReceipt.bookingRef}</div>
                <div className="text-xs text-slate-500">จองเมื่อ: {new Date(latestReceipt.bookedAt).toLocaleString('th-TH')}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">ห้องพัก:</span>
                  <span className="font-semibold text-slate-900">{latestReceipt.roomName}</span>
                  <span className="text-[10px] text-amber-700 block">{latestReceipt.roomCategory}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">ผู้เข้าพัก:</span>
                  <span className="font-semibold text-slate-900">{latestReceipt.customerName}</span>
                  <span className="text-[10px] text-slate-500 block">{latestReceipt.customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">เช็คอิน - เช็คเอาท์:</span>
                  <span className="font-semibold text-slate-900">{latestReceipt.checkIn} ถึง {latestReceipt.checkOut} ({latestReceipt.nights} คืน)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">ยอดรวมที่ชำระ (จำลอง):</span>
                  <span className="text-base font-bold text-emerald-700">฿{latestReceipt.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
                <span>ช่องทาง: {latestReceipt.paymentMethod}</span>
                <span className="text-emerald-600 font-semibold">สถานะ: ชำระเรียบร้อย (ระบบจำลอง)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  addToast('เปิดหน้าต่างพิมพ์ใบเสร็จการจอง', 'info');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/20 text-xs font-medium text-slate-200 hover:bg-white/10 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>พิมพ์ / บันทึกใบเสร็จ</span>
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    setIsMyBookingsOpen(true);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#1C2541] border border-[#C5A880]/40 text-[#C5A880] text-xs font-medium hover:bg-[#1C2541]/80 text-center"
                >
                  ดูรายการจองทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] font-semibold text-xs hover:brightness-110 shadow-lg text-center"
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
