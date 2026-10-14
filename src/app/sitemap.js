import { ALL, inningsSlug } from '@/lib/dataset';

const BASE = 'https://tons-of-consequence.vercel.app';

export default function sitemap() {
  const pages = ['', '/search', '/compare', '/about', '/quiz'].map((p) => ({ url: `${BASE}${p}`, changeFrequency: 'monthly' }));
  const innings = ALL.map((c) => ({ url: `${BASE}/innings/${inningsSlug(c)}`, changeFrequency: 'yearly' }));
  return [...pages, ...innings];
}
