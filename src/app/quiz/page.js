'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QUESTIONS, getPersona, applyDeltas, orderForWeights } from '@/lib/quiz';
import { formatOrder, LEVERS } from '@/lib/scoring';

export default function PubTest() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 intro, 1-6 questions, 7 result
  const [answers, setAnswers] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [result, setResult] = useState(null);

  const current = QUESTIONS[step - 1];

  function answer(choice) {
    if (chosen) return;
    const next = [...answers, current[choice].delta];
    setChosen(choice);
    setTimeout(() => {
      setAnswers(next);
      setChosen(null);
      if (step >= QUESTIONS.length) {
        const weights = applyDeltas(next);
        setResult({ weights, persona: getPersona(weights) });
        setStep(QUESTIONS.length + 1);
        window.scrollTo(0, 0);
      } else {
        setStep(step + 1);
      }
    }, 350);
  }

  function seeRankings() {
    const order = orderForWeights(result.weights);
    try { window.localStorage.setItem('toc.order', formatOrder(order)); } catch { /* private mode */ }
    router.push(`/?o=${formatOrder(order)}&from=quiz&p=${result.persona.id}`);
  }

  if (step === 0) {
    return (
      <div className="quiz">
        <div className="quiz-top"><span>The Pub Test</span></div>
        <h1>What kind of cricket fan are you?</h1>
        <p className="lead">Six questions. No right answers. At the end you get your own ranking of every Test century, built around your values, not ours.</p>
        <div className="quiz-actions">
          <button type="button" className="btn primary" style={{ minHeight: 52 }} onClick={() => setStep(1)}>Start the Pub Test</button>
          <Link className="btn" href="/">Skip it and go to the rankings</Link>
        </div>
      </div>
    );
  }

  if (step === QUESTIONS.length + 1 && result) {
    const { persona, weights } = result;
    return (
      <div className="quiz">
        <div className="persona">
          <span className="kick">Your result</span>
          <h2 style={{ color: persona.colour }}>{persona.name}</h2>
          <p className="tagline">{persona.tagline}</p>
          <p className="lead" style={{ fontSize: 17 }}>{persona.description}</p>
        </div>
        <section className="profile" aria-label="Your weighting profile">
          <div className="s-label"><span>Your weighting profile</span></div>
          {LEVERS.map((l) => (
            <div key={l.key} className="profile-row" style={{ '--c': l.color }}>
              <div><span>{l.name}</span><b>{weights[l.key]}%</b></div>
              <div className="track"><span style={{ width: `${(weights[l.key] / 50) * 100}%` }} /></div>
            </div>
          ))}
        </section>
        <div className="quiz-actions">
          <button type="button" className="btn primary" style={{ minHeight: 52 }} onClick={seeRankings}>See your ranking →</button>
          <button type="button" className="btn" onClick={() => { setStep(0); setAnswers([]); setResult(null); }}>Retake the test</button>
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
        {['a', 'b'].map((choice) => (
          <button key={choice} type="button" disabled={Boolean(chosen)} className={`ans${chosen === choice ? ' chosen' : ''}${chosen && chosen !== choice ? ' other' : ''}`} onClick={() => answer(choice)}>
            <span className="em" aria-hidden="true">{current[choice].emoji}</span>
            <span>{current[choice].text}</span>
          </button>
        ))}
      </div>
      <Link className="link-btn" href="/" style={{ justifySelf: 'center' }}>Skip the quiz and go to the rankings</Link>
    </div>
  );
}
