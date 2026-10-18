const https = require('https');

https.get('https://prakanguard-web.vercel.app', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matches = data.match(/assets\/[^\"]+\.js/g);
    console.log('Matches found on live Vercel:', matches);
  });
});
