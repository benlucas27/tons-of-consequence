'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useWeighting } from '@/lib/useWeighting';
import { rankAll, applyFilters, movementOf, COUNTRIES, ERAS, SCORE_BANDS } from '@/lib/dataset';
import { calcVolatility } from '@/lib/volatility';
import { NATIONS, DEFAULT_ORDER, sameOrder } from '@/lib/scoring';
import { PERSONA_BY_ID } from '@/lib/quiz';
import { copyText, toast } from '@/lib/clientUtils';
import WeightPanel from './WeightPanel';
import Door from './Door';
import Spotlight from './Spotlight';
import RankRow from './RankRow';
import CompareView from './CompareView';
import WomensRankings from './WomensRankings';

const PAGE = 50;

function Chip({ on, onClick, children }) {
  return <button type="button" className="chip" aria-pressed={on} onClick={onClick}>{children}</button>;
}

export default function Rankings() {
  const params = useSearchParams();
  const { order, bias, explicit, setOrder } = useWeighting();
  const isDefault = sameOrder(order, DEFAULT_ORDER) && !bias;
  const [door, setDoor] = useState(!explicit);
  const viewOf = (p) => (p.get('view') === 'divisive' ? 'divisive' : p.get('view') === 'womens' ? 'womens' : 'rankings');
  const [view, setView] = useState(viewOf(params));
  const [country, setCountry] = useState('');
  const [era, setEra] = useState('');
  const [band, setBand] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('toc');
  const [visible, setVisible] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [picks, setPicks] = useState([]);
  const [comparing, setComparing] = useState(false);
  const searchRef = useRef(null);
  const persona = params.get('from') === 'quiz' ? PERSONA_BY_ID[params.get('p')] : null;

  useEffect(() => { setView(viewOf(params)); }, [params]);
  useEffect(() => {
    document.body.dataset.door = door ? '1' : '';
    return () => { delete document.body.dataset.door; };
  }, [door]);
  useEffect(() => { setVisible(PAGE); }, [country, era, band, query, sortBy, view, order]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ranked = useMemo(() => rankAll(order, bias), [order, bias]);
  const filtered = useMemo(() => applyFilters(ranked, { country, era, band, query }), [ranked, country, era, band, query]);
  const divisive = useMemo(() => {
    if (view !== 'divisive') return null;
    return filtered.map((c) => ({ c, v: calcVolatility(c) })).sort((a, b) => b.v.volatility - a.v.volatility || b.c.toc - a.c.toc);
  }, [view, filtered]);
  const list = useMemo(() => {
    if (divisive) return divisive.map((x) => x.c);
    if (sortBy === 'runs') return [...filtered].sort((a, b) => b.runs - a.runs || b.toc - a.toc);
    if (sortBy === 'year') return [...filtered].sort((a, b) => b.year - a.year || b.toc - a.toc);
    return filtered;
  }, [divisive, filtered, sortBy]);
  const divById = useMemo(() => (divisive ? new Map(divisive.map((x) => [x.c.id, x.v])) : null), [divisive]);

  const activeFilters = [country, era, band, query.trim()].filter(Boolean).length;
  const clearFilters = () => { setCountry(''); setEra(''); setBand(''); setQuery(''); };
  const togglePick = (id) => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));
  const pickedItems = picks.map((id) => ranked.find((c) => c.id === id)).filter(Boolean);

  function changeView(next) {
    setView(next);
    const url = new URL(window.location.href);
    if (next !== 'rankings') url.searchParams.set('view', next); else url.searchParams.delete('view');
    window.history.replaceState(null, '', url);
  }
  async function share() {
    const ok = await copyText(window.location.href);
    toast(ok ? 'Link copied. It carries your weighting.' : 'Copy the address from your browser bar.');
  }
  function downloadCsv() {
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = list.map((c, i) => [i + 1, q(c.name), c.country, c.runs, c.notOut ? '*' : '', q(c.opponent), q(c.venue), c.year, c.matchResult || '', c.toc].join(','));
    const blob = new Blob([['Rank,Player,Country,Runs,Not out,Opponent,Venue,Year,Result,Greatness score', ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.download = 'tons-of-consequence.csv';
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (door && view !== 'womens') {
    return <Door order={order} bias={bias} onChange={setOrder} onDone={() => { setOrder(order, bias); setDoor(false); window.scrollTo(0, 0); }} />;
  }

  if (comparing && pickedItems.length >= 2) {
    return <CompareView items={pickedItems} order={order} bias={bias} onBack={() => setComparing(false)} onClear={() => { setPicks([]); setComparing(false); }} />;
  }

  if (view === 'womens') {
    return (
      <>
        <div className="page-pad">
          <div className="toolbar">
            <div className="tabs" role="group" aria-label="View">
              <button type="button" aria-pressed={false} onClick={() => changeView('rankings')}>Rankings</button>
              <button type="button" aria-pressed={false} onClick={() => changeView('divisive')}>Most divisive</button>
              <button type="button" aria-pressed onClick={() => changeView('womens')}>Women&rsquo;s ToCs</button>
            </div>
          </div>
        </div>
        <WomensRankings />
      </>
    );
  }

  return (
    <>
      <div className="page-pad">
        {persona && (
          <div className="persona-note">
            <span>Weighted for <b>{persona.name}</b>, from your Pub Test.</span>
            <Link className="link-btn" href="/quiz">Retake it</Link>
          </div>
        )}
        <WeightPanel order={order} bias={bias} onChange={setOrder} />
        {view === 'rankings' && !activeFilters && <Spotlight ranked={ranked} order={order} bias={bias} />}

        <div className="tools">
          <label className="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <span className="sr-only">Search innings</span>
            <input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search player, team, venue or year" autoComplete="off" />
            {query && <button type="button" className="x" aria-label="Clear search" onClick={() => setQuery('')}>×</button>}
            <kbd>⌘K</kbd>
          </label>

          <div className="toolbar">
            <div className="tabs" role="group" aria-label="View">
              <button type="button" aria-pressed={view === 'rankings'} onClick={() => changeView('rankings')}>Rankings</button>
              <button type="button" aria-pressed={view === 'divisive'} onClick={() => changeView('divisive')}>Most divisive</button>
              <button type="button" aria-pressed={view === 'womens'} onClick={() => changeView('womens')}>Women&rsquo;s ToCs</button>
            </div>
            <div className="toolbar-r">
              <button type="button" className="chip filter-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>
                Filters{activeFilters ? ` (${activeFilters})` : ''}
              </button>
              {view === 'rankings' && (
                <label>
                  <span className="sr-only">Sort by</span>
                  <select className="sel" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="toc">Sort: Greatness score</option>
                    <option value="runs">Sort: Runs scored</option>
                    <option value="year">Sort: Most recent</option>
                  </select>
                </label>
              )}
              <button type="button" className="link-btn" onClick={share}>Share</button>
              <button type="button" className="link-btn" onClick={downloadCsv}>CSV</button>
            </div>
          </div>

          <div className={`filters${filtersOpen ? ' open' : ''}`}>
            <div className="fl">
              <span>Country</span>
              <div className="chips wrapdesk">
                <Chip on={!country} onClick={() => setCountry('')}>All</Chip>
                {COUNTRIES.map((c) => <Chip key={c} on={country === c} onClick={() => setCountry(country === c ? '' : c)}>{NATIONS[c] || c}</Chip>)}
              </div>
            </div>
            <div className="fl">
              <span>Era</span>
              <div className="chips wrapdesk">
                <Chip on={!era} onClick={() => setEra('')}>All eras</Chip>
                {ERAS.map((e) => <Chip key={e.value} on={era === e.value} onClick={() => setEra(era === e.value ? '' : e.value)}>{e.label}</Chip>)}
              </div>
            </div>
            <div className="fl">
              <span>Score</span>
              <div className="chips wrapdesk">
                <Chip on={!band} onClick={() => setBand('')}>Any score</Chip>
                {SCORE_BANDS.map((b) => <Chip key={b.value} on={band === b.value} onClick={() => setBand(band === b.value ? '' : b.value)}>{b.label}</Chip>)}
              </div>
            </div>
          </div>

          <div className="count">
            <span>{list.length.toLocaleString()} innings{activeFilters ? ' match' : ''}</span>
            <span>{view === 'divisive' ? 'Most divisive first' : sortBy === 'toc' ? 'Best first, on your weighting' : sortBy === 'runs' ? 'Most runs first' : 'Most recent first'}</span>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <h3>No innings found</h3>
          <p>Try a different search, or clear the filters.</p>
          <button type="button" className="btn" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <>
          <ol className="rows">
            {list.slice(0, visible).map((c, i) => (
              <RankRow
                key={c.id}
                c={c}
                position={i + 1}
                order={order}
                bias={bias}
                move={isDefault ? null : movementOf(c)}
                picked={picks.includes(c.id)}
                pickDisabled={picks.length >= 3}
                onPick={togglePick}
                note={divById ? `Swings ${divById.get(c.id).spread} points (${divById.get(c.id).min} to ${divById.get(c.id).max})` : null}
              />
            ))}
          </ol>
          <p className="bars-note">The six bars on each row are the six criteria, in the colours above.{!isDefault && ' ▲ and ▼ show how many places an innings has moved from where it sits on the Default weighting.'}</p>
          <div className="more">
            {visible < list.length && (
              <button type="button" className="btn" onClick={() => setVisible((v) => v + PAGE)}>Show {Math.min(PAGE, list.length - visible)} more</button>
            )}
            <span>Showing {Math.min(visible, list.length).toLocaleString()} of {list.length.toLocaleString()}</span>
          </div>
        </>
      )}

      {picks.length > 0 && (
        <div className="cmp-bar" role="region" aria-label="Compare">
          <b>{picks.length} of 3 selected</b>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" disabled={picks.length < 2} onClick={() => setComparing(true)}>Compare now</button>
            <button type="button" className="btn ghost" onClick={() => setPicks([])}>Clear</button>
          </div>
        </div>
      )}
    </>
  );
}
