import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { Barlow_400Regular, Barlow_500Medium } from '@expo-google-fonts/barlow';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader';
import { loadFeed } from './src/loadFeed';
import { C } from './src/theme';

// The site's shared code reads its data when it first loads, so the app is only loaded (require) once the feed is in place.
function Boot() {
  const [fontsReady] = useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, Barlow_400Regular, Barlow_500Medium, Newsreader_400Regular });
  const [state, setState] = useState(null);
  useEffect(() => { loadFeed().then((r) => setState({ ...r, App: require('./src/App').default })); }, []);
  if (!fontsReady || !state) {
    return <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={C.gold} /></View>;
  }
  const { App, feed, source } = state;
  return <App feedVersion={feed.version} feedSource={source} counts={feed.counts} />;
}

registerRootComponent(Boot);
