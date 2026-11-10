// The large illustrated graphics: hero, text bands, world map, isometric stack,
// flow diagrams and the closing sunset. Run through zg-build.mjs.
// No blur filters or masks on animated content: SVG images repaint whole on every frame.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { geoNaturalEarth1, geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import * as si from 'simple-icons';
import { Doc, T, heading, waves, typer, ping, wrap, measure, monoW, arrow, logo, brand, n } from './zg-lib.mjs';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const landTopo = JSON.parse(fs.readFileSync(require.resolve('world-atlas/land-110m.json')));
const land = feature(landTopo, landTopo.objects.land);
const AVATAR = fs.readFileSync(path.join(HERE, 'src/zg-avatar.jpg')).toString('base64');

// Moving highlights and the closing sun, from the portrait's reds.
const SUN = { top: '#FFB4BA', hi: '#FFE3E6', mid: '#F0263C', low: '#A9172D', deep: '#3A0A1E' };
const seeded = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const spin = (cx, cy, dur, rev) => `transform-origin:${n(cx)}px ${n(cy)}px;animation:${rev ? 'zg-rev' : 'zg-rot'} ${dur}s linear infinite`;
const ROT = '@keyframes zg-rot{to{transform:rotate(360deg)}}@keyframes zg-rev{to{transform:rotate(-360deg)}}';
const acc = (o) => `rgba(255,77,94,${o})`;

function stars(d, W, H, count, skip = () => false) {
  const rnd = seeded(11);
  d.once('zg-tw', '@keyframes zg-tw{0%,100%{opacity:.15}50%{opacity:.9}}');
  let still = '', live = '';
  for (let i = 0; i < count; i++) {
    const x = n(rnd() * W), y = n(rnd() * H), r = n(0.5 + rnd() * 0.8);
    if (skip(x, y)) continue;
    if (i % 5 === 0) live += `<circle cx="${x}" cy="${y}" r="${r}" fill="${T.text}" style="animation:zg-tw ${n(2.5 + rnd() * 4)}s ease-in-out ${n(rnd() * 3)}s infinite"/>`;
    else still += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  }
  d.add(`<g fill="${T.text}" opacity=".32">${still}</g>${live}`);
}

/* ---------- HERO ---------- */
// Background taken from the portrait: window lights, tilted code panels, red circuit nodes.
function cyberBackdrop(d, W, H, { seed = 7, clear = () => false, panels = [], reds = [], cols = 12 }) {
  const rnd = seeded(seed);
  d.once('zg-tw', '@keyframes zg-tw{0%,100%{opacity:.15}50%{opacity:.9}}');
  d.once('zg-pl', '@keyframes zg-pl{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}');

  let still = '', live = '';
  for (let c = 0; c < cols; c++) {
    const x = n(10 + rnd() * (W - 20));
    let y = rnd() * H * 0.55;
    const count = 3 + Math.floor(rnd() * 6), tone = rnd() > 0.6 ? T.blue : T.accent;
    for (let i = 0; i < count; i++) {
      const w = 6 + Math.floor(rnd() * 8), h = 4 + Math.floor(rnd() * 4), o = n(0.08 + rnd() * 0.3);
      if (!clear(x, y) && !clear(x + w, y + h)) {
        const el = `<rect x="${x}" y="${n(y)}" width="${w}" height="${h}" rx="1.5" fill="${tone}"`;
        if (rnd() > 0.82) live += `${el} style="animation:zg-tw ${n(3 + rnd() * 4)}s ease-in-out ${n(rnd() * 3)}s infinite"/>`;
        else still += `${el} opacity="${o}"/>`;
      }
      y += h + 5 + rnd() * 9;
    }
  }
  d.add(still + live);

  panels.forEach(({ x, y, w, h, skew }) => {
    let lines = '';
    for (let r = 0; r < Math.floor((h - 18) / 8); r++) {
      lines += `<rect x="${n(8 + (r % 3) * 5)}" y="${16 + r * 8}" width="${n((w - 24) * (0.35 + rnd() * 0.6))}" height="2.5" rx="1" fill="${T.accent}" opacity="${n(0.25 + rnd() * 0.3)}"/>`;
    }
    d.add(`<g transform="matrix(1 ${skew} 0 1 ${x} ${y})"><rect width="${w}" height="${h}" rx="3" fill="${T.accent}" fill-opacity=".05" stroke="${acc(0.4)}"/><path d="M0 11H${w}" stroke="${acc(0.25)}"/><circle cx="6" cy="6" r="1.6" fill="${T.red}"/>${lines}</g>`);
  });

  d.def(`<radialGradient id="zg-nd"><stop offset="0" stop-color="${T.redHi}" stop-opacity=".9"/><stop offset="1" stop-color="${T.red}" stop-opacity="0"/></radialGradient>`);
  reds.forEach(([x, y1, y2, ny], i) => {
    d.add(`<path d="M${x} ${y1}V${y2}" stroke="${T.red}" stroke-opacity=".55" stroke-width="1.25"/>`);
    d.add(`<circle class="zg-c" cx="${x}" cy="${ny}" r="13" fill="url(#zg-nd)" style="animation:zg-pl ${n(2.6 + i * 0.5)}s ease-in-out ${n(i * 0.4)}s infinite"/><circle cx="${x}" cy="${ny}" r="2.2" fill="#fff"/>`);
  });
}

function hud(d, cx, cy, k) {
  d.once('zg-rot', ROT);
  const r = { av: 110 * k, inner: 118 * k, text: 127 * k, orbit: 164 * k, outer: 190 * k };

  // Two-sided light, as on the portrait: red from the left, blue from the right.
  d.def(`<radialGradient id="zg-hr"><stop offset="0" stop-color="${T.red}" stop-opacity=".46"/><stop offset="1" stop-color="${T.red}" stop-opacity="0"/></radialGradient><radialGradient id="zg-hb"><stop offset="0" stop-color="${T.red}" stop-opacity=".2"/><stop offset="1" stop-color="${T.red}" stop-opacity="0"/></radialGradient><linearGradient id="zg-rim" x1="0" x2="1"><stop offset="0" stop-color="${T.red}"/><stop offset=".72" stop-color="${T.accent}"/><stop offset="1" stop-color="${T.blue}"/></linearGradient>`);
  d.add(`<circle cx="${n(cx - r.outer * 0.42)}" cy="${cy}" r="${n(r.outer * 1.08)}" fill="url(#zg-hr)"/><circle cx="${n(cx + r.outer * 0.42)}" cy="${cy}" r="${n(r.outer * 1.08)}" fill="url(#zg-hb)"/>`);

  // Outer tick ring and broken arcs.
  let ticks = '';
  for (let a = 0; a < 360; a += 6) {
    const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180), len = a % 30 === 0 ? 10 * k : 4 * k;
    ticks += `M${n(cx + c * r.outer)} ${n(cy + s * r.outer)}L${n(cx + c * (r.outer - len))} ${n(cy + s * (r.outer - len))}`;
  }
  d.add(`<path d="${ticks}" stroke="${acc(0.55)}" style="${spin(cx, cy, 120, true)}"/>`);
  d.add(`<circle cx="${cx}" cy="${cy}" r="${n(r.outer + 9 * k)}" fill="none" stroke="${T.accent}" stroke-width="1.75" stroke-linecap="round" stroke-dasharray="110 50 16 50 240 90" style="${spin(cx, cy, 70)}"/>`);
  d.add(`<circle cx="${cx}" cy="${cy}" r="${n(r.outer + 15 * k)}" fill="none" stroke="${T.blue}" stroke-width="1.75" stroke-linecap="round" stroke-dasharray="70 180 24 300" style="${spin(cx, cy, 46, true)}"/>`);

  // Radar sweep behind the portrait.
  const a0 = -0.55, a1 = 0.1;
  d.add(`<path d="M${cx} ${cy}L${n(cx + Math.cos(a0) * r.outer)} ${n(cy + Math.sin(a0) * r.outer)}A${n(r.outer)} ${n(r.outer)} 0 0 1 ${n(cx + Math.cos(a1) * r.outer)} ${n(cy + Math.sin(a1) * r.outer)}Z" fill="${T.red}" fill-opacity=".12" style="${spin(cx, cy, 11)}"/>`);

  // Orbit carrying the main tools. Logos counter-rotate to stay upright.
  d.add(`<circle cx="${cx}" cy="${cy}" r="${n(r.orbit)}" fill="none" stroke="${acc(0.35)}" stroke-dasharray="2 7" stroke-linecap="round"/>`);
  const tools = [si.siWordpress, si.siShopify, si.siNextdotjs, si.siN8n, si.siClaude, si.siGoogleanalytics];
  const dur = 64;
  d.add(`<g style="${spin(cx, cy, dur)}">`);
  tools.forEach((ic, i) => {
    const a = (i / tools.length) * Math.PI * 2 - Math.PI / 2;
    const x = n(cx + Math.cos(a) * r.orbit), y = n(cy + Math.sin(a) * r.orbit);
    d.add(`<g style="${spin(x, y, dur, true)}"><circle cx="${x}" cy="${y}" r="${n(18 * k)}" fill="${T.panel2}" stroke="${acc(0.6)}"/>${logo(ic, x, y, n(19 * k), brand(ic))}</g>`);
  });
  d.add('</g>');

  // Rotating text ring.
  const ring = 'WORDPRESS · SHOPIFY · NEXT.JS · N8N · MCP · TECHNICAL SEO · TRACKING · ';
  d.use('m5', ring);
  d.def(`<path id="zg-tr" d="M${n(cx - r.text)} ${cy}a${n(r.text)} ${n(r.text)} 0 1 1 ${n(r.text * 2)} 0a${n(r.text)} ${n(r.text)} 0 1 1 ${n(-r.text * 2)} 0"/>`);
  d.add(`<g style="${spin(cx, cy, 34)}"><text class="zg-m5" font-size="${n(10 * k)}" fill="${T.blush}"><textPath href="#zg-tr" textLength="${n(2 * Math.PI * r.text - 2)}">${ring}</textPath></text></g>`);

  // Portrait.
  const s = r.av * 2.04;
  d.def(`<clipPath id="zg-av"><circle cx="${cx}" cy="${cy}" r="${n(r.av)}"/></clipPath>`);
  d.add(`<circle cx="${cx}" cy="${cy}" r="${n(r.inner)}" fill="${T.bg}" stroke="url(#zg-rim)" stroke-width="2.5"/>`);
  d.add(`<image href="data:image/jpeg;base64,${AVATAR}" x="${n(cx - s / 2)}" y="${n(cy - s / 2)}" width="${n(s)}" height="${n(s)}" clip-path="url(#zg-av)"/>`);
  const lx = n(cx + Math.cos(0.8) * r.inner), ly = n(cy + Math.sin(0.8) * r.inner);
  d.add(`<circle cx="${lx}" cy="${ly}" r="${n(6.5 * k)}" fill="${T.red}" stroke="${T.bg}" stroke-width="2.5"/>`);
  d.add(ping(d, lx, ly, { r: n(6.5 * k), dur: 2.4, grow: 3, color: T.red }));
}

