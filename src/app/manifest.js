export default function manifest() {
  return {
    name: 'Tons of Consequence',
    short_name: 'Tons of ToC',
    description: 'The unofficial ranking of Test cricket centuries, and which ones were tons of consequence.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b1c13',
    theme_color: '#0b1c13',
    lang: 'en-AU',
    categories: ['sports', 'entertainment'],
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512?maskable=1', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Compare two hundreds', short_name: 'Compare', url: '/compare' },
      { name: 'ToCs leaderboard', short_name: 'ToCs', url: '/tons-of-consequence' },
      { name: 'Ask the rankings', short_name: 'Search', url: '/search' },
    ],
  };
}
