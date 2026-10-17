import Link from 'next/link';
import { WOMENS, WOMENS_BATTERS, WOMENS_TONS, WOMENS_TOTAL, WOMENS_BALL_BY_BALL, RESULT_WORD } from '@/lib/womens';

export const metadata = {
  title: "Women's ToCs: tons of consequence in women's Tests",
  description: "Every women's Test hundred, from Myrtle Maclagan in 1935 to today, and which of them were tons of consequence: the ones that won or saved the match.",
};

const dateText = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function WomensTests() {
  const leaders = WOMENS_BATTERS.filter((b) => b.tons > 0);
  return (
    <article className="prose toc-page">
      <p className="conn-note"><Link href="/tons-of-consequence">&larr; Men&rsquo;s ToCs</Link></p>
      <h1>Women&rsquo;s ToCs</h1>
      <p className="lede">There have been {WOMENS_TOTAL} hundreds in women&rsquo;s Tests. {WOMENS_TONS.length} of them were tons of consequence: the hundred won the match, or saved it. The same laws as the men&rsquo;s game apply, with <Link href="/tons-of-consequence">the 13 laws explained here</Link>.</p>

      <h2>How much can we measure?</h2>
      <p>Only {WOMENS_BALL_BY_BALL} of the {WOMENS_TOTAL} hundreds have a ball-by-ball record, so most of these verdicts rest on the result and match reports, not on the score when the batter came in. A draw only counts when the ball-by-ball record shows the hundred saved it, so almost every drawn Test here is a good ton. Most of these hundreds came in drawn Tests.</p>

      <h2>The batters with the most</h2>
      <table className="toc-board">
        <thead><tr><th>Batter</th><th>Tons of consequence</th><th>Hundreds</th></tr></thead>
        <tbody>
          {leaders.map((b) => (
            <tr key={b.name}><td><a href={`#${b.list[0].slug}`}>{b.name}</a> <small>{b.team}</small></td><td><b>{b.tons}</b></td><td>{b.hundreds}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>The {WOMENS_TONS.length} tons of consequence</h2>
      <ol className="toc-list">
        {WOMENS_TONS.map((h) => (
          <li key={h.no} className="toc-yes">
            <h3>{h.name} {h.runs} <small>{h.team} v {h.opponent}, {h.ground.split(',')[0]}, {h.year} &middot; {RESULT_WORD[h.result]}</small></h3>
            {h.historic && <p><b>Historic:</b> {h.historic}</p>}
            <p>{h.reason}</p>
          </li>
        ))}
      </ol>
      <p className="conn-note">A few of these count partly for their place in history: the first women&rsquo;s Test century, or a world-record score at the time. They are marked &ldquo;Historic&rdquo;.</p>

      <h2>Every hundred</h2>
      <p className="conn-note">Oldest first. A good ton is a fine hundred that did not win or save the match.</p>
      <ol className="toc-list">
        {WOMENS.map((h) => (
          <li key={h.no} id={h.slug} className={h.ton ? 'toc-yes' : 'toc-no'}>
            <h3>{h.name} {h.runs} <small>{h.team} v {h.opponent}, {h.ground.split(',')[0]}, {dateText(h.date)} &middot; {RESULT_WORD[h.result]}</small></h3>
            <p><b>{h.ton ? 'A ton of consequence.' : 'A good ton.'}</b>{h.historic ? <> <b>Historic:</b> {h.historic}</> : null} {h.reason}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
