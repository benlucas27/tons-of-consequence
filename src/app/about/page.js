import { LEVERS, RANK_WEIGHTS } from '@/lib/scoring';
import { TOTAL } from '@/lib/dataset';
import { ORIGIN, conceptMoments } from '@/lib/helloSport';
import HelloSportMoments from '@/components/HelloSportMoments';

export const metadata = {
  title: 'How it works',
  description: 'How Tons of Consequence scores every Test century, where the data comes from, and how it stays up to date.',
};

export default function About() {
  return (
    <article className="prose">
      <h1>How it works</h1>
      <p className="lede">Not all hundreds are created equal. Tons of Consequence ranks every Test century by what it meant, and lets you decide what meaning is.</p>

      <h2>The six criteria</h2>
      <p>Every innings is scored from 0 to 100 on six things. The scores belong to the innings; how much each one counts is up to you.</p>
      <ul className="lever-list">
        {LEVERS.map((l) => (
          <li key={l.key} style={{ '--c': l.color }}>
            <i aria-hidden="true" />
            <div><b>{l.name}</b><span>{l.description}</span></div>
          </li>
        ))}
      </ul>

      <h2>Your weighting</h2>
      <p>You put the six criteria in order. Your first choice carries {RANK_WEIGHTS[0]}% of an innings&rsquo; score, then {RANK_WEIGHTS.slice(1).join('%, ')}%. An innings&rsquo; ToC score is the weighted average, out of 100. Two people can rank the same innings differently, and both are right.</p>
      <p>Scores fall into four tiers: Legendary (90 and over), Elite (82 to 89), Great (72 to 81) and Notable.</p>
      <p>The &ldquo;most divisive&rdquo; view finds the innings whose score swings the most between five different points of view, the ones that start the best arguments.</p>

      <h2>How the scores are made</h2>
      <p>Most of the {TOTAL.toLocaleString()} innings are given automatic estimates built from the scorecard. The best-known innings are scored and written up by hand.</p>
      <p>An innings in a Test that is still being played carries an &ldquo;In progress&rdquo; label until the result is known.</p>

      <h2>Where &ldquo;tons of consequence&rdquo; comes from</h2>
      <p>The phrase comes from the Hello Sport podcast: episode {ORIGIN.episode}{ORIGIN.published ? `, ${ORIGIN.published}` : ''}, straight after the Sydney Test, where the hosts separate a good ton from a ton of consequence.</p>
      <p>They had used the phrase before that. In March 2024 (episode #606) a host says a hundred in an Ashes Test with a draw certain given the weather &ldquo;wasn&rsquo;t a ton of consequence&rdquo;. Nine days later (#609) it turns up again as a joke about living to a hundred.</p>
      <HelloSportMoments moments={conceptMoments()} title="Hello Sport on the idea" />

      <h2>Where the data comes from</h2>
      <ul>
        <li>The original list of centuries was compiled from public cricket records.</li>
        <li>New centuries, and many match results, come from <a href="https://cricsheet.org">Cricsheet</a>&rsquo;s open ball-by-ball data.</li>
        <li>Hand-written match notes are checked against published match reports.</li>
      </ul>
      <p>New centuries are added every month.</p>
    </article>
  );
}
