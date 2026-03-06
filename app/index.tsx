import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function Index() {
  const isOnboardingComplete = useOnboardingStore((s) => s.isOnboardingComplete);

  if (isOnboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
