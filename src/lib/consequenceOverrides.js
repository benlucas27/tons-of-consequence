import { CONSEQUENCE_OVERRIDES } from '../data/consequence-overrides.js';

/** Applies Ben's call, if there is one, on top of the test's verdict. Returns the verdict unchanged otherwise. */
export function withOverride(verdict, name, runs, year) {
  const o = CONSEQUENCE_OVERRIDES[`${name}|${runs}|${year}`];
  if (!o) return verdict;
  if (o.verdict === 'no') return { ...verdict, passes: false, scenario: null, headline: 'A good ton, not a ton of consequence', because: o.note, override: true };
  return { ...verdict, passes: true, scenario: verdict.scenario || 'Ben’s call', headline: 'A ton of consequence', because: o.note, override: true };
}
