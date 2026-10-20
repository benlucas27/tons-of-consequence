'use client';
import { useState } from 'react';

/** Share or save a designed card (a PNG made by a /card route). Shares the image itself where the phone allows it. */
export default function CardButtons({ src, name, label = 'Share card' }) {
  const [msg, setMsg] = useState('');
  const url = (extra = '') => `${src}${src.includes('?') ? '&' : '?'}${extra}`;
  async function share() {
    try {
      const blob = await (await fetch(url('format=portrait'))).blob();
      const file = new File([blob], `${name}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Tons of Consequence' });
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.png`;
      a.click();
      setMsg('Card saved to your downloads.');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      setMsg('Could not make the card. Try again in a moment.');
    }
  }
  return (
    <span className="card-buttons">
      <button type="button" className="btn" onClick={share}>{label}</button>
      <span role="status" className="conn-note">{msg}</span>
    </span>
  );
}
