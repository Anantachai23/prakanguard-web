const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\b271232f-5d4c-4745-9db7-12d077a1e7fa';
const PROJECT_DIR = 'c:\\Users\\User\\OneDrive\\Desktop\\PrakanGuard';

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4199', '--strictPort'], {
    shell: true, cwd: PROJECT_DIR, stdio: 'ignore'
  });
  await wait(2500);

  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\edge_sheet_' + Date.now(),
    '--window-size=390,844',
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
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await wait(2000);

  // Dismiss welcome modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('รับทราบ') || b.innerText.includes('เข้าใจแล้ว'));
      if (btn) btn.click();
    })()`
  });
  await wait(1000);

  // Open bottom sheet
  await send('Runtime.evaluate', {
    expression: `(() => {
      const trigger = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('พยากรณ์ 6 อำเภอ') || b.getAttribute('aria-label') === 'เปิดศูนย์ข้อมูล');
      if (trigger) trigger.click();
    })()`
  });
  await wait(1500);

  const sheetShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'final_mobile_sheet_open.png'), Buffer.from(sheetShot.data, 'base64'));
  console.log('Saved final_mobile_sheet_open.png');

  ws.close();
  edge.kill();
  preview.kill();
  try {
    spawn('powershell', ['-Command', 'Get-NetTCPConnection -LocalPort 4199 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }']);
  } catch (e) {}
}

main().catch(console.error);
