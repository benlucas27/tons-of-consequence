/**
 * The Consequence Test, version 3: a hard gate and then weighted context (docs/drafts/consequence-rules-v3.md).
 *
 *   gate:  the team won (or tied), or saved a draw it was in danger of losing in a series that was still alive;
 *          never a loss; a dead rubber only if his side had won the series and won the match.
 *   score: points for how much the team needed it, how much he carried, a chase and a close finish, what rode on the
 *          series, tempo, and the occasion, minus points when the match was already safe or the innings was shared.
 *   a ton of consequence = passes the gate and scores at least THRESHOLD.
 *
 * The facts `f` come from two places (see scripts/build-consequence.mjs): the ball-by-ball record (full: includes the score
 * and wickets when he came in) or Wikipedia's tour pages (partial: result, innings, team total, lead when the innings began).
 * A verdict is only trusted when it is firm: `robustness` re-scores the hundred 300 times with every weight nudged up to 25%
 * either way and the threshold by up to 5 points, and says how often it was a ton.
 */
export const THRESHOLD = 45; // set higher than the first draft: Ben wants tons kept strict
const DRAW_CUT_SHORT = 330; // fewer overs than this in a drawn Test means a day or more was lost (Root's Trent Bridge 109: 250 overs)
const OCCASION_POINTS = { tribute: 15, farewell: 8, emotional: 8, comeback: 6 };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** f: result, inn, lead (when the innings began, or on entry when known), share, stakes, sideAhead, seriesNotAhead, margin ('r30'/'w3'/'i40'), start (MMDD), occasion, balls, runs, entryWkts, entryScore, peril, others, nextBest, followOn. */
export function modelV3(f, wm = {}, th = THRESHOLD) {
  const dead = f.stakes === 'dead';
  const sr0 = f.balls ? (100 * f.runs) / f.balls : null;
  const slowGrind = sr0 != null && sr0 < 45 && f.balls >= 250; // a long innings that ate the clock counts as a reason in its own right (Ben's tempo review)
  const inDanger = f.inn === 4 || (f.inn === 3 && f.lead != null && f.lead < 0) || Boolean(f.followOn);
  let gate = false;
  let gateWhy = '';
  if (f.result === 'loss') gateWhy = 'a loss';
  else if (dead && !(f.sideAhead && f.result === 'win')) gateWhy = f.result === 'win' ? 'a dead rubber, and his side had lost the series' : 'a dead rubber that was not a win';
  else if (f.result === 'draw' && f.inn == null) gateWhy = 'a draw, and the innings is not known';
  else if (f.result === 'draw' && f.overs != null && f.overs < DRAW_CUT_SHORT && !slowGrind) gateWhy = 'a draw cut short by weather: the clock saved the match, not the hundred';
  else if (f.result === 'draw' && !inDanger && !slowGrind) gateWhy = 'a draw the team was not in danger of losing';
  else if (!['win', 'draw', 'tie'].includes(f.result)) gateWhy = 'no result';
  else gate = true;
  const p = {};
  const byLead = f.lead == null ? 0 : f.lead < -200 ? 20 : f.lead < -100 ? 15 : f.lead < 0 ? 10 : 0;
  const byEntry = f.entryWkts == null ? 0 : f.entryWkts >= 3 && f.entryScore < 100 ? 25 : f.peril >= 4 && f.lead < 200 ? 20 : f.entryWkts >= 3 && f.entryScore < 130 ? 18 : f.entryWkts >= 2 && f.entryScore < 60 ? 10 : 0;
  p.need = Math.max(byEntry, byLead);
  const sh = f.share ?? 0;
  p.carry = sh >= 0.5 ? 30 : sh >= 0.4 ? 24 : sh >= 0.3 ? 14 : sh >= 0.2 ? 5 : 0;
  if (f.nextBest != null && f.others === 0) p.carry += 8 * clamp((f.runs - f.nextBest) / f.runs); // the only hundred, and well clear of the next batter
  if (f.others) p.carry -= Math.min(6, 2 * f.others);
  if (f.rest != null) p.carry += f.rest < 150 ? 10 : f.rest < 250 ? 3 : f.rest >= 450 ? -6 : 0; // the team collapsed around him, or it did not
  const close = f.result === 'tie' || (f.result === 'win' && f.margin && ((f.margin[0] === 'r' && Number(f.margin.slice(1)) <= 30) || (f.margin[0] === 'w' && Number(f.margin.slice(1)) <= 3)));
  p.finish = (f.inn === 4 && f.result === 'win' ? 10 : 0) + (close ? 5 : 0);
  p.stakes = ({ decider: 15, 'on the line': 12, live: 6, single: 7, dead: 3 })[f.stakes] ?? 6;
  if (f.result === 'draw' && inDanger && !dead && f.seriesNotAhead) p.stakes += 5;
  const sr = f.balls ? (100 * f.runs) / f.balls : null;
  p.tempo = slowGrind ? 25 : sr != null && sr >= 90 ? 10 : 0;
  const md = f.start ? Number(f.start) : null;
  p.occasion = OCCASION_POINTS[f.occasion] ?? (md != null && ((md >= 1225 && md <= 1227) || (md >= 101 && md <= 103)) ? 5 : 0);
  // the opening platform: an opener whose stand set up a win (the match looks out of reach because he made it so)
  p.platform = f.pos != null && f.pos <= 2 && f.result === 'win' && f.openStand != null ? (f.openStand >= 200 ? 20 : f.openStand >= 150 ? 15 : f.openStand >= 100 ? 8 : 0) : 0;
  // a big stand late in the order, and a hundred from number 7 or lower
  p.late = f.bestStand && f.bestStand.wicket >= 7 ? (f.bestStand.runs >= 100 ? 10 : f.bestStand.runs >= 60 ? 5 : 0) : 0;
  p.lower = f.pos != null && f.pos >= 8 ? 10 : f.pos === 7 ? 6 : 0;
  p.attack = f.attack == null ? 0 : f.attack < 25 ? 10 : f.attack < 27 ? 4 : 0; // only a truly elite attack counts
  p.opposition = f.tier >= 4 ? -10 : f.tier === 3 ? -3 : 0; // who it was scored against
  p.safe = f.lead != null && f.lead > 200 ? -20 : 0;
  for (const k of Object.keys(p)) p[k] *= wm[k] ?? 1;
  const score = Math.round(Object.values(p).reduce((a, b) => a + b, 0) * 10) / 10;
  return { gate, gateWhy, score, parts: p, ton: gate && score >= th, sr };
}

