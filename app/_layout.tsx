import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { initRevenueCat } from '@/utils/revenue-cat';
import { useRemindersStore, type ReminderConfig } from '@/store/reminders-store';

SplashScreen.preventAutoHideAsync();

// Set notification handler so notifications display when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type ReminderKey = 'breakfast' | 'lunch' | 'dinner' | 'weighIn';

/** Re-schedule all enabled reminders from persisted store on app launch */
async function rescheduleAllReminders() {
  try {
    const state = useRemindersStore.getState();
    const keys: ReminderKey[] = ['breakfast', 'lunch', 'dinner', 'weighIn'];

    for (const key of keys) {
      const config: ReminderConfig = state[key];
      if (!config.enabled) continue;

      await Notifications.cancelScheduledNotificationAsync(key).catch(() => {});

      const isWeekly = key === 'weighIn' && config.frequency === 'weekly';

      await Notifications.scheduleNotificationAsync({
        identifier: key,
        content: {
          title: 'Calobite',
          body: key === 'weighIn'
            ? "Time to step on the scale!"
            : `Time to log ${key}!`,
        },
        // Hour/minute are interpreted in the device's current local timezone
        trigger: isWeekly
          ? {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: config.weekday ?? 2,
              hour: config.hour,
              minute: config.minute,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: config.hour,
              minute: config.minute,
            },
      });
    }
  } catch {
    // Notifications not fully supported in Expo Go — silently ignore
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      initRevenueCat();
      rescheduleAllReminders();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="log-meal" options={{ presentation: 'modal', animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="food-search" options={{ presentation: 'modal', animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="log-weight" options={{ presentation: 'modal', animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="log-exercise" options={{ presentation: 'modal', animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="saved-foods" options={{ presentation: 'modal', animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="progress-photos" options={{ animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="subscription" options={{ animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="edit-profile" options={{ animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="my-goals" options={{ animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="reminders" options={{ animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="units" options={{ animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="help" options={{ animation: 'fade_from_bottom', gestureEnabled: true, fullScreenSwipeEnabled: true }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
