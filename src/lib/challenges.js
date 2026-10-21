/** Challenges: what a visitor can pick, how a submission is checked, and how a person is recognised without storing who they are. */
import crypto from 'node:crypto';
import { BY_ID } from './dataset.js';

import { REASONS, NOTE_MAX } from './challengeOptions.js';

export { REASONS, NOTE_MAX };
export const REASON_LABEL = Object.fromEntries(REASONS.map((r) => [r.code, r.label]));
export const SHORT_REASON = { facts: 'Facts', situation: 'Situation', data: 'Little data', other: 'Other' };
export const HOURLY_LIMIT = 3; // challenges per person per hour

/** Checks a submission body. Returns { ok: true, value } or { ok: false, error }. A filled honeypot looks like success to the sender but is dropped. */
export function validateChallenge(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Nothing to send.' };
  if (typeof body.website === 'string' && body.website.trim() !== '') return { ok: true, bot: true };
  const inningsId = Number(body.inningsId);
  if (!Number.isInteger(inningsId) || !BY_ID.has(inningsId)) return { ok: false, error: 'Unknown innings.' };
  if (!REASON_LABEL[body.reason]) return { ok: false, error: 'Pick what we should look at.' };
  let note = typeof body.note === 'string' ? body.note.replace(/\s+/g, ' ').trim() : '';
  if (note.length > NOTE_MAX) return { ok: false, error: `Notes are limited to ${NOTE_MAX} characters.` };
  if (!note) note = null;
  return { ok: true, value: { inningsId, reason: body.reason, note } };
}

/** A salted hash of the visitor's address. The address itself is never stored. */
export function personHash(ip, secret) {
  return crypto.createHash('sha256').update(`${secret}|${ip || 'unknown'}`).digest('hex').slice(0, 40);
}
