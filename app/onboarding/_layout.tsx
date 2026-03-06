import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Step 1: Basics (Screens 1-4) */}
      <Stack.Screen name="index" />
      <Stack.Screen name="name" />
      <Stack.Screen name="sex" />
      <Stack.Screen name="birthdate" />

      {/* Transition 1 (Screen 5) */}
      <Stack.Screen name="transition1" options={{ animation: 'fade' }} />

      {/* Step 2: Body & Goals (Screens 6-12) */}
      <Stack.Screen name="goal" />
      <Stack.Screen name="accomplish" />
      <Stack.Screen name="height" />
      <Stack.Screen name="current-weight" />
      <Stack.Screen name="goal-weight" />
      <Stack.Screen name="realistic-target" />
      <Stack.Screen name="goal-speed" />

      {/* Transition 2 (Screen 13) */}
      <Stack.Screen name="transition2" options={{ animation: 'fade' }} />

      {/* Step 3: Lifestyle (Screens 14-21) */}
      <Stack.Screen name="roadblocks" />
      <Stack.Screen name="weekends" />
      <Stack.Screen name="which-days" />
      <Stack.Screen name="diet-adjustment" />
      <Stack.Screen name="burned-calories" />
      <Stack.Screen name="rollover-calories" />
      <Stack.Screen name="projection" />
      <Stack.Screen name="notifications" />

      {/* Generation & Plan (Screens 22-23) */}
      <Stack.Screen name="generating" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="custom-plan" options={{ animation: 'fade' }} />

      {/* Account & Paywall (Screens 24-26) */}
      <Stack.Screen name="create-account" />
      <Stack.Screen name="try-free" />
      <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
