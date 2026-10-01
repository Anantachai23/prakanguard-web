import React from 'react';
import { Navigation, CloudRain, Camera, Activity, PhoneCall } from 'lucide-react';

export default function MobileBottomNav({
  onLocateMe,
  onOpenAiForecast,
  onOpenCitizenReport,
  onOpenPublicUpdates,
  onOpenEmergency,
  hasGps = false,
  theme = 'light'
}) {
  const isDark = theme === 'dark';

  return (
    <nav 
      aria-label="เมนูหลักสำหรับมือถือ"
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl transition-all duration-200 select-none pb-[env(safe-area-inset-bottom)] ${
        isDark 
          ? 'bg-slate-950/95 border-slate-800 text-slate-200 shadow-[0_-8px_25px_rgba(0,0,0,0.6)]' 
          : 'bg-white/95 border-slate-200/90 text-slate-700 shadow-[0_-6px_20px_rgba(0,0,0,0.08)]'
      }`}
    >
      <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
        {/* 1. Locate Me */}
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">พิกัดฉัน</span>
        </button>

        {/* 2. Live Weather / Radar */}
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

        {/* 3. Center Hero: Report Flood (แจ้งน้ำท่วม - ปุ่มเด่นกลาง สดใส กดง่าย) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            onClick={onOpenCitizenReport}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-violet-600/40 border-2 border-white dark:border-slate-900 active:scale-90 transition-transform cursor-pointer"
            title="แจ้งจุดน้ำท่วมภาคประชาชน พร้อมแนบภาพ"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tight mt-0.5">แจ้งน้ำ</span>
          </button>
        </div>

        {/* 4. Live Updates Feed */}
        <button
          type="button"
          onClick={onOpenPublicUpdates}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 cursor-pointer relative ${
            isDark ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-500 hover:text-emerald-600'
          }`}
          title="ดูอัปเดตรายงานสถานการณ์สด"
        >
          <div className="relative">
            <Activity className="w-5 h-5 mb-0.5 text-emerald-500" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse absolute -top-0.5 -right-0.5" />
          </div>
          <span className="text-[10px] tracking-tight">อัปเดตสด</span>
        </button>

        {/* 5. Emergency Hotline */}
        <button
          type="button"
          onClick={onOpenEmergency}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-rose-500 hover:text-rose-600 active:scale-90 cursor-pointer"
          title="โทรสายด่วนฉุกเฉิน ปภ./กู้ภัย"
        >
          <PhoneCall className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">สายด่วน</span>
        </button>
      </div>
    </nav>
  );
}
