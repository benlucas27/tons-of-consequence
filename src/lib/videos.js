/** Video links for innings (data in src/data/videos.js). */
import { VIDEOS } from '../data/videos.js';

export { VIDEOS };
export const KIND_LABEL = { innings: 'This innings', match: 'Match highlights' };
export const videoFor = (id) => VIDEOS[id] || null;
export const watchUrl = (yt) => `https://www.youtube.com/watch?v=${yt}`;
/** The privacy-enhanced player: no cookies are set until the reader presses play. */
export const embedSrc = (yt) => `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`;
