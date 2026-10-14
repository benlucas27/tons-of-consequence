/**
 * Answers plain-English questions about the innings, with no server and no AI service: a small
 * parser turns "who has the better hundred, Ponting or Smith?" or "best clutch centuries by
 * India since 2010" into a comparison or a filtered ranking, scored under the reader's weighting.
 *
 * Pure functions over the dataset, so it runs in the browser and in tests. `interpreted` always
 * says how the question was understood, so a wrong guess is visible rather than silent.
 */
import { ALL, rankAll } from './dataset.js';
import { LEVERS, LEVER_BY_KEY, NATIONS, PRESET_ORDERS, tocForOrder, weightsFromOrder } from './scoring.js';
import { calcVolatility, writeVerdict } from './volatility.js';

// ---- text helpers

export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']s\b/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9*]+/g, ' ')
    .trim();

const wordRe = (phrase) => new RegExp(`(^| )${phrase}( |$)`);
const has = (text, phrase) => wordRe(phrase).test(text);
const hasAny = (text, phrases) => phrases.some((p) => has(text, p));

// ---- players

const PLAYERS = new Map();
for (const c of ALL) {
  const key = `${c.name}|${c.country}`;
  if (!PLAYERS.has(key)) {
    const tokens = norm(c.name).split(' ');
    PLAYERS.set(key, { key, name: c.name, country: c.country, tokens, first: tokens[0], last: tokens[tokens.length - 1], innings: [] });
  }
  PLAYERS.get(key).innings.push(c);
}
const BY_SURNAME = new Map();
for (const p of PLAYERS.values()) {
  if (!BY_SURNAME.has(p.last)) BY_SURNAME.set(p.last, []);
  BY_SURNAME.get(p.last).push(p);
}
// Surnames that are also everyday words: only count them with a first name beside them.
const NEEDS_FIRST_NAME = new Set(['may', 'hope', 'young', 'best', 'hall', 'bell', 'cook', 'king', 'miller', 'wright', 'wood', 'border', 'major', 'short', 'strong', 'will', 'price', 'long', 'lee', 'gray', 'rose', 'dean']);

const byCount = (a, b) => b.innings.length - a.innings.length || a.name.localeCompare(b.name);

/** Every player named in the question, in order, with the innings they pinned down (if any). */
function findMentions(tokens) {
  const found = [];
  for (let i = 0; i < tokens.length; i++) {
    const cands = BY_SURNAME.get(tokens[i]);
    if (!cands) continue;
    const prev = tokens[i - 1];
    const firstMatch = prev && cands.filter((p) => p.first === prev || (prev.length >= 3 && p.first.startsWith(prev) && p.first.length - prev.length <= 2));
    let player;
    let start = i;
    let assumed = null;
    if (firstMatch && firstMatch.length) {
      player = [...firstMatch].sort(byCount)[0];
      start = i - 1;
    } else if (NEEDS_FIRST_NAME.has(tokens[i])) {
      continue;
    } else {
      const sorted = [...cands].sort(byCount);
      player = sorted[0];
      if (sorted.length > 1) assumed = { said: tokens[i], player, others: sorted.slice(1, 4) };
    }
    // a score right beside the name picks one innings: "ponting 156", "lara 153*"
    let runs = null;
    const near = [tokens[i + 1], tokens[i - 2] && start === i - 1 ? null : tokens[i - 1]];
    for (const t of near) {
      const m = /^(\d{3})\*?$/.exec(t || '');
      if (m && player.innings.some((c) => c.runs === Number(m[1]))) { runs = Number(m[1]); break; }
    }
    found.push({ player, runs, at: start, assumed });
  }
  return found;
}

// ---- countries, venues, dates, levers

