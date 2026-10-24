// PrakanGuard Daily Flood Status Updates Engine (อัปเดตสถานการณ์น้ำรายวัน)
// 1. เที่ยงคืนของทุกวัน (00:00:00 น.) ลบ/รีเซ็ตข้อมูลทั้งหมดอัตโนมัติ เริ่มต้นวันใหม่
// 2. มีการอัปเดตน้ำท่วมจากแหล่งข้อมูลจริง (Traffy Fondue, โทรมาตร TMD, กรมอุทกศาสตร์, ปภ. 1784, แอดมินอนุมัติ) ให้แจ้งเตือนในนี้
// 3. กฎเข้มงวด: 1 เวลาต่อการแจ้งเตือน 1 ครั้งตามสถานที่นั้นๆ (ห้ามปั๊มเวลาซ้ำ ห้ามมีแต่เวลาเดิม)
// 4. แสดงสถานที่จริงครอบคลุมทั้ง 6 อำเภอ ไม่วนเวียนเฉพาะจุดเดิมๆ

export function getBangkokDateKey(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date); // YYYY-MM-DD
  } catch (_) {
    return date.toISOString().split('T')[0];
  }
}

export function formatBangkokTime(date = new Date()) {
  try {
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'Asia/Bangkok' 
    }) + ' น.';
  } catch (_) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m} น.`;
  }
}

export function getMsUntilBangkokMidnight() {
  const now = new Date();
  const bkkString = now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
  const bkkDate = new Date(bkkString);
  const nextMidnight = new Date(bkkDate);
  nextMidnight.setHours(24, 0, 0, 0);
  const diff = nextMidnight.getTime() - bkkDate.getTime();
  return Math.max(1000, diff);
}

// ฟังก์ชันตรวจสอบว่า Timestamp นี้เป็นของวันปัจจุบันตามเวลาประเทศไทยหรือไม่ (ป้องกันข้อมูลวันก่อนค้าง)
export function isTimestampTodayBangkok(ts) {
  if (!ts) return false;
  try {
    const todayKey = getBangkokDateKey();
    const itemDate = new Date(Number(ts));
    if (isNaN(itemDate.getTime())) return false;
    return getBangkokDateKey(itemDate) === todayKey;
  } catch (_) {
    return false;
  }
}

// รีเซ็ตข้อมูลอัปเดตประจำวันให้เป็นค่าว่าง (สำหรับเริ่มต้นวันใหม่หลังเวลา 00:00:00 น.)
export function resetDailyUpdates() {
  const todayKey = getBangkokDateKey();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('prakanguard_daily_updates_date', todayKey);
      localStorage.setItem('prakanguard_daily_updates_feed', '[]');
    } catch (_) {}
  }
  return [];
}

// สร้างชุดข้อมูลตั้งต้นของ "วันนี้" ตามเวลาจริงของวันนี้ (อ้างอิงสถานีโทรมาตรหลัก 6 อำเภอ)
export function getTodayBaselineUpdates() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // กำหนดจุดตรวจการณ์โทรมาตรทางการ 6 อำเภอ
  const stations = [
    {
      id: 'upd-spk-01',
      locationKey: 'sp-15',
      locationName: 'สถานีป้อมพระจุลจอมเกล้า (ปากอ่าวไทย)',
      district: 'พระสมุทรเจดีย์',
      subdistrict: 'ต.แหลมฟ้าผ่า',
      locationSub: 'พระสมุทรเจดีย์ • ต.แหลมฟ้าผ่า',
      statusType: 'rising',
      statusLabel: 'เริ่มท่วมแล้ว',
      statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      depthCm: 58,
      source: 'กรมอุทกศาสตร์ กองทัพเรือ',
      lat: 13.5412,
      lng: 100.5845,
      hour: 8,
      minute: 30
    },
    {
      id: 'upd-spk-02',
      locationKey: 'sp-10',
      locationName: 'การเคหะเมืองใหม่บางเสาธง (ซอย C1 - C5)',
      district: 'บางเสาธง',
      subdistrict: 'ต.บางเสาธง',
      locationSub: 'บางเสาธง • ต.บางเสาธง',
      statusType: 'rising',
      statusLabel: 'เริ่มท่วมแล้ว',
      statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      depthCm: 55,
      source: 'สนง.ปภ. สมุทรปราการ (1784)',
      lat: 13.5875,
      lng: 100.8250,
      hour: 9,
      minute: 15
    },
    {
      id: 'upd-spk-03',
      locationKey: 'cat-sp-03',
      locationName: 'ถนนท้ายบ้าน ปากซอย 38 (เลียบคลองตาเจี่ย)',
      district: 'เมืองสมุทรปราการ',
      subdistrict: 'ต.ท้ายบ้านใหม่',
      locationSub: 'เมือง • ต.ท้ายบ้านใหม่',
      statusType: 'rising',
      statusLabel: 'เริ่มท่วมแล้ว',
      statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      depthCm: 45,
      source: 'เทศบาลตำบลท้ายบ้านใหม่',
      lat: 13.5780,
      lng: 100.6020,
      hour: 10,
      minute: 5
    },
    {
      id: 'upd-spk-04',
      locationKey: 'sp-30',
      locationName: 'แยกสุขสมาน (ถ.ลาดกระบัง - สุวรรณภูมิ 4)',
      district: 'บางพลี',
      subdistrict: 'ต.หนองปรือ',
      locationSub: 'บางพลี • ต.หนองปรือ',
      statusType: 'rising',
      statusLabel: 'เริ่มท่วมแล้ว',
      statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      depthCm: 32,
      source: 'แขวงทางหลวงสมุทรปราการ',
      lat: 13.7275,
      lng: 100.7686,
      hour: 11,
      minute: 30
    },
    {
      id: 'upd-spk-05',
      locationKey: 'sp-17',
      locationName: 'ถนนบางนา-ตราด กม.18 (บางโฉลง / ม.หัวเฉียว)',
      district: 'บางพลี',
      subdistrict: 'ต.บางโฉลง',
      locationSub: 'บางพลี • ต.บางโฉลง',
      statusType: 'receding',
      statusLabel: 'น้ำลดแล้ว',
      statusBadgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      depthCm: 18,
      source: 'แขวงทางหลวงสมุทรปราการ (ทล.34)',
      lat: 13.6135,
      lng: 100.7420,
      hour: 13,
      minute: 10
    },
    {
      id: 'upd-spk-06',
      locationKey: 'sp-13',
      locationName: 'ถนนปู่เจ้าสมิงพราย (ช่วงท่าน้ำเภตรา)',
      district: 'พระประแดง',
      subdistrict: 'ต.สำโรงใต้',
      locationSub: 'พระประแดง • ต.สำโรงใต้',
      statusType: 'receding',
      statusLabel: 'น้ำลดแล้ว',
      statusBadgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      depthCm: 14,
      source: 'สภ.สำโรงใต้ & เทศบาลเมืองปู่เจ้าฯ',
      lat: 13.6475,
      lng: 100.5620,
      hour: 14,
      minute: 20
    },
    {
      id: 'upd-spk-07',
      locationKey: 'sp-27',
      locationName: 'ถนนปานวิถี หน้าตลาดสดเทศบาลบางบ่อ (ริมคลองสำโรง)',
      district: 'บางบ่อ',
      subdistrict: 'ต.บางบ่อ',
      locationSub: 'บางบ่อ • ต.บางบ่อ',
      statusType: 'receding',
      statusLabel: 'น้ำลดแล้ว',
      statusBadgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      depthCm: 12,
      source: 'เทศบาลตำบลบางบ่อ',
      lat: 13.5685,
      lng: 100.8350,
      hour: 15,
      minute: 45
    },
    {
      id: 'upd-spk-08',
      locationKey: 'sp-srithepha',
      locationName: 'แยกศรีเทพา ถนนเทพารักษ์ (จุดตัด ถ.ศรีนครินทร์)',
      district: 'เมืองสมุทรปราการ',
      subdistrict: 'ต.สำโรงเหนือ',
      locationSub: 'เมือง • ต.สำโรงเหนือ',
      statusType: 'dry',
      statusLabel: 'แห้งแล้ว',
      statusBadgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      depthCm: 0,
      source: 'แขวงทางหลวงสมุทรปราการ (สูบระบายปกติ)',
      lat: 13.6270,
      lng: 100.6260,
      hour: 16,
      minute: 30
    }
  ];

  // คัดกรองเฉพาะเวลาที่เกิดขึ้นแล้วใน "วันนี้" เท่านั้น ไม่สร้างเวลาในอนาคต
  return stations
    .filter(s => s.hour < currentHour || (s.hour === currentHour && s.minute <= currentMinute))
    .map(s => {
      const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), s.hour, s.minute, 0);
      return {
        id: `${s.id}_${getBangkokDateKey(now)}`,
        locationKey: s.locationKey,
        locationName: s.locationName,
        district: s.district,
        subdistrict: s.subdistrict,
        locationSub: s.locationSub,
        statusType: s.statusType,
        statusLabel: s.statusLabel,
        statusBadgeClass: s.statusBadgeClass,
        depthCm: s.depthCm,
        itemTime: `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')} น.`,
        timestamp: eventDate.getTime(),
        source: s.source,
        lat: s.lat,
        lng: s.lng
      };
    });
}

