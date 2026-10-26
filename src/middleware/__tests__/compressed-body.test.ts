import { spawnSync } from 'node:child_process'

it('compressed trailing bytes cannot crash the HTTP parser process', () => {
  // Run the regression in its own process: the vulnerable parser could terminate Node.
  const script = `
    const express = require('express');
    const http = require('node:http');
    const { gzipSync } = require('node:zlib');
    const app = express();
    app.use(express.json());
    app.post('/', (_req, res) => res.json({ ok: true }));
    app.get('/health', (_req, res) => res.end('alive'));
    app.use((_err, _req, res, _next) => res.status(400).end('rejected'));
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const payload = Buffer.concat([gzipSync(Buffer.from('{"title":"fixture"}')), Buffer.from('invalid-trailing-data')]);
      let probed = false;
      const probe = () => {
        if (probed) return; probed = true;
        setTimeout(() => http.get({ hostname: '127.0.0.1', port, path: '/health' }, response => {
          let text = ''; response.on('data', chunk => text += chunk);
          response.on('end', () => server.close(() => { console.log(text); process.exit(text === 'alive' ? 0 : 1); }));
        }).on('error', () => process.exit(1)), 100);
      };
      const request = http.request({ hostname: '127.0.0.1', port, method: 'POST', headers: {
        'Content-Type': 'application/json', 'Content-Encoding': 'gzip', 'Content-Length': payload.length
      } }, response => { response.resume(); response.on('end', probe); });
      request.on('error', probe); request.end(payload);
    });
    setTimeout(() => process.exit(2), 5000).unref();
  `
  const result = spawnSync(process.execPath, ['-e', script], {
    encoding: 'utf8',
    timeout: 7000,
    cwd: process.cwd(),
  })
  expect(result.status).toBe(0)
  expect(result.stdout.trim()).toBe('alive')
})
