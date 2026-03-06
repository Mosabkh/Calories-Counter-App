import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';

const FEATURES = [
  'Unlimited meal scans',
  'Custom daily macro targets',
  'Detailed nutrition breakdowns',
  'Weekly progress insights',
];

export default function TryFreeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={100} />
      <View style={styles.content}>
        <Text style={styles.gift}>🎁</Text>
        <Text style={styles.title}>We want you to try Cal AI for free.</Text>
        <Text style={styles.subtitle}>Here's what you get:</Text>
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.check}>✔️</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  gift: { fontSize: 60, textAlign: 'center', marginTop: 10, marginBottom: 10 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'left', lineHeight: 32,
  },
  subtitle: {
    fontSize: 16, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'left', marginTop: 5, marginBottom: 25,
  },
  featureList: { gap: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { fontSize: 22, color: Theme.colors.success },
  featureText: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 14,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
