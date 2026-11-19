import { serveCard, sizeOf } from '@/lib/cards/serve';

export const runtime = 'nodejs';

/** /card/innings/<id>?o=..&bonus=..&format=.. : the same card as /card?type=innings. */
export async function GET(req, { params }) {
  const sp = new URL(req.url).searchParams;
  const { id } = await params;
  return serveCard('innings', { id, o: sp.get('o') || undefined, bonus: sp.get('bonus') || undefined, size: sizeOf(sp) === 'wide' ? 'portrait' : sizeOf(sp), download: sp.get('download') }, { filename: `toc-innings-${id}` });
}
