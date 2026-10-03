import React, { useState } from 'react';
import { 
  Navigation, 
  CloudRain, 
  Camera, 
  Activity, 
  PhoneCall, 
  MessageSquare, 
  Search, 
  Grid, 
  X, 
  BookOpen, 
  Sun, 
  Moon, 
  ShieldCheck 
} from 'lucide-react';

export default function MobileBottomNav({
  onLocateMe,
  onOpenAiForecast,
  onOpenCitizenReport,
  onOpenPublicUpdates,
  onOpenFeedback,
  onOpenEmergency,
  onOpenStandards,
  onOpenAdmin,
  onToggleTheme,
  hasGps = false,
  theme = 'light',
  onToggleSearch,
  isSearchOpen = false,
}) {
  const isDark = theme === 'dark';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuAction = (actionFn) => {
    setIsMenuOpen(false);
    if (typeof actionFn === 'function') actionFn();
  };

  return (
    <>
      {/* ===== BOTTOM SHEET QUICK MENU (เมื่อกดปุ่ม "เมนู") ===== */}
      {isMenuOpen && (
        <div 
          className="sm:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className={`absolute bottom-0 left-0 right-0 rounded-t-3xl border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-2xl transition-all transform animate-in slide-in-from-bottom duration-300 ${
              isDark 
                ? 'bg-slate-900 border-slate-700 text-slate-100' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full inline-block"></span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">เมนูด่วน PrakanGuard</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="ปิดเมนู"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Grid (6 Large Touch Targets) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Emergency Hotline 1784 */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenEmergency)}
                className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-3 transition-all active:scale-95 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <PhoneCall className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold block">สายด่วน ปภ.</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">โทรฟรี 1784 / กู้ภัย</span>
                </div>
              </button>

              {/* 2. Live Citizen Updates */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenPublicUpdates)}
                className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 transition-all active:scale-95 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">อัปเดตสด</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">สถานการณ์ล่าสุด</span>
                </div>
              </button>

              {/* 3. Feedback */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenFeedback)}
                className="p-3 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center gap-3 transition-all active:scale-95 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">ข้อเสนอแนะ</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">แนะนำ / ติชม</span>
                </div>
              </button>

              {/* 4. Water Standards & Color Guide */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenStandards)}
                className="p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center gap-3 transition-all active:scale-95 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">เกณฑ์ระดับน้ำ</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">เขียว/ส้ม/แดง</span>
                </div>
              </button>

              {/* 5. Dark / Light Theme Toggle */}
              <button
                type="button"
                onClick={() => handleMenuAction(onToggleTheme)}
                className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center gap-3 transition-all active:scale-95 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">ธีมหน้าจอ</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}</span>
                </div>
              </button>

              {/* 6. Admin Portal */}
              <button
                type="button"
                onClick={() => handleMenuAction(onOpenAdmin)}
                className="p-3 rounded-2xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/30 text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-all active:scale-95 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">สำหรับเจ้าหน้าที่</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">เข้าสู่ระบบ Admin</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN 5-BUTTON BAR (ใช้งานง่ายด้วยนิ้วโป้ง) ===== */}
      <nav
        aria-label="เมนูหลักสำหรับมือถือ"
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl transition-all duration-200 select-none pb-[env(safe-area-inset-bottom)] ${
          isDark
            ? 'bg-slate-950/97 border-slate-800 text-slate-200 shadow-[0_-8px_25px_rgba(0,0,0,0.7)]'
            : 'bg-white/97 border-slate-200/90 text-slate-700 shadow-[0_-6px_20px_rgba(0,0,0,0.1)]'
        }`}
      >
        <div className="flex items-center justify-between px-2 py-1 max-w-lg mx-auto">
          {/* 1. Locate Me (GPS) */}
          <button
            type="button"
            onClick={() => onLocateMe(false)}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 cursor-pointer ${
              hasGps
                ? (isDark ? 'text-cyan-400 font-bold' : 'text-blue-600 font-bold')
                : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
            }`}
            title="ระบุตำแหน่ง GPS ของฉันบนแผนที่"
          >
            <div className="relative">
              <Navigation className="w-5 h-5 mb-0.5" />
              {hasGps && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">พิกัดฉัน</span>
          </button>

          {/* 2. Search / Filter District */}
          <button
            type="button"
            onClick={() => onToggleSearch?.()}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 cursor-pointer ${
              isSearchOpen
                ? (isDark ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold')
                : (isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600')
            }`}
            title="ค้นหาจุดเสี่ยงหรือกรองอำเภอ"
          >
            <Search className="w-5 h-5 mb-0.5 text-blue-500" />
            <span className="text-[10px] tracking-tight">ค้นหา/อำเภอ</span>
          </button>

          {/* 3. CENTER HERO: Report Flood (ปุ่มใหญ่พิเศษ โทนฟ้าเข้มสดใส ปราศจากสีม่วง) */}
          <div className="flex-1 flex justify-center -mt-5">
            <button
              type="button"
              onClick={onOpenCitizenReport}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-500 text-white shadow-xl shadow-blue-500/50 border-2 border-white dark:border-slate-900 active:scale-90 transition-transform cursor-pointer"
              title="แจ้งรายงานจุดน้ำท่วม"
            >
              <Camera className="w-6 h-6" />
              <span className="text-[8px] font-bold tracking-tight mt-0.5">แจ้งน้ำท่วม</span>
            </button>
          </div>

          {/* 4. Weather / Rain Forecast */}
          <button
            type="button"
            onClick={onOpenAiForecast}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500 hover:text-blue-600'
            }`}
            title="ดูเรดาร์ตรวจฝนและสภาพอากาศสด"
          >
            <CloudRain className="w-5 h-5 mb-0.5 text-blue-500" />
            <span className="text-[10px] tracking-tight">เรดาร์ฝน</span>
          </button>

          {/* 5. Quick Menu Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 cursor-pointer ${
              isMenuOpen
                ? (isDark ? 'text-amber-400 font-bold' : 'text-amber-600 font-bold')
                : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
            }`}
            title="เปิดเมนูด่วนและสายด่วนฉุกเฉิน"
          >
            <Grid className="w-5 h-5 mb-0.5 text-amber-500" />
            <span className="text-[10px] tracking-tight">เมนู</span>
          </button>
        </div>
      </nav>
    </>
  );
}
