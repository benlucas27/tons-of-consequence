import { createClient } from '@supabase/supabase-js';
import { fetchRecentCenturies, naturalKey } from '@/lib/cricsheet';
import { scoreLevers, writeStory, tagsFor } from '@/lib/heuristics';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Monthly data refresh — triggered by Vercel Cron (see vercel.json).
 *
 * Pulls newly played Test centuries from Cricsheet, skips anything that
 * already exists in the `centuries` table (matched by player/year/runs/
 * opponent, not by date — safe to re-run any time, including manually),
 * scores them heuristically, and inserts them with score_status:'pipeline'
 * so they land in the existing /admin/score editorial queue.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
 * when CRON_SECRET is set as a project env var. Reject anything else so this
 * can't be used to spam the database or trigger unnecessary Cricsheet fetches.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  let candidates;
  try {
    candidates = await fetchRecentCenturies();
  } catch (err) {
    return Response.json({ error: `Cricsheet fetch failed: ${err.message}` }, { status: 502 });
  }

  if (!candidates.length) {
    return Response.json({ ok: true, found: 0, inserted: 0 });
  }

  // Pull existing rows for the years we might touch, to dedupe.
  const years = [...new Set(candidates.map((c) => c.year))];
  const { data: existing, error: readErr } = await supabase
    .from('centuries')
    .select('player, year, runs, opponent')
    .in('year', years);

  if (readErr) {
    return Response.json({ error: `Supabase read failed: ${readErr.message}` }, { status: 502 });
  }

  const existingKeys = new Set((existing || []).map(naturalKey));
  const fresh = candidates.filter((c) => !existingKeys.has(naturalKey(c)));

  if (!fresh.length) {
    return Response.json({ ok: true, found: candidates.length, inserted: 0 });
  }

  const rows = fresh.map((c) => {
    const levers = scoreLevers(c, TEAM_CODE_FOR(c.opponentTeam));
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

  const { error: insertErr } = await supabase.from('centuries').insert(rows);
  if (insertErr) {
    return Response.json({ error: `Supabase insert failed: ${insertErr.message}` }, { status: 502 });
  }

  return Response.json({ ok: true, found: candidates.length, inserted: rows.length });
}

// Same team-code table as cricsheet.js; opponent arrives as a full team
// name from Cricsheet, so map it before rivalry-checking in scoreLevers.
const TEAM_CODES = {
  Australia: 'AUS', England: 'ENG', 'West Indies': 'WI', India: 'IND',
  'South Africa': 'SA', Pakistan: 'PAK', 'New Zealand': 'NZ', 'Sri Lanka': 'SL',
  Zimbabwe: 'ZIM', Bangladesh: 'BAN', Afghanistan: 'AFG', Ireland: 'IRE',
};
function TEAM_CODE_FOR(teamName) {
  return TEAM_CODES[teamName] || teamName;
}
