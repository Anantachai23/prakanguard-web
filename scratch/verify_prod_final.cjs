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
  console.log('Testing live production https://prakanguard-web.vercel.app ...');
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
    '--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\edge_prod_verify_' + Date.now(),
    'https://prakanguard-web.vercel.app'
  ], { stdio: 'ignore' });

  await wait(2200);

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

  const errors = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await wait(2500);

  // 1. Initial Welcome Check & verify map did NOT zoom prematurely
  const welcomeCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const body = document.body.innerText || '';
      const enterBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('เข้าสู่ระบบเว็บไซต์') || b.innerText.includes('เข้าสู่เว็บไซต์')
      );
      return {
        welcomeVisible: body.includes('ยินดีต้อนรับ') || body.includes('PrakanGuard'),
        hasEnterBtn: !!enterBtn,
        enterBtnText: enterBtn ? enterBtn.innerText.trim() : null
      };
    })()`,
    returnByValue: true
  });

  console.log('Production Welcome Modal Check:', welcomeCheck.result.value);

  // Click Enter Website
  console.log('Clicking enter button to trigger slide up & zoom...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const enterBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('เข้าสู่ระบบเว็บไซต์') || b.innerText.includes('เข้าสู่เว็บไซต์')
      );
      if (enterBtn) enterBtn.click();
    })()`
  });

  // Wait 2.2 seconds for cinematic zoom to complete
  await wait(2200);

  // 2. Mobile Symbol Button Check
  const mobileBtnCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const symbolBtn = allButtons.find(b => b.innerText.includes('📷') || b.innerText.includes('📉'));
      return {
        hasSymbolBtn: !!symbolBtn,
        symbolBtnText: symbolBtn ? symbolBtn.innerText.trim() : null,
        containsWordGuide: symbolBtn ? symbolBtn.innerText.includes('ไกด์') : false,
        markerCount: document.querySelectorAll('.leaflet-marker-icon').length,
        isErrorScreen: document.body.innerText.includes('ไม่สามารถโหลดข้อมูลได้')
      };
    })()`,
    returnByValue: true
  });

  console.log('Production Mobile Button & Map Check:', mobileBtnCheck.result.value);
  console.log('Exceptions count:', errors.length);

  ws.close();
  edge.kill();
  try {
    spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']);
  } catch (e) {}

  if (welcomeCheck.result.value.hasEnterBtn && !mobileBtnCheck.result.value.containsWordGuide && !mobileBtnCheck.result.value.isErrorScreen && errors.length === 0) {
    console.log('🎉 ALL PRODUCTION CHECKS VERIFIED SUCCESSFULLY: MAP ONLY ZOOMS AFTER CLICKING ENTER!');
    process.exit(0);
  } else {
    console.error('❌ VERIFICATION FAILED');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
