import { DON, WIN_RATES } from '@/data/the-don';

export const metadata = {
  title: 'The Don',
  description: 'All 29 of Don Bradman’s Test hundreds, scorecard by scorecard: what happened, which were tons of consequence, and why. Each with its sources.',
};

const STATUS = { yes: 'A ton of consequence', no: 'A good ton', review: 'Under review' };
const stakes = { dead: 'a dead rubber', decider: 'the decider', 'on the line': 'the last match', live: 'a live series', single: 'a one-off Test' };
const pct = (n, of) => Math.round((100 * n) / of);

export default function TheDon() {
  const yes = DON.filter((d) => d.status === 'yes').length;
  const dead = DON.filter((d) => d.stakes === 'dead').length;
  const won = DON.filter((d) => d.result === 'win').length;
  return (
    <article className="prose don-page">
      <h1>The Don</h1>
      <p className="lede">Don Bradman made 29 Test hundreds. This page puts every one of them on the table: the scorecard, what was riding on it, whether it was a ton of consequence, and where to read more.</p>

      <div className="don-stats">
        <div><b>{won} of 29</b><span>matches won when he made a hundred ({pct(won, 29)}%)</span></div>
        <div><b>{yes} of 29</b><span>were tons of consequence</span></div>
        <div><b>{dead}</b><span>came in dead rubbers, which don&rsquo;t count</span></div>
      </div>

      <h2>Team win rate when the batter scored a hundred</h2>
      <table className="don-rates">
        <thead><tr><th>Batter</th><th>Hundreds</th><th>Won</th><th>Drawn</th><th>Lost</th><th>Won %</th></tr></thead>
        <tbody>
          {WIN_RATES.map((r) => (
            <tr key={r.name}><td>{r.name}</td><td>{r.hundreds}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td><td><b>{pct(r.won, r.hundreds)}%</b></td></tr>
          ))}
        </tbody>
      </table>
      <p className="conn-note">Bradman&rsquo;s figures are from the scorecards on this page; the others are from ball-by-ball data for every hundred in the Cricsheet archive. Independent and unofficial. Notes are written only from the linked scorecards and pages;</p>

      <h2>All 29, in order</h2>
      <ol className="don-list">
        {DON.map((d) => (
          <li key={d.id} id={`h${d.id}`} className={`don-card don-${d.status}`}>
            <h3>{d.runs}{d.notOut ? '*' : ''} <small>v {d.opponent}, {d.venue}, {d.year}</small></h3>
            <p className="don-meta">{d.resultText} &middot; {stakes[d.stakes]}, series {d.seriesBefore} going in (Australia first) &middot; in at {d.entry}, {d.share}% of {d.teamTotal}</p>
            <p className={`don-verdict don-v-${d.status}`}><b>{STATUS[d.status]}{d.scenario ? `: ${d.scenario.toLowerCase()}` : ''}.</b> {d.reason}</p>
            <p className="don-story">{d.story}</p>
            <table className="don-card-tab">
              <tbody>
                {d.card.map((c, i) => (
                  <tr key={i} className={c.mine ? 'mine' : ''}>
                    <td>{c.team} {c.total}{c.wkts && c.wkts < 10 ? `/${c.wkts}` : ''}{c.dec ? ' dec' : ''}{c.target ? ` (target ${c.target})` : ''}</td>
                    <td>{c.top.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="don-src">Sources: {d.sources.map((s, i) => (<span key={s.url}>{i ? ' · ' : ''}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>))}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
