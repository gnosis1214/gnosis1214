// Shared helpers for the profile graphics.
// Every SVG is self-contained: GitHub loads READMEs' SVGs as <img>, which blocks
// external fonts and scripts, so fonts are subset and embedded per file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import subsetFont from 'subset-font';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ASSETS = path.join(ROOT, 'assets');
export const README = path.join(ROOT, 'README.md');
const NM = path.join(ROOT, 'node_modules');

// Theme tokens, sampled from Zeno's portrait. Red leads on near-black navy; blue is only a small accent.
export const T = {
  bg: '#060911',
  panel: '#0B101D',
  panel2: '#111A2E',
  text: '#F2F6FF',
  muted: '#B4C2DC',
  faint: '#7C8BAA',
  line: 'rgba(255,170,180,.15)',
  accent: '#FF4D5E',
  blue: '#4FA6FF',
  blush: '#FFC9CE',
  ice: '#8EDBFF',
  red: '#FF3346',
  redHi: '#FF4D5E',
  cta: '#E5162B',
  onCta: '#FFFFFF',
};

const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const FONTS = {
  d5: { fam: 'zgD', w: 500, file: '@fontsource/space-grotesk/files/space-grotesk-latin-500-normal', stack: `zgD,'Space Grotesk',${SANS}` },
  d7: { fam: 'zgD', w: 700, file: '@fontsource/space-grotesk/files/space-grotesk-latin-700-normal', stack: `zgD,'Space Grotesk',${SANS}` },
  b4: { fam: 'zgB', w: 400, file: '@fontsource/dm-sans/files/dm-sans-latin-400-normal', stack: `zgB,'DM Sans',${SANS}` },
  b5: { fam: 'zgB', w: 500, file: '@fontsource/dm-sans/files/dm-sans-latin-500-normal', stack: `zgB,'DM Sans',${SANS}` },
  m4: { fam: 'zgM', w: 400, file: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal', stack: `zgM,'JetBrains Mono',ui-monospace,Consolas,monospace` },
  m5: { fam: 'zgM', w: 500, file: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal', stack: `zgM,'JetBrains Mono',ui-monospace,Consolas,monospace` },
};

const metrics = {};
function font(key) {
  if (!metrics[key]) {
    const b = fs.readFileSync(path.join(NM, FONTS[key].file + '.woff'));
    metrics[key] = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  }
  return metrics[key];
}

// Summed glyph advances. opentype.js's own text shaping chokes on DM Sans's GSUB tables.
export const measure = (s, f, size) => {
  const fnt = font(f);
  let w = 0;
  for (const c of s) w += fnt.charToGlyph(c).advanceWidth;
  return (w * size) / fnt.unitsPerEm;
};
export const monoW = (size) => size * 0.6; // JetBrains Mono advance

export function wrap(s, f, size, maxW) {
  const out = [];
  let cur = '';
  for (const word of s.split(' ')) {
    const next = cur ? `${cur} ${word}` : word;
    if (measure(next, f, size) > maxW && cur) { out.push(cur); cur = word; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const n = (v) => +(+v).toFixed(2);

export class Doc {
  constructor(w, h, title) {
    this.w = w; this.h = h; this.title = title;
    this.body = []; this.css = []; this.defs = []; this.chars = {}; this.seen = new Set(); this.count = 0;
  }
  add(s) { this.body.push(s); return this; }
  def(s) { this.defs.push(s); return this; }
  once(key, css) { if (!this.seen.has(key)) { this.seen.add(key); this.css.push(css); } return this; }
  style(css) { this.css.push(css); return this; }
  uid(p = 'zg-') { return p + (++this.count).toString(36); }

  // Returns a <text> element and records the glyphs it needs for the font subset.
  t(s, x, y, { f = 'b4', size = 14, fill = T.text, anchor, ls, cls, op, style, stroke, sw } = {}) {
    this.use(f, s);
    const a = [`x="${n(x)}"`, `y="${n(y)}"`, `font-size="${size}"`, `fill="${fill}"`, `class="zg-${f}${cls ? ' ' + cls : ''}"`];
    if (anchor) a.push(`text-anchor="${anchor}"`);
    if (ls) a.push(`letter-spacing="${ls}"`);
    if (op !== undefined) a.push(`opacity="${op}"`);
    if (stroke) a.push(`stroke="${stroke}"`, `stroke-width="${sw ?? 1}"`);
    if (style) a.push(`style="${style}"`);
    return `<text ${a.join(' ')}>${esc(s)}</text>`;
  }
  text(...args) { return this.add(this.t(...args)); }

  // Records glyphs for text written by hand, such as a <textPath>.
  use(f, s) {
    const fnt = font(f);
    const set = (this.chars[f] ||= new Set());
    for (const c of s) {
      if (fnt.charToGlyphIndex(c) === 0 && c !== ' ') throw new Error(`Glyph "${c}" is missing from font ${f} (in "${s}")`);
      set.add(c);
    }
  }

  // Dark rounded panel plus a clip group. Pair with close().
  panel({ rx = 18, fill = T.panel, decor = true } = {}) {
    this.def(`<clipPath id="zg-clip"><rect width="${this.w}" height="${this.h}" rx="${rx}"/></clipPath>`);
    this.add(`<g clip-path="url(#zg-clip)"><rect width="${this.w}" height="${this.h}" fill="${fill}"/>`);
    if (decor) {
      this.def(`<pattern id="zg-grid" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".75" fill="${T.accent}" fill-opacity=".1"/></pattern><radialGradient id="zg-corner" cx="1" cy="0" r="1"><stop offset="0" stop-color="${T.accent}" stop-opacity=".16"/><stop offset=".6" stop-color="${T.accent}" stop-opacity="0"/></radialGradient><radialGradient id="zg-corner2" cx="0" cy="1" r="1"><stop offset="0" stop-color="${T.blue}" stop-opacity=".07"/><stop offset=".6" stop-color="${T.blue}" stop-opacity="0"/></radialGradient>`);
      this.add(`<rect width="${this.w}" height="${this.h}" fill="url(#zg-grid)"/><rect width="${this.w}" height="${Math.min(this.h, 300)}" fill="url(#zg-corner)"/><rect y="${Math.max(0, this.h - 300)}" width="${this.w}" height="${Math.min(this.h, 300)}" fill="url(#zg-corner2)"/>`);
    }
    this._rx = rx;
    return this;
  }
  close() {
    this.add(`</g><rect x=".5" y=".5" width="${this.w - 1}" height="${this.h - 1}" rx="${this._rx}" fill="none" stroke="${T.line}"/>`);
    return this;
  }

  async write(name) {
    const faces = await Promise.all(Object.entries(this.chars).map(async ([key, set]) => {
      const F = FONTS[key];
      const raw = fs.readFileSync(path.join(NM, F.file + '.woff2'));
      const sub = await subsetFont(raw, [...set].join('') + ' ', { targetFormat: 'woff2' });
      return `@font-face{font-family:${F.fam};font-weight:${F.w};src:url(data:font/woff2;base64,${sub.toString('base64')}) format("woff2")}`;
    }));
    const classes = Object.keys(this.chars).map((k) => `.zg-${k}{font-family:${FONTS[k].stack};font-weight:${FONTS[k].w}}`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img" aria-label="${esc(this.title)}">`
      + `<title>${esc(this.title)}</title><defs>${this.defs.join('')}<style>${faces.join('')}`
      + `text{white-space:pre}.zg-c{transform-box:fill-box;transform-origin:center}`
      + classes.join('') + this.css.join('')
      // Static fallback: with animation off, every element sits in its finished state.
      + `@media (prefers-reduced-motion:reduce){*{animation:none!important}.zg-motion{display:none}}`
      + `</style></defs>${this.body.join('')}</svg>\n`;
    fs.mkdirSync(ASSETS, { recursive: true });
    fs.writeFileSync(path.join(ASSETS, name), svg);
    return Buffer.byteLength(svg);
  }
}

// Section title in the portfolio's "// label" style. No numbering.
export function heading(d, title, { hint, x = 28, y = 48, size = 22, ghost } = {}) {
  // Oversized outlined word behind the title, for graphic weight.
  // On phones it would collide with a long title, so it only appears behind short ones.
  if (ghost && (d.w >= 500 || title.length <= 13)) d.text(ghost, d.w - 12, y + 26, { f: 'd7', size: d.w < 500 ? 62 : 104, fill: 'none', stroke: T.accent, sw: 1, op: 0.16, anchor: 'end', ls: -2 });
  d.text('//', x, y, { f: 'm5', size: size - 6, fill: T.red });
  d.text(title, x + 28, y, { f: 'd5', size, fill: T.text });
  if (hint) {
    const right = d.w - x;
    d.text(hint, right - 19, y - 1, { f: 'm4', size: 12, fill: T.faint, anchor: 'end' });
    d.add(arrow(right - 9, y - 6, T.accent));
  }
}

// Simple Icons logo, centred on (cx, cy).
export const logo = (ic, cx, cy, s, color, extra = '') => {
  const k = s / 24;
  return `<path transform="translate(${n(cx - s / 2)} ${n(cy - s / 2)}) scale(${n(k)})" d="${ic.path}" fill="${color}"${extra}/>`;
};

// A logo's real brand colour, lightened only as far as needed to read on near-black.
export function brand(ic, min = 4.2) {
  const lum = (c) => {
    const v = c.map((x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const rgb = [0, 2, 4].map((i) => parseInt(ic.hex.slice(i, i + 2), 16));
  const bg = lum([17, 26, 46]);
  let c = rgb;
  for (let t = 0; t <= 1; t += 0.05) {
    c = rgb.map((x) => Math.round(x + (255 - x) * t));
    if ((lum(c) + 0.05) / (bg + 0.05) >= min) break;
  }
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

// Small up-right arrow, drawn so it needs no glyph.
export const arrow = (cx, cy, color, s = 4.5) =>
  `<path d="M${n(cx - s)} ${n(cy + s)}L${n(cx + s)} ${n(cy - s)}M${n(cx - s + 1.5)} ${n(cy - s)}H${n(cx + s)}V${n(cy + s - 1.5)}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;

// Seamless swell layers: each is a periodic curve that slides by exactly one wavelength.
export function waves(d, layers) {
  const H = d.h, W = d.w;
  layers.forEach((L, i) => {
    const { lambda: l, amp: a, y, dur, fill = 0, stroke = 0.4, width = 1.25, rev, color = T.accent } = L;
    const half = l / 2;
    let p = `M0 ${y}Q${n(half / 2)} ${y - a} ${half} ${y}`;
    for (let x = l; x <= W + 2 * l; x += half) p += `T${n(x)} ${y}`;
    const area = `${p}V${H}H0Z`;
    const name = `zg-w${i}`;
    d.once(name, `@keyframes ${name}{from{transform:translateX(${rev ? -l : 0}px)}to{transform:translateX(${rev ? 0 : -l}px)}}.${name}{animation:${name} ${dur}s linear infinite}`);
    d.add(`<g class="${name}"><path d="${area}" fill="${color}" fill-opacity="${fill}"/><path d="${p}" fill="none" stroke="${color}" stroke-opacity="${stroke}" stroke-width="${width}"/></g>`);
  });
}

// Typing line: an overlay in the background colour slides off each phrase in character steps.
export function typer(d, { x, y, phrases, size = 17, fill = T.accent, bg = T.bg, slot = 4.2, f = 'm5' }) {
  const cw = monoW(size);
  const T_ = slot * phrases.length;
  const pct = (s) => n((s / T_) * 100);
  const maxW = Math.max(...phrases.map((p) => p.length)) * cw;
  const clip = d.uid('zg-tc');
  d.def(`<clipPath id="${clip}"><rect x="${n(x - 1)}" y="${n(y - size)}" width="${n(maxW + cw + 4)}" height="${n(size * 1.45)}"/></clipPath>`);
  d.once('zg-blink', `@keyframes zg-blink{0%,55%{opacity:1}56%,100%{opacity:.15}}.zg-blink{animation:zg-blink 1s linear infinite}`);
  d.add(`<g clip-path="url(#${clip})">`);
  phrases.forEach((p, i) => {
    const w = n(p.length * cw);
    const s0 = i * slot, a = s0 + 1.1, b = s0 + slot - 0.7, c = s0 + slot - 0.3, e = s0 + slot;
    const vis = `zg-v${i}`, ov = `zg-o${i}`;
    const lead = i === 0 ? `0%{opacity:1}` : `0%,${pct(s0)}%{opacity:0}${n(pct(s0) + 0.01)}%{opacity:1}`;
    const tail = i === phrases.length - 1 ? `100%{opacity:1}` : `${pct(e)}%{opacity:1}${n(pct(e) + 0.01)}%,100%{opacity:0}`;
    d.style(`@keyframes ${vis}{${lead}${tail}}.${vis}{animation:${vis} ${T_}s linear infinite;opacity:${i === 0 ? 1 : 0}}`);
    d.style(`@keyframes ${ov}{0%,${pct(s0)}%{transform:translateX(0);animation-timing-function:steps(${p.length},end)}${pct(a)}%,${pct(b)}%{transform:translateX(${w}px);animation-timing-function:linear}${pct(b) + 0.01}%{transform:translateX(${w}px);animation-timing-function:steps(${p.length},end)}${pct(c)}%,100%{transform:translateX(0)}}.${ov}{animation:${ov} ${T_}s linear infinite;transform:translateX(${w}px)}`);
    d.add(`<g class="${vis}">${d.t(p, x, y, { f, size, fill })}<g class="${ov}"><rect x="${n(x - 1)}" y="${n(y - size)}" width="${n(p.length * cw + cw + 4)}" height="${n(size * 1.45)}" fill="${bg}"/><rect class="zg-blink" x="${n(x + 1)}" y="${n(y - size * 0.86)}" width="${n(cw * 0.6)}" height="${n(size * 1.05)}" fill="${fill}"/></g></g>`);
  });
  d.add('</g>');
}

// Expanding ring used for live/pulse markers.
export function ping(d, x, y, { r = 3.5, color = T.accent, dur = 2.6, delay = 0, grow = 4 } = {}) {
  const key = `zg-ping${grow}`;
  d.once(key, `@keyframes ${key}{0%{transform:scale(1);opacity:.9}70%,100%{transform:scale(${grow});opacity:0}}`);
  return `<circle class="zg-c" cx="${n(x)}" cy="${n(y)}" r="${r}" fill="none" stroke="${color}" stroke-width="1.25" style="animation:${key} ${dur}s ease-out ${delay}s infinite;opacity:0"/>`;
}

