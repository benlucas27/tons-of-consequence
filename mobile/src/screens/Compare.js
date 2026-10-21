import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { rankAll } from '../../../src/lib/dataset';
import { LEVERS, RANK_WEIGHTS } from '../../../src/lib/scoring';
import { compareInnings, searchInnings, findInnings } from '../../../src/lib/ask';
import { COMPARE_SETS, compareCareers } from '../../../src/lib/careerCompare';
import { fmt1, context, runsText } from '../../../src/lib/format';
import { weightQuery } from '../../../src/lib/scoring';
import { useWeighting } from '../weighting';
import { shareCard } from '../share';
import { Screen, H, P, Small, SectionTitle, Chip, ChipRow, Button, TierTag, BiasNote, WeightBar } from '../ui';
import { C, F } from '../theme';

const PAIRS = [
  [['Lara', 153, 1999], ['Stokes', 135, 2019]],
  [['Bradman', 334, 1930], ['Lara', 400, 2004]],
  [['Ponting', 156, 2005], ['Smith', 144, 2019]],
  [['Tendulkar', 241, 2004], ['Laxman', 281, 2001]],
];

function PickerModal({ visible, onClose, onPick, otherId }) {
  const { order, bias } = useWeighting();
  const [text, setText] = useState('');
  const hits = useMemo(() => searchInnings(text, order, 12, bias).filter((c) => c.id !== otherId), [text, order, bias, otherId]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: 56 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 12 }}>
          <TextInput autoFocus style={[s.input, { flex: 1 }]} value={text} onChangeText={setText} placeholder="Find an innings: Lara 153, Smith Ashes…" placeholderTextColor={C.mute} autoCorrect={false} />
          <Text style={s.cancel} onPress={onClose}>Cancel</Text>
        </View>
        <FlatList data={hits} keyExtractor={(c) => String(c.id)} keyboardShouldPersistTaps="handled" renderItem={({ item }) => (
          <Pressable style={s.hit} onPress={() => { onPick(item.id); setText(''); onClose(); }}>
            <View style={{ flex: 1 }}><Text style={s.hitName}>{item.name} {runsText(item)}</Text><Small>{context(item)}</Small></View>
            <Text style={s.hitScore}>{fmt1(item.toc)}</Text>
          </Pressable>
        )} ListEmptyComponent={<Small style={{ padding: 16 }}>{text ? 'No innings found.' : 'Type a name, a score, a team or a ground.'}</Small>} />
      </View>
    </Modal>
  );
}

function Slot({ label, c, onPress }) {
  return (
    <Pressable onPress={onPress} style={s.slot}>
      <Small>{label}</Small>
      {c ? (<><Text style={s.slotName}>{c.name} <Text style={{ color: C.gold }}>{runsText(c)}</Text></Text><Small>{context(c)}</Small><Text style={s.slotScore}>{fmt1(c.toc)}</Text><TierTag score={c.toc} /></>) : <Text style={s.slotEmpty}>Tap to choose</Text>}
    </Pressable>
  );
}

