/**
 * The Pub Test: six either/or questions that derive a reader's weighting and reveal their persona.
 * Each answer shifts the six criteria by its delta (applied to BASE_WEIGHTS). The result is turned
 * into an order of the six criteria, which is what the rankings use.
 */
import { orderFromWeights } from './scoring.js';

export const QUESTIONS = [
  {
    id: 1,
    question: "A batter scores 200* in a dead rubber nobody watched. Another scores 104 that wins the Ashes on the final ball. Which is the greater innings?",
    a: {
      text: "The 200*. Runs are runs.",
      emoji: "📊",
      delta: { matchImpact: -8, conditions: +4, clutchness: -6, narrative: +4, historicalWeight: +3, perceivedGreatness: +3 },
    },
    b: {
      text: "The 104. Context is everything.",
      emoji: "🎯",
      delta: { matchImpact: +8, conditions: -2, clutchness: +6, narrative: +2, historicalWeight: -4, perceivedGreatness: -5 },
    },
  },
  {
    id: 2,
    question: "Steve Smith scores 144 at Edgbaston, in his first Test back after the sandpaper ban. Or Ricky Ponting scores the same 144 in the same match, unremarkably. Same innings, different man. Does the story change the score?",
    a: {
      text: "Yes. The story is part of the innings.",
      emoji: "✍️",
      delta: { matchImpact: -4, conditions: -2, clutchness: 0, narrative: +12, historicalWeight: +2, perceivedGreatness: +2 },
    },
    b: {
      text: "No. The scorebook doesn't care.",
      emoji: "📐",
      delta: { matchImpact: +4, conditions: +4, clutchness: +4, narrative: -12, historicalWeight: +0, perceivedGreatness: +2 },
    },
  },
  {
    id: 3,
    question: "Bradman scores 334 against a mediocre England attack on a flat Headingley pitch. Or a lower-order batter scores 110 on a raging turner against a prime West Indies pace quartet in a must-win match. Whose innings matters more?",
    a: {
      text: "Bradman. The scale is incomparable.",
      emoji: "🏛️",
      delta: { matchImpact: -2, conditions: -8, clutchness: -4, narrative: +4, historicalWeight: +8, perceivedGreatness: +6 },
    },
    b: {
      text: "The 110. That was genuinely harder.",
      emoji: "🌩️",
      delta: { matchImpact: +4, conditions: +8, clutchness: +6, narrative: +2, historicalWeight: -8, perceivedGreatness: -6 },
    },
  },
  {
    id: 4,
    question: "Australia need 308 in the fourth innings. Last recognised batsman at the crease. The team around them collapses. They score 153* and win. Or: they score 153 in the first innings of a comfortable team victory. Same runs — different moment.",
    a: {
      text: "The chase. Pressure reveals everything.",
      emoji: "⚡",
      delta: { matchImpact: +6, conditions: +2, clutchness: +10, narrative: +2, historicalWeight: -4, perceivedGreatness: -2 },
    },
    b: {
      text: "First innings. Setting the foundation is underrated.",
      emoji: "🧱",
      delta: { matchImpact: +4, conditions: +2, clutchness: -10, narrative: +4, historicalWeight: +2, perceivedGreatness: -2 },
    },
  },
  {
    id: 5,
    question: "Viv Richards scores 291 at The Oval weeks after Tony Greig says he'll make West Indies 'grovel'. It's political, furious, loaded with meaning. Or: a technically perfect 291 by a neutral player in a forgettable series. Same score.",
    a: {
      text: "Richards. The meaning matters.",
      emoji: "✊",
      delta: { matchImpact: -2, conditions: 0, clutchness: 0, narrative: +14, historicalWeight: +4, perceivedGreatness: +4 },
    },
    b: {
      text: "The technically perfect one. Purity counts.",
      emoji: "📐",
      delta: { matchImpact: +4, conditions: +6, clutchness: +2, narrative: -14, historicalWeight: -4, perceivedGreatness: -4 },
    },
  },
  {
    id: 6,
    question: "Final question. Be honest with yourself. You're watching cricket with a mate and an innings finishes. What are you most likely to say?",
    a: {
      text: "\"That won them the game. That's what matters.\"",
      emoji: "🏆",
      delta: { matchImpact: +8, conditions: +2, clutchness: +4, narrative: -6, historicalWeight: -4, perceivedGreatness: -4 },
    },
    b: {
      text: "\"Mate, do you know the story of how he got here?\"",
      emoji: "🍺",
      delta: { matchImpact: -6, conditions: -2, clutchness: -2, narrative: +10, historicalWeight: +4, perceivedGreatness: +4 },
    },
  },
];

