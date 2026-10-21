/** The page on tonsofconsequence.com that each X card should send people to. Used by the queue builder and the one-off link patch. */
import { BY_ID, inningsPath, rankingsPath } from '../src/lib/dataset.js';
import { parseOrder, parseBias, DEFAULT_ORDER } from '../src/lib/scoring.js';

export function linkFor(card) {
  switch (card.type) {
    case 'batter': return `/tons-of-consequence/${card.b}`;
    case 'compare': return '/compare';
    case 'innings': return inningsPath(BY_ID.get(Number(card.id)));
    case 'rankings': return rankingsPath(parseOrder(card.o) || DEFAULT_ORDER, parseBias(card.bonus));
    default: return '/tons-of-consequence'; // board, laws
  }
}
