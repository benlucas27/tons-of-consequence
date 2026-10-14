/**
 * What was going on when a hundred was scored, read off Cricsheet's ball-by-ball record: the state of the team when
 * the batter walked in, how much of the innings he carried, how the match ended, and what rode on it for the series.
 * Pure functions over Cricsheet match objects. These are the facts the Consequence Test (consequenceTest.js) judges.
 */

const isDismissal = (w) => w.kind !== 'retired hurt' && w.kind !== 'retired not out';

/** The innings of one match, with every batter's entry state (team score and wickets when he came in). */
export function inningsOf(match) {
  const out = [];
  for (const inn of match.innings || []) {
    let score = 0;
    let wkts = 0;
    const batters = new Map();
    const touch = (name) => {
      if (!batters.has(name)) batters.set(name, { name, order: batters.size + 1, entryScore: score, entryWkts: wkts, runs: 0, balls: 0, out: false, peril: 0 });
      return batters.get(name);
    };
    for (const over of inn.overs || []) {
      for (const d of over.deliveries || []) {
        const b = touch(d.batter);
        touch(d.non_striker);
        b.runs += d.runs?.batter || 0;
        if (!('wides' in (d.extras || {}))) b.balls += 1;
        if (b.b100 == null && b.runs >= 100) b.b100 = b.balls; // balls faced when he reached 100
        score += d.runs?.total || 0;
        for (const w of d.wickets || []) {
          if (isDismissal(w)) {
            wkts += 1;
            touch(w.player_out).out = true;
            // a top-seven batter falls while the other batter is at the crease and the team is still short of 200: a collapse
            // around him (tail-enders going does not count)
            if (score < 200 && batters.get(w.player_out).order <= 7) for (const n of [d.batter, d.non_striker]) if (n !== w.player_out) batters.get(n).peril += 1;
          }
        }
      }
    }
    out.push({ team: inn.team, runs: score, wkts, declared: Boolean(inn.declared), batters: [...batters.values()] });
  }
  return out;
}

/** The result from one team's point of view, and how big the margin was. */
export function resultFor(info, team) {
  const o = info.outcome || {};
  if (o.winner) return { result: o.winner === team ? 'win' : 'loss', by: o.by || null };
  if (o.result === 'draw') return { result: 'draw', by: null };
  if (o.result === 'tie') return { result: 'tie', by: null };
  return { result: 'none', by: null };
}

/** Every hundred in a match, with its context. Series stakes are added afterwards by addSeriesStakes. */
export function hundredsIn(match) {
  const info = match.info || {};
  if (info.gender !== 'male') return [];
  const innings = inningsOf(match);
  const date = info.dates?.[0] || null;
  const found = [];
  innings.forEach((inn, i) => {
    const opponent = (info.teams || []).find((t) => t !== inn.team);
    const before = innings.slice(0, i);
    const ownBefore = before.filter((x) => x.team === inn.team).reduce((a, x) => a + x.runs, 0);
    const oppBefore = before.filter((x) => x.team !== inn.team).reduce((a, x) => a + x.runs, 0);
    const prev = innings[i - 1];
    const followOn = i === 2 && prev && prev.team === inn.team; // batted twice in a row
    const res = resultFor(info, inn.team);
    for (const b of inn.batters) {
      if (b.runs < 100) continue;
      const leadOnEntry = ownBefore + b.entryScore - oppBefore;
      const target = i === 3 ? oppBefore - ownBefore + 1 : null;
      found.push({
        name: b.name,
        runs: b.runs,
        notOut: !b.out,
        balls: b.balls,
        ballsTo100: b.b100 ?? null,
        position: b.order,
        team: inn.team,
        opponent,
        date,
        year: date ? Number(date.slice(0, 4)) : null,
        venue: info.venue || '',
        inningsNo: i + 1,
        followOn,
        entryScore: b.entryScore,
        entryWkts: b.entryWkts,
        peril: b.peril,
        leadOnEntry,
        teamTotal: inn.runs,
        teamWkts: inn.wkts,
        share: inn.runs ? Math.round((b.runs / inn.runs) * 1000) / 1000 : null,
        target,
        result: res.result,
        margin: res.by,
        event: info.event?.name || null,
        matchNumber: info.event?.match_number || null,
        season: info.season || null,
        teams: [...(info.teams || [])].sort().join(' v '),
      });
    }
  });
  return found;
}

/**
 * What rode on each match for its series: 'dead' (the series was already decided), 'decider' (the last match
 * of a level series), 'on the line' (the last match and the series could still change hands), 'live', or
 * 'single' when the match has no series. `matches` are Cricsheet match objects.
 */
export function seriesStakes(matches) {
  // The archive names a series inconsistently (the first Test can carry the trophy's name and the rest the tour's),
  // so a series is found from the two teams and the dates: matches between the same two sides, in date order, with
  // a new series starting when the match number goes back to 1 or there is a gap of more than 60 days.
  const byPair = new Map();
  for (const m of matches) {
    const info = m.info || {};
    if (info.gender !== 'male' || !info.event) continue;
    const key = [...(info.teams || [])].sort().join('|');
    if (!byPair.has(key)) byPair.set(key, []);
    byPair.get(key).push(m);
  }
  const day = (m) => Date.parse(m.info.dates?.[0] || '1970-01-01') / 86400000;
  const stakes = new Map(); // match -> { stakes, played, of, score }
  for (const list of byPair.values()) {
    list.sort((a, b) => day(a) - day(b));
    const groups = [];
    for (const m of list) {
      const cur = groups[groups.length - 1];
      const last = cur?.[cur.length - 1];
      const fresh = !cur || m.info.event.match_number === 1 || day(m) - day(last) > 60;
      if (fresh) groups.push([m]); else cur.push(m);
    }
    for (const g of groups) {
      const n = Math.max(g.length, ...g.map((m) => m.info.event.match_number || 0));
      const wins = {};
      g.forEach((m, idx) => {
        const [a, b] = m.info.teams;
        const diff = Math.abs((wins[a] || 0) - (wins[b] || 0));
        const remaining = n - idx; // matches left including this one
        let s = 'live';
        if (diff > remaining) s = 'dead';
        else if (remaining === 1 && diff === 0) s = 'decider';
        else if (remaining === 1 && diff === 1) s = 'on the line';
        stakes.set(m, { stakes: s, played: idx, of: n, score: `${wins[a] || 0}-${wins[b] || 0}`, teams: [a, b] });
        const w = m.info.outcome?.winner;
        if (w) wins[w] = (wins[w] || 0) + 1;
      });
    }
  }
  return stakes;
}
