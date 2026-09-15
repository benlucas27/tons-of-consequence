import './globals.css';

export const metadata = {
  metadataBase: new URL('https://tons-of-consequence.vercel.app'),
  title: 'Tons of Consequence — The Definitive Ranking of Test Cricket Centuries',
  description:
    'Not all hundreds are created equal. Rank every Test cricket century by what it actually meant — adjust the weightings, find your own truth.',
  openGraph: {
    title: 'Tons of Consequence',
    description: 'Not all hundreds are created equal.',
    url: 'https://tons-of-consequence.vercel.app',
    siteName: 'Tons of Consequence',
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tons of Consequence',
    description: 'Not all hundreds are created equal.',
  },
};
// og:image and favicon come from opengraph-image.js / icon.svg (Next.js
// file conventions) — no need to reference files under public/, which
// doesn't exist in this repo.

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
