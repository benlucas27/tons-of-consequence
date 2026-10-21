import React, { useMemo, useState, useCallback, useTransition } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Modal, StyleSheet } from 'react-native';
import { rankAll, applyFilters, movementOf, ERAS, SCORE_BANDS, COUNTRIES } from '../../../src/lib/dataset';
import { PRESETS, NATIONS, LEVER_BY_KEY } from '../../../src/lib/scoring';
import { TON_IDS } from '../../doors/ton-ids';
import { runsText, fmt1 } from '../../../src/lib/format';
import { useWeighting } from '../weighting';
import { Chip, ChipRow, WeightBar, Legend, BiasNote, TocMark, Button, Small, P } from '../ui';
import { C, F } from '../theme';

function Customise({ visible, order, onClose, onApply }) {
  const [list, setList] = useState(order);
  React.useEffect(() => { if (visible) setList(order); }, [visible, order]);
  const move = (i, d) => { const n = [...list]; const j = i + d; if (j < 0 || j > 5) return; [n[i], n[j]] = [n[j], n[i]]; setList(n); };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: 60, gap: 12 }}>
        <Text style={s.mTitle}>Your weighting</Text>
        <P>Put the six criteria in the order you care about. First place counts for most.</P>
        <WeightBar order={list} />
        {list.map((k, i) => (
          <View key={k} style={s.mRow}>
            <View style={[s.dot, { backgroundColor: LEVER_BY_KEY[k].hex }]} />
            <Text style={s.mName}>{i + 1}. {LEVER_BY_KEY[k].name}</Text>
            <Pressable onPress={() => move(i, -1)} hitSlop={10}><Text style={s.arrow}>▲</Text></Pressable>
            <Pressable onPress={() => move(i, 1)} hitSlop={10}><Text style={s.arrow}>▼</Text></Pressable>
          </View>
        ))}
        <Legend order={list} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Button label="Cancel" onPress={onClose} style={{ flex: 1 }} />
          <Button label="Apply" primary onPress={() => { onApply(list); onClose(); }} style={{ flex: 1 }} />
        </View>
      </View>
    </Modal>
  );
}

const Row = React.memo(function Row({ c, move, onPress }) {
  return (
    <Pressable onPress={() => onPress(c.id)} style={s.row}>
      <Text style={s.rank}>{c.rank}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.name}>{c.name} · {runsText(c)}</Text>
        <Text style={s.sub}>v {c.opponent} · {c.venue ? `${c.venue} · ` : ''}{c.year}</Text>
        {TON_IDS.has(c.id) ? <TocMark /> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.score}>{fmt1(c.toc)}</Text>
        {move >= 3 || move <= -3 ? <Text style={[s.move, { color: move > 0 ? C.green : C.red }]}>{move > 0 ? '▲' : '▼'} {Math.abs(move)}</Text> : null}
      </View>
    </Pressable>
  );
});

