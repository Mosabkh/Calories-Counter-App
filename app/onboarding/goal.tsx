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

const GOALS = [
  { key: 'lose' as const, icon: <OnboardingIcon name="trending-down" size={22} color={Theme.colors.primary} />, label: 'Lose weight', desc: 'Reduce calories to shed weight gradually' },
  { key: 'maintain' as const, icon: <OnboardingIcon name="scale" size={22} color={Theme.colors.primary} />, label: 'Maintain weight', desc: 'Keep your current weight with balanced eating' },
  { key: 'gain' as const, icon: <OnboardingIcon name="trending-up" size={22} color={Theme.colors.primary} />, label: 'Gain weight', desc: 'Increase calories to build muscle' },
];

export default function GoalScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const storedGoal = useOnboardingStore((s) => s.payload.goal);
  const [goal, setGoal] = useState(storedGoal);

  const handleContinue = () => {
    if (!goal) return;
    updatePayload({ goal });
    router.push('/onboarding/accomplish');
  };

  const canContinue = !!goal;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={2} progress={15} />
      <View style={styles.content}>
        <Text style={styles.title}>What is your goal?</Text>
        {GOALS.map((g) => (
          <ListButton
            key={g.key}
            icon={g.icon}
            label={g.label}
            desc={g.desc}
            active={goal === g.key}
            onPress={() => setGoal(g.key)}
          />
        ))}
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} disabled={!canContinue} />
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
