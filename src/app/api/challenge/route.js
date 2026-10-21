import { sql, hashSecret } from '@/lib/db';
import { validateChallenge, personHash, HOURLY_LIMIT } from '@/lib/challenges';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** POST { inningsId, reason, note?, website? }. `website` is a hidden field that only a bot fills in. */
export async function POST(req) {
  const db = sql();
  if (!db) return json({ ok: false, error: 'Challenges are not available right now.' }, 503);
  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'Could not read that.' }, 400); }
  const check = validateChallenge(body);
  if (!check.ok) return json(check, 400);
  if (check.bot) return json({ ok: true, count: 0 });

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  const who = personHash(ip, hashSecret());
  const { inningsId, reason, note } = check.value;

  const [{ recent }] = await db`SELECT count(*)::int AS recent FROM challenges WHERE ip_hash = ${who} AND created_at > now() - interval '1 hour'`;
  if (recent >= HOURLY_LIMIT) return json({ ok: false, error: 'That is a lot of challenges. Try again in an hour.' }, 429);

  // One challenge per person per innings per day; a repeat is accepted quietly and not counted twice.
  await db`INSERT INTO challenges (innings_id, reason_code, note, ip_hash) VALUES (${inningsId}, ${reason}, ${note}, ${who}) ON CONFLICT (innings_id, ip_hash, day) DO NOTHING`;
  const [{ n }] = await db`SELECT count(*)::int AS n FROM challenges WHERE innings_id = ${inningsId} AND note IS DISTINCT FROM '__test__'`;
  return json({ ok: true, count: n });
}
