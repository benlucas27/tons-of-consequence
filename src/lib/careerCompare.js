/**
 * Career comparisons for the presets in src/data/compare-sets.js (The Big Four and any added later).
 * Two kinds of measure: the numbers (from every innings, in src/data/careers.js) and the ranking (from the
 * centuries and the reader's weighting). Leaders are worked out per measure, and the verdict only ever states
 * who leads on what; it doesn't invent an opinion.
 */
import { COMPARE_SETS } from '../data/compare-sets.js';
import { CAREERS, CAREERS_AS_OF } from '../data/careers.js';
import { REFERENCE_POINTS } from '../data/reference-points.js';
import { rankAll } from './dataset.js';
import { derived } from './careerStats.js';
import { NATIONS } from './scoring.js';

export { COMPARE_SETS, CAREERS_AS_OF };
export const setById = (id) => COMPARE_SETS.find((s) => s.id === id) || null;

const ord = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};
const lastName = (name) => name.split(' ').slice(-1)[0];
const join = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const r1 = (n) => Math.round(n * 10) / 10;

/** Everything about one player in a set: career figures plus how their hundreds rank. */
function profile(p, ranked) {
  const career = CAREERS[`${p.name}|${p.country}`];
  if (!career) throw new Error(`No career figures for ${p.name}. Run node scripts/build-careers.mjs.`);
  const mine = ranked.filter((c) => c.name === p.name && c.country === p.country); // best first
  const avgToc = mine.length ? r1(mine.reduce((a, c) => a + c.toc, 0) / mine.length) : null;
  const elite = mine.filter((c) => c.toc >= 82).length;
  return {
    name: p.name,
    country: p.country,
    countryName: NATIONS[p.country] || p.country,
    career,
    ref: REFERENCE_POINTS[`${p.name}|${p.country}`] || null,
    figures: derived(career),
    innings: mine,
    ranking: {
      hundreds: mine.length,
      best: mine[0] || null,
      inTop100: mine.filter((c) => c.rank <= 100).length,
      inTop500: mine.filter((c) => c.rank <= 500).length,
      averageToc: avgToc,
      elite,
      elitePct: mine.length ? r1((elite / mine.length) * 100) : null,
    },
  };
}

// A measure: how to read it from a profile, whether it can have a leader, and whether higher or lower is better.
const NUMBERS = [
  { key: 'tests', label: 'Tests', get: (p) => p.career.matches, fmt: (v) => v.toLocaleString(), scored: false },
  { key: 'innings', label: 'Innings', get: (p) => p.career.innings, fmt: (v) => v.toLocaleString(), scored: false },
  { key: 'runs', label: 'Runs', get: (p) => p.career.runs, fmt: (v) => v.toLocaleString(), scored: true, better: 'high' },
  { key: 'average', label: 'Average', get: (p) => p.figures.average, fmt: (v) => v.toFixed(2), scored: true, better: 'high', note: 'Runs per dismissal' },
  { key: 'strikeRate', label: 'Strike rate', get: (p) => p.figures.strikeRate, fmt: (v) => v.toFixed(1), scored: true, better: 'high', note: 'Runs per 100 balls' },
  { key: 'hundreds', label: 'Hundreds', get: (p) => p.career.hundreds, fmt: (v) => v.toLocaleString(), scored: true, better: 'high' },
  { key: 'doubles', label: 'Double hundreds', get: (p) => p.career.doubleHundreds, fmt: (v) => v.toLocaleString(), scored: true, better: 'high' },
  { key: 'fifties', label: 'Fifties (50 to 99)', get: (p) => p.career.fifties, fmt: (v) => v.toLocaleString(), scored: false },
  { key: 'conversion', label: 'Fifties converted to hundreds', get: (p) => p.figures.conversion, fmt: (v) => `${v.toFixed(1)}%`, scored: true, better: 'high', note: 'Hundreds as a share of all scores of 50 or more' },
  { key: 'perHundred', label: 'Innings per hundred', get: (p) => p.figures.inningsPerHundred, fmt: (v) => v.toFixed(1), scored: true, better: 'low' },
  { key: 'highScore', label: 'Highest score', get: (p) => p.career.highScore, fmt: (v, p) => `${v}${p.career.highScoreNotOut ? '*' : ''}`, scored: true, better: 'high' },
];
const RANKING = [
  { key: 'bestRank', label: 'Best innings, ranked', get: (p) => p.ranking.best?.rank ?? null, fmt: (v) => ord(v), scored: true, better: 'low', note: 'Of every Test century' },
  { key: 'top100', label: 'Hundreds in the top 100', get: (p) => p.ranking.inTop100, fmt: (v) => v, scored: true, better: 'high' },
  { key: 'top500', label: 'Hundreds in the top 500', get: (p) => p.ranking.inTop500, fmt: (v) => v, scored: true, better: 'high' },
  { key: 'avgToc', label: 'Average Greatness score of their hundreds', phrase: 'average Greatness score', get: (p) => p.ranking.averageToc, fmt: (v) => v.toFixed(1), scored: true, better: 'high' },
  { key: 'elite', label: 'Elite or Legendary hundreds', phrase: 'Elite and Legendary hundreds', get: (p) => p.ranking.elite, fmt: (v) => v, scored: true, better: 'high', note: 'ToC score of 82 or more' },
  { key: 'elitePct', label: 'Share of hundreds that are Elite or better', phrase: 'share of hundreds that are Elite or better', get: (p) => p.ranking.elitePct, fmt: (v) => `${v.toFixed(1)}%`, scored: true, better: 'high' },
];

