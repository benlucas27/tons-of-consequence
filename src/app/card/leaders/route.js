import { serveCard, sizeOf } from '@/lib/cards/serve';

export const runtime = 'nodejs';

/** /card/leaders?sort=tons|share|peak|wins&min=8 : the same card as /card?type=board. */
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  return serveCard('board', { sort: sp.get('sort') || 'tons', min: sp.get('min') || undefined, size: sizeOf(sp) === 'wide' ? 'portrait' : sizeOf(sp), download: sp.get('download') }, { filename: `toc-leaders-${sp.get('sort') || 'tons'}` });
}
