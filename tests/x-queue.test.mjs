import test from 'node:test';
import assert from 'node:assert/strict';
import { loadQueue, dueAt, cardUrl, oauthSignature, postText, postLength, hasLink } from '../scripts/x-post.mjs';
import { BATTER_BY_SLUG } from '../src/lib/consequence.js';
import { BY_ID } from '../src/lib/dataset.js';

const queue = loadQueue();
const TYPES = ['batter', 'innings', 'compare', 'board', 'rankings', 'laws'];

test('the OAuth signature matches the worked example in X\'s own documentation', () => {
  const creds = { key: 'xvz1evFS4wEEPTGEFPHBog', secret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw', token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb', tokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE' };
  const sig = oauthSignature('POST', 'https://api.twitter.com/1/statuses/update.json',
    { include_entities: 'true', status: 'Hello Ladies + Gentlemen, a signed OAuth request!' }, creds, 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg', '1318622958');
  assert.equal(sig, 'tnnArxj06cWHq44gCs1OSKk/jLY=');
});

test('queue: ids are unique, days 0 to 30, three slots a day, in order', () => {
  assert.equal(new Set(queue.items.map((i) => i.id)).size, queue.items.length);
  for (const i of queue.items) { assert.ok(i.day >= 0 && i.day <= 30); assert.ok(['A', 'B', 'C'].includes(i.slot)); }
  const times = queue.items.map((i) => dueAt(queue, i).getTime());
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
});

test('queue: every caption fits with its link and carries no raw address of its own', () => {
  for (const i of queue.items) {
    assert.ok(postLength(queue, i) <= 280, `#${i.id} is ${postLength(queue, i)} characters with its link`);
    assert.ok(!/https?:|\.com\b|www\./i.test(i.text), `#${i.id}: the link belongs in the link field, not the caption`);
    assert.ok(i.link && i.link.startsWith('/'), `#${i.id} has no page to link to`);
  }
});

test('posts end with the page they point to, for the slots that carry links', () => {
  const item = queue.items.find((i) => i.slot === 'A');
  assert.ok(postText({ ...queue, linkSlots: ['A'] }, item).endsWith(`https://tonsofconsequence.com${item.link}`));
  assert.equal(postText({ ...queue, linkSlots: [] }, item), item.text);
});

test('queue: every card points at something real', () => {
  for (const i of queue.items) {
    assert.ok(TYPES.includes(i.card.type), `#${i.id} type ${i.card.type}`);
    if (i.card.type === 'batter') assert.ok(BATTER_BY_SLUG.has(i.card.b), `#${i.id} batter ${i.card.b}`);
    if (i.card.type === 'compare') for (const s of i.card.b.split(',')) assert.ok(BATTER_BY_SLUG.has(s), `#${i.id} batter ${s}`);
    if (i.card.type === 'innings') assert.ok(BY_ID.has(Number(i.card.id)), `#${i.id} innings ${i.card.id}`);
    if (i.card.law) assert.ok(Number(i.card.law) >= 1 && Number(i.card.law) <= 13);
    assert.match(cardUrl(i, 'https://example.test'), /^https:\/\/example\.test\/card\?type=/);
  }
});

test('the live-series hooks carry the series hashtag and the link, and no day has more than one linked post', () => {
  const hooks = queue.items.filter((i) => i.slot === 'B' && i.day >= 1 && i.day <= 9);
  for (const h of hooks) { assert.match(h.text, /#SAvAUS/); assert.ok(hasLink(queue, h), `#${h.id} should carry the link`); }
  const perDay = {};
  for (const i of queue.items) if (hasLink(queue, i)) perDay[i.day] = (perDay[i.day] || 0) + 1;
  assert.ok(Math.max(...Object.values(perDay)) <= 1, 'X charges extra for links: at most one a day');
});
