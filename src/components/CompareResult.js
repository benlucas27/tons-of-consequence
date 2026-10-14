import Link from 'next/link';
import { LEVERS, RANK_WEIGHTS, tierOf } from '@/lib/scoring';
import { compareInnings } from '@/lib/ask';
import { inningsPath } from '@/lib/dataset';
import { fmt1, context, runsText } from '@/lib/format';
import { ResultTag } from './RankRow';

function Card({ c, order, levers }) {
  const tier = tierOf(c.toc);
  return (
    <article className="cmp-card">
      <div>
        <h3><Link href={inningsPath(c, order)}>{c.name}</Link></h3>
        <div className="ctx">{context(c)} <ResultTag res={c.matchResult} /></div>
      </div>
      <div className="big">
        <span className="r">{runsText(c)}</span>
        <span className="score"><span className="num">{fmt1(c.toc)}</span><span className={`tier t-${tier.key}`}>{tier.label}</span></span>
      </div>
      {levers && (
        <div className="lev">
          {order.map((k) => {
            const l = LEVERS.find((x) => x.key === k);
            const val = c.levers[k] || 0;
            return (
              <div key={k} className="lrow" style={{ '--c': l.color }}>
                <div className="lhead"><span className="sw" aria-hidden="true" />{l.name}<b>{val}</b></div>
                <div className="track"><span style={{ width: `${val}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}
      <Link className="link-btn" href={inningsPath(c, order)}>Read the full story →</Link>
    </article>
  );
}

/** Side by side, criterion by criterion, in the reader's order. The higher value is lit. */
function Tape({ a, b, order }) {
  return (
    <section className="tape" aria-label="Criterion by criterion">
      <div className="tape-row tape-head">
        <span className="tape-name l">{a.name} {runsText(a)}</span>
        <span />
        <span className="tape-name">{b.name} {runsText(b)}</span>
      </div>
      {order.map((k, i) => {
        const l = LEVERS.find((x) => x.key === k);
        const va = a.levers[k] || 0;
        const vb = b.levers[k] || 0;
        return (
          <div key={k} className="tape-row" style={{ '--c': l.color }}>
            <div className={`tape-side l${va > vb ? ' win' : ''}`}>
              <span className="tape-v">{va}</span>
              <span className="tape-bar"><span style={{ width: `${va}%` }} /></span>
            </div>
            <div className="tape-mid"><i aria-hidden="true" />{l.short}<small>{RANK_WEIGHTS[i]}%</small></div>
            <div className={`tape-side${vb > va ? ' win' : ''}`}>
              <span className="tape-v">{vb}</span>
              <span className="tape-bar"><span style={{ width: `${vb}%` }} /></span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** The verdict and the evidence for two or three innings. `items` need `toc` under `order`. */
export default function CompareResult({ items, order }) {
  const sorted = [...items].sort((x, y) => y.toc - x.toc);
  const cmp = compareInnings(sorted[0], sorted[1], order);
  const third = sorted[2];
  const two = sorted.length === 2;
  const winnerIsFirst = cmp.winner.id === cmp.a.id;
  const lastName = (c) => c.name.split(' ').slice(-1)[0];
  return (
    <div className="cmp">
      <section className="cmp-verdict" aria-label="Verdict">
        <div className="s-label"><span>The verdict</span></div>
        <p>
          {cmp.verdict}
          {third ? ` ${third.name}'s ${runsText(third)} placed third, ${fmt1(sorted[0].toc - third.toc)} points off the top.` : ''}
        </p>
        <p className="cmp-robust">{cmp.robustness}</p>
        <ul className="cmp-presets" aria-label="Verdict under each preset">
          {cmp.presets.map((p) => {
            const aheadIsA = p.aWins;
            const who = aheadIsA ? cmp.a : cmp.b;
            const flipped = aheadIsA !== winnerIsFirst && p.margin >= 0.1;
            return (
              <li key={p.name} className={flipped ? 'flip' : ''}>
                <b>{p.name}</b>
                <span>{p.margin < 0.1 ? 'Level' : `${lastName(who)} +${fmt1(p.margin)}`}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <div className="cmp-grid" style={{ '--n': sorted.length }}>
        {sorted.map((c) => <Card key={c.id} c={c} order={order} levers={!two} />)}
      </div>
      {two && <Tape a={sorted[0]} b={sorted[1]} order={order} />}
    </div>
  );
}
