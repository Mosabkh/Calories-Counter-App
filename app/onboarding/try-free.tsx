import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingIcon } from '@/components/onboarding/OnboardingIcon';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { BouncyView } from '@/components/onboarding/BouncyView';

const FEATURES = [
  'Snap a photo to log any meal instantly',
  'Personalized calorie & macro targets',
  'Smart day splits for weekends',
  'Track your weight loss progress weekly',
];

export default function TryFreeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={3} progress={100} />
      <View style={styles.content}>
        <View style={styles.gift}>
          <OnboardingIcon name="gift" size={56} color={Theme.colors.primary} />
        </View>
        <Text style={styles.title}>We want you to try Calobite for free.</Text>
        <Text style={styles.subtitle}>Everything included in your plan:</Text>
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <OnboardingIcon name="check-circle" size={22} color={Theme.colors.success} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton
          title="Start your free trial"
          onPress={() => router.push('/onboarding/paywall')}
        />
      </View>
      </BouncyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  gift: { alignItems: 'center', marginTop: 10, marginBottom: 10 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'left', lineHeight: 32,
  },
  subtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'left', marginTop: 5, marginBottom: 25,
  },
  featureList: { gap: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 15,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
