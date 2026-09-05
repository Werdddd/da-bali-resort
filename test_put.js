const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/rooms/1',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': '1',
    'x-user-role': 'admin'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('BODY:', body));
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(JSON.stringify({ name: 'Test', type: 'Standard', description: 'test', price: 100, capacity: 2, beds: '1', image_url: '', status: 'Inactive' }));
req.end();
