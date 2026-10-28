/**
 * PrakanGuard Admin — configuration
 * หมายเหตุ: ไม่มีรหัสผ่านใดๆ ในไฟล์นี้ (เก็บเฉพาะค่าแฮชสำหรับตรวจสอบเท่านั้น)
 */
export const DEFAULT_SUPABASE_URL = 'https://uyszfmcumloxwuojmndy.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_Y73zrfwvP8NnXyjJ5q6bSA_xYqU0jF7';

export function getSupabaseUrl() {
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('pg_supabase_url');
    if (custom && custom.trim().startsWith('http')) return custom.trim().replace(/\/+$/, '');
  }
  return DEFAULT_SUPABASE_URL;
}

export function getSupabaseKey() {
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('pg_supabase_key');
    if (custom && custom.trim()) return custom.trim();
  }
  return DEFAULT_SUPABASE_KEY;
}

export function setCustomSupabaseConfig(url, key) {
  if (typeof localStorage !== 'undefined') {
    if (url && url.trim()) localStorage.setItem('pg_supabase_url', url.trim().replace(/\/+$/, ''));
    if (key && key.trim()) localStorage.setItem('pg_supabase_key', key.trim());
  }
}

export function resetSupabaseConfig() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('pg_supabase_url');
    localStorage.removeItem('pg_supabase_key');
  }
}

export const SUPABASE_URL = getSupabaseUrl();
export const SUPABASE_KEY = getSupabaseKey();

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
    avatar: './assets/img/logo.png',
    pbkdf2: {
      salt: '3472bd271dd9cb13257023bcfbaca0bf',
      iter: 100000,
      hash: 'e052780567cd9785616e99eac147035ace62e089455b45a7c431a89fadae68f6'
    }
  },
  admin_prakanguard02: {
    key: 'admin02',
    label: 'Admin 02',
    role: 'ผู้ดูแลระบบ 02',
    avatar: './assets/img/logo.png',
    pbkdf2: {
      salt: '9f7c91a733a54213f78a337cd165f202',
      iter: 100000,
      hash: '431d735c645532d0b537adec34abd79535d6f7c3234b2d7397d75b419a4080f2'
    }
  }
};