export async function hero(mobile, save) {
  const W = mobile ? 420 : 880, H = mobile ? 660 : 456;
  const d = new Doc(W, H, 'Zeno, full-stack web and AI developer based in the Philippines, open to freelance, contract and agency roles.');
  d.panel({ fill: T.bg, decor: false });
  const typedY = mobile ? 226 : 268;
  // The typing line paints its own background, so nothing may sit behind it.
  const clear = (x, y) => x < (mobile ? 330 : 400) && y > typedY - 26 && y < typedY + 14;
  stars(d, W, mobile ? 300 : 360, mobile ? 40 : 60, clear);
  cyberBackdrop(d, W, H - 90, mobile
    ? { seed: 19, clear, cols: 9, panels: [{ x: 312, y: 70, w: 96, h: 76, skew: -0.1 }, { x: 12, y: 290, w: 64, h: 58, skew: 0.1 }, { x: 350, y: 300, w: 80, h: 68, skew: -0.08 }], reds: [[398, 0, 160, 96], [28, 372, 548, 470], [404, 420, 560, 506]] }
    : { seed: 7, clear, cols: 15, panels: [{ x: 416, y: 20, w: 96, h: 70, skew: 0.1 }, { x: 806, y: 22, w: 90, h: 92, skew: -0.1 }, { x: 396, y: 276, w: 74, h: 58, skew: 0.08 }], reds: [[446, 0, 124, 104], [846, 140, 348, 244], [408, 134, 262, 186], [868, 0, 82, 16]] });

  if (mobile) hud(d, 210, 420, 0.8);
  else hud(d, 652, 208, 1);

  const x = mobile ? 24 : 36;
  const pillText = 'Open to freelance, contract and agency roles';
  const pillSize = mobile ? 12 : 12.5;
  const pillW = pillText.length * monoW(pillSize) + 44;
  const pillY = mobile ? 28 : 32;
  d.add(`<rect x="${x}" y="${pillY}" width="${n(pillW)}" height="30" rx="8" fill="${T.panel2}" stroke="${acc(0.35)}"/>`);
  d.add(`<circle cx="${x + 17}" cy="${pillY + 15}" r="3.5" fill="${T.red}"/>`);
  d.add(ping(d, x + 17, pillY + 15, { r: 3.5, dur: 2.2, color: T.red }));
  d.text(pillText, x + 30, pillY + 19.5, { f: 'm4', size: pillSize, fill: T.muted });

  d.def(`<linearGradient id="zg-name" x1="0" y1="0" x2="0" y2="1"><stop offset=".2" stop-color="#FFFFFF"/><stop offset="1" stop-color="${T.blush}"/></linearGradient>`);
  const size = mobile ? 100 : 128, nameY = mobile ? 148 : 182;
  d.text('Zeno', x + 2, nameY + 4, { f: 'd7', size, fill: 'none', stroke: T.red, sw: 1.25, op: 0.85, ls: -4 });
  d.text('Zeno', x - 3, nameY, { f: 'd7', size, fill: 'url(#zg-name)', ls: -4 });
  d.text('Full-stack web + AI developer', x, mobile ? 188 : 226, { f: 'd5', size: mobile ? 24 : 27, fill: T.accent });

  typer(d, {
    x, y: typedY, size: mobile ? 15.5 : 17,
    phrases: ['> WordPress & Elementor', '> Shopify themes & Liquid', '> React & Next.js apps', '> n8n workflows & MCP servers', '> Technical SEO & llms.txt', '> GA4, GTM & Meta Pixel'],
  });

  if (!mobile) {
    let cx = x;
    ['Zana-G', 'Philippines · GMT+8'].forEach((c) => {
      const w = c.length * monoW(12) + 22;
      d.add(`<rect x="${cx}" y="292" width="${n(w)}" height="26" rx="7" fill="${T.bg}" stroke="${acc(0.45)}"/>`);
      d.text(c, cx + 11, 309, { f: 'm4', size: 12, fill: T.muted });
      cx += w + 8;
    });
  }

  const base = H - 84;
  waves(d, [
    { lambda: 230, amp: 9, y: base, dur: 17, fill: 0.05, stroke: 0.35 },
    { lambda: 170, amp: 7, y: base + 18, dur: 12, fill: 0.07, stroke: 0.5, rev: true },
    { lambda: 290, amp: 11, y: base + 36, dur: 21, fill: 0.08, stroke: 0.85, color: T.blue },
    { lambda: 130, amp: 5, y: base + 54, dur: 9, fill: 0.14, stroke: 1, rev: true },
  ]);
  d.close();
  await save(d, mobile ? 'zg-hero-mobile.svg' : 'zg-hero.svg');
}

/* ---------- CROSSED TEXT BANDS ---------- */
const BANDS = {
  a: {
    one: ['WordPress', 'Elementor', 'Shopify', 'Liquid', 'Next.js', 'React', 'n8n', 'MCP'],
    two: ['AI agents', 'Technical SEO', 'llms.txt', 'Schema', 'GA4', 'GTM', 'Meta Pixel'],
  },
  b: {
    one: ['Building for the web, one solution at a time'],
    two: ['Scope', 'Ship', 'Polish', 'Staging', 'Live', 'Git'],
  },
};

export async function bands(mobile, variant, save) {
  const W = mobile ? 420 : 880, size = mobile ? 25 : 34;
  const bh = size * 1.62, H = Math.ceil(bh * 2 + (mobile ? 30 : 44));
  const { one, two } = BANDS[variant];
  const d = new Doc(W, H, [...one, ...two].join(', '));

  const band = (words, { y, ang, bg, fg, outline, dur, rev, border }) => {
    const gap = size * 1.5;
    let x = 0, row = '';
    words.forEach((w) => {
      const label = w.toUpperCase();
      row += d.t(label, x, 0, { f: 'd7', size, fill: outline ? 'none' : fg, stroke: outline ? fg : undefined, sw: outline ? 1.1 : undefined, ls: 0.5 });
      x += measure(label, 'd7', size) + label.length * 0.5 + gap / 2;
      const s = size * 0.3, cy = -size * 0.35;
      row += `<path d="M${n(x)} ${n(cy - s)}Q${n(x)} ${n(cy)} ${n(x + s)} ${n(cy)}Q${n(x)} ${n(cy)} ${n(x)} ${n(cy + s)}Q${n(x)} ${n(cy)} ${n(x - s)} ${n(cy)}Q${n(x)} ${n(cy)} ${n(x)} ${n(cy - s)}Z" fill="${fg}"/>`;
      x += gap / 2;
    });
    const id = d.uid('zg-r'), period = n(x), copies = Math.ceil((W + 240) / x) + 2;
    d.def(`<g id="${id}">${row}</g>`);
    const name = d.uid('zg-s');
    d.style(`@keyframes ${name}{from{transform:translateX(${rev ? -period : 0}px)}to{transform:translateX(${rev ? 0 : -period}px)}}`);
    let uses = '';
    for (let i = 0; i < copies; i++) uses += `<use href="#${id}" x="${n(i * x)}"/>`;
    d.add(`<g transform="rotate(${ang} ${W / 2} ${n(y)})"><rect x="-140" y="${n(y - bh / 2)}" width="${W + 280}" height="${n(bh)}" fill="${bg}"${border ? ` stroke="${acc(0.4)}"` : ''}/><g transform="translate(-120 ${n(y + size * 0.35)})"><g style="animation:${name} ${dur}s linear infinite">${uses}</g></g></g>`);
  };

  // The bands cross toward the left and open up to the right, so both stay readable.
  const mid = H / 2, ang = mobile ? 3 : 2;
  band(two, { y: mid + bh * 0.52, ang, bg: T.panel, fg: T.accent, outline: true, dur: 34, rev: true, border: true });
  band(one, { y: mid - bh * 0.52, ang: -ang, bg: T.cta, fg: T.onCta, dur: variant === 'b' ? 22 : 30 });
  await save(d, `zg-band-${variant}${mobile ? '-mobile' : ''}.svg`);
}

