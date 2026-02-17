import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, Platform } from 'react-native';
import { COLORS } from './theme';
import { useAlarmStore } from './stores/alarmStore';
import { usePlayerStore } from './stores/playerStore';

import AlarmsScreen from './screens/Alarms/AlarmsScreen';
import ChallengeScreen from './screens/Challenge/ChallengeScreen';
import ArenaScreen from './screens/Arena/ArenaScreen';
import IntelScreen from './screens/Intel/IntelScreen';
import HeroScreen from './screens/Hero/HeroScreen';
import SettingsScreen from './screens/Settings/SettingsScreen';
import OnboardingScreen, { hasCompletedOnboarding } from './screens/Onboarding/OnboardingScreen';
import SleepModeScreen from './screens/SleepMode/SleepModeScreen';

const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.gold,
    background: COLORS.bg,
    card: COLORS.bgCard,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.fire,
  },
};

const TAB_ICONS: Record<string, string> = {
  Alarms: '⏰',
  Challenge: '⚔️',
  Arena: '🏟️',
  Intel: '📊',
  Hero: '👤',
  Settings: '⚙️',
};

export default function App() {
  const { activeAlarmId, sleepModeActive } = useAlarmStore();
  const { resetBossIfNewWeek } = usePlayerStore();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Reset boss if new week + check onboarding
  useEffect(() => {
    resetBossIfNewWeek();
    hasCompletedOnboarding().then((done) => setShowOnboarding(!done));
  }, []);

  // Loading state
  if (showOnboarding === null) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: COLORS.bg }} />
      </SafeAreaProvider>
    );
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </SafeAreaProvider>
    );
  }

  // Sleep Mode overlay — takes over full screen while monitoring
  if (sleepModeActive) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SleepModeScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkTheme}>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.bgCard,
              borderTopColor: COLORS.border,
              borderTopWidth: 0.5,
              height: Platform.OS === 'ios' ? 88 : 64,
              paddingBottom: Platform.OS === 'ios' ? 28 : 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: COLORS.gold,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
                {TAB_ICONS[route.name] || '❓'}
              </Text>
            ),
          })}
        >
          <Tab.Screen name="Alarms" component={AlarmsScreen} />
          <Tab.Screen
            name="Challenge"
            component={ChallengeScreen}
            options={{
              tabBarBadge: activeAlarmId ? '!' : undefined,
              tabBarBadgeStyle: { backgroundColor: COLORS.fire },
            }}
          />
          <Tab.Screen name="Arena" component={ArenaScreen} />
          <Tab.Screen name="Intel" component={IntelScreen} />
          <Tab.Screen name="Hero" component={HeroScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
