import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function RealisticTargetScreen() {
  const router = useRouter();
  const { currentWeight, targetWeight, weightUnit, goal } = useOnboardingStore((s) => s.payload);

  const diff = Math.abs((currentWeight || 0) - (targetWeight || 0));
  const unit = weightUnit || 'kg';
  const isLosing = goal === 'lose';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={2} progress={85} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {isLosing ? 'Losing' : 'Gaining'}{' '}
          <Text style={styles.highlight}>{diff.toFixed(1)} {unit}</Text>{' '}
          is a realistic target. It's not hard at all!
        </Text>
        <Text style={styles.subtitle}>
          Because our system forces sustainable metrics, 90% of our users find this change easy to maintain.
        </Text>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton
          title="Continue"
          onPress={() => router.push('/onboarding/goal-speed')}
        />
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    textAlign: 'center',
    lineHeight: 40,
  },
  highlight: {
    color: Theme.colors.primary,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