/* ---------- WORLD MAP ---------- */
const PH = [122, 13];
const MARKETS = [
  { id: 'US', name: 'United States', ll: [-100, 39], dx: -9, dy: -8, anchor: 'end' },
  { id: 'CA', name: 'Canada', ll: [-106, 57], dx: -9, dy: -8, anchor: 'end' },
  { id: 'UK', name: 'London, UK', ll: [-0.13, 51.5], dx: -9, dy: -8, anchor: 'end' },
  { id: 'DE', name: 'Germany', ll: [10.5, 51], dx: 8, dy: -9 },
  { id: 'RU', name: 'Russia', ll: [96, 62], dx: 9, dy: -8 },
  { id: 'UAE', name: 'UAE', ll: [54.4, 24.4], dx: -9, dy: 4, anchor: 'end' },
  { id: 'SG', name: 'Singapore', ll: [103.8, 1.35], dx: -9, dy: 16, anchor: 'end' },
  { id: 'AU', name: 'Australia', ll: [145, -30], dx: 9, dy: 13 },
  { id: 'NZ', name: 'New Zealand', ll: [174, -41], dx: 9, dy: 13 },
];

function dottedMap({ w, ox, oy, step }) {
  const proj = geoNaturalEarth1().rotate([-PH[0], 0]).fitWidth(w, { type: 'Sphere' });
  const [tx, ty] = proj.translate();
  proj.translate([tx + ox, ty + oy]);
  let dots = '', row = 0;
  for (let y = oy; y < oy + w * 0.46; y += step, row++) {
    for (let x = ox + (row % 2 ? step / 2 : 0); x < ox + w; x += step) {
      const ll = proj.invert([x, y]);
      if (!ll || Math.abs(ll[1]) > 80 || ll[1] < -56) continue;
      const back = proj(ll);
      if (!back || Math.hypot(back[0] - x, back[1] - y) > 1) continue;
      if (geoContains(land, ll)) dots += `M${n(x)} ${n(y)}h0`;
    }
  }
  return { dots, proj };
}

export async function reach(mobile, save) {
  const W = mobile ? 420 : 880, H = mobile ? 506 : 556;
  const d = new Doc(W, H, 'Map connecting the Philippines to clients in the United States, Canada, London (United Kingdom), Germany, Russia, the United Arab Emirates, Singapore, Australia and New Zealand. 9 client countries, 40+ client projects, 30+ tools.');
  d.panel({ fill: T.bg, decor: false });
  const map = mobile ? { w: 540, ox: -62, oy: 118, step: 7 } : { w: 880, ox: 0, oy: 66, step: 8 };
  const { dots, proj } = dottedMap(map);
  const [px, py] = proj(PH);
  d.def(`<radialGradient id="zg-glow"><stop offset="0" stop-color="${SUN.mid}" stop-opacity=".3"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></radialGradient>`);
  d.add(`<circle cx="${n(px)}" cy="${n(py)}" r="${mobile ? 200 : 300}" fill="url(#zg-glow)"/>`);
  d.add(`<path d="${dots}" fill="none" stroke="${T.accent}" stroke-opacity=".46" stroke-width="${mobile ? 2.4 : 2.7}" stroke-linecap="round"/>`);

  heading(d, 'Remote, worldwide', { x: mobile ? 18 : 28, ghost: mobile ? undefined : 'WORLD' });
  wrap('Agencies, startups and small businesses in the US, CA, UK, DE, RU, UAE, SG, AU and NZ.', 'b4', 15, W - (mobile ? 36 : 56)).forEach((l, i) => d.text(l, mobile ? 18 : 28, 76 + i * 20, { f: 'b4', size: 15, fill: T.muted }));

  d.once('zg-arc', '@keyframes zg-arc{from{stroke-dashoffset:112}to{stroke-dashoffset:0}}');
  const dur = 6;
  MARKETS.forEach((m, i) => {
    const [x, y] = proj(m.ll);
    const mx = (px + x) / 2, my = (py + y) / 2, dist = Math.hypot(x - px, y - py);
    const lift = Math.min(dist * 0.34, mobile ? 80 : 130);
    const ang = Math.atan2(y - py, x - px) - Math.PI / 2;
    const flip = Math.sin(ang) > 0 ? -1 : 1;
    const dp = `M${n(px)} ${n(py)}Q${n(mx + Math.cos(ang) * lift * flip)} ${n(my + Math.sin(ang) * lift * flip)} ${n(x)} ${n(y)}`;
    const delay = n(i * dur / MARKETS.length);
    d.add(`<path d="${dp}" fill="none" stroke="${T.accent}" stroke-opacity=".32" stroke-width="1.2"/>`);
    d.add(`<path d="${dp}" pathLength="100" fill="none" stroke="${SUN.hi}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="12 100" stroke-dashoffset="112" style="animation:zg-arc ${dur}s cubic-bezier(.5,0,.5,1) ${delay}s infinite"/>`);
    d.add(`<circle cx="${n(x)}" cy="${n(y)}" r="4" fill="${T.accent}"/>`);
    d.add(ping(d, x, y, { r: 4, dur, delay: n(delay + 2.9) }));
    d.text(mobile ? m.id : m.name, x + m.dx, y + m.dy, { f: 'm5', size: 12.5, fill: T.text, anchor: m.anchor });
  });
  d.add(`<circle cx="${n(px)}" cy="${n(py)}" r="6" fill="${T.text}"/>`);
  d.add(ping(d, px, py, { r: 6, color: T.text, dur: 2.8 }));
  d.text('Philippines · GMT+8', px + 13, py + 4.5, { f: 'm5', size: 12.5, fill: T.text });

  // Headline figures.
  const stats = [['9', 'client countries'], ['40+', 'client projects'], ['30+', 'tools in the kit']];
  const pad = mobile ? 18 : 28, gap = mobile ? 8 : 14, tw = (W - pad * 2 - gap * 2) / 3, th = mobile ? 92 : 88, ty = H - th - pad + 6;
  stats.forEach(([v, l], i) => {
    const x = pad + i * (tw + gap);
    d.add(`<rect x="${n(x)}" y="${ty}" width="${n(tw)}" height="${th}" rx="12" fill="${T.panel2}" fill-opacity=".92" stroke="${acc(0.3)}"/>`);
    d.text(v, x + 16, ty + (mobile ? 44 : 46), { f: 'd7', size: mobile ? 34 : 40, fill: T.accent });
    const lines = mobile ? wrap(l, 'b4', 12.5, tw - 28) : [l];
    lines.forEach((t, k) => d.text(t, x + 16, ty + (mobile ? 62 : 72) + k * 15, { f: 'b4', size: mobile ? 12.5 : 14, fill: T.muted }));
  });
  d.close();
  await save(d, mobile ? 'zg-reach-mobile.svg' : 'zg-reach.svg');
}

/* ---------- ISOMETRIC ANATOMY ---------- */
const LAYERS = [
  ['Design', 'Figma, Elementor', [si.siFigma, si.siElementor]],
  ['Front end', 'Next.js, React, Liquid, Tailwind', [si.siNextdotjs, si.siReact, si.siTailwindcss, si.siTypescript]],
  ['CMS & back end', 'WordPress, Shopify, Node, REST and GraphQL APIs', [si.siWordpress, si.siShopify, si.siNodedotjs, si.siGraphql]],
  ['AI & automation', 'n8n, AI agents, MCP servers', [si.siN8n, si.siModelcontextprotocol, si.siClaude]],
  ['Tracking & SEO', 'GA4, GTM, Meta Pixel, schema, llms.txt', [si.siGoogleanalytics, si.siGoogletagmanager, si.siMeta, si.siGooglesearchconsole]],
];

