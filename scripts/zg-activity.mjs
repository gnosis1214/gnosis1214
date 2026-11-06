// Regenerates the live activity card from real GitHub data, and syncs the README's
// alt text and table to match. Run hourly by .github/workflows/zg-refresh.yml.
// Needs GITHUB_TOKEN. The Action's token sees what the public sees, so private commits
// reach it only as restrictedContributionsCount, and only while the profile's
// "Private contributions" setting is on.
//
// GitHub always shows its own contribution grid on the profile, so this card must
// never be a second grid. It charts weekly totals as a climb with a cyclist riding it,
// and its figures are ones GitHub's section does not show.
import fs from 'node:fs';
import { Doc, T, heading, README, ASSETS, n } from './zg-lib.mjs';
import { rider } from './zg-rider.mjs';

const LOGIN = 'gnosis1214';
const token = process.env.GITHUB_TOKEN;
if (!token) { console.error('GITHUB_TOKEN is not set'); process.exit(1); }

// Commits are dated in the author's time zone (GMT+8), but GitHub's default range stops
// at today in UTC. From midnight to 8am in the Philippines that leaves new commits off
// the end of the calendar, so ask for a day ahead. The span must stay within a year.
const DAY = 86400000;
const to = new Date(Date.now() + DAY);
const from = new Date(to.getTime() - 365 * DAY);

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'zg-profile-activity' },
  body: JSON.stringify({ query: `query($l:String!,$from:DateTime!,$to:DateTime!){user(login:$l){contributionsCollection(from:$from,to:$to){totalCommitContributions restrictedContributionsCount contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`, variables: { l: LOGIN, from: from.toISOString(), to: to.toISOString() } }),
});
const json = await res.json();
if (!res.ok || json.errors) { console.error('GitHub API error', res.status, JSON.stringify(json.errors || json)); process.exit(1); }

const coll = json.data.user.contributionsCollection;
const cal = coll.contributionCalendar;

// A private profile can hide activity from the Action's token. Never replace a card
// that has real numbers with an empty one: keep the last good version instead.
if (cal.totalContributions === 0 && fs.existsSync(`${ASSETS}/zg-activity.svg`)) {
  console.log('GitHub returned no contributions, so the existing activity card was kept.');
  process.exit(0);
}

const days = cal.weeks.flatMap((w) => w.contributionDays);
const weekly = cal.weeks.map((w) => ({ start: w.contributionDays[0].date, count: w.contributionDays.reduce((a, x) => a + x.contributionCount, 0) }));
const peak = weekly.reduce((a, w) => (w.count > a.count ? w : a), weekly[0]);

let streak = 0, run = 0;
for (const x of days) { run = x.contributionCount > 0 ? run + 1 : 0; if (run > streak) streak = run; }
const stats = {
  total: cal.totalContributions,
  // Public commits plus the anonymised private count, which can also include any
  // private issues and pull requests.
  commits: coll.totalCommitContributions + coll.restrictedContributionsCount,
  activeDays: days.filter((x) => x.contributionCount > 0).length,
  streak,
  busiest: peak.count,
};
const label = (iso, opts = { month: 'short', day: 'numeric' }) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });

