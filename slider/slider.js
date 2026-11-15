// Sakuga Slider: a range slider with a cloud behind the thumb.
// The value rides in a bubble that leans with the drag. The thumb stretches into a teardrop and lags on a spring. Drag fast and a bank of
// cumulus rolls up behind it with speed lines and chips, and シュッ. Let go at speed and a crescent flies on ahead, with two puffs left behind.
//
// One file, no dependencies. Load it with a script tag and use <sakuga-slider value="30" label="Volume"></sakuga-slider>.
// Read el.value. It fires input while it moves and change when it is let go. With a name, it is sent with its form.
(() => {
function component(fx) {
const { Spring, clamp, rnd, later, at, esc, puff, lines, shards, slash, burst, ticks, wob, sfx, only } = fx;

class SakugaSlider extends fx.Base {
  static delegates = true;
  static formAssociated = true;
  static observedAttributes = ['value', 'min', 'max', 'step', 'disabled', 'label', 'unit'];
  static css = `
    :host { margin: 30px 0 0; }
    .sld { position: relative; width: var(--sk-slider-width, 230px); max-width: 100%; height: 46px; }
    .trk { position: absolute; left: 0; right: 0; top: 16px; height: 14px; border: var(--sk-bw) solid var(--sk-ink); border-radius: 7px; background: var(--sk-card); overflow: hidden; }
    .trk i { display: block; height: 100%; width: calc(var(--v, 0) * 100% + 6px); max-width: 100%; background: var(--sk-pri); }
    .th { position: absolute; top: 9px; left: 0; width: 28px; height: 28px; border-radius: 50%; background: #fff; border: var(--sk-bw) solid var(--sk-ink); will-change: transform; }
    .val { position: absolute; top: -30px; left: -9px; min-width: 46px; padding: 3px 4px; border: 2.6px solid var(--sk-ink); border-radius: 9px; background: var(--sk-card); text-align: center; font: 800 13px/1.1 -apple-system, "Segoe UI", system-ui, sans-serif; white-space: nowrap; transform-origin: 50% 160%; will-change: transform; }
    .val::after { content: ""; position: absolute; left: 50%; top: 100%; margin-left: -5px; border: 5px solid transparent; border-top: 7px solid var(--sk-ink); }
    input { position: absolute; inset: -8px 0; width: 100%; height: calc(100% + 16px); margin: 0; opacity: 0; cursor: ew-resize; }
    input:disabled { cursor: not-allowed; } :host([disabled]) .sld { opacity: .5; }
    .sld:has(input:focus-visible) { outline: 2.5px solid var(--sk-acc); outline-offset: 6px; border-radius: 8px; }`;
  get value() { return this.r ? this.r.value : this.getAttribute('value') || '50'; }
  set value(v) { if (this.r) { this.r.value = v; this.sync(); } else this.setAttribute('value', v); }
  get valueAsNumber() { return +this.value; }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }
  attributeChangedCallback(name, _, v) {
    if (!this.r) return;
    if (name === 'value') { this.r.value = v; this.sync(); }
    else if (name === 'label') this.r.setAttribute('aria-label', v || 'Slider');
    else if (name === 'disabled') this.r.disabled = this.disabled;
    else if (name === 'unit') this.sync();
    else { if (v === null) this.r.removeAttribute(name); else this.r.setAttribute(name, v); this.sync(); }
  }
  render() {
    const a = (n, d) => esc(this.getAttribute(n) ?? d);
    return `<div class="sld" part="slider"><div class="trk"><i></i></div><span class="val" aria-hidden="true"></span><span class="th" part="thumb"></span>
      <input type="range" min="${a('min', 0)}" max="${a('max', 100)}" step="${a('step', 1)}" value="${a('value', 50)}" aria-label="${a('label', 'Slider')}"${this.disabled ? ' disabled' : ''}></div>`;
  }
  frac() { const r = this.r, lo = +r.min || 0, hi = r.max === '' ? 100 : +r.max; return hi > lo ? (+r.value - lo) / (hi - lo) : 0; }
  sync() { this.s.to = this.frac(); this.val.textContent = this.r.value + (this.getAttribute('unit') ?? '%'); this.internals.setFormValue(this.r.value); }
  setup() {
    const box = this.box = this.$('.sld'), r = this.r = this.$('input'); this.th = this.$('.th'); this.val = this.$('.val');
    this.s = new Spring(0, 420, 30); this.sync(); this.s.x = this.s.to; this.acc = 0; this.peak = 0; this.said = 0; this.t = 0;
    r.addEventListener('input', () => this.sync());
    r.addEventListener('change', () => {
      const c = at(this.th), dir = Math.sign(this.peak) || 1;
      if (Math.abs(this.peak) > 1.3) { slash(c.x + dir * 34, c.y, { len: 150, ang: dir > 0 ? 0 : Math.PI, thick: 12, life: 0.5, ...only({ col: '#b8b3ff' }) }); burst(c.x + dir * 4, c.y, { r: 24, spikes: 11, life: 0.28 }); shards(c.x + dir * 10, c.y, { n: 4, size: 4, dir: dir > 0 ? 0 : Math.PI, arc: 2.4 }); ticks(c.x + dir * 52, c.y - 30, { dir: dir > 0 ? -0.6 : -2.5, n: 3, r: 4, len: 10 });
        later(520, () => { puff(c.x - dir * 60, c.y - 34, { size: 11, n: 4, vy: -10, life: 0.8 }); puff(c.x - dir * 22, c.y - 22, { size: 6, n: 3, vy: -8, life: 0.6 }); wob(c.x - dir * 82, c.y - 34, { dir: -1, r: 9 }); }); }
      if (this.frac() >= 1 || this.frac() <= 0) shards(c.x, c.y, { n: 5, dir: dir > 0 ? Math.PI : 0, arc: 2 });
      this.peak = 0; this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  frame(dt) {
    this.t += dt; const W = this.box.clientWidth - 28, x = this.s.step(dt), v = this.s.v, st = 1 + Math.min(1.5, Math.abs(v) * 0.3);
    this.th.style.transformOrigin = v > 0 ? '100% 50%' : '0 50%'; this.th.style.transform = `translateX(${x * W}px) scale(${st}, ${1 / Math.sqrt(st)})`;
    this.val.style.transform = `translateX(${x * W - (this.val.offsetWidth - 46) / 2}px) rotate(${clamp(-v * 5, -14, 14)}deg)`; this.box.style.setProperty('--v', clamp(x));
    if (Math.abs(v) > Math.abs(this.peak)) this.peak = v; else this.peak *= 0.96;
    if (Math.abs(v) > 0.35) {   // fast: a bank of cloud rolls up behind the thumb, with speed lines and chips
      this.acc += dt * Math.abs(v) * 20; const c = at(this.th), dir = Math.sign(v), big = Math.min(1, Math.abs(v) / 2.4);
      while (this.acc > 1) { this.acc -= 1; puff(c.x - dir * rnd(14, 30), c.y - rnd(2, 12) - big * 8, { size: rnd(6, 9) + big * 9, n: 4, vx: -dir * rnd(26, 70), vy: -rnd(22, 58) * (0.5 + big), life: rnd(0.7, 1.15) });
        lines(c.x - dir * 16, c.y + rnd(-4, 12), { n: 1, dir: dir > 0 ? Math.PI : 0, len: 50 + big * 50, spread: 2, life: 0.24 }); if (Math.random() < 0.3) shards(c.x - dir * 20, c.y + 6, { n: 1, size: 3.5, speed: 120, dir: dir > 0 ? Math.PI + 0.5 : -0.5, arc: 1 }); }
      if (Math.abs(v) > 1.5 && this.t - this.said > 1.1) { this.said = this.t; sfx('shu', c.x - dir * 6, c.y - 78, { size: 104, life: 0.75, rot: -0.16, ...only({ col: '#5a4fd8', edge: '#ffffff' }) }); }
    }
  }
}
fx.define('sakuga-slider', SakugaSlider);
}

// >>> sakuga core (copied from core.js by tools/build.mjs: edit core.js, not this block)
// Sakuga VFX core: springs, the effects layer and the lettering, shared by every component.
// Each component file carries a copy of this between its core markers, so any one file works on its own. The first one loaded
// sets window.SakugaFX and the others use it. Edit this file, then run `node tools/build.mjs` to stamp it into the components.
(() => {
'use strict';
if (window.SakugaFX) return;
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const out = (t) => 1 - (1 - t) ** 3, inn = (t) => t * t * t, back = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

// A spring: the thing that makes a control overshoot and settle instead of stopping dead.
class Spring {
  constructor(x = 0, k = 300, d = 20) { this.x = x; this.v = 0; this.to = x; this.k = k; this.d = d; }
  step(dt) { if (!(dt > 0)) return this.x; for (let n = Math.ceil(dt / 0.008), h = dt / n; n--;) { this.v += (-this.k * (this.x - this.to) - this.d * this.v) * h; this.x += this.v * h; } return this.x; }
}

// ───────── themes ─────────
// The same effects in three looks. The palette here is for the effects; the CSS variables below are for the controls.
const THEMES = {
  sakuga: { fill: '#ffffff', shade: '#b8b3ff', line: '#5a4fd8', accent: '#ff5fa8', ink: '#1d1a4a', glow: 0, sfx: ['#1d1a4a', '#ffffff'], hit: 'burst' },
  slash: { fill: '#fff1f2', shade: '#ff2d4a', line: '#ff2d4a', accent: '#39e6ff', ink: '#ffffff', glow: 16, smoke: ['#34343f', '#17171c'], sfx: ['#ffffff', '#39e6ff'], hit: 'slash' },
  manga: { fill: '#ffffff', shade: 'tone', line: '#111111', accent: '#8fc2ff', ink: '#111111', glow: 0, sfx: ['#8fc2ff', '#111111'], hit: 'rings' },
};
const VARS = {
  sakuga: '--sk-card:#fff;--sk-ink:#1d1a4a;--sk-dim:#8580b0;--sk-soft:#b8b3ff;--sk-pri:#8f8df7;--sk-pri-ink:#1d1a4a;--sk-acc:#ff5fa8;--sk-track:#c9cbe0;--sk-r:15px;--sk-bw:3.2px;--sk-sh:6px 7px 0 var(--sk-soft);--sk-btn-sh:var(--sk-sh);--sk-btn-line:var(--sk-ink);--sk-alt-sh:var(--sk-sh);--sk-alt-line:var(--sk-ink);--sk-tick:var(--sk-ink);--sk-fill:var(--sk-acc);--sk-on-pri:#fff;',
  slash: '--sk-card:#0d0d10;--sk-ink:#fff;--sk-dim:#8a8a94;--sk-soft:#3a0a12;--sk-pri:#ff2d4a;--sk-pri-ink:#fff;--sk-acc:#39e6ff;--sk-track:#2a2a30;--sk-sh:0 0 0 transparent;--sk-btn-sh:0 0 18px -4px var(--sk-pri);--sk-btn-line:var(--sk-pri);--sk-alt-sh:none;--sk-alt-line:#55555e;--sk-tick:var(--sk-pri);--sk-fill:var(--sk-pri);--sk-on-pri:#fff;',
  manga: '--sk-card:#fff;--sk-ink:#111;--sk-dim:#6b675e;--sk-soft:#111;--sk-pri:#8fc2ff;--sk-pri-ink:#111;--sk-acc:#8fc2ff;--sk-track:#d9d5c9;--sk-sh:4px 4px 0 #111;--sk-btn-sh:var(--sk-sh);--sk-btn-line:var(--sk-ink);--sk-alt-sh:var(--sk-sh);--sk-alt-line:var(--sk-ink);--sk-tick:var(--sk-ink);--sk-fill:var(--sk-pri);--sk-on-pri:#111;',
};
// :where() keeps these at no specificity, so a page's own :root { --sk-acc: ... } wins over every theme.
const pageCss = `:where(:root){${VARS.sakuga}}:where(:root[data-sakuga-theme=slash]){${VARS.slash}}:where(:root[data-sakuga-theme=manga]){${VARS.manga}}
canvas.sakuga-fx{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000}`;
document.head.append(Object.assign(document.createElement('style'), { textContent: pageCss }));

let P = THEMES.sakuga;
const html = document.documentElement, readTheme = () => { P = THEMES[html.dataset.sakugaTheme] || THEMES.sakuga; };
readTheme(); new MutationObserver(readTheme).observe(html, { attributes: true, attributeFilter: ['data-sakuga-theme'] });
const setTheme = (name) => { if (THEMES[name]) html.dataset.sakugaTheme = name; readTheme(); };
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let calm = reduce.matches; reduce.addEventListener?.('change', (e) => { calm = e.matches; });

// ───────── layers ─────────
// The front layer is one fixed canvas over the whole page. A component can also have a back layer: a canvas inside it, behind the control.
// Effects are placed in page coordinates, so they scroll with their control.
let g = null, dpr = 1;
const front = { c: null, g: null, live: [], dirty: false }, layers = [front];
function ensureFront() {
  if (front.c || !document.body) return;
  front.c = Object.assign(document.createElement('canvas'), { className: 'sakuga-fx' }); front.c.setAttribute('aria-hidden', 'true');
  document.body.append(front.c); front.g = front.c.getContext('2d'); size();
}
function size() { dpr = Math.min(2.5, devicePixelRatio || 1); if (front.c) { front.c.width = innerWidth * dpr; front.c.height = innerHeight * dpr; } }
addEventListener('resize', size);
function backLayer(canvas) { const L = { c: canvas, g: canvas.getContext('2d'), live: [], dirty: false }; layers.push(L); return L; }
let tone = null;
const shade = () => (P.shade === 'tone' ? (tone ||= (() => { const t = document.createElement('canvas'); t.width = t.height = 6; const x = t.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 6, 6); x.fillStyle = '#111'; x.beginPath(); x.arc(1.5, 1.5, 1.05, 0, TAU); x.arc(4.5, 4.5, 1.05, 0, TAU); x.fill(); return x.createPattern(t, 'repeat'); })()) : P.shade);
const add = (life, draw, L) => { const p = { t: 0, life, draw }; if (!calm) { L = L || front; if (L === front) ensureFront(); L.live.push(p); start(); } return p; };
// an effect with no end: it draws every frame until its handle is marked dead. layer puts it on a component's back layer.
const persist = (draw, layer) => add(Infinity, draw, layer);
function tick(dt) {
  for (const L of layers) {
    if (!L.c || (!L.live.length && !L.dirty)) continue;
    let ox = scrollX, oy = scrollY;
    if (L !== front) {   // a back layer: keep its pixels matched to where it sits
      if (!L.c.isConnected) { L.live = []; L.dirty = false; continue; }
      const r = L.c.getBoundingClientRect(), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (L.c.width !== w) L.c.width = w; if (L.c.height !== h) L.c.height = h; ox += r.left; oy += r.top;
    }
    g = L.g; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, L.c.width / dpr, L.c.height / dpr);
    g.translate(-ox, -oy); g.lineJoin = g.lineCap = 'round';
    L.live = L.live.filter((p) => !p.dead && (p.t += dt) < p.life);
    for (const p of L.live) { g.save(); p.draw(p.t / p.life, p.t, dt); g.restore(); }
    L.dirty = L.live.length > 0;
  }
}
const glow = (c = P.line) => { if (P.glow) { g.shadowColor = c; g.shadowBlur = P.glow; } };

// ───────── the clock ─────────
// One loop for every component. later() runs on this clock, not on setTimeout, so a film can step it a frame at a time.
let now = 0, last = 0, running = false;
const frames = new Set(), timers = [];
const later = (ms, f) => { timers.push({ at: now + ms / 1000, f }); start(); };
function advance(dt) {
  now += dt;
  const due = timers.filter((q) => q.at <= now).sort((a, b) => a.at - b.at); if (due.length) for (const q of due) timers.splice(timers.indexOf(q), 1);
  for (const q of due) q.f();
  for (const f of frames) f(dt);
  tick(dt);
}
function loop(ms) {
  if (!running) return;
  const dt = clamp((ms - last) / 1000, 0, 0.034); last = ms;   // a frame's timestamp can be earlier than the moment the loop started
  if (!api.paused) advance(dt);
  if (!frames.size && !timers.length && layers.every((L) => !L.live.length && !L.dirty)) { running = false; return; }
  requestAnimationFrame(loop);
}
function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); }

// ───────── the effects ─────────
// circles drawn as one shape: outline, shadow tone, then the light side slid up and to the left
function blob(cs, lw = 1.5, smoke, { lx = -1, arcs = false, deep = 1 } = {}) {
  const u = new Path2D(); for (const [x, y, r] of cs) if (r > 0.3) { u.moveTo(x + r, y); u.arc(x, y, r, 0, TAU); }
  g.save(); glow(); g.lineWidth = lw * 2; g.strokeStyle = P.line; g.stroke(u); g.restore();
  g.save(); g.clip(u); g.fillStyle = smoke && P.smoke ? P.smoke[1] : shade(); g.fillRect(-1e4, -1e4, 2e4, 2e4); const r = cs[0] ? cs[0][2] : 8;
  g.save(); g.translate(lx * r * 0.2 * deep, -r * 0.26 * deep); g.fillStyle = smoke && P.smoke ? P.smoke[0] : P.fill; g.fill(u); g.restore();
  if (arcs) { g.strokeStyle = P.line; g.lineWidth = lw * 0.75; g.beginPath(); for (const [x, y, rr] of cs) if (rr > 3) { g.moveTo(x + Math.cos(-2.7) * rr, y + Math.sin(-2.7) * rr); g.arc(x, y, rr, -2.7, -0.5); } g.stroke(); }   // the cumulus lines inside the cloud
  g.restore();
}
function shape(path, lw = 1.5, off = 3, fill = P.fill) {
  g.save(); glow(); g.lineWidth = lw * 2; g.strokeStyle = P.line; g.stroke(path); g.restore();
  g.save(); g.clip(path); g.fillStyle = shade(); g.fillRect(-1e4, -1e4, 2e4, 2e4); g.translate(-off * 0.7, -off); g.fillStyle = fill; g.fill(path); g.restore();
}
// a puff of smoke: lobes swell out with a little overshoot, roll, and shrink away
function puff(x, y, { n = 5, size = 13, vx = 0, vy = -18, life = 0.8, spread = 1 } = {}) {
  const lobes = Array.from({ length: n }, (_, i) => ({ a: (i / n) * TAU + rnd(0.6), d: rnd(0.25, 0.9) * size * spread, r: rnd(0.55, 1) * size, ph: rnd(TAU), sp: rnd(0.6, 1.3) }));
  lobes.unshift({ a: 0, d: 0, r: size, ph: 0, sp: 1 });
  add(life, (k, t) => {
    const grow = back(clamp(t / 0.22)), die = 1 - inn(clamp((k - 0.55) / 0.45)), px = x + vx * out(k) * life, py = y + vy * out(k) * life;
    blob(lobes.map((l) => [px + Math.cos(l.a + t * 0.9 * l.sp) * l.d * (0.5 + out(k) * 0.9), py + Math.sin(l.a + t * 0.9 * l.sp) * l.d * (0.5 + out(k) * 0.9) - out(k) * 5 * l.sp, l.r * grow * die * (1 + Math.sin(t * 9 + l.ph) * 0.05)]), 1.5, true, { lx: 0.5, arcs: size > 6.5, deep: 1.5 });
  });
}
// the impact: pink needles, a star in the shadow tone, and a white star on top; it leaves by its points thinning to nothing
function burst(x, y, { r = 44, spikes = 13, life = 0.34, layer } = {}) {
  const j = Array.from({ length: spikes * 2 }, (_, i) => (i % 2 ? rnd(0.34, 0.5) : rnd(0.75, 1.15))), rot = rnd(TAU), pins = Array.from({ length: 8 }, (_, i) => ({ a: i / 8 * TAU + rnd(0.5), l: rnd(1.25, 1.75), w: rnd(0.03, 0.055) }));
  const star = (R, turn, inner = 1) => { const p = new Path2D(); j.forEach((m, i) => { const a = rot + turn + (i / j.length) * TAU, rr = R * (i % 2 ? m * inner : m); p[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }); p.closePath(); return p; };
  add(life, (k) => {
    const R = r * out(clamp(k / 0.3)), hollow = 1 + inn(clamp((k - 0.35) / 0.65)) * 1.3, r0 = R * 0.6 * Math.min(1.9, hollow);
    g.save(); glow(P.accent); g.fillStyle = P.accent; g.beginPath(); for (const n of pins) { const l = R * n.l; if (l <= r0) continue; g.moveTo(x + Math.cos(n.a - n.w) * r0, y + Math.sin(n.a - n.w) * r0); g.lineTo(x + Math.cos(n.a) * l, y + Math.sin(n.a) * l); g.lineTo(x + Math.cos(n.a + n.w) * r0, y + Math.sin(n.a + n.w) * r0); } g.fill(); g.restore();
    const big = star(R * 1.16, 0.19, hollow); g.save(); glow(); g.fillStyle = shade(); g.fill(big); g.strokeStyle = P.line; g.lineWidth = 1.2; g.stroke(big); g.restore();
    shape(star(R * 0.84, 0, hollow), 1.4, 3);
  }, layer);
}
// chips of crystal: long facets with one edge line, tumbling and falling
function shards(x, y, { n = 7, speed = 190, size = 5, life = 0.75, dir = -Math.PI / 2, arc = Math.PI, grav = 420 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = dir + rnd(-arc, arc) / 2, v = speed * rnd(0.5, 1.15), s = size * rnd(0.6, 1.4), spin = rnd(-7, 7), pts = [[-1.4, 0.1], [-0.6, -0.7], [1.2, -0.45], [1.5, 0.15], [0.4, 0.75]].map(([px, py]) => [px * rnd(0.8, 1.2), py * rnd(0.8, 1.2)]);
    add(life * rnd(0.7, 1), (k, t) => {
      const px = x + Math.cos(a) * v * t, py = y + Math.sin(a) * v * t + grav * t * t, sc = s * (1 - inn(clamp((k - 0.6) / 0.4)));
      g.translate(px, py); g.rotate(spin * t + a); const p = new Path2D(); pts.forEach(([u, w], q) => p[q ? 'lineTo' : 'moveTo'](u * sc, w * sc)); p.closePath(); shape(p, 1.1, sc * 0.45, P.shade === 'tone' ? '#fff' : P.fill);
      if (sc > 2.5) { g.strokeStyle = P.line; g.lineWidth = 0.9; g.beginPath(); g.moveTo(pts[1][0] * sc, pts[1][1] * sc); g.lineTo(pts[4][0] * sc, pts[4][1] * sc); g.stroke(); }
    });
  }
}
function ring(x, y, { rx = 40, ry = 12, life = 0.5, w = 5 } = {}) {
  add(life, (k) => { const s = out(k), lw = w * (1 - k); g.beginPath(); g.ellipse(x, y, rx * (0.3 + s), ry * (0.3 + s), 0, 0, TAU); glow(); g.strokeStyle = P.line; g.lineWidth = lw + 2.4; g.stroke(); g.shadowBlur = 0; g.strokeStyle = P.fill; g.lineWidth = lw; if (lw > 0.3) g.stroke(); });
}
// a splash crown: tongues of water rise out of a line and fall back with foam on their tips, drops fly
function splash(x, y, { w = 34, h = 26, life = 0.7 } = {}) {
  const n = 7, ts = Array.from({ length: n }, (_, i) => ({ u: i / (n - 1) - 0.5, h: h * rnd(0.55, 1.1) * (1 - Math.abs(i / (n - 1) - 0.5) * 0.7), lean: rnd(-0.4, 0.4), d: rnd(0, 0.14) }));
  add(life, (k) => {
    const p = new Path2D(), tips = []; p.moveTo(x - w * 0.62, y);
    ts.forEach((s) => { const kk = clamp((k - s.d) / 0.8), up = Math.sin(kk * Math.PI) * s.h * (1 - kk * 0.25), bx = x + s.u * w, half = w / n * 0.62, tx = bx + (s.u * 1.6 + s.lean) * up * 0.5; tips.push([tx, y - up, up]); p.quadraticCurveTo(bx - half, y - up * 0.25, tx, y - up); p.quadraticCurveTo(bx + half * 0.5, y - up * 0.3, bx + half, y); });
    p.lineTo(x + w * 0.62, y); p.closePath();
    g.save(); glow(); g.lineWidth = 2.8; g.strokeStyle = P.line; g.stroke(p); g.restore(); g.fillStyle = shade(); g.fill(p);
    g.save(); g.clip(p); g.fillStyle = P.fill; for (const [tx, ty, up] of tips) if (up > 4) { g.beginPath(); g.ellipse(tx, ty + up * 0.2, up * 0.2 + 1.4, up * 0.34, 0, 0, TAU); g.fill(); } g.restore();
  });
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + rnd(-1.1, 1.1), v = rnd(100, 210), r0 = rnd(2, 4);   // drops are teardrops, pointed the way they came from
    add(life * rnd(0.8, 1.15), (k, t) => { const px = x + Math.cos(a) * v * t, py = y - 6 + Math.sin(a) * v * t + 520 * t * t, r = r0 * (1 - inn(clamp((k - 0.6) / 0.4))), ang = Math.atan2(Math.sin(a) * v + 1040 * t, Math.cos(a) * v), d = new Path2D();
      g.translate(px, py); g.rotate(ang); d.moveTo(-r * 2.6, 0); d.quadraticCurveTo(-r * 0.6, -r * 1.05, r * 0.5, -r * 0.9); d.arc(r * 0.4, 0, r * 0.95, -1.4, 1.4); d.quadraticCurveTo(-r * 0.6, r * 1.05, -r * 2.6, 0); if (r > 0.5) shape(d, 1, r * 0.5); }); }
}
// a slash: a crescent whose head races ahead and whose tail catches up
function slash(x, y, { len = 110, ang = -0.5, life = 0.42, thick = 15, col } = {}) {
  const R = len * 0.9, cx = x - Math.cos(ang - Math.PI / 2) * R * 0.86, cy = y - Math.sin(ang - Math.PI / 2) * R * 0.86, a0 = ang - Math.PI / 2 - 0.62, sweep = 1.24, c = col || (P.hit === 'slash' ? P.shade : P.accent);
  add(life, (k) => {
    const head = out(clamp(k / 0.42)), tail = inn(clamp((k - 0.22) / 0.78)); if (head - tail < 0.01) return;
    const cres = (T) => { const p = new Path2D(), N = 26; for (let i = 0; i <= N; i++) { const u = lerp(tail, head, i / N), a = a0 + sweep * u; p[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * R, cy + Math.sin(a) * R); } for (let i = N; i >= 0; i--) { const q = i / N, u = lerp(tail, head, q), a = a0 + sweep * u, rr = R - T * Math.sin(q * Math.PI) ** 0.7; p.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } p.closePath(); return p; };
    g.save(); glow(c); g.fillStyle = c; g.fill(cres(thick)); g.restore(); g.fillStyle = P.fill; g.fill(cres(thick * 0.42));
    if (!P.glow) { g.strokeStyle = P.line; g.lineWidth = 1.3; g.stroke(cres(thick)); }
  });
}
// speed lines: strokes that shoot out one way and thin away
function lines(x, y, { n = 7, dir = Math.PI, len = 46, spread = 26, life = 0.3 } = {}) {
  for (let i = 0; i < n; i++) { const o = rnd(-spread, spread), l = len * rnd(0.5, 1.3), d = rnd(0, 0.25), w = rnd(1, 2.6); add(life, (k) => { const kk = clamp((k - d) / (1 - d)), a = out(kk), b = inn(kk), px = x - Math.sin(dir) * o, py = y + Math.cos(dir) * o; g.strokeStyle = P.glow ? P.fill : P.line; g.lineWidth = w * (1 - b); g.beginPath(); g.moveTo(px + Math.cos(dir) * l * b * 1.4, py + Math.sin(dir) * l * b * 1.4); g.lineTo(px + Math.cos(dir) * l * (0.2 + a * 1.2), py + Math.sin(dir) * l * (0.2 + a * 1.2)); if (kk > 0) g.stroke(); }); }
}
// accent ticks: little wedges that point at something and fly off it
function ticks(x, y, { n = 3, r = 16, len = 9, dir = -0.9, life = 0.4, fan = 0.42 } = {}) {
  add(life, (k) => { const a = out(clamp(k / 0.5)), b = inn(clamp((k - 0.4) / 0.6)); g.save(); glow(P.accent); g.fillStyle = P.accent; g.beginPath();
    for (let i = 0; i < n; i++) { const an = dir + (i - (n - 1) / 2) * fan, r0 = r + len * b * 1.25, r1 = r + len * a * 1.25, hw = 0.07 + 2.2 / (r1 + 8); if (r1 - r0 < 0.6) continue; g.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); g.lineTo(x + Math.cos(an - hw) * r1, y + Math.sin(an - hw) * r1); g.lineTo(x + Math.cos(an + hw) * r1, y + Math.sin(an + hw) * r1); g.closePath(); }
    g.fill(); g.restore(); });
}
// a smoke ring: a lumpy hoop that drifts off and shrinks
function donut(x, y, { r = 20, vx = 30, vy = -50, life = 1, tilt = -0.25 } = {}) {
  const ph = rnd(TAU);
  add(life, (k, t) => { const s = back(clamp(t / 0.22)) * (1 - inn(clamp((k - 0.6) / 0.4))), px = x + vx * out(k) * life, py = y + vy * out(k) * life, hole = 0.42 + 0.22 * k, p = new Path2D(); if (s < 0.03) return;
    for (const [m, bump] of [[1, 0.09], [hole, 0.05]]) for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, rr = r * s * m * (1 + bump * Math.sin(a * 9 + ph + t * 2)), ex = Math.cos(a) * rr, ey = Math.sin(a) * rr * 0.52; p[i ? 'lineTo' : 'moveTo'](px + ex * Math.cos(tilt) - ey * Math.sin(tilt), py + ex * Math.sin(tilt) + ey * Math.cos(tilt)); }
    g.save(); glow(); g.lineWidth = 3; g.strokeStyle = P.line; g.stroke(p); g.restore(); g.save(); g.clip(p, 'evenodd'); g.fillStyle = P.smoke ? P.smoke[1] : shade(); g.fillRect(-1e4, -1e4, 2e4, 2e4); g.translate(r * 0.06, -r * 0.2); g.fillStyle = P.smoke ? P.smoke[0] : P.fill; g.fill(p, 'evenodd'); g.restore(); });
}
// wobble marks: the two little arcs beside something that has just stopped
function wob(x, y, { dir = 1, r = 16, life = 0.45 } = {}) {
  add(life, (k) => { g.strokeStyle = P.line; g.lineWidth = 2.2 * (1 - k); if (g.lineWidth < 0.2) return; g.beginPath(); for (const d of [0, 7]) { const rr = r + d + out(k) * 8, c = dir > 0 ? 0 : Math.PI; g.moveTo(x - dir * r + Math.cos(c - 0.45) * rr, y + Math.sin(c - 0.45) * rr); g.arc(x - dir * r, y, rr, c - 0.45, c + 0.45); } g.stroke(); });
}
// a glint: a four-pointed sparkle that opens and closes
function kira(x, y, { r = 9, life = 0.6, col } = {}) {
  add(life, (k, t) => { const s = r * Math.sin(k * Math.PI) ** 0.6, q = s * 0.16, p = new Path2D(); g.translate(x, y); g.rotate(Math.sin(t * 3) * 0.2); p.moveTo(0, -s); p.quadraticCurveTo(q, -q, s * 0.7, 0); p.quadraticCurveTo(q, q, 0, s); p.quadraticCurveTo(-q, q, -s * 0.7, 0); p.quadraticCurveTo(-q, -q, 0, -s);
    g.save(); glow(P.accent); g.fillStyle = col || (P.glow ? P.accent : P.fill); g.fill(p); g.restore(); if (!P.glow) { g.strokeStyle = P.accent; g.lineWidth = 2; g.stroke(p); } });
}
// shockwave rings, the manga way: a row of ovals thrown sideways, each bigger than the last, with bristling edges
function rings(x, y, { dir = 0, n = 5, reach = 150, life = 0.6 } = {}) {
  for (let i = 0; i < n; i++) { const d = i * 0.07, bristle = Array.from({ length: 22 }, () => rnd(2, 7));
    add(life + d, (k, t) => { const kk = clamp((t - d) / life); if (kk <= 0) return; const s = out(kk), px = x + Math.cos(dir) * reach * s * (0.35 + i * 0.16), py = y + Math.sin(dir) * reach * s * (0.35 + i * 0.16), ry = (10 + i * 9) * (0.4 + s), rx = ry * 0.34, lw = (5 + i) * (1 - inn(kk));
      g.translate(px, py); g.rotate(dir); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.strokeStyle = P.line; g.lineWidth = lw + 2.2; g.stroke(); g.strokeStyle = P.fill; g.lineWidth = lw; if (lw > 0.4) g.stroke();
      g.strokeStyle = P.line; g.lineWidth = 1; g.beginPath(); bristle.forEach((b, q) => { const a = (q / bristle.length) * TAU, ex = Math.cos(a) * (rx + lw / 2), ey = Math.sin(a) * (ry + lw / 2); g.moveTo(ex, ey); g.lineTo(ex + Math.cos(a) * b * (1 - kk), ey + Math.sin(a) * b * (1 - kk)); }); g.stroke(); }); }
}
// lightning: a jagged line redrawn every few frames
function bolt(x0, y0, x1, y1, { life = 0.28, seg = 7, amp = 9 } = {}) {
  let pts = [], next = 0;
  add(life, (k, t) => { if (t >= next) { next = t + 0.045; pts = Array.from({ length: seg + 1 }, (_, i) => { const u = i / seg, m = i && i < seg ? 1 : 0; return [lerp(x0, x1, u) + rnd(-amp, amp) * m, lerp(y0, y1, u) + rnd(-amp, amp) * m]; }); }
    g.lineJoin = 'miter'; g.beginPath(); pts.forEach(([px, py], i) => g[i ? 'lineTo' : 'moveTo'](px, py)); glow(P.accent); g.strokeStyle = P.accent; g.lineWidth = 3.4 * (1 - k); g.stroke(); g.shadowBlur = 0; g.strokeStyle = '#fff'; g.lineWidth = 1.3 * (1 - k); g.stroke(); });
}

