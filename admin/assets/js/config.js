/**
 * PrakanGuard Admin — configuration
 * หมายเหตุ: ไม่มีรหัสผ่านใดๆ ในไฟล์นี้ (เก็บเฉพาะค่าแฮชสำหรับตรวจสอบเท่านั้น)
 */
export const SUPABASE_URL = 'https://cnjufleeibbgmpvuvrpg.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw';

export const MAIN_SITE_URL = 'https://prakanguard-web.vercel.app';

/** 6 อำเภอของจังหวัดสมุทรปราการ (ตรงกับเว็บหลัก) */
export const DISTRICTS = [
  'เมืองสมุทรปราการ',
  'บางพลี',
  'พระประแดง',
  'บางบ่อ',
  'พระสมุทรเจดีย์',
  'บางเสาธง'
];

/** ช่วงเวลา (มิลลิวินาที) */
export const ONLINE_WINDOW_MS = 30 * 1000;          // ออนไลน์ = มี heartbeat ภายใน 30 วินาที (ออกจากเว็บจะหายไปทันที)
export const LIVE_REFRESH_MS = 15 * 1000;           // รีเฟรชยอดผู้ใช้งานสดทุก 15 วินาที
export const CHART_REFRESH_MS = 30 * 60 * 1000;     // กราฟ/วงกลมอัปเดตทุก 30 นาที
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;  // เซสชันแอดมินอยู่ได้ 12 ชม.
export const ADMIN_PING_MS = 60 * 1000;             // แอดมินส่งสถานะ "กำลังใช้งาน" ทุก 1 นาที
export const ADMIN_ACTIVE_WINDOW_MS = 3 * 60 * 1000;

/**
 * ข้อมูลตรวจสอบรหัสผ่านสำรอง (PBKDF2-SHA256) ใช้เฉพาะกรณีฐานข้อมูลยังไม่ได้ติดตั้งฟังก์ชัน admin_verify
 * เมื่อติดตั้ง supabase_setup.sql แล้ว ระบบจะตรวจรหัสผ่านที่ฝั่งเซิร์ฟเวอร์แทน
 */
export const ADMIN_ACCOUNTS = {
  admin01: {
    key: 'admin01',
    label: 'Admin 01',
    role: 'ผู้ดูแลระบบ 01',
    avatar: './assets/img/admin01.jpg',
    pbkdf2: {
      salt: '155aee4301588fc7c82e365d7cff63fb',
      iter: 100000,
      hash: 'd7ea5d86c618ee7cec79937be05503395b25cc207d90643f9f622b2da679a284'
    }
  },
  admin02: {
    key: 'admin02',
    label: 'Admin 02',
    role: 'ผู้ดูแลระบบ 02',
    avatar: './assets/img/admin02.jpg',
    pbkdf2: {
      salt: '8737ea52431e63920e696cb616d31ea5',
      iter: 100000,
      hash: '885b7a26634c7858443b33149abffb444be6f508cd4697b3d8127f859a453172'
    }
  }
};
