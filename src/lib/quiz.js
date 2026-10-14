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
    question: 'Four innings of 140. Which one goes highest?',
    options: [
      { persona: 'purist', text: 'A debut hundred on a damp, seaming pitch against a world-class attack.' },
      { persona: 'analyst', text: 'A fourth-innings chase that wins the Test.' },
      { persona: 'romantic', text: 'A comeback Test for a player who had been dropped and written off.' },
      { persona: 'patriot', text: 'An Ashes hundred for Australia at the MCG.' },
    ],
  },
  {
    id: 2,
    question: 'Which would you rather watch again?',
    options: [
      { persona: 'purist', text: "Tendulkar's 241* at the SCG in 2004, with the cover drive left out of his game." },
      { persona: 'analyst', text: "Lara's 153* at Bridgetown, dragging West Indies to a one-wicket win." },
      { persona: 'romantic', text: "Smith's 144 at Edgbaston, his first Test back after the ball-tampering ban." },
      { persona: 'patriot', text: "Ponting's 156 at Old Trafford, saving the Test for Australia." },
    ],
  },
  {
    id: 3,
    question: 'You tell a mate "great innings". What are you really saying?',
    options: [
      { persona: 'purist', text: '"That was hard. Anyone can score on a flat one."' },
      { persona: 'analyst', text: '"That decided the match. The numbers don\'t lie."' },
      { persona: 'romantic', text: '"That meant everything to him."' },
      { persona: 'patriot', text: '"He played it in the baggy green."' },
    ],
  },
  {
    id: 4,
    question: 'Whose bowling would you most like to see someone score a hundred against?',
    options: [
      { persona: 'purist', text: 'The 1976 West Indies pace quartet on a quick pitch.' },
      { persona: 'analyst', text: 'Any attack, as long as the hundred wins the game.' },
      { persona: 'romantic', text: "The bowler who is about to end a hero's career, in the batter's last Test." },
      { persona: 'patriot', text: 'England, in England, with the Ashes at stake.' },
    ],
  },
  {
    id: 5,
    question: 'Which huge score means the most to you?',
    options: [
      { persona: 'purist', text: "Hanif Mohammad's 337 over 16 hours, saving a Test West Indies looked certain to win." },
      { persona: 'analyst', text: "Astle's 222 off 168 balls against England, even in a losing chase. The numbers are absurd." },
      { persona: 'romantic', text: "Sobers' 365* at 21, a world record that stood for 36 years." },
      { persona: 'patriot', text: "Bradman's 334 at Headingley, our greatest at his peak." },
    ],
  },
  {
    id: 6,
    question: 'Which kind of pressure makes an innings?',
    options: [
      { persona: 'purist', text: 'Last pair together, 20 overs to survive, the draw on the line.' },
      { persona: 'analyst', text: 'Chasing 300 in the fourth innings.' },
      { persona: 'romantic', text: 'A farewell Test, final innings, the crowd on its feet.' },
      { persona: 'patriot', text: 'Facing England with the Ashes on the line.' },
    ],
  },
  {
    id: 7,
    question: 'What should a ranking reward most?',
    options: [
      { persona: 'purist', text: 'How hard it was: the pitch, the weather and the attack.' },
      { persona: 'analyst', text: 'What it changed: win probability, partnerships and the result.' },
      { persona: 'romantic', text: 'The story: debuts, comebacks, farewells and redemption.' },
      { persona: 'patriot', text: 'Tradition: the Ashes, the records and the green and gold.' },
    ],
  },
  {
    id: 8,
    question: 'Which headline would you click?',
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
