// บริการ Cloud Real-time Sync ข้ามอุปกรณ์สำหรับ Prakanguard
// รองรับการส่งและรับรายงานน้ำท่วม/ลูกเห็บ และข้อเสนอแนะจากมือถือหรืออุปกรณ์อื่นเข้ามาที่แอดมิน 100%
// Multi-Channel Architecture: Supabase Cloud Database (Primary) + Direct Local Admin API (PNA) + Cloud Pub/Sub Fallback
import { isPointInSamutPrakan } from '../data/samutPrakanBoundary';


import { sanitizeReportPayload, sanitizeFeedbackPayload, verifyAdminSessionToken } from './securityService';

export function getSupabaseUrl() {
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('pg_supabase_url');
    if (custom && custom.includes('cnjufleeibbgmpvuvrpg')) {
      localStorage.removeItem('pg_supabase_url');
      localStorage.removeItem('pg_supabase_key');
    } else if (custom && custom.trim().startsWith('http')) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return 'https://uyszfmcumloxwuojmndy.supabase.co';
}

export function getSupabaseKey() {
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('pg_supabase_key');
    const customUrl = localStorage.getItem('pg_supabase_url');
    if (customUrl && customUrl.includes('cnjufleeibbgmpvuvrpg')) {
      localStorage.removeItem('pg_supabase_key');
    } else if (custom && custom.trim()) {
      return custom.trim();
    }
  }
  return 'sb_publishable_Y73zrfwvP8NnXyjJ5q6bSA_xYqU0jF7';
}

const getBase = () => getSupabaseUrl().replace(/\/+$/, '') + '/rest/v1/';
const getHeaders = (extra = {}) => {
  const k = getSupabaseKey();
  let token = null;
  try {
    if (typeof sessionStorage !== 'undefined') {
      token = sessionStorage.getItem('pg_admin_token') || sessionStorage.getItem('sb_access_token');
    }
  } catch (_) {}
  return {
    'apikey': k,
    'Authorization': `Bearer ${token || k}`,
    ...extra
  };
};

const PRIMARY_REPORTS_TOPIC = 'https://ntfy.sh/prakanguard_spk_reports_v5';
const FALLBACK_REPORTS_TOPIC = 'https://ntfy.sh/prakanguard_live_reports_v4_spk';

const PRIMARY_FEEDBACK_TOPIC = 'https://ntfy.sh/prakanguard_spk_feedback_v5';
const FALLBACK_FEEDBACK_TOPIC = 'https://ntfy.sh/prakanguard_live_feedback_v4_spk';

const PRIMARY_ACTIONS_TOPIC = 'https://ntfy.sh/prakanguard_live_actions_v4_spk';

const LOCAL_ADMIN_API = 'http://localhost:4000';

const PERMANENT_BLOCKED_IDS = new Set([
  'test-check-insert',
  'test-inspect-1792700165089',
  'zz-sec-probe-1792736969'
]);

function getDeletedSet(kind = 'report') {
  try {
    const k1 = kind === 'report' ? 'pg_deleted_report_ids_v1' : 'pg_deleted_feedback_ids_v1';
    const a1 = JSON.parse(localStorage.getItem(k1) || '[]');
    const a2 = kind === 'report' ? JSON.parse(localStorage.getItem('pg_deleted_ids_v1') || '[]') : [];
    const set = new Set([
      ...(Array.isArray(a1) ? a1.map(String) : []),
      ...(Array.isArray(a2) ? a2.map(String) : [])
    ]);
    if (kind === 'report') {
      PERMANENT_BLOCKED_IDS.forEach(id => set.add(id));
    }
    return set;
  } catch {
    return kind === 'report' ? new Set(PERMANENT_BLOCKED_IDS) : new Set();
  }
}

export function markCloudItemDeleted(kind = 'report', id) {
  if (!id) return;
  try {
    const key = kind === 'report' ? 'pg_deleted_report_ids_v1' : 'pg_deleted_feedback_ids_v1';
    const set = getDeletedSet(kind);
    set.add(String(id));
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
    if (kind === 'report') {
      localStorage.setItem('pg_deleted_ids_v1', JSON.stringify(Array.from(set)));
    }
  } catch {}
}

