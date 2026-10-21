import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { startPush } from './push';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WeightingProvider } from './weighting';
import { FeedInfo } from './feedInfo';
import Leaderboard from './screens/Leaderboard';
import Rankings from './screens/Rankings';
import Innings from './screens/Innings';
import Batter from './screens/Batter';
import Compare from './screens/Compare';
import Ask from './screens/Ask';
import More from './screens/More';
import PubTest from './screens/PubTest';
import Womens from './screens/Womens';
import HelloCricket from './screens/HelloCricket';
import About from './screens/About';
import ShareHost from './ShareHost';
import { C, F } from './theme';

const navRef = createNavigationContainerRef();
const linking = { prefixes: ['tonsofconsequence://'], config: { screens: { Innings: 'innings/:id' } } };
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg, card: C.panel, border: C.line, text: C.ink, primary: C.gold } };
const header = { headerStyle: { backgroundColor: C.bg }, headerTitleStyle: { fontFamily: F.displayBold, fontSize: 22 }, headerTintColor: C.gold, headerBackTitle: 'Back' };

const icon = (glyph) => ({ color }) => <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ ...header, tabBarActiveTintColor: C.gold, tabBarInactiveTintColor: C.mute, tabBarLabelStyle: { fontFamily: F.uiMed } }}>
      <Tab.Screen name="Rankings" component={Rankings} options={{ title: 'RANKINGS', tabBarLabel: 'Rankings', tabBarIcon: icon('★') }} />
      <Tab.Screen name="ToCs" component={Leaderboard} options={{ title: 'TONS OF CONSEQUENCE', tabBarLabel: 'ToCs', tabBarIcon: icon('◉') }} />
      <Tab.Screen name="Compare" component={Compare} options={{ title: 'COMPARE', tabBarLabel: 'Compare', tabBarIcon: icon('⇄') }} />
      <Tab.Screen name="Ask" component={Ask} options={{ title: 'ASK THE RANKINGS', tabBarLabel: 'Ask', tabBarIcon: icon('?') }} />
      <Tab.Screen name="More" component={More} options={{ title: 'MORE', tabBarLabel: 'More', tabBarIcon: icon('⋯') }} />
    </Tab.Navigator>
  );
}

export default function App({ feedVersion, feedSource, counts }) {
  // tapping a push notification opens that innings
  useEffect(() => { startPush((id) => { if (navRef.isReady()) navRef.navigate('Innings', { id }); }); }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <FeedInfo.Provider value={{ feedVersion, feedSource, counts }}>
        <WeightingProvider>
          <NavigationContainer theme={theme} ref={navRef} linking={linking}>
            <Stack.Navigator screenOptions={header}>
              <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
              <Stack.Screen name="Innings" component={Innings} options={{ title: 'THE INNINGS' }} />
              <Stack.Screen name="Batter" component={Batter} options={{ title: 'BATTER' }} />
              <Stack.Screen name="PubTest" component={PubTest} options={{ title: 'THE PUB TEST' }} />
              <Stack.Screen name="Womens" component={Womens} options={{ title: 'WOMEN’S TESTS' }} />
              <Stack.Screen name="HelloCricket" component={HelloCricket} options={{ title: 'HELLO CRICKET' }} />
              <Stack.Screen name="About" component={About} options={{ title: 'ABOUT' }} />
            </Stack.Navigator>
          </NavigationContainer>
          <ShareHost />
        </WeightingProvider>
      </FeedInfo.Provider>
    </SafeAreaProvider>
  );
}
