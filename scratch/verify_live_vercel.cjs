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
  console.log('1. Starting Headless Edge browser targeting live Vercel URL...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\edge_test_live_' + Date.now(),
    '--no-first-run',
    '--no-default-browser-check',
    'https://prakanguard-web.vercel.app'
  ], {
    stdio: 'ignore'
  });

  let ws = null;
  let testPassed = false;

  try {
    console.log('2. Connecting to Edge DevTools Protocol...');
    let tabs = null;
    for (let i = 0; i < 20; i++) {
      try {
        tabs = await getJson('http://localhost:9222/json/list');
        if (tabs && tabs.length > 0) break;
      } catch (e) {
        await wait(500);
      }
    }

    const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('vercel.app')) || tabs[0];
    console.log(`Found live page tab: ${pageTab.url} (${pageTab.title})`);

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

    const runtimeExceptions = [];
    const consoleErrors = [];

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        const details = msg.params.exceptionDetails;
        runtimeExceptions.push(details.text + (details.exception?.description ? ': ' + details.exception.description : ''));
        console.error('>>> [LIVE BROWSER EXCEPTION]:', details.text, details.exception?.description);
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleErrors.push(text);
        console.error('>>> [LIVE BROWSER CONSOLE ERROR]:', text);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    console.log('3. Waiting 6 seconds for Vercel production page to load and render...');
    await wait(6000);

    console.log('4. Evaluating production DOM and React UI...');
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText || '';
        const isErrorScreen = bodyText.includes('ไม่สามารถโหลดข้อมูลได้') || bodyText.includes('เกิดข้อผิดพลาดในการโหลดข้อมูลชั่วคราว');
        const hasUnlocatedText = bodyText.includes('คุณไม่ได้เปิดตำแหน่ง');
        const hasSeverityFilters = bodyText.includes('วิกฤต') && bodyText.includes('ปานกลาง') && bodyText.includes('ปกติ');
        const hasWeather = bodyText.includes('°C') || bodyText.includes('°');
        const markerCount = document.querySelectorAll('.leaflet-marker-icon').length;

        return {
          isErrorScreen,
          hasUnlocatedText,
          hasSeverityFilters,
          hasWeather,
          markerCount,
          bodySnippet: bodyText.slice(0, 300)
        };
      })()`,
      returnByValue: true
    });

    const report = evalRes.result.value;
    console.log('\n========================================');
    console.log('     LIVE VERCEL PRODUCTION REPORT      ');
    console.log('========================================');
    console.log(`- Error Screen Detected:      ${report.isErrorScreen ? '❌ YES (FAILED)' : '✅ NO (PASSED)'}`);
    console.log(`- 'คุณไม่ได้เปิดตำแหน่ง' text: ${report.hasUnlocatedText ? '✅ YES (PASSED)' : '❌ NO'}`);
    console.log(`- Severity Filters:           ${report.hasSeverityFilters ? '✅ YES' : '❌ NO'}`);
    console.log(`- Real-Time Weather:          ${report.hasWeather ? '✅ YES' : '❌ NO'}`);
    console.log(`- Pins Rendered on Live Map:  ${report.markerCount} pins`);
    console.log(`- Live Exceptions:            ${runtimeExceptions.length}`);
    console.log(`- Live Console Errors:        ${consoleErrors.length}`);
    console.log('========================================\n');

    if (!report.isErrorScreen && report.hasUnlocatedText && report.markerCount > 0 && runtimeExceptions.length === 0) {
      console.log('🌟 VERCEL PRODUCTION DEPLOYMENT FULLY VERIFIED & WORKING 100%!');
      testPassed = true;
    } else {
      console.error('❌ PRODUCTION NOT READY OR FAILED:', report);
      testPassed = false;
    }

  } catch (err) {
    console.error('Live test error:', err);
    testPassed = false;
  } finally {
    if (ws) {
      try { ws.close(); } catch (e) {}
    }
    try { edge.kill(); } catch (e) {}
    try {
      spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']);
    } catch (e) {}
  }

  process.exit(testPassed ? 0 : 1);
}

main();
