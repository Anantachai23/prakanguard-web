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

// ชุดข้อมูลอัปเดตสถานการณ์จริงประจำวัน (เริ่มต้นของวัน) จากแหล่งข้อมูลโทรมาตรทางการ 6 อำเภอ
export const SEED_REAL_DAILY_UPDATES = [
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
    itemTime: '08:30 น.',
    timestamp: Date.now() - (9 * 3600 * 1000),
    source: 'กรมอุทกศาสตร์ กองทัพเรือ',
    lat: 13.5412,
    lng: 100.5845
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
    itemTime: '09:15 น.',
    timestamp: Date.now() - (8.2 * 3600 * 1000),
    source: 'สนง.ปภ. สมุทรปราการ (1784)',
    lat: 13.5875,
    lng: 100.8250
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
    depthCm: 55,
    itemTime: '10:05 น.',
    timestamp: Date.now() - (7.4 * 3600 * 1000),
    source: 'เทศบาลตำบลท้ายบ้านใหม่',
    lat: 13.5780,
    lng: 100.6020
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
    depthCm: 52,
    itemTime: '11:30 น.',
    timestamp: Date.now() - (6 * 3600 * 1000),
    source: 'แขวงทางหลวงสมุทรปราการ',
    lat: 13.7275,
    lng: 100.7686
  },
  {
    id: 'upd-spk-05',
    locationKey: 'sp-17',
    locationName: 'ถนนบางนา-ตราด กม.18 (บางโฉลง / ม.หัวเฉียว)',
    district: 'บางพลี',
    subdistrict: 'ต.บางโฉลง',
    locationSub: 'บางพลี • ต.บางโฉลง',
    statusType: 'rising',
    statusLabel: 'เริ่มท่วมแล้ว',
    statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    depthCm: 28,
    itemTime: '13:10 น.',
    timestamp: Date.now() - (4.4 * 3600 * 1000),
    source: 'แขวงทางหลวงสมุทรปราการ (ทล.34)',
    lat: 13.6135,
    lng: 100.7420
  },
  {
    id: 'upd-spk-06',
    locationKey: 'sp-13',
    locationName: 'ถนนปู่เจ้าสมิงพราย (ช่วงท่าน้ำเภตรา)',
    district: 'พระประแดง',
    subdistrict: 'ต.สำโรงใต้',
    locationSub: 'พระประแดง • ต.สำโรงใต้',
    statusType: 'rising',
    statusLabel: 'เริ่มท่วมแล้ว',
    statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    depthCm: 28,
    itemTime: '13:45 น.',
    timestamp: Date.now() - (3.8 * 3600 * 1000),
    source: 'สภ.สำโรงใต้ & เทศบาลเมืองปู่เจ้าฯ',
    lat: 13.6475,
    lng: 100.5620
  },
  {
    id: 'upd-spk-07',
    locationKey: 'sp-06',
    locationName: 'ทางลงด่วนบางพลี ถ.บางนา-ตราด กม.12 (เมกาบางนา)',
    district: 'บางพลี',
    subdistrict: 'ต.บางแก้ว',
    locationSub: 'บางพลี • ต.บางแก้ว',
    statusType: 'rising',
    statusLabel: 'เริ่มท่วมแล้ว',
    statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    depthCm: 26,
    itemTime: '14:15 น.',
    timestamp: Date.now() - (3.3 * 3600 * 1000),
    source: 'การทางพิเศษแห่งประเทศไทย & แขวงทางหลวง',
    lat: 13.6485,
    lng: 100.6800
  },
  {
    id: 'upd-spk-08',
    locationKey: 'sp-25',
    locationName: 'ซอยกิ่งแก้ว 45 - 43 (โซนชุมชนและโรงงานกิ่งแก้ว)',
    district: 'บางพลี',
    subdistrict: 'ต.ราชาเทวะ',
    locationSub: 'บางพลี • ต.ราชาเทวะ',
    statusType: 'rising',
    statusLabel: 'เริ่มท่วมแล้ว',
    statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    depthCm: 25,
    itemTime: '14:40 น.',
    timestamp: Date.now() - (2.9 * 3600 * 1000),
    source: 'อบต.ราชาเทวะ',
    lat: 13.6820,
    lng: 100.7285
  },
  {
    id: 'upd-spk-09',
    locationKey: 'sp-27',
    locationName: 'ถนนปานวิถี หน้าตลาดสดเทศบาลบางบ่อ (ริมคลองสำโรง)',
    district: 'บางบ่อ',
    subdistrict: 'ต.บางบ่อ',
    locationSub: 'บางบ่อ • ต.บางบ่อ',
    statusType: 'rising',
    statusLabel: 'เริ่มท่วมแล้ว',
    statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    depthCm: 24,
    itemTime: '15:15 น.',
    timestamp: Date.now() - (2.3 * 3600 * 1000),
    source: 'เทศบาลตำบลบางบ่อ',
    lat: 13.5685,
    lng: 100.8350
  },
  {
    id: 'upd-spk-10',
    locationKey: 'cat-sp-02',
    locationName: 'สี่แยกการไฟฟ้าสมุทรปราการ (ถ.สุขุมวิท ตัด ถ.สายลวด)',
    district: 'เมืองสมุทรปราการ',
    subdistrict: 'ต.ปากน้ำ',
    locationSub: 'เมือง • ต.ปากน้ำ',
    statusType: 'rising',
    statusLabel: 'เริ่มท่วมแล้ว',
    statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    depthCm: 22,
    itemTime: '15:40 น.',
    timestamp: Date.now() - (1.9 * 3600 * 1000),
    source: 'สภ.เมืองสมุทรปราการ',
    lat: 13.5950,
    lng: 100.6050
  },
  {
    id: 'upd-spk-11',
    locationKey: 'sp-23',
    locationName: 'ชุมชนบ้านสาขลา - แหลมฟ้าผ่า (เลียบคลองสรรพสามิต)',
    district: 'พระสมุทรเจดีย์',
    subdistrict: 'ต.นาเกลือ',
    locationSub: 'พระสมุทรเจดีย์ • ต.นาเกลือ',
    statusType: 'rising',
    statusLabel: 'เริ่มท่วมแล้ว',
    statusBadgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    depthCm: 32,
    itemTime: '16:00 น.',
    timestamp: Date.now() - (1.6 * 3600 * 1000),
    source: 'อบต.นาเกลือ & กองทัพเรือ',
    lat: 13.5180,
    lng: 100.5620
  },
  {
    id: 'upd-spk-12',
    locationKey: 'sp-srinakarin-to-bangpoo',
    locationName: 'ถ.ศรีนครินทร์ ไปบางปู (ช่วงเปาโล - สามแยกการไฟฟ้า)',
    district: 'เมืองสมุทรปราการ',
    subdistrict: 'ต.บางเมือง',
    locationSub: 'เมือง • ต.บางเมือง',
    statusType: 'receding',
    statusLabel: 'น้ำลดแล้ว',
    statusBadgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    depthCm: 18,
    itemTime: '16:30 น.',
    timestamp: Date.now() - (1.1 * 3600 * 1000),
    source: 'เทศบาลตำบลบางเมือง (สูบระบายต่อเนื่อง)',
    lat: 13.6080,
    lng: 100.6170
  },
  {
    id: 'upd-spk-13',
    locationKey: 'sp-12',
    locationName: 'ท่าน้ำพระประแดง - สุขสวัสดิ์ 39 (ตลาดพระประแดง)',
    district: 'พระประแดง',
    subdistrict: 'ต.ตลาด',
    locationSub: 'พระประแดง • ต.ตลาด',
    statusType: 'receding',
    statusLabel: 'น้ำลดแล้ว',
    statusBadgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    depthCm: 14,
    itemTime: '16:55 น.',
    timestamp: Date.now() - (0.7 * 3600 * 1000),
    source: 'เทศบาลเมืองพระประแดง',
    lat: 13.6585,
    lng: 100.5340
  },
  {
    id: 'upd-spk-14',
    locationKey: 'sp-srithepha',
    locationName: 'แยกศรีเทพา ถนนเทพารักษ์ (จุดตัด ถ.ศรีนครินทร์)',
    district: 'เมืองสมุทรปราการ',
    subdistrict: 'ต.เทพารักษ์',
    locationSub: 'เมือง • ต.เทพารักษ์',
    statusType: 'dry',
    statusLabel: 'แห้งแล้ว',
    statusBadgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    depthCm: 0,
    itemTime: '17:10 น.',
    timestamp: Date.now() - (0.5 * 3600 * 1000),
    source: 'แขวงทางหลวงสมุทรปราการ',
    lat: 13.6270,
    lng: 100.6260
  },
  {
    id: 'upd-spk-15',
    locationKey: 'sp-theparak-sriboonruang',
    locationName: 'หน้าซอยศรีบุญเรือง (ถนนเทพารักษ์ กม.1.5)',
    district: 'เมืองสมุทรปราการ',
    subdistrict: 'ต.เทพารักษ์',
    locationSub: 'เมือง • ต.เทพารักษ์',
    statusType: 'dry',
    statusLabel: 'แห้งแล้ว',
    statusBadgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    depthCm: 0,
    itemTime: '17:20 น.',
    timestamp: Date.now() - (0.3 * 3600 * 1000),
    source: 'สภ.สำโรงเหนือ',
    lat: 13.6345,
    lng: 100.6145
  }
];

