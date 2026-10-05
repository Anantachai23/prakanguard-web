import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = process.env.TEMP + '\\edge_cdp_test_' + Date.now();

const edgeProcess = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=' + userDataDir,
  '--disable-gpu',
  'http://127.0.0.1:5173/'
]);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  await sleep(2500);
  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    const target = tabs.find(t => t.url.includes('5173'));
    if (!target || !target.webSocketDebuggerUrl) {
      console.log('Target tab not found');
      return;
    }

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.onopen = resolve);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await sleep(2000);

    // 1. Close WelcomeModal if open
    await send('Runtime.evaluate', {
      expression: `(() => {
        const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('เข้าสู่ระบบ') || b.textContent.includes('เริ่มใช้งาน'));
        if (enterBtn) {
          enterBtn.click();
          return 'Clicked enter button';
        }
        const closeBtn = document.querySelector('.fixed.inset-0.z-50 button');
        if (closeBtn) {
          closeBtn.click();
          return 'Clicked close button';
        }
        return 'No modal button found';
      })()`
    });

    await sleep(1500);

    // 2. Inspect map and pins
    const pinsInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const pins = Array.from(document.querySelectorAll('.pg-flood-pin-container'));
        return pins.slice(0, 5).map(p => {
          const rect = p.getBoundingClientRect();
          const topEl = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return {
            id: p.getAttribute('data-point-id'),
            x: Math.round(rect.x + rect.width / 2),
            y: Math.round(rect.y + rect.height / 2),
            width: rect.width,
            height: rect.height,
            topElTag: topEl ? topEl.tagName : null,
            topElClass: topEl ? topEl.className : null,
            topElIsInsidePin: topEl ? (p.contains(topEl) || topEl === p) : false
          };
        });
      })()`,
      returnByValue: true
    });

    console.log('Pins info after closing welcome modal:', pinsInfo.result.value);

    // 3. Test REAL mouse click via CDP Input.dispatchMouseEvent at pin 0
    if (pinsInfo.result.value.length > 0) {
      const pin0 = pinsInfo.result.value[0];
      console.log(`Dispatching real mouse click at (${pin0.x}, ${pin0.y})...`);
      
      await send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: pin0.x,
        y: pin0.y,
        button: 'left',
        clickCount: 1
      });
      await sleep(50);
      await send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: pin0.x,
        y: pin0.y,
        button: 'left',
        clickCount: 1
      });

      await sleep(1000);

      // Check what state changed
      const clickResult = await send('Runtime.evaluate', {
        expression: `(() => {
          const detailCard = document.querySelector('[class*="slide-in-from-bottom"]');
          const popup = document.querySelector('.leaflet-popup');
          return {
            hasDetailCard: !!detailCard,
            cardText: detailCard ? detailCard.innerText.slice(0, 150) : null,
            hasPopup: !!popup,
            selectedPinClass: document.querySelector('.pg-pin-selected')?.getAttribute('data-point-id')
          };
        })()`,
        returnByValue: true
      });

      console.log('Result of real mouse click:', clickResult.result.value);
    }

    // 4. Now test mobile emulation with touch events!
    console.log('--- Testing Mobile Viewport & Touch ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true
    });
    await send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    });

    await sleep(1000);

    const mobilePinsInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const pins = Array.from(document.querySelectorAll('.pg-flood-pin-container'));
        return pins.slice(0, 3).map(p => {
          const rect = p.getBoundingClientRect();
          const topEl = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return {
            id: p.getAttribute('data-point-id'),
            x: Math.round(rect.x + rect.width / 2),
            y: Math.round(rect.y + rect.height / 2),
            topElTag: topEl ? topEl.tagName : null,
            topElClass: topEl ? topEl.className : null,
            isInsidePin: topEl ? (p.contains(topEl) || topEl === p) : false
          };
        });
      })()`,
      returnByValue: true
    });

    console.log('Mobile pins info:', mobilePinsInfo.result.value);

    if (mobilePinsInfo.result.value.length > 0) {
      const mPin = mobilePinsInfo.result.value[0];
      console.log(`Dispatching touch tap at (${mPin.x}, ${mPin.y})...`);

      await send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: mPin.x, y: mPin.y }]
      });
      await sleep(60);
      await send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: []
      });

      await sleep(1000);

      const mobileTapResult = await send('Runtime.evaluate', {
        expression: `(() => {
          const detailCard = document.querySelector('[class*="slide-in-from-bottom"]');
          return {
            hasDetailCard: !!detailCard,
            cardText: detailCard ? detailCard.innerText.slice(0, 150) : null,
            selectedPinId: document.querySelector('.pg-pin-selected')?.getAttribute('data-point-id')
          };
        })()`,
        returnByValue: true
      });

      console.log('Result of mobile touch tap:', mobileTapResult.result.value);
    }

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    edgeProcess.kill();
  }
}

run();
