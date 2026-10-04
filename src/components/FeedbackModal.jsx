import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Star, 
  CheckCircle2, 
  AlertCircle, 
  Heart, 
  Sparkles,
  ShieldCheck,
  User,
  Phone,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

export const FEEDBACK_CATEGORIES = [
  { id: 'suggestion', label: '💡 ข้อเสนอแนะฟีเจอร์ใหม่', desc: 'อยากให้มีฟังก์ชันหรือการแสดงผลเพิ่มเติม' },
  { id: 'issue', label: '⚠️ แจ้งปัญหาการใช้งาน / ระบบ', desc: 'พบข้อผิดพลาดหรือการแสดงผลติดขัด' },
  { id: 'compliment', label: '💖 ติชม / ให้กำลังใจทีมงาน', desc: 'ความประทับใจและความพึงพอใจ' },
  { id: 'other', label: '📝 อื่นๆ', desc: 'ข้อคิดเห็นหรือคำถามทั่วไป' }
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
      setErrorMsg('กรุณากรอกข้อความข้อเสนอแนะหรือข้อติชมของคุณ');
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

    const newFeedback = {
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
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 smooth-backdrop"
    >
      <div className={`w-full max-w-[92vw] sm:max-w-md border rounded-3xl shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[82vh] overflow-hidden smooth-pop transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Top Gradient Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 shrink-0"></div>

        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between gap-2.5 shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner shrink-0 ${
              isDark ? 'bg-teal-950/80 text-teal-400 border border-teal-800' : 'bg-teal-50 text-teal-600 border border-teal-200'
            }`}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base sm:text-lg font-bold leading-tight break-words ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ข้อเสนอแนะ
              </h2>
              <p className={`text-[11px] sm:text-xs mt-0.5 break-words whitespace-normal leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ร่วมแสดงความคิดเห็นหรือข้อเสนอแนะเพื่อร่วมพัฒนาเว็บไซต์รายงานน้ำท่วม
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {isSuccess ? (
            /* Success State */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="w-9 h-9 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  ส่งข้อเสนอแนะเรียบร้อยแล้ว!
                </h3>
                <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  ขอบพระคุณสำหรับข้อเสนอแนะและข้อคิดเห็นของท่าน เพื่อร่วมพัฒนาเว็บไซต์รายงานน้ำท่วมสมุทรปราการครับ
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border text-xs max-w-sm mx-auto flex items-center gap-2.5 ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] text-left">
                  ข้อมูลข้อเสนอแนะถูกบันทึกเข้าระบบเรียบร้อยแล้ว ขอบคุณสำหรับข้อมูลครับ
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                เสร็จสิ้น / ปิดหน้าต่าง
              </button>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Category Picker */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  หัวข้อข้อเสนอแนะ / ประเภทเรื่อง
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {FEEDBACK_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                        category === cat.id
                          ? (isDark ? 'bg-teal-950/60 border-teal-500 text-teal-300 shadow-sm' : 'bg-teal-50/80 border-teal-500 text-teal-900 shadow-xs')
                          : (isDark ? 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                      }`}
                    >
                      <span className="text-xs font-bold">{cat.label}</span>
                      <span className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cat.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    ระดับความพึงพอใจการใช้งาน
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {rating === 5 ? '⭐ ยอดเยี่ยมมาก' : rating === 4 ? '⭐ ดีมาก' : rating === 3 ? '⭐ ปานกลาง' : rating === 2 ? '⭐ ควรปรับปรุง' : '⭐ ต้องแก้ไขด่วน'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 cursor-pointer text-amber-400"
                    >
                      <Star 
                        className={`w-5 h-5 ${
                          (hoverRating || rating) >= star 
                            ? 'fill-amber-400 text-amber-400' 
                            : isDark ? 'text-slate-600' : 'text-slate-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Details */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  ข้อความข้อเสนอแนะหรือข้อติชม <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="เขียนข้อเสนอแนะ เช่น จุดไหนที่อยากให้ปรับปรุง, ฟังก์ชันที่อยากให้มี, หรือความรู้สึกจากการใช้งาน..."
                  rows={4}
                  className={`w-full p-3 rounded-xl border text-xs sm:text-sm leading-relaxed outline-none transition-all ${
                    isDark 
                      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                  }`}
                  style={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}
                  required
                />
              </div>

              {/* Optional User Name & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    ชื่อหรือนามแฝง (ไม่บังคับ)
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="เช่น สมศักดิ์ หรือ ปล่อยว่าง"
                      className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs sm:text-sm outline-none transition-all ${
                        isDark 
                          ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                      }`}
                      style={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    เบอร์โทร/อีเมลติดต่อกลับ (ไม่บังคับ)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="เช่น 08X-XXX-XXXX"
                      className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs sm:text-sm outline-none transition-all ${
                        isDark 
                          ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                      }`}
                      style={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quality & Value Notice */}
              <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-center gap-2 ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
                <span>
                  💡 ทุกข้อคิดเห็นมีคุณค่าอย่างยิ่งในการพัฒนาปรับปรุงระบบรายงานน้ำท่วมให้ดียิ่งขึ้น
                </span>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-teal-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อเสนอแนะ'}</span>
              </button>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
