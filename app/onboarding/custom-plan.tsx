import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingIcon } from '@/components/onboarding/OnboardingIcon';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { BouncyView } from '@/components/onboarding/BouncyView';
import { useOnboardingStore } from '@/store/onboarding-store';
import { getTargetDate } from '@/utils/target-date';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateMacros,
  calculateAge,
  calculateDaySplit,
  calculateBMI,
  getBMICategory,
} from '@/utils/calories';

export default function CustomPlanScreen() {
  const router = useRouter();
  const {
    currentWeight, targetWeight, weightUnit, weeklyGoalSpeed, goal,
    gender, birthYear, birthMonth, birthDay, height, activityLevel,
    eatsMoreOnWeekends, weekendDays,
  } = useOnboardingStore((s) => s.payload);

  const cw = currentWeight || 70;
  const tw = targetWeight || cw;
  const unit = weightUnit || 'kg';
  const diff = Math.abs(cw - tw);
  const isMaintain = goal === 'maintain';
  const isGaining = goal === 'gain';
  const speed = weeklyGoalSpeed ?? 0.5;
  const targetDate = isMaintain ? '' : getTargetDate(cw, tw, speed);
  const highDayCount = (eatsMoreOnWeekends && weekendDays) ? weekendDays.length : 0;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const plan = useMemo(() => {
    const weightKg = unit === 'lb' ? cw / 2.20462 : cw;
    const heightCm = height || 170;
    const age = (birthYear && birthMonth && birthDay)
      ? calculateAge(birthYear, birthMonth, birthDay)
      : 25;
    const sex = gender || 'male';
    const activity = activityLevel || 'moderate';

    const bmr = calculateBMR(weightKg, heightCm, age, sex);
    const tdee = calculateTDEE(bmr, activity);
    const dailyCal = calculateDailyCalories(tdee, goal || 'lose', speed, sex);
    const macros = calculateMacros(dailyCal, weightKg, activity);
    const daySplit = calculateDaySplit(dailyCal, highDayCount);
    const bmi = calculateBMI(weightKg, heightCm);
    const bmiCategory = getBMICategory(bmi);

    return { ...macros, ...daySplit, bmi, bmiCategory };
  }, [cw, height, birthYear, birthMonth, birthDay, gender, activityLevel, goal, speed, unit, highDayCount]);

  const MACROS = useMemo(() => [
    { value: `${plan.calories}`, label: 'Calories', color: Theme.colors.primary },
    { value: `${plan.carbs}g`, label: 'Carbs', color: Theme.colors.secondary },
    { value: `${plan.protein}g`, label: 'Protein', color: Theme.colors.primaryHover },
    { value: `${plan.fat}g`, label: 'Fats', color: Theme.colors.textMuted },
  ], [plan]);

  const badgeText = isMaintain
    ? `Target: Maintain ${cw} ${unit}`
    : isGaining
      ? `Target: Gain ${diff.toFixed(1)} ${unit} by ${targetDate}`
      : `Target: Lose ${diff.toFixed(1)} ${unit} by ${targetDate}`;

  const hasHighDays = highDayCount > 0 && highDayCount < 7;

  // Format high day names for display
  const highDayLabel = weekendDays && weekendDays.length <= 3
    ? weekendDays.map(d => d.slice(0, 3)).join(', ')
    : 'High days';
  const normalDayCount = 7 - highDayCount;

  // BMI bar: Underweight flex:14 (0-14%), Healthy flex:26 (14-40%), Overweight flex:20 (40-60%), Obese flex:40 (60-100%)
  const bmiPercent = plan.bmi < 18.5
    ? Math.max(0, ((plan.bmi - 10) / 8.5) * 14)
    : plan.bmi < 25
      ? 14 + ((plan.bmi - 18.5) / 6.5) * 26
      : plan.bmi < 30
        ? 40 + ((plan.bmi - 25) / 5) * 20
        : Math.min(100, 60 + ((plan.bmi - 30) / 10) * 40);
  const bmiColor = plan.bmi < 18.5
    ? Theme.colors.infoBlue
    : plan.bmi < 25
      ? Theme.colors.success
      : plan.bmi < 30
        ? Theme.colors.warning
        : Theme.colors.urgentRed;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={3} progress={100} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sparkle}>
          <OnboardingIcon name="sparkle" size={40} color={Theme.colors.primary} />
        </View>
        <Text style={styles.title}>Congratulations! Your plan is ready.</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>

        <Text style={styles.sectionTitle}>Your BMI</Text>
        <View style={styles.bmiCard} accessible={true} accessibilityLabel={`BMI: ${plan.bmi}, ${plan.bmiCategory}`}>
          <View style={styles.bmiHeader}>
            <Text style={[styles.bmiValue, { color: bmiColor }]}>{plan.bmi}</Text>
            <Text style={[styles.bmiCategory, { color: bmiColor }]}>{plan.bmiCategory}</Text>
          </View>
          <View style={styles.bmiBarContainer}>
            <View style={styles.bmiBar}>
              <View style={[styles.bmiSegment, { flex: 14, backgroundColor: Theme.colors.infoBlue }]} />
              <View style={[styles.bmiSegment, { flex: 26, backgroundColor: Theme.colors.success }]} />
              <View style={[styles.bmiSegment, { flex: 20, backgroundColor: Theme.colors.warning }]} />
              <View style={[styles.bmiSegment, { flex: 40, backgroundColor: Theme.colors.calorieAlert }]} />
            </View>
            <View style={[styles.bmiMarker, { left: `${bmiPercent}%` }]}>
              <View style={[styles.bmiMarkerDot, { backgroundColor: bmiColor }]} />
            </View>
          </View>
          <View style={styles.bmiLabels}>
            <Text style={styles.bmiLabelText}>15</Text>
            <Text style={styles.bmiLabelText}>18.5</Text>
            <Text style={styles.bmiLabelText}>25</Text>
            <Text style={styles.bmiLabelText}>30</Text>
            <Text style={styles.bmiLabelText}>40</Text>
          </View>
          <View style={styles.bmiRangeLabels}>
            <Text style={[styles.bmiRangeText, { color: Theme.colors.infoBlue }]}>Under</Text>
            <Text style={[styles.bmiRangeText, { color: Theme.colors.success }]}>Healthy</Text>
            <Text style={[styles.bmiRangeText, { color: Theme.colors.warningDark }]}>Over</Text>
            <Text style={[styles.bmiRangeText, { color: Theme.colors.urgentRed }]}>Obese</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Daily Recommendation</Text>
        <View style={styles.macroGrid}>
          {MACROS.map((m) => (
            <View key={m.label} style={styles.macroCard} accessible={true} accessibilityLabel={`${m.label}: ${m.value}`}>
              <View style={[styles.macroCircle, { borderColor: m.color }]}>
                <Text style={styles.macroValue}>{m.value}</Text>
              </View>
              <Text style={styles.macroLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {hasHighDays && (
          <View style={styles.daySplitSection}>
            <Text style={styles.daySplitTitle}>Your weekly calorie plan</Text>
            <View style={styles.daySplitRow}>
              <View style={styles.daySplitCard}>
                <Text style={styles.daySplitLabel}>Normal days</Text>
                <Text style={styles.daySplitValue}>{plan.normalDayCal}</Text>
                <Text style={styles.daySplitSub}>kcal × {normalDayCount} days</Text>
              </View>
              <View style={[styles.daySplitCard, styles.daySplitCardHigh]}>
                <Text style={styles.daySplitLabel}>{highDayLabel}</Text>
                <Text style={[styles.daySplitValue, { color: Theme.colors.primary }]}>{plan.highDayCal}</Text>
                <Text style={styles.daySplitSub}>kcal × {highDayCount} {highDayCount === 1 ? 'day' : 'days'}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.reference}>
          Based on the Mifflin-St Jeor equation (Am J Clin Nutr, 1990)
        </Text>
      </ScrollView>
      <View style={styles.bottomAction}>
        <OnboardingButton
          title="Start Journey"
          onPress={() => router.push('/onboarding/create-account')}
        />
      </View>
      </BouncyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, alignItems: 'center', paddingBottom: 16 },
  sparkle: { marginTop: 10, marginBottom: 10 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', lineHeight: 32,
  },
  badge: {
    backgroundColor: Theme.colors.primary, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: Theme.borderRadius.card, marginTop: 10,
  },
  badgeText: {
    color: Theme.colors.white, fontFamily: Theme.fonts.bold, fontSize: 14, textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 18,
    marginTop: 24,
  },
  macroGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16, width: '100%',
  },
  macroCard: {
    width: '47%', backgroundColor: Theme.colors.surface, padding: 12, borderRadius: Theme.borderRadius.card,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 2, borderColor: Theme.colors.border,
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
  daySplitSection: {
    width: '100%', marginTop: 20,
  },
  daySplitTitle: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 15,
    textAlign: 'center', marginBottom: 10,
  },
  daySplitRow: {
    flexDirection: 'row', gap: 12,
  },
  daySplitCard: {
    flex: 1, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  daySplitCardHigh: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryActive,
  },
  daySplitLabel: {
    fontFamily: Theme.fonts.semiBold, color: Theme.colors.textMuted, fontSize: 12,
  },
  daySplitValue: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 24,
    marginVertical: 4,
  },
  daySplitSub: {
    fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted, fontSize: 11,
  },
  bmiCard: {
    width: '100%', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card,
    padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  bmiHeader: {
    flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14,
  },
  bmiValue: {
    fontSize: 28, fontFamily: Theme.fonts.extraBold,
  },
  bmiCategory: {
    fontSize: 14, fontFamily: Theme.fonts.bold,
  },
  bmiBarContainer: {
    position: 'relative', height: 14, marginBottom: 6,
  },
  bmiBar: {
    flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden',
  },
  bmiSegment: {
    height: '100%',
  },
  bmiMarker: {
    position: 'absolute', top: -2, marginLeft: -7,
  },
  bmiMarkerDot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2.5, borderColor: Theme.colors.surface,
  },
  bmiLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  bmiLabelText: {
    fontSize: 10, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
  },
  bmiRangeLabels: {
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 4,
  },
  bmiRangeText: {
    fontSize: 10, fontFamily: Theme.fonts.semiBold,
  },
  reference: {
    fontSize: 11, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'center', marginTop: 20, lineHeight: 16,
  },
  bottomAction: {
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Theme.colors.border,
  },
});
