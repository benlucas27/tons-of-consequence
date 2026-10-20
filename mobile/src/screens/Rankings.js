import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { rankAll } from '../../../src/lib/dataset';
import { DEFAULT_ORDER } from '../../../src/lib/scoring';
import { C, F } from '../theme';

// Placeholder for stage d: the top 100 on the default weighting, scored by the site's own scoring code.
export default function Rankings() {
  const rows = useMemo(() => rankAll(DEFAULT_ORDER).slice(0, 100), []);
  return (
    <FlatList
      style={{ backgroundColor: C.bg }}
      data={rows}
      keyExtractor={(c) => String(c.id)}
      renderItem={({ item, index }) => (
        <View style={s.row}>
          <Text style={s.rank}>{index + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{item.name} · {item.runs}{item.notOut ? '*' : ''}</Text>
            <Text style={s.sub}>v {item.opponent} · {item.year}</Text>
          </View>
          <Text style={s.score}>{item.toc.toFixed(1)}</Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, gap: 12 },
  rank: { width: 34, color: C.mute, fontFamily: F.display, fontSize: 18 },
  name: { color: C.ink, fontFamily: F.displayBold, fontSize: 19 },
  sub: { color: C.mute, fontFamily: F.ui, fontSize: 12 },
  score: { color: C.gold, fontFamily: F.displayBold, fontSize: 22 },
});
