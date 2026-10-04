import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/pages');
const prefix = '/Vibe-UI-UX/';
const types = {html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json', woff2: 'font/woff2', svg: 'image/svg+xml', zip: 'application/zip'};
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {response.writeHead(405); response.end(); return;}
  const url = new URL(request.url, 'http://localhost:4174');
  if (url.pathname === '/') {response.writeHead(302, {Location: prefix}); response.end(); return;}
  if (!url.pathname.startsWith(prefix)) {response.writeHead(404); response.end(); return;}
  try {
    const relative = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) throw new Error('Outside static root');
    const data = await readFile(file);
    response.writeHead(200, {'Content-Type': types[file.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {response.writeHead(404); response.end('Not found');}
});
server.listen(4174, '127.0.0.1', () => console.log('Static Pages preview: http://localhost:4174' + prefix));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
