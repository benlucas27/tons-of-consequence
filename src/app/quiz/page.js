'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QUESTIONS, PERSONA_BY_ID, PICKS, getPersona, tally, rankingsFor } from '@/lib/quiz';
import { formatOrder, weightQuery, PRESETS } from '@/lib/scoring';
import { WeightBar } from '@/components/WeightPanel';
import BiasNote from '@/components/BiasNote';

const shuffled = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function PubTest() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 intro, 1-8 questions, 9 result
  const [answers, setAnswers] = useState([]); // the persona behind each answer chosen
  const [layout, setLayout] = useState([]); // the shuffled answer order for each question
  const [chosen, setChosen] = useState(null);
  const [result, setResult] = useState(null);

  const current = QUESTIONS[step - 1];

  function begin() {
    setLayout(QUESTIONS.map((q) => shuffled(q.options)));
    setAnswers([]);
    setResult(null);
    setStep(1);
  }

  function answer(option) {
    if (chosen) return;
    const next = [...answers, option.persona];
    setChosen(option.persona);
    setTimeout(() => {
      setAnswers(next);
      setChosen(null);
      if (step >= QUESTIONS.length) {
        setResult({ persona: getPersona(next), counts: tally(next) });
        setStep(QUESTIONS.length + 1);
        window.scrollTo(0, 0);
      } else {
        setStep(step + 1);
      }
    }, 350);
  }

  function seeRankings() {
    const { order, bias } = rankingsFor(result.persona);
    try {
      window.localStorage.setItem('toc.order', formatOrder(order));
      if (bias) window.localStorage.setItem('toc.bias', bias); else window.localStorage.removeItem('toc.bias');
    } catch { /* private mode */ }
    const q = weightQuery(order, bias);
    router.push(`/${q ? `${q}&` : '?'}from=quiz&p=${result.persona.id}`);
  }

  if (step === 0) {
    return (
      <div className="quiz">
        <div className="quiz-top"><span>The Pub Test</span></div>
        <h1>What kind of cricket fan are you?</h1>
        <p className="lead">Eight questions, no right answers. At the end you get your own ranking of every Test century, built around what you value, not what we do.</p>
        <div className="quiz-actions">
          <button type="button" className="btn primary" style={{ minHeight: 52 }} onClick={begin}>Start the Pub Test</button>
          <Link className="btn" href="/">Skip it and go to the rankings</Link>
        </div>
      </div>
    );
  }

  if (step === QUESTIONS.length + 1 && result) {
    const { persona, counts } = result;
    const { order, bias } = rankingsFor(persona);
    return (
      <div className="quiz">
        <div className="persona">
          <span className="kick">Your result</span>
          <h2 style={{ color: persona.colour }}>{persona.name}</h2>
          <p className="tagline">{persona.tagline}</p>
          <p className="lead" style={{ fontSize: 17 }}>{persona.description}</p>
        </div>
        <section className="profile" aria-label="Your ranking">
          <div className="s-label"><span>Your ranking: {persona.preset}</span></div>
          <WeightBar order={order} />
          <p className="preset-note">{PRESETS[persona.preset].blurb}</p>
          <BiasNote bias={bias} />
        </section>
        <section className="picks" aria-label="How you answered">
          <div className="s-label"><span>How you answered</span></div>
          <p className="ans-chips">
            {PICKS.map((id) => <b key={id}>{PERSONA_BY_ID[id].name.replace('The ', '')} {counts[id]}</b>)}
          </p>
        </section>
        <div className="quiz-actions">
          <button type="button" className="btn primary" style={{ minHeight: 52 }} onClick={seeRankings}>See your ranking →</button>
          <button type="button" className="btn" onClick={() => setStep(0)}>Retake the test</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-top"><span>The Pub Test</span><span>{step} of {QUESTIONS.length}</span></div>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={step - 1}><i style={{ width: `${((step - 1) / QUESTIONS.length) * 100}%` }} /></div>
      <h1 className="q">{current.question}</h1>
      <div className="answers">
        {(layout[step - 1] || current.options).map((option) => (
          <button key={option.persona} type="button" disabled={Boolean(chosen)} className={`ans${chosen === option.persona ? ' chosen' : ''}${chosen && chosen !== option.persona ? ' other' : ''}`} onClick={() => answer(option)}>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      <Link className="link-btn" href="/" style={{ justifySelf: 'center' }}>Skip the quiz and go to the rankings</Link>
    </div>
  );
}
