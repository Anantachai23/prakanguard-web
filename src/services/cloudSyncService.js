// บริการ Cloud Real-time Sync ข้ามอุปกรณ์สำหรับ Prakanguard
// รองรับการส่งและรับรายงานน้ำท่วม/ลูกเห็บ และข้อเสนอแนะจากมือถือหรืออุปกรณ์อื่นเข้ามาที่แอดมิน 100%
// Multi-Channel Architecture: Supabase Cloud Database (Primary) + Direct Local Admin API (PNA) + Cloud Pub/Sub Fallback

const SUPABASE_URL = 'https://cnjufleeibbgmpvuvrpg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw';

const PRIMARY_REPORTS_TOPIC = 'https://ntfy.sh/prakanguard_spk_reports_v5';
const FALLBACK_REPORTS_TOPIC = 'https://ntfy.sh/prakanguard_live_reports_v4_spk';

const PRIMARY_FEEDBACK_TOPIC = 'https://ntfy.sh/prakanguard_spk_feedback_v5';
const FALLBACK_FEEDBACK_TOPIC = 'https://ntfy.sh/prakanguard_live_feedback_v4_spk';

const PRIMARY_ACTIONS_TOPIC = 'https://ntfy.sh/prakanguard_live_actions_v4_spk';

const LOCAL_ADMIN_API = 'http://localhost:4000';

/**
 * แปลง CamelCase เป็น Snake_Case สำหรับ Supabase Reports
 */
function toSupabaseReport(r) {
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
    photo_url: r.photoUrl || null,
    is_approved: !!r.isApproved,
    is_resolved: !!r.isResolved,
    reported_at: r.reportedAt || null,
    timestamp: Number(r.timestamp) || Date.now()
  };
}

function fromSupabaseReport(row) {
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
    photoUrl: row.photo_url || null,
    isApproved: !!row.is_approved,
    isResolved: !!row.is_resolved,
    reportedAt: row.reported_at || '',
    timestamp: Number(row.timestamp) || Date.now()
  };
}

function toSupabaseFeedback(f) {
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
    submitted_at: f.submittedAt || '',
    timestamp: Number(f.timestamp) || Date.now()
  };
}

function fromSupabaseFeedback(row) {
  return {
    id: row.id,
    category: row.category,
    categoryLabel: row.category_label,
    rating: row.rating,
    message: row.message,
    senderName: row.sender_name,
    contact: row.contact,
    adminNote: row.admin_note || '',
    isRead: !!row.is_read,
    submittedAt: row.submitted_at,
    timestamp: Number(row.timestamp) || Date.now()
  };
}

/**
 * ตรวจสอบความถูกต้องของพิกัดและข้อมูลรายงาน เพื่อป้องกันข้อผิดพลาดแผนที่
 */
