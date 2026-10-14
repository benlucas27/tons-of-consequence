/**
 * The Tons of Consequence connector for Claude: a read-only MCP server built on the same code and data as
 * the website, so Claude and the site can never disagree. It is served at /mcp (see src/app/mcp/route.js),
 * and Claude (web, desktop, mobile or Claude Code) connects to it by URL. Nothing here writes anything.
 *
 * Claude does the conversation; these tools supply the facts. Scores are the model's, not the AI's.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ALL, BY_ID, TOTAL, ERAS, rankAll, defaultRankOf, inningsPath } from './dataset.js';
import {
  LEVERS, LEVER_BY_KEY, DEFAULT_ORDER, RANK_WEIGHTS, PRESETS, BIASES, NATIONS, TIERS,
  tierOf,
} from './scoring.js';
import { calcVolatility, volatilityTier } from './volatility.js';
import { answer, compareInnings, searchInnings, EXAMPLE_QUESTIONS } from './ask.js';
import { COMPARE_SETS, setById, compareCareers, CAREERS_AS_OF } from './careerCompare.js';
import { videoFor, watchUrl } from './videos.js';
import { momentsFor, clock, watchUrl as podcastUrl, episodeLabel } from './helloSport.js';
import { SITE_URL } from './site.js';
import { verdictOf, wherePlayed, BATTERS } from './consequence.js';
import { tierOfOpponent, tierName, WHERE_LABEL } from './matchFacts.js';

const LEVER_KEYS = LEVERS.map((l) => l.key);
const PRESET_NAMES = Object.keys(PRESETS);

const INSTRUCTIONS = `Tons of Consequence is an unofficial, opinionated ranking of every Test cricket century (${TOTAL.toLocaleString()} innings). \
Each innings has six criterion scores (0 to 100): Match Impact, Clutchness, Narrative, Conditions & Opposition, Historical Weight and Perceived Greatness. \
A reader's weighting is just an ORDER of those six (first place counts 30%, then 22, 18, 14, 10, 6), giving a ToC score out of 100. \
There are five presets: ${PRESET_NAMES.join(', ')}. The Patriot adds an Australian bonus, which the results always report. \
Use the tools for facts and quote scores as the model's view, not as objective truth. The match result is only known for about a third of innings. \
Link to an innings with the url field when you mention it. For an open question in plain English, try the ask tool first.`;

// ---- small helpers

const text = (value) => ({ content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] });
const problem = (message) => ({ isError: true, content: [{ type: 'text', text: message }] });
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const readOnly = (title) => ({ ...READ_ONLY, title });

const weightingShape = {
  preset: z.enum(PRESET_NAMES).optional().describe(`Which point of view to score on. One of: ${PRESET_NAMES.join(', ')}. Default if omitted.`),
  order: z.array(z.enum(LEVER_KEYS)).length(6).optional()
    .describe(`A custom weighting: all six criteria in order of importance (most important first). Overrides preset. Keys: ${LEVER_KEYS.join(', ')}.`),
  australianBonus: z.boolean().optional()
    .describe('Add the Australian bonus (+5 for any Australian innings, +3 more for 1989 to 2007). On by default only for the Patriot preset.'),
};

/** Turns tool arguments into { order, bias }, or an error message. */
export function resolveWeighting({ preset, order, australianBonus } = {}) {
  let base = PRESETS[preset || 'Default'];
  if (!base) return { error: `Unknown preset "${preset}". Choose one of: ${PRESET_NAMES.join(', ')}.` };
  let chosen = base.order;
  if (order) {
    if (new Set(order).size !== 6 || order.some((k) => !LEVER_BY_KEY[k])) return { error: `order must list each of the six criteria exactly once: ${LEVER_KEYS.join(', ')}.` };
    chosen = order;
  }
  const bias = australianBonus === undefined ? (order ? null : base.bias) : (australianBonus ? 'au' : null);
  return { order: [...chosen], bias };
}

const countryCode = (s) => {
  if (!s) return null;
  const up = String(s).trim().toUpperCase();
  if (NATIONS[up]) return up;
  const hit = Object.entries(NATIONS).find(([, name]) => name.toLowerCase() === String(s).trim().toLowerCase());
  return hit ? hit[0] : null;
};

const runsText = (c) => `${c.runs}${c.notOut ? '*' : ''}`;

