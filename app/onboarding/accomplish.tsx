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
import { BouncyView } from '@/components/onboarding/BouncyView';

const LOSE_OPTIONS = [
  { key: 'healthy', icon: <OnboardingIcon name="apple" size={22} color={Theme.colors.primary} />, label: 'Eat and live healthier' },
  { key: 'motivated', icon: <OnboardingIcon name="flame" size={22} color={Theme.colors.primary} />, label: 'Stay motivated' },
  { key: 'body', icon: <OnboardingIcon name="body" size={22} color={Theme.colors.primary} />, label: 'Feel better about my body' },
];

const GAIN_OPTIONS = [
  { key: 'muscle', icon: <OnboardingIcon name="barbell" size={22} color={Theme.colors.primary} />, label: 'Build muscle and strength' },
  { key: 'healthy', icon: <OnboardingIcon name="apple" size={22} color={Theme.colors.primary} />, label: 'Eat healthier and gain properly' },
  { key: 'confidence', icon: <OnboardingIcon name="body" size={22} color={Theme.colors.primary} />, label: 'Feel more confident' },
];

const MAINTAIN_OPTIONS = [
  { key: 'healthy', icon: <OnboardingIcon name="apple" size={22} color={Theme.colors.primary} />, label: 'Eat and live healthier' },
  { key: 'track', icon: <OnboardingIcon name="bar-chart" size={22} color={Theme.colors.primary} />, label: 'Stay on track with my nutrition' },
  { key: 'body', icon: <OnboardingIcon name="body" size={22} color={Theme.colors.primary} />, label: 'Feel better about my body' },
];

export default function AccomplishScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const goal = useOnboardingStore((s) => s.payload.goal) || 'lose';
  const storedAccomplish = useOnboardingStore((s) => s.payload.accomplish);
  const [selected, setSelected] = useState(storedAccomplish);
  const options = goal === 'gain' ? GAIN_OPTIONS : goal === 'maintain' ? MAINTAIN_OPTIONS : LOSE_OPTIONS;

  const handleContinue = () => {
    if (!selected) return;
    updatePayload({ accomplish: selected });
    router.push('/onboarding/activity-level');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
        <ProgressHeader step={2} progress={30} />
        <View style={styles.content}>
          <Text style={styles.title}>What would you like to accomplish?</Text>
          {options.map((opt) => (
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
    marginBottom: 20,
    lineHeight: 32,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
