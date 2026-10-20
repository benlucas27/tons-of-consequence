'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';

const SORTS = {
  tons: { label: 'Most ToCs', needsMin: false },
  share: { label: 'Highest ToC share', needsMin: true },
  peak: { label: 'Best single innings', needsMin: false },
  wins: { label: 'Team win rate', needsMin: true },
};
const pct = (a, b) => (b ? Math.round((100 * a) / b) : null);

/** The ToCs leaderboard: every batter, searchable, with four sorts. */
export default function TocBoard({ rows }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('tons');
  const [min, setMin] = useState(8);
  const [all, setAll] = useState(false);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const floor = SORTS[sort].needsMin ? min : 0;
    const ok = rows.filter((r) => r.hundreds > 0 && (!needle || r.name.toLowerCase().includes(needle))
      && (sort === 'wins' ? r.resultsKnown >= floor : sort === 'share' ? r.measured >= floor : true)
      && (sort !== 'tons' || r.measured > 0 || needle));
    const key = {
      tons: (r) => [r.tons, r.measured ? r.tons / r.measured : 0],
      share: (r) => [r.measured ? r.tons / r.measured : 0, r.tons],
      peak: (r) => [r.peak ? r.peak.score : 0, r.tons],
      wins: (r) => [r.resultsKnown ? r.wins / r.resultsKnown : 0, r.resultsKnown],
    }[sort];
    return ok.sort((a, b) => { const x = key(a), y = key(b); return y[0] - x[0] || y[1] - x[1] || a.name.localeCompare(b.name); });
  }, [rows, q, sort, min]);

  const searching = q.trim().length > 0;
  const shown = searching || all ? list : list.slice(0, 40);

  return (
    <div className="toc-boardwrap">
      <div className="toc-controls">
        <label>Find a batter <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kohli, Gilchrist..." /></label>
        <label>Sort by <select value={sort} onChange={(e) => setSort(e.target.value)}>{Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></label>
        {SORTS[sort].needsMin && (
          <label>At least <select value={min} onChange={(e) => setMin(Number(e.target.value))}>{[1, 5, 8, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}</select> {sort === 'wins' ? 'hundreds with a known result' : 'measured hundreds'}</label>
        )}
      </div>
      <p className="conn-note">{list.length.toLocaleString()} {list.length === 1 ? 'batter' : 'batters'}. Team win rate counts matches won out of hundreds with a known result. Best innings is the Greatness score on the Default weighting.</p>
      <table className="toc-board">
        <thead><tr><th>Batter</th><th>ToCs</th><th>Measured</th><th>Share</th><th>Best innings</th><th>Team won</th></tr></thead>
        <tbody>
          {shown.map((b) => (
            <tr key={b.slug}>
              <td><Link href={`/tons-of-consequence/${b.slug}`}>{b.name}</Link></td>
              <td><b>{b.tons}</b></td>
              <td>{b.measured}{b.measured < b.hundreds ? ` of ${b.hundreds}` : ''}</td>
              <td>{b.measured ? `${pct(b.tons, b.measured)}%` : '-'}</td>
              <td>{b.peak ? `${b.peak.score.toFixed(1)} (${b.peak.runs}${b.peak.notOut ? '*' : ''} v ${b.peak.opponent}, ${b.peak.year})` : '-'}</td>
              <td>{b.resultsKnown ? `${pct(b.wins, b.resultsKnown)}% (${b.wins} of ${b.resultsKnown})` : '-'}</td>
            </tr>
          ))}
          {!shown.length && <tr><td colSpan={6}>No batter found.</td></tr>}
        </tbody>
      </table>
      {!searching && list.length > 40 && (
        <button type="button" className="toc-more" onClick={() => setAll(!all)}>{all ? 'Show the top 40' : `Show all ${list.length.toLocaleString()}`}</button>
      )}
    </div>
  );
}
