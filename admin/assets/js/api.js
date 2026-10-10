/**
 * PrakanGuard Admin — data layer (Supabase REST)
 * ใช้ฐานข้อมูลเดียวกับเว็บหลัก (reports / feedback / visitors) และตารางเสริมสำหรับระบบแอดมิน
 */
import { getSupabaseUrl, getSupabaseKey } from './config.js';

const getBase = () => getSupabaseUrl() + '/rest/v1/';
const getAuth = () => {
  const k = getSupabaseKey();
  return { apikey: k, Authorization: 'Bearer ' + k };
};

/** ความสามารถของฐานข้อมูลที่ตรวจพบ (ขึ้นกับการรัน supabase_setup.sql) */
export const caps = {
  checked: false,
  visitorExt: false,   // visitors.device_id / ip / gps_status
  reportExt: false,    // reports.reporter_*
  announcements: false,
  trash: false,
  sessions: false,
  rpc: false           // admin_verify / admin_change_password
};
export const dbReady = () => caps.visitorExt && caps.reportExt && caps.announcements && caps.trash && caps.sessions && caps.rpc;

/** เวลาของเซิร์ฟเวอร์ (ชดเชยนาฬิกาเครื่องแอดมินที่ไม่ตรง) เพื่อให้ "ออนไลน์/ระยะเวลา" ตรงจริง */
let serverSkewMs = 0;
export const serverNow = () => Date.now() + serverSkewMs;

export async function rest(path, { method = 'GET', body, prefer, headers = {}, signal } = {}) {
  try {
    const res = await fetch(getBase() + path, {
      method,
      headers: {
        ...getAuth(),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(prefer ? { Prefer: prefer } : {}),
        ...headers
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal
    });
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const t = Date.parse(dateHeader);
      if (!isNaN(t)) serverSkewMs = t - Date.now();
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { ok: res.ok, status: res.status, data, headers: res.headers };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

/** ดึงข้อมูลทั้งหมดแบบแบ่งหน้า (PostgREST จำกัด 1,000 แถว/คำขอ) */
export async function restAll(path, { pageSize = 1000, max = 50000 } = {}) {
  const rows = [];
  for (let offset = 0; offset < max; offset += pageSize) {
    const sep = path.includes('?') ? '&' : '?';
    const r = await rest(`${path}${sep}limit=${pageSize}&offset=${offset}`);
    if (!r.ok || !Array.isArray(r.data)) {
      if (rows.length === 0) throw new Error(`โหลดข้อมูลไม่สำเร็จ (${r.status})`);
      break;
    }
    rows.push(...r.data);
    if (r.data.length < pageSize) break;
  }
  return rows;
}

const probe = async (path) => (await rest(path)).ok;

export async function detectCaps() {
  const [visitorExt, reportExt, announcements, trash, sessions] = await Promise.all([
    probe('visitors?select=device_id,ip,gps_status&limit=1'),
    probe('reports?select=reporter_device,reporter_district,reporter_gps&limit=1'),
    probe('announcements?select=id&limit=1'),
    probe('admin_trash?select=id&limit=1'),
    probe('admin_sessions?select=id&limit=1')
  ]);
  const rpcProbe = await fetch(getSupabaseUrl() + '/rest/v1/rpc/admin_verify', {
    method: 'POST',
    headers: { ...getAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_username: '-', p_password: '-' })
  }).catch(() => null);
  Object.assign(caps, { visitorExt, reportExt, announcements, trash, sessions, rpc: !!rpcProbe && rpcProbe.status !== 404, checked: true });
  return caps;
}

/* ============================================================== Auth */
export async function rpcVerify(username, password) {
  const res = await fetch(getSupabaseUrl() + '/rest/v1/rpc/admin_verify', {
    method: 'POST',
    headers: { ...getAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_username: username, p_password: password })
  });
  if (res.status === 404) return { missing: true };
  if (!res.ok) throw new Error('auth-failed-' + res.status);
  return res.json();
}

export async function rpcChangePassword(username, oldPass, newPass) {
  const res = await fetch(getSupabaseUrl() + '/rest/v1/rpc/admin_change_password', {
    method: 'POST',
    headers: { ...getAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_username: username, p_old: oldPass, p_new: newPass })
  });
  if (res.status === 404) return { missing: true };
  if (!res.ok) throw new Error('change-failed-' + res.status);
  return { ok: (await res.json()) === true };
}

/* ============================================================ Reports */
const REPORT_BASE_COLS = 'id,hazard_type,name,subdistrict,district,lat,lng,body_level_label,depth_cm,depth_range,level,traffic_status,cause,source,phone,is_approved,is_resolved,reported_at,timestamp,created_at';
const REPORT_EXT_COLS = 'reporter_device,reporter_district,reporter_gps,reporter_ip';

