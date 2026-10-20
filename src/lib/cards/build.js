/** Share cards: one function per card type, each returning the JSX for next/og plus the page it points to. */
import { ballSvg } from '../ball.js';
import { BY_ID, parseInningsId, rankAll, TOTAL, inningsPath } from '../dataset.js';
import { tocForOrder, DEFAULT_ORDER, tierOf } from '../scoring.js';
import { BATTER_BY_SLUG, LEADERS, BATTERS, verdictOf, MEASURED_TOTAL, TONS_TOTAL } from '../consequence.js';
import { LAWS } from '../laws.js';
import { runsText, ord, context } from '../format.js';
import { C, SIZES, cut, pct } from './theme.js';

const SITE = 'tonsofconsequence.com';
const TIER_COLOUR = { legendary: C.gold, elite: C.green, great: '#5fb8e8', notable: C.soft };
const flex = (extra = {}) => ({ display: 'flex', ...extra });
const col = (extra = {}) => flex({ flexDirection: 'column', ...extra });

/** The frame every card shares: header mark, body, footer with the link it points to. */
function Frame({ size, k, link, children }) {
  const pad = Math.round(54 * k);
  return (
    <div style={col({ width: '100%', height: '100%', background: C.bg, border: `${Math.round(10 * k)}px solid ${C.edge}`, padding: `${pad * 0.8}px ${pad}px`, color: C.cream, justifyContent: 'space-between' })}>
      <div style={flex({ alignItems: 'center', gap: 14 * k, fontSize: 24 * k, letterSpacing: 6 * k, color: C.muted })}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" width={Math.round(38 * k)} height={Math.round(38 * k)} src={`data:image/svg+xml;utf8,${encodeURIComponent(ballSvg(38))}`} />
        TONS OF CONSEQUENCE
      </div>
      <div style={col({ flexGrow: 1, justifyContent: 'center', padding: `${14 * k}px 0` })}>{children}</div>
      <div style={flex({ justifyContent: 'space-between', alignItems: 'center', fontSize: 24 * k, color: C.muted })}>
        <div style={flex()}>{SITE}</div>
        {size.width > size.height ? <div style={flex()}>The unofficial ranking of Test cricket centuries</div> : null}
      </div>
    </div>
  );
}

/** One square per hundred: gold = ton of consequence, green-grey = good ton, outline = not measured. */
function Strip({ innings, cell, gap = 4 }) {
  return (
    <div style={flex({ flexWrap: 'wrap', gap })}>
      {innings.map((c) => {
        const v = verdictOf(c.id);
        const style = v ? { background: v.passes ? C.gold : C.dim } : { border: `2px solid ${C.dim}` };
        return <div key={c.id} style={flex({ width: cell, height: cell, borderRadius: 3, ...style })} />;
      })}
    </div>
  );
}

function Legend({ k }) {
  const item = (bg, border, text) => (
    <div style={flex({ alignItems: 'center', gap: 8 * k, fontSize: 20 * k, color: C.soft })}>
      <div style={flex({ width: 16 * k, height: 16 * k, borderRadius: 3, background: bg, border: border ? `2px solid ${C.dim}` : 'none' })} />{text}
    </div>
  );
  return <div style={flex({ gap: 26 * k, marginTop: 14 * k })}>{item(C.gold, false, 'Ton of consequence')}{item(C.dim, false, 'Good ton')}{item('transparent', true, 'Not measured yet')}</div>;
}

const Stat = ({ k, big, small, colour = C.cream }) => (
  <div style={col({ gap: 2 * k })}>
    <div style={flex({ fontSize: 56 * k, fontWeight: 700, lineHeight: 1, color: colour })}>{big}</div>
    <div style={flex({ fontSize: 22 * k, color: C.muted, letterSpacing: 2 * k })}>{small}</div>
  </div>
);

function batterStats(b) {
  const known = b.innings.filter((c) => c.matchResult === 'win' || c.matchResult === 'draw' || c.matchResult === 'loss');
  return { share: pct(b.tons, b.measured), known: known.length, wins: known.filter((c) => c.matchResult === 'win').length };
}

function cellFor(size, count) {
  // Largest square that fits `count` cells in the strip area for this card size.
  const area = size.width - 150;
  const rows = size.height > 1500 ? 9 : size.height > 1000 ? 6 : 3;
  const per = Math.ceil(count / rows);
  return Math.max(8, Math.min(40, Math.floor(area / Math.max(per, 1)) - 4));
}