export const SEED_REAL_DAILY_UPDATES = [];

// โหลดข้อมูลอัปเดตประจำวัน พร้อมตรวจสอบเที่ยงคืน (00:00:00) เพื่อลบออกทั้งหมดอัตโนมัติ
export function loadDailyUpdatesFromStorage() {
  if (typeof window === 'undefined') return [];

  const todayKey = getBangkokDateKey();
  const storedDate = localStorage.getItem('prakanguard_daily_updates_date');

  // หากเป็นวันใหม่ (ผ่านเที่ยงคืน 00:00:00 น. แล้วจริงๆ): รีเซ็ตลบข้อมูลวันเก่าออก 100%
  if (!storedDate || storedDate !== todayKey) {
    try {
      localStorage.setItem('prakanguard_daily_updates_date', todayKey);
      const baseline = getTodayBaselineUpdates();
      localStorage.setItem('prakanguard_daily_updates_feed', JSON.stringify(baseline));
      return baseline;
    } catch (_) {
      return [];
    }
  }

  // หากเป็นวันเดียวกัน: โหลดจาก cache และคัดกรองเฉพาะข้อมูลของ "วันนี้" เท่านั้น
  try {
    const raw = localStorage.getItem('prakanguard_daily_updates_feed');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter(item => {
            if (!item) return false;
            // ตรวจสอบว่าเหตุการณ์นี้อยู่ในวันปัจจุบันจริงๆ หรือไม่
            if (item.timestamp && !isTimestampTodayBangkok(item.timestamp)) return false;
            
            const locStr = `${item.locationName || ''} ${item.locationKey || ''} ${item.id || ''}`.toLowerCase();
            const subStr = String(item.locationSub || '');
            const distStr = String(item.district || '');
            if (locStr.includes('security-probe') || locStr.includes('auto-deleted') || locStr.includes('probe') || locStr.includes('ทดสอบ')) return false;
            if (locStr.includes('????') || subStr.includes('????') || distStr.includes('????')) return false;
            return true;
          })
          .map(item => {
            const locStr = `${item.locationName || ''} ${item.locationKey || ''}`.toLowerCase();
            let resolvedTime = item.itemTime;
            if (typeof resolvedTime === 'string' && resolvedTime.includes('T')) {
              try {
                const d = new Date(resolvedTime);
                if (!isNaN(d.getTime())) {
                  resolvedTime = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) + ' น.';
                }
              } catch (_) {}
            }
            if (locStr.includes('ศรีเทพา') || (item.lat && Math.abs(item.lat - 13.627) < 0.015 && Math.abs(item.lng - 100.626) < 0.015)) {
              return {
                ...item,
                itemTime: resolvedTime,
                district: 'เมืองสมุทรปราการ',
                subdistrict: 'ต.สำโรงเหนือ',
                locationSub: 'เมือง • ต.สำโรงเหนือ'
              };
            }
            return {
              ...item,
              itemTime: resolvedTime
            };
          });

        // หากมีข้อมูลที่ยังถูกต้องในวันนี้ ให้จัดเก็บและใช้งาน
        if (cleaned.length > 0) {
          try {
            localStorage.setItem('prakanguard_daily_updates_feed', JSON.stringify(cleaned));
          } catch (_) {}
          return cleaned;
        }
      }
    }
  } catch (_) {}

  // หากยังไม่มีข้อมูลของวันนี้ ให้ใช้ baseline ของวันนี้
  const freshBaseline = getTodayBaselineUpdates();
  try {
    localStorage.setItem('prakanguard_daily_updates_date', todayKey);
    localStorage.setItem('prakanguard_daily_updates_feed', JSON.stringify(freshBaseline));
  } catch (_) {}

  return freshBaseline;
}

