const http = require('http');

function testUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, length: data.length, bodySnippet: data.slice(0, 300) });
      });
    }).on('error', reject);
  });
}

async function run() {
  const routes = [
    '/',
    '/login',
    '/signup',
    '/products',
    '/products/prod-1',
    '/design-submission',
    '/dashboard',
    '/admin',
    '/admin/orders'
  ];

  console.log('Testing App Routes:');
  for (const r of routes) {
    try {
      const res = await testUrl(r);
      console.log(`[${res.statusCode}] ${r} (${res.length} bytes)`);
    } catch (e) {
      console.error(`[ERR] ${r}:`, e.message);
    }
  }
}

run();
