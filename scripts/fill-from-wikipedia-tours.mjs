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

async function searchTitles(q) {
  const f = path.join(cacheDir, 'search_' + q.replace(/[^a-z0-9]+/gi, '_') + '.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const wait = Math.max(0, 1000 - (Date.now() - last));
  if (wait) await sleep(wait);
  last = Date.now();
  let v = [];
  try {
    const res = await fetch(`${API}?${new URLSearchParams({ action: 'query', list: 'search', srsearch: q, srlimit: '6', format: 'json', origin: '*' })}`, { headers: { 'User-Agent': UA } });
    v = (await res.json()).query.search.map((x) => x.title);
  } catch { v = []; }
  fs.writeFileSync(f, JSON.stringify(v));
  return v;
}
const DEM = { England: 'English', Australia: 'Australian', India: 'Indian', 'South Africa': 'South African', 'West Indies': 'West Indian', Pakistan: 'Pakistani', 'New Zealand': 'New Zealand', 'Sri Lanka': 'Sri Lankan', Zimbabwe: 'Zimbabwean', Bangladesh: 'Bangladeshi', Ireland: 'Irish', Afghanistan: 'Afghan' };
const yy = (n) => String(n % 100).padStart(2, '0');
const season = (a) => ((a + 1) % 100 === 0 ? `${a}–${a + 1}` : `${a}–${yy(a + 1)}`);
const seasons = (Y) => [`${Y}`, season(Y), season(Y - 1)];

const ALIAS = { 'gqeberha': ['port elizabeth', 'st george', 'gqeberha'], bengaluru: ['bangalore', 'chinnaswamy', 'bengaluru'], chattogram: ['chittagong', 'chattogram', 'mdc ', 'zohur'], brabourne: ['brabourne', 'bombay', 'mumbai'], 'w.a.c.a': ['waca', 'perth', 'western australia cricket'], 'the oval': ['oval', 'kennington'], "lord's": ['lord'], 'eden gardens': ['eden', 'calcutta', 'kolkata'], wankhede: ['wankhede', 'bombay', 'mumbai'], brisbane: ['gabba', 'brisbane'], melbourne: ['melbourne', 'mcg'], sydney: ['sydney', 'scg'], 'port of spain': ['port of spain', "queen's park"], bridgetown: ['bridgetown', 'kensington'], kingston: ['kingston', 'sabina'], 'st john\'s': ["st john", 'antigua'], leeds: ['headingley', 'leeds'], nottingham: ['trent bridge', 'nottingham'], birmingham: ['edgbaston', 'birmingham'], manchester: ['old trafford', 'manchester'], chennai: ['chennai', 'madras', 'chepauk'], delhi: ['delhi', 'kotla'], 'cape town': ['newlands', 'cape town'], johannesburg: ['wanderers', 'johannesburg', 'ellis park'], durban: ['kingsmead', 'durban'], 'port elizabeth': ['port elizabeth', "st george"], wellington: ['basin reserve', 'wellington'], auckland: ['eden park', 'auckland'], christchurch: ['lancaster', 'hagley', 'jade', 'christchurch'], lahore: ['gaddafi', 'lahore'], karachi: ['national stadium', 'karachi'] };
const venueWords = (v) => {
  const k = v.toLowerCase();
  if (ALIAS[k]) return ALIAS[k];
  const base = k.replace(/\(.*\)/, '').replace(/[^a-z ]+/g, ' ').trim();
  return [base, ...base.split(' ').filter((w) => w.length >= 5)];
};

/** The Tests listed on a tour page: [{ venueText, winner: name | 'draw' | 'tie' }] in order. */
const CODES = { ENG: 'England', AUS: 'Australia', IND: 'India', SAF: 'South Africa', RSA: 'South Africa', WIN: 'West Indies', WI: 'West Indies', PAK: 'Pakistan', NZL: 'New Zealand', NZ: 'New Zealand', SRI: 'Sri Lanka', SL: 'Sri Lanka', ZIM: 'Zimbabwe', BAN: 'Bangladesh', AFG: 'Afghanistan', IRE: 'Ireland' };
const stem = (n) => (/west ind/i.test(n) ? 'west ind' : n.toLowerCase().replace(/(ia|a|d)$/, ''));
function parseTests(wt, teamNames) {
  const tests = [];
  const CR = /\{\{\s*(?:cr|cr-rt|crw?|flagicon|flag)[^|}]*\|\s*([^|}]*?)\s*(?:\|[^}]*)?\}\}/gi;
  const strip = (t) => t.replace(CR, (m, x) => CODES[x.trim().toUpperCase()] || x).replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/'{2,3}/g, '');
  const resultOf = (txt) => {
    const t = strip(txt).toLowerCase();
    if (/tied/.test(t) && !/won/.test(t)) return 'tie';
    if (/drawn|draw\b/.test(t) && !/won by/.test(t)) return 'draw';
    const m = /([a-z ]+?)\s+won/.exec(t);
    if (m) return teamNames.find((n) => m[1].includes(stem(n))) || null;
    return null;
  };
  // only boxes whose nearest heading is about a Test count (county and other tour matches use the same boxes)
  const heads = [...wt.matchAll(/\n(={2,4})\s*([^=\n]+?)\s*\1(?=\s*\n)/g)].map((m) => ({ at: m.index, name: m[2] }));
  const underTest = (pos) => {
    let near = null;
    for (const h of heads) { if (h.at > pos) break; near = h; }
    return near ? /\btest\b|tests\b/i.test(near.name) && !/tour|first-class|county|warm/i.test(near.name) : false;
  };
  const starts = [...wt.matchAll(/\{\{\s*(?:Two-innings cricket match|Cricket scorebox|Test cricket match|Test match|Cricket match summary)/gi)].map((m) => m.index);
  for (let k = 0; k < starts.length; k++) {
    const at = starts[k];
    if (!underTest(at)) continue;
    const body = wt.slice(at, starts[k + 1] ?? wt.length);
    const venue = /\|\s*(?:venue|location|stadium|ground)\s*=\s*([^\n]*)/i.exec(body)?.[1] || '';
    const res = /\|\s*result\s*=\s*([^\n]*)/i.exec(body)?.[1] || '';
    const r = resultOf(res);
    // innings in the order they were played: team1 bats first; a team marked f/o followed on
    const SUMMARY = { '1-1': 'score1', '1-2': 'score1_2nd', '2-1': 'score2', '2-2': 'score2_2nd' }; // the "Cricket match summary" template: totals only, no top scorers
    const cell = (name, t, i) => new RegExp(`\\|\\s*${name}-team${t}-inns${i}\\s*=\\s*([^\\n]*)`, 'i').exec(body)?.[1] || (name === 'score' ? new RegExp(`\\|\\s*${SUMMARY[`${t}-${i}`]}\\s*=\\s*([^\\n]*)`, 'i').exec(body)?.[1] || '' : '');
    const total = (txt) => { const m = /(\d+)(?:\/(\d+))?/.exec(strip(txt).replace(/\(.*?\)/g, '')); if (!m) return null; const x = Number(m[1]), y = m[2] == null ? null : Number(m[2]); return y != null && x <= 10 && y > x ? y : x; }; // '8/342' and '342/8' both mean 342 runs
    const order = [[1, 1], [2, 1], [1, 2], [2, 2]];
    const fo = /f\/o|follow-?on/i;
    const swap = [1, 2].find((t) => fo.test(cell('score', t, 2)));
    const seq = swap ? [[1, 1], [2, 1], [swap, 2], [swap === 1 ? 2 : 1, 2]] : order;
    const inns = seq.map(([t, i], k) => ({ no: k + 1, team: t, total: total(cell('score', t, i)), runsText: strip(cell('runs', t, i)).toLowerCase() }));
    const mm = /(innings and )?(\d+)\s+(runs|wickets?)/i.exec(strip(res));
    const margin = mm ? (mm[1] ? 'i' : mm[3].toLowerCase().startsWith('run') ? 'r' : 'w') + mm[2] : null;
    const ds = strip(/\|\s*date\s*=\s*([^\n]*)/i.exec(body)?.[1] || '');
    const dm = /(\d{1,2})/.exec(ds), mon = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i.exec(ds);
    const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const start = dm && mon ? String(MONTHS.indexOf(mon[1].toLowerCase()) + 1).padStart(2, '0') + String(dm[1]).padStart(2, '0') : null; // MMDD of the first day
    const teamOf = (n) => { const raw = new RegExp(`\\|\\s*team${n}\\s*=\\s*([^\\n]*)`, 'i').exec(body)?.[1] || ''; const code = /\{\{\s*cr[^|}]*\|\s*([A-Za-z]{2,3})\s*[|}]/i.exec(raw)?.[1]; return { code: code ? code.toUpperCase() : null, text: strip(raw).replace(/\|\s*$/, '').toLowerCase() }; };
    tests.push({ venueText: strip(venue).toLowerCase(), winner: r, inns, margin, start, t1: teamOf(1), t2: teamOf(2) }); // winner null when the box has no readable result
  }
  if (!tests.some((t) => t.winner)) {
    tests.length = 0;
    for (const line of wt.split('\n')) {
      if (!/^\*/.test(line) || !/\d(?:st|nd|rd|th)\s+Test/i.test(line)) continue;
      const at = /\bat\s+(.*?)\s*(?:&ndash;|–|—|\s-\s)\s*(.*)$/i.exec(line);
      if (!at) continue;
      const r = resultOf(at[2]);
      if (r) tests.push({ venueText: strip(at[1]).toLowerCase(), winner: r });
    }
  }
  if (!tests.some((t) => t.winner)) {
    // older Ashes articles: a heading per Test, then a bold line such as '''Australia (346 and 368) drew with England (372 and 282 for seven wickets).'''
    tests.length = 0;
    const nums = (txt) => txt.split(/\band\b/).map((p) => { const m = /(\d+)/.exec(p); return m ? Number(m[1]) : null; });
    let head = '';
    for (const line of wt.split('\n')) {
      const h = /^={2,4}\s*(.*?Test.*?)\s*={2,4}\s*$/.exec(line);
      if (h) { head = strip(h[1]); continue; }
      const m = /^'''\s*([A-Za-z ]+?)\s*\(([^)]*)\)\s+(beat|defeated|drew with|tied with|lost to)\s+([A-Za-z ]+?)\s*\(([^)]*)\)\s*([^']*?)\.?\s*'''/.exec(line.replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1'));
      if (!m || !head) continue;
      const [, t1, s1, verb, t2, s2, rest] = m;
      const a1 = nums(s1), b1 = nums(s2);
      const seq = [];
      for (let k = 0; k < 2; k++) { if (a1[k] != null) seq.push({ team: 1, total: a1[k] }); if (b1[k] != null) seq.push({ team: 2, total: b1[k] }); }
      const winner = verb === 'drew with' ? 'draw' : verb === 'tied with' ? 'tie' : verb === 'lost to' ? teamNames.find((n) => t2.toLowerCase().includes(stem(n))) : teamNames.find((n) => t1.toLowerCase().includes(stem(n)));
      const mm = /(innings and )?(\d+)\s+(runs|wickets?)/i.exec(rest);
      const at = /Test at\s+(.*?)(?:,\s*\d|$)/i.exec(head);
      const dm = /(\d{1,2})(?:[–-]\d{1,2})?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.exec(head.replace(/&ndash;/g, '–'));
      const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      tests.push({ venueText: (at ? at[1] : head).toLowerCase(), winner: winner || null, inns: seq.map((x, k) => ({ no: k + 1, team: x.team, total: x.total, runsText: '' })), margin: mm ? (mm[1] ? 'i' : mm[3].toLowerCase().startsWith('run') ? 'r' : 'w') + mm[2] : null, start: dm ? String(MONTHS.indexOf(dm[2].toLowerCase()) + 1).padStart(2, '0') + String(dm[1]).padStart(2, '0') : null, t1: { code: null, text: t1.toLowerCase() }, t2: { code: null, text: t2.toLowerCase() } });
    }
  }
  // the same Test sometimes appears twice in a row (a summary box and a full one)
  return tests.filter((t, i) => !(i > 0 && tests[i - 1].venueText === t.venueText && tests[i - 1].winner === t.winner));
}

if (process.env.DEBUG_TITLE) { const wt = await page(process.env.DEBUG_TITLE); const t = parseTests(wt, (process.env.DEBUG_TEAMS || '').split(',')); console.log(JSON.stringify(t.map((x) => ({ ...x, inns: (x.inns || []).map((i) => [i.no, i.team, i.total, i.runsText.slice(0, 40)]) })), null, 0)); process.exit(0); }
const teamName = (c) => NATIONS[c.country] || c.country;
const validate = args.includes('--validate'); // test the method on hundreds whose result we already know
const isKnown = (c) => ['win', 'draw', 'loss', 'tie'].includes(c.matchResult);
// unknown results are filled; known pre-2006 results are checked too, and a disagreement is reported so it can be corrected
const unknown = ALL.filter((c) => (validate ? isKnown(c) && c.year < 2006 : !isKnown(c) || c.year < 2006) && c.opponent !== 'ICC World XI');
const combos = new Map();
for (const c of unknown) {
  const pair = [teamName(c), c.opponent].sort().join(' v ');
  const k = `${pair}|${c.year}`;
  if (!combos.has(k)) combos.set(k, { a: teamName(c), b: c.opponent, year: c.year, rows: [] });
  combos.get(k).rows.push(c);
}
const facts = {};
const sources = {}; // id -> the Wikipedia tour page the result and series came from
let vtotal = 0, vagree = 0;
let found = 0, missing = 0, noTests = 0, matched = 0, ambiguous = 0;
for (const cb of [...combos.values()].slice(0, limit)) {
  let pending = [...cb.rows];
  const cand = {};
  let anyTour = false;
  outer: for (const [vis, host] of [[cb.a, cb.b], [cb.b, cb.a], [cb.a, 'the United Arab Emirates'], [cb.b, 'the United Arab Emirates']]) {
    const ashes = (vis === 'England' && host === 'Australia') || (vis === 'Australia' && host === 'England');
    const cands = [];
    for (const s of seasons(cb.year)) { cands.push(`${DEM[vis] || vis} cricket team in ${host} in ${s}`); if (ashes) cands.push(`${s} Ashes series`); }
    if (!cands.some((t) => fs.existsSync(path.join(cacheDir, t.replace(/[^a-z0-9]+/gi, '_') + '.json')) && fs.readFileSync(path.join(cacheDir, t.replace(/[^a-z0-9]+/gi, '_') + '.json'), 'utf8') !== 'null')) {
      // no tour page under the usual names (a tour of two or three countries is titled "... in India and Sri Lanka in 1978–79"): ask Wikipedia's search
      for (const s of seasons(cb.year)) {
        const found = await searchTitles(`${DEM[vis] || vis} cricket team in ${host} ${s}`);
        for (const t of found) if (new RegExp(`cricket team in .*${host.replace(/^the /, '')}.* in ${s.replace('–', '[–-]')}$`, 'i').test(t) && new RegExp(`^${DEM[vis] || vis}`, 'i').test(t)) cands.push(t);
      }
    }
    for (const title of [...new Set(cands)]) {
      const wt = await page(title);
      if (!wt || !/Test/.test(wt)) continue;
      const tests = parseTests(wt, [cb.a, cb.b]);
      if (!tests.some((t) => t.winner)) continue;
      anyTour = true;
      const m = tests.length;
      const still = [];
      for (const c of pending) {
        const words = venueWords(c.venue);
        let idx = tests.map((t, i) => (words.some((w) => w && t.venueText.includes(w)) ? i : -1)).filter((i) => i >= 0);
        if (idx.length > 1) {
          // two Tests at the same ground (or two grounds in one city): the one whose box lists this batter and score is the one
          const sur0 = c.name.split(' ').slice(-1)[0].toLowerCase().replace(/[^a-z]/g, '');
          const withHit = idx.filter((i) => (tests[i].inns || []).some((x) => x.runsText.includes(sur0) && new RegExp(`\\b${c.runs}\\b`).test(x.runsText)));
          if (withHit.length === 1) idx = withHit;
          else {
            // otherwise keep the Tests where his side has an innings that could hold the score (total and top scorer both at least his runs)
            const me0 = teamName(c);
            const can = (t) => { const mine = t.inns || []; if (!mine.length) return true; const sideIs = (x) => x && ((x.code && CODES[x.code] === me0) || (x.text && x.text.includes(stem(me0)))); const side = sideIs(t.t1) ? 1 : sideIs(t.t2) ? 2 : null; return side ? mine.some((x) => x.team === side && x.total != null && x.total >= c.runs && (x.runsText === '' || (Number((/(\d+)/.exec(x.runsText) || [])[1]) || 0) >= c.runs)) : true; };
            const feas = idx.filter((i) => can(tests[i]));
            if (feas.length >= 1 && feas.length < idx.length) idx = feas;
            const specific = ({ ssc: ['sinhalese'], rps: ['premadasa'], pss: ['saravanamuttu', 'p. sara'], ccc: ['colombo cricket club'] })[(/\((\w+)\)/.exec(c.venue) || [])[1]?.toLowerCase()];
            if (idx.length > 1 && specific) { const sp = idx.filter((i) => specific.some((w) => tests[i].venueText.includes(w))); if (sp.length >= 1) idx = sp; }
          }
        }
        if (idx.length > 1 && idx.every((k) => tests[k].winner && tests[k].winner === tests[idx[0]].winner)) {
          // we cannot tell which of the Tests at this ground it was, but every one of them had the same result: that much is safe to record
          (cand[c.id] ||= []).push({ title, tests, i: idx[0], m: tests.length, yearOk: true, listed: false, ambig: true });
          still.push(c); continue;
        }
        if (idx.length !== 1) { if (idx.length > 1) { ambiguous += 1; if (process.env.DEBUG_AMBIG) console.log('AMBIG', c.venue, c.year, c.opponent, idx.map((i) => tests[i].venueText).join(' | ')); } still.push(c); continue; }
        const i = idx[0];
        if (!tests[i].winner) { still.push(c); continue; }
        { // a southern-summer season spans two years; some rows carry the season's first year for a January Test. Collect every season's candidate and choose below.
          const ym = /(?:in |^)(\d{4})(?:[–-]\d{2,4})?(?: Ashes series)?$/.exec(title); const st = tests[i].start;
          let yearOk = true;
          if (ym && st) { const two = /(?:in |^)\d{4}[–-]/.test(title); const ty = two ? (Number(st.slice(0, 2)) >= 7 ? Number(ym[1]) : Number(ym[1]) + 1) : Number(ym[1]); yearOk = ty === c.year; }
          const sur1 = c.name.split(' ').slice(-1)[0].toLowerCase().replace(/[^a-z]/g, '');
          const listed = (tests[i].inns || []).some((x) => x.runsText.includes(sur1) && new RegExp(`\\b${c.runs}\\b`).test(x.runsText));
          (cand[c.id] ||= []).push({ title, tests, i, m, yearOk, listed });
          still.push(c);
        }
      }
      pending = still;
    }
  }
  // choose each hundred's Test: the one whose box lists him on that score, then the one in the right year, then the first found
  for (const c of cb.rows) {
    const list = cand[c.id];
    if (!list || !list.length) continue;
    const best = list.find((x) => x.listed) || list.find((x) => x.yearOk && !x.ambig) || list.find((x) => !x.ambig) || list[0];
    const { title, tests, i, m } = best;
    if (best.ambig) { // result only
      const w0 = tests[i].winner, me0 = teamName(c);
      sources[c.id] = title;
      facts[c.id] = [w0 === me0 ? 'win' : w0 === 'draw' ? 'draw' : w0 === 'tie' ? 'tie' : 'loss', null, m, null, 0, null, null, null, null, null];
      matched += 1; continue;
    }
        const me = teamName(c);
        let mine = 0, theirs = 0, unreadable = false;
        for (const t of tests.slice(0, i)) { if (!t.winner) unreadable = true; else if (t.winner === me) mine += 1; else if (t.winner !== 'draw' && t.winner !== 'tie') theirs += 1; }
        const w = tests[i].winner;
        const result = w === me ? 'win' : w === 'draw' ? 'draw' : w === 'tie' ? 'tie' : 'loss';
        const lead = unreadable ? null : mine - theirs;
        const dead = lead !== null && Math.abs(lead) > m - i;
        if (validate) { vtotal += 1; if (result === c.matchResult) vagree += 1; else console.log('DISAGREE', c.id, c.name, c.runs, c.opponent, c.venue, c.year, 'ours', c.matchResult, 'wikipedia', result, title); continue; }
        // which innings of the Test, the team's total in it, and the lead when it began (from the match box's top scorers)
        let inn = null, tot = null, leadStart = null;
        const sur = c.name.split(' ').slice(-1)[0].toLowerCase().replace(/[^a-z]/g, '');
        const hit = (tests[i].inns || []).find((x) => x.runsText.includes(sur) && new RegExp(`\\b${c.runs}\\b`).test(x.runsText));
        let hit0 = hit, inferred = false;
        if ((!hit0 || process.env.VALIDATE_INF) && tests[i].inns?.length) {
          // his name is not among the top scorers: take his side's only innings where the top scorer made at least as many as he did
          const sideIs = (t) => t && ((t.code && CODES[t.code] === me) || (t.text && t.text.includes(stem(me))));
          const mySide = sideIs(tests[i].t1) ? 1 : sideIs(tests[i].t2) ? 2 : null;
          if (mySide) {
            const cands = tests[i].inns.filter((x) => x.team === mySide && x.total != null && x.total >= c.runs && (x.runsText === '' || (Number((/(\d+)/.exec(x.runsText) || [])[1]) || 0) >= c.runs));
            if (process.env.VALIDATE_INF) { if (hit) { global.vi = (global.vi || [0, 0, 0]); global.vi[0] += 1; if (cands.length === 1) { global.vi[1] += 1; if (cands[0] === hit) global.vi[2] += 1; else console.log('INF-WRONG', c.name, c.runs, c.year); } } }
            else if (cands.length === 1) { hit0 = cands[0]; inferred = true; }
          }
        }
        if (hit0) {
          inn = hit0.no; tot = hit0.total;
          const prior = tests[i].inns.filter((x) => x.no < hit0.no);
          if (prior.every((x) => x.total != null)) leadStart = prior.filter((x) => x.team === hit0.team).reduce((a, x) => a + x.total, 0) - prior.filter((x) => x.team !== hit0.team).reduce((a, x) => a + x.total, 0);
        }
        sources[c.id] = title;
        facts[c.id] = [result, i + 1, m, lead, dead ? 1 : 0, inn, tot, leadStart, tests[i].margin || null, tests[i].start || null];
    matched += 1;
  }
  if (anyTour) found += 1; else { missing += 1; if (process.env.DEBUG_MISSING) console.log('MISSING', cb.a, 'v', cb.b, cb.year, cb.rows.length); }
  for (const c of pending) if (process.env.DEBUG_NOVENUE) console.log('UNMATCHED', c.venue, c.year, c.opponent, c.runs);
}
if (process.env.VALIDATE_INF) console.log('inference check [had a name hit, inference gave one answer, agreed]:', global.vi);
if (validate) { console.log(`validation: ${vagree} of ${vtotal} agree with the known result`); process.exit(0); }
const ids = Object.keys(facts).map(Number).sort((a, b) => a - b);
fs.writeFileSync(path.join(root, 'src/data/series-facts.js'), `/** id -> [result for the batter's team, Test number in the series, Tests in the series, the batter's team's series lead going in (wins minus losses), 1 if the series was already decided, innings of the match, the team's total in that innings, the lead when it began, the margin as 'r120' runs, 'w5' wickets or 'i48' innings and runs, the first day of the Test as MMDD], from Wikipedia's tour pages (scripts/fill-from-wikipedia-tours.mjs). Generated: do not edit by hand. */\nexport const SERIES_FACTS = {\n${ids.map((id) => `  ${id}: ${JSON.stringify(facts[id])},`).join('\n')}\n};\n`);
fs.writeFileSync(path.join(root, 'src/data/series-sources.js'), `/** id -> the title of the Wikipedia tour page the result and series state came from (https://en.wikipedia.org/wiki/<title>). Generated by scripts/fill-from-wikipedia-tours.mjs: do not edit by hand. */\nexport const SERIES_SOURCES = ${JSON.stringify(Object.fromEntries(ids.map((id) => [id, sources[id]])))};\n`);
console.log(`${combos.size} team-pair-years (${Math.min(limit, combos.size)} tried): ${found} tour pages found, ${missing} not found. ${matched} hundreds matched to a Test (${ambiguous} ambiguous by ground). Wrote ${ids.length} rows.`);
