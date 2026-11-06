// Regenerates the live activity card from real GitHub data, and syncs the README's
// alt text and table to match. Run daily by .github/workflows/zg-refresh.yml.
// Needs GITHUB_TOKEN. The Action's token sees what the public sees, which matches
// the contribution graph shown on the profile.
import fs from 'node:fs';
import { Doc, T, heading, README, n } from './zg-lib.mjs';

const LOGIN = 'gnosis1214';
const token = process.env.GITHUB_TOKEN;
if (!token) { console.error('GITHUB_TOKEN is not set'); process.exit(1); }

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'zg-profile-activity' },
  body: JSON.stringify({ query: `query($l:String!){user(login:$l){contributionsCollection{totalCommitContributions contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`, variables: { l: LOGIN } }),
});
const json = await res.json();
if (!res.ok || json.errors) { console.error('GitHub API error', res.status, JSON.stringify(json.errors || json)); process.exit(1); }

const coll = json.data.user.contributionsCollection;
const cal = coll.contributionCalendar;
const days = cal.weeks.flatMap((w) => w.contributionDays);
const stats = {
  total: cal.totalContributions,
  commits: coll.totalCommitContributions,
  activeDays: days.filter((x) => x.contributionCount > 0).length,
};
const weekly = cal.weeks.map((w) => ({ start: w.contributionDays[0].date, count: w.contributionDays.reduce((a, x) => a + x.contributionCount, 0) }));
const peak = weekly.reduce((a, w) => (w.count > a.count ? w : a), weekly[0]);
const label = (iso, opts = { month: 'short', day: 'numeric' }) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });

// One hue, dark to light: a sequential scale for magnitude.
const LEVEL = { NONE: '#24201B', FIRST_QUARTILE: '#5A4A3A', SECOND_QUARTILE: '#8A7059', THIRD_QUARTILE: '#B0916F', FOURTH_QUARTILE: '#E8CDAE' };

// A small surfer riding the swell that rolls across the grid.
const SURFER = `<path d="M-15 -24Q0 -19 17 -30" fill="none" stroke="${T.accent}" stroke-width="3.6" stroke-linecap="round"/>`
  + `<g fill="none" stroke="${T.text}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M-6 -24L-8 -33L-1 -38L6 -34L7 -27"/><path d="M-1 -38L4 -47"/><path d="M4 -47L-8 -47M4 -47L14 -42"/></g><circle cx="7" cy="-52" r="3.3" fill="${T.text}"/>`
  + `<g fill="${T.accent}"><circle cx="-20" cy="-30" r="1.4" opacity=".8"/><circle cx="-25" cy="-25" r="1.1" opacity=".6"/><circle cx="-23" cy="-36" r="1" opacity=".45"/></g>`;

