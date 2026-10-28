/**
 * PrakanGuard Admin — Enterprise Data Layer (Supabase REST + Multi-Channel Sync Ledger)
 * เชื่อมต่อฐานข้อมูลเดียวกับเว็บหลัก (reports / feedback / visitors) พร้อมระบบ Persistent Tombstone & Override Ledger
 */
import { getSupabaseUrl, getSupabaseKey } from './config.js';

const getBase = () => getSupabaseUrl() + '/rest/v1/';
export function getAdminToken() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const t = sessionStorage.getItem('pg_admin_token') || sessionStorage.getItem('sb_access_token');
      if (t) return t;
    }
    if (typeof localStorage !== 'undefined') {
      const t = localStorage.getItem('pg_admin_token') || localStorage.getItem('sb_access_token');
      if (t) return t;
    }
  } catch (_) {}
  return null;
}

export function setAdminToken(token) {
  try {
    if (token) {
      sessionStorage.setItem('pg_admin_token', token);
    } else {
      sessionStorage.removeItem('pg_admin_token');
    }
  } catch (_) {}
}

const getAuth = () => {
  const k = getSupabaseKey();
  const token = getAdminToken();
  return { apikey: k, Authorization: 'Bearer ' + (token || k) };
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

/* ============================================================== Persistent Mutation & Tombstone Ledger */
const LS_DELETED_REPORTS = 'pg_deleted_report_ids_v1';
const LS_DELETED_FEEDBACK = 'pg_deleted_feedback_ids_v1';
const LS_REPORT_OVERRIDES = 'pg_report_overrides_v1';
const LS_FEEDBACK_OVERRIDES = 'pg_feedback_overrides_v1';
const LS_LOCAL_REPORTS = 'pg_admin_local_reports_v1';
const LS_TRASH = 'pg_admin_trash_v2';

// รายการ ID ของการทดสอบ AI ที่ต้องถูกคัดกรองและลบออกถาวร
const PERMANENT_BLOCKED_REPORT_IDS = new Set([
  'test-check-insert',
  'test-inspect-1792700165089',
  'zz-sec-probe-1792736969'
]);

export function isBlockedAiTestReport(item) {
  if (!item || typeof item !== 'object') return true;
  const id = String(item.id || '').trim();
  const idLower = id.toLowerCase();
  const name = String(item.name || '').trim();
  const nameLower = name.toLowerCase();
  if (PERMANENT_BLOCKED_REPORT_IDS.has(id)) return true;
  if (idLower.startsWith('zz-') || idLower.startsWith('test-check') || idLower.startsWith('test-inspect') || idLower.includes('sec-probe') || idLower.startsWith('e2e-test-')) return true;
  if (name === 'ทดสอบเช็คการเขียน' || name === 'ทดสอบระบบ' || nameLower.includes('security-probe') || nameLower.includes('auto-deleted')) return true;
  return false;
}

export function getDeletedIds(kind = 'report') {
  const key = kind === 'report' ? LS_DELETED_REPORTS : LS_DELETED_FEEDBACK;
  try {
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    const set = new Set(Array.isArray(arr) ? arr.map(String) : []);
    if (kind === 'report') {
      PERMANENT_BLOCKED_REPORT_IDS.forEach(id => set.add(id));
    }
    return set;
  } catch {
    return kind === 'report' ? new Set(PERMANENT_BLOCKED_REPORT_IDS) : new Set();
  }
}

export function markIdsDeleted(kind = 'report', ids = []) {
  const key = kind === 'report' ? LS_DELETED_REPORTS : LS_DELETED_FEEDBACK;
  const set = getDeletedIds(kind);
  ids.forEach(id => { if (id) set.add(String(id)); });
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
    // ซิงค์กับคีย์ที่หน้าเว็บหลักใช้งานด้วย
    if (kind === 'report') {
      const mainDeleted = JSON.parse(localStorage.getItem('pg_deleted_ids_v1') || '[]');
      const merged = Array.from(new Set([...(Array.isArray(mainDeleted) ? mainDeleted : []), ...ids.map(String)]));
      localStorage.setItem('pg_deleted_ids_v1', JSON.stringify(merged));
    }
  } catch {}
}

