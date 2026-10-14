import Link from 'next/link';
import { MOMENTS, ORIGIN, episodeLabel, clock, watchUrl } from '@/lib/helloSport';
import { BY_ID, inningsPath, TOTAL } from '@/lib/dataset';
import { runsText } from '@/lib/format';

export const metadata = {
  title: 'Hello Sport on the innings',
  description: 'Every moment the Hello Sport hosts talk about a Test innings, tagged to the innings and timestamped, plus where "tons of consequence" came from.',
};

const KIND = { innings: 'Innings', historic: 'Older innings, mentioned', career: 'Career', concept: 'The idea' };

export default function HelloSportPage() {
  const sorted = [...MOMENTS].sort((a, b) => b.date.localeCompare(a.date) || a.start - b.start);
  return (
    <article className="prose hs-page">
      <h1>Hello Sport on the innings</h1>
      <p className="lede">The Hello Sport hosts talk about Test innings all the time. This page collects the moments, tagged to the innings in Tons of Consequence and timestamped, so you can hear what they said.</p>
      <p className="conn-note">Independent and unofficial: not made or endorsed by Hello Sport. Scores shown are from our database of {TOTAL.toLocaleString()} Test hundreds. This is a work in progress: more episodes are being added.</p>

      <h2>Where &ldquo;tons of consequence&rdquo; came from</h2>
      <p>On Hello Sport {ORIGIN.episode}{ORIGIN.published ? `, published ${ORIGIN.published}` : ''}, the hosts asked a question: is every hundred a ton <em>of consequence</em>? A hundred made under zero pressure is a good ton, but not one that mattered to the match. They asked for a formula that could tell the two apart. That is what this site is trying to answer.</p>
      <ul className="hs-origin">
        {ORIGIN.points.map((p) => (
          <li key={p.start}>
            <a href={watchUrl(ORIGIN.youtubeId, p.start)} target="_blank" rel="noopener noreferrer">{clock(p.start)}{p.end ? ` to ${clock(p.end)}` : ''}</a>
            <span>{p.text}</span>
          </li>
        ))}
      </ul>

      <h2>Every moment so far</h2>
      <ul className="hs-all">
        {sorted.map((m) => {
          const c = m.inningsId ? BY_ID.get(m.inningsId) : null;
          return (
            <li key={`${m.youtubeId}-${m.start}-${m.player}`}>
              <div className="hs-when">
                <b>{c ? <Link href={inningsPath(c)}>{c.name} {runsText(c)}</Link> : m.player}</b>
                <span>{c ? `v ${c.opponent}, ${c.venue}, ${c.year}` : (KIND[m.type] || '')}</span>
              </div>
              <p>{m.note}</p>
              <a className="link-btn" href={watchUrl(m.youtubeId, m.start)} target="_blank" rel="noopener noreferrer">{episodeLabel(m)}, from {clock(m.start)}</a>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
