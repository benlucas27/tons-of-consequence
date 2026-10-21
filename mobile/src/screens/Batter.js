import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BATTER_BY_SLUG, verdictOf, wherePlayed, notMeasuredReason, NOT_MEASURED_LABEL } from '../../../src/lib/consequence';
import { TIERS, WHERE_LABEL } from '../../../src/lib/matchFacts';
import { runsText, RESULT_LABEL } from '../../../src/lib/format';
import { careerMomentsFor, watchUrl, clock, episodeLabel } from '../../../src/lib/helloSport';
import { shareCard } from '../share';
import { Screen, H, P, Small, Link, SectionTitle, Button } from '../ui';
import { C, F } from '../theme';

function notMeasuredSummary(b) {
  const n = {};
  for (const c of b.innings) if (!verdictOf(c.id)) { const k = notMeasuredReason(c).kind; n[k] = (n[k] || 0) + 1; }
  return Object.entries(n).map(([k, v]) => `${v} ${NOT_MEASURED_LABEL[k]}`).join(', ');
}

export default function Batter({ route, navigation }) {
  const b = BATTER_BY_SLUG.get(route.params.slug);
  if (!b) return <Screen><P>Batter not found.</P></Screen>;
  const moments = careerMomentsFor(b.name);
  return (
    <Screen>
      <H style={{ fontSize: 34 }}>{b.name}</H>
      <P>{b.hundreds} Test hundreds. {b.measured ? <>Of the {b.measured} we can measure, <Text style={{ color: C.gold, fontFamily: F.uiMed }}>{b.tons}</Text> were tons of consequence.</> : 'We cannot measure any of them yet.'}{b.measured < b.hundreds && b.measured > 0 ? ` The other ${b.hundreds - b.measured} are not measured yet: ${notMeasuredSummary(b)}.` : ''}</P>
      <Button label="Share as a card" primary onPress={() => shareCard(`/card/batter/${b.slug}`, `toc-${b.slug}`)} />

      <SectionTitle>Who against, and where</SectionTitle>
      <View style={s.table}>
        <View style={s.tr}><Text style={[s.td, { flex: 1 }]} /><Text style={s.th}>Hundreds</Text>{b.measured > 0 ? <Text style={s.th}>ToCs</Text> : null}</View>
        {TIERS.map((t) => (b.byTier[t.n] ? (
          <View key={t.n} style={s.tr}><View style={{ flex: 1 }}><Text style={s.td}>{t.name}</Text><Small>{t.teams}</Small></View><Text style={s.num}>{b.byTier[t.n]}</Text>{b.measured > 0 ? <Text style={s.num}>{b.tonsByTier[t.n] || 0}</Text> : null}</View>
        ) : null))}
        {['H', 'A', 'N'].map((w) => (b.byWhere[w] ? (
          <View key={w} style={s.tr}><Text style={[s.td, { flex: 1 }]}>{WHERE_LABEL[w]}</Text><Text style={s.num}>{b.byWhere[w]}</Text><Text style={s.num}>{b.tonsByWhere[w] || 0}</Text></View>
        ) : null))}
      </View>
      <Small>The tiers are a fixed grouping of countries, not a rating on the day. Where it was played is only known for hundreds we have the match record for.</Small>

      <SectionTitle>Every hundred</SectionTitle>
      {b.innings.map((c) => {
        const v = verdictOf(c.id);
        const where = wherePlayed(c.id);
        return (
          <Pressable key={c.id} onPress={() => navigation.navigate('Innings', { id: c.id })} style={[s.card, { borderLeftColor: v ? (v.passes ? C.gold : C.line) : C.mute }]}>
            <Text style={s.cTitle}>{runsText(c)} <Text style={s.cSub}>v {c.opponent}, {c.venue}, {c.year}{where ? ` · ${WHERE_LABEL[where]}` : ''}{c.matchResult && c.matchResult !== 'unknown' ? ` · ${RESULT_LABEL[c.matchResult] || ''}` : ''}</Text></Text>
            {v ? (
              <P><Text style={{ color: C.ink, fontFamily: F.uiMed }}>{v.passes ? `A ton of consequence: ${v.scenario.toLowerCase()}.` : 'A good ton.'}</Text> {v.because}</P>
            ) : (
              <P><Text style={{ color: C.ink, fontFamily: F.uiMed }}>Not measured.</Text> {notMeasuredReason(c).text}</P>
            )}
          </Pressable>
        );
      })}

      {moments.length > 0 ? (
        <>
          <SectionTitle>Hello Sport on {b.name}</SectionTitle>
          {moments.map((m) => (
            <View key={`${m.youtubeId}-${m.start}`} style={s.moment}>
              <Small>{episodeLabel(m)}</Small><P>{m.note}</P>
              <Link url={watchUrl(m.youtubeId, m.start)}>Listen from {clock(m.start)}</Link>
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  table: { backgroundColor: C.panel, borderRadius: 10, paddingHorizontal: 12 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, gap: 8 },
  th: { width: 70, color: C.mute, fontFamily: F.uiMed, fontSize: 12, textAlign: 'right' },
  td: { color: C.ink, fontFamily: F.uiMed, fontSize: 14 },
  num: { width: 70, color: C.gold, fontFamily: F.displayBold, fontSize: 18, textAlign: 'right' },
  card: { backgroundColor: C.panel, borderRadius: 10, padding: 12, gap: 4, borderLeftWidth: 4 },
  cTitle: { color: C.ink, fontFamily: F.displayBold, fontSize: 22 },
  cSub: { color: C.mute, fontFamily: F.ui, fontSize: 13 },
  moment: { backgroundColor: C.panel, borderRadius: 10, padding: 12, gap: 4 },
});
