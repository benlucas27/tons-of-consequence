import { BOARD } from '@/lib/batterBoard';
import { C, Header, Footer, Frame, cardImage, formatOf } from '@/lib/cards';

export const runtime = 'nodejs';

const Stat = ({ big, value, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: big ? '24px 28px' : '16px 20px', background: C.panel, border: `3px solid ${C.line}`, borderRadius: 12, gap: 4 }}>
    <div style={{ display: 'flex', fontSize: big ? 68 : 44, fontWeight: 700, lineHeight: 1 }}>{value}</div>
    <div style={{ display: 'flex', fontSize: 22, letterSpacing: 3, color: C.mute }}>{label}</div>
  </div>
);

export async function GET(req, { params }) {
  const sp = new URL(req.url).searchParams;
  const r = BOARD.find((x) => x.slug === params.slug);
  if (!r) return new Response('No such batter', { status: 404 });
  const fmt = formatOf(sp);
  const big = fmt === 'portrait';
  const share = r.measured ? `${Math.round((100 * r.tons) / r.measured)}%` : '-';
  const win = r.resultsKnown ? `${Math.round((100 * r.wins) / r.resultsKnown)}%` : '-';
  const el = (
    <Frame pad={big ? '56px 60px' : '36px 48px'}>
      <Header right="BATTER" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', fontSize: big ? (r.name.length > 16 ? 96 : 120) : 76, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>{r.name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: big ? 260 : 150, fontWeight: 700, color: C.red, lineHeight: 1 }}>{r.tons}</div>
          <div style={{ display: 'flex', fontSize: big ? 40 : 30, color: C.soft, maxWidth: big ? 600 : 700 }}>{`tons of consequence from ${r.measured} measured${r.measured < r.hundreds ? ` (${r.hundreds} hundreds)` : ' hundreds'}`}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <Stat big={big} value={share} label="ToC SHARE" />
        <Stat big={big} value={win} label="TEAM WON" />
        <Stat big={big} value={r.peak ? r.peak.score.toFixed(1) : '-'} label="BEST INNINGS" />
      </div>
      {r.peak && <div style={{ display: 'flex', fontSize: big ? 30 : 24, color: C.soft }}>{`Best: ${r.peak.runs}${r.peak.notOut ? '*' : ''} v ${r.peak.opponent}, ${r.peak.year}`}</div>}
      <Footer text="Every Test hundred, and why it counted" />
    </Frame>
  );
  return cardImage(el, fmt, sp, `toc-${params.slug}`);
}
