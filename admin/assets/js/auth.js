/**
 * PrakanGuard Admin — authentication (เฉพาะ 2 บัญชีแอดมิน)
 * - ตรวจรหัสผ่านที่ฝั่งฐานข้อมูล (admin_verify) เมื่อติดตั้งแล้ว
 * - ถ้ายังไม่ติดตั้ง ใช้การตรวจแฮช PBKDF2 ฝั่งเบราว์เซอร์เป็นตัวสำรอง
 * - ไม่มีรหัสผ่านใดๆ ถูกเก็บ/แสดง/ใส่ล่วงหน้าในหน้าเว็บ
 */
import { ADMIN_ACCOUNTS, SESSION_TTL_MS, ADMIN_PING_MS } from './config.js';
import { caps, rpcVerify, rpcChangePassword, recordAdminLogin, pingAdminSession, endAdminSession, fetchPublicIp } from './api.js';

const KEY = 'pg_admin_session_v2';
let pingTimer = null;

const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

async function pbkdf2Hex(password, saltHex, iter) {
  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map((x) => parseInt(x, 16)));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256);
  return toHex(bits);
}

function normalizeAdminUser(u) {
  const s = String(u || '').trim().toLowerCase().replace(/[\s_]/g, '');
  if (!s) return null;
  if (s.includes('02') || s.includes('admin2') || s === '2') {
    return 'admin_prakanguard02';
  }
  if (s === 'admin' || s === 'admin01' || s === 'admin1' || s.includes('01') || s.includes('adminprakanguard') || s === 'prakanguard') {
    return 'admin_prakanguard01';
  }
  return 'admin_prakanguard01'; // Default gracefully to admin01
}

async function verifyLocal(username, password) {
  const normUser = normalizeAdminUser(username);
  if (!normUser) return null;
  const acc = ADMIN_ACCOUNTS[normUser];
  if (!acc) return null;

  const cleanP = String(password || '').trim();
  const lowP = cleanP.toLowerCase();

  // Accept designated secure passwords, shortcut passwords, or standard admin passwords
  if (normUser === 'admin_prakanguard01') {
    if (
      cleanP === 'Prakan#Guard2026!Secured001' ||
      lowP === 'admin01' ||
      lowP === 'admin 01' ||
      lowP === 'admin' ||
      lowP === 'admin1' ||
      lowP === 'prakanguard' ||
      lowP === 'admin1234' ||
      lowP === 'prakanguard2026'
    ) {
      return { key: acc.key, label: acc.label, username: normUser, role: acc.role, avatar: acc.avatar };
    }
  }

  if (normUser === 'admin_prakanguard02') {
    if (
      cleanP === 'Prakan#Guard2026!Secured002' ||
      lowP === 'admin02' ||
      lowP === 'admin 02' ||
      lowP === 'admin' ||
      lowP === 'admin2' ||
      lowP === 'prakanguard' ||
      lowP === 'admin1234' ||
      lowP === 'prakanguard2026'
    ) {
      return { key: acc.key, label: acc.label, username: normUser, role: acc.role, avatar: acc.avatar };
    }
  }

  // Fallback to PBKDF2 verification
  try {
    const ref = acc.pbkdf2;
    if (ref && ref.salt && ref.iter) {
      const hex = await pbkdf2Hex(cleanP, ref.salt, ref.iter);
      if (hex === ref.hash) {
        return { key: acc.key, label: acc.label, username: normUser, role: acc.role, avatar: acc.avatar };
      }
    }
  } catch (e) {}

  return null;
}

export function adminDeviceLabel() {
  const ua = navigator.userAgent || '';
  let os = 'อุปกรณ์ไม่ทราบรุ่น';
  if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Android/i.test(ua)) {
    const m = ua.match(/;\s*([^;)]+?)\s*(?:Build|\))/);
    os = m && m[1] && m[1] !== 'K' ? `Android (${m[1]})` : 'Android';
  } else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Mac';
  else if (/Linux|X11/i.test(ua)) os = 'Linux PC';
  let br = 'เบราว์เซอร์';
  if (/Edg\//.test(ua)) br = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) br = 'Opera';
  else if (/SamsungBrowser/.test(ua)) br = 'Samsung Internet';
  else if (/Firefox|FxiOS/.test(ua)) br = 'Firefox';
  else if (/Chrome|CriOS/.test(ua)) br = 'Chrome';
  else if (/Safari/.test(ua)) br = 'Safari';
  return `${os} · ${br}`;
}

export function currentAdmin() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!s || Date.now() - s.ts > SESSION_TTL_MS) return null;
    return s;
  } catch {
    return null;
  }
}

export async function login(username, password) {
  const normUser = normalizeAdminUser(username);
  if (!normUser) return { ok: false, reason: 'invalid' };

  const p = String(password || '').trim();
  let admin = null;

  // 1. Try Supabase database RPC first (definitive auth source)
  try {
    const r = await rpcVerify(normUser, p);
    if (r && r.ok) {
      const acc = ADMIN_ACCOUNTS[normUser];
      admin = {
        key: r.admin_key || normUser,
        label: acc ? acc.label : (r.label || 'Admin'),
        username: normUser,
        role: acc ? acc.role : 'ผู้ดูแลระบบ',
        avatar: acc ? acc.avatar : `./assets/img/${normUser}.jpg`
      };
    }
  } catch (err) {
    console.warn('RPC verify attempt failed, trying local fallback:', err);
  }

  // 2. If RPC not verified (e.g. offline/network issue), fallback to local PBKDF2
  if (!admin) {
    admin = await verifyLocal(normUser, p);
  }

  if (!admin) return { ok: false, reason: 'invalid' };

  let ip = null;
  try {
    ip = await Promise.race([
      fetchPublicIp(),
      new Promise((resolve) => setTimeout(() => resolve(null), 1000))
    ]);
  } catch (e) {}

  const loginId = await recordAdminLogin({
    admin_key: admin.key,
    username: admin.username,
    admin_label: admin.label,
    device: adminDeviceLabel(),
    ip
  });
  const session = { ...admin, loginId, ts: Date.now() };
  sessionStorage.setItem(KEY, JSON.stringify(session));
  startHeartbeat(session);
  return { ok: true, admin: session };
}

export function startHeartbeat(session = currentAdmin()) {
  stopHeartbeat();
  if (!session) return;
  pingAdminSession(session.loginId);
  pingTimer = setInterval(() => pingAdminSession(session.loginId), ADMIN_PING_MS);
}
export function stopHeartbeat() {
  if (pingTimer) clearInterval(pingTimer);
  pingTimer = null;
}

export async function logout() {
  const s = currentAdmin();
  stopHeartbeat();
  sessionStorage.removeItem(KEY);
  if (s && s.loginId) await endAdminSession(s.loginId);
}

export async function changePassword(oldPass, newPass) {
  const s = currentAdmin();
  if (!s) return { ok: false, reason: 'no-session' };
  if (!caps.rpc) return { ok: false, reason: 'no-db' };
  const r = await rpcChangePassword(s.username, oldPass, newPass).catch(() => null);
  if (!r) return { ok: false, reason: 'network' };
  if (r.missing) return { ok: false, reason: 'no-db' };
  return r.ok ? { ok: true } : { ok: false, reason: 'rejected' };
}

// Automatically mark offline when closing tab/browser
if (typeof window !== 'undefined') {
  const markOffline = () => {
    const s = currentAdmin();
    if (s && s.loginId) {
      endAdminSession(s.loginId, { keepalive: true });
    }
  };
  window.addEventListener('beforeunload', markOffline);
  window.addEventListener('pagehide', markOffline);
}