function InningsResult({ a, b }) {
  const { order, bias } = useWeighting();
  const cmp = compareInnings(a, b, order, bias);
  const winnerIsA = cmp.winner.id === cmp.a.id;
  const lastName = (c) => c.name.split(' ').slice(-1)[0];
  return (
    <View style={{ gap: 10 }}>
      <SectionTitle>The verdict</SectionTitle>
      <P>{cmp.verdict}</P>
      <Small>{cmp.robustness}</Small>
      <View style={s.presets}>
        {cmp.presets.map((p) => {
          const who = p.aWins ? cmp.a : cmp.b;
          const flipped = p.aWins !== winnerIsA && p.margin >= 0.1;
          return (<View key={p.name} style={[s.pchip, flipped && { borderColor: C.red }]}><Text style={s.pname}>{p.name}</Text><Text style={s.pval}>{p.margin < 0.1 ? 'Level' : `${lastName(who)} +${fmt1(p.margin)}`}</Text></View>);
        })}
      </View>
      <SectionTitle>Criterion by criterion</SectionTitle>
      {order.map((k, i) => {
        const l = LEVERS.find((x) => x.key === k);
        const va = cmp.a.levers[k] || 0; const vb = cmp.b.levers[k] || 0;
        return (
          <View key={k} style={{ gap: 3 }}>
            <Text style={s.tapeName}><Text style={{ color: l.hex }}>● </Text>{l.short} · {RANK_WEIGHTS[i]}%</Text>
            <View style={s.tapeRow}>
              <Text style={[s.tv, va > vb && { color: C.gold }]}>{va}</Text>
              <View style={s.tapeBars}>
                <View style={s.half}><View style={{ width: `${va}%`, height: 6, backgroundColor: l.hex, alignSelf: 'flex-end', borderRadius: 3 }} /></View>
                <View style={s.half}><View style={{ width: `${vb}%`, height: 6, backgroundColor: l.hex, borderRadius: 3 }} /></View>
              </View>
              <Text style={[s.tv, vb > va && { color: C.gold }]}>{vb}</Text>
            </View>
          </View>
        );
      })}
      <Button label="Share as a card" primary onPress={() => shareCard(`/card/compare?a=${cmp.a.id}&b=${cmp.b.id}${weightQuery(order, bias).replace('?', '&')}`, `toc-compare-${cmp.a.id}-${cmp.b.id}`)} />
    </View>
  );
}

function Table({ title, rows, players }) {
  return (
    <View style={{ gap: 4 }}>
      <SectionTitle>{title}</SectionTitle>
      <View style={s.ctable}>
        <View style={s.crow}><Text style={[s.clabel, { flex: 1.3 }]} />{players.map((p) => <Text key={p.name} style={s.chead}>{p.name.split(' ').slice(-1)[0]}</Text>)}</View>
        {rows.map((r) => (
          <View key={r.key} style={s.crow}>
            <Text style={[s.clabel, { flex: 1.3 }]}>{r.label}</Text>
            {r.display.map((d, i) => <Text key={players[i].name} style={[s.cval, r.leaders.includes(i) && { color: C.gold, fontFamily: F.displayBold }]}>{d}</Text>)}
          </View>
        ))}
      </View>
    </View>
  );
}

function Careers() {
  const { order, bias } = useWeighting();
  const [setId, setSetId] = useState(COMPARE_SETS[0].id);
  const set = COMPARE_SETS.find((x) => x.id === setId);
  const r = useMemo(() => compareCareers(set, order, bias), [set, order, bias]);
  return (
    <View style={{ gap: 10 }}>
      <ChipRow>{COMPARE_SETS.map((x) => <Chip key={x.id} label={x.name} on={x.id === setId} onPress={() => setSetId(x.id)} />)}</ChipRow>
      <P>{set.blurb}</P>
      <SectionTitle>{set.name}: the verdict</SectionTitle>
      {r.summary.map((t) => <P key={t}>{t}</P>)}
      <View style={s.presets}>{r.leads.map((l) => <View key={l.name} style={s.pchip}><Text style={s.pname}>{l.name.split(' ').slice(-1)[0]}</Text><Text style={s.pval}>leads {l.count} of {r.measures}</Text></View>)}</View>
      <Table title="By the numbers" rows={r.numbers} players={r.players} />
      <Table title="By the ranking" rows={r.ranking} players={r.players} />
      <Table title="What their hundreds did" rows={r.reference} players={r.players} />
      {r.partials.length > 0 ? <Small>† Partial figures: ball-by-ball records are complete only from about 2006, so some career numbers cover only part of the career. They are never counted as leading.</Small> : null}
      <Small>Career figures come from ball-by-ball records (Cricsheet) up to {r.asOf}.</Small>
    </View>
  );
}