function BatterCard({ size, k, params }) {
  const b = BATTER_BY_SLUG.get(params.b);
  if (!b) return null;
  const s = batterStats(b);
  const wide = size.width > size.height;
  const measuredText = !b.measured ? `${b.hundreds} Test hundreds, none measured yet` : b.measured === b.hundreds ? `from all ${b.hundreds} Test hundreds` : `from ${b.measured} measured of ${b.hundreds} Test hundreds`;
  const cell = wide ? 26 : Math.round(cellFor(size, b.innings.length) * (k / (size.width / 1200)) * 0.8);
  return {
    link: `/tons-of-consequence/${b.slug}`,
    jsx: (
      <Frame size={size} k={k} link={`/tons-of-consequence/${b.slug}`}>
        <div style={flex({ fontSize: (b.name.length > 16 ? 62 : 74) * k, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 })}>{b.name}</div>
        <div style={flex({ alignItems: 'center', gap: 24 * k, marginTop: 10 * k })}>
          <div style={flex({ fontSize: (wide ? 130 : 170) * k, fontWeight: 700, color: C.gold, lineHeight: 1 })}>{b.measured ? b.tons : '–'}</div>
          <div style={col({ fontSize: 32 * k, color: C.soft })}>
            <div style={flex()}>tons of consequence</div>
            <div style={flex({ color: C.muted, fontSize: 26 * k })}>{measuredText}</div>
          </div>
        </div>
        <div style={col({ marginTop: 18 * k })}>
          <Strip innings={b.innings} cell={cell} gap={Math.round(4 * k)} />
          <Legend k={k} />
        </div>
        {b.measured > 0 && (
          <div style={flex({ gap: 54 * k, marginTop: 24 * k })}>
            <Stat k={k} big={`${s.share}%`} small="OF HUNDREDS WERE TOCs" colour={C.gold} />
            {s.known >= 5 && <Stat k={k} big={`${pct(s.wins, s.known)}%`} small={`TEAM WON ${s.wins} OF ${s.known}`} />}
          </div>
        )}
      </Frame>
    ),
  };
}

function InningsCard({ size, k, params }) {
  const c = BY_ID.get(parseInningsId(params.id || ''));
  if (!c) return null;
  const toc = tocForOrder(c, DEFAULT_ORDER);
  const tier = tierOf(toc);
  const rank = rankAll(DEFAULT_ORDER).findIndex((x) => x.id === c.id) + 1;
  const v = verdictOf(c.id);
  const tall = size.height > size.width;
  return {
    link: inningsPath(c),
    jsx: (
      <Frame size={size} k={k} link={inningsPath(c)}>
        <div style={flex({ fontSize: (c.name.length > 16 ? 60 : 72) * k, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 })}>{c.name}</div>
        <div style={flex({ alignItems: 'baseline', gap: 20 * k, marginTop: 8 * k })}>
          <div style={flex({ fontSize: (tall ? 200 : 120) * k, fontWeight: 700, color: C.red, lineHeight: 1 })}>{runsText(c)}</div>
          <div style={flex({ fontSize: 30 * k, color: C.soft })}>{c.balls ? `off ${c.balls} balls` : ''}</div>
        </div>
        <div style={flex({ fontSize: 32 * k, color: C.soft, marginTop: 8 * k })}>{context(c)}</div>
        {v && (
          <div style={col({ marginTop: 18 * k, padding: `${14 * k}px ${22 * k}px`, border: `3px solid ${v.passes ? C.gold : C.dim}`, borderRadius: 10 * k })}>
            <div style={flex({ fontSize: 34 * k, fontWeight: 700, letterSpacing: 4 * k, color: v.passes ? C.gold : C.soft })}>{v.passes ? 'A TON OF CONSEQUENCE' : 'A GOOD TON'}</div>
            <div style={flex({ fontSize: 26 * k, color: C.soft, marginTop: 8 * k, lineHeight: 1.3 })}>{cut(v.because, tall ? 330 : 150)}</div>
          </div>
        )}
        <div style={flex({ alignItems: 'baseline', gap: 22 * k, marginTop: 26 * k })}>
          <div style={flex({ fontSize: 72 * k, fontWeight: 700, lineHeight: 1 })}>{toc.toFixed(1)}</div>
          <div style={col({ fontSize: 26 * k })}>
            <div style={flex({ color: TIER_COLOUR[tier.key], letterSpacing: 5 * k, textTransform: 'uppercase' })}>{tier.label}</div>
            <div style={flex({ color: C.muted })}>{`${ord(rank)} of ${TOTAL.toLocaleString()} Test centuries`}</div>
          </div>
        </div>
      </Frame>
    ),
  };
}

