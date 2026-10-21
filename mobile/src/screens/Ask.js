import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { answer, EXAMPLE_QUESTIONS } from '../../../src/lib/ask';
import { movementOf } from '../../../src/lib/dataset';
import { DEFAULT_ORDER, sameOrder } from '../../../src/lib/scoring';
import { runsText, fmt1 } from '../../../src/lib/format';
import { verdictOf } from '../../../src/lib/consequence';
import { useWeighting } from '../weighting';
import { Screen, H, P, Small, SectionTitle, Button, BiasNote, TocMark } from '../ui';
import { C, F } from '../theme';

function Rows({ items, order, bias, numbered, navigation }) {
  const isDefault = sameOrder(order, DEFAULT_ORDER) && !bias;
  return items.map((c, i) => {
    const mv = isDefault ? 0 : movementOf(c);
    const v = verdictOf(c.id);
    return (
      <Pressable key={c.id} style={s.row} onPress={() => navigation.navigate('Innings', { id: c.id })}>
        <Text style={s.rank}>{numbered ? c.rank : i + 1}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.name}>{c.name} · {runsText(c)}</Text>
          <Text style={s.sub}>v {c.opponent} · {c.venue ? `${c.venue} · ` : ''}{c.year}</Text>
          {v && v.passes ? <TocMark /> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.score}>{fmt1(c.toc)}</Text>
          {Math.abs(mv) >= 3 ? <Text style={{ color: mv > 0 ? C.green : C.red, fontFamily: F.uiMed, fontSize: 12 }}>{mv > 0 ? '▲' : '▼'} {Math.abs(mv)}</Text> : null}
        </View>
      </Pressable>
    );
  });
}

const Career = ({ career }) => (
  <View style={s.career}>
    {[['Hundreds', career.count], ['Best', `${career.best.runs}${career.best.notOut ? '*' : ''}`], ['Average score', fmt1(career.average)], ['In the top 100', career.inTop100]].map(([k, v]) => (
      <View key={k} style={{ alignItems: 'center', flex: 1 }}><Text style={s.cv}>{v}</Text><Small>{k}</Small></View>
    ))}
  </View>
);

export default function Ask({ navigation }) {
  const { order, bias } = useWeighting();
  const [text, setText] = useState('');
  const [asked, setAsked] = useState('');
  const [limit, setLimit] = useState(0);
  const result = useMemo(() => (asked ? answer(asked, order, { bias, ...(limit ? { limit } : {}) }) : null), [asked, order, bias, limit]);
  const run = (q) => { const t = String(q ?? text).trim(); setText(t); setAsked(t); setLimit(0); };
  const rowProps = result ? { order: result.order, bias: result.bias, navigation } : null;
  return (
    <Screen>
      <P>Ask a question about any Test century. Names, countries, grounds, years, scores and what you care about are all fair game.</P>
      <View style={s.box}>
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder="Who has the better hundred, Ponting or Smith?" placeholderTextColor={C.mute} returnKeyType="search" onSubmitEditing={() => run()} autoCorrect={false} />
        <Pressable style={s.go} onPress={() => run()}><Text style={s.goText}>Ask</Text></Pressable>
      </View>
      <BiasNote bias={bias} />
      {!result ? (
        <>
          <SectionTitle>Try one</SectionTitle>
          {EXAMPLE_QUESTIONS.map((q) => <Pressable key={q} style={s.eg} onPress={() => run(q)}><Text style={s.egText}>{q}</Text></Pressable>)}
        </>
      ) : (
        <>
          <H style={{ fontSize: 24 }}>{result.headline}</H>
          {result.interpreted.length > 0 ? <Small>Understood as: {result.interpreted.join(' · ')}</Small> : null}
          {result.assumed?.map((a) => <Small key={a.said}>I took “{a.said}” to mean {a.player.name}. Did you mean {a.others.map((o) => o.name).join(' or ')}?</Small>)}
          {result.notes?.map((n) => <Small key={n}>{n}</Small>)}

          {result.kind === 'compare' ? (
            <>
              {result.depth ? <P>{result.depth}</P> : null}
              <Rows items={result.multi || [result.comparison.a, result.comparison.b]} {...rowProps} numbered />
              {!result.multi ? <><P>{result.comparison.verdict}</P><Small>{result.comparison.robustness}</Small></> : null}
              {result.careers ? result.careers.map((c) => <View key={c.player.key} style={{ gap: 6 }}><SectionTitle>{c.name}</SectionTitle><Career career={c} /></View>) : null}
            </>
          ) : null}
          {result.kind === 'innings' ? <Rows items={[result.innings]} {...rowProps} numbered /> : null}
          {result.kind === 'players' ? (
            <>
              <Career career={result.career} />
              {result.items.length > 0 ? <Rows items={result.items} {...rowProps} /> : null}
              {result.total > result.items.length ? <Button label={`Show more (${result.total - result.items.length} left)`} onPress={() => setLimit(result.items.length + 10)} /> : null}
            </>
          ) : null}
          {result.kind === 'list' ? (
            <>
              <Rows items={result.items} {...rowProps} />
              {result.total > result.items.length && result.items.length < 50 ? <Button label={`Show more (${Math.min(10, result.total - result.items.length)} more of ${result.total.toLocaleString()})`} onPress={() => setLimit(Math.min(50, result.items.length + 10))} /> : null}
            </>
          ) : null}
          {result.kind === 'none' ? result.suggestions?.map((q) => <Pressable key={q} style={s.eg} onPress={() => run(q)}><Text style={s.egText}>{q}</Text></Pressable>) : null}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, color: C.ink, fontFamily: F.ui, fontSize: 16 },
  go: { backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  goText: { color: C.bg, fontFamily: F.uiMed, fontSize: 16 },
  eg: { backgroundColor: C.panel, borderRadius: 10, padding: 14 },
  egText: { color: C.ink, fontFamily: F.uiMed, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, gap: 10 },
  rank: { width: 38, color: C.mute, fontFamily: F.display, fontSize: 18 },
  name: { color: C.ink, fontFamily: F.displayBold, fontSize: 19 },
  sub: { color: C.mute, fontFamily: F.ui, fontSize: 12 },
  score: { color: C.gold, fontFamily: F.displayBold, fontSize: 24 },
  career: { flexDirection: 'row', backgroundColor: C.panel, borderRadius: 10, padding: 12 },
  cv: { color: C.gold, fontFamily: F.displayBold, fontSize: 22 },
});
