/**
 * Fetches and parses the Cricsheet Test match archive to find newly played
 * centuries. Cricsheet (cricsheet.org) publishes ball-by-ball data for every
 * international match under an open license explicitly permitting reuse.
 *
 * We only ever look at matches after PIPELINE_FLOOR (the date the original
 * static dataset in src/data/sample.js was generated) so this can never
 * collide with or duplicate that curated historical set. Within that, each
 * run uses a rolling window (see WINDOW_DAYS) rather than a stored cursor —
 * simpler, and self-healing if a monthly run is ever missed, since the
 * caller is expected to dedupe against what's already stored.
 */

import AdmZip from 'adm-zip';
import { naturalKey } from './naturalKey';
import { TEAM_NAME_TO_CODE } from './countries';

const ARCHIVE_URL = 'https://cricsheet.org/downloads/tests_json.zip';

export const PIPELINE_FLOOR = '2026-04-20';
const WINDOW_DAYS = 70;

function windowStart() {
  const d = new Date();
  d.setDate(d.getDate() - WINDOW_DAYS);
  const iso = d.toISOString().slice(0, 10);
  return iso > PIPELINE_FLOOR ? iso : PIPELINE_FLOOR;
}

function extractCenturiesFromMatch(match) {
  const info = match.info;
  if (!info || info.gender !== 'male') return [];
  const dates = info.dates || [];
  if (!dates.length) return [];

  const year = parseInt(dates[0].slice(0, 4), 10);
  const venue = info.venue || '';
  const series = info.event?.name || '';
  const outcome = info.outcome || {};
  const results = [];
  const inningsCountByTeam = {};

  for (const inn of match.innings || []) {
    const team = inn.team;
    inningsCountByTeam[team] = (inningsCountByTeam[team] || 0) + 1;
    const inningsNumber = inningsCountByTeam[team];
    const opponent = (info.teams || []).find((t) => t !== team);

    const runs = {};
    const balls = {};
    const out = new Set();

    for (const over of inn.overs || []) {
      for (const d of over.deliveries || []) {
        const batter = d.batter;
        runs[batter] = (runs[batter] || 0) + (d.runs?.batter || 0);
        const extras = d.extras || {};
        if (!('wides' in extras)) {
          balls[batter] = (balls[batter] || 0) + 1;
        }
        for (const w of d.wickets || []) {
          if (w.player_out) out.add(w.player_out);
        }
      }
    }

    for (const [batter, r] of Object.entries(runs)) {
      if (r < 100) continue;
      let matchResult = 'draw';
      if (outcome.winner === team) matchResult = 'win';
      else if (outcome.winner === opponent) matchResult = 'loss';

      results.push({
        player: batter,
        country: TEAM_NAME_TO_CODE[team] || team,
        opponentTeam: opponent,
        opponent,
        runs: r,
        balls: balls[batter] || 0,
        notOut: !out.has(batter),
        venue,
        year,
        series,
        matchResult,
        inningsNumber,
        date: dates[0],
      });
    }
  }
  return results;
}

/**
 * Downloads the full Cricsheet Test archive and returns every century found
 * within the recent rolling window. Caller is responsible for deduping
 * against already-stored rows before inserting anything.
 */
export async function fetchRecentCenturies() {
  const res = await fetch(ARCHIVE_URL);
  if (!res.ok) throw new Error(`Cricsheet fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buf);
  const cutoff = windowStart();

  const centuries = [];
  for (const entry of zip.getEntries()) {
    if (!entry.entryName.endsWith('.json')) continue;
    let match;
    try {
      match = JSON.parse(entry.getData().toString('utf8'));
    } catch {
      continue;
    }
    const dates = match.info?.dates || [];
    if (!dates.length || dates[0] < cutoff) continue;
    centuries.push(...extractCenturiesFromMatch(match));
  }
  return centuries;
}

export { naturalKey };
