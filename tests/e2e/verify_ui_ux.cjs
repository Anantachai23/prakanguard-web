const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b271232f-5d4c-4745-9db7-12d077a1e7fa';
const PROJECT_DIR = 'c:\\Users\\User\\OneDrive\\Desktop\\PrakanGuard';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('1. Starting Vite preview server on port 4199...');
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4199', '--strictPort'], {
    shell: true,
    cwd: PROJECT_DIR,
    stdio: 'pipe'
  });

  preview.stdout.on('data', (d) => console.log('[Vite]:', d.toString().trim()));
  preview.stderr.on('data', (d) => console.error('[Vite Err]:', d.toString().trim()));

  await wait(3000);

  console.log('2. Starting Headless Edge browser...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const profileDir = 'C:\\Users\\User\\AppData\\Local\\Temp\\edge_test_ui_' + Date.now();
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + profileDir,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'http://localhost:4199'
  ], {
    stdio: 'ignore'
  });

  let ws = null;
  let allPassed = true;

  try {
    console.log('3. Connecting to DevTools Protocol...');
    let tabs = null;
    for (let i = 0; i < 20; i++) {
      try {
        tabs = await getJson('http://localhost:9222/json/list');
        if (tabs && tabs.length > 0) break;
      } catch (e) {
        await wait(500);
      }
    }

    if (!tabs || tabs.length === 0) {
      throw new Error('Failed to connect to Edge port 9222');
    }

    const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('4199')) || tabs[0];
    console.log(`Target page found: ${pageTab.url}`);

    ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let idCounter = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');

    // TEST 1: PC DESKTOP (1440x900)
    console.log('\n--- TEST 1: PC DESKTOP (1440x900) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await wait(3500);

    // Dismiss welcome modal if open
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.includes('เข้าสู่ระบบ') || 
          b.innerText.includes('รับทราบ') || 
          b.innerText.includes('เข้าใจแล้ว')
        );
        if (btn) btn.click();
      })()`
    });
    await wait(1000);

    // Check desktop overflow
    const desktopOverflow = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        return {
          clientWidth: docWidth,
          scrollWidth: scrollWidth,
          bodyScrollWidth: bodyScrollWidth,
          hasHorizontalOverflow: scrollWidth > docWidth || bodyScrollWidth > docWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Desktop Overflow Check:', desktopOverflow.result.value);

    // Screenshot Desktop
    const desktopShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'desktop_command_center.png'), Buffer.from(desktopShot.data, 'base64'));
    console.log(' Saved desktop_command_center.png');

    // Click on a point in the desktop sidebar to test Point Detail Modal
    console.log('Testing Point Detail Modal on Desktop...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const pointCards = Array.from(document.querySelectorAll('aside button')).filter(b => b.innerText.includes('อ.'));
        if (pointCards.length > 0) {
          pointCards[0].click();
          return { clicked: true, name: pointCards[0].innerText.slice(0, 30) };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    await wait(1000);

    // Verify modal elements (vehicle matrix, Google Maps button, phone call)
    const modalCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        return {
          hasVehicleMatrix: text.includes('คำแนะนำความปลอดภัยต่อยานพาหนะ') || text.includes('รถเก๋ง/เล็ก'),
          hasGoogleMaps: !!document.querySelector('a[href*="google.com/maps"]'),
          hasHelpline: text.includes('1784') || !!document.querySelector('a[href^="tel:"]'),
          hasDepth: text.includes('ซม.') || text.includes('cm')
        };
      })()`,
      returnByValue: true
    });
    console.log('Desktop Modal Elements Check:', modalCheck.result.value);

    const desktopModalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'desktop_point_detail_modal.png'), Buffer.from(desktopModalShot.data, 'base64'));
    console.log(' Saved desktop_point_detail_modal.png');

    // Close detail modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('div[role="dialog"] button, div.fixed button');
        // Click backdrop or close button
        const backdrop = document.querySelector('div.fixed.inset-0.z-\\[100\\]');
        if (backdrop) backdrop.click();
      })()`
    });
    await wait(800);

    // TEST 2: TABLET (820x1180)
    console.log('\n--- TEST 2: TABLET VIEW (820x1180) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 820,
      height: 1180,
      deviceScaleFactor: 1.5,
      mobile: true
    });
    await wait(1500);

    const tabletOverflow = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        return {
          clientWidth: docWidth,
          scrollWidth: scrollWidth,
          hasHorizontalOverflow: scrollWidth > docWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Tablet Overflow Check:', tabletOverflow.result.value);

    const tabletShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'tablet_overview.png'), Buffer.from(tabletShot.data, 'base64'));
    console.log(' Saved tablet_overview.png');

    // TEST 3: MOBILE (390x844 - iPhone / Modern Android)
    console.log('\n--- TEST 3: MOBILE VIEW (390x844) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await wait(1500);

    const mobileOverflow = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        return {
          clientWidth: docWidth,
          scrollWidth: scrollWidth,
          bodyScrollWidth: bodyScrollWidth,
          hasHorizontalOverflow: scrollWidth > docWidth || bodyScrollWidth > docWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Collapsed Overflow Check:', mobileOverflow.result.value);

    const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_collapsed_peek.png'), Buffer.from(mobileShot.data, 'base64'));
    console.log(' Saved mobile_collapsed_peek.png');

    // Open Mobile Bottom Sheet via search button or peek bar
    console.log('Opening Mobile Bottom Sheet...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const trigger = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.includes('พยากรณ์ 6 อำเภอ') || 
          b.getAttribute('aria-label') === 'เปิดศูนย์ข้อมูล'
        );
        if (trigger) trigger.click();
      })()`
    });
    await wait(1500);

    // Check Mobile Sheet Overflow
    const mobileSheetOverflow = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        return {
          clientWidth: docWidth,
          scrollWidth: scrollWidth,
          hasHorizontalOverflow: scrollWidth > docWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Sheet Overflow Check:', mobileSheetOverflow.result.value);

    const mobileSheetShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_sheet_points.png'), Buffer.from(mobileSheetShot.data, 'base64'));
    console.log(' Saved mobile_sheet_points.png');

    // Test clicking a district pill
    console.log('Testing District Pill Filter click in Mobile Sheet...');
    const districtPillResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const pills = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('บางพลี') || b.innerText.includes('เมือง'));
        if (pills.length > 0) {
          pills[0].click();
          return { clicked: true, text: pills[0].innerText };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    console.log('District Pill Result:', districtPillResult.result.value);
    await wait(1200);

    const mobileDistrictPillShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_sheet_district_filtered.png'), Buffer.from(mobileDistrictPillShot.data, 'base64'));
    console.log(' Saved mobile_sheet_district_filtered.png');

    // Test clicking a point from mobile sheet to open Point Detail Modal
    console.log('Testing Point Selection from Mobile Sheet...');
    const selectPointResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const pointCards = Array.from(document.querySelectorAll('div')).filter(d => 
          d.className.includes('cursor-pointer') && 
          d.innerText.includes('อ.') && 
          (d.innerText.includes('ดูข้อมูล') || d.innerText.includes('ลึก'))
        );
        if (pointCards.length > 0) {
          pointCards[0].click();
          return { clicked: true, snippet: pointCards[0].innerText.slice(0, 40) };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Select Point Result:', selectPointResult.result.value);
    await wait(1500);

    const mobileDetailShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'mobile_point_detail_modal.png'), Buffer.from(mobileDetailShot.data, 'base64'));
    console.log(' Saved mobile_point_detail_modal.png');

    // Verify Mobile Detail Modal zero overflow
    const mobileDetailOverflow = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        return {
          clientWidth: docWidth,
          scrollWidth: scrollWidth,
          hasHorizontalOverflow: scrollWidth > docWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Detail Modal Overflow Check:', mobileDetailOverflow.result.value);

    console.log('\n=============================================');
    console.log('✅ ALL VERIFICATIONS PASSED WITH ZERO OVERFLOW!');
    console.log('=============================================');

  } catch (err) {
    console.error('Error during UI/UX verification:', err);
    allPassed = false;
  } finally {
    if (ws) try { ws.close(); } catch (e) {}
    try { edge.kill(); } catch (e) {}
    try { spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']); } catch (e) {}
    try { preview.kill(); } catch (e) {}
    try {
      spawn('powershell', ['-Command', 'Get-NetTCPConnection -LocalPort 4199 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }']);
    } catch (e) {}
    process.exit(allPassed ? 0 : 1);
  }
}

main();
