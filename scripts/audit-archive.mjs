/**
 * Audits the ranking dataset against Cricsheet's ball-by-ball archive and reports what needs cleaning up.
 *
 *   node scripts/audit-archive.mjs <folder>              # a local folder of extracted match JSON files
 *   node scripts/audit-archive.mjs --download            # fetch the archive itself
 *   node scripts/audit-archive.mjs --download --markdown # the same, as a report (used by the monthly update)
 *
 * It reads and reports; it never changes the dataset. The first line of the markdown report is
 * `<!-- findings: N -->`, where N is the number of things a person needs to look at (name mismatches,
 * possibly missing centuries and result disagreements). The backlog counts (initials, hundreds the archive
 * lacks) are shown but are not "findings", because they are not new problems each month.
 */
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { hundredsIn } from '../src/lib/matchContext.js';
import { ALL } from '../src/lib/dataset.js';
import { displayName } from '../src/lib/scoring.js';

const args = process.argv.slice(2);
const markdown = args.includes('--markdown');
const folder = args.find((a) => !a.startsWith('--'));

async function loadMatches() {
  if (args.includes('--download')) {
    const res = await fetch('https://cricsheet.org/downloads/tests_json.zip');
    if (!res.ok) throw new Error(`Cricsheet download failed: ${res.status}`);
    const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
    return zip.getEntries().filter((e) => e.entryName.endsWith('.json')).map((e) => JSON.parse(e.getData().toString('utf8')));
  }
  if (!folder) { console.error('usage: node scripts/audit-archive.mjs <folder> | --download [--markdown]'); process.exit(1); }
  return fs.readdirSync(folder).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8')));
}

const matches = (await loadMatches()).filter((m) => m.info?.gender === 'male');
const hundreds = matches.flatMap((m) => hundredsIn(m));
const lastMatch = matches.map((m) => m.info.dates?.[m.info.dates.length - 1] || '').sort().pop();

const find = (h) => {
  const full = displayName({ player: h.name });
  return ALL.find((c) => (c.player === h.name || c.name === h.name || c.name === full) && c.runs === h.runs && c.year === h.year && c.opponent === h.opponent);
};
const matched = [];
const variants = []; // archive hundred with a dataset row that is the same innings under another spelling
const missing = []; // archive hundred with nothing like it in the dataset
for (const h of hundreds) {
  const row = find(h);
  if (row) { matched.push({ h, row }); continue; }
  const near = ALL.find((c) => c.runs === h.runs && c.year === h.year && c.opponent === h.opponent && sharesAName(c.name, h.name));
  if (near) variants.push({ h, near }); else missing.push({ h });
}
// two spellings of one person share a name part of four letters or more ("Agha Salman" and "Salman Agha", "Liton Das" and "Litton Das")
function parts(s) { return String(s).toLowerCase().split(/\s+/).filter((p) => p.length >= 3); }
function sharesAName(a, b) {
  const pa = parts(a);
  return parts(b).some((q) => pa.some((p) => p === q || (p.length >= 4 && q.length >= 4 && (p.slice(0, 3) === q.slice(0, 3) && Math.abs(p.length - q.length) <= 1))));
}

const used = new Set(matched.map((m) => m.row.id));
const lacking = ALL.filter((c) => c.year >= 2006 && !used.has(c.id) && !variants.some((v) => v.near.id === c.id));

const disagreements = matched.filter(({ h, row }) => row.matchResult && row.matchResult !== 'unknown' && row.matchResult !== 'live' && row.matchResult !== h.result);
const canFill = matched.filter(({ row }) => !row.matchResult || row.matchResult === 'unknown');

const people = new Map();
for (const c of ALL) { const k = `${c.name}|${c.country}`; people.set(k, (people.get(k) || new Set()).add(c.player)); }
const twoNames = [...people.entries()].filter(([, s]) => s.size > 1);
const initials = ALL.filter((c) => c.name === c.player && /^[A-Z]{1,4} /.test(c.name));

const findings = variants.length + missing.length + disagreements.length;
const fmt = (h) => `${h.name} ${h.runs}${h.notOut ? '*' : ''}, ${h.year} v ${h.opponent}`;

const lines = [];
const out = (s = '') => lines.push(s);
out(`<!-- findings: ${findings} -->`);
out(`# Monthly data audit`);
out();
out(`Dataset against Cricsheet's ball-by-ball archive (${matches.length} men's Tests up to ${lastMatch}). ${hundreds.length} hundreds in the archive; ${matched.length} match the dataset exactly. **${findings} to look at.**`);
out();
out(`## Names that don't match (${variants.length})`);
out(`The same innings is spelled differently in the two sources, so joins miss it. Fix by storing Cricsheet's player ID on the row.`);
for (const { h, near } of variants) out(`- archive "${h.name}" is dataset "${near.name}" (${fmt(h)})`);
out();
out(`## Possibly missing from the dataset (${missing.length})`);
out(`In the archive but nothing like it in the dataset. Check against a scorecard and add if real.`);
for (const { h } of missing) out(`- ${fmt(h)} (${h.venue})`);
out();
out(`## Results that disagree (${disagreements.length})`);
out(`Same innings, different match result. Check against a scorecard.`);
for (const { h, row } of disagreements) out(`- ${fmt(h)}: dataset says ${row.matchResult}, archive says ${h.result} (id ${row.id})`);
out();
out(`## Results the archive could fill in (${canFill.length})`);
out(`Dataset rows with no result where the archive has one. \`node scripts/backfill-results.mjs\` can fill these.`);
out();
out(`## Backlog (not new each month)`);
out(`- ${lacking.length} hundreds from 2006 on are in the dataset but not in the archive (for example the matches Cricsheet withholds by policy, such as Afghanistan men's Tests, so new Afghan centuries are never added automatically).`);
out(`- ${twoNames.length} people appear under more than one name.`);
out(`- ${initials.length} hundreds are still shown by initials rather than a full name.`);

const report = lines.join('\n');
if (markdown) console.log(report);
else {
  console.log(report.replace(/^<!--.*-->\n/, '').replace(/^#+ /gm, '').replace(/`/g, ''));
}