function CompareCard({ size, k, params }) {
  const list = String(params.b || '').split(',').map((s) => BATTER_BY_SLUG.get(s.trim())).filter(Boolean).slice(0, 3);
  if (list.length < 2) return null;
  const tall = size.height > size.width;
  const most = Math.max(...list.map((b) => b.tons));
  return {
    link: `/compare?batters=${list.map((b) => b.slug).join(',')}`,
    jsx: (
      <Frame size={size} k={k} link="">
        {size.width > size.height ? null : <div style={flex({ fontSize: 30 * k, letterSpacing: 5 * k, color: C.muted, marginBottom: 16 * k })}>HEAD TO HEAD</div>}
        <div style={flex({ flexDirection: tall ? 'column' : 'row', gap: (tall ? 30 : 36) * k })}>
          {list.map((b) => {
            const s = batterStats(b);
            const lead = b.tons === most;
            return (
              <div key={b.slug} style={col({ flex: 1, padding: `${18 * k}px ${22 * k}px`, border: `3px solid ${lead ? C.gold : C.edge}`, borderRadius: 12 * k })}>
                <div style={flex({ fontSize: (b.name.length > 14 ? 34 : 42) * k, fontWeight: 700, textTransform: 'uppercase' })}>{b.name}</div>
                <div style={flex({ fontSize: 120 * k, fontWeight: 700, lineHeight: 1, color: C.gold, marginTop: 6 * k })}>{b.tons}</div>
                <div style={flex({ fontSize: 22 * k, color: C.muted })}>{b.measured === b.hundreds ? `ToCs, from ${b.hundreds} hundreds` : `ToCs, ${b.measured} of ${b.hundreds} measured`}</div>
                <div style={flex({ alignItems: 'baseline', gap: 10 * k, marginTop: 12 * k })}><div style={flex({ fontSize: 44 * k, fontWeight: 700 })}>{`${s.share}%`}</div><div style={flex({ fontSize: 22 * k, color: C.soft })}>were ToCs</div></div>
                {s.known >= 5 && <div style={flex({ fontSize: 22 * k, color: C.soft })}>{`Team won ${s.wins} of ${s.known}`}</div>}
                <div style={flex({ marginTop: 16 * k })}><Strip innings={b.innings} cell={Math.round((tall ? 18 : 12) * k)} gap={Math.round(3 * k)} /></div>
              </div>
            );
          })}
        </div>
        <Legend k={k} />
      </Frame>
    ),
  };
}

function BoardCard({ size, k, params }) {
  const byShare = params.sort === 'share';
  const rows = (byShare ? LEADERS.filter((b) => b.measured >= 10).sort((a, b) => b.tons / b.measured - a.tons / a.measured) : LEADERS).slice(0, size.height > 1000 ? 12 : 5);
  const top = byShare ? 100 : rows[0].tons;
  const val = (b) => (byShare ? pct(b.tons, b.measured) : b.tons);
  return {
    link: '/tons-of-consequence',
    jsx: (
      <Frame size={size} k={k} link="/tons-of-consequence">
        <div style={flex({ fontSize: 46 * k, fontWeight: 700 })}>{byShare ? 'Highest share of hundreds that were ToCs' : 'Most tons of consequence'}</div>
        <div style={flex({ fontSize: 22 * k, color: C.muted, marginBottom: 18 * k })}>{byShare ? '10 or more measured hundreds' : `${TONS_TOTAL} ToCs found across ${MEASURED_TOTAL.toLocaleString()} measured Test hundreds`}</div>
        {rows.map((b, i) => (
          <div key={b.slug} style={flex({ alignItems: 'center', gap: 16 * k, marginBottom: 10 * k })}>
            <div style={flex({ width: 44 * k, flexShrink: 0, fontSize: 26 * k, color: C.muted })}>{i + 1}</div>
            <div style={flex({ width: 300 * k, flexShrink: 0, fontSize: 26 * k, fontWeight: 700, whiteSpace: 'nowrap' })}>{cut(b.name, 20)}</div>
            <div style={flex({ flexGrow: 1, flexShrink: 1, minWidth: 0, height: 26 * k, background: C.dim, borderRadius: 4 })}>
              <div style={flex({ width: `${Math.max(3, (val(b) / top) * 100)}%`, height: '100%', background: i === 0 ? C.gold : C.green, borderRadius: 4 })} />
            </div>
            <div style={flex({ width: 90 * k, flexShrink: 0, fontSize: 28 * k, fontWeight: 700, justifyContent: 'flex-end' })}>{byShare ? `${val(b)}%` : val(b)}</div>
          </div>
        ))}
      </Frame>
    ),
  };
}

