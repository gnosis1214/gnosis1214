// A road cyclist seen side-on, facing right, with the road contact point at the origin.
// Pedalling is a short loop of pre-computed leg poses, swapped with CSS, so turning
// animation off simply leaves the first pose showing.
import { T, n } from './zg-lib.mjs';

const WHEEL_R = 9.2;
const REAR = [-15, -WHEEL_R], FRONT = [15, -WHEEL_R];
const BB = [-1.5, -8], HIP = [-8, -27.5];
const CRANK = 4.6, THIGH = 12.6, SHIN = 13.4;
const POSES = 8, PEDAL_S = 0.72;

// Two-link leg from hip to pedal, with the knee pointing forward.
function leg(theta) {
  const foot = [BB[0] + CRANK * Math.cos(theta), BB[1] + CRANK * Math.sin(theta)];
  const dx = foot[0] - HIP[0], dy = foot[1] - HIP[1];
  const dist = Math.min(Math.hypot(dx, dy), THIGH + SHIN - 0.01);
  const a = (THIGH * THIGH - SHIN * SHIN + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, THIGH * THIGH - a * a));
  const kx = HIP[0] + (a * dx) / dist + (h * dy) / dist;
  const ky = HIP[1] + (a * dy) / dist - (h * dx) / dist;
  return `M${HIP[0]} ${HIP[1]}L${n(kx)} ${n(ky)}L${n(foot[0])} ${n(foot[1])}`;
}

const wheel = ([cx, cy]) => {
  const s = WHEEL_R - 1.2, q = n(s * 0.707);
  return `<circle cx="${cx}" cy="${n(cy)}" r="${WHEEL_R}" fill="none" stroke="${T.muted}" stroke-width="1.7"/>`
    + `<g class="zg-c" style="animation:zg-whl .5s linear infinite"><circle cx="${cx}" cy="${n(cy)}" r="${n(s)}" fill="none"/>`
    + `<path d="M${n(cx - s)} ${n(cy)}H${n(cx + s)}M${cx} ${n(cy - s)}V${n(cy + s)}M${n(cx - q)} ${n(cy - q)}L${n(cx + q)} ${n(cy + q)}M${n(cx - q)} ${n(cy + q)}L${n(cx + q)} ${n(cy - q)}" stroke="${T.muted}" stroke-opacity=".5" stroke-width=".7"/></g>`
    + `<circle cx="${cx}" cy="${n(cy)}" r="1.2" fill="${T.muted}"/>`;
};

export function rider(d) {
  d.once('zg-ride', `@keyframes zg-whl{to{transform:rotate(360deg)}}@keyframes zg-leg{0%,12.4%{opacity:1}12.5%,100%{opacity:0}}@keyframes zg-spd{0%,100%{opacity:.1}50%{opacity:.75}}`);

  const legs = (offset, attrs) => {
    let out = '';
    for (let i = 0; i < POSES; i++) {
      const theta = (i / POSES) * Math.PI * 2 + offset;
      const delay = n(-(((POSES - i) % POSES) / POSES) * PEDAL_S);
      out += `<path d="${leg(theta)}" fill="none" ${attrs} stroke-linecap="round" stroke-linejoin="round" style="opacity:${i === 0 ? 1 : 0};animation:zg-leg ${PEDAL_S}s linear ${delay}s infinite"/>`;
    }
    return out;
  };

  const frame = `<g fill="none" stroke="${T.accent}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="M-8 -24L10 -24L${BB[0]} ${BB[1]}Z"/>`
    + `<path d="M-8 -24L${REAR[0]} ${n(REAR[1])}L${BB[0]} ${BB[1]}"/>`
    + `<path d="M10 -24L13 -15.5L${FRONT[0]} ${n(FRONT[1])}"/></g>`
    + `<g fill="none" stroke="${T.text}" stroke-linecap="round" stroke-linejoin="round"><path d="M-8 -24V-25.6" stroke-width="1.6"/><path d="M-11.6 -25.8H-4.8" stroke-width="2.4"/>`
    + `<path d="M10 -24L12.6 -27H16.4Q19.2 -27 18.8 -24.4Q18.5 -22.6 16.6 -22.6" stroke-width="1.6"/></g>`;

  const crank = `<g class="zg-c" style="animation:zg-whl ${PEDAL_S}s linear infinite"><circle cx="${BB[0]}" cy="${BB[1]}" r="${CRANK}" fill="none"/>`
    + `<path d="M${n(BB[0] - CRANK)} ${BB[1]}H${n(BB[0] + CRANK)}" stroke="${T.text}" stroke-width="1.5" stroke-linecap="round"/></g>`
    + `<circle cx="${BB[0]}" cy="${BB[1]}" r="2.5" fill="${T.panel}" stroke="${T.text}" stroke-width="1.2"/>`;

  const body = `<g fill="none" stroke="${T.text}" stroke-linecap="round" stroke-linejoin="round"><path d="M${HIP[0]} ${HIP[1]}Q0 -35.5 8 -38" stroke-width="3.4"/><path d="M8 -38L13 -32L16.6 -27" stroke-width="2.2"/><path d="M8 -38L11.5 -41.5" stroke-width="2.6"/></g>`
    + `<circle cx="12.6" cy="-43.4" r="3.5" fill="${T.text}"/><path d="M8.6 -43.8A4.2 4.2 0 0 1 16.6 -45.2L18 -44.2L16.4 -43.6Z" fill="${T.accent}"/>`;

  const speed = `<path d="M-27 -32h-9M-30 -22h-10M-27 -12h-8" stroke="${T.blush}" stroke-width="1.5" stroke-linecap="round" style="animation:zg-spd .9s ease-in-out infinite"/>`;

  return speed
    + legs(Math.PI, `stroke="${T.muted}" stroke-opacity=".6" stroke-width="2.4"`)
    + wheel(REAR) + wheel(FRONT) + frame + crank
    + legs(0, `stroke="${T.text}" stroke-width="2.8"`)
    + body;
}
