const https = require('https');

function fetchHtml() {
  return new Promise((resolve, reject) => {
    https.get('https://prakanguard-web.vercel.app?v=' + Date.now(), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function check() {
  for (let i = 1; i <= 30; i++) {
    try {
      const html = await fetchHtml();
      const match = html.match(/assets\/(index-[a-zA-Z0-9_-]+\.js)/);
      const bundle = match ? match[1] : 'unknown';
      console.log(`[Attempt ${i}/30] Live bundle: ${bundle}`);
      if (bundle === 'index-BqLMg5ot.js') {
        console.log(`>>> NEW DEPLOYMENT DETECTED: ${bundle} (Commit 4ece416 is LIVE!)`);
        return true;
      }
    } catch (e) {
      console.error('Error fetching Vercel:', e.message);
    }
    await new Promise(r => setTimeout(r, 3500));
  }
  return false;
}

check().then(ok => process.exit(ok ? 0 : 1));
