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

    // Hit test
    const hitTest = await send('Runtime.evaluate', {
      expression: `(() => {
        const map = window.leafletMap;
        let targetMarker = null;
        map.eachLayer(l => {
          if (l instanceof L.Marker && l._icon && l._icon.innerHTML.includes('sp-10')) {
            targetMarker = l;
          }
        });
        if (!targetMarker) return 'not found';
        const rect = targetMarker._icon.getBoundingClientRect();
        const cx = Math.round(rect.x + rect.width / 2);
        const cy = Math.round(rect.y + rect.height / 2);
        const el = document.elementFromPoint(cx, cy);
        return {
          cx, cy,
          rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
          elTag: el?.tagName,
          elClass: el?.className,
          elIsIcon: el === targetMarker._icon,
          elIsChild: targetMarker._icon.contains(el),
          elementsAtPoint: document.elementsFromPoint(cx, cy).map(e => ({ tag: e.tagName, class: e.className })).slice(0, 8)
        };
      })()`,
      returnByValue: true
    });

    console.log('Hit test at marker center:', hitTest.result.value);

    // Now test real click with Input.dispatchMouseEvent at exact cx, cy
    const { cx, cy } = hitTest.result.value;

    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__log = [];
        const map = window.leafletMap;
        let targetMarker = null;
        map.eachLayer(l => {
          if (l instanceof L.Marker && l._icon && l._icon.innerHTML.includes('sp-10')) {
            targetMarker = l;
          }
        });
        targetMarker.on('click', () => window.__log.push('marker-clicked'));
        map.on('click', (e) => window.__log.push('map-clicked: ' + e.latlng));
      })()`
    });

    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: cx,
      y: cy
    });
    await sleep(50);
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: cx,
      y: cy,
      button: 'left',
      clickCount: 1
    });
    await sleep(50);
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: cx,
      y: cy,
      button: 'left',
      clickCount: 1
    });

    await sleep(500);

    const logRes = await send('Runtime.evaluate', {
      expression: `window.__log`,
      returnByValue: true
    });

    console.log('Click result log:', logRes.result.value);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    edgeProcess.kill();
  }
}

run();
