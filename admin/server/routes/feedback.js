/**
 * PrakanGuard Admin Command Center - Citizen Feedback Routes
 */
const storage = require('../storage');
const { broadcastSSE } = require('../sse');
const { patchSupabaseFeedback, deleteSupabaseFeedback } = require('../sync/supabase-sync');

/**
 * Handle Feedback Routes
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {import('url').UrlWithParsedQuery} parsedUrl 
 * @param {Function} parseBody 
 * @returns {Promise<boolean>}
 */
async function handleFeedbackRoute(req, res, parsedUrl, parseBody) {
  const { pathname } = parsedUrl;

  // Mark all feedback read (both path variants)
  if ((pathname === '/api/feedback/mark-all-read' || pathname === '/api/feedback-mark-all-read') && req.method === 'POST') {
    storage.feedbackCache.forEach(f => { f.isRead = true; });
    storage.saveFeedback();
    broadcastSSE('all_feedback_read', { count: storage.feedbackCache.length });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true }));
    return true;
  }

  // Collection routes: /api/feedback
  if (pathname === '/api/feedback') {
    if (req.method === 'GET') {
      let filtered = [...storage.feedbackCache];
      const status = parsedUrl.query.status;
      const category = parsedUrl.query.category;
      const q = parsedUrl.query.q ? String(parsedUrl.query.q).toLowerCase() : '';

      if (status === 'unread') filtered = filtered.filter(f => !f.isRead);
      if (status === 'read') filtered = filtered.filter(f => f.isRead);
      if (category && category !== 'all') filtered = filtered.filter(f => f.category === category);

      if (q) {
        filtered = filtered.filter(f => 
          (f.message && f.message.toLowerCase().includes(q)) ||
          (f.senderName && f.senderName.toLowerCase().includes(q)) ||
          (f.contact && f.contact.toLowerCase().includes(q))
        );
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(filtered));
      return true;
    }

    if (req.method === 'POST') {
      const newFeedback = await parseBody(req);
      if (!newFeedback.id) newFeedback.id = 'fb-' + Date.now();
      if (!newFeedback.timestamp) newFeedback.timestamp = Date.now();
      newFeedback.isRead = false;

      storage.feedbackCache.unshift(newFeedback);
      storage.saveFeedback();
      broadcastSSE('new_feedback', newFeedback);

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, feedback: newFeedback }));
      return true;
    }
  }

  // Item routes: /api/feedback/:id
  const feedbackIdMatch = pathname.match(/^\/api\/feedback\/([^/]+)$/);
  if (feedbackIdMatch) {
    const feedbackId = decodeURIComponent(feedbackIdMatch[1]);
    const idx = storage.feedbackCache.findIndex(f => f.id === feedbackId);

    if (idx === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Feedback not found' }));
      return true;
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const updates = await parseBody(req);
      storage.feedbackCache[idx] = { ...storage.feedbackCache[idx], ...updates };
      storage.saveFeedback();
      broadcastSSE('update_feedback', storage.feedbackCache[idx]);

      // Sync Update to Supabase
      const fbPatch = {};
      if (updates.isRead !== undefined) fbPatch.is_read = updates.isRead;
      if (updates.adminNote !== undefined) fbPatch.admin_note = updates.adminNote;
      if (Object.keys(fbPatch).length > 0) {
        patchSupabaseFeedback(feedbackId, fbPatch);
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, feedback: storage.feedbackCache[idx] }));
      return true;
    }

    if (req.method === 'DELETE') {
      const isPermanent = parsedUrl.query.permanent === 'true';
      const deleted = storage.feedbackCache.splice(idx, 1)[0];
      storage.saveFeedback();

      if (isPermanent) {
        // Delete from Supabase
        deleteSupabaseFeedback(feedbackId);
      } else {
        // Soft delete -> move to Trash
        storage.trashCache.feedback.unshift({ ...deleted, deletedAt: new Date().toISOString() });
        storage.saveTrash();
      }

      broadcastSSE('delete_feedback', { id: feedbackId, isPermanent });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, deleted, inTrash: !isPermanent }));
      return true;
    }
  }

  return false;
}

module.exports = {
  handleFeedbackRoute
};
