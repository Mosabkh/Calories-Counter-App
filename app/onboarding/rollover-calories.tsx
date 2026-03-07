import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';
import { BouncyView } from '@/components/onboarding/BouncyView';

export default function RolloverCaloriesScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);

  const goal = useOnboardingStore((s) => s.payload.goal) || 'lose';

  const handleChoice = (rollover: boolean) => {
    updatePayload({ rolloverCalories: rollover });
    // Maintain: skip projection chart (no weight change to project)
    router.push(goal === 'maintain' ? '/onboarding/notifications' : '/onboarding/projection');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={3} progress={85} />
      <View style={styles.content}>
        <Text style={styles.title}>Rollover extra calories to the next day?</Text>
        <Text style={styles.subtitle}>
          Unused calories carry over so nothing goes to waste.
        </Text>

        <View style={styles.illustration}>
          {/* Yesterday card */}
          <View style={styles.dayCard}>
            <Text style={styles.dayLabel}>Yesterday</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '70%' }]} />
            </View>
            <Text style={styles.dayCalories}>350 / 500 kcal</Text>
            <View style={styles.leftoverBadge}>
              <Text style={styles.leftoverText}>150 left</Text>
            </View>
          </View>

          {/* Arrow */}
          <View style={styles.arrowWrap}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path
                d="M5 12H19M19 12L13 6M19 12L13 18"
                stroke={Theme.colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          {/* Today card */}
          <View style={[styles.dayCard, styles.dayCardToday]}>
            <Text style={styles.dayLabel}>Today</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, styles.progressBarFillToday, { width: '54%' }]} />
            </View>
            <Text style={styles.dayCalories}>350 / 650 kcal</Text>
            <View style={[styles.leftoverBadge, styles.addedBadge]}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Line x1={12} y1={5} x2={12} y2={19} stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" />
                <Line x1={5} y1={12} x2={19} y2={12} stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
              <Text style={styles.addedText}>150 added</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke={Theme.colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M12 16V12" stroke={Theme.colors.primary} strokeWidth={2} strokeLinecap="round" />
            <Path d="M12 8H12.01" stroke={Theme.colors.primary} strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <Text style={styles.infoText}>
            This helps you stay flexible without falling off track.
          </Text>
        </View>
      </View>
      <View style={styles.bottomAction}>
        <View style={styles.rowBtns}>
          <OnboardingButton
            title="No"
            variant="outline"
            onPress={() => handleChoice(false)}
            style={styles.flexBtn}
          />
          <OnboardingButton
            title="Yes"
            onPress={() => handleChoice(true)}
            style={styles.flexBtn}
          />
        </View>
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
    textAlign: 'left', marginTop: 20, lineHeight: 32,
  },
  subtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    marginTop: 6, lineHeight: 21,
  },
  illustration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  dayCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.card,
    padding: 14,
    alignItems: 'center',
  },
  dayCardToday: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryActive,
  },
  dayLabel: {
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.secondary,
    borderRadius: 4,
  },
  progressBarFillToday: {
    backgroundColor: Theme.colors.primary,
  },
  dayCalories: {
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    fontSize: 13,
    marginBottom: 8,
  },
  leftoverBadge: {
    backgroundColor: Theme.colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leftoverText: {
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
    fontSize: 11,
  },
  addedBadge: {
    backgroundColor: Theme.colors.primaryActive,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addedText: {
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
    fontSize: 11,
  },
  arrowWrap: {
    width: 32,
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.card,
    padding: 16,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
  rowBtns: { flexDirection: 'row', gap: 15 },
  flexBtn: { flex: 1 },
});