// ───────── the lettering ─────────
// Eight sound-effect words, painted with GPT Image and traced into paths by tools/trace.py: [width, height, path].
// >>> words (written by tools/trace.py)
const WORDS = {"bang":[520,294,"M13 292C13 290 15 287 17 284C20 277 19 277 12 282C7 286 6 287 6 285C6 284 13 253 15 248C15 246 15 246 13 247C10 250 10 250 15 231C19 214 20 209 18 211C17 211 17 210 21 194C25 178 27 161 25 161C24 161 11 170 5 174C-1 179-1 177 4 166C7 160 8 155 8 155C7 155 7 154 8 153C8 152 9 149 11 145C12 142 14 137 16 135C19 131 19 131 12 134C5 137 5 136 12 129C20 120 36 110 49 105C55 103 55 104 49 109C46 111 43 114 43 114C44 114 49 112 55 109C69 101 79 98 80 99C80 100 83 99 88 97C98 93 107 91 113 91C117 91 118 92 116 93C114 95 115 96 119 96C127 96 132 101 132 110C132 112 133 115 133 117C140 125 130 145 112 164L102 173L107 172C125 169 135 176 132 190C131 192 131 196 132 200L132 206L134 201C135 194 135 192 134 193C133 193 133 193 133 191C138 176 141 162 142 156C145 142 154 110 156 107C158 105 159 104 159 105C160 106 162 105 164 101C166 98 169 94 171 93C185 82 186 81 186 86C186 89 187 89 192 85C198 81 199 82 199 92C199 105 203 136 206 140C206 141 208 140 211 138L215 136L215 139C212 155 212 154 214 164C216 169 217 175 217 177C217 179 218 183 219 186L221 192L221 165C221 150 221 135 222 130C222 125 222 122 222 122C220 121 225 93 228 86C231 81 232 81 233 84C234 86 234 86 238 80C241 76 244 73 245 72C246 72 248 70 250 69C254 65 254 65 258 77C266 98 269 108 271 109C271 109 274 115 276 122C278 128 281 135 281 136L283 138L283 135C284 129 285 101 284 101C282 100 288 63 291 60C292 58 292 58 294 60C295 61 295 61 297 59C301 53 305 50 308 50C310 49 313 47 317 43C320 40 323 38 324 38C324 39 323 44 322 51C320 59 319 65 320 67C320 69 319 75 317 83C314 96 309 127 309 134L309 138L310 134C310 131 312 125 313 120C315 114 316 109 316 108C315 105 320 92 326 82C329 78 332 72 333 69C336 64 354 45 361 40C377 30 387 27 396 28C403 29 407 31 408 36C408 37 411 42 413 45C419 53 419 53 414 58C408 66 407 66 410 65C413 64 408 70 399 80C386 93 383 94 384 85C385 82 384 79 383 78C383 77 382 77 382 77C382 78 381 78 380 77C379 76 377 77 374 78C371 80 369 81 369 80C367 76 351 99 347 109C346 113 343 119 342 124C339 131 339 132 339 145C339 160 340 163 344 165C347 167 347 166 355 161C359 158 362 156 362 157C363 159 369 151 372 144C374 141 375 138 374 138C374 138 368 140 362 143C356 146 350 148 350 148C349 148 353 134 354 133C354 132 355 130 355 128C355 127 356 125 357 124C357 122 357 122 355 122C348 124 358 115 368 111C373 109 382 105 389 102C405 95 417 92 420 95C420 96 421 97 420 98C420 99 419 103 418 107C415 117 415 118 410 121C406 124 405 125 406 131C406 135 402 152 399 160C396 168 385 186 380 191L375 196L376 192L376 188L370 193C359 204 347 211 342 209C341 208 339 208 337 208C334 208 325 203 322 199C321 197 318 192 316 187C314 182 312 178 311 178C309 178 309 170 309 154L309 138L307 153C307 161 306 173 306 180C305 197 304 200 302 200C302 200 299 202 297 204C294 206 292 208 292 208C291 208 290 210 288 212C285 217 285 217 278 203C275 196 271 190 270 190C269 188 259 170 255 160L252 152L250 182C250 213 249 213 247 213C246 213 245 214 244 216C241 221 236 228 235 227C234 226 233 228 230 233C225 244 225 244 223 222C222 208 222 207 220 208C218 208 217 208 217 208C217 208 216 212 214 215C210 221 208 224 208 221C208 218 206 222 205 228C202 239 202 239 198 228C197 223 194 214 192 207L188 194L180 198C162 208 159 210 158 216C157 221 151 242 149 247C148 250 147 251 146 248C145 247 144 247 141 251C137 254 136 255 135 254C134 252 134 252 129 261C127 266 125 269 124 269C123 269 125 252 126 243C127 238 128 234 127 234C127 234 128 228 129 222C133 206 133 205 129 214C122 230 119 234 104 244C86 258 75 265 77 262C78 260 76 261 61 270C47 278 45 279 47 276C48 275 48 274 47 274C46 274 26 285 20 289C12 295 12 294 13 292ZM65 232C80 223 91 212 91 204C91 199 88 198 79 201C75 202 71 203 70 203C67 203 54 210 53 212C53 214 50 228 49 237L49 241L51 240C52 239 59 235 65 232ZM412 187C412 184 412 184 410 184C408 185 406 177 408 166C410 155 412 152 427 145C436 140 438 140 440 145C442 152 442 154 440 163C437 173 436 174 423 183C411 191 411 191 412 187ZM450 177C450 176 449 175 449 175C447 174 447 160 449 154C452 145 464 137 476 136C484 136 484 136 481 145C480 148 478 154 477 158C474 166 473 167 461 174C451 180 450 180 450 177ZM173 172C178 170 181 167 181 167C181 166 180 163 180 160C179 156 177 150 176 146C175 139 175 138 174 140C173 142 165 174 165 176C165 177 165 177 173 172ZM78 158C93 144 98 132 90 132C87 132 65 142 64 143C63 145 57 170 57 174C57 177 65 171 78 158ZM421 138C420 137 422 110 425 89C426 78 427 68 427 67C426 64 431 35 434 26C435 21 438 18 442 16C443 15 449 12 454 9C465 3 468 2 467 4C466 7 467 6 472 3C479-1 479 0 474 14C466 36 459 57 460 59C460 60 458 66 456 72C454 79 451 91 449 98C442 122 442 121 436 128C433 131 429 134 428 134C427 134 425 135 424 137C422 138 421 139 421 138ZM455 128C456 119 461 96 466 79C468 71 469 64 469 63C468 62 477 34 480 31C482 28 487 25 488 27C488 28 491 27 496 24C502 20 510 16 516 14C519 13 519 13 516 20L514 24L517 23C521 20 521 21 515 33C506 52 487 95 480 112C478 117 476 122 475 123C473 126 464 130 463 130C463 129 461 130 459 132C455 135 455 135 455 128Z"],"don":[520,297,"M3 290C4 287 6 283 7 281C9 277 18 252 19 248C20 246 19 246 15 250C13 253 11 255 11 254C12 253 15 242 19 230C24 218 30 195 34 180C38 165 43 144 46 133C49 122 51 113 51 113C50 113 50 110 51 107C52 104 52 98 52 94C53 86 57 69 63 54C69 41 69 40 70 41C71 42 72 42 74 40L76 38L75 40C75 43 76 42 85 34C90 28 94 24 95 24C95 24 94 27 92 30C87 40 88 40 100 28C106 22 111 18 111 18C111 18 110 20 109 22C107 28 108 28 114 23C123 15 124 15 122 19C120 21 120 22 121 21C124 20 132 14 136 10C141 5 141 5 136 14C132 23 132 23 135 23C136 22 136 22 135 24C133 29 131 36 132 36C132 36 133 35 135 34C136 32 138 31 138 31C138 31 136 39 132 48C123 71 97 147 98 148C98 148 101 147 105 145C108 144 116 141 122 138C128 136 141 131 150 128C179 117 232 98 234 98C235 98 233 101 229 104C226 108 223 111 223 111C224 111 222 114 219 117C213 124 213 124 216 123C218 123 218 124 214 128C209 133 205 139 204 142C203 143 203 143 205 142C208 140 208 141 204 147C201 150 200 152 201 152C204 151 203 152 197 159C193 163 192 166 194 166C196 166 192 169 182 173C176 175 172 177 170 176C169 176 166 177 163 178C157 180 144 185 143 185C143 185 143 184 144 184C144 183 144 183 143 183C142 183 137 185 132 186C122 189 99 198 90 201L85 204L80 216C73 232 61 258 59 261C57 263 57 263 58 258L58 252L55 255C54 256 52 259 51 260C50 261 49 262 50 261C51 258 48 261 43 267C37 274 36 274 39 268C40 265 41 262 41 262C41 261 36 266 29 273C23 280 18 285 17 285C17 284 18 282 19 279C23 271 22 272 14 281C10 286 5 291 4 292L1 296L3 290ZM223 274C222 274 221 273 220 273C219 273 218 272 218 271C218 266 214 260 212 260C211 261 210 260 210 258C208 251 208 247 208 247C208 246 208 246 207 246C207 246 206 243 207 239C207 234 207 232 206 232C205 233 205 232 206 227C207 225 210 222 214 218C222 213 223 212 220 217C218 221 220 220 233 211C244 203 247 201 243 205C242 207 241 208 241 208C242 210 296 172 333 144C343 137 352 131 353 130C356 129 382 110 397 98C403 94 408 90 408 90C408 91 403 99 397 107C393 112 393 116 396 111C397 111 398 110 398 110C398 111 394 116 390 122C379 135 379 136 382 134C384 133 384 133 383 134C379 140 373 148 372 149C371 151 371 151 381 143C385 140 388 138 389 138C389 138 386 142 382 147C378 151 375 155 375 156C377 158 353 182 344 189C342 191 332 199 323 206C304 222 280 241 277 242C276 242 273 244 269 247C259 255 226 276 225 276C225 276 224 275 223 274ZM373 264C372 264 372 263 372 262C372 261 371 259 370 259C369 257 369 257 370 252C373 244 372 243 370 246C366 249 366 248 369 243C373 237 378 226 378 225C378 222 386 217 398 211C411 204 415 202 413 204C412 205 412 206 412 207C413 207 429 203 432 202C434 201 435 200 429 212C425 222 425 222 432 217C436 214 436 214 428 226C424 231 420 238 418 242L414 249L403 255C397 258 391 261 389 263C384 266 384 266 385 263C385 261 383 261 378 264C375 265 374 265 373 264ZM392 199C392 196 438 54 441 46C444 41 453 28 458 23C463 18 463 18 462 21C461 23 460 25 459 27L458 29L461 27C462 26 467 22 470 19C477 13 477 13 473 21C471 24 470 27 470 27C471 27 476 24 483 20C496 12 497 11 495 14C491 17 494 16 505 9C512 5 517 2 517 2C518 2 515 6 512 10C507 17 500 29 502 29C502 29 504 28 506 26C509 25 511 23 512 23C514 22 514 21 507 32C499 44 497 49 502 44C505 41 504 44 498 55C488 70 483 79 477 92C473 98 470 103 470 104C467 107 455 132 456 131C460 128 459 131 450 145C446 153 438 166 434 174C425 190 425 191 426 184L426 179L420 184C416 188 412 191 411 193C409 196 408 194 410 189C411 185 410 185 405 191C403 193 401 195 401 194C402 191 401 192 396 196C394 199 392 200 392 199ZM226 147C228 140 228 140 226 141C225 141 225 140 227 136C232 128 235 122 234 121C234 120 235 118 237 115C245 103 245 103 242 104C241 105 241 104 244 102C250 96 260 88 264 87C268 86 282 87 281 88C281 89 283 89 285 89C287 89 289 90 289 90C289 91 294 92 299 94C304 95 309 96 309 97C310 98 319 102 325 102C331 103 331 103 326 108C325 110 323 113 323 113C323 114 320 118 316 121C312 125 309 129 309 129C310 129 307 132 304 136L299 142L290 142C279 141 265 142 245 148C235 150 226 152 225 153L223 153L226 147ZM133 121C133 103 157 28 160 39C160 41 161 41 166 35C173 28 174 28 173 32C171 36 172 36 180 32C184 30 188 28 188 29C189 29 192 28 195 26C201 22 202 22 199 29C197 31 196 36 195 39C192 46 167 99 165 101C164 102 164 102 164 100C164 99 163 100 158 104C153 109 153 109 153 107L153 104L149 107C147 108 143 112 139 116C136 120 133 122 133 121ZM180 104C180 97 192 64 203 43C210 29 220 16 218 22L218 25L225 21C231 16 233 15 231 18C226 25 230 23 245 13C251 10 255 7 255 8C255 8 253 12 251 15C246 22 245 25 248 22C251 20 250 22 246 30C241 38 240 39 243 38C245 37 245 36 228 62C212 85 208 91 209 87C209 85 208 84 207 86C206 86 204 88 202 90L198 93L199 90C200 87 198 88 188 98C184 102 180 105 180 104Z"],"gogo":[520,288,"M1 284C1 281 1 274 1 268L2 257L15 253C22 250 32 247 37 246C42 245 46 244 46 243C47 243 50 217 49 216C48 215 31 222 19 228C4 235 6 235 6 231C7 229 7 229 6 229C4 230 4 231 6 220C8 215 9 208 10 206C10 202 10 201 13 201C15 200 24 197 34 194C43 190 51 187 52 187C52 187 52 189 52 192C52 198 53 199 60 196C66 193 79 190 80 190C80 191 79 198 77 207C73 225 70 242 70 254C69 263 72 261 44 270C28 275 18 279 1 288C0 288 0 286 1 284ZM84 281C84 280 85 273 87 263C88 254 89 245 89 243L88 239L102 234C109 232 122 228 129 226C136 224 143 222 143 222C143 221 149 189 149 187C149 185 148 186 133 192C119 197 105 204 97 209L93 211L93 207C94 203 94 202 93 203C91 203 91 202 93 198C98 186 102 173 102 169C102 167 103 166 103 166C109 164 125 159 137 154C145 151 151 149 152 149C152 149 153 152 154 156C154 160 154 163 155 163C155 163 159 161 164 159C171 156 190 152 191 153C191 153 189 164 185 178C179 205 174 231 174 240L174 245L163 248C157 250 148 253 142 255C131 258 101 271 90 278C85 281 84 281 84 281ZM191 269C191 268 192 260 193 251C195 241 196 230 196 225L196 217L200 216C203 215 217 211 233 206C249 200 263 196 265 196C267 195 268 194 269 194C269 193 276 149 276 148C275 147 241 160 230 166C226 168 219 172 214 175C201 182 202 183 205 165C206 159 208 147 209 140L211 126L215 125C217 125 231 121 247 116C263 110 276 106 278 106C280 105 280 105 281 114C281 122 281 123 283 123C284 122 289 120 294 118C307 113 327 109 327 112C327 113 324 125 321 139C312 173 305 212 307 219L307 223L298 226C293 228 283 231 276 232C259 237 209 259 196 267C192 269 192 269 191 269ZM321 255C321 253 333 202 333 201C334 201 333 199 332 197C330 192 331 191 338 191C342 190 357 187 372 184C387 180 404 176 410 175C415 174 420 173 420 172C421 172 433 117 433 115C433 113 430 114 418 118C396 124 369 136 353 146C348 150 344 152 343 152C343 151 343 148 344 144C346 137 346 136 343 138C340 139 340 139 344 124C349 108 352 94 352 88C352 83 353 81 356 81C359 81 381 75 402 69C421 63 436 59 437 59C437 60 437 65 438 70C438 76 439 81 439 82C440 82 446 80 454 77C466 72 469 72 481 70C500 68 498 68 496 73C496 76 493 84 491 92C489 99 485 112 483 119C478 132 470 167 469 178C468 182 467 187 466 191C465 195 465 200 465 203L464 209L455 211C450 212 441 215 435 216C429 218 420 221 415 223C395 228 372 237 353 246C332 257 332 257 332 254C333 251 331 251 326 254C322 257 321 258 321 255ZM55 179L56 164L64 160C69 158 74 156 74 157C74 157 73 164 71 173L67 188L62 191C59 193 56 194 56 194C55 194 55 187 55 179ZM72 188C72 186 78 162 79 161C80 160 93 155 94 155C95 155 93 162 89 173L85 184L79 186C73 188 72 188 72 188ZM157 140C157 130 157 121 156 119C156 116 156 115 159 115C160 114 166 112 171 109C176 107 181 105 181 106C182 106 181 111 179 116C178 122 176 132 175 138C174 145 173 151 173 151C172 151 158 158 158 158C157 158 157 150 157 140ZM178 149C178 146 185 115 186 114C187 113 202 107 204 107C206 107 205 113 199 131L195 146L188 148C184 149 180 150 179 150C179 150 178 150 178 149ZM285 103C285 95 285 84 285 78C285 67 285 67 288 66C293 65 300 63 308 59C320 54 319 54 315 69C311 81 308 93 306 102C305 108 305 109 302 109C301 110 296 112 292 114C288 115 285 117 285 117C284 117 284 111 285 103ZM311 106C311 105 313 97 316 87C318 77 320 68 321 67C321 66 322 65 323 64C325 63 345 56 346 56C348 56 347 62 341 78C332 104 334 102 323 105C318 106 313 107 312 108C312 108 311 107 311 106ZM443 74C442 73 442 15 442 14C443 14 445 13 447 13C450 13 458 10 466 6C474 3 481 0 481 1C482 1 480 10 478 20C475 30 472 45 470 52C469 60 467 66 467 66C466 66 461 68 455 71C442 76 443 75 443 74ZM475 64C475 64 478 52 481 37L487 11L503 5C512 2 519 0 519 1C521 2 505 55 502 59C502 59 497 61 490 62C484 63 478 64 477 65C476 65 475 65 475 64Z"],"kachi":[520,295,"M28 292C28 290 53 225 68 186C72 175 75 167 75 167C73 167 30 186 15 193C8 196 2 199 1 199C1 198 25 138 26 137C26 136 41 132 59 127C76 122 91 118 92 118C92 117 97 103 102 85C108 68 113 53 114 53C114 52 118 51 122 51C126 50 138 48 147 46C157 45 166 43 166 44C168 45 167 49 156 74C149 89 144 101 144 102C144 103 171 94 195 86C218 78 216 78 220 84C221 87 224 92 227 96L231 102L221 122C208 150 203 160 188 196C163 260 160 265 148 265C143 265 139 262 125 247C114 235 111 231 102 228C97 226 97 226 111 223C117 223 125 221 130 220L139 218L141 213C143 208 168 136 168 135C167 135 157 138 145 142L124 149L108 180C90 219 84 232 82 236C80 241 79 243 73 246C70 248 60 259 49 270C26 295 28 294 28 292ZM258 263C258 261 271 217 281 187C287 168 292 152 292 151C291 151 235 175 220 183C214 186 210 188 209 188C209 187 217 151 219 145C220 142 221 142 262 126C285 117 304 110 304 110C304 109 310 81 310 80C309 80 289 89 263 101C252 106 244 110 243 110C243 109 245 106 247 102C252 92 252 92 245 92C242 92 239 92 239 92C240 88 378 1 383 1C384 1 383 3 382 5C379 10 379 11 384 15C387 17 387 18 387 20C386 25 388 28 395 35L402 42L399 43C396 44 358 60 357 60C357 61 347 94 347 95C347 96 359 92 373 87C403 77 428 69 429 69C429 69 425 75 419 82C413 89 406 98 403 101C398 109 401 108 362 124C348 129 336 134 336 134C336 135 333 141 330 150C307 205 308 203 301 210C297 214 292 221 288 226C273 245 258 264 258 263ZM427 204C427 199 485 90 490 84C491 84 494 84 500 85C505 86 512 87 514 87C517 88 519 89 520 90C520 90 510 105 497 124L475 156L451 180C438 194 427 204 427 204ZM406 136C407 124 408 114 408 113C409 112 433 98 435 98C436 98 437 96 432 121L427 143L417 150C412 155 407 158 406 158C406 158 406 148 406 136ZM439 135C440 124 445 90 445 89C447 88 469 80 470 81C470 81 468 91 465 103L460 124L450 134C445 139 440 143 440 143C439 143 439 140 439 135Z"],"pon":[520,297,"M323 296C302 290 292 271 300 254C305 244 313 239 330 234C383 222 420 197 456 149C473 126 477 123 490 123C502 123 515 131 518 142C527 165 495 216 452 248C410 280 348 303 323 296ZM154 295C141 292 137 288 134 273C132 265 125 222 120 190C116 160 116 163 113 164C112 164 99 168 85 172C41 186 32 187 19 183C4 179-3 162 2 147C10 127 29 118 84 107C96 104 107 102 107 101C107 101 106 98 105 94C99 74 97 61 101 53C107 40 128 29 147 29C169 29 177 40 177 73C177 83 177 88 178 88C179 88 185 86 193 84L207 81L204 76C191 56 197 29 217 14C242-4 271-4 289 15C314 42 302 84 266 96L260 98L260 105C259 125 245 133 191 145C180 148 180 147 182 159C186 175 192 223 194 242C197 276 193 286 175 293C169 295 157 296 154 295ZM42 292C26 286 21 269 27 246C35 221 50 196 62 189C69 185 86 185 93 189C109 197 110 213 97 249C85 281 74 292 55 293C48 293 44 293 42 292ZM240 251C227 246 218 234 203 204C192 183 192 175 203 165C220 149 242 154 266 178C284 196 288 209 282 227C276 243 253 256 240 251ZM366 172C350 167 309 151 303 147C289 136 289 116 303 100C316 85 333 83 360 94C389 106 404 122 404 138C404 160 386 177 366 172ZM256 63C268 57 270 40 258 34C244 26 226 43 234 56C238 64 248 67 256 63Z"],"shu":[520,266,"M8 258C11 255 14 252 14 251C14 251 15 250 16 249C17 248 19 244 19 242C19 242 20 241 20 240C22 237 22 236 19 238C16 239 16 238 21 234C25 231 26 229 26 227C26 226 27 225 27 224C28 223 29 222 28 222C28 221 60 197 61 198C62 198 86 181 120 157C144 140 146 138 171 118C216 81 246 58 270 42C277 37 277 37 256 58C235 78 217 98 182 138C139 187 131 194 76 230C56 242 57 242 63 236C66 233 68 230 68 230C67 230 67 230 51 240C45 244 38 249 36 250L32 252L36 247L42 242L37 245C35 246 31 249 28 250C24 253 22 254 24 252C24 251 24 251 23 252C22 252 17 255 12 258L2 264L8 258ZM24 221C28 216 42 207 40 209C38 212 30 218 24 221L20 223L24 221ZM192 189C192 188 194 187 197 185C202 182 203 180 200 181C199 182 202 179 206 175C210 171 213 168 212 168C211 168 211 168 212 166C216 161 216 160 213 161C211 162 209 162 209 162C209 161 217 156 218 156C218 156 220 155 222 153C227 149 250 140 277 132C287 129 290 128 291 127C291 125 294 118 298 109C301 101 304 94 304 93C304 93 291 99 276 106C261 113 247 119 244 120L240 122L242 120C243 118 244 117 244 116C244 116 245 115 246 114C246 113 247 112 247 111C246 111 247 109 247 108C249 106 248 103 246 103C245 104 246 102 248 100C253 94 253 94 249 94C247 95 245 95 245 95C245 94 257 88 258 88C258 89 262 87 266 86C282 78 340 57 341 58C341 59 340 60 338 62C335 67 336 67 344 64C347 63 349 62 350 62C350 62 346 68 342 74C333 88 313 122 314 123C314 123 325 121 336 118C361 111 367 110 366 111C366 112 365 112 364 112C363 112 363 112 364 113C365 114 366 115 365 115C365 116 368 116 373 116L380 115L376 117C373 118 360 123 348 127C336 132 323 136 321 138C319 139 300 146 280 154C259 162 233 172 222 177C192 189 192 189 192 189ZM38 158C43 153 46 150 46 150C45 150 46 148 46 146C47 145 47 143 47 143C46 143 46 142 47 141C48 139 48 139 47 139C45 140 45 139 47 137L49 133L44 136L40 138L46 132C54 124 55 120 48 124C43 127 42 127 46 122C53 115 77 103 108 91C123 85 138 79 150 73C156 71 163 68 166 68C168 67 172 66 174 65C180 62 180 63 172 69C164 76 160 80 164 79C165 78 164 79 162 81C161 82 160 84 160 84C159 85 155 89 149 93C138 100 132 105 135 103C145 98 108 124 82 139C63 150 61 151 66 147C71 143 68 144 56 151C50 155 45 158 44 158C43 158 40 159 36 161L30 165L38 158ZM379 158C380 157 386 149 392 141C411 116 432 84 453 48C463 32 471 22 472 22C472 23 475 22 477 20C480 18 482 17 483 17C483 17 487 15 492 13C497 11 501 9 502 9C503 10 513 5 516 3C526-6 468 68 451 84C441 95 413 124 392 146C384 154 378 160 379 158ZM380 93C380 90 380 81 380 73C381 55 384 41 386 45C386 46 388 45 390 43C392 41 393 40 393 41C393 41 394 41 395 40C396 39 398 38 399 37C400 37 403 36 405 34C407 33 409 32 410 32C410 32 412 30 415 28C417 26 419 25 419 25C419 29 398 75 395 78C394 79 392 82 390 84C388 86 386 89 385 90C384 91 383 93 382 95C379 99 379 99 380 93ZM46 88C57 78 59 76 62 73C63 71 66 69 67 68C69 66 69 66 66 68C62 69 61 69 64 67C66 65 67 62 65 63C63 65 64 62 67 58L70 53L67 54C65 54 62 55 61 55C60 56 61 54 65 52C69 50 72 47 74 46C80 40 154 13 159 15C160 15 160 15 160 14C159 13 159 13 160 14C161 14 167 12 174 9C186 5 189 4 184 7C174 14 168 21 172 21C173 21 171 24 167 28C164 32 162 34 164 34C168 32 160 38 147 45C140 49 132 54 128 57C124 59 115 64 107 69C99 73 90 78 86 80C82 82 80 82 81 82C81 81 82 80 82 80C82 80 83 79 84 78C85 76 82 77 73 82C66 86 60 89 60 89C59 89 60 88 64 81C65 79 64 80 58 82C55 85 49 87 47 89L42 91L46 88ZM412 83C412 82 416 59 418 50C420 41 425 30 426 31C426 32 432 28 433 26C434 25 439 23 451 17C453 16 456 14 457 13C461 10 461 10 448 35C434 60 433 61 425 69C421 73 416 78 415 80C413 84 412 85 412 83Z"],"zuba":[520,291,"M38 254C68 223 79 212 67 222C64 224 62 227 61 227C61 228 60 228 59 228C59 228 54 231 48 236L38 243L50 231C65 216 68 213 69 214C70 215 92 193 104 179C115 166 116 164 108 171L103 176L106 171C121 154 126 148 133 139C137 133 141 127 142 125C143 123 146 119 147 117C151 113 157 104 157 103C157 103 154 104 152 106C142 112 128 119 127 118C126 118 126 118 126 119C127 119 125 120 124 121L120 123L123 121C124 120 125 119 125 119C124 119 103 130 94 136C85 141 84 142 86 139C88 137 84 139 68 150L56 158L62 151C71 144 69 144 51 156L38 165L47 155C52 150 58 144 60 143C62 141 63 139 63 138C63 138 64 136 65 136C67 134 67 134 64 135C63 135 60 136 58 137C56 138 55 139 54 139C54 139 58 136 62 131C67 127 71 124 71 124C71 123 59 126 56 127C52 130 51 129 54 127C60 123 54 125 42 131C36 134 30 137 30 137C30 136 42 128 50 123C55 120 59 117 60 116C60 116 64 113 69 110C78 105 81 102 77 104C76 104 73 104 71 104C69 105 66 105 65 106C60 108 60 107 68 102C71 99 75 96 75 96C76 94 83 91 85 91C86 91 90 90 95 88C99 86 104 85 105 85C107 84 110 83 112 83C119 80 129 76 129 77C129 77 126 78 123 80C117 83 108 89 109 89C110 89 120 85 127 82C130 80 134 79 134 79C136 79 176 59 176 58C175 58 173 59 170 59C168 60 165 61 165 61C164 61 186 51 190 49C193 48 196 47 198 46C200 45 200 45 200 52C201 56 201 61 202 62C203 64 203 65 202 70C201 74 200 79 200 83C199 90 199 90 193 97C192 98 189 102 188 104C186 106 183 111 180 114C175 121 158 145 158 145C158 146 173 158 174 158C174 158 174 157 173 157C173 155 175 157 183 164C185 166 190 171 194 174C201 180 201 180 196 182C192 184 191 187 192 191C194 195 192 199 189 199C187 198 187 198 185 209C185 212 184 215 184 216C183 216 179 212 175 206C164 193 157 186 160 191C169 204 164 200 147 181C141 175 140 174 139 175C134 181 111 208 108 212C102 218 104 217 113 209C121 203 121 204 108 215C101 222 94 229 92 231C89 232 84 236 80 240C68 249 67 249 76 240C80 236 86 230 89 227L94 221L89 224C87 226 80 231 74 236C68 241 57 250 48 257C29 273 29 273 35 266C45 256 48 253 46 254C43 255 33 263 21 273C15 278 9 283 8 284C6 285 20 271 38 254ZM174 262C174 261 176 257 178 252C180 247 183 241 184 238C185 236 187 231 189 228C190 224 193 219 194 215C195 211 197 206 199 204C200 201 201 199 201 198C201 197 205 186 210 174C220 151 222 145 219 149C218 150 217 152 216 153C215 154 218 147 224 136C229 126 233 116 233 115C233 113 236 108 242 102C247 97 249 96 247 99C247 102 247 101 256 95L262 90L263 93C263 94 263 97 264 99L264 102L268 99C271 97 273 96 273 98C273 100 267 114 260 127C246 152 240 165 241 167C241 168 241 168 240 168C240 167 239 168 239 169C239 171 224 197 223 197C223 196 224 194 225 191C226 188 227 186 227 185C226 185 217 200 206 218C196 234 193 238 200 225C205 214 203 216 195 229C184 247 174 263 174 262ZM329 207C330 205 334 198 338 192C343 185 347 178 348 176C349 174 351 171 352 168C354 166 362 152 370 139C389 109 387 111 394 107C400 102 402 102 402 104C402 106 404 106 411 104C414 104 414 104 413 107C413 108 411 110 410 112C407 120 370 167 368 167C368 167 362 173 355 181C343 196 341 198 346 191C350 184 348 186 338 197C329 209 325 213 329 207ZM296 193C294 187 292 180 292 177C290 170 289 169 289 172L289 174L288 172C287 171 287 167 287 164C286 161 285 156 285 153C283 149 280 130 277 114C277 109 279 99 281 100C282 101 282 100 283 96C285 90 287 86 290 84C293 80 295 84 305 113C309 124 313 138 316 144C318 149 319 155 319 157C320 159 320 162 320 164L321 168L319 165C315 161 315 161 315 168L316 174L314 171C313 169 312 168 311 168C310 169 310 169 310 174C310 177 310 178 309 177C308 173 307 175 307 181C307 185 307 187 306 187C305 187 305 189 305 192L306 196L302 190L299 182L299 193C300 198 300 203 300 203C299 203 298 198 296 193ZM397 193C397 191 397 190 396 190C396 191 395 188 395 184C396 173 401 166 415 159L421 156L421 159C422 160 422 161 423 161C425 161 423 171 420 176C417 183 409 191 402 194L397 197L397 193ZM436 189C437 187 436 186 434 187C431 188 431 185 431 177C432 166 441 157 453 155C454 155 454 155 455 155C456 153 458 158 459 162C459 169 456 174 449 181C442 186 435 191 436 189ZM409 152C409 150 410 144 411 139C412 135 413 130 413 128C413 127 414 122 415 118C421 99 423 95 421 96C420 96 419 97 425 79C431 62 432 60 428 66C427 67 426 69 425 69C424 67 447 25 453 18C455 16 454 17 450 27C446 37 446 38 451 33C452 30 454 29 454 30C454 30 454 31 453 31C452 32 452 33 452 33C452 34 458 28 466 20L480 6L476 14C474 18 472 22 473 23C473 23 472 25 472 27C470 32 470 32 474 29L476 26L475 29C473 32 472 34 466 46C464 51 458 62 454 70C449 78 446 87 446 88C445 90 443 95 441 99C436 109 430 122 430 126C429 129 421 145 419 146C418 147 418 147 418 145C419 142 419 142 413 150L408 157L409 152ZM335 147C334 143 333 136 332 132L332 123L336 119C339 116 345 111 352 106C354 105 354 105 354 111C353 125 348 141 346 140C345 140 343 143 341 147C339 151 337 154 337 154C337 154 336 151 335 147ZM442 152C442 150 444 142 446 132C447 130 449 122 451 115C453 108 455 102 455 101C454 101 454 101 454 102C454 102 453 103 452 105C450 107 453 100 462 78C466 69 470 60 470 59L471 56L469 59C467 62 466 61 469 57C475 44 490 22 493 22C494 22 498 18 503 13C513 3 513 3 505 17C503 20 502 23 503 23C503 24 502 25 501 27C501 29 500 30 500 31C501 31 513 21 516 18C516 16 517 16 517 16C516 19 514 24 512 26C511 28 511 29 511 30C512 30 511 32 510 35C507 41 507 41 511 37L514 34L513 38C511 39 508 45 505 50C502 55 497 63 494 68C489 77 482 89 482 91C482 91 483 90 485 88C487 86 487 88 481 96C477 103 473 111 470 114C468 118 465 123 463 126C462 128 460 131 459 132C459 135 453 145 452 145C451 145 451 144 452 143C452 141 450 144 445 150C443 152 442 153 442 152ZM357 140C357 137 357 134 357 132C356 127 359 110 360 107C361 106 364 103 367 101C370 99 374 96 375 95L378 93L378 96C379 99 379 99 381 98C382 97 383 97 383 97C383 101 369 130 367 130C367 130 365 132 363 134C362 136 360 139 359 141L357 144L357 140ZM309 102C308 101 307 96 306 91C302 73 302 62 306 61C307 61 309 58 311 55C314 49 316 48 316 50C316 51 318 50 319 48L323 44L322 48L322 53L324 51L326 50L326 54C323 71 319 89 317 89C317 89 315 92 313 96C310 105 309 106 309 102ZM206 96C206 94 207 87 207 82C207 76 208 66 209 59C210 42 212 39 221 33L228 28L227 31C225 36 226 37 231 33L235 29L234 34C233 45 226 70 222 74C221 76 220 78 219 79C219 80 218 81 218 81C217 81 217 82 217 82C217 83 216 84 215 85C215 86 212 90 210 94L206 102L206 96ZM327 87C327 82 328 73 329 66L331 53L335 48C338 46 340 44 341 44C341 45 343 44 346 43C352 39 353 39 352 41C351 44 351 44 353 43C354 42 354 42 355 42C355 42 356 41 358 40C361 39 361 39 357 43C352 49 349 57 354 52C355 51 353 55 350 60C342 75 341 77 336 83C330 90 329 91 328 93C326 95 326 94 327 87ZM232 76C232 73 235 55 237 44C239 37 240 32 240 31C240 31 260 18 260 18C261 18 261 19 260 20C260 21 261 21 263 19C269 15 270 14 267 18C266 20 264 21 264 22C263 22 259 29 259 31C259 31 260 30 262 30C264 28 264 28 261 34C259 38 257 41 258 41C259 43 250 58 243 65C239 69 235 74 234 75C233 77 232 77 232 76Z"],"zuza":[520,287,"M3 282C6 279 27 251 63 203C78 183 99 155 109 141C119 128 128 115 129 113C130 111 131 110 131 110C130 108 61 142 35 157C28 161 22 164 22 164C22 163 23 161 25 158C31 146 40 118 40 112C40 111 39 109 38 108C38 107 37 106 37 106C37 105 48 101 67 94C82 89 92 85 155 61C177 53 195 46 195 46C195 46 195 52 193 60C192 67 190 79 189 85L188 97L166 126C153 142 143 155 143 156C143 156 148 159 154 162C172 171 213 194 215 196C215 197 213 199 211 202C203 210 189 236 189 241C189 242 189 243 188 243C188 243 152 217 132 201L119 191L101 207C79 226 53 248 52 248C52 248 52 247 53 247C53 246 54 245 54 245C54 244 52 245 26 266C16 275 6 282 4 283L2 285L3 282ZM287 256C297 230 308 203 314 189C326 161 340 127 340 126C339 126 307 137 306 138C306 138 303 147 299 158L293 176L285 183C281 187 274 193 271 197C268 201 266 204 265 204C265 204 270 173 273 154C273 151 273 148 273 148C270 148 223 167 211 173C203 177 202 177 205 171C207 167 217 136 217 134C217 133 216 131 216 130C214 128 214 128 247 119C265 114 280 110 280 110C280 109 281 102 283 93C290 64 289 66 295 63C303 59 336 45 336 45C337 45 334 52 330 61C322 81 316 99 316 100C317 100 325 98 334 95L351 90L356 77C363 57 368 44 370 42C372 39 412 20 413 21C413 22 411 28 408 35C400 52 391 78 391 79C391 80 395 80 407 77C416 75 428 72 434 71L445 68L443 71C417 103 415 105 410 106C407 107 399 109 393 111L381 114L372 136C354 181 351 186 344 194C340 197 333 205 328 212C323 218 311 231 302 242C293 252 286 261 285 261C285 261 286 259 287 256ZM424 202C426 200 436 184 447 166C459 147 472 126 477 119L486 105L493 103C502 100 517 97 518 97C519 97 516 102 512 107C508 112 498 126 489 138C474 159 473 160 458 173C450 180 439 190 435 194C431 197 426 201 425 203L423 204L424 202ZM411 154C411 146 412 136 412 131L412 123L426 115C442 107 443 107 442 110C438 130 431 152 428 153C427 155 422 158 418 162L410 168L411 154ZM442 145C449 108 449 108 454 104C459 101 478 91 479 91C479 91 468 117 462 132C461 134 457 137 452 141C441 149 442 149 442 145ZM193 104C193 103 195 89 198 74C204 36 204 33 207 31C211 28 241 11 242 11C243 11 242 14 240 19C239 23 234 37 229 49C223 68 221 72 218 76C208 88 196 102 194 104L192 106L193 104ZM223 87C223 85 243 31 246 24C247 21 250 19 256 15C270 7 282 1 282 2C281 3 278 11 274 20C270 29 264 42 261 50L256 62L248 68C244 71 237 76 232 81C227 85 223 88 223 87ZM408 70C408 66 425 22 429 18C431 15 457 1 458 2C458 3 453 13 446 26C435 48 434 50 429 54C426 56 420 61 416 65C411 68 408 71 408 70ZM437 63C444 43 455 20 458 18C462 14 488 0 489 1C489 2 470 37 465 44C464 45 458 50 451 54C436 66 436 66 437 63Z"]};
// <<< words
const shapes = {}, baked = new Map();
const word = (name) => shapes[name] || (WORDS[name] && (shapes[name] = { w: WORDS[name][0], h: WORDS[name][1], p: new Path2D(WORDS[name][2]) }));
// The outline, glow and fill are painted once per word, colour and theme, so a word on screen costs one drawImage a frame.
function bake(name, fc, oc, dots) {
  const key = name + fc + oc + dots + P.glow; let c = baked.get(key); if (c) return c;
  const s = word(name), pad = P.glow ? 96 : 24, e = s.w * 0.035;
  c = document.createElement('canvas'); c.width = s.w + pad * 2; c.height = s.h + pad * 2;
  const x = c.getContext('2d'); x.translate(pad, pad); x.lineJoin = 'round';
  if (P.glow) { x.shadowColor = oc; x.shadowBlur = 60; }
  x.strokeStyle = x.fillStyle = oc; x.lineWidth = e * 2; x.stroke(s.p); x.fill(s.p); x.shadowBlur = 0;
  if (dots) {   // screentone letters: dots in the outline colour on white
    const t = document.createElement('canvas'); t.width = 22; t.height = 44; const y = t.getContext('2d'); y.fillStyle = '#fff'; y.fillRect(0, 0, 22, 44); y.fillStyle = oc; y.beginPath();
    for (const [px, py] of [[0, 0], [22, 0], [0, 44], [22, 44], [11, 22]]) { y.moveTo(px + 5.2, py); y.arc(px, py, 5.2, 0, TAU); } y.fill(); x.fillStyle = x.createPattern(t, 'repeat');
  } else x.fillStyle = fc;
  x.fill(s.p); baked.set(key, c); return c;
}
// A word lands a size too big and wobbles while it stays. col: fill colour. edge: outline colour. dots: screentone letters.
function sfx(name, x, y, { size = 64, rot = -0.14, life = 0.95, col, edge, dots } = {}) {
  if (!word(name)) return; const s = new Spring(0.2, 520, 17); s.to = 1; let lastT = 0;
  const c = bake(name, col || P.sfx[0], edge || P.sfx[1], !!dots), k0 = size / WORDS[name][0];
  add(life, (k, t) => {
    const sc = s.step(t - lastT) * (1 - inn(clamp((k - 0.86) / 0.14))) * k0; lastT = t;
    g.translate(x + Math.sin(t * 31) * 0.8, y + Math.cos(t * 27) * 0.8); g.rotate(rot + Math.sin(t * 6) * 0.03);
    g.drawImage(c, -c.width / 2 * sc, -c.height / 2 * sc, c.width * sc, c.height * sc);
  });
}
// lettering styles that belong to the white theme only: hollow (white with an ink edge), dotted, or a colour of your own
const sak = () => P.hit === 'burst';
const only = (o) => (sak() ? o : {}), hollow = () => only({ col: '#ffffff', edge: '#1d1a4a' }), dotted = () => only({ dots: true, edge: '#1d1a4a' });

