import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  User,
  Phone
} from 'lucide-react';
import { checkRateLimit, sanitizeFeedbackPayload } from '../services/securityService';
import { CivicFeedback, CivicShield } from './CivicIcons';

export const FEEDBACK_CATEGORIES = [
  { id: 'suggestion', label: 'ข้อเสนอแนะระบบ', desc: 'เสนอแนะฟังก์ชันหรือข้อมูลเพิ่มเติม' },
  { id: 'issue', label: 'แจ้งปัญหาการใช้งาน', desc: 'รายงานข้อผิดพลาดหรือการแสดงผล' },
  { id: 'compliment', label: 'ประเมินความพึงพอใจ', desc: 'ความคิดเห็นต่อการให้บริการข้อมูล' },
  { id: 'other', label: 'เรื่องอื่นๆ', desc: 'สอบถามหรือประสานงานทั่วไป' }
];

export default function FeedbackModal({ isOpen, onClose, theme = 'light', onFeedbackSubmitted }) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const [category, setCategory] = useState('suggestion');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('กรุณากรอกรายละเอียดข้อเสนอแนะ');
      return;
    }

    const rateCheck = checkRateLimit('citizen_feedback', 25);
    if (!rateCheck.allowed) {
      setErrorMsg(`กรุณารออีก ${rateCheck.waitSeconds} วินาที ก่อนส่งข้อความถัดไป`);
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    const now = new Date();
    const timeFormatted = now.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }) + ' ' + now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    const catMeta = FEEDBACK_CATEGORIES.find(c => c.id === category) || FEEDBACK_CATEGORIES[0];

    const rawFeedback = {
      id: 'fb-' + Date.now(),
      category: category,
      categoryLabel: catMeta.label,
      rating: rating,
      message: message.trim(),
      senderName: senderName.trim() || 'ประชาชนทั่วไป (ไม่ประสงค์ออกนาม)',
      contact: contact.trim() || '-',
      submittedAt: timeFormatted,
      timestamp: Date.now(),
      isRead: false
    };

    const newFeedback = sanitizeFeedbackPayload(rawFeedback) || rawFeedback;

    try {
      const existingStr = localStorage.getItem('prakanguard_feedback_items');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updated = [newFeedback, ...existing];
      localStorage.setItem('prakanguard_feedback_items', JSON.stringify(updated));

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(newFeedback);
      }
    } catch (err) {
      console.warn('LocalStorage error saving feedback', err);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setMessage('');
    setSenderName('');
    setContact('');
    setCategory('suggestion');
    setRating(5);
    setErrorMsg('');
    onClose();
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) handleResetAndClose(); }}
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
    >
      <div className={`w-[88vw] max-w-[335px] sm:max-w-lg my-auto m-auto border rounded-xl shadow-2xl flex flex-col max-h-[72vh] sm:max-h-[84vh] overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Top Institutional Bar */}
        <div className="h-1 w-full bg-blue-700 shrink-0" />

        {/* Header */}
        <div className={`px-3 py-2 sm:px-4 sm:py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-white text-blue-700 border-slate-200 shadow-2xs'
            }`}>
              <CivicFeedback className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-xs sm:text-sm font-bold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                แบบรับฟังความคิดเห็นและแจ้งปัญหา
              </h2>
              <p className={`text-[9.5px] sm:text-xs mt-0.5 leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ส่งข้อมูลถึงผู้ดูแลระบบเพื่อพัฒนาการให้บริการสาธารณะ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200'
            }`}
            title="ปิดหน้าต่าง"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 overflow-y-auto flex-1">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  บันทึกข้อมูลเรียบร้อยแล้ว
                </h3>
                <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  ขอบคุณสำหรับความคิดเห็น ระบบได้ส่งข้อมูลไปยังศูนย์ผู้ดูแลระบบเรียบร้อยแล้ว
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="mt-2 px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Category Selector */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  ประเภทเรื่องที่ต้องการแจ้ง
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FEEDBACK_CATEGORIES.map(cat => {
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                          active
                            ? (isDark ? 'bg-blue-950/60 border-blue-500 text-white' : 'bg-blue-50/80 border-blue-600 text-blue-900')
                            : (isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')
                        }`}
                      >
                        <span className="text-xs font-semibold block">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star Rating */}
              <div className={`px-3.5 py-2.5 rounded-lg border flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    ระดับความพึงพอใจ
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {rating === 5 ? 'ดีเยี่ยม (5/5)' : rating === 4 ? 'ดีมาก (4/5)' : rating === 3 ? 'ปานกลาง (3/5)' : rating === 2 ? 'ควรปรับปรุง (2/5)' : 'ต้องแก้ไข (1/5)'}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform cursor-pointer text-amber-400"
                    >
                      <Star 
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          (hoverRating || rating) >= star 
                            ? 'fill-amber-400 text-amber-400' 
                            : isDark ? 'text-slate-700' : 'text-slate-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  รายละเอียด <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ระบุข้อเสนอแนะ หรือปัญหาการใช้งานที่พบ..."
                  rows={3}
                  className={`w-full p-3 rounded-lg border text-xs sm:text-sm leading-relaxed outline-none transition-colors resize-none ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  }`}
                  required
                />
              </div>

              {/* Optional Name & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    ชื่อผู้แจ้ง (ไม่บังคับ)
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="ชื่อ หรือ นามแฝง"
                      className={`w-full pl-8 pr-3 py-2 rounded-lg border text-xs outline-none transition-colors ${
                        isDark 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    ข้อมูลติดต่อกลับ (ไม่บังคับ)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="โทรศัพท์ หรือ อีเมล"
                      className={`w-full pl-8 pr-3 py-2 rounded-lg border text-xs outline-none transition-colors ${
                        isDark 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-blue-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between gap-3">
                <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <CivicShield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>ส่งตรงถึงศูนย์ผู้ดูแลระบบ</span>
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'ส่งข้อมูลข้อเสนอแนะ'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
