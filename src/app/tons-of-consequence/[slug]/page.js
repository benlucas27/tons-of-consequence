import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BATTER_BY_SLUG, verdictOf, wherePlayed } from '@/lib/consequence';
import { TIERS, WHERE_LABEL } from '@/lib/matchFacts';
import { inningsPath } from '@/lib/dataset';
import { runsText, RESULT_LABEL } from '@/lib/format';

export function generateMetadata({ params }) {
  const b = BATTER_BY_SLUG.get(params.slug);
  if (!b) return { title: 'Batter not found' };
  return {
    title: `${b.name}: tons of consequence`,
    description: `${b.name} has ${b.hundreds} Test hundreds. ${b.measured ? `Of the ${b.measured} we can measure, ${b.tons} were tons of consequence.` : 'We cannot measure them yet.'} Every one, and why.`,
  };
}

export default function BatterPage({ params }) {
  const b = BATTER_BY_SLUG.get(params.slug);
  if (!b) notFound();
  return (
    <article className="prose toc-page">
      <p className="conn-note"><Link href="/tons-of-consequence">&larr; Tons of Consequence</Link></p>
      <h1>{b.name}</h1>
      <p className="lede">{b.hundreds} Test hundreds. {b.measured ? <>Of the {b.measured} we can measure, <b>{b.tons}</b> were tons of consequence.</> : 'We cannot measure any of them yet.'}{b.measured < b.hundreds && b.measured > 0 ? ` The other ${b.hundreds - b.measured} are before the ball-by-ball record, so we do not have enough match data yet.` : ''}</p>
      <h2>Who against, and where</h2>
      <table className="toc-board toc-facts">
        <thead><tr><th></th><th>Hundreds</th>{b.measured > 0 && <th>Tons of consequence</th>}</tr></thead>
        <tbody>
          {TIERS.map((t) => (b.byTier[t.n] ? <tr key={t.n}><td>{t.name} <small>({t.teams})</small></td><td>{b.byTier[t.n]}</td>{b.measured > 0 && <td>{b.tonsByTier[t.n] || 0}</td>}</tr> : null))}
          {Object.keys(b.byWhere).length > 0 && ['H', 'A', 'N'].map((w) => (b.byWhere[w] ? <tr key={w}><td>{WHERE_LABEL[w]}</td><td>{b.byWhere[w]}</td><td>{b.tonsByWhere[w] || 0}</td></tr> : null))}
        </tbody>
      </table>
      <p className="conn-note">The tiers are a fixed grouping of countries, not a rating on the day. Where it was played is only known for the hundreds we have the match record for.</p>

      <h2>Every hundred</h2>
      <ol className="toc-list">
        {b.innings.map((c) => {
          const v = verdictOf(c.id);
          return (
            <li key={c.id} className={v ? (v.passes ? 'toc-yes' : 'toc-no') : 'toc-none'}>
              <h3><Link href={inningsPath(c)}>{runsText(c)}</Link> <small>v {c.opponent}, {c.venue}, {c.year}{wherePlayed(c.id) ? ` · ${WHERE_LABEL[wherePlayed(c.id)]}` : ''}{c.matchResult && c.matchResult !== 'unknown' ? ` · ${RESULT_LABEL[c.matchResult] || ''}` : ''}</small></h3>
              {v ? (
                <p><b>{v.passes ? `A ton of consequence: ${v.scenario.toLowerCase()}.` : 'A good ton.'}</b> {v.because}</p>
              ) : (
                <p className="toc-na">Not enough match data yet to say.</p>
              )}
            </li>
          );
        })}
      </ol>
    </article>
  );
}
