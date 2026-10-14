/**
 * Counting and ranking batters by their hundreds: "who has the most hundreds against strong opposition?", "most hundreds
 * away from home", "who has the most tons of consequence?", "how often does Australia win when Smith scores one?".
 * Pure functions over the dataset, used by the connector's batter_records tool and by its ask tool.
 */
import { BATTERS, verdictOf, wherePlayed } from './consequence.js';
import { tierOfOpponent } from './matchFacts.js';
import { NATIONS } from './countries.js';
import { norm } from './ask.js';

export const countryCode = (s) => {
  if (!s) return null;
  const up = String(s).trim().toUpperCase();
  if (NATIONS[up]) return up;
  const hit = Object.entries(NATIONS).find(([, name]) => name.toLowerCase() === String(s).trim().toLowerCase());
  return hit ? hit[0] : null;
};

/** Rows for every batter with at least one hundred matching the filters. Throws a plain Error for a bad country or batter. */
export function batterRecords({ batter, opposition, oppositionTier, where, result, tonOfConsequence, since, until, country, sortBy = 'hundreds', limit = 10 } = {}, siteUrl = '') {
  const cc = country ? countryCode(country) : null;
  if (country && !cc) throw new Error(`Unknown country "${country}".`);
  const wantWhere = where ? { home: 'H', away: 'A', neutral: 'N' }[where] : null;
  const needle = batter ? batter.toLowerCase().trim() : null;
  const people = BATTERS.filter((b) => !needle || b.name.toLowerCase() === needle || b.name.toLowerCase().includes(needle));
  if (batter && people.length === 0) throw new Error(`No batter matching "${batter}".`);
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
      url: `${siteUrl}/tons-of-consequence/${b.slug}`,
    });
  }
  const key = { hundreds: (r) => r.hundreds, tonsOfConsequence: (r) => r.tonsOfConsequence, winRate: (r) => r.winRate ?? -1 }[sortBy] || ((r) => r.hundreds);
  rows.sort((a, b) => key(b) - key(a) || b.hundreds - a.hundreds);
  const partial = wantWhere || tonOfConsequence != null || sortBy === 'tonsOfConsequence';
  return {
    results: rows.slice(0, limit), shown: Math.min(rows.length, limit), matchingBatters: rows.length,
    ...(partial ? { caveat: 'Home or away and tons of consequence are only known for hundreds with a match record (mostly 2006 on, plus Don Bradman), so older batters are under-counted.' } : {}),
  };
}

const WORDS_FOR_STRONG = /\b(strong|strongest|difficult|tough|top|best|better|elite|quality|good) (opposition|sides?|teams?|attacks?|opponents?)\b/;

/**
 * Turns a plain-English counting question into batterRecords filters, or returns null when it is not one (the ranking
 * parser in ask.js deals with those). `interpreted` always says how it was understood.
 */
export function parseRecordsQuestion(question) {
  const q = norm(question);
  const counts = /^(who|which batters?|which players?|what batters?|most|how many|how often|how much|top|list)/.test(q) || /\b(most|how many|how often)\b/.test(q);
  if (!counts) return null;
  const filters = {}; const said = [];

  const named = BATTERS.filter((b) => b.hundreds >= 3 && q.includes(norm(b.name))).sort((a, b) => b.name.length - a.name.length)[0]
    || (() => { const bySurname = BATTERS.filter((b) => b.hundreds >= 10 && new RegExp(`\\b${norm(b.name).split(' ').pop()}\\b`).test(q)); return bySurname.length === 1 ? bySurname[0] : null; })();
  if (named) { filters.batter = named.name; said.push(named.name); }

  const consequence = /\btons? of consequence\b/.test(q);
  const winRate = /\b(win rate|how often|win when|wins when|win the most|win most)\b/.test(q) || /\bhundreds win\b/.test(q);
  const standard = /\b(most|how many)\b.*\bhundreds?\b|\bhundreds?\b.*\b(against|away|overseas|home|abroad)\b/.test(q);
  if (!consequence && !winRate && !standard && !filters.batter) return null;
  if (!consequence && !winRate && !standard && filters.batter && !/\bhow many\b/.test(q)) return null;

  const opp = Object.values(NATIONS).find((n) => new RegExp(`\\bagainst ${norm(n)}\\b|\\bv ${norm(n)}\\b|\\bvs ${norm(n)}\\b`).test(q));
  if (opp && !(filters.batter && NATIONS[countryCode(opp)] === opp && false)) { filters.opposition = opp; said.push(`against ${opp}`); }
  if (WORDS_FOR_STRONG.test(q)) { filters.oppositionTier = 1; said.push('against the top tier of opposition (England, Australia, India)'); }
  if (/\b(away from home|overseas|abroad|on tour|away)\b/.test(q)) { filters.where = 'away'; said.push('away from home'); }
  else if (/\bat home\b|\bhome (hundreds|soil)\b/.test(q)) { filters.where = 'home'; said.push('at home'); }
  const since = q.match(/\bsince (\d{4})\b/); if (since) { filters.since = +since[1]; said.push(`since ${since[1]}`); }
  if (/\bin a (won|win|winning) test\b|\bin wins\b/.test(q)) { filters.result = 'win'; said.push('in a won Test'); }
  if (/\b(lost|losing) test\b/.test(q)) { filters.result = 'loss'; said.push('in a lost Test'); }
  if (/\bdrawn test\b/.test(q)) { filters.result = 'draw'; said.push('in a drawn Test'); }

  if (consequence) { filters.sortBy = 'tonsOfConsequence'; said.push('counting tons of consequence'); }
  else if (winRate) { filters.sortBy = 'winRate'; said.push('by how often the team won'); }
  else filters.sortBy = 'hundreds';
  if (filters.batter) filters.limit = 1;
  return { filters, interpreted: said.join(', ') || 'a count of hundreds' };
}
