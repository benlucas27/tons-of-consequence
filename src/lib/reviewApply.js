/**
 * Applies approved items from the weekly review to the text of src/data/sample.js.
 *
 * Three kinds of item exist, and nothing else can be applied:
 *   add_innings    a finished hundred the site does not have yet (a whole row, estimated levers, plain story)
 *   settle_result  a row marked "live" whose Test has now finished
 *   set_featured   which innings the Latest century card shows (by id, or by refItem = the number of an add_innings item)
 *
 * Everything works on the file's text and returns new text, so it is easy to test and never needs a database.
 * New rows get the same automatic estimates the Cricsheet update gives (src/lib/heuristics.js), and a verdict is
 * produced afterwards by the usual build; an automatic row is a placeholder until it is scored properly.
 */
import { NATIONS, TEAM_NAME_TO_CODE, teamCodeFor } from './countries.js';
import { scoreLevers, writeStory, tagsFor } from './heuristics.js';
import { naturalKey } from './naturalKey.js';
import { canonicalPlayer } from '../data/name-aliases.js';

const RESULTS = new Set(['win', 'loss', 'draw', 'tie', 'live']);

// Same one-line style as the rest of the file: unquoted keys, JSON values.
export const obj = (o) => '{' + Object.entries(o).map(([k, v]) =>
  `${k}:${v && typeof v === 'object' && !Array.isArray(v) ? obj(v) : JSON.stringify(v)}`).join(',') + '}';

const num = (v) => Number.isInteger(v) && v >= 0;

function storyFor(row) {
  const name = row.fullName || row.player;
  const runs = `${row.runs}${row.notOut ? '*' : ''}`;
  const balls = row.balls ? ` off ${row.balls} balls` : '';
  if (row.matchResult === 'live') return `${name} made ${runs}${balls} against ${row.opponent} at ${row.venue} in ${row.year}. The match is still in progress.`;
  if (row.matchResult === 'tie') return `${name} made ${runs}${balls} against ${row.opponent} at ${row.venue} in ${row.year}. The match was tied.`;
  return writeStory({ ...row, player: name, inningsNumber: row.tags?.includes('Second Innings') ? 3 : 1 });
}

/** Checks an add_innings row and builds the dataset row, or throws a plain-English reason. */
export function buildRow(item, existing) {
  const r = item.row || {};
  const why = (m) => { throw new Error(m); };
  if (!r.player || typeof r.player !== 'string') why('no player name');
  if (!NATIONS[r.country]) why(`unknown country code ${r.country}`);
  if (!TEAM_NAME_TO_CODE[r.opponent]) why(`opponent "${r.opponent}" is not a Test team we know (use the full name, such as "South Africa")`);
  if (r.country === TEAM_NAME_TO_CODE[r.opponent]) why('batter and opponent are the same team');
  if (!num(r.runs) || r.runs < 100) why('runs must be 100 or more');
  if (!num(r.balls) || r.balls < 1) why('balls faced is missing');
  if (typeof r.notOut !== 'boolean') why('notOut must be true or false');
  if (!r.venue) why('no venue');
  if (!num(r.year) || r.year < 2026) why('year must be 2026 or later');
  if (!RESULTS.has(r.matchResult)) why(`result "${r.matchResult}" is not one of ${[...RESULTS].join(', ')}`);
  if (![1, 2, 3, 4].includes(r.inningsNumber)) why('inningsNumber must be 1 to 4');

  const player = canonicalPlayer(r.player);
  const probe = { player, year: r.year, runs: r.runs, opponent: r.opponent };
  const dup = existing.find((c) => naturalKey(c) === naturalKey(probe));
  if (dup) why(`already on the site as #${dup.id}`);

  const base = {
    id: existing.reduce((m, c) => Math.max(m, c.id), 0) + 1,
    player,
    ...(r.fullName ? { fullName: r.fullName } : {}),
    country: r.country,
    runs: r.runs,
    balls: r.balls,
    minutes: r.minutes ?? null,
    notOut: r.notOut,
    opponent: r.opponent,
    venue: r.venue,
    year: r.year,
    series: r.series || null,
    matchResult: r.matchResult,
    tags: tagsFor(r),
  };
  return {
    ...base,
    story: storyFor(base),
    culturalValidation: 45,
    levers: scoreLevers({ ...r, player }, teamCodeFor(r.opponent)),
  };
}

const idLine = (id) => new RegExp(`^  \\{id:${id},`);

function findLine(lines, id) {
  const i = lines.findIndex((l) => idLine(id).test(l));
  if (i < 0) throw new Error(`#${id} is not in the dataset`);
  return i;
}

/** Index just past the "}" that closes the "{" at `open`, skipping over quoted text. */
function closeBrace(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') { for (i++; i < s.length && s[i] !== '"'; i++) if (s[i] === '\\') i++; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return i + 1;
  }
  throw new Error('unbalanced braces in a dataset row');
}

