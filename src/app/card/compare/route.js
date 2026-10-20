import { BY_ID } from '@/lib/dataset';
import { compareInnings } from '@/lib/ask';
import { parseOrder, DEFAULT_ORDER, parseBias, activePreset } from '@/lib/scoring';
import { verdictOf } from '@/lib/consequence';
import { runsText, fmt1 } from '@/lib/format';
import { C, Header, Footer, Frame, Chip, cardImage, formatOf } from '@/lib/cards';

export const runtime = 'nodejs';

const chipKind = (id) => { const v = verdictOf(id); return v ? (v.passes ? 'toc' : 'good') : 'none'; };

function Side({ c, win, fmt }) {
  const big = fmt === 'portrait';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: big ? 'none' : 1, gap: big ? 12 : 8, padding: big ? '32px 36px' : '22px 26px', background: C.panel, border: `4px solid ${win ? C.gold : C.line}`, borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 34, fontSize: 24, letterSpacing: 4, color: C.gold }}>
        <div style={{ display: 'flex' }}>{win ? 'WINNER' : ''}</div>
        <Chip kind={chipKind(c.id)} />
      </div>
      <div style={{ display: 'flex', fontSize: big ? (c.name.length > 16 ? 56 : 66) : 44, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>{c.name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: big ? 130 : 84, fontWeight: 700, color: C.red, lineHeight: 1 }}>{runsText(c)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: big ? 110 : 70, fontWeight: 700, lineHeight: 1 }}>{fmt1(c.toc)}</div>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, color: C.mute }}>GREATNESS SCORE</div>
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: big ? 30 : 24, color: C.soft }}>{`v ${c.opponent} · ${c.venue}, ${c.year}`}</div>
    </div>
  );
}

export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const a = BY_ID.get(Number(sp.get('a')));
  const b = BY_ID.get(Number(sp.get('b')));
  const fmt = formatOf(sp);
  if (!a || !b) return new Response('Pick two innings: /card/compare?a=ID&b=ID', { status: 400 });
  const order = parseOrder(sp.get('o')) || DEFAULT_ORDER;
  const bias = parseBias(sp.get('bonus'));
  const cmp = compareInnings(a, b, order, bias);
  const margin = Math.abs(cmp.a.toc - cmp.b.toc);
  const close = margin < 0.1;
  const holds = cmp.presets.length - cmp.flips.length;
  const preset = activePreset(order, bias);
  const headline = close ? 'Too close to call' : `${cmp.winner.name.split(' ').slice(-1)[0]} by ${fmt1(margin)} points`;
  const sub = `${preset ? `${preset} weighting` : 'Custom weighting'} · ${close ? 'level' : `holds under ${holds} of ${cmp.presets.length} presets`}`;
  const portrait = fmt === 'portrait';
  const sides = [cmp.a, cmp.b].map((c) => <Side key={c.id} c={c} win={!close && cmp.winner.id === c.id} fmt={fmt} />);
  const el = (
    <Frame pad={portrait ? '56px 60px' : '36px 48px'}>
      <Header right="HEAD TO HEAD" />
      <div style={{ display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: portrait ? 20 : 24, alignItems: 'stretch' }}>{sides}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', fontSize: portrait ? 76 : 52, fontWeight: 700, textTransform: 'uppercase', color: C.gold, lineHeight: 1 }}>{headline}</div>
        <div style={{ display: 'flex', fontSize: portrait ? 30 : 24, color: C.soft }}>{sub}</div>
      </div>
      <Footer text="Compare any two Test hundreds" />
    </Frame>
  );
  return cardImage(el, fmt, sp, `toc-${a.id}-v-${b.id}`);
}
