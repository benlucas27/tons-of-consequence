import { serveCard, sizeOf } from '@/lib/cards/serve';

export const runtime = 'nodejs';

/** The Pub Test result as a card: /card/persona/purist?c=3,2,2,1 (counts in the order purist, analyst, romantic, patriot). */
export async function GET(req, { params }) {
  const sp = new URL(req.url).searchParams;
  const { id } = await params;
  return serveCard('persona', { id, c: sp.get('c') || '', size: sizeOf(sp) === 'wide' ? 'portrait' : sizeOf(sp), download: sp.get('download') }, { filename: `toc-pub-test-${id}` });
}
