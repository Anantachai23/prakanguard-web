/**
 * PrakanGuard Admin Command Center - Standalone Backend Server & Cloud Bridge
 * 
 * 100% Native Node.js - No external npm dependencies required
 * Supports:
 * - REST API (Reports, Feedback, Visitors, Stats, Trash)
 * - Server-Sent Events (SSE) for zero-latency live updates to Admin UI
 * - Automatic 24/7 Cloud Bridge to Supabase & ntfy.sh
 * - Real-time Visitor Presence & Telemetry Heartbeats
 * - Persistent JSON File Storage in /data/
 */

const { startServer } = require('./server/app');

startServer();
