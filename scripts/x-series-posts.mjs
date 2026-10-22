#!/usr/bin/env node
/**
 * One-off: puts the live South Africa v Australia series into the X queue. The nine slot-B posts of days 1 to 9 become
 * series hooks (tagged #SAvAUS, linked to the player's page); the laws and the rest of slot B shift down behind them.
 * Slot-A posts carry the link again from day 10. Posted items are never touched. Run once: node scripts/x-series-posts.mjs
 */
import fs from 'node:fs';
import { linkFor } from './x-links.mjs';

const file = new URL('../social/x-queue.json', import.meta.url);
const q = JSON.parse(fs.readFileSync(file, 'utf8'));
const TAG = '#SAvAUS #TestCricket';
const b = (slug, text) => ({ card: { type: 'batter', b: slug, size: 'square' }, text: `${text} ${TAG}` });
const cmp = (slugs, text) => ({ card: { type: 'compare', b: slugs.join(','), size: 'square' }, text: `${text} ${TAG}` });
const HOOKS = [
  b('travis-head', 'Australia has never lost a Test in which Travis Head scored a hundred. Is he the most consequential hundred-maker in the game right now?'),
  b('graeme-smith', 'Graeme Smith scored 27 Test hundreds and South Africa never lost a single one of those Tests. Only 5 were tons of consequence. Explain that.'),
  b('marnus-labuschagne', 'Marnus Labuschagne has 11 Test hundreds and only 1 is a ton of consequence. Unlucky timing, or hundreds that do not decide Tests?'),
  cmp(['travis-head', 'steve-smith'], 'Smith has more tons of consequence. Head turns far more of his hundreds into them. Pick a side.'),
  b('jacques-kallis', 'Jacques Kallis scored 45 Test hundreds. Only 3 were tons of consequence. South Africa fans, this one is for you.'),
  b('temba-bavuma', 'Temba Bavuma has 4 Test hundreds. South Africa have never lost a Test he scored one in.'),
  cmp(['graeme-smith', 'jacques-kallis', 'hashim-amla'], 'Graeme Smith, Kallis or Amla: who gave South Africa the most hundreds that actually mattered?'),
  b('aiden-markram', 'Aiden Markram has 8 Test hundreds. South Africa lost 3 of those Tests. Fair or harsh to call so few of them tons of consequence?'),
  b('usman-khawaja', 'Usman Khawaja has 11 Test hundreds and Australia drew 6 of those Tests. Great accumulator, or hundreds that do not win Tests?'),
];

const open = q.items.filter((i) => !i.tweetId && !i.skipped);
const slotB = open.filter((i) => i.slot === 'B' && i.day >= 1).sort((a, c) => a.day - c.day);
const old = slotB.map((i) => ({ card: i.card, text: i.text, link: i.link })); // the current slot-B content, in day order
const next = [...HOOKS.map((h) => ({ ...h, link: linkFor(h.card) })), ...old].slice(0, slotB.length);
slotB.forEach((item, k) => { const n = next[k]; item.card = n.card; item.text = n.text; item.link = n.link; });

// One linked post a day, so X's extra charge for links stays at one a day: the hooks while the series is on, slot A after.
q.linkSlots = [];
for (const i of q.items) {
  if (i.tweetId) continue;
  i.linked = i.day >= 1 && ((i.slot === 'B' && i.day <= HOOKS.length) || (i.slot === 'A' && i.day > HOOKS.length));
}
fs.writeFileSync(file, `${JSON.stringify(q, null, 2)}\n`);
console.log(`Series hooks placed on slot B days 1 to ${HOOKS.length}; ${q.items.filter((i) => i.linked).length} linked posts in total.`);
