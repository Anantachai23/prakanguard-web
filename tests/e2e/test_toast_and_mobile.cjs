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
  await wait(1800);

  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
    '--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\edge_toast_test_' + Date.now(),
    'http://localhost:4174'
  ], { stdio: 'ignore' });

  await wait(2200);

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
  await wait(2000);

  // 1. Enter from welcome modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('เข้าสู่เว็บไซต์'));
      if (enterBtn) enterBtn.click();
    })()`
  });

  await wait(1500);

  // 2. Check mobile symbol button (should NOT have "ไกด์" text)
  const mobileCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const symbolBtn = allButtons.find(b => b.innerText.includes('📷') || b.innerText.includes('📉'));
      return {
        hasSymbolBtn: !!symbolBtn,
        symbolBtnText: symbolBtn ? symbolBtn.innerText.trim() : null,
        containsWordGuide: symbolBtn ? symbolBtn.innerText.includes('ไกด์') : false
      };
    })()`,
    returnByValue: true
  });

  console.log('Mobile Symbol Button Check:', mobileCheck.result.value);

  ws.close();
  edge.kill();
  preview.kill();
  try {
    spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']);
  } catch (e) {}

  if (mobileCheck.result.value.hasSymbolBtn && !mobileCheck.result.value.containsWordGuide) {
    console.log('✅ MOBILE SYMBOL BUTTON TEST PASSED: No word "ไกด์" in button!');
    process.exit(0);
  } else {
    console.error('❌ FAILED:', mobileCheck.result.value);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