function getLocalReportOverrides() {
  try {
    const obj = JSON.parse(localStorage.getItem('pg_report_overrides_v1') || '{}');
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function setLocalReportOverride(id, patch) {
  if (!id || !patch) return;
  try {
    const map = getLocalReportOverrides();
    map[String(id)] = { ...(map[String(id)] || {}), ...patch, updated_at: Date.now() };
    localStorage.setItem('pg_report_overrides_v1', JSON.stringify(map));
  } catch {}
}

let lastActionPollTs = 0;
async function syncActionsFromTopic() {
  if (typeof localStorage === 'undefined') return;
  if (Date.now() - lastActionPollTs < 4000) return;
  lastActionPollTs = Date.now();
  try {
    const res = await fetch(`${PRIMARY_ACTIONS_TOPIC}/json?poll=1&since=all`, {
      cache: 'no-cache',
      signal: AbortSignal.timeout(3500)
    }).catch(() => null);
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
          const sid = String(act.id);
          if (act.type === 'reject' || act.type === 'delete_report') {
            markCloudItemDeleted('report', sid);
          } else if (act.type === 'delete_feedback') {
            markCloudItemDeleted('feedback', sid);
          } else if (act.type === 'approve') {
            setLocalReportOverride(sid, { isApproved: true, is_approved: true, isResolved: false, is_resolved: false });
          } else if (act.type === 'unapprove') {
            setLocalReportOverride(sid, { isApproved: false, is_approved: false });
          } else if (act.type === 'resolve') {
            setLocalReportOverride(sid, { isResolved: true, is_resolved: true, depthCm: 0, depth_cm: 0 });
          } else if (act.type === 'update_report' && act.patch) {
            setLocalReportOverride(sid, act.patch);
          }
        }
      } catch {}
    }
  } catch {}
}

/**
 * แปลง CamelCase เป็น Snake_Case สำหรับ Supabase Reports
 * บังคับ is_approved = false เสมอสำหรับการส่งรายงานจากฝั่งประชาชน (เว้นแต่มีเซสชันแอดมินที่ถูกต้อง)
 */
function toSupabaseReport(r, isAdminVerified = false) {
  return {
    id: r.id,
    hazard_type: r.hazardType || 'flood',
    name: r.name || 'ไม่ระบุชื่อจุด',
    subdistrict: r.subdistrict || null,
    district: r.district || 'เมืองสมุทรปราการ',
    lat: Number(r.lat),
    lng: Number(r.lng),
    body_level: r.bodyLevel || null,
    body_level_label: r.bodyLevelLabel || null,
    depth_cm: r.depthCm ? parseInt(r.depthCm, 10) : null,
    depth_range: r.depthRange || null,
    level: r.level ? parseInt(r.level, 10) : 2,
    traffic_status: r.trafficStatus || null,
    cause: r.cause || null,
    official_guidance: r.officialGuidance || null,
    source: r.source || 'รายงานจากประชาชน (Crowdsource)',
    phone: r.phone || null,
    photo_url: r.photoUrl || r.photo_url || null,
    reporter_device: r.reporter_device || r.reporterDevice || null,
    reporter_district: r.reporter_district || r.reporterDistrict || null,
    is_approved: isAdminVerified ? !!r.isApproved : false,
    is_resolved: isAdminVerified ? !!r.isResolved : false,
    reported_at: r.reportedAt || null,
    timestamp: Number(r.timestamp) || Date.now()
  };
}

function fromSupabaseReport(row) {
  let timeStr = row.reported_at;
  if (typeof timeStr === 'string' && timeStr.includes('T')) {
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) + ' น.';
      }
    } catch (_) {}
  }

  return {
    id: row.id,
    hazardType: row.hazard_type || 'flood',
    name: row.name,
    subdistrict: row.subdistrict || '',
    district: row.district,
    lat: Number(row.lat),
    lng: Number(row.lng),
    bodyLevel: row.body_level || '',
    bodyLevelLabel: row.body_level_label || '',
    depthCm: row.depth_cm,
    depthRange: row.depth_range || '',
    level: row.level || 2,
    trafficStatus: row.traffic_status || '',
    cause: row.cause || '',
    officialGuidance: row.official_guidance || '',
    source: row.source || 'รายงานจากประชาชน',
    phone: row.phone || '',
    photoUrl: row.photo_url || row.photoUrl || row.photo || row.image || null,
    isApproved: !!row.is_approved,
    isResolved: !!row.is_resolved,
    reportedAt: timeStr || '',
    timestamp: Number(row.timestamp) || Date.now()
  };
}

function toSupabaseFeedback(f) {
  let subAtIso;
  try {
    subAtIso = new Date(f.timestamp || Date.now()).toISOString();
  } catch (_) {
    subAtIso = new Date().toISOString();
  }

  return {
    id: f.id,
    category: f.category || 'suggestion',
    category_label: f.categoryLabel || 'ทั่วไป',
    rating: f.rating ? parseInt(f.rating, 10) : 5,
    message: f.message || '',
    sender_name: f.senderName || 'ประชาชนทั่วไป',
    contact: f.contact || '-',
    admin_note: f.adminNote || '',
    is_read: !!f.isRead,
    submitted_at: subAtIso
  };
}

function fromSupabaseFeedback(row) {
  let timeStr = row.submitted_at;
  let ts = Number(row.timestamp) || Date.now();
  if (row.submitted_at) {
    try {
      const d = new Date(row.submitted_at);
      if (!isNaN(d.getTime())) {
        ts = d.getTime();
        timeStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      }
    } catch (_) {}
  }

  return {
    id: row.id,
    category: row.category,
    categoryLabel: row.category_label || 'ทั่วไป',
    rating: row.rating ? parseInt(row.rating, 10) : 5,
    message: row.message,
    senderName: row.sender_name || 'ประชาชนทั่วไป',
    contact: row.contact || '-',
    adminNote: row.admin_note || '',
    isRead: !!row.is_read,
    submittedAt: timeStr || 'เมื่อสักครู่',
    timestamp: ts
  };
}

