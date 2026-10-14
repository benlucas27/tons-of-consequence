import { ALL, inningsSlug } from '@/lib/dataset';
import { SITE_URL as BASE } from '@/lib/site';

export default function sitemap() {
  const pages = ['', '/search', '/compare', '/the-don', '/connect', '/hello-sport', '/privacy', '/about', '/quiz'].map((p) => ({ url: `${BASE}${p}`, changeFrequency: 'monthly' }));
  const innings = ALL.map((c) => ({ url: `${BASE}/innings/${inningsSlug(c)}`, changeFrequency: 'yearly' }));
  return [...pages, ...innings];
}
