import { buildFeed, FEED_SCHEMA } from '@/lib/feed';

// Tiny: the app asks this first and only downloads /api/feed when the version has changed.
export const dynamic = 'force-static';

export async function GET() {
  const { version, counts } = buildFeed();
  return Response.json({ schema: FEED_SCHEMA, version, counts }, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate', 'Access-Control-Allow-Origin': '*' },
  });
}
