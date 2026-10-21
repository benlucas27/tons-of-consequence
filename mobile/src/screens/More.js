import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Screen, H, Small } from '../ui';
import { C, F } from '../theme';

const ITEMS = [
  ['PubTest', 'The Pub Test', 'Eight questions to find out how you rank a hundred.'],
  ['Womens', 'Women’s ToCs', 'Every hundred in women’s Tests, and the tons of consequence.'],
  ['HelloCricket', 'Hello Cricket', 'The moments the Hello Sport boys talk tons, with timestamps.'],
  ['About', 'How the ranking works', 'The six criteria, the 13 laws, where the data comes from.'],
];

export default function More({ navigation }) {
  return (
    <Screen>
      <H>More</H>
      {ITEMS.map(([name, title, sub]) => (
        <Pressable key={name} style={s.item} onPress={() => navigation.navigate(name)}>
          <View style={{ flex: 1 }}><Text style={s.title}>{title}</Text><Small>{sub}</Small></View>
          <Text style={s.chev}>›</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.panel, borderRadius: 12, padding: 16, gap: 10 },
  title: { color: C.ink, fontFamily: F.displayBold, fontSize: 22 },
  chev: { color: C.gold, fontSize: 28 },
});
