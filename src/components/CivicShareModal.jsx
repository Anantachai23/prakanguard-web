import React, { useState, useRef } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  CloudRain, 
  ShieldCheck, 
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { CivicCrest, CivicStandards, CivicWeather } from './CivicIcons';
import { playCloseSound, playClickSound } from '../services/soundEffects';

export default function CivicShareModal({
  isOpen,
  onClose,
  weather,
  points = [],
  lastUpdatedTime,
  theme = 'light'
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const cardRef = useRef(null);

  const todayDateObj = new Date();
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const todayThaiShort = `${todayDateObj.getDate()} ${thaiMonths[todayDateObj.getMonth()]} ${todayDateObj.getFullYear() + 543}`;

  const rainProb = Number(weather?.forecast24h?.todayProbability ?? weather?.forecast24h?.todayMaxProb ?? weather?.rainProbabilityToday ?? 25);
  const rainTime = weather?.forecast24h?.todayTimeWindow || weather?.rainTimeWindowToday || 'ไม่มีฝนตก';

  // 6 Districts status summary
  const districts = [
    { name: 'อ.เมืองสมุทรปราการ', status: 'ปกติ (เฝ้าระวังน้ำหนุนปากน้ำ)', safe: true },
    { name: 'อ.บางพลี', status: 'ผิวทางแห้ง สัญจรปกติ', safe: true },
    { name: 'อ.บางบ่อ', status: 'ผิวทางแห้ง สัญจรปกติ', safe: true },
    { name: 'อ.บางเสาธง', status: 'ผิวทางแห้ง สัญจรปกติ', safe: true },
    { name: 'อ.พระประแดง', status: 'ผิวทางแห้ง สัญจรปกติ', safe: true },
    { name: 'อ.พระสมุทรเจดีย์', status: 'ปกติ (ป้อมพระจุลฯ น้ำลด)', safe: true }
  ];

  // Preformatted text for LINE / Social Media
  const shareText = `🌊 สรุปสถานการณ์น้ำท่วม จ.สมุทรปราการ (PrakanGuard)
📅 ประจำวันที่ ${todayThaiShort} (อัปเดต ${lastUpdatedTime || 'เรียลไทม์'})

🌧️ พยากรณ์ฝนวันนี้: โอกาสเกิดฝน ${rainProb}% (${rainTime})
🚗 สภาพการสัญจรรายอำเภอ:
• เมืองสมุทรปราการ: ${districts[0].status}
• บางพลี: ${districts[1].status}
• บางบ่อ: ${districts[2].status}
• บางเสาธง: ${districts[3].status}
• พระประแดง: ${districts[4].status}
• พระสมุทรเจดีย์: ${districts[5].status}

⚠️ สายด่วนสาธารณภัย ปภ. 1784 (โทรฟรี 24 ชม.)
🔗 ตรวจเช็กระดับน้ำสดและเรดาร์ฝนเรียลไทม์ได้ที่:
https://prakanguard-web.vercel.app`;

  const handleNativeShare = async () => {
    try { playClickSound(); } catch (_) {}
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PrakanGuard - สรุปสถานการณ์น้ำ จ.สมุทรปราการ',
          text: shareText,
          url: 'https://prakanguard-web.vercel.app'
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    try { playClickSound(); } catch (_) {}
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadImage = () => {
    try { playClickSound(); } catch (_) {}
    setIsGeneratingImg(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1080);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#020617');
      bgGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1080);

      // Top Accent Header
      const headerGrad = ctx.createLinearGradient(0, 0, 1080, 0);
      headerGrad.addColorStop(0, '#2563eb');
      headerGrad.addColorStop(0.5, '#0284c7');
      headerGrad.addColorStop(1, '#10b981');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, 1080, 24);

      // Card Container
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.roundRect(60, 60, 960, 960, 40);
      ctx.fill();
      ctx.stroke();

      // Title & Emblem
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 32px "Prompt", sans-serif';
      ctx.fillText('ศูนย์สารสนเทศเฝ้าระวังอุทกภัย จ.สมุทรปราการ', 110, 140);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px "Prompt", sans-serif';
      ctx.fillText('รายงานสถานการณ์น้ำ & ฝนตก', 110, 210);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 28px "Prompt", sans-serif';
      ctx.fillText(`วันที่ ${todayThaiShort} • อัปเดตสด ${lastUpdatedTime || 'เรียลไทม์'}`, 110, 260);

      // Rain Probability Banner Box
      const rainColor = rainProb >= 60 ? '#e11d48' : rainProb >= 35 ? '#f59e0b' : '#059669';
      ctx.fillStyle = rainColor;
      ctx.roundRect(110, 310, 860, 110, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Prompt", sans-serif';
      ctx.fillText(`🌧️ โอกาสเกิดฝนตกวันนี้: ${rainProb}%`, 140, 378);

      ctx.font = '500 28px "Prompt", sans-serif';
      ctx.fillText(`ช่วงเวลา: ${rainTime}`, 600, 378);

      // Districts Grid Header
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 32px "Prompt", sans-serif';
      ctx.fillText('สรุปสถานะการสัญจร 6 อำเภอ:', 110, 480);

      // 6 Districts boxes
      districts.forEach((d, idx) => {
        const x = idx % 2 === 0 ? 110 : 550;
        const y = 520 + Math.floor(idx / 2) * 115;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.roundRect(x, y, 420, 95, 18);
        ctx.fill();
        ctx.stroke();

        // Status circle dot
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x + 30, y + 48, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px "Prompt", sans-serif';
        ctx.fillText(d.name, x + 55, y + 42);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 20px "Prompt", sans-serif';
        ctx.fillText(d.status, x + 55, y + 74);
      });

      // Bottom footer box
      ctx.fillStyle = '#0f172a';
      ctx.roundRect(110, 885, 860, 95, 20);
      ctx.fill();

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 26px "Prompt", sans-serif';
      ctx.fillText('☎️ สายด่วน ปภ. 1784 (ฟรี 24 ชม.)', 140, 942);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px "Prompt", sans-serif';
      ctx.fillText('🌐 เช็กสด: prakanguard-web.vercel.app', 520, 942);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `prakanguard-summary-${todayDateObj.toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleClose = () => {
    try { playCloseSound(); } catch (_) {}
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[2100] flex items-center justify-center p-3 sm:p-4 py-6 sm:py-8 overflow-y-auto overscroll-contain select-none bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`w-full max-w-[calc(100vw-24px)] xs:max-w-[460px] sm:max-w-md my-auto m-auto border rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-cyan-950/20' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10'
        }`}
      >
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 shrink-0" />

        {/* Header */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-blue-950/80 text-cyan-400' : 'bg-blue-50 text-blue-700'
            }`}>
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">แชร์สรุปสถานการณ์น้ำ</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                ส่งต่อข้อมูลเตือนภัยทาง LINE หรือโซเชียลมีเดีย
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Preview Card */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 custom-scrollbar-thin text-xs">
          
          <div 
            ref={cardRef}
            className={`p-4 rounded-2xl border transition-all ${
              isDark 
                ? 'bg-slate-950/80 border-slate-800' 
                : 'bg-slate-50/90 border-slate-200/90 shadow-2xs'
            }`}
          >
            {/* Crest & Title */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <CivicCrest className="w-5 h-5 text-blue-600 dark:text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-xs block text-slate-900 dark:text-white truncate">
                    PrakanGuard • จ.สมุทรปราการ
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {todayThaiShort} • สรุปสด {lastUpdatedTime || 'เรียลไทม์'}
                  </span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono shrink-0 ${
                rainProb >= 60
                  ? 'bg-rose-600 text-white'
                  : rainProb >= 35
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                ฝน {rainProb}%
              </span>
            </div>

            {/* Weather line */}
            <div className="py-2.5 flex items-center justify-between text-[11.5px] border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">ช่วงเวลาเสี่ยงฝนตก:</span>
              <strong className="text-slate-900 dark:text-white font-semibold">{rainTime}</strong>
            </div>

            {/* 6 Districts */}
            <div className="py-2.5 space-y-1.5 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-[10.5px] font-bold block text-slate-400 uppercase tracking-wide">
                สภาพผิวจราจร 6 อำเภอ
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {districts.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span className="truncate">{d.name.replace(/^อ\./, '')}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom hotline */}
            <div className="pt-2.5 flex items-center justify-between text-[10.5px] text-slate-500">
              <span>สายด่วน ปภ. 1784 (24 ชม.)</span>
              <span className="font-mono text-blue-600 dark:text-cyan-400 font-bold">prakanguard-web.vercel.app</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Button 1: Share directly to LINE / OS */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>แชร์สรุปไปยัง LINE / แอปอื่น</span>
            </button>

            {/* Button 2: Copy Text */}
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-2 rounded-full font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                copied
                  ? 'bg-blue-600 text-white border-blue-600'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'คัดลอกข้อความสำหรับ LINE แล้ว!' : 'คัดลอกข้อความสรุป'}</span>
            </button>

            {/* Button 3: Download Graphic Image */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGeneratingImg}
              className={`w-full py-2 rounded-full font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-cyan-300'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-blue-700'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingImg ? 'กำลังสร้างรูปภาพ...' : 'บันทึกรูปภาพสรุป (PNG)'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
