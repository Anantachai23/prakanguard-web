/**
 * PrakanGuard Admin — authentication (เฉพาะ 2 บัญชีแอดมิน)
 * - ตรวจรหัสผ่านที่ฝั่งฐานข้อมูล (admin_verify) เมื่อติดตั้งแล้ว
 * - ถ้ายังไม่ติดตั้ง ใช้การตรวจแฮช PBKDF2 ฝั่งเบราว์เซอร์เป็นตัวสำรอง
 * - ไม่มีรหัสผ่านใดๆ ถูกเก็บ/แสดง/ใส่ล่วงหน้าในหน้าเว็บ
 */
import { ADMIN_ACCOUNTS, SESSION_TTL_MS, ADMIN_PING_MS, getSupabaseUrl, getSupabaseKey } from './config.js';
import { caps, rpcVerify, rpcChangePassword, recordAdminLogin, pingAdminSession, endAdminSession, fetchPublicIp, setAdminToken } from './api.js';

const KEY = 'pg_admin_session_v2';
const LS_LOCKOUT_UNTIL = 'pg_sec_lockout_until';
const LS_FAILED_ATTEMPTS = 'pg_sec_failed_attempts';
let pingTimer = null;

function checkAdminLockout() {
  try {
    const until = parseInt(localStorage.getItem(LS_LOCKOUT_UNTIL) || '0', 10);
    const now = Date.now();
    if (until > now) {
      return { locked: true, remainingSeconds: Math.ceil((until - now) / 1000) };
    }
  } catch {}
  return { locked: false, remainingSeconds: 0 };
}

function recordAdminFailedAttempt() {
  try {
    const attempts = parseInt(localStorage.getItem(LS_FAILED_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(LS_FAILED_ATTEMPTS, String(attempts));
    let lockSec = 0;
    if (attempts >= 10) lockSec = 600;
    else if (attempts >= 7) lockSec = 180;
    else if (attempts >= 5) lockSec = 60;
    if (lockSec > 0) {
      localStorage.setItem(LS_LOCKOUT_UNTIL, String(Date.now() + lockSec * 1000));
    }
    return { attempts, lockSec };
  } catch {
    return { attempts: 1, lockSec: 0 };
  }
}

function resetAdminFailedAttempts() {
  try {
    localStorage.removeItem(LS_FAILED_ATTEMPTS);
    localStorage.removeItem(LS_LOCKOUT_UNTIL);
  } catch {}
}

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
  if (s === 'adminprakanguard02' || s === 'admin02' || s === 'admin2') {
    return 'admin_prakanguard02';
  }
  if (s === 'adminprakanguard01' || s === 'admin01' || s === 'admin1') {
    return 'admin_prakanguard01';
  }
  return null;
}

async function verifyLocal(username, password) {
  const normUser = normalizeAdminUser(username);
  if (!normUser) return null;
  const acc = ADMIN_ACCOUNTS[normUser];
  if (!acc) return null;

  const cleanP = String(password || '').trim();
  if (!cleanP) return null;

  // Cryptographic PBKDF2 verification against salted hash (No plaintext passwords stored in source code)
  try {
    const ref = acc.pbkdf2;
    if (ref && ref.salt && ref.iter) {
      const hex = await pbkdf2Hex(cleanP, ref.salt, ref.iter);
      if (hex === ref.hash) {
        return { key: acc.key, label: acc.label, username: normUser, role: acc.role, avatar: acc.avatar };
      }
    }
  } catch (e) {
    console.warn('Crypto verification error:', e);
  }

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
  const lock = checkAdminLockout();
  if (lock.locked) {
    return { ok: false, reason: 'locked', remainingSeconds: lock.remainingSeconds };
  }

  const normUser = normalizeAdminUser(username);
  if (!normUser) {
    const fail = recordAdminFailedAttempt();
    if (fail.lockSec > 0) return { ok: false, reason: 'locked', remainingSeconds: fail.lockSec };
    return { ok: false, reason: 'invalid' };
  }

  const p = String(password || '').trim();
  if (!p) {
    const fail = recordAdminFailedAttempt();
    if (fail.lockSec > 0) return { ok: false, reason: 'locked', remainingSeconds: fail.lockSec };
    return { ok: false, reason: 'invalid' };
  }
  let admin = null;

  // 1. Try Supabase Auth direct login (if admin user is created in Supabase Auth)
  try {
    const authUrl = `${getSupabaseUrl()}/auth/v1/token?grant_type=password`;
    const emailCandidate = username.includes('@') ? username.trim() : `${normUser}@prakanguard.org`;
    const authRes = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'apikey': getSupabaseKey(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: emailCandidate, password: p })
    });
    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData && authData.access_token) {
        setAdminToken(authData.access_token);
        const acc = ADMIN_ACCOUNTS[normUser];
        admin = {
          key: normUser,
          label: acc ? acc.label : 'Admin',
          username: normUser,
          role: acc ? acc.role : 'ผู้ดูแลระบบ',
          avatar: acc ? acc.avatar : `./assets/img/${normUser}.jpg`
        };
      }
    }
  } catch (err) {
    // Continue to database RPC verify
  }

  // 2. Try Supabase database RPC (admin_verify)
  if (!admin) {
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
  }

  // 3. If RPC not verified (e.g. offline/network issue), fallback to local PBKDF2
  if (!admin) {
    admin = await verifyLocal(normUser, p);
  }

  if (!admin) {
    const fail = recordAdminFailedAttempt();
    if (fail.lockSec > 0) {
      return { ok: false, reason: 'locked', remainingSeconds: fail.lockSec };
    }
    return { ok: false, reason: 'invalid' };
  }

  resetAdminFailedAttempts();

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
  setAdminToken(null);
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
