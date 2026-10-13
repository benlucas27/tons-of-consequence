import Link from 'next/link';
import { tierOf, LEVERS } from '@/lib/scoring';
import { inningsPath } from '@/lib/dataset';
import { context, runsText, fmt1 } from '@/lib/format';

export function ResultTag({ res }) {
  if (res === 'live') return <span className="live">In progress</span>;
  if (res === 'win' || res === 'draw' || res === 'loss') {
    return <span className={`result ${res}`}>{{ win: 'Won', draw: 'Drawn', loss: 'Lost' }[res]}</span>;
  }
  return null;
}

export default function RankRow({ c, position, order, picked, onPick, pickDisabled, note }) {
  const tier = tierOf(c.toc);
  return (
    <li className={`row${picked ? ' picked' : ''}`}>
      <span className={`rank${position === 1 ? ' one' : ''}`}>{position}</span>
      <div className="row-main">
        <div className="row-name">
          <Link className="row-link" href={inningsPath(c, order)}>{c.name}</Link>
          <span className="runs">{runsText(c)}</span>
          <span className="cc">{c.country}</span>
          <ResultTag res={c.matchResult} />
        </div>
        <div className="ctx">{context(c)}{note ? ` \u00B7 ${note}` : ''}</div>
        {c.tags && c.tags.length > 0 && <div className="tags">{c.tags.slice(0, 2).map((t) => <span key={t}>{t}</span>)}</div>}
      </div>
      <div className="bars" aria-hidden="true">
        {LEVERS.map((l) => (
          <i key={l.key} style={{ height: `${Math.max(8, c.levers[l.key] || 0)}%`, '--c': l.color }} title={`${l.name} ${c.levers[l.key]}`} />
        ))}
      </div>
      <div className="score">
        <span className="num">{fmt1(c.toc)}</span>
        <span className={`tier t-${tier.key}`}>{tier.label}</span>
      </div>
      <label className="pick">
        <input type="checkbox" checked={picked} disabled={pickDisabled && !picked} onChange={() => onPick(c.id)} aria-label={`Compare ${c.name}, ${runsText(c)} against ${c.opponent}`} />
      </label>
    </li>
  );
}
