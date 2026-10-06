/**
 * PrakanGuard Admin — core helpers (DOM, icons, toast, dialogs, formatters, normalizers)
 */
import { DISTRICTS } from './config.js';

/* ------------------------------------------------------------------ DOM */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.entries(v).forEach(([dk, dv]) => (node.dataset[dk] = dv));
    else node.setAttribute(k, v === true ? '' : v);
  }
  const append = (c) => {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(append);
    else node.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  };
  children.forEach(append);
  return node;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------------------------------------------------------- Icons */
const ICONS = {
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  flood: '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',
  eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  pin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  restore: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  map: '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'
};

export function icon(name, size = 18, cls = '') {
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ---------------------------------------------------------------- Toast */
let toastHost;
export function toast(message, type = 'info', ms = 3600) {
  if (!toastHost) {
    toastHost = h('div', { class: 'toast-host', 'aria-live': 'polite' });
    document.body.appendChild(toastHost);
  }
  const ic = { success: 'checkCircle', error: 'alert', warning: 'alert', info: 'info' }[type] || 'info';
  const node = h('div', { class: `toast toast-${type}` },
    h('span', { class: 'toast-ic', html: icon(ic, 18) }),
    h('span', { class: 'toast-msg' }, message)
  );
  toastHost.appendChild(node);
  requestAnimationFrame(() => node.classList.add('show'));
  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 300);
  }, ms);
}

/* -------------------------------------------------------------- Dialogs */
/** กล่องยืนยันแบบสวยงาม (แทน confirm() ของเบราว์เซอร์ที่ขึ้นข้อความ localhost) */
export function confirmDialog({ title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', tone = 'danger', icon: ic = 'trash', details = null }) {
  return new Promise((resolve) => {
    const overlay = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' });
    const done = (val) => {
      document.removeEventListener('keydown', onKey);
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 220);
      resolve(val);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') done(false);
    };
    const okBtn = h('button', { class: `btn btn-${tone === 'danger' ? 'danger' : 'primary'}`, onclick: () => done(true) }, confirmText);
    const card = h('div', { class: 'dialog' },
      h('div', { class: `dialog-ic tone-${tone}`, html: icon(ic, 28) }),
      h('h3', { class: 'dialog-title' }, title),
      h('p', { class: 'dialog-msg' }, message),
      details ? h('div', { class: 'dialog-details' }, details) : null,
      h('div', { class: 'dialog-actions' },
        h('button', { class: 'btn btn-ghost', onclick: () => done(false) }, cancelText),
        okBtn
      )
    );
    overlay.appendChild(card);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) done(false); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.classList.add('show'); okBtn.focus(); });
  });
}

/** หน้าต่างรายละเอียดทั่วไป */
export function openModal({ title, subtitle = '', body, footer = null, width = 760, onClose = null }) {
  const overlay = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' });
  const close = () => {
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 220);
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const card = h('div', { class: 'modal', style: { maxWidth: width + 'px' } },
    h('div', { class: 'modal-head' },
      h('div', {},
        h('h3', { class: 'modal-title' }, title),
        subtitle ? h('div', { class: 'modal-sub' }, subtitle) : null
      ),
      h('button', { class: 'icon-btn', 'aria-label': 'ปิด', onclick: close, html: icon('x', 18) })
    ),
    h('div', { class: 'modal-body' }, body),
    footer ? h('div', { class: 'modal-foot' }, footer) : null
  );
  overlay.appendChild(card);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  return { close, card };
}

/** เสียงเอฟเฟกต์กระดิ่งเมื่อกดอนุมัติรายงานสำเร็จ (Web Audio API 100% Offline ไม่ต้องพึ่งไฟล์ภายนอก) */
export function playApprovalChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    // Note 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: 880.00 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);

    // Note 3: 1174.66 Hz (D6) - Joyful high chime!
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1174.66, now + 0.16);
    gain3.gain.setValueAtTime(0, now + 0.16);
    gain3.gain.linearRampToValueAtTime(0.35, now + 0.20);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.85);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}

