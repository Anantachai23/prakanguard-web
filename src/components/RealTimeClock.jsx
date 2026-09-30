import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

const THAI_DAYS = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์'
];

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export default function RealTimeClock({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // 1-second interval for real-time live clock ticking
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dayOfWeek = now.getDay();
  const dayNameFull = THAI_DAYS[dayOfWeek];
  const dayNameShort = THAI_DAYS_SHORT[dayOfWeek];
  const date = now.getDate();
  const monthIdx = now.getMonth();
  const monthNameFull = THAI_MONTHS[monthIdx];
  const monthNameShort = THAI_MONTHS_SHORT[monthIdx];
  const yearBE = now.getFullYear() + 543;
  const yearBEShort = String(yearBE).slice(-2);

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl border text-[11px] sm:text-xs font-mono font-medium shadow-2xs select-none transition-colors ${
        isDark 
          ? 'bg-slate-900/90 border-slate-700 text-slate-200' 
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}
      title={`วัน${dayNameFull}ที่ ${date} ${monthNameFull} พ.ศ. ${yearBE} เวลา ${hours}:${minutes}:${seconds} น.`}
    >
      <div className="flex items-center gap-1 text-blue-500 shrink-0">
        <Calendar className="w-3.5 h-3.5" />
      </div>

      {/* Date display (Full on desktop, compact on mobile) */}
      <div className="flex items-center gap-1 truncate">
        {/* Full Date for XL screens */}
        <span className="hidden xl:inline font-sans font-semibold">
          {dayNameFull}ที่ {date} {monthNameFull} {yearBE}
        </span>

        {/* Medium Date for MD-LG screens */}
        <span className="hidden sm:inline xl:hidden font-sans font-semibold">
          {dayNameShort} {date} {monthNameShort} {yearBE}
        </span>

        {/* Compact Date for Mobile */}
        <span className="inline sm:hidden font-sans font-semibold">
          {date} {monthNameShort} {yearBEShort}
        </span>

        <span className="text-slate-400 font-sans">•</span>

        {/* Real-time Digital Clock with Blinking Colon and Ticking Seconds */}
        <span className="flex items-center font-bold text-blue-600 dark:text-cyan-400">
          <Clock className="w-3 h-3 mr-0.5 inline shrink-0" />
          <span>{hours}:{minutes}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">:{seconds}</span>
          <span className="ml-0.5 text-[10px] font-sans">น.</span>
        </span>
      </div>

      {/* Live Indicator Dot */}
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5 shrink-0"></span>
    </div>
  );
}
