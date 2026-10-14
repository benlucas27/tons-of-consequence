/**
 * Turns the Hello Sport index (src/data/hello-sport-index.md, a table of timestamped moments) into the data the site
 * uses (src/data/hello-sport.js), tagging each moment to the innings it is about by checking our own database.
 *
 *   node scripts/build-hello-sport.mjs
 *
 * Add a row to the table in the markdown file, run this (the build runs it too), and the site picks it up.
 * It warns about anything it can't match or that disagrees with the database, but only fails if the table itself is broken.
 * Scores in the file are marked "(verify)": the site always shows the score from our database, never the host's.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from '../src/lib/dataset.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src/data/hello-sport-index.md');
const out = path.join(root, 'src/data/hello-sport.js');
const md = fs.readFileSync(src, 'utf8');

const clock = (t) => { const p = String(t).trim().split(':').map(Number); if (p.some(Number.isNaN)) return null; return p.reduce((a, n) => a * 60 + n, 0); };
const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const table = (header) => {
  const lines = md.split('\n');
  const i = lines.findIndex((l) => l.trim().toLowerCase().startsWith(header));
  if (i < 0) return [];
  const names = cells(lines[i]).map((n) => n.toLowerCase());
  const rows = [];
  for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j++) {
    const c = cells(lines[j]);
    rows.push(Object.fromEntries(names.map((n, k) => [n, c[k] ?? ''])));
  }
  return rows;
};

const warnings = [];
const warn = (m) => warnings.push(m);

// ---- the origin of "tons of consequence"
const originLines = md.slice(md.indexOf('## Origin'), md.indexOf('## Entries'));
const origin = [...originLines.matchAll(/^- \*\*([\d:]+)(?: - ([\d:]+))?\*\* -- (.+)$/gm)].map((m) => ({ start: clock(m[1]), end: m[2] ? clock(m[2]) : null, text: m[3].replace(/\*([^*]+)\*/g, '$1').trim() }));
const originWatch = /Watch: (https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})&t=(\d+)s)/.exec(originLines);
const originMeta = /Episode (#\d+), published ([^.]+?)\./.exec(originLines);

// ---- episodes reviewed
const episodes = Object.fromEntries(table('| episode | date | youtube id').map((r) => [r['youtube id'], { episode: r.episode, date: r.date, youtubeId: r['youtube id'], result: r.result }]));

// ---- resolving a moment to one innings in the database
const VENUES = { scg: 'Sydney', gabba: 'Brisbane', 'perth': 'Perth', mcg: 'Melbourne', 'adelaide': 'Adelaide', "lord's": "Lord's", 'oval': 'The Oval', headingley: 'Leeds', 'edgbaston': 'Birmingham', 'old trafford': 'Manchester', 'trent bridge': 'Nottingham', 'eden gardens': 'Eden Gardens' };
function resolve(m) {
  const candidates = ALL.filter((c) => c.name === m.player);
  if (!candidates.length) return { why: `no player called ${m.player} in the database` };
  const text = `${m.match} ${m.innings}`;
  const year = [...(m.match.match(/\b(19|20)\d{2}\b/g) || [])].pop();
  const runs = (m.innings.match(/\b(\d{2,3})\*?(?: off|\s|\(|$)/) || [])[1];
  let list = candidates;
  if (runs) list = list.filter((c) => c.runs === Number(runs));
  if (year && list.length > 1) list = list.filter((c) => c.year === Number(year));
  else if (year && list.length === 1 && list[0].year !== Number(year)) return { why: `${m.player} ${runs || ''} is from ${list[0].year}, not ${year}` };
  if (list.length > 1) {
    const hint = Object.entries(VENUES).find(([k]) => text.toLowerCase().includes(k));
    if (hint) list = list.filter((c) => (c.venue || '').includes(hint[1]));
  }
  if (!runs && !year) return { why: 'no score or year to go on' };
  if (list.length === 1) return { id: list[0].id, row: list[0] };
  return { why: list.length ? `${list.length} innings fit` : 'no innings fits' };
}

const moments = [];
for (const [n, r] of table('| player | innings').entries()) {
  const linkM = /v=([\w-]{11})&t=(\d+)s/.exec(r.link);
  if (!linkM) { warn(`row ${n + 1} (${r.player}, ${r.episode}): the link has no video id and start time`); continue; }
  const start = clock(r.start);
  if (start != null && start !== Number(linkM[2])) warn(`row ${n + 1} (${r.player}, ${r.episode}): start ${r.start} (${start}s) disagrees with the link (${linkM[2]}s); using the link`);
  const moment = {
    player: r.player, type: r.type, episode: r.episode, date: r.date, youtubeId: linkM[1], start: Number(linkM[2]), note: r.note,
    matchText: r.match === '--' ? null : r.match, inningsText: r.innings === '--' ? null : r.innings, inningsId: null,
  };
  if (r.type === 'innings' || r.type === 'historic') {
    const res = resolve(r);
    if (res.id) {
      moment.inningsId = res.id;
      const said = (r.innings.match(/\b(\d{2,3})\*?(?: off|\s|\(|$)/) || [])[1];
      if (said && Number(said) !== res.row.runs) warn(`row ${n + 1}: ${r.player} was said to have ${said} but the database has ${res.row.runs} (the site shows ${res.row.runs})`);
    } else warn(`row ${n + 1} (${r.player}, ${r.innings}): not tagged to an innings: ${res.why}`);
  }
  moments.push(moment);
}

const body = `/**
 * Moments in Hello Sport episodes where the hosts talk about a Test innings, tagged to innings in our database.
 * Generated by scripts/build-hello-sport.mjs from src/data/hello-sport-index.md: do not edit by hand.
 * \`inningsId\` is null when a moment isn't about one innings in the database (a career chat, a concept, or an innings
 * we couldn't match). Times are seconds into the YouTube version of the episode.
 */
export const ORIGIN = ${JSON.stringify({ episode: originMeta?.[1] || '#828', published: originMeta?.[2]?.trim() || null, youtubeId: originWatch?.[2] || null, start: originWatch ? Number(originWatch[3]) : null, points: origin }, null, 2)};
export const EPISODES = ${JSON.stringify(episodes, null, 2)};
export const MOMENTS = ${JSON.stringify(moments, null, 2)};
`;
fs.writeFileSync(out, body);
console.log(`wrote ${path.relative(root, out)}: ${moments.length} moments (${moments.filter((m) => m.inningsId).length} tagged to an innings), ${Object.keys(episodes).length} episodes, ${origin.length} origin points`);
for (const w of warnings) console.log('  warning: ' + w);
if (!moments.length || !origin.length) { console.error('The index table looks broken: nothing was read.'); process.exit(1); }
