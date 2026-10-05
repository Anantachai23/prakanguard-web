import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = process.env.TEMP + '\\edge_cdp_test_' + Date.now();

const edgeProcess = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=' + userDataDir,
  '--disable-gpu',
  '--window-size=390,844',
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

    // Find an unblocked pin on mobile screen
    const targetPin = await send('Runtime.evaluate', {
      expression: `(() => {
        const pin = document.querySelector('[data-point-id="sp-15"]');
        if (!pin) return null;
        const r = pin.getBoundingClientRect();
        return {
          id: 'sp-15',
          cx: Math.round(r.x + r.width / 2),
          cy: Math.round(r.y + r.height / 2)
        };
      })()`,
      returnByValue: true
    });

    console.log('Target pin for mobile touch:', targetPin.result.value);
    const { cx, cy } = targetPin.result.value;

    // Dispatch touchStart and touchEnd on the pin
    await send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: cx, y: cy }]
    });
    await sleep(80);
    await send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });

    await sleep(1000);

    const checkDetail = await send('Runtime.evaluate', {
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

    console.log('Mobile touch result on sp-15:', checkDetail.result.value);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    edgeProcess.kill();
  }
}

run();
