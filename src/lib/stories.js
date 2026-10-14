import { factsStory } from './factsStory.js';

/**
 * Where a story stands:
 *  'sourced'   has two or more sources (or the older hand-checked sources note)
 *  'facts'     is the facts-only line built from our own data, so there is nothing to source
 *  'unsourced' is hand-written text that has not been sourced yet
 */
export function storyStatus(c) {
  if ((c.sourceLinks && c.sourceLinks.length >= 2) || c.sources) return 'sourced';
  if (c.story === factsStory(c)) return 'facts';
  return 'unsourced';
}