export async function anatomy(mobile, save) {
  const W = mobile ? 420 : 880;
  const cx = mobile ? 114 : 256, S = mobile ? 62 : 94, dy = mobile ? 96 : 84, top = mobile ? 118 : 138;
  const ax = 0.8, ay = 0.33, a = 2 * ax * S, b = 2 * ay * S, t = mobile ? 9 : 13;
  const H = Math.ceil(top + dy * 4 + b + t + (mobile ? 26 : 34));
  const d = new Doc(W, H, 'Anatomy of a build, as five stacked layers. ' + LAYERS.map((l) => `${l[0]}: ${l[1]}`).join('. '));
  d.panel();
  heading(d, 'Anatomy of a build', { x: mobile ? 18 : 28, ghost: 'LAYERS' });

  d.def(`<linearGradient id="zg-pt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A1626"/><stop offset="1" stop-color="#170C1A"/></linearGradient><linearGradient id="zg-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${T.accent}" stop-opacity=".6"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></linearGradient>`);
  const T_ = 7.5;
  d.style(`@keyframes zg-pf{0%,14%,100%{opacity:0}4%{opacity:1}}@keyframes zg-dn{from{stroke-dashoffset:125}to{stroke-dashoffset:0}}`);

  // Data beam running through every layer.
  const y0 = top - b - 8, y1 = top + dy * 4 + b + 10;
  d.add(`<path d="M${cx} ${y0}V${y1}" stroke="url(#zg-beam)" stroke-width="2"/>`);
  d.add(`<path d="M${cx} ${y0}V${y1}" pathLength="100" stroke="${SUN.hi}" stroke-width="3" stroke-linecap="round" stroke-dasharray="20 105" style="animation:zg-dn ${T_}s linear infinite"/>`);

  // Bottom layer first, so upper plates sit in front.
  [...LAYERS.keys()].reverse().forEach((i) => {
    const [name, tools, logos] = LAYERS[i];
    const cy = top + i * dy;
    d.style(`@keyframes zg-b${i}{0%,100%{transform:translateY(0)}50%{transform:translateY(${(i - 2) * 5}px)}}`);
    d.add(`<g style="animation:zg-b${i} 6s ease-in-out infinite">`);
    d.add(`<path d="M${n(cx - a)} ${cy}L${cx} ${n(cy + b)}V${n(cy + b + t)}L${n(cx - a)} ${cy + t}Z" fill="#140912" stroke="${acc(0.4)}"/>`);
    d.add(`<path d="M${n(cx + a)} ${cy}L${cx} ${n(cy + b)}V${n(cy + b + t)}L${n(cx + a)} ${cy + t}Z" fill="#070C18" stroke="${acc(0.4)}"/>`);
    const top_ = `M${cx} ${n(cy - b)}L${n(cx + a)} ${cy}L${cx} ${n(cy + b)}L${n(cx - a)} ${cy}Z`;
    d.add(`<path d="${top_}" fill="url(#zg-pt)" stroke="${acc(0.65)}"/>`);
    // Plate grid.
    let mesh = '';
    for (const k of [0.25, 0.5, 0.75]) {
      const A = [cx - a + k * a, cy - k * b], B = [cx + k * a, cy + b - k * b];
      const C = [cx - a + k * a, cy + k * b], D = [cx + k * a, cy - b + k * b];
      mesh += `M${n(A[0])} ${n(A[1])}L${n(B[0])} ${n(B[1])}M${n(C[0])} ${n(C[1])}L${n(D[0])} ${n(D[1])}`;
    }
    d.add(`<path d="${mesh}" stroke="${acc(0.12)}"/>`);
    d.add(`<path d="${top_}" fill="none" stroke="${SUN.hi}" stroke-width="2" style="opacity:0;animation:zg-pf ${T_}s linear ${n((i / 5) * T_ + 0.4)}s infinite"/>`);

    // Logos laid flat on the plate.
    const k = (mobile ? 25 : 40) / 24, spread = mobile ? 37 : 60;
    logos.forEach((ic, j) => {
      const lx = cx + (j - (logos.length - 1) / 2) * spread, ly = cy + (mobile ? 8 : 12);
      const m = [ax * k, ay * k, -ax * k, ay * k];
      d.add(`<path transform="matrix(${n(m[0])} ${n(m[1])} ${n(m[2])} ${n(m[3])} ${n(lx - (m[0] + m[2]) * 12)} ${n(ly - (m[1] + m[3]) * 12)})" d="${ic.path}" fill="${brand(ic)}"/>`);
    });

    // Leader line and label travel with the plate.
    const lx = mobile ? 234 : 470;
    d.add(`<path d="M${n(cx + a)} ${cy}H${lx - 10}" stroke="${acc(0.45)}"/><circle cx="${n(cx + a)}" cy="${cy}" r="3" fill="${T.accent}"/><circle cx="${lx - 10}" cy="${cy}" r="2" fill="${T.accent}"/>`);
    d.text(name, lx, cy + (mobile ? 2 : 1), { f: 'd5', size: mobile ? 16 : 20, fill: T.text });
    wrap(tools, 'b4', mobile ? 13 : 15, W - lx - (mobile ? 14 : 28)).forEach((l, q) => d.text(l, lx, cy + (mobile ? 21 : 24) + q * (mobile ? 17 : 20), { f: 'b4', size: mobile ? 13 : 15, fill: T.muted }));
    d.add('</g>');
  });
  d.close();
  await save(d, mobile ? 'zg-anatomy-mobile.svg' : 'zg-anatomy.svg');
}

/* ---------- FLOW DIAGRAMS ---------- */
const GL = {
  bolt: (x, y) => `<path d="M${x + 2} ${y - 13}L${x - 8} ${y + 2}H${x}L${x - 2} ${y + 13}L${x + 8} ${y - 2}H${x}Z" fill="${T.accent}"/>`,
  branch: (x, y) => `<g fill="none" stroke="${T.accent}" stroke-width="2.2" stroke-linecap="round"><path d="M${x - 11} ${y}H${x - 3}C${x + 3} ${y} ${x + 1} ${y - 10} ${x + 9} ${y - 10}M${x - 3} ${y}H${x + 9}M${x - 3} ${y}C${x + 3} ${y} ${x + 1} ${y + 10} ${x + 9} ${y + 10}"/></g>`,
  check: (x, y) => `<g fill="none" stroke="${T.accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="${x}" cy="${y - 7}" r="6"/><path d="M${x - 11} ${y + 12}a11 9 0 0 1 16 -7"/><path d="M${x + 3} ${y + 7}l4 4l7 -8"/></g>`,
  cursor: (x, y) => `<path d="M${x - 8} ${y - 12}L${x + 9} ${y + 3}L${x + 1} ${y + 4}L${x + 5} ${y + 12}L${x + 1} ${y + 14}L${x - 3} ${y + 6}L${x - 8} ${y + 11}Z" fill="${T.accent}"/>`,
  page: (x, y) => `<g fill="none" stroke="${T.accent}" stroke-width="2" stroke-linejoin="round"><rect x="${x - 14}" y="${y - 11}" width="28" height="22" rx="3"/><path d="M${x - 14} ${y - 5}h28"/></g><rect x="${x - 9}" y="${y}" width="10" height="6" rx="1" fill="${T.accent}"/>`,
  cal: (x, y) => `<g fill="none" stroke="${T.accent}" stroke-width="2" stroke-linecap="round"><rect x="${x - 13}" y="${y - 10}" width="26" height="23" rx="3"/><path d="M${x - 13} ${y - 3}h26M${x - 6} ${y - 14}v6M${x + 6} ${y - 14}v6"/></g><rect x="${x + 1}" y="${y + 2}" width="8" height="7" rx="1.5" fill="${T.accent}"/>`,
  bell: (x, y) => `<g fill="none" stroke="${T.accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M${x - 11} ${y + 7}c3 -3 3 -6 3 -10a8 8 0 0 1 16 0c0 4 0 7 3 10z"/><path d="M${x - 3} ${y + 11}a3 3 0 0 0 6 0"/></g>`,
  mail: (x, y) => `<g fill="none" stroke="${T.accent}" stroke-width="2.2" stroke-linejoin="round"><rect x="${x - 14}" y="${y - 10}" width="28" height="20" rx="3"/><path d="M${x - 14} ${y - 8}l14 11l14 -11"/></g>`,
};

