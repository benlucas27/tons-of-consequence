'use client';

import Link from 'next/link';
import Logo from './Logo';
import { WeightBar, WeightList, PresetChips } from './WeightPanel';

/** The front door: the first screen a new reader sees. Pick what matters, then go to the rankings. */
export default function Door({ order, onChange, onDone }) {
  return (
    <div className="door">
      <header className="door-hero">
        <Logo className="ball l" />
        <Logo className="ball r" />
        <div className="door-eyebrow">● Test cricket ●</div>
        <h1 className="door-title"><span>Tons of</span><span>Consequence</span></h1>
        <div className="door-tag">The unofficial ranking of Test cricket centuries</div>
      </header>
      <div className="door-body">
        <h2>What matters most in a great Test innings?</h2>
        <p>Put these six in order. Your first choice carries 30% of the final score and your last carries 6%. Every century in Test history is then ranked your way.</p>
        <WeightBar order={order} />
        <PresetChips order={order} onChange={onChange} />
        <WeightList order={order} onChange={onChange} />
        <div className="door-actions">
          <button type="button" className="btn primary" style={{ minHeight: 52 }} onClick={onDone}>See my rankings →</button>
          <Link className="door-link" href="/quiz">Not sure? Take the 60-second Pub Test instead →</Link>
        </div>
      </div>
    </div>
  );
}