/** Removes `featured:true,spotlight:{...}` (and one neighbouring comma) from a row's text. */
export function unfeature(line) {
  const key = 'featured:true,spotlight:{';
  const at = line.indexOf(key);
  if (at < 0) return line;
  const end = closeBrace(line, at + key.length - 1);
  return line[end] === ',' ? line.slice(0, at) + line.slice(end + 1) : line.slice(0, at - (line[at - 1] === ',' ? 1 : 0)) + line.slice(end);
}

export function feature(line, { kicker, blurb }) {
  const at = line.lastIndexOf(',levers:{');
  if (at < 0) throw new Error('row has no levers to place the card before');
  return line.slice(0, at) + `,featured:true,spotlight:${obj({ kicker, blurb })}` + line.slice(at);
}

/**
 * @param {string} src  the text of src/data/sample.js
 * @param {object[]} items  the approved review items
 * @param {object[]} existing  the current rows (SAMPLE_CENTURIES), for ids and duplicate checks
 * @returns {{ src: string, done: string[], failed: {n:number, why:string}[] }}
 */
export function applyItems(src, items, existing) {
  const done = [];
  const failed = [];
  let text = src.trimEnd();
  if (!text.endsWith('];')) throw new Error('Unexpected end of sample.js; refusing to edit.');
  const rows = existing.map((c) => ({ ...c }));
  const addedByN = new Map(); // review item number -> the id its new row was given

  for (const item of items) {
    try {
      if (item.type === 'add_innings') {
        const row = buildRow(item, rows);
        text = text.slice(0, -2).trimEnd() + ',\n  ' + obj(row) + '\n];';
        rows.push(row);
        addedByN.set(item.n, row.id);
        done.push(`Added #${row.id}: ${row.fullName || row.player} ${row.runs}${row.notOut ? '*' : ''} v ${row.opponent}, ${row.venue} (${row.matchResult})`);
      } else if (item.type === 'settle_result') {
        if (!RESULTS.has(item.matchResult) || item.matchResult === 'live') throw new Error(`result "${item.matchResult}" is not a final result`);
        const lines = text.split('\n');
        const i = findLine(lines, item.id);
        const row = rows.find((c) => c.id === item.id);
        if (row.matchResult !== 'live') throw new Error(`#${item.id} is not marked in progress (it is "${row.matchResult}")`);
        if (row.culturalValidation === 45 && row.story === storyFor(row)) {
          // An automatic row: refresh its estimates and plain story for the real result.
          const next = { ...row, matchResult: item.matchResult };
          next.story = storyFor(next);
          next.levers = scoreLevers({ ...next, player: next.fullName || next.player, inningsNumber: next.tags?.includes('Second Innings') ? 3 : 1 }, teamCodeFor(next.opponent));
          lines[i] = '  ' + obj(next) + (lines[i].trimEnd().endsWith(',') ? ',' : '');
          rows[rows.indexOf(row)] = next;
        } else {
          if (!lines[i].includes('matchResult:"live"')) throw new Error(`#${item.id} has no in-progress marker to change`);
          lines[i] = lines[i].replace('matchResult:"live"', `matchResult:"${item.matchResult}"`);
          rows[rows.indexOf(row)] = { ...row, matchResult: item.matchResult };
        }
        text = lines.join('\n');
        done.push(`Settled #${item.id}: ${row.fullName || row.player} ${row.runs} v ${row.opponent} is now "${item.matchResult}"`);
      } else if (item.type === 'set_featured') {
        if (!item.kicker || !item.blurb) throw new Error('the card needs a kicker and a blurb');
        // The card may point at a hundred added by another item in the same review (refItem), or at an existing one (id).
        const id = item.refItem != null ? addedByN.get(item.refItem) : item.id;
        if (!id) throw new Error(item.refItem != null ? `item ${item.refItem} was not added, so the card has nothing to show` : 'no innings given for the card');
        const lines = text.split('\n');
        const target = findLine(lines, id);
        for (let i = 0; i < lines.length; i++) if (lines[i].includes('featured:true,spotlight:{')) lines[i] = unfeature(lines[i]);
        lines[target] = feature(lines[target], item);
        text = lines.join('\n');
        for (const c of rows) { delete c.featured; delete c.spotlight; }
        const row = rows.find((c) => c.id === id);
        row.featured = true;
        row.spotlight = { kicker: item.kicker, blurb: item.blurb };
        done.push(`Latest century card now shows #${id}: ${row.fullName || row.player} ${row.runs}`);
      } else {
        throw new Error(`unknown item type "${item.type}"`);
      }
    } catch (e) {
      failed.push({ n: item.n, why: e.message });
    }
  }
  return { src: text + '\n', done, failed };
}
