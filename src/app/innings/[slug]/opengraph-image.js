import { ImageResponse } from 'next/og';
import { BY_ID, parseInningsId, TOTAL } from '@/lib/dataset';
import { tocForOrder, DEFAULT_ORDER, tierOf, NATIONS } from '@/lib/scoring';
import { rankAll } from '@/lib/dataset';
import { ballSvg } from '@/lib/ball';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'A Test century ranked by Tons of Consequence';

const TIER_COLOUR = { legendary: '#f0c23c', elite: '#62d08c', great: '#5fb8e8', notable: '#a9b7ae' };

export default async function Image({ params }) {
  const c = BY_ID.get(parseInningsId(params.slug));
  if (!c) {
    return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', background: '#0b1c13', color: '#f2ead4', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>Tons of Consequence</div>, size);
  }
  const toc = tocForOrder(c, DEFAULT_ORDER);
  const tier = tierOf(toc);
  const rank = rankAll(DEFAULT_ORDER).findIndex((x) => x.id === c.id) + 1;
  const where = [c.venue, c.year].filter(Boolean).join(' · ');
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0b1c13', border: '10px solid #2a4d3b', padding: '48px 60px', color: '#f2ead4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, letterSpacing: 6, color: '#88a493' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" width={40} height={40} src={`data:image/svg+xml;utf8,${encodeURIComponent(ballSvg(40))}`} />
          TONS OF CONSEQUENCE
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 720 }}>
            <div style={{ display: 'flex', fontSize: c.name.length > 16 ? 80 : 96, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase' }}>{c.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 14 }}>
              <div style={{ display: 'flex', fontSize: 150, fontWeight: 700, color: '#e85a40', lineHeight: 1 }}>{c.runs}{c.notOut ? '*' : ''}</div>
              <div style={{ display: 'flex', fontSize: 32, color: '#bccbbf' }}>{c.balls ? `off ${c.balls} balls` : ''}</div>
            </div>
            <div style={{ display: 'flex', fontSize: 34, color: '#bccbbf', marginTop: 10 }}>{`v ${c.opponent} · ${where}`}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: 190, fontWeight: 700, lineHeight: 1 }}>{toc.toFixed(1)}</div>
            <div style={{ display: 'flex', fontSize: 34, letterSpacing: 6, color: TIER_COLOUR[tier.key], textTransform: 'uppercase' }}>{tier.label}</div>
            <div style={{ display: 'flex', fontSize: 26, color: '#88a493', marginTop: 8 }}>{`${rank}${rank % 10 === 1 && rank % 100 !== 11 ? 'st' : rank % 10 === 2 && rank % 100 !== 12 ? 'nd' : rank % 10 === 3 && rank % 100 !== 13 ? 'rd' : 'th'} of ${TOTAL.toLocaleString()} Test centuries`}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
