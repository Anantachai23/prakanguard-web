const { spawn } = require('child_process');
const http = require('http');

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
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4192', '--strictPort'], {
    shell: true,
    cwd: 'c:\\Users\\User\\OneDrive\\Desktop\\prakanguard-web',
    stdio: 'pipe'
  });

  await wait(2500);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const profileDir = 'C:\\Users\\User\\AppData\\Local\\Temp\\edge_err_' + Date.now();
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--user-data-dir=' + profileDir,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:4192'
  ], {
    stdio: 'ignore'
  });

  let ws = null;

  try {
    let tabs = null;
    for (let i = 0; i < 20; i++) {
      try {
        tabs = await getJson('http://localhost:9223/json/list');
        if (tabs && tabs.length > 0) break;
      } catch (e) {
        await wait(500);
      }
    }

    const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('4192')) || tabs[0];
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

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('\n>>> [BROWSER EXCEPTION]:', JSON.stringify(msg.params.exceptionDetails, null, 2));
      }
      if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'warning')) {
        console.error('>>> [BROWSER CONSOLE ' + msg.params.type.toUpperCase() + ']:', msg.params.args.map(a => a.value || a.description).join(' '));
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.reload');

    await wait(3500);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    if (ws) try { ws.close(); } catch (e) {}
    try { edge.kill(); } catch (e) {}
    try { spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']); } catch (e) {}
    try { preview.kill(); } catch (e) {}
    try {
      spawn('powershell', ['-Command', 'Get-NetTCPConnection -LocalPort 4192 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }']);
    } catch (e) {}
    process.exit(0);
  }
}

main();
