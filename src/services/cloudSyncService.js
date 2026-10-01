// บริการ Cloud Real-time Sync ข้ามอุปกรณ์สำหรับ Prakanguard
// รองรับการส่งรายงานน้ำท่วม/ลูกเห็บ และข้อเสนอแนะจากมือถือหรืออุปกรณ์อื่นเข้ามาที่แอดมินทันที
// ใช้ HTTP API & Server-Sent Events (SSE) ข้ามเครือข่ายได้ 100% โดยไม่ต้องพึ่ง LocalStorage เพียงอย่างเดียว

const REPORTS_TOPIC_URL = 'https://ntfy.sh/prakanguard_sync_reports_spk_2026';
const FEEDBACK_TOPIC_URL = 'https://ntfy.sh/prakanguard_sync_feedback_spk_2026';
const ACTIONS_TOPIC_URL = 'https://ntfy.sh/prakanguard_sync_actions_spk_2026';

/**
 * ส่งรายงานน้ำท่วมหรือลูกเห็บขึ้น Cloud
 */
export async function publishCloudReport(report) {
  try {
    const isHail = report.hazardType === 'hail';
    const title = isHail 
      ? `🧊 รายงานลูกเห็บตก: ${report.name || 'ไม่ระบุชื่อจุด'}`
      : `🌊 รายงานน้ำท่วมใหม่: ${report.name || 'ไม่ระบุชื่อจุด'}`;
    
    // To ensure payload is within limits, omit massive base64 if too large or keep compressed preview
    const payload = JSON.stringify(report);

    const res = await fetch(REPORTS_TOPIC_URL, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': report.level === 3 ? 'urgent' : 'high',
        'Tags': isHail ? 'ice_cube,cloud_with_rain' : 'droplet,warning'
      },
      body: payload
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] publishCloudReport warning:', err);
    return false;
  }
}

/**
 * ส่งข้อเสนอแนะหรือข้อติชมขึ้น Cloud
 */
export async function publishCloudFeedback(feedback) {
  try {
    const title = `💬 ข้อเสนอแนะใหม่ (${feedback.categoryLabel || 'ทั่วไป'}) จาก ${feedback.senderName || 'ประชาชน'}`;
    const payload = JSON.stringify(feedback);

    const res = await fetch(FEEDBACK_TOPIC_URL, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': 'default',
        'Tags': 'speech_balloon,star'
      },
      body: payload
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] publishCloudFeedback warning:', err);
    return false;
  }
}

/**
 * ส่งคำสั่ง Admin Action (เช่น อนุมัติ / ปิดงาน / ลบจุด) เพื่อให้เครื่องอื่นอัปเดตตาม
 */
export async function publishAdminAction(action) {
  try {
    const payload = JSON.stringify(action);
    const res = await fetch(ACTIONS_TOPIC_URL, {
      method: 'POST',
      headers: {
        'Title': `🛡️ Admin Action: ${action.type}`,
        'Tags': 'shield,gear'
      },
      body: payload
    });
    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] publishAdminAction warning:', err);
    return false;
  }
}

/**
 * ดึงรายงานน้ำท่วม/ลูกเห็บย้อนหลังล่าสุดจาก Cloud
 */
export async function fetchRecentCloudReports() {
  try {
    const res = await fetch(`${REPORTS_TOPIC_URL}/json?poll=1`, { cache: 'no-cache' });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split('\n');
    const reports = [];

    for (const line of lines) {
      if (!line) continue;
      try {
        const item = JSON.parse(line);
        if (item.event === 'message' && item.message) {
          const report = JSON.parse(item.message);
          if (report && report.id) {
            reports.push(report);
          }
        }
      } catch (e) {
        // Skip invalid line
      }
    }
    return reports;
  } catch (err) {
    console.warn('[CloudSync] fetchRecentCloudReports warning:', err);
    return [];
  }
}

/**
 * ดึงข้อเสนอแนะล่าสุดจาก Cloud
 */
export async function fetchRecentCloudFeedback() {
  try {
    const res = await fetch(`${FEEDBACK_TOPIC_URL}/json?poll=1`, { cache: 'no-cache' });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split('\n');
    const feedbacks = [];

    for (const line of lines) {
      if (!line) continue;
      try {
        const item = JSON.parse(line);
        if (item.event === 'message' && item.message) {
          const feedback = JSON.parse(item.message);
          if (feedback && feedback.id) {
            feedbacks.push(feedback);
          }
        }
      } catch (e) {
        // Skip invalid line
      }
    }
    return feedbacks;
  } catch (err) {
    console.warn('[CloudSync] fetchRecentCloudFeedback warning:', err);
    return [];
  }
}

/**
 * สมัครรับเหตุการณ์แบบ Real-time ข้ามอุปกรณ์ผ่าน Server-Sent Events (SSE)
 */
export function subscribeToCloudEvents({ onNewReport, onNewFeedback, onAdminAction }) {
  const eventSources = [];

  // 1. Subscribe to Citizen Flood & Hail Reports
  if (onNewReport && typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const reportsSource = new EventSource(`${REPORTS_TOPIC_URL}/sse`);
      reportsSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.event === 'message' && data.message) {
            const report = JSON.parse(data.message);
            if (report && report.id) {
              onNewReport(report);
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      };
      eventSources.push(reportsSource);
    } catch (e) {
      console.warn('[CloudSync] Report EventSource error:', e);
    }
  }

  // 2. Subscribe to Feedback & Suggestions
  if (onNewFeedback && typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const feedbackSource = new EventSource(`${FEEDBACK_TOPIC_URL}/sse`);
      feedbackSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.event === 'message' && data.message) {
            const feedback = JSON.parse(data.message);
            if (feedback && feedback.id) {
              onNewFeedback(feedback);
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      };
      eventSources.push(feedbackSource);
    } catch (e) {
      console.warn('[CloudSync] Feedback EventSource error:', e);
    }
  }

  // 3. Subscribe to Admin Actions (e.g. approve/resolve/delete sync)
  if (onAdminAction && typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const actionsSource = new EventSource(`${ACTIONS_TOPIC_URL}/sse`);
      actionsSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.event === 'message' && data.message) {
            const action = JSON.parse(data.message);
            if (action && action.type) {
              onAdminAction(action);
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      };
      eventSources.push(actionsSource);
    } catch (e) {
      console.warn('[CloudSync] Action EventSource error:', e);
    }
  }

  // Return cleanup function to close all SSE streams
  return () => {
    eventSources.forEach(es => {
      try {
        es.close();
      } catch (err) {}
    });
  };
}