const COUNTRY_WORDS = {
  AUS: ['australia', 'australian', 'australians', 'aussie', 'aussies'],
  ENG: ['england', 'english', 'englishmen'],
  IND: ['india', 'indian', 'indians'],
  WI: ['west indies', 'west indian', 'west indians', 'windies', 'caribbean'],
  SA: ['south africa', 'south african', 'south africans', 'proteas', 'saffa'],
  PAK: ['pakistan', 'pakistani', 'pakistanis'],
  NZ: ['new zealand', 'new zealander', 'new zealanders', 'kiwi', 'kiwis', 'black caps'],
  SL: ['sri lanka', 'sri lankan', 'sri lankans', 'lankan', 'lankans'],
  ZIM: ['zimbabwe', 'zimbabwean', 'zimbabweans'],
  BAN: ['bangladesh', 'bangladeshi', 'bangladeshis'],
  AFG: ['afghanistan', 'afghan', 'afghans'],
  IRE: ['ireland', 'irish'],
};
const OPPONENT_NAME = { AUS: 'Australia', ENG: 'England', IND: 'India', WI: 'West Indies', SA: 'South Africa', PAK: 'Pakistan', NZ: 'New Zealand', SL: 'Sri Lanka', ZIM: 'Zimbabwe', BAN: 'Bangladesh', AFG: 'Afghanistan', IRE: 'Ireland' };
const OPP_MARKER = /(?:^| )(?:against|vs|versus|v|facing|beat|beating|opposed to|off)(?: the)? $/;

function findCountries(text) {
  const hits = [];
  for (const [code, words] of Object.entries(COUNTRY_WORDS)) {
    for (const w of words) {
      const re = new RegExp(`(^| )${w}( |$)`, 'g');
      let m;
      while ((m = re.exec(text))) {
        const at = m.index + m[1].length;
        hits.push({ code, at, end: at + w.length, opponent: OPP_MARKER.test(text.slice(0, at)) });
      }
    }
  }
  // longest match wins where words overlap ("south african" inside "south africa")
  hits.sort((a, b) => a.at - b.at || b.end - a.end);
  const kept = [];
  for (const h of hits) if (!kept.some((k) => h.at < k.end && h.end > k.at)) kept.push(h);
  return kept;
}

const VENUE_ALIASES = {
  mcg: ['Melbourne'], 'melbourne cricket ground': ['Melbourne'],
  scg: ['Sydney'], 'sydney cricket ground': ['Sydney'],
  gabba: ['Brisbane'], waca: ['W.A.C.A', 'Perth'], 'adelaide oval': ['Adelaide'],
  headingley: ['Leeds'], 'trent bridge': ['Nottingham'], edgbaston: ['Birmingham'], 'old trafford': ['Manchester'],
  oval: ['The Oval'], lords: ["Lord's"], 'eden gardens': ['Eden Gardens'], kolkata: ['Eden Gardens'],
  newlands: ['Cape Town'], wanderers: ['Johannesburg'], kingsmead: ['Durban'], 'basin reserve': ['Wellington'],
  'kensington oval': ['Bridgetown'], barbados: ['Bridgetown'], 'sabina park': ['Kingston'], jamaica: ['Kingston'],
  'wankhede': ['Wankhede'], mumbai: ['Wankhede', 'Brabourne', 'Mumbai'], chepauk: ['Chennai'], 'feroz shah kotla': ['Delhi'],
  trinidad: ['Port of Spain', 'Tarouba'], antigua: ["St John's", 'North Sound'], guyana: ['Georgetown', 'Providence'],
  'ssc': ['Colombo (SSC)'], colombo: ['Colombo (SSC)', 'Colombo (PSS)', 'Colombo (RPS)', 'Colombo (CCC)', 'Colombo'],
  dubai: ['Dubai (DICS)'], 'port elizabeth': ['Gqeberha'], gqeberha: ['Gqeberha'], chittagong: ['Chattogram'],
};
const KNOWN_RESULT_SHARE = Math.round((ALL.filter((c) => c.matchResult && c.matchResult !== 'unknown').length / ALL.length) * 100);
const ALL_VENUES = [...new Set(ALL.map((c) => c.venue).filter(Boolean))];

function findVenues(text) {
  const names = new Set();
  const said = [];
  for (const [alias, venues] of Object.entries(VENUE_ALIASES)) {
    if (has(text, alias)) { venues.forEach((v) => names.add(v)); said.push(alias); }
  }
  for (const v of ALL_VENUES) {
    const n = norm(v).replace(/ \w+$/, (m) => (/^ (ssc|pss|rps|ccc|dics)$/.test(m) ? '' : m));
    const base = norm(v.replace(/\(.*\)/, ''));
    if ((n.length >= 4 && has(text, n)) || (base.length >= 4 && has(text, base))) { names.add(v); said.push(base); }
  }
  return { venues: [...names], said: [...new Set(said)] };
}

