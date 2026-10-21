/** The card fonts (Barlow, the site's own typeface), decoded once from the embedded data. */
import { FONT_DATA } from './fontData.js';

let cached;
export function cardFonts() {
  cached ||= FONT_DATA.map(([name, weight, b64]) => {
    const buf = Buffer.from(b64, 'base64');
    return { name, weight, style: 'normal', data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  });
  return cached;
}
