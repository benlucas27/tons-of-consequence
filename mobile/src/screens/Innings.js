import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { rankAll, otherInningsBy } from '../../../src/lib/dataset';
import { RANK_WEIGHTS, NATIONS, biasPoints, BIASES, weightQuery } from '../../../src/lib/scoring';
import { verdictOf, wherePlayed } from '../../../src/lib/consequence';
import { oppositionLabel, otherHundredsLabel, WHERE_LABEL } from '../../../src/lib/matchFacts';
import { calcVolatility, volatilityTier } from '../../../src/lib/volatility';
import { momentsFor, watchUrl, clock, episodeLabel } from '../../../src/lib/helloSport';
import { videoFor, watchUrl as ytUrl, KIND_LABEL } from '../../../src/lib/videos';
import { storyStatus } from '../../../src/lib/stories';
import { INNINGS_FACTS } from '../../../src/data/innings-facts';
import { NIGHT_WATCHMAN } from '../../../src/data/night-watchman';
import { fmt1, ord, runsText, RESULT_LABEL } from '../../../src/lib/format';
import { useWeighting } from '../weighting';
import { shareCard } from '../share';
import { Screen, H, P, Small, Link, SectionTitle, Stamp, TierTag, Button, LeverBar, BiasNote, open } from '../ui';
import { C, F } from '../theme';

const Fact = ({ k, v }) => (v ? <View style={s.fact}><Text style={s.fk}>{k}</Text><Text style={s.fv}>{v}</Text></View> : null);

