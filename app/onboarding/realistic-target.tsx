import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';
import { BouncyView } from '@/components/onboarding/BouncyView';

export default function RealisticTargetScreen() {
  const router = useRouter();
  const { currentWeight, targetWeight, weightUnit, goal } = useOnboardingStore((s) => s.payload);

  const diff = Math.abs((currentWeight || 0) - (targetWeight || 0));
  const unit = weightUnit || 'kg';
  const isGaining = goal === 'gain';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={2} progress={85} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {isGaining ? 'Gaining' : 'Losing'}{' '}
          <Text style={styles.highlight}>{diff.toFixed(1)} {unit}</Text>{' '}
          is a realistic target. It{"'"}s not hard at all!
        </Text>
        <Text style={styles.subtitle}>
          {isGaining
            ? 'We calculate the right surplus for your body so you gain lean mass at a healthy, sustainable pace.'
            : 'We calculate the right deficit for your body so you lose weight at a healthy, sustainable pace.'}
        </Text>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton
          title="Continue"
          onPress={() => router.push('/onboarding/goal-speed')}
        />
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
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
