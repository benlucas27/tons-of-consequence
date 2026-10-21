#!/usr/bin/env node
/**
 * Writes the first two weeks of the X queue (social/x-queue.json): 3 posts a day, each a share card plus a short caption.
 * Captions carry no numbers and no verdicts: the numbers live on the card, which is drawn from the live data when it is
 * posted, so a ruling that changes later can never contradict the words. Posts carry no link (X charges more for them);
 * the card has the domain on it and the account bio has the link.
 *
 *   node scripts/build-x-queue.mjs          writes the file only if it does not exist yet
 *   node scripts/build-x-queue.mjs --force  overwrites it (this discards approvals)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BATTER_BY_SLUG } from '../src/lib/consequence.js';
import { rankAll, BY_ID } from '../src/lib/dataset.js';
import { DEFAULT_ORDER, PRESETS, formatOrder } from '../src/lib/scoring.js';
import { LAWS } from '../src/lib/laws.js';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../social/x-queue.json');
if (fs.existsSync(out) && !process.argv.includes('--force')) { console.log('social/x-queue.json already exists. Use --force to overwrite (this discards approvals).'); process.exit(0); }

const name = (slug) => { const b = BATTER_BY_SLUG.get(slug); if (!b) throw new Error(`No batter ${slug}`); return b.name; };
const last = (full) => full.split(' ').slice(-1)[0];
const pick = (list, i) => list[i % list.length];
const TAG = '#TestCricket';

const batterCaption = (slug, i) => pick([
  `How many of ${name(slug)}'s Test hundreds did the side actually need? Gold squares are tons of consequence: the ones that won or saved the match. ${TAG}`,
  `Every Test hundred by ${name(slug)}, sorted into the ones that mattered and the good tons that didn't change the result. Which one would you move? ${TAG}`,
  `${name(slug)}: a hundred is a ton of consequence only if it helped win or save the Test. Here's how the career looks. ${TAG}`,
], i);
const compareCaption = (slugs, i) => pick([
  `${slugs.map((s) => last(name(s))).join(' v ')}: whose hundreds did the team actually need? Gold = ton of consequence. ${TAG}`,
  `Same question, ${slugs.length} batters: how many of their Test hundreds won or saved the match? ${TAG}`,
], i);
const inningsCaption = (id, i) => {
  const c = BY_ID.get(id);
  return pick([
    `${c.name}'s ${c.runs}${c.notOut ? '*' : ''} v ${c.opponent} in ${c.year}. Did the side need it? The card shows the call and the reason. ${TAG}`,
    `${c.name}, ${c.runs}${c.notOut ? '*' : ''} v ${c.opponent}, ${c.year}: a great innings, but was it a ton of consequence? See the reason. ${TAG}`,
  ], i);
};
const rankingsCaption = (preset) => (preset === 'Default'
  ? `The greatest Test hundreds ever, ranked across six criteria. Change the order and the list changes. Which one is missing? ${TAG}`
  : `The greatest Test hundreds, the ${preset} way: ${PRESETS[preset].blurb} Same innings, different order. ${TAG}`);
const lawCaption = (n) => `Law ${n} of 13 for what makes a Test hundred a ton of consequence: ${LAWS[n - 1][0]}. Agree, or would you change it? ${TAG}`;

const top = rankAll(DEFAULT_ORDER).slice(0, 5).map((c) => c.id);
const presetParams = (p) => ({ type: 'rankings', ...(p === 'Default' ? {} : { o: formatOrder(PRESETS[p].order), ...(PRESETS[p].bias ? { bonus: PRESETS[p].bias } : {}) }) });

const A = [ // morning, India: batters and head-to-heads
  { card: { type: 'batter', b: 'virat-kohli' }, text: (i) => batterCaption('virat-kohli', i) },
  { card: { type: 'compare', b: 'virat-kohli,steve-smith,joe-root' }, text: (i) => compareCaption(['virat-kohli', 'steve-smith', 'joe-root'], i) },
  { card: { type: 'batter', b: 'sachin-tendulkar' }, text: (i) => batterCaption('sachin-tendulkar', i) },
  { card: { type: 'batter', b: 'rahul-dravid' }, text: (i) => batterCaption('rahul-dravid', i) },
  { card: { type: 'compare', b: 'sachin-tendulkar,ricky-ponting,brian-lara' }, text: (i) => compareCaption(['sachin-tendulkar', 'ricky-ponting', 'brian-lara'], i) },
  { card: { type: 'batter', b: 'yashasvi-jaiswal' }, text: (i) => batterCaption('yashasvi-jaiswal', i) },
  { card: { type: 'compare', b: 'steve-smith,joe-root,kane-williamson' }, text: (i) => compareCaption(['steve-smith', 'joe-root', 'kane-williamson'], i) },
  { card: { type: 'batter', b: 'rohit-sharma' }, text: (i) => batterCaption('rohit-sharma', i) },
  { card: { type: 'batter', b: 'travis-head' }, text: (i) => batterCaption('travis-head', i) },
  { card: { type: 'compare', b: 'sunil-gavaskar,sachin-tendulkar,virat-kohli' }, text: (i) => compareCaption(['sunil-gavaskar', 'sachin-tendulkar', 'virat-kohli'], i) },
  { card: { type: 'batter', b: 'cheteshwar-pujara' }, text: (i) => batterCaption('cheteshwar-pujara', i) },
  { card: { type: 'compare', b: 'don-bradman,steve-smith' }, text: (i) => compareCaption(['don-bradman', 'steve-smith'], i) },
  { card: { type: 'batter', b: 'kumar-sangakkara' }, text: (i) => batterCaption('kumar-sangakkara', i) },
  { card: { type: 'compare', b: 'rohit-sharma,virat-kohli' }, text: (i) => compareCaption(['rohit-sharma', 'virat-kohli'], i) },
];
const B = [...Array.from({ length: 13 }, (_, i) => ({ card: { type: 'laws', law: String(i + 1) }, text: () => lawCaption(i + 1) })),
  { card: { type: 'laws' }, text: () => `All 13 laws for what makes a Test hundred a ton of consequence, in one picture. Which one would you change? ${TAG}` }];
const C = [
  { card: { type: 'board' }, text: () => `Most tons of consequence in Test cricket: hundreds that won or saved the match. Who did you expect at the top? ${TAG}` },
  { card: presetParams('Default'), text: () => rankingsCaption('Default') },
  { card: { type: 'innings', id: '144' }, text: () => inningsCaption(144, 0) },
  { card: { type: 'board', sort: 'share' }, text: () => `It's not how many hundreds, it's how many mattered. Highest share of Test hundreds that were tons of consequence (10 or more measured). ${TAG}` },
  { card: presetParams('Purist'), text: () => rankingsCaption('Purist') },
  { card: { type: 'innings', id: '687' }, text: () => inningsCaption(687, 1) },
  { card: presetParams('Analyst'), text: () => rankingsCaption('Analyst') },
  { card: { type: 'innings', id: String(top[0]) }, text: () => inningsCaption(top[0], 0) },
  { card: presetParams('Romantic'), text: () => rankingsCaption('Romantic') },
  { card: { type: 'innings', id: String(top[1]) }, text: () => inningsCaption(top[1], 1) },
  { card: presetParams('Patriot'), text: () => rankingsCaption('Patriot') },
  { card: { type: 'innings', id: String(top[2]) }, text: () => inningsCaption(top[2], 0) },
  { card: { type: 'innings', id: String(top[3]) }, text: () => inningsCaption(top[3], 1) },
  { card: { type: 'board' }, text: () => `Two weeks of tons of consequence. Still the question: which Test hundreds did the side actually need? ${TAG}` },
];

const items = [];
let id = 1;
for (let d = 1; d <= 14; d++) {
  for (const [slot, list] of [['A', A], ['B', B], ['C', C]]) {
    const e = list[d - 1];
    items.push({ id: id++, day: d, slot, text: e.text(d), card: { ...e.card, size: 'square' }, approved: false });
  }
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify({ _readme: 'Posts are sent by scripts/x-post.mjs from a GitHub Actions job. A post goes out only when approved is true. Times are UTC: slot A 03:35, B 09:05, C 15:35, counted from startDate (day 1). Set paused to true to stop everything.', paused: true, startDate: '2026-11-02', items }, null, 2)}\n`);
console.log(`Wrote ${items.length} items.`);
