#!/usr/bin/env node
/**
 * Writes the first month of the X queue (social/x-queue.json): 3 posts a day, plus one launch post (day 0), each a share card plus a short caption.
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
  `${slugs.map((s) => last(name(s))).join(', ')}: same question for all ${slugs.length}. How many of their Test hundreds won or saved the match? ${TAG}`,
], i);
const inningsCaption = (id, i) => {
  const c = BY_ID.get(id);
  return pick([
    `${c.name}'s ${c.runs}${c.notOut ? '*' : ''} v ${c.opponent} in ${c.year}. Did the side need it? The card shows the call and the reason. ${TAG}`,
    `${c.name}, ${c.runs}${c.notOut ? '*' : ''} v ${c.opponent}, ${c.year}: a great innings, but was it a ton of consequence? See the reason. ${TAG}`,
  ], i);
};
const rankingsCaption = (preset, v = 0) => (preset === 'Default' && v > 0
  ? `Six criteria, every Test hundred. Whose innings should be at the very top? Tell us what the ranking gets wrong. ${TAG}`
  : preset === 'Default'
  ? `The greatest Test hundreds ever, ranked across six criteria. Change the order and the list changes. Which one is missing? ${TAG}`
  : `The greatest Test hundreds, the ${preset} way: ${PRESETS[preset].blurb} Same innings, different order. ${TAG}`);
const lawCaption = (n) => `Law ${n} of 13 for what makes a Test hundred a ton of consequence: ${LAWS[n - 1][0]}. Agree, or would you change it? ${TAG}`;

const LIVE = new Set([4599]); // an innings in a Test still being played is not posted
const top = rankAll(DEFAULT_ORDER).filter((c) => !LIVE.has(c.id)).slice(0, 5).map((c) => c.id);
const presetParams = (p) => ({ type: 'rankings', ...(p === 'Default' ? {} : { o: formatOrder(PRESETS[p].order), ...(PRESETS[p].bias ? { bonus: PRESETS[p].bias } : {}) }) });

const compareSets = [
  ['virat-kohli', 'steve-smith', 'joe-root'], ['sachin-tendulkar', 'ricky-ponting', 'brian-lara'], ['steve-smith', 'joe-root', 'kane-williamson'],
  ['sunil-gavaskar', 'sachin-tendulkar', 'virat-kohli'], ['don-bradman', 'steve-smith'], ['rohit-sharma', 'virat-kohli'],
  ['alastair-cook', 'joe-root'], ['ricky-ponting', 'steve-waugh', 'allan-border'], ['jacques-kallis', 'kumar-sangakkara', 'mahela-jayawardene'],
  ['brian-lara', 'sachin-tendulkar'], ['rahul-dravid', 'vvs-laxman', 'cheteshwar-pujara'], ['adam-gilchrist', 'travis-head'], ['virat-kohli', 'sachin-tendulkar'],
];
const soloFirst = ['virat-kohli', 'sachin-tendulkar', 'rahul-dravid', 'yashasvi-jaiswal', 'rohit-sharma', 'travis-head', 'cheteshwar-pujara', 'kumar-sangakkara'];
const soloMore = BATTER_ORDER();
function BATTER_ORDER() {
  const used = new Set([...soloFirst, ...compareSets.flat(), 'steve-smith', 'joe-root', 'kane-williamson', 'don-bradman']);
  return ['jacques-kallis', 'mahela-jayawardene', 'younis-khan', 'alastair-cook', 'steve-waugh', 'matthew-hayden', 'shivnarine-chanderpaul', 'michael-clarke', 'hashim-amla', 'graeme-smith', 'allan-border', 'david-warner', 'viv-richards', 'adam-gilchrist', 'ben-stokes', 'shubman-gill', 'vvs-laxman', 'sunil-gavaskar']
    .filter((x) => !used.has(x) || ['vvs-laxman', 'sunil-gavaskar', 'adam-gilchrist'].includes(x));
}

const A = []; // morning, India: batter spotlights, with a head-to-head every third day
{ let si = 0; let ci = 0; const solos = [...soloFirst, ...soloMore.filter((x) => !soloFirst.includes(x))];
  for (let d = 1; d <= 30; d++) {
    if (d % 3 === 2) { const set = compareSets[ci++ % compareSets.length]; A.push({ card: { type: 'compare', b: set.join(',') }, text: (i) => compareCaption(set, i) }); }
    else { const slug = solos[si++ % solos.length]; A.push({ card: { type: 'batter', b: slug }, text: (i) => batterCaption(slug, i) }); }
  }
}
const topIds = rankAll(DEFAULT_ORDER).filter((c) => !LIVE.has(c.id)).slice(0, 60).map((c) => c.id);
const B = [...Array.from({ length: 13 }, (_, i) => ({ card: { type: 'laws', law: String(i + 1) }, text: () => lawCaption(i + 1) })),
  { card: { type: 'laws' }, text: () => `All 13 laws for what makes a Test hundred a ton of consequence, in one picture. Which one would you change? ${TAG}` },
  ...Array.from({ length: 16 }, (_, k) => ({ card: { type: 'innings', id: String(topIds[4 + k]) }, text: () => inningsCaption(topIds[4 + k], k) })),
  { card: { type: 'board', sort: 'share' }, text: () => `A month of tons of consequence. Highest share of Test hundreds that mattered (10 or more measured). Anyone surprise you? ${TAG}` }];
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
  { card: { type: 'innings', id: String(topIds[20]) }, text: () => inningsCaption(topIds[20], 0) },
  { card: presetParams('Default'), text: () => rankingsCaption('Default', 1) },
  { card: { type: 'innings', id: String(topIds[21]) }, text: () => inningsCaption(topIds[21], 1) },
  { card: presetParams('Purist'), text: () => `Hardest hundreds first: the Purist order puts conditions and pressure on top and the story last. What moves up for you? ${TAG}` },
  { card: { type: 'innings', id: String(topIds[22]) }, text: () => inningsCaption(topIds[22], 0) },
  { card: { type: 'board', sort: 'share' }, text: () => `Share, not count: who turned the most of their Test hundreds into tons of consequence? ${TAG}` },
  { card: { type: 'innings', id: String(topIds[23]) }, text: () => inningsCaption(topIds[23], 1) },
  { card: presetParams('Analyst'), text: () => `The Analyst view: what it changed comes first. Same hundreds, different order, a different top of the list. ${TAG}` },
  { card: { type: 'innings', id: String(topIds[24]) }, text: () => inningsCaption(topIds[24], 0) },
  { card: { type: 'board' }, text: () => `Hundreds that won or saved the Test: the all-time leaders in tons of consequence. Where is your favourite? ${TAG}` },
  { card: { type: 'innings', id: String(topIds[25]) }, text: () => inningsCaption(topIds[25], 1) },
  { card: presetParams('Romantic'), text: () => `Rank the legend, not the maths: the Romantic order puts the story first. Whose innings climbs? ${TAG}` },
  { card: { type: 'innings', id: String(topIds[26]) }, text: () => inningsCaption(topIds[26], 0) },
  { card: presetParams('Patriot'), text: () => `Patriot order with its Australian bonus switched on (it's labelled on the card). How much does it change the list? ${TAG}` },
  { card: { type: 'innings', id: String(topIds[27]) }, text: () => inningsCaption(topIds[27], 1) },
  { card: { type: 'board', sort: 'share' }, text: () => `Thirty days of tons of consequence. Share of Test hundreds that mattered: who would you add to this list? ${TAG}` },
];

const items = [];
let id = 1;
// Day 0 is the launch post, due the moment the job first runs, so the first live post doubles as the test.
items.push({ id: id++, day: 0, slot: 'A', text: `Every Test hundred, ranked: which ones did the side actually need? New cards here a few times a day. ${TAG}`, card: { type: 'rankings', size: 'square' }, approved: false });
for (let d = 1; d <= 30; d++) {
  for (const [slot, list] of [['A', A], ['B', B], ['C', C]]) {
    const e = list[d - 1];
    items.push({ id: id++, day: d, slot, text: e.text(d), card: { ...e.card, size: 'square' }, approved: false });
  }
}
// No identical card twice: a repeat is swapped for the next unused top innings, so no two posts carry the same picture.
{ const seen = new Set(); let next = 40;
  for (const it of items) {
    const k = JSON.stringify(it.card);
    if (seen.has(k)) { const nid = topIds[next++]; it.card = { type: 'innings', id: String(nid), size: 'square' }; it.text = inningsCaption(nid, next); }
    seen.add(JSON.stringify(it.card));
  } }
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify({ _readme: 'Posts are sent by scripts/x-post.mjs from a GitHub Actions job. A post goes out only when approved is true. Times are UTC: slot A 03:35, B 09:05, C 15:35, counted from startDate (day 1; day 0 is the day before). Set paused to true to stop everything.', paused: true, startDate: '2026-10-22', items }, null, 2)}\n`);
console.log(`Wrote ${items.length} items.`);
