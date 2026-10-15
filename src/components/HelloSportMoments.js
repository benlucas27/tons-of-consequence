'use client';

import { useState } from 'react';
import { momentsFor, clock, watchUrl, embedUrl, episodeLabel } from '@/lib/helloSport';

/** One moment: a button that plays the episode from where they start talking, and a link out to YouTube. */
function Moment({ m }) {
  const [playing, setPlaying] = useState(false);
  return (
    <li className="hs-moment">
      {playing ? (
        <div className="watch-frame">
          <iframe
            src={embedUrl(m.youtubeId, m.start)}
            title={`${episodeLabel(m)}, from ${clock(m.start)}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <button type="button" className="hs-play" onClick={() => setPlaying(true)}>
          <span className="watch-play" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
          <span><b>Play from {clock(m.start)}</b><small>{episodeLabel(m)}</small></span>
        </button>
      )}
      {m.note && <p className="hs-note">{m.note}</p>}
      <a className="link-btn" href={watchUrl(m.youtubeId, m.start)} target="_blank" rel="noopener noreferrer">Open on YouTube at {clock(m.start)}</a>
    </li>
  );
}

const INNINGS_CAPTION = 'The Hello Sport podcast. Independent: not made or endorsed by them, and the score shown on this page is from our database, not from the episode.';
const GENERAL_CAPTION = 'The Hello Sport podcast. Independent: not made or endorsed by them.';

/**
 * "Hello Sport on this innings": what the hosts said, with a way to hear it. Renders nothing if they haven't.
 * Pass `moments`, `title` and `caption` to use it for something else (a player's career chat, the origin of the idea).
 */
export default function HelloSportMoments({ inningsId, moments, title = 'Hello Sport on this innings', caption }) {
  const list = moments ?? momentsFor(inningsId);
  if (!list.length) return null;
  return (
    <section className="hs" aria-label={title}>
      <h2 className="sec-t"><span>{title}</span><span>{list.length === 1 ? '1 moment' : `${list.length} moments`}</span></h2>
      <ul className="hs-list">{list.map((m) => <Moment key={`${m.youtubeId}-${m.start}-${m.player}-${m.inningsId ?? m.type}`} m={m} />)}</ul>
      <p className="src">{caption ?? (moments ? GENERAL_CAPTION : INNINGS_CAPTION)}</p>
    </section>
  );
}
