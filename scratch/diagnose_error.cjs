const http = require('http');

async function test() {
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = tabs.find(t => t.type === 'page' && t.url.includes('4174'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
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

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error("\n>>> EXCEPTION THROWN DETAILS:");
      console.error(JSON.stringify(msg.params.exceptionDetails, null, 2));
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.reload');

  await new Promise(r => setTimeout(r, 2000));
  ws.close();
  process.exit(0);
}

test().catch(err => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
