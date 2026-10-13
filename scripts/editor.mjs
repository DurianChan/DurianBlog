import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { existsSync, createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const adminURL = 'http://localhost:1314/admin/';
const children = [];
let server;
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  server?.close();
  for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 300);
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
process.on('SIGHUP', () => stop());
process.on('exit', () => { for (const child of children) child.kill(); });

async function checkPort(port) {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => reject(new Error(`Port ${port} is in use. Close the previous preview/editor window first.`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}

function launch(command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true,
  });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) { console.error(`A preview service exited (${code}).`); stop(1); } });
  return child;
}

async function waitFor(url, options) {
  for (let attempt = 0; attempt < 100 && !stopping; attempt++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Service did not become ready: ${url}`);
}

try {
  const cms = path.join(root, 'node_modules/decap-cms/dist/decap-cms.js');
  const proxy = path.join(root, 'node_modules/decap-server/dist/index.js');
  if (!existsSync(cms) || !existsSync(proxy)) throw new Error('Dependencies missing. Run npm ci, then start again.');
  for (const port of [1315, 1314, 8081]) await checkPort(port);

  const files = new Map([
    ['/admin/', [path.join(root, 'local-admin/index.html'), 'text/html; charset=utf-8']],
    ['/admin/config.yml', [path.join(root, 'local-admin/config.yml'), 'text/yaml; charset=utf-8']],
    ['/admin/preview.css', [path.join(root, 'local-admin/preview.css'), 'text/css; charset=utf-8']],
    ['/admin/decap-cms.js', [cms, 'text/javascript; charset=utf-8']],
  ]);
  server = http.createServer((req, res) => {
    if (!['localhost:1314', '127.0.0.1:1314'].includes(req.headers.host)) {
      res.writeHead(403).end(); return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const pathname = new URL(req.url, adminURL).pathname;
    if (pathname === '/' || pathname === '/admin') { res.writeHead(302, { Location: '/admin/' }).end(); return; }
    const file = files.get(pathname);
    if (!file) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') res.end(); else createReadStream(file[0]).pipe(res);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(1314, '127.0.0.1', resolve);
  });
  launch(process.execPath, [proxy], { PORT: '8081', BIND_HOST: '127.0.0.1', ORIGIN: 'http://localhost:1314', MODE: 'fs' });
  const portableHugo = path.join(root, '.tools/hugo/hugo.exe');
  launch(existsSync(portableHugo) ? portableHugo : 'hugo', [
    'server', '--buildDrafts', '--buildFuture', '--disableFastRender', '--renderToMemory', '--bind', '127.0.0.1',
    '--port', '1315', '--baseURL', 'http://localhost:1315/DurianBlog/',
  ]);
  await Promise.all([
    waitFor('http://localhost:8081/api/v1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'info' }) }),
    waitFor('http://localhost:1315/DurianBlog/'),
  ]);
  console.log(`\nEditor:  ${adminURL}\nPreview: http://localhost:1315/DurianBlog/\nSaves stay local. Use GitHub Desktop to commit and push when ready.\nPress Ctrl+C to stop all services.\n`);
  if (process.platform === 'win32' && !process.argv.includes('--no-open')) {
    const browser = spawn('explorer.exe', [adminURL], { windowsHide: true, stdio: 'ignore' });
    browser.on('error', () => console.log(`Open ${adminURL} in your browser.`));
    browser.unref();
  }
} catch (error) {
  console.error(error.message);
  stop(1);
}