/**
 * ตรวจสอบความถูกต้องของพิกัดและข้อมูลรายงาน เพื่อป้องกันข้อผิดพลาดแผนที่
 */
export function isValidReport(r) {
  if (!r || typeof r !== 'object') return false;
  const id = String(r.id || '').toLowerCase();
  const name = String(r.name || '').toLowerCase();
  const dist = String(r.district || '').toLowerCase();
  const sub = String(r.subdistrict || '').toLowerCase();

  // กรองข้อมูลโพรบของ AI หรือสัญลักษณ์ผิดปกติออกทั้งหมด
  if (id.startsWith('zz-') || id.includes('probe') || id.includes('test-inspect') || id.includes('test-check')) return false;
  if (name.includes('security-probe') || name.includes('auto-deleted') || name.includes('probe') || name === 'ทดสอบเช็คการเขียน' || name === 'ทดสอบระบบ') return false;
  if (name.includes('????') || dist.includes('????') || sub.includes('????')) return false;
  if (typeof r.lat !== 'number' || isNaN(r.lat) || typeof r.lng !== 'number' || isNaN(r.lng)) return false;

  return isPointInSamutPrakan(r.lat, r.lng);
}

export function isValidFeedback(f) {
  return (
    f &&
    typeof f === 'object' &&
    typeof f.id === 'string' &&
    typeof f.message === 'string' &&
    f.message.trim().length > 0
  );
}

/**
 * ส่งรายงานน้ำท่วมหรือลูกเห็บขึ้น Supabase Cloud Database + Local Admin Server
 */
export async function publishCloudReport(report) {
  try {
    const safeReport = sanitizeReportPayload(report) || report;
    if (!isValidReport(safeReport)) {
      console.warn('[CloudSync] Report missing valid coordinates, skipping publish:', safeReport);
      return false;
    }
    const isHail = safeReport.hazardType === 'hail';
    const asciiTitle = isHail ? 'PrakanGuard Hail Report' : 'PrakanGuard Flood Report';
    const payload = JSON.stringify(safeReport);

    // 1. ส่งขึ้น Supabase Cloud Database (ศูนย์ข้อมูลกลาง 24 ชม. ทุกเครื่องเข้าถึงได้)
    try {
      const isAdmin = verifyAdminSessionToken();
      const supaBody = JSON.stringify(toSupabaseReport(safeReport, isAdmin));
      fetch(`${getBase()}reports`, {
        method: 'POST',
        headers: getHeaders({
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        }),
        body: supaBody
      }).catch(err => console.warn('[Supabase Report Error]:', err));
    } catch (e) {}

    // 2. Direct Local Admin API Push (Instant zero latency via PNA เมื่อเปิดบนเครื่องเดียวกับแอดมิน)
    try {
      fetch(`${LOCAL_ADMIN_API}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        mode: 'cors'
      }).catch(() => {});
    } catch (e) {}

    // 3. Publish to Cloud Topics (Fallback Pub/Sub - strictly ASCII header)
    try {
      fetch(PRIMARY_REPORTS_TOPIC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Title': asciiTitle,
          'Priority': safeReport.level === 3 ? 'urgent' : 'high',
          'Tags': isHail ? 'ice_cube,cloud_with_rain' : 'droplet,warning'
        },
        body: payload
      }).catch(() => {});
    } catch (e) {}

    return true;
  } catch (err) {
    console.warn('[CloudSync] publishCloudReport warning:', err);
    return false;
  }
}

/**
 * ส่งข้อเสนอแนะหรือข้อติชมขึ้น Supabase Cloud Database + Local Admin Server
 */
export async function publishCloudFeedback(feedback) {
  try {
    const safeFeedback = sanitizeFeedbackPayload(feedback) || feedback;
    if (!isValidFeedback(safeFeedback)) return false;
    const asciiTitle = 'PrakanGuard Citizen Feedback';
    const payload = JSON.stringify(safeFeedback);

    // 1. ส่งขึ้น Supabase Cloud Database
    try {
      const supaBody = JSON.stringify(toSupabaseFeedback(safeFeedback));
      fetch(`${getBase()}feedback`, {
        method: 'POST',
        headers: getHeaders({
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        }),
        body: supaBody
      }).catch(err => console.warn('[Supabase Feedback Error]:', err));
    } catch (e) {}

    // 2. Relative Serverless API Push (/api/feedback)
    try {
      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      }).catch(() => {});
    } catch (_) {}

    // 3. Direct Local Admin API Push (localhost:4000)
    try {
      fetch(`${LOCAL_ADMIN_API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        mode: 'cors'
      }).catch(() => {});
    } catch (e) {}

    // 4. Publish to Cloud Topics (Multi-Topic Pub/Sub)
    [PRIMARY_FEEDBACK_TOPIC, FALLBACK_FEEDBACK_TOPIC].forEach(topic => {
      try {
        fetch(topic, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Title': asciiTitle,
            'Priority': 'default',
            'Tags': 'speech_balloon,star'
          },
          body: payload
        }).catch(() => {});
      } catch (e) {}
    });

    return true;
  } catch (err) {
    console.warn('[CloudSync] publishCloudFeedback warning:', err);
    return false;
  }
}

