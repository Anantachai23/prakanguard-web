import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  CloudRain, 
  ShieldAlert, 
  AlertTriangle,
  Navigation,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { CivicCrest } from './CivicIcons';
import { playCloseSound, playClickSound } from '../services/soundEffects';
import { resolveLevel, isPointDry, isWaterReceding } from './MapView';
import { isPointInSamutPrakan } from '../data/samutPrakanBoundary';

// Safe rounded rectangle path helper with 100% browser compatibility
function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(typeof radius === 'number' ? radius : 12, width / 2, height / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// Helper to truncate text safely if it exceeds canvas container
function truncateText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let str = String(text);
  while (str.length > 0 && ctx.measureText(str + '...').width > maxWidth) {
    str = str.slice(0, -1);
  }
  return str + '...';
}

export default function CivicShareModal({
  isOpen,
  onClose,
  weather,
  points = [],
  citizenReports = [],
  levelCounts = null,
  lastUpdatedTime,
  theme = 'light'
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // Date formatting in Thai
  const todayDateObj = new Date();
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const todayThaiShort = `${todayDateObj.getDate()} ${thaiMonths[todayDateObj.getMonth()]} ${todayDateObj.getFullYear() + 543}`;

  // Active flood points calculation
  const allActivePoints = useMemo(() => {
    const official = (points || []).filter(p => p && !isPointDry(p) && isPointInSamutPrakan(p.lat, p.lng));
    const citizen = (citizenReports || []).filter(r => r && r.isApproved === true && !isPointDry(r) && isPointInSamutPrakan(r.lat, r.lng));
    const combined = [...official, ...citizen];

    combined.sort((a, b) => {
      const lvlA = resolveLevel(a);
      const lvlB = resolveLevel(b);
      if (lvlB !== lvlA) return lvlB - lvlA;
      return (Number(b.depthCm) || 0) - (Number(a.depthCm) || 0);
    });

    return combined;
  }, [points, citizenReports]);

  // Real synchronized severity counts
  const stats = useMemo(() => {
    if (levelCounts) {
      return {
        severe: levelCounts.severe || 0,
        moderate: levelCounts.moderate || 0,
        minor: levelCounts.minor || 0,
        falling: levelCounts.falling || 0,
        totalActive: (levelCounts.severe || 0) + (levelCounts.moderate || 0) + (levelCounts.minor || 0)
      };
    }
    let severe = 0, moderate = 0, minor = 0, falling = 0;
    allActivePoints.forEach(p => {
      const lvl = resolveLevel(p);
      if (lvl === 3) severe++;
      else if (lvl === 2) moderate++;
      else minor++;
      if (isWaterReceding(p)) falling++;
    });
    return { severe, moderate, minor, falling, totalActive: allActivePoints.length };
  }, [levelCounts, allActivePoints]);

  // Rain probability & time window
  const rainProb = Number(weather?.forecast24h?.todayProbability ?? weather?.forecast24h?.todayMaxProb ?? weather?.rainProbabilityToday ?? 25);
  const rainTime = weather?.forecast24h?.todayTimeWindow || weather?.rainTimeWindowToday || 'ไม่มีกลุ่มฝนหนัก';

  // 6 Districts status summary calculated dynamically
  const districts = useMemo(() => {
    const list = [
      { id: 'เมือง', name: 'เมืองสมุทรปราการ', query: 'เมือง' },
      { id: 'บางพลี', name: 'บางพลี', query: 'บางพลี' },
      { id: 'พระประแดง', name: 'พระประแดง', query: 'พระประแดง' },
      { id: 'พระสมุทรเจดีย์', name: 'พระสมุทรเจดีย์', query: 'พระสมุทรเจดีย์' },
      { id: 'บางบ่อ', name: 'บางบ่อ', query: 'บางบ่อ' },
      { id: 'บางเสาธง', name: 'บางเสาธง', query: 'บางเสาธง' }
    ];

    return list.map(dist => {
      const distPoints = allActivePoints.filter(p => {
        const dStr = String(p.district || '');
        return dStr.includes(dist.query);
      });

      if (distPoints.length === 0) {
        return {
          name: `อ.${dist.name}`,
          status: 'ผิวทางแห้ง สัญจรปกติ',
          level: 0,
          pointsCount: 0
        };
      }

      const maxLvl = Math.max(...distPoints.map(p => resolveLevel(p)));
      const topPoint = distPoints[0];
      const depthText = topPoint.depthCm ? `${topPoint.depthCm} ซม.` : '';
      const isReceding = isWaterReceding(topPoint);

      let status = '';
      if (maxLvl === 3) {
        status = `วิกฤต ${distPoints.length} จุด (${depthText} รถเล็กห้ามผ่าน)`;
      } else if (maxLvl === 2) {
        status = `น้ำท่วมขัง ${distPoints.length} จุด (${depthText} ควรเลี่ยง)`;
      } else {
        status = isReceding 
          ? `เฝ้าระวัง ${distPoints.length} จุด (${depthText} น้ำกำลังลด)`
          : `เฝ้าระวัง ${distPoints.length} จุด (${depthText} สัญจรได้)`;
      }

      return {
        name: `อ.${dist.name}`,
        status,
        level: maxLvl,
        pointsCount: distPoints.length,
        topPointName: topPoint.name
      };
    });
  }, [allActivePoints]);

  // Preformatted text for LINE & Social Media
  const shareText = useMemo(() => {
    let pointLines = '';
    if (allActivePoints.length > 0) {
      pointLines = '\n📍 จุดเฝ้าระวัง & ระดับน้ำสำคัญ:\n' + 
        allActivePoints.slice(0, 4).map(pt => {
          const lvl = resolveLevel(pt);
          const receding = isWaterReceding(pt);
          const depth = pt.depthCm ? `${pt.depthCm} ซม.` : (lvl === 3 ? '>50 ซม.' : lvl === 2 ? '21-50 ซม.' : '5-20 ซม.');
          const tag = lvl === 3 ? '🔴 วิกฤต' : lvl === 2 ? '🟡 ปานกลาง' : '🟢 ปกติ';
          const trend = receding ? ' (น้ำกำลังลดลง)' : '';
          return `• ${pt.name}: ${tag} ${depth}${trend}`;
        }).join('\n') + '\n';
    } else {
      pointLines = '\n✅ ทุกเส้นทางสายหลักในจังหวัดผิวทางแห้ง สัญจรได้ปกติ ไม่มีน้ำท่วมขัง\n';
    }

    return `🌊 สรุปสถานการณ์น้ำท่วม จ.สมุทรปราการ (PrakanGuard)
📅 ประจำวันที่ ${todayThaiShort} (อัปเดต ${lastUpdatedTime || 'เรียลไทม์'})

📊 ภาพรวม: วิกฤต ${stats.severe} จุด | ปานกลาง ${stats.moderate} จุด | เฝ้าระวัง ${stats.minor} จุด | น้ำลด ${stats.falling} จุด
🌧️ พยากรณ์ฝนวันนี้: โอกาสเกิดฝน ${rainProb}% (${rainTime})
${pointLines}
🚗 สภาพการสัญจรรายอำเภอ:
${districts.map(d => `• ${d.name.replace(/^อ\./, '')}: ${d.status}`).join('\n')}

⚠️ สายด่วนสาธารณภัย ปภ. 1784 (โทรฟรี 24 ชม.)
🔗 ตรวจเช็กระดับน้ำสดและเรดาร์ฝนเรียลไทม์:
https://prakanguard-web.vercel.app`;
  }, [allActivePoints, stats, rainProb, rainTime, todayThaiShort, lastUpdatedTime, districts]);

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

  // Comprehensive Infographic Graphic Generator on HTML5 Canvas
  const handleDownloadImage = () => {
    try { playClickSound(); } catch (_) {}
    setIsGeneratingImg(true);

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');

        // Font Family Fallback
        const fontSans = '"Prompt", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        // 1. Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 1200);
        bgGrad.addColorStop(0, '#0a101d');
        bgGrad.addColorStop(0.5, '#020617');
        bgGrad.addColorStop(1, '#070c18');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, 1200);

        // 2. Top Header Stripe
        const headerGrad = ctx.createLinearGradient(0, 0, 1080, 0);
        headerGrad.addColorStop(0, '#2563eb');
        headerGrad.addColorStop(0.5, '#0ea5e9');
        headerGrad.addColorStop(1, '#10b981');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, 1080, 16);

        // 3. Main Border Container
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        drawRoundRect(ctx, 40, 36, 1000, 1128, 32);
        ctx.fill();
        ctx.stroke();

        // 4. Header: Logo & Title
        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold 24px ${fontSans}`;
        ctx.fillText('ศูนย์ประสานงานสารสนเทศน้ำท่วม จ.สมุทรปราการ • PRAKANGUARD', 75, 95);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 44px ${fontSans}`;
        ctx.fillText('สรุปสถานการณ์น้ำท่วม & ฝนตก', 75, 155);

        ctx.fillStyle = '#94a3b8';
        ctx.font = `500 22px ${fontSans}`;
        ctx.fillText(`ประจำวันที่ ${todayThaiShort} • อัปเดตข้อมูลสด ${lastUpdatedTime || 'เรียลไทม์'}`, 75, 195);

        // 5. Four Overview Stats Cards
        const statBoxes = [
          { label: 'จุดวิกฤต (>50 ซม.)', count: stats.severe, color: '#dc2626', bg: 'rgba(220,38,38,0.15)', border: '#ef4444' },
          { label: 'จุดปานกลาง (21-50)', count: stats.moderate, color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: '#facc15' },
          { label: 'จุดปกติ / เฝ้าระวัง', count: stats.minor, color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: '#34d399' },
          { label: 'น้ำกำลังลดลง', count: stats.falling, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: '#22d3ee' }
        ];

        const cardW = 222;
        statBoxes.forEach((box, i) => {
          const bx = 75 + i * (cardW + 14);
          const by = 225;

          ctx.fillStyle = box.bg;
          ctx.strokeStyle = box.border;
          ctx.lineWidth = 2;
          drawRoundRect(ctx, bx, by, cardW, 88, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = box.color;
          ctx.font = `900 36px ${fontSans}`;
          ctx.fillText(String(box.count), bx + 18, by + 46);

          ctx.fillStyle = '#e2e8f0';
          ctx.font = `bold 14px ${fontSans}`;
          ctx.fillText(box.label, bx + 18, by + 72);
        });

        // 6. Rain 24h Forecast Box
        const rainColor = rainProb >= 60 ? '#e11d48' : rainProb >= 35 ? '#d97706' : '#059669';
        ctx.fillStyle = rainColor;
        drawRoundRect(ctx, 75, 335, 930, 85, 18);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 28px ${fontSans}`;
        ctx.fillText(`🌧️ โอกาสเกิดฝนตกวันนี้: ${rainProb}%`, 105, 388);

        ctx.font = `500 22px ${fontSans}`;
        ctx.fillText(`ช่วงเวลาเสี่ยง: ${rainTime}`, 600, 388);

        // 7. Active Flood Points Section
        ctx.fillStyle = '#f8fafc';
        ctx.font = `bold 26px ${fontSans}`;
        ctx.fillText('📍 จุดเฝ้าระวัง & ระดับน้ำสำคัญในพื้นที่:', 75, 465);

        if (allActivePoints.length === 0) {
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          drawRoundRect(ctx, 75, 485, 930, 95, 16);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#10b981';
          ctx.font = `bold 22px ${fontSans}`;
          ctx.fillText('✅ ทุกเส้นทางสายหลักในจังหวัดสมุทรปราการ ผิวทางแห้งสนิท สัญจรได้คล่องตัวทุกเส้นทาง', 105, 542);
        } else {
          // Render top 3 active points with details
          const displaySlice = allActivePoints.slice(0, 3);
          displaySlice.forEach((pt, idx) => {
            const py = 485 + idx * 82;
            const lvl = resolveLevel(pt);
            const isReceding = isWaterReceding(pt);
            const depth = pt.depthCm ? `${pt.depthCm} ซม.` : (lvl === 3 ? '>50 ซม.' : lvl === 2 ? '21-50 ซม.' : '5-20 ซม.');
            const badgeColor = lvl === 3 ? '#dc2626' : lvl === 2 ? '#eab308' : '#10b981';

            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = lvl === 3 ? '#ef4444' : '#334155';
            ctx.lineWidth = lvl === 3 ? 2 : 1.5;
            drawRoundRect(ctx, 75, py, 930, 72, 16);
            ctx.fill();
            ctx.stroke();

            // Status Indicator Dot
            ctx.fillStyle = badgeColor;
            ctx.beginPath();
            ctx.arc(105, py + 36, 9, 0, Math.PI * 2);
            ctx.fill();

            // Point Name + District
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 21px ${fontSans}`;
            const nameTrunc = truncateText(ctx, pt.name, 480);
            ctx.fillText(nameTrunc, 128, py + 36);

            ctx.fillStyle = '#94a3b8';
            ctx.font = `500 16px ${fontSans}`;
            ctx.fillText(`อ.${String(pt.district || '').replace(/^อ\./, '')}`, 128, py + 58);

            // Water Depth Pill
            ctx.fillStyle = badgeColor;
            drawRoundRect(ctx, 640, py + 18, 120, 36, 18);
            ctx.fill();

            ctx.fillStyle = lvl === 2 ? '#020617' : '#ffffff';
            ctx.font = `900 17px ${fontSans}`;
            ctx.fillText(depth, 655, py + 42);

            // Trend & Traffic Label
            ctx.fillStyle = isReceding ? '#2dd4bf' : '#cbd5e1';
            ctx.font = `bold 16px ${fontSans}`;
            const statusLabel = isReceding ? 'น้ำกำลังลด' : (lvl === 3 ? 'ห้ามผ่าน' : lvl === 2 ? 'ควรเลี่ยง' : 'ผ่านได้');
            ctx.fillText(statusLabel, 780, py + 42);
          });
        }

        // 8. Six Districts Status Grid
        const gridTop = allActivePoints.length === 0 ? 605 : 745;
        ctx.fillStyle = '#f8fafc';
        ctx.font = `bold 24px ${fontSans}`;
        ctx.fillText('🚗 สภาพการสัญจรรายอำเภอ (6 อำเภอ):', 75, gridTop);

        districts.forEach((d, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const gx = 75 + col * 475;
          const gy = gridTop + 20 + row * 82;

          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = d.level === 3 ? '#ef4444' : d.level === 2 ? '#f59e0b' : '#334155';
          ctx.lineWidth = d.level > 1 ? 2 : 1;
          drawRoundRect(ctx, gx, gy, 455, 70, 14);
          ctx.fill();
          ctx.stroke();

          // Dot
          ctx.fillStyle = d.level === 3 ? '#ef4444' : d.level === 2 ? '#f59e0b' : '#10b981';
          ctx.beginPath();
          ctx.arc(gx + 25, gy + 35, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold 19px ${fontSans}`;
          ctx.fillText(d.name, gx + 42, gy + 32);

          ctx.fillStyle = d.level > 1 ? '#cbd5e1' : '#94a3b8';
          ctx.font = `500 15px ${fontSans}`;
          const statusTrunc = truncateText(ctx, d.status, 390);
          ctx.fillText(statusTrunc, gx + 42, gy + 54);
        });

        // 9. Bottom Footer Strip
        const footerY = 1045;
        ctx.fillStyle = '#020617';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        drawRoundRect(ctx, 75, footerY, 930, 80, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.font = `bold 21px ${fontSans}`;
        ctx.fillText('☎️ สายด่วน ปภ. 1784 (โทรฟรี 24 ชม.)', 105, footerY + 48);

        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold 20px ${fontSans}`;
        ctx.fillText('🌐 เช็กสด: prakanguard-web.vercel.app', 570, footerY + 48);

        // 10. Trigger Download
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `prakanguard-report-${todayDateObj.toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error('Canvas generate error:', err);
      } finally {
        setIsGeneratingImg(false);
      }
    }, 120);
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
        className={`w-full max-w-[calc(100vw-24px)] xs:max-w-[490px] sm:max-w-lg my-auto m-auto border rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all max-h-[88vh] ${
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
                ส่งต่อข้อมูลเตือนภัยทาง LINE หรือสร้างรูปภาพสรุป
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

        {/* Visual Preview Card (Synchronized with live data) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 custom-scrollbar-thin text-xs">
          
          <div 
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isDark 
                ? 'bg-slate-950/90 border-slate-800' 
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

            {/* 4 Overview Stats Badges */}
            <div className="grid grid-cols-4 gap-1.5 py-2.5 border-b border-slate-200/60 dark:border-slate-800 text-center">
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                <span className="block text-[9.5px] font-medium text-rose-600 dark:text-rose-400">วิกฤต</span>
                <strong className="text-xs font-black text-rose-700 dark:text-rose-300 font-mono">{stats.severe}</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                <span className="block text-[9.5px] font-medium text-amber-600 dark:text-amber-400">ปานกลาง</span>
                <strong className="text-xs font-black text-amber-700 dark:text-amber-300 font-mono">{stats.moderate}</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                <span className="block text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400">ปกติ</span>
                <strong className="text-xs font-black text-emerald-700 dark:text-emerald-300 font-mono">{stats.minor}</strong>
              </div>
              <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50">
                <span className="block text-[9.5px] font-medium text-teal-600 dark:text-teal-400">น้ำลด</span>
                <strong className="text-xs font-black text-teal-700 dark:text-teal-300 font-mono">{stats.falling}</strong>
              </div>
            </div>

            {/* Weather Line */}
            <div className="py-2 flex items-center justify-between text-[11px] border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">ช่วงเวลาเสี่ยงฝนตก:</span>
              <strong className="text-slate-900 dark:text-white font-semibold">{rainTime}</strong>
            </div>

            {/* Top Active Flood Points */}
            <div className="py-2.5 border-b border-slate-200/60 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-400 uppercase tracking-wide">
                <span>จุดเฝ้าระวังสำคัญในพื้นที่ ({allActivePoints.length})</span>
                <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-medium">ระดับน้ำ</span>
              </div>
              {allActivePoints.length === 0 ? (
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-[11px] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>ผิวทางแห้งสนิท สัญจรได้ปกติทุกเส้นทาง</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {allActivePoints.slice(0, 3).map((pt) => {
                    const lvl = resolveLevel(pt);
                    const isReceding = isWaterReceding(pt);
                    const depth = pt.depthCm ? `${pt.depthCm} ซม.` : (lvl === 3 ? '>50 ซม.' : lvl === 2 ? '21-50 ซม.' : '5-20 ซม.');
                    return (
                      <div key={pt.id} className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-[11.5px]">{pt.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            อ.{String(pt.district || '').replace(/^อ\./, '')} • {isReceding ? 'น้ำกำลังลด' : lvl === 3 ? 'ห้ามผ่าน' : lvl === 2 ? 'ควรเลี่ยง' : 'สัญจรได้'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          lvl === 3 ? 'bg-rose-600 text-white' : lvl === 2 ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-white'
                        }`}>
                          {depth}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6 Districts */}
            <div className="py-2.5 space-y-1.5 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-[10.5px] font-bold block text-slate-400 uppercase tracking-wide">
                สภาพผิวจราจร 6 อำเภอ
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                {districts.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                    <span className="truncate">{d.name.replace(/^อ\./, '')}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      d.level === 3 ? 'bg-rose-500' : d.level === 2 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom hotline */}
            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
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
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
              <span>{copied ? 'คัดลอกข้อความสำหรับ LINE แล้ว!' : 'คัดลอกข้อความสรุป'}</span>
            </button>

            {/* Button 3: Download Graphic Image */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGeneratingImg}
              className={`w-full py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isGeneratingImg
                  ? 'opacity-70 cursor-wait'
                  : isDark
                  ? 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-cyan-300'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-blue-700'
              }`}
            >
              <Download className={`w-4 h-4 ${isGeneratingImg ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingImg ? 'กำลังสร้างรูปภาพสรุปสถานการณ์...' : 'บันทึกรูปภาพสรุป (PNG)'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
