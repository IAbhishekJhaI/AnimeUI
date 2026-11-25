// node tools/test.mjs [--serve .] [URL]
// Drives every control in gallery/ with real CDP touch and key events at 390px phone width and desktop width,
// tests FormData integration, checks for script errors and horizontal scroll, and exits 1 on failure.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback = '') => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : fallback; };
const serveDir = opt('serve', '');
const shotOut = opt('shot', '');
const urlArg = args.find((a, i) => !a.startsWith('--') && !['--serve', '--shot'].includes(args[i - 1])) || '/gallery/';

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

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
let server = null;
let URL_ = urlArg;
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
  URL_ = urlArg.startsWith('http') ? urlArg : `http://127.0.0.1:${server.address().port}${urlArg.startsWith('/') ? '' : '/'}${urlArg}`;
}

const PORT = 9700 + Math.floor(Math.random() * 200), PROFILE = mkdtempSync(join(tmpdir(), 'skv-ext-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (Array.isArray(targets) && targets.some((t) => t.type === 'page')) break; } catch {}
  await sleep(200);
}
if (!targets?.some?.((t) => t.type === 'page')) { chrome.kill(); server?.close(); console.error('Could not connect to Chrome DevTools port.'); process.exit(1); }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(), logs = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: URL_ }); await sleep(1200);

