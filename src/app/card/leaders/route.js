import { BOARD } from '@/lib/batterBoard';
import { SORTS, sortBoard } from '@/lib/boardSort';
import { C, Header, Footer, Frame, cardImage, formatOf } from '@/lib/cards';

export const runtime = 'nodejs';

const pct = (a, b) => `${Math.round((100 * a) / b)}%`;
const VALUE = {
  tons: (r) => `${r.tons} of ${r.measured}`,
  share: (r) => `${pct(r.tons, r.measured)} (${r.tons} of ${r.measured})`,
  peak: (r) => `${r.peak.score.toFixed(1)} · ${r.peak.runs}${r.peak.notOut ? '*' : ''} v ${r.peak.opponent} ${r.peak.year}`,
  wins: (r) => `${pct(r.wins, r.resultsKnown)} (${r.wins} of ${r.resultsKnown})`,
};

export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const sort = SORTS[sp.get('sort')] ? sp.get('sort') : 'tons';
  const min = Math.min(20, Math.max(1, Number(sp.get('min')) || 8));
  const fmt = formatOf(sp);
  const big = fmt === 'portrait';
  const rows = sortBoard(BOARD, { sort, min }).slice(0, big ? 10 : 5);
  const el = (
    <Frame pad={big ? '56px 60px' : '36px 48px'}>
      <Header right="LEADERBOARD" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', fontSize: big ? 80 : 54, fontWeight: 700, textTransform: 'uppercase', color: C.gold, lineHeight: 1 }}>{SORTS[sort].label}</div>
        {SORTS[sort].needsMin && <div style={{ display: 'flex', fontSize: 24, color: C.mute }}>{`At least ${min} ${sort === 'wins' ? 'hundreds with a known result' : 'measured hundreds'}`}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: big ? 10 : 6 }}>
        {rows.map((r, i) => (
          <div key={r.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: big ? '12px 22px' : '8px 18px', background: C.panel, border: `2px solid ${i === 0 ? C.gold : C.line}`, borderRadius: 10, fontSize: big ? 36 : 28 }}>
            <div style={{ display: 'flex', gap: 18 }}>
              <div style={{ display: 'flex', width: 44, color: C.mute }}>{i + 1}</div>
              <div style={{ display: 'flex', fontWeight: 700, textTransform: 'uppercase' }}>{r.name}</div>
            </div>
            <div style={{ display: 'flex', color: C.soft, fontSize: big ? 30 : 24 }}>{VALUE[sort](r)}</div>
          </div>
        ))}
      </div>
      <Footer text="Test hundreds the side needed" />
    </Frame>
  );
  return cardImage(el, fmt, sp, `toc-leaders-${sort}`);
}
