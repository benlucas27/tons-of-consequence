import { ALL, inningsSlug } from '@/lib/dataset';
import { BATTERS } from '@/lib/consequence';
import { SITE_URL as BASE } from '@/lib/site';

export default function sitemap() {
  const pages = ['', '/search', '/compare', '/the-don', '/tons-of-consequence', '/womens-tests', '/connect', '/hello-cricket', '/privacy', '/about', '/quiz'].map((p) => ({ url: `${BASE}${p}`, changeFrequency: 'monthly' }));
  const innings = ALL.map((c) => ({ url: `${BASE}/innings/${inningsSlug(c)}`, changeFrequency: 'yearly' }));
  const batters = BATTERS.filter((b) => b.measured > 0).map((b) => ({ url: `${BASE}/tons-of-consequence/${b.slug}`, changeFrequency: 'monthly' }));
  return [...pages, ...batters, ...innings];
}
