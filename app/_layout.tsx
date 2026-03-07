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
import { initRevenueCat } from '@/utils/revenue-cat';

SplashScreen.preventAutoHideAsync();

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
