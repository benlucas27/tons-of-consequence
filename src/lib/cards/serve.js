import { ImageResponse } from 'next/og';
import { buildCard } from './build';
import { cardFonts } from './fonts';

/** The picture for a card type and its parameters, as a PNG response. `?download=1` makes the browser save it. */
export function serveCard(type, params, { filename } = {}) {
  const card = buildCard(type, params);
  if (!card) return new Response('No such card', { status: 404 });
  const res = new ImageResponse(card.jsx, { width: card.size.width, height: card.size.height, fonts: cardFonts() });
  res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  if (params.download) res.headers.set('Content-Disposition', `attachment; filename="${filename || `tons-of-consequence-${type}`}.png"`);
  return res;
}

/** The older /card/<type> addresses pass `format=portrait|wide`; the new engine calls the sizes `portrait`, `square` and (batter only) `wide`. */
export const sizeOf = (sp) => (sp.get('format') === 'wide' ? 'wide' : sp.get('format') === 'square' ? 'square' : 'portrait');