function flow(d, { nodes, wires, vertical, labelH = 36 }) {
  const size = vertical ? 58 : 64, h = size / 2, T_ = 7;
  const by = Object.fromEntries(nodes.map((x) => [x.id, x]));
  d.style('@keyframes zg-wr{0%{stroke-dashoffset:30}26%,100%{stroke-dashoffset:-100}}@keyframes zg-fl{0%,12%,100%{opacity:0}3%{opacity:1}}');
  wires.forEach(([a, b, order, dashed]) => {
    const A = by[a], B = by[b];
    let dp;
    if (dashed) dp = `M${A.x} ${A.y + h + labelH}V${B.y - h}`;
    else if (vertical) {
      const y1 = A.y + h + labelH, y2 = B.y - h, m = (y2 - y1) / 2;
      dp = `M${A.x} ${y1}C${A.x} ${n(y1 + m)} ${B.x} ${n(y2 - m)} ${B.x} ${y2}`;
    } else {
      const x1 = A.x + h, x2 = B.x - h, m = (x2 - x1) / 2;
      dp = `M${x1} ${A.y}C${n(x1 + m)} ${A.y} ${n(x2 - m)} ${B.y} ${x2} ${B.y}`;
    }
    d.add(`<path d="${dp}" fill="none" stroke="${acc(dashed ? 0.4 : 0.42)}" stroke-width="1.75"${dashed ? ' stroke-dasharray="4 5"' : ''}/>`);
    if (!dashed) d.add(`<path d="${dp}" pathLength="100" fill="none" stroke="${SUN.hi}" stroke-width="3" stroke-linecap="round" stroke-dasharray="30 200" stroke-dashoffset="30" style="animation:zg-wr ${T_}s linear ${n(order * 1.05)}s infinite"/>`);
  });
  nodes.forEach((N) => {
    const arrival = N.order === 0 ? 0 : N.order * 1.05;
    d.add(`<rect x="${N.x - h}" y="${N.y - h}" width="${size}" height="${size}" rx="14" fill="${T.panel2}" stroke="${acc(0.4)}"/>`);
    d.add(`<rect x="${N.x - h}" y="${N.y - h}" width="${size}" height="${size}" rx="14" fill="${T.accent}" fill-opacity=".12" stroke="${SUN.hi}" stroke-width="2" style="opacity:0;animation:zg-fl ${T_}s linear ${n(arrival)}s infinite"/>`);
    if (typeof N.icon === 'function') d.add(N.icon(N.x, N.y));
    else d.add(logo(N.icon, N.x, N.y, vertical ? 28 : 30, brand(N.icon)));
    d.text(N.label, N.x, N.y + h + 18, { f: 'd5', size: 13.5, fill: T.text, anchor: 'middle' });
    if (N.sub) d.text(N.sub, N.x, N.y + h + 34, { f: 'b4', size: 12, fill: T.muted, anchor: 'middle' });
  });
}

const AI_NODES = [
  ['lead', 'New lead', 'Form or webhook', GL.bolt, 0],
  ['agent', 'AI agent', 'Classify and draft', si.siClaude, 1],
  ['tools', 'MCP tools', 'Context and actions', si.siModelcontextprotocol, 1],
  ['route', 'Route', 'By intent', GL.branch, 2],
  ['crm', 'CRM', 'Lead routed', null, 3],
  ['draft', 'Drafted reply', 'Written by AI', GL.mail, 3],
  ['alert', 'Team alert', 'Right person', GL.bell, 3],
  ['human', 'Human check', 'Approve and send', GL.check, 4],
];

export async function flowAI(mobile, save) {
  const W = mobile ? 420 : 880;
  const pos = mobile
    ? { lead: [120, 138], agent: [120, 256], tools: [312, 256], route: [120, 374], crm: [66, 492], draft: [210, 492], alert: [354, 492], human: [210, 610] }
    : { lead: [84, 212], agent: [236, 212], tools: [236, 358], route: [388, 212], crm: [560, 118], draft: [560, 232], alert: [560, 346], human: [770, 232] };
  const H = mobile ? 696 : 442;
  const d = new Doc(W, H, 'Example AI workflow in n8n: a new lead reaches an AI agent with MCP tools, gets routed by intent to the CRM, a drafted reply and a team alert, then a human approves before sending.');
  d.panel();
  heading(d, 'AI workflows', { x: mobile ? 18 : 28, ghost: 'AGENTS' });
  wrap('Example flow: n8n workflows, AI agents, MCP servers, lead routing and AI-drafted replies.', 'b4', 15, W - (mobile ? 36 : 56)).forEach((l, i) => d.text(l, mobile ? 18 : 28, 76 + i * 20, { f: 'b4', size: 15, fill: T.muted }));
  const crmIcon = (x, y) => `<g fill="none" stroke="${T.accent}" stroke-width="2"><ellipse cx="${x}" cy="${y - 9}" rx="12" ry="4.5"/><path d="M${x - 12} ${y - 9}v18c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5v-18M${x - 12} ${y}c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5"/></g>`;
  const nodes = AI_NODES.map(([id, label, sub, icon, order]) => ({ id, label, sub, order, icon: id === 'crm' ? crmIcon : icon, x: pos[id][0], y: pos[id][1] }));
  const wires = mobile
    ? [['lead', 'agent', 0], ['agent', 'route', 1], ['route', 'crm', 2], ['route', 'draft', 2], ['route', 'alert', 2], ['draft', 'human', 3]]
    : [['lead', 'agent', 0], ['agent', 'route', 1], ['route', 'crm', 2], ['route', 'draft', 2], ['route', 'alert', 2], ['draft', 'human', 3]];
  if (mobile) d.add(`<path d="M${pos.agent[0] + 29} ${pos.agent[1]}H${pos.tools[0] - 29}" stroke="${acc(0.45)}" stroke-width="1.75" stroke-dasharray="4 5"/>`);
  else d.add(`<path d="M${pos.agent[0]} ${pos.agent[1] + 70}V${pos.tools[1] - 32}" stroke="${acc(0.45)}" stroke-width="1.75" stroke-dasharray="4 5"/>`);
  flow(d, { nodes, wires, vertical: mobile });
  d.close();
  await save(d, mobile ? 'zg-flow-ai-mobile.svg' : 'zg-flow-ai.svg');
}

export async function flowTracking(mobile, save) {
  const W = mobile ? 420 : 880;
  const pos = mobile
    ? { click: [210, 138], page: [210, 244], book: [210, 350], gtm: [210, 456], ga: [66, 574], meta: [210, 574], ads: [354, 574] }
    : { click: [84, 208], page: [230, 208], book: [376, 208], gtm: [540, 208], ga: [744, 112], meta: [744, 226], ads: [744, 340] };
  const H = mobile ? 648 : 432;
  const d = new Doc(W, H, 'Conversion tracking path: an ad click reaches a landing page, then a booking or form, then Google Tag Manager, which sends events to GA4, Meta Pixel and Google Ads.');
  d.panel();
  heading(d, 'Tracking that fires', { x: mobile ? 18 : 28, ghost: 'SIGNAL' });
  wrap('GA4, Google Tag Manager, Meta Pixel, booking and form conversion tracking.', 'b4', 15, W - (mobile ? 36 : 56)).forEach((l, i) => d.text(l, mobile ? 18 : 28, 76 + i * 20, { f: 'b4', size: 15, fill: T.muted }));
  const nodes = [
    { id: 'click', label: 'Ad click', icon: GL.cursor, order: 0 },
    { id: 'page', label: 'Landing page', icon: GL.page, order: 1 },
    { id: 'book', label: 'Booking or form', icon: GL.cal, order: 2 },
    { id: 'gtm', label: 'Tag Manager', icon: si.siGoogletagmanager, order: 3 },
    { id: 'ga', label: 'GA4', icon: si.siGoogleanalytics, order: 4 },
    { id: 'meta', label: 'Meta Pixel', icon: si.siMeta, order: 4 },
    { id: 'ads', label: 'Google Ads', icon: si.siGoogleads, order: 4 },
  ].map((x) => ({ ...x, x: pos[x.id][0], y: pos[x.id][1] }));
  const wires = [['click', 'page', 0], ['page', 'book', 1], ['book', 'gtm', 2], ['gtm', 'ga', 3], ['gtm', 'meta', 3], ['gtm', 'ads', 3]];
  flow(d, { nodes, wires, vertical: mobile, labelH: 24 });
  d.close();
  await save(d, mobile ? 'zg-flow-tracking-mobile.svg' : 'zg-flow-tracking.svg');
}

/* ---------- RECENT WORK SCENES (box 405 x 170) ---------- */
const frame = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#070C18" stroke="${acc(0.4)}"/><path d="M${x} ${y + 17}H${x + w}" stroke="${acc(0.2)}"/>`
  + [0, 1, 2].map((i) => `<circle cx="${x + 10 + i * 8}" cy="${y + 8.5}" r="2.2" fill="${acc(0.6)}"/>`).join('')
  + `<rect x="${x + 38}" y="${y + 4.5}" width="${Math.min(w - 50, 90)}" height="8" rx="4" fill="${acc(0.14)}"/>`;
const shirt = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M13 5L4 10L8 18L12 15.5V36H28V15.5L32 18L36 10L27 5C25 9 15 9 13 5Z" fill="${c}"/>`;

