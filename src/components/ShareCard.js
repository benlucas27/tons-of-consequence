'use client';

import { useState } from 'react';
import { copyText, toast } from '@/lib/clientUtils';
import { SIZES } from '@/lib/cards/theme';
import { SITE_URL } from '@/lib/site';
import { DEFAULT_ORDER, sameOrder, formatOrder } from '@/lib/scoring';

/** The card's query for a reader's weighting: nothing for Default, otherwise o= (and bonus=). */
export const cardWeighting = (order, bias) => (bias || !sameOrder(order, DEFAULT_ORDER) ? { o: formatOrder(order), ...(bias ? { bonus: bias } : {}) } : {});

const cardUrl = (params, size, extra = '') => `/card?${new URLSearchParams({ ...params, size }).toString()}${extra}`;

/** The card preview with size choice, download, native share and copy link. `params` is the card's query (type plus whatever it needs). */
export function CardPanel({ params, pageUrl, shareText }) {
  const [size, setSize] = useState('wide');
  const src = cardUrl(params, size);
  const link = `${SITE_URL}${pageUrl}`;

  async function share() {
    try {
      const blob = await (await fetch(src)).blob();
      const file = new File([blob], `tons-of-consequence-${params.type}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${shareText} ${link}` });
        return;
      }
      if (navigator.share) { await navigator.share({ text: shareText, url: link }); return; }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    await copyText(link);
    toast('Link copied. Use Download to save the picture.');
  }

  return (
    <div className="share-panel">
      <div className="share-sizes" role="tablist" aria-label="Card size">
        {Object.entries(SIZES).map(([key, s]) => (
          <button key={key} role="tab" aria-selected={size === key} className={`share-size ${size === key ? 'on' : ''}`} onClick={() => setSize(key)}>
            <b>{s.label}</b><span>{s.note}</span>
          </button>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`share-preview share-${size}`} src={src} alt="Preview of the share card" />
      <div className="share-actions">
        <a className="btn" href={cardUrl(params, size, '&download=1')} download>Download picture</a>
        <button className="btn" onClick={share}>Share</button>
        <button className="btn" onClick={async () => { await copyText(link); toast('Link copied'); }}>Copy link</button>
      </div>
    </div>
  );
}

/** A "Share card" button that opens the panel in place. */
export default function ShareCard({ params, pageUrl, shareText, label = 'Share card' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="share-box">
      <button className="btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close share card' : label}</button>
      {open && <CardPanel params={params} pageUrl={pageUrl} shareText={shareText} />}
    </div>
  );
}
