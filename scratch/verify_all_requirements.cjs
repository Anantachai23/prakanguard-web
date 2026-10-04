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

async function runTest(width, height, isMobile) {
  console.log(`\n--- Testing ${isMobile ? 'MOBILE (390x844)' : 'DESKTOP (1280x800)'} ---`);
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--window-size=${width},${height}`,
    '--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\edge_test_' + Date.now(),
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

  // Check top navbar for temperature
  const navCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const header = document.querySelector('header');
      const headerText = header ? header.innerText : '';
      const hasDegreeC = headerText.includes('°C');
      return {
        headerFound: !!header,
        hasDegreeC,
        headerSnippet: headerText.replace(/\\s+/g, ' ').slice(0, 100)
      };
    })()`,
    returnByValue: true
  });

  console.log('Top Navbar Check:', navCheck.result.value);

  // Check Welcome Modal & Enter button
  const enterCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const enterBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('เข้าสู่ระบบเว็บไซต์')
      );
      if (enterBtn) {
        enterBtn.click();
        return { clicked: true, text: enterBtn.innerText.trim() };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });

  console.log('Welcome Modal Enter Click:', enterCheck.result.value);

  await wait(2500);

  // Check LocalStorage signature
  const sigCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        floodSig: localStorage.getItem('prakanguard_last_flood_sig'),
        hasSig: !!localStorage.getItem('prakanguard_last_flood_sig')
      };
    })()`,
    returnByValue: true
  });

  console.log('Flood Notification Signature Check:', sigCheck.result.value);
  console.log('Console Errors:', errors.length);

  ws.close();
  edge.kill();
  await wait(1000);
}

async function main() {
  await runTest(390, 844, true);
  await runTest(1280, 800, false);
  console.log('\nAll tests completed!');
}

main().catch(console.error);