export function unmarkIdsDeleted(kind = 'report', ids = []) {
  const key = kind === 'report' ? LS_DELETED_REPORTS : LS_DELETED_FEEDBACK;
  const set = getDeletedIds(kind);
  ids.forEach(id => {
    const s = String(id);
    if (!PERMANENT_BLOCKED_REPORT_IDS.has(s)) set.delete(s);
  });
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
    if (kind === 'report') {
      const mainDeleted = JSON.parse(localStorage.getItem('pg_deleted_ids_v1') || '[]');
      const removeSet = new Set(ids.map(String));
      const filtered = (Array.isArray(mainDeleted) ? mainDeleted : []).filter(x => !removeSet.has(String(x)));
      localStorage.setItem('pg_deleted_ids_v1', JSON.stringify(filtered));
    }
  } catch {}
}

export function getReportOverrides() {
  try {
    const obj = JSON.parse(localStorage.getItem(LS_REPORT_OVERRIDES) || '{}');
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

export function setReportOverride(id, patch) {
  if (!id || !patch) return;
  try {
    const map = getReportOverrides();
    map[String(id)] = { ...(map[String(id)] || {}), ...patch, updated_at: Date.now() };
    localStorage.setItem(LS_REPORT_OVERRIDES, JSON.stringify(map));
  } catch {}
}

export function getFeedbackOverrides() {
  try {
    const obj = JSON.parse(localStorage.getItem(LS_FEEDBACK_OVERRIDES) || '{}');
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

export function setFeedbackOverride(id, patch) {
  if (!id || !patch) return;
  try {
    const map = getFeedbackOverrides();
    map[String(id)] = { ...(map[String(id)] || {}), ...patch, updated_at: Date.now() };
    localStorage.setItem(LS_FEEDBACK_OVERRIDES, JSON.stringify(map));
  } catch {}
}

function getLocalAdminReports() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_LOCAL_REPORTS) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLocalAdminReports(list) {
  try {
    localStorage.setItem(LS_LOCAL_REPORTS, JSON.stringify(list));
  } catch {}
}

const LIVE_ACTIONS_TOPIC = 'https://ntfy.sh/prakanguard_live_actions_v4_spk';

export function publishActionToLiveClients(type, id, extra = {}) {
  const payload = { type, id: String(id), timestamp: Date.now(), ...extra };
  try {
    const bc = new BroadcastChannel('pg_admin_sync_channel');
    bc.postMessage(payload);
    bc.close();
  } catch {}
  fetch(LIVE_ACTIONS_TOPIC, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Title: `Admin Action: ${type}`,
      Tags: type === 'approve' ? 'white_check_mark' : type === 'resolve' ? 'droplet' : 'wastebasket'
    },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

let lastActionsSyncTs = 0;
export async function syncLiveActionsLedger() {
  if (Date.now() - lastActionsSyncTs < 4000) return;
  lastActionsSyncTs = Date.now();
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 3500);
    const res = await fetch(`${LIVE_ACTIONS_TOPIC}/json?poll=1&since=all`, {
      cache: 'no-store',
      signal: ctl.signal
    }).catch(() => null);
    clearTimeout(timer);
    if (!res || !res.ok) return;
    const text = await res.text();
    const lines = text.trim().split('\n');
    for (const line of lines) {
      if (!line) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.event === 'message' && entry.message) {
          const act = JSON.parse(entry.message);
          if (!act || !act.id) continue;
          const id = String(act.id);
          if (act.type === 'reject' || act.type === 'delete_report') {
            markIdsDeleted('report', [id]);
          } else if (act.type === 'delete_feedback') {
            markIdsDeleted('feedback', [id]);
          } else if (act.type === 'restore_report') {
            unmarkIdsDeleted('report', [id]);
          } else if (act.type === 'restore_feedback') {
            unmarkIdsDeleted('feedback', [id]);
          } else if (act.type === 'approve') {
            setReportOverride(id, { is_approved: true, isApproved: true, is_resolved: false, isResolved: false });
          } else if (act.type === 'unapprove') {
            setReportOverride(id, { is_approved: false, isApproved: false });
          } else if (act.type === 'resolve') {
            setReportOverride(id, { is_resolved: true, isResolved: true, depth_cm: 0, depthCm: 0 });
          } else if (act.type === 'update_report' && act.patch) {
            setReportOverride(id, act.patch);
          }
        }
      } catch {}
    }
  } catch {}
}

