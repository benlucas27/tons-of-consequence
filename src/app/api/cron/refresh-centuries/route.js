import { createClient } from '@supabase/supabase-js';
import { fetchRecentCenturies, naturalKey } from '@/lib/cricsheet';
import { scoreLevers, writeStory, tagsFor } from '@/lib/heuristics';
import { teamCodeFor } from '@/lib/countries';
import { SAMPLE_CENTURIES } from '@/data/sample';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const STATIC_KEYS = new Set(SAMPLE_CENTURIES.map(naturalKey));

/**
 * Monthly data refresh — triggered by Vercel Cron (see vercel.json).
 *
 * Pulls newly played Test centuries from Cricsheet, skips anything already in
 * the static dataset or the `centuries` table (matched by player/year/runs/
 * opponent — safe to re-run any time), scores them heuristically, and inserts
 * them with score_status:'pipeline' so they land in the /admin/score queue.
 *
 * Add `?dry=1` to see exactly what would be inserted without writing anything
 * (works without Supabase configured, so it can be tested locally). Add
 * `?since=YYYY-MM-DD` for a one-off backfill past the usual 70-day window.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
 * when CRON_SECRET is set as a project env var. Fails closed: an unset secret
 * rejects every request rather than running unauthenticated, since this
 * endpoint fetches a third-party archive and writes to the database.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET is not configured — refusing to run unauthenticated.' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const dry = params.get('dry') === '1';
  const sinceParam = params.get('since');
  const since = /^\d{4}-\d{2}-\d{2}$/.test(sinceParam || '') ? sinceParam : undefined;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
  if (!supabase && !dry) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  let candidates;
  try {
    candidates = await fetchRecentCenturies({ since });
  } catch (err) {
    return Response.json({ error: `Cricsheet fetch failed: ${err.message}` }, { status: 502 });
  }

  let existing = [];
  if (supabase && candidates.length) {
    const years = [...new Set(candidates.map((c) => c.year))];
    const { data, error: readErr } = await supabase
      .from('centuries')
      .select('player, year, runs, opponent')
      .in('year', years);
    if (readErr) {
      return Response.json({ error: `Supabase read failed: ${readErr.message}`, details: readErr.details, hint: readErr.hint, code: readErr.code }, { status: 502 });
    }
    existing = data || [];
  }

  const existingKeys = new Set(existing.map(naturalKey));
  const inStatic = candidates.filter((c) => STATIC_KEYS.has(naturalKey(c)));
  const fresh = candidates.filter((c) => !existingKeys.has(naturalKey(c)) && !STATIC_KEYS.has(naturalKey(c)));

  const rows = fresh.map((c) => {
    const levers = scoreLevers(c, teamCodeFor(c.opponentTeam));
    return {
      player: c.player,
      country: c.country,
      runs: c.runs,
      balls: c.balls,
      not_out: c.notOut,
      opponent: c.opponent,
      ground: c.venue,
      year: c.year,
      series: c.series,
      match_result: c.matchResult,
      innings_number: c.inningsNumber,
      tags: tagsFor(c),
      story: writeStory(c),
      score_status: 'pipeline',
      lever_match_impact: levers.matchImpact,
      lever_conditions: levers.conditions,
      lever_clutchness: levers.clutchness,
      lever_narrative: levers.narrative,
      lever_historical: levers.historicalWeight,
      lever_greatness: levers.perceivedGreatness,
    };
  });

  const summary = {
    ok: true,
    found: candidates.length,
    alreadyInStatic: inStatic.length,
    alreadyInSupabase: candidates.length - inStatic.length - fresh.length,
    toInsert: rows.length,
  };

  if (dry) {
    return Response.json({ ...summary, dry: true, supabaseRowsForThoseYears: supabase ? existing.length : 'n/a', preview: rows });
  }
  if (!rows.length) return Response.json({ ...summary, inserted: 0 });

  const { error: insertErr } = await supabase.from('centuries').insert(rows);
  if (insertErr) {
    return Response.json({ error: `Supabase insert failed: ${insertErr.message}`, details: insertErr.details, hint: insertErr.hint, code: insertErr.code }, { status: 502 });
  }
  return Response.json({ ...summary, inserted: rows.length });
}
