import { PERSONA_BY_ID, PICKS } from '@/lib/quiz';
import { PRESETS } from '@/lib/scoring';
import { C, Header, Footer, Frame, cardImage, formatOf } from '@/lib/cards';

export const runtime = 'nodejs';

/** The Pub Test result as a card: /card/persona/purist?c=3,2,2,1 (counts in the order purist, analyst, romantic, patriot). */
export async function GET(req, { params }) {
  const sp = new URL(req.url).searchParams;
  const { id } = await params;
  const persona = PERSONA_BY_ID[id];
  if (!persona) return new Response('No such persona', { status: 404 });
  const fmt = formatOf(sp);
  const big = fmt === 'portrait';
  const counts = (sp.get('c') || '').split(',').map((n) => Math.max(0, Math.min(8, Number(n) || 0)));
  const showCounts = counts.length === PICKS.length;
  const preset = PRESETS[persona.preset];
  const el = (
    <Frame pad={big ? '56px 60px' : '36px 48px'}>
      <Header right="THE PUB TEST" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: big ? 18 : 10 }}>
        <div style={{ display: 'flex', fontSize: big ? 34 : 26, letterSpacing: 6, color: C.mute }}>I&apos;M</div>
        <div style={{ display: 'flex', fontSize: big ? 128 : 84, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1, color: persona.colour }}>{persona.name}</div>
        <div style={{ display: 'flex', fontSize: big ? 46 : 32, color: C.ink, maxWidth: 900 }}>{persona.tagline}</div>
        <div style={{ display: 'flex', fontSize: big ? 30 : 22, color: C.soft, maxWidth: 940, marginTop: 6 }}>{`My ranking: ${persona.preset}.${preset && preset.blurb ? ` ${preset.blurb}` : ''}`.slice(0, big ? 190 : 120)}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {showCounts && (
          <div style={{ display: 'flex', gap: 14 }}>
            {PICKS.map((id, i) => (
              <div key={id} style={{ display: 'flex', flex: 1, flexDirection: 'column', padding: '12px 18px', background: C.panel, border: `2px solid ${id === persona.id ? persona.colour : C.line}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', fontSize: big ? 52 : 36, fontWeight: 700, lineHeight: 1 }}>{counts[i]}</div>
                <div style={{ display: 'flex', fontSize: 20, letterSpacing: 2, color: C.mute, textTransform: 'uppercase' }}>{PERSONA_BY_ID[id].name.replace('The ', '')}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', fontSize: big ? 34 : 26, color: C.gold }}>Which cricket fan are you? Take the Pub Test.</div>
      </div>
      <Footer text="8 questions, 1 minute" />
    </Frame>
  );
  return cardImage(el, fmt, sp, `toc-pub-test-${persona.id}`);
}
