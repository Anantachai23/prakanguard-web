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
export const ONLINE_WINDOW_MS = 60 * 1000;          // ออนไลน์ = มี heartbeat ภายใน 60 วินาที
export const LIVE_REFRESH_MS = 60 * 1000;           // รีเฟรชยอดผู้ใช้งานสดทุก 1 นาที
export const CHART_REFRESH_MS = 30 * 60 * 1000;     // กราฟ/วงกลมอัปเดตทุก 30 นาที
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;  // เซสชันแอดมินอยู่ได้ 12 ชม.
export const ADMIN_PING_MS = 60 * 1000;             // แอดมินส่งสถานะ "กำลังใช้งาน" ทุก 1 นาที
export const ADMIN_ACTIVE_WINDOW_MS = 3 * 60 * 1000;

/**
 * ข้อมูลตรวจสอบรหัสผ่านสำรอง (PBKDF2-SHA256) ใช้เฉพาะกรณีฐานข้อมูลยังไม่ได้ติดตั้งฟังก์ชัน admin_verify
 * เมื่อติดตั้ง supabase_setup.sql แล้ว ระบบจะตรวจรหัสผ่านที่ฝั่งเซิร์ฟเวอร์แทน
 */
export const ADMIN_ACCOUNTS = {
  admin_prakanguard01: {
    key: 'admin01',
    label: 'Admin 01',
    pbkdf2: { salt: '37ea13d28dc2e7d946bbd6bac8cdb77f', iter: 100000, hash: 'c11f23d7b948eaa85326017946006eed1cfbec90122b5e90c2db0dd35138751d' }
  },
  admin_prakanguard02: {
    key: 'admin02',
    label: 'Admin 02',
    pbkdf2: { salt: '229e467f9d269fd50b26af76ab48233c', iter: 100000, hash: '101ce45f43e57960c04293241d402324e0655fcce652f327ef807b2901302482' }
  }
};
