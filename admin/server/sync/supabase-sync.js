/**
 * PrakanGuard Admin Command Center - Supabase Database Synchronization
 */
const { SUPABASE_URL, SUPABASE_KEY } = require('../config');
const storage = require('../storage');
const { broadcastSSE } = require('../sse');
const { activeSessions } = require('../presence');

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

// Background Synchronization from Supabase Cloud Database
async function syncSupabase() {
  try {
    const [repRes, fbRes, visRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/reports?order=timestamp.desc&limit=100`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/feedback?order=timestamp.desc&limit=100`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/visitors?order=last_ping.desc&limit=50`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      }).catch(() => null)
    ]);

    let repChanged = false;
    let fbChanged = false;

    if (repRes && repRes.ok) {
      const rows = await repRes.json();
      if (Array.isArray(rows)) {
        rows.forEach(row => {
          const rep = fromSupabaseReport(row);
          const idx = storage.reportsCache.findIndex(r => r.id === rep.id);
          if (idx === -1) {
            storage.reportsCache.unshift(rep);
            repChanged = true;
            broadcastSSE('new_report', rep);
          } else {
            if (storage.reportsCache[idx].isApproved !== rep.isApproved || storage.reportsCache[idx].isResolved !== rep.isResolved) {
              storage.reportsCache[idx] = { ...storage.reportsCache[idx], isApproved: rep.isApproved, isResolved: rep.isResolved };
              repChanged = true;
            }
          }
        });
      }
    }

    if (fbRes && fbRes.ok) {
      const rows = await fbRes.json();
      if (Array.isArray(rows)) {
        rows.forEach(row => {
          const fb = fromSupabaseFeedback(row);
          const idx = storage.feedbackCache.findIndex(f => f.id === fb.id);
          if (idx === -1) {
            storage.feedbackCache.unshift(fb);
            fbChanged = true;
            broadcastSSE('new_feedback', fb);
          } else {
            if (storage.feedbackCache[idx].isRead !== fb.isRead || storage.feedbackCache[idx].adminNote !== fb.adminNote) {
              storage.feedbackCache[idx] = { ...storage.feedbackCache[idx], isRead: fb.isRead, adminNote: fb.adminNote };
              fbChanged = true;
            }
          }
        });
      }
    }

    if (visRes && visRes.ok) {
      const visitorsRows = await visRes.json();
      if (Array.isArray(visitorsRows) && visitorsRows.length > 0) {
        visitorsRows.forEach(v => {
          if (v.session_id) {
            const lastPingTime = new Date(v.last_ping).getTime() || Date.now();
            activeSessions.set(v.session_id, {
              sessionId: v.session_id,
              device: v.device || 'Mobile',
              district: v.district || 'เมืองสมุทรปราการ',
              page: v.page || 'หน้าหลัก',
              lastPing: lastPingTime,
              startTime: lastPingTime
            });
          }
        });
      }
    }

    if (repChanged) storage.saveReports();
    if (fbChanged) storage.saveFeedback();
  } catch (e) {}
}

async function patchSupabaseReport(reportId, supaPatch) {
  try {
    if (Object.keys(supaPatch).length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(supaPatch)
      }).catch(() => {});
    }
  } catch (e) {}
}

async function deleteSupabaseReport(reportId) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${encodeURIComponent(reportId)}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }).catch(() => {});
  } catch (e) {}
}

async function patchSupabaseFeedback(feedbackId, fbPatch) {
  try {
    if (Object.keys(fbPatch).length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/feedback?id=eq.${encodeURIComponent(feedbackId)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fbPatch)
      }).catch(() => {});
    }
  } catch (e) {}
}

async function deleteSupabaseFeedback(feedbackId) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/feedback?id=eq.${encodeURIComponent(feedbackId)}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    }).catch(() => {});
  } catch (e) {}
}

module.exports = {
  fromSupabaseReport,
  fromSupabaseFeedback,
  syncSupabase,
  patchSupabaseReport,
  deleteSupabaseReport,
  patchSupabaseFeedback,
  deleteSupabaseFeedback
};
