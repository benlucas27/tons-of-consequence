import { serveCard, sizeOf } from '@/lib/cards/serve';

export const runtime = 'nodejs';

/** /card/batter/<slug>?format=portrait|wide : the same card as /card?type=batter, kept so existing links keep working. */
export async function GET(req, { params }) {
  const sp = new URL(req.url).searchParams;
  const { slug } = await params;
  return serveCard('batter', { b: slug, size: sizeOf(sp), download: sp.get('download') }, { filename: `toc-${slug}` });
}
