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
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
    '--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\edge_mobile_' + Date.now(),
    'https://prakanguard-web.vercel.app'
  ], { stdio: 'ignore' });

  await wait(2000);
  const tabs = await getJson('http://localhost:9222/json/list');
  const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('vercel.app')) || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let idCounter = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');
  await wait(4500);

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const bodyText = document.body.innerText || '';
      return {
        hasMobileGuideButton: bodyText.includes('ไกด์') || !!document.querySelector('button[title*="ไกด์"]'),
        hasUnlocatedText: bodyText.includes('คุณไม่ได้เปิดตำแหน่ง'),
        markerCount: document.querySelectorAll('.leaflet-marker-icon').length,
        isErrorScreen: bodyText.includes('ไม่สามารถโหลดข้อมูลได้')
      };
    })()`,
    returnByValue: true
  });

  console.log('Mobile Viewport Result:', evalRes.result.value);

  ws.close();
  edge.kill();
  try {
    spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']);
  } catch (e) {}
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