const DECADES = { '1900s': 1900, '1910s': 1910, '1920s': 1920, '1930s': 1930, '1940s': 1940, '1950s': 1950, '1960s': 1960, '1970s': 1970, '1980s': 1980, '1990s': 1990, '2000s': 2000, '2010s': 2010, '2020s': 2020 };
const DECADE_WORDS = { thirties: 1930, forties: 1940, fifties: 1950, sixties: 1960, seventies: 1970, eighties: 1980, nineties: 1990, noughties: 2000 };
const LATEST_YEAR = Math.max(...ALL.map((c) => c.year));

function findYears(text) {
  let m;
  if ((m = /(?:between|from) (\d{4}) (?:and|to) (\d{4})/.exec(text)) || (m = /(\d{4}) (?:to|and) (\d{4})/.exec(text))) {
    return { from: Math.min(+m[1], +m[2]), to: Math.max(+m[1], +m[2]), label: `${Math.min(+m[1], +m[2])} to ${Math.max(+m[1], +m[2])}` };
  }
  if ((m = /(?:since|after|from|post) (\d{4})(?!\d|s)/.exec(text))) return { from: +m[1], label: `since ${m[1]}` };
  if ((m = /(?:before|until|pre|prior to) (\d{4})(?!\d|s)/.exec(text))) return { to: +m[1] - 1, label: `before ${m[1]}` };
  for (const [k, y] of Object.entries(DECADES)) if (has(text, k) || (y >= 1950 && y <= 1990 && has(text, k.slice(2)))) return { from: y, to: y + 9, label: `the ${k}` };
  for (const [k, y] of Object.entries(DECADE_WORDS)) if (has(text, k)) return { from: y, to: y + 9, label: `the ${k}` };
  if ((m = /(?:in|during|of) (?:the )?(\d{4})(?!\d|s)/.exec(text))) return { from: +m[1], to: +m[1], label: `in ${m[1]}` };
  if (has(text, 'this year')) return { from: LATEST_YEAR, to: LATEST_YEAR, label: `in ${LATEST_YEAR}` };
  if (hasAny(text, ['recent', 'recently', 'modern', 'modern era', 'these days', 'lately'])) return { from: 2010, label: 'since 2010' };
  const bare = /(?:^| )((?:18|19|20)\d{2})(?: |$)/.exec(text);
  if (bare) return { from: +bare[1], to: +bare[1], label: `in ${bare[1]}` };
  return null;
}

const LEVER_WORDS = [
  ['clutchness', ['clutch', 'pressure', 'under pressure', 'nerves', 'crisis', 'collapse', 'rescue', 'rescued', 'backs to the wall']],
  ['narrative', ['story', 'narrative', 'comeback', 'redemption', 'emotional', 'farewell', 'fairytale', 'romantic', 'return']],
  ['matchImpact', ['match winning', 'match winner', 'decisive', 'impact', 'won the match', 'won the game', 'matchwinning']],
  ['conditions', ['conditions', 'tough pitch', 'difficult', 'seaming', 'green top', 'turning', 'swinging', 'against the odds', 'tough conditions', 'hostile', 'toughest']],
  ['historicalWeight', ['historic', 'historical', 'history', 'record', 'records', 'ashes', 'landmark']],
  ['perceivedGreatness', ['iconic', 'legendary', 'revered', 'celebrated', 'considered the greatest']],
];

// ---- ranking helpers

const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);
const runsOf = (c) => `${c.runs}${c.notOut ? '*' : ''}`;
const describe = (c) => `${c.name}'s ${runsOf(c)}`;

function withLeverFirst(order, key) {
  return [key, ...order.filter((k) => k !== key)];
}

function careerOf(player, order) {
  const ranked = rankAll(order);
  const ids = new Set(player.innings.map((c) => c.id));
  const mine = ranked.filter((c) => ids.has(c.id));
  const avg = mine.reduce((a, c) => a + c.toc, 0) / mine.length;
  return {
    player,
    name: player.name,
    country: player.country,
    count: mine.length,
    best: mine[0],
    average: Math.round(avg * 10) / 10,
    inTop100: mine.filter((c) => c.rank <= 100).length,
    inTop500: mine.filter((c) => c.rank <= 500).length,
    innings: mine,
  };
}

