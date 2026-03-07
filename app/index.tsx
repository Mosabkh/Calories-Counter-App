import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';

export default function Index() {
  const hasProfile = useUserStore((s) => s.profile !== null);
  const isOnboardingComplete = useOnboardingStore((s) => s.isOnboardingComplete);

  if (hasProfile || isOnboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
