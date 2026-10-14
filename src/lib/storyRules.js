/**
 * The rules every sourced story must pass before it is accepted (scripts/set-story.mjs and the tests use this).
 * A story is a set of facts that can be shown, so: no opinion dressed as fact, no names we have not checked, and at
 * least two https sources someone can open.
 */
import { inventedSentences } from './storyCheck.js';

export const MIN_SOURCES = 2;
export const MAX_CHARS = 600;
export const MIN_CHARS = 80;
export const MAX_SENTENCES = 5;

// words that are opinion or hype rather than fact; a source can carry them as a quote, but not as our voice
const HYPE = /\b(legendary|greatest|best ever|unforgettable|magnificent|masterpiece|breathtaking|miracle|genius|immortal|epic|stunning|incredible|amazing|glorious|iconic|monumental)\b/i;

/** Returns a list of problems; an empty list means the story passes. `c` is the innings row (name, runs, opponent, year). */
export function checkStory({ story, sources }, c) {
  const problems = [];
  const text = String(story || '').trim();
  if (text.length < MIN_CHARS) problems.push(`Too short (${text.length} characters, at least ${MIN_CHARS}).`);
  if (text.length > MAX_CHARS) problems.push(`Too long (${text.length} characters, at most ${MAX_CHARS}). Say less, and only what you can source.`);
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > MAX_SENTENCES) problems.push(`${sentences.length} sentences, at most ${MAX_SENTENCES}.`);
  if (/[!?]/.test(text)) problems.push('No questions or exclamation marks: state facts.');
  if (HYPE.test(text)) problems.push(`Opinion words are not facts (${text.match(HYPE)[0]}). Describe what happened instead.`);
  if (inventedSentences(text).length) problems.push('Names bowlers from the old generator’s guesses. Only name a bowler if a source does.');
  if (c) {
    const surname = String(c.name).split(' ').pop();
    if (!text.includes(surname)) problems.push(`Should mention ${surname}.`);
    if (!new RegExp(`\\b${c.runs}\\b`).test(text)) problems.push(`Should state the score (${c.runs}).`);
    if (!text.includes(c.opponent) && !text.includes(String(c.year))) problems.push(`Should say who it was against (${c.opponent}) or when (${c.year}).`);
  }
  const urls = (sources || []).map((s) => s.url);
  const valid = urls.filter((u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } });
  if (valid.length < urls.length) problems.push('Every source must be an https link.');
  if (new Set(valid).size < MIN_SOURCES) problems.push(`Needs at least ${MIN_SOURCES} different https sources.`);
  for (const s of sources || []) if (!s.label || s.label.length < 3) problems.push(`Source ${s.url} needs a label (who published it).`);
  return problems;
}
