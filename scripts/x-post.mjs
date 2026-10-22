#!/usr/bin/env node
/**
 * Posts the next approved, due item from social/x-queue.json to X, with its share card attached.
 *
 *   node scripts/x-post.mjs --preview            list every queued post: when, text, card, approved or not
 *   node scripts/x-post.mjs --verify             check the four keys work (reads your own account, posts nothing)
 *   node scripts/x-post.mjs --dry-run            do everything except post (fetches the card, prints the post)
 *   node scripts/x-post.mjs                      post the next due item (this is what the GitHub job runs)
 *
 * Options: --base <url> where to fetch cards from (default https://tonsofconsequence.com).
 * Keys come from the environment: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET.
 * It only ever posts the account's own items. It never replies, mentions, follows or likes.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_FILE = path.join(root, 'social/x-queue.json');
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const BASE = opt('base', 'https://tonsofconsequence.com').replace(/\/$/, '');
const SLOT_HOURS = { A: [3, 35], B: [9, 5], C: [15, 35] }; // UTC [hour, minute]
const STALE_HOURS = 36; // an item that is this late is skipped, not posted out of context
const MAX_PER_DAY = 3;
const LINK_CHARS = 23; // X counts every link as 23 characters

/** The post text: the caption, then (for the slots in queue.linkSlots) the page it points to. Links cost more on X, so slots can be switched off. */
export function postText(queue, item, site = 'https://tonsofconsequence.com') {
  return hasLink(queue, item) ? `${item.text}\n\n${site}${item.link}` : item.text;
}
/** An item's own `linked` flag wins; otherwise its slot decides (queue.linkSlots). */
export const hasLink = (queue, item) => Boolean(item.link) && (item.linked !== undefined ? item.linked : (queue.linkSlots || ['A', 'B', 'C']).includes(item.slot));
export const postLength = (queue, item) => item.text.length + (hasLink(queue, item) ? 2 + LINK_CHARS : 0);

export const loadQueue = () => JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
const saveQueue = (q) => fs.writeFileSync(QUEUE_FILE, `${JSON.stringify(q, null, 2)}\n`);

/** When an item is due, in UTC: the queue's start date plus its day and slot. */
export function dueAt(queue, item) {
  const [h, m] = SLOT_HOURS[item.slot];
  const d = new Date(`${queue.startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + item.day - 1);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

export const cardUrl = (item, base = BASE) => `${base}/card?${new URLSearchParams({ ...item.card, size: item.card.size || 'square' }).toString()}`;

// ---- OAuth 1.0a (user context). Static keys, so there is nothing to refresh on a schedule. ----
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** The OAuth signature for a request. `params` are any query or form values that are part of the signature (none for JSON or multipart bodies). */
export function oauthSignature(method, url, params, creds, nonce, timestamp) {
  const all = {
    ...params, oauth_consumer_key: creds.key, oauth_nonce: nonce, oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp, oauth_token: creds.token, oauth_version: '1.0',
  };
  const paramString = Object.keys(all).sort().map((n) => `${enc(n)}=${enc(all[n])}`).join('&');
  const base = [method.toUpperCase(), enc(url), enc(paramString)].join('&');
  return crypto.createHmac('sha1', `${enc(creds.secret)}&${enc(creds.tokenSecret)}`).update(base).digest('base64');
}

function authHeader(method, url) {
  const creds = { key: process.env.X_API_KEY, secret: process.env.X_API_SECRET, token: process.env.X_ACCESS_TOKEN, tokenSecret: process.env.X_ACCESS_TOKEN_SECRET };
  if (Object.values(creds).some((v) => !v)) throw new Error('Missing one of X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET.');
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = String(Math.floor(Date.now() / 1000));
  const oauth = {
    oauth_consumer_key: creds.key, oauth_nonce: nonce, oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: timestamp, oauth_token: creds.token,
    oauth_version: '1.0', oauth_signature: oauthSignature(method, url, {}, creds, nonce, timestamp),
  };
  return `OAuth ${Object.keys(oauth).sort().map((n) => `${enc(n)}="${enc(oauth[n])}"`).join(', ')}`;
}

async function xFetch(method, url, body, headers = {}) {
  const res = await fetch(url, { method, headers: { Authorization: authHeader(method, url), ...headers }, body });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
  if (!res.ok) throw new Error(`X said ${res.status} for ${method} ${url}: ${text.slice(0, 400)}`);
  return json;
}

async function fetchCard(item) {
  const res = await fetch(cardUrl(item));
  if (!res.ok || !(res.headers.get('content-type') || '').includes('image/png')) throw new Error(`Could not fetch the card (${res.status}): ${cardUrl(item)}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > 5 * 1024 * 1024) throw new Error('Card is over X\'s 5 MB image limit.');
  return bytes;
}

