import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ListButton } from '@/components/onboarding/ListButton';
import { useOnboardingStore } from '@/store/onboarding-store';

const GOALS = [
  { key: 'lose' as const, icon: '📉', label: 'Lose weight' },
  { key: 'maintain' as const, icon: '⚖️', label: 'Maintain weight' },
  { key: 'gain' as const, icon: '📈', label: 'Gain weight' },
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={2} progress={15} />
      <View style={styles.content}>
        <Text style={styles.title}>What is your goal?</Text>
        {GOALS.map((g) => (
          <ListButton
            key={g.key}
            icon={g.icon}
            label={g.label}
            active={goal === g.key}
            onPress={() => setGoal(g.key)}
          />
        ))}
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} />
      </View>
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
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
