import { challengeCounts, reviewState } from '@/lib/reviewList';

export const dynamic = 'force-dynamic';

/** GET /api/review-counts?id=1234 : whether that innings is under review, and how many challenges it has. Notes are never returned. */
export async function GET(req) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  let counts = null;
  try { counts = await challengeCounts(); } catch { counts = null; }
  const body = Number.isInteger(id) && id > 0 ? { id, ...reviewState(id, counts) } : { counts: counts ? counts.length : 0 };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=0, s-maxage=60' } });
}