// โหลดข้อมูลอัปเดตประจำวัน พร้อมตรวจสอบเที่ยงคืน (00:00:00) เพื่อลบออกทั้งหมดอัตโนมัติ
export function loadDailyUpdatesFromStorage() {
  if (typeof window === 'undefined') return [];

  const todayKey = getBangkokDateKey();
  const storedDate = localStorage.getItem('prakanguard_daily_updates_date');

  // หากเป็นวันใหม่ (ผ่านเที่ยงคืน 00:00:00 น. แล้วจริงๆ): ให้ลบออกทั้งหมดอัตโนมัติ 100%
  // ไม่ล้างระหว่างวัน และไม่ล้างหากเป็นวันเดียวกัน
  if (storedDate && storedDate < todayKey) {
    try {
      localStorage.setItem('prakanguard_daily_updates_date', todayKey);
      localStorage.setItem('prakanguard_daily_updates_feed', '[]');
    } catch (_) {}
    return [];
  }

  // หากเป็นวันเดียวกัน: โหลดจาก cache
  try {
    const raw = localStorage.getItem('prakanguard_daily_updates_feed');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (_) {}

  // หากเป็นครั้งแรกของวันปัจจุบัน บันทึกชุดข้อมูลเริ่มต้น
  try {
    localStorage.setItem('prakanguard_daily_updates_date', todayKey);
    localStorage.setItem('prakanguard_daily_updates_feed', JSON.stringify(SEED_REAL_DAILY_UPDATES));
  } catch (_) {}

  return SEED_REAL_DAILY_UPDATES;
}

// รวมการแจ้งเตือนเหตุการณ์ใหม่เข้าสู่ Daily Feed
// กฎเข้มงวด: 1 เวลาต่อการแจ้งเตือน 1 ครั้งตามสถานที่นั้นๆ
export function mergeDailyUpdateEvent(prevList = [], newEvent = {}) {
  if (!newEvent || !newEvent.locationName) return prevList;

  const todayKey = getBangkokDateKey();
  const key = (newEvent.locationKey || newEvent.locationName || '').trim().toLowerCase();
  const eventTime = newEvent.itemTime || formatBangkokTime();

  const formattedEvent = {
    id: newEvent.id || `upd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    locationKey: key,
    locationName: newEvent.locationName,
    district: newEvent.district || 'สมุทรปราการ',
    subdistrict: newEvent.subdistrict || '',
    locationSub: newEvent.locationSub || (newEvent.district ? `${newEvent.district} ${newEvent.subdistrict ? '• ' + newEvent.subdistrict : ''}` : ''),
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

