#!/usr/bin/env node
// look.mjs: see a reaction the way a reviewer should, as frames you can read one at a time.
//
//   node tools/look.mjs "http://localhost:8000/select/" --select "sakuga-select" --act "0:..." --times 0,0.1,0.2,0.4
//   node tools/look.mjs "/select/" --serve . --select "sakuga-select" --act "0:..." --times 0,0.1,0.2,0.4
//
// Opens the page in headless Chrome, stops the Sakuga clock (SakugaFX.paused), steps it to each time with SakugaFX.advance, and photographs
// the element with room around it (the effects fly outside it). Saves one sheet with every frame side by side.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const flagsWithValues = new Set(['--times', '--select', '--pad', '--do', '--act', '--zoom', '--cols', '--width', '--height', '--out', '--serve']);
const urlArg = args.find((a, i) => !a.startsWith('--') && !flagsWithValues.has(args[i - 1]));
const opt = (name, fallback) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : fallback; };
const hasFlag = (name) => args.includes('--' + name);
if (!urlArg) { console.error('usage: node tools/look.mjs URL [--serve dir] --times 0,0.1,0.3 [--select css] [--act "0:js"] [--out sheet.png]'); process.exit(2); }
const acts = args.flatMap((a, i) => (a === '--act' ? [args[i + 1]] : [])).map((v) => [parseFloat(v), v.slice(v.indexOf(':') + 1)]).sort((a, b) => a[0] - b[0]);
const times = opt('times', '0,0.1,0.2,0.4').split(',').map(Number), out = opt('out', 'sheet.png'), pad = +opt('pad', 140), zoom = +opt('zoom', 1);
const cols = +opt('cols', Math.min(4, times.length)), width = +opt('width', 900), height = +opt('height', 800), after = opt('do', ''), select = opt('select', '');
const full = hasFlag('full');
const serveDir = opt('serve', '');
const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!CHROME) { console.error('Chrome not found. Set CHROME to its path.'); process.exit(2); }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
let server = null;
let url = urlArg;
if (serveDir) {
  const root = resolve(serveDir);
  server = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = join(root, p);
    if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  url = urlArg.startsWith('http') ? urlArg : `http://127.0.0.1:${addr.port}${urlArg.startsWith('/') ? '' : '/'}${urlArg}`;
}

const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'look-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60 && !targets?.some?.((t) => t.type === 'page'); i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {}
  await sleep(200);
}
if (!targets?.some?.((t) => t.type === 'page')) {
  chrome.kill(); server?.close();
  console.error('Could not connect to Chrome DevTools port.');
  process.exit(1);
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(), errors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, (m) => res(m.result)); ws.send(JSON.stringify({ id: i, method, params })); });
const run = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;

await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url }); await sleep(1200);
if (!(await run('!!window.SakugaFX'))) { console.error('No SakugaFX on that page.'); ws.close(); chrome.kill(); server?.close(); process.exit(1); }

let clip;
if (full) {
  clip = { x: 0, y: 0, width, height, scale: 1 };
} else {
  const pick = select ? JSON.stringify(select) : 'null';
  const box = JSON.parse(await run(`(() => { const s = ${pick}; const el = s ? s.split(' >>> ').reduce((r, q, i) => (i ? r.shadowRoot : r).querySelector(q), document) : [...document.querySelectorAll('*')].find((e) => e.localName.startsWith('sakuga-'));
    if (!el) throw new Error('nothing to frame'); el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(); return JSON.stringify({ x: b.left, y: b.top, w: b.width, h: b.height }); })()`));
  clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(width, box.w + pad * 2), height: Math.min(height, box.h + pad * 2), scale: 1 };
}

await run('SakugaFX.paused = true');
if (after) await run(after);
let clock = 0; const shots = [];
const go = async (t) => { await run(`(() => { let n = Math.round(${(t - clock) * 60}); while (n-- > 0) SakugaFX.advance(1 / 60); })()`); clock = t; };
for (const t of times) {
  while (acts.length && acts[0][0] <= t) { const [at, js] = acts.shift(); await go(at); await run(js); }
  await go(t); await sleep(60);
  shots.push([t, (await send('Page.captureScreenshot', { format: 'png', clip })).data]);
}
const data = await run(`(async () => { const s = ${JSON.stringify(shots)}; const imgs = await Promise.all(s.map(([, d]) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + d; })));
  const w = Math.round(imgs[0].width * ${zoom}), h = Math.round(imgs[0].height * ${zoom}), cols = ${cols}, rows = Math.ceil(imgs.length / cols), o = document.createElement('canvas'); o.width = (w + 8) * cols + 8; o.height = (h + 26) * rows + 8;
  const x = o.getContext('2d'); x.fillStyle = '#2b2b30'; x.fillRect(0, 0, o.width, o.height); x.font = '13px monospace';
  imgs.forEach((im, i) => { const px = 8 + (i % cols) * (w + 8), py = 8 + Math.floor(i / cols) * (h + 26); x.drawImage(im, px, py + 18, w, h); x.fillStyle = '#d0d0d8'; x.fillText(s[i][0].toFixed(2) + ' s', px, py + 12); });
  return o.toDataURL('image/png'); })()`);
writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
console.log(`${times.length} frames, saved ${out}`);
console.log(errors.length ? 'script errors:\n  ' + errors.join('\n  ') : 'no script errors');
ws.close(); chrome.kill(); server?.close();
await sleep(250); try { rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(errors.length ? 1 : 0);
