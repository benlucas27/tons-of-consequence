/** Share cards: one function per card type, each returning the JSX for next/og plus the page it points to. */
import { ballSvg } from '../ball.js';
import { BY_ID, parseInningsId, rankAll, TOTAL, inningsPath } from '../dataset.js';
import { tocForOrder, DEFAULT_ORDER, tierOf, LEVER_BY_KEY, RANK_WEIGHTS, activePreset, parseOrder, parseBias, BIASES } from '../scoring.js';
import { BATTER_BY_SLUG, LEADERS, BATTERS, verdictOf, MEASURED_TOTAL, TONS_TOTAL } from '../consequence.js';
import { LAWS } from '../laws.js';
import { runsText, ord, context } from '../format.js';
import { C, SIZES, WIDE, cut, pct, up, fit } from './theme.js';

const SITE = 'tonsofconsequence.com';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "Data as of 21 Oct 2026": the day this version of the site was built. */
function asOf() {
  const d = process.env.BUILD_DATE ? new Date(`${process.env.BUILD_DATE}T00:00:00Z`) : new Date();
  return `Data as of ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const flex = (extra = {}) => ({ display: 'flex', ...extra });
const col = (extra = {}) => flex({ flexDirection: 'column', ...extra });
/** Headline type: Barlow Condensed bold. */
const head = (size, extra = {}) => flex({ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: size, lineHeight: 1, ...extra });
const TIER_COLOUR = { legendary: C.gold, elite: C.green, great: '#5fb8e8', notable: C.muted };
const ballUrl = (px) => `data:image/svg+xml;utf8,${encodeURIComponent(ballSvg(px))}`;

/** The weighting a score was made with: the six criteria as a bar (widths are their weights) and what to call it. */
const weightingOf = (params) => ({ order: parseOrder(params.o) || DEFAULT_ORDER, bias: parseBias(params.bonus) });
function WeightLine({ order, bias, big }) {
  const preset = activePreset(order, bias);
  const name = preset ? `${preset} weighting` : 'Custom weighting';
  return (
    <div style={col({ gap: 8 })}>
      <div style={flex({ fontSize: big ? 22 : 20, color: C.muted, gap: 10 })}>
        <div style={flex({ color: C.soft, fontWeight: 600 })}>{name}</div>
        <div style={flex()}>{preset === 'Default' ? '' : order.map((key) => LEVER_BY_KEY[key].short).join(' › ')}</div>
        {bias ? <div style={flex({ color: C.gold })}>{`+ ${BIASES[bias].name}`}</div> : null}
      </div>
      <div style={flex({ height: big ? 30 : 26, borderRadius: 6, overflow: 'hidden' })}>
        {order.map((key, i) => {
          const l = LEVER_BY_KEY[key];
          return <div key={key} style={flex({ width: `${RANK_WEIGHTS[i]}%`, background: l.hex, color: '#0b1c13', fontSize: 15, fontWeight: 600, alignItems: 'center', justifyContent: 'center' })}>{l.code.toUpperCase()}</div>;
        })}
      </div>
    </div>
  );
}

/**
 * The frame every card shares: floodlit night background, wordmark, body, footer with the site and the data date.
 * `glow` tints the floodlight; `ghost` is an optional big faint element behind the body (a numeral, a ball).
 */
function Frame({ size, glow = 'rgba(242,199,68,0.40)', ghost = null, children }) {
  const { width: W, height: H } = size;
  const wide = W > H;
  const pad = wide ? 44 : 64;
  return (
    <div style={col({ position: 'relative', width: '100%', height: '100%', background: C.bg, color: C.cream, fontFamily: 'Barlow', padding: wide ? '34px 44px' : `${H > 1200 ? 64 : 58}px ${pad}px`, justifyContent: 'space-between', overflow: 'hidden' })}>
      <div style={flex({ position: 'absolute', top: 0, left: 0, width: W, height: H, backgroundImage: `radial-gradient(circle at 88% 0%, ${glow}, rgba(0,0,0,0) 58%)` })} />
      {/* Three soft mown-pitch stripes and one boundary-rope ring: texture without noise. */}
      {[120, 480, 840].map((x) => <div key={x} style={flex({ position: 'absolute', top: 0, left: x, width: 120, height: H, background: 'rgba(98,208,140,0.045)' })} />)}
      <div style={flex({ position: 'absolute', left: -Math.round(W * 0.36), top: Math.round(H * 0.56), width: Math.round(W * 0.95), height: Math.round(W * 0.95), borderRadius: W, border: '3px solid rgba(242,199,68,0.18)' })} />
      {ghost}
      <div style={flex({ position: 'relative', alignItems: 'center', gap: 16, fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: wide ? 26 : H > 1200 ? 32 : 30, letterSpacing: 7, color: C.gold })}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" width={38} height={38} src={ballUrl(38)} />
        TONS OF CONSEQUENCE
      </div>
      <div style={col({ position: 'relative', flexGrow: 1, justifyContent: 'space-between', padding: `${wide ? 14 : 26}px 0` })}>{children}</div>
      <div style={flex({ position: 'relative', justifyContent: 'space-between', alignItems: 'center', color: C.muted })}>
        <div style={head(H > 1200 ? 34 : 32, { letterSpacing: 2, color: C.cream })}>{SITE}</div>
        <div style={flex({ fontSize: 21 })}>{asOf()}</div>
      </div>
    </div>
  );
}

/** One square per hundred: gold = ton of consequence, green-grey = good ton, outline = not measured. Cells shrink to fit `avail` x `maxH`. */
function Strip({ innings, avail, maxH, maxCell = 48, gap = 5 }) {
  const n = innings.length;
  let cell = 8;
  for (let c = maxCell; c >= 8; c -= 1) {
    const per = Math.max(1, Math.floor((avail + gap) / (c + gap)));
    if (Math.ceil(n / per) * (c + gap) - gap <= maxH) { cell = c; break; }
  }
  return (
    <div style={flex({ flexWrap: 'wrap', gap })}>
      {innings.map((c) => {
        const v = verdictOf(c.id);
        const style = v ? { background: v.passes ? C.gold : C.dim } : { border: `2px solid ${C.dim}` };
        return <div key={c.id} style={flex({ width: cell, height: cell, borderRadius: Math.max(2, cell / 10), ...style })} />;
      })}
    </div>
  );
}

function Legend({ size = 22 }) {
  const item = (bg, border, text) => (
    <div style={flex({ alignItems: 'center', gap: 8, fontSize: size, color: C.soft })}>
      <div style={flex({ width: size - 4, height: size - 4, borderRadius: 3, background: bg, border: border ? `2px solid ${C.dim}` : 'none' })} />{text}
    </div>
  );
  return <div style={flex({ gap: 28 })}>{item(C.gold, false, 'Ton of consequence')}{item(C.dim, false, 'Good ton')}{item('transparent', true, 'Not measured yet')}</div>;
}

function batterStats(b) {
  const known = b.innings.filter((c) => c.matchResult === 'win' || c.matchResult === 'draw' || c.matchResult === 'loss');
  return { share: pct(b.tons, b.measured), known: known.length, wins: known.filter((c) => c.matchResult === 'win').length };
}

const StripPanel = ({ children, gap = 16 }) => (
  <div style={col({ position: 'relative', gap, background: C.panel, border: `2px solid ${C.line}`, borderRadius: 14, padding: '20px 24px' })}>{children}</div>
);

function BatterCard({ size, params }) {
  const b = BATTER_BY_SLUG.get(params.b);
  if (!b) return null;
  const s = batterStats(b);
  const tall = size.height > 1200;
  const wide = size.width > size.height;
  const parts = b.name.split(' ');
  const last = parts.pop();
  const lines = tall && parts.length ? [parts.join(' '), last] : [b.name];
  const nameSize = wide ? fit(lines, 700, 96) : tall ? fit(lines, 880, 230) : fit(lines, 940, 150);
  const numSize = wide ? 250 : tall ? 520 : 400;
  const measuredText = !b.measured ? `${b.hundreds} Test hundreds, none measured yet` : b.measured === b.hundreds ? `from all ${b.hundreds} Test hundreds` : `from ${b.measured} measured of ${b.hundreds} Test hundreds`;
  const avail = size.width - (wide ? 88 : 128) - 48;
  // A large faint ball where a player photo can go later.
  // eslint-disable-next-line @next/next/no-img-element
  const ghost = <img alt="" width={Math.round(size.width * 0.5)} height={Math.round(size.width * 0.5)} style={{ position: 'absolute', right: -Math.round(size.width * 0.1), top: Math.round(size.height * 0.06), opacity: 0.07 }} src={ballUrl(400)} />;
  return {
    link: `/tons-of-consequence/${b.slug}`,
    jsx: (
      <Frame size={size} ghost={ghost}>
        <div style={col()}>
          {lines.map((l) => <div key={l} style={head(nameSize, { textTransform: 'uppercase', lineHeight: 0.92 })}>{l}</div>)}
        </div>
        <div style={flex({ alignItems: 'center', gap: wide ? 30 : 40 })}>
          <div style={head(numSize, { color: C.red, lineHeight: 0.82 })}>{b.measured ? b.tons : '–'}</div>
          <div style={col({ gap: 18 })}>
            <div style={col()}>
              <div style={head(tall ? 76 : wide ? 52 : 62, { textTransform: 'uppercase' })}>Tons of</div>
              <div style={head(tall ? 76 : wide ? 52 : 62, { textTransform: 'uppercase' })}>consequence</div>
            </div>
            <div style={flex({ fontSize: tall ? 30 : 28, color: C.muted })}>{measuredText}</div>
            {b.measured > 0 && (
              <div style={flex({ gap: 34 })}>
                <div style={col()}>
                  <div style={head(tall ? 80 : 66, { color: C.gold })}>{`${s.share}%`}</div>
                  <div style={flex({ fontSize: 21, color: C.muted })}>WERE ToCs</div>
                </div>
                {s.known >= 5 && (
                  <div style={col()}>
                    <div style={head(tall ? 80 : 66)}>{`${pct(s.wins, s.known)}%`}</div>
                    <div style={flex({ fontSize: 21, color: C.muted })}>{`TEAM WON ${s.wins} OF ${s.known}`}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <StripPanel>
          <Strip innings={b.innings} avail={avail} maxH={wide ? 60 : tall ? 130 : 100} />
          {!wide && <Legend size={tall ? 22 : 21} />}
        </StripPanel>
      </Frame>
    ),
  };
}

function InningsCard({ size, params }) {
  const c = BY_ID.get(parseInningsId(params.id || ''));
  if (!c) return null;
  const { order, bias } = weightingOf(params);
  const toc = tocForOrder(c, order, bias);
  const tier = tierOf(toc);
  const rank = rankAll(order, bias).findIndex((x) => x.id === c.id) + 1;
  const v = verdictOf(c.id);
  const tall = size.height > 1200;
  const lines = c.name.split(' ').length > 1 && tall ? [c.name] : [c.name];
  const nameSize = fit(lines, 940, tall ? 130 : 84);
  const accent = v && v.passes ? C.red : C.dim;
  return {
    link: inningsPath(c, order, bias),
    jsx: (
      <Frame size={size} glow="rgba(240,100,60,0.34)">
        <div style={col({ gap: 2 })}>
          <div style={head(nameSize, { textTransform: 'uppercase', lineHeight: 0.95 })}>{c.name}</div>
          <div style={flex({ alignItems: 'flex-end', gap: 28 })}>
            <div style={head(tall ? 470 : 330, { color: C.red, lineHeight: 0.84 })}>{runsText(c)}</div>
            {!tall && (
              <div style={col({ paddingBottom: 14, gap: 4 })}>
                <div style={flex({ fontSize: 30, color: C.soft })}>{c.balls ? `off ${c.balls} balls` : ''}</div>
                <div style={flex({ fontSize: 26, color: C.muted })}>{context(c)}</div>
              </div>
            )}
          </div>
          {tall && (
            <div style={flex({ gap: 20, alignItems: 'baseline', fontSize: 34, color: C.soft, marginTop: 10 })}>
              <div style={flex({ fontWeight: 600 })}>{c.balls ? `off ${c.balls} balls` : ''}</div>
              <div style={flex({ color: C.muted })}>{context(c)}</div>
            </div>
          )}
        </div>
        <div style={flex({ gap: 26, alignItems: 'stretch' })}>
          <div style={col({ justifyContent: 'center', padding: tall ? '16px 32px' : '14px 26px', background: C.panel, border: `2px solid ${C.line}`, borderRadius: 14 })}>
            <div style={head(tall ? 130 : 96)}>{toc.toFixed(1)}</div>
            <div style={flex({ fontSize: tall ? 26 : 22, letterSpacing: 5, color: TIER_COLOUR[tier.key], textTransform: 'uppercase' })}>{tier.label}</div>
            <div style={flex({ fontSize: tall ? 20 : 18, color: C.muted })}>{`${ord(rank)} of ${TOTAL.toLocaleString()}${tall ? ' Test centuries' : ''}`}</div>
          </div>
          {v && (
            <div style={col({ flexGrow: 1, flexShrink: 1, minWidth: 0, justifyContent: 'center', gap: 8, padding: tall ? '20px 28px' : '16px 26px', border: `3px solid ${accent}`, borderRadius: 14, background: v.passes ? 'rgba(238,90,62,0.10)' : C.panel })}>
              <div style={head(tall ? 44 : 38, { letterSpacing: 4, color: v.passes ? C.red : C.soft })}>{v.passes ? 'A TON OF CONSEQUENCE' : 'A GOOD TON'}</div>
              <div style={flex({ fontSize: tall ? 26 : 24, color: C.soft, lineHeight: 1.3 })}>{cut(v.because, tall ? 190 : 130)}</div>
            </div>
          )}
        </div>
        <WeightLine order={order} bias={bias} big={tall} />
      </Frame>
    ),
  };
}

function CompareCard({ size, params }) {
  const list = String(params.b || '').split(',').map((s) => BATTER_BY_SLUG.get(s.trim())).filter(Boolean).slice(0, 3);
  if (list.length < 2) return null;
  const tall = size.height > 1200;
  const ranked = [...list].sort((a, b) => b.tons - a.tons);
  const most = ranked[0].tons;
  const title = tall ? ['Who has more', 'ToCs?'] : ['Head to head'];
  return {
    link: `/compare?batters=${list.map((b) => b.slug).join(',')}`,
    jsx: (
      <Frame size={size}>
        <div style={col({ gap: 2 })}>
          {title.map((t, i) => <div key={t} style={head(tall ? 110 : 64, { textTransform: 'none', letterSpacing: 1, color: i ? C.gold : C.cream })}>{up(t)}</div>)}
        </div>
        <div style={col({ gap: tall ? 20 : 14, flexGrow: 1, justifyContent: 'center' })}>
          {ranked.map((b) => {
            const s = batterStats(b);
            const lead = b.tons === most;
            const numColour = lead ? C.red : C.cream;
            return (
              <div key={b.slug} style={flex({ alignItems: tall ? 'stretch' : 'center', flexDirection: tall ? 'column' : 'row', justifyContent: 'center', flexGrow: ranked.length > 2 ? 0 : 1, gap: tall ? 10 : 26, padding: tall ? '20px 28px' : '12px 24px', borderRadius: 16, background: C.panel, border: `3px solid ${lead ? C.red : C.line}` })}>
                {tall ? (
                  <div style={flex({ alignItems: 'flex-end', justifyContent: 'space-between' })}>
                    <div style={head(ranked.length > 2 ? 74 : 92, { textTransform: 'uppercase' })}>{b.name}</div>
                    <div style={head(ranked.length > 2 ? 160 : 210, { color: numColour, lineHeight: 0.8 })}>{b.tons}</div>
                  </div>
                ) : (
                  <div style={flex({ width: 190, justifyContent: 'center', flexShrink: 0 })}><div style={head(180, { color: numColour, lineHeight: 0.85 })}>{b.tons}</div></div>
                )}
                <div style={col({ flexGrow: 1, flexShrink: 1, minWidth: 0, gap: tall ? 10 : 4 })}>
                  {!tall && <div style={head(ranked.length > 2 ? 52 : 64, { textTransform: 'uppercase' })}>{b.name}</div>}
                  {tall && <div style={flex({ height: 18, borderRadius: 9, background: C.track })}><div style={flex({ width: `${Math.max(3, (b.tons / (most || 1)) * 100)}%`, height: 18, borderRadius: 9, background: lead ? C.red : C.green })} /></div>}
                  <div style={flex({ fontSize: tall ? 26 : 22, color: C.muted, flexWrap: 'wrap', gap: 6 })}>
                    <div style={flex()}>{b.measured === b.hundreds ? `ToCs from ${b.hundreds} hundreds` : `ToCs, ${b.measured} of ${b.hundreds} measured`}</div>
                    <div style={flex({ color: C.cream, fontWeight: 600 })}>{`· ${s.share}% were ToCs`}</div>
                    {s.known >= 5 && <div style={flex()}>{`· team won ${s.wins} of ${s.known}`}</div>}
                  </div>
                  <Strip innings={b.innings} avail={tall ? 880 : 640} maxH={tall ? 50 : 40} maxCell={tall ? 24 : 18} gap={tall ? 4 : 3} />
                </div>
              </div>
            );
          })}
          <Legend size={tall ? 21 : 20} />
        </div>
      </Frame>
    ),
  };
}

function BoardCard({ size, params }) {
  const tall = size.height > 1200;
  const byShare = params.sort === 'share';
  const rows = (byShare ? LEADERS.filter((b) => b.measured >= 10).sort((a, b) => b.tons / b.measured - a.tons / a.measured) : LEADERS).slice(0, tall ? 10 : 9);
  const top = byShare ? 100 : rows[0].tons;
  const val = (b) => (byShare ? pct(b.tons, b.measured) : b.tons);
  const titleLines = byShare ? ['Highest share of', 'hundreds that were ToCs'] : ['Most tons of', 'consequence'];
  const ts = fit(titleLines, 940, tall ? 124 : 104);
  return {
    link: '/tons-of-consequence',
    jsx: (
      <Frame size={size}>
        <div style={col({ gap: 8 })}>
          <div style={col()}>
            {titleLines.map((t, i) => <div key={t} style={head(ts, { color: i ? C.gold : C.cream, lineHeight: 0.95 })}>{up(t)}</div>)}
          </div>
          <div style={flex({ fontSize: tall ? 26 : 24, color: C.muted })}>{byShare ? '10 or more measured hundreds' : `${TONS_TOTAL} ToCs found across ${MEASURED_TOTAL.toLocaleString()} measured Test hundreds`}</div>
        </div>
        <div style={col({ gap: tall ? 14 : 9 })}>
          {rows.map((b, i) => (
            <div key={b.slug} style={flex({ alignItems: 'center', gap: 18 })}>
              <div style={head(tall ? 38 : 34, { width: tall ? 46 : 40, flexShrink: 0, fontWeight: 600, color: C.muted })}>{i + 1}</div>
              <div style={head(tall ? 44 : 38, { width: tall ? 310 : 280, flexShrink: 0, textTransform: 'uppercase', whiteSpace: 'nowrap' })}>{cut(b.name, 20)}</div>
              <div style={flex({ flexGrow: 1, flexShrink: 1, minWidth: 0, height: tall ? 44 : 40, background: C.track, borderRadius: 6 })}>
                <div style={flex({ width: `${Math.max(3, (val(b) / top) * 100)}%`, height: '100%', background: i === 0 ? C.red : C.green, borderRadius: 6 })} />
              </div>
              <div style={head(tall ? 58 : 50, { width: tall ? 96 : 90, flexShrink: 0, justifyContent: 'flex-end', color: i === 0 ? C.red : C.green })}>{byShare ? `${val(b)}%` : val(b)}</div>
            </div>
          ))}
        </div>
      </Frame>
    ),
  };
}

function RankingsCard({ size, params }) {
  const tall = size.height > 1200;
  const { order, bias } = weightingOf(params);
  const rows = rankAll(order, bias).slice(0, tall ? 6 : 5);
  return {
    link: '/',
    jsx: (
      <Frame size={size}>
        <div style={col({ gap: 6 })}>
          <div style={col()}>
            <div style={head(tall ? 124 : 88, { lineHeight: 0.95 })}>THE GREATEST</div>
            <div style={head(tall ? 124 : 88, { color: C.gold, lineHeight: 0.95 })}>TEST HUNDREDS</div>
          </div>
          <div style={flex({ fontSize: tall ? 26 : 24, color: C.muted })}>{`Ranked by Greatness score across ${TOTAL.toLocaleString()} Test centuries`}</div>
        </div>
        <div style={col({ gap: 12 })}>
          {rows.map((c, i) => (
            <div key={c.id} style={flex({ alignItems: 'center', gap: 20, padding: '8px 22px', borderRadius: 12, background: i === 0 ? 'rgba(238,90,62,0.10)' : C.panel, border: `2px solid ${i === 0 ? C.red : C.line}` })}>
              <div style={head(tall ? 56 : 52, { width: 52, color: i === 0 ? C.red : C.muted })}>{i + 1}</div>
              <div style={col({ flexGrow: 1, flexShrink: 1, minWidth: 0 })}>
                <div style={flex({ gap: 14 })}>
                  <div style={head(tall ? 56 : 50, { textTransform: 'uppercase' })}>{c.name}</div>
                  <div style={head(tall ? 56 : 50, { color: C.red })}>{runsText(c)}</div>
                </div>
                <div style={flex({ fontSize: tall ? 24 : 22, color: C.muted })}>{context(c)}</div>
              </div>
              <div style={head(tall ? 92 : 84, { color: C.gold })}>{c.toc.toFixed(1)}</div>
            </div>
          ))}
        </div>
        <WeightLine order={order} bias={bias} big={tall} />
      </Frame>
    ),
  };
}

function LawsCard({ size, params }) {
  const tall = size.height > 1200;
  const n = Number(params.law);
  const one = n >= 1 && n <= LAWS.length ? LAWS[n - 1] : null;
  if (one) {
    const len = one[0].length;
    const fs = Math.round((len <= 20 ? 200 : len <= 28 ? 170 : 140) * (tall ? 1.2 : 1));
    return {
      link: '/tons-of-consequence',
      jsx: (
        <Frame size={size} ghost={<div style={flex({ position: 'absolute', right: 20, top: 20, fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: tall ? 1300 : 1000, lineHeight: 0.85, color: 'rgba(242,199,68,0.12)' })}>{n}</div>}>
          <div style={flex()} />
          <div style={col({ gap: 24 })}>
            <div style={head(44, { letterSpacing: 8, color: C.gold })}>{`LAW ${n} OF ${LAWS.length}`}</div>
            <div style={head(fs, { textTransform: 'none', lineHeight: 0.93 })}>{up(one[0])}</div>
            <div style={flex({ fontSize: tall ? 42 : 38, lineHeight: 1.3, color: C.soft })}>{one[1]}</div>
          </div>
          <div style={flex()} />
        </Frame>
      ),
    };
  }
  return {
    link: '/tons-of-consequence',
    jsx: (
      <Frame size={size}>
        <div style={flex({ alignItems: 'flex-end', gap: 30 })}>
          <div style={head(tall ? 400 : 300, { color: C.gold, lineHeight: 0.78 })}>{LAWS.length}</div>
          <div style={col({ gap: 8, paddingBottom: 6, flexShrink: 1, minWidth: 0 })}>
            <div style={col()}>
              <div style={head(tall ? 92 : 76, { lineHeight: 0.95 })}>LAWS OF A TON</div>
              <div style={head(tall ? 92 : 76, { lineHeight: 0.95 })}>OF CONSEQUENCE</div>
            </div>
            <div style={flex({ fontSize: tall ? 25 : 22, color: C.muted })}>A hundred the side needed: it helped them win or avoid losing.</div>
          </div>
        </div>
        <div style={flex({ flexWrap: 'wrap', gap: tall ? 12 : 10 })}>
          {LAWS.map(([t], i) => (
            <div key={t} style={flex({ width: 470, alignItems: 'center', gap: 14, padding: tall ? '12px 16px' : '8px 16px', borderRadius: 10, background: C.panel, border: `2px solid ${C.line}` })}>
              <div style={head(tall ? 46 : 38, { width: 44, flexShrink: 0, color: C.gold })}>{i + 1}</div>
              <div style={head(tall ? 33 : 29, { fontWeight: 600, lineHeight: 1.05, flexShrink: 1, minWidth: 0 })}>{up(t)}</div>
            </div>
          ))}
          <div style={flex({ width: 470, alignItems: 'center', padding: tall ? '12px 16px' : '8px 16px', borderRadius: 10, background: C.gold, color: '#0b1c13' })}>
            <div style={head(tall ? 34 : 30)}>{up('Read them all at the site')}</div>
          </div>
        </div>
      </Frame>
    ),
  };
}

const TYPES = { batter: BatterCard, innings: InningsCard, compare: CompareCard, board: BoardCard, rankings: RankingsCard, laws: LawsCard };
export const CARD_TYPES = Object.keys(TYPES);

/**
 * { jsx, link, size } or null when the card cannot be made (unknown type or batter).
 * Cards are square or 4:5 portrait (4:5 when unspecified). The wide size exists only for the batter link preview
 * (a batter card with no size is that preview); any other card asked for wide comes back 4:5.
 */
export function buildCard(type, params = {}) {
  const make = TYPES[type];
  if (!make) return null;
  const wideOk = type === 'batter' && (params.size === 'wide' || !params.size);
  const asked = wideOk ? WIDE : SIZES[params.size] || SIZES.portrait;
  const out = make({ size: asked, params });
  return out ? { ...out, size: asked } : null;
}
export { BATTERS };
