#!/usr/bin/env node
/**
 * RESEARCH VARIANT: for every hundred without a verdict (of batters who have one), reads the batter's Wikipedia centuries list for result, position, innings and Test number; writes JSON to --out. Original: Fills the gaps in match facts from Wikipedia's "List of international cricket centuries by <player>" pages, using
 * Wikipedia's public API (made for programs; honest User-Agent, one request a second). For each hundred it finds the
 * result for the batter's team, the batting position, the innings of the match, the Test number in the series and
 * whether it was home or away. Writes src/data/wikipedia-facts.js. It never overwrites a result we already have.
 *
 *   node scripts/fill-from-wikipedia-lists.mjs [--limit N] [--refresh]
 *
 * Responses are cached in a temp folder so a re-run only asks for what it has not seen. Do not point this at ESPNcricinfo.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from '../src/lib/dataset.js';
import { CONSEQUENCE } from '../src/data/consequence.js';
const withVerdict = new Set(ALL.filter((c) => CONSEQUENCE[c.id]).map((c) => c.name));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'TonsOfConsequence/1.0 (https://tonsofconsequence.com; ben@haveaplan.xyz)';
const API = 'https://en.wikipedia.org/w/api.php';
const cacheDir = path.join(os.tmpdir(), 'toc-wikipedia-lists');
fs.mkdirSync(cacheDir, { recursive: true });
const args = process.argv.slice(2);
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function get(params) {
  const wait = Math.max(0, 1000 - (Date.now() - last));
  if (wait) await sleep(wait);
  last = Date.now();
  const res = await fetch(`${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  return res.json();
}
const cached = async (key, fn) => {
  const f = path.join(cacheDir, key.replace(/[^a-z0-9]+/gi, '_') + '.json');
  if (fs.existsSync(f) && !args.includes('--refresh')) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const v = await fn();
  if (key.startsWith('list_')) return v;
  fs.writeFileSync(f, JSON.stringify(v));
  return v;
};

const CODE = { ENG: 'England', AUS: 'Australia', IND: 'India', SAF: 'South Africa', RSA: 'South Africa', WIN: 'West Indies', WI: 'West Indies', PAK: 'Pakistan', NZL: 'New Zealand', NZ: 'New Zealand', SRI: 'Sri Lanka', SL: 'Sri Lanka', ZIM: 'Zimbabwe', BAN: 'Bangladesh', AFG: 'Afghanistan', IRE: 'Ireland' };
const firstArg = (s) => s.replace(/\{\{\s*[a-z]+\s*\|([^|}]*)(?:\|[^}]*)?\}\}/gi, '$1');
const clean = (s) => s.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').trim();

/** Parses the Test table of one list page into rows. */
function parseTests(wikitext) {
  // the first data table under a heading about Tests (a legend table with no Score column is skipped)
  const heads = [...wikitext.matchAll(/\n==+\s*([^=\n]+?)\s*==+\s*\n/g)];
  let table = '';
  for (const h of heads) {
    if (!/test/i.test(h[1]) || /one day|odi|twenty|t20/i.test(h[1])) continue;
    let from = h.index;
    for (;;) {
      const st = wikitext.indexOf('\n{|', from);
      if (st < 0) break;
      const en = wikitext.indexOf('\n|}', st);
      const t = wikitext.slice(st, en);
      if (/!\s*(?:\{\{[^}]*\}\}|[^\n]*)?score/i.test(t) || /Score/i.test(t.split('\n|-')[0])) { table = t; break; }
      from = en;
    }
    if (table) break;
  }
  if (!table) return [];
  const parts = table.split(/\n\|-[^\n]*\n/);
  const header = parts[0].split('\n').filter((l) => l.startsWith('!')).flatMap((l) => l.replace(/^!\s*/, '').split('!!')).map((h) => firstArg(clean(h.replace(/^[^|]*\|(?!\|)/, '')).toLowerCase()));
  const col = (re) => header.findIndex((h) => re.test(h));
  const idx = { score: col(/score|runs/), opp: col(/against|opponent/), pos: col(/pos/), inn: col(/^inn|inn\./), test: col(/^test/), venue: col(/venue/), han: col(/h\/a/), date: col(/date/), result: col(/result/) };
  const rows = [];
  for (const raw of parts.slice(1)) {
    let t = raw.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '');
    const cells = t.split(/\n[|!]\s*|\|\|/).map((c) => c.replace(/^\s*\|?\s*/, '').replace(/^scope="row"\s*\|\s*/, '').trim()).filter((c) => c !== '');
    // cells: [No, Score, Against, Pos, Inn, Test?, Venue, H/A/N?, Date, Result]
    if (cells.length < 6) continue;
    const scoreCell = cells[1] || '';
    const m = /(\d{2,3})(\*?)/.exec(scoreCell.replace(/\{\{ntsh\|\d+\}\}/g, ''));
    if (!m) continue;
    const get = (i) => (i >= 0 ? cells[i] : undefined);
    const date = get(idx.date) || '';
    const year = /(\d{4})/.exec(date)?.[1];
    const resultText = (get(idx.result) || '').toLowerCase();
    const result = /won/.test(resultText) ? 'win' : /lost/.test(resultText) ? 'loss' : /draw/.test(resultText) ? 'draw' : /tie/.test(resultText) ? 'tie' : null;
    const oppCode = /\{\{cr\|(\w+)\}\}/i.exec(get(idx.opp) || '')?.[1]?.toUpperCase();
    rows.push({
      runs: Number(m[1]), notOut: m[2] === '*', year: Number(year), opponent: CODE[oppCode] || clean(get(idx.opp) || ''),
      pos: Number(clean(get(idx.pos) || '')) || null, inn: Number(clean(get(idx.inn) || '')) || null,
      test: /(\d+)\s*\/\s*(\d+)/.exec(clean(get(idx.test) || ''))?.slice(1, 3).join('/') || null,
      han: /home/i.test(get(idx.han) || '') ? 'H' : /away/i.test(get(idx.han) || '') ? 'A' : /neutral/i.test(get(idx.han) || '') ? 'N' : null,
      result,
    });
  }
  return rows;
}

