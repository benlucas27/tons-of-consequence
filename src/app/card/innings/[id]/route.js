import { BY_ID, rankAll } from '@/lib/dataset';
import { parseOrder, DEFAULT_ORDER, parseBias, tierOf, activePreset } from '@/lib/scoring';
import { verdictOf } from '@/lib/consequence';
import { runsText, fmt1, ord, RESULT_LABEL } from '@/lib/format';
import { C, Header, Footer, Frame, Chip, cardImage, formatOf } from '@/lib/cards';

export const runtime = 'nodejs';

export async function GET(req, { params }) {
  const sp = new URL(req.url).searchParams;
  const base = BY_ID.get(Number(params.id));
  if (!base) return new Response('No such innings', { status: 404 });
  const fmt = formatOf(sp);
  const big = fmt === 'portrait';
  const order = parseOrder(sp.get('o')) || DEFAULT_ORDER;
  const bias = parseBias(sp.get('bonus'));
  const ranked = rankAll(order, bias);
  const c = ranked.find((x) => x.id === base.id);
  const tier = tierOf(c.toc);
  const v = verdictOf(c.id);
  const preset = activePreset(order, bias);
  const el = (
    <Frame pad={big ? '56px 60px' : '36px 48px'}>
      <Header right="INNINGS" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex' }}><Chip kind={v ? (v.passes ? 'toc' : 'good') : 'none'} /></div>
        <div style={{ display: 'flex', fontSize: big ? (c.name.length > 16 ? 92 : 112) : 70, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>{c.name}</div>
        <div style={{ display: 'flex', fontSize: big ? 240 : 140, fontWeight: 700, color: C.red, lineHeight: 1 }}>{runsText(c)}</div>
        <div style={{ display: 'flex', fontSize: big ? 36 : 28, color: C.soft }}>{`v ${c.opponent} · ${c.venue}, ${c.year}${c.matchResult && RESULT_LABEL[c.matchResult] ? ` · ${RESULT_LABEL[c.matchResult]}` : ''}`}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: big ? 150 : 100, fontWeight: 700, lineHeight: 1 }}>{fmt1(c.toc)}</div>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, color: C.mute }}>GREATNESS SCORE</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', fontSize: big ? 44 : 32, letterSpacing: 5, textTransform: 'uppercase', color: C.gold }}>{tier.label}</div>
          <div style={{ display: 'flex', fontSize: big ? 30 : 24, color: C.soft }}>{`${ord(c.rank)} of ${ranked.length.toLocaleString()} Test hundreds`}</div>
          <div style={{ display: 'flex', fontSize: 22, color: C.mute }}>{preset ? `${preset} weighting` : 'Custom weighting'}</div>
        </div>
      </div>
      <Footer text="Every Test hundred, ranked" />
    </Frame>
  );
  return cardImage(el, fmt, sp, `toc-innings-${c.id}`);
}
