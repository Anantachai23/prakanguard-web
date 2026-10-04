/**
 * PrakanGuard Admin Command Center — Main Application Logic
 */
import { DISTRICTS, ONLINE_WINDOW_MS, LIVE_REFRESH_MS, CHART_REFRESH_MS } from './config.js';
import { 
  $, $$, h, icon, toast, confirmDialog, openModal, 
  dateTime, timeOnly, hm, duration, timeAgo, startOfBangkokDay, nf,
  normPage, normDistrict, levelInfo, classifyDevice, deviceLabel, shortId, downloadFile,
  playApprovalChime, playNavClickSound, playRefreshSound, playThemeSound, playWarningSound, showApprovalSuccessDialog
} from './core.js';
import { 
  detectCaps, caps, fetchReports, fetchFeedback, fetchTrash, 
  fetchOnlineSessions, fetchTodaySessions, setReportsApproval, setReportResolved, deleteToTrash, 
  restoreFromTrash, purgeTrash, fetchReportPhoto, fetchAnnouncements, 
  createAnnouncement, setAnnouncementActive, deleteAnnouncement, 
  fetchAdminSessions, buildBackup, serverNow
} from './api.js';
import { currentAdmin, login, logout, changePassword, adminDeviceLabel } from './auth.js';

/* State */
const state = {
  currentTab: 'overview',
  reports: [],
  reportsPhotoSet: new Set(),
  reportsFilter: 'all', // all | pending | approved
  reportsDistrict: 'all',
  reportsSearch: '',
  selectedReports: new Set(),

  feedback: [],
  feedbackSearch: '',
  selectedFeedback: new Set(),

  trash: [],
  trashFilter: 'all',
  selectedTrash: new Set(),

  announcements: [],

  activeVisitors: [],
  todaySessions: [],
  adminSessions: [],

  visitorTrendChart: null,
  deviceDoughnutChart: null,
  lastChartUpdate: 0,
  lastLiveRefresh: 0,

  theme: localStorage.getItem('pg_admin_theme') || 'dark'
};

/* ----------------------------------------------------------- Theme Init */
export function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pg_admin_theme', theme);
  const themeBtn = $('#btn-theme-toggle');
  if (themeBtn) {
    themeBtn.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon', 18);
    themeBtn.setAttribute('title', theme === 'dark' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด');
  }
}

