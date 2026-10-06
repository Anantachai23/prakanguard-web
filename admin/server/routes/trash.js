/**
 * PrakanGuard Admin Command Center - Trash & Recovery Routes
 */
const storage = require('../storage');
const { broadcastSSE } = require('../sse');

/**
 * Handle Trash Routes
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {import('url').UrlWithParsedQuery} parsedUrl 
 * @param {Function} parseBody 
 * @returns {Promise<boolean>}
 */
async function handleTrashRoute(req, res, parsedUrl, parseBody) {
  const { pathname } = parsedUrl;

  if (pathname === '/api/trash') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(storage.trashCache));
      return true;
    }
    if (req.method === 'DELETE') {
      // Empty entire trash
      storage.trashCache.reports = [];
      storage.trashCache.feedback = [];
      storage.saveTrash();
      broadcastSSE('empty_trash', {});
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: 'Trash emptied' }));
      return true;
    }
  }

  if (pathname === '/api/trash/restore' && req.method === 'POST') {
    const body = await parseBody(req);
    const { type, id } = body;
    if (type === 'report') {
      const tIdx = storage.trashCache.reports.findIndex(r => r.id === id);
      if (tIdx !== -1) {
        const restored = storage.trashCache.reports.splice(tIdx, 1)[0];
        delete restored.deletedAt;
        storage.reportsCache.unshift(restored);
        storage.saveReports();
        storage.saveTrash();
        broadcastSSE('new_report', restored);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, restored }));
        return true;
      }
    } else if (type === 'feedback') {
      const tIdx = storage.trashCache.feedback.findIndex(f => f.id === id);
      if (tIdx !== -1) {
        const restored = storage.trashCache.feedback.splice(tIdx, 1)[0];
        delete restored.deletedAt;
        storage.feedbackCache.unshift(restored);
        storage.saveFeedback();
        storage.saveTrash();
        broadcastSSE('new_feedback', restored);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, restored }));
        return true;
      }
    }
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Item not found in trash' }));
    return true;
  }

  const trashItemMatch = pathname.match(/^\/api\/trash\/(reports|feedback)\/([^/]+)$/);
  if (trashItemMatch && req.method === 'DELETE') {
    const itemType = trashItemMatch[1];
    const itemId = decodeURIComponent(trashItemMatch[2]);
    if (itemType === 'reports') {
      storage.trashCache.reports = storage.trashCache.reports.filter(r => r.id !== itemId);
    } else {
      storage.trashCache.feedback = storage.trashCache.feedback.filter(f => f.id !== itemId);
    }
    storage.saveTrash();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true }));
    return true;
  }

  return false;
}

module.exports = {
  handleTrashRoute
};
