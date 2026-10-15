export const fmt1 = (n) => n.toFixed(1);

export function ord(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** "v South Africa · Durban · 2026", skipping anything missing. */
export const context = (c) => [`v ${c.opponent}`, c.venue, c.year].filter(Boolean).join(' · ');

export const runsText = (c) => `${c.runs}${c.notOut ? '*' : ''}`;

export const RESULT_LABEL = { win: 'Won', draw: 'Drawn', loss: 'Lost', tie: 'Tied', live: 'In progress' };
