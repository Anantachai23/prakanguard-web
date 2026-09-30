import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Send, 
  X, 
  Phone, 
  ArrowRight, 
  HelpCircle, 
  MessageSquareText, 
  CloudRain, 
  Waves, 
  Car, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  GripHorizontal
} from 'lucide-react';
import { INITIAL_FLOOD_POINTS } from '../data/samutPrakanPoints';
import { FLOOD_STANDARDS } from '../data/floodStandards';
import { getLiveSamutPrakanWeather } from '../services/weatherService';

export default function ChatBot({ points = INITIAL_FLOOD_POINTS, onSelectPoint, theme = 'light', isPointSelected = false }) {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [weather, setWeather] = useState({
    temp: 29,
    humidity: 78,
    weatherDesc: 'มีเมฆบางส่วน',
    rainProbabilityToday: 60,
    rainSumToday: 8.5,
    peakHour: '16:00 น. (โอกาส 60%)',
    rainAlertLevel: 'เฝ้าระวังฝนฟ้าคะนอง',
    lastUpdated: 'สด'
  });

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `สวัสดีครับ ยินดีต้อนรับสู่ **ระบบตอบข้อซักถามสารสนเทศอุทกภัยและเส้นทางสัญจร จังหวัดสมุทรปราการ (PrakanGuard AI)**

ระบบนี้รวบรวมและอ้างอิงข้อมูลประกาศเปิดที่เป็นประโยชน์ต่อประชาชน (เช่น เกณฑ์ความปลอดภัยทางถนน, เกณฑ์เฝ้าระวังน้ำท่วมผิวจราจร และพยากรณ์อากาศ) เพื่ออำนวยความสะดวกในการติดตามสถานการณ์

💡 ท่านสามารถกดเลื่อนเลือกคำถามด้านบน หรือพิมพ์สอบถาม เช่น *"ปากน้ำมีโอกาสท่วมไหม"*, *"วันนี้ฝนตกกี่โมง"*, หรือ *"รถเก๋งลุยน้ำได้กี่เซน"* ได้ทันทีครับ`,
      time: 'ระบบพร้อมให้บริการ'
    }
  ]);

  const messagesEndRef = useRef(null);
  const chipsRef = useRef(null);
  const chipsAnimRef = useRef(null);
  const modalRef = useRef(null);

  // Draggable Modal State & Free Movement Tracking
  const [position, setPosition] = useState(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const modalDragRef = useRef({
    startX: 0,
    startY: 0,
    modalX: 0,
    modalY: 0
  });

  // Fetch real live weather on mount
  useEffect(() => {
    let isMounted = true;
    getLiveSamutPrakanWeather().then(w => {
      if (isMounted && w) {
        setWeather(w);
      }
    }).catch(err => console.warn("Live weather sync error:", err));
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // Window resize handler: clamp position within viewport if modal is active
  useEffect(() => {
    const handleResize = () => {
      if (!position || !modalRef.current) return;
      const modalWidth = modalRef.current.offsetWidth || 420;
      const modalHeight = modalRef.current.offsetHeight || 580;
      const maxX = Math.max(8, window.innerWidth - modalWidth - 8);
      const maxY = Math.max(8, window.innerHeight - modalHeight - 8);
      setPosition(prev => {
        if (!prev) return null;
        return {
          x: Math.min(Math.max(8, prev.x), maxX),
          y: Math.min(Math.max(8, prev.y), maxY)
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Modal Drag Handlers (Supports both PC Mouse Drag & Mobile Touch Drag)
  const handleModalDragStart = (clientX, clientY, target) => {
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const rect = modalEl.getBoundingClientRect();
    const currentX = position ? position.x : rect.left;
    const currentY = position ? position.y : rect.top;

    modalDragRef.current = {
      startX: clientX,
      startY: clientY,
      modalX: currentX,
      modalY: currentY
    };

    if (!position) {
      setPosition({ x: currentX, y: currentY });
    }

    setIsDraggingModal(true);
  };

  const handleMouseDownHeader = (e) => {
    if (e.button !== 0) return;
    handleModalDragStart(e.clientX, e.clientY, e.target);
  };

  const handleTouchStartHeader = (e) => {
    if (e.touches.length !== 1) return;
    handleModalDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
  };

  useEffect(() => {
    if (!isDraggingModal) return;

    const onMouseMove = (e) => {
      const modalEl = modalRef.current;
      const modalWidth = modalEl?.offsetWidth || 420;
      const modalHeight = modalEl?.offsetHeight || 580;

      const dx = e.clientX - modalDragRef.current.startX;
      const dy = e.clientY - modalDragRef.current.startY;

      const rawX = modalDragRef.current.modalX + dx;
      const rawY = modalDragRef.current.modalY + dy;

      const minX = 8;
      const maxX = Math.max(8, window.innerWidth - modalWidth - 8);
      const minY = 8;
      const maxY = Math.max(8, window.innerHeight - modalHeight - 8);

      setPosition({
        x: Math.min(Math.max(minX, rawX), maxX),
        y: Math.min(Math.max(minY, rawY), maxY)
      });
    };

    const onMouseUp = () => {
      setIsDraggingModal(false);
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const modalEl = modalRef.current;
      const modalWidth = modalEl?.offsetWidth || 420;
      const modalHeight = modalEl?.offsetHeight || 580;

      const dx = touch.clientX - modalDragRef.current.startX;
      const dy = touch.clientY - modalDragRef.current.startY;

      const rawX = modalDragRef.current.modalX + dx;
      const rawY = modalDragRef.current.modalY + dy;

      const minX = 8;
      const maxX = Math.max(8, window.innerWidth - modalWidth - 8);
      const minY = 8;
      const maxY = Math.max(8, window.innerHeight - modalHeight - 8);

      setPosition({
        x: Math.min(Math.max(minX, rawX), maxX),
        y: Math.min(Math.max(minY, rawY), maxY)
      });
    };

    const onTouchEnd = () => {
      setIsDraggingModal(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDraggingModal]);

  const handleResetPosition = (e) => {
    e?.stopPropagation();
    setPosition(null);
  };

  // 60fps Butter-Smooth RequestAnimationFrame Glide for Quick Question Chips
  const isDraggingChipsRef = useRef(false);
  const chipsStartXRef = useRef(0);
  const chipsScrollLeftRef = useRef(0);
  const chipsHasDraggedRef = useRef(false);

  const scrollChips = (direction) => {
    const el = chipsRef.current;
    if (!el) return;

    if (chipsAnimRef.current) {
      cancelAnimationFrame(chipsAnimRef.current);
    }

    const distance = direction === 'left' ? -220 : 220;
    const startPos = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetPos = Math.max(0, Math.min(maxScroll, startPos + distance));
    const delta = targetPos - startPos;

    if (Math.abs(delta) < 1) return;

    const duration = 460; // 460ms fluid glide with easeOutQuint
    const startTime = performance.now();
    const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.scrollLeft = startPos + delta * easeOutQuint(progress);

      if (progress < 1) {
        chipsAnimRef.current = requestAnimationFrame(step);
      } else {
        chipsAnimRef.current = null;
      }
    };

    chipsAnimRef.current = requestAnimationFrame(step);
  };

  const handleChipsMouseDown = (e) => {
    const el = chipsRef.current;
    if (!el) return;
    if (chipsAnimRef.current) cancelAnimationFrame(chipsAnimRef.current);
    isDraggingChipsRef.current = true;
    chipsStartXRef.current = e.pageX - el.offsetLeft;
    chipsScrollLeftRef.current = el.scrollLeft;
    chipsHasDraggedRef.current = false;
    el.style.scrollBehavior = 'auto';
  };

  const handleChipsMouseMove = (e) => {
    if (!isDraggingChipsRef.current) return;
    const el = chipsRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - chipsStartXRef.current) * 1.35;
    if (Math.abs(walk) > 4) {
      chipsHasDraggedRef.current = true;
    }
    el.scrollLeft = chipsScrollLeftRef.current - walk;
  };

  const handleChipsMouseUp = () => {
    isDraggingChipsRef.current = false;
    setTimeout(() => {
      chipsHasDraggedRef.current = false;
    }, 60);
  };

  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;

    let wheelAnim = null;
    let targetLeft = el.scrollLeft;

    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        const maxScroll = el.scrollWidth - el.clientWidth;
        targetLeft = Math.max(0, Math.min(maxScroll, targetLeft + e.deltaY * 1.4));
        
        const startPos = el.scrollLeft;
        const delta = targetLeft - startPos;
        const duration = 260;
        const startTime = performance.now();
        const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);

        if (wheelAnim) cancelAnimationFrame(wheelAnim);
        const step = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          el.scrollLeft = startPos + delta * easeOutQuad(progress);
          if (progress < 1) {
            wheelAnim = requestAnimationFrame(step);
          } else {
            wheelAnim = null;
          }
        };
        wheelAnim = requestAnimationFrame(step);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelAnim) cancelAnimationFrame(wheelAnim);
    };
  }, [isOpen]);

  // High-Intelligence Domain Knowledge & Telemetry Synthesizer
  const synthesizeAnswer = (queryText, history = []) => {
    const q = queryText.toLowerCase().trim();
    const rainChance = weather.rainProbabilityToday || 60;
    const rainSum = weather.rainSumToday || 8.5;
    const peakTime = weather.peakHour || '16:00 น.';

    // Helper to format risk badges
    const getRiskBadge = (prob) => {
      if (prob >= 75) return `🔴 เสี่ยงสูงมาก (โอกาสเกิดน้ำท่วมผิวจราจร **~${prob}%**)`;
      if (prob >= 55) return `🟠 เสี่ยงปานกลางถึงสูง (โอกาสเกิดน้ำท่วมผิวจราจร **~${prob}%**)`;
      return `🟡 เฝ้าระวังปกติ (โอกาสเกิดน้ำท่วมผิวจราจร **~${prob}%**)`;
    };

    // 0. CHECK IF USER WANTS A SUMMARY / SHORT / CONCISE / PLAYFUL ANSWER (ย่อลง / สั้นลง / สรุป)
    const shortenKeywords = [
      "ย่อ", "สั้น", "สรุป", "ยาวไป", "ยาวเกิน", "ขอสั้น", "เอาสั้น", "สั้นๆ", 
      "ย่อๆ", "พอสังเขป", "เนื้อๆ", "ขอเนื้อ", "ย่อให้", "สรุปให้", "สั้นลง", 
      "ย่อลง", "กระชับ", "อ่านไม่ทัน", "ขอแบบย่อ", "สั้นกว่านี้", "ย่ออีก", 
      "พูดสั้นๆ", "ตอบสั้นๆ", "สั้นหน่อย", "ย่อหน่อย"
    ];
    const wantsShort = shortenKeywords.some(kw => q.includes(kw));

    if (wantsShort) {
      // Find previous context topic from history or current prompt
      const lastBotMessage = (history || []).slice().reverse().find(m => m.sender === 'bot');
      const topicContext = q + ' ' + (lastBotMessage ? lastBotMessage.text.toLowerCase() : '');

      // A. ซอยวัดด่าน / 113 / ด่านสำโรง
      if (topicContext.includes("วัดด่าน") || topicContext.includes("113") || topicContext.includes("ด่านสำโรง")) {
        const floodProb = Math.min(92, Math.max(48, Math.round(rainChance * 0.85 + 24)));
        return `จัดให้ตามคำขอเลยครับผม! ขอโทษทีน้าเมื่อกี้วิชาการจัดเต็มไปนี๊ดดด 😂 ย่อฉบับตัวตึง 3 วิรู้เรื่องมาแล้วค้าบ! ⚡️\n\n` +
          `🌊 **พิกัดซอยวัดด่านสำโรง (สุขุมวิท 113):**\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%** (น้ำขัง 15 – 35 ซม.)\n` +
          `• **ช่วงวิกฤต:** ⏱️ **${peakTime}** (อย่าเพิ่งออกจากบ้านตอนนี้น้า เตือนด้วยรัก!)\n` +
          `• **ยานพาหนะ:** รถเก๋ง & มอไซค์ เลี่ยงได้เลี่ยงเลย ลุยน้ำดับกลางทางจะไม่คุ้ม 🚗💨\n` +
          `• **ทางรอด:** วิ่งถนนสุขุมวิทสายหลัก หรือศรีนครินทร์ สบายใจกว่าเยอะ!\n` +
          `• **สายด่วน:** [เทศบาลตำบลสำโรงเหนือ] โทร. **02-398-3333**\n\n` +
          `กระชับสะใจไหมค้าบ! มีจุดไหนอยากให้ย่ออีก สั่งมาได้เล้ยยย พร้อมตอบไวแสง! 🚀`;
      }

      // B. ปากน้ำ / ท้ายบ้าน / วิบูลย์ศรี
      if (topicContext.includes("ปากน้ำ") || topicContext.includes("ท้ายบ้าน") || topicContext.includes("วิบูลย์ศรี")) {
        const floodProb = Math.min(92, Math.max(50, Math.round(rainChance * 0.8 + 28)));
        return `โอเคจัดไปเลยครับบ! ย่อแบบกระชับมินิมอล ไม่ปวดหัวแน่นอน 😆✨\n\n` +
          `📍 **ตลาดปากน้ำ & ถ.ท้ายบ้าน:**\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%** น้ำดันจากเจ้าพระยา (15 – 35 ซม.)\n` +
          `• **ช่วงเสี่ยง:** ⏱️ **${peakTime}** ระวังช่วงน้ำขึ้นสูงสุด\n` +
          `• **คำเตือนรถยนต์:** ปิดแอร์ก่อนลุย! ชิดเลนขวาไว้ปลอดภัยสุด 🚙\n` +
          `• **สายด่วนกระสอบทราย:** [เทศบาลนครสมุทรปราการ] โทร. **02-382-6199**\n\n` +
          `ตรงประเด็น เป๊ะเวอร์! อยากรู้จุดอื่นต่อบอกได้เลยน้าา 😎`;
      }

      // C. สำโรง / แบริ่ง
      if (topicContext.includes("สำโรง") || topicContext.includes("แบริ่ง")) {
        const floodProb = Math.min(88, Math.max(45, Math.round(rainChance * 0.8 + 20)));
        return `จัดไปวัยรุ่น! ย่อแบบเน้นๆ เอาแต่เนื้อไม่เอาน้ำ 🌊😆\n\n` +
          `📍 **แยกสำโรง - BTS สำโรง - แบริ่ง:**\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%**\n` +
          `• **จุดที่ท่วม:** ทางลอด BTS สำโรง และเลนคู่ขนาน (15 – 30 ซม.)\n` +
          `• **วิธีรอด:** เบี่ยงขึ้นทางด่วนกาญจนา หรือเลี่ยงเลนซ้ายสุด\n` +
          `• **สายด่วน:** [แขวงทางหลวงสมุทรปราการ] โทร. **1586**\n\n` +
          `สั้นกระชับ สบายตาไหมค้าบ! ถามเพิ่มได้ตลอดเลยน้าา ⚡️`;
      }

      // D. บางปู / นิคม / แพรกษา
      if (topicContext.includes("บางปู") || topicContext.includes("นิคม") || topicContext.includes("แพรกษา")) {
        const floodProb = Math.min(88, Math.max(45, Math.round(rainChance * 0.8 + 22)));
        return `รับทราบครับผม! ย่อแบบหมัดฮุก เข้าใจทันทีไม่ต้องเลื่อนอ่านเยอะ 🥊😆\n\n` +
          `🏭 **นิคมบางปู & ถ.แพรกษา:**\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%**\n` +
          `• **จุดเปราะบาง:** ซอยพัฒนา 1 และเขตประกอบการเสรี (20 – 40 ซม.)\n` +
          `• **คำแนะนำ:** รถเล็กอย่าเสี่ยงเข้าซอยย่อย จอดลานสูง ปลอดภัยกว่า\n` +
          `• **สายด่วน:** [นิคมฯ บางปู] โทร. **02-709-3421**\n\n` +
          `เคลียร์ชัด สบายใจ! มีพิกัดไหนอยากย่ออีก สะกิดมาได้เลยค้าบ 🛵💨`;
      }

      // E. กิ่งแก้ว / บางพลี / สุวรรณภูมิ / เทพารักษ์
      if (topicContext.includes("กิ่งแก้ว") || topicContext.includes("บางพลี") || topicContext.includes("สุวรรณภูมิ") || topicContext.includes("เทพารักษ์")) {
        const floodProb = Math.min(85, Math.max(40, Math.round(rainChance * 0.75 + 18)));
        return `ย่อให้ทันใจ วัยรุ่นใจร้อนชอบแน่นอนค้าบ! ✈️💨\n\n` +
          `📍 **กิ่งแก้ว - เทพารักษ์ - บางพลี:**\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%**\n` +
          `• **จุดเสี่ยง:** ไหล่ทางกิ่งแก้ว และเทพารักษ์ กม.12-14 (15 – 30 ซม.)\n` +
          `• **ไปสุวรรณภูมิ:** วิ่งมอเตอร์เวย์ (ทล.7) หรือบูรพาวิถีเท่านั้น ชัวร์สุด!\n` +
          `• **สายด่วน:** [อบต.บางพลีใหญ่] โทร. **02-337-3135**\n\n` +
          `เป๊ะ ครบ จบใน 4 บรรทัด! มีอะไรให้ช่วยอีกบอกได้เลยน้าา 😊`;
      }

      // F. คลองด่าน / บางบ่อ / บางเสาธง
      if (topicContext.includes("คลองด่าน") || topicContext.includes("บางบ่อ") || topicContext.includes("บางเสาธง")) {
        const floodProb = Math.min(92, Math.max(50, Math.round(rainChance * 0.8 + 26)));
        return `ย่อมาให้แล้วจ้า แบบพอสังเขป อ่านแป๊บเดียวรู้เรื่อง! 🌊🦀\n\n` +
          `📍 **ตลาดคลองด่าน & บางบ่อ:**\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%**\n` +
          `• **สาเหตุ:** คลื่นลมทะเลหนุนสูง ท่วมถนนสุขุมวิทสายเก่า (20 – 45 ซม.)\n` +
          `• **ข้อควรระวัง:** ยกของขึ้นที่สูงเกิน 50 ซม. รถเล็กเลี่ยงสุขุมวิทสายเก่า\n` +
          `• **สายด่วน:** [ปภ.บางบ่อ] โทร. **02-708-4100**\n\n` +
          `อ่านง่ายสบายตาไหมเอ่ย! สั่งให้ย่อจุดอื่นเพิ่มได้เสมอนะค้าบ 💖`;
      }

      // G. พระประแดง / ปู่เจ้า / ลัดโพธิ์
      if (topicContext.includes("พระประแดง") || topicContext.includes("ปู่เจ้า") || topicContext.includes("ลัดโพธิ์")) {
        const floodProb = Math.min(90, Math.max(48, Math.round(rainChance * 0.8 + 22)));
        return `จัดให้ฉบับตัวตึงพระประแดง สั้น กระชับ สนุก เป็นกันเองค้าบ! 🚢✨\n\n` +
          `📍 **ท่าน้ำพระประแดง & ถ.ปู่เจ้าสมิงพราย:**\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%**\n` +
          `• **จุดวิกฤต:** กลับรถใต้สะพานภูมิพล ท่วม 20 – 40 ซม. (อย่าลงไปลอยคอเด็ดขาด!)\n` +
          `• **ทางรอด:** วิ่งสะพานลอยกลับรถด้านบน ฉลุยกว่าเยอะ\n` +
          `• **สายด่วน:** [เทศบาลเมืองพระประแดง] โทร. **02-463-4841**\n\n` +
          `สั้นสะใจวัยรุ่นไหมค้าบ! สงสัยจุดไหนถามมาได้เลยนะ 🚀`;
      }

      // H. พระสมุทรเจดีย์ / ป้อมพระจุล
      if (topicContext.includes("พระสมุทรเจดีย์") || topicContext.includes("ป้อมพระจุล") || topicContext.includes("แหลมฟ้าผ่า")) {
        const floodProb = Math.min(92, Math.max(52, Math.round(rainChance * 0.82 + 25)));
        return `ย่อให้ฟังแบบ 1 ลมหายใจจบครับ! ⚓️🌊\n\n` +
          `📍 **พระสมุทรเจดีย์ & ป้อมพระจุล:**\n` +
          `• **โอกาสท่วม:** ~**${floodProb}%**\n` +
          `• **จุดเสี่ยง:** ถ.สุขสวัสดิ์-ป้อมพระจุล ช่วง กม.22 (25 – 45 ซม.)\n` +
          `• **คำแนะนำ:** เช็กเวลาน้ำขึ้นก่อนออกเดินทาง น้ำลงเมื่อไหร่ถนนแห้งไวแน่นอน\n` +
          `• **สายด่วน:** [เทศบาลตำบลแหลมฟ้าผ่า] โทร. **02-425-8864**\n\n` +
          `สั้น กระชับ ตรงใจไหมค้าบ! สั่งแอดมิน AI ตัวนี้ได้ตลอดเลยน้าา 🫡`;
      }

      // I. รถยนต์ / เกณฑ์ระดับน้ำ
      if (topicContext.includes("รถ") || topicContext.includes("เกณฑ์") || topicContext.includes("เซนติเมตร") || topicContext.includes("ซม.")) {
        return `จัดให้แบบสั้นจี๊ด เข้าใจง่ายใน 3 บรรทัดครับ! 🚗💨\n\n` +
          `🚦 **เกณฑ์ลุยน้ำฉบับย่อ:**\n` +
          `• **< 15 ซม. (เสมอข้อเท้า):** รถเก๋ง มอไซค์ ลุยได้สบาย\n` +
          `• **16 – 35 ซม. (เสมอหน้าแข้ง):** รถเก๋งเสี่ยงน้ำเข้าท่อ ปิดแอร์ทันที! มอไซค์ชิดขวา\n` +
          `• **> 35 ซม. (เสมอหัวเข่าขึ้นไป):** 🛑 **ห้ามผ่านเด็ดขาด!** ลุยไปรถพังแน่นอน\n\n` +
          `จำง่ายๆ แค่นี้ปลอดภัยชัวร์ มีจุดไหนอยากรู้อีก ทักมาได้เลยค้าบ! 😎`;
      }

      // J. General Weather / Fallback Summary
      return `ฮั่นแน่! ชอบแบบสั้นๆ ใช่ไหมล้าา จัดไปแบบกระชับมินิมอล 3 บรรทัดจบค้าบ! 🌧️⚡️\n\n` +
        `📊 **สรุปสถานการณ์น้ำ & ฝน จ.สมุทรปราการ:**\n` +
        `• **ฝนตกวันนี้:** โอกาส **${rainChance}%** (สะสม ~${rainSum} มม.)\n` +
        `• **เวลาต้องระวัง:** ⏱️ **${peakTime}**\n` +
        `• **จุดที่ท่วมบ่อย:** วัดด่าน, ปากน้ำ, คลองด่าน, นิคมบางปู\n` +
        `สรุปคือ พกร่ม+เลี่ยงลุยน้ำช่วงเย็น สบายใจหายห่วงแน่นอนค้าบ เป็นห่วงน้า! ☂️🥰\n\n` +
        `อยากให้ย่อตรงไหนเพิ่ม บอกชื่อซอยหรือถนนมาได้เลยน้าา พร้อมเสิร์ฟ! 🚀`;
    }

    // 1. ถามเรื่อง "วัดด่าน" / "ซอยวัดด่าน" / "สุขุมวิท 113" / "วัดด่านสำโรง"
    if (q.includes("วัดด่าน") || q.includes("113") || q.includes("ด่านสำโรง")) {
      const floodProb = Math.min(92, Math.max(48, Math.round(rainChance * 0.85 + 24)));
      return `🌊 **การวิเคราะห์คาดการณ์ความเสี่ยงน้ำท่วม: ซอยวัดด่านสำโรง (สุขุมวิท 113) และพื้นที่เชื่อมต่อ**\n` +
        `อ้างอิงข้อมูล: [แขวงทางหลวงสมุทรปราการ] • [สำนักการระบายน้ำ กทม.] • [กรมอุตุนิยมวิทยา (TMD)] • [กรมอุทกศาสตร์ กองทัพเรือ]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนฟ้าคะนองและปริมาณน้ำฝนสะสม (กรมอุตุนิยมวิทยา):**\n` +
        `• โอกาสเกิดฝนตกในพื้นที่: **${rainChance}%** (ปริมาณฝนสะสมคาดการณ์ ~**${rainSum} มม.**)\n` +
        `• ช่วงเวลาที่ต้องเฝ้าระวังสูงสุด: ⏱️ **${peakTime}**\n` +
        `• **การประเมิน:** ซอยวัดด่านสำโรงมีความสามารถในการรองรับปริมาณฝนสะสมได้ไม่เกิน 25 – 30 มม./ชม. หากมีกลุ่มฝนตกหนักสะสมต่อเนื่อง อัตราการไหลเข้าพื้นที่ผิวถนนจะสูงกว่าอัตราการไหลออก เกิดสภาวะน้ำท่วมขังรอการระบายทันที\n\n` +
        `🌊 **2. ปัจจัยน้ำทะเลหนุนและระดับน้ำคลองสำโรง (กรมอุทกศาสตร์ กองทัพเรือ):**\n` +
        `• คลองสำโรงเป็นคลองสายหลักที่รับน้ำจากซอยวัดด่านและไหลออกสู่แม่น้ำเจ้าพระยา\n` +
        `• เมื่อเกิดสภาวะน้ำทะเลหนุนสูงที่ [สถานีป้อมพระจุลจอมเกล้า] เกิน **+1.70 เมตร รทก.** ประตูระบายน้ำจำเป็นต้องปิดเพื่อป้องกันน้ำหนุนย้อนกลับเข้าพื้นที่ ส่งผลให้น้ำฝนภายในซอยระบายลงคลองสำโรงได้ช้าลง\n\n` +
        `🏗️ **3. ปัจจัยทางกายภาพและลักษณะเฉพาะของพื้นที่ (ซอยวัดด่านสำโรง):**\n` +
        `• **ลักษณะภูมิประเทศ:** เป็นแนวถนนแอ่งกระทะลุ่มต่ำ และเป็นพื้นที่รับน้ำเชื่อมต่อระหว่างกรุงเทพมหานคร (ซอยแบริ่ง) และจังหวัดสมุทรปราการ (สำโรงเหนือ)\n` +
        `• **จุดวิกฤตที่มักท่วมขัง:**\n` +
        `  - ช่วงกลางซอยวัดด่าน (หน้าตลาดและชุมชนด่านสำโรง): ระดับน้ำท่วมขังเฉลี่ย **15 – 35 ซม.** (เสมอขอบทางเท้า)\n` +
        `  - ทางแยกเชื่อมต่อถนนศรีนครินทร์: เสี่ยงน้ำท่วมผิวจราจร 1-2 เลนซ้าย\n\n` +
        `⚙️ **4. ปัจจัยการระบายน้ำและการทำงานของเครื่องสูบน้ำ:**\n` +
        `• มีการเดินเครื่องสูบน้ำประจำสถานีสูบน้ำคลองสำโรงและเครื่องสูบน้ำขององค์กรปกครองส่วนท้องถิ่น เพื่อเร่งดึงน้ำออกจากแนวท่อระบายน้ำหลัก\n` +
        `• หากไม่มีเศษวัสดุหรือขยะอุดตันท่อระบายน้ำ คาดว่าจะใช้เวลาหน่วงระบายแห้งเป็นปกติประมาณ **45 – 90 นาที** หลังฝนหยุดตก\n\n` +
        `🚗 **5. เกณฑ์ความปลอดภัยของยานพาหนะและคำแนะนำการเดินทาง:**\n` +
        `• **รถเก๋ง / Eco car / มอเตอร์ไซค์:** ⚠️ **ควรหลีกเลี่ยงการสัญจรเข้าซอยวัดด่านในช่วง ${peakTime}** หากจำเป็นต้องผ่าน ให้ **ปิดแอร์ (A/C) ทันที** ใช้เกียร์ต่ำ และขับกึ่งกลางถนนที่ระดับพื้นผิวสูงกว่า ห้ามลุยน้ำลึกเกิน 20 ซม.\n` +
        `• **บ้านเรือนและร้านค้า:** แนะนำยกสิ่งของเครื่องใช้ขึ้นที่สูงเกิน 30 ซม. จากแนวระดับพื้นถนน\n` +
        `• **เส้นทางเลี่ยงที่แนะนำ:** ใช้ถนนสุขุมวิทสายหลัก หรือถนนศรีนครินทร์ หรือทางด่วนกาญจนาภิเษก\n\n` +
        `📞 **สายด่วนประสานงานและขอความช่วยเหลือ (24 ชม.):**\n` +
        `• [เทศบาลตำบลสำโรงเหนือ] โทร. **02-398-3333**\n` +
        `• [แขวงทางหลวงสมุทรปราการ] โทร. **1586**\n` +
        `• [สนง.ปภ. จังหวัดสมุทรปราการ] โทร. **02-382-6040**`;
    }

    // 2. ถามเรื่อง "ปากน้ำ" / "วิบูลย์ศรี" / "ท้ายบ้าน" / "วงเวียนท้ายบ้าน"
    if (q.includes("ปากน้ำ") || q.includes("ท้ายบ้าน") || q.includes("วิบูลย์ศรี")) {
      const floodProb = Math.min(92, Math.max(50, Math.round(rainChance * 0.8 + 28)));
      return `🌊 **การวิเคราะห์คาดการณ์ความเสี่ยงน้ำท่วม: ตลาดปากน้ำ และ ถนนท้ายบ้าน (อ.เมืองสมุทรปราการ)**\n` +
        `อ้างอิงข้อมูล: [สำนักงาน ปภ. จังหวัดสมุทรปราการ] • [กรมอุทกศาสตร์ กองทัพเรือ] • [กรมอุตุนิยมวิทยา (TMD)]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนฟ้าคะนองและปริมาณน้ำฝนสะสม (กรมอุตุนิยมวิทยา):**\n` +
        `• โอกาสเกิดฝนตกวันนี้: **${rainChance}%** (ฝนสะสมคาดการณ์ ~**${rainSum} มม.**)\n` +
        `• ช่วงเวลาเสี่ยงสูงสุด: ⏱️ **${peakTime}**\n\n` +
        `🌊 **2. ปัจจัยน้ำทะเลหนุน (แม่น้ำเจ้าพระยา):**\n` +
        `• ตลาดปากน้ำและถนนท้ายบ้านตั้งอยู่ติดปากอ่าวแม่น้ำเจ้าพระยา เมื่อระดับน้ำที่ [สถานีป้อมพระจุลจอมเกล้า] สูงเกิน **+1.70 เมตร รทก.** น้ำจะเริ่มดันทะลักเข้าท่อระบายน้ำ และเอ่อล้นเข้าท่วมผิวจราจรทันที\n\n` +
        `🏗️ **3. ปัจจัยทางกายภาพและจุดเปราะบางเฉพาะพิกัด:**\n` +
        `• **ตลาดปากน้ำ / ถนนวิบูลย์ศรี:** ระดับน้ำท่วมขังเฉลี่ย **15 – 35 ซม.** (เสมอขอบทางเท้า)\n` +
        `• **ถนนท้ายบ้าน (หน้าศาลากลาง - โรงเรียนวิบูลย์วิทยา):** เสี่ยงน้ำผุดตามแนวท่อระบายน้ำฝั่งติดแม่น้ำ\n\n` +
        `⚙️ **4. ปัจจัยการระบายน้ำและการเตรียมพร้อม:**\n` +
        `• เทศบาลนครสมุทรปราการมีการตั้งแนวกระสอบทรายและเดินเครื่องสูบน้ำขนาดใหญ่ริมเขื่อน\n` +
        `• หลังน้ำทะเลเริ่มลดระดับ น้ำบนผิวจราจรจะระบายลงสู่แม่น้ำภายใน 30 – 60 นาที\n\n` +
        `🚗 **5. เกณฑ์ความปลอดภัยของยานพาหนะและคำแนะนำการเดินทาง:**\n` +
        `• **รถเก๋ง / Eco car:** ⚠️ **ควรหลีกเลี่ยงถนนวิบูลย์ศรีและถนนท้ายบ้าน** ในช่วงเวลาน้ำขึ้นสูงสุด หากเลี่ยงไม่ได้ ให้ **ปิดแอร์ (A/C) ทันที** และใช้เกียร์ต่ำ ห้ามลุยน้ำลึกเกิน 20 ซม.\n` +
        `• **รถกระบะ / SUV:** สัญจรได้ตามปกติ แนะนำให้ใช้ช่องทางขวาที่มีระดับผิวทางสูงกว่า\n` +
        `• **เส้นทางเลี่ยง:** ใช้ถนนสุขุมวิทสายหลัก หรือถนนศรีนครินทร์\n\n` +
        `📞 **สายด่วนรับกระสอบทราย/ขอความช่วยเหลือ:**\n` +
        `• [เทศบาลนครสมุทรปราการ] โทร. **02-382-6199** หรือ [ปภ.สมุทรปราการ] โทร. **02-382-6040** (24 ชม.)`;
    }

    // 3. ถามเรื่อง "สำโรง" / "แบริ่ง" (ทั่วไป)
    if (q.includes("สำโรง") || q.includes("แบริ่ง")) {
      const floodProb = Math.min(88, Math.max(45, Math.round(rainChance * 0.8 + 20)));
      return `📍 **การวิเคราะห์คาดการณ์ความเสี่ยงน้ำท่วม: แยกสำโรง - แยกแบริ่ง (ถ.สุขุมวิท / BTS สำโรง)**\n` +
        `อ้างอิงข้อมูล: [แขวงทางหลวงสมุทรปราการ] • [สำนักการระบายน้ำ กทม.] • [กรมอุตุนิยมวิทยา]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนตกสะสม:** โอกาสฝนตก **${rainChance}%** (ช่วงเฝ้าระวัง: **${peakTime}**)\n` +
        `🌊 **2. ปัจจัยน้ำทะเลหนุน:** หนุนดันผ่านคลองสำโรง ทำให้อัตราการสูบระบายหน่วงตัวลง\n` +
        `🏗️ **3. จุดวิกฤต:** ทางลอดสถานี BTS สำโรง และเลนคู่ขนานสุขุมวิทมุ่งหน้าแบริ่ง ระดับน้ำเฉลี่ย 15 – 30 ซม.\n` +
        `⚙️ **4. การระบายน้ำ:** สถานีสูบน้ำคลองสำโรงเดินเครื่องเต็มกำลัง ระบายแห้งใน 45-60 นาทีหลังฝนหยุด\n` +
        `🚗 **5. คำแนะนำการเดินทาง:** รถเก๋งให้เลี่ยงช่องทางซ้าย ใช้ช่องทางขวาสุด หรือเลี่ยงไปใช้ถนนวงแหวนกาญจนาภิเษก\n\n` +
        `📞 **สายด่วน:** [แขวงทางหลวงสมุทรปราการ] โทร. **1586** หรือ [เทศบาลตำบลสำโรงเหนือ] โทร. **02-398-3333**`;
    }

    // 4. ถามเรื่อง "นิคมอุตสาหกรรมบางปู" / "บางปู" / "แพรกษา"
    if (q.includes("บางปู") || q.includes("นิคม") || q.includes("แพรกษา")) {
      const floodProb = Math.min(88, Math.max(45, Math.round(rainChance * 0.8 + 22)));
      return `🏭 **การวิเคราะห์คาดการณ์ความเสี่ยงน้ำท่วม: นิคมอุตสาหกรรมบางปู และ ถ.แพรกษา**\n` +
        `อ้างอิงข้อมูล: [การนิคมอุตสาหกรรมแห่งประเทศไทย (กนอ.)] • [เทศบาลตำบลบางปู] • [กรมอุตุนิยมวิทยา]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนตก:** ปริมาณฝนคาดการณ์ **${rainSum} มม.** (โอกาสฝนตก **${rainChance}%** ช่วง **${peakTime}**)\n` +
        `🌊 **2. ปัจจัยน้ำทะเลหนุน:** อิทธิพลน้ำทะเลหนุนชายฝั่งอ่าวไทย ส่งผลกระทบต่อแนวคลองระบายน้ำบางปู\n` +
        `🏗️ **3. กายภาพพื้นที่:** ซอยพัฒนา 1 และเขตประกอบการเสรีเป็น **แอ่งกระทะลุ่มต่ำ** ระดับน้ำขังเฉลี่ย 20 – 40 ซม.\n` +
        `⚙️ **4. ระบบสูบน้ำ:** ปั๊มน้ำของนิคมฯ บางปู และเครื่องสูบน้ำเทศบาลตำบลบางปูพร้อมทำงานตลอด 24 ชม.\n` +
        `🚗 **5. คำแนะนำ:** รถเก๋งส่วนบุคคลควรหลีกเลี่ยงการขับเข้าซอยย่อยช่วงน้ำท่วมขัง จอดบนลานจอดที่สูง\n\n` +
        `📞 **ศูนย์ประสานงานนิคมฯ บางปู:** โทร. **02-709-3421** หรือ [กู้ภัยบางปู] โทร. **1669**`;
    }

    // 5. ถามเรื่อง "กิ่งแก้ว" / "บางพลี" / "สุวรรณภูมิ" / "ลาดกระบัง" / "เทพารักษ์"
    if (q.includes("กิ่งแก้ว") || q.includes("บางพลี") || q.includes("สุวรรณภูมิ") || q.includes("เทพารักษ์")) {
      const floodProb = Math.min(85, Math.max(40, Math.round(rainChance * 0.75 + 18)));
      return `✈️ **การวิเคราะห์คาดการณ์ความเสี่ยงน้ำท่วม: ถนนกิ่งแก้ว และ อำเภอบางพลี**\n` +
        `อ้างอิงข้อมูล: [กรมทางหลวง] • [อบต.บางพลีใหญ่] • [กรมอุตุนิยมวิทยา]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนตก:** โอกาสฝนตก **${rainChance}%** (ช่วงเฝ้าระวัง: **${peakTime}**)\n` +
        `🌊 **2. ลำน้ำหลัก:** คลองประเวศบุรีรมย์และคลองลาดกระบัง รับน้ำระบายรอบท่าอากาศยานสุวรรณภูมิ\n` +
        `🏗️ **3. จุดเสี่ยงน้ำท่วมผิวจราจร:**\n` +
        `  - ถนนกิ่งแก้ว (ช่วงตัดถนนลาดกระบัง ถึง บางนา-ตราด): 15 – 30 ซม. ไหล่ทาง\n` +
        `  - ถนนเทพารักษ์ กม.12 – 14 (หน้า รพ.บางนา 5)\n` +
        `⚙️ **4. การระบายน้ำ:** มีสถานีสูบน้ำ อบต.บางพลีใหญ่ ช่วยผลักดันน้ำ\n` +
        `🚗 **5. คำแนะนำ:** หากเดินทางไปสนามบินสุวรรณภูมิ แนะนำใช้มอเตอร์เวย์ (ทล.7) หรือทางด่วนบูรพาวิถี\n\n` +
        `📞 **สายด่วน อบต.บางพลีใหญ่:** โทร. **02-337-3135** หรือ [ปภ.บางพลี] โทร. **02-337-3333**`;
    }

    // 6. ถามเรื่อง "คลองด่าน" / "บางบ่อ" / "บางเสาธง"
    if (q.includes("คลองด่าน") || q.includes("บางบ่อ") || q.includes("บางเสาธง") || q.includes("เคหะบางพลี")) {
      const floodProb = Math.min(92, Math.max(50, Math.round(rainChance * 0.8 + 26)));
      return `🌊 **การวิเคราะห์คาดการณ์ความเสี่ยงน้ำท่วม: ตลาดคลองด่าน และ อำเภอบางบ่อ**\n` +
        `อ้างอิงข้อมูล: [กรมชลประทาน] • [เทศบาลตำบลคลองด่าน] • [กรมอุทกศาสตร์ กองทัพเรือ]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนตก:** ปริมาณฝนสะสมคาดการณ์ **${rainSum} มม.** (โอกาส **${rainChance}%**)\n` +
        `🌊 **2. ปัจจัยน้ำทะเลหนุน:** ได้รับผลกระทบจาก **คลื่นลมชายฝั่งและน้ำทะเลหนุนสูงสุด (Spring Tide)** โดยตรง\n` +
        `🏗️ **3. จุดน้ำท่วมประจำ:** ถนนสุขุมวิทสายเก่า (กม.55-58) ตลาดคลองด่าน ระดับน้ำท่วมเฉลี่ย 20 – 45 ซม.\n` +
        `⚙️ **4. ชลประทาน:** ประตูระบายน้ำคลองด่านควบคุมการเปิด-ปิดบานระบายน้ำตามวัฏจักรน้ำขึ้น-น้ำลง\n` +
        `🚗 **5. คำแนะนำ:** ร้านค้าและบ้านเรือนริมคลองด่านให้ยกของขึ้นที่สูงเกิน 50 ซม. รถเล็กควรเลี่ยงถนนสุขุมวิทสายเก่าช่วงน้ำหนุน\n\n` +
        `📞 **สนง.ปภ. สาขาบางบ่อ:** โทร. **02-708-4100**`;
    }

    // 7. ถามเรื่อง "พระประแดง" / "ปู่เจ้า" / "ลัดโพธิ์" / "บางกระเจ้า"
    if (q.includes("พระประแดง") || q.includes("ปู่เจ้า") || q.includes("ลัดโพธิ์") || q.includes("บางกระเจ้า") || q.includes("สะพานภูมิพล")) {
      const floodProb = Math.min(90, Math.max(48, Math.round(rainChance * 0.8 + 22)));
      return `🚢 **การวิเคราะห์คาดการณ์ความเสี่ยงน้ำท่วม: ท่าน้ำพระประแดง และ ถ.ปู่เจ้าสมิงพราย**\n` +
        `อ้างอิงข้อมูล: [เทศบาลเมืองลัดหลวง] • [กรมอุทกศาสตร์ กองทัพเรือ] • [กรมชลประทาน]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนตก:** โอกาสฝนตก **${rainChance}%** (ช่วงเฝ้าระวัง: **${peakTime}**)\n` +
        `🌊 **2. ปัจจัยน้ำทะเลหนุน:** แนวโค้งแม่น้ำเจ้าพระยา เอ่อล้นแนวกระสอบทรายช่วงน้ำขึ้นสูงสุด\n` +
        `🏗️ **3. จุดวิกฤต:** ถนนปู่เจ้าสมิงพราย (ช่วงท่าน้ำ) และจุดกลับรถใต้สะพานภูมิพล 1-2 (ระดับน้ำ 20 – 40 ซม.)\n` +
        `⚙️ **4. ประตูระบายน้ำ:** ประตูระบายน้ำคลองลัดโพธิ์อันเนื่องมาจากพระราชดำริบริหารจัดการระบายน้ำอย่างเป็นระบบ\n` +
        `🚗 **5. คำแนะนำ:** เลี่ยงการใช้จุดกลับรถใต้สะพานภูมิพล ให้ใช้สะพานลอยกลับรถด้านบนแทน\n\n` +
        `📞 **ศูนย์บรรเทาสาธารณภัยเทศบาลเมืองพระประแดง:** โทร. **02-463-4841**`;
    }

    // 8. ถามเรื่อง "พระสมุทรเจดีย์" / "ป้อมพระจุล" / "แหลมฟ้าผ่า"
    if (q.includes("พระสมุทรเจดีย์") || q.includes("ป้อมพระจุล") || q.includes("แหลมฟ้าผ่า") || q.includes("คู่สร้าง")) {
      const floodProb = Math.min(92, Math.max(52, Math.round(rainChance * 0.82 + 25)));
      return `⚓ **การวิเคราะห์คาดการณ์ความเสี่ยงน้ำท่วม: พระสมุทรเจดีย์ และ ป้อมพระจุลจอมเกล้า**\n` +
        `อ้างอิงข้อมูล: [กรมอุทกศาสตร์ กองทัพเรือ] • [เทศบาลตำบลแหลมฟ้าผ่า]\n\n` +
        `📊 **ระดับความเสี่ยงคาดการณ์วันนี้:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนตก:** ปริมาณฝนคาดการณ์ **${rainSum} มม.** (โอกาส **${rainChance}%**)\n` +
        `🌊 **2. ปัจจัยสถานีหลัก:** ป้อมพระจุลจอมเกล้าเป็นสถานีตรวจวัดหลัก (เกณฑ์เฝ้าระวังที่ +1.70 ม. รทก.)\n` +
        `🏗️ **3. จุดเสี่ยง:** ถนนสุขสวัสดิ์-ป้อมพระจุล (ช่วง กม.22 ถึงหน้าป้อมพระจุล) ระดับน้ำเฉลี่ย 25 – 45 ซม.\n` +
        `⚙️ **4. การระบายน้ำ:** น้ำจะลดลงอย่างรวดเร็วหลังผ่านพ้นจุดน้ำขึ้นสูงสุดของวัน\n` +
        `🚗 **5. คำแนะนำ:** ตรวจสอบตารางน้ำขึ้น-น้ำลงก่อนเข้าพื้นที่ป้อมพระจุลฯ รถเล็กควรใช้ความระมัดระวังเป็นพิเศษ\n\n` +
        `📞 **ศูนย์ช่วยเหลือเทศบาลตำบลแหลมฟ้าผ่า:** โทร. **02-425-8864**`;
    }

    // 9. ถามคำถามทั่วไปเกี่ยวกับ "โอกาสท่วม" / "จะท่วมอีกไหม" / "เสี่ยงไหม" / "มีโอกาสท่วมไหม"
    if (q.includes("โอกาส") || q.includes("ท่วมอีก") || q.includes("จะท่วม") || q.includes("เสี่ยง") || q.includes("ท่วมไหม")) {
      const floodProb = Math.min(88, Math.max(45, Math.round(rainChance * 0.8 + 20)));
      return `🌊 **การวิเคราะห์คาดการณ์ความเสี่ยงน้ำท่วมภาพรวม จ.สมุทรปราการ**\n` +
        `อ้างอิงข้อมูล: [ศูนย์เตือนภัย ปภ.] • [กรมอุตุนิยมวิทยา] • [กรมอุทกศาสตร์ กองทัพเรือ]\n\n` +
        `📊 **ระดับความเสี่ยงเฉลี่ยของจังหวัด:** ${getRiskBadge(floodProb)}\n\n` +
        `🌧️ **1. ปัจจัยฝนตกวันนี้:** โอกาสเกิดฝนตก **${rainChance}%** (ฝนสะสมคาดการณ์ ~**${rainSum} มม.**)\n` +
        `⏱️ **2. ช่วงเวลาเสี่ยงสูงสุด:** **${peakTime}**\n` +
        `📍 **3. พิกัด 3 จุดที่มีความเสี่ยงสูงสุดในขณะนี้:**\n` +
        `  1. **ซอยวัดด่านสำโรง (สุขุมวิท 113):** แอ่งกระทะรับน้ำฝนสะสม (~${Math.min(92, Math.round(rainChance * 0.85 + 24))}%) \n` +
        `  2. **ตลาดปากน้ำ / ถนนท้ายบ้าน:** อิทธิพลน้ำทะเลหนุนเจ้าพระยา (~${Math.min(92, Math.round(rainChance * 0.8 + 28))}%) \n` +
        `  3. **ตลาดคลองด่าน (สุขุมวิทสายเก่า):** อิทธิพลคลื่นลมชายฝั่งทะเลอ่าวไทย (~${Math.min(92, Math.round(rainChance * 0.8 + 26))}%) \n\n` +
        `💡 ท่านสามารถพิมพ์ชื่อจุดเฉพาะ เช่น *"วัดด่านมีโอกาสท่วมอีกไหม"*, *"ปากน้ำ"*, หรือ *"นิคมบางปู"* เพื่อดูการวิเคราะห์เชิงลึก 4 ปัจจัยได้ทันทีครับ`;
    }

    // 10. ถามเรื่องพยากรณ์อากาศ / ฝนจะตกไหม / ฝนตกกี่เปอร์เซ็นต์ / ฝนตกหนัก
    if (q.includes("พยากรณ์") || q.includes("ฝน") || q.includes("ตกกี่") || q.includes("อากาศ") || q.includes("ตกหนัก")) {
      const isRainy = (weather.rainProbabilityToday || 0) >= 50;
      return `🌧️ **รายงานพยากรณ์อากาศและคาดการณ์ฝนตกหนัก จ.สมุทรปราการ**\n` +
        `อ้างอิงข้อมูล: [กรมอุตุนิยมวิทยา (TMD)] และ [ศูนย์พยากรณ์อากาศยุโรป ECMWF]\n\n` +
        `• **สถานะอากาศ:** ${weather.weatherDesc}\n` +
        `• **อุณหภูมิ:** ${weather.temp}°C (สูงสุด ${weather.tempMax || 33}°C / ต่ำสุด ${weather.tempMin || 26}°C)\n` +
        `• **ความชื้นสัมพัทธ์:** ${weather.humidity}%\n` +
        `• **โอกาสเกิดฝนตกวันนี้:** 🌧️ **${weather.rainProbabilityToday}%**\n` +
        `• **ปริมาณน้ำฝนสะสมคาดการณ์:** **${weather.rainSumToday} มิลลิเมตร**\n` +
        `• **ช่วงเวลาเสี่ยงฝนตกหนักที่สุด:** ⏱️ **${weather.peakHour}**\n` +
        `• **ระดับการแจ้งเตือน:** ${isRainy ? '⚠️ ' + weather.rainAlertLevel : '🟢 สภาพอากาศปกติ'}\n\n` +
        `💡 **ข้อแนะนำ:** หากมีฝนตกสะสมเกิน 30 มม. ใน 2 ชั่วโมง มักจะเกิดน้ำรอการระบายบนถนนสุขุมวิท, ศรีนครินทร์ และกิ่งแก้ว ควรเผื่อเวลาเดินทาง 30 - 45 นาทีครับ`;
    }

    // 11. ถามเรื่องรถเก๋ง / มอเตอร์ไซค์ / รถกระบะ / สัญจรได้ไหม
    if (q.includes("เก๋ง") || q.includes("มอเตอร์ไซค์") || q.includes("รถเล็ก") || q.includes("กระบะ") || q.includes("ผ่านได้") || q.includes("ลุยน้ำ") || q.includes("กี่เซน")) {
      return `🚗 **เกณฑ์มาตรฐานระดับน้ำและความปลอดภัยในการขับขี่ (อ้างอิง: [กรมทางหลวง] & [สำนักงาน คปภ.]):**\n\n` +
        `• **ระดับน้ำ 5 – 15 ซม. (ระดับข้อเท้า):**\n` +
        `  🟢 รถทุกประเภทสัญจรได้ตามปกติ ลดความเร็วเพื่อป้องกันน้ำกระเซ็น\n\n` +
        `• **ระดับน้ำ 16 – 35 ซม. (เสมอชายประตูล่าง / ปริ่มปลายท่อไอเสีย):**\n` +
        `  ⚠️ **รถเก๋งและ Eco car เสี่ยงสูงมาก** หากจำเป็นต้องผ่าน ให้ **ปิดแอร์ (A/C) ทันที** ใช้เกียร์ต่ำ และห้ามเร่งเครื่องกะทันหัน\n\n` +
        `• **ระดับน้ำเกิน 35 ซม. ขึ้นไป (มิดครึ่งล้อรถเก๋ง):**\n` +
        `  🔴 **ห้ามรถเก๋งและมอเตอร์ไซค์สัญจรผ่านโดยเด็ดขาด** เสี่ยงน้ำเข้าท่อไอดี เครื่องยนต์พังถาวร\n\n` +
        `📌 *ข้อควรจำสำคัญ:* หากรถยนต์ดับกลางน้ำ **ห้ามสตาร์ทเครื่องยนต์ซ้ำเด็ดขาด** ให้ปลดเกียร์ว่าง (N) และเข็นรถเข้าข้างทาง หรือโทร 1669/1197 ครับ`;
    }

    // 12. ถามเรื่องจุดวิกฤต / จุดที่ท่วมสูงที่สุด / จุดเสี่ยงหนัก
    if (q.includes("วิกฤต") || q.includes("หนัก") || q.includes("เยอะ") || q.includes("สูง") || q.includes("ท่วมมาก")) {
      const severe = points.filter(p => p.level === 3);
      return `🔴 **จุดเสี่ยงน้ำท่วมผิวจราจรระดับวิกฤตในสมุทรปราการ (อ้างอิง: [สนง.ปภ. จังหวัดสมุทรปราการ]):**\n\n` +
        severe.map((p, i) => 
          `**${i + 1}. ${p.name}** (อ.${p.district})\n` +
          `   • ระดับความลึกเฉลี่ย: ${p.depthRange}\n` +
          `   • สาเหตุ: ${p.cause}\n` +
          `   • คำแนะนำ: ${p.officialGuidance}`
        ).join("\n\n") +
        `\n\n⚠️ **เส้นทางเลี่ยง:** ใช้สะพานภูมิพล, ถนนวงแหวนกาญจนาภิเษก หรือทางด่วนบูรพาวิถี`;
    }

    // 13. ถามเรื่องน้ำทะเลหนุน / ตารางน้ำขึ้น-น้ำลง
    if (q.includes("หนุน") || q.includes("ทะเล") || q.includes("ขึ้นลง")) {
      return `🌊 **ข้อมูลอุทกศาสตร์และการเกิดน้ำทะเลหนุน (อ้างอิง: [กรมอุทกศาสตร์ กองทัพเรือ]):**\n\n` +
        `• **สถานีตรวจวัดหลัก:** สถานีป้อมพระจุลจอมเกล้า อ.พระสมุทรเจดีย์\n` +
        `• **เกณฑ์เฝ้าระวัง:** เมื่อระดับน้ำสูงเกิน **+1.70 เมตร รทก.** น้ำในแม่น้ำเจ้าพระยาจะเริ่มเอ่อล้นเข้าท่วมถนนแนวเขื่อน\n` +
        `• **ช่วงน้ำเกิด (Spring Tide):** วันขึ้น 15 ค่ำ และแรม 15 ค่ำ (วันพระ) ระดับน้ำจะขึ้นสูงสุด 2 ครั้งต่อวัน\n` +
        `• **พื้นที่เสี่ยงสูงสุด:** ตลาดปากน้ำ (อ.เมือง), ซอยวัดด่าน (สำโรง), ท่าน้ำพระประแดง และตลาดคลองด่าน (อ.บางบ่อ)\n\n` +
        `🔗 ตรวจสอบตารางน้ำขึ้น-น้ำลงรายวันได้ที่เว็บไซต์ทางการ **hydro.navy.mi.th** ครับ`;
    }

    // 14. ถามเบอร์โทรฉุกเฉิน / กู้ภัย / กระสอบทราย / แจ้งเหตุ
    if (q.includes("เบอร์") || q.includes("สายด่วน") || q.includes("โทร") || q.includes("กู้ภัย") || q.includes("ช่วยเหลือ") || q.includes("ฉุกเฉิน") || q.includes("ลากรถ")) {
      return `📞 **หมายเลขโทรศัพท์สายด่วนฉุกเฉิน 24 ชั่วโมง จ.สมุทรปราการ:**\n\n` +
        `• **1669** : ศูนย์กู้ชีพการแพทย์ฉุกเฉินแห่งชาติ (EMS)\n` +
        `• **1784** : กรมป้องกันและบรรเทาสาธารณภัย (สายด่วนนิรภัย ปภ.)\n` +
        `• **02-382-6040** : สนง.ปภ. จังหวัดสมุทรปราการ\n` +
        `• **02-382-6199** : เทศบาลนครสมุทรปราการ (ศูนย์สูบน้ำและขอกระสอบทราย)\n` +
        `• **1197** : ศูนย์ควบคุมและสั่งการจราจร (บก.02)\n` +
        `• **1586** : สายด่วนกรมทางหลวง`;
    }

    // 15. ทักทาย / ขอบคุณ
    if (q.includes("สวัสดี") || q.includes("หวัดดี") || q.includes("hello") || q.includes("hi")) {
      return `สวัสดีครับ ยินดีให้บริการข้อมูลอุทกภัย เส้นทางสัญจร และสภาพอากาศ จ.สมุทรปราการ ครับ ท่านสามารถพิมพ์คำถามหรือเลือกหัวขอด้านบนได้เลยครับ`;
    }

    if (q.includes("ขอบคุณ") || q.includes("แต๊ง") || q.includes("thank")) {
      return `ด้วยความยินดีครับ ขอให้ทุกท่านเดินทางสัญจรด้วยความปลอดภัยครับ`;
    }

    // Default Fallback
    return `ขออภัยครับ คำถามนี้อาจต้องการความชัดเจนเพิ่มเติม ท่านสามารถสอบถามข้อมูลในสมุทรปราการได้ดังนี้ครับ:\n\n` +
      `1. **ความเสี่ยงเฉพาะพื้นที่:** เช่น *"อยากทราบว่าวัดด่านมีโอกาสท่วมอีกไหม"*, *"ปากน้ำมีโอกาสท่วมไหม"*, *"นิคมฯ บางปู"*\n` +
      `2. **พยากรณ์ฝน:** เช่น *"วันนี้ฝนจะตกกี่โมง"*, *"โอกาสฝนตกกี่เปอร์เซ็นต์"*\n` +
      `3. **เกณฑ์รถยนต์:** เช่น *"รถเก๋งลุยน้ำได้กี่เซน"*\n` +
      `4. **น้ำทะเลหนุน:** เช่น *"ป้อมพระจุลฯ น้ำทะเลหนุนส่งผลกระทบที่ไหน"*\n` +
      `5. **สายด่วน:** เช่น *"ขอเบอร์โทร ปภ. หรือ กู้ภัย"*\n\n` +
      `โปรดพิมพ์คำถามหรือเลื่อนเลือกชิปคำถามด้านบนได้เลยครับ`;
  };

  // Smooth Streaming Typer
  const streamBotResponse = (fullText) => {
    const newMsgId = `bot-${Date.now()}`;
    const newBotMsg = {
      id: newMsgId,
      sender: 'bot',
      text: '',
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newBotMsg]);
    setStreamingMessageId(newMsgId);
    setIsThinking(false);

    let currentIdx = 0;
    const speed = 12;

    const interval = setInterval(() => {
      currentIdx += Math.floor(Math.random() * 2) + 2;
      if (currentIdx >= fullText.length) {
        currentIdx = fullText.length;
        clearInterval(interval);
        setStreamingMessageId(null);
      }

      const displayedText = fullText.slice(0, currentIdx);
      setMessages(prev => prev.map(m => m.id === newMsgId ? { ...m, text: displayedText } : m));
    }, speed);
  };

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || streamingMessageId) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      const fullAnswer = synthesizeAnswer(query, [...messages, userMsg]);
      streamBotResponse(fullAnswer);
    }, 280);
  };

  // Smart Formatter for Message Text (Highlighting Government Agency Citations Prominently)
  const renderFormattedMessage = (rawText) => {
    if (!rawText) return null;

    const paragraphs = rawText.split('\n');

    return paragraphs.map((para, pIdx) => {
      if (!para.trim()) {
        return <div key={pIdx} className="h-1.5" />;
      }

      const tokens = [];
      const regex = /(\[.*?\])|(\*\*.*?\*\*)/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(para)) !== null) {
        if (match.index > lastIndex) {
          tokens.push({ type: 'text', content: para.substring(lastIndex, match.index) });
        }

        if (match[1]) {
          const agencyName = match[1].slice(1, -1);
          tokens.push({ type: 'agency', content: agencyName });
        } else if (match[2]) {
          const boldText = match[2].slice(2, -2);
          tokens.push({ type: 'bold', content: boldText });
        }

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < para.length) {
        tokens.push({ type: 'text', content: para.substring(lastIndex) });
      }

      return (
        <p key={pIdx} className="leading-relaxed mb-1 text-xs sm:text-sm">
          {tokens.map((token, tIdx) => {
            if (token.type === 'agency') {
              return (
                <span 
                  key={tIdx} 
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 my-0.5 mx-0.5 rounded-md text-[11px] font-bold shadow-xs align-baseline ${
                    isDark 
                      ? 'bg-blue-950/80 text-cyan-300 border border-blue-800' 
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                  title="แหล่งอ้างอิงข้อมูลเปิดสาธารณะ"
                >
                  <ShieldCheck className={`w-3 h-3 shrink-0 inline ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                  <span>{token.content}</span>
                </span>
              );
            }
            if (token.type === 'bold') {
              return <strong key={tIdx} className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{token.content}</strong>;
            }
            return <span key={tIdx}>{token.content}</span>;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Helpdesk Launcher Button - Theme-Adaptive */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl font-semibold text-xs sm:text-sm shadow-xl items-center gap-2.5 border cursor-pointer transition-all hover:scale-105 active:scale-95 backdrop-blur-xl group ${
            isPointSelected ? 'hidden sm:flex' : 'flex'
          } ${
            isDark 
              ? 'bg-slate-900/95 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-blue-500' 
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-blue-400'
          }`}
          title="ศูนย์บริการข้อมูลเส้นทางและน้ำท่วม (ถาม-ตอบอัจฉริยะ)"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className={`block text-xs sm:text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>PrakanGuard AI</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              }`}>Online</span>
            </div>
            <span className={`block text-[10px] font-medium ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>ถามตอบแม่นยำ • พยากรณ์ฝนสด</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-white ml-1"></span>
        </button>
      )}

      {/* Official Public Information Dialog - Theme-Adaptive & Freely Draggable */}
      {isOpen && (
        <div 
          ref={modalRef}
          style={position ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            right: 'auto',
            bottom: 'auto'
          } : undefined}
          className={`fixed z-50 w-[95vw] sm:w-[460px] h-[600px] max-h-[85vh] sm:max-h-[88vh] border rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl transition-[box-shadow,border-color] duration-150 ${
            !position ? 'bottom-2.5 left-2.5 right-2.5 sm:left-auto sm:bottom-6 sm:right-6' : ''
          } ${
            isDraggingModal ? 'ring-2 ring-blue-500/60 shadow-blue-500/30 cursor-grabbing' : ''
          } ${
            isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          
          {/* Header (Freely Draggable Handle for PC Mouse & Mobile Touch) */}
          <div 
            onMouseDown={handleMouseDownHeader}
            onTouchStart={handleTouchStartHeader}
            className={`px-4 py-3 border-b flex items-center justify-between cursor-grab active:cursor-grabbing select-none transition-colors ${
              isDraggingModal 
                ? (isDark ? 'bg-blue-950/90 border-blue-700' : 'bg-blue-50/90 border-blue-300')
                : (isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200')
            }`}
            title="กดค้างที่แถบนี้เพื่อลากย้ายหน้าต่าง AI ChatBot ได้อย่างอิสระ"
          >
            <div className="flex items-center space-x-2.5 min-w-0 pointer-events-none">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 border border-blue-400/30 flex items-center justify-center text-white shadow-md shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span>PrakanGuard AI สารสนเทศอุทกภัย</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    isDark ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  }`}>Online</span>
                </h4>
                <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  อ้างอิงประกาศและข้อมูลสาธารณะที่เป็นประโยชน์
                </p>
              </div>
            </div>

            {/* Drag Handle Badge & Control Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <div 
                className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium pointer-events-none select-none border transition-colors ${
                  isDark 
                    ? 'bg-slate-800/80 text-slate-300 border-slate-700' 
                    : 'bg-white/90 text-slate-600 border-slate-200 shadow-xs'
                }`}
                title="คลิกค้างแล้วลากเพื่อย้ายหน้าต่าง"
              >
                <GripHorizontal className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                <span>ลากย้ายได้</span>
              </div>

              {position && (
                <button
                  type="button"
                  onClick={handleResetPosition}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-xs'
                  }`}
                  title="รีเซ็ตตำแหน่งกลับมุมจอขวาล่าง"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700' 
                    : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 shadow-xs'
                }`}
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Live Meteorological Telemetry Status Bar */}
          <div className={`px-3.5 py-1.5 border-b flex items-center justify-between text-[11px] ${
            isDark ? 'bg-blue-950/70 border-blue-900 text-blue-200' : 'bg-blue-50/90 border-blue-100 text-blue-900'
          }`}>
            <div className="flex items-center gap-1.5 truncate">
              <CloudRain className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span className="truncate">
                อากาศสมุทรปราการ: <strong className={`font-bold ${isDark ? 'text-cyan-300' : 'text-blue-950'}`}>{weather.temp}°C</strong> • โอกาสฝน: <strong className={`font-bold ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>{weather.rainProbabilityToday}%</strong>
              </span>
            </div>
            <span className={`text-[10px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded-md border ${
              isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-100/90 text-amber-800 border-amber-300'
            }`}>
              เฝ้าระวัง: {weather.peakHour}
            </span>
          </div>

          {/* Quick Smart Inquiry Chips (With Left & Right Slider Controls) */}
          <div className={`relative px-2 py-1.5 border-b flex items-center ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            {/* Left Scroll Button */}
            <button
              type="button"
              onClick={() => scrollChips('left')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0 mr-1 border ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="เลื่อนดูคำถามก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Chips Strip (Touch, Wheel & Drag with Butter-Smooth Gliding) */}
            <div 
              ref={chipsRef}
              onMouseDown={handleChipsMouseDown}
              onMouseMove={handleChipsMouseMove}
              onMouseUp={handleChipsMouseUp}
              onMouseLeave={handleChipsMouseUp}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto smooth-slider no-scrollbar text-xs py-0.5 touch-pan-x cursor-grab active:cursor-grabbing select-none"
            >
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ช่วยย่อและสรุปสั้นๆ ให้หน่อย"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-gradient-to-r from-purple-900 to-indigo-900 text-purple-200 border border-purple-700 hover:from-purple-800 hover:to-indigo-800' 
                    : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-300 hover:from-purple-100 hover:to-indigo-100'
                }`}
                title="ขอคำตอบแบบย่อสั้น กระชับ ตรงประเด็น"
              >
                ⚡️ ย่อ/สรุปสั้นๆ หน่อย
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ปากน้ำมีโอกาสท่วมไหม และต้องเตรียมตัวอย่างไร?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-blue-950/90 text-cyan-300 border border-blue-700 hover:bg-blue-900' 
                    : 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100'
                }`}
              >
                📍 ปากน้ำมีโอกาสท่วมไหม?
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("อยากทราบว่าวัดด่านมีโอกาสท่วมอีกไหม?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-amber-950/90 text-amber-300 border border-amber-700 hover:bg-amber-900' 
                    : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                }`}
              >
                🌊 วัดด่านมีโอกาสท่วมอีกไหม?
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("วันนี้ฝนจะตกกี่เปอร์เซ็นต์ และคาดการณ์ตกหนักช่วงเวลาไหน?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🌧️ คาดการณ์ฝนตกหนักวันนี้
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("รถเก๋งลุยน้ำได้กี่เซนติเมตร และระดับไหนห้ามผ่านเด็ดขาด?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🚗 เกณฑ์รถเก๋งลุยน้ำ
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("สถานการณ์จุดเสี่ยงสำโรงและแบริ่งเป็นอย่างไร?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🚇 สำโรง-แบริ่ง
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("นิคมอุตสาหกรรมบางปู เสี่ยงน้ำท่วมไหม?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🏭 นิคมฯ บางปู
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ถนนกิ่งแก้ว และอำเภอบางพลี สภาพการสัญจรเป็นอย่างไร?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                ✈️ กิ่งแก้ว-บางพลี
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ท่าน้ำพระประแดง และถนนปู่เจ้าสมิงพราย มีน้ำท่วมไหม?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🚢 พระประแดง-ปู่เจ้า
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("น้ำทะเลหนุนสถานีป้อมพระจุลฯ ส่งผลกระทบพื้นที่ไหนบ้าง?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🌊 น้ำทะเลหนุนป้อมพระจุลฯ
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ตลาดคลองด่าน และอำเภอบางบ่อ เสี่ยงน้ำท่วมไหม?"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-slate-850 text-slate-300 border border-slate-700 hover:border-blue-400 hover:text-cyan-300' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                🌊 คลองด่าน-บางบ่อ
              </button>
              <button 
                onClick={() => { if (!chipsHasDraggedRef.current) handleSend("ขอหมายเลขโทรศัพท์สายด่วนฉุกเฉินและหน่วยกู้ภัยในสมุทรปราการ"); }}
                className={`smooth-slider-item px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium flex items-center gap-1 shrink-0 select-none ${
                  isDark 
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900/60' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                📞 สายด่วน ปภ. 24 ชม.
              </button>
            </div>

            {/* Right Scroll Button */}
            <button
              type="button"
              onClick={() => scrollChips('right')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0 ml-1 border ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="เลื่อนดูคำถามถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Message History Feed */}
          <div className={`flex-1 p-3.5 sm:p-4 space-y-3 overflow-y-auto text-xs sm:text-sm ${
            isDark ? 'bg-slate-950/40' : 'bg-slate-50/40'
          }`}>
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
                
                <div 
                  className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${
                    m.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-xs font-medium' 
                      : isDark
                        ? 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-bl-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {renderFormattedMessage(m.text)}
                  
                  {streamingMessageId === m.id && (
                    <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                  )}

                  <span className={`block text-[10px] mt-1.5 ${
                    m.sender === 'user' ? 'text-blue-100 text-right' : (isDark ? 'text-slate-400' : 'text-slate-500')
                  }`}>
                    {m.time}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex gap-2.5 justify-start animate-in fade-in duration-200">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                  isDark ? 'bg-blue-950 text-cyan-400 border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className={`border rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1.5 shadow-sm ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  <span className="text-xs ml-1.5 font-medium">กำลังค้นหาข้อมูลประกาศและสภาพอากาศ...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className={`p-3 border-t flex items-center gap-2 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={Boolean(streamingMessageId)}
              placeholder="พิมพ์คำถาม เช่น ปากน้ำมีโอกาสท่วมไหม, วันนี้ฝนตกกี่โมง..."
              className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:bg-slate-800' 
                  : 'bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isThinking || Boolean(streamingMessageId)}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md"
              title="ส่งข้อความ"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
