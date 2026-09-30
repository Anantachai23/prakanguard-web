import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, Lock, Mail, User, Phone, CheckCircle2, Sparkles, KeyRound } from 'lucide-react';

export const AuthModal = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    setAuthModalMode, 
    login, 
    register, 
    demoUsers 
  } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (authModalMode === 'login') {
      if (!formData.email || !formData.password) {
        addToast('กรุณากรอกอีเมลและรหัสผ่าน', 'warning');
        return;
      }
      login(formData.email, formData.password);
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        addToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'warning');
        return;
      }
      register(formData);
    }
  };

  const handleQuickDemoLogin = (demoUser) => {
    login(demoUser.email, 'password123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-[#0B132B] border border-[#C5A880]/40 rounded-2xl shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/10 bg-gradient-to-r from-[#1C2541] to-[#0B132B]">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C5A880] mb-1">
            <Sparkles className="w-4 h-4" /> HAPPY HOTEL MEMBERSHIP
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
            {authModalMode === 'login' ? 'เข้าสู่ระบบเพื่อดำเนินการจอง' : 'สมัครสมาชิกใหม่'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {authModalMode === 'login' 
              ? 'ท่านสามารถเลือกดูห้องพักได้อิสระ แต่จำเป็นต้องเข้าสู่ระบบก่อนทำการจองห้องพัก' 
              : 'สร้างบัญชีเพื่อรับสิทธิพิเศษ ส่วนลดสมาชิก และจัดการการจองได้สะดวก'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-[#1C2541]/40">
          <button
            type="button"
            onClick={() => setAuthModalMode('login')}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              authModalMode === 'login'
                ? 'text-[#C5A880] border-b-2 border-[#C5A880] bg-[#1C2541]/80 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            เข้าสู่ระบบ (Login)
          </button>
          <button
            type="button"
            onClick={() => setAuthModalMode('register')}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              authModalMode === 'register'
                ? 'text-[#C5A880] border-b-2 border-[#C5A880] bg-[#1C2541]/80 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            สมัครสมาชิก (Register)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">ชื่อ - นามสกุล *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="เช่น คุณกานดา สุวรรณภูมิ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1C2541] border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A880] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">อีเมลผู้ใช้งาน *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="youremail@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1C2541] border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A880] transition-colors"
              />
            </div>
          </div>

          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="081-234-5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1C2541] border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A880] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">รหัสผ่าน *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1C2541] border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A880] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#9A7B4F] text-[#0B132B] font-semibold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-[#C5A880]/20 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{authModalMode === 'login' ? 'เข้าสู่ระบบทันที' : 'ยืนยันการสมัครสมาชิก'}</span>
          </button>
        </form>

        {/* 1-Click Quick Demo Login Section */}
        {authModalMode === 'login' && (
          <div className="px-6 pb-6 pt-2 border-t border-white/10 bg-[#1C2541]/30">
            <div className="flex items-center gap-1.5 text-xs text-[#C5A880] font-medium mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ทดลองเข้าสู่ระบบแบบ 1-Click (Demo Accounts):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(u)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-[#0B132B] border border-white/15 hover:border-[#C5A880] hover:bg-[#1C2541] transition-all text-left"
                >
                  <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#C5A880]/50" />
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-white truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{u.memberTier} (คลิกเข้าเลย)</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