export function isValidReport(r) {
  return (
    r &&
    typeof r === 'object' &&
    typeof r.id === 'string' &&
    r.id.trim().length > 0 &&
    typeof r.lat === 'number' &&
    !isNaN(r.lat) &&
    typeof r.lng === 'number' &&
    !isNaN(r.lng) &&
    r.lat >= 13.0 && r.lat <= 14.5 &&
    r.lng >= 100.0 && r.lng <= 101.5
  );
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
    if (!isValidReport(report)) {
      console.warn('[CloudSync] Report missing valid coordinates, skipping publish:', report);
      return false;
    }
    const isHail = report.hazardType === 'hail';
    const asciiTitle = isHail ? 'PrakanGuard Hail Report' : 'PrakanGuard Flood Report';
    const payload = JSON.stringify(report);

    // 1. ส่งขึ้น Supabase Cloud Database (ศูนย์ข้อมูลกลาง 24 ชม. ทุกเครื่องเข้าถึงได้)
    try {
      const supaBody = JSON.stringify(toSupabaseReport(report));
      fetch(`${SUPABASE_URL}/rest/v1/reports`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
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
          'Priority': report.level === 3 ? 'urgent' : 'high',
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
    if (!isValidFeedback(feedback)) return false;
    const asciiTitle = 'PrakanGuard Citizen Feedback';
    const payload = JSON.stringify(feedback);

    // 1. ส่งขึ้น Supabase Cloud Database
    try {
      const supaBody = JSON.stringify(toSupabaseFeedback(feedback));
      fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: supaBody
      }).catch(err => console.warn('[Supabase Feedback Error]:', err));
    } catch (e) {}

    // 2. Direct Local Admin API Push
    try {
      fetch(`${LOCAL_ADMIN_API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        mode: 'cors'
      }).catch(() => {});
    } catch (e) {}

    // 3. Publish to Cloud Topics (Fallback Pub/Sub)
    try {
      fetch(PRIMARY_FEEDBACK_TOPIC, {
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

    return true;
  } catch (err) {
    console.warn('[CloudSync] publishCloudFeedback warning:', err);
    return false;
  }
}

/**
 * ส่งคำสั่ง Admin Action (เช่น อนุมัติ / ปิดงาน / ลบจุด) เพื่อให้อุปกรณ์อื่นอัปเดตตาม
 */
export async function publishAdminAction(action) {
  try {
    const payload = JSON.stringify(action);
    const asciiTitle = `Admin Action: ${action.type || 'update'}`;

    // Update Supabase Database
    try {
      if (action.type === 'approve' && action.id) {
        fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${encodeURIComponent(action.id)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_approved: true, is_resolved: false })
        }).catch(() => {});
      } else if (action.type === 'resolve' && action.id) {
        fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${encodeURIComponent(action.id)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_resolved: true })
        }).catch(() => {});
      } else if (action.type === 'reject' && action.id) {
        fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${encodeURIComponent(action.id)}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
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

/**
 * ดึงรายงานน้ำท่วม/ลูกเห็บย้อนหลังล่าสุด (ดึงจาก Supabase Cloud + Local API + Fallback)
 */
export async function fetchRecentCloudReports() {
  try {
    const reportMap = new Map();

    // 1. ดึงจาก Supabase Cloud Database เป็นหลัก
    try {
      const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/reports?order=timestamp.desc&limit=60`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        cache: 'no-cache'
      }).catch(() => null);

      if (supaRes && supaRes.ok) {
        const rows = await supaRes.json();
        if (Array.isArray(rows)) {
          rows.forEach(row => {
            const parsed = fromSupabaseReport(row);
            if (isValidReport(parsed)) {
              reportMap.set(parsed.id, parsed);
            }
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
            if (isValidReport(r) && !reportMap.has(r.id)) {
              reportMap.set(r.id, r);
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
    const feedbackMap = new Map();

    // 1. ดึงจาก Supabase Cloud Database เป็นหลัก
    try {
      const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/feedback?order=timestamp.desc&limit=60`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        cache: 'no-cache'
      }).catch(() => null);

      if (supaRes && supaRes.ok) {
        const rows = await supaRes.json();
        if (Array.isArray(rows)) {
          rows.forEach(row => {
            const parsed = fromSupabaseFeedback(row);
            if (isValidFeedback(parsed)) {
              feedbackMap.set(parsed.id, parsed);
            }
          });
        }
      }
    } catch (e) {}

    // 2. ดึงจาก Local Admin API เสริม
    try {
      const localRes = await fetch(`${LOCAL_ADMIN_API}/api/feedback`, { cache: 'no-cache' }).catch(() => null);
      if (localRes && localRes.ok) {
        const localFeedback = await localRes.json();
        if (Array.isArray(localFeedback)) {
          localFeedback.forEach(f => {
            if (isValidFeedback(f) && !feedbackMap.has(f.id)) {
              feedbackMap.set(f.id, f);
            }
          });
        }
      }
    } catch (e) {}

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
 * ส่ง Heartbeat ข้อมูลการเข้าชมเบาๆ ไปยัง Supabase + Admin Server (Non-blocking)
 */
export function sendVisitorTelemetry(district = 'เมืองสมุทรปราการ') {
  if (typeof window === 'undefined') return;
  try {
    let sessionId = sessionStorage.getItem('pg_visitor_sid');
    if (!sessionId) {
      sessionId = 'v-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      sessionStorage.setItem('pg_visitor_sid', sessionId);
    }
    const isMobile = /Mobile|Android|iP(hone|od)/i.test(navigator.userAgent);
    const payload = {
      session_id: sessionId,
      device: isMobile ? 'Mobile' : 'Desktop',
      district: district || 'เมืองสมุทรปราการ',
      page: document.title || 'หน้าหลัก',
      last_ping: new Date().toISOString()
    };

    // 1. ส่งเข้า Supabase visitors (upsert)
    fetch(`${SUPABASE_URL}/rest/v1/visitors`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    }).catch(() => {});

    // 2. ส่งเข้า Local Admin API
    fetch(`${LOCAL_ADMIN_API}/api/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        device: payload.device,
        district: payload.district,
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

  // 3. Subscribe to Admin Actions
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
            if (action && action.type) {
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