// Monotone cubic through the weekly points: smooth like a road profile, but it never
// overshoots, so the curve can't suggest a value the data doesn't have.
function monotone(pts) {
  const c = pts.length, dx = [], m = [], t = [];
  for (let i = 0; i < c - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
  t[0] = m[0]; t[c - 1] = m[c - 2];
  for (let i = 1; i < c - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  let d = '';
  for (let i = 0; i < c - 1; i++) d += `C${n(pts[i][0] + dx[i] / 3)} ${n(pts[i][1] + (t[i] * dx[i]) / 3)} ${n(pts[i + 1][0] - dx[i] / 3)} ${n(pts[i + 1][1] - (t[i + 1] * dx[i]) / 3)} ${n(pts[i + 1][0])} ${n(pts[i + 1][1])}`;
  const at = (x) => {
    let i = 0;
    while (i < c - 2 && x > pts[i + 1][0]) i++;
    const h = dx[i], u = (x - pts[i][0]) / h;
    const a = 2 * u ** 3 - 3 * u ** 2 + 1, b = u ** 3 - 2 * u ** 2 + u, e = -2 * u ** 3 + 3 * u ** 2, f = u ** 3 - u ** 2;
    return a * pts[i][1] + b * h * t[i] + e * pts[i + 1][1] + f * h * t[i + 1];
  };
  return { d, at };
}

async function card(mobile) {
  const W = mobile ? 420 : 880, pad = mobile ? 18 : 28;
  const weeks = weekly.slice(mobile ? -9 : -12);
  const tiles = [[stats.commits, 'Commits'], [stats.activeDays, 'Active days'], [stats.streak, 'Longest streak, days'], [stats.busiest, 'Busiest week']];
  const cols = mobile ? 2 : 4, gap = mobile ? 8 : 14, tw = (W - pad * 2 - gap * (cols - 1)) / cols, th = mobile ? 72 : 80, ty = mobile ? 70 : 88;
  const tileRows = Math.ceil(tiles.length / cols);
  const tilesEnd = ty + tileRows * th + (tileRows - 1) * gap;
  const titleY = tilesEnd + 28, top = titleY + 34, base = top + (mobile ? 118 : 150), H = base + 82;

  const d = new Doc(W, H, `Activity: ${stats.commits} commits, ${stats.activeDays} active days, longest streak ${stats.streak} days, busiest week ${stats.busiest} contributions. A cyclist climbs an elevation profile charting contributions per week.`);
  d.panel();
  heading(d, 'Activity', { x: pad, ghost: 'RIDE' });
  if (!mobile) d.text('refreshed hourly by GitHub Actions', W - pad, 76, { f: 'm4', size: 12, fill: T.faint, anchor: 'end' });

  tiles.forEach(([v, l], i) => {
    const x = pad + (i % cols) * (tw + gap), y = ty + Math.floor(i / cols) * (th + gap);
    d.add(`<rect x="${n(x)}" y="${y}" width="${n(tw)}" height="${th}" rx="12" fill="${T.panel2}" stroke="${T.line}"/>`);
    d.text(String(v), x + 16, y + (mobile ? 34 : 38), { f: 'd7', size: mobile ? 26 : 30, fill: T.accent });
    d.text(l, x + 16, y + (mobile ? 55 : 62), { f: 'b4', size: mobile ? 12.5 : 13, fill: T.muted });
  });

  d.text(`Contributions per week, last ${weeks.length} weeks`, pad, titleY, { f: 'm4', size: 12, fill: T.muted });

  // One series, one colour. Height is proportional to that week's count, from the road line.
  const pitch = (W - pad * 2) / (weeks.length - 1);
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const pts = weeks.map((w, i) => [pad + i * pitch, base - (w.count / max) * (base - top)]);
  const curve = monotone(pts);
  const first = pts[0], last = pts[pts.length - 1];
  const line = `M0 ${n(first[1])}L${n(first[0])} ${n(first[1])}${curve.d}L${W} ${n(last[1])}`;
  const peakIdx = weeks.reduce((best, w, i) => (w.count > weeks[best].count ? i : best), 0);

  // Night sky, a warm glow behind the summit and distant ridges. Decoration only:
  // drawn behind the data, far darker than it, and not to scale.
  d.def(`<linearGradient id="zg-sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.accent}" stop-opacity=".42"/><stop offset="1" stop-color="${T.accent}" stop-opacity=".05"/></linearGradient><radialGradient id="zg-cr"><stop offset="0" stop-color="${T.red}" stop-opacity=".3"/><stop offset="1" stop-color="${T.red}" stop-opacity="0"/></radialGradient>`);
  d.add(`<circle cx="${n(pts[peakIdx][0])}" cy="${n(pts[peakIdx][1])}" r="${mobile ? 130 : 210}" fill="url(#zg-cr)"/>`);
  let seed = 23;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  d.once('zg-tw', '@keyframes zg-tw{0%,100%{opacity:.15}50%{opacity:.9}}');
  for (let i = 0; i < (mobile ? 24 : 46); i++) {
    const sx = n(pad + rnd() * (W - pad * 2)), sy = n(titleY + 12 + rnd() * (base - titleY - 40)), sr = n(0.5 + rnd() * 0.8);
    const live = i % 4 === 0 ? ` style="animation:zg-tw ${n(2.5 + rnd() * 4)}s ease-in-out ${n(rnd() * 3)}s infinite"` : ' opacity=".35"';
    d.add(`<circle cx="${sx}" cy="${sy}" r="${sr}" fill="${T.text}"${live}/>`);
  }
  const ridge = (height, step, fill) => {
    let p = `M0 ${base}`;
    for (let x = 0; x <= W + step; x += step) p += `L${n(x)} ${n(base - height * (0.35 + rnd() * 0.65))}`;
    return `<path d="${p}L${W + step} ${base}Z" fill="${fill}"/>`;
  };
  d.add(ridge((base - top) * 0.6, mobile ? 46 : 70, '#160D1C') + ridge((base - top) * 0.34, mobile ? 34 : 52, '#1D0F20'));

  // The climb, with contour echoes beneath it. Only the top line carries the data.
  d.add(`<path d="${line}L${W} ${base}L0 ${base}Z" fill="url(#zg-sw)"/>`);
  d.def(`<clipPath id="zg-und"><path d="${line}L${W} ${base}L0 ${base}Z"/></clipPath>`);
  d.add(`<g clip-path="url(#zg-und)" fill="none" stroke="${T.accent}">${[[9, 0.3], [18, 0.2], [28, 0.12], [40, 0.07]].map(([o, a]) => `<path d="${line}" transform="translate(0 ${o})" stroke-opacity="${a}"/>`).join('')}</g>`);

  // Ground and road sit below the chart's zero line, so they can't read as data.
  const roadTop = base + 30, kerbTop = H - 12, roadMid = n((roadTop + kerbTop) / 2);
  d.style('@keyframes zg-dsh{to{transform:translateX(-34px)}}@keyframes zg-krb{to{transform:translateX(-28px)}}');
  d.add(`<rect y="${base}" width="${W}" height="${H - base}" fill="#0A0A13"/><rect y="${roadTop}" width="${W}" height="${kerbTop - roadTop}" fill="#16141F"/>`);
  d.add(`<g style="animation:zg-dsh 1.1s linear infinite"><path d="M0 ${roadMid}H${W + 40}" stroke="${T.blush}" stroke-opacity=".75" stroke-width="2" stroke-dasharray="18 16"/></g>`);
  let kerb = '';
  for (let x = -14; x < W + 56; x += 28) kerb += `M${x} ${H}l6 -12h14l-6 12z`;
  d.add(`<rect y="${kerbTop}" width="${W}" height="12" fill="${T.cta}"/><g style="animation:zg-krb 1.1s linear infinite"><path d="${kerb}" fill="${T.text}"/></g>`);
  d.add(`<path d="${line}" fill="none" stroke="${T.accent}" stroke-width="2.5" stroke-linejoin="round"/>`);

  // Only the busiest week gets a number and the summit flag.
  if (weeks[peakIdx].count > 0) {
    const [px, py] = pts[peakIdx];
    const onRight = px < W / 2;
    d.style('@keyframes zg-flg{0%,100%{transform:scaleX(1) skewY(0)}50%{transform:scaleX(.8) skewY(7deg)}}');
    d.add(`<path d="M${n(px)} ${n(py - 3)}V${n(py - 29)}" stroke="${T.text}" stroke-width="1.5" stroke-linecap="round"/><path d="M${n(px)} ${n(py - 29)}l15 5l-15 5z" fill="${T.accent}" style="transform-box:fill-box;transform-origin:left center;animation:zg-flg 1.3s ease-in-out infinite"/>`);
    d.add(`<circle cx="${n(px)}" cy="${n(py)}" r="4.5" fill="${T.text}" stroke="${T.panel}" stroke-width="2"/>`);
    d.text(String(weeks[peakIdx].count), px + (onRight ? 12 : -12), py + 5, { f: 'm5', size: 13, fill: T.text, anchor: onRight ? 'start' : 'end' });
  }

  // Sparse month labels on the verge, kept clear of "This week".
  let lastX = -99, lastMonth = '';
  weeks.forEach((w, i) => {
    const month = label(w.start, { month: 'short' });
    const x = pts[i][0];
    if (month !== lastMonth && x - lastX > 44 && x < W - pad - 96) {
      d.text(month, x, base + 19, { f: 'm4', size: 11.5, fill: T.muted, anchor: 'middle' });
      lastX = x;
    }
    lastMonth = month;
  });
  d.text('This week', W - pad, base + 19, { f: 'm4', size: 11.5, fill: T.muted, anchor: 'end' });

  // The cyclist rides the real curve. Both wheels sample the road, which sets the lean,
  // and the lean is capped so a steep week still reads as a climb.
  const scale = mobile ? 1.1 : 1.3, reach = 15 * scale;
  const period = 14, travel = 0.72, N = 48;
  const x0 = first[0], x1 = last[0];
  const pose = (x) => {
    const a = curve.at(Math.max(x - reach, x0)), b = curve.at(Math.min(x + reach, x1));
    const ang = Math.max(-40, Math.min(40, (Math.atan2(b - a, 2 * reach) * 180) / Math.PI));
    return `translate(${n(x)}px,${n((a + b) / 2)}px) rotate(${n(ang)}deg)`;
  };
  let frames = '';
  for (let i = 0; i <= N; i++) frames += `${n((i / N) * travel * 100)}%{transform:${pose(x0 + ((x1 - x0) * i) / N)}}`;
  const endPct = n(travel * 100);
  d.style(`@keyframes zg-rd{${frames}100%{transform:${pose(x1)}}}@keyframes zg-rf{0%{opacity:0}2%{opacity:1}${n(endPct - 1)}%{opacity:1}${n(endPct + 3)}%,100%{opacity:0}}`);
  d.add(`<g style="animation:zg-rf ${period}s linear infinite"><g style="transform:${pose(x0 + (x1 - x0) * 0.55)};animation:zg-rd ${period}s linear infinite"><g transform="scale(${scale})">${rider(d)}</g></g></g>`);

  d.close();
  await d.write(mobile ? 'zg-activity-mobile.svg' : 'zg-activity.svg');
}

await card(false);
await card(true);

// Keep the README's text version in step with the card.
if (fs.existsSync(README)) {
  const alt = `Activity: ${stats.commits} commits, ${stats.activeDays} active days, longest streak ${stats.streak} days. Busiest week: ${peak.count} contributions, week of ${label(peak.start)}. A cyclist climbs an elevation profile charting contributions per week.`;
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
console.log(`Activity card written: ${JSON.stringify(stats)}`);
