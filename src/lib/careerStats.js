/**
 * Career batting figures from Cricsheet's ball-by-ball Test archive. The dataset holds only centuries, so the
 * things that need every innings (averages, fifties, how often a fifty becomes a hundred) are worked out here
 * and saved to src/data/careers.js by scripts/build-careers.mjs.
 *
 * Counting follows the usual scorebook rules: an innings is one the batter took part in (faced a ball or stood
 * at the non-striker's end); wides are not balls faced; a retired-hurt batter is not out; the average is runs
 * divided by dismissals.
 */

/** One batting line per batter per innings of a Cricsheet match: { id, name, runs, balls, out }. */
export function battingLines(match) {
  const info = match.info || {};
  if (info.gender !== 'male') return [];
  const people = info.registry?.people || {};
  const lines = [];
  for (const inn of match.innings || []) {
    const seen = new Map();
    const touch = (name) => {
      if (!seen.has(name)) seen.set(name, { id: people[name] || name, name, runs: 0, balls: 0, out: false });
      return seen.get(name);
    };
    for (const over of inn.overs || []) {
      for (const d of over.deliveries || []) {
        const b = touch(d.batter);
        touch(d.non_striker);
        b.runs += d.runs?.batter || 0;
        if (!('wides' in (d.extras || {}))) b.balls += 1;
        for (const w of d.wickets || []) {
          if (w.kind === 'retired hurt' || w.kind === 'retired not out') continue;
          touch(w.player_out).out = true;
        }
      }
    }
    lines.push(...seen.values());
  }
  return lines;
}

/** The people who played in a match (the XI), for counting Tests played. */
export function playersIn(match) {
  const info = match.info || {};
  if (info.gender !== 'male') return [];
  const people = info.registry?.people || {};
  return Object.values(info.players || {}).flat().map((name) => ({ id: people[name] || name, name }));
}

export const emptyCareer = () => ({
  name: null, matches: 0, innings: 0, notOuts: 0, runs: 0, balls: 0, highScore: 0, highScoreNotOut: false,
  hundreds: 0, doubleHundreds: 0, fifties: 0, ducks: 0, firstTest: null, lastTest: null,
});

/** Adds one match to `careers` (a map of player id to career), for the ids in `wanted`. */
export function addMatch(careers, match, wanted) {
  const date = match.info?.dates?.[0] || null;
  for (const p of playersIn(match)) {
    if (!wanted.has(p.id)) continue;
    const c = (careers[p.id] ||= emptyCareer());
    c.name = p.name;
    c.matches += 1;
    if (date && (!c.firstTest || date < c.firstTest)) c.firstTest = date;
    if (date && (!c.lastTest || date > c.lastTest)) c.lastTest = date;
  }
  for (const l of battingLines(match)) {
    if (!wanted.has(l.id)) continue;
    const c = (careers[l.id] ||= emptyCareer());
    c.innings += 1;
    if (!l.out) c.notOuts += 1;
    c.runs += l.runs;
    c.balls += l.balls;
    if (l.runs > c.highScore || (l.runs === c.highScore && !l.out)) { c.highScore = l.runs; c.highScoreNotOut = !l.out; }
    if (l.runs >= 200) c.doubleHundreds += 1;
    if (l.runs >= 100) c.hundreds += 1;
    else if (l.runs >= 50) c.fifties += 1;
    if (l.runs === 0 && l.out) c.ducks += 1;
  }
  return careers;
}

const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

/** The figures people quote, from a career's counts. */
export function derived(c) {
  const dismissals = c.innings - c.notOuts;
  const fiftyPlus = c.fifties + c.hundreds;
  return {
    average: dismissals > 0 ? round(c.runs / dismissals) : null,
    strikeRate: c.balls > 0 ? round((c.runs / c.balls) * 100, 1) : null,
    fiftyPlus,
    conversion: fiftyPlus > 0 ? round((c.hundreds / fiftyPlus) * 100, 1) : null,
    inningsPerHundred: c.hundreds > 0 ? round(c.innings / c.hundreds, 1) : null,
    hundredsPerTest: c.matches > 0 ? round(c.hundreds / c.matches) : null,
  };
}
