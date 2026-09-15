import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase is an enhancement layer, not a hard requirement — the static
// dataset always renders on its own. Guard client creation so a missing/
// misconfigured env (local dev without .env.local, a broken preview deploy)
// degrades to "no live data" instead of crashing the whole build.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Fetch all centuries from Supabase with optional filters.
 * Falls back to static data if Supabase isn't configured.
 */
export async function fetchCenturies({
  country = null,
  player = null,
  minRuns = 100,
  maxRuns = 999,
  minYear = 1877,
  maxYear = 2030,
  limit = 5000
} = {}) {
  if (!supabase) return null;
  let query = supabase
    .from('centuries')
    .select('*')
    .gte('runs', minRuns)
    .lte('runs', maxRuns)
    .gte('year', minYear)
    .lte('year', maxYear)
    .order('runs', { ascending: false })
    .limit(limit);

  if (country) query = query.eq('country', country);
  if (player)  query = query.ilike('player', `%${player}%`);

  const { data, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return null;
  }

  return data;
}

/**
 * Fetch the full live `centuries` table for the client-side overlay
 * (see mergeLiveOverlay in src/data/sample.js consumers). Read-only,
 * fails soft — any error just means the site falls back to the static
 * dataset, which is always shipped regardless.
 */
export async function fetchAllLiveCenturies() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('centuries').select('*').limit(20000);
  if (error) {
    console.error('Supabase overlay fetch failed:', error.message);
    return [];
  }
  return (data || []).map(mapDbToInnings);
}

/**
 * Map a Supabase row back to the app's innings format.
 */
export function mapDbToInnings(row) {
  return {
    id:                row.id,
    player:            row.player,
    country:           row.country,
    runs:              row.runs,
    balls:             row.balls,
    minutes:           row.minutes,
    notOut:            row.not_out,
    opponent:          row.opponent,
    venue:             row.ground,
    year:              row.year,
    series:            row.series || '',
    matchResult:       row.match_result,
    tags:              row.tags || [],
    story:             row.story || '',
    culturalValidation: row.cultural_validation || 50,
    levers: {
      matchImpact:       row.lever_match_impact   || 50,
      conditions:        row.lever_conditions      || 50,
      clutchness:        row.lever_clutchness      || 50,
      narrative:         row.lever_narrative       || 50,
      historicalWeight:  row.lever_historical      || 50,
      perceivedGreatness:row.lever_greatness       || 50,
    },
  };
}
