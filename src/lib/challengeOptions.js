// The parts of the challenge settings the browser needs. (src/lib/challenges.js is server-only: it knows every innings.)
export const NOTE_MAX = 280;
export const REASONS = [
  { code: 'facts', label: 'Facts look wrong' },
  { code: 'situation', label: 'Situation missed (a follow-on, a collapse, what the series rode on)' },
  { code: 'data', label: 'Not a lot of data on this match' },
  { code: 'other', label: 'Other' },
];