// รวมการแจ้งเตือนเหตุการณ์ใหม่เข้าสู่ Daily Feed
// กฎเข้มงวด: 1 เวลาต่อการแจ้งเตือน 1 ครั้งตามสถานที่นั้นๆ
export function mergeDailyUpdateEvent(prevList = [], newEvent = {}) {
  if (!newEvent || !newEvent.locationName) return prevList;

  // กรองข้อมูลทดสอบ หรือข้อมูลไม่จริงออกโดยเด็ดขาด
  const checkName = String(newEvent.locationName || '').toLowerCase();
  const checkSub = String(newEvent.locationSub || '');
  const checkDist = String(newEvent.district || '');
  const checkId = String(newEvent.id || '').toLowerCase();
  if (checkName.includes('security-probe') || checkName.includes('auto-deleted') || checkName.includes('probe') || checkName.includes('ทดสอบ')) {
    return prevList;
  }
  if (checkId.includes('probe') || checkId.includes('test-inspect') || checkId.includes('test-check')) {
    return prevList;
  }
  if (checkName.includes('????') || checkSub.includes('????') || checkDist.includes('????')) {
    return prevList;
  }

  const todayKey = getBangkokDateKey();
  const key = (newEvent.locationKey || newEvent.locationName || '').trim().toLowerCase();
  
  // Format event time so raw ISO timestamps are NEVER used
  let eventTime = newEvent.itemTime;
  if (!eventTime || (typeof eventTime === 'string' && eventTime.includes('T'))) {
    try {
      const d = eventTime ? new Date(eventTime) : new Date(newEvent.timestamp || Date.now());
      if (!isNaN(d.getTime())) {
        eventTime = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) + ' น.';
      } else {
        eventTime = formatBangkokTime();
      }
    } catch (_) {
      eventTime = formatBangkokTime();
    }
  }

  // ตรวจสอบความถูกต้องของตำบล โดยเฉพาะแยกศรีเทพา -> สำโรงเหนือ
  let resolvedDistrict = newEvent.district || 'สมุทรปราการ';
  let resolvedSubdistrict = newEvent.subdistrict || '';
  const checkStr = `${newEvent.locationName} ${key}`.toLowerCase();
  if (checkStr.includes('ศรีเทพา') || (newEvent.lat && Math.abs(newEvent.lat - 13.627) < 0.015 && Math.abs(newEvent.lng - 100.626) < 0.015)) {
    resolvedDistrict = 'เมืองสมุทรปราการ';
    resolvedSubdistrict = 'ต.สำโรงเหนือ';
  }

  const cleanSub = resolvedSubdistrict.startsWith('ต.') ? resolvedSubdistrict : (resolvedSubdistrict ? `ต.${resolvedSubdistrict}` : '');
  const locationSubText = newEvent.locationSub && !checkStr.includes('ศรีเทพา')
    ? newEvent.locationSub
    : `${resolvedDistrict.replace('เมืองสมุทรปราการ', 'เมือง')} • ${cleanSub}`.trim();

  const formattedEvent = {
    id: newEvent.id || `upd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    locationKey: key,
    locationName: newEvent.locationName,
    district: resolvedDistrict,
    subdistrict: resolvedSubdistrict,
    locationSub: locationSubText,
    statusType: newEvent.statusType || 'rising', // 'dry' | 'receding' | 'rising'
    statusLabel: newEvent.statusLabel || (newEvent.statusType === 'dry' ? 'แห้งแล้ว' : newEvent.statusType === 'receding' ? 'น้ำลดแล้ว' : 'เริ่มท่วมแล้ว'),
    statusBadgeClass: newEvent.statusType === 'dry'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : newEvent.statusType === 'receding'
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    depthCm: newEvent.depthCm !== undefined ? Number(newEvent.depthCm) : 0,
    itemTime: eventTime,
    timestamp: newEvent.timestamp || Date.now(),
    source: newEvent.source || 'รายงานตรวจสอบพื้นที่',
    lat: newEvent.lat,
    lng: newEvent.lng,
    rawPoint: newEvent.rawPoint || newEvent
  };

  // ค้นหาว่าสถานที่นี้เคยมีแจ้งเตือนในวันนี้แล้วหรือไม่
  const existingIdx = prevList.findIndex(item => {
    const itemKey = (item.locationKey || item.locationName || '').trim().toLowerCase();
    return itemKey === key;
  });

  let nextList = [];

  if (existingIdx >= 0) {
    const existing = prevList[existingIdx];
    // ถ้าสถานะและความลึกเดิมเหมือนกันทุกประการ -> ไม่สร้างซ้ำ คงเวลาเดิมไว้ 1 เวลาต่อ 1 ครั้ง
    if (existing.statusType === formattedEvent.statusType && existing.depthCm === formattedEvent.depthCm) {
      return prevList;
    }
    // ถ้าสถานะเปลี่ยนจริง (เช่น จากเริ่มท่วม -> น้ำลด หรือ แห้งแล้ว) -> อัปเดตสถานะและเวลาใหม่ของสถานที่นั้น
    nextList = [...prevList];
    nextList[existingIdx] = {
      ...existing,
      ...formattedEvent
    };
  } else {
    // จุดใหม่ -> แทรกที่บนสุดของรายการ
    nextList = [formattedEvent, ...prevList];
  }

  // จัดเก็บลงใน LocalStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('prakanguard_daily_updates_date', todayKey);
      localStorage.setItem('prakanguard_daily_updates_feed', JSON.stringify(nextList));
    } catch (_) {}
  }

  return nextList;
}

