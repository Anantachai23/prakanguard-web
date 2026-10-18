const res = await fetch('https://prakanguard-web.vercel.app');
const html = await res.text();
const matches = html.match(/assets\/[^\"]+\.js/g);
console.log('Matches on Vercel:', matches);
