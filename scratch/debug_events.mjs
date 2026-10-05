import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = process.env.TEMP + '\\edge_cdp_test_' + Date.now();

const edgeProcess = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=' + userDataDir,
  '--disable-gpu',
  '--window-size=1280,800',
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

    // Close welcome modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const enterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('เข้าสู่ระบบ') || b.textContent.includes('เริ่มใช้งาน'));
        if (enterBtn) enterBtn.click();
      })()`
    });

    await sleep(2000);

    // Find pins strictly inside map viewport (y between 120 and 700, x between 400 and 1100)
    const visiblePins = await send('Runtime.evaluate', {
      expression: `(() => {
        const pins = Array.from(document.querySelectorAll('.pg-flood-pin-container'));
        const inView = [];
        pins.forEach(pin => {
          const r = pin.getBoundingClientRect();
          const cx = Math.round(r.x + r.width / 2);
          const cy = Math.round(r.y + r.height / 2);
          if (cx > 420 && cx < 1150 && cy > 120 && cy < 650) {
            const topEl = document.elementFromPoint(cx, cy);
            inView.push({
              id: pin.getAttribute('data-point-id'),
              cx,
              cy,
              topElTag: topEl?.tagName,
              topElClass: topEl?.className,
              topElIsPin: pin.contains(topEl) || pin === topEl
            });
          }
        });
        return inView;
      })()`,
      returnByValue: true
    });

    console.log('Visible pins in center of map:', visiblePins.result.value);

    if (visiblePins.result.value.length > 0) {
      const targetPin = visiblePins.result.value[0];
      console.log('Testing click on visible pin:', targetPin);

      // Listen for click inside page
      await send('Runtime.evaluate', {
        expression: `(() => {
          window.__clickedPin = false;
          window.__clickedMap = false;
          window.leafletMap.on('click', () => { window.__clickedMap = true; });
          const pin = document.querySelector('[data-point-id="${targetPin.id}"]');
          if (pin) pin.addEventListener('click', () => { window.__clickedPin = true; });
        })()`
      });

      // Dispatch real mouse move, down, up
      await send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: targetPin.cx,
        y: targetPin.cy
      });
      await sleep(100);

      await send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: targetPin.cx,
        y: targetPin.cy,
        button: 'left',
        clickCount: 1
      });
      await sleep(80);
      await send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: targetPin.cx,
        y: targetPin.cy,
        button: 'left',
        clickCount: 1
      });

      await sleep(1000);

      const checkState = await send('Runtime.evaluate', {
        expression: `(() => {
          const detailCard = document.querySelector('[class*="slide-in-from-bottom"]');
          const popup = document.querySelector('.leaflet-popup');
          return {
            windowClickedPin: window.__clickedPin,
            windowClickedMap: window.__clickedMap,
            hasDetailCard: !!detailCard,
            cardText: detailCard ? detailCard.innerText.slice(0, 150) : null,
            hasPopup: !!popup,
            selectedPinId: document.querySelector('.pg-pin-selected')?.getAttribute('data-point-id')
          };
        })()`,
        returnByValue: true
      });

      console.log('Result after clicking visible pin:', checkState.result.value);
    }

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    edgeProcess.kill();
  }
}

run();