export default function Compare({ route }) {
  const { order, bias } = useWeighting();
  const [mode, setMode] = useState('innings');
  const [aId, setA] = useState(null);
  const [bId, setB] = useState(null);
  const [picking, setPicking] = useState(null);
  const ranked = useMemo(() => rankAll(order, bias), [order, bias]);
  const a = aId ? ranked.find((c) => c.id === aId) : null;
  const b = bId ? ranked.find((c) => c.id === bId) : null;
  const examples = useMemo(() => PAIRS.map(([x, y]) => [findInnings(...x), findInnings(...y)]).filter(([x, y]) => x && y), []);
  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Two innings" on={mode === 'innings'} onPress={() => setMode('innings')} />
        <Chip label="Career presets" on={mode === 'careers'} onPress={() => setMode('careers')} />
      </View>
      <WeightBar order={order} />
      <BiasNote bias={bias} />
      {mode === 'careers' ? <Careers /> : (
        <>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Slot label="First innings" c={a} onPress={() => setPicking('a')} />
            <Slot label="Second innings" c={b} onPress={() => setPicking('b')} />
          </View>
          {a && b ? <InningsResult a={a} b={b} /> : (
            <>
              <SectionTitle>Try one</SectionTitle>
              {examples.map(([x, y]) => (
                <Pressable key={`${x.id}-${y.id}`} style={s.eg} onPress={() => { setA(x.id); setB(y.id); }}>
                  <Text style={s.egText}>{x.name} {runsText(x)} vs {y.name} {runsText(y)}</Text>
                </Pressable>
              ))}
            </>
          )}
        </>
      )}
      <PickerModal visible={!!picking} onClose={() => setPicking(null)} otherId={picking === 'a' ? bId : aId} onPick={(id) => (picking === 'a' ? setA(id) : setB(id))} />
    </Screen>
  );
}

const s = StyleSheet.create({
  input: { margin: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, color: C.ink, fontFamily: F.ui, fontSize: 16 },
  cancel: { color: C.gold, fontFamily: F.uiMed, fontSize: 16 },
  hit: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, gap: 10 },
  hitName: { color: C.ink, fontFamily: F.displayBold, fontSize: 19 },
  hitScore: { color: C.gold, fontFamily: F.displayBold, fontSize: 22 },
  slot: { flex: 1, backgroundColor: C.panel, borderRadius: 12, padding: 12, gap: 4, minHeight: 130 },
  slotName: { color: C.ink, fontFamily: F.displayBold, fontSize: 20 },
  slotScore: { color: C.gold, fontFamily: F.displayBold, fontSize: 36 },
  slotEmpty: { color: C.gold, fontFamily: F.uiMed, marginTop: 20 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pchip: { borderWidth: 1, borderColor: C.line, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  pname: { color: C.mute, fontFamily: F.ui, fontSize: 11 },
  pval: { color: C.ink, fontFamily: F.uiMed, fontSize: 13 },
  tapeName: { color: C.soft, fontFamily: F.ui, fontSize: 12, textAlign: 'center' },
  tapeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tv: { width: 34, color: C.soft, fontFamily: F.displayBold, fontSize: 18, textAlign: 'center' },
  tapeBars: { flex: 1, flexDirection: 'row', gap: 3 },
  half: { flex: 1, height: 6, backgroundColor: C.line, borderRadius: 3, overflow: 'hidden' },
  eg: { backgroundColor: C.panel, borderRadius: 10, padding: 14 },
  egText: { color: C.ink, fontFamily: F.uiMed, fontSize: 15 },
  ctable: { backgroundColor: C.panel, borderRadius: 10, paddingHorizontal: 8 },
  crow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  clabel: { color: C.soft, fontFamily: F.ui, fontSize: 12 },
  chead: { flex: 1, color: C.mute, fontFamily: F.displayBold, fontSize: 13, textAlign: 'center' },
  cval: { flex: 1, color: C.ink, fontFamily: F.ui, fontSize: 12, textAlign: 'center' },
});
