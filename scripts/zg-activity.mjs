// Regenerates the live activity card from real GitHub data, and syncs the README's
// alt text and table to match. Run daily by .github/workflows/zg-refresh.yml.
// Needs GITHUB_TOKEN. The Action's token sees what the public sees, which matches
// the contribution graph shown on the profile.
import fs from 'node:fs';
import { Doc, T, heading, README, n } from './zg-lib.mjs';

const LOGIN = 'gnosis1214';
const WEEKS = 16;
const token = process.env.GITHUB_TOKEN;
if (!token) { console.error('GITHUB_TOKEN is not set'); process.exit(1); }

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'zg-profile-activity' },
  body: JSON.stringify({ query: `query($l:String!){user(login:$l){contributionsCollection{totalCommitContributions contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`, variables: { l: LOGIN } }),
});
const json = await res.json();
if (!res.ok || json.errors) { console.error('GitHub API error', res.status, JSON.stringify(json.errors || json)); process.exit(1); }

const coll = json.data.user.contributionsCollection;
const cal = coll.contributionCalendar;
const days = cal.weeks.flatMap((w) => w.contributionDays);
const weeks = cal.weeks.slice(-WEEKS).map((w) => ({
  start: w.contributionDays[0].date,
  count: w.contributionDays.reduce((a, x) => a + x.contributionCount, 0),
}));
const stats = {
  total: cal.totalContributions,
  commits: coll.totalCommitContributions,
  activeDays: days.filter((x) => x.contributionCount > 0).length,
};
const peak = weeks.reduce((a, w) => (w.count > a.count ? w : a), weeks[0]);
const label = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

async function card(mobile) {
  const W = mobile ? 420 : 880, pad = mobile ? 18 : 28, H = mobile ? 392 : 366;
  const d = new Doc(W, H, `Activity: ${stats.total} contributions in the last 12 months, ${stats.commits} commits, ${stats.activeDays} active days.`);
  d.panel();
  heading(d, 'Activity', { x: pad });
  if (!mobile) d.text('refreshed daily by GitHub Actions', W - pad, 47, { f: 'm4', size: 12, fill: T.faint, anchor: 'end' });

  // Stat tiles: the numbers are the headline.
  const tiles = [[stats.total, 'Contributions, 12 months'], [stats.commits, 'Commits'], [stats.activeDays, 'Active days']];
  const gap = mobile ? 8 : 14, tw = (W - pad * 2 - gap * 2) / 3, ty = 68, th = mobile ? 92 : 80;
  tiles.forEach(([v, l], i) => {
    const x = pad + i * (tw + gap);
    d.add(`<rect x="${n(x)}" y="${ty}" width="${n(tw)}" height="${th}" rx="12" fill="${T.panel2}" stroke="${T.line}"/>`);
    d.text(String(v), x + 16, ty + 38, { f: 'd7', size: 30, fill: T.text });
    if (mobile) {
      const words = l === 'Contributions, 12 months' ? ['Contributions,', '12 months'] : [l];
      words.forEach((w, k) => d.text(w, x + 16, ty + 60 + k * 15, { f: 'b4', size: 12, fill: T.muted }));
    } else d.text(l, x + 16, ty + 62, { f: 'b4', size: 13, fill: T.muted });
  });

  // One series, one colour. Bars grow from a single baseline; only the peak is labelled.
  const chartTop = ty + th + 22;
  d.text(`Contributions per week, last ${WEEKS} weeks`, pad, chartTop + 8, { f: 'm4', size: 12, fill: T.muted });
  const base = H - 40, maxH = base - chartTop - 40;
  const band = (W - pad * 2) / weeks.length, bw = Math.min(24, band - (mobile ? 6 : 8));
  const max = Math.max(1, peak.count);
  d.style(`@keyframes zg-sweep{0%,18%,100%{opacity:1}9%{opacity:.55}}`);
  d.add(`<path d="M${pad} ${base}H${W - pad}" stroke="${T.line}"/>`);
  weeks.forEach((w, i) => {
    const x = pad + i * band + (band - bw) / 2;
    if (w.count === 0) {
      d.add(`<rect x="${n(x)}" y="${base - 2}" width="${n(bw)}" height="2" fill="${T.faint}" fill-opacity=".45"/>`);
      return;
    }
    const h = Math.max(6, (w.count / max) * maxH), y = base - h, r = Math.min(4, h / 2);
    d.add(`<path d="M${n(x)} ${n(base)}V${n(y + r)}Q${n(x)} ${n(y)} ${n(x + r)} ${n(y)}H${n(x + bw - r)}Q${n(x + bw)} ${n(y)} ${n(x + bw)} ${n(y + r)}V${n(base)}Z" fill="${T.accent}" style="animation:zg-sweep 8s linear ${n(i * 0.14)}s infinite"/>`);
    if (w === peak) d.text(String(w.count), x + bw / 2, y - 8, { f: 'm5', size: 13, fill: T.text, anchor: 'middle' });
  });
  d.text(label(weeks[0].start), pad, base + 22, { f: 'm4', size: 12, fill: T.faint });
  d.text('This week', W - pad, base + 22, { f: 'm4', size: 12, fill: T.faint, anchor: 'end' });
  d.close();
  await d.write(mobile ? 'zg-activity-mobile.svg' : 'zg-activity.svg');
}

await card(false);
await card(true);

// Keep the README's text version in step with the card.
if (fs.existsSync(README)) {
  const alt = `Activity: ${stats.total} contributions in the last 12 months, ${stats.commits} commits, ${stats.activeDays} active days. Busiest recent week: ${peak.count} contributions, week of ${label(peak.start)}.`;
  const rows = weeks.filter((w) => w.count > 0).map((w) => `| ${label(w.start)} | ${w.count} |`).join('\n') || '| No activity yet | 0 |';
  const block = `<!-- zg-activity:start -->
<picture>
  <source media="(max-width: 560px), (min-width: 768px) and (max-width: 1000px)" srcset="./assets/zg-activity-mobile.svg">
  <img src="./assets/zg-activity.svg" width="100%" alt="${alt}">
</picture>

<details>
<summary><code>$ zeno --activity --table</code></summary>

| Week of | Contributions |
| --- | --: |
${rows}

</details>
<!-- zg-activity:end -->`;
  const before = fs.readFileSync(README, 'utf8');
  const after = before.replace(/<!-- zg-activity:start -->[\s\S]*?<!-- zg-activity:end -->/, block);
  if (after !== before) fs.writeFileSync(README, after);
}
console.log(`Activity card written: ${JSON.stringify(stats)}, peak ${peak.count}`);
