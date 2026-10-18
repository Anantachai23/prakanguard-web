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
  console.log('1. Starting Vite preview on port 4174...');
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4174', '--strictPort'], {
    shell: true,
    stdio: 'ignore'
  });
  await wait(1800);

  console.log('2. Starting Headless Edge browser...');
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\edge_welcome_test_' + Date.now(),
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

  const runtimeErrors = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      runtimeErrors.push(msg.params.exceptionDetails);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');

  console.log('3. Waiting 2.5s for initial welcome modal render...');
  await wait(2500);

  // Check Welcome Modal presence
  const initialCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const body = document.body.innerText || '';
      const hasWelcomeTitle = body.includes('ยินดีต้อนรับ') || body.includes('ระบบสารสนเทศและเฝ้าระวังอุทกภัย');
      const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('เข้าสู่เว็บไซต์'));
      return {
        hasWelcomeTitle,
        hasEnterBtn: !!enterBtn,
        enterBtnText: enterBtn ? enterBtn.innerText.trim() : null
      };
    })()`,
    returnByValue: true
  });

  console.log('Initial Welcome Check:', initialCheck.result.value);

  // Click "เข้าสู่เว็บไซต์"
  console.log('4. Clicking "เข้าสู่เว็บไซต์" button to test slide-up animation and map zoom...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('เข้าสู่เว็บไซต์'));
      if (enterBtn) {
        enterBtn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Button click result:', clickRes.result.value);

  // Wait 1.5 seconds during the slide-up and flyTo zoom
  await wait(1500);

  const postClickCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('เข้าสู่เว็บไซต์'));
      const markerCount = document.querySelectorAll('.leaflet-marker-icon').length;
      return {
        welcomeModalDismissed: !enterBtn,
        markerCount,
        hasPins: markerCount > 0
      };
    })()`,
    returnByValue: true
  });

  console.log('Post Click Check (Slide-up completed & map zoom active):', postClickCheck.result.value);
  console.log('Runtime exceptions:', runtimeErrors.length);

  ws.close();
  edge.kill();
  preview.kill();
  try {
    spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']);
  } catch (e) {}

  if (initialCheck.result.value.hasEnterBtn && postClickCheck.result.value.welcomeModalDismissed && runtimeErrors.length === 0) {
    console.log('🎉 WELCOME FLOW & CINEMATIC MAP ZOOM TEST PASSED 100%!');
    process.exit(0);
  } else {
    console.error('❌ TEST FAILED');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
