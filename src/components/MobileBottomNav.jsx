import React, { useState } from 'react';
import { Navigation, CloudRain, Camera, Activity, PhoneCall, MessageSquare, ChevronUp, ChevronDown, Search, MapPin } from 'lucide-react';

export default function MobileBottomNav({
  onLocateMe,
  onOpenAiForecast,
  onOpenCitizenReport,
  onOpenPublicUpdates,
  onOpenFeedback,
  onOpenEmergency,
  hasGps = false,
  theme = 'light',
  // ฟีเจอร์ใหม่: เปิด/ปิด search panel
  onToggleSearch,
  isSearchOpen = false,
}) {
  const isDark = theme === 'dark';
  const [expanded, setExpanded] = useState(false);

  return (
    <nav
      aria-label="เมนูหลักสำหรับมือถือ"
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl transition-all duration-200 select-none pb-[env(safe-area-inset-bottom)] ${
        isDark
          ? 'bg-slate-950/97 border-slate-800 text-slate-200 shadow-[0_-8px_25px_rgba(0,0,0,0.7)]'
          : 'bg-white/97 border-slate-200/90 text-slate-700 shadow-[0_-6px_20px_rgba(0,0,0,0.1)]'
      }`}
    >
      {/* ===== SECONDARY ROW (เปิดเมื่อ expanded) ===== */}
      {expanded && (
        <div className={`flex items-center justify-around px-2 pt-1.5 pb-0 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          {/* Search / Filter */}
          <button
            type="button"
            onClick={() => { onToggleSearch?.(); setExpanded(false); }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer ${
              isSearchOpen
                ? (isDark ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold')
                : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
            }`}
          >
            <Search className="w-4 h-4 mb-0.5 text-blue-500" />
            <span className="text-[9px] tracking-tight">ค้นหา</span>
          </button>

          {/* Live Updates Feed */}
          <button
            type="button"
            onClick={() => { onOpenPublicUpdates(); setExpanded(false); }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer relative ${
              isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            <div className="relative">
              <Activity className="w-4 h-4 mb-0.5 text-emerald-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse absolute -top-0.5 -right-0.5" />
            </div>
            <span className="text-[9px] tracking-tight">อัปเดตสด</span>
          </button>

          {/* Feedback */}
          <button
            type="button"
            onClick={() => { onOpenFeedback(); setExpanded(false); }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-teal-400' : 'text-slate-500 hover:text-teal-600'
            }`}
          >
            <MessageSquare className="w-4 h-4 mb-0.5 text-teal-500" />
            <span className="text-[9px] tracking-tight">ข้อเสนอแนะ</span>
          </button>

          {/* Emergency */}
          <button
            type="button"
            onClick={() => { onOpenEmergency(); setExpanded(false); }}
            className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl text-rose-500 hover:text-rose-600 active:scale-90 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-bold tracking-tight">สายด่วน</span>
          </button>
        </div>
      )}

      {/* ===== MAIN ROW (แสดงเสมอ) ===== */}
      <div className="flex items-center justify-between px-1 py-1 max-w-lg mx-auto">

        {/* 1. Locate Me (GPS) */}
        <button
          type="button"
          onClick={() => onLocateMe(false)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer ${
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
          <span className="text-[9px] tracking-tight">พิกัดฉัน</span>
        </button>

        {/* 2. Weather / Radar */}
        <button
          type="button"
          onClick={onOpenAiForecast}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500 hover:text-blue-600'
          }`}
          title="ดูเรดาร์ตรวจฝนและสภาพอากาศสด"
        >
          <CloudRain className="w-5 h-5 mb-0.5 text-blue-500" />
          <span className="text-[9px] tracking-tight">เรดาร์ฝน</span>
        </button>

        {/* 3. CENTER HERO: Report Flood (ปุ่มกลางยกขึ้น) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            onClick={onOpenCitizenReport}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-500 text-white shadow-xl shadow-blue-500/50 border-2 border-white dark:border-slate-900 active:scale-90 transition-transform cursor-pointer"
            title="แจ้งรายงานจุดน้ำท่วม"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[8px] font-bold tracking-tight mt-0.5 leading-tight text-center">แจ้ง<br/>จุดท่วม</span>
          </button>
        </div>

        {/* 4. Map Pins (nearby points quick look) */}
        <button
          type="button"
          onClick={() => onToggleSearch?.()}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer ${
            isSearchOpen
              ? (isDark ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold')
              : (isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600')
          }`}
          title="ค้นหาจุดเสี่ยงหรือกรองอำเภอ"
        >
          <MapPin className="w-5 h-5 mb-0.5 text-blue-500" />
          <span className="text-[9px] tracking-tight">ค้นหา</span>
        </button>

        {/* 5. More / Expand secondary row */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer ${
            expanded
              ? (isDark ? 'text-amber-400 font-bold' : 'text-amber-600 font-bold')
              : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
          }`}
          title="เมนูเพิ่มเติม"
        >
          {expanded
            ? <ChevronDown className="w-5 h-5 mb-0.5" />
            : <ChevronUp className="w-5 h-5 mb-0.5" />
          }
          <span className="text-[9px] tracking-tight">เพิ่มเติม</span>
        </button>

      </div>
    </nav>
  );
}