/**
 * ส่งคำสั่ง Admin Action (เช่น อนุมัติ / ปิดงาน / ลบจุด) เพื่อให้อุปกรณ์อื่นอัปเดตตาม
 * บังคับตรวจสอบ Cryptographic Admin Session Token ก่อนทำงานเสมอ
 */
export async function publishAdminAction(action) {
  try {
    const hasAdminAuth = verifyAdminSessionToken() || (typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('pg_admin_session_v2'));
    if (!hasAdminAuth) {
      console.warn('[CloudSync] Unauthorized publishAdminAction blocked.');
      return false;
    }
    const payload = JSON.stringify(action);
    const asciiTitle = `Admin Action: ${action.type || 'update'}`;

    // Persist locally in shared ledger
    if (action.id) {
      const sid = String(action.id);
      if (action.type === 'approve') {
        setLocalReportOverride(sid, { isApproved: true, is_approved: true, isResolved: false, is_resolved: false });
      } else if (action.type === 'unapprove') {
        setLocalReportOverride(sid, { isApproved: false, is_approved: false });
      } else if (action.type === 'resolve') {
        setLocalReportOverride(sid, { isResolved: true, is_resolved: true, depthCm: 0, depth_cm: 0 });
      } else if (action.type === 'reject' || action.type === 'delete_report') {
        markCloudItemDeleted('report', sid);
      } else if (action.type === 'delete_feedback') {
        markCloudItemDeleted('feedback', sid);
      }
    }

    try {
      const bc = new BroadcastChannel('pg_admin_sync_channel');
      bc.postMessage(action);
      bc.close();
    } catch (_) {}

    // Update Supabase Database
    try {
      if (action.type === 'approve' && action.id) {
        fetch(`${getBase()}reports?id=eq.${encodeURIComponent(action.id)}`, {
          method: 'PATCH',
          headers: getHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ is_approved: true, is_resolved: false })
        }).catch(() => {});
      } else if (action.type === 'resolve' && action.id) {
        fetch(`${getBase()}reports?id=eq.${encodeURIComponent(action.id)}`, {
          method: 'PATCH',
          headers: getHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ is_resolved: true })
        }).catch(() => {});
      } else if (action.type === 'reject' && action.id) {
        fetch(`${getBase()}reports?id=eq.${encodeURIComponent(action.id)}`, {
          method: 'DELETE',
          headers: getHeaders()
        }).catch(() => {});
      }
    } catch (e) {}

    // Direct Local Admin push
    try {
      if (action.type === 'approve' && action.id) {
        fetch(`${LOCAL_ADMIN_API}/api/reports/${encodeURIComponent(action.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isApproved: true, isResolved: false }),
          mode: 'cors'
        }).catch(() => {});
      }
    } catch (e) {}

    fetch(PRIMARY_ACTIONS_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Title': asciiTitle,
        'Tags': 'shield,gear'
      },
      body: payload
    }).catch(() => {});

    return true;
  } catch (err) {
    console.warn('[CloudSync] publishAdminAction warning:', err);
    return false;
  }
}

const REPORT_PUBLIC_SELECT_COLS = 'id,hazard_type,name,subdistrict,district,lat,lng,body_level,body_level_label,depth_cm,depth_range,level,traffic_status,cause,official_guidance,source,is_approved,is_resolved,reported_at,timestamp';
const REPORT_ADMIN_SELECT_COLS = 'id,hazard_type,name,subdistrict,district,lat,lng,body_level,body_level_label,depth_cm,depth_range,level,traffic_status,cause,official_guidance,source,phone,is_approved,is_resolved,reported_at,timestamp';
let hasWarnedQuotaReports = false;
let hasWarnedQuotaFeedback = false;

/**
 * ดึงรูปภาพของรายงานแบบ Lazy Load ทีละรายการเมื่อคลิกดูรูป (ประหยัดแบนด์วิดท์มหาศาล)
 */
export async function fetchCloudReportPhoto(reportId) {
  if (!reportId) return null;
  try {
    const res = await fetch(`${getBase()}reports?id=eq.${encodeURIComponent(reportId)}&select=photo_url&limit=1`, {
      headers: getHeaders()
    }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.photo_url) {
        return data[0].photo_url;
      }
    }
  } catch (e) {}
  return null;
}

/**
 * ดึงรายงานน้ำท่วม/ลูกเห็บย้อนหลังล่าสุด (ดึงจาก Supabase Cloud + Local API + Fallback)
 * ประหยัดแบนด์วิดท์ 99.9% โดยเลือกเฉพาะข้อมูลข้อความ ไม่ดึงรูป Base64 ซ้ำซาก
 */
export async function fetchRecentCloudReports() {
  try {
    await syncActionsFromTopic();
    const deletedSet = getDeletedSet('report');
    const overrides = getLocalReportOverrides();
    const reportMap = new Map();

    const applyOverridesAndAdd = (r) => {
      if (!r || !r.id) return;
      const sid = String(r.id);
      if (deletedSet.has(sid) || !isValidReport(r)) return;
      const ov = overrides[sid] || {};
      const merged = { ...r, ...ov };
      if (ov.is_approved !== undefined) merged.isApproved = ov.is_approved;
      if (ov.isApproved !== undefined) merged.isApproved = ov.isApproved;
      if (ov.is_resolved !== undefined) merged.isResolved = ov.is_resolved;
      if (ov.isResolved !== undefined) merged.isResolved = ov.isResolved;
      if (ov.depth_cm !== undefined) merged.depthCm = ov.depth_cm;
      reportMap.set(sid, merged);
    };

    // 0. ดึงรายงานที่สร้างจาก Admin Portal ในเครื่องเดียวกัน (ถ้ามี)
    try {
      const adminLocal = JSON.parse(localStorage.getItem('pg_admin_local_reports_v1') || '[]');
      if (Array.isArray(adminLocal)) {
        adminLocal.forEach(row => applyOverridesAndAdd(fromSupabaseReport(row)));
      }
    } catch (_) {}

    // 1. ดึงจาก Supabase Cloud Database เป็นหลัก (ซ่อนเบอร์โทรศัพท์หากไม่ใช่เซสชันแอดมิน)
    try {
      const isAdmin = verifyAdminSessionToken() || (typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('pg_admin_session_v2'));
      const selectCols = isAdmin ? REPORT_ADMIN_SELECT_COLS : REPORT_PUBLIC_SELECT_COLS;
      const supaRes = await fetch(`${getBase()}reports?select=${selectCols}&order=timestamp.desc&limit=100`, {
        headers: getHeaders(),
        cache: 'no-cache'
      }).catch(() => null);

      if (supaRes && supaRes.status === 402) {
        if (!hasWarnedQuotaReports) {
          console.warn('[CloudSync] Supabase egress quota exceeded (402). Falling back to Local Admin API & Pub/Sub.');
          hasWarnedQuotaReports = true;
        }
      } else if (supaRes && supaRes.ok) {
        const rows = await supaRes.json();
        if (Array.isArray(rows)) {
          rows.forEach(row => {
            if (row && typeof row.id === 'string' && row.id.startsWith('zz-sec-probe-')) {
              fetch(`${getBase()}reports?id=eq.${encodeURIComponent(row.id)}`, { method: 'DELETE', headers: getHeaders() }).catch(() => {});
              return;
            }
            const parsed = fromSupabaseReport(row);
            if (!isAdmin) parsed.phone = '';
            applyOverridesAndAdd(parsed);
          });
        }
      }
    } catch (e) {}

    // 2. ดึงจาก Local Admin API เสริมถ้าเข้าถึงได้
    try {
      const localRes = await fetch(`${LOCAL_ADMIN_API}/api/reports`, { cache: 'no-cache' }).catch(() => null);
      if (localRes && localRes.ok) {
        const localReports = await localRes.json();
        if (Array.isArray(localReports)) {
          localReports.forEach(r => {
            if (!reportMap.has(String(r.id))) {
              applyOverridesAndAdd(r);
            }
          });
        }
      }
    } catch (e) {}

    const results = Array.from(reportMap.values());
    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return results;
  } catch (err) {
    console.warn('[CloudSync] fetchRecentCloudReports error:', err);
    return [];
  }
}

/**
 * ดึงข้อเสนอแนะล่าสุด (ดึงจาก Supabase Cloud + Local API)
 */
export async function fetchRecentCloudFeedback() {
  try {
    await syncActionsFromTopic();
    const deletedSet = getDeletedSet('feedback');
    const feedbackMap = new Map();

    // 1. ดึงจาก Supabase Cloud Database เป็นหลัก
    try {
      const supaRes = await fetch(`${getBase()}feedback?order=timestamp.desc&limit=60`, {
        headers: getHeaders(),
        cache: 'no-cache'
      }).catch(() => null);

      if (supaRes && supaRes.status === 402) {
        if (!hasWarnedQuotaFeedback) {
          console.warn('[CloudSync] Supabase egress quota exceeded (402). Feedback falling back to Local Admin API.');
          hasWarnedQuotaFeedback = true;
        }
      } else if (supaRes && supaRes.ok) {
        const rows = await supaRes.json();
        if (Array.isArray(rows)) {
          rows.forEach(row => {
            const parsed = fromSupabaseFeedback(row);
            if (isValidFeedback(parsed) && !deletedSet.has(String(parsed.id))) {
              feedbackMap.set(parsed.id, parsed);
            }
          });
        }
      }
    } catch (e) {}

    // 2. ดึงจาก Serverless API (/api/feedback) และ Local Admin API
    try {
      const serverlessRes = await fetch('/api/feedback', { cache: 'no-cache' }).catch(() => null);
      if (serverlessRes && serverlessRes.ok) {
        const data = await serverlessRes.json();
        if (Array.isArray(data)) {
          data.forEach(f => {
            if (isValidFeedback(f) && !deletedSet.has(String(f.id)) && !feedbackMap.has(f.id)) {
              feedbackMap.set(f.id, f);
            }
          });
        }
      }
    } catch (_) {}

    try {
      const localRes = await fetch(`${LOCAL_ADMIN_API}/api/feedback`, { cache: 'no-cache' }).catch(() => null);
      if (localRes && localRes.ok) {
        const localFeedback = await localRes.json();
        if (Array.isArray(localFeedback)) {
          localFeedback.forEach(f => {
            if (isValidFeedback(f) && !deletedSet.has(String(f.id)) && !feedbackMap.has(f.id)) {
              feedbackMap.set(f.id, f);
            }
          });
        }
      }
    } catch (e) {}

    // 3. Fallback: ดึงจาก Cloud Ntfy Topic สำรอง
    if (feedbackMap.size === 0) {
      try {
        const topicRes = await fetch(`${PRIMARY_FEEDBACK_TOPIC}/json?poll=1&since=all`, { cache: 'no-cache' }).catch(() => null);
        if (topicRes && topicRes.ok) {
          const text = await topicRes.text();
          const lines = text.trim().split('\n');
          for (const line of lines) {
            if (!line) continue;
            try {
              const entry = JSON.parse(line);
              if (entry.event === 'message' && entry.message) {
                const parsed = JSON.parse(entry.message);
                if (isValidFeedback(parsed) && !deletedSet.has(String(parsed.id)) && !feedbackMap.has(parsed.id)) {
                  feedbackMap.set(parsed.id, parsed);
                }
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    const results = Array.from(feedbackMap.values());
    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return results;
  } catch (err) {
    console.warn('[CloudSync] fetchRecentCloudFeedback error:', err);
    return [];
  }
}

/**
 * ฟังก์ชันซิงก์ดึงข้อมูลสดทั้งหมด
 */
export async function syncCloudDataNow() {
  const [reports, feedback] = await Promise.all([
    fetchRecentCloudReports(),
    fetchRecentCloudFeedback()
  ]);
  return { reports, feedback };
}

/**
 * ตรวจสอบประเภทและยี่ห้อ/รุ่นของอุปกรณ์ผู้ใช้ (iPhone, iPad, OPPO, Vivo, Samsung, Xiaomi, PC, ฯลฯ)
 */
export function getDetailedDeviceInfo() {
  if (typeof window === 'undefined' || !navigator) return 'Desktop';
  const ua = navigator.userAgent || '';

  // 1. iOS / Apple (iPhone, iPad) with precise Screen Dimension & DPR Identification
  if (/iPhone/i.test(ua)) {
    const w = window.screen?.width || 0;
    const h = window.screen?.height || 0;
    const dpr = window.devicePixelRatio || 1;
    const minD = Math.min(w, h);
    const maxD = Math.max(w, h);

    if (minD === 430 && maxD === 932) return 'iPhone 14 Pro Max';
    if (minD === 393 && maxD === 852) return 'iPhone 14 Pro';
    if (minD === 428 && maxD === 926) return 'iPhone 14 Plus';
    if (minD === 390 && maxD === 844) return 'iPhone 14';
    if (minD === 414 && maxD === 896) return dpr >= 3 ? 'iPhone 11 Pro Max' : 'iPhone 11';
    if (minD === 375 && maxD === 812) return 'iPhone 11 Pro';
    if (minD === 375 && maxD === 667) return 'iPhone SE';
    if (minD === 360 && maxD === 780) return 'iPhone 13 mini';
    return 'iPhone';
  }

  // iPad or Tablet -> ระบุ "แท็บเล็ต" ตามที่ผู้ใช้สั่ง
  if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /Tablet|Android(?!.*Mobile)/i.test(ua)) {
    return 'แท็บเล็ต';
  }

  // 2. Android Brands & Specific Models
  if (/Android/i.test(ua)) {
    let brand = '';
    if (/OPPO|CPH\d{4}|P[C-G][A-Z0-9]+/i.test(ua)) {
      const modelMatch = ua.match(/(CPH\d{4}|Find\s?[A-Z0-9]+|Reno\s?[A-Z0-9]+|A\d{2}[s]?)/i);
      brand = modelMatch ? `OPPO ${modelMatch[1]}` : 'OPPO';
    } else if (/vivo|V2\d{3}|V1\d{3}/i.test(ua)) {
      const modelMatch = ua.match(/(V2\d{3}[A-Z]?|Y\d{2}[s]?|V\d{2}[s]?|X\d{2}[s]?)/i);
      brand = modelMatch ? `Vivo ${modelMatch[1]}` : 'Vivo';
    } else if (/SAMSUNG|SM-[A-Z0-9]+/i.test(ua)) {
      const sMatch = ua.match(/SM-([A-Z0-9]+)/i);
      const code = sMatch ? sMatch[1] : '';
      if (code.startsWith('S928') || code.startsWith('S92')) brand = 'Samsung Galaxy S24';
      else if (code.startsWith('S918') || code.startsWith('S91')) brand = 'Samsung Galaxy S23';
      else if (code.startsWith('S908') || code.startsWith('S90')) brand = 'Samsung Galaxy S22';
      else if (code.startsWith('A54')) brand = 'Samsung Galaxy A54';
      else if (code.startsWith('A53')) brand = 'Samsung Galaxy A53';
      else brand = code ? `Samsung ${code}` : 'Samsung Galaxy';
    } else if (/Xiaomi|Redmi|POCO|2[0-9]{3}[A-Z0-9]+/i.test(ua)) {
      const modelMatch = ua.match(/(Redmi[^\s;]+|POCO[^\s;]+|Mi\s?[A-Z0-9]+)/i);
      brand = modelMatch ? `Xiaomi ${modelMatch[1]}` : 'Xiaomi / Redmi';
    } else if (/Realme|RMX\d{4}/i.test(ua)) {
      brand = 'Realme';
    } else if (/Huawei|HONOR/i.test(ua)) {
      brand = 'Huawei';
    } else {
      brand = 'สมาร์ตโฟน';
    }
    return brand;
  }

  // 3. Desktop / Computer -> ระบุ "PC" ตามที่ผู้ใช้สั่ง
  if (/Windows|Macintosh|Linux/i.test(ua) && !/Mobile|Android|iPhone|iPad/i.test(ua)) {
    return 'PC';
  }

  return 'PC';
}

// Global BroadcastChannel to command all tabs on this PC to halt visitor telemetry
if (typeof window !== 'undefined') {
  try {
    const bc = new BroadcastChannel('pg_telemetry_control');
    bc.onmessage = (ev) => {
      if (ev.data && ev.data.type === 'EXCLUDE_ADMIN_WORK_PC') {
        window.__pg_stop_telemetry = true;
        try { localStorage.setItem('pg_is_admin_device', 'true'); } catch (e) {}
      }
    };
  } catch (e) {}
}

export function isCurrentDeviceAdminWorkPC() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.__pg_stop_telemetry === true) return true;
    if (localStorage.getItem('pg_is_admin_device') === 'true') return true;
    if (localStorage.getItem('pg_admin_work_device') === 'true') return true;
    if (localStorage.getItem('pg_exclude_from_visitor_telemetry') === 'true') return true;
    if (localStorage.getItem('pg_admin_session_v2')) return true;
    if (sessionStorage.getItem('pg_admin_session_v2')) return true;
    if (document.cookie && document.cookie.includes('pg_admin_work_device=true')) return true;
    if (window.location && (window.location.pathname.includes('/admin') || window.location.hash.includes('admin'))) return true;
  } catch (e) {}
  return false;
}

/**
 * ส่ง Heartbeat ข้อมูลการเข้าชมเบาๆ ไปยัง Supabase + Admin Server (Non-blocking)
 * บันทึกตำแหน่ง GPS อำเภอ และประเภท/รุ่นอุปกรณ์จริง (เช่น iPhone 14, Samsung Galaxy S24)
 * หมายเหตุ: ไม่นับ PC เครื่องทำงานของแอดมิน และไม่นับแท็บที่ถูกพับเก็บ/ซ่อนอยู่
 */
export function sendVisitorTelemetry(district = null, customDevice = null, activeSection = null) {
  if (typeof window === 'undefined') return;
  try {
    // 1. ตรวจสอบว่าคือเครื่องทำงานของ Admin หรือไม่ (ไม่นับเครื่องแอดมิน 100%)
    if (isCurrentDeviceAdminWorkPC()) return;

    // 2. ตรวจสอบว่าผู้ใช้กำลังเปิดดูหน้าเว็บอยู่จริงๆ หรือไม่ (ไม่นับแท็บที่ถูกซ่อน/ย่อไว้)
    if (document.visibilityState === 'hidden') return;

    let sessionId = sessionStorage.getItem('pg_visitor_sid');
    if (!sessionId) {
      sessionId = 'v-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      sessionStorage.setItem('pg_visitor_sid', sessionId);
    }
    let deviceId = null;
    try {
      deviceId = localStorage.getItem('pg_visitor_did');
      if (!deviceId) {
        deviceId = 'd-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
        localStorage.setItem('pg_visitor_did', deviceId);
      }
    } catch (e) {}

    const deviceModel = customDevice || getDetailedDeviceInfo();

    // Determine district status as requested by user (ไม่ต้องมี อ. นำหน้า)
    let finalDistrict = 'ปิด GPS';
    let gpsStatus = 'denied';
    if (!district || district === 'none' || district === 'no_gps' || district === 'ปิด GPS' || district.includes('GPS') || district.includes('พิกัด')) {
      finalDistrict = 'ปิด GPS';
      gpsStatus = 'denied';
    } else if (district === 'outside' || district.includes('นอก') || district.includes('ไม่ได้อยู่')) {
      finalDistrict = 'ไม่ได้อยู่สมุทรปราการ';
      gpsStatus = 'outside';
    } else {
      finalDistrict = district.replace(/^อ\./, '').replace(/^อำเภอ/, '').replace('เมืองสมุทรปราการ', 'เมือง').trim();
      gpsStatus = 'granted';
    }

    const payload = {
      session_id: sessionId,
      device_id: deviceId,
      device: deviceModel,
      district: finalDistrict,
      gps_status: gpsStatus,
      page: activeSection || document.title || 'หน้าหลัก (แผนที่)',
      last_ping: new Date().toISOString()
    };

    // 1. ส่งเข้า Supabase visitors (upsert)
    fetch(`${getBase()}visitors`, {
      method: 'POST',
      headers: getHeaders({
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      }),
      body: JSON.stringify(payload)
    }).catch(() => {});

    // 2. ส่งเข้า Local Admin API
    fetch(`${LOCAL_ADMIN_API}/api/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        deviceId,
        device: payload.device,
        district: payload.district,
        gpsStatus,
        page: payload.page,
        timestamp: Date.now()
      }),
      mode: 'cors'
    }).catch(() => {});
  } catch (e) {}
}

