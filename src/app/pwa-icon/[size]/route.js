import { ImageResponse } from 'next/og';
import { ballSvg } from '@/lib/ball';

export const runtime = 'nodejs';

/** App icon: the ball on the dark green, square. ?maskable=1 keeps the ball inside the safe zone for round or squircle masks. */
export async function GET(req, { params }) {
  const { size: sizeParam } = await params;
  const size = [180, 192, 512].includes(Number(sizeParam)) ? Number(sizeParam) : 512;
  const maskable = new URL(req.url).searchParams.get('maskable') === '1';
  const ball = Math.round(size * (maskable ? 0.52 : 0.68));
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1c13' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" width={ball} height={ball} src={`data:image/svg+xml;utf8,${encodeURIComponent(ballSvg(ball))}`} />
      </div>
    ),
    { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } },
  );
}
