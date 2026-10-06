/**
 * PrakanGuard Admin Command Center - Statistics & Server Status Routes
 */
const {
  CLOUD_REPORTS_TOPICS,
  CLOUD_FEEDBACK_TOPICS
} = require('../config');
const storage = require('../storage');
const { cleanAndCountActiveVisitors } = require('../presence');
const { syncFromCloud } = require('../sync/cloud-bridge');

/**
 * Handle Stats & Utility Routes
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {import('url').UrlWithParsedQuery} parsedUrl 
 * @returns {Promise<boolean>}
 */
async function handleStatsRoute(req, res, parsedUrl) {
  const { pathname } = parsedUrl;

  // 1. Server Status
  if (pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'online',
      version: '1.0.0',
      uptimeSec: Math.round(process.uptime()),
      serverTime: new Date().toISOString(),
      cloudSync: {
        connected: true,
        reportTopic: CLOUD_REPORTS_TOPICS[0] || '',
        feedbackTopic: CLOUD_FEEDBACK_TOPICS[0] || ''
      }
    }));
    return true;
  }

  // 2. Comprehensive Statistics
  if (pathname === '/api/stats' && req.method === 'GET') {
    cleanAndCountActiveVisitors();
    const pendingReports = storage.reportsCache.filter(r => !r.isApproved && !r.isResolved).length;
    const approvedReports = storage.reportsCache.filter(r => r.isApproved && !r.isResolved).length;
    const resolvedReports = storage.reportsCache.filter(r => r.isResolved).length;
    const hailReports = storage.reportsCache.filter(r => r.hazardType === 'hail').length;
    const unreadFeedback = storage.feedbackCache.filter(f => !f.isRead).length;

    const avgRating = storage.feedbackCache.length > 0 
      ? (storage.feedbackCache.reduce((acc, f) => acc + (f.rating || 5), 0) / storage.feedbackCache.length).toFixed(1)
      : '5.0';

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      reports: {
        total: storage.reportsCache.length,
        pending: pendingReports,
        approved: approvedReports,
        resolved: resolvedReports,
        hail: hailReports,
        flood: storage.reportsCache.length - hailReports
      },
      feedback: {
        total: storage.feedbackCache.length,
        unread: unreadFeedback,
        read: storage.feedbackCache.length - unreadFeedback,
        avgRating: Number(avgRating)
      },
      visitors: {
        activeNow: storage.visitorsCache.summary.activeNow || 1,
        totalToday: storage.visitorsCache.summary.totalVisitorsToday,
        totalAllTime: storage.visitorsCache.summary.totalVisitorsAllTime,
        peakToday: storage.visitorsCache.summary.peakOnlineToday,
        devices: storage.visitorsCache.deviceBreakdown,
        districts: storage.visitorsCache.districtBreakdown
      }
    }));
    return true;
  }

  // 3. Manual Cloud Sync
  if (pathname === '/api/cloud-sync' && req.method === 'POST') {
    await syncFromCloud();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      reportsCount: storage.reportsCache.length,
      feedbackCount: storage.feedbackCache.length
    }));
    return true;
  }

  return false;
}

module.exports = {
  handleStatsRoute
};
