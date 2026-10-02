// บริการ Cloud Real-time Sync ข้ามอุปกรณ์สำหรับ Prakanguard
// รองรับการส่งและรับรายงานน้ำท่วม/ลูกเห็บ และข้อเสนอแนะจากมือถือหรืออุปกรณ์อื่นเข้ามาที่แอดมิน 100%
// ใช้ Multi-Topic Fallback, HTTP Polling with since=all, Auto Attachment Resolver & Server-Sent Events (SSE)

const PRIMARY_REPORTS_TOPIC = 'https://ntfy.sh/prakanguard_live_reports_v4_spk';
const FALLBACK_REPORTS_TOPIC = 'https://ntfy.sh/prakanguard_live_reports_v3_spk';

const PRIMARY_FEEDBACK_TOPIC = 'https://ntfy.sh/prakanguard_live_feedback_v4_spk';
const FALLBACK_FEEDBACK_TOPIC = 'https://ntfy.sh/prakanguard_live_feedback_v3_spk';

const PRIMARY_ACTIONS_TOPIC = 'https://ntfy.sh/prakanguard_live_actions_v4_spk';
const FALLBACK_ACTIONS_TOPIC = 'https://ntfy.sh/prakanguard_live_actions_v3_spk';

/**
 * ตรวจสอบความถูกต้องของพิกัดและข้อมูลรายงาน เพื่อป้องกันข้อผิดพลาดแผนที่
 */
export function isValidReport(r) {
  return (
    r &&
    typeof r === 'object' &&
    typeof r.id === 'string' &&
    r.id.trim().length > 0 &&
    typeof r.lat === 'number' &&
    !isNaN(r.lat) &&
    typeof r.lng === 'number' &&
    !isNaN(r.lng) &&
    r.lat >= 13.0 && r.lat <= 14.5 &&
    r.lng >= 100.0 && r.lng <= 101.5
  );
}

export function isValidFeedback(f) {
  return (
    f &&
    typeof f === 'object' &&
    typeof f.id === 'string' &&
    typeof f.message === 'string' &&
    f.message.trim().length > 0
  );
}

/**
 * ส่งรายงานน้ำท่วมหรือลูกเห็บขึ้น Cloud
 */
export async function publishCloudReport(report) {
  try {
    if (!isValidReport(report)) {
      console.warn('[CloudSync] Report missing valid coordinates, skipping publish:', report);
      return false;
    }
    const isHail = report.hazardType === 'hail';
    const title = isHail 
      ? `🧊 รายงานลูกเห็บตก: ${report.name || 'ไม่ระบุชื่อจุด'}`
      : `🌊 รายงานน้ำท่วมใหม่: ${report.name || 'ไม่ระบุชื่อจุด'}`;
    
    const payload = JSON.stringify(report);

    // Publish to primary topic
    const res = await fetch(PRIMARY_REPORTS_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Title': title,
        'Priority': report.level === 3 ? 'urgent' : 'high',
        'Tags': isHail ? 'ice_cube,cloud_with_rain' : 'droplet,warning'
      },
      body: payload
    });

    // Also fire-and-forget to fallback topic for backwards compatibility
    fetch(FALLBACK_REPORTS_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Title': title,
        'Priority': report.level === 3 ? 'urgent' : 'high',
        'Tags': isHail ? 'ice_cube,cloud_with_rain' : 'droplet,warning'
      },
      body: payload
    }).catch(() => {});

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
    if (!isValidFeedback(feedback)) return false;
    const title = `💬 ข้อเสนอแนะใหม่ (${feedback.categoryLabel || 'ทั่วไป'}) จาก ${feedback.senderName || 'ประชาชน'}`;
    const payload = JSON.stringify(feedback);

    // Publish to primary feedback topic
    const res = await fetch(PRIMARY_FEEDBACK_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Title': title,
        'Priority': 'default',
        'Tags': 'speech_balloon,star'
      },
      body: payload
    });

    // Also fire-and-forget to fallback topic
    fetch(FALLBACK_FEEDBACK_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Title': title,
        'Priority': 'default',
        'Tags': 'speech_balloon,star'
      },
      body: payload
    }).catch(() => {});

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
    const res = await fetch(PRIMARY_ACTIONS_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Title': `🛡️ Admin Action: ${action.type}`,
        'Tags': 'shield,gear'
      },
      body: payload
    });

    fetch(FALLBACK_ACTIONS_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Title': `🛡️ Admin Action: ${action.type}`,
        'Tags': 'shield,gear'
      },
      body: payload
    }).catch(() => {});

    return res.ok;
  } catch (err) {
    console.warn('[CloudSync] publishAdminAction warning:', err);
    return false;
  }
}

/**
 * ตัวช่วยดาวน์โหลดและแกะข้อมูลจากข้อความ ntfy ไม่ว่าจะเป็น inline message หรือ attachment
 */
