import Link from 'next/link';
import { LEADERS, MEASURED_TOTAL, TONS_TOTAL } from '@/lib/consequence';
import { TOTAL } from '@/lib/dataset';

export const metadata = {
  title: 'Tons of Consequence',
  description: 'What is a ton of consequence? Not every hundred changes a match. The test, the scenarios, and the batters with the most.',
};

const MIN_MEASURED = 8;

export default function TonsOfConsequence() {
  const board = LEADERS.filter((b) => b.measured >= MIN_MEASURED).slice(0, 40);
  return (
    <article className="prose toc-page">
      <h1>Tons of Consequence</h1>
      <p className="lede">A great hundred is not always a hundred that mattered. A ton of consequence is one that changed the match: it won it, saved it, or rescued the innings when it was in trouble.</p>

      <h2>What is a ton of consequence?</h2>
      <p>It is judged on the circumstances of the match, not on how many runs were scored or how it looked. Three yes-or-no questions:</p>
      <ol className="toc-q">
        <li><b>Did the team win or save the match?</b> A win, a tie, or a draw when the team was behind or batting to survive. A hundred in a defeat is never a ton of consequence.</li>
        <li><b>Was the match still alive when he came in?</b> Not a dead rubber, where the series was already decided, and not a match the team already had won, with a lead of 200 or more.</li>
        <li><b>Did the hundred change it?</b> One of four things:</li>
      </ol>
      <ul className="toc-sc">
        <li><b>Chased it down:</b> a hundred in a winning fourth-innings chase.</li>
        <li><b>Saved the match:</b> a hundred in a draw that needed saving.</li>
        <li><b>Rescued the innings:</b> in at three down with the team under 100, or the other top batters were falling around him.</li>
        <li><b>Carried the innings:</b> two-fifths or more of the team&rsquo;s runs, after coming in early.</li>
      </ul>
      <p>Anything else is <b>a good ton</b>. That is not an insult: a good ton can be a great innings. It just was not the one the result depended on.</p>

      <h2>It is a test and a judgement</h2>
      <p>The questions are answered from the scorecard, so anyone can check them. But the lines are not definitive: a hundred that comes in at 3 for 106 is close enough to a rescue, while another may not be. Where the scorecard and common sense disagree, a considered ruling decides, and the reason is shown with it. Other hundreds in the same innings count for something, mostly when the hundred is the only one in the match, but they are a consideration and not a rule.</p>
      <p>The hosts of Hello Sport, where the phrase comes from, ruled Head&rsquo;s and Smith&rsquo;s dead-rubber hundreds at the SCG in 2026 as tons of consequence. We don&rsquo;t: a dead rubber is a dead rubber, whoever is batting.</p>

      <h2>How much of the record can we measure?</h2>
      <p>The test needs the match record. Ball-by-ball data is close to complete from about 2006 and patchy before that, so we can measure {MEASURED_TOTAL.toLocaleString()} of the {TOTAL.toLocaleString()} hundreds in the database: {TONS_TOTAL.toLocaleString()} are tons of consequence. Don Bradman&rsquo;s 29 are measured by hand from the scorecards, on <Link href="/the-don">The Don</Link>. Older innings will be added as their scorecards are collected, each with its sources.</p>

      <h2>The batters with the most</h2>
      <p className="conn-note">Counts only cover hundreds we can measure, so a batter with a long career before 2006 shows fewer than the whole truth. Batters with at least {MIN_MEASURED} measured hundreds. Tap a name to see every hundred and why it was, or wasn&rsquo;t.</p>
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