export default function Innings({ route, navigation }) {
  const { id } = route.params;
  const { order, bias } = useWeighting();
  const ranked = useMemo(() => rankAll(order, bias), [order, bias]);
  const c = ranked.find((x) => x.id === id);
  const others = useMemo(() => (c ? otherInningsBy(c, order, bias).slice(0, 6) : []), [c, order, bias]);
  if (!c) return <Screen><P>Innings not found.</P></Screen>;

  const v = verdictOf(c.id);
  const vol = calcVolatility(c);
  const vt = volatilityTier(vol.volatility);
  const bonus = biasPoints(c, bias);
  const recent = c.year >= 2020 ? ranked.filter((x) => x.year >= 2020) : null;
  const home = ranked.filter((x) => x.country === c.country);
  const nw = NIGHT_WATCHMAN[c.id];
  const where = WHERE_LABEL[wherePlayed(c.id)];
  const moments = momentsFor(c.id);
  const video = videoFor(c.id);

  return (
    <Screen>
      <Small>{NATIONS[c.country] || c.country} · {RESULT_LABEL[c.matchResult] || ''}</Small>
      <H style={{ fontSize: 34 }}>{c.name}</H>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <Text style={s.runs}>{c.runs}{c.notOut ? '*' : ''}</Text>
        {c.balls ? <Text style={s.balls}>off {c.balls} balls</Text> : null}
      </View>
      <Small>v {c.opponent}{c.venue ? ` · ${c.venue}` : ''} · {c.year}</Small>

      <View style={s.scoreCard}>
        <Text style={s.big}>{fmt1(c.toc)}</Text>
        <View style={{ gap: 4 }}><TierTag score={c.toc} /><Small>Greatness score</Small></View>
      </View>

      {c.story ? <Text style={s.quote}>{c.story}</Text> : <Small>No written story for this innings yet.</Small>}
      {c.sourceLinks && c.sourceLinks.length > 0 ? <Small>Sources: {c.sourceLinks.map((x, i) => <Text key={x.url}>{i ? ' · ' : ''}<Link url={x.url}>{x.label}</Link></Text>)}</Small> : null}
      {storyStatus(c) === 'unsourced' ? <Small>Not yet sourced: this write-up is waiting for two sources.</Small> : null}

      <SectionTitle>Was it a ton of consequence?</SectionTitle>
      {v ? (
        <View style={[s.verdict, v.passes && { borderColor: C.gold }]}>
          {v.passes ? <Stamp /> : null}
          <P style={{ flex: 1 }}><Text style={{ color: C.ink, fontFamily: F.uiMed }}>{v.passes ? `Yes: ${v.scenario.toLowerCase()}.` : 'No: a good ton.'}</Text> {v.because}</P>
        </View>
      ) : (
        <P><Text style={{ color: C.ink, fontFamily: F.uiMed }}>Not enough match data yet to say.</Text> We have not found enough about this match (the result, which innings it was and where the series stood) to call it either way.</P>
      )}
      {v && v.press.length > 0 ? <Small>Called one of the greats: {v.press.map((a, i) => <Text key={a.url}>{i ? '; ' : ''}<Link url={a.url}>{a.title}</Link> ({a.source})</Text>)}</Small> : null}
      {v && v.sources.length > 0 ? <Small>Sources: {v.sources.map((a, i) => <Text key={a.url}>{i ? ' · ' : ''}<Link url={a.url}>{a.label}</Link></Text>)}</Small> : null}
      {v ? <Small><Text style={{ color: C.soft, fontFamily: F.uiMed }}>{v.confidence.label}.</Text> {v.confidence.note}</Small> : null}

      {video ? <Button label={`▶ Watch: ${KIND_LABEL[video.kind] || 'video'}`} onPress={() => open(ytUrl(video.yt))} /> : null}

      {moments.length > 0 ? (
        <>
          <SectionTitle>Hello Cricket</SectionTitle>
          {moments.map((m) => (
            <View key={`${m.youtubeId}-${m.start}`} style={s.moment}>
              <Small>{episodeLabel(m)}</Small>
              <P>{m.note}</P>
              <Link url={watchUrl(m.youtubeId, m.start)}>Listen from {clock(m.start)}</Link>
            </View>
          ))}
        </>
      ) : null}

      {c.facts ? <><SectionTitle>Match notes</SectionTitle>{c.facts.map((f) => <P key={f}>• {f}</P>)}</> : null}

      <SectionTitle right="score · points">How the score is built</SectionTitle>
      {order.map((k, i) => <LeverBar key={k} k={k} value={c.levers[k] || 0} points={fmt1(((c.levers[k] || 0) * RANK_WEIGHTS[i]) / 100)} weight={RANK_WEIGHTS[i]} />)}
      {bonus > 0 ? <Small>{BIASES[bias].name}: +{fmt1(bonus)}</Small> : null}
      <BiasNote bias={bias} />
      <Small>Greatness score on your weighting: <Text style={{ color: C.gold, fontFamily: F.displayBold, fontSize: 18 }}>{fmt1(c.toc)}</Text>. Change the weighting on the Rankings tab.</Small>

      <SectionTitle>How divisive is it?</SectionTitle>
      <P><Text style={{ color: C.ink, fontFamily: F.uiMed }}>{vt.label}, {vol.volatility}.</Text> {vt.desc} Across five points of view it scores between {vol.min} and {vol.max}.</P>

      <SectionTitle>The facts</SectionTitle>
      <View style={s.facts}>
        <Fact k="Rank overall" v={`${ord(c.rank)} of ${ranked.length.toLocaleString()}`} />
        {recent ? <Fact k="Since 2020" v={`${ord(recent.findIndex((x) => x.id === c.id) + 1)} of ${recent.length.toLocaleString()}`} /> : null}
        <Fact k={NATIONS[c.country] || c.country} v={`${ord(home.findIndex((x) => x.id === c.id) + 1)} of ${home.length.toLocaleString()}`} />
        <Fact k="Strike rate" v={c.balls ? fmt1((c.runs / c.balls) * 100) : null} />
        <Fact k="Match" v={RESULT_LABEL[c.matchResult]} />
        <Fact k="Opposition" v={oppositionLabel(c.opponent, c.year)} />
        <Fact k="Role" v={nw ? (nw.debated ? 'Night watchman (classification debated)' : 'Night watchman') : null} />
        <Fact k="Other hundreds" v={otherHundredsLabel(INNINGS_FACTS[c.id])} />
        <Fact k="Played" v={where} />
      </View>

      <Button label="Share as a card" primary onPress={() => shareCard(`/card/innings/${c.id}${weightQuery(order, bias)}`, `toc-innings-${c.id}`)} />
      <Button label="Share a wide card" onPress={() => shareCard(`/card/innings/${c.id}${weightQuery(order, bias)}${weightQuery(order, bias) ? '&' : '?'}format=wide`, `toc-innings-${c.id}-wide`)} />

      {others.length > 0 ? (
        <>
          <SectionTitle>More from {c.name}</SectionTitle>
          {others.map((o) => (
            <Pressable key={o.id} style={s.other} onPress={() => navigation.push('Innings', { id: o.id })}>
              <View style={{ flex: 1 }}><Text style={s.on}>{runsText(o)} v {o.opponent}</Text><Small>{[o.venue, o.year].filter(Boolean).join(' · ')} · {ord(o.rank)} overall</Small></View>
              <Text style={s.os}>{fmt1(o.toc)}</Text>
            </Pressable>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  runs: { color: C.ink, fontFamily: F.displayBold, fontSize: 64, lineHeight: 68 },
  balls: { color: C.mute, fontFamily: F.ui, fontSize: 16, paddingBottom: 10 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.panel, borderRadius: 12, padding: 14 },
  big: { color: C.gold, fontFamily: F.displayBold, fontSize: 56 },
  quote: { color: C.ink, fontFamily: F.serif, fontSize: 18, lineHeight: 26 },
  verdict: { flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12 },
  moment: { backgroundColor: C.panel, borderRadius: 10, padding: 12, gap: 4 },
  facts: { backgroundColor: C.panel, borderRadius: 10, paddingHorizontal: 12 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, gap: 12 },
  fk: { color: C.mute, fontFamily: F.ui, fontSize: 14 },
  fv: { color: C.ink, fontFamily: F.uiMed, fontSize: 14, flexShrink: 1, textAlign: 'right' },
  other: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.panel, borderRadius: 10, padding: 12 },
  on: { color: C.ink, fontFamily: F.displayBold, fontSize: 18 },
  os: { color: C.gold, fontFamily: F.displayBold, fontSize: 22 },
});
