/** Hello Sport moments, as the site uses them (data in src/data/hello-sport.js, built from the markdown index). */
import { MOMENTS, EPISODES, ORIGIN } from '../data/hello-sport.js';

export { MOMENTS, EPISODES, ORIGIN };

export const clock = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};
export const watchUrl = (id, start) => `https://www.youtube.com/watch?v=${id}&t=${start}s`;
export const embedUrl = (id, start) => `https://www.youtube-nocookie.com/embed/${id}?start=${start}&autoplay=1&rel=0`;

/** The moments that are about one innings (a knock, or an older innings mentioned in passing). */
export const momentsFor = (inningsId) => MOMENTS.filter((m) => m.inningsId === inningsId);

/** How a moment is described: "Hello Sport #946, 12 Oct 2026". */
export function episodeLabel(m) {
  const ep = EPISODES[m.youtubeId];
  const d = new Date(`${m.date}T00:00:00Z`);
  const date = Number.isNaN(d.getTime()) ? m.date : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${(ep?.episode || m.episode).startsWith('Live') ? `Hello Sport live: ${(ep?.episode || m.episode).replace(/^Live: /, '')}` : `Hello Sport ${ep?.episode || m.episode}`}, ${date}`;
}
