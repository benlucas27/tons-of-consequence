import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WOMENS, WOMENS_TONS, WOMENS_BATTERS, WOMENS_TOTAL, WOMENS_BALL_BY_BALL, RESULT_WORD } from '../../../src/lib/womens';
import { Screen, H, P, Small, SectionTitle, Chip } from '../ui';
import { C, F } from '../theme';

const dateText = (d) => d.slice(0, 4);

export default function Womens() {
  const [all, setAll] = useState(false);
  const list = all ? WOMENS : WOMENS_TONS;
  const leaders = WOMENS_BATTERS.filter((b) => b.tons > 0).slice(0, 8);
  return (
    <Screen>
      <H>Women’s ToCs</H>
      <P>There have been {WOMENS_TOTAL} hundreds in women’s Tests. {WOMENS_TONS.length} of them were tons of consequence: the hundred won the match, or saved it. The same 13 laws as the men’s game apply.</P>
      <Small>Only {WOMENS_BALL_BY_BALL} of the {WOMENS_TOTAL} hundreds have a ball-by-ball record, so most verdicts rest on the result and match reports. A draw only counts when the ball-by-ball record shows the hundred saved it, so almost every drawn Test here is a good ton.</Small>
      <SectionTitle>The batters with the most</SectionTitle>
      <View style={s.table}>
        {leaders.map((b) => (
          <View key={b.name} style={s.tr}><View style={{ flex: 1 }}><Text style={s.td}>{b.name}</Text><Small>{b.team}</Small></View><Text style={s.num}>{b.tons}</Text><Small>of {b.hundreds}</Small></View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label={`The ${WOMENS_TONS.length} ToCs`} on={!all} onPress={() => setAll(false)} />
        <Chip label="Every hundred" on={all} onPress={() => setAll(true)} />
      </View>
      {list.map((h) => (
        <View key={h.no} style={[s.card, { borderLeftColor: h.ton ? C.gold : C.line }]}>
          <Text style={s.cTitle}>{h.name} {h.runs} <Text style={s.cSub}>{h.team} v {h.opponent}, {h.ground.split(',')[0]}, {dateText(h.date)} · {RESULT_WORD[h.result]}</Text></Text>
          <P><Text style={{ color: C.ink, fontFamily: F.uiMed }}>{h.ton ? 'A ton of consequence.' : 'A good ton.'}</Text>{h.historic ? <Text style={{ color: C.ink, fontFamily: F.uiMed }}> Historic: {h.historic}</Text> : null} {h.reason}</P>
        </View>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  table: { backgroundColor: C.panel, borderRadius: 10, paddingHorizontal: 12 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, gap: 8 },
  td: { color: C.ink, fontFamily: F.uiMed, fontSize: 15 },
  num: { color: C.gold, fontFamily: F.displayBold, fontSize: 22 },
  card: { backgroundColor: C.panel, borderRadius: 10, padding: 12, gap: 4, borderLeftWidth: 4 },
  cTitle: { color: C.ink, fontFamily: F.displayBold, fontSize: 20 },
  cSub: { color: C.mute, fontFamily: F.ui, fontSize: 12 },
});
