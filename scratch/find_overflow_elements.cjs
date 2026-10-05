const { spawn } = require('child_process');
const http = require('http');

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4199', '--strictPort'], {
    shell: true,
    cwd: 'c:\\Users\\User\\OneDrive\\Desktop\\PrakanGuard',
    stdio: 'ignore'
  });

  await wait(2500);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const profileDir = 'C:\\Users\\User\\AppData\\Local\\Temp\\edge_overflow_' + Date.now();
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=' + profileDir,
    '--window-size=820,1180',
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 820,
    height: 1180,
    deviceScaleFactor: 1,
    mobile: false
  });

  await wait(3000);

  const findOverflow = await send('Runtime.evaluate', {
    expression: `(() => {
      const docWidth = document.documentElement.clientWidth;
      const overflowing = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 2) {
          overflowing.push({
            tag: el.tagName,
            className: el.className?.toString().slice(0, 100),
            id: el.id,
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: el.innerText ? el.innerText.slice(0, 30).trim() : ''
          });
        }
      }
      return {
        docWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        overflowing: overflowing.slice(0, 15)
      };
    })()`,
    returnByValue: true
  });

  console.log('Overflow Elements on Tablet (820px):', JSON.stringify(findOverflow.result.value, null, 2));

  ws.close();
  edge.kill();
  preview.kill();
  try {
    spawn('powershell', ['-Command', 'Get-NetTCPConnection -LocalPort 4199 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }']);
  } catch (e) {}
}

main().catch(console.error);
