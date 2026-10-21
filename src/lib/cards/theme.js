/** The sizes people can pick: the two feed formats. */
export const SIZES = {
  portrait: { width: 1080, height: 1350, label: '4:5 portrait', note: 'Instagram, Facebook and most feeds' },
  square: { width: 1080, height: 1080, label: 'Square', note: 'X, WhatsApp, Reddit' },
};
/** Not offered as a choice: the batter page's link preview picture. */
export const WIDE = { width: 1200, height: 630 };
/** Red marks a ton of consequence or the standout number; gold is the accent; green-grey is everything else. */
export const C = {
  bg: '#07150d', cream: '#f5edd6', red: '#ee5a3e', gold: '#f2c744', green: '#62d08c',
  muted: '#a9c2b3', soft: '#cfe0d4', dim: '#3a5a47', track: '#1d3a2b', panel: 'rgba(0,0,0,0.30)', line: 'rgba(245,237,214,0.12)',
};
/** Shortens to about n characters at the end of a word, with an ellipsis. */
export const cut = (s, n) => {
  if (!s || s.length <= n) return s || '';
  const head = s.slice(0, n);
  const at = head.lastIndexOf(' ');
  return `${(at > n * 0.6 ? head.slice(0, at) : head).trimEnd()}…`;
};
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
/** Upper case for headings, but "ToC" / "ToCs" keep their house spelling. */
export const up = (s) => String(s).toUpperCase().replace(/TOC(S?)\b/g, (_, s) => `ToC${s ? 's' : ''}`);
/** A font size that keeps the longest line of a heading inside `width` px (condensed caps run about 0.46em a letter). */
export const fit = (lines, width, max) => Math.min(max, Math.floor(width / (Math.max(...lines.map((l) => String(l).length)) * 0.46)));
