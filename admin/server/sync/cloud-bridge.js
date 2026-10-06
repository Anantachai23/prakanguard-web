/**
 * PrakanGuard Admin Command Center - Ntfy Cloud Bridge & Pub/Sub
 */
const {
  CLOUD_REPORTS_TOPICS,
  CLOUD_FEEDBACK_TOPICS,
  CLOUD_ACTIONS_TOPIC
} = require('../config');
const storage = require('../storage');
const { broadcastSSE } = require('../sse');
const { syncSupabase } = require('./supabase-sync');

// Helper to HTTP GET from external URL (Node 18+ has fetch)
async function fetchCloudData(endpoint) {
  if (typeof fetch === 'function') {
    const res = await fetch(`${endpoint}/json?poll=1&since=all`, { cache: 'no-cache' });
    if (!res.ok) return [];
    const text = await res.text();
    return parseNtfyNdjson(text);
  }
  return [];
}

function parseNtfyNdjson(text) {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split('\n');
  const items = [];
  for (const line of lines) {
    if (!line) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.event === 'message') {
        let parsed = null;
        if (entry.message) {
          try { parsed = JSON.parse(entry.message); } catch {}
        }
        if (parsed && typeof parsed === 'object') {
          items.push(parsed);
        }
      }
    } catch {}
  }
  return items;
}

// Background Cloud Synchronization across all topics + Supabase
async function syncFromCloud() {
  try {
    // 1. Primary Sync from Supabase Cloud Database
    await syncSupabase();

    // 2. Secondary Sync from Ntfy Cloud Topics
    const reportPromises = CLOUD_REPORTS_TOPICS.map(t => fetchCloudData(t).catch(() => []));
    const feedbackPromises = CLOUD_FEEDBACK_TOPICS.map(t => fetchCloudData(t).catch(() => []));

    const allReportsNested = await Promise.all(reportPromises);
    const allFeedbackNested = await Promise.all(feedbackPromises);

    const cloudReports = allReportsNested.flat();
    const cloudFeedback = allFeedbackNested.flat();

    let reportsChanged = false;
    let feedbackChanged = false;

    // Merge Cloud Reports
    cloudReports.forEach(cr => {
      if (cr && cr.id) {
        const idx = storage.reportsCache.findIndex(r => r.id === cr.id);
        if (idx === -1) {
          storage.reportsCache.unshift(cr);
          reportsChanged = true;
          broadcastSSE('new_report', cr);
        }
      }
    });

    // Merge Cloud Feedback
    cloudFeedback.forEach(cf => {
      if (cf && cf.id) {
        const idx = storage.feedbackCache.findIndex(f => f.id === cf.id);
        if (idx === -1) {
          storage.feedbackCache.unshift(cf);
          feedbackChanged = true;
          broadcastSSE('new_feedback', cf);
        }
      }
    });

    if (reportsChanged) storage.saveReports();
    if (feedbackChanged) storage.saveFeedback();
  } catch (err) {
    // Silently continue
  }
}

// Publish Admin Action back to Cloud so Citizen Maps update
async function publishAdminActionToCloud(action) {
  try {
    if (typeof fetch === 'function') {
      await fetch(CLOUD_ACTIONS_TOPIC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(action)
      });
    }
  } catch {}
}

module.exports = {
  fetchCloudData,
  parseNtfyNdjson,
  syncFromCloud,
  publishAdminActionToCloud
};
