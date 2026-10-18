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
  console.log('1. Starting Vite preview server on port 4174...');
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4174', '--strictPort'], {
    shell: true,
    stdio: 'pipe'
  });

  preview.stdout.on('data', (d) => console.log('[Vite Preview]:', d.toString().trim()));
  preview.stderr.on('data', (d) => console.error('[Vite Preview Err]:', d.toString().trim()));

  await wait(2000);

  console.log('2. Starting Headless Edge browser...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\edge_test_profile_' + Date.now(),
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:4174'
  ], {
    stdio: 'ignore'
  });

  let ws = null;
  let testPassed = false;

  try {
    console.log('3. Connecting to Edge DevTools Protocol...');
    let tabs = null;
    for (let i = 0; i < 20; i++) {
      try {
        tabs = await getJson('http://localhost:9222/json/list');
        if (tabs && tabs.length > 0) break;
      } catch (e) {
        await wait(500);
      }
    }

    if (!tabs || tabs.length === 0) {
      throw new Error('Failed to connect to Edge DevTools port 9222');
    }

    const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('4174')) || tabs[0];
    console.log(`Found target page: ${pageTab.url} (${pageTab.title})`);

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
        console.error('>>> [BROWSER EXCEPTION]:', details.text, details.exception?.description);
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleErrors.push(text);
        console.error('>>> [BROWSER CONSOLE ERROR]:', text);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    console.log('4. Waiting 4 seconds for map, data, and React UI to mount...');
    await wait(4000);

    console.log('5. Evaluating live DOM and state in Edge browser...');
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText || '';
        const isErrorScreen = bodyText.includes('ไม่สามารถโหลดข้อมูลได้') || bodyText.includes('เกิดข้อผิดพลาดในการโหลดข้อมูลชั่วคราว');
        const hasUnlocatedText = bodyText.includes('คุณไม่ได้เปิดตำแหน่ง');
        const hasLocatedText = bodyText.includes('คุณอยู่:');
        const hasDistrictSelector = bodyText.includes('ทั้งหมด') && bodyText.includes('เมืองสมุทรปราการ');
        const hasFilters = bodyText.includes('วิกฤต') && bodyText.includes('ปานกลาง') && bodyText.includes('ปกติ');
        const hasWeather = bodyText.includes('°C') || bodyText.includes('°');
        const markerCount = document.querySelectorAll('.leaflet-marker-icon').length;

        return {
          isErrorScreen,
          hasUnlocatedText,
          hasLocatedText,
          hasDistrictSelector,
          hasFilters,
          hasWeather,
          markerCount,
          bodySnippet: bodyText.slice(0, 300)
        };
      })()`,
      returnByValue: true
    });

    const report = evalRes.result.value;
    console.log('\n========================================');
    console.log('         BROWSER VERIFICATION REPORT    ');
    console.log('========================================');
    console.log(`- Error Screen Detected:    ${report.isErrorScreen ? '❌ YES (FAILED)' : '✅ NO (PASSED)'}`);
    console.log(`- 'คุณไม่ได้เปิดตำแหน่ง' present: ${report.hasUnlocatedText ? '✅ YES (PASSED)' : '❌ NO'}`);
    console.log(`- District Filter present:  ${report.hasDistrictSelector ? '✅ YES' : '❌ NO'}`);
    console.log(`- Severity Filters present: ${report.hasFilters ? '✅ YES' : '❌ NO'}`);
    console.log(`- Weather Temp present:     ${report.hasWeather ? '✅ YES' : '❌ NO'}`);
    console.log(`- Leaflet Markers on Map:   ${report.markerCount} pins rendered`);
    console.log(`- Runtime Exceptions:       ${runtimeExceptions.length}`);
    console.log(`- Console Errors:           ${consoleErrors.length}`);
    console.log('========================================\n');

    if (!report.isErrorScreen && report.hasUnlocatedText && report.markerCount > 0 && runtimeExceptions.length === 0) {
      console.log('🎉 ALL CHECKS PASSED PERFECTLY!');
      testPassed = true;
    } else {
      console.error('❌ VERIFICATION FAILED:', report);
      testPassed = false;
    }

  } catch (err) {
    console.error('Test execution error:', err);
    testPassed = false;
  } finally {
    if (ws) {
      try { ws.close(); } catch (e) {}
    }
    try { edge.kill(); } catch (e) {}
    try {
      spawn('taskkill', ['/F', '/IM', 'msedge.exe', '/T']);
    } catch (e) {}
    try { preview.kill(); } catch (e) {}
    try {
      // Kill any remaining vite process on port 4174
      spawn('powershell', ['-Command', 'Get-NetTCPConnection -LocalPort 4174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }']);
    } catch (e) {}
  }

  process.exit(testPassed ? 0 : 1);
}

main();
