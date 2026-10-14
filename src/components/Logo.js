import { BALL } from '@/lib/ball';

/** The cricket ball mark. Geometry lives in src/lib/ball.js so the favicon and share image match. */
export default function Logo({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx={BALL.c} cy={BALL.c} r={BALL.r} fill={BALL.leather} />
      <ellipse cx="14" cy="12" rx="9" ry="6" transform="rotate(-30 14 12)" fill="#fff" opacity=".14" />
      <path d={BALL.seam} fill="none" stroke={BALL.leatherDark} strokeWidth="2.6" strokeLinecap="round" />
      <path d={BALL.stitches} fill="none" stroke={BALL.thread} strokeWidth="1.35" strokeLinecap="round" />
      <circle cx={BALL.c} cy={BALL.c} r={BALL.r} fill="none" stroke={BALL.rim} strokeWidth="1.4" />
    </svg>
  );
}
