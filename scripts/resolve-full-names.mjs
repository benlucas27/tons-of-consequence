#!/usr/bin/env node
/**
 * Proposes full names for players still shown by initials ("PWA Mulder"), using Wikipedia's public API (which is made for
 * programs; we send an honest User-Agent and wait between requests). A name is only proposed when the article is a Test
 * cricketer's for the right country, the surname matches, and the first initial matches. Nothing is applied: it writes a
 * proposal for a person to read.
 *
 *   node scripts/resolve-full-names.mjs [limit]      -> docs/drafts/names-proposal.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from '../src/lib/dataset.js';
import { PLAYER_NAMES } from '../src/data/player-names.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const limit = Number(process.argv[2]) || Infinity;
const UA = 'TonsOfConsequence/1.0 (https://tons-of-consequence.vercel.app; ben@haveaplan.xyz)';
const API = 'https://en.wikipedia.org/w/api.php';
const CAT = { AUS: 'Australia', ENG: 'England', IND: 'India', SA: 'South Africa', NZ: 'New Zealand', PAK: 'Pakistan', SL: 'Sri Lanka', WI: 'West Indies', BAN: 'Bangladesh', ZIM: 'Zimbabwe', IRE: 'Ireland', AFG: 'Afghanistan' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (params) => {
  const res = await fetch(`${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  return res.json();
};

const people = new Map();
for (const c of ALL) if (c.name === c.player && !PLAYER_NAMES[c.player] && /^[A-Z]{1,4} /.test(c.name)) people.set(`${c.player}|${c.country}`, { player: c.player, country: c.country, hundreds: (people.get(`${c.player}|${c.country}`)?.hundreds || 0) + 1 });
const todo = [...people.values()].sort((a, b) => b.hundreds - a.hundreds).slice(0, limit);

const out = [];
for (const p of todo) {
  const parts = p.player.split(' ');
  const initials = parts[0];
  const surname = parts.slice(1).join(' ');
  let result = { ...p, proposal: null, why: 'no match' };
  try {
    const s = await get({ action: 'query', list: 'search', srsearch: `${surname} ${CAT[p.country] || ''} Test cricketer`, srlimit: '10' });
    const titles = (s.query?.search || []).map((x) => x.title);
    await sleep(400);
    if (titles.length) {
      const cats = await get({ action: 'query', prop: 'categories', titles: titles.join('|'), cllimit: 'max' });
      const found = [];
      for (const page of Object.values(cats.query?.pages || {})) {
        const names = (page.categories || []).map((x) => x.title);
        const testPlayer = names.some((n) => n.includes(`${CAT[p.country] || '@@'} Test cricketers`));
        const title = page.title.replace(/\s*\(.*\)$/, '');
        const tParts = title.split(' ');
        const strip = (x) => x.toLowerCase().replace(/^(de|van|du|le|der) /, '');
        const sameSurname = strip(tParts.slice(1).join(' ')) === strip(surname) || title.toLowerCase().endsWith(` ${surname.toLowerCase()}`);
        const sameInitial = tParts[0][0]?.toUpperCase() === initials[0];
        if (testPlayer && sameSurname && sameInitial) found.push({ title, page });
      }
      // two players with the same surname and first initial: the full initials (JF v JR) can tell them apart
      if (found.length > 1) {
        const exact = found.filter((f) => f.title.split(' ').slice(0, -1).map((g) => g[0].toUpperCase()).join('') === initials);
        if (exact.length === 1) found.splice(0, found.length, exact[0]);
      }
      if (found.length === 1) {
        const { title, page } = found[0];
        result = title === p.player ? { ...p, proposal: null, why: 'known by its initials on Wikipedia too, left as is' } : { ...p, proposal: title, why: 'Test cricketer article, same surname and first initial', source: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}` };
      } else if (found.length > 1) result = { ...p, proposal: null, why: `ambiguous: ${found.map((f) => f.title).join(', ')}` };
    }
  } catch (e) { result.why = `error: ${e.message}`; }
  out.push(result);
  await sleep(400);
}
fs.writeFileSync(path.join(root, 'docs/drafts/names-proposal.json'), JSON.stringify(out, null, 1));
console.log(`${out.length} players looked up, ${out.filter((x) => x.proposal).length} proposed.`);
for (const x of out.slice(0, 12)) console.log(`  ${x.player} (${x.country}, ${x.hundreds}): ${x.proposal || '-'} ${x.proposal ? '' : '(' + x.why + ')'}`);