async function card(mobile) {
  const W = mobile ? 420 : 880, pad = mobile ? 18 : 28;
  const weeks = cal.weeks.slice(mobile ? -26 : -53);
  const pitch = (W - pad * 2) / weeks.length, cell = n(pitch - 2.5);
  const gridTop = 234, gridH = pitch * 7, H = Math.ceil(gridTop + gridH + 74);
  const d = new Doc(W, H, `Activity: ${stats.total} contributions in the last 12 months, ${stats.commits} commits, ${stats.activeDays} active days. A surfer rides a wave across the contribution grid.`);
  d.panel();
  heading(d, 'Activity', { x: pad, ghost: 'LIVE' });
  if (!mobile) d.text('refreshed daily by GitHub Actions', W - pad, 76, { f: 'm4', size: 12, fill: T.faint, anchor: 'end' });

  // Stat tiles: the numbers are the headline.
  const tiles = [[stats.total, 'Contributions, 12 months'], [stats.commits, 'Commits'], [stats.activeDays, 'Active days']];
  const gap = mobile ? 8 : 14, tw = (W - pad * 2 - gap * 2) / 3, ty = 88, th = mobile ? 92 : 80;
  tiles.forEach(([v, l], i) => {
    const x = pad + i * (tw + gap);
    d.add(`<rect x="${n(x)}" y="${ty}" width="${n(tw)}" height="${th}" rx="12" fill="${T.panel2}" stroke="${T.line}"/>`);
    d.text(String(v), x + 16, ty + 38, { f: 'd7', size: 30, fill: T.accent });
    if (mobile) {
      const words = l === 'Contributions, 12 months' ? ['Contributions,', '12 months'] : [l];
      words.forEach((w, k) => d.text(w, x + 16, ty + 60 + k * 15, { f: 'b4', size: 12, fill: T.muted }));
    } else d.text(l, x + 16, ty + 62, { f: 'b4', size: 13, fill: T.muted });
  });

  // Grid. Each week is a column that lifts as the swell passes.
  const period = 12, cross = 7, dt = cross / weeks.length;
  const lift = 0.07 * period;
  d.style(`@keyframes zg-rp{0%,14%,100%{transform:translateY(0)}7%{transform:translateY(-9px)}}`);
  weeks.forEach((w, c) => {
    const x = pad + c * pitch;
    let col = `<g style="animation:zg-rp ${period}s ease-in-out ${n(c * dt)}s infinite">`;
    w.contributionDays.forEach((day) => {
      const r = new Date(`${day.date}T00:00:00Z`).getUTCDay();
      col += `<rect x="${n(x)}" y="${n(gridTop + r * pitch)}" width="${cell}" height="${cell}" rx="2.5" fill="${LEVEL[day.contributionLevel] || LEVEL.NONE}"/>`;
    });
    d.add(col + '</g>');
  });

  // Swell and surfer, timed to the column lift.
  const x0 = pad + cell / 2, x1 = pad + (weeks.length - 1) * pitch + cell / 2;
  const endPct = n((cross / period) * 100);
  d.style(`@keyframes zg-sf{0%{transform:translateX(${n(x0)}px);opacity:0}2%{opacity:1}${n(endPct - 2)}%{opacity:1}${endPct}%,100%{transform:translateX(${n(x1)}px);opacity:0}}@keyframes zg-bb{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-3px) rotate(3deg)}}`);
  const parked = n(x0 + (x1 - x0) * 0.62);
  d.add(`<g transform="translate(0 ${gridTop - 3})"><g style="transform:translateX(${parked}px);animation:zg-sf ${period}s linear ${n(lift)}s infinite backwards">`
    + `<path d="M-84 0C-50 0 -34 -24 0 -24C34 -24 50 0 84 0Z" fill="${T.accent}" fill-opacity=".13"/><path d="M-84 0C-50 0 -34 -24 0 -24C34 -24 50 0 84 0" fill="none" stroke="${T.accent}" stroke-width="1.5"/>`
    + `<g style="animation:zg-bb 1.3s ease-in-out infinite">${SURFER}</g></g></g>`);

  // Month labels, thinned out so they never collide.
  let lastX = -99;
  let lastMonth = '';
  weeks.forEach((w, c) => {
    const month = label(w.contributionDays[0].date, { month: 'short' });
    const x = pad + c * pitch;
    if (month !== lastMonth && x - lastX > (mobile ? 42 : 34) && c < weeks.length - 1) {
      d.text(month, x, gridTop + gridH + 16, { f: 'm4', size: 11.5, fill: T.faint });
      lastX = x;
    }
    lastMonth = month;
  });

  // Caption and scale legend.
  const ly = gridTop + gridH + 42;
  d.text(mobile ? 'Last 26 weeks' : 'Contributions, last 12 months', pad, ly, { f: 'm4', size: 12, fill: T.muted });
  const levels = Object.values(LEVEL);
  const lx = W - pad - 28 - levels.length * 15;
  d.text('Less', lx - 8, ly, { f: 'm4', size: 11.5, fill: T.faint, anchor: 'end' });
  levels.forEach((c, i) => d.add(`<rect x="${lx + i * 15}" y="${ly - 10}" width="12" height="12" rx="2.5" fill="${c}"/>`));
  d.text('More', W - pad, ly, { f: 'm4', size: 11.5, fill: T.faint, anchor: 'end' });
  d.close();
  await d.write(mobile ? 'zg-activity-mobile.svg' : 'zg-activity.svg');
}

await card(false);
await card(true);

// Keep the README's text version in step with the card.
if (fs.existsSync(README)) {
  const alt = `Activity: ${stats.total} contributions in the last 12 months, ${stats.commits} commits, ${stats.activeDays} active days. Busiest week: ${peak.count} contributions, week of ${label(peak.start)}. A surfer rides a wave across the contribution grid.`;
  const rows = weekly.filter((w) => w.count > 0).map((w) => `| ${label(w.start)} | ${w.count} |`).join('\n') || '| No activity yet | 0 |';
  const block = `<!-- zg-activity:start -->
<p align="center">
  <picture>
    <source media="(max-width: 560px), (min-width: 768px) and (max-width: 1000px)" srcset="./assets/zg-activity-mobile.svg">
    <img src="./assets/zg-activity.svg" width="100%" alt="${alt}">
  </picture>
</p>

<details>
<summary><picture><img src="./assets/zg-cmd-table.svg" height="40" alt="$ zeno --activity --table. Click to see the numbers."></picture></summary>

| Week of | Contributions |
| --- | --: |
${rows}

</details>
<!-- zg-activity:end -->`;
  const before = fs.readFileSync(README, 'utf8');
  const after = before.replace(/<!-- zg-activity:start -->[\s\S]*?<!-- zg-activity:end -->/, () => block);
  if (after !== before) fs.writeFileSync(README, after);
}
console.log(`Activity card written: ${JSON.stringify(stats)}, peak ${peak.count}`);