export default function Rankings({ navigation }) {
  const { order, bias, preset, setPreset, setOrder } = useWeighting();
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState(null);
  const [era, setEra] = useState(null);
  const [band, setBand] = useState(null);
  const [custom, setCustom] = useState(false);
  const [more, setMore] = useState(false);
  // the tapped preset lights up at once; the ranking itself (4,628 innings re-scored) catches up a moment later
  const [, startTransition] = useTransition();
  const [chosen, setChosen] = useState(undefined);
  const shown = chosen === undefined ? preset : chosen;
  const pick = (name) => { setChosen(name); startTransition(() => { setPreset(name); setChosen(undefined); }); };

  const ranked = useMemo(() => rankAll(order, bias), [order, bias]);
  const rows = useMemo(() => applyFilters(ranked, { country, era, band, query }), [ranked, country, era, band, query]);
  const isDefault = preset === 'Default';
  const openInnings = useCallback((id) => navigation.navigate('Innings', { id }), [navigation]);

  const header = (
    <View style={{ paddingBottom: 6 }}>
      <TextInput style={s.search} value={query} onChangeText={setQuery} placeholder="Search a batter, team, ground or year" placeholderTextColor={C.mute} autoCorrect={false} clearButtonMode="while-editing" />
      <ChipRow>
        {Object.keys(PRESETS).map((n) => <Chip key={n} label={n} on={shown === n} onPress={() => pick(n)} />)}
        <Chip label={preset ? 'Your own…' : 'Your own ✓'} on={!preset} onPress={() => setCustom(true)} />
      </ChipRow>
      <View style={{ paddingHorizontal: 14, paddingTop: 6, gap: 4 }}>
        <WeightBar order={order} />
        <Legend order={order} />
        {preset && PRESETS[preset].blurb ? <Small>{PRESETS[preset].blurb}</Small> : null}
        <BiasNote bias={bias} />
      </View>
      <View style={{ paddingHorizontal: 14, paddingTop: 8 }}>
        <Pressable onPress={() => setMore(!more)}><Text style={s.filterLink}>{more ? 'Hide filters ▲' : 'Filters ▼'}{(country || era || band) ? '  (on)' : ''}</Text></Pressable>
      </View>
      {more ? (
        <View style={{ gap: 4, paddingTop: 4 }}>
          <ChipRow>{[null, ...COUNTRIES].map((c) => <Chip small key={c || 'all'} label={c ? (NATIONS[c] || c) : 'All teams'} on={country === c} onPress={() => setCountry(c)} />)}</ChipRow>
          <ChipRow>{[null, ...ERAS.map((e) => e.value)].map((v) => <Chip small key={v || 'all'} label={v ? ERAS.find((e) => e.value === v).label : 'Any era'} on={era === v} onPress={() => setEra(v)} />)}</ChipRow>
          <ChipRow>{[null, ...SCORE_BANDS.map((b) => b.value)].map((v) => <Chip small key={v || 'all'} label={v ? SCORE_BANDS.find((b) => b.value === v).label : 'Any score'} on={band === v} onPress={() => setBand(v)} />)}</ChipRow>
        </View>
      ) : null}
      <Text style={s.count}>{rows.length.toLocaleString()} hundreds{isDefault ? '' : ' on your weighting'}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={rows}
        keyExtractor={(c) => String(c.id)}
        ListHeaderComponent={header}
        renderItem={({ item }) => <Row c={item} move={isDefault ? 0 : movementOf(item)} onPress={openInnings} />}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={s.empty}>No hundreds match.</Text>}
      />
      <Customise visible={custom} order={order} onClose={() => setCustom(false)} onApply={setOrder} />
    </View>
  );
}

const s = StyleSheet.create({
  search: { margin: 12, marginBottom: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, color: C.ink, fontFamily: F.ui, fontSize: 16 },
  filterLink: { color: C.gold, fontFamily: F.uiMed, fontSize: 14 },
  count: { color: C.mute, fontFamily: F.ui, fontSize: 12, paddingHorizontal: 14, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, gap: 10 },
  rank: { width: 38, color: C.mute, fontFamily: F.display, fontSize: 18 },
  name: { color: C.ink, fontFamily: F.displayBold, fontSize: 19 },
  sub: { color: C.mute, fontFamily: F.ui, fontSize: 12 },
  score: { color: C.gold, fontFamily: F.displayBold, fontSize: 24 },
  move: { fontFamily: F.uiMed, fontSize: 12 },
  empty: { color: C.mute, textAlign: 'center', marginTop: 40, fontFamily: F.ui },
  mTitle: { color: C.ink, fontFamily: F.displayBold, fontSize: 30 },
  mRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.panel, borderRadius: 10, padding: 12 },
  mName: { flex: 1, color: C.ink, fontFamily: F.uiMed, fontSize: 16 },
  arrow: { color: C.gold, fontSize: 20, paddingHorizontal: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
