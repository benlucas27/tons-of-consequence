import Link from 'next/link';
import { MOMENTS, ORIGIN, episodeLabel, clock, watchUrl } from '@/lib/helloSport';
import { BY_ID, inningsPath } from '@/lib/dataset';
import { runsText } from '@/lib/format';

export const metadata = {
  title: 'Hello Cricket',
  description: 'The moments the Hello Sport hosts talk about Test hundreds and tons of consequence, newest first, timestamped so you can hear them.',
};

const KIND = { innings: 'Innings', historic: 'Older innings, mentioned', career: 'Career', concept: 'Tons of consequence' };

/** Every moment in one rolling list: newest episode first, and within an episode in the order the hosts get to them. */
function rolling() {
  return MOMENTS
    // the episode that has its own timestamped list below doesn't also need the one-line concept row
    .filter((m) => !(m.type === 'concept' && m.youtubeId === ORIGIN.youtubeId))
    .sort((a, b) => b.date.localeCompare(a.date) || a.youtubeId.localeCompare(b.youtubeId) || a.start - b.start);
}

export default function HelloSportPage() {
  const list = rolling();
  const extra = ORIGIN.points || [];
  return (
    <article className="prose hs-page">
      <h1>Hello Cricket</h1>
      <p className="lede">The moments the Hello Sport hosts talk about Test hundreds and tons of consequence, newest first. Each one links to the exact second, and to the innings in Tons of Consequence where there is one.</p>

      <ul className="hs-roll">
        {list.map((m) => {
          const c = m.inningsId ? BY_ID.get(m.inningsId) : null;
          return (
            <li key={`${m.youtubeId}-${m.start}-${m.player}-${m.inningsId ?? m.type}`}>
              <div className="hs-roll-head">
                <b>{c ? <Link href={inningsPath(c)}>{c.name} {runsText(c)}</Link> : m.type === 'concept' ? KIND.concept : m.player}</b>
                <span>{c ? `v ${c.opponent}, ${c.year}` : (KIND[m.type] || '')}</span>
              </div>
              <p>{m.note}</p>
              <div className="hs-roll-meta">
                <span>{episodeLabel(m)}</span>
                <a className="link-btn" href={watchUrl(m.youtubeId, m.start)} target="_blank" rel="noopener noreferrer">Listen from {clock(m.start)}</a>
              </div>
            </li>
          );
        })}
      </ul>

      {extra.length > 0 && (
        <details className="hs-started">
          <summary>The episode that started it: {episodeLabel(MOMENTS.find((m) => m.youtubeId === ORIGIN.youtubeId) || { youtubeId: ORIGIN.youtubeId, date: '' })}</summary>
          <ul className="hs-origin" aria-label="More from this episode">
            {extra.map((p) => (
              <li key={p.start}>
                <a href={watchUrl(ORIGIN.youtubeId, p.start)} target="_blank" rel="noopener noreferrer">{clock(p.start)}{p.end ? ` to ${clock(p.end)}` : ''}</a>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
