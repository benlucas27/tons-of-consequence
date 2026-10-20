export const SIZES = {
  wide: { width: 1200, height: 630, label: 'Wide', note: 'Reddit, X, link previews' },
  square: { width: 1080, height: 1080, label: 'Square', note: 'Instagram, WhatsApp, Facebook' },
  story: { width: 1080, height: 1920, label: 'Story', note: 'Stories, Reels, TikTok' },
};
export const C = {
  bg: '#0b1c13', edge: '#2a4d3b', cream: '#f2ead4', red: '#e85a40', gold: '#f0c23c',
  muted: '#88a493', soft: '#bccbbf', dim: '#2f4a3a', green: '#62d08c',
};
export const cut = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s || '');
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