async function uploadImage(bytes) {
  const form = new FormData();
  form.append('media', new Blob([bytes], { type: 'image/png' }), 'card.png');
  form.append('media_category', 'tweet_image');
  const out = await xFetch('POST', 'https://api.x.com/2/media/upload', form);
  const id = out?.data?.id;
  if (!id) throw new Error(`No media id in the upload response: ${JSON.stringify(out).slice(0, 300)}`);
  return id;
}

async function createPost(text, mediaId) {
  const out = await xFetch('POST', 'https://api.x.com/2/tweets', JSON.stringify({ text, media: { media_ids: [mediaId] } }), { 'Content-Type': 'application/json' });
  const id = out?.data?.id;
  if (!id) throw new Error(`No post id in the response: ${JSON.stringify(out).slice(0, 300)}`);
  return id;
}

function preview(queue) {
  const now = new Date();
  for (const item of queue.items) {
    const when = dueAt(queue, item);
    const state = item.tweetId ? `POSTED ${item.tweetId}` : item.skipped ? 'SKIPPED' : item.approved ? (when <= now ? 'DUE' : 'approved') : 'not approved';
    console.log(`#${item.id}  day ${item.day}${item.slot}  ${when.toISOString().slice(0, 16)}Z  [${state}]\n   ${postText(queue, item)}\n   card: ${cardUrl(item)}\n`);
  }
  console.log(`${queue.items.length} items, ${queue.items.filter((i) => i.approved).length} approved, ${queue.items.filter((i) => i.tweetId).length} posted.`);
}

async function main() {
  const queue = loadQueue();
  if (flag('preview')) return preview(queue);
  if (flag('verify')) {
    const out = await xFetch('GET', 'https://api.x.com/2/users/me');
    console.log(`Keys work. Posting as @${out.data.username} (${out.data.name}).`);
    return;
  }
  if (queue.paused) { console.log('Queue is paused (paused: true in social/x-queue.json). Nothing posted.'); return; }

  const now = new Date();
  const last24 = queue.items.filter((i) => i.postedAt && now - new Date(i.postedAt) < 24 * 3600 * 1000).length;
  if (last24 >= MAX_PER_DAY) { console.log(`Already posted ${last24} in the last 24 hours. Nothing to do.`); return; }

  const due = queue.items.filter((i) => i.approved && !i.tweetId && !i.skipped).map((i) => ({ i, at: dueAt(queue, i) })).filter((x) => x.at <= now).sort((a, b) => a.at - b.at);
  for (const x of due) if (now - x.at > STALE_HOURS * 3600 * 1000) { x.i.skipped = `Too late (${x.at.toISOString()})`; console.log(`Skipping #${x.i.id}: more than ${STALE_HOURS} hours late.`); }
  const next = due.find((x) => !x.i.skipped);
  if (!next) { saveQueue(queue); console.log('Nothing due.'); return; }

  const item = next.i;
  if (postLength(queue, item) > 280) throw new Error(`#${item.id} is ${postLength(queue, item)} characters (the limit is 280).`);
  const bytes = await fetchCard(item);
  if (flag('dry-run')) { console.log(`DRY RUN: would post #${item.id}\n${postText(queue, item)}\ncard: ${cardUrl(item)} (${bytes.length} bytes)`); return; }
  const mediaId = await uploadImage(bytes);
  item.tweetId = await createPost(postText(queue, item), mediaId);
  item.postedAt = new Date().toISOString();
  saveQueue(queue);
  console.log(`Posted #${item.id} as ${item.tweetId}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
