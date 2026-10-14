import { ImageResponse } from 'next/og';
import { ballSvg } from '@/lib/ball';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1C3828',
          border: '10px solid #3A6A3A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" width={72} height={72} src={`data:image/svg+xml;utf8,${encodeURIComponent(ballSvg(72))}`} />
          <div style={{ color: '#4A8A4A', fontSize: 24, letterSpacing: 8, fontWeight: 600 }}>
            TEST CRICKET
          </div>
        </div>
        <div style={{ display: 'flex', color: '#F0E6C8', fontSize: 88, fontWeight: 700, letterSpacing: 6 }}>
          TONS OF
        </div>
        <div style={{ display: 'flex', color: '#F0E6C8', fontSize: 108, fontWeight: 700, letterSpacing: 2 }}>
          CONSEQUENCE
        </div>
        <div style={{ display: 'flex', color: '#6A9A6A', fontSize: 26, letterSpacing: 3, marginTop: 28 }}>
          THE UNOFFICIAL RANKING OF TEST CRICKET CENTURIES
        </div>
      </div>
    ),
    { ...size }
  );
}