const pct = (n, of) => (of ? Math.round((100 * n) / of) : null);
// What their hundreds did. The first three can have a leader; the rest are context, with no winner.
const REFERENCE = [
  { key: 'winRate', label: 'Team won when he scored a hundred', phrase: 'how often the team won when he scored a hundred', get: (p) => (p.ref ? pct(p.ref.results.won, p.ref.results.known) : null), fmt: (v, p) => `${v}% (${p.ref.results.won} of ${p.ref.results.known})`, scored: true, better: 'high', note: 'Won, of the hundreds where the result is known' },
  { key: 'tons', label: 'Tons of consequence', phrase: 'tons of consequence', get: (p) => (p.ref ? p.ref.tons : null), fmt: (v, p) => `${v} of ${p.ref.measured}`, scored: true, better: 'high', note: 'Hundreds that won, saved or rescued a match' },
  { key: 'tonShare', label: 'Share that were tons of consequence', phrase: 'share of hundreds that were tons of consequence', get: (p) => (p.ref ? pct(p.ref.tons, p.ref.measured) : null), fmt: (v) => `${v}%`, scored: true, better: 'high' },
  { key: 'topTier', label: 'Hundreds against the top tier', get: (p) => (p.ref ? p.ref.byTier[0] : null), fmt: (v, p) => `${v} (${pct(v, p.ref.hundreds)}%)`, scored: false, note: 'England, Australia, India' },
  { key: 'topTons', label: 'Tons of consequence against the top tier', get: (p) => (p.ref ? p.ref.tonsByTier[0] : null), fmt: (v) => v, scored: false },
  { key: 'otherTier', label: 'Hundreds against the lower tier', get: (p) => (p.ref ? p.ref.byTier[2] + p.ref.byTier[3] : null), fmt: (v, p) => `${v} (${pct(v, p.ref.hundreds)}%)`, scored: false, note: 'Sri Lanka, West Indies, Pakistan and the rest' },
  { key: 'away', label: 'Hundreds away from home', get: (p) => (p.ref ? p.ref.away : null), fmt: (v, p) => `${v} of ${p.ref.home + p.ref.away}`, scored: false, note: 'Where we have the match record' },
];

// Career figures for a player whose career began before ball-by-ball records are complete cover only part of it, so
// they are shown with a dagger and never lead.
const isPartial = (p) => Boolean(p.career.partial);

function buildRows(defs, players, partialAware = false) {
  return defs.map((d) => {
    const values = players.map((p) => d.get(p));
    const eligible = values.map((v, i) => (partialAware && isPartial(players[i]) ? null : v));
    const present = eligible.filter((v) => v != null);
    let leaders = [];
    if (d.scored && present.length) {
      const best = d.better === 'low' ? Math.min(...present) : Math.max(...present);
      leaders = eligible.map((v, i) => (v === best ? i : -1)).filter((i) => i >= 0);
      if (leaders.length === players.length) leaders = []; // an all-way tie has no leader
    }
    return { key: d.key, label: d.label, phrase: d.phrase || d.label.toLowerCase(), note: d.note || null, scored: d.scored, better: d.better || null, values, display: values.map((v, i) => (v == null ? '-' : d.fmt(v, players[i]) + (partialAware && isPartial(players[i]) ? ' †' : ''))), leaders };
  });
}

/** Who leads on what, in plain words. Only states facts. */
function describe(rows, players, section) {
  const wins = players.map(() => []);
  for (const r of rows) for (const i of r.leaders) wins[i].push(r.phrase);
  const parts = players
    .map((p, i) => ({ who: lastName(p.name), list: wins[i] }))
    .filter((x) => x.list.length)
    .sort((a, b) => b.list.length - a.list.length)
    .map((x) => `${x.who} leads on ${join(x.list)}`);
  return parts.length ? `${section}: ${parts.join('. ')}.` : `${section}: no one leads clearly.`;
}

/** The comparison for a set under a weighting: profiles, the two tables, and who leads on how many measures. */
export function compareCareers(set, order, bias = null) {
  const ranked = rankAll(order, bias);
  const players = set.players.map((p) => profile(p, ranked));
  const numbers = buildRows(NUMBERS, players, true);
  const ranking = buildRows(RANKING, players);
  const reference = buildRows(REFERENCE, players);
  const scored = [...numbers, ...ranking, ...reference].filter((r) => r.scored);
  const leads = players.map((p, i) => ({ name: p.name, count: scored.filter((r) => r.leaders.includes(i)).length }));
  const top = Math.max(...leads.map((l) => l.count));
  const overall = leads.filter((l) => l.count === top).map((l) => lastName(l.name));
  const summary = [
    describe(numbers, players, 'On the numbers'),
    describe(ranking, players, 'On the ranking'),
    describe(reference.filter((r) => r.scored), players, 'On what their hundreds did'),
    top > 0 ? `Across all ${scored.length} measures, ${join(overall)} ${overall.length > 1 ? 'share the most leads' : 'leads on the most'} (${top}).` : '',
  ].filter(Boolean);
  const partials = players.filter(isPartial).map((p) => ({ name: p.name, archive: p.career.hundreds, total: p.career.datasetHundreds }));
  return { set, players, partials, numbers, ranking, reference, leads, measures: scored.length, summary, asOf: CAREERS_AS_OF };
}
