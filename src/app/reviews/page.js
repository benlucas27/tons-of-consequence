import Link from 'next/link';
import { challengeCounts, buildReviewLists } from '@/lib/reviewList';
import { SHORT_REASON } from '@/lib/challenges';
import { inningsPath } from '@/lib/dataset';
import { runsText } from '@/lib/format';
import ReviewPicker from '@/components/ReviewPicker';

export const revalidate = 60;
export const metadata = {
  title: 'Review',
  description: 'The Test hundreds readers have challenged, most challenged first, and what was decided.',
};

const OUTCOME = { stands: 'Stands', changed: 'Changed', 'no-call': 'No call' };

function Reasons({ reasons }) {
  const chips = Object.entries(reasons).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  return chips.length ? <span className="review-chips">{chips.map(([k, n]) => <span key={k} className="review-chip">{SHORT_REASON[k]} {n}</span>)}</span> : null;
}

export default async function Reviews() {
  let counts = null;
  try { counts = await challengeCounts(); } catch { counts = null; }
  const { under, decided, totalChallenges } = buildReviewLists(counts);
  return (
    <article className="prose toc-page">
      <h1>Review</h1>
      <p className="lede">Hundreds where readers have challenged the call, most challenged first. A challenge asks us to look at the facts again. Only a ruling changes a verdict.</p>
      <ReviewPicker />
      <h2>Under review</h2>
      <p className="review-counter"><b>{under.length}</b> {under.length === 1 ? 'innings' : 'innings'} under review · <b>{totalChallenges}</b> {totalChallenges === 1 ? 'challenge' : 'challenges'} so far</p>
      {counts === null && <p className="conn-note">The review list is not available right now. Try again soon.</p>}
      {counts !== null && under.length === 0 && <p>Nothing is under review yet. Open any innings and press <b>Challenge this ruling</b> to add one.</p>}
      {under.length > 0 && (
        <table className="toc-board review-table">
          <thead><tr><th>Innings</th><th>Verdict today</th><th>Challenges</th><th>Why it is under review</th></tr></thead>
          <tbody>
            {under.map((r) => (
              <tr key={r.id}>
                <td><Link href={inningsPath(r.innings)}>{r.innings.name} {runsText(r.innings)}</Link> <small>v {r.innings.opponent}, {r.innings.venue}, {r.innings.year}</small></td>
                <td>{r.verdict}</td>
                <td><b>{r.count}</b></td>
                <td><Reasons reasons={r.reasons} /> <small className="review-evidence">{r.evidence}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {decided.length > 0 && (
        <>
          <h2>Decided</h2>
          <ul className="review-decided">
            {decided.map((r) => (
              <li key={r.id}><Link href={inningsPath(r.innings)}>{r.innings.name} {runsText(r.innings)}</Link> <small>v {r.innings.opponent}, {r.innings.year}</small> — <b>{OUTCOME[r.outcome] || 'Stands'}</b>{r.decided ? ` (${r.decided})` : ''}{r.note ? `. ${r.note}` : ''}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
