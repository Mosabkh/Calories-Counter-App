import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function RolloverCaloriesScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);

  const goal = useOnboardingStore((s) => s.payload.goal);

  const handleChoice = (rollover: boolean) => {
    updatePayload({ rolloverCalories: rollover });
    // Maintain: skip projection chart (no weight change to project)
    router.push(goal === 'maintain' ? '/onboarding/notifications' : '/onboarding/projection');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={85} />
      <View style={styles.content}>
        <Text style={styles.title}>Rollover extra calories to the next day?</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Yesterday</Text>
          <Text style={styles.cardValue}>
            350 / <Text style={styles.cardValueSmall}>500</Text>
          </Text>
          <Text style={styles.cardHighlight}>150 left</Text>
          <View style={styles.todayCard}>
            <Text style={styles.cardLabel}>Today</Text>
            <Text style={[styles.cardValue, { fontSize: 20 }]}>
              350 / <Text style={[styles.cardValueSmall, { fontSize: 14 }]}>650</Text>
            </Text>
            <Text style={styles.cardHighlight}>(+150 added)</Text>
          </View>
        </View>
      </View>
      <View style={styles.bottomAction}>
        <View style={styles.rowBtns}>
          <OnboardingButton
            title="No"
            variant="outline"
            onPress={() => handleChoice(false)}
            style={{ flex: 1 }}
          />
          <OnboardingButton
            title="Yes"
            onPress={() => handleChoice(true)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'left', marginTop: 20, lineHeight: 32,
  },
  card: {
    backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: Theme.colors.border,
    borderRadius: 20, padding: 20, marginTop: 20, position: 'relative',
  },
  cardLabel: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textMuted, fontSize: 12,
  },
  cardValue: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, marginVertical: 5,
  },
  cardValueSmall: {
    fontSize: 16, color: Theme.colors.textMuted,
  },
  cardHighlight: {
    color: Theme.colors.primary, fontFamily: Theme.fonts.extraBold, fontSize: 12,
  },
  todayCard: {
    position: 'absolute', bottom: -20, right: -10,
    backgroundColor: Theme.colors.background, borderWidth: 2, borderColor: Theme.colors.border,
    padding: 15, borderRadius: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
    shadowRadius: 10, elevation: 4,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
  rowBtns: { flexDirection: 'row', gap: 15 },
});