const KEYS = ['need', 'carry', 'finish', 'stakes', 'tempo', 'safe', 'occasion', 'platform', 'late', 'lower', 'attack', 'opposition'];
// a fixed set of 300 nudges, so a rebuild gives the same answer
const DRAWS = (() => {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  return Array.from({ length: 300 }, () => ({ wm: Object.fromEntries(KEYS.map((k) => [k, 0.75 + 0.5 * rnd()])), th: THRESHOLD - 5 + 10 * rnd() }));
})();

/** How often the hundred is a ton when the weights and threshold are nudged: 'solid ton', 'solid good ton' or 'marginal'. */
export function robustness(f) {
  let n = 0;
  for (const d of DRAWS) if (modelV3(f, d.wm, d.th).ton) n += 1;
  const stable = n / DRAWS.length;
  return { stable, cls: stable >= 0.9 ? 'solid ton' : stable <= 0.1 ? 'solid good ton' : 'marginal' };
}

const pct = (x) => `${Math.round(x * 100)}%`;
const marginText = (m, team) => (!m ? '' : m[0] === 'r' ? ` by ${m.slice(1)} runs` : m[0] === 'w' ? ` by ${m.slice(1)} wickets` : ` by an innings and ${m.slice(1)} runs`);

/** The scenario name and a plain-English reason for a hundred that passes the gate and scores at least the threshold. */
export function describeTon(f, m, team = 'The team') {
  const p = m.parts;
  const inDanger = f.inn === 4 || (f.inn === 3 && f.lead != null && f.lead < 0) || f.followOn;
  let scenario = 'Set up the win';
  if (f.result === 'draw') scenario = inDanger ? 'Saved the match' : 'Wore the opposition down';
  else if (f.inn === 4 && f.result === 'win') scenario = 'Chased it down';
  else if (p.need >= 15 && p.need >= p.carry) scenario = 'Rescued the innings';
  else if (p.carry >= 12) scenario = 'Carried the innings';
  else if (p.platform >= 15) scenario = 'Set up the win';
  else if (f.occasion === 'tribute' || f.occasion === 'emotional' || f.occasion === 'farewell' || f.occasion === 'comeback') scenario = 'Made it count on the day';
  const bits = [];
  if (f.entryWkts != null) bits.push(`In at ${f.entryWkts} for ${f.entryScore}${f.lead != null ? (f.lead < 0 ? `, ${-f.lead} behind` : f.lead > 0 ? `, ${f.lead} ahead` : ', level') : ''}.`);
  else if (f.lead != null) bits.push(f.lead < 0 ? `His side trailed by ${-f.lead} when the innings began.` : f.lead > 0 ? `His side led by ${f.lead} when the innings began.` : 'The scores were level when the innings began.');
  if (f.share != null) bits.push(`He made ${pct(f.share)} of the team's ${f.total ?? 'runs'}${f.nextBest != null && f.others === 0 && f.runs - f.nextBest > 40 ? ', and no one else came close' : ''}.`);
  bits.push(f.result === 'win' ? `${team} won${marginText(f.margin)}.` : f.result === 'tie' ? 'The match was tied.' : inDanger ? 'The match was drawn, with his side in danger of losing.' : 'The match was drawn.');
  if (f.stakes === 'decider') bits.push('It was the decider of a level series.');
  else if (f.stakes === 'on the line') bits.push('The series was still to be settled in this Test.');
  else if (f.stakes === 'dead') bits.push('The series was already won by his side.');
  if (f.occasion && f.occasionNote) bits.push(f.occasionNote);
  else if (p.occasion >= 5 && !f.occasion) bits.push('It was a Boxing Day or New Year Test.');
  if (p.platform) bits.push(`As an opener he put on ${f.openStand} for the first wicket${f.lastOpenerOut ? `, and the second opener was not out until ${f.lastOpenerOut}` : ''}.`);
  if (p.late && f.bestStand) bits.push(`He added ${f.bestStand.runs} for the ${f.bestStand.wicket}th wicket.`);
  if (p.attack) bits.push('He faced an elite attack.');
  if (f.rest != null && f.rest < 150) bits.push(`The rest of the team added only ${f.rest}.`);
  if (p.lower) bits.push(`He batted at number ${f.pos}, a lower-order hundred.`);
  if (p.tempo && m.sr != null) bits.push(m.sr >= 90 ? `He scored at ${Math.round(m.sr)} runs per 100 balls.` : `A slow grind at ${Math.round(m.sr)} runs per 100 balls.`);
  return { scenario, reason: bits.join(' ') };
}

/** The reason a hundred is a good ton, in a sentence. */
export function describeGoodTon(f, m) {
  if (!m.gate) return `${m.gateWhy[0].toUpperCase()}${m.gateWhy.slice(1)}.`;
  const bits = [];
  if (f.lead != null && f.lead > 200) bits.push(`His side already led by ${f.lead} when the innings began.`);
  if (f.share != null) bits.push(`He made ${pct(f.share)} of the team's runs.`);
  // only say so when it made the difference: the hundred would have cleared the bar without the small deduction
  if (f.others && m.gate && m.score < THRESHOLD && m.score + Math.min(6, 2 * f.others) >= THRESHOLD) bits.push('Another hundred came in the same innings, which counted against it a little.');
  bits.push(f.entryWkts != null ? `The match did not depend on it: he came in at ${f.entryWkts} for ${f.entryScore}.` : 'The match did not depend on it on the facts we have.');
  return bits.join(' ');
}