/* ============================================================ Reports */
const REPORT_BASE_COLS = 'id,hazard_type,name,subdistrict,district,lat,lng,body_level_label,depth_cm,depth_range,level,traffic_status,cause,source,phone,is_approved,is_resolved,reported_at,timestamp,created_at';
const REPORT_EXT_COLS = 'reporter_device,reporter_district,reporter_gps,reporter_ip';

// Cache the latest fetched reports in memory so deleteToTrash can always find the item even if only in local/ntfy
let cachedReportsMap = new Map();
let cachedFeedbackMap = new Map();

export async function fetchReports() {
  await syncLiveActionsLedger().catch(() => {});
  const deletedSet = getDeletedIds('report');
  const overrides = getReportOverrides();
  const reportMap = new Map();

  const processList = (arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((item) => {
      if (!item || !item.id) return;
      const id = String(item.id);
      if (isBlockedAiTestReport(item)) {
        rest(`reports?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
        return;
      }
      if (deletedSet.has(id)) return;
      const ov = overrides[id] || {};
      const merged = { ...item, ...ov };
      if (ov.is_approved !== undefined) {
        merged.is_approved = ov.is_approved;
        merged.isApproved = ov.is_approved;
      }
      if (ov.is_resolved !== undefined) {
        merged.is_resolved = ov.is_resolved;
        merged.isResolved = ov.is_resolved;
      }
      if (ov.depth_cm !== undefined) {
        merged.depth_cm = ov.depth_cm;
        merged.depthCm = ov.depth_cm;
      }
      reportMap.set(id, merged);
    });
  };

  // 1. Local admin-created or citizen reports in localStorage
  processList(getLocalAdminReports());
  try {
    const mainLocalV1 = JSON.parse(localStorage.getItem('prakanguard_citizen_reports') || '[]');
    processList(mainLocalV1);
  } catch {}
  try {
    const mainLocal = JSON.parse(localStorage.getItem('prakanguard_citizen_reports_v2') || '[]');
    processList(mainLocal);
  } catch {}

  // 2. Supabase Cloud
  try {
    const cols = REPORT_BASE_COLS + (caps.reportExt ? ',' + REPORT_EXT_COLS : '');
    const data = await restAll(`reports?select=${cols}&order=timestamp.desc`);
    if (Array.isArray(data) && data.length > 0) {
      processList(data);
    }
  } catch (err) {
    console.warn('[Admin API] Supabase fetchReports failed, using local fallback:', err);
  }

  // 3. Fallback: Local server /api/reports
  try {
    const res = await fetch('/api/reports');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) processList(data);
    }
  } catch {}

  // 4. Live ntfy reports stream (so citizen reports sent from any device appear immediately)
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3500);
    const topicRes = await fetch('https://ntfy.sh/prakanguard_spk_reports_v5/json?poll=1&since=all', {
      cache: 'no-store',
      signal: ctl.signal
    }).catch(() => null);
    clearTimeout(t);
    if (topicRes && topicRes.ok) {
      const text = await topicRes.text();
      const lines = text.trim().split('\n');
      const ntfyItems = [];
      for (const line of lines) {
        if (!line) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.event === 'message' && entry.message) {
            const parsed = JSON.parse(entry.message);
            if (parsed && parsed.id) ntfyItems.push(parsed);
          }
        } catch {}
      }
      processList(ntfyItems);
    }
  } catch {}

  const results = Array.from(reportMap.values());
  results.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
  cachedReportsMap = reportMap;
  return results;
}

/** รายการ id ที่มีรูปภาพ (ไม่ดึงรูปทั้งหมดเพื่อให้โหลดเร็ว) */
export async function fetchReportPhotoIds() {
  const r = await restAll('reports?select=id&photo_url=not.is.null&order=timestamp.desc').catch(() => []);
  return new Set(r.map((x) => x.id));
}

export async function fetchReportPhoto(id) {
  const r = await rest(`reports?select=photo_url&id=eq.${encodeURIComponent(id)}`);
  if (r.ok && r.data && r.data[0] && r.data[0].photo_url) return r.data[0].photo_url;
  const cached = cachedReportsMap.get(String(id));
  return cached ? (cached.photo_url || cached.photoUrl || null) : null;
}

/** อนุมัติ / ถอนอนุมัติ — บันทึกทั้ง Supabase, Persistent Override Ledger และแจ้งเว็บหลักผ่าน ntfy.sh ทันที */
export async function setReportsApproval(ids, approved) {
  let okCount = 0;
  for (const id of ids) {
    const sid = String(id);
    const patch = approved
      ? { is_approved: true, isApproved: true, is_resolved: false, isResolved: false }
      : { is_approved: false, isApproved: false };

    setReportOverride(sid, patch);

    // Update local reports if present
    const localList = getLocalAdminReports();
    if (localList.some(r => String(r.id) === sid)) {
      saveLocalAdminReports(localList.map(r => String(r.id) === sid ? { ...r, ...patch } : r));
    }

    await rest(`reports?id=eq.${encodeURIComponent(sid)}`, {
      method: 'PATCH',
      body: approved ? { is_approved: true, is_resolved: false } : { is_approved: false },
      prefer: 'return=representation'
    }).catch(() => {});

    publishActionToLiveClients(approved ? 'approve' : 'unapprove', sid, { patch });
    okCount++;
  }
  return okCount;
}

/** ทำเครื่องหมายแห้งแล้ว/คลี่คลาย — นำออกจากแผนที่เว็บหลักทันที */
export async function setReportResolved(id, resolved = true) {
  const sid = String(id);
  const patch = resolved
    ? { is_resolved: true, isResolved: true, depth_cm: 0, depthCm: 0 }
    : { is_resolved: false, isResolved: false, is_approved: true, isApproved: true };

  setReportOverride(sid, patch);

  const localList = getLocalAdminReports();
  if (localList.some(r => String(r.id) === sid)) {
    saveLocalAdminReports(localList.map(r => String(r.id) === sid ? { ...r, ...patch } : r));
  }

  await rest(`reports?id=eq.${encodeURIComponent(sid)}`, {
    method: 'PATCH',
    body: resolved ? { is_resolved: true, depth_cm: 0 } : { is_resolved: false, is_approved: true },
    prefer: 'return=representation'
  }).catch(() => {});

  publishActionToLiveClients(resolved ? 'resolve' : 'approve', sid, { patch });
  return true;
}

/** แก้ไขข้อมูลรายงานน้ำท่วม (เช่น ปรับระดับน้ำ ซม., ระดับความรุนแรง, ชื่อจุด, สถานะการจราจร) */
export async function updateReportDetails(id, updates = {}) {
  const sid = String(id);
  const depthCm = updates.depth_cm !== undefined ? Number(updates.depth_cm) : undefined;
  const level = depthCm !== undefined ? (depthCm > 50 ? 3 : depthCm >= 21 ? 2 : 1) : updates.level;
  const patch = {
    ...updates,
    ...(depthCm !== undefined ? { depth_cm: depthCm, depthCm, depth_range: `${depthCm} ซม.`, depthRange: `${depthCm} ซม.` } : {}),
    ...(level !== undefined ? { level, severity: level } : {})
  };

  setReportOverride(sid, patch);

  const localList = getLocalAdminReports();
  if (localList.some(r => String(r.id) === sid)) {
    saveLocalAdminReports(localList.map(r => String(r.id) === sid ? { ...r, ...patch } : r));
  }

  const supaBody = {};
  if (patch.name !== undefined) supaBody.name = patch.name;
  if (patch.district !== undefined) supaBody.district = patch.district;
  if (patch.subdistrict !== undefined) supaBody.subdistrict = patch.subdistrict;
  if (patch.depth_cm !== undefined) supaBody.depth_cm = patch.depth_cm;
  if (patch.level !== undefined) supaBody.level = patch.level;
  if (patch.traffic_status !== undefined) supaBody.traffic_status = patch.traffic_status;
  if (patch.body_level_label !== undefined) supaBody.body_level_label = patch.body_level_label;
  if (patch.is_approved !== undefined) supaBody.is_approved = patch.is_approved;
  if (patch.is_resolved !== undefined) supaBody.is_resolved = patch.is_resolved;

  if (Object.keys(supaBody).length > 0) {
    await rest(`reports?id=eq.${encodeURIComponent(sid)}`, {
      method: 'PATCH',
      body: supaBody,
      prefer: 'return=representation'
    }).catch(() => {});
  }

  publishActionToLiveClients('update_report', sid, { patch });
  return true;
}

/** สร้างรายงานจุดน้ำท่วมใหม่โดยเจ้าหน้าที่แอดมิน (อนุมัติขึ้นแผนที่ทันที) */
export async function createAdminReport(data) {
  const depthCm = Math.max(1, Number(data.depth_cm || data.depthCm || 25));
  const level = depthCm > 50 ? 3 : depthCm >= 21 ? 2 : 1;
  const levelLabel = level === 3 ? 'ระดับ 3: วิกฤต (>50 ซม.)' : level === 2 ? 'ระดับ 2: ปานกลาง (21-50 ซม.)' : 'ระดับ 1: น้ำขังรอระบาย (5-20 ซม.)';
  const now = Date.now();
  const row = {
    id: `official_rep_${now}`,
    hazard_type: data.hazard_type || 'flood',
    name: data.name || 'จุดรายงานน้ำท่วม',
    district: data.district || 'เมืองสมุทรปราการ',
    subdistrict: data.subdistrict || '',
    lat: Number(data.lat || 13.5991),
    lng: Number(data.lng || 100.5968),
    depth_cm: depthCm,
    depthCm: depthCm,
    depth_range: `${depthCm} ซม.`,
    level,
    body_level_label: data.body_level_label || levelLabel,
    traffic_status: data.traffic_status || (level === 3 ? 'รถเล็กห้ามผ่าน' : level === 2 ? 'เคลื่อนตัวช้า/ระมัดระวัง' : 'สัญจรได้ปกติ'),
    cause: data.cause || 'รายงานจากศูนย์ปฏิบัติการแอดมิน',
    source: data.source || 'ศูนย์บัญชาการข้อมูลอุทกภัย (Admin)',
    reporter_device: 'ศูนย์ควบคุมแอดมิน (Official)',
    reporter_district: data.district || 'เมืองสมุทรปราการ',
    is_approved: true,
    isApproved: true,
    is_resolved: false,
    isResolved: false,
    reported_at: new Date(now).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
    timestamp: now,
    created_at: new Date(now).toISOString()
  };

  const localList = getLocalAdminReports();
  saveLocalAdminReports([row, ...localList]);
  setReportOverride(row.id, { is_approved: true, isApproved: true, is_resolved: false, depth_cm: depthCm, level });

  const supaRow = {
    id: row.id,
    hazard_type: row.hazard_type,
    name: row.name,
    district: row.district,
    subdistrict: row.subdistrict || null,
    lat: row.lat,
    lng: row.lng,
    depth_cm: row.depth_cm,
    depth_range: row.depth_range,
    level: row.level,
    body_level_label: row.body_level_label,
    traffic_status: row.traffic_status,
    cause: row.cause,
    source: row.source,
    is_approved: true,
    is_resolved: false,
    reported_at: row.reported_at,
    timestamp: row.timestamp
  };

  await rest('reports', {
    method: 'POST',
    body: supaRow,
    prefer: 'resolution=merge-duplicates,return=representation'
  }).catch(() => {});

  fetch('https://ntfy.sh/prakanguard_spk_reports_v5', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Title: 'PrakanGuard Official Report' },
    body: JSON.stringify(row)
  }).catch(() => {});

  return row;
}

/* ============================================================ Trash */
const lsTrashRead = () => { try { return JSON.parse(localStorage.getItem(LS_TRASH) || '[]'); } catch { return []; } };
const lsTrashWrite = (v) => { try { localStorage.setItem(LS_TRASH, JSON.stringify(v)); } catch { /* quota */ } };

async function trashPut(kind, row, by) {
  const entry = {
    id: `${kind}:${row.id}`,
    kind,
    item_id: String(row.id),
    payload: row,
    deleted_by: by || 'Admin',
    deleted_at: new Date().toISOString()
  };
  const list = lsTrashRead().filter((x) => x.id !== entry.id);
  list.unshift(entry);
  lsTrashWrite(list);
  if (caps.trash) {
    await rest('admin_trash', { method: 'POST', body: entry, prefer: 'resolution=merge-duplicates,return=minimal' }).catch(() => {});
  }
  return true;
}

export async function fetchTrash() {
  const localTrash = lsTrashRead();
  if (caps.trash) {
    try {
      const remoteTrash = await restAll('admin_trash?select=*&order=deleted_at.desc');
      if (Array.isArray(remoteTrash) && remoteTrash.length > 0) {
        const mergedMap = new Map();
        localTrash.forEach(item => { if (item && item.id) mergedMap.set(item.id, item); });
        remoteTrash.forEach(item => { if (item && item.id) mergedMap.set(item.id, item); });
        return Array.from(mergedMap.values()).sort((a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0));
      }
    } catch {}
  }
  return localTrash;
}

/** ลบรายงานหรือข้อเสนอแนะ → ย้ายเข้า "ถังขยะ" พร้อมบันทึก Tombstone ถาวร (ไม่กลับมาอีกแม้รีเฟรชหน้าเว็บ) */
export async function deleteToTrash(kind, ids, by) {
  const table = kind === 'report' ? 'reports' : 'feedback';
  let okCount = 0;
  for (const rawId of ids) {
    const id = String(rawId);
    // 1. ค้นหาข้อมูลแถวจาก Cache หรือ Supabase
    let row = kind === 'report' ? cachedReportsMap.get(id) : cachedFeedbackMap.get(id);
    if (!row) {
      const got = await rest(`${table}?select=*&id=eq.${encodeURIComponent(id)}`).catch(() => null);
      row = (got && got.ok && Array.isArray(got.data) && got.data[0]) ? got.data[0] : { id, name: id, message: id };
    }

    // 2. เก็บสำรองลงถังขยะ (ไม่เก็บถ้าเป็นรายการทดสอบ AI)
    if (!isBlockedAiTestReport(row)) {
      await trashPut(kind, row, by);
    }

    // 3. บันทึก Tombstone ID ทันทีเพื่อป้องกันการแสดงผลซ้ำ 100%
    markIdsDeleted(kind, [id]);

    // 4. ลบออกจาก Local Storage ถ้ามีอยู่
    if (kind === 'report') {
      const localList = getLocalAdminReports().filter(r => String(r.id) !== id);
      saveLocalAdminReports(localList);
      try {
        const mainLocalV1 = JSON.parse(localStorage.getItem('prakanguard_citizen_reports') || '[]');
        localStorage.setItem('prakanguard_citizen_reports', JSON.stringify(mainLocalV1.filter(r => String(r.id) !== id)));
      } catch {}
      try {
        const mainLocal = JSON.parse(localStorage.getItem('prakanguard_citizen_reports_v2') || '[]');
        localStorage.setItem('prakanguard_citizen_reports_v2', JSON.stringify(mainLocal.filter(r => String(r.id) !== id)));
      } catch {}
    } else {
      try {
        const mainFb = JSON.parse(localStorage.getItem('prakanguard_feedback_items') || '[]');
        localStorage.setItem('prakanguard_feedback_items', JSON.stringify(mainFb.filter(f => String(f.id) !== id)));
      } catch {}
    }

    // 5. ส่งคำสั่ง DELETE ไปยัง Supabase และ Local Server (หากมีสิทธิ์)
    await rest(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=representation' }).catch(() => {});
    fetch(`/api/${table}/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});

    // 6. กระจายคำสั่งลบไปยังทุกอุปกรณ์ผ่าน ntfy.sh & BroadcastChannel
    publishActionToLiveClients(kind === 'report' ? 'reject' : 'delete_feedback', id);
    okCount++;
  }
  return okCount;
}

export async function restoreFromTrash(entries) {
  let okCount = 0;
  for (const e of entries) {
    if (!e) continue;
    const kind = e.kind || 'report';
    const itemId = String(e.item_id || (e.payload && e.payload.id) || String(e.id).replace(/^(report|feedback):/, ''));
    const table = kind === 'report' ? 'reports' : 'feedback';

    // 1. นำออกจากบัญชี Tombstone
    unmarkIdsDeleted(kind, [itemId]);

    // 2. คืนค่ากลับสู่ฐานข้อมูล / LocalStorage
    if (e.payload) {
      if (kind === 'report') {
        const localList = getLocalAdminReports().filter(r => String(r.id) !== itemId);
        saveLocalAdminReports([e.payload, ...localList]);
      } else {
        try {
          const mainFb = JSON.parse(localStorage.getItem('prakanguard_feedback_items') || '[]').filter(f => String(f.id) !== itemId);
          localStorage.setItem('prakanguard_feedback_items', JSON.stringify([e.payload, ...mainFb]));
        } catch {}
      }
      await rest(table, { method: 'POST', body: e.payload, prefer: 'resolution=merge-duplicates,return=minimal' }).catch(() => {});
    }

    // 3. ลบออกจากถังขยะ
    await purgeTrash([e.id]);
    publishActionToLiveClients(kind === 'report' ? 'restore_report' : 'restore_feedback', itemId);
    okCount++;
  }
  return okCount;
}

export async function purgeTrash(entryIds) {
  const set = new Set(entryIds.map(String));
  const list = lsTrashRead();
  // Ensure purged items stay permanently tombstoned in deleted IDs
  const matchesEntry = (item) => {
    const idStr = String(item.id || '');
    const itemIdStr = String(item.item_id || (item.payload && item.payload.id) || idStr.replace(/^(report|feedback):/, ''));
    return set.has(idStr) || set.has(itemIdStr);
  };
  list.forEach(item => {
    if (matchesEntry(item)) {
      const itemId = String(item.item_id || (item.payload && item.payload.id) || String(item.id).replace(/^(report|feedback):/, ''));
      if (itemId) markIdsDeleted(item.kind || 'report', [itemId]);
    }
  });
  lsTrashWrite(list.filter((x) => !matchesEntry(x)));

  if (caps.trash) {
    for (const id of entryIds) {
      await rest(`admin_trash?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=representation' }).catch(() => {});
    }
  }
  return entryIds.length;
}

/* ========================================================== Feedback */
export async function fetchFeedback() {
  await syncLiveActionsLedger().catch(() => {});
  const deletedSet = getDeletedIds('feedback');
  const overrides = getFeedbackOverrides();
  const fbMap = new Map();

  const addFb = (item) => {
    if (!item || !item.id) return;
    const id = String(item.id);
    if (deletedSet.has(id)) return;
    const msg = String(item.message || '').trim();
    if (!msg || msg.toLowerCase().includes('security-probe') || id.startsWith('zz-') || id.startsWith('e2e-test-')) return;
    const ov = overrides[id] || {};
    fbMap.set(id, {
      id,
      category: item.category || 'suggestion',
      categoryLabel: item.categoryLabel || item.category_label || 'ข้อเสนอแนะระบบ',
      rating: Number(item.rating) || 5,
      message: msg,
      senderName: item.senderName || item.sender_name || 'ประชาชนทั่วไป',
      sender_name: item.sender_name || item.senderName || 'ประชาชนทั่วไป',
      contact: item.contact || '-',
      adminNote: ov.admin_note !== undefined ? ov.admin_note : (item.adminNote || item.admin_note || ''),
      isRead: ov.is_read !== undefined ? ov.is_read : !!(item.isRead || item.is_read),
      submittedAt: item.submittedAt || item.submitted_at || '',
      created_at: item.created_at || item.submitted_at || new Date(item.timestamp || Date.now()).toISOString(),
      timestamp: Number(item.timestamp) || (item.submitted_at ? new Date(item.submitted_at).getTime() : Date.now())
    });
  };

  // 0. LocalStorage (shared with main website FeedbackModal)
  try {
    const localFb = JSON.parse(localStorage.getItem('prakanguard_feedback_items') || '[]');
    if (Array.isArray(localFb)) localFb.forEach(addFb);
  } catch {}

  // 1. Fetch from Supabase Cloud
  try {
    const data = await restAll('feedback?select=*&order=created_at.desc');
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(addFb);
    }
  } catch (err) {
    console.warn('[Admin API] Supabase fetchFeedback failed, using local/ntfy fallback:', err);
  }

  // 2. Fetch from Local Admin API
  try {
    const res = await fetch('/api/feedback');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) data.forEach(addFb);
    }
  } catch {}

  // 3. Fallback: Fetch from Live Cloud Topics (ntfy)
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3500);
    const topicRes = await fetch('https://ntfy.sh/prakanguard_spk_feedback_v5/json?poll=1&since=all', {
      cache: 'no-store',
      signal: ctl.signal
    }).catch(() => null);
    clearTimeout(t);
    if (topicRes && topicRes.ok) {
      const text = await topicRes.text();
      const lines = text.trim().split('\n');
      for (const line of lines) {
        if (!line) continue;
        try {
          const entry = JSON.parse(line);
          if (entry.event === 'message' && entry.message) {
            const parsed = JSON.parse(entry.message);
            if (parsed && parsed.id) addFb(parsed);
          }
        } catch (_) {}
      }
    }
  } catch {}

  const results = Array.from(fbMap.values());
  results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  cachedFeedbackMap = fbMap;
  return results;
}

export async function setFeedbackRead(id, isRead = true, adminNote = undefined) {
  const sid = String(id);
  const patch = { is_read: !!isRead, ...(adminNote !== undefined ? { admin_note: adminNote } : {}) };
  setFeedbackOverride(sid, patch);
  try {
    const localFb = JSON.parse(localStorage.getItem('prakanguard_feedback_items') || '[]');
    if (Array.isArray(localFb)) {
      localStorage.setItem('prakanguard_feedback_items', JSON.stringify(
        localFb.map(f => String(f.id) === sid ? { ...f, isRead: !!isRead, ...(adminNote !== undefined ? { adminNote } : {}) } : f)
      ));
    }
  } catch {}
  await rest(`feedback?id=eq.${encodeURIComponent(sid)}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' }).catch(() => {});
  return true;
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
    const querySince = new Date(now - (windowMs + 15000)).toISOString();
    const r = await rest(`visitors?select=${visCols()}&last_ping=gte.${querySince}&order=last_ping.desc&limit=1000`);
    if (r.ok && Array.isArray(r.data)) {
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
    if (table === 'reports') {
      const data = await fetchReports();
      return { ok: true, data: data.slice(0, limit), status: 200 };
    }
    if (table === 'feedback') {
      const data = await fetchFeedback();
      return { ok: true, data: data.slice(0, limit), status: 200 };
    }
    if (table === 'admin_trash') {
      const data = await fetchTrash();
      return { ok: true, data: data.slice(0, limit), status: 200 };
    }
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
    fetchReports(),
    fetchFeedback(),
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

/* ============================================== Official Flood Points */
export async function fetchOfficialPoints() {
  try {
    const raw = localStorage.getItem('prakanguard_points_state_v10');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Admin API] Failed to parse prakanguard_points_state_v10 from localStorage:', e);
  }

  for (const url of ['./assets/data/official_points.json', '/admin/assets/data/official_points.json', './data/official_points.json', '/admin/data/official_points.json']) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {}
  }

  return [];
}
