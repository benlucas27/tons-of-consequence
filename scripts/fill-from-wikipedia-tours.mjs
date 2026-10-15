#!/usr/bin/env node
/**
 * Finds the result of the Test behind each hundred that still has no result, and the state of the series going in, from
 * Wikipedia's "<Visitors> cricket team in <Hosts> in <season>" pages (public API, honest User-Agent, one request a second).
 * It reads the Test list on each tour page (a bullet list or the two-innings match boxes), matches each hundred to its Test
 * by ground, and works out the series score before the Test and whether the series was already decided.
 * Writes src/data/series-facts.js. Never overwrites a known result. Do not point this at ESPNcricinfo.
 *
 *   node scripts/fill-from-wikipedia-tours.mjs [--limit N]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from '../src/lib/dataset.js';
import { NATIONS } from '../src/lib/countries.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'TonsOfConsequence/1.0 (https://tonsofconsequence.com; ben@haveaplan.xyz)';
const API = 'https://en.wikipedia.org/w/api.php';
const cacheDir = path.join(os.tmpdir(), 'toc-wikipedia-tours');
fs.mkdirSync(cacheDir, { recursive: true });
const args = process.argv.slice(2);
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function page(title) {
  const f = path.join(cacheDir, title.replace(/[^a-z0-9]+/gi, '_') + '.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const wait = Math.max(0, 1000 - (Date.now() - last));
  if (wait) await sleep(wait);
  last = Date.now();
  let v = null;
  try {
    const res = await fetch(`${API}?${new URLSearchParams({ action: 'parse', format: 'json', prop: 'wikitext', page: title, redirects: '1', origin: '*' })}`, { headers: { 'User-Agent': UA } });
    const j = await res.json();
    v = j.parse ? j.parse.wikitext['*'] : null;
  } catch { v = null; }
  fs.writeFileSync(f, JSON.stringify(v));
  return v;
}

const DEM = { England: 'English', Australia: 'Australian', India: 'Indian', 'South Africa': 'South African', 'West Indies': 'West Indian', Pakistan: 'Pakistani', 'New Zealand': 'New Zealand', 'Sri Lanka': 'Sri Lankan', Zimbabwe: 'Zimbabwean', Bangladesh: 'Bangladeshi', Ireland: 'Irish', Afghanistan: 'Afghan' };
const yy = (n) => String(n % 100).padStart(2, '0');
const season = (a) => ((a + 1) % 100 === 0 ? `${a}–${a + 1}` : `${a}–${yy(a + 1)}`);
const seasons = (Y) => [`${Y}`, season(Y), season(Y - 1)];

const ALIAS = { 'w.a.c.a': ['waca', 'perth'], 'the oval': ['oval', 'kennington'], "lord's": ['lord'], 'eden gardens': ['eden', 'calcutta', 'kolkata'], wankhede: ['wankhede', 'bombay', 'mumbai'], brisbane: ['gabba', 'brisbane'], melbourne: ['melbourne', 'mcg'], sydney: ['sydney', 'scg'], 'port of spain': ['port of spain', "queen's park"], bridgetown: ['bridgetown', 'kensington'], kingston: ['kingston', 'sabina'], 'st john\'s': ["st john", 'antigua'], leeds: ['headingley', 'leeds'], nottingham: ['trent bridge', 'nottingham'], birmingham: ['edgbaston', 'birmingham'], manchester: ['old trafford', 'manchester'], chennai: ['chennai', 'madras', 'chepauk'], delhi: ['delhi', 'kotla'], 'cape town': ['newlands', 'cape town'], johannesburg: ['wanderers', 'johannesburg', 'ellis park'], durban: ['kingsmead', 'durban'], 'port elizabeth': ['port elizabeth', "st george"], wellington: ['basin reserve', 'wellington'], auckland: ['eden park', 'auckland'], christchurch: ['lancaster', 'hagley', 'jade', 'christchurch'], lahore: ['gaddafi', 'lahore'], karachi: ['national stadium', 'karachi'] };
const venueWords = (v) => {
  const k = v.toLowerCase();
  if (ALIAS[k]) return ALIAS[k];
  const base = k.replace(/\(.*\)/, '').replace(/[^a-z ]+/g, ' ').trim();
  return [base, ...base.split(' ').filter((w) => w.length >= 5)];
};

/** The Tests listed on a tour page: [{ venueText, winner: name | 'draw' | 'tie', date? }] in order. */
function parseTests(wt, teamNames) {
  const tests = [];
  const resultOf = (txt) => {
    const t = txt.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/'''|''/g, '').toLowerCase();
    if (/tied|tie\b/.test(t) && !/won/.test(t)) return 'tie';
    if (/drawn|draw\b/.test(t) && !/won by/.test(t)) return 'draw';
    const m = /([a-z ]+?)\s+won/.exec(t);
    if (m) { const name = teamNames.find((n) => m[1].includes(n.toLowerCase())); return name || null; }
    return null;
  };
  // format B: two-innings match boxes
  const boxes = wt.split(/\{\{\s*(?:Two-innings cricket match|Cricket scorebox|Test cricket match)/i).slice(1);
  if (boxes.length) {
    for (const b of boxes) {
      const body = b.slice(0, b.indexOf('\n}}') > 0 ? b.indexOf('\n}}') : b.length);
      const venue = /\|\s*(?:venue|location)\s*=\s*([^\n]*)/i.exec(body)?.[1] || '';
      const res = /\|\s*result\s*=\s*([^\n]*)/i.exec(body)?.[1] || '';
      const r = resultOf(res);
      if (r) tests.push({ venueText: venue.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').toLowerCase(), winner: r });
    }
    if (tests.length) return tests;
  }
  // format A: "* 1st Test at [[Ground]] – X won by ..."
  for (const line of wt.split('\n')) {
    if (!/^\*/.test(line) || !/\d(?:st|nd|rd|th)\s+Test/i.test(line)) continue;
    const at = /\bat\s+(.*?)\s*(?:&ndash;|–|—|\s-\s)\s*(.*)$/i.exec(line);
    if (!at) continue;
    const r = resultOf(at[2]);
    if (r) tests.push({ venueText: at[1].replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').toLowerCase(), winner: r });
  }
  return tests;
}

const teamName = (c) => NATIONS[c.country] || c.country;
const unknown = ALL.filter((c) => !['win', 'draw', 'loss', 'tie'].includes(c.matchResult) && c.opponent !== 'ICC World XI');
const combos = new Map();
for (const c of unknown) {
  const pair = [teamName(c), c.opponent].sort().join(' v ');
  const k = `${pair}|${c.year}`;
  if (!combos.has(k)) combos.set(k, { a: teamName(c), b: c.opponent, year: c.year, rows: [] });
  combos.get(k).rows.push(c);
}
const facts = {};
let found = 0, missing = 0, noTests = 0, matched = 0, ambiguous = 0;
for (const cb of [...combos.values()].slice(0, limit)) {
  let tour = null;
  for (const [vis, host] of [[cb.a, cb.b], [cb.b, cb.a]]) {
    for (const s of seasons(cb.year)) {
      const title = `${DEM[vis] || vis} cricket team in ${host} in ${s}`;
      const wt = await page(title);
      if (wt && /Test/.test(wt)) {
        const tests = parseTests(wt, [cb.a, cb.b]);
        if (tests.length) { tour = { title, tests }; break; }
      }
    }
    if (tour) break;
  }
  if (!tour) { missing += 1; continue; }
  found += 1;
  const m = tour.tests.length;
  for (const c of cb.rows) {
    const words = venueWords(c.venue);
    const idx = tour.tests.map((t, i) => (words.some((w) => w && t.venueText.includes(w)) ? i : -1)).filter((i) => i >= 0);
    if (idx.length !== 1) { if (idx.length > 1) ambiguous += 1; continue; }
    const i = idx[0];
    const me = teamName(c);
    let mine = 0, theirs = 0;
    for (const t of tour.tests.slice(0, i)) { if (t.winner === me) mine += 1; else if (t.winner !== 'draw' && t.winner !== 'tie') theirs += 1; }
    const w = tour.tests[i].winner;
    const result = w === me ? 'win' : w === 'draw' ? 'draw' : w === 'tie' ? 'tie' : 'loss';
    const lead = mine - theirs;
    const dead = Math.abs(lead) > m - i;
    facts[c.id] = [result, i + 1, m, lead, dead ? 1 : 0];
    matched += 1;
  }
}
const ids = Object.keys(facts).map(Number).sort((a, b) => a - b);
fs.writeFileSync(path.join(root, 'src/data/series-facts.js'), `/** id -> [result for the batter's team, Test number in the series, Tests in the series, the batter's team's series lead going in (wins minus losses), 1 if the series was already decided], from Wikipedia's tour pages (scripts/fill-from-wikipedia-tours.mjs). Generated: do not edit by hand. */\nexport const SERIES_FACTS = {\n${ids.map((id) => `  ${id}: ${JSON.stringify(facts[id])},`).join('\n')}\n};\n`);
console.log(`${combos.size} team-pair-years (${Math.min(limit, combos.size)} tried): ${found} tour pages found, ${missing} not found. ${matched} hundreds matched to a Test (${ambiguous} ambiguous by ground). Wrote ${ids.length} rows.`);