const people = new Map();
for (const c of ALL) {
  if (CONSEQUENCE[c.id] || !withVerdict.has(c.name)) continue;
  const k = `${c.name}|${c.country}`;
  if (!people.has(k)) people.set(k, { name: c.name, rows: [] });
  people.get(k).rows.push(c);
}
const todo = [...people.values()].sort((a, b) => b.rows.length - a.rows.length).slice(0, limit);

const facts = {};
let noPage = 0, matched = 0, unmatched = 0;
for (const p of todo) {
  let wt;
  try {
    const surname = p.name.split(' ').slice(-1)[0].toLowerCase();
    const okTitle = (v) => v && v.title.toLowerCase().includes(surname);
    wt = await cached(`list_${p.name}`, async () => null);
    if (!okTitle(wt)) {
      const exact = `List of international cricket centuries by ${p.name}`;
      wt = await cached(`list2_${p.name}`, async () => {
        try {
          const page = await get({ action: 'parse', page: exact, prop: 'wikitext', redirects: '1' });
          return page.parse ? { title: page.parse.title, wikitext: page.parse.wikitext['*'] } : null;
        } catch { return null; }
      });
      if (!okTitle(wt)) {
        // many biographies carry their own "Test centuries" table
        wt = await cached(`bio_${p.name}`, async () => {
          try {
            const page = await get({ action: 'parse', page: p.name, prop: 'wikitext', redirects: '1' });
            return page.parse ? { title: page.parse.title, wikitext: page.parse.wikitext['*'] } : null;
          } catch { return null; }
        });
        if (!okTitle(wt)) wt = null;
      }
    }
  } catch (e) { console.log(`ERROR ${p.name}: ${e.message}`); continue; }
  if (!wt) { noPage += 1; continue; }
  const tests = parseTests(wt.wikitext);
  if (process.env.DEBUG_PLAYER === p.name) console.log(p.name, 'parsed', tests.length, JSON.stringify(tests.slice(0, 2)), 'ours', p.rows.slice(0, 3).map((c) => `${c.runs}${c.notOut ? '*' : ''} ${c.year} ${c.opponent}`));
  for (const c of p.rows) {
    let cands = tests.filter((t) => t.runs === c.runs && Math.abs(t.year - c.year) <= 1);
    if (cands.length > 1) { const exact = cands.filter((t) => t.year === c.year); if (exact.length) cands = exact; }
    if (cands.length > 1) { const same = cands.filter((t) => t.notOut === Boolean(c.notOut)); if (same.length) cands = same; }
    let t = cands.length === 1 ? cands[0] : cands.find((x) => x.opponent === c.opponent) || null;
    if (!t) { unmatched += 1; if (process.env.DEBUG_ALL) console.log('NOMATCH', p.name, c.runs + (c.notOut ? '*' : ''), c.year, c.opponent, '| parsed', tests.length, 'same runs:', tests.filter((x) => x.runs === c.runs).map((x) => x.runs + (x.notOut ? '*' : '') + ' ' + x.year).join(',')); if (process.env.DEBUG_PLAYER === p.name) console.log('no match for', c.runs, c.notOut, c.year, c.opponent, 'cands', cands.length, tests.filter((x) => x.runs === c.runs).map((x) => x.runs + (x.notOut ? '*' : '') + ' ' + x.year + ' ' + x.opponent)); continue; }
    if (!t.result) { unmatched += 1; continue; }
    matched += 1;
    facts[c.id] = [t.result, t.pos, t.inn, t.test, t.han];
  }
}
fs.writeFileSync(process.argv[process.argv.indexOf('--out') + 1], JSON.stringify(facts));
console.log(`${todo.length} players asked about: ${noPage} have no list page. ${matched} hundreds matched, ${unmatched} not matched.`);