// the hit each theme makes when something is confirmed
function hit(x, y, { r = 44, w = 60, word: wd = 'don' } = {}) {
  if (P.hit === 'burst') { burst(x, y, { r }); shards(x, y, { n: 7 }); puff(x - w, y + 6, { vx: -26, size: r * 0.3 }); puff(x + w, y + 6, { vx: 26, size: r * 0.3 }); puff(x - w * 0.6, y - 12, { vx: -14, vy: -30, size: r * 0.2, n: 3 }); ring(x, y + 10, { rx: Math.min(70, w * 1.1), ry: 9 }); sfx(wd, x + 8, y - r - 10, { size: r * 1.9 }); }
  else if (P.hit === 'slash') { slash(x, y, { len: r * 2.9, ang: -0.45, thick: r * 0.42 }); slash(x + 6, y + 4, { len: r * 2.1, ang: 2.5, thick: r * 0.26, life: 0.5 }); shards(x, y, { n: 8, speed: 240 }); bolt(x - w, y + rnd(-12, 12), x + w, y + rnd(-12, 12)); bolt(x - w * 0.6, y - 16, x + w * 0.8, y + 14, { life: 0.36 }); for (let i = 0; i < 3; i++) kira(x + rnd(-w, w), y + rnd(-22, 22), { r: rnd(4, 8), life: rnd(0.3, 0.6) }); sfx(wd === 'don' ? 'zuba' : wd, x + 14, y - r - 12, { size: r * 2.3 }); }
  else { rings(x + w * 0.6, y, { dir: 0, reach: r * 3.4 }); lines(x - w, y, { n: 12, dir: Math.PI, len: 90, spread: 30 }); lines(x + w, y, { n: 12, dir: 0, len: 110, spread: 34 }); shards(x, y, { n: 7 }); puff(x - w * 0.8, y + 10, { vx: -30, size: r * 0.26 }); sfx(wd === 'don' ? 'bang' : wd, x - 4, y - r - 12, { size: r * 2.2 }); }
}