function presetCheck(a, b) {
  return Object.entries(PRESET_ORDERS).map(([name, o]) => {
    const ta = tocForOrder(a, o);
    const tb = tocForOrder(b, o);
    return { name, aWins: ta >= tb, a: ta, b: tb, margin: Math.abs(Math.round((ta - tb) * 10) / 10) };
  });
}

/** Head-to-head between two innings under a weighting, with the verdict and how it holds across presets. */
export function compareInnings(a, b, order) {
  const ranked = rankAll(order);
  const byId = new Map(ranked.map((c) => [c.id, c]));
  const ia = byId.get(a.id);
  const ib = byId.get(b.id);
  const v = writeVerdict(ia, ib, weightsFromOrder(order));
  const presets = presetCheck(ia, ib);
  const winnerIsA = v.winner.id === ia.id;
  const flips = presets.filter((p) => (p.aWins !== winnerIsA) && p.margin >= 0.1).map((p) => p.name);
  const robustness = flips.length === 0
    ? `${describe(v.winner)} wins under all five presets, so this is not just a matter of taste.`
    : `${describe(v.loser)} takes it under ${flips.join(' and ')}, so this one depends on what you value.`;
  return { a: ia, b: ib, ...v, presets, flips, robustness };
}

// ---- searching innings by name (used by the comparison picker)

const STOP = new Set(['the', 'a', 'an', 'in', 'at', 'of', 'vs', 'v', 'against', 'for', 'by', 'and']);
export function searchInnings(text, order, limit = 8) {
  const words = norm(text).split(' ').filter((w) => w && !STOP.has(w));
  if (!words.length) return [];
  const ranked = rankAll(order);
  const out = [];
  for (const c of ranked) {
    const hay = ` ${norm([c.name, c.player, c.opponent, c.venue, c.year, c.runs + (c.notOut ? '*' : ''), c.runs, c.series].join(' '))} `;
    if (words.every((w) => hay.includes(` ${w}`) || hay.includes(w))) {
      out.push(c);
      if (out.length >= 400) break;
    }
  }
  // name matches before incidental ones; otherwise best score first (the list is already in that order)
  const nameHit = (c) => words.some((w) => norm(c.name).includes(w)) ? 0 : 1;
  return out.sort((x, y) => nameHit(x) - nameHit(y) || x.rank - y.rank).slice(0, limit);
}

/** An innings by player surname, score and (optionally) year, for example links. */
export function findInnings(surname, runs, year) {
  const s = norm(surname);
  return ALL.find((c) => norm(c.name).split(' ').pop() === s && c.runs === runs && (!year || c.year === year)) || null;
}

// ---- the question

const COMPARE_CUES = ['better', 'best', 'greater', 'greatest', 'vs', 'v', 'versus', 'or', 'compare', 'compared', 'against', 'than', 'beats', 'beat', 'win'];

export const EXAMPLE_QUESTIONS = [
  'Who has the better Test hundred, Ricky Ponting or Steve Smith?',
  'Best centuries by India since 2010',
  'Top 10 most clutch hundreds in a losing cause',
  'Lara 153 vs Stokes 135',
  'Greatest double hundreds at Lord’s',
  'Best innings against Australia in the 1990s',
  'Which centuries divide opinion the most?',
  'Matt Renshaw’s 190',
];

/**
 * Understands a question. Returns { kind, headline, interpreted, assumed, ... } where kind is one of
 * 'compare' | 'players' | 'innings' | 'list' | 'none'.
 */
