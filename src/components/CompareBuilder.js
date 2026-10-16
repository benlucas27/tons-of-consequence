'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWeighting } from '@/lib/useWeighting';
import { rankAll } from '@/lib/dataset';
import { searchInnings, findInnings } from '@/lib/ask';
import { copyText, setUrlParam, toast } from '@/lib/clientUtils';
import { context, runsText, fmt1 } from '@/lib/format';
import { tierOf } from '@/lib/scoring';
import WeightNote from './WeightNote';
import BiasNote from './BiasNote';
import CompareResult from './CompareResult';
import CareerCompare from './CareerCompare';
import WomensCompare from './WomensCompare';
import { COMPARE_SETS, setById } from '@/lib/careerCompare';

const PAIRS = [
  [['Lara', 153, 1999], ['Stokes', 135, 2019]],
  [['Bradman', 334, 1930], ['Lara', 400, 2004]],
  [['Ponting', 156, 2005], ['Smith', 144, 2019]],
  [['Tendulkar', 241, 2004], ['Laxman', 281, 2001]],
  [['Renshaw', 190, 2026], ['Renshaw', 184, 2017]],
];
const EXAMPLES = PAIRS.map(([a, b]) => [findInnings(...a), findInnings(...b)]).filter(([a, b]) => a && b);

