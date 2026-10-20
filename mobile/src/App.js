import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Leaderboard from './screens/Leaderboard';
import Rankings from './screens/Rankings';
import About from './screens/About';
import { C, F } from './theme';

const Tab = createBottomTabNavigator();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg, card: C.panel, border: C.line, text: C.ink, primary: C.gold } };

export default function App(props) {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={theme}>
        <Tab.Navigator screenOptions={{
          headerStyle: { backgroundColor: C.bg }, headerTitleStyle: { fontFamily: F.displayBold, fontSize: 22, letterSpacing: 1 },
          tabBarActiveTintColor: C.gold, tabBarInactiveTintColor: C.mute, tabBarLabelStyle: { fontFamily: F.uiMed },
        }}>
          <Tab.Screen name="ToCs" component={Leaderboard} options={{ title: 'TONS OF CONSEQUENCE', tabBarLabel: 'ToCs' }} />
          <Tab.Screen name="Rankings" component={Rankings} options={{ title: 'RANKINGS' }} />
          <Tab.Screen name="About" options={{ title: 'ABOUT' }}>{() => <About {...props} />}</Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
