/**
 * The Pub Test: eight questions, four answers each. Every answer belongs to one persona, and a reader's
 * result is the persona they chose most (at least three times, and strictly ahead of the runner-up),
 * otherwise the Balanced Observer. Each persona hands the reader into the matching preset ranking.
 *
 * Draft, test results and the reasoning are in docs/drafts/pub-test-rebalance.md.
 */
import { PRESETS } from './scoring.js';

/** The four personas that can be chosen; answers are shuffled for each reader on screen. */
export const PICKS = ['purist', 'analyst', 'romantic', 'patriot'];
/** Fewest answers a persona needs before it is a clear result. */
export const CLEAR_RESULT_MIN = 3;

export const QUESTIONS = [
  {
    id: 1,
    question: 'Four hundreds, all 140 runs. Which one ranks highest?',
    options: [
      { persona: 'purist', text: 'A debut hundred on a damp, seaming pitch against a world-class attack.' },
      { persona: 'analyst', text: 'A fourth-innings chase that wins the Test.' },
      { persona: 'romantic', text: 'A comeback Test for a player who had been dropped and written off.' },
      { persona: 'patriot', text: 'An Ashes hundred for Australia at the MCG.' },
    ],
  },
  {
    id: 2,
    question: 'Your side is in trouble. Which hundred do you want to see?',
    options: [
      { persona: 'purist', text: 'A long, hard grind against a great attack on a pitch that is doing everything.' },
      { persona: 'analyst', text: 'One that turns a likely defeat into a draw or a win.' },
      { persona: 'romantic', text: 'One by a batter in his final Test, with the crowd on its feet.' },
      { persona: 'patriot', text: 'One by an Australian, in an Ashes Test, with the urn on the line.' },
    ],
  },
  {
    id: 3,
    question: 'The scorecard says: a hundred, and a win. What do you want to know next?',
    options: [
      { persona: 'purist', text: 'What was the pitch like, and how good was the bowling?' },
      { persona: 'analyst', text: 'How far behind was his side when he came in?' },
      { persona: 'romantic', text: 'Who was he, and what had he been through to get there?' },
      { persona: 'patriot', text: 'Was it against England?' },
    ],
  },
  {
    id: 4,
    question: 'A great hundred in a Test his side lost. How highly should it rank for greatness?',
    options: [
      { persona: 'purist', text: 'High. Runs against a great attack on a hard pitch are hard runs, whatever the scoreboard says.' },
      { persona: 'analyst', text: 'Lower. If it did not win or save the match, it is a good ton, not a ton of consequence.' },
      { persona: 'romantic', text: 'High, if it meant something: a farewell, a comeback, a stand against the odds.' },
      { persona: 'patriot', text: 'High, if he was one of ours and it was against England.' },
    ],
  },
  {
    id: 5,
    question: 'Which huge score would you rank highest?',
    options: [
      { persona: 'purist', text: "Hanif Mohammad's 337 over 16 hours, saving a Test West Indies looked certain to win." },
      { persona: 'analyst', text: "Astle's 222 off 168 balls against England, even in a losing chase. The numbers are absurd." },
      { persona: 'romantic', text: "Sobers' 365* at 21, a world record that stood for 36 years." },
      { persona: 'patriot', text: "Bradman's 334 at Headingley, our greatest at his peak." },
    ],
  },
  {
    id: 6,
    question: 'Which kind of pressure makes an innings the greatest?',
    options: [
      { persona: 'purist', text: 'Last pair together, 20 overs to survive, the draw on the line.' },
      { persona: 'analyst', text: 'Chasing 300 in the fourth innings.' },
      { persona: 'romantic', text: 'A farewell Test, final innings, the crowd on its feet.' },
      { persona: 'patriot', text: 'Facing England with the Ashes on the line.' },
    ],
  },
  {
    id: 7,
    question: 'If you were setting the ranking, what should it reward most?',
    options: [
      { persona: 'purist', text: 'How hard it was: the pitch, the weather and the attack.' },
      { persona: 'analyst', text: 'What it changed: win probability, partnerships and the result.' },
      { persona: 'romantic', text: 'The story: debuts, comebacks, farewells and redemption.' },
      { persona: 'patriot', text: 'Tradition: the Ashes, the records and the green and gold.' },
    ],
  },
  {
    id: 8,
    question: 'Which headline would make you stop and read?',
    options: [
      { persona: 'purist', text: '"The pitch nobody could bat on, and the one man who did."' },
      { persona: 'analyst', text: '"Win probability swung from 4 per cent to 96 per cent."' },
      { persona: 'romantic', text: '"The comeback nobody saw coming."' },
      { persona: 'patriot', text: '"Australia win back the Ashes."' },
    ],
  },
];

// PERSONAS: each hands the reader into one preset (see PRESETS in scoring.js).

export const PERSONAS = [
  {
    id: 'purist',
    name: 'The Purist',
    preset: 'Purist',
    colour: '#5fb8e8',
    tagline: 'How hard it was. Nothing else.',
    description: "You don't care about the backstory, the politics or who was watching. You want to know how hard those runs were to score, on what pitch, against whom, and with what on the line. The pitch doesn't lie.",
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    preset: 'Analyst',
    colour: '#a77be8',
    tagline: 'What it changed.',
    description: "You judge an innings by its effect: the win probability it moved, the partnership it built, the record it left. A hundred that wins a Test beats a double that doesn't. The numbers settle the argument.",
  },
  {
    id: 'romantic',
    name: 'The Romantic',
    preset: 'Romantic',
    colour: '#dd9650',
    tagline: 'Stories over numbers.',
    description: "A scorebook is an incomplete document. The number tells you nothing about the months of recovery, the crowd holding its breath, or what it meant to the person holding the bat. You're here for all of it.",
  },
  {
    id: 'patriot',
    name: 'The Patriot',
    preset: 'Patriot',
    colour: '#f0c23c',
    tagline: 'Australia first, the golden years most of all.',
    description: "You appreciate great cricket wherever it comes from. You're just more likely to notice when it's green and gold. Every Australian innings gets a bonus on your ranking, and the Border to Ponting years, 1989 to 2007, get a little more.",
  },
  {
    id: 'balanced',
    name: 'The Balanced Observer',
    preset: 'Default',
    colour: '#62d08c',
    tagline: "You're open to a good argument from any direction.",
    description: "You see value in all of it: the story, the conditions, the moment. You don't overweight any one thing, and your answers didn't favour a side. That makes you the most dangerous person to argue with at the pub.",
  },
];
export const PERSONA_BY_ID = Object.fromEntries(PERSONAS.map((p) => [p.id, p]));

/** How many answers went to each persona. `answers` is the list of personas the reader chose. */
export function tally(answers) {
  const counts = Object.fromEntries(PICKS.map((id) => [id, 0]));
  for (const a of answers) if (a in counts) counts[a] += 1;
  return counts;
}

/** The persona a set of answers points to: the most-chosen one if it is clear, otherwise the Balanced Observer. */
export function getPersona(answers) {
  const counts = tally(answers);
  const ranked = PICKS.map((id) => [id, counts[id]]).sort((a, b) => b[1] - a[1]);
  const [lead, runnerUp] = ranked;
  const clear = lead[1] >= CLEAR_RESULT_MIN && lead[1] > runnerUp[1];
  return PERSONA_BY_ID[clear ? lead[0] : 'balanced'];
}

/** The ranking a persona hands the reader into: an order of the criteria, and a bonus if it has one. */
export function rankingsFor(persona) {
  const preset = PRESETS[persona.preset];
  return { order: [...preset.order], bias: preset.bias };
}
