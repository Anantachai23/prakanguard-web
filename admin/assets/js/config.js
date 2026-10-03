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
    pbkdf2: { salt: '8ab6053a85e38342daa910ada64d01ec', iter: 210000, hash: 'c9673d7b65ee8faa8856f729b8570ed53aa85edacd19875545852410dc27a4e5' }
  },
  admin_prakanguard02: {
    key: 'admin02',
    label: 'Admin 02',
    pbkdf2: { salt: '7a2a7e2346b33f712f5accb1445786de', iter: 210000, hash: 'e29747861d1ca6bb9e89f354b5a00a5cb4eb6c6cc9a1029a267cd8804b46e3fb' }
  }
};