function RankingsCard({ size, k }) {
  const rows = rankAll(DEFAULT_ORDER).slice(0, size.height > 1000 ? 10 : 4);
  return {
    link: '/',
    jsx: (
      <Frame size={size} k={k} link="">
        <div style={flex({ fontSize: 46 * k, fontWeight: 700 })}>The greatest Test hundreds</div>
        <div style={flex({ fontSize: 22 * k, color: C.muted, marginBottom: 18 * k })}>{`Ranked by Greatness score across ${TOTAL.toLocaleString()} centuries (default weighting)`}</div>
        {rows.map((c, i) => (
          <div key={c.id} style={flex({ alignItems: 'center', gap: 16 * k, marginBottom: 12 * k })}>
            <div style={flex({ width: 44 * k, fontSize: 28 * k, color: C.muted })}>{i + 1}</div>
            <div style={col({ flexGrow: 1 })}>
              <div style={flex({ fontSize: 30 * k, fontWeight: 700 })}>{`${c.name} ${runsText(c)}`}</div>
              <div style={flex({ fontSize: 20 * k, color: C.soft })}>{context(c)}</div>
            </div>
            <div style={flex({ fontSize: 40 * k, fontWeight: 700, color: C.gold })}>{c.toc.toFixed(1)}</div>
          </div>
        ))}
      </Frame>
    ),
  };
}

function LawsCard({ size, k, params }) {
  const n = Number(params.law);
  const one = n >= 1 && n <= LAWS.length ? LAWS[n - 1] : null;
  if (one) {
    return {
      link: '/tons-of-consequence',
      jsx: (
        <Frame size={size} k={k} link="/tons-of-consequence">
          <div style={flex({ fontSize: 30 * k, letterSpacing: 5 * k, color: C.gold })}>{`LAW ${n} OF 13`}</div>
          <div style={flex({ fontSize: (size.height > 1000 ? 92 : 70) * k, fontWeight: 700, lineHeight: 1.05, marginTop: 10 * k })}>{one[0]}</div>
          <div style={flex({ fontSize: 36 * k, color: C.soft, marginTop: 26 * k, lineHeight: 1.3 })}>{one[1]}</div>
        </Frame>
      ),
    };
  }
  const tall = size.height > 1000;
  const items = tall ? LAWS : LAWS.slice(0, 5);
  return {
    link: '/tons-of-consequence',
    jsx: (
      <Frame size={size} k={k} link="/tons-of-consequence">
        <div style={flex({ fontSize: 46 * k, fontWeight: 700 })}>The 13 laws of a ton of consequence</div>
        <div style={flex({ fontSize: 22 * k, color: C.muted, marginBottom: 16 * k })}>A hundred the side needed: it helped them win or avoid losing.</div>
        {items.map(([t], i) => (
          <div key={t} style={flex({ gap: 14 * k, marginBottom: (tall ? 12 : 8) * k, fontSize: (tall ? 32 : 26) * k })}>
            <div style={flex({ width: 40 * k, color: C.gold, fontWeight: 700 })}>{i + 1}</div>
            <div style={flex()}>{t}</div>
          </div>
        ))}
        {!tall && <div style={flex({ fontSize: 22 * k, color: C.muted, marginTop: 6 * k })}>…and 8 more at tonsofconsequence.com</div>}
      </Frame>
    ),
  };
}

const TYPES = { batter: BatterCard, innings: InningsCard, compare: CompareCard, board: BoardCard, rankings: RankingsCard, laws: LawsCard };
export const CARD_TYPES = Object.keys(TYPES);

/** { jsx, link, size } or null when the card cannot be made (unknown type or batter). */
export function buildCard(type, params = {}) {
  const make = TYPES[type];
  const size = SIZES[params.size] || SIZES.wide;
  if (!make) return null;
  const tall = size.height > size.width;
  const boost = !tall ? 1 : size.height > 1500 ? (type === 'batter' || type === 'innings' || type === 'compare' ? 1.5 : 1.4) : (type === 'compare' ? 1.0 : 1.25);
  const out = make({ size, k: (size.width / 1200) * boost, params });
  return out ? { ...out, size } : null;
}
export { BATTERS };
