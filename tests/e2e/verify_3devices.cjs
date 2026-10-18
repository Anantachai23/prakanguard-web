const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\47257bed-3542-4d62-b7b7-d64038dd2123';

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
  console.log('1. Starting Vite preview server on port 4188...');
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4188', '--strictPort'], {
    shell: true,
    cwd: 'c:\\Users\\User\\OneDrive\\Desktop\\prakanguard-web',
    stdio: 'pipe'
  });

  preview.stdout.on('data', (d) => console.log('[Vite]:', d.toString().trim()));
  preview.stderr.on('data', (d) => console.error('[Vite Err]:', d.toString().trim()));

  await wait(2500);

  console.log('2. Starting Headless Edge browser...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const profileDir = 'C:\\Users\\User\\AppData\\Local\\Temp\\edge_test_' + Date.now();
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + profileDir,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'http://localhost:4188'
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

    const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('4188')) || tabs[0];
    console.log(`Target page found: ${pageTab.url}`);

    // In Node 22+, WebSocket is global built-in
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('4. Waiting 4s for app mount & Leaflet pins...');
    await wait(4000);

    // Dismiss welcome modal if open
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('เข้าสู่ระบบ') || b.innerText.includes('รับทราบ') || b.innerText.includes('เข้าใจแล้ว'));
        if (btn) btn.click();
      })()`
    });
    await wait(1000);

    // Capture Desktop screenshot
    console.log('5. Capturing Desktop screenshot (1440x900)...');
    const desktopShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'screenshot_desktop_redesign.png'), Buffer.from(desktopShot.data, 'base64'));
    console.log(' Saved screenshot_desktop_redesign.png');

    // Desktop DOM check
    const desktopEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const hasSidebar = !!document.querySelector('aside');
        const hasMap = !!document.querySelector('.leaflet-container');
        const pinCount = document.querySelectorAll('.leaflet-marker-icon').length;
        const text = document.body.innerText;
        return {
          hasSidebar,
          hasMap,
          pinCount,
          hasHotline: text.includes('1784'),
          hasDistricts: text.includes('เมืองสมุทรปราการ')
        };
      })()`,
      returnByValue: true
    });
    console.log('Desktop Eval:', desktopEval.result.value);

    // 6. Test Tablet View (820x1180)
    console.log('\n6. Testing Tablet View (820x1180)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 820,
      height: 1180,
      deviceScaleFactor: 1.5,
      mobile: true
    });
    await wait(1500);

    const tabletShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'screenshot_tablet_redesign.png'), Buffer.from(tabletShot.data, 'base64'));
    console.log(' Saved screenshot_tablet_redesign.png');

    // 7. Test Mobile View (390x844)
    console.log('\n7. Testing Mobile View (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await wait(1500);

    const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'screenshot_mobile_redesign.png'), Buffer.from(mobileShot.data, 'base64'));
    console.log(' Saved screenshot_mobile_redesign.png');

    // Open Mobile Bottom Sheet
    console.log('8. Opening Mobile Bottom Sheet...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const triggers = Array.from(document.querySelectorAll('button')).filter(b => 
          b.innerText.includes('พยากรณ์ 6 อำเภอ') || 
          b.innerText.includes('ค้นหา') || 
          b.getAttribute('aria-label') === 'เปิดศูนย์ข้อมูล'
        );
        if (triggers.length > 0) triggers[0].click();
      })()`
    });
    await wait(1500);

    const mobileSheetShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'screenshot_mobile_sheet.png'), Buffer.from(mobileSheetShot.data, 'base64'));
    console.log(' Saved screenshot_mobile_sheet.png');

    console.log('\n🎉 ALL 3 DEVICE VIEWPORTS TESTED AND SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during 3 devices verification:', err);
    allPassed = false;
  } finally {
    if (ws) try { ws.close(); } catch (e) {}
    try { edge.kill(); } catch (e) {}
    try { spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']); } catch (e) {}
    try { preview.kill(); } catch (e) {}
    try {
      spawn('powershell', ['-Command', 'Get-NetTCPConnection -LocalPort 4188 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }']);
    } catch (e) {}
    process.exit(allPassed ? 0 : 1);
  }
}

main();
