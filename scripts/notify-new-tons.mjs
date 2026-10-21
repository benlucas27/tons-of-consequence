#!/usr/bin/env node
/**
 * Sends a push notification (through OneSignal) for each NEW ton of consequence that a data update just published.
 * Run by the Season update after the commit is pushed:   node scripts/notify-new-tons.mjs --from HEAD~1
 *
 * A "new" ton is a hundred that was not in the database at --from and is a ton of consequence now. Hundreds that only
 * gained a verdict later (older hundreds measured after the fact) never trigger a notification.
 * Needs two secrets in the environment: ONESIGNAL_APP_ID and ONESIGNAL_API_KEY. Without them it says so and stops.
 * Use --dry-run to see what would be sent.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { newTonIds, buildPushes } from '../src/lib/pushMessages.js';
import { SAMPLE_CENTURIES } from '../src/data/sample.js';
import { TON_IDS } from '../src/data/ton-ids.js';
import { PLAYER_NAMES } from '../src/data/player-names.js';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : 'HEAD~1';

const dir = mkdtempSync(path.join(tmpdir(), 'notify-'));
async function atRef(file, name) {
  const out = path.join(dir, `${name}.mjs`);
  writeFileSync(out, execFileSync('git', ['show', `${from}:${file}`], { encoding: 'utf8', maxBuffer: 1 << 27 }));
  return import(pathToFileURL(out).href);
}
const oldTons = (await atRef('src/data/ton-ids.js', 'ton')).TON_IDS;
const oldHundreds = (await atRef('src/data/sample.js', 'sample')).SAMPLE_CENTURIES;

const ids = newTonIds(oldTons, TON_IDS, oldHundreds.map((c) => c.id));
const byId = new Map(SAMPLE_CENTURIES.map((c) => [c.id, { ...c, name: c.fullName || PLAYER_NAMES[c.player] || c.player }]));
const pushes = buildPushes(ids, byId);

if (!pushes.length) { console.log('No new tons of consequence: no notifications sent.'); process.exit(0); }
for (const p of pushes) console.log(`${dry ? '[dry run] ' : ''}${p.title} | ${p.body}`);
if (dry) process.exit(0);

const { ONESIGNAL_APP_ID: appId, ONESIGNAL_API_KEY: key } = process.env;
if (!appId || !key) { console.log('OneSignal keys are not set up yet: notifications not sent.'); process.exit(0); }

let failed = 0;
for (const p of pushes) {
  const res = await fetch('https://api.onesignal.com/notifications?c=push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${key}` },
    body: JSON.stringify({
      app_id: appId,
      target_channel: 'push',
      included_segments: ['Subscribed Users'],
      headings: { en: p.title },
      contents: { en: p.body },
      ...(p.inningsId ? { data: { inningsId: p.inningsId } } : {}),
    }),
  });
  if (!res.ok) { failed++; console.error(`OneSignal said ${res.status}: ${(await res.text()).slice(0, 200)}`); }
}
// A failed notification must not undo the (already published) data update: report it but do not fail the run.
console.log(failed ? `${failed} of ${pushes.length} notifications failed.` : `Sent ${pushes.length} notification(s).`);
