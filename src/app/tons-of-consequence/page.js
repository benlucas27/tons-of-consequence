import Link from 'next/link';
import { LEADERS, MEASURED_TOTAL, TONS_TOTAL } from '@/lib/consequence';
import { TOTAL } from '@/lib/dataset';

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
    </article>
  );
}