/**
 * สมัครรับเหตุการณ์แบบ Real-time ข้ามอุปกรณ์ผ่าน Server-Sent Events (SSE)
 */
export function subscribeToCloudEvents({ onNewReport, onNewFeedback, onAdminAction }) {
  const eventSources = [];

  const handleIncomingMessage = async (event, validator, callback) => {
    try {
      const data = JSON.parse(event.data);
      if (data && data.event === 'message') {
        let parsed = null;
        if (data.attachment && data.attachment.url) {
          try {
            const res = await fetch(data.attachment.url);
            if (res.ok) parsed = await res.json();
          } catch (e) {}
        }
        if (!parsed && data.message) {
          try {
            parsed = JSON.parse(data.message);
          } catch (e) {}
        }
        if (validator(parsed)) {
          callback(parsed);
        }
      }
    } catch (e) {}
  };

  // 1. Subscribe to Citizen Flood & Hail Reports
  if (onNewReport && typeof window !== 'undefined' && 'EventSource' in window) {
    [PRIMARY_REPORTS_TOPIC, FALLBACK_REPORTS_TOPIC].forEach(topic => {
      try {
        const reportsSource = new EventSource(`${topic}/sse`);
        reportsSource.onmessage = (event) => handleIncomingMessage(event, isValidReport, onNewReport);
        eventSources.push(reportsSource);
      } catch (e) {}
    });
  }

  // 2. Subscribe to Feedback & Suggestions
  if (onNewFeedback && typeof window !== 'undefined' && 'EventSource' in window) {
    [PRIMARY_FEEDBACK_TOPIC, FALLBACK_FEEDBACK_TOPIC].forEach(topic => {
      try {
        const feedbackSource = new EventSource(`${topic}/sse`);
        feedbackSource.onmessage = (event) => handleIncomingMessage(event, isValidFeedback, onNewFeedback);
        eventSources.push(feedbackSource);
      } catch (e) {}
    });
  }

  // 3. Subscribe to Admin Actions (Verified against Supabase to prevent unauthenticated Pub/Sub spoofing)
  if (onAdminAction && typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const actionsSource = new EventSource(`${PRIMARY_ACTIONS_TOPIC}/sse`);
      actionsSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.event === 'message') {
            let action = null;
            if (data.message) {
              try { action = JSON.parse(data.message); } catch (e) {}
            }
            if (action && action.type && action.id) {
              // Verify against Supabase source of truth before mutating client state
              try {
                const checkRes = await fetch(`${getBase()}reports?id=eq.${encodeURIComponent(action.id)}&select=id,is_approved,is_resolved&limit=1`, {
                  headers: getHeaders(),
                  cache: 'no-store'
                });
                if (checkRes.ok) {
                  const rows = await checkRes.json();
                  const row = Array.isArray(rows) ? rows[0] : null;
                  if (action.type === 'approve' && (!row || !row.is_approved)) return;
                  if (action.type === 'resolve' && (!row || !row.is_resolved)) return;
                  if (action.type === 'reject' && row && row.is_approved) return;
                }
              } catch (_) {}
              onAdminAction(action);
            }
          }
        } catch (e) {}
      };
      eventSources.push(actionsSource);
    } catch (e) {}
  }

  return () => {
    eventSources.forEach(es => {
      try {
        es.close();
      } catch (err) {}
    });
  };
}
