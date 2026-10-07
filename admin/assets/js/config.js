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
export const ONLINE_WINDOW_MS = 60 * 1000;          // ออนไลน์ = มี heartbeat ภายใน 60 วินาที (ตรงกับ "มีกิจกรรมในรอบ 60 วินาที")
export const LIVE_REFRESH_MS = 60 * 1000;           // รีเฟรชยอดผู้ใช้งานสดทุก 60 วินาที (ตามคำสั่งผู้ใช้)
export const CHART_REFRESH_MS = 30 * 60 * 1000;     // กราฟ/วงกลมอัปเดตทุก 30 นาที
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;  // เซสชันแอดมินอยู่ได้ 12 ชม.
export const ADMIN_PING_MS = 20 * 1000;             // แอดมินส่งสถานะ "กำลังใช้งาน" ทุก 20 วินาที
export const ADMIN_ACTIVE_WINDOW_MS = 60 * 1000;        // ถ้าไม่มี ping เกิน 1 นาที ถือว่าออฟไลน์

/**
 * ข้อมูลตรวจสอบรหัสผ่านสำรอง (PBKDF2-SHA256) ใช้เฉพาะกรณีฐานข้อมูลยังไม่ได้ติดตั้งฟังก์ชัน admin_verify
 * เมื่อติดตั้ง supabase_setup.sql แล้ว ระบบจะตรวจรหัสผ่านที่ฝั่งเซิร์ฟเวอร์แทน
 */
export const ADMIN_ACCOUNTS = {
  admin_prakanguard01: {
    key: 'admin01',
    label: 'Admin 01',
    role: 'ผู้ดูแลระบบ 01',
    avatar: './assets/img/admin01.jpg',
    pbkdf2: {
      salt: '1eb0e3f213c47656519d799a940330a8',
      iter: 100000,
      hash: '3177f20666a6575fdf7a0b899ee2208bdb15753102d5d0b26aaad757ff4fc407'
    }
  },
  admin_prakanguard02: {
    key: 'admin02',
    label: 'Admin 02',
    role: 'ผู้ดูแลระบบ 02',
    avatar: './assets/img/admin02.jpg',
    pbkdf2: {
      salt: '1e0f6a9c8410aa9a406bc42e16e3e2f7',
      iter: 100000,
      hash: 'ec832f45423ce70af5eb673f2ed4b7de873f19a1738193a026279e577ef6583d'
    }
  }
};