export async function fetchReports() {
  try {
    const cols = REPORT_BASE_COLS + (caps.reportExt ? ',' + REPORT_EXT_COLS : '');
    const data = await restAll(`reports?select=${cols}&order=timestamp.desc`);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (err) {
    console.warn('[Admin API] Supabase fetchReports failed, using local fallback:', err);
  }
  // Fallback 1: Local server /api/reports
  try {
    const res = await fetch('/api/reports');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  // Fallback 2: Static ./data/reports.json
  try {
    const res = await fetch('./data/reports.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}
/** รายการ id ที่มีรูปภาพ (ไม่ดึงรูปทั้งหมดเพื่อให้โหลดเร็ว) */
export async function fetchReportPhotoIds() {
  const r = await restAll('reports?select=id&photo_url=not.is.null&order=timestamp.desc').catch(() => []);
  return new Set(r.map((x) => x.id));
}
export async function fetchReportPhoto(id) {
  const r = await rest(`reports?select=photo_url&id=eq.${encodeURIComponent(id)}`);
  return r.ok && r.data && r.data[0] ? r.data[0].photo_url : null;
}

const LIVE_ACTIONS_TOPIC = 'https://ntfy.sh/prakanguard_live_actions_v4_spk';

function publishActionToLiveClients(type, id, extra = {}) {
  fetch(LIVE_ACTIONS_TOPIC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Title: `Admin Action: ${type}`, Tags: type === 'approve' ? 'white_check_mark' : type === 'resolve' ? 'droplet' : 'wastebasket' },
    body: JSON.stringify({ type, id, timestamp: Date.now(), ...extra })
  }).catch(() => {});
}

/** อนุมัติ / ถอนอนุมัติ — เว็บหลักดึงข้อมูลจากตาราง reports โดยตรง จึงขึ้นบนเว็บหลักจริงทันที */
export async function setReportsApproval(ids, approved) {
  let okCount = 0;
  for (const id of ids) {
    const r = await rest(`reports?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: approved ? { is_approved: true, is_resolved: false } : { is_approved: false },
      prefer: 'return=representation'
    });
    if (r.ok && Array.isArray(r.data) && r.data.length > 0) {
      okCount++;
      // แจ้งเว็บหลักทันทีผ่าน ntfy.sh (ไม่ต้องรอ 15 วิ poll)
      publishActionToLiveClients(approved ? 'approve' : 'reject', id);
    }
  }
  return okCount;
}

/** ทำเครื่องหมายแห้งแล้ว/คลี่คลาย — ลบออกจากแผนที่เว็บหลักทันที */
export async function setReportResolved(id, resolved = true) {
  const r = await rest(`reports?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: resolved ? { is_resolved: true } : { is_resolved: false },
    prefer: 'return=representation'
  });
  if (r.ok && Array.isArray(r.data) && r.data.length > 0) {
    publishActionToLiveClients(resolved ? 'resolve' : 'approve', id);
    return true;
  }
  return false;
}

function publishRejectToLiveClients(id) {
  publishActionToLiveClients('reject', id);
}

/* ============================================================ Trash */
const LS_TRASH = 'pg_admin_trash_v2';
const lsTrashRead = () => { try { return JSON.parse(localStorage.getItem(LS_TRASH) || '[]'); } catch { return []; } };

const lsTrashWrite = (v) => { try { localStorage.setItem(LS_TRASH, JSON.stringify(v)); } catch { /* quota */ } };

async function trashPut(kind, row, by) {
  const entry = { id: `${kind}:${row.id}`, kind, item_id: String(row.id), payload: row, deleted_by: by, deleted_at: new Date().toISOString() };
  if (caps.trash) {
    const r = await rest('admin_trash', { method: 'POST', body: entry, prefer: 'resolution=merge-duplicates,return=minimal' });
    return r.ok;
  }
  const list = lsTrashRead().filter((x) => x.id !== entry.id);
  list.unshift(entry);
  lsTrashWrite(list);
  return true;
}

export async function fetchTrash() {
  if (caps.trash) return restAll('admin_trash?select=*&order=deleted_at.desc');
  return lsTrashRead();
}

/** ลบรายงาน → ย้ายเข้า "ลบล่าสุด" แล้วลบออกจากฐานข้อมูลเว็บหลักจริง (ไม่กลับมาอีก) */
export async function deleteToTrash(kind, ids, by) {
  const table = kind === 'report' ? 'reports' : 'feedback';
  let okCount = 0;
  for (const id of ids) {
    const got = await rest(`${table}?select=*&id=eq.${encodeURIComponent(id)}`);
    const row = got.ok && got.data && got.data[0];
    if (!row) continue;
    const stashed = await trashPut(kind, row, by);
    if (!stashed) continue; // ห้ามลบถ้าสำรองเข้าถังไม่สำเร็จ
    const del = await rest(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=representation' });
    if (del.ok && Array.isArray(del.data) && del.data.length > 0) {
      okCount++;
      if (kind === 'report') publishRejectToLiveClients(id);
    } else {
      await purgeTrash([`${kind}:${id}`]); // ลบไม่ผ่าน → ไม่ทิ้งสำเนาค้างในถัง
    }
  }
  return okCount;
}

export async function restoreFromTrash(entries) {
  let okCount = 0;
  for (const e of entries) {
    const table = e.kind === 'report' ? 'reports' : 'feedback';
    const r = await rest(table, { method: 'POST', body: e.payload, prefer: 'resolution=merge-duplicates,return=minimal' });
    if (r.ok) {
      okCount++;
      await purgeTrash([e.id]);
    }
  }
  return okCount;
}

export async function purgeTrash(entryIds) {
  if (caps.trash) {
    let n = 0;
    for (const id of entryIds) {
      const r = await rest(`admin_trash?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=representation' });
      if (r.ok) n++;
    }
    return n;
  }
  const set = new Set(entryIds);
  const list = lsTrashRead();
  lsTrashWrite(list.filter((x) => !set.has(x.id)));
  return entryIds.length;
}

/* ========================================================== Feedback */
export async function fetchFeedback() {
  try {
    const data = await restAll('feedback?select=*&order=timestamp.desc');
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (err) {
    console.warn('[Admin API] Supabase fetchFeedback failed, using local fallback:', err);
  }
  try {
    const res = await fetch('/api/feedback');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  try {
    const res = await fetch('./data/feedback.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}
export async function setFeedbackRead(id, isRead) {
  const r = await rest(`feedback?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: { is_read: isRead }, prefer: 'return=minimal' });
  return r.ok;
}

/* ====================================================== Announcements */
const LS_ANN = 'pg_admin_announcements_v2';
const lsAnnRead = () => { try { return JSON.parse(localStorage.getItem(LS_ANN) || '[]'); } catch { return []; } };
const lsAnnWrite = (v) => { try { localStorage.setItem(LS_ANN, JSON.stringify(v)); } catch {} };

function publishAnnouncementToLive(action, payload) {
  fetch('https://ntfy.sh/prakanguard_live_announcements_spk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Title: 'Announcement: ' + action },
    body: JSON.stringify({ action, ...payload })
  }).catch(() => {});
}

export async function fetchAnnouncements() {
  if (caps.announcements) {
    try {
      const res = await restAll('announcements?select=*&order=created_at.desc', { max: 500 });
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {}
  }
  return lsAnnRead();
}

export async function createAnnouncement({ message, districts, by }) {
  const row = {
    id: 'ann-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    message,
    target_type: districts && districts.length ? 'district' : 'all',
    districts: districts || [],
    is_active: true,
    created_by: by,
    created_at: new Date().toISOString()
  };

  if (caps.announcements) {
    await rest('announcements', { method: 'POST', body: row, prefer: 'return=representation' });
  }
  const cur = lsAnnRead().filter(x => x.id !== row.id);
  lsAnnWrite([row, ...cur]);
  publishAnnouncementToLive('create', row);
  return row;
}

export async function setAnnouncementActive(id, active) {
  if (caps.announcements) {
    await rest(`announcements?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: { is_active: active }, prefer: 'return=minimal' });
  }
  const cur = lsAnnRead().map(x => x.id === id ? { ...x, is_active: active } : x);
  lsAnnWrite(cur);
  publishAnnouncementToLive('toggle', { id, is_active: active });
  return true;
}

export async function deleteAnnouncement(id) {
  if (caps.announcements) {
    await rest(`announcements?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' });
  }
  const cur = lsAnnRead().filter(x => x.id !== id);
  lsAnnWrite(cur);
  publishAnnouncementToLive('delete', { id });
  return true;
}

/* ============================================================ Visitors */
const VIS_BASE = 'session_id,device,district,page,last_ping,created_at';
const visCols = () => VIS_BASE + (caps.visitorExt ? ',device_id,ip,gps_status' : '');

export async function fetchOnlineSessions(windowMs) {
  try {
    const now = serverNow();
    // Safety buffer for query to overcome network latency & clock variations
    const querySince = new Date(now - (windowMs + 15000)).toISOString();
    const r = await rest(`visitors?select=${visCols()}&last_ping=gte.${querySince}&order=last_ping.desc&limit=1000`);
    if (r.ok && Array.isArray(r.data)) {
      // Filter strictly by windowMs against serverNow()
      return r.data.filter(s => {
        const pingTime = new Date(s.last_ping).getTime();
        return !isNaN(pingTime) && (now - pingTime) <= windowMs;
      });
    }
  } catch (err) {
    console.warn('[Admin API] fetchOnlineSessions failed, fallback to empty:', err);
  }
  return [];
}

/** เซสชันที่เกี่ยวข้องกับวันนี้ (เริ่มวันนี้ หรือยังมี heartbeat หลังเที่ยงคืน) */
export async function fetchTodaySessions(dayStart) {
  try {
    const iso = dayStart.toISOString();
    const data = await restAll(`visitors?select=${visCols()}&or=(created_at.gte.${iso},last_ping.gte.${iso})&order=created_at.asc`);
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('[Admin API] fetchTodaySessions failed, fallback to empty:', err);
  }
  return [];
}
/** เฉพาะเซสชันที่มีความเคลื่อนไหวหลังเวลาที่กำหนด (ใช้ดึงแบบเพิ่มทีละส่วน) */
export async function fetchSessionsPingedSince(sinceDate) {
  return restAll(`visitors?select=${visCols()}&last_ping=gte.${sinceDate.toISOString()}&order=last_ping.asc`);
}

/* =================================================== Admin login history */
const LS_SESS = 'pg_admin_sessions_v2';
const lsSessRead = () => { try { return JSON.parse(localStorage.getItem(LS_SESS) || '[]'); } catch { return []; } };
const lsSessWrite = (v) => { try { localStorage.setItem(LS_SESS, JSON.stringify(v)); } catch { /* quota */ } };

export async function recordAdminLogin(entry) {
  const row = { ...entry, id: 'as-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
  if (caps.sessions) {
    const r = await rest('admin_sessions', { method: 'POST', body: row, prefer: 'return=minimal' });
    if (r.ok) return row.id;
  }
  const list = lsSessRead();
  list.unshift({ ...row, logged_in_at: new Date().toISOString(), last_seen: new Date().toISOString() });
  lsSessWrite(list.slice(0, 50));
  return row.id;
}
export async function pingAdminSession(id) {
  const now = new Date().toISOString();
  if (caps.sessions) await rest(`admin_sessions?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: { last_seen: now }, prefer: 'return=minimal' });
  const list = lsSessRead().map((s) => (s.id === id ? { ...s, last_seen: now } : s));
  lsSessWrite(list);
}
export async function endAdminSession(id, { keepalive = false } = {}) {
  const now = new Date().toISOString();
  if (caps.sessions) {
    await fetch(`${getBase()}admin_sessions?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...getAuth(), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ logged_out_at: now }),
      keepalive
    }).catch(() => {});
  }
  lsSessWrite(lsSessRead().map((s) => (s.id === id ? { ...s, logged_out_at: now } : s)));
}
export async function fetchAdminSessions() {
  try {
    const r = await rest('admin_sessions?select=*&order=logged_in_at.desc&limit=200');
    if (r.ok && Array.isArray(r.data) && r.data.length > 0) {
      return r.data;
    }
  } catch (err) {}
  return lsSessRead();
}

/** วัดค่า Latency Ping สดไปยัง Supabase REST Gateway */
export async function fetchSupabasePing() {
  const t0 = performance.now();
  try {
    const r = await rest('reports?select=id&limit=1');
    const latency = Math.round(performance.now() - t0);
    const isQuotaExceeded = r.status === 402;
    return { ok: r.ok, latency, status: r.status, isQuotaExceeded, data: r.data };
  } catch (err) {
    const latency = Math.round(performance.now() - t0);
    return { ok: false, latency, status: 0, error: err };
  }
}

/** ดึงข้อมูลตัวอย่างสดจากตาราง Supabase ใดๆ สำหรับตัวแสดงผล Live Table Inspector */
export async function fetchTableSample(table, limit = 50) {
  try {
    const r = await rest(`${encodeURIComponent(table)}?limit=${limit}`);
    return { ok: r.ok, data: Array.isArray(r.data) ? r.data : [], status: r.status };
  } catch (err) {
    return { ok: false, data: [], status: 0, error: err };
  }
}

/* =================================================================== IP */
export async function fetchPublicIp() {
  for (const url of ['https://api.ipify.org?format=json', 'https://api64.ipify.org?format=json']) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(url, { signal: ctl.signal });
      clearTimeout(t);
      if (r.ok) return (await r.json()).ip || null;
    } catch { /* try next */ }
  }
  return null;
}

/* ============================================================== Backup */
export async function buildBackup() {
  const [reports, feedback, trash, announcements] = await Promise.all([
    restAll('reports?select=*&order=timestamp.desc'),
    restAll('feedback?select=*&order=timestamp.desc'),
    fetchTrash(),
    fetchAnnouncements()
  ]);
  return {
    app: 'PrakanGuard Admin',
    exportedAt: new Date().toISOString(),
    counts: { reports: reports.length, feedback: feedback.length, trash: trash.length, announcements: announcements.length },
    reports,
    feedback,
    trash,
    announcements
  };
}
