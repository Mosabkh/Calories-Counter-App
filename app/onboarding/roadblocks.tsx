import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ListButton } from '@/components/onboarding/ListButton';
import { OnboardingIcon } from '@/components/onboarding/OnboardingIcon';
import { useOnboardingStore } from '@/store/onboarding-store';
import { BouncyView } from '@/components/onboarding/BouncyView';

const LOSE_OPTIONS = [
  { label: 'Lack of consistency', icon: <OnboardingIcon name="target" size={22} color={Theme.colors.primary} /> },
  { label: 'Busy schedule', icon: <OnboardingIcon name="calendar" size={22} color={Theme.colors.primary} /> },
  { label: 'Emotional or stress eating', icon: <OnboardingIcon name="heart" size={22} color={Theme.colors.primary} /> },
];

const GAIN_OPTIONS = [
  { label: 'Hard to eat enough', icon: <OnboardingIcon name="utensils" size={22} color={Theme.colors.primary} /> },
  { label: 'Busy schedule', icon: <OnboardingIcon name="calendar" size={22} color={Theme.colors.primary} /> },
  { label: 'Fast metabolism', icon: <OnboardingIcon name="fire-alt" size={22} color={Theme.colors.primary} /> },
];

const MAINTAIN_OPTIONS = [
  { label: 'Portion control', icon: <OnboardingIcon name="scale" size={22} color={Theme.colors.primary} /> },
  { label: 'Busy schedule', icon: <OnboardingIcon name="calendar" size={22} color={Theme.colors.primary} /> },
  { label: 'Emotional or stress eating', icon: <OnboardingIcon name="heart" size={22} color={Theme.colors.primary} /> },
];

export default function RoadblocksScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const goal = useOnboardingStore((s) => s.payload.goal);
  const storedRoadblock = useOnboardingStore((s) => s.payload.roadblocks);
  const [selected, setSelected] = useState<string | undefined>(storedRoadblock);

  const options = goal === 'gain' ? GAIN_OPTIONS : goal === 'maintain' ? MAINTAIN_OPTIONS : LOSE_OPTIONS;

  const handleContinue = () => {
    if (!selected) return;
    updatePayload({ roadblocks: selected });
    router.push('/onboarding/weekends');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={3} progress={15} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {goal === 'gain'
            ? "What's making it hard to gain weight?"
            : "What's stopping you from reaching your goals?"}
        </Text>
        {options.map((opt) => (
          <ListButton
            key={opt.label}
            label={opt.label}
            icon={opt.icon}
            active={selected === opt.label}
            onPress={() => setSelected(opt.label)}
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
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'left', marginTop: 20, marginBottom: 20, lineHeight: 32,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
