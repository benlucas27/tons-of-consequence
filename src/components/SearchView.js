'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useWeighting } from '@/lib/useWeighting';
import { answer, EXAMPLE_QUESTIONS } from '@/lib/ask';
import { inningsPath, movementOf } from '@/lib/dataset';
import { setUrlParam } from '@/lib/clientUtils';
import { fmt1 } from '@/lib/format';
import { DEFAULT_ORDER, sameOrder, weightQuery } from '@/lib/scoring';
import VoiceButton, { useSpeechSupport } from './VoiceButton';
import WeightNote from './WeightNote';
import BiasNote from './BiasNote';
import CompareResult from './CompareResult';
import RankRow from './RankRow';

function Career({ career }) {
  return (
    <dl className="career">
      <div><dt>Hundreds</dt><dd>{career.count}</dd></div>
      <div><dt>Best</dt><dd>{career.best.runs}{career.best.notOut ? '*' : ''}</dd></div>
      <div><dt>Average score</dt><dd>{fmt1(career.average)}</dd></div>
      <div><dt>In the top 100</dt><dd>{career.inTop100}</dd></div>
    </dl>
  );
}

function Careers({ careers }) {
  return (
    <section className="careers" aria-label="Whole careers">
      <div className="s-label"><span>Every hundred, not just the best</span></div>
      <div className="careers-grid">
        {careers.map((c) => (
          <div key={c.player.key} className="career-card">
            <h3>{c.name}</h3>
            <Career career={c} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Rows({ items, order, bias, numbered }) {
  const isDefault = sameOrder(order, DEFAULT_ORDER) && !bias;
  return (
    <ol className="rows ans-rows">
      {items.map((c, i) => <RankRow key={c.id} c={c} position={numbered ? c.rank : i + 1} order={order} bias={bias} move={isDefault ? null : movementOf(c)} />)}
    </ol>
  );
}

export default function SearchView() {
  const params = useSearchParams();
  const { order, bias } = useWeighting();
  const start = params.get('q') || '';
  const speech = useSpeechSupport();
  const [text, setText] = useState(start);
  const [asked, setAsked] = useState(start);
  const [limit, setLimit] = useState(0);

  const result = useMemo(() => (asked ? answer(asked, order, { bias, ...(limit ? { limit } : {}) }) : null), [asked, order, bias, limit]);

  function run(q) {
    const t = String(q ?? text).trim();
    setText(t);
    setAsked(t);
    setLimit(0);
    setUrlParam('q', t);
    if (t) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const showCompareLink = result?.kind === 'compare' && !result.multi;
  const compareHref = showCompareLink
    ? `/compare?a=${result.comparison.a.id}&b=${result.comparison.b.id}${weightQuery(order, bias).replace('?', '&')}`
    : null;

  return (
    <div className="page-pad ask">
      <header className="ask-head">
        <h1>Ask the rankings</h1>
        <p>Type or say a question about any Test century. Names, countries, grounds, years, scores and what you care about are all fair game.</p>
      </header>

      <form className="ask-form" role="search" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <label className="ask-box">
          <span className="sr-only">Your question</span>
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Who has the better hundred, Ponting or Smith?"
            autoComplete="off"
            enterKeyHint="search"
          />
          <VoiceButton onInterim={setText} onFinal={run} />
          <button type="submit" className="btn primary ask-go">Ask</button>
        </label>
        {speech && <p className="hint">Tap the microphone and say it. Your browser handles the speech, and Chrome and Safari send the audio to their own speech service to turn it into text.</p>}
      </form>

      <WeightNote order={order} bias={bias} />
      <BiasNote bias={bias} />

      {!result && (
        <section className="ask-eg" aria-label="Example questions">
          <div className="s-label"><span>Try one</span></div>
          <div className="eg-list">
            {EXAMPLE_QUESTIONS.map((q) => <button key={q} type="button" className="eg" onClick={() => run(q)}>{q}</button>)}
          </div>
        </section>
      )}

      {result && (
        <section className="ask-result" aria-live="polite" aria-label="Answer">
          <h2 className="ans-head">{result.headline}</h2>

          {result.interpreted.length > 0 && (
            <p className="ans-chips"><span>Understood as</span>{result.interpreted.map((t) => <b key={t}>{t}</b>)}</p>
          )}
          {result.assumed?.map((a) => (
            <p key={a.said} className="ans-assumed">
              I took “{a.said}” to mean <b>{a.player.name}</b>. Did you mean{' '}
              {a.others.map((o, i) => (
                <span key={o.key}>
                  {i > 0 ? ' or ' : ''}
                  <button type="button" className="link-btn" onClick={() => run(asked.replace(new RegExp(`\\b${a.said}\\b`, 'i'), o.name))}>{o.name}</button>
                </span>
              ))}?
            </p>
          ))}
          {result.notes?.map((n) => <p key={n} className="ans-note">{n}</p>)}

          {result.kind === 'compare' && (
            <>
              {result.depth && <p className="ans-depth">{result.depth}</p>}
              <CompareResult items={result.multi || [result.comparison.a, result.comparison.b]} order={result.order} bias={result.bias} />
              {result.careers && <Careers careers={result.careers} />}
              {compareHref && <Link className="btn" href={compareHref} style={{ justifySelf: 'start' }}>Pick two different innings →</Link>}
            </>
          )}

          {result.kind === 'innings' && (
            <>
              <Rows items={[result.innings]} order={result.order} bias={result.bias} numbered />
              <Link className="btn" href={inningsPath(result.innings, result.order, result.bias)} style={{ justifySelf: 'start' }}>Read the full story →</Link>
            </>
          )}

          {result.kind === 'players' && (
            <>
              <Career career={result.career} />
              {result.items.length > 0 && <Rows items={result.items} order={result.order} bias={result.bias} />}
              {result.total > result.items.length && (
                <button type="button" className="btn" style={{ justifySelf: 'start' }} onClick={() => setLimit(result.items.length + 10)}>
                  Show more ({result.total - result.items.length} left)
                </button>
              )}
            </>
          )}

          {result.kind === 'list' && (
            <>
              <Rows items={result.items} order={result.order} bias={result.bias} />
              {result.total > result.items.length && result.items.length < 50 && (
                <button type="button" className="btn" style={{ justifySelf: 'start' }} onClick={() => setLimit(Math.min(50, result.items.length + 10))}>
                  Show more ({Math.min(10, result.total - result.items.length)} more of {result.total.toLocaleString()})
                </button>
              )}
              <p className="ans-note">Want every one? <Link href="/">The rankings page</Link> has filters and shows them all.</p>
            </>
          )}

          {result.kind === 'none' && (
            <div className="eg-list">
              {result.suggestions?.map((q) => <button key={q} type="button" className="eg" onClick={() => run(q)}>{q}</button>)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