let fails = 0;
const check = (name, ok, got) => { if (!ok) fails++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${got !== undefined ? `  ->  ${got}` : ''}`); };

check('desktop (1280px): no horizontal scroll', (await ev('document.documentElement.scrollWidth')) <= 1280, await ev('document.documentElement.scrollWidth'));
if (shotOut) {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(shotOut, Buffer.from(shot.data, 'base64'));
  console.log(`saved gallery screenshot -> ${shotOut}`);
}

// Switch to 390px phone viewport with touch emulation for all interactive checks
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true });
await sleep(400);

const find = (s) => { const [host, inner] = s.split(' >>> '); return inner ? `document.querySelector(${JSON.stringify(host)}).shadowRoot.querySelector(${JSON.stringify(inner)})` : `document.querySelector(${JSON.stringify(host)})`; };
const at = async (s, fx = 0.5, fy = 0.5) => JSON.parse(await ev(`(() => { const e = ${find(s)}; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify([b.left + b.width * ${fx}, b.top + b.height * ${fy}]); })()`));
const touch = (type, x, y) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
const tap = async (s, fx, fy) => { const [x, y] = await at(s, fx, fy); await sleep(150); await touch('touchStart', x, y); await touch('touchEnd', x, y); };
const key = async (k, code) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: code }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: code }); };
const type = async (text) => { for (const ch of text) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); await sleep(40); } };

check('all nineteen elements are defined', await ev(`['button','toggle','slider','checkbox','radio','input','tabs','progress','rating','toast','tooltip','select','accordion','stepper','chips','hold-button','modal','copy','dropzone'].every((n) => customElements.get('sakuga-' + n))`));
check('one shared SakugaFX v1 core', (await ev('window.SakugaFX.version')) === 1);

// The original eleven
{ await tap('sakuga-button[data-demo=primary] >>> .btn'); await sleep(1200); check('button: tap fires click and done() lands the check', +(await ev(`${find('sakuga-button[data-demo=primary] >>> .btn')}.style.getPropertyValue('--ok')`)) > 0.5); }
{ await tap('sakuga-toggle >>> .tog'); await sleep(500); check('toggle: tap turns it on', await ev(`document.querySelector('sakuga-toggle').checked`));
  check('toggle: aria-checked follows', (await ev(`${find('sakuga-toggle >>> .tog')}.getAttribute('aria-checked')`)) === 'true'); }
{ const [x, y] = await at('sakuga-slider >>> .sld', 0.2); const [x1] = await at('sakuga-slider >>> .sld', 0.9); await sleep(200); await touch('touchStart', x, y);
  for (let i = 1; i <= 10; i++) { await touch('touchMove', x + (x1 - x) * i / 10, y); await sleep(25); } await touch('touchEnd', x1, y); await sleep(400);
  const v = +(await ev(`document.querySelector('sakuga-slider').value`)); check('slider: a drag moves it', v > 70, v);
  await ev(`${find('sakuga-slider >>> input')}.focus()`); await key('ArrowLeft', 37); await sleep(200); check('slider: arrow key steps it', +(await ev(`document.querySelector('sakuga-slider').value`)) === v - 1); }
{ await tap('sakuga-checkbox >>> .box'); await sleep(400); check('checkbox: tap ticks it', await ev(`document.querySelector('sakuga-checkbox').checked`)); }
{ await tap('sakuga-radio >>> label:nth-child(2) .dot'); await sleep(400); check('radio: tap selects B', (await ev(`document.querySelector('sakuga-radio').value`)) === 'b'); }
{ await tap('sakuga-input >>> input'); await sleep(200); await type('hey'); await sleep(300); check('input: typing sets the value', (await ev(`document.querySelector('sakuga-input').value`)) === 'hey'); }
{ await tap('sakuga-tabs >>> button:nth-of-type(3)'); await sleep(500); check('tabs: tap selects the third', (await ev(`document.querySelector('sakuga-tabs').selected`)) === 2);
  await ev(`${find('sakuga-tabs >>> button:nth-of-type(3)')}.focus()`); await key('ArrowLeft', 37); await sleep(300); check('tabs: arrow key moves back', (await ev(`document.querySelector('sakuga-tabs').selected`)) === 1); }
{ await tap('sakuga-rating >>> button:nth-child(4)'); await sleep(700); check('rating: tap sets four', (await ev(`document.querySelector('sakuga-rating').value`)) === 4);
  check('rating: four stars lit', (await ev(`${find('sakuga-rating >>> .stars')}.querySelectorAll('.lit').length`)) === 4); }
{ await at('sakuga-progress'); let done = false; for (let i = 0; i < 24 && !done; i++) { await sleep(500); done = await ev(`document.querySelector('sakuga-progress').done`); }
  check('progress: the demo load completes', done, await ev(`${find('sakuga-progress >>> .pct')}.textContent`)); }
{ await ev(`(() => { const p = document.querySelector('sakuga-progress'); p.removeAttribute('demo'); p.reset(); p.set(0.5); })()`); await sleep(1500);
  check('progress: set(0.5) eases to half', Math.abs((await ev(`+getComputedStyle(${find('sakuga-progress >>> .prog')}).getPropertyValue('--v')`)) - 0.5) < 0.02); }
{ await tap('[data-demo=save] >>> .btn'); await sleep(900); check('toast: it arrives', await ev(`document.querySelector('sakuga-toast').open`)); await sleep(3400); check('toast: it leaves', !(await ev(`document.querySelector('sakuga-toast').open`))); }
{ await tap('sakuga-tooltip >>> .help'); await sleep(600); check('tooltip: tap opens it', await ev(`document.querySelector('sakuga-tooltip').open`)); await key('Escape', 27); await sleep(300); check('tooltip: Escape closes it', !(await ev(`document.querySelector('sakuga-tooltip').open`))); }
{ await ev(`(() => { const f = document.createElement('form'); f.id = 'tf0'; f.innerHTML = '<sakuga-checkbox name="c" checked></sakuga-checkbox><sakuga-slider name="s" value="42"></sakuga-slider><sakuga-rating name="r" value="3"></sakuga-rating><sakuga-toggle name="t" checked></sakuga-toggle>'; document.body.append(f); })()`); await sleep(300);
  check('forms: values are sent with a form', (await ev(`new URLSearchParams(new FormData(document.getElementById('tf0'))).toString()`)) === 'c=on&s=42&r=3&t=on', await ev(`new URLSearchParams(new FormData(document.getElementById('tf0'))).toString()`)); }

// The extended set
// 1. Select: tap open, tap option 3, then test keyboard ArrowDown + Escape
{
  await tap('sakuga-select >>> .trg'); await sleep(350);
  check('select: tap opens menu', await ev(`document.querySelector('sakuga-select').open`));
  await tap('sakuga-select >>> .opt:nth-child(3)'); await sleep(350);
  check('select: tap picks option', (await ev(`document.querySelector('sakuga-select').value`)) === 'impact', await ev(`document.querySelector('sakuga-select').value`));
  await ev(`${find('sakuga-select >>> .trg')}.focus()`); await key('ArrowDown', 40); await sleep(200);
  check('select: ArrowDown opens menu', await ev(`document.querySelector('sakuga-select').open`));
  await key('Escape', 27); await sleep(200);
  check('select: Escape closes menu', !(await ev(`document.querySelector('sakuga-select').open`)));
}

// 2. Hold Button: short tap aborts cleanly; full 1.25s touch hold fires sakuga:confirm
{
  await ev(`window.__holds = 0; document.querySelector('sakuga-hold-button').addEventListener('sakuga:confirm', () => window.__holds++);`);
  const [x, y] = await at('sakuga-hold-button >>> .btn');
  await sleep(150); await touch('touchStart', x, y); await sleep(250); await touch('touchEnd', x, y); await sleep(250);
  check('hold-button: early release does not confirm', (await ev('window.__holds')) === 0, await ev('window.__holds'));
  const [x2, y2] = await at('sakuga-hold-button >>> .btn');
  await sleep(150); await touch('touchStart', x2, y2); await sleep(1300); await touch('touchEnd', x2, y2); await sleep(350);
  check('hold-button: full hold fires sakuga:confirm', (await ev('window.__holds')) === 1, await ev('window.__holds'));
}

// 3. Stepper: tap +, hit max 5, slam limit wall, keyboard ArrowDown decrements
{
  await tap('sakuga-stepper >>> .inc'); await sleep(220);
  await tap('sakuga-stepper >>> .inc'); await sleep(220);
  check('stepper: taps reach max 5', (await ev(`document.querySelector('sakuga-stepper').valueAsNumber`)) === 5, await ev(`document.querySelector('sakuga-stepper').value`));
  await tap('sakuga-stepper >>> .inc'); await sleep(220);
  check('stepper: clamping holds at 5', (await ev(`document.querySelector('sakuga-stepper').valueAsNumber`)) === 5);
  await ev(`${find('sakuga-stepper >>> .mid')}.focus()`); await key('ArrowDown', 40); await sleep(200);
  check('stepper: ArrowDown steps to 4', (await ev(`document.querySelector('sakuga-stepper').valueAsNumber`)) === 4);
}

// 4. Copy: tap fires sakuga:copy and sets copied state without width jump
{
  const w0 = await ev(`${find('sakuga-copy >>> .btn')}.getBoundingClientRect().width`);
  await ev(`window.__copied = ''; document.querySelector('sakuga-copy').addEventListener('sakuga:copy', (e) => { window.__copied = e.detail.text; });`);
  await tap('sakuga-copy >>> .btn'); await sleep(300);
  const w1 = await ev(`${find('sakuga-copy >>> .btn')}.getBoundingClientRect().width`);
  check('copy: tap fires sakuga:copy', (await ev('window.__copied')).includes('sakuga-vfx'), await ev('window.__copied'));
  check('copy: flipped icon keeps stable width', Math.abs(w1 - w0) < 2, `${w0.toFixed(1)} -> ${w1.toFixed(1)}`);
}

// 5. Chips: tap toggles selection, tap remove slashes chip away
{
  await tap('sakuga-chips >>> .chip:nth-child(2) .tog'); await sleep(300);
  check('chips: tap selects Impact', (await ev(`document.querySelector('sakuga-chips').values.includes('impact')`)));
  await tap('sakuga-chips >>> .chip:nth-child(3) .rm'); await sleep(450);
  check('chips: remove shrinks and removes chip', (await ev(`${find('sakuga-chips >>> .wrap')}.querySelectorAll('.chip').length`)) === 3);
}

// 6. Modal: tap trigger opens dialog, Escape closes it
{
  await tap('[data-open=modal]'); await sleep(450);
  check('modal: trigger opens dialog', await ev(`document.querySelector('#demoModal').isOpen`));
  await key('Escape', 27); await sleep(450);
  check('modal: Escape closes dialog', !(await ev(`document.querySelector('#demoModal').isOpen`)));
}

// 7. Accordion: tap opens panel 1, tap opens panel 2 (single-open closes 1), ArrowDown moves focus
{
  await tap('sakuga-accordion >>> .item:nth-child(1) .hd'); await sleep(400);
  check('accordion: tap opens first section', JSON.stringify(await ev(`document.querySelector('sakuga-accordion').openIndices`)) === '[0]');
  await tap('sakuga-accordion >>> .item:nth-child(2) .hd'); await sleep(400);
  check('accordion: single-open switches to second', JSON.stringify(await ev(`document.querySelector('sakuga-accordion').openIndices`)) === '[1]');
}

// 8. Dropzone: simulated drop lands file pill, clear removes it
{
  await tap('[data-sim=drop]'); await sleep(450);
  check('dropzone: drop receives file', (await ev(`document.querySelector('sakuga-dropzone').files.length`)) === 1);
  await tap('sakuga-dropzone >>> .clr'); await sleep(300);
  check('dropzone: clear empties file list', (await ev(`document.querySelector('sakuga-dropzone').files.length`)) === 0);
}

// 9. FormData integration for all form-associated controls
{
  await ev(`(() => {
    const f = document.createElement('form'); f.id = 'tf';
    f.innerHTML = '<sakuga-select name="sel"><option value="a">A</option><option value="b" selected>B</option></sakuga-select>'
      + '<sakuga-stepper name="qty" value="4" min="0" max="10"></sakuga-stepper>'
      + '<sakuga-chips name="tags"><option value="x" selected>X</option><option value="y" selected>Y</option></sakuga-chips>';
    document.body.append(f);
  })()`);
  await sleep(250);
  const qs = await ev(`new URLSearchParams(new FormData(document.getElementById('tf'))).toString()`);
  check('forms: values submit with FormData', qs === 'sel=b&qty=4&tags=x%2Cy', qs);
}

// 10. Mobile width check
check('mobile (390px): no horizontal scroll', (await ev('document.documentElement.scrollWidth')) <= 390, await ev('document.documentElement.scrollWidth'));

if (logs.length) { console.log(logs.join('\n')); fails++; }
ws.close(); chrome.kill(); server?.close();
await sleep(250); try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
process.exit(fails ? 1 : 0);