const SCENES = {
  shop(d) {
    const dur = 6, tiles = [32, 104, 176];
    let s = frame(18, 12, 236, 146);
    tiles.forEach((x, i) => {
      s += `<rect x="${x}" y="38" width="64" height="62" rx="6" fill="${T.panel2}" stroke="${T.line}"/>${shirt(x + 12, 46, 1, [T.accent, T.blush, T.muted][i])}<rect x="${x + 6}" y="106" width="40" height="4" rx="2" fill="${acc(0.5)}"/>`;
      const key = `s-fly${i}`, tx = 330 - (x + 32), ty = 96 - 66;
      d.style(`@keyframes ${key}{0%,6%{transform:none;opacity:0}9%{opacity:1}30%{transform:translate(${tx}px,${ty}px) scale(.55);opacity:1}34%,100%{transform:translate(${tx}px,${ty}px) scale(.55);opacity:0}}`);
      s += `<g class="zg-c" style="opacity:0;animation:${key} ${dur}s cubic-bezier(.5,0,.4,1) ${i * 2}s infinite">${shirt(x + 12, 46, 1, [T.accent, T.blush, T.muted][i])}</g>`;
    });
    s += `<rect x="32" y="120" width="208" height="26" rx="6" fill="${T.cta}"/>${d.t('Add bundle', 136, 137.5, { f: 'b5', size: 12.5, fill: T.onCta, anchor: 'middle' })}`;
    s += `<path d="M294 66h72l8 84h-88z" fill="${T.panel2}" stroke="${T.accent}" stroke-width="1.75" stroke-linejoin="round"/><path d="M312 66v-10a18 18 0 0 1 36 0v10" fill="none" stroke="${T.accent}" stroke-width="1.75"/>`;
    d.style(`@keyframes s-dg{0%,33.3%{opacity:1}33.4%,100%{opacity:0}}`);
    s += `<circle cx="370" cy="62" r="13" fill="${T.cta}"/>`;
    [['1', 0.4, 0], ['2', -3.6, 0], ['3', -1.6, 1]].forEach(([t, delay, base]) => { s += d.t(t, 370, 66.5, { f: 'd7', size: 13, fill: T.onCta, anchor: 'middle', style: `opacity:${base};animation:s-dg ${dur}s linear ${delay}s infinite` }); });
    return s;
  },
  viewer(d) {
    d.def(`<linearGradient id="zg-cue" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stop-color="${SUN.low}"/><stop offset=".32" stop-color="${SUN.deep}"/><stop offset=".33" stop-color="${SUN.hi}"/><stop offset="1" stop-color="${T.text}"/></linearGradient>`);
    d.once('zg-rot', ROT);
    d.style(`@keyframes s-flip{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.12)}}@keyframes s-tick{to{transform:translateX(-20px)}}@keyframes s-gl{from{stroke-dashoffset:125}to{stroke-dashoffset:0}}`);
    const ang = -18.9;
    let s = '';
    // Orbit behind.
    s += `<g transform="rotate(${ang} 205 84)"><ellipse cx="205" cy="84" rx="158" ry="46" fill="none" stroke="${acc(0.45)}" stroke-dasharray="3 6"/></g>`;
    s += `<path d="M62.4 131.3L65.6 140.7L345.6 41.6L344.4 38.4Z" fill="url(#zg-cue)"/>`;
    s += `<path d="M64 136L345 40" pathLength="100" stroke="#fff" stroke-opacity=".8" stroke-width="1.5" stroke-dasharray="25 100" style="animation:s-gl 3s linear infinite"/>`;
    [[92, 126], [116, 118], [140, 110]].forEach(([x, y], i) => {
      s += `<g transform="rotate(${ang} ${x} ${y})"><rect class="zg-c" x="${x - 5}" y="${y - 3.4}" width="10" height="6.8" fill="${SUN.hi}" style="animation:s-flip 2.2s ease-in-out ${n(-i * 0.7)}s infinite"/></g>`;
    });
    // Drag handle travelling the orbit, with a cursor.
    s += `<g transform="rotate(${ang} 205 84)"><g class="zg-motion"><circle r="7" fill="${T.accent}" stroke="${T.bg}" stroke-width="2"/><path d="M4 4L15 13L9.5 13.6L12.5 19.5L9.8 20.8L7 15L3.5 18.5Z" fill="${T.text}"/><animateMotion dur="6s" repeatCount="indefinite" path="M47 84a158 46 0 1 0 316 0a158 46 0 1 0 -316 0"/></g></g>`;
    s += `<rect x="16" y="14" width="56" height="26" rx="7" fill="${T.panel2}" stroke="${acc(0.5)}"/>${d.t('360°', 44, 32, { f: 'm5', size: 13, fill: T.accent, anchor: 'middle' })}`;
    let ticks = '';
    for (let x = 0; x < 460; x += 20) ticks += `M${x} 160v${x % 100 === 0 ? -9 : -5}`;
    s += `<g style="animation:s-tick 1.6s linear infinite"><path d="${ticks}" stroke="${acc(0.45)}"/></g>`;
    return s;
  },
  health(d) {
    d.style(`@keyframes s-ekg{from{stroke-dashoffset:135}to{stroke-dashoffset:0}}@keyframes s-ln{0%,4%{opacity:.15}12%,84%{opacity:1}100%{opacity:.15}}`);
    let s = frame(18, 12, 214, 146);
    s += `<rect x="32" y="40" width="34" height="34" rx="9" fill="${T.cta}"/><path d="M45 47h8v6h6v8h-6v6h-8v-6h-6v-8h6z" fill="${T.onCta}"/>`;
    s += `<rect x="76" y="42" width="130" height="10" rx="3" fill="${T.text}"/><rect x="76" y="59" width="96" height="6" rx="3" fill="${acc(0.5)}"/><rect x="76" y="70" width="60" height="6" rx="3" fill="${acc(0.3)}"/>`;
    const p = 'M26 124H78L86 124L93 100L103 148L110 112L116 124H224';
    s += `<path d="${p}" fill="none" stroke="${acc(0.28)}" stroke-width="1.5"/><path d="${p}" pathLength="100" fill="none" stroke="${SUN.hi}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="35 100" style="animation:s-ekg 2.8s linear infinite"/>`;
    s += `<rect x="246" y="22" width="144" height="126" rx="8" fill="${T.panel2}" stroke="${acc(0.4)}"/>`;
    [['{', 0, T.muted], ['"@type":', 1, T.accent], ['"LocalBusiness",', 2, T.text], ['"areaServed":', 1, T.accent], ['"openingHours":', 1, T.accent], ['}', 0, T.muted]].forEach(([t, ind, c], i) => {
      s += d.t(t, 258 + ind * 10, 44 + i * 16, { f: 'm4', size: 11, fill: c, style: `animation:s-ln 7s linear ${n(i * 0.35)}s infinite` });
    });
    s += `<circle cx="372" cy="130" r="9" fill="${T.accent}"/><path d="M367.5 130l3.2 3.2l6 -6.4" fill="none" stroke="${T.bg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    return s;
  },
  law(d) {
    d.style(`@keyframes s-lk{from{stroke-dashoffset:125}to{stroke-dashoffset:0}}@keyframes s-sc{0%,18%{transform:none}45%,62%{transform:translateY(-62px)}90%,100%{transform:none}}`);
    const card = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${T.panel2}" stroke="${acc(0.4)}"/><circle cx="${x + w / 2}" cy="${y + h * 0.3}" r="${r}" fill="${T.accent}"/><path d="M${x + w / 2 - r * 1.7} ${y + h * 0.62}a${r * 1.7} ${r * 1.3} 0 0 1 ${r * 3.4} 0z" fill="${T.accent}"/><rect x="${x + w * 0.18}" y="${y + h * 0.72}" width="${w * 0.64}" height="${Math.max(4, h * 0.05)}" rx="2" fill="${T.text}"/><rect x="${x + w * 0.28}" y="${y + h * 0.84}" width="${w * 0.44}" height="${Math.max(3, h * 0.035)}" rx="2" fill="${acc(0.5)}"/>`;
    let s = '';
    [18, 106, 194].forEach((x) => { s += card(x, 44, 76, 112, 12); });
    [['M56 44C56 10 144 10 144 44', 0], ['M144 44C144 10 232 10 232 44', 1.1], ['M56 44C56 -8 232 -8 232 44', 2.2]].forEach(([p, delay]) => {
      s += `<path d="${p}" fill="none" stroke="${acc(0.4)}" stroke-dasharray="3 4"/><path d="${p}" pathLength="100" fill="none" stroke="${SUN.hi}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="25 100" style="animation:s-lk 3.3s linear ${delay}s infinite"/>`;
    });
    d.def(`<clipPath id="zg-ph"><rect x="304" y="22" width="74" height="126" rx="4"/></clipPath>`);
    s += `<rect x="298" y="8" width="86" height="154" rx="14" fill="#070C18" stroke="${T.accent}" stroke-width="1.5"/><rect x="329" y="13" width="24" height="4" rx="2" fill="${acc(0.5)}"/>`;
    s += `<g clip-path="url(#zg-ph)"><g style="animation:s-sc 6s ease-in-out infinite">${[26, 88, 150].map((y) => card(310, y, 62, 56, 7)).join('')}</g></g>`;
    return s;
  },
  crawl(d) {
    d.once('zg-tw', '@keyframes zg-tw{0%,100%{opacity:.15}50%{opacity:.9}}');
    d.style(`@keyframes s-bm{0%,100%{transform:none}50%{transform:translateY(74px)}}@keyframes s-eye{0%,88%,100%{transform:scaleY(1)}94%{transform:scaleY(.1)}}@keyframes s-chip{0%,8%{opacity:.2}16%,86%{opacity:1}100%{opacity:.2}}`);
    d.def(`<linearGradient id="zg-cone" x1="0" x2="1"><stop offset="0" stop-color="${T.blush}" stop-opacity=".42"/><stop offset="1" stop-color="${T.accent}" stop-opacity=".04"/></linearGradient><clipPath id="zg-dc"><rect x="178" y="16" width="112" height="138" rx="7"/></clipPath>`);
    let s = `<path d="M120 82L178 28V146Z" fill="url(#zg-cone)" style="animation:zg-tw 3.2s ease-in-out infinite"/>`;
    s += `<path d="M74 34V20" stroke="${T.accent}" stroke-width="2"/><circle cx="74" cy="16" r="4" fill="${T.accent}"/>${ping(d, 74, 16, { r: 4, dur: 2.4, grow: 3 })}`;
    s += `<rect x="30" y="34" width="90" height="74" rx="20" fill="${T.panel2}" stroke="${T.accent}" stroke-width="1.75"/><rect x="42" y="52" width="66" height="30" rx="12" fill="#070C18"/>`;
    [60, 90].forEach((x) => { s += `<circle class="zg-c" cx="${x}" cy="67" r="6.5" fill="${T.ice}" style="animation:s-eye 4s linear infinite"/>`; });
    s += `<rect x="62" y="92" width="26" height="4" rx="2" fill="${acc(0.6)}"/><rect x="50" y="112" width="50" height="26" rx="8" fill="${T.panel2}" stroke="${acc(0.5)}"/>`;
    s += `<rect x="178" y="16" width="112" height="138" rx="7" fill="${T.panel2}" stroke="${acc(0.6)}"/>${d.t('llms.txt', 234, 37, { f: 'm5', size: 12, fill: T.accent, anchor: 'middle' })}`;
    [78, 58, 72, 46, 66, 38].forEach((w, i) => { s += `<rect x="190" y="${50 + i * 15}" width="${w}" height="5" rx="2.5" fill="${acc(0.45)}"/>`; });
    s += `<g clip-path="url(#zg-dc)"><g style="animation:s-bm 4.4s ease-in-out infinite"><rect x="178" y="46" width="112" height="16" fill="${T.accent}" fill-opacity=".22"/><path d="M178 62h112" stroke="${T.blush}" stroke-width="1.5"/></g></g>`;
    ['schema', 'sitemap', 'robots'].forEach((t, i) => {
      const y = 36 + i * 38;
      s += `<g style="animation:s-chip 6s linear ${n(i * 0.8)}s infinite"><rect x="306" y="${y}" width="84" height="28" rx="8" fill="#070C18" stroke="${acc(0.5)}"/>${d.t(t, 348, y + 18.5, { f: 'm5', size: 11.5, fill: T.text, anchor: 'middle' })}</g>`;
    });
    return s;
  },
  signal(d) {
    d.style(`@keyframes s-wr{0%{stroke-dashoffset:30}30%,100%{stroke-dashoffset:-100}}@keyframes s-gr{0%,10%{transform:scaleY(.15)}48%,86%{transform:scaleY(1)}100%{transform:scaleY(.15)}}`);
    const T_ = 5;
    let s = `<rect x="24" y="8" width="88" height="154" rx="14" fill="#070C18" stroke="${T.accent}" stroke-width="1.5"/><rect x="56" y="13" width="24" height="4" rx="2" fill="${acc(0.5)}"/>`;
    s += `<rect x="34" y="26" width="68" height="10" rx="3" fill="${acc(0.3)}"/>`;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const on = r === 1 && c === 2;
      s += `<rect x="${34 + c * 17.5}" y="${42 + r * 17}" width="15" height="14" rx="3" fill="${on ? T.accent : T.panel2}"/>`;
    }
    s += ping(d, 76.5, 66, { r: 8, dur: T_, grow: 3 });
    s += `<rect x="34" y="118" width="68" height="28" rx="7" fill="${T.cta}"/>${d.t('Book', 68, 137, { f: 'b5', size: 13, fill: T.onCta, anchor: 'middle' })}`;
    const wire = (p, delay) => `<path d="${p}" fill="none" stroke="${acc(0.4)}" stroke-width="1.5"/><path d="${p}" pathLength="100" fill="none" stroke="${SUN.hi}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="30 200" stroke-dashoffset="30" style="animation:s-wr ${T_}s linear ${delay}s infinite"/>`;
    s += wire('M112 66C150 66 140 44 176 44', 0.2) + wire('M112 104C150 104 140 126 176 126', 0.2);
    [[si.siMeta, 44], [si.siGoogleanalytics, 126]].forEach(([ic, y]) => {
      s += `<rect x="176" y="${y - 26}" width="52" height="52" rx="12" fill="${T.panel2}" stroke="${acc(0.5)}"/>${logo(ic, 202, y, 26, brand(ic))}`;
    });
    s += wire('M228 44C256 44 250 70 276 70', 1.7) + wire('M228 126C256 126 250 100 276 100', 1.7);
    s += `<rect x="276" y="18" width="112" height="134" rx="10" fill="${T.panel2}" stroke="${acc(0.5)}"/>`;
    [34, 52, 44, 72, 96].forEach((h, i) => { s += `<rect x="${288 + i * 18}" y="${140 - h}" width="13" height="${h}" rx="3" fill="${T.accent}" style="transform-box:fill-box;transform-origin:bottom;animation:s-gr ${T_}s ease-in-out ${n(i * 0.12)}s infinite"/>`; });
    return s;
  },
};

