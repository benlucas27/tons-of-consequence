import { CONSEQUENCE_OVERRIDES } from '../data/consequence-overrides.js';

/** Applies a hand-written ruling, if there is one, on top of the test's verdict. Only the reasoning is shown to readers, never who made the call. */
export function withOverride(verdict, name, runs, year) {
  const o = CONSEQUENCE_OVERRIDES[`${name}|${runs}|${year}`];
  if (!o) return verdict;
  if (o.verdict === 'no') return { ...verdict, passes: false, scenario: null, headline: 'A good ton, not a ton of consequence', because: o.note, override: true };
  return { ...verdict, passes: true, scenario: o.scenario || verdict.scenario, headline: 'A ton of consequence', because: o.note, override: true };
}
