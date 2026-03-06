import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ListButton } from '@/components/onboarding/ListButton';
import { useOnboardingStore } from '@/store/onboarding-store';

const LOSE_OPTIONS = [
  'Lack of consistency',
  'Busy schedule',
  'Emotional or stress eating',
];

const GAIN_OPTIONS = [
  'Hard to eat enough',
  'Busy schedule',
  'Fast metabolism',
];

const MAINTAIN_OPTIONS = [
  'Portion control',
  'Busy schedule',
  'Emotional or stress eating',
];

export default function RoadblocksScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const goal = useOnboardingStore((s) => s.payload.goal);
  const [selected, setSelected] = useState<string | undefined>();

  const options = goal === 'gain' ? GAIN_OPTIONS : goal === 'maintain' ? MAINTAIN_OPTIONS : LOSE_OPTIONS;

  const handleContinue = () => {
    if (!selected) return;
    updatePayload({ roadblocks: selected });
    router.push('/onboarding/weekends');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={15} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {goal === 'gain'
            ? "What's making it hard to gain weight?"
            : "What's stopping you from reaching your goals?"}
        </Text>
        {options.map((opt) => (
          <ListButton
            key={opt}
            label={opt}
            active={selected === opt}
            onPress={() => setSelected(opt)}
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
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'left', marginTop: 20, marginBottom: 20, lineHeight: 32,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
