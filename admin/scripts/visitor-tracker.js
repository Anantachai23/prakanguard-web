/**
 * PrakanGuard Visitor Telemetry Beacon (Optional Standalone Script)
 * Sends lightweight, privacy-preserving heartbeat to Admin Server
 */
(function() {
  if (typeof window === 'undefined') return;

  const ADMIN_API = 'http://localhost:4000/api/heartbeat';
  const CLOUD_PRESENCE = 'https://ntfy.sh/prakanguard_live_presence_v4_spk';

  // Persistent anonymous session ID for this browser tab
  let sessionId = sessionStorage.getItem('pg_visitor_sid');
  if (!sessionId) {
    sessionId = 'v-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
    sessionStorage.setItem('pg_visitor_sid', sessionId);
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'Mobile';
    return 'Desktop';
  }

  function sendHeartbeat() {
    const payload = {
      sessionId: sessionId,
      device: getDeviceType(),
      district: window.__prakanguard_current_district || 'เมืองสมุทรปราการ',
      page: document.title || 'หน้าแรก',
      timestamp: Date.now()
    };

    // 1. Send to local/network admin server if accessible
    fetch(ADMIN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors'
    }).catch(() => {
      // 2. Fallback to Cloud Presence topic if admin server is on different network
      fetch(CLOUD_PRESENCE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    });
  }

  // Initial heartbeat
  setTimeout(sendHeartbeat, 1000);

  // Periodic heartbeat every 30 seconds
  setInterval(sendHeartbeat, 30000);

  // Send on visibility change
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  });
})();
