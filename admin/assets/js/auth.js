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

async function verifyLocal(username, password) {
  const acc = ADMIN_ACCOUNTS[username];
  // ทำงานเท่าเดิมแม้ไม่พบผู้ใช้ เพื่อไม่ให้เวลาตอบสนองบอกใบ้ว่าชื่อผู้ใช้ถูกหรือผิด
  const ref = acc ? acc.pbkdf2 : { salt: '00'.repeat(16), iter: 210000, hash: '' };
  const hex = await pbkdf2Hex(password, ref.salt, ref.iter);
  return acc && hex === ref.hash ? { key: acc.key, label: acc.label, username } : null;
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
  const u = String(username || '').trim().toLowerCase();
  let admin = null;

  if (caps.rpc) {
    const r = await rpcVerify(u, password).catch(() => ({ error: true }));
    if (r && r.error) return { ok: false, reason: 'network' };
    if (r && r.missing) admin = await verifyLocal(u, password);
    else if (r && r.ok) admin = { key: r.admin_key, label: r.label, username: r.username };
  } else {
    admin = await verifyLocal(u, password);
  }
  if (!admin) return { ok: false, reason: 'invalid' };

  const ip = await fetchPublicIp();
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
