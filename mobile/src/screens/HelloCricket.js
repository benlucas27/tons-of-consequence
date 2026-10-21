import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MOMENTS, ORIGIN, episodeLabel, clock, watchUrl } from '../../../src/lib/helloSport';
import { BY_ID } from '../../../src/lib/dataset';
import { runsText } from '../../../src/lib/format';
import { Screen, H, P, Small, SectionTitle, Link } from '../ui';
import { C, F } from '../theme';

const KIND = { innings: 'Innings', historic: 'Older innings, mentioned', career: 'Career', concept: 'Tons of consequence' };

function byEpisode() {
  const groups = new Map();
  for (const m of MOMENTS) {
    if (!groups.has(m.youtubeId)) groups.set(m.youtubeId, { youtubeId: m.youtubeId, date: m.date, moments: [] });
    if (m.type === 'concept' && m.youtubeId === ORIGIN.youtubeId) continue;
    groups.get(m.youtubeId).moments.push(m);
  }
  const list = [...groups.values()];
  list.forEach((g) => g.moments.sort((a, b) => a.start - b.start));
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export default function HelloCricket({ navigation }) {
  const groups = byEpisode();
  return (
    <Screen>
      <H>Hello Cricket</H>
      <P>A Hello Sport cricketing archive: the moments the hosts talk about Test hundreds and tons of consequence. Each has the timestamp, so you can hear what they said, and is tagged to the innings where there is one.</P>
      {groups.map((g) => {
        const label = episodeLabel(g.moments[0] || MOMENTS.find((m) => m.youtubeId === g.youtubeId));
        return (
          <View key={g.youtubeId} style={{ gap: 8 }}>
            <SectionTitle>{label}</SectionTitle>
            {g.moments.map((m) => {
              const c = m.inningsId ? BY_ID.get(m.inningsId) : null;
              return (
                <View key={`${m.start}-${m.player}-${m.inningsId ?? m.type}`} style={s.card}>
                  <Pressable disabled={!c} onPress={() => navigation.navigate('Innings', { id: c.id })}>
                    <Text style={s.title}>{c ? `${c.name} ${runsText(c)}` : m.type === 'concept' ? KIND.concept : m.player}</Text>
                  </Pressable>
                  <Small>{c ? `v ${c.opponent}, ${c.venue}, ${c.year}` : (KIND[m.type] || '')}</Small>
                  <P>{m.note}</P>
                  <Link url={watchUrl(m.youtubeId, m.start)}>Listen from {clock(m.start)}</Link>
                </View>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.panel, borderRadius: 10, padding: 12, gap: 4 },
  title: { color: C.ink, fontFamily: F.displayBold, fontSize: 20 },
});
