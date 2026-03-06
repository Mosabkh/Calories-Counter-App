import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ListButton } from '@/components/onboarding/ListButton';
import { useOnboardingStore } from '@/store/onboarding-store';

const OPTIONS = [
  { key: 'healthy', icon: '🍎', label: 'Eat and live healthier' },
  { key: 'motivated', icon: '💪', label: 'Stay motivated' },
  { key: 'body', icon: '🧘', label: 'Feel better about my body' },
];

export default function AccomplishScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const storedAccomplish = useOnboardingStore((s) => s.payload.accomplish);
  const [selected, setSelected] = useState(storedAccomplish);

  const handleContinue = () => {
    if (!selected) return;
    updatePayload({ accomplish: selected });
    router.push('/onboarding/height');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={2} progress={30} />
      <View style={styles.content}>
        <Text style={styles.title}>What would you like to accomplish?</Text>
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