/* ------------------------------------------------------------- Tab Switching */
export function switchTab(tabId, playSound = false) {
  state.currentTab = tabId;
  if (playSound) playNavClickSound();
  $$('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });
  $$('.view-section').forEach(el => {
    el.style.display = el.id === `view-${tabId}` ? 'block' : 'none';
  });

  const titles = {
    overview: 'ภาพรวมระบบและการเข้าชม',
    reports: 'ผู้แจ้งรายงานน้ำท่วม',
    visitors: 'รายการเซสชันผู้เข้าใช้งานสด',
    feedback: 'ข้อเสนอจากประชาชน',
    announcements: 'การประกาศหน้าเว็บ',
    trash: 'ลบล่าสุด (ถังขยะ)',
    logins: 'ประวัติเข้าระบบแอดมิน',
    settings: 'ตั้งค่าระบบ & สำรองข้อมูล'
  };
  const titleEl = $('#header-view-title');
  if (titleEl) titleEl.textContent = titles[tabId] || 'ศูนย์บัญชาการแอดมิน';

  // Specific render on switch
  if (tabId === 'overview') renderOverview();
  else if (tabId === 'reports') renderReports();
  else if (tabId === 'visitors') renderVisitorsTable();
  else if (tabId === 'feedback') renderFeedback();
  else if (tabId === 'announcements') renderAnnouncements();
  else if (tabId === 'trash') renderTrash();
  else if (tabId === 'logins') renderLogins();
  else if (tabId === 'settings') renderSettings();

  // Close mobile sidebar if open
  $('.app-sidebar')?.classList.remove('open');
}

/* --------------------------------------------------------- Authentication UI */
function renderLoginWall() {
  const wall = $('#login-wall');
  const user = currentAdmin();
  if (!user) {
    if (wall) wall.style.display = 'flex';
    // Ensure inputs are blank - never pre-filled
    const uIn = $('#login-username');
    const pIn = $('#login-password');
    if (uIn) uIn.value = '';
    if (pIn) pIn.value = '';
    $('#login-error')?.style.setProperty('display', 'none');
  } else {
    if (wall) wall.style.display = 'none';
    const nameEl = $('#sidebar-admin-name');
    if (nameEl) nameEl.textContent = `${user.label} (${user.username})`;
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const uIn = $('#login-username');
  const pIn = $('#login-password');
  const errEl = $('#login-error');
  const submitBtn = $('#btn-login-submit');

  const u = uIn ? uIn.value.trim() : '';
  const p = pIn ? pIn.value : '';

  if (!u || !p) {
    if (errEl) {
      errEl.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
      errEl.style.display = 'block';
    }
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'กำลังตรวจสอบสิทธิ์...';

  try {
    const res = await login(u, p);
    if (res.ok) {
      toast(`ยินดีต้อนรับ ${res.admin.label}`, 'success');
      renderLoginWall();
      await refreshAllData(true);
    } else {
      if (errEl) {
        errEl.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เฉพาะ Admin 01 และ Admin 02)';
        errEl.style.display = 'block';
      }
      if (pIn) pIn.value = '';
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
      errEl.style.display = 'block';
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'เข้าสู่ระบบ Admin';
  }
}

async function handleLogout() {
  const ok = await confirmDialog({
    title: 'ออกจากระบบ',
    message: 'คุณต้องการออกจากระบบศูนย์บัญชาการแอดมินหรือไม่?',
    confirmText: 'ออกจากระบบ',
    cancelText: 'ยกเลิก',
    tone: 'danger',
    icon: 'logout'
  });
  if (ok) {
    await logout();
    toast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    renderLoginWall();
  }
}

/* ------------------------------------------------------------- Data Refreshing */
export async function refreshAllData(forceCharts = false) {
  const refreshBtn = $('#btn-global-refresh');
  if (refreshBtn) refreshBtn.classList.add('spinning');

  try {
    await detectCaps();

    // 1. Fetch live visitors & reports in parallel
    const [online, today, rep, fb, tr, ann, logs] = await Promise.all([
      fetchOnlineSessions(ONLINE_WINDOW_MS).catch(() => []),
      fetchTodaySessions(startOfBangkokDay()).catch(() => []),
      fetchReports().catch(() => []),
      fetchFeedback().catch(() => []),
      fetchTrash().catch(() => []),
      fetchAnnouncements().catch(() => []),
      fetchAdminSessions().catch(() => [])
    ]);

    state.activeVisitors = online;
    state.todaySessions = today;
    state.reports = rep;
    state.feedback = fb;
    state.trash = tr;
    state.announcements = ann;
    state.adminSessions = logs;
    state.lastLiveRefresh = Date.now();

    // Update Badges
    updateNavBadges();

    // Render current active view
    switchTab(state.currentTab);

    // Update charts if forced or older than 30 mins
    const now = Date.now();
    if (forceCharts || now - state.lastChartUpdate > CHART_REFRESH_MS) {
      updateCharts();
      state.lastChartUpdate = now;
    }
  } catch (err) {
    console.error('Data refresh error:', err);
    toast('เกิดข้อผิดพลาดในการดึงข้อมูลสด', 'error');
  } finally {
    if (refreshBtn) refreshBtn.classList.remove('spinning');
  }
}

function updateNavBadges() {
  const pendingReports = state.reports.filter(r => !r.is_approved && !r.isApproved).length;
  const repBadge = $('#badge-reports-count');
  if (repBadge) {
    repBadge.textContent = pendingReports > 0 ? pendingReports : state.reports.length;
    repBadge.className = `nav-badge ${pendingReports > 0 ? 'badge-alert' : ''}`;
  }

  const onlineCount = state.activeVisitors.length;
  const visBadge = $('#badge-visitors-count');
  if (visBadge) {
    visBadge.textContent = onlineCount;
  }

  const trashBadge = $('#badge-trash-count');
  if (trashBadge) {
    trashBadge.textContent = state.trash.length;
  }
}

/* ------------------------------------------------------------- 1. OVERVIEW */
function renderOverview() {
  const now = serverNow();
  const onlineCount = state.activeVisitors.length;

  // Real today unique devices/visitors
  const todayUniqueDevices = new Set(
    state.todaySessions.map(s => s.device_id || s.session_id)
  ).size;

  // Peak online today (highest concurrent in recorded blocks)
  const peakOnline = Math.max(onlineCount, state.todaySessions.length > 0 ? Math.min(state.todaySessions.length, Math.max(onlineCount, 1)) : 1);

  // Top district from real GPS within Samut Prakan
  const districtCounts = {};
  DISTRICTS.forEach(d => { districtCounts[d] = 0; });
  let outsideCount = 0;
  let closedGpsCount = 0;

  state.activeVisitors.forEach(s => {
    const age = now - new Date(s.last_ping).getTime();
    const nd = normDistrict(s.district, s.gps_status, age);
    if (nd.kind === 'district') {
      districtCounts[nd.name] = (districtCounts[nd.name] || 0) + 1;
    } else if (nd.kind === 'outside') {
      outsideCount++;
    } else {
      closedGpsCount++;
    }
  });

  let topDistrict = 'ไม่มีข้อมูล';
  let topCount = 0;
  for (const [dist, count] of Object.entries(districtCounts)) {
    if (count > topCount) {
      topCount = count;
      topDistrict = dist;
    }
  }

  // Update Stat Elements
  const elActive = $('#stat-active-now');
  if (elActive) elActive.textContent = nf(onlineCount);

  const elToday = $('#stat-visitors-today');
  if (elToday) elToday.textContent = nf(todayUniqueDevices || onlineCount);

  const elPeak = $('#stat-peak-online');
  if (elPeak) elPeak.textContent = nf(peakOnline);

  const elTopDist = $('#stat-top-district');
  if (elTopDist) {
    elTopDist.textContent = topCount > 0 ? topDistrict : 'ปิด GPS ส่วนใหญ่';
    const sub = $('#stat-top-district-sub');
    if (sub) sub.textContent = topCount > 0 ? `ออนไลน์ ${topCount} คนในพื้นที่` : `ปิด GPS ${closedGpsCount} คน`;
  }

  const elPending = $('#stat-pending-reports');
  if (elPending) {
    const pCount = state.reports.filter(r => !r.is_approved && !r.isApproved).length;
    elPending.textContent = nf(pCount);
  }

  const elApproved = $('#stat-approved-reports');
  if (elApproved) {
    const aCount = state.reports.filter(r => r.is_approved || r.isApproved).length;
    elApproved.textContent = nf(aCount);
  }

  // Also render mini feed on overview
  renderMiniLiveFeed();
}

function renderMiniLiveFeed() {
  const tbody = $('#overview-live-feed-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const now = serverNow();
  if (state.activeVisitors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 24px;">ขณะนี้ยังไม่มีเซสชันออนไลน์สด</td></tr>`;
    return;
  }

  state.activeVisitors.slice(0, 8).forEach(s => {
    const age = now - new Date(s.last_ping).getTime();
    const nd = normDistrict(s.district, s.gps_status, age);
    const startT = s.created_at ? new Date(s.created_at).getTime() : new Date(s.last_ping).getTime();
    const durMs = Math.max(0, new Date(s.last_ping).getTime() - startT);

    const tr = h('tr', {},
      h('td', { class: 'cell-mono' }, shortId(s.session_id)),
      h('td', {}, s.ip || '—'),
      h('td', {}, deviceLabel(s.device)),
      h('td', {},
        h('span', { class: `badge ${nd.kind === 'district' ? 'badge-ok' : nd.kind === 'outside' ? 'badge-warn' : 'badge-neutral'}` },
          nd.label
        )
      ),
      h('td', { style: { maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, normPage(s.page)),
      h('td', {}, duration(durMs))
    );
    tbody.appendChild(tr);
  });
}

/* ------------------------------------------------------------- 2. CHARTS (30 min update) */
function updateCharts() {
  if (typeof Chart === 'undefined') return;

  // Chart 1: Visitor Trend Today (per hour)
  const ctxTrend = $('#chart-visitor-trend');
  if (ctxTrend) {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const hourlyCounts = new Array(24).fill(0);

    state.todaySessions.forEach(s => {
      const d = new Date(s.created_at || s.last_ping);
      const h = d.getHours();
      if (h >= 0 && h < 24) hourlyCounts[h]++;
    });

    if (state.visitorTrendChart) {
      state.visitorTrendChart.data.datasets[0].data = hourlyCounts;
      state.visitorTrendChart.update();
    } else {
      state.visitorTrendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: hours,
          datasets: [{
            label: 'ผู้เข้าชม (คน)',
            data: hourlyCounts,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }

  // Chart 2: Device Share (Donut Chart)
  const ctxDevice = $('#chart-device-share');
  if (ctxDevice) {
    const counts = {};
    state.todaySessions.forEach(s => {
      const { group } = classifyDevice(s.device);
      counts[group] = (counts[group] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

    if (state.deviceDoughnutChart) {
      state.deviceDoughnutChart.data.labels = labels;
      state.deviceDoughnutChart.data.datasets[0].data = data;
      state.deviceDoughnutChart.update();
    } else {
      state.deviceDoughnutChart = new Chart(ctxDevice, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['ยังไม่มีข้อมูล'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: palette,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
          },
          cutout: '68%'
        }
      });
    }
  }
}

/* ------------------------------------------------------------- 3. REPORTS (ผู้แจ้งรายงานน้ำท่วม) */
function renderReports() {
  const tbody = $('#reports-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let list = [...state.reports];

  // Filter: all | pending | approved
  if (state.reportsFilter === 'pending') {
    list = list.filter(r => !r.is_approved && !r.isApproved);
  } else if (state.reportsFilter === 'approved') {
    list = list.filter(r => r.is_approved || r.isApproved);
  }

  // Filter: District
  if (state.reportsDistrict !== 'all') {
    list = list.filter(r => r.district === state.reportsDistrict);
  }

  // Search
  if (state.reportsSearch) {
    const q = state.reportsSearch.toLowerCase();
    list = list.filter(r => 
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.district && r.district.toLowerCase().includes(q)) ||
      (r.subdistrict && r.subdistrict.toLowerCase().includes(q)) ||
      (r.reporter_device && r.reporter_device.toLowerCase().includes(q))
    );
  }

  $('#reports-count-total').textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 36px;">ไม่พบรายการรายงานน้ำท่วมตามเงื่อนไขที่เลือก</td></tr>`;
    return;
  }

  list.forEach(r => {
    const isApproved = !!(r.is_approved || r.isApproved);
    const lv = levelInfo(r);
    const isChecked = state.selectedReports.has(r.id);

    // Reporter GPS & District
    let repDistText = 'ผู้รายงานปิด GPS';
    let repDistBadgeClass = 'badge-neutral';
    if (r.reporter_district) {
      if (r.reporter_district.includes('ปิด GPS') || r.reporter_district.includes('ไม่ระบุ')) {
        repDistText = 'ผู้รายงานปิด GPS';
      } else if (r.reporter_district.includes('นอก')) {
        repDistText = 'ผู้ใช้อยู่นอกขอบเขตจังหวัด';
        repDistBadgeClass = 'badge-warn';
      } else {
        repDistText = `อ.${r.reporter_district}`;
        repDistBadgeClass = 'badge-ok';
      }
    }

    const tr = h('tr', {},
      // Checkbox
      h('td', {},
        h('input', {
          type: 'checkbox',
          checked: isChecked,
          onchange: (e) => {
            if (e.target.checked) state.selectedReports.add(r.id);
            else state.selectedReports.delete(r.id);
            updateReportsSelectionUI();
          }
        })
      ),
      // Level (3 standards: ปกติ, ปานกลาง, วิกฤต)
      h('td', {},
        h('span', { class: `badge badge-${lv.tone}` },
          `${r.body_level_label || r.bodyLevelLabel || lv.label} (${(r.depth_cm || r.depthCm) ? (r.depth_cm || r.depthCm) + ' ซม.' : lv.range})`
        )
      ),
      // Location Name & Details
      h('td', {},
        h('div', { style: { fontWeight: 600 } }, r.name || 'ไม่ระบุชื่อจุด'),
        h('div', { class: 'text-muted', style: { fontSize: '11.5px' } },
          `อ.${r.district || 'เมืองสมุทรปราการ'} ${r.subdistrict ? 'ต.' + r.subdistrict : ''}`
        )
      ),
      // Reporter Device & GPS District
      h('td', {},
        h('div', { style: { fontSize: '12px', fontWeight: 500 } }, deviceLabel(r.reporter_device || r.device || 'สมาร์ตโฟน')),
        h('div', { style: { marginTop: '3px' } },
          h('span', { class: `badge ${repDistBadgeClass}` }, repDistText)
        )
      ),
      // Date Time (Bangkok Official Time)
      h('td', { class: 'cell-mono' }, (() => {
        if (r.timestamp) return dateTime(r.timestamp);
        if (r.created_at) return dateTime(r.created_at);
        if (r.reported_at || r.reportedAt) return r.reported_at || r.reportedAt;
        return '—';
      })()),
      // Status (รออนุมัติ / อนุมัติแล้ว)
      h('td', {},
        h('span', { class: `badge ${isApproved ? 'badge-ok' : 'badge-warn'}` },
          isApproved ? 'อนุมัติแล้ว' : 'รออนุมัติ'
        )
      ),
      // Photo thumbnail (if any)
      (() => {
        const photo = r.photo_url || r.photoUrl || (r.photo && r.photo.url);
        return h('td', {},
          photo
            ? h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                h('img', {
                  src: photo,
                  alt: 'รูปสภาพน้ำท่วม',
                  title: 'คลิกเพื่อดูรูปภาพขนาดเต็ม',
                  style: { width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border-subtle)', flexShrink: 0 },
                  onclick: () => showPhotoModal(photo, r.name)
                }),
                h('button', {
                  class: 'btn btn-secondary btn-sm',
                  onclick: () => showPhotoModal(photo, r.name),
                  style: { padding: '4px 8px', fontSize: '12px' },
                  html: `${icon('image', 14)} ดูรูป`
                })
              )
            : h('span', { class: 'text-muted' }, 'ไม่มีรูป')
        );
      })(),
      // Actions
      h('td', {},
        h('div', { style: { display: 'flex', gap: '6px' } },
          !isApproved
            ? h('button', {
                class: 'btn btn-success btn-sm',
                onclick: () => handleApproveSingle(r.id),
                html: `${icon('check', 14)} อนุมัติ`
              })
            : h('button', {
                class: 'btn btn-secondary btn-sm',
                onclick: () => handleUnapproveSingle(r.id),
                html: `ถอนอนุมัติ`
              }),
          h('button', {
            class: 'btn btn-danger btn-sm',
            onclick: () => handleDeleteReportsSingle(r),
            html: icon('trash', 14)
          })
        )
      )
    );
    tbody.appendChild(tr);
  });

  updateReportsSelectionUI();
}

function updateReportsSelectionUI() {
  const count = state.selectedReports.size;
  const bar = $('#reports-batch-actions');
  const countLabel = $('#reports-selected-count');
  if (bar && countLabel) {
    if (count > 0) {
      bar.style.display = 'flex';
      countLabel.textContent = `เลือกแล้ว ${count} รายการ`;
    } else {
      bar.style.display = 'none';
    }
  }
}

async function handleApproveSingle(id) {
  const reportItem = state.reports.find(r => r.id === id);
  const ok = await setReportsApproval([id], true);
  if (ok) {
    playApprovalChime();
    showApprovalSuccessDialog({
      title: 'อนุมัติรายงานน้ำท่วมสำเร็จ!',
      reportName: reportItem?.name || 'จุดน้ำท่วม',
      district: reportItem?.district || '',
      count: 1
    });
    toast('อนุมัติรายงานขึ้นบนเว็บหลักเรียบร้อยแล้ว', 'success');
    await refreshAllData();
  } else {
    toast('ไม่สามารถอนุมัติได้ กรุณาลองใหม่', 'error');
  }
}

async function handleUnapproveSingle(id) {
  const ok = await setReportsApproval([id], false);
  if (ok) {
    playWarningSound();
    toast('ถอนการอนุมัติรายงานเรียบร้อยแล้ว', 'info');
    await refreshAllData();
  }
}

async function handleApproveSelected() {
  const ids = Array.from(state.selectedReports);
  if (ids.length === 0) return;
  const ok = await setReportsApproval(ids, true);
  if (ok) {
    playApprovalChime();
    showApprovalSuccessDialog({
      title: 'อนุมัติรายงานกลุ่มสำเร็จ!',
      count: ok
    });
    toast(`อนุมัติสำเร็จ ${ok} รายการ`, 'success');
    state.selectedReports.clear();
    await refreshAllData();
  }
}

async function handleDeleteReportsSingle(report) {
  const confirmed = await confirmDialog({
    title: 'ยืนยันการลบรายงานน้ำท่วม',
    message: `คุณต้องการลบรายงาน "${report.name || 'จุดน้ำท่วม'}" หรือไม่? ข้อมูลจะถูกย้ายไปเก็บที่ "ลบล่าสุด" ก่อนลบถาวร`,
    confirmText: 'ลบรายงาน',
    cancelText: 'ยกเลิก',
    tone: 'danger',
    icon: 'trash'
  });
  if (!confirmed) return;
  playWarningSound();

  const admin = currentAdmin();
  const deletedCount = await deleteToTrash('report', [report.id], admin ? admin.label : 'Admin');
  if (deletedCount > 0) {
    toast('ลบรายงานและย้ายไปถังขยะเรียบร้อยแล้ว', 'success');
    await refreshAllData();
  } else {
    toast('ไม่สามารถลบรายงานได้', 'error');
  }
}

async function handleDeleteReportsSelected() {
  const ids = Array.from(state.selectedReports);
  if (ids.length === 0) return;

  const confirmed = await confirmDialog({
    title: 'ยืนยันการลบหลายรายการ',
    message: `คุณต้องการลบรายงานน้ำท่วมที่เลือกทั้งหมด ${ids.length} รายการหรือไม่? ข้อมูลจะถูกย้ายไปเก็บที่ "ลบล่าสุด"`,
    confirmText: `ลบ ${ids.length} รายการ`,
    cancelText: 'ยกเลิก',
    tone: 'danger',
    icon: 'trash'
  });
  if (!confirmed) return;
  playWarningSound();

  const admin = currentAdmin();
  const deletedCount = await deleteToTrash('report', ids, admin ? admin.label : 'Admin');
  toast(`ลบรายงานสำเร็จ ${deletedCount} รายการ`, 'success');
  state.selectedReports.clear();
  await refreshAllData();
}

function showPhotoModal(photoUrl, title = 'รูปภาพที่แนบมา') {
  openModal({
    title,
    body: h('div', { style: { textAlign: 'center' } },
      h('img', {
        src: photoUrl,
        alt: title,
        style: { maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', objectFit: 'contain' }
      })
    ),
    width: 680
  });
}

/* ------------------------------------------------------------- 4. LIVE SESSIONS FEED */
function renderVisitorsTable() {
  const tbody = $('#visitors-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const now = serverNow();
  $('#visitors-active-count').textContent = state.activeVisitors.length;

  if (state.activeVisitors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 36px;">ขณะนี้ยังไม่มีผู้เข้าใช้งานออนไลน์</td></tr>`;
    return;
  }

  state.activeVisitors.forEach(s => {
    const age = now - new Date(s.last_ping).getTime();
    const nd = normDistrict(s.district, s.gps_status, age);
    const startT = s.created_at ? new Date(s.created_at).getTime() : new Date(s.last_ping).getTime();
    const durMs = Math.max(0, new Date(s.last_ping).getTime() - startT);

    const tr = h('tr', {},
      // Session ID
      h('td', { class: 'cell-mono' }, shortId(s.session_id)),
      // IP
      h('td', {}, s.ip || '—'),
      // Device & Model
      h('td', {},
        h('div', { style: { fontWeight: 600 } }, deviceLabel(s.device)),
        h('div', { class: 'text-muted', style: { fontSize: '11px' } }, s.device_id ? shortId(s.device_id) : '')
      ),
      // District (Real GPS)
      h('td', {},
        h('span', { class: `badge ${nd.kind === 'district' ? 'badge-ok' : nd.kind === 'outside' ? 'badge-warn' : 'badge-neutral'}` },
          nd.label
        )
      ),
      // Active Page (Strictly 1 of 4)
      h('td', {},
        h('span', { class: 'badge badge-primary', style: { maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' } },
          normPage(s.page)
        )
      ),
      // Duration on web
      h('td', { class: 'cell-mono' }, duration(durMs)),
      // Status
      h('td', {},
        h('span', { class: 'badge badge-ok' },
          h('span', { class: 'status-dot pulse' }),
          'กำลังออนไลน์'
        )
      )
    );
    tbody.appendChild(tr);
  });
}

/* ------------------------------------------------------------- 5. FEEDBACK */
function renderFeedback() {
  const tbody = $('#feedback-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let list = [...state.feedback];
  if (state.feedbackSearch) {
    const q = state.feedbackSearch.toLowerCase();
    list = list.filter(f => 
      (f.message && f.message.toLowerCase().includes(q)) ||
      (f.sender_name && f.sender_name.toLowerCase().includes(q)) ||
      (f.contact && f.contact.toLowerCase().includes(q))
    );
  }

  $('#feedback-count-total').textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 36px;">ไม่พบข้อเสนอแนะจากประชาชน</td></tr>`;
    return;
  }

  list.forEach(f => {
    const isChecked = state.selectedFeedback.has(f.id);
    const tr = h('tr', {},
      h('td', {},
        h('input', {
          type: 'checkbox',
          checked: isChecked,
          onchange: (e) => {
            if (e.target.checked) state.selectedFeedback.add(f.id);
            else state.selectedFeedback.delete(f.id);
            updateFeedbackSelectionUI();
          }
        })
      ),
      h('td', { style: { maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
        h('span', { style: { fontWeight: 500 } }, f.message)
      ),
      h('td', {}, f.sender_name || 'ประชาชนทั่วไป'),
      h('td', {}, f.contact || '—'),
      h('td', {}, '⭐'.repeat(f.rating || 5)),
      h('td', { class: 'cell-mono' }, dateTime(f.timestamp || f.created_at)),
      h('td', {},
        h('div', { style: { display: 'flex', gap: '6px' } },
          h('button', {
            class: 'btn btn-secondary btn-sm',
            onclick: () => showFeedbackModal(f),
            html: `${icon('eye', 14)} รายละเอียด`
          }),
          h('button', {
            class: 'btn btn-danger btn-sm',
            onclick: () => handleDeleteFeedbackSingle(f),
            html: icon('trash', 14)
          })
        )
      )
    );
    tbody.appendChild(tr);
  });

  updateFeedbackSelectionUI();
}

function updateFeedbackSelectionUI() {
  const count = state.selectedFeedback.size;
  const bar = $('#feedback-batch-actions');
  const countLabel = $('#feedback-selected-count');
  if (bar && countLabel) {
    if (count > 0) {
      bar.style.display = 'flex';
      countLabel.textContent = `เลือกแล้ว ${count} รายการ`;
    } else {
      bar.style.display = 'none';
    }
  }
}

function showFeedbackModal(f) {
  openModal({
    title: 'ข้อเสนอแนะจากประชาชน',
    subtitle: `${f.sender_name || 'ประชาชนทั่วไป'} · ${dateTime(f.timestamp || f.created_at)}`,
    body: h('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
      h('div', { style: { fontSize: '14px', lineHeight: '1.6', background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px' } }, f.message),
      h('div', { style: { display: 'flex', gap: '20px', fontSize: '13px' } },
        h('div', {}, h('strong', {}, 'เบอร์/ช่องทางติดต่อ: '), f.contact || '—'),
        h('div', {}, h('strong', {}, 'คะแนนความพึงพอใจ: '), '⭐'.repeat(f.rating || 5)),
        h('div', {}, h('strong', {}, 'หมวดหมู่: '), f.category_label || f.category || 'ทั่วไป')
      )
    ),
    width: 580
  });
}

async function handleDeleteFeedbackSingle(f) {
  const confirmed = await confirmDialog({
    title: 'ยืนยันการลบข้อเสนอแนะ',
    message: `คุณต้องการลบข้อเสนอแนะนี้หรือไม่? ข้อมูลจะถูกย้ายไปเก็บที่ "ลบล่าสุด" ก่อนลบถาวร`,
    confirmText: 'ลบข้อเสนอแนะ',
    cancelText: 'ยกเลิก',
    tone: 'danger',
    icon: 'trash'
  });
  if (!confirmed) return;
  playWarningSound();

  const admin = currentAdmin();
  const deletedCount = await deleteToTrash('feedback', [f.id], admin ? admin.label : 'Admin');
  if (deletedCount > 0) {
    toast('ลบข้อเสนอแนะเรียบร้อยแล้ว', 'success');
    await refreshAllData();
  }
}

async function handleDeleteFeedbackSelected() {
  const ids = Array.from(state.selectedFeedback);
  if (ids.length === 0) return;

  const confirmed = await confirmDialog({
    title: 'ยืนยันการลบหลายรายการ',
    message: `คุณต้องการลบข้อเสนอแนะที่เลือกทั้งหมด ${ids.length} รายการหรือไม่? ข้อมูลจะถูกย้ายไปเก็บที่ "ลบล่าสุด"`,
    confirmText: `ลบ ${ids.length} รายการ`,
    cancelText: 'ยกเลิก',
    tone: 'danger',
    icon: 'trash'
  });
  if (!confirmed) return;
  playWarningSound();

  const admin = currentAdmin();
  const deletedCount = await deleteToTrash('feedback', ids, admin ? admin.label : 'Admin');
  toast(`ลบข้อเสนอแนะสำเร็จ ${deletedCount} รายการ`, 'success');
  state.selectedFeedback.clear();
  await refreshAllData();
}

/* ------------------------------------------------------------- 6. ANNOUNCEMENTS */
function renderAnnouncements() {
  const container = $('#announcements-list');
  if (!container) return;
  container.innerHTML = '';

  if (state.announcements.length === 0) {
    container.innerHTML = `<div class="card" style="text-align: center; padding: 36px; color: var(--text-muted);">ยังไม่มีการประกาศหน้าเว็บในขณะนี้</div>`;
    return;
  }

  state.announcements.forEach(a => {
    const isAll = a.target_type === 'all' || !a.districts || a.districts.length === 0;
    const card = h('div', { class: 'card', style: { marginBottom: '14px', borderLeft: a.is_active ? '4px solid var(--primary)' : '4px solid var(--border-strong)' } },
      h('div', { class: 'card-header' },
        h('div', { class: 'card-title' },
          h('span', { class: `badge ${a.is_active ? 'badge-ok' : 'badge-neutral'}` }, a.is_active ? 'กำลังเผยแพร่' : 'ปิดการแสดงผล'),
          h('span', { class: 'badge badge-primary' }, isAll ? 'ทุกอำเภอ (เฉพาะผู้เปิด GPS)' : a.districts.map(d => `อ.${d}`).join(', '))
        ),
        h('div', { style: { display: 'flex', gap: '8px' } },
          h('button', {
            class: `btn btn-sm ${a.is_active ? 'btn-secondary' : 'btn-success'}`,
            onclick: async () => {
              playNavClickSound();
              await setAnnouncementActive(a.id, !a.is_active);
              toast('อัปเดตสถานะประกาศแล้ว', 'success');
              await refreshAllData();
            }
          }, a.is_active ? 'ระงับประกาศ' : 'เปิดประกาศ'),
          h('button', {
            class: 'btn btn-danger btn-sm',
            onclick: async () => {
              const ok = await confirmDialog({
                title: 'ลบประกาศ',
                message: 'คุณต้องการลบข้อความประกาศนี้ออกจากหน้าเว็บหรือไม่?',
                confirmText: 'ลบประกาศ',
                cancelText: 'ยกเลิก',
                tone: 'danger',
                icon: 'trash'
              });
              if (ok) {
                playWarningSound();
                await deleteAnnouncement(a.id);
                toast('ลบประกาศเรียบร้อยแล้ว', 'success');
                await refreshAllData();
              }
            },
            html: icon('trash', 14)
          })
        )
      ),
      h('div', { style: { fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main)', marginTop: '8px' } }, a.message),
      h('div', { style: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' } },
        `สร้างโดย: ${a.created_by || 'แอดมิน'} · เมื่อ: ${dateTime(a.created_at)}`
      )
    );
    container.appendChild(card);
  });
}

async function handleCreateAnnouncement(e) {
  e.preventDefault();
  const msgIn = $('#announcement-message');
  const targetType = $('input[name="ann-target"]:checked')?.value || 'all';
  const selectedDistricts = [];

  if (targetType === 'specific') {
    $$('input[name="ann-district"]:checked').forEach(cb => selectedDistricts.push(cb.value));
    if (selectedDistricts.length === 0) {
      toast('กรุณาเลือกอย่างน้อย 1 อำเภอที่ต้องการประกาศ', 'warning');
      return;
    }
  }

  const msg = msgIn ? msgIn.value.trim() : '';
  if (!msg) {
    toast('กรุณากรอกข้อความประกาศ', 'warning');
    return;
  }

  const admin = currentAdmin();
  const res = await createAnnouncement({
    message: msg,
    districts: selectedDistricts,
    by: admin ? admin.label : 'Admin'
  });

  if (res) {
    playApprovalChime();
    toast('สร้างประกาศหน้าเว็บสำเร็จแล้ว', 'success');
    if (msgIn) msgIn.value = '';
    await refreshAllData();
  } else {
    toast('ไม่สามารถสร้างประกาศได้ (ตรวจสอบการเชื่อมต่อฐานข้อมูล)', 'error');
  }
}

/* ------------------------------------------------------------- 7. TRASH (ลบล่าสุด) */
function renderTrash() {
  const tbody = $('#trash-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let list = [...state.trash];
  if (state.trashFilter !== 'all') {
    list = list.filter(t => t.kind === state.trashFilter);
  }

  $('#trash-count-total').textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 36px;">ถังขยะว่างเปล่า ไม่มีรายการที่ถูกลบล่าสุด</td></tr>`;
    return;
  }

  list.forEach(t => {
    const isChecked = state.selectedTrash.has(t.id);
    const p = t.payload || {};
    const title = t.kind === 'report' ? (p.name || 'รายงานน้ำท่วม') : (p.message || 'ข้อเสนอแนะ');
    const sender = t.kind === 'report' ? (p.district ? `อ.${p.district}` : 'ประชาชน') : (p.sender_name || 'ประชาชนทั่วไป');

    const tr = h('tr', {},
      h('td', {},
        h('input', {
          type: 'checkbox',
          checked: isChecked,
          onchange: (e) => {
            if (e.target.checked) state.selectedTrash.add(t.id);
            else state.selectedTrash.delete(t.id);
            updateTrashSelectionUI();
          }
        })
      ),
      h('td', {},
        h('span', { class: `badge ${t.kind === 'report' ? 'badge-primary' : 'badge-warn'}` },
          t.kind === 'report' ? 'รายงานน้ำท่วม' : 'ข้อเสนอแนะ'
        )
      ),
      h('td', { style: { maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, title),
      h('td', {}, sender),
      h('td', { class: 'cell-mono' }, dateTime(t.deleted_at)),
      h('td', {},
        h('div', { style: { display: 'flex', gap: '6px' } },
          h('button', {
            class: 'btn btn-secondary btn-sm',
            onclick: () => handleRestoreSingle(t),
            html: `${icon('restore', 14)} กู้คืน`
          }),
          h('button', {
            class: 'btn btn-danger btn-sm',
            onclick: () => handlePurgeSingle(t),
            html: `${icon('trash', 14)} ลบถาวร`
          })
        )
      )
    );
    tbody.appendChild(tr);
  });

  updateTrashSelectionUI();
}

function updateTrashSelectionUI() {
  const count = state.selectedTrash.size;
  const bar = $('#trash-batch-actions');
  const countLabel = $('#trash-selected-count');
  if (bar && countLabel) {
    if (count > 0) {
      bar.style.display = 'flex';
      countLabel.textContent = `เลือกแล้ว ${count} รายการ`;
    } else {
      bar.style.display = 'none';
    }
  }
}

async function handleRestoreSingle(item) {
  const count = await restoreFromTrash([item]);
  if (count > 0) {
    playRefreshSound();
    toast('กู้คืนข้อมูลกลับสู่ระบบเรียบร้อยแล้ว', 'success');
    await refreshAllData();
  }
}

async function handleRestoreSelected() {
  const selectedItems = state.trash.filter(t => state.selectedTrash.has(t.id));
  if (selectedItems.length === 0) return;
  const count = await restoreFromTrash(selectedItems);
  playRefreshSound();
  toast(`กู้คืนสำเร็จ ${count} รายการ`, 'success');
  state.selectedTrash.clear();
  await refreshAllData();
}

async function handlePurgeSingle(item) {
  const ok = await confirmDialog({
    title: 'ยืนยันการลบถาวร',
    message: 'คุณต้องการลบรายการนี้ออกจากฐานข้อมูลอย่างถาวรหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
    confirmText: 'ลบถาวร',
    cancelText: 'ยกเลิก',
    tone: 'danger',
    icon: 'trash'
  });
  if (!ok) return;
  playWarningSound();

  await purgeTrash([item.id]);
  toast('ลบข้อมูลถาวรเรียบร้อยแล้ว', 'success');
  await refreshAllData();
}

async function handlePurgeSelected() {
  const ids = Array.from(state.selectedTrash);
  if (ids.length === 0) return;

  const ok = await confirmDialog({
    title: 'ยืนยันการลบถาวรหลายรายการ',
    message: `คุณต้องการลบถาวร ${ids.length} รายการที่เลือกหรือไม่? ข้อมูลจะถูกลบออกจากฐานข้อมูลและไม่สามารถนำกลับคืนได้`,
    confirmText: `ลบถาวร ${ids.length} รายการ`,
    cancelText: 'ยกเลิก',
    tone: 'danger',
    icon: 'trash'
  });
  if (!ok) return;
  playWarningSound();

  await purgeTrash(ids);
  toast(`ลบถาวรสำเร็จ ${ids.length} รายการ`, 'success');
  state.selectedTrash.clear();
  await refreshAllData();
}

/* ------------------------------------------------------------- 8. ADMIN LOGIN HISTORY */
function renderLogins() {
  const tbody = $('#logins-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (state.adminSessions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 36px;">ไม่พบประวัติการเข้าใช้งานแอดมิน</td></tr>`;
    return;
  }

  state.adminSessions.forEach(s => {
    const tr = h('tr', {},
      // Username
      h('td', { style: { fontWeight: 600 } }, s.username),
      // Admin Label (แอดมินคนที่...)
      h('td', {},
        h('span', { class: 'badge badge-primary' }, s.admin_label || 'Admin')
      ),
      // Device
      h('td', {}, s.device || 'Windows PC'),
      // Status (แสดงแค่ "กำลังใช้งาน" ตามที่ผู้ใช้สั่ง)
      h('td', {},
        h('span', { class: 'badge badge-ok' },
          h('span', { class: 'status-dot pulse' }),
          'กำลังใช้งาน'
        )
      ),
      // Login Time
      h('td', { class: 'cell-mono' }, dateTime(s.logged_in_at))
    );
    tbody.appendChild(tr);
  });
}

/* ------------------------------------------------------------- 9. SETTINGS & BACKUP */
function renderSettings() {
  const currentAdm = currentAdmin();
  const labelEl = $('#settings-current-admin');
  if (labelEl && currentAdm) {
    labelEl.textContent = `${currentAdm.label} (${currentAdm.username})`;
  }
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const oldPass = $('#pwd-old')?.value;
  const newPass = $('#pwd-new')?.value;
  const confirmPass = $('#pwd-confirm')?.value;

  if (!oldPass || !newPass) {
    toast('กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่', 'warning');
    return;
  }
  if (newPass !== confirmPass) {
    toast('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', 'warning');
    return;
  }
  if (newPass.length < 10) {
    toast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 10 ตัวอักษร', 'warning');
    return;
  }

  const res = await changePassword(oldPass, newPass);
  if (res.ok) {
    toast('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว', 'success');
    $('#pwd-old').value = '';
    $('#pwd-new').value = '';
    $('#pwd-confirm').value = '';
  } else {
    toast('รหัสผ่านเดิมไม่ถูกต้อง หรือระบบยังไม่ได้อัปเดตฟังก์ชันในฐานข้อมูล', 'error');
  }
}

async function handleDownloadBackup() {
  toast('กำลังเตรียมไฟล์สำรองข้อมูล JSON...', 'info');
  const data = await buildBackup();
  const fileName = `prakanguard_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  downloadFile(JSON.stringify(data, null, 2), fileName, 'application/json');
  toast('ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ', 'success');
}

/* ------------------------------------------------------------- Initialization */
export function initDashboard() {
  applyTheme(state.theme);
  renderLoginWall();
  detectCaps().catch(() => {});

  // Navigation Click Handlers
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(btn.dataset.tab, true);
    });
  });

  // Global tactile click feedback for all buttons, inputs, checkboxes, and filters
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, .btn, .icon-btn, .login-btn, .nav-item, .chip, .reports-filter-btn, .trash-filter-btn, input[type="checkbox"], input[type="radio"], select');
    if (!el) return;
    
    // Skip if element triggers a dedicated sound effect
    if (el.id === 'btn-theme-toggle' || el.id === 'btn-global-refresh') return;
    if (el.classList.contains('btn-success') || el.closest('.btn-success')) return;
    if (el.classList.contains('btn-danger') || el.closest('.btn-danger')) return;
    if (el.classList.contains('nav-item')) return;
    
    playNavClickSound();
  }, { passive: true });

  // Login Form
  $('#login-form')?.addEventListener('submit', handleLoginSubmit);

  // Logout Buttons
  $('#btn-logout')?.addEventListener('click', () => {
    playWarningSound();
    handleLogout();
  });

  // Global Refresh Button
  $('#btn-global-refresh')?.addEventListener('click', () => {
    playRefreshSound();
    refreshAllData(true);
  });

  // Theme Toggle Button
  $('#btn-theme-toggle')?.addEventListener('click', () => {
    playThemeSound();
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  // Reports Filter Tabs & Search
  $$('.reports-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.reports-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.reportsFilter = btn.dataset.filter;
      renderReports();
    });
  });

  $('#reports-district-select')?.addEventListener('change', (e) => {
    state.reportsDistrict = e.target.value;
    renderReports();
  });

  $('#reports-search-input')?.addEventListener('input', (e) => {
    state.reportsSearch = e.target.value.trim();
    renderReports();
  });

  $('#btn-reports-approve-selected')?.addEventListener('click', handleApproveSelected);
  $('#btn-reports-delete-selected')?.addEventListener('click', handleDeleteReportsSelected);

  // Feedback Search & Actions
  $('#feedback-search-input')?.addEventListener('input', (e) => {
    state.feedbackSearch = e.target.value.trim();
    renderFeedback();
  });
  $('#btn-feedback-delete-selected')?.addEventListener('click', handleDeleteFeedbackSelected);

  // Announcements
  $('#form-create-announcement')?.addEventListener('submit', handleCreateAnnouncement);
  $$('input[name="ann-target"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isSpecific = e.target.value === 'specific';
      const box = $('#ann-district-checkboxes');
      if (box) box.style.display = isSpecific ? 'grid' : 'none';
    });
  });

  // Trash
  $$('.trash-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.trash-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.trashFilter = btn.dataset.filter;
      renderTrash();
    });
  });
  $('#btn-trash-restore-selected')?.addEventListener('click', handleRestoreSelected);
  $('#btn-trash-purge-selected')?.addEventListener('click', handlePurgeSelected);

  // Settings
  $('#form-change-password')?.addEventListener('submit', handleChangePasswordSubmit);
  $('#btn-download-backup')?.addEventListener('click', handleDownloadBackup);

  // Initial Load if logged in
  if (currentAdmin()) {
    refreshAllData(true);
  }

  // Periodic Refresh: Active visitors count every 1 minute
  setInterval(() => {
    if (currentAdmin()) {
      refreshAllData(false);
    }
  }, LIVE_REFRESH_MS);
}
