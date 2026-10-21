import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native';
// The site's own leaderboard code, unchanged.
import { BOARD } from '../../../src/lib/batterBoard';
import { SORTS, sortBoard } from '../../../src/lib/boardSort';
import { C, F } from '../theme';

const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '–');
const VALUE = {
  tons: (r) => `${r.tons} of ${r.measured}`,
  share: (r) => `${pct(r.tons, r.measured)}  (${r.tons} of ${r.measured})`,
  peak: (r) => (r.peak ? `${r.peak.score.toFixed(1)} · ${r.peak.runs}${r.peak.notOut ? '*' : ''} v ${r.peak.opponent} ${r.peak.year}` : '–'),
  wins: (r) => `${pct(r.wins, r.resultsKnown)}  (${r.wins} of ${r.resultsKnown})`,
};

export default function Leaderboard({ navigation }) {
  const [sort, setSort] = useState('tons');
  const [query, setQuery] = useState('');
  const rows = useMemo(() => sortBoard(BOARD, { sort, min: 8, query }), [sort, query]);
  return (
    <View style={s.wrap}>
      <TextInput style={s.search} value={query} onChangeText={setQuery} placeholder="Search every batter" placeholderTextColor={C.mute} autoCorrect={false} clearButtonMode="while-editing" />
      <View style={s.chips}>
        {Object.entries(SORTS).map(([key, v]) => (
          <Pressable key={key} onPress={() => setSort(key)} style={[s.chip, sort === key && s.chipOn]}>
            <Text style={[s.chipText, sort === key && s.chipTextOn]}>{v.label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.slug}
        keyboardDismissMode="on-drag"
        renderItem={({ item, index }) => (
          <Pressable style={s.row} onPress={() => navigation.navigate('Batter', { slug: item.slug })}>
            <Text style={s.rank}>{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.sub}>{item.hundreds} hundreds · {item.measured} measured</Text>
            </View>
            <Text style={s.value}>{VALUE[sort](item)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={s.empty}>No batter matches that.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  search: { margin: 12, marginBottom: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.panel, borderColor: C.line, borderWidth: 1, color: C.ink, fontFamily: F.ui, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.gold, borderColor: C.gold },
  chipText: { color: C.soft, fontFamily: F.uiMed, fontSize: 13 },
  chipTextOn: { color: C.bg },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, gap: 12 },
  rank: { width: 30, color: C.mute, fontFamily: F.display, fontSize: 18 },
  name: { color: C.ink, fontFamily: F.displayBold, fontSize: 20 },
  sub: { color: C.mute, fontFamily: F.ui, fontSize: 12 },
  value: { color: C.gold, fontFamily: F.display, fontSize: 16, maxWidth: 150, textAlign: 'right' },
  empty: { color: C.mute, textAlign: 'center', marginTop: 40, fontFamily: F.ui },
});
