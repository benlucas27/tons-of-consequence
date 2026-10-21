import { buildFeed } from '@/lib/feed';

// Built once at deploy time and served from the CDN (compressed): the whole dataset for the mobile app.
export const dynamic = 'force-static';

export async function GET() {
  const { json, version } = buildFeed();
  return new Response(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, must-revalidate',
      ETag: `"${version}"`,
      'Access-Control-Allow-Origin': '*',
    },
  });
}