/** เสียงคลิกปุ่ม / สลับแท็บ / ฟิลเตอร์ (Soft UI Pop) */
export function playNavClickSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.05);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  } catch (_) {}
}

/** เสียงรีเฟรชข้อมูล (Whoosh Sweep) */
export function playRefreshSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.12);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch (_) {}
}

/** เสียงเปลี่ยนธีม (Mechanical Click) */
export function playThemeSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.linearRampToValueAtTime(720, now + 0.06);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  } catch (_) {}
}

/** เสียงแจ้งเตือน/ลบ/ถอนอนุมัติ (Alert Tone) */
export function playWarningSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.14);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch (_) {}
}

/** ป็อบอัพเด้งสวยงามเมื่อกดอนุมัติจุดน้ำท่วม */
export function showApprovalSuccessDialog({ title = 'อนุมัติรายงานขึ้นแผนที่สำเร็จ!', reportName = '', district = '', count = 1 }) {
  const overlay = h('div', { 
    class: 'overlay', 
    role: 'dialog', 
    'aria-modal': 'true',
    style: {
      backdropFilter: 'blur(8px)',
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000
    }
  });

  const closeDialog = () => {
    overlay.classList.remove('show');
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.25s ease-out';
    setTimeout(() => overlay.remove(), 260);
  };

  const card = h('div', { 
    class: 'approval-popup-card',
    style: {
      background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
      border: '1.5px solid rgba(34, 197, 94, 0.45)',
      borderRadius: '24px',
      padding: '28px 24px',
      maxWidth: '430px',
      width: '90%',
      textAlign: 'center',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 35px rgba(34, 197, 94, 0.22)',
      color: '#f8fafc',
      animation: 'pgApprovalBounceIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }
  },
    // Mascot logo & Animated Check Halo
    h('div', { 
      style: {
        position: 'relative',
        width: '82px',
        height: '82px',
        margin: '0 auto 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      } 
    },
      h('img', {
        src: './assets/img/logo.png',
        alt: 'PrakanGuard Logo',
        style: {
          width: '78px',
          height: '78px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2.5px solid #22c55e',
          boxShadow: '0 0 26px rgba(34, 197, 94, 0.45)'
        }
      }),
      h('div', {
        style: {
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '900',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.6)',
          border: '2px solid #0f172a'
        }
      }, '✓')
    ),
    // Title
    h('h3', { 
      style: {
        fontSize: '20px',
        fontWeight: '800',
        color: '#ffffff',
        margin: '0 0 6px',
        letterSpacing: '-0.01em'
      } 
    }, title),
    // Subtitle
    h('p', { 
      style: {
        fontSize: '13px',
        color: '#94a3b8',
        margin: '0 0 16px',
        lineHeight: '1.5'
      } 
    }, count > 1 ? `อนุมัติข้อมูลจำนวน ${count} รายการขึ้นบนแผนที่ประชาชนเรียบร้อยแล้ว` : 'ข้อมูลได้รับการยืนยันและอัปเดตขึ้นบนแผนที่สาธารณะทันทีเรียบร้อย'),
    // Report Detail Card
    reportName ? h('div', {
      style: {
        background: 'rgba(34, 197, 94, 0.08)',
        border: '1px solid rgba(34, 197, 94, 0.25)',
        borderRadius: '14px',
        padding: '12px 14px',
        marginBottom: '20px',
        textAlign: 'left'
      }
    },
      h('div', { style: { fontSize: '11px', color: '#4ade80', fontWeight: '700', marginBottom: '2px' } }, '📍 จุดที่อนุมัติขึ้นแผนที่สาธารณะ:'),
      h('div', { style: { fontSize: '14px', fontWeight: '700', color: '#f1f5f9' } }, reportName),
      district ? h('div', { style: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' } }, `อ.${district}`) : null
    ) : null,
    // Action Button
    h('button', {
      class: 'btn btn-success',
      style: {
        width: '100%',
        padding: '12px',
        fontSize: '14px',
        fontWeight: '700',
        borderRadius: '14px',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
        border: 'none',
        color: '#ffffff',
        boxShadow: '0 8px 20px -4px rgba(34, 197, 94, 0.5)'
      },
      onclick: closeDialog
    }, 'ตกลง')
  );

  overlay.appendChild(card);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  // Auto close after 4.5s
  setTimeout(closeDialog, 4500);
}

/* ------------------------------------------------------------ Formatters */
const TZ = 'Asia/Bangkok';
const fmtDT = new Intl.DateTimeFormat('th-TH', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const fmtTime = new Intl.DateTimeFormat('th-TH', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const fmtDate = new Intl.DateTimeFormat('th-TH', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
const fmtHM = new Intl.DateTimeFormat('th-TH', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });

export const dateTime = (v) => {
  if (!v) return '—';
  try {
    if (typeof v === 'string' && (v.includes('เวลา') || v.includes('น.'))) return v;
    let d;
    if (typeof v === 'number') {
      d = new Date(v < 1e11 ? v * 1000 : v);
    } else {
      d = new Date(v);
    }
    if (!isNaN(d.getTime())) return fmtDT.format(d) + ' น.';
  } catch (_) {}
  return String(v);
};
export const timeOnly = (v) => (v ? fmtTime.format(new Date(v)) : '—');
export const longDate = (v) => fmtDate.format(new Date(v));
export const hm = (v) => fmtHM.format(new Date(v));
export const nf = (n) => Number(n || 0).toLocaleString('th-TH');

export function duration(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} วินาที`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} นาที ${String(s % 60).padStart(2, '0')} วินาที`;
  const hr = Math.floor(m / 60);
  return `${hr} ชม. ${m % 60} นาที`;
}

export function timeAgo(v, now = Date.now()) {
  const d = Math.max(0, now - new Date(v).getTime());
  if (d < 45e3) return 'เมื่อสักครู่';
  if (d < 3600e3) return `${Math.round(d / 60e3)} นาทีที่แล้ว`;
  if (d < 86400e3) return `${Math.round(d / 3600e3)} ชั่วโมงที่แล้ว`;
  return `${Math.round(d / 86400e3)} วันที่แล้ว`;
}

/** เริ่มต้นวันตามเวลาไทย (UTC+7) */
export function startOfBangkokDay(now = new Date()) {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return new Date(`${ymd}T00:00:00+07:00`);
}

export function downloadFile(content, fileName, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ------------------------------------------------------------ Normalizers */
export const PAGE_MAIN = 'PrakanGuard | ระบบสารสนเทศและเฝ้าระวังอุทกภัย จ.สมุทรปราการ';
export const PAGES = [PAGE_MAIN, 'ข้อเสนอแนะ', 'รายงานน้ำท่วม', 'AI CHATBOT'];

/** แปลงชื่อหน้าที่เก็บมาให้เหลือเพียง 4 หน้าตามที่กำหนด */
export function normPage(raw) {
  const s = String(raw || '');
  if (/ข้อเสนอแนะ/.test(s)) return 'ข้อเสนอแนะ';
  if (/รายงานน้ำท่วม|แจ้งจุดท่วม|รายงาน/.test(s)) return 'รายงานน้ำท่วม';
  if (/chat/i.test(s)) return 'AI CHATBOT';
  return PAGE_MAIN;
}

/**
 * อำเภอของผู้ใช้จาก GPS
 * return { kind: 'district' | 'off' | 'outside' | 'pending', name, label }
 */
export function normDistrict(raw, gpsStatus = null, ageMs = 0) {
  const s = String(raw || '');
  const gs = String(gpsStatus || '').toLowerCase();
  const off = { kind: 'off', name: 'ปิด GPS', label: 'ปิด GPS' };
  const outside = { kind: 'outside', name: 'นอกจังหวัด', label: 'ผู้ใช้อยู่นอกขอบเขตจังหวัด' };
  const pending = () => (ageMs > 90 * 1000 ? off : { kind: 'pending', name: 'กำลังระบุตำแหน่ง', label: 'กำลังระบุตำแหน่ง…' });

  if (gs === 'denied') return off;
  if (gs === 'outside') return outside;
  if (gs === 'pending') return pending();

  if (/GPS|ไม่ได้เปิด/.test(s)) return off;
  if (/กำลังระบุ/.test(s)) return pending();
  if (/ไม่ได้อยู่|นอก/.test(s)) return outside;

  const clean = s.replace(/^อ\./, '').replace(/^อำเภอ/, '').trim();
  if (clean === 'เมือง') return { kind: 'district', name: 'เมืองสมุทรปราการ', label: 'อ.เมืองสมุทรปราการ' };
  const hit = DISTRICTS.find((d) => d === clean || d.includes(clean) || clean.includes(d));
  if (hit && clean) return { kind: 'district', name: hit, label: 'อ.' + hit };
  return off; // ไม่มีข้อมูลตำแหน่งที่ยืนยันได้ → ถือว่าไม่มี GPS
}

/** เกณฑ์ระดับน้ำ 3 ระดับ ตรงกับปุ่มรายงานบนเว็บหลัก */
export const LEVELS = {
  1: { level: 1, label: 'ปกติ', range: '5 - 20 ซม.', tone: 'ok' },
  2: { level: 2, label: 'ปานกลาง', range: '21 - 50 ซม.', tone: 'warn' },
  3: { level: 3, label: 'วิกฤต', range: 'มากกว่า 50 ซม.', tone: 'crit' }
};
export function levelInfo(r) {
  const d = Number(r.depth_cm ?? r.depthCm);
  let lv = isFinite(d) && d > 0 ? (d > 50 ? 3 : d >= 21 ? 2 : 1) : Number(r.level);
  if (![1, 2, 3].includes(lv)) {
    lv = 1;
  }
  return LEVELS[lv];
}

/** จัดกลุ่มอุปกรณ์สำหรับแผนภาพวงกลม */
export function classifyDevice(raw) {
  const s = String(raw || '').trim();
  const l = s.toLowerCase();
  if (/ipad|แท็บเล็ต|tablet/.test(l)) return { group: 'แท็บเล็ต', kind: 'tablet' };
  if (/iphone/.test(l)) return { group: 'iPhone', kind: 'mobile' };
  if (/samsung|galaxy|^sm-/.test(l)) return { group: 'Samsung', kind: 'mobile' };
  if (/oppo|cph\d/.test(l)) return { group: 'OPPO', kind: 'mobile' };
  if (/vivo/.test(l)) return { group: 'Vivo', kind: 'mobile' };
  if (/xiaomi|redmi|poco/.test(l)) return { group: 'Xiaomi / Redmi', kind: 'mobile' };
  if (/huawei|honor/.test(l)) return { group: 'Huawei / Honor', kind: 'mobile' };
  if (/realme|rmx/.test(l)) return { group: 'Realme', kind: 'mobile' };
  if (/^pc$|desktop|windows|macintosh|linux|^mac/.test(l)) return { group: 'PC', kind: 'desktop' };
  return { group: 'สมาร์ตโฟนอื่นๆ', kind: 'mobile' };
}

export function deviceLabel(raw) {
  const s = String(raw || '').trim();
  if (!s) return 'ไม่ระบุ';
  if (/^mobile$/i.test(s)) return 'สมาร์ตโฟน (ไม่ระบุรุ่น)';
  if (/^desktop$/i.test(s)) return 'PC';
  return s;
}

export function parseDeviceAndIp(rawDevice, rawIp) {
  let ip = rawIp || null;
  let dev = String(rawDevice || '').trim();
  const match = dev.match(/\[IP:\s*([^\]]+)\]/i) || dev.match(/\(([\d\.:a-fA-F]+)\)/);
  if (match) {
    if (!ip) ip = match[1].trim();
    dev = dev.replace(match[0], '').trim();
  }
  return { device: dev || 'PC', ip: ip || '—' };
}

export const shortId = (id) => String(id || '').replace(/^v-/, '').slice(0, 12).toUpperCase();
