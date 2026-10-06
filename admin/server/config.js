/**
 * PrakanGuard Admin Command Center - Server Configuration
 */
const path = require('path');

const ADMIN_DIR = path.resolve(__dirname, '..');
const PORT = parseInt(process.env.ADMIN_PORT || process.env.PORT || '4000', 10);
const DATA_DIR = path.join(ADMIN_DIR, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');
const TRASH_FILE = path.join(DATA_DIR, 'trash.json');

// Supabase Cloud Database Configuration
const SUPABASE_URL = 'https://cnjufleeibbgmpvuvrpg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cwxpTPIFXkyWVgXksZASAQ_76DreEAw';

// Cloud ntfy.sh Topics (Multi-Topic with Fallbacks)
const CLOUD_REPORTS_TOPICS = [
  'https://ntfy.sh/prakanguard_live_reports_v4_spk',
  'https://ntfy.sh/prakanguard_live_reports_v3_spk',
  'https://ntfy.sh/prakanguard_spk_reports_v5'
];
const CLOUD_FEEDBACK_TOPICS = [
  'https://ntfy.sh/prakanguard_live_feedback_v4_spk',
  'https://ntfy.sh/prakanguard_live_feedback_v3_spk',
  'https://ntfy.sh/prakanguard_spk_feedback_v5'
];
const CLOUD_ACTIONS_TOPIC = 'https://ntfy.sh/prakanguard_live_actions_v4_spk';

// MIME Types Map for Static File Serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

module.exports = {
  ADMIN_DIR,
  PORT,
  DATA_DIR,
  REPORTS_FILE,
  FEEDBACK_FILE,
  VISITORS_FILE,
  TRASH_FILE,
  SUPABASE_URL,
  SUPABASE_KEY,
  CLOUD_REPORTS_TOPICS,
  CLOUD_FEEDBACK_TOPICS,
  CLOUD_ACTIONS_TOPIC,
  MIME_TYPES
};
