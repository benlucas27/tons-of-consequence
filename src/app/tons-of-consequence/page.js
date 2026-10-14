import Link from 'next/link';
import { LEADERS, MEASURED_TOTAL, TONS_TOTAL } from '@/lib/consequence';
import { TOTAL } from '@/lib/dataset';
import { TIERS } from '@/lib/matchFacts';

export const metadata = {
  title: 'Tons of Consequence',
  description: 'A great ton is not always a ton of consequence. A ton of consequence changed the match: it won it, saved it, or rescued it.',
};

const MIN_MEASURED = 8;

export default function TonsOfConsequence() {
  const board = LEADERS.filter((b) => b.measured >= MIN_MEASURED).slice(0, 40);
  return (
    <article className="prose toc-page">
      <h1>Tons of Consequence</h1>
      <p className="lede">A great ton is not always a ton of consequence. A ton of consequence is one that changed the match: it won it, saved it, or rescued it.</p>
      <p>It is judged on the circumstances of the match, not on how many runs were scored or how it looked.</p>
      <ol className="toc-q">
        <li><b>Did the team win or save the match?</b></li>
        <li><b>Was the match still alive when he came in?</b> Not a dead rubber, with the series already decided, and not a match the team had already won.</li>
        <li><b>Did the hundred change it?</b></li>
      </ol>
      <p>Anything else is a good ton. That is not an insult: a good ton can be a great innings, but it is not a ton of consequence.</p>

      <h2>How much can we measure?</h2>
      <p>The test needs the match record, which is close to complete from about 2006. We can measure {MEASURED_TOTAL.toLocaleString()} of the {TOTAL.toLocaleString()} hundreds in the database, and {TONS_TOTAL.toLocaleString()} of them are tons of consequence. Don Bradman&rsquo;s 29 are measured by hand, on <Link href="/the-don">The Don</Link>. Older innings will follow as their scorecards are collected.</p>

      <h2>The batters with the most</h2>
      <p className="conn-note">Tap a name to see every hundred and why it was, or wasn&rsquo;t.</p>
      <table className="toc-board">
        <thead><tr><th>Batter</th><th>Tons of consequence</th><th>Measured</th><th>Share</th></tr></thead>
        <tbody>
          {board.map((b) => (
            <tr key={b.slug}>
              <td><Link href={`/tons-of-consequence/${b.slug}`}>{b.name}</Link></td>
              <td><b>{b.tons}</b></td>
              <td>{b.measured}{b.measured < b.hundreds ? ` of ${b.hundreds}` : ''}</td>
              <td>{Math.round((100 * b.tons) / b.measured)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Who against, and where</h2>
      <p>Two plain facts sit alongside every innings, outside the test: the opposition, grouped into fixed tiers, and whether it was at home, away or on neutral ground.</p>
      <ul>
        {TIERS.map((t) => <li key={t.n}><b>{t.name}:</b> {t.teams}</li>)}
      </ul>
    </article>
  );
}
