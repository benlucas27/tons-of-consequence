'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { WOMENS, WOMENS_TEAMS, WOMENS_TONS, RESULT_WORD, hundredText, matchesWomens } from '@/lib/womens';

function Chip({ on, onClick, children }) {
  return <button type="button" className="chip" aria-pressed={on} onClick={onClick}>{children}</button>;
}

/** The women's hundreds in the rankings page: ordered by whether they were tons of consequence (there are no six-criteria scores for them). */
export default function WomensRankings() {
  const [query, setQuery] = useState('');
  const [team, setTeam] = useState('');
  const [tonsOnly, setTonsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('toc');
  const list = useMemo(() => {
    const out = WOMENS.filter((h) => (!team || h.team === team) && (!tonsOnly || h.ton) && matchesWomens(h, query));
    if (sortBy === 'runs') return [...out].sort((a, b) => b.score - a.score);
    if (sortBy === 'year') return [...out].sort((a, b) => b.year - a.year || b.score - a.score);
    return [...out].sort((a, b) => Number(b.ton) - Number(a.ton) || b.score - a.score);
  }, [query, team, tonsOnly, sortBy]);
  return (
    <div className="page-pad">
      <p className="conn-note">Women&rsquo;s hundreds do not have the six criteria scores the men&rsquo;s rankings use, so they are ordered by whether they were tons of consequence ({WOMENS_TONS.length} of {WOMENS.length}), then by runs. <Link href="/womens-tests">The full page, with the batters leaderboard</Link>.</p>
      <div className="tools">
        <label className="search">
          <span className="sr-only">Search women&rsquo;s hundreds</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search batter, team, ground or year" autoComplete="off" />
        </label>
        <div className="toolbar">
          <div className="toolbar-r">
            <Chip on={tonsOnly} onClick={() => setTonsOnly(!tonsOnly)}>Tons of consequence only</Chip>
            <label>
              <span className="sr-only">Sort by</span>
              <select className="sel" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="toc">Sort: Tons of consequence first</option>
                <option value="runs">Sort: Runs scored</option>
                <option value="year">Sort: Most recent</option>
              </select>
            </label>
          </div>
        </div>
        <div className="filters open">
          <div className="fl">
            <span>Team</span>
            <div className="chips wrapdesk" role="group" aria-label="Team">
              <Chip on={!team} onClick={() => setTeam('')}>All teams</Chip>
              {WOMENS_TEAMS.map((t) => <Chip key={t} on={team === t} onClick={() => setTeam(team === t ? '' : t)}>{t}</Chip>)}
            </div>
          </div>
        </div>
        <div className="count"><span>{list.length.toLocaleString()} hundreds{query || team || tonsOnly ? ' match' : ''}</span></div>
      </div>
      <ol className="toc-list">
        {list.map((h) => (
          <li key={h.no} className={h.ton ? 'toc-yes' : 'toc-no'}>
            <h3>{hundredText(h)} <small>{h.team} &middot; {RESULT_WORD[h.result]}</small></h3>
            <p><b>{h.ton ? 'A ton of consequence.' : 'A good ton.'}</b>{h.historic ? <> <b>Historic:</b> {h.historic}</> : null} {h.reason}</p>
          </li>
        ))}
      </ol>
      {list.length === 0 && <p className="toc-na">No hundreds match. Try a different search.</p>}
    </div>
  );
}