/** A compact description of one innings under a weighting (`c` comes from rankAll, so it has toc and rank). */
function summary(c, order, bias) {
  return {
    id: c.id,
    rank: c.rank,
    player: c.name,
    runs: runsText(c),
    country: NATIONS[c.country] || c.country,
    opponent: c.opponent,
    venue: c.venue,
    year: c.year,
    matchResult: c.matchResult === 'unknown' ? null : c.matchResult,
    tocScore: c.toc,
    tier: tierOf(c.toc).label,
    rankOnDefault: defaultRankOf(c.id),
    url: `${SITE_URL}${inningsPath(c, order, bias)}`,
  };
}

const weightingNote = (order, bias) => ({
  order: order.map((k) => LEVER_BY_KEY[k].name),
  australianBonus: bias ? BIASES[bias].note : null,
});

function findOne({ id, player, year, runs }, order, bias) {
  const list = rankAll(order, bias);
  if (id != null) return list.find((c) => c.id === id) || null;
  if (!player) return null;
  const hits = searchInnings(player, order, 400, bias).filter((c) => (year == null || c.year === year) && (runs == null || c.runs === runs));
  return hits[0] || null;
}

// ---- the server

export function createServer() {
  const server = new McpServer({ name: 'tons-of-consequence', version: '2.0.0' }, { instructions: INSTRUCTIONS });

  server.registerTool('ask', {
    title: 'Ask a question about Test centuries',
    description: 'Answer a plain-English question about Test centuries using the ranking, for example "who has the better hundred, Ponting or Smith?", "best centuries by India since 2010" or "most clutch hundreds in a lost Test". It understands players, countries, grounds, years, scores and what the reader cares about, and it reports how it understood the question. Try this first for open questions.',
    inputSchema: { question: z.string().min(2).max(400), ...weightingShape },
    annotations: readOnly('Ask a question about Test centuries'),
  }, async ({ question, preset, order, australianBonus }) => {
    const w = resolveWeighting({ preset, order, australianBonus });
    if (w.error) return problem(w.error);
    const a = answer(question, w.order, { bias: w.bias });
    const base = { understoodAs: a.interpreted, assumptions: (a.assumed || []).map((x) => `Took "${x.said}" to mean ${x.player.name}; others: ${x.others.map((o) => o.name).join(', ')}`), notes: a.notes || [], weighting: weightingNote(a.order, a.bias) };
    const out = { kind: a.kind, headline: a.headline, ...base };
    if (a.kind === 'compare') {
      const c = a.comparison;
      Object.assign(out, {
        verdict: c.verdict,
        holdsAcrossPresets: c.robustness,
        underEachPreset: c.presets.map((p) => `${p.name}: ${p.margin < 0.1 ? 'level' : `${(p.aWins ? c.a : c.b).name} by ${p.margin}`}`),
        innings: (a.multi || [c.a, c.b]).map((x) => summary(x, a.order, a.bias)),
        wholeCareers: a.careers ? a.careers.map((k) => ({ player: k.name, hundreds: k.count, averageScore: k.average, inTop100: k.inTop100 })) : undefined,
        careerNote: a.depth || undefined,
      });
    } else if (a.kind === 'innings') {
      out.innings = summary(a.innings, a.order, a.bias);
    } else if (a.kind === 'players') {
      out.player = { name: a.career.name, hundreds: a.career.count, averageScore: a.career.average, inTop100: a.career.inTop100 };
      out.results = a.items.map((c) => summary(c, a.order, a.bias));
      out.totalMatching = a.total;
    } else if (a.kind === 'list') {
      out.results = a.items.map((c) => summary(c, a.order, a.bias));
      out.totalMatching = a.total;
    } else {
      out.suggestions = a.suggestions;
    }
    return text(out);
  });

  server.registerTool('rank_centuries', {
    title: 'Rank Test centuries',
    description: 'Rank Test centuries by the Tons of Consequence model under a preset or a custom weighting, with optional filters. Each result includes its rank on the Default weighting so you can see how much a point of view changes things. Use for "top 10", "best by country or era", or "how do Romantics and Analysts differ".',
    inputSchema: {
      ...weightingShape,
      country: z.string().optional().describe('Batting side, as a code or name: AUS, ENG, IND, WI, SA, PAK, NZ, SL, ZIM, BAN, AFG, IRE'),
      opponent: z.string().optional().describe('Opposition team name, e.g. England'),
      venue: z.string().optional().describe('Part of the ground or city name, e.g. Lord\'s, Melbourne'),
      era: z.enum(ERAS.map((e) => e.value)).optional(),
      fromYear: z.number().int().optional(),
      toYear: z.number().int().optional(),
      minRuns: z.number().int().optional(),
      maxRuns: z.number().int().optional(),
      result: z.enum(['win', 'draw', 'loss']).optional().describe('Result of the Test for the batting side. Only known for about a third of innings.'),
      query: z.string().optional().describe('Free text: player, ground, series or tag'),
      sortBy: z.enum(['toc', 'runs', 'year']).default('toc'),
      limit: z.number().int().min(1).max(50).default(10),
      offset: z.number().int().min(0).default(0),
    },
    annotations: readOnly('Rank Test centuries'),
  }, async (args) => {
    const w = resolveWeighting(args);
    if (w.error) return problem(w.error);
    const cc = args.country ? countryCode(args.country) : null;
    if (args.country && !cc) return problem(`Unknown country "${args.country}". Use a code or name from: ${Object.entries(NATIONS).map(([k, v]) => `${k} (${v})`).join(', ')}.`);
    const eraDef = ERAS.find((e) => e.value === args.era);
    const q = (args.query || '').toLowerCase().trim();
    const ven = (args.venue || '').toLowerCase().trim();
    const opp = (args.opponent || '').toLowerCase().trim();
    let list = rankAll(w.order, w.bias).filter((c) => {
      if (cc && c.country !== cc) return false;
      if (opp && !(c.opponent || '').toLowerCase().includes(opp)) return false;
      if (ven && !(c.venue || '').toLowerCase().includes(ven)) return false;
      if (eraDef && !eraDef.test(c.year)) return false;
      if (args.fromYear != null && c.year < args.fromYear) return false;
      if (args.toYear != null && c.year > args.toYear) return false;
      if (args.minRuns != null && c.runs < args.minRuns) return false;
      if (args.maxRuns != null && c.runs > args.maxRuns) return false;
      if (args.result && c.matchResult !== args.result) return false;
      if (q && ![c.name, c.player, c.opponent, c.venue, c.series, ...(c.tags || [])].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
    if (args.sortBy === 'runs') list = [...list].sort((a, b) => b.runs - a.runs || b.toc - a.toc);
    if (args.sortBy === 'year') list = [...list].sort((a, b) => b.year - a.year || b.toc - a.toc);
    const limit = args.limit ?? 10;
    const offset = args.offset ?? 0;
    return text({
      totalMatching: list.length,
      weighting: weightingNote(w.order, w.bias),
      results: list.slice(offset, offset + limit).map((c) => summary(c, w.order, w.bias)),
    });
  });

  server.registerTool('get_century', {
    title: 'Get one innings in full',
    description: 'Full detail on one innings: its story, the six criterion scores, its score and rank under every preset, how divisive it is, a video if one has been found, and a link. Find it by id (from another tool) or by player name plus year or runs.',
    inputSchema: {
      id: z.number().int().optional().describe('The innings id, from another tool'),
      player: z.string().optional().describe('Player name, e.g. "Matt Renshaw"'),
      year: z.number().int().optional(),
      runs: z.number().int().optional(),
      ...weightingShape,
    },
    annotations: readOnly('Get one innings in full'),
  }, async (args) => {
    const w = resolveWeighting(args);
    if (w.error) return problem(w.error);
    const c = findOne(args, w.order, w.bias);
    if (!c) return problem('No matching innings. Try the ask tool, or rank_centuries with a query, to find its id.');
    const raw = BY_ID.get(c.id);
    const vol = calcVolatility(raw);
    const video = videoFor(c.id);
    return text({
      ...summary(c, w.order, w.bias),
      balls: c.balls || null,
      minutes: c.minutes || null,
      series: c.series || null,
      story: c.story || null,
      opposition: tierName(tierOfOpponent(c.opponent)),
      playedAt: WHERE_LABEL[wherePlayed(c.id)] || null,
      tonOfConsequence: (() => { const v = verdictOf(c.id); return v ? { answer: v.passes ? 'yes' : 'no', scenario: v.scenario, reason: v.because } : { answer: 'not enough match data yet' }; })(),
      matchNotes: c.facts || [],
      tags: c.tags || [],
      criteria: LEVERS.map((l) => ({ criterion: l.name, score: c.levers[l.key] })),
      underEachPreset: PRESET_NAMES.map((name) => {
        const p = PRESETS[name];
        const r = rankAll(p.order, p.bias).find((x) => x.id === c.id);
        return { preset: name, tocScore: r.toc, rank: r.rank };
      }),
      divisiveness: { score: vol.volatility, label: volatilityTier(vol.volatility).label, scoreRange: [vol.min, vol.max] },
      video: video ? { description: video.note, channel: video.channel, minutes: video.mins, covers: video.kind === 'match' ? 'the whole Test' : 'this innings', url: watchUrl(video.yt) } : null,
      helloSport: momentsFor(c.id).map((m) => ({ episode: episodeLabel(m), startsAt: clock(m.start), url: podcastUrl(m.youtubeId, m.start), note: m.note })),
      weighting: weightingNote(w.order, w.bias),
    });
  });


  server.registerTool('batter_records', {
    title: 'Batter records and leaderboards',
    description: 'Count and rank batters by their Test hundreds, with filters, for questions like "who has the most hundreds against strong opposition?", "most hundreds away from home", "who has the most tons of consequence?" or "how often does Australia win when Smith scores a hundred?". Each row gives the hundreds that match, how many were tons of consequence, and the team results (won, drawn, lost, win rate) where the result is known. Give a batter for one record, or leave it out for a leaderboard. Opposition tiers: 1 England, Australia, India; 2 New Zealand, South Africa; 3 Sri Lanka, West Indies, Pakistan; 4 everyone else. Where it was played, and tons of consequence, are known only for hundreds with a match record (mostly 2006 on, plus Bradman).',
    inputSchema: {
      batter: z.string().optional().describe('A batter, such as "Steve Smith". Omit for a leaderboard.'),
      opposition: z.string().optional().describe('Only hundreds against this team, such as "Australia".'),
      oppositionTier: z.number().int().min(1).max(4).optional().describe('Only hundreds against this tier of opposition (1 is the top tier).'),
      where: z.enum(['home', 'away', 'neutral']).optional().describe('Only hundreds at home, away or on neutral ground.'),
      result: z.enum(['win', 'draw', 'loss']).optional().describe('Only hundreds in matches the batter’s side won, drew or lost.'),
      tonOfConsequence: z.boolean().optional().describe('true: only tons of consequence. false: only good tons that were not.'),
      since: z.number().int().optional().describe('From this year.'),
      until: z.number().int().optional().describe('Up to this year.'),
      country: z.string().optional().describe('Batting side, code or name.'),
      sortBy: z.enum(['hundreds', 'tonsOfConsequence', 'winRate']).default('hundreds'),
      limit: z.number().int().min(1).max(50).default(10),
    },
    annotations: readOnly('Batter records and leaderboards'),
  }, async ({ batter, opposition, oppositionTier, where, result, tonOfConsequence, since, until, country, sortBy, limit }) => {
    const cc = country ? countryCode(country) : null;
    if (country && !cc) return problem(`Unknown country "${country}".`);
    const wantWhere = where ? { home: 'H', away: 'A', neutral: 'N' }[where] : null;
    const needle = batter ? batter.toLowerCase().trim() : null;
    const people = BATTERS.filter((b) => !needle || b.name.toLowerCase() === needle || b.name.toLowerCase().includes(needle));
    if (batter && people.length === 0) return problem(`No batter matching "${batter}".`);
    const rows = [];
    for (const b of people) {
      const matching = b.innings.filter((c) => {
        if (cc && c.country !== cc) return false;
        if (opposition && c.opponent.toLowerCase() !== opposition.toLowerCase()) return false;
        if (oppositionTier && tierOfOpponent(c.opponent) !== oppositionTier) return false;
        if (since != null && c.year < since) return false;
        if (until != null && c.year > until) return false;
        if (wantWhere && wherePlayed(c.id) !== wantWhere) return false;
        if (result && c.matchResult !== result) return false;
        if (tonOfConsequence != null) { const v = verdictOf(c.id); if (!v || v.passes !== tonOfConsequence) return false; }
        return true;
      });
      if (!matching.length) continue;
      const known = matching.filter((c) => ['win', 'draw', 'loss'].includes(c.matchResult));
      const won = known.filter((c) => c.matchResult === 'win').length;
      const measured = matching.filter((c) => verdictOf(c.id));
      rows.push({
        batter: b.name,
        country: matching[0].country,
        hundreds: matching.length,
        tonsOfConsequence: measured.filter((c) => verdictOf(c.id).passes).length,
        measuredForConsequence: measured.length,
        results: { known: known.length, won, drawn: known.filter((c) => c.matchResult === 'draw').length, lost: known.filter((c) => c.matchResult === 'loss').length },
        winRate: known.length >= 5 ? Math.round((100 * won) / known.length) : null,
        url: `${SITE_URL}/tons-of-consequence/${b.slug}`,
      });
    }
    const key = { hundreds: (r) => r.hundreds, tonsOfConsequence: (r) => r.tonsOfConsequence, winRate: (r) => r.winRate ?? -1 }[sortBy || 'hundreds'];
    rows.sort((a, b) => key(b) - key(a) || b.hundreds - a.hundreds);
    return text({
      note: 'Counts cover hundreds in the database. Tons of consequence and where it was played are only known where we have a match record, so check measuredForConsequence. A win rate needs at least five known results.',
      filters: { batter, opposition, oppositionTier, where, result, tonOfConsequence, since, until, country },
      results: rows.slice(0, limit ?? 10),
      shown: Math.min(rows.length, limit ?? 10),
      matchingBatters: rows.length,
    });
  });

  server.registerTool('compare_centuries', {
    title: 'Compare innings head to head',
    description: 'Compare two or three innings under a weighting and get a written verdict on which wins and why, plus whether the verdict holds under every preset. Give ids, or short names like "Lara 153" or "Stokes 135 2019".',
    inputSchema: {
      ids: z.array(z.number().int()).max(3).optional(),
      innings: z.array(z.string().min(2)).max(3).optional().describe('Short descriptions such as "Lara 153" or "Ponting 156 2005"'),
      ...weightingShape,
    },
    annotations: readOnly('Compare innings head to head'),
  }, async ({ ids, innings, preset, order, australianBonus }) => {
    const w = resolveWeighting({ preset, order, australianBonus });
    if (w.error) return problem(w.error);
    const picked = [];
    for (const id of ids || []) { const c = BY_ID.get(id); if (c) picked.push(c); }
    for (const t of innings || []) { const c = searchInnings(t, w.order, 1, w.bias)[0]; if (c) picked.push(c); }
    const unique = [...new Map(picked.map((c) => [c.id, c])).values()];
    if (unique.length < 2) return problem('Need at least two innings that can be found. Try ids from rank_centuries, or names like "Lara 153".');
    const ranked = rankAll(w.order, w.bias);
    const items = unique.map((c) => ranked.find((x) => x.id === c.id)).sort((a, b) => b.toc - a.toc);
    const cmp = compareInnings(items[0], items[1], w.order, w.bias);
    return text({
      verdict: cmp.verdict + (items[2] ? ` ${items[2].name}'s ${runsText(items[2])} placed third, ${Math.round((items[0].toc - items[2].toc) * 10) / 10} points off the top.` : ''),
      holdsAcrossPresets: cmp.robustness,
      underEachPreset: cmp.presets.map((p) => `${p.name}: ${p.margin < 0.1 ? 'level' : `${(p.aWins ? cmp.a : cmp.b).name} by ${p.margin}`}`),
      innings: items.map((c) => summary(c, w.order, w.bias)),
      weighting: weightingNote(w.order, w.bias),
    });
  });

  server.registerTool('compare_careers', {
    title: 'Compare whole careers',
    description: `Compare whole Test careers side by side for a preset group of players. Gives the numbers from every innings (runs, average, strike rate, hundreds, fifties, how often a fifty becomes a hundred, innings per hundred) and how their hundreds rank on the weighting, with who leads on each measure. Presets: ${COMPARE_SETS.map((s) => `${s.id} (${s.name}: ${s.players.map((p) => p.name).join(', ')})`).join('; ')}.`,
    inputSchema: { set: z.enum(COMPARE_SETS.map((s) => s.id)).default(COMPARE_SETS[0].id), ...weightingShape },
    annotations: readOnly('Compare whole careers'),
  }, async ({ set, preset, order, australianBonus }) => {
    const w = resolveWeighting({ preset, order, australianBonus });
    if (w.error) return problem(w.error);
    const r = compareCareers(setById(set), w.order, w.bias);
    const table = (rows) => rows.map((row) => ({ measure: row.label, values: Object.fromEntries(r.players.map((p, i) => [p.name, row.display[i]])), leader: row.leaders.map((i) => r.players[i].name) }));
    return text({
      set: r.set.name,
      careerFiguresUpTo: CAREERS_AS_OF,
      summary: r.summary,
      measuresLed: Object.fromEntries(r.leads.map((l) => [l.name, l.count])),
      theNumbers: table(r.numbers),
      theRanking: table(r.ranking),
      bestInnings: Object.fromEntries(r.players.map((p) => [p.name, p.innings.slice(0, 3).map((c) => summary(c, w.order, w.bias))])),
      weighting: weightingNote(w.order, w.bias),
      notes: ['Average is runs per dismissal.', 'Career figures come from ball-by-record data (Cricsheet); each player\'s hundreds match the ranking exactly.'],
    });
  });

  server.registerTool('most_divisive', {
    title: 'Most divisive innings',
    description: 'Find the innings whose score swings most depending on what you value (story versus conditions versus pressure and so on). These make the best arguments.',
    inputSchema: {
      country: z.string().optional().describe('Batting side, code or name'),
      era: z.enum(ERAS.map((e) => e.value)).optional(),
      minRuns: z.number().int().optional(),
      limit: z.number().int().min(1).max(30).default(10),
    },
    annotations: readOnly('Most divisive innings'),
  }, async ({ country, era, minRuns, limit }) => {
    const cc = country ? countryCode(country) : null;
    if (country && !cc) return problem(`Unknown country "${country}".`);
    const eraDef = ERAS.find((e) => e.value === era);
    const ranked = rankAll(DEFAULT_ORDER, null);
    const rows = ranked
      .filter((c) => (!cc || c.country === cc) && (!eraDef || eraDef.test(c.year)) && (minRuns == null || c.runs >= minRuns))
      .map((c) => ({ c, v: calcVolatility(c) }))
      .sort((a, b) => b.v.volatility - a.v.volatility || b.c.toc - a.c.toc)
      .slice(0, limit ?? 10);
    return text({
      note: 'Divisiveness is measured across five separate points of view and runs from 0 to 100.',
      results: rows.map(({ c, v }) => ({ ...summary(c, DEFAULT_ORDER, null), divisiveness: v.volatility, label: volatilityTier(v.volatility).label, scoreRange: [v.min, v.max] })),
    });
  });

  server.registerTool('list_options', {
    title: 'How the model works',
    description: 'Explains the model: the six criteria, how a weighting works, the five presets (and the Australian bonus), the tiers, and the valid filter values. Call this if you are unsure what to pass to another tool.',
    inputSchema: {},
    annotations: readOnly('How the model works'),
  }, async () => text({
    about: `An unofficial ranking of ${TOTAL.toLocaleString()} Test centuries. A weighting is an order of the six criteria: ${RANK_WEIGHTS.join(', ')} percent from first to last.`,
    site: SITE_URL,
    criteria: LEVERS.map((l) => ({ key: l.key, name: l.name, asks: l.ask, description: l.description })),
    presets: PRESET_NAMES.map((name) => ({ name, order: PRESETS[name].order.map((k) => LEVER_BY_KEY[k].name), australianBonus: Boolean(PRESETS[name].bias), description: PRESETS[name].blurb })),
    australianBonus: BIASES.au.note,
    tiers: TIERS.map((t) => `${t.label}: ${t.min}+`),
    countries: Object.entries(NATIONS).map(([code, name]) => ({ code, name })),
    eras: ERAS.map((e) => ({ value: e.value, label: e.label })),
    exampleQuestions: EXAMPLE_QUESTIONS,
    caveats: ['Scores are the model\'s opinion, not facts.', 'The result of the Test is known for only about a third of innings.', `Data covers ${ALL.length.toLocaleString()} innings and is refreshed monthly.`],
  }));

  return server;
}
