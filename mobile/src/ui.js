import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { C, F } from './theme';
import { LEVERS, LEVER_BY_KEY, RANK_WEIGHTS, tierOf, BIASES } from '../../src/lib/scoring';

export const TIER_COLOR = { legendary: C.gold, elite: C.green, great: '#4fb6e6', notable: C.mute };

export const open = (url) => Linking.openURL(url).catch(() => {});

export function Chip({ label, on, onPress, small }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && s.chipOn, small && { paddingVertical: 4 }]}>
      <Text style={[s.chipText, on && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export const ChipRow = ({ children }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 4 }}>{children}</ScrollView>
);

export function Button({ label, onPress, primary, style }) {
  return (
    <Pressable onPress={onPress} style={[s.btn, primary && s.btnPrimary, style]}>
      <Text style={[s.btnText, primary && { color: C.bg }]}>{label}</Text>
    </Pressable>
  );
}

export const H = ({ children, style }) => <Text style={[s.h, style]}>{children}</Text>;
export const P = ({ children, style }) => <Text style={[s.p, style]}>{children}</Text>;
export const Small = ({ children, style }) => <Text style={[s.small, style]}>{children}</Text>;
export const Link = ({ url, children }) => <Text style={s.link} onPress={() => open(url)}>{children}</Text>;

export const SectionTitle = ({ children, right }) => (
  <View style={s.secRow}><Text style={s.sec}>{children}</Text>{right ? <Text style={s.secRight}>{right}</Text> : null}</View>
);

/** A small "ToC" mark for a ton of consequence. */
export const TocMark = () => (
  <View style={s.mark}><Text style={s.markText}>ToC</Text></View>
);

/** The round stamp, for the innings page. */
export function Stamp() {
  return (
    <View style={s.stamp}>
      <Text style={s.stampTop}>TON OF</Text>
      <Text style={s.stampMid}>ToC</Text>
      <Text style={s.stampTop}>CONSEQUENCE</Text>
    </View>
  );
}

export const TierTag = ({ score }) => {
  const t = tierOf(score);
  return <Text style={[s.tier, { color: TIER_COLOR[t.key], borderColor: TIER_COLOR[t.key] }]}>{t.label.toUpperCase()}</Text>;
};

/** The weighting as a coloured bar, one segment per criterion in the reader's order. */
export function WeightBar({ order }) {
  return (
    <View style={s.wbar}>
      {order.map((k, i) => <View key={k} style={{ flex: RANK_WEIGHTS[i], backgroundColor: LEVER_BY_KEY[k].hex }} />)}
    </View>
  );
}

export function Legend({ order }) {
  return (
    <View style={s.legend}>
      {order.map((k, i) => (
        <View key={k} style={s.legItem}>
          <View style={[s.dot, { backgroundColor: LEVER_BY_KEY[k].hex }]} />
          <Text style={s.legText}>{LEVER_BY_KEY[k].short} {RANK_WEIGHTS[i]}%</Text>
        </View>
      ))}
    </View>
  );
}

export const BiasNote = ({ bias }) => (BIASES[bias] ? <Text style={s.bias}><Text style={{ fontFamily: F.uiMed }}>{BIASES[bias].name} is on.</Text> {BIASES[bias].note} Every score includes it.</Text> : null);

export function Row({ left, title, sub, right, onPress, children }) {
  return (
    <Pressable onPress={onPress} style={s.row}>
      {left != null ? <Text style={s.rank}>{left}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
        {children}
      </View>
      {right}
    </Pressable>
  );
}

export const Screen = ({ children, scroll = true, style }) => (scroll
  ? <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={[{ padding: 16, gap: 12, paddingBottom: 40 }, style]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
  : <View style={[{ flex: 1, backgroundColor: C.bg }, style]}>{children}</View>);

export const LeverBar = ({ k, value, points, weight }) => {
  const l = LEVER_BY_KEY[k];
  return (
    <View style={{ gap: 4 }}>
      <View style={s.levHead}>
        <View style={[s.dot, { backgroundColor: l.hex }]} />
        <Text style={s.levName}>{l.name}</Text>
        {weight != null ? <Text style={s.levMeta}>{weight}%</Text> : null}
        <View style={{ flex: 1 }} />
        {points != null ? <Text style={s.levPts}>+{points}</Text> : null}
        <Text style={s.levVal}>{value}</Text>
      </View>
      <View style={s.track}><View style={{ width: `${value}%`, height: 6, backgroundColor: l.hex, borderRadius: 3 }} /></View>
    </View>
  );
};

export { LEVERS };

const s = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.gold, borderColor: C.gold },
  chipText: { color: C.soft, fontFamily: F.uiMed, fontSize: 13 },
  chipTextOn: { color: C.bg },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', backgroundColor: C.panel },
  btnPrimary: { backgroundColor: C.gold, borderColor: C.gold },
  btnText: { color: C.ink, fontFamily: F.uiMed, fontSize: 15 },
  h: { color: C.ink, fontFamily: F.displayBold, fontSize: 28 },
  p: { color: C.soft, fontFamily: F.ui, fontSize: 16, lineHeight: 23 },
  small: { color: C.mute, fontFamily: F.ui, fontSize: 13, lineHeight: 18 },
  link: { color: C.gold, fontFamily: F.uiMed, textDecorationLine: 'underline' },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 4, marginTop: 8 },
  sec: { color: C.mute, fontFamily: F.displayBold, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' },
  secRight: { color: C.mute, fontFamily: F.ui, fontSize: 12 },
  mark: { borderWidth: 1.5, borderColor: C.gold, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, alignSelf: 'flex-start' },
  markText: { color: C.gold, fontFamily: F.displayBold, fontSize: 12, letterSpacing: 1 },
  stamp: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  stampTop: { color: C.gold, fontFamily: F.displayBold, fontSize: 10, letterSpacing: 2 },
  stampMid: { color: C.gold, fontFamily: F.displayBold, fontSize: 30, lineHeight: 32 },
  tier: { fontFamily: F.displayBold, fontSize: 12, letterSpacing: 2, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3, alignSelf: 'flex-start' },
  wbar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legText: { color: C.soft, fontFamily: F.ui, fontSize: 12 },
  bias: { color: C.soft, fontFamily: F.ui, fontSize: 13, lineHeight: 18, backgroundColor: C.panel, borderLeftWidth: 3, borderLeftColor: C.gold, padding: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, gap: 12 },
  rank: { width: 34, color: C.mute, fontFamily: F.display, fontSize: 18 },
  rowTitle: { color: C.ink, fontFamily: F.displayBold, fontSize: 19 },
  rowSub: { color: C.mute, fontFamily: F.ui, fontSize: 12 },
  levHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levName: { color: C.ink, fontFamily: F.uiMed, fontSize: 14 },
  levMeta: { color: C.mute, fontFamily: F.ui, fontSize: 12 },
  levPts: { color: C.mute, fontFamily: F.ui, fontSize: 13 },
  levVal: { color: C.gold, fontFamily: F.displayBold, fontSize: 18, width: 34, textAlign: 'right' },
  track: { height: 6, borderRadius: 3, backgroundColor: C.line, overflow: 'hidden' },
});
