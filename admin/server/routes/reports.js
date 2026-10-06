/**
 * PrakanGuard Admin Command Center - Flood & Hail Reports Routes
 */
const storage = require('../storage');
const { broadcastSSE } = require('../sse');
const { patchSupabaseReport, deleteSupabaseReport } = require('../sync/supabase-sync');
const { publishAdminActionToCloud } = require('../sync/cloud-bridge');

/**
 * Handle Reports Routes
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {import('url').UrlWithParsedQuery} parsedUrl 
 * @param {Function} parseBody 
 * @returns {Promise<boolean>} true if route handled, false otherwise
 */
async function handleReportsRoute(req, res, parsedUrl, parseBody) {
  const { pathname } = parsedUrl;

  // 1. Collection routes: /api/reports
  if (pathname === '/api/reports') {
    if (req.method === 'GET') {
      let filtered = [...storage.reportsCache];
      const status = parsedUrl.query.status;
      const district = parsedUrl.query.district;
      const q = parsedUrl.query.q ? String(parsedUrl.query.q).toLowerCase() : '';

      if (status === 'pending') filtered = filtered.filter(r => !r.isApproved && !r.isResolved);
      if (status === 'approved') filtered = filtered.filter(r => r.isApproved && !r.isResolved);
      if (status === 'resolved') filtered = filtered.filter(r => r.isResolved);
      if (status === 'hail') filtered = filtered.filter(r => r.hazardType === 'hail');

      if (district && district !== 'all') {
        filtered = filtered.filter(r => r.district === district);
      }

      if (q) {
        filtered = filtered.filter(r => 
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.subdistrict && r.subdistrict.toLowerCase().includes(q)) ||
          (r.reporterName && r.reporterName.toLowerCase().includes(q)) ||
          (r.trafficStatus && r.trafficStatus.toLowerCase().includes(q))
        );
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(filtered));
      return true;
    }

    if (req.method === 'POST') {
      const newReport = await parseBody(req);
      if (!newReport.id) {
        newReport.id = 'report-' + Date.now();
      }
      if (!newReport.timestamp) {
        newReport.timestamp = Date.now();
      }
      if (!newReport.reportedAt) {
        const d = new Date();
        newReport.reportedAt = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ' น.';
      }

      // Prepend to list
      storage.reportsCache.unshift(newReport);
      storage.saveReports();
      broadcastSSE('new_report', newReport);

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, report: newReport }));
      return true;
    }
  }

  // 2. Item routes: /api/reports/:id
  const reportIdMatch = pathname.match(/^\/api\/reports\/([^/]+)$/);
  if (reportIdMatch) {
    const reportId = decodeURIComponent(reportIdMatch[1]);
    const idx = storage.reportsCache.findIndex(r => r.id === reportId);

    if (idx === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Report not found' }));
      return true;
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const updates = await parseBody(req);
      storage.reportsCache[idx] = { ...storage.reportsCache[idx], ...updates };
      storage.saveReports();
      broadcastSSE('update_report', storage.reportsCache[idx]);

      // Sync Update to Supabase
      const supaPatch = {};
      if (updates.isApproved !== undefined) supaPatch.is_approved = updates.isApproved;
      if (updates.isResolved !== undefined) supaPatch.is_resolved = updates.isResolved;
      if (updates.trafficStatus !== undefined) supaPatch.traffic_status = updates.trafficStatus;
      if (updates.depthCm !== undefined) supaPatch.depth_cm = updates.depthCm;
      if (updates.level !== undefined) supaPatch.level = updates.level;
      if (Object.keys(supaPatch).length > 0) {
        patchSupabaseReport(reportId, supaPatch);
      }

      // Publish Admin Action to Cloud (e.g. approve/resolve)
      publishAdminActionToCloud({
        type: updates.isApproved ? 'APPROVE_REPORT' : updates.isResolved ? 'RESOLVE_REPORT' : 'UPDATE_REPORT',
        reportId: reportId,
        report: storage.reportsCache[idx],
        timestamp: Date.now()
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, report: storage.reportsCache[idx] }));
      return true;
    }

    if (req.method === 'DELETE') {
      const isPermanent = parsedUrl.query.permanent === 'true';
      const deleted = storage.reportsCache.splice(idx, 1)[0];
      storage.saveReports();

      if (isPermanent) {
        // Delete permanently from Supabase
        deleteSupabaseReport(reportId);

        publishAdminActionToCloud({
          type: 'DELETE_REPORT',
          reportId: reportId,
          timestamp: Date.now()
        });
      } else {
        // Soft delete -> move to Trash
        storage.trashCache.reports.unshift({ ...deleted, deletedAt: new Date().toISOString() });
        storage.saveTrash();
      }

      broadcastSSE('delete_report', { id: reportId, isPermanent });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, deleted, inTrash: !isPermanent }));
      return true;
    }
  }

  return false;
}

module.exports = {
  handleReportsRoute
};
