/**
 * A story made only of facts we hold: who, how many, against whom, where, when, and how the match ended.
 * Nothing in it is an opinion or an unsourced claim, so it can sit on any innings page.
 */
import { NATIONS } from './scoring.js';

export function factsStory(c) {
  const team = NATIONS[c.country] || c.country;
  const runs = `${c.runs}${c.notOut ? '*' : ''}`;
  const balls = c.balls ? ` off ${c.balls} balls` : '';
  const where = c.venue ? ` at ${c.venue}` : '';
  const first = `${c.name} made ${runs}${balls} against ${c.opponent}${where} in ${c.year}.`;
  const outcome = { win: `${team} won the match.`, loss: `${team} lost the match.`, draw: 'The match was drawn.', tie: 'The match was tied.', live: 'The match was still being played.' }[c.matchResult];
  return outcome ? `${first} ${outcome}` : first;
}
