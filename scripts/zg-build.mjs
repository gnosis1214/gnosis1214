// Generates every static graphic in assets/. Run: npm run build
import * as si from 'simple-icons';
import { Doc, T, heading, ping, wrap, measure, monoW, arrow, logo, brand, n } from './zg-lib.mjs';
import { hero, bands, reach, anatomy, flowAI, flowTracking, work, cmdChip, contact } from './zg-scenes.mjs';

const sizes = {};
const save = async (d, name) => { sizes[name] = await d.write(name); };

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
  d.panel({ fill: T.panel, decor: false });
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
  heading(d, 'What I build', { hint: mobile ? undefined : 'zana-g.com', ghost: 'BUILD' });
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
  // Rolling highlight on the tile, so the logos keep their brand colours.
  d.add('<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + h + '" rx="10" fill="' + T.accent + '" fill-opacity=".14" stroke="' + T.accent + '" style="opacity:0;animation:zg-lit 10s linear ' + delay + 's infinite"/>');
  const lines = name.split('\n');
  const logoY = y + (lines.length > 1 ? 23 : 26);
  if (typeof ic === 'string') {
    d.text(ic, cx, logoY + 5.5, { f: 'd7', size: 15, fill: T.accent, anchor: 'middle' });
  } else {
    d.add(logo(ic, cx, logoY, logoSize, brand(ic)));
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
  heading(d, 'Stack', { ghost: 'TOOLS' });
  d.style('@keyframes zg-lit{0%,12%,100%{opacity:0}5%{opacity:1}}');

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
    heading(d, 'How I work', { ghost: 'PROCESS' });
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
  heading(d, 'How I work', { x: 18, ghost: 'FLOW' });
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

/* ---------- RUN ---------- */
for (const m of [false, true]) {
  await hero(m, save);
  await bands(m, 'a', save);
  await bands(m, 'b', save);
  await reach(m, save);
  await terminal(m);
  await services(m);
  await anatomy(m, save);
  await stack(m);
  await flowAI(m, save);
  await flowTracking(m, save);
  await work(m, save);
  await processGraph(m);
  await contact(m, save);
}
await button('zg-btn-contact.svg', 'Work with me', { icon: icChat, primary: true });
await button('zg-btn-cases.svg', 'Case studies', { icon: icCase });
await button('zg-btn-site.svg', 'zana-g.com', { icon: icGlobe });
await button('zg-btn-linkedin.svg', 'LinkedIn', { icon: icIn });
await button('zg-btn-code.svg', 'Portfolio code', { icon: icGit });
await cmdChip('zg-cmd-toolbox.svg', '$ zeno --toolbox', save);
await cmdChip('zg-cmd-table.svg', '$ zeno --activity --table', save);
await cmdChip('zg-cmd-plain.svg', '$ zeno --plain-text', save);

for (const [k, v] of Object.entries(sizes)) console.log(k.padEnd(32), `${(v / 1024).toFixed(1)} KB`);
console.log('Total'.padEnd(32), `${(Object.values(sizes).reduce((a, b) => a + b, 0) / 1024).toFixed(0)} KB`);
