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
  console.log('Connecting headless Edge to live Vercel site: https://prakanguard-web.vercel.app...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const profileDir = 'C:\\Users\\User\\AppData\\Local\\Temp\\edge_vercel_prod_' + Date.now();
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--user-data-dir=' + profileDir,
    '--no-first-run',
    '--no-default-browser-check',
    'https://prakanguard-web.vercel.app'
  ], {
    stdio: 'ignore'
  });

  let ws = null;
  let hasError = false;

  try {
    let tabs = null;
    for (let i = 0; i < 20; i++) {
      try {
        tabs = await getJson('http://localhost:9225/json/list');
        if (tabs && tabs.length > 0) break;
      } catch (e) {
        await wait(500);
      }
    }

    const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('prakanguard-web.vercel.app')) || tabs[0];
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
        hasError = true;
        console.error('>>> [VERCEL PROD EXCEPTION]:', JSON.stringify(msg.params.exceptionDetails, null, 2));
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        hasError = true;
        console.error('>>> [VERCEL PROD CONSOLE ERROR]:', msg.params.args.map(a => a.value || a.description).join(' '));
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    console.log('Waiting 5s for Vercel production assets and map to initialize...');
    await wait(5000);

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const body = document.body.innerText;
        const hasError = body.includes('ไม่สามารถโหลดข้อมูลได้');
        const pins = document.querySelectorAll('.leaflet-marker-icon').length;
        const hasSidebar = !!document.querySelector('aside');
        return { hasError, pins, hasSidebar, title: document.title };
      })()`,
      returnByValue: true
    });

    console.log('Live Vercel Production Result:', evalRes.result.value);

    if (evalRes.result.value.hasError) {
      console.error('❌ Error boundary is triggered on Vercel production!');
    } else {
      console.log('✅ Vercel production is running smoothly without errors! Markers rendered:', evalRes.result.value.pins);
    }

  } catch (err) {
    console.error('Live test error:', err);
  } finally {
    if (ws) try { ws.close(); } catch (e) {}
    try { edge.kill(); } catch (e) {}
    try { spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']); } catch (e) {}
    process.exit(hasError ? 1 : 0);
  }
}

main();
