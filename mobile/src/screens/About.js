import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { checkForNewFeed } from '../loadFeed';
import { C, F } from '../theme';

const MESSAGE = {
  checking: 'Checking for new data…',
  'up-to-date': 'You have the latest data.',
  downloaded: 'New data downloaded. It shows next time you open the app.',
  offline: 'Offline: showing the data saved on this phone.',
  failed: 'Could not read the new data. Showing what is saved.',
  'app-too-old': 'Please update the app to see the newest data.',
};

export default function About({ feedVersion, feedSource, counts }) {
  const [status, setStatus] = useState('checking');
  useEffect(() => { checkForNewFeed(feedVersion).then((r) => setStatus(r.status)); }, [feedVersion]);
  return (
    <View style={s.wrap}>
      <Text style={s.h}>Tons of Consequence</Text>
      <Text style={s.p}>The unofficial ranking of Test cricket centuries, and which ones were tons of consequence.</Text>
      <Text style={s.p}>{counts.hundreds.toLocaleString()} hundreds · {counts.tons} tons of consequence</Text>
      <Text style={s.small}>{MESSAGE[status]}</Text>
      <Text style={s.small}>Data {feedVersion} ({feedSource})</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 20, gap: 12 },
  h: { color: C.ink, fontFamily: F.displayBold, fontSize: 30 },
  p: { color: C.soft, fontFamily: F.serif, fontSize: 18, lineHeight: 26 },
  small: { color: C.mute, fontFamily: F.ui, fontSize: 13 },
});
