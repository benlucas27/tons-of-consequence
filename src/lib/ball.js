/**
 * The cricket ball mark, drawn from a few numbers: a leather ball with a raised seam running
 * across it and a row of cream stitches either side. One source feeds the header logo, the
 * favicon and the share image, so they always match.
 */

const C = 20; // centre of the 40 x 40 viewBox
const R = 18.6; // ball radius
const TILT = -24; // degrees: tips the seam so the ball looks like it is turning

const rot = ([x, y]) => {
  const a = (TILT * Math.PI) / 180;
  const dx = x - C;
  const dy = y - C;
  return [C + dx * Math.cos(a) - dy * Math.sin(a), C + dx * Math.sin(a) + dy * Math.cos(a)];
};

// The seam: a gentle arc across the ball (before tilting).
const P = [[-2, 24], [11, 13.5], [29, 13.5], [42, 24]];
const bez = (t) => {
  const u = 1 - t;
  return [0, 1].map((i) => u ** 3 * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t ** 3 * P[3][i]);
};
const tangent = (t) => {
  const u = 1 - t;
  const d = [0, 1].map((i) => 3 * u * u * (P[1][i] - P[0][i]) + 6 * u * t * (P[2][i] - P[1][i]) + 3 * t * t * (P[3][i] - P[2][i]));
  const len = Math.hypot(d[0], d[1]);
  return [d[0] / len, d[1] / len];
};
const inside = ([x, y], margin) => Math.hypot(x - C, y - C) <= R - margin;
const f = (n) => Math.round(n * 100) / 100;

function seamPath() {
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const p = bez(i / 80);
    if (inside(p, 0.4)) pts.push(rot(p));
  }
  return pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('');
}

function stitchPath() {
  const out = [];
  const rows = [-3.4, 3.4];
  const count = 15;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const [tx, ty] = tangent(t);
    const nx = -ty;
    const ny = tx;
    for (const off of rows) {
      const cx = bez(t)[0] + nx * off;
      const cy = bez(t)[1] + ny * off;
      // each stitch leans a little along the seam, like thread pulled across it
      const dx = nx * 0.9 + tx * 0.42;
      const dy = ny * 0.9 + ty * 0.42;
      const a = [cx - dx * 1.5, cy - dy * 1.5];
      const b = [cx + dx * 1.5, cy + dy * 1.5];
      if (inside(a, 1.4) && inside(b, 1.4)) {
        const ra = rot(a);
        const rb = rot(b);
        out.push(`M${f(ra[0])} ${f(ra[1])}L${f(rb[0])} ${f(rb[1])}`);
      }
    }
  }
  return out.join('');
}

export const BALL = {
  c: C,
  r: R,
  seam: seamPath(),
  stitches: stitchPath(),
  leather: '#c0301f',
  leatherDark: '#7d170d',
  rim: '#5a0e07',
  thread: '#f4ead0',
};

/** The mark as a standalone SVG string (for the favicon and the share image). */
export function ballSvg(size = 40) {
  const b = BALL;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">` +
    `<circle cx="${b.c}" cy="${b.c}" r="${b.r}" fill="${b.leather}"/>` +
    `<ellipse cx="14" cy="12" rx="9" ry="6" transform="rotate(-30 14 12)" fill="#fff" opacity=".14"/>` +
    `<path d="${b.seam}" fill="none" stroke="${b.leatherDark}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="${b.stitches}" fill="none" stroke="${b.thread}" stroke-width="1.35" stroke-linecap="round"/>` +
    `<circle cx="${b.c}" cy="${b.c}" r="${b.r}" fill="none" stroke="${b.rim}" stroke-width="1.4"/>` +
    `</svg>`
  );
}
