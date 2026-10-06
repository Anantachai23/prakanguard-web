/**
 * PrakanGuard Admin Command Center - Data Storage & In-Memory Cache
 */
const fs = require('fs');
const {
  DATA_DIR,
  REPORTS_FILE,
  FEEDBACK_FILE,
  VISITORS_FILE,
  TRASH_FILE
} = require('./config');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory Storage Cache (synced with disk)
let reportsCache = [];
let feedbackCache = [];
let trashCache = { reports: [], feedback: [] };
let visitorsCache = {
  summary: {
    totalVisitorsAllTime: 14250,
    totalVisitorsToday: 348,
    peakOnlineToday: 42,
    activeNow: 8,
    lastUpdated: new Date().toISOString()
  },
  deviceBreakdown: { mobile: 72, desktop: 23, tablet: 5 },
  districtBreakdown: {
    "เมืองสมุทรปราการ": 128,
    "บางพลี": 94,
    "พระประแดง": 56,
    "บางบ่อ": 32,
    "พระสมุทรเจดีย์": 22,
    "บางเสาธง": 16
  },
  recentSessions: []
};

// Load data safely from JSON files
function loadData(activeSessionsMap) {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      reportsCache = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[Admin Server] Error loading reports.json:', err.message);
  }

  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      feedbackCache = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('[Admin Server] Error loading feedback.json:', err.message);
  }

  try {
    if (fs.existsSync(VISITORS_FILE)) {
      visitorsCache = JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf-8'));
      if (activeSessionsMap && Array.isArray(visitorsCache.recentSessions)) {
        visitorsCache.recentSessions.forEach(s => {
          if (s.sessionId) {
            activeSessionsMap.set(s.sessionId, {
              sessionId: s.sessionId,
              ip: s.ipMasked || '127.0.0.1',
              device: s.device || 'Mobile',
              district: s.district || 'เมืองสมุทรปราการ',
              page: s.currentPage || 'หน้าหลัก',
              lastPing: Date.now() - (s.durationSec ? s.durationSec * 100 : 10000)
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('[Admin Server] Error loading visitors.json:', err.message);
  }

  try {
    if (fs.existsSync(TRASH_FILE)) {
      trashCache = JSON.parse(fs.readFileSync(TRASH_FILE, 'utf-8'));
      if (!Array.isArray(trashCache.reports)) trashCache.reports = [];
      if (!Array.isArray(trashCache.feedback)) trashCache.feedback = [];
    }
  } catch (err) {
    console.error('[Admin Server] Error loading trash.json:', err.message);
  }
}

function saveReports() {
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reportsCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Admin Server] Error saving reports.json:', err.message);
  }
}

function saveFeedback() {
  try {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbackCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Admin Server] Error saving feedback.json:', err.message);
  }
}

function saveVisitors() {
  try {
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitorsCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Admin Server] Error saving visitors.json:', err.message);
  }
}

function saveTrash() {
  try {
    fs.writeFileSync(TRASH_FILE, JSON.stringify(trashCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Admin Server] Error saving trash.json:', err.message);
  }
}

module.exports = {
  get reportsCache() { return reportsCache; },
  set reportsCache(val) { reportsCache = val; },
  get feedbackCache() { return feedbackCache; },
  set feedbackCache(val) { feedbackCache = val; },
  get trashCache() { return trashCache; },
  set trashCache(val) { trashCache = val; },
  get visitorsCache() { return visitorsCache; },
  set visitorsCache(val) { visitorsCache = val; },
  loadData,
  saveReports,
  saveFeedback,
  saveVisitors,
  saveTrash
};