// PERSONA DEFINITIONS
// Matched based on final weight distribution

export const PERSONAS = [
  {
    id: 'purist',
    name: 'The Purist',
    emoji: '📐',
    tagline: 'What happened on the pitch — nothing else.',
    description: 'You don\'t care about the backstory, the politics, or who was watching. You want to know: how hard was it to score those runs, and what did they do to the match? The pitch doesn\'t lie.',
    colour: '#38bde8',
    match: w => w.conditions >= 22 && w.clutchness >= 20 && w.narrative <= 14,
  },
  {
    id: 'romantic',
    name: 'The Romantic',
    emoji: '✍️',
    tagline: 'Stories and tears over numbers.',
    description: 'Scorebooks are incomplete documents. The number on the board tells you nothing about the 13 months of recovery, the crowd holding its breath, or what it meant to the person holding the bat. You\'re here for all of it.',
    colour: '#d08840',
    match: w => w.narrative >= 28,
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    emoji: '📊',
    tagline: 'Context and difficulty above all.',
    description: 'The conditions, the bowling attack, the pitch — these are the variables that separate a great innings from a great score. You\'d rather see 104 against a prime West Indies attack than 380 against Zimbabwe. Degree of difficulty is everything.',
    colour: '#38bde8',
    match: w => w.matchImpact >= 30 && w.conditions >= 26,
  },
  {
    id: 'patriot',
    name: 'The Patriot',
    emoji: '🦘',
    tagline: 'Australia first, everywhere else second.',
    description: 'You appreciate great cricket wherever it comes from. You\'re just more likely to notice when it\'s green and gold. Ashes matches earn extra weight. A win in the Caribbean earns extra weight. The baggy green earns extra weight.',
    colour: '#f5c800',
    match: w => w.historicalWeight >= 22,
  },
  {
    id: 'clutch',
    name: 'The Believer',
    emoji: '⚡',
    tagline: 'Pressure is the only real test.',
    description: 'Hundreds scored in comfortable positions don\'t impress you. You want last-wicket stands, fourth-innings chases, must-win matches. The best innings are the ones where failure wasn\'t an option.',
    colour: '#e8382e',
    match: w => w.clutchness >= 26,
  },
  {
    id: 'default',
    name: 'The Balanced Observer',
    emoji: '🏏',
    tagline: 'You\'re open to a good argument from any direction.',
    description: 'You see value in all of it — the story, the context, the conditions, the moment. You don\'t want to overweight any single dimension. That makes you the most dangerous person to argue with at the pub.',
    colour: '#2dd65a',
    match: () => true, // fallback
  },
];

export function getPersona(weights) {
  return PERSONAS.find(p => p.match(weights)) || PERSONAS[PERSONAS.length - 1];
}

// APPLY DELTAS TO BASE WEIGHTS

export const BASE_WEIGHTS = {
  matchImpact: 20, conditions: 15, clutchness: 20,
  narrative: 20, historicalWeight: 15, perceivedGreatness: 10,
};

export function applyDeltas(answers) {
  const w = { ...BASE_WEIGHTS };
  answers.forEach(delta => {
    Object.keys(delta).forEach(k => {
      w[k] = Math.max(3, Math.min(50, (w[k] || 0) + delta[k]));
    });
  });
  return w;
}

export const PERSONA_BY_ID = Object.fromEntries(PERSONAS.map((p) => [p.id, p]));

/** The ranking order a finished quiz implies. */
export const orderForWeights = (weights) => orderFromWeights(weights);
