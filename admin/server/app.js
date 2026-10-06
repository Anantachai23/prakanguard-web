/**
 * PrakanGuard Admin Command Center - Main Server Application
 * 
 * 100% Native Node.js - Zero external npm dependencies
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const {
  ADMIN_DIR,
  PORT,
  MIME_TYPES
} = require('./config');

const storage = require('./storage');
const { sseClients, broadcastSSE, addClient, removeClient } = require('./sse');
const { activeSessions, cleanAndCountActiveVisitors } = require('./presence');
const { syncFromCloud } = require('./sync/cloud-bridge');

const { handleReportsRoute } = require('./routes/reports');
const { handleFeedbackRoute } = require('./routes/feedback');
const { handleTrashRoute } = require('./routes/trash');
const { handleVisitorsRoute } = require('./routes/visitors');
const { handleStatsRoute } = require('./routes/stats');

/**
 * Helper to parse JSON request body
 * @param {http.IncomingMessage} req 
 * @returns {Promise<any>}
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString('utf-8');
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

/**
 * Serve static files with SPA fallback
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 * @param {string} pathname 
 */
function serveStatic(req, res, pathname) {
  let filePath = path.join(ADMIN_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(ADMIN_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  // Handle compatibility alias for visitor-tracker.js moved to scripts/
  if (pathname === '/visitor-tracker.js' && !fs.existsSync(filePath)) {
    const scriptsPath = path.join(ADMIN_DIR, 'scripts', 'visitor-tracker.js');
    if (fs.existsSync(scriptsPath)) {
      filePath = scriptsPath;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      filePath = path.join(ADMIN_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
}

/**
 * Create and configure HTTP Server
 */
function createServer() {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS & Private Network Access (PNA) Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      res.writeHead(204);
      res.end();
      return;
    }

    // --- API ROUTES ---

    // Server-Sent Events (SSE) Live Feed
    if (pathname === '/api/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('retry: 5000\n\n');
      res.write(`event: connected\ndata: {"message": "Admin SSE stream established", "timestamp": ${Date.now()}}\n\n`);

      addClient(res);

      req.on('close', () => {
        removeClient(res);
      });
      return;
    }

    try {
      // 1. Stats and Status Routes
      if (await handleStatsRoute(req, res, parsedUrl)) return;

      // 2. Reports Routes
      if (await handleReportsRoute(req, res, parsedUrl, parseBody)) return;

      // 3. Feedback Routes
      if (await handleFeedbackRoute(req, res, parsedUrl, parseBody)) return;

      // 4. Trash Routes
      if (await handleTrashRoute(req, res, parsedUrl, parseBody)) return;

      // 5. Visitors & Heartbeat Routes
      if (await handleVisitorsRoute(req, res, parsedUrl, parseBody)) return;
    } catch (routeErr) {
      console.error('[Admin Server] Route error:', routeErr);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: routeErr.message }));
      return;
    }

    // --- STATIC FILE SERVING ---
    serveStatic(req, res, pathname);
  });

  return server;
}

/**
 * Start Server and Background Synchronization Tasks
 */
function startServer() {
  // 1. Initialize Cache
  storage.loadData(activeSessions);

  // 2. Start Cloud Poller (every 60 seconds - safe against rate limits)
  setInterval(syncFromCloud, 60000);
  syncFromCloud(); // initial poll

  // 3. Start Visitor Cleanup Tracker (every 15 seconds)
  setInterval(() => {
    const count = cleanAndCountActiveVisitors();
    broadcastSSE('visitor_update', {
      activeNow: count,
      summary: storage.visitorsCache.summary,
      recentSessions: storage.visitorsCache.recentSessions
    });
  }, 15000);

  // 4. Create and Listen HTTP Server
  const server = createServer();

  server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================================');
    console.log('  🛡️ PRAKANGUARD ADMIN COMMAND CENTER SERVER');
    console.log('  ระบบบริหารจัดการแอดมิน ศูนย์ข้อมูลอุทกภัยสมุทรปราการ');
    console.log('========================================================');
    console.log(`  🌐 Server running at: http://localhost:${PORT}`);
    console.log(`  📡 Cloud Sync Bridge: Active (Supabase & ntfy.sh)`);
    console.log(`  📁 Storage: Persistent JSON in ./data/`);
    console.log('========================================================');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = PORT + 1;
      console.warn(`[Admin Server] Port ${PORT} is in use, trying port ${nextPort}...`);
      server.listen(nextPort, '0.0.0.0');
    } else {
      console.error('[Admin Server] Server error:', err);
    }
  });

  return server;
}

module.exports = {
  createServer,
  startServer
};
