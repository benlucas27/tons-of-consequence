'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { copyText, setUrlParam, toast } from '@/lib/clientUtils';
import { WOMENS_BY_NO, searchWomens, hundredText, RESULT_WORD } from '@/lib/womens';

const EXAMPLES = [[1, 80], [23, 34], [111, 112], [102, 98]].map(([a, b]) => [WOMENS_BY_NO.get(a), WOMENS_BY_NO.get(b)]).filter(([a, b]) => a && b);

function Picker({ label, selected, otherNo, onPick, onClear }) {
  const uid = useId();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const input = useRef(null);
  const hits = useMemo(() => searchWomens(text, 8).filter((h) => h.no !== otherNo), [text, otherNo]);
  if (selected) {
    return (
      <div className="pick-card">
        <div className="s-label"><span>{label}</span><button type="button" className="link-btn" onClick={() => { onClear(); setText(''); setTimeout(() => input.current?.focus(), 0); }}>Change</button></div>
        <h3>{selected.name} <b>{selected.runs}</b></h3>
        <div className="ctx">{selected.team} v {selected.opponent}, {selected.ground.split(',')[0]}, {selected.year}</div>
      </div>
    );
  }
  return (
    <div className="pick-card unset">
      <div className="s-label"><span>{label}</span></div>
      <div className="combo">
        <input ref={input} type="search" value={text} onChange={(e) => { setText(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} placeholder="Batter, ground or year. Try “Sutherland 2025”" autoComplete="off" aria-label={`Search for ${label.toLowerCase()}`} />
        {open && text.trim() && (
          <ul id={`${uid}-list`} role="listbox" className="combo-list">
            {hits.length === 0 && <li className="combo-none">Nothing matches. Try just a surname.</li>}
            {hits.map((h) => (
              <li key={h.no} role="option" aria-selected={false} onMouseDown={(e) => { e.preventDefault(); onPick(h.no); setText(''); setOpen(false); }}>
                <span><b>{h.name}</b> {h.runs}</span>
                <span className="ctx">{h.team} v {h.opponent}, {h.year}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Side({ h }) {
  return (
    <div className="pick-card">
      <h3>{h.name} <b>{h.runs}</b></h3>
      <div className="ctx">{hundredText(h)}</div>
      <p><b>{h.ton ? 'A ton of consequence.' : 'A good ton.'}</b> {RESULT_WORD[h.result]}.{h.historic ? <> <b>Historic:</b> {h.historic}</> : null}</p>
      <p>{h.reason}</p>
      <p className="ctx">Evidence: {h.evidence === 'b' ? 'ball-by-ball record' : 'result and match reports'}</p>
    </div>
  );
}

/** Compare two women's Test hundreds: no six-criteria scores exist for them, so it sets out the verdict and the facts side by side. */
export default function WomensCompare() {
  const params = useSearchParams();
  const num = (k) => { const n = Number(params.get(k)); return WOMENS_BY_NO.has(n) ? n : null; };
  const [a, setA] = useState(() => num('wa'));
  const [b, setB] = useState(() => num('wb'));
  const left = a != null ? WOMENS_BY_NO.get(a) : null;
  const right = b != null ? WOMENS_BY_NO.get(b) : null;
  const set = (which, no) => { (which === 'a' ? setA : setB)(no); setUrlParam(which === 'a' ? 'wa' : 'wb', no == null ? '' : String(no)); };
  const both = (x, y) => { setA(x); setB(y); setUrlParam('wa', String(x)); setUrlParam('wb', String(y)); };
  const share = async () => { const ok = await copyText(window.location.href); toast(ok ? 'Link copied. It carries both hundreds.' : 'Copy the address from your browser bar.'); };
  let verdict = null;
  if (left && right) {
    verdict = left.ton === right.ton
      ? (left.ton ? 'Both were tons of consequence.' : 'Both were good tons, not tons of consequence.')
      : `${(left.ton ? left : right).name}'s ${(left.ton ? left : right).runs} was a ton of consequence; ${(left.ton ? right : left).name}'s ${(left.ton ? right : left).runs} was a good ton.`;
  }
  return (
    <>
      <p className="preset-note">Women&rsquo;s Test hundreds do not have the six criteria scores the men&rsquo;s comparison uses, so this sets out the verdict and the match facts side by side.</p>
      <div className="pickers">
        <Picker label="First hundred" selected={left} otherNo={b} onPick={(no) => set('a', no)} onClear={() => set('a', null)} />
        <span className="vs" aria-hidden="true">vs</span>
        <Picker label="Second hundred" selected={right} otherNo={a} onPick={(no) => set('b', no)} onClear={() => set('b', null)} />
      </div>
      {left && right ? (
        <section className="ask-result" aria-live="polite" aria-label="Verdict">
          <div className="cmp-actions">
            <button type="button" className="btn" onClick={() => both(b, a)}>Swap sides</button>
            <button type="button" className="btn" onClick={share}>Copy link</button>
          </div>
          <p><b>{verdict}</b></p>
          <div className="pickers"><Side h={left} /><span className="vs" aria-hidden="true">vs</span><Side h={right} /></div>
        </section>
      ) : (
        <section className="ask-eg" aria-label="Example comparisons">
          <div className="s-label"><span>Or start with one of these</span></div>
          <div className="eg-list">
            {EXAMPLES.map(([x, y]) => (
              <button key={`${x.no}-${y.no}`} type="button" className="eg" onClick={() => both(x.no, y.no)}>{x.name} {x.runs} <i>vs</i> {y.name} {y.runs}</button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