// ───────── for components ─────────
const at = (el, fx = 0.5, fy = 0.5) => { const b = el.getBoundingClientRect(); return { x: b.left + scrollX + b.width * fx, y: b.top + scrollY + b.height * fy, w: b.width, h: b.height }; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// a press: squash flat while held, overshoot on release. Call step(dt) every frame.
function squashy(el, { low = 0.82, k = 520, d = 15, wide = 0.55 } = {}) {
  const s = new Spring(1, k, d), pop = new Spring(1, 300, 12), tilt = new Spring(0, 260, 10);
  el.addEventListener('pointerdown', () => { if (!el.disabled) s.to = low; });
  for (const e of ['pointerup', 'pointerleave', 'pointercancel', 'blur']) el.addEventListener(e, () => { s.to = 1; });
  return { s, pop, tilt, step(dt) { const y = s.step(dt), p = pop.step(dt), r = tilt.step(dt), still = Math.abs(y - 1) < 0.001 && Math.abs(s.v) < 0.01 && Math.abs(p - 1) < 0.001 && Math.abs(r) < 0.02;
    el.style.transform = still ? '' : `rotate(${r}deg) scale(${(1 + (1 - y) * wide) * p}, ${y * p})`; } };
}
const BASE_CSS = `:host{display:inline-block;position:relative;isolation:isolate;vertical-align:middle;color:var(--sk-ink);font:500 15px/1.4 -apple-system,BlinkMacSystemFont,"Inter","Segoe UI",system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
:host([hidden]){display:none}*{box-sizing:border-box}button,input{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}
:focus-visible{outline:2.5px solid var(--sk-acc);outline-offset:3px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
canvas.back{position:absolute;left:-160px;top:-160px;width:calc(100% + 320px);height:calc(100% + 320px);pointer-events:none;z-index:-1}`;
// The base for every component: a shadow root built on first connect, one frame callback on the shared clock while it is on the page.
class Base extends HTMLElement {
  constructor() { super(); this.root = this.attachShadow({ mode: 'open', delegatesFocus: !!this.constructor.delegates }); if (this.constructor.formAssociated) this.internals = this.attachInternals(); }
  connectedCallback() {
    // a component built from its <option>s waits until the parser has read them
    if (!this.ready && this.constructor.fromChildren && document.readyState === 'loading') { if (!this.waiting) { this.waiting = true; document.addEventListener('DOMContentLoaded', () => { this.waiting = false; if (this.isConnected) this.connectedCallback(); }, { once: true }); } return; }
    if (!this.ready) { this.ready = true; this.root.innerHTML = `<style>${BASE_CSS}${this.constructor.css || ''}</style>${this.render()}`; this.setup(); }
    this.tickFn ||= (dt) => this.frame(dt); frames.add(this.tickFn); start();
  }
  disconnectedCallback() { frames.delete(this.tickFn); }
  $(s) { return this.root.querySelector(s); }
  $$(s) { return [...this.root.querySelectorAll(s)]; }
  render() { return ''; } setup() {} frame() {}
  backLayer() { const c = document.createElement('canvas'); c.className = 'back'; c.setAttribute('aria-hidden', 'true'); this.root.prepend(c); return backLayer(c); }
  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail })); }
}
const define = (tag, cls) => { if (!customElements.get(tag)) customElements.define(tag, cls); };

const api = window.SakugaFX = {
  version: 1, paused: false,
  get P() { return P; }, get calm() { return calm; }, get now() { return now; },
  TAU, clamp, lerp, rnd, Spring, setTheme, theme: () => html.dataset.sakugaTheme || 'sakuga',
  advance, later, persist, blob, shape, glow, get g() { return g; },
  puff, burst, shards, ring, splash, slash, lines, ticks, donut, wob, kira, rings, bolt, sfx, hit, sak, hollow, dotted, only,
  at, esc, squashy, Base, define,
};
})();
// <<< sakuga core
component(window.SakugaFX);
})();
