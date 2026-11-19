import { serveCard } from '@/lib/cards/serve';

export const runtime = 'nodejs';

/** /card?type=batter&b=virat-kohli&size=wide|square|portrait[&download=1]. Types: batter, innings, compare, board, rankings, laws, versus, persona. */
export async function GET(req) {
  const q = Object.fromEntries(new URL(req.url).searchParams);
  return serveCard(q.type || 'batter', q);
}