export function answer(question, order, opts = {}) {
  const text = norm(question);
  const q = String(question || '').trim();
  if (!text) return { kind: 'none', question: q, headline: 'Ask a question about any Test century.', interpreted: [], suggestions: EXAMPLE_QUESTIONS.slice(0, 4) };

  const tokens = text.split(' ');
  const mentions = findMentions(tokens);
  const distinct = [];
  for (const m of mentions) {
    if (!distinct.some((d) => d.player.key === m.player.key && d.runs === m.runs)) distinct.push(m);
  }
  const assumed = distinct.filter((m) => m.assumed).map((m) => m.assumed);
  const ranked = rankAll(order);
  const byId = new Map(ranked.map((c) => [c.id, c]));

  // ---- two or more named: a head-to-head
  const wantsCompare = hasAny(text, COMPARE_CUES) || distinct.length >= 2;
  if (distinct.length >= 2 && wantsCompare) {
    const picks = distinct.slice(0, 3).map((m) => {
      const career = careerOf(m.player, order);
      const pinned = m.runs ? career.innings.find((c) => c.runs === m.runs) : null;
      return { m, career, innings: pinned || career.best, pinned: Boolean(pinned) };
    });
    const interpreted = picks.map((p) => (p.pinned ? `${p.career.name}'s ${runsOf(p.innings)}` : `${p.career.name}'s best hundred`));
    if (picks.length === 2) {
      const [pa, pb] = picks;
      const cmp = compareInnings(pa.innings, pb.innings, order);
      const samePlayer = pa.career.player.key === pb.career.player.key;
      let depth = null;
      if (!samePlayer && !pa.pinned && !pb.pinned) {
        const ahead = pa.career.average >= pb.career.average ? pa : pb;
        const behind = ahead === pa ? pb : pa;
        const bestWinner = cmp.winner.id === pa.innings.id ? pa : pb;
        depth = ahead === bestWinner
          ? `Across every hundred they made, ${ahead.career.name} also comes out ahead: ${ahead.career.count} centuries averaging ${fmt(ahead.career.average)}, against ${behind.career.count} averaging ${fmt(behind.career.average)}.`
          : `Across every hundred they made it flips: ${ahead.career.name} averages ${fmt(ahead.career.average)} over ${ahead.career.count} centuries, against ${fmt(behind.career.average)} over ${behind.career.count} for ${behind.career.name}. Best against best, it is the other way round.`;
      }
      return {
        kind: 'compare', question: q, order, interpreted, assumed, comparison: cmp, careers: samePlayer ? null : [pa.career, pb.career], depth,
        headline: cmp.margin < 1
          ? `Too close to call. ${describe(cmp.winner)} edges it by ${fmt(cmp.margin)} points.`
          : `${describe(cmp.winner)} wins by ${fmt(cmp.margin)} points.`,
      };
    }
    // three: rank them
    const sorted = [...picks].sort((x, y) => y.innings.toc - x.innings.toc);
    return {
      kind: 'compare', question: q, order, interpreted, assumed, multi: sorted.map((p) => p.innings), careers: null, depth: null,
      comparison: compareInnings(sorted[0].innings, sorted[1].innings, order),
      headline: `${describe(sorted[0].innings)} comes out on top of the three.`,
    };
  }

  // ---- filters shared by lists and single players
  const interpreted = [];
  const notes = [];
  const filters = [];

  const countries = findCountries(text);
  let own = countries.filter((c) => !c.opponent);
  let opp = countries.filter((c) => c.opponent);
  if (own.length >= 2 && !opp.length) { opp = [own[1]]; own = [own[0]]; }
  const ownCode = own[0]?.code;
  const oppCode = opp[0]?.code;
  const singleMention = distinct.length === 1 ? distinct[0] : null;
  if (ownCode && !singleMention) {
    filters.push((c) => c.country === ownCode);
    interpreted.push(`${NATIONS[ownCode]} batters`);
  }
  if (oppCode) {
    filters.push((c) => c.opponent === OPPONENT_NAME[oppCode]);
    interpreted.push(`against ${OPPONENT_NAME[oppCode]}`);
  }

  const { venues, said } = findVenues(text);
  if (venues.length) {
    filters.push((c) => venues.includes(c.venue));
    const exact = venues.length === 1 && norm(venues[0].replace(/\(.*\)/, '')) === said[0];
    interpreted.push(`at ${exact ? venues[0] : said[0] ? (said[0].length <= 4 ? said[0].toUpperCase() : said[0].replace(/\b\w/g, (m) => m.toUpperCase())) : venues[0]}`);
  }

  const years = findYears(text);
  if (years) {
    filters.push((c) => (years.from == null || c.year >= years.from) && (years.to == null || c.year <= years.to));
    interpreted.push(years.label);
  }

  if (hasAny(text, ['double', 'double hundred', 'double century', 'double tons', 'double ton', 'doubles', '200s'])) {
    filters.push((c) => c.runs >= 200);
    interpreted.push('200 or more');
  } else if (hasAny(text, ['triple', 'triple hundred', 'triple century', '300s'])) {
    filters.push((c) => c.runs >= 300);
    interpreted.push('300 or more');
  } else {
    let m;
    if ((m = /(?:over|above|more than|at least) (\d{3})/.exec(text))) { const n = +m[1]; filters.push((c) => c.runs >= n); interpreted.push(`${n} or more`); }
    else if ((m = /(?:under|below|less than|fewer than) (\d{3})/.exec(text))) { const n = +m[1]; filters.push((c) => c.runs < n); interpreted.push(`under ${n}`); }
  }
  if (hasAny(text, ['not out', 'unbeaten', 'carried the bat'])) { filters.push((c) => c.notOut); interpreted.push('not out'); }

  if (hasAny(text, ['losing cause', 'in a loss', 'in defeat', 'lost', 'losing', 'despite losing'])) { filters.push((c) => c.matchResult === 'loss'); interpreted.push('in a lost Test'); }
  else if (hasAny(text, ['saved', 'to save', 'rescued the draw', 'draw', 'drawn', 'saved the test', 'saved the match'])) { filters.push((c) => c.matchResult === 'draw'); interpreted.push('in a drawn Test'); }
  else if (hasAny(text, ['won', 'winning', 'in a win', 'in victory', 'match winning', 'matchwinning', 'match winner'])) { filters.push((c) => c.matchResult === 'win'); interpreted.push('in a won Test'); }
  if (interpreted.some((i) => / Test$/.test(i))) notes.push(`The result of the Test is on record for about ${KNOWN_RESULT_SHARE}% of innings, so this only covers those.`);

  // which criterion should lead
  let useOrder = order;
  for (const [key, words] of LEVER_WORDS) {
    if (hasAny(text, words)) {
      useOrder = withLeverFirst(order, key);
      interpreted.push(`${LEVER_BY_KEY[key].name} first`);
      break;
    }
  }

  // count and sort
  let limit = 10;
  let m;
  const NUM_WORDS = { three: 3, five: 5, ten: 10, twenty: 20, fifty: 50, 'a dozen': 12 };
  if ((m = /(?:top|best|greatest|first) (\d{1,2})(?: |$)/.exec(text)) || (m = /(?:^| )(\d{1,2}) (?:best|greatest|top)/.exec(text))) limit = Math.min(50, Math.max(1, +m[1]));
  else {
    for (const [w, n] of Object.entries(NUM_WORDS)) if (new RegExp(`(?:top|best|greatest) ${w}( |$)`).test(text)) { limit = n; break; }
    if (has(text, 'the best') || has(text, 'greatest') && !/ (centuries|hundreds|innings|tons|knocks)/.test(text)) { /* a single "the best" question */ }
  }
  const asksOne = /(?:^| )(?:what is|whats|which is|who has|who scored|who made) (?:the )?(?:best|greatest|finest)(?: |$)/.test(text) && !/ (centuries|hundreds|tons|knocks)/.test(text);
  if (asksOne && !/(?:top|best|greatest) \d/.test(text)) limit = 1;

  if (opts.limit) limit = Math.min(50, Math.max(1, opts.limit));

  let sort = 'toc';
  if (hasAny(text, ['most divisive', 'divisive', 'divide opinion', 'controversial', 'most argued', 'argument', 'debated'])) sort = 'divisive';
  else if (hasAny(text, ['fastest', 'quickest', 'quickfire', 'most aggressive'])) sort = 'fastest';
  else if (hasAny(text, ['slowest', 'grind', 'grinding'])) sort = 'slowest';
  else if (hasAny(text, ['latest', 'newest', 'most recent', 'newest first'])) sort = 'recent';
  else if (hasAny(text, ['highest', 'biggest', 'largest', 'most runs', 'highest score', 'highest scores'])) sort = 'runs';
  else if (hasAny(text, ['worst', 'lowest rated', 'weakest', 'least consequential', 'least important', 'least'])) sort = 'worst';

  const apply = (list) => list.filter((c) => filters.every((f) => f(c)));
  const SORTS = {
    toc: (l) => l,
    worst: (l) => [...l].reverse(),
    runs: (l) => [...l].sort((a, b) => b.runs - a.runs || b.toc - a.toc),
    recent: (l) => [...l].sort((a, b) => b.year - a.year || b.toc - a.toc),
    fastest: (l) => l.filter((c) => c.balls).sort((a, b) => a.balls / a.runs - b.balls / b.runs || b.toc - a.toc),
    slowest: (l) => l.filter((c) => c.balls).sort((a, b) => b.balls / b.runs - a.balls / a.runs || b.toc - a.toc),
    divisive: (l) => l.map((c) => ({ c, v: calcVolatility(c) })).sort((a, b) => b.v.volatility - a.v.volatility || b.c.toc - a.c.toc).map((x) => x.c),
  };
  const sortLabel = { toc: null, worst: 'lowest first', runs: 'most runs first', recent: 'most recent first', fastest: 'highest strike rate first', slowest: 'lowest strike rate first', divisive: 'most divisive first' }[sort];
  if (sortLabel) interpreted.push(sortLabel);

  const orderedRanked = useOrder === order ? ranked : rankAll(useOrder);

  // ---- one player named
  if (singleMention) {
    const player = singleMention.player;
    const career = careerOf(player, useOrder);
    if (singleMention.runs) {
      const inn = career.innings.find((c) => c.runs === singleMention.runs);
      return {
        kind: 'innings', question: q, order: useOrder, interpreted: [`${player.name}'s ${runsOf(inn)}`], assumed, innings: inn, career,
        headline: `${describe(inn)} ranks ${inn.rank.toLocaleString()} of ${ranked.length.toLocaleString()}, scoring ${fmt(inn.toc)}.`,
      };
    }
    const items = SORTS[sort](apply(career.innings));
    const shown = items.slice(0, Math.max(limit, 5));
    interpreted.unshift(player.name);
    return {
      kind: 'players', question: q, order: useOrder, interpreted, notes, assumed, career, items: shown, total: items.length,
      headline: items.length
        ? `${player.name} has ${career.count} hundred${career.count === 1 ? '' : 's'} in the rankings. The best is the ${runsOf(career.best)} at ${career.best.venue}, ranked ${career.best.rank.toLocaleString()}.`
        : `${player.name} has no innings that match those filters.`,
    };
  }

  // ---- a list
  const known = filters.length > 0 || sort !== 'toc' || useOrder !== order;
  let items = SORTS[sort](apply(orderedRanked));
  if (!known) {
    // no recognised structure: treat the words as a search
    const words = tokens.filter((w) => !STOP.has(w) && !['best', 'top', 'greatest', 'centuries', 'hundreds', 'innings', 'tons', 'show', 'me', 'find', 'what', 'who', 'which', 'is', 'are', 'was', 'were', 'did', 'does', 'how', 'many', 'tell', 'about', 'cricket', 'test', 'tests', 'century', 'hundred', 'ton', 'knock', 'knocks', 'to', 'with', 'on', 'from', 'all', 'every', 'ever', 'please', 'give'].includes(w) && !/^\d+$/.test(w));
    if (words.length) {
      const hits = searchInnings(words.join(' '), order, 400);
      if (hits.length) {
        items = hits;
        interpreted.push(`matching “${words.join(' ')}”`);
      } else {
        return { kind: 'none', question: q, order, interpreted: [], assumed: [], headline: `I could not find anything for “${q}”.`, suggestions: EXAMPLE_QUESTIONS.slice(0, 5) };
      }
    }
  }
  if (!items.length) {
    return { kind: 'none', question: q, order: useOrder, interpreted, assumed, headline: 'No innings match all of that. Try loosening one of the filters.', suggestions: EXAMPLE_QUESTIONS.slice(0, 5) };
  }
  const total = items.length;
  const shown = items.slice(0, limit === 1 ? 3 : limit);
  const lead = shown[0];
  const what = interpreted.filter((i) => !/ first$/.test(i)).join(', ');
  const headline = limit === 1
    ? `The best is ${describe(lead)}, ${lead.opponent === undefined ? '' : `against ${lead.opponent} `}at ${lead.venue} in ${lead.year}: ${fmt(lead.toc)}.`
    : `${total.toLocaleString()} innings match${what ? ` (${what})` : ''}. Top ${Math.min(limit, total)}, led by ${describe(lead)}.`;
  return { kind: 'list', question: q, order: useOrder, interpreted, notes, assumed, items: shown, total, headline, sort };
}

export { LEVERS };
