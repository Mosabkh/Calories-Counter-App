import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingIcon } from '@/components/onboarding/OnboardingIcon';
import { ListButton } from '@/components/onboarding/ListButton';
import { useOnboardingStore } from '@/store/onboarding-store';
import type { ActivityLevel } from '@/utils/calories';
import { BouncyView } from '@/components/onboarding/BouncyView';

const OPTIONS: { key: ActivityLevel; icon: React.ReactNode; label: string; desc: string }[] = [
  { key: 'sedentary', icon: <OnboardingIcon name="couch" size={22} color={Theme.colors.primary} />, label: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light', icon: <OnboardingIcon name="walking" size={22} color={Theme.colors.primary} />, label: 'Lightly active', desc: 'Light exercise 1-3 days/week' },
  { key: 'moderate', icon: <OnboardingIcon name="heart-pulse" size={22} color={Theme.colors.primary} />, label: 'Moderately active', desc: 'Moderate exercise 3-5 days/week' },
  { key: 'active', icon: <OnboardingIcon name="running" size={22} color={Theme.colors.primary} />, label: 'Highly active', desc: 'Hard exercise 6-7 days/week' },
  { key: 'very_active', icon: <OnboardingIcon name="barbell" size={22} color={Theme.colors.primary} />, label: 'Athlete', desc: 'Very intense exercise or physical job' },
];

export default function ActivityLevelScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const stored = useOnboardingStore((s) => s.payload.activityLevel);
  const [selected, setSelected] = useState<ActivityLevel | undefined>(stored);

  const handleContinue = () => {
    if (!selected) return;
    updatePayload({ activityLevel: selected });
    router.push('/onboarding/height');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={2} progress={35} />
      <View style={styles.content}>
        <Text style={styles.title}>How active are you?</Text>
        <Text style={styles.subtitle}>This helps us calculate your daily energy needs accurately.</Text>
        {OPTIONS.map((opt) => (
          <ListButton
            key={opt.key}
            icon={opt.icon}
            label={opt.label}
            active={selected === opt.key}
            onPress={() => setSelected(opt.key)}
          />
        ))}
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} disabled={!selected} />
      </View>
      </BouncyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 6,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    marginBottom: 20,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
