'use client';

import { useState } from 'react';
import { videoFor, watchUrl, embedSrc, KIND_LABEL } from '@/lib/videos';

/**
 * The video for an innings, if one has been found and checked. Nothing from YouTube loads until the
 * reader presses play. A video the uploader will not let us embed becomes a link out instead.
 */
export default function VideoCard({ id, name }) {
  const v = videoFor(id);
  const [playing, setPlaying] = useState(false);
  if (!v) return null;

  const meta = `${v.channel} · ${v.mins} min`;
  return (
    <section className="watch" aria-label="Video">
      <h2 className="sec-t"><span>Watch</span><span>{KIND_LABEL[v.kind]}</span></h2>
      {playing && v.embed ? (
        <div className="watch-frame">
          <iframe
            src={embedSrc(v.yt)}
            title={`${name}: ${v.note} (${v.channel})`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : v.embed ? (
        <button type="button" className="watch-poster" onClick={() => setPlaying(true)}>
          <span className="watch-play" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
          <span><b>{v.note}</b><small>{meta}</small></span>
        </button>
      ) : (
        <a className="watch-poster" href={watchUrl(v.yt)} target="_blank" rel="noopener noreferrer">
          <span className="watch-play" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
          <span><b>{v.note}</b><small>{meta}. Opens on YouTube.</small></span>
        </a>
      )}
      {v.kind === 'match' && <p className="lev-note">This covers the whole Test, so it shows other play as well as this innings.</p>}
      <p className="src">
        Video by {v.channel} on YouTube. <a href={watchUrl(v.yt)} target="_blank" rel="noopener noreferrer">Watch it there</a>.
      </p>
    </section>
  );
}
