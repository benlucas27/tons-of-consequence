import { ImageResponse } from 'next/og';

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
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#9B1C1C',
            border: '2px solid #4A0808', display: 'flex',
          }} />
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
          THE DEFINITIVE RANKING OF TEST CRICKET CENTURIES
        </div>
      </div>
    ),
    { ...size }
  );
}
