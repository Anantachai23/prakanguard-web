/**
 * PrakanGuard Citizen Feedback Serverless API Endpoint
 * Endpoint: /api/feedback
 * 
 * Supports both Vercel Serverless Function and Node.js environments.
 * Bridges citizen suggestions to Cloud Topics (ntfy) & In-Memory Cache.
 */

const FEEDBACK_TOPIC = 'https://ntfy.sh/prakanguard_spk_feedback_v5';
const inMemoryFeedback = [];

export default async function handler(req, res) {
  const method = req.method || 'GET';

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN'
  };

  if (method === 'GET') {
    // If memory cache is empty, attempt to poll from Ntfy cloud topic
    if (inMemoryFeedback.length === 0) {
      try {
        const topicRes = await fetch(`${FEEDBACK_TOPIC}/json?poll=1&since=all`, { cache: 'no-cache' }).catch(() => null);
        if (topicRes && topicRes.ok) {
          const text = await topicRes.text();
          const lines = text.trim().split('\n');
          for (const line of lines) {
            if (!line) continue;
            try {
              const entry = JSON.parse(line);
              if (entry.event === 'message' && entry.message) {
                const parsed = JSON.parse(entry.message);
                if (parsed && parsed.id && !inMemoryFeedback.some(f => f.id === parsed.id)) {
                  inMemoryFeedback.unshift(parsed);
                }
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    if (res && typeof res.setHeader === 'function') {
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(200).json(inMemoryFeedback);
    }
    return new Response(JSON.stringify(inMemoryFeedback), { status: 200, headers });
  }

  if (method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }

    if (!body || typeof body !== 'object' || !body.message) {
      const errRes = { error: 'Invalid feedback payload: message is required' };
      if (res && typeof res.status === 'function') {
        return res.status(400).json(errRes);
      }
      return new Response(JSON.stringify(errRes), { status: 400, headers });
    }

    const newFeedback = {
      id: body.id || `fb-${Date.now()}`,
      category: body.category || 'suggestion',
      categoryLabel: body.categoryLabel || 'ทั่วไป',
      rating: body.rating ? parseInt(body.rating, 10) : 5,
      message: String(body.message).substring(0, 1000),
      senderName: body.senderName ? String(body.senderName).substring(0, 80) : 'ประชาชนทั่วไป',
      contact: body.contact ? String(body.contact).substring(0, 80) : '-',
      adminNote: '',
      isRead: false,
      submittedAt: body.submittedAt || new Date().toISOString(),
      timestamp: body.timestamp || Date.now()
    };

    inMemoryFeedback.unshift(newFeedback);
    if (inMemoryFeedback.length > 200) inMemoryFeedback.pop();

    // Broadcast to Cloud Ntfy Topic so all Admin instances are notified
    try {
      fetch(FEEDBACK_TOPIC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Title': 'PrakanGuard Citizen Feedback',
          'Priority': 'default',
          'Tags': 'speech_balloon,star'
        },
        body: JSON.stringify(newFeedback)
      }).catch(() => {});
    } catch (_) {}

    const successRes = { success: true, feedback: newFeedback };
    if (res && typeof res.status === 'function') {
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(201).json(successRes);
    }
    return new Response(JSON.stringify(successRes), { status: 201, headers });
  }

  const notAllowed = { error: 'Method not allowed' };
  if (res && typeof res.status === 'function') {
    return res.status(405).json(notAllowed);
  }
  return new Response(JSON.stringify(notAllowed), { status: 405, headers });
}
