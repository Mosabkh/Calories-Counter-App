import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { useOnboardingStore } from '@/store/onboarding-store';
import { getTargetDate } from '@/utils/target-date';

const MACROS = [
  { value: '1671', label: 'Calories', color: Theme.colors.primary },
  { value: '157g', label: 'Carbs', color: Theme.colors.secondary },
  { value: '156g', label: 'Protein', color: Theme.colors.primaryHover },
  { value: '46g', label: 'Fats', color: Theme.colors.textMuted },
];

export default function CustomPlanScreen() {
  const router = useRouter();
  const { currentWeight, targetWeight, weightUnit, weeklyGoalSpeed } = useOnboardingStore((s) => s.payload);
  const diff = Math.abs((currentWeight || 0) - (targetWeight || 0));
  const targetDate = getTargetDate(currentWeight || 0, targetWeight || 0, weeklyGoalSpeed || 0.5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={100} />
      <View style={styles.content}>
        <Text style={styles.sparkle}>✨</Text>
        <Text style={styles.title}>Congratulations! Your plan is ready.</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Target: Lose {diff.toFixed(1)} {weightUnit || 'kg'} by {targetDate}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Daily Recommendation</Text>
        <View style={styles.macroGrid}>
          {MACROS.map((m) => (
            <View key={m.label} style={styles.macroCard}>
              <View style={[styles.macroCircle, { borderColor: m.color }]}>
                <Text style={styles.macroValue}>{m.value}</Text>
              </View>
              <Text style={styles.macroLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton
          title="Start Journey"
          onPress={() => router.push('/onboarding/create-account')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  sparkle: { fontSize: 40, marginTop: 10, marginBottom: 10 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', lineHeight: 32,
  },
  badge: {
    backgroundColor: Theme.colors.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 20, marginTop: 10,
  },
  badgeText: {
    color: '#FFFFFF', fontFamily: Theme.fonts.extraBold, fontSize: 20,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 18,
    marginTop: 30,
  },
  macroGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20, width: '100%',
  },
  macroCard: {
    width: '47%', backgroundColor: Theme.colors.surface, padding: 12, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  macroCircle: {
    width: 45, height: 45, borderRadius: 23, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  macroValue: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 12,
  },
  macroLabel: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 13,
  },
  bottomAction: {
    paddingHorizontal: 24, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: Theme.colors.border,
  },
});
