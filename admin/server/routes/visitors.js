/**
 * PrakanGuard Admin Command Center - Visitor & Telemetry Routes
 */
const storage = require('../storage');
const { cleanAndCountActiveVisitors, recordHeartbeat } = require('../presence');

/**
 * Handle Visitor Routes
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 * @param {import('url').UrlWithParsedQuery} parsedUrl 
 * @param {Function} parseBody 
 * @returns {Promise<boolean>}
 */
async function handleVisitorsRoute(req, res, parsedUrl, parseBody) {
  const { pathname } = parsedUrl;

  // 1. Visitor Telemetry & Heartbeat API
  if (pathname === '/api/heartbeat' && req.method === 'POST') {
    const payload = await parseBody(req);
    const remoteAddress = req.socket ? req.socket.remoteAddress : '127.0.0.1';
    const { sessionId, activeCount } = recordHeartbeat(payload, req.headers, remoteAddress);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, sessionId, activeCount }));
    return true;
  }

  // 2. Visitor Analytics Overview
  if (pathname === '/api/visitors' && req.method === 'GET') {
    cleanAndCountActiveVisitors();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(storage.visitorsCache));
    return true;
  }

  return false;
}

module.exports = {
  handleVisitorsRoute
};
