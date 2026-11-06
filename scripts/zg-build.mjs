// Generates every static graphic in assets/. Run: npm run build
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { geoNaturalEarth1, geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import * as si from 'simple-icons';
import { Doc, T, heading, waves, typer, ping, wrap, measure, monoW, arrow, n } from './zg-lib.mjs';

const require = createRequire(import.meta.url);
const landTopo = JSON.parse(fs.readFileSync(require.resolve('world-atlas/land-110m.json')));
const land = feature(landTopo, landTopo.objects.land);

const sizes = {};
const save = async (d, name) => { sizes[name] = await d.write(name); };

/* ---------- HERO ---------- */
const MARKETS = [
  { id: 'US', ll: [-100, 39], dx: -8, dy: -8, anchor: 'end' },
  { id: 'UK', ll: [-1.5, 52.5], dx: -8, dy: -8, anchor: 'end' },
  { id: 'DE', ll: [10.5, 51], dx: 7, dy: -9 },
  { id: 'SG', ll: [103.8, 1.35], dx: -8, dy: 15, anchor: 'end' },
  { id: 'AU', ll: [145, -30], dx: 8, dy: 12 },
];
const PH = [122, 13];

function dottedMap({ w, ox, oy, step }) {
  const proj = geoNaturalEarth1().rotate([-PH[0], 0]).fitWidth(w, { type: 'Sphere' });
  const [tx, ty] = proj.translate();
  proj.translate([tx + ox, ty + oy]);
  let dots = '';
  let row = 0;
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

async function hero(mobile) {
  const W = mobile ? 420 : 880, H = mobile ? 580 : 388;
  const d = new Doc(W, H, 'Zeno, full-stack web and AI developer based in the Philippines, working with clients in the US, UK, AU, SG and DE');
  d.panel({ fill: T.bg });

  // Warm glow, matching the portfolio hero.
  d.def(`<radialGradient id="zg-glow"><stop offset="0" stop-color="${T.accent}" stop-opacity=".16"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></radialGradient>`);
  const map = mobile ? { w: 540, ox: -62, oy: 226, step: 6.5 } : { w: 690, ox: 268, oy: 18, step: 7 };
  const { dots, proj } = dottedMap(map);
  const [px, py] = proj(PH);
  d.add(`<circle cx="${n(px)}" cy="${n(py)}" r="${mobile ? 130 : 258}" fill="url(#zg-glow)"/>`);

  // Dotted world map, centred on the Philippines and faded behind the text column.
  if (!mobile) {
    d.def(`<linearGradient id="zg-mf" gradientUnits="userSpaceOnUse" x1="345" x2="470" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="zg-mm" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#zg-mf)"/></mask>`);
    d.add('<g mask="url(#zg-mm)">');
  } else d.add('<g>');
  d.add(`<path d="${dots}" fill="none" stroke="${T.accent}" stroke-opacity=".42" stroke-width="2.3" stroke-linecap="round"/>`);
  d.add('</g>');

  // Connection arcs from the Philippines to each client market.
  d.once('zg-arc', `@keyframes zg-arc{from{stroke-dashoffset:112}to{stroke-dashoffset:0}}`);
  const arcDur = 5.5;
  MARKETS.forEach((m, i) => {
    const [x, y] = proj(m.ll);
    const mx = (px + x) / 2, my = (py + y) / 2, dist = Math.hypot(x - px, y - py);
    const lift = Math.min(dist * 0.32, 92);
    const ang = Math.atan2(y - py, x - px) - Math.PI / 2;
    const flip = Math.sin(ang) > 0 ? -1 : 1;
    const cx = mx + Math.cos(ang) * lift * flip * (x > px ? 1 : 1), cy = my + Math.sin(ang) * lift * flip;
    const dp = `M${n(px)} ${n(py)}Q${n(cx)} ${n(cy)} ${n(x)} ${n(y)}`;
    const delay = n(i * 1.05);
    d.add(`<path d="${dp}" fill="none" stroke="${T.accent}" stroke-opacity=".3" stroke-width="1.1"/>`);
    d.add(`<path d="${dp}" pathLength="100" fill="none" stroke="${T.accent}" stroke-width="2" stroke-linecap="round" stroke-dasharray="12 100" stroke-dashoffset="112" style="animation:zg-arc ${arcDur}s cubic-bezier(.5,0,.5,1) ${delay}s infinite"/>`);
    d.add(`<circle cx="${n(x)}" cy="${n(y)}" r="3.2" fill="${T.accent}"/>`);
    d.add(ping(d, x, y, { r: 3.2, dur: arcDur, delay: n(delay + 2.6) }));
    d.text(m.id, x + m.dx, y + m.dy, { f: 'm5', size: 12, fill: T.muted, anchor: m.anchor });
  });
  d.add(`<circle cx="${n(px)}" cy="${n(py)}" r="4.5" fill="${T.text}"/>`);
  d.add(ping(d, px, py, { r: 4.5, color: T.text, dur: 2.8 }));
  d.text('Philippines · GMT+8', px + 11, py + 4, { f: 'm5', size: 12, fill: T.text });

  // Text column.
  const x = mobile ? 24 : 36;
  const pillText = 'Open to freelance, contract and agency roles';
  const pillSize = mobile ? 12 : 12.5;
  const pillW = pillText.length * monoW(pillSize) + 44;
  const pillY = mobile ? 28 : 32;
  d.add(`<rect x="${x}" y="${pillY}" width="${n(pillW)}" height="30" rx="8" fill="${T.panel2}" stroke="${T.line}"/>`);
  d.add(`<circle cx="${x + 17}" cy="${pillY + 15}" r="3.5" fill="${T.accent}"/>`);
  d.add(ping(d, x + 17, pillY + 15, { r: 3.5, dur: 2.2 }));
  d.text(pillText, x + 30, pillY + 19.5, { f: 'm4', size: pillSize, fill: T.muted });

  d.text('Zeno', x - 3, mobile ? 142 : 170, { f: 'd7', size: mobile ? 92 : 108, fill: T.text, ls: -3 });
  d.text('Full-stack web + AI developer', x, mobile ? 180 : 212, { f: 'd5', size: mobile ? 24 : 26, fill: T.accent });

  typer(d, {
    x, y: mobile ? 216 : 252, size: mobile ? 15.5 : 17,
    phrases: ['> WordPress & Elementor', '> Shopify themes & Liquid', '> React & Next.js apps', '> n8n workflows & MCP servers', '> Technical SEO & llms.txt', '> GA4, GTM & Meta Pixel'],
  });

  const base = mobile ? 486 : 312;
  waves(d, [
    { lambda: 230, amp: 9, y: base, dur: 17, fill: 0.03, stroke: 0.28 },
    { lambda: 170, amp: 7, y: base + 18, dur: 12, fill: 0.05, stroke: 0.42, rev: true },
    { lambda: 290, amp: 11, y: base + 36, dur: 21, fill: 0.08, stroke: 0.65 },
    { lambda: 130, amp: 5, y: base + 54, dur: 9, fill: 0.14, stroke: 0.95, rev: true },
  ]);
  d.close();
  await save(d, mobile ? 'zg-hero-mobile.svg' : 'zg-hero.svg');
}

/* ---------- BUTTONS ---------- */
async function button(file, label, { icon, primary, wide } = {}) {
  const size = 13, h = 38;
  const iconW = icon ? 23 : 0;
  const w = Math.ceil(measure(label, 'b5', size) + 14 + iconW + 12 + 22);
  const d = new Doc(w, h, label);
  const fg = primary ? T.bg : T.text;
  d.add(`<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="10" fill="${primary ? T.accent : T.panel}" stroke="${primary ? T.accent : 'rgba(212,180,148,.45)'}"/>`);
  if (primary) {
    d.def(`<linearGradient id="zg-sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><clipPath id="zg-bc"><rect width="${w}" height="${h}" rx="10"/></clipPath>`);
    d.once('zg-sh', `@keyframes zg-sh{0%,70%{transform:translateX(-80px)}100%{transform:translateX(${w + 80}px)}}.zg-sh{animation:zg-sh 4.5s ease-in-out infinite;transform:translateX(-80px)}`);
    d.add(`<g clip-path="url(#zg-bc)"><rect class="zg-sh" width="60" height="${h}" fill="url(#zg-sh)"/></g>`);
  }
  let x = 14;
  if (icon) {
    const c = primary ? T.bg : T.accent;
    d.add(icon(x + 8, h / 2, c));
    x += iconW;
  }
  d.text(label, x, h / 2 + 5, { f: 'b5', size, fill: fg });
  d.add(arrow(w - 17, h / 2, primary ? T.bg : T.accent, 3.5));
  await save(d, file);
}

const logo = (ic, cx, cy, s, color, extra = '') => {
  const k = s / 24;
  return `<path transform="translate(${n(cx - s / 2)} ${n(cy - s / 2)}) scale(${n(k)})" d="${ic.path}" fill="${color}"${extra}/>`;
};
const icGlobe = (cx, cy, c) => `<g fill="none" stroke="${c}" stroke-width="1.5"><circle cx="${cx}" cy="${cy}" r="7.5"/><ellipse cx="${cx}" cy="${cy}" rx="3.2" ry="7.5"/><path d="M${cx - 7.5} ${cy}h15"/></g>`;
const icCase = (cx, cy, c) => `<g fill="none" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"><rect x="${cx - 7.5}" y="${cy - 4.5}" width="15" height="11" rx="2"/><path d="M${cx - 3} ${cy - 4.5}v-2a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v2"/></g>`;
const icChat = (cx, cy, c) => `<path d="M${cx - 7.5} ${cy - 6.5}h15v10.5h-8.5l-3.5 3v-3h-3z" fill="none" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/>`;
const icIn = (cx, cy, c) => `<g><rect x="${cx - 7.5}" y="${cy - 7.5}" width="15" height="15" rx="3" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M${cx - 4} ${cy - 1}v5M${cx - 4} ${cy - 4}v.1M${cx - 1} ${cy + 4}v-5M${cx - 1} ${cy + 1}a2.2 2.2 0 0 1 4.4 0v3" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/></g>`;
const icGit = (cx, cy, c) => logo(si.siGithub, cx, cy, 16, c);

/* ---------- TERMINAL ---------- */
async function terminal(mobile) {
  const W = mobile ? 420 : 880;
  const size = 14, lh = mobile ? 23 : 25, pad = mobile ? 20 : 28, top = 62;
  const cw = monoW(size);
  const maxChars = Math.floor((W - pad * 2) / cw);
  const prompt = mobile ? '~$ ' : 'zeno@zana-g:~$ ';
  const script = [
    ['cmd', 'whoami'],
    ['out', 'Full-stack web + AI developer working from Philippines (GMT+8).'],
    ['gap'],
    ['cmd', 'cat right-now.txt'],
    ['item', 'Building Zana-G into a web development, SEO and AI agency'],
    ['item', 'Shipping agentic workflows with Claude Code, MCP servers and n8n'],
    ['item', 'Going deeper on Next.js, headless commerce and LLM features for client sites'],
    ['gap'],
    ['cmd', 'ask-me-about'],
    ['item', 'Shopify Liquid'],
    ['item', 'Elementor at scale'],
    ['item', 'llms.txt and AI-crawler readiness'],
    ['item', 'Conversion tracking that actually fires'],
    ['gap'],
    ['end'],
  ];

  // Lay out first so the panel height is known.
  const rows = [];
  for (const [kind, text] of script) {
    if (kind === 'out' || kind === 'item') {
      const indent = kind === 'item' ? 2 : 0;
      const lines = wrapMono(text, maxChars - indent);
      lines.forEach((l, i) => rows.push({ kind, text: l, first: i === 0, indent }));
    } else rows.push({ kind, text });
  }
  const H = top + rows.reduce((a, r) => a + (r.kind === 'gap' ? lh * 0.5 : lh), 0) + 14;
  const d = new Doc(W, Math.ceil(H), 'Terminal showing what Zeno is doing right now: building Zana-G into a web development, SEO and AI agency, shipping agentic workflows with Claude Code, MCP servers and n8n, and going deeper on Next.js, headless commerce and LLM features. Ask about Shopify Liquid, Elementor at scale, llms.txt and AI-crawler readiness, or conversion tracking that actually fires.');
  d.panel({ fill: T.panel });
  d.add(`<rect width="${W}" height="38" fill="${T.panel2}"/><path d="M0 38H${W}" stroke="${T.line}"/>`);
  [0, 1, 2].forEach((i) => d.add(`<circle cx="${pad + i * 17}" cy="19" r="4.5" fill="${['#8F8880', '#B89B7B', '#D4B494'][i]}"/>`));
  d.text('zeno@zana-g: ~', W / 2, 23.5, { f: 'm4', size: 12, fill: T.faint, anchor: 'middle' });

  // Timeline, in seconds.
  let t = 0.5, y = top;
  const events = [];
  rows.forEach((r) => {
    if (r.kind === 'gap') { y += lh * 0.5; return; }
    if (r.kind === 'cmd') {
      const start = t + 0.25, end = start + r.text.length * 0.055;
      events.push({ ...r, y, start, end });
      t = end + 0.25;
    } else {
      events.push({ ...r, y, start: t, end: t });
      t += r.first === false ? 0.04 : 0.22;
    }
    y += lh;
  });
  const hold = 15, total = n(t + hold);
  const pc = (s) => n((s / total) * 100);

  d.style(`@keyframes zg-fade{0%,${pc(total - 0.7)}%{opacity:1}100%{opacity:0}}.zg-fade{animation:zg-fade ${total}s linear infinite}`);
  d.add('<g class="zg-fade">');
  events.forEach((e, i) => {
    const cls = `zg-l${i}`;
    d.style(`@keyframes ${cls}{0%,${pc(e.start)}%{opacity:0}${n(pc(e.start) + 0.05)}%,100%{opacity:1}}.${cls}{animation:${cls} ${total}s linear infinite}`);
    if (e.kind === 'cmd' || e.kind === 'end') {
      const pw = prompt.length * cw;
      d.add(`<g class="${cls}">`);
      d.text(prompt, pad, e.y, { f: 'm5', size, fill: T.accent });
      if (e.kind === 'cmd') {
        const w = n(e.text.length * cw);
        d.text(e.text, pad + pw, e.y, { f: 'm4', size, fill: T.text });
        const ov = `zg-t${i}`;
        d.style(`@keyframes ${ov}{0%,${pc(e.start)}%{transform:translateX(0);animation-timing-function:steps(${e.text.length},end)}${pc(e.end)}%,100%{transform:translateX(${w}px)}}.${ov}{animation:${ov} ${total}s linear infinite;transform:translateX(${w}px)}`);
        d.add(`<rect class="${ov}" x="${n(pad + pw - 1)}" y="${e.y - size}" width="${n(w + cw + 4)}" height="${size * 1.45}" fill="${T.panel}"/>`);
      } else {
        d.once('zg-blink', `@keyframes zg-blink{0%,55%{opacity:1}56%,100%{opacity:.15}}.zg-blink{animation:zg-blink 1s linear infinite}`);
        d.add(`<rect class="zg-blink" x="${n(pad + pw + 1)}" y="${e.y - size + 2}" width="${n(cw * 0.65)}" height="${size + 2}" fill="${T.accent}"/>`);
      }
      d.add('</g>');
    } else {
      d.add(`<g class="${cls}">`);
      if (e.kind === 'item' && e.first) d.text('>', pad, e.y, { f: 'm5', size, fill: T.accent });
      d.text(e.text, pad + e.indent * cw, e.y, { f: 'm4', size, fill: e.kind === 'item' ? T.muted : T.text });
      d.add('</g>');
    }
  });
  d.add('</g>');
  d.close();
  await save(d, mobile ? 'zg-terminal-mobile.svg' : 'zg-terminal.svg');
}

function wrapMono(s, max) {
  const out = []; let cur = '';
  for (const w of s.split(' ')) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) { out.push(cur); cur = w; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

/* ---------- SERVICE GLYPHS ---------- */
const stroke = `fill="none" stroke="${T.accent}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"`;
const GLYPHS = {
  blocks(d, c, y) {
    d.once('g-slide', `@keyframes g-slide{0%,12%{transform:translateX(20px);opacity:0}32%,82%{transform:none;opacity:1}100%{transform:translateX(-20px);opacity:0}}.g-slide{animation:g-slide 5s ease-in-out infinite}`);
    return `<rect x="${c - 15}" y="${y - 16}" width="30" height="8" rx="2.5" ${stroke}/><rect class="g-slide" x="${c - 15}" y="${y - 4}" width="30" height="8" rx="2.5" fill="${T.accent}"/><rect x="${c - 15}" y="${y + 8}" width="30" height="8" rx="2.5" ${stroke}/>`;
  },
  bag(d, c, y) {
    d.once('g-drop', `@keyframes g-drop{0%,10%{transform:translateY(-26px);opacity:0}30%{opacity:1}55%,85%{transform:none;opacity:1}100%{transform:none;opacity:0}}.g-drop{animation:g-drop 3.8s ease-in infinite}`);
    return `<path d="M${c - 13} ${y - 6}h26l3 23h-32z" ${stroke}/><path d="M${c - 6} ${y - 6}v-3a6 6 0 0 1 12 0v3" ${stroke}/><circle class="g-drop" cx="${c}" cy="${y + 6}" r="3.5" fill="${T.accent}"/>`;
  },
  code(d, c, y) {
    d.once('g-pulse', `@keyframes g-pulse{0%,100%{opacity:.35}50%{opacity:1}}.g-pulse{animation:g-pulse 2.4s ease-in-out infinite}`);
    return `<path d="M${c - 8} ${y - 11}L${c - 18} ${y}L${c - 8} ${y + 11}M${c + 8} ${y - 11}L${c + 18} ${y}L${c + 8} ${y + 11}" ${stroke}/><path class="g-pulse" d="M${c + 4} ${y - 14}L${c - 4} ${y + 14}" ${stroke}/>`;
  },
  nodes(d, c, y) {
    d.once('g-run', `@keyframes g-run{from{stroke-dashoffset:120}to{stroke-dashoffset:0}}`);
    const tri = `M${c} ${y - 14}L${c + 15} ${y + 12}L${c - 15} ${y + 12}Z`;
    return `<path d="${tri}" ${stroke} stroke-opacity=".4"/><path d="${tri}" pathLength="100" fill="none" stroke="${T.accent}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="20 100" style="animation:g-run 3s linear infinite"/>`
      + [[c, y - 14], [c + 15, y + 12], [c - 15, y + 12]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="4.5" fill="${T.panel2}" stroke="${T.accent}" stroke-width="1.75"/>`).join('');
  },
  scan(d, c, y) {
    d.once('g-mag', `@keyframes g-mag{0%,100%{transform:translateX(-11px)}50%{transform:translateX(9px)}}.g-mag{animation:g-mag 4.2s ease-in-out infinite}`);
    const bars = [[c - 15, 9], [c - 4, 17], [c + 7, 26]].map(([x, h]) => `<rect x="${x}" y="${y + 15 - h}" width="8" height="${h}" rx="2" fill="${T.accent}" fill-opacity=".5"/>`).join('');
    return `${bars}<g class="g-mag"><circle cx="${c}" cy="${y - 4}" r="8.5" fill="${T.panel2}" fill-opacity=".55" stroke="${T.text}" stroke-width="1.75"/><path d="M${c + 6} ${y + 2}l6 6" stroke="${T.text}" stroke-width="1.75" stroke-linecap="round"/></g>`;
  },
  rings(d, c, y) {
    return `<circle cx="${c}" cy="${y}" r="4.5" fill="${T.accent}"/><circle cx="${c}" cy="${y}" r="16" fill="none" stroke="${T.accent}" stroke-opacity=".2" stroke-width="1.25"/>${ping(d, c, y, { r: 4.5, dur: 2.8, grow: 4 })}${ping(d, c, y, { r: 4.5, dur: 2.8, delay: 1.4, grow: 4 })}`;
  },
};

/* ---------- SERVICES ---------- */
const SERVICES = [
  ['blocks', 'WordPress & Elementor', 'Full site builds, custom themes and plugins, WooCommerce, mobile and speed fixes'],
  ['bag', 'Shopify', 'Theme development, custom Liquid sections, bundles, print-on-demand, interactive 3D/360° product viewers'],
  ['code', 'Full-stack', 'React and Next.js apps, headless WordPress/Shopify, REST and GraphQL APIs, Vercel deploys'],
  ['nodes', 'AI & automation', 'n8n workflows, AI agents, MCP servers, lead routing and AI-drafted replies'],
  ['scan', 'Technical SEO', 'Schema (JSON-LD), Core Web Vitals, internal linking, llms.txt and AI-crawler optimization'],
  ['rings', 'Tracking', 'GA4, Google Tag Manager, Meta Pixel, booking and form conversion tracking'],
];

async function services(mobile) {
  const W = mobile ? 420 : 880, pad = mobile ? 18 : 28, gap = mobile ? 10 : 14;
  const top = 70;
  const cols = mobile ? 1 : 3;
  const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
  const ch = mobile ? 124 : 206;
  const rows = Math.ceil(SERVICES.length / cols);
  const H = top + rows * ch + (rows - 1) * gap + pad;
  const d = new Doc(W, H, 'What I build: WordPress and Elementor, Shopify, full-stack React and Next.js, AI and automation, technical SEO, and tracking.');
  d.panel();
  heading(d, 'What I build', { hint: mobile ? undefined : 'zana-g.com' });
  SERVICES.forEach(([g, title, body], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = pad + col * (cw + gap), y = top + row * (ch + gap);
    d.add(`<rect x="${n(x)}" y="${y}" width="${n(cw)}" height="${ch}" rx="12" fill="${T.panel2}" stroke="${T.line}"/>`);
    const tile = 52;
    const tx = x + 18, ty = y + 18;
    d.add(`<rect x="${n(tx)}" y="${ty}" width="${tile}" height="${tile}" rx="11" fill="${T.bg}" stroke="${T.line}"/>`);
    d.add(GLYPHS[g](d, n(tx + tile / 2), ty + tile / 2));
    if (mobile) {
      const textX = tx + tile + 16, maxW = W - pad - 16 - textX;
      d.text(title, textX, y + 35, { f: 'd5', size: 17, fill: T.text });
      wrap(body, 'b4', 14, maxW).forEach((l, k) => d.text(l, textX, y + 57 + k * 19, { f: 'b4', size: 14, fill: T.muted }));
    } else {
      d.text(title, tx, ty + tile + 30, { f: 'd5', size: 17, fill: T.text });
      wrap(body, 'b4', 14, cw - 36).forEach((l, k) => d.text(l, tx, ty + tile + 54 + k * 20, { f: 'b4', size: 14, fill: T.muted }));
    }
  });
  d.close();
  await save(d, mobile ? 'zg-services-mobile.svg' : 'zg-services.svg');
}

/* ---------- STACK ---------- */
const GROUPS = {
  platforms: ['Platforms', [['WordPress', si.siWordpress], ['Elementor', si.siElementor], ['WooCommerce', si.siWoocommerce], ['Shopify', si.siShopify], ['GoHighLevel', 'GHL'], ['Squarespace', si.siSquarespace], ['Wix', si.siWix]]],
  seo: ['SEO & tracking', [['GA4', si.siGoogleanalytics], ['GTM', si.siGoogletagmanager], ['Search\nConsole', si.siGooglesearchconsole], ['Meta Pixel', si.siMeta]]],
  full: ['Full-stack', [['TypeScript', si.siTypescript], ['JavaScript', si.siJavascript], ['React', si.siReact], ['Next.js', si.siNextdotjs], ['Node', si.siNodedotjs], ['Tailwind', si.siTailwindcss], ['PHP', si.siPhp], ['Liquid', '{% %}'], ['HTML', si.siHtml5], ['CSS', si.siCss], ['GraphQL', si.siGraphql], ['REST APIs', 'REST']]],
  ai: ['AI & agents', [['n8n', si.siN8n], ['MCP', si.siModelcontextprotocol], ['Claude\nCode', si.siClaude], ['Cursor', si.siCursor], ['Copilot', si.siGithubcopilot]]],
  ops: ['Ops & design', [['Git', si.siGit], ['GitHub', si.siGithub], ['Vercel', si.siVercel], ['cPanel', si.siCpanel], ['Hostinger', si.siHostinger], ['Figma', si.siFigma]]],
};
const stackAlt = 'Stack: ' + Object.values(GROUPS).map(([k, items]) => k + ': ' + items.map((i) => i[0].replace('\n', ' ')).join(', ')).join('. ');

function tile(d, x, y, w, h, name, ic, delay, logoSize) {
  const cx = x + w / 2;
  d.add('<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + h + '" rx="10" fill="' + T.panel2 + '" stroke="' + T.line + '"/>');
  const lines = name.split('\n');
  const logoY = y + (lines.length > 1 ? 23 : 26);
  if (typeof ic === 'string') {
    d.text(ic, cx, logoY + 5.5, { f: 'd7', size: 15, fill: T.muted, anchor: 'middle', cls: 'zg-lit', style: 'animation-delay:' + delay + 's' });
  } else {
    d.add(logo(ic, cx, logoY, logoSize, T.muted, ' class="zg-lit" style="animation-delay:' + delay + 's"'));
  }
  let fs_ = 10.5;
  while (lines.some((l) => measure(l, 'b5', fs_) > w - 5) && fs_ > 8.5) fs_ -= 0.25;
  lines.forEach((l, k) => d.text(l, cx, y + h - 11 - (lines.length - 1 - k) * 12, { f: 'b5', size: fs_, fill: T.faint, anchor: 'middle' }));
}

async function stack(mobile) {
  const W = mobile ? 420 : 880, pad = mobile ? 18 : 28, top = 68, dur = 10;
  const tileH = mobile ? 74 : 70, labelH = 26, rowGap = mobile ? 16 : 20;
  const area = W - pad * 2;
  const layout = mobile
    ? [[['platforms', [4, 3]]], [['full', [4, 4, 4]]], [['ai', [5]]], [['seo', [4]]], [['ops', [3, 3]]]]
    : [[['platforms', [7]], ['seo', [4]]], [['full', [12]]], [['ai', [5]], ['ops', [6]]]];

  let H = top;
  if (mobile) layout.forEach(([[, rows]]) => { H += labelH + rows.length * (tileH + 6) + rowGap - 6; });
  else H += layout.length * (labelH + tileH + rowGap);
  H += pad - rowGap;
  const d = new Doc(W, Math.ceil(H), stackAlt);
  d.panel();
  heading(d, 'Stack');
  d.style('@keyframes zg-lit{0%,14%,100%{fill:' + T.muted + '}6%{fill:' + T.accent + '}}.zg-lit{animation:zg-lit ' + dur + 's linear infinite}');

  let y = top, seq = 0;
  if (mobile) {
    layout.forEach(([[key, rows]]) => {
      const [label, items] = GROUPS[key];
      d.text(label, pad, y + 14, { f: 'm5', size: 13, fill: T.accent });
      y += labelH;
      let idx = 0;
      rows.forEach((count) => {
        const w = (area - 6 * (count - 1)) / count;
        for (let i = 0; i < count; i++, idx++, seq++) {
          const [name, ic] = items[idx];
          tile(d, pad + i * (w + 6), y, w, tileH, name, ic, n((seq * 0.24) % dur), 25);
        }
        y += tileH + 6;
      });
      y += rowGap - 6;
    });
  } else {
    const pitch = area / 12, w = pitch - 6;
    layout.forEach((row) => {
      let col = 0;
      const span = row.reduce((acc, [, [c]]) => acc + c, 0);
      const spacer = row.length > 1 ? 12 - span : 0;
      row.forEach(([key, [count]], g) => {
        const [label, items] = GROUPS[key];
        d.text(label, pad + col * pitch, y + 14, { f: 'm5', size: 13, fill: T.accent });
        items.forEach(([name, ic], i) => {
          tile(d, pad + (col + i) * pitch, y + labelH, w, tileH, name, ic, n(((col + i) * 0.18 + seq * 0.04) % dur), 24);
          seq++;
        });
        col += count + (g < row.length - 1 ? spacer : 0);
      });
      y += labelH + tileH + rowGap;
    });
  }
  d.close();
  await save(d, mobile ? 'zg-stack-mobile.svg' : 'zg-stack.svg');
}

/* ---------- RECENT WORK ---------- */
const SCENES = {
  bundle(d) {
    d.once('s-into', `@keyframes s-into{0%,8%{transform:none;opacity:1}42%{transform:translateX(52px);opacity:1}50%,100%{transform:translateX(52px);opacity:0}}`);
    d.once('s-bump', `@keyframes s-bump{0%,44%,100%{transform:scale(1)}50%{transform:scale(1.12)}}.s-bump{animation:s-bump 1.9s ease-in-out infinite}`);
    const items = [24, 51, 78].map((y, i) => `<rect x="14" y="${y}" width="16" height="16" rx="4" fill="${T.accent}" style="animation:s-into 5.7s cubic-bezier(.5,0,.4,1) ${n(i * 1.9)}s infinite"/>`).join('');
    return `${items}<g class="zg-c s-bump"><path d="M62 42h40l4 54h-48z" ${stroke}/><path d="M72 42v-6a10 10 0 0 1 20 0v6" ${stroke}/></g>`;
  },
  orbit(d) {
    d.once('s-spin', `@keyframes s-spin{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}100%{transform:scaleX(1)}}`);
    const base = [0.72, 0.28, -0.3];
    const m = base.map((b, i) => `<ellipse class="zg-c" cx="59" cy="52" rx="36" ry="36" fill="none" stroke="${T.accent}" stroke-width="1.5" style="transform:scaleX(${b});animation:s-spin 6s ease-in-out ${n(-i * 1.5)}s infinite"/>`).join('');
    return `<circle cx="59" cy="52" r="36" fill="none" stroke="${T.accent}" stroke-opacity=".55" stroke-width="1.5"/><ellipse cx="59" cy="52" rx="36" ry="12" fill="none" stroke="${T.accent}" stroke-opacity=".3"/><path d="M23 52h72" stroke="${T.accent}" stroke-opacity=".3"/>${m}${d.t('360°', 59, 107, { f: 'm5', size: 12, fill: T.text, anchor: 'middle' })}`;
  },
  pulse(d) {
    d.once('s-ekg', `@keyframes s-ekg{from{stroke-dashoffset:135}to{stroke-dashoffset:0}}`);
    const p = 'M6 72H36L43 72L49 48L58 94L64 62L69 72H112';
    return `<rect x="14" y="14" width="66" height="22" rx="6" fill="${T.panel2}" stroke="${T.line}"/>${d.t('schema', 47, 29, { f: 'm5', size: 11, fill: T.accent, anchor: 'middle' })}<path d="${p}" fill="none" stroke="${T.accent}" stroke-opacity=".28" stroke-width="1.5"/><path d="${p}" pathLength="100" fill="none" stroke="${T.accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="35 100" style="animation:s-ekg 2.8s linear infinite"/>`;
  },
  graph(d) {
    d.once('s-out', `@keyframes s-out{from{stroke-dashoffset:125}to{stroke-dashoffset:0}}`);
    const c = [59, 59], pts = [[59, 18], [98, 42], [90, 92], [28, 92], [20, 42]];
    let s = '';
    pts.forEach(([x, y], i) => {
      s += `<path d="M${c[0]} ${c[1]}L${x} ${y}" stroke="${T.accent}" stroke-opacity=".3" stroke-width="1.25"/>`;
      s += `<path d="M${c[0]} ${c[1]}L${x} ${y}" pathLength="100" stroke="${T.accent}" stroke-width="2" stroke-linecap="round" stroke-dasharray="25 100" style="animation:s-out 3.5s linear ${n(i * 0.7)}s infinite"/>`;
    });
    s += pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${T.bg}" stroke="${T.accent}" stroke-width="1.75"/>`).join('');
    return s + `<circle cx="59" cy="59" r="8" fill="${T.accent}"/>`;
  },
  crawl(d) {
    d.once('s-beam', `@keyframes s-beam{0%,100%{transform:none}50%{transform:translateY(50px)}}.s-beam{animation:s-beam 4.4s ease-in-out infinite}`);
    d.def(`<clipPath id="zg-doc"><rect x="26" y="12" width="66" height="94" rx="7"/></clipPath>`);
    const widths = [46, 34, 42, 28, 38, 22];
    const lines = widths.map((w, i) => `<path d="M34 ${42 + i * 10}h${w}" stroke="${T.muted}" stroke-opacity=".45" stroke-width="2.5" stroke-linecap="round"/>`).join('');
    return `<rect x="26" y="12" width="66" height="94" rx="7" fill="${T.panel2}" stroke="${T.accent}" stroke-opacity=".6"/>${d.t('llms.txt', 59, 28, { f: 'm5', size: 10.5, fill: T.accent, anchor: 'middle' })}${lines}<g clip-path="url(#zg-doc)"><g class="s-beam"><rect x="26" y="36" width="66" height="13" fill="${T.accent}" fill-opacity=".2"/><path d="M26 49h66" stroke="${T.accent}" stroke-width="1.5"/></g></g>`;
  },
  calendar(d) {
    let cells = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const on = r === 1 && c === 2;
      cells += `<rect x="${19 + c * 21}" y="${36 + r * 19}" width="17" height="15" rx="3" fill="${on ? T.accent : T.panel2}" stroke="${on ? T.accent : T.line}"/>`;
    }
    return `<rect x="12" y="14" width="94" height="84" rx="8" fill="none" stroke="${T.accent}" stroke-opacity=".5"/><path d="M12 29h94" stroke="${T.accent}" stroke-opacity=".5"/>${cells}${ping(d, 69.5, 62.5, { r: 8, dur: 2.6, grow: 3 })}${d.t('pixel fired', 59, 112, { f: 'm5', size: 10.5, fill: T.text, anchor: 'middle' })}`;
  },
};

const WORK = [
  ['bundle', 'Shopify store', 'Full Shopify store with custom Liquid sections, Printful and product bundles'],
  ['orbit', '360° product viewer', 'Shopify landing page with an interactive 360° product viewer, parallax and scroll animations'],
  ['pulse', 'Healthcare build', 'Healthcare WordPress/Elementor build with schema and technical SEO'],
  ['graph', 'Law firm site', 'Law firm site: attorney profiles, mobile fixes and internal linking'],
  ['crawl', 'AI-crawler optimization', 'llms.txt and AI-crawler optimization for a professional services firm'],
  ['calendar', 'Conversion tracking', 'Booking and Meta Pixel conversion tracking for a salon'],
];

async function work(mobile) {
  const W = mobile ? 420 : 880, pad = mobile ? 18 : 28, gap = mobile ? 10 : 14, top = 70;
  const cols = mobile ? 1 : 2;
  const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
  const ch = 142;
  const rows = Math.ceil(WORK.length / cols);
  const H = top + rows * ch + (rows - 1) * gap + pad;
  const d = new Doc(W, H, 'Recent work: ' + WORK.map((w) => w[2]).join('. ') + '. Opens the full case studies on zana-g.com.');
  d.panel();
  heading(d, 'Recent work', { hint: 'case studies' });
  d.def(`<pattern id="zg-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="${T.accent}" fill-opacity=".18"/></pattern>`);
  WORK.forEach(([s, title, body], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = pad + col * (cw + gap), y = top + row * (ch + gap);
    d.add(`<rect x="${n(x)}" y="${y}" width="${n(cw)}" height="${ch}" rx="12" fill="${T.panel2}" stroke="${T.line}"/>`);
    const sx = x + 12, sy = y + 12;
    d.add(`<g transform="translate(${n(sx)} ${sy})"><rect width="118" height="118" rx="9" fill="${T.bg}" stroke="${T.line}"/><rect width="118" height="118" rx="9" fill="url(#zg-dots)"/>${SCENES[s](d)}</g>`);
    const tx = sx + 118 + 16, maxW = x + cw - tx - 14;
    d.text(title, tx, y + 38, { f: 'd5', size: 17, fill: T.text });
    wrap(body, 'b4', 14, maxW).forEach((l, k) => d.text(l, tx, y + 62 + k * 20, { f: 'b4', size: 14, fill: T.muted }));
  });
  d.close();
  await save(d, mobile ? 'zg-work-mobile.svg' : 'zg-work.svg');
}

/* ---------- PROCESS (drawn as a Git graph) ---------- */
const STEPS = [
  ['Scope', 'Agree what we are building'],
  ['Define done', 'A clear definition of "done"'],
  ['Ship early', 'A working version first'],
  ['Polish', 'Then refine it'],
  ['Staging', 'Checked before live'],
];

async function processGraph(mobile) {
  const dur = 9;
  if (!mobile) {
    const W = 880, H = 318;
    const d = new Doc(W, H, 'How I work: scope and a clear definition of done first. Ship a working version early, then polish. Staging before live, everything in Git.');
    d.panel();
    heading(d, 'How I work');
    const yTop = 128, yMain = 214, x0 = 112, xs = [176, 300, 424, 548, 672], xLive = 800;
    const branch = `M${x0} ${yMain}C${x0 + 30} ${yMain} ${x0 + 24} ${yTop} ${xs[0] - 8} ${yTop}H${xs[4]}C${xs[4] + 62} ${yTop} ${xs[4] + 58} ${yMain} ${xLive} ${yMain}`;
    d.text('main', 28, yMain + 4.5, { f: 'm5', size: 13, fill: T.faint });
    d.text('staging', 28, yTop + 4.5, { f: 'm5', size: 13, fill: T.accent });
    d.add(`<path d="M${x0 - 34} ${yMain}H${W - 28}" stroke="${T.line}" stroke-width="2"/>`);
    [x0, xLive].forEach((x) => d.add(`<circle cx="${x}" cy="${yMain}" r="5" fill="${T.panel}" stroke="${T.faint}" stroke-width="2"/>`));
    d.add(`<path d="${branch}" fill="none" stroke="${T.accent}" stroke-opacity=".45" stroke-width="2"/>`);
    const totalX = xLive - x0;
    d.style(`@keyframes zg-node{0%,10%,100%{r:6px;fill:${T.panel}}2%,5%{r:8px;fill:${T.accent}}}`);
    STEPS.forEach(([t, s], i) => {
      const x = xs[i];
      const delay = n(((x - x0) / totalX) * dur);
      d.add(`<circle cx="${x}" cy="${yTop}" r="6" fill="${T.panel}" stroke="${T.accent}" stroke-width="2" style="animation:zg-node ${dur}s linear ${n(delay - 0.2)}s infinite"/>`);
      d.text(t, x, yTop - 22, { f: 'd5', size: 15, fill: T.text, anchor: 'middle' });
    });
    d.text('Live', xLive, yMain + 32, { f: 'd5', size: 15, fill: T.text, anchor: 'middle' });
    d.add(`<circle class="zg-motion" r="4.5" fill="${T.text}"><animateMotion dur="${dur}s" repeatCount="indefinite" path="${branch}"/></circle>`);
    d.text('Scope and a clear definition of "done" first. Ship a working version early, then polish.', 28, H - 44, { f: 'b4', size: 15, fill: T.muted });
    d.text('Staging before live, everything in Git.', 28, H - 21, { f: 'b4', size: 15, fill: T.muted });
    d.close();
    await save(d, 'zg-process.svg');
    return;
  }
  const W = 420, top = 76, gap = 56, H = top + gap * 5 + 118;
  const d = new Doc(W, H, 'How I work: scope and a clear definition of done first. Ship a working version early, then polish. Staging before live, everything in Git.');
  d.panel();
  heading(d, 'How I work', { x: 18 });
  const xMain = 34, xTop = 72, yEnd = top + gap * 5;
  const branch = `M${xMain} ${top - 6}C${xMain} ${top + 10} ${xTop} ${top - 2} ${xTop} ${top + 18}V${top + 18 + gap * 4}C${xTop} ${yEnd - 8} ${xMain} ${yEnd - 18} ${xMain} ${yEnd}`;
  d.add(`<path d="M${xMain} ${top - 10}V${yEnd + 6}" stroke="${T.line}" stroke-width="2"/>`);
  d.add(`<path d="${branch}" fill="none" stroke="${T.accent}" stroke-opacity=".45" stroke-width="2"/>`);
  d.style(`@keyframes zg-node{0%,10%,100%{r:6px;fill:${T.panel}}2%,5%{r:8px;fill:${T.accent}}}`);
  STEPS.forEach(([t], i) => {
    const y = top + 18 + i * gap;
    d.add(`<circle cx="${xTop}" cy="${y}" r="6" fill="${T.panel}" stroke="${T.accent}" stroke-width="2" style="animation:zg-node ${dur}s linear ${n(((i + 0.5) / 6) * dur)}s infinite"/>`);
    d.text(t, xTop + 22, y + 6, { f: 'd5', size: 17, fill: T.text });
  });
  d.add(`<circle cx="${xMain}" cy="${yEnd}" r="5" fill="${T.panel}" stroke="${T.faint}" stroke-width="2"/>`);
  d.text('Live', xMain + 16, yEnd + 6, { f: 'd5', size: 17, fill: T.text });
  d.add(`<circle class="zg-motion" r="4.5" fill="${T.text}"><animateMotion dur="${dur}s" repeatCount="indefinite" path="${branch}"/></circle>`);
  const copy = 'Scope and a clear definition of "done" first. Ship a working version early, then polish. Staging before live, everything in Git.';
  wrap(copy, 'b4', 15, W - 36).forEach((l, k) => d.text(l, 18, yEnd + 42 + k * 21, { f: 'b4', size: 15, fill: T.muted }));
  d.close();
  await save(d, 'zg-process-mobile.svg');
}

/* ---------- CONTACT ---------- */
async function contact(mobile) {
  const W = mobile ? 420 : 880, H = mobile ? 330 : 270;
  const d = new Doc(W, H, 'Open to freelance, contract and agency roles. Building for the web, one solution at a time. Opens the contact section on zana-g.com.');
  d.panel({ fill: T.bg });
  d.def(`<radialGradient id="zg-g2" cx=".15" cy=".1" r=".9"><stop offset="0" stop-color="${T.accent}" stop-opacity=".14"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></radialGradient>`);
  d.add(`<rect width="${W}" height="${H}" fill="url(#zg-g2)"/>`);
  const x = mobile ? 24 : 36;
  const head = wrap('Open to freelance, contract and agency roles', 'd5', mobile ? 26 : 32, W - x * 2);
  const lh = mobile ? 33 : 40;
  head.forEach((l, i) => d.text(l, x, (mobile ? 60 : 66) + i * lh, { f: 'd5', size: mobile ? 26 : 32, fill: T.text }));
  const yy = (mobile ? 60 : 66) + (head.length - 1) * lh;
  d.text('Building for the web, one solution at a time.', x, yy + (mobile ? 32 : 36), { f: 'b4', size: mobile ? 15.5 : 17, fill: T.muted });
  const label = 'Work with me';
  const bw = measure(label, 'b5', 15) + 60, by = yy + (mobile ? 54 : 58);
  d.add(`<rect x="${x}" y="${by}" width="${n(bw)}" height="44" rx="10" fill="${T.accent}"/>`);
  d.text(label, x + 20, by + 27.5, { f: 'b5', size: 15, fill: T.bg });
  d.add(arrow(x + bw - 22, by + 22, T.bg, 4.5));
  const base = H - 62;
  waves(d, [
    { lambda: 230, amp: 8, y: base, dur: 17, fill: 0.03, stroke: 0.28 },
    { lambda: 170, amp: 6, y: base + 15, dur: 12, fill: 0.05, stroke: 0.42, rev: true },
    { lambda: 290, amp: 9, y: base + 30, dur: 21, fill: 0.08, stroke: 0.65 },
    { lambda: 130, amp: 4, y: base + 45, dur: 9, fill: 0.14, stroke: 0.95, rev: true },
  ]);
  d.close();
  await save(d, mobile ? 'zg-contact-mobile.svg' : 'zg-contact.svg');
}

/* ---------- RUN ---------- */
for (const m of [false, true]) {
  await hero(m);
  await terminal(m);
  await services(m);
  await stack(m);
  await work(m);
  await processGraph(m);
  await contact(m);
}
await button('zg-btn-contact.svg', 'Work with me', { icon: icChat, primary: true });
await button('zg-btn-cases.svg', 'Case studies', { icon: icCase });
await button('zg-btn-site.svg', 'zana-g.com', { icon: icGlobe });
await button('zg-btn-linkedin.svg', 'LinkedIn', { icon: icIn });
await button('zg-btn-code.svg', 'Portfolio code', { icon: icGit });

for (const [k, v] of Object.entries(sizes)) console.log(k.padEnd(28), `${(v / 1024).toFixed(1)} KB`);
console.log('Total'.padEnd(28), `${(Object.values(sizes).reduce((a, b) => a + b, 0) / 1024).toFixed(0)} KB`);
