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
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4174', '--strictPort'], {
    shell: true,
    stdio: 'ignore'
  });
  await wait(1500);

  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\edge_test_profile_' + Date.now(),
    'http://localhost:4174'
  ], { stdio: 'ignore' });

  await wait(2000);
  const tabs = await getJson('http://localhost:9222/json/list');
  const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('4174')) || tabs[0];
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
  await wait(2500);

  // Check clicking on "คุณไม่ได้เปิดตำแหน่ง" button
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('คุณไม่ได้เปิดตำแหน่ง'));
      if (!btn) return { found: false };
      
      let called = false;
      // Hook navigator.geolocation.getCurrentPosition
      const origGeo = navigator.geolocation.getCurrentPosition;
      navigator.geolocation.getCurrentPosition = function(success, error, opts) {
        called = true;
        return origGeo.apply(this, arguments);
      };
      
      btn.click();
      return { found: true, calledGeo: called, btnText: btn.innerText.trim() };
    })()`,
    returnByValue: true
  });

  console.log('Click Test Result:', JSON.stringify(clickRes.result.value, null, 2));

  ws.close();
  edge.kill();
  preview.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
