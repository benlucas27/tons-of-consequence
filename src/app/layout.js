import './globals.css';
import { Barlow_Condensed, Barlow, Newsreader } from 'next/font/google';
import SiteBar from '@/components/SiteBar';
import Footer from '@/components/Footer';
import Toaster from '@/components/Toaster';
import { SITE_URL } from '@/lib/site';

const display = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });
const ui = Barlow({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-ui', display: 'swap' });
const prose = Newsreader({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-prose', display: 'swap', adjustFontFallback: false });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Tons of Consequence — The Unofficial Ranking of Test Cricket Centuries',
    template: '%s | Tons of Consequence',
  },
  description:
    'Not all hundreds are created equal. Rank every Test cricket century by what it actually meant. Adjust the weightings, find your own truth.',
  openGraph: {
    title: 'Tons of Consequence',
    description: 'Not all hundreds are created equal.',
    url: SITE_URL,
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
// og:image and the favicon come from opengraph-image.js / icon.svg (Next.js file conventions).

export const viewport = { themeColor: '#0b1c13', colorScheme: 'dark' };

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU" className={`${display.variable} ${ui.variable} ${prose.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to the rankings</a>
        <SiteBar />
        <main id="main">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
