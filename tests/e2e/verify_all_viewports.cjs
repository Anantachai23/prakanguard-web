const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b271232f-5d4c-4745-9db7-12d077a1e7fa';
const PROJECT_DIR = 'c:\\Users\\User\\OneDrive\\Desktop\\PrakanGuard';

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('1. Starting Vite preview on port 4199...');
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4199', '--strictPort'], {
    shell: true,
    cwd: PROJECT_DIR,
    stdio: 'ignore'
  });

  await wait(2500);

  console.log('2. Starting Headless Edge browser...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const profileDir = 'C:\\Users\\User\\AppData\\Local\\Temp\\edge_viewports_' + Date.now();
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + profileDir,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'http://localhost:4199'
  ]);

  await wait(3000);

  const tabs = await new Promise((res, rej) => http.get('http://localhost:9222/json/list', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej));

  const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('4199')) || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

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

  // Dismiss welcome modal if open
  await wait(2000);
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

  const viewportsToTest = [
    { name: 'PC Desktop', width: 1440, height: 900, mobile: false },
    { name: 'Small Desktop / Laptop', width: 1024, height: 768, mobile: false },
    { name: 'iPad Air Tablet', width: 820, height: 1180, mobile: true },
    { name: 'iPad Mini Tablet', width: 768, height: 1024, mobile: true },
    { name: 'iPhone 15 Mobile', width: 390, height: 844, mobile: true },
    { name: 'iPhone SE Small Mobile', width: 375, height: 667, mobile: true }
  ];

  const results = [];

  for (const vp of viewportsToTest) {
    console.log(`\nTesting ${vp.name} (${vp.width}x${vp.height})...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.mobile ? 2 : 1,
      mobile: vp.mobile
    });
    await wait(1200);

    const overflowCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        return {
          clientWidth: docWidth,
          scrollWidth: scrollWidth,
          bodyScrollWidth: bodyScrollWidth,
          passed: scrollWidth <= docWidth && bodyScrollWidth <= docWidth
        };
      })()`,
      returnByValue: true
    });

    const passed = overflowCheck.result.value.passed;
    console.log(` -> ClientWidth: ${overflowCheck.result.value.clientWidth}, ScrollWidth: ${overflowCheck.result.value.scrollWidth}, Passed: ${passed}`);
    results.push({ ...vp, ...overflowCheck.result.value });

    // Capture screenshot for key viewports
    if (vp.width === 1440) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'final_pc_1440.png'), Buffer.from(shot.data, 'base64'));
    } else if (vp.width === 820) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'final_tablet_820.png'), Buffer.from(shot.data, 'base64'));
    } else if (vp.width === 390) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'final_mobile_390.png'), Buffer.from(shot.data, 'base64'));
    }
  }

  // TEST FUNCTIONALITY: Click a point on Desktop to verify Modal details
  console.log('\nTesting Point Detail Modal details on PC Desktop...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await wait(1000);

  const openPointOnDesktop = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find a button in the sidebar points list
      const btns = Array.from(document.querySelectorAll('aside div button')).filter(b => b.innerText.includes('อ.'));
      if (btns.length > 0) {
        btns[0].click();
        return { clicked: true, text: btns[0].innerText.slice(0, 30) };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Open Point on Desktop:', openPointOnDesktop.result.value);
  await wait(1200);

  const verifyDesktopModal = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      const gmapsLink = document.querySelector('a[href*="google.com/maps"]');
      const telLink = document.querySelector('a[href^="tel:"]');
      return {
        modalVisible: text.includes('คำแนะนำความปลอดภัยต่อยานพาหนะ'),
        hasSedanAdvice: text.includes('รถเก๋ง/เล็ก'),
        hasMotorcycleAdvice: text.includes('มอเตอร์ไซค์'),
        hasSuvAdvice: text.includes('กระบะ/SUV'),
        hasTruckAdvice: text.includes('รถบรรทุก'),
        gmapsHref: gmapsLink ? gmapsLink.href : null,
        telHref: telLink ? telLink.href : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Modal Details Verification:', JSON.stringify(verifyDesktopModal.result.value, null, 2));

  const modalShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'final_detail_modal_with_matrix.png'), Buffer.from(modalShot.data, 'base64'));

  // Close modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const backdrop = document.querySelector('div.fixed.inset-0.z-\\[100\\]');
      if (backdrop) backdrop.click();
    })()`
  });
  await wait(800);

  // TEST MOBILE BOTTOM SHEET AND DISTRICT FILTERING
  console.log('\nTesting Mobile Bottom Sheet and District Filter on Mobile (390x844)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await wait(1000);

  // Open mobile sheet
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

  // Test District Pill click in Mobile Sheet
  const mobileDistrictClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const districtPills = Array.from(document.querySelectorAll('button')).filter(b => 
        b.innerText === 'บางพลี' || b.innerText === 'เมืองสมุทรปราการ'
      );
      if (districtPills.length > 0) {
        districtPills[0].click();
        return { clicked: true, district: districtPills[0].innerText };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Mobile District Filter Click:', mobileDistrictClick.result.value);
  await wait(1200);

  const mobileFilteredShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'final_mobile_sheet_filtered.png'), Buffer.from(mobileFilteredShot.data, 'base64'));

  // Select point from mobile sheet to open point modal
  const mobilePointClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('div')).filter(d => 
        d.className.includes('cursor-pointer') && 
        d.innerText.includes('ดูข้อมูล & นำทาง')
      );
      if (cards.length > 0) {
        cards[0].click();
        return { clicked: true, name: cards[0].innerText.slice(0, 30) };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Point Click to Modal:', mobilePointClick.result.value);
  await wait(1500);

  const mobileDetailModalShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'final_mobile_point_detail_modal.png'), Buffer.from(mobileDetailModalShot.data, 'base64'));

  // Check mobile modal zero overflow
  const mobileModalOverflow = await send('Runtime.evaluate', {
    expression: `(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      return {
        clientWidth: docWidth,
        scrollWidth: scrollWidth,
        passed: scrollWidth <= docWidth
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Modal Overflow Check:', mobileModalOverflow.result.value);

  ws.close();
  edge.kill();
  preview.kill();
  try {
    spawn('powershell', ['-Command', 'Get-NetTCPConnection -LocalPort 4199 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }']);
  } catch (e) {}

  console.log('\n=============================================');
  console.log('🎯 ALL MULTI-DEVICE VERIFICATIONS COMPLETED!');
  console.log('=============================================');
}

main().catch(console.error);
