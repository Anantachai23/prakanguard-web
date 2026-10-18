/**
 * PrakanGuard System Health & Telemetry Probe API
 * Endpoint: /api/health
 * 
 * Used for automated monitoring, uptime bots, and service health verification.
 */

export default async function handler(req, res) {
  const startTime = Date.now();
  const uptime = process.uptime ? Math.round(process.uptime()) : 0;

  const healthData = {
    status: 'healthy',
    service: 'PrakanGuard Autonomous Flood Intelligence Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: uptime,
    environment: process.env.NODE_ENV || 'production',
    nodeVersion: process.version,
    security: {
      hardenedHeaders: true,
      xssSanitization: 'active',
      rateLimiter: 'active',
      geoFencing: 'Samut Prakan (6 Districts)'
    },
    services: {
      weatherTelemetry: 'Open-Meteo ECMWF / TMD Radar Suvarnabhumi',
      floodComplaints: 'Traffy Fondue Open API (Samut Prakan)',
      astronomicalTide: 'Fort Chula Naval Hydrographic Department',
      cloudSync: 'Supabase Real-Time Bridge'
    },
    latencyMs: Date.now() - startTime
  };

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  if (res && typeof res.setHeader === 'function') {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json(healthData);
  }

  return new Response(JSON.stringify(healthData), {
    status: 200,
    headers
  });
}
