import Link from 'next/link';
import { FEATURED, inningsPath } from '@/lib/dataset';
import { tierOf, NATIONS } from '@/lib/scoring';
import { fmt1, ord } from '@/lib/format';

/** A headline card for the newest century. Which innings it shows is set in the data (featured: true). */
export default function Spotlight({ ranked, order }) {
  if (!FEATURED) return null;
  const f = ranked.find((x) => x.id === FEATURED.id);
  if (!f) return null;
  const tier = tierOf(f.toc);
  const sinceYear = 2020;
  const recent = f.year >= sinceYear ? ranked.filter((x) => x.year >= sinceYear) : null;
  const home = ranked.filter((x) => x.country === f.country);
  const C = 2 * Math.PI * 46;
  const sp = f.spotlight || {};
  return (
    <section className="spot" aria-label="Latest century">
      <div>
        <div className="kicker"><i aria-hidden="true" />{sp.kicker || 'Latest century'}</div>
        <h2>{f.name} <b>{f.runs}{f.notOut ? '*' : ''}</b></h2>
        {sp.blurb && <p>{sp.blurb}</p>}
      </div>
      <div className="spot-side">
        <div className="gauge" role="img" aria-label={`ToC score ${fmt1(f.toc)}`}>
          <svg viewBox="0 0 112 112" aria-hidden="true">
            <circle cx="56" cy="56" r="46" fill="none" stroke="var(--line)" strokeWidth="8" />
            <circle cx="56" cy="56" r="46" fill="none" stroke="var(--ball)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${((f.toc / 100) * C).toFixed(1)} ${C.toFixed(1)}`} />
          </svg>
          <div>{fmt1(f.toc)}</div>
        </div>
        <ul>
          <li><span className={`tier t-${tier.key}`} style={{ display: 'inline' }}>{tier.label}</span></li>
          <li><b>{ord(f.rank)}</b> of {ranked.length.toLocaleString()}</li>
          {recent && <li><b>{ord(recent.findIndex((x) => x.id === f.id) + 1)}</b> since {sinceYear}</li>}
          <li><b>{ord(home.findIndex((x) => x.id === f.id) + 1)}</b> of {home.length.toLocaleString()} for {NATIONS[f.country] || f.country}</li>
        </ul>
      </div>
      <Link className="btn primary" href={inningsPath(f, order)}>Open the innings →</Link>
    </section>
  );
}
