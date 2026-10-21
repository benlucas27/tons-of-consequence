/** Shared look for the share cards (PNG images made by the /card routes). */
import { ImageResponse } from 'next/og';
import { ballSvg } from './ball';

export const SIZES = { portrait: { width: 1080, height: 1350 }, wide: { width: 1200, height: 630 } };
export const C = { bg: '#0b1c13', line: '#2a4d3b', ink: '#f2ead4', soft: '#bccbbf', mute: '#88a493', red: '#e85a40', gold: '#f0c23c', green: '#62d08c', panel: '#12291c' };

export const formatOf = (sp) => (sp.get('format') === 'wide' ? 'wide' : 'portrait');

export const Header = ({ right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26, letterSpacing: 6, color: C.mute }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" width={40} height={40} src={`data:image/svg+xml;utf8,${encodeURIComponent(ballSvg(40))}`} />
      TONS OF CONSEQUENCE
    </div>
    <div style={{ display: 'flex' }}>{right || ''}</div>
  </div>
);

export const Footer = ({ text }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: C.mute, borderTop: `2px solid ${C.line}`, paddingTop: 18 }}>
    <div style={{ display: 'flex' }}>{text}</div>
    <div style={{ display: 'flex' }}>tonsofconsequence.com</div>
  </div>
);

export const Frame = ({ children, pad }) => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: C.bg, border: `10px solid ${C.line}`, padding: pad, color: C.ink }}>{children}</div>
);

export const Chip = ({ kind }) => {
  const m = { toc: ['TON OF CONSEQUENCE', C.green], good: ['GOOD TON', C.soft], none: ['NOT MEASURED YET', C.mute] }[kind];
  return <div style={{ display: 'flex', fontSize: 20, letterSpacing: 2, whiteSpace: 'nowrap', color: m[1], border: `2px solid ${m[1]}`, borderRadius: 6, padding: '4px 12px' }}>{m[0]}</div>;
};

/** Wrap an element as a PNG response. ?download=1 makes the browser save it. */
export function cardImage(element, fmt, sp, filename) {
  const headers = { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' };
  if (sp.get('download') === '1') headers['Content-Disposition'] = `attachment; filename="${filename}.png"`;
  return new ImageResponse(element, { ...SIZES[fmt], headers });
}
