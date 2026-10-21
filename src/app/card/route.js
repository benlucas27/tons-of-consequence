import { ImageResponse } from 'next/og';
import { buildCard } from '@/lib/cards/build';
import { cardFonts } from '@/lib/cards/fonts';

export const runtime = 'nodejs';

/** /card?type=batter&b=virat-kohli&size=wide|square|portrait[&download=1]. Types: batter, innings, compare, board, rankings, laws. */
export async function GET(req) {
  const q = Object.fromEntries(new URL(req.url).searchParams);
  const card = buildCard(q.type || 'batter', q);
  if (!card) return new Response('No such card', { status: 404 });
  const res = new ImageResponse(card.jsx, { width: card.size.width, height: card.size.height, fonts: cardFonts() });
  res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  if (q.download) res.headers.set('Content-Disposition', `attachment; filename="tons-of-consequence-${q.type || 'card'}.png"`);
  return res;
}
