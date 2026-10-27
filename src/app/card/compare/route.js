import { serveCard, sizeOf } from '@/lib/cards/serve';

export const runtime = 'nodejs';

/** /card/compare?a=ID&b=ID : two innings head to head (the card type `versus`). */
export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  if (!sp.get('a') || !sp.get('b')) return new Response('Pick two innings: /card/compare?a=ID&b=ID', { status: 400 });
  return serveCard('versus', { a: sp.get('a'), b: sp.get('b'), o: sp.get('o') || undefined, bonus: sp.get('bonus') || undefined, size: sizeOf(sp) === 'wide' ? 'portrait' : sizeOf(sp), download: sp.get('download') }, { filename: `toc-${sp.get('a')}-v-${sp.get('b')}` });
}