function Picker({ label, selected, otherId, order, bias, onPick, onClear }) {
  const uid = useId();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef(null);
  const hits = useMemo(() => searchInnings(text, order, 8, bias).filter((c) => c.id !== otherId), [text, order, bias, otherId]);

  if (selected) {
    const tier = tierOf(selected.toc);
    return (
      <div className="pick-card">
        <div className="s-label"><span>{label}</span><button type="button" className="link-btn" onClick={() => { onClear(); setText(''); setTimeout(() => input.current?.focus(), 0); }}>Change</button></div>
        <h3>{selected.name} <b>{runsText(selected)}</b></h3>
        <div className="ctx">{context(selected)}</div>
        <div className="pick-score"><span className="num">{fmt1(selected.toc)}</span><span className={`tier t-${tier.key}`}>{tier.label}</span><span className="ctx">Rank {selected.rank.toLocaleString()}</span></div>
      </div>
    );
  }

  function choose(c) {
    onPick(c.id);
    setText('');
    setOpen(false);
  }
  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && open && hits[active]) { e.preventDefault(); choose(hits[active]); }
    else if (e.key === 'Escape') setOpen(false);
  }
  const listId = `${uid}-list`;
  return (
    <div className="pick-card unset">
      <div className="s-label"><span>{label}</span></div>
      <div className="combo">
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={listId}
          aria-activedescendant={open && hits[active] ? `${uid}-o${active}` : undefined}
          aria-autocomplete="list"
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
          placeholder="Player, ground or year. Try “Lara 153”"
          autoComplete="off"
          aria-label={`Search for ${label.toLowerCase()}`}
        />
        {open && text.trim() && (
          <ul id={listId} role="listbox" className="combo-list">
            {hits.length === 0 && <li className="combo-none">Nothing matches. Try just a surname.</li>}
            {hits.map((c, i) => (
              <li key={c.id} id={`${uid}-o${i}`} role="option" aria-selected={i === active} className={i === active ? 'on' : ''}
                onMouseDown={(e) => { e.preventDefault(); choose(c); }} onMouseEnter={() => setActive(i)}>
                <span><b>{c.name}</b> {runsText(c)}</span>
                <span className="ctx">{context(c)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CompareBuilder() {
  const params = useSearchParams();
  const { order, bias } = useWeighting();
  const ranked = useMemo(() => rankAll(order, bias), [order, bias]);
  const byId = useMemo(() => new Map(ranked.map((c) => [c.id, c])), [ranked]);
  const idParam = (k) => { const n = Number(params.get(k)); return Number.isFinite(n) && byId.has(n) ? n : null; };
  const [a, setA] = useState(() => idParam('a'));
  const [b, setB] = useState(() => idParam('b'));
  const [setId, setSetId] = useState(() => (setById(params.get('set')) ? params.get('set') : null));
  const careerSet = setId ? setById(setId) : null;
  const [womens, setWomens] = useState(() => params.get('women') === '1');
  function chooseWomens(on) { setWomens(on); setUrlParam('women', on ? '1' : ''); }

  const left = a != null ? byId.get(a) : null;
  const right = b != null ? byId.get(b) : null;

  function set(which, id) {
    (which === 'a' ? setA : setB)(id);
    setUrlParam(which, id == null ? '' : String(id));
  }
  function setBoth(x, y) {
    setA(x);
    setB(y);
    setUrlParam('a', String(x));
    setUrlParam('b', String(y));
  }
  function chooseSet(id) {
    setSetId(id);
    setUrlParam('set', id || '');
  }
  async function share() {
    const ok = await copyText(window.location.href);
    toast(ok ? 'Link copied. It carries both innings and your weighting.' : 'Copy the address from your browser bar.');
  }

  return (
    <div className="page-pad ask">
      <header className="ask-head">
        <h1>{womens ? 'Compare two women\'s hundreds' : careerSet ? 'Compare careers' : 'Compare two innings'}</h1>
        <p>{womens ? 'Pick any two women\'s Test hundreds and see which were tons of consequence, with the match facts side by side.' : careerSet
          ? 'Whole careers side by side: the numbers from every innings, and how their hundreds rank on your weighting.'
          : 'Pick any two Test hundreds. You get a verdict on your weighting, how it holds up under the five presets, and the six criteria side by side.'}</p>
      </header>

      <div className="tabs" role="group" aria-label="What to compare" style={{ justifySelf: 'start' }}>
        <button type="button" aria-pressed={!careerSet && !womens} onClick={() => { chooseWomens(false); chooseSet(null); }}>Two innings</button>
        <button type="button" aria-pressed={Boolean(careerSet) && !womens} onClick={() => { chooseWomens(false); chooseSet(careerSet ? careerSet.id : COMPARE_SETS[0].id); }}>Career presets</button>
        <button type="button" aria-pressed={womens} onClick={() => { chooseSet(null); chooseWomens(true); }}>Women&rsquo;s Tests</button>
      </div>

      {womens ? (
        <WomensCompare />
      ) : careerSet ? (
        <>
          <div className="chips" role="group" aria-label="Preset comparisons">
            {COMPARE_SETS.map((s) => (
              <button key={s.id} type="button" className="chip" aria-pressed={s.id === careerSet.id} onClick={() => chooseSet(s.id)}>{s.name}</button>
            ))}
          </div>
          <p className="preset-note">{careerSet.blurb}</p>
          <WeightNote order={order} bias={bias} />
          <BiasNote bias={bias} />
          <div className="cmp-actions"><button type="button" className="btn" onClick={share}>Copy link</button></div>
          <CareerCompare set={careerSet} order={order} bias={bias} />
        </>
      ) : (
      <>
      <div className="pickers">
        <Picker label="First innings" selected={left} otherId={b} order={order} bias={bias} onPick={(id) => set('a', id)} onClear={() => set('a', null)} />
        <span className="vs" aria-hidden="true">vs</span>
        <Picker label="Second innings" selected={right} otherId={a} order={order} bias={bias} onPick={(id) => set('b', id)} onClear={() => set('b', null)} />
      </div>

      <WeightNote order={order} bias={bias} />
      <BiasNote bias={bias} />

      {left && right ? (
        <section className="ask-result" aria-live="polite" aria-label="Verdict">
          <div className="cmp-actions">
            <button type="button" className="btn" onClick={() => setBoth(b, a)}>Swap sides</button>
            <button type="button" className="btn" onClick={share}>Copy link</button>
          </div>
          <CompareResult items={[left, right]} order={order} bias={bias} />
        </section>
      ) : (
        <section className="ask-eg" aria-label="Example comparisons">
          <div className="s-label"><span>Or start with one of these</span></div>
          <div className="eg-list">
            {EXAMPLES.map(([x, y]) => (
              <button key={`${x.id}-${y.id}`} type="button" className="eg" onClick={() => setBoth(x.id, y.id)}>
                {x.name} {runsText(x)} <i>vs</i> {y.name} {runsText(y)}
              </button>
            ))}
          </div>
        </section>
      )}
      </>
      )}
    </div>
  );
}
