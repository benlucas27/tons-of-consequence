'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { compareCareers } from '@/lib/careerCompare';
import { inningsPath } from '@/lib/dataset';
import { fmt1, ord, runsText } from '@/lib/format';

function Table({ title, caption, rows, players }) {
  return (
    <section className="ctable-block" aria-label={title}>
      <h3 className="sec-t"><span>{title}</span>{caption && <span>{caption}</span>}</h3>
      <div className="ctable-wrap" role="region" aria-label={`${title}, scrolls sideways on a small screen`} tabIndex={0}>
        <table className="ctable">
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Measure</span></th>
              {players.map((p) => <th key={p.name} scope="col"><span className="pn">{p.name}</span><small>{p.countryName}</small></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.label}{r.note && <small>{r.note}</small>}</th>
                {r.display.map((d, i) => (
                  <td key={players[i].name} className={r.leaders.includes(i) ? 'lead' : ''}>
                    {d}{r.leaders.includes(i) && <span className="sr-only"> (leads)</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** A whole-career comparison for a preset set of players (see src/data/compare-sets.js). */
export default function CareerCompare({ set, order, bias }) {
  const r = useMemo(() => compareCareers(set, order, bias), [set, order, bias]);
  const lastName = (n) => n.split(' ').slice(-1)[0];
  return (
    <section className="career-view" aria-label={set.name}>
      <div className="cmp-verdict">
        <div className="s-label"><span>{set.name}: the verdict</span></div>
        {r.summary.map((s) => <p key={s}>{s}</p>)}
        <ul className="cmp-presets" aria-label="Measures led, out of all measures">
          {r.leads.map((l) => <li key={l.name}><b>{lastName(l.name)}</b><span>leads {l.count} of {r.measures}</span></li>)}
        </ul>
      </div>

      <Table title="By the numbers" caption="Every innings, whole career" rows={r.numbers} players={r.players} />
      <Table title="By the ranking" caption="Their hundreds, on your weighting" rows={r.ranking} players={r.players} />

      <section className="best-of" aria-label="Best innings">
        <h3 className="sec-t"><span>Their best innings</span><span>On your weighting</span></h3>
        <div className="best-grid" style={{ '--n': r.players.length }}>
          {r.players.map((p) => (
            <article key={p.name} className="best-card">
              <h4>{p.name}</h4>
              <ol>
                {p.innings.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <Link href={inningsPath(c, order, bias)}>
                      <span className="b-runs">{runsText(c)}</span>
                      <span className="b-what">v {c.opponent}, {c.year}<small>{c.venue} · {ord(c.rank)} overall</small></span>
                      <span className="b-score">{fmt1(c.toc)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <p className="src">
        Career figures come from ball-by-ball records (Cricsheet) up to {r.asOf}. Each player&rsquo;s hundreds match the ranking&rsquo;s centuries exactly. The average is runs per dismissal, and a retired-hurt batter counts as not out.
        Where a player is lit gold, they lead on that measure.
      </p>
    </section>
  );
}
