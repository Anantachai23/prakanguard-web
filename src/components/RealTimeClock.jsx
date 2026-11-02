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

export default function RealTimeClock({ theme = 'light', variant = 'default', className = '' }) {
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

  if (variant === 'bare') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium select-none tabular-nums text-slate-700 dark:text-slate-200 ${className}`}
        title={`วัน${dayNameFull}ที่ ${date} ${monthNameFull} พ.ศ. ${yearBE} เวลา ${hours}:${minutes}:${seconds} น. (เวลามาตรฐานประเทศไทย ICT)`}
      >
        <div className="flex items-center gap-1 text-blue-500 dark:text-cyan-400 shrink-0">
          <Clock className="w-3.5 h-3.5" />
        </div>

        {/* Date display */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden xl:inline font-sans font-medium text-slate-600 dark:text-slate-400">
            {dayNameShort} {date} {monthNameShort}
          </span>

          <span className="hidden xl:inline text-slate-350 dark:text-slate-600 font-sans">•</span>

          <span className="flex items-center font-bold text-slate-800 dark:text-slate-100 shrink-0 tracking-tight">
            <span>{hours}:{minutes}</span>
            <span className="ml-0.5 text-[10px] font-sans font-medium text-slate-500 dark:text-slate-400">น.</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-3 h-[34px] rounded-full border text-xs font-mono font-medium select-none transition-colors max-w-full shrink-0 tabular-nums ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-200' 
          : 'bg-white border-slate-200 text-slate-700'
      } ${className}`}
      title={`วัน${dayNameFull}ที่ ${date} ${monthNameFull} พ.ศ. ${yearBE} เวลา ${hours}:${minutes}:${seconds} น. (เวลามาตรฐานประเทศไทย ICT)`}
    >
      <div className="flex items-center gap-1 text-blue-500 dark:text-cyan-400 shrink-0">
        <Clock className="w-3.5 h-3.5" />
      </div>

      {/* Date display */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="hidden xl:inline font-sans font-semibold text-slate-600 dark:text-slate-300">
          {dayNameShort} {date} {monthNameShort}
        </span>

        <span className="hidden xl:inline text-slate-400 font-sans">•</span>

        <span className="flex items-center font-bold text-slate-800 dark:text-slate-100 shrink-0 tracking-tight">
          <span>{hours}:{minutes}</span>
          <span className="ml-1 text-[10.5px] font-sans font-medium text-slate-500 dark:text-slate-400">น.</span>
        </span>
      </div>
    </div>
  );
}
