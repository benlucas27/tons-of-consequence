'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useWeighting } from '@/lib/useWeighting';
import { rankAll, inningsPath, rankingsPath, otherInningsBy } from '@/lib/dataset';
import { LEVER_BY_KEY, RANK_WEIGHTS, NATIONS, tierOf } from '@/lib/scoring';
import { calcVolatility, volatilityTier } from '@/lib/volatility';
import { copyText, toast } from '@/lib/clientUtils';
import { fmt1, ord, runsText, RESULT_LABEL } from '@/lib/format';
import { WeightBar, Legend } from './WeightPanel';
import { ResultTag } from './RankRow';
import VideoCard from './VideoCard';

export default function InningsView({ id }) {
  const { order } = useWeighting();
  const ranked = useMemo(() => rankAll(order), [order]);
  const c = useMemo(() => ranked.find((x) => x.id === id), [ranked, id]);
  const others = useMemo(() => otherInningsBy(c, order).slice(0, 6), [c, order]);
  if (!c) return null;

  const tier = tierOf(c.toc);
  const vol = calcVolatility(c);
  const vt = volatilityTier(vol.volatility);
  const recent = c.year >= 2020 ? ranked.filter((x) => x.year >= 2020) : null;
  const home = ranked.filter((x) => x.country === c.country);
  const sr = c.balls ? fmt1((c.runs / c.balls) * 100) : '—';
  const shown = `tons-of-consequence.vercel.app${inningsPath(c, order)}`;

  async function copy() {
    const ok = await copyText(`https://${shown}`);
    toast(ok ? 'Link copied. It carries your weighting.' : 'Copy the address from your browser bar.');
  }

  return (
    <>
      <article className="inn">
        <div className="back-wrap">
          <Link className="back" href={rankingsPath(order)}>← Back to rankings</Link>
        </div>

        <header className="hero-wrap hero">
          <div className="meta" style={{ margin: 0 }}>
            <span className="cc">{c.country}</span>
            <ResultTag res={c.matchResult} />
          </div>
          <h1>{c.name}</h1>
          <div className="rline">
            <span className="rr">{c.runs}{c.notOut ? <small>*</small> : null}</span>
            {c.balls ? <span className="rb">off {c.balls} balls</span> : null}
          </div>
          <div className="meta">
            <span>v {c.opponent}</span>
            {c.venue && <><span aria-hidden="true">·</span><span>{c.venue}</span></>}
            <span aria-hidden="true">·</span><span>{c.year}</span>
          </div>
          {c.tags && c.tags.length > 0 && <div className="tags">{c.tags.map((t) => <span key={t}>{t}</span>)}</div>}
        </header>

        <div className="inn-main">
          <div>
            {c.story ? <p className="quote">{c.story}</p> : <p className="quote muted">No written story for this innings yet.</p>}
            {c.sources && <p className="src">Sources: {c.sources}</p>}
          </div>

          <VideoCard id={c.id} name={c.name} />

          {c.facts && (
            <section>
              <h2 className="sec-t">Match notes</h2>
              <ul className="facts">{c.facts.map((f) => <li key={f}>{f}</li>)}</ul>
            </section>
          )}

          <section>
            <h2 className="sec-t"><span>How the score is built</span><span>score · points</span></h2>
            <div className="lev">
              {order.map((k, i) => {
                const l = LEVER_BY_KEY[k];
                const v = c.levers[k] || 0;
                return (
                  <div key={k} className="lrow" style={{ '--c': l.color }}>
                    <div className="lhead">
                      <span className="sw" aria-hidden="true" />{l.name}<i>{RANK_WEIGHTS[i]}% weight</i>
                      <b>+{fmt1((v * RANK_WEIGHTS[i]) / 100)}</b><u>{v}</u>
                    </div>
                    <div className="track"><span style={{ width: `${v}%` }} /></div>
                  </div>
                );
              })}
              <div className="ltotal"><span>ToC score on your weighting</span><b>{fmt1(c.toc)}</b></div>
            </div>
          </section>

          <section>
            <h2 className="sec-t">Your weighting</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <WeightBar order={order} />
              <Legend order={order} />
              <Link className="link-btn" href="/" style={{ justifySelf: 'start' }}>Change it on the rankings page</Link>
            </div>
          </section>

          <section>
            <h2 className="sec-t">How divisive is it?</h2>
            <p className="lev-note"><b style={{ color: 'var(--ink)' }}>{vt.label}, {vol.volatility}.</b> {vt.desc} Across five points of view it scores between {vol.min} and {vol.max}.</p>
          </section>

          {others.length > 0 && (
            <section>
              <h2 className="sec-t">More from {c.name}</h2>
              <div className="others">
                {others.map((o) => (
                  <Link key={o.id} href={inningsPath(o, order)}>
                    <span><span className="on">{runsText(o)} v {o.opponent}</span><br /><span className="od">{[o.venue, o.year].filter(Boolean).join(' · ')} · {ord(o.rank)} overall</span></span>
                    <span className="os">{fmt1(o.toc)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="inn-side">
          <div className="card">
            <div className="bigscore">
              <div className="n">{fmt1(c.toc)}</div>
              <div><span className={`tier t-${tier.key}`}>{tier.label}</span><small>ToC score</small></div>
            </div>
            <dl className="stats">
              <div><dt>Rank overall</dt><dd>{ord(c.rank)} of {ranked.length.toLocaleString()}</dd></div>
              {recent && <div><dt>Since 2020</dt><dd>{ord(recent.findIndex((x) => x.id === c.id) + 1)} of {recent.length.toLocaleString()}</dd></div>}
              <div><dt>{NATIONS[c.country] || c.country}</dt><dd>{ord(home.findIndex((x) => x.id === c.id) + 1)} of {home.length.toLocaleString()}</dd></div>
              <div><dt>Strike rate</dt><dd>{sr}</dd></div>
              <div><dt>Match</dt><dd>{RESULT_LABEL[c.matchResult] || '—'}</dd></div>
            </dl>
            <div className="linkbox">
              <button type="button" className="btn primary" onClick={copy}>Copy link to this innings</button>
              <code>{shown}</code>
              <p>Opens straight to this innings, with your weighting.</p>
            </div>
          </div>
        </aside>
      </article>
      <div className="dock">
        <Link className="btn" href={rankingsPath(order)}>Rankings</Link>
        <button type="button" className="btn primary" onClick={copy}>Copy link</button>
      </div>
    </>
  );
}