const WORK = [
  ['shop', 'Shopify store', 'Full Shopify store with custom Liquid sections, Printful and product bundles'],
  ['viewer', '360° product viewer', 'Shopify landing page with an interactive 360° product viewer, parallax and scroll animations'],
  ['health', 'Healthcare build', 'Healthcare WordPress/Elementor build with schema and technical SEO'],
  ['law', 'Law firm site', 'Law firm site: attorney profiles, mobile fixes and internal linking'],
  ['crawl', 'AI-crawler optimization', 'llms.txt and AI-crawler optimization for a professional services firm'],
  ['signal', 'Conversion tracking', 'Booking and Meta Pixel conversion tracking for a salon'],
];

export async function work(mobile, save) {
  const W = mobile ? 420 : 880, pad = mobile ? 18 : 28, gap = mobile ? 12 : 14, top = 70;
  const cols = mobile ? 1 : 2;
  const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
  const k = cw / 405, sh = 170 * k, ch = Math.ceil(sh + (mobile ? 92 : 88));
  const rows = Math.ceil(WORK.length / cols);
  const H = top + rows * ch + (rows - 1) * gap + pad;
  const d = new Doc(W, H, 'Recent work: ' + WORK.map((w) => w[2]).join('. ') + '. Opens the full case studies on zana-g.com.');
  d.panel();
  heading(d, 'Recent work', { hint: 'case studies', x: pad, ghost: 'WORK' });
  d.def(`<linearGradient id="zg-sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2C0F1E"/><stop offset="1" stop-color="#07090F"/></linearGradient>`);
  WORK.forEach(([s, title, body], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = pad + col * (cw + gap), y = top + row * (ch + gap);
    const clip = d.uid('zg-cc');
    d.def(`<clipPath id="${clip}"><path d="M${n(x)} ${n(y + sh)}V${y + 12}a12 12 0 0 1 12 -12H${n(x + cw - 12)}a12 12 0 0 1 12 12V${n(y + sh)}Z"/></clipPath>`);
    d.add(`<rect x="${n(x)}" y="${y}" width="${n(cw)}" height="${ch}" rx="12" fill="${T.panel2}" stroke="${T.line}"/>`);
    d.add(`<g clip-path="url(#${clip})"><rect x="${n(x)}" y="${y}" width="${n(cw)}" height="${n(sh)}" fill="url(#zg-sc)"/><g transform="translate(${n(x)} ${y}) scale(${n(k)})">${SCENES[s](d)}</g></g>`);
    d.add(`<path d="M${n(x)} ${n(y + sh)}H${n(x + cw)}" stroke="${acc(0.25)}"/>`);
    d.text(title, x + 16, y + sh + 29, { f: 'd5', size: 18, fill: T.text });
    wrap(body, 'b4', 14, cw - 32).forEach((l, q) => d.text(l, x + 16, y + sh + 51 + q * 19, { f: 'b4', size: 14, fill: T.muted }));
  });
  d.close();
  await save(d, mobile ? 'zg-work-mobile.svg' : 'zg-work.svg');
}

/* ---------- COMMAND CHIPS for click-to-expand sections ---------- */
export async function cmdChip(file, cmd, save) {
  const size = 13.5, h = 40;
  const w = Math.ceil(cmd.length * monoW(size) + 58);
  const d = new Doc(w, h, cmd);
  d.add(`<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10" fill="${T.panel}" stroke="${acc(0.5)}"/>`);
  d.text(cmd, 14, 25, { f: 'm5', size, fill: T.accent });
  d.style('@keyframes zg-cv{0%,100%{transform:translateY(-2px)}50%{transform:translateY(2px)}}');
  d.add(`<path d="M${w - 25} ${h / 2 - 3}l5 5l5 -5" fill="none" stroke="${T.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:zg-cv 1.6s ease-in-out infinite"/>`);
  await save(d, file);
}