async function parseNtfyNdjsonStream(url, validator) {
  try {
    const res = await fetch(`${url}/json?poll=1&since=all`, { cache: 'no-cache' });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || !text.trim()) return [];

    const lines = text.trim().split('\n');
    const items = [];

    for (const line of lines) {
      if (!line) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.event === 'message') {
          let parsedData = null;

          // กรณีข้อความมีไฟล์แนบ (เช่น มีภาพถ่ายขนาดเกิน 4KB)
          if (entry.attachment && entry.attachment.url) {
            try {
              const fileRes = await fetch(entry.attachment.url, { cache: 'no-cache' });
              if (fileRes.ok) {
                parsedData = await fileRes.json();
              }
            } catch (e) {
              // fallback to message if attachment download fails
            }
          }

          // กรณีข้อความอยู่ใน message ปกติ
          if (!parsedData && entry.message) {
            try {
              parsedData = JSON.parse(entry.message);
            } catch (e) {
              // ignore plain string messages
            }
          }

          if (validator(parsedData)) {
            items.push(parsedData);
          }
        }
      } catch (e) {
        // Skip invalid line
      }
    }
    return items;
  } catch (err) {
    console.warn(`[CloudSync] Error fetching from ${url}:`, err);
    return [];
  }
}

/**
 * ดึงรายงานน้ำท่วม/ลูกเห็บย้อนหลังล่าสุดจาก Cloud (ดึงทั้ง Primary และ Fallback แล้ว Merge กัน)
 */
export async function fetchRecentCloudReports() {
  try {
    const [primaryReports, fallbackReports] = await Promise.all([
      parseNtfyNdjsonStream(PRIMARY_REPORTS_TOPIC, isValidReport),
      parseNtfyNdjsonStream(FALLBACK_REPORTS_TOPIC, isValidReport)
    ]);

    const reportMap = new Map();
    // เพิ่ม fallback ก่อน แล้วตามด้วย primary เพื่อให้ข้อมูลใหม่สุดทับ
    [...fallbackReports, ...primaryReports].forEach(r => {
      if (isValidReport(r)) {
        reportMap.set(r.id, r);
      }
    });

    const results = Array.from(reportMap.values());
    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return results;
  } catch (err) {
    console.warn('[CloudSync] fetchRecentCloudReports error:', err);
    return [];
  }
}

/**
 * ดึงข้อเสนอแนะล่าสุดจาก Cloud
 */
export async function fetchRecentCloudFeedback() {
  try {
    const [primaryFeedbacks, fallbackFeedbacks] = await Promise.all([
      parseNtfyNdjsonStream(PRIMARY_FEEDBACK_TOPIC, isValidFeedback),
      parseNtfyNdjsonStream(FALLBACK_FEEDBACK_TOPIC, isValidFeedback)
    ]);

    const feedbackMap = new Map();
    [...fallbackFeedbacks, ...primaryFeedbacks].forEach(f => {
      if (isValidFeedback(f)) {
        feedbackMap.set(f.id, f);
      }
    });

    const results = Array.from(feedbackMap.values());
    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return results;
  } catch (err) {
    console.warn('[CloudSync] fetchRecentCloudFeedback error:', err);
    return [];
  }
}

/**
 * ฟังก์ชันซิงก์ดึงข้อมูลสดทั้งหมดจาก Cloud แบบ Manual Trigger (สำหรับแอดมินกดรีเฟรช)
 */
export async function syncCloudDataNow() {
  const [reports, feedback] = await Promise.all([
    fetchRecentCloudReports(),
    fetchRecentCloudFeedback()
  ]);
  return { reports, feedback };
}

/**
 * สมัครรับเหตุการณ์แบบ Real-time ข้ามอุปกรณ์ผ่าน Server-Sent Events (SSE)
 */
export function subscribeToCloudEvents({ onNewReport, onNewFeedback, onAdminAction }) {
  const eventSources = [];

  const handleIncomingMessage = async (event, validator, callback) => {
    try {
      const data = JSON.parse(event.data);
      if (data && data.event === 'message') {
        let parsed = null;
        if (data.attachment && data.attachment.url) {
          try {
            const res = await fetch(data.attachment.url);
            if (res.ok) parsed = await res.json();
          } catch (e) {}
        }
        if (!parsed && data.message) {
          try {
            parsed = JSON.parse(data.message);
          } catch (e) {}
        }
        if (validator(parsed)) {
          callback(parsed);
        }
      }
    } catch (e) {}
  };

  // 1. Subscribe to Citizen Flood & Hail Reports
  if (onNewReport && typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const reportsSource = new EventSource(`${PRIMARY_REPORTS_TOPIC}/sse`);
      reportsSource.onmessage = (event) => handleIncomingMessage(event, isValidReport, onNewReport);
      eventSources.push(reportsSource);
    } catch (e) {
      console.warn('[CloudSync] Report EventSource error:', e);
    }
  }

  // 2. Subscribe to Feedback & Suggestions
  if (onNewFeedback && typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const feedbackSource = new EventSource(`${PRIMARY_FEEDBACK_TOPIC}/sse`);
      feedbackSource.onmessage = (event) => handleIncomingMessage(event, isValidFeedback, onNewFeedback);
      eventSources.push(feedbackSource);
    } catch (e) {
      console.warn('[CloudSync] Feedback EventSource error:', e);
    }
  }

  // 3. Subscribe to Admin Actions (e.g. approve/resolve/delete sync)
  if (onAdminAction && typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const actionsSource = new EventSource(`${PRIMARY_ACTIONS_TOPIC}/sse`);
      actionsSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.event === 'message') {
            let action = null;
            if (data.message) {
              try { action = JSON.parse(data.message); } catch (e) {}
            }
            if (action && action.type) {
              onAdminAction(action);
            }
          }
        } catch (e) {}
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
