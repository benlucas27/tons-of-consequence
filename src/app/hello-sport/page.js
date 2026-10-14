import Link from 'next/link';
import { MOMENTS, EPISODES, ORIGIN, episodeLabel, clock, watchUrl } from '@/lib/helloSport';
import { BY_ID, inningsPath } from '@/lib/dataset';
import { runsText } from '@/lib/format';

export const metadata = {
  title: 'Hello Sport cricket chat: an archive',
  description: 'An archive of the moments the Hello Sport hosts talk about Test hundreds and tons of consequence, timestamped so you can hear them, and tagged to the innings.',
};

const KIND = { innings: 'Innings', historic: 'Older innings, mentioned', career: 'Career', concept: 'Tons of consequence' };

/** The moments grouped by episode, newest episode first, each group in the order the hosts get to them. */
function byEpisode() {
  const groups = new Map();
  for (const m of MOMENTS) {
    if (!groups.has(m.youtubeId)) groups.set(m.youtubeId, { youtubeId: m.youtubeId, date: m.date, moments: [] });
    // the episode that has its own timestamped list below doesn't also need the one-line concept row
    if (m.type === 'concept' && m.youtubeId === ORIGIN.youtubeId) continue;
    groups.get(m.youtubeId).moments.push(m);
  }
  const list = [...groups.values()];
  list.forEach((g) => g.moments.sort((a, b) => a.start - b.start));
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export default function HelloSportPage() {
  const groups = byEpisode();
  return (
    <article className="prose hs-page">
      <h1>Hello Sport cricket chat: an archive</h1>
      <p className="lede">An archive of the moments the Hello Sport hosts talk about Test hundreds and tons of consequence. Each one has the timestamp, so you can hear what they said, and is tagged to the innings in Tons of Consequence where there is one.</p>
      <p className="conn-note">Independent and unofficial: not made or endorsed by Hello Sport. Scores shown are from our own database, not from the episodes. {MOMENTS.length} moments from {groups.length} episodes so far, with more being added.</p>

      {groups.map((g) => {
        const ep = EPISODES[g.youtubeId];
        const label = episodeLabel(g.moments[0]);
        const extra = g.youtubeId === ORIGIN.youtubeId ? ORIGIN.points : [];
        return (
          <section key={g.youtubeId} className="hs-episode" aria-label={label}>
            <h2>{label}</h2>
            <ul className="hs-all">
              {g.moments.map((m) => {
                const c = m.inningsId ? BY_ID.get(m.inningsId) : null;
                return (
                  <li key={`${m.start}-${m.player}`}>
                    <div className="hs-when">
                      <b>{c ? <Link href={inningsPath(c)}>{c.name} {runsText(c)}</Link> : m.type === 'concept' ? KIND.concept : m.player}</b>
                      <span>{c ? `v ${c.opponent}, ${c.venue}, ${c.year}` : (KIND[m.type] || '')}</span>
                    </div>
                    <p>{m.note}</p>
                    <a className="link-btn" href={watchUrl(m.youtubeId, m.start)} target="_blank" rel="noopener noreferrer">Listen from {clock(m.start)}</a>
                  </li>
                );
              })}
            </ul>
            {extra.length > 0 && (
              <ul className="hs-origin" aria-label="More from this episode">
                {extra.map((p) => (
                  <li key={p.start}>
                    <a href={watchUrl(ep?.youtubeId || g.youtubeId, p.start)} target="_blank" rel="noopener noreferrer">{clock(p.start)}{p.end ? ` to ${clock(p.end)}` : ''}</a>
                    <span>{p.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </article>
  );
}