/* ---------- CLOSING SUNSET ---------- */
// City silhouette on the horizon, kept lower near the sun so the sun stays visible.
function skyline(d, W, horizon, sx, sr, textEnd, textBottom) {
  const rnd = seeded(31);
  let blocks = '', lit = '', live = '';
  for (let x = -6; x < W;) {
    const w = 22 + Math.floor(rnd() * 30);
    const away = Math.min(1, Math.abs(x + w / 2 - sx) / (sr * 1.7));
    // Buildings under the text stop short of it.
    const full = Math.round(16 + rnd() * 30 + away * (14 + rnd() * 56));
    const h = x < textEnd ? Math.min(full, horizon - textBottom - 10) : full;
    blocks += `M${x} ${horizon}V${horizon - h}H${x + w}V${horizon}Z`;
    for (let wy = horizon - h + 6; wy < horizon - 5; wy += 8) {
      for (let wx = x + 4; wx < x + w - 5; wx += 7) {
        const roll = rnd();
        if (roll > 0.97) live += `<rect x="${wx}" y="${wy}" width="3" height="3" fill="${T.ice}" style="animation:zg-tw ${n(2.5 + rnd() * 4)}s ease-in-out ${n(rnd() * 3)}s infinite"/>`;
        else if (roll > 0.68) lit += `M${wx} ${wy}h3v3h-3z`;
      }
    }
    x += w + (rnd() > 0.7 ? 3 : 0);
  }
  d.once('zg-tw', '@keyframes zg-tw{0%,100%{opacity:.15}50%{opacity:.9}}');
  d.add(`<path d="${blocks}" fill="#050813" stroke="${acc(0.28)}"/><path d="${lit}" fill="${T.blue}" fill-opacity=".62"/>${live}`);
}

function palm(x, base, h, lean, scale = 1) {
  const tx = x + lean, ty = base - h;
  const trunk = `M${x - 7 * scale} ${base}Q${n(x + lean * 0.2)} ${n(base - h * 0.55)} ${n(tx - 2.5 * scale)} ${ty}L${n(tx + 2.5 * scale)} ${ty}Q${n(x + lean * 0.2 + 9 * scale)} ${n(base - h * 0.55)} ${x + 7 * scale} ${base}Z`;
  const fronds = [[-1.05, 1], [-0.72, 1.05], [-0.38, 1], [-0.1, 0.8], [0.14, 0.78], [0.42, 1], [0.74, 1.05], [1.08, 0.95]];
  let f = '';
  fronds.forEach(([dir, len]) => {
    const L = h * 0.42 * len * 1.25;
    const ex = tx + Math.sin(dir * 1.6) * L, ey = ty - Math.cos(dir * 1.6) * L * 0.42 + L * 0.34;
    const cx = tx + Math.sin(dir * 1.6) * L * 0.55, cy = ty - L * 0.34 - Math.abs(Math.cos(dir * 1.6)) * L * 0.12;
    f += `M${n(tx)} ${n(ty)}Q${n(cx)} ${n(cy)} ${n(ex)} ${n(ey)}Q${n(cx)} ${n(cy + L * 0.17)} ${n(tx)} ${n(ty)}Z`;
  });
  return { trunk, f, base: [x, base] };
}

export async function contact(mobile, save) {
  const W = mobile ? 420 : 880, H = mobile ? 584 : 506;
  const horizon = mobile ? 396 : 340;
  const d = new Doc(W, H, 'Open to freelance, contract and agency roles. Building for the web, one solution at a time. Opens the contact section on zana-g.com.');
  d.panel({ fill: T.bg, decor: false });
  d.def(`<linearGradient id="zg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.bg}"/><stop offset=".6" stop-color="#1A0B2A"/><stop offset="1" stop-color="#6B1236"/></linearGradient>`);
  d.add(`<rect width="${W}" height="${horizon}" fill="url(#zg-sky)"/>`);
  stars(d, W, horizon - 90, mobile ? 40 : 70);

  // Sun with sliced lower half.
  const sx = mobile ? 210 : 640, sr = mobile ? 96 : 128, sy = horizon - sr * 0.62;
  d.def(`<linearGradient id="zg-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SUN.top}"/><stop offset=".55" stop-color="${SUN.mid}"/><stop offset="1" stop-color="${SUN.low}"/></linearGradient>`);
  let bands_ = `<rect x="${sx - sr}" y="${n(sy - sr)}" width="${sr * 2}" height="${n(sr * 1.04)}"/>`;
  let yy = sy + sr * 0.08, gapH = 3, barH = sr * 0.15;
  while (yy < sy + sr) {
    bands_ += `<rect x="${sx - sr}" y="${n(yy)}" width="${sr * 2}" height="${n(barH)}"/>`;
    yy += barH + gapH; gapH += 1.1; barH = Math.max(4, barH - sr * 0.012);
  }
  d.def(`<clipPath id="zg-sb">${bands_}</clipPath>`);
  d.def(`<radialGradient id="zg-sg"><stop offset="0" stop-color="${SUN.mid}" stop-opacity=".5"/><stop offset="1" stop-color="${SUN.mid}" stop-opacity="0"/></radialGradient>`);
  d.add(`<circle cx="${sx}" cy="${n(sy)}" r="${n(sr * 2.3)}" fill="url(#zg-sg)"/>`);
  d.style(`@keyframes zg-sb{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}`);
  d.add(`<g style="animation:zg-sb 9s ease-in-out infinite"><circle cx="${sx}" cy="${n(sy)}" r="${sr}" fill="url(#zg-sun)" clip-path="url(#zg-sb)"/></g>`);

  skyline(d, W, horizon, sx, sr, mobile ? 0 : 320, 264);

  // Palms, swaying gently.
  d.style('@keyframes zg-sw{0%,100%{transform:rotate(-1.3deg)}50%{transform:rotate(1.3deg)}}');
  const palms = mobile ? [palm(376, horizon + 8, 164, -22, 0.8)] : [palm(838, horizon + 10, 214, -34), palm(772, horizon + 10, 136, 22, 0.72)];
  palms.forEach((p, i) => {
    d.add(`<g style="transform-origin:${p.base[0]}px ${p.base[1]}px;animation:zg-sw ${7 + i * 1.5}s ease-in-out infinite"><path d="${p.trunk}" fill="#03050B"/><path d="${p.f}" fill="#03050B"/></g>`);
  });

  // Digital sea: receding grid, plus the sun's shimmering reflection.
  d.add(`<rect y="${horizon}" width="${W}" height="${H - horizon}" fill="#050812"/><path d="M0 ${horizon}H${W}" stroke="${SUN.mid}" stroke-opacity=".8"/>`);
  const seaH = H - horizon, vp = mobile ? 210 : sx;
  let radial = '';
  for (let i = -16; i <= 16; i++) radial += `M${vp + i * 6} ${horizon}L${vp + i * (mobile ? 58 : 96)} ${H}`;
  d.add(`<path d="${radial}" stroke="${acc(0.2)}"/>`);
  const rows = 9;
  for (let i = 0; i < rows; i++) {
    const a = horizon + seaH * (i / rows) ** 2.1, b = horizon + seaH * ((i + 1) / rows) ** 2.1;
    d.style(`@keyframes zg-g${i}{from{transform:translateY(0)}to{transform:translateY(${n(b - a)}px)}}`);
    d.add(`<path d="M0 ${n(a)}H${W}" stroke="${acc(n(0.12 + (i / rows) * 0.45))}" style="animation:zg-g${i} 2.6s linear infinite"/>`);
  }
  d.style('@keyframes zg-sh{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.62)}}');
  for (let i = 0; i < 7; i++) {
    const y = horizon + 8 + i * i * (mobile ? 3.4 : 2.7) + i * 5, w = sr * (1.3 - i * 0.12);
    d.add(`<rect class="zg-c" x="${n(sx - w / 2)}" y="${n(y)}" width="${n(w)}" height="${n(2 + i * 0.5)}" rx="1.5" fill="${SUN.mid}" fill-opacity="${n(0.7 - i * 0.08)}" style="animation:zg-sh ${n(2.6 + i * 0.35)}s ease-in-out ${n(i * 0.2)}s infinite"/>`);
  }

  const x = mobile ? 24 : 36;
  const head = wrap('Open to freelance, contract and agency roles', 'd7', mobile ? 30 : 38, mobile ? W - x * 2 : 460);
  const lh = mobile ? 36 : 44, y0 = mobile ? 60 : 74;
  head.forEach((l, i) => d.text(l, x, y0 + i * lh, { f: 'd7', size: mobile ? 30 : 38, fill: T.text }));
  const yy2 = y0 + (head.length - 1) * lh;
  d.text('Building for the web, one solution at a time.', x, yy2 + (mobile ? 32 : 38), { f: 'b4', size: mobile ? 15.5 : 17, fill: T.muted });
  const label = 'Work with me';
  const bw = measure(label, 'b5', 15) + 60, by = yy2 + (mobile ? 50 : 58);
  d.add(`<rect x="${x}" y="${by}" width="${n(bw)}" height="44" rx="10" fill="${T.cta}"/>`);
  d.text(label, x + 20, by + 27.5, { f: 'b5', size: 15, fill: T.onCta });
  d.add(arrow(x + bw - 22, by + 22, T.onCta, 4.5));
  d.close();
  await save(d, mobile ? 'zg-contact-mobile.svg' : 'zg-contact.svg');
}
