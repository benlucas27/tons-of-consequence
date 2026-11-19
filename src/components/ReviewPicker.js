'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_ORDER } from '@/lib/scoring';
import { searchInnings } from '@/lib/ask';
import { inningsPath } from '@/lib/dataset';
import { context, runsText } from '@/lib/format';

/** "Review an innings": one button that opens a search box. Picking an innings opens its page, where the Challenge button sits under the headline. */
export default function ReviewPicker() {
  const uid = useId();
  const router = useRouter();
  const input = useRef(null);
  const [shown, setShown] = useState(false);
  const [text, setText] = useState('');
  const [active, setActive] = useState(0);
  const hits = useMemo(() => searchInnings(text, DEFAULT_ORDER, 8), [text]);

  const go = (c) => router.push(`${inningsPath(c)}#challenge`);
  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); go(hits[active]); }
    else if (e.key === 'Escape') setShown(false);
  }
  const listId = `${uid}-list`;
  return (
    <div className="review-picker">
      <button type="button" className="btn primary" aria-expanded={shown} onClick={() => { setShown(!shown); setTimeout(() => input.current?.focus(), 0); }}>Review an innings</button>
      {shown && (
        <div className="combo">
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-expanded={hits.length > 0 && !!text.trim()}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label="Search for the innings you want reviewed"
            value={text}
            onChange={(e) => { setText(e.target.value); setActive(0); }}
            onKeyDown={onKey}
            placeholder="Player, ground or year. Try “Warner 335”"
            autoComplete="off"
          />
          {text.trim() && (
            <ul id={listId} role="listbox" className="combo-list">
              {hits.length === 0 && <li className="combo-none">Nothing matches. Try just a surname.</li>}
              {hits.map((c, i) => (
                <li key={c.id} role="option" aria-selected={i === active} className={i === active ? 'on' : ''} onMouseDown={(e) => { e.preventDefault(); go(c); }} onMouseEnter={() => setActive(i)}>
                  <span><b>{c.name}</b> {runsText(c)}</span>
                  <span className="ctx">{context(c)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="conn-note">Pick the innings, then press <b>Challenge this ruling</b> on its page and say what we should look at.</p>
        </div>
      )}
    </div>
  );
}
