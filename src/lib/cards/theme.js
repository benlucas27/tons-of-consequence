export const SIZES = {
  wide: { width: 1200, height: 630, label: 'Wide', note: 'Reddit, X, link previews' },
  square: { width: 1080, height: 1080, label: 'Square', note: 'Instagram, WhatsApp, X' },
  portrait: { width: 1080, height: 1350, label: '4:5 portrait', note: 'Instagram and Facebook feeds' },
};
export const C = {
  bg: '#0b1c13', edge: '#2a4d3b', cream: '#f2ead4', red: '#e85a40', gold: '#f0c23c',
  muted: '#88a493', soft: '#bccbbf', dim: '#2f4a3a', green: '#62d08c',
};
/** Shortens to about n characters at the end of a word, with an ellipsis. */
export const cut = (s, n) => {
  if (!s || s.length <= n) return s || '';
  const head = s.slice(0, n);
  const at = head.lastIndexOf(' ');
  return `${(at > n * 0.6 ? head.slice(0, at) : head).trimEnd()}…`;
};
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
