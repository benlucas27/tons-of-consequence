import { LEVERS, tierOf, weightsFromOrder } from '@/lib/scoring';
import { writeVerdict } from '@/lib/volatility';
import { fmt1, context, runsText } from '@/lib/format';

export default function CompareView({ items, order, onBack, onClear }) {
  const w = weightsFromOrder(order);
  const sorted = [...items].sort((a, b) => b.toc - a.toc);
  const v = writeVerdict(sorted[0], sorted[1], w);
  const third = sorted[2];
  return (
    <div className="page-pad">
      <div className="cmp">
        <button type="button" className="back link-btn" onClick={onBack} style={{ justifySelf: 'start' }}>← Back to rankings</button>
        <section className="cmp-verdict" aria-label="Verdict">
          <div className="s-label"><span>The verdict</span></div>
          <p>
            {v.verdict}
            {third ? ` ${third.name}'s ${runsText(third)} placed third, ${fmt1(sorted[0].toc - third.toc)} points off the top.` : ''}
          </p>
        </section>
        <div className="cmp-grid" style={{ '--n': items.length }}>
          {sorted.map((c) => {
            const tier = tierOf(c.toc);
            return (
              <article key={c.id} className="cmp-card">
                <div>
                  <h3>{c.name}</h3>
                  <div className="ctx">{context(c)}</div>
                </div>
                <div className="big">
                  <span className="r">{runsText(c)}</span>
                  <span className="score"><span className="num">{fmt1(c.toc)}</span><span className={`tier t-${tier.key}`}>{tier.label}</span></span>
                </div>
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
              </article>
            );
          })}
        </div>
        <button type="button" className="btn" onClick={onClear} style={{ justifySelf: 'start' }}>Clear and return</button>
      </div>
    </div>
  );
}
