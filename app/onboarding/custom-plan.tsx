import { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
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
  const targetDate = isMaintain ? '' : getTargetDate(cw, tw, speed, unit);
  const highDayCount = (eatsMoreOnWeekends && weekendDays) ? weekendDays.length : 0;

  // Celebrative animation for goal badge
  const badgeEntry = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const badgeGlow = useSharedValue(0);
  const badgeShimmer = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 1. Bounce in
    badgeScale.value = withDelay(400, withSpring(1, { damping: 10, stiffness: 120, mass: 0.8 }));
    badgeEntry.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 100 }));
    // 2. Glow pulse
    badgeGlow.value = withDelay(900,
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
    );
    // 3. Shimmer sweep
    badgeShimmer.value = withDelay(1200,
      withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        2,
        false,
      ),
    );
  }, [badgeEntry, badgeScale, badgeGlow, badgeShimmer]);

  const badgeAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(badgeEntry.value, [0, 0.5, 1], [0, 0.8, 1]),
    transform: [
      { translateY: interpolate(badgeEntry.value, [0, 1], [20, 0]) },
      { scale: interpolate(badgeScale.value, [0, 1], [0.85, 1]) },
    ],
  }));
  const badgeGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(badgeGlow.value, [0, 1], [0.2, 0.6]),
    shadowRadius: interpolate(badgeGlow.value, [0, 1], [8, 25]),
  }));
  const badgeTextAnimStyle = useAnimatedStyle(() => ({
    color: interpolateColor(badgeShimmer.value, [0, 0.4, 0.6, 1], [
      Theme.colors.white, Theme.colors.accentBackground, Theme.colors.accentBackground, Theme.colors.white,
    ]),
  }));

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
        : Theme.colors.obeseDark;

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
        <Animated.View style={[styles.badge, badgeAnimStyle, badgeGlowStyle]}>
          <Animated.Text style={[styles.badgeText, badgeTextAnimStyle]}>{badgeText}</Animated.Text>
        </Animated.View>

        <Text style={styles.sectionTitle}>Your BMI</Text>
        <View style={styles.bmiCard} accessible={true} accessibilityLabel={`BMI: ${plan.bmi}, ${plan.bmiCategory}`}>
          <View style={styles.bmiHeader}>
            <Text style={styles.bmiValue}>{plan.bmi}</Text>
            <Text style={styles.bmiCategory}>{plan.bmiCategory}</Text>
          </View>
          <View style={styles.bmiBarContainer}>
            <View style={styles.bmiBar}>
              <View style={[styles.bmiSegment, { flex: 14, backgroundColor: Theme.colors.infoBlue }]} />
              <View style={[styles.bmiSegment, { flex: 26, backgroundColor: Theme.colors.success }]} />
              <View style={[styles.bmiSegment, { flex: 20, backgroundColor: Theme.colors.warning }]} />
              <View style={[styles.bmiSegment, { flex: 13, backgroundColor: Theme.colors.obeseLight }]} />
              <View style={[styles.bmiSegment, { flex: 14, backgroundColor: Theme.colors.obeseMid }]} />
              <View style={[styles.bmiSegment, { flex: 13, backgroundColor: Theme.colors.obeseDark }]} />
            </View>
            <View style={[styles.bmiMarker, { left: `${bmiPercent}%` }]}>
              <View style={[styles.bmiMarkerDot, { backgroundColor: bmiColor }]} />
            </View>
          </View>
          <View style={styles.bmiRangeLabels}>
            <View style={[styles.bmiRangeItem, { flex: 20 }]}>
              <View style={[styles.bmiRangeDot, { backgroundColor: Theme.colors.infoBlue }]} />
              <Text style={styles.bmiRangeText}>Underweight</Text>
            </View>
            <View style={[styles.bmiRangeItem, { flex: 22 }]}>
              <View style={[styles.bmiRangeDot, { backgroundColor: Theme.colors.success }]} />
              <Text style={styles.bmiRangeText}>Healthy</Text>
            </View>
            <View style={[styles.bmiRangeItem, { flex: 22 }]}>
              <View style={[styles.bmiRangeDot, { backgroundColor: Theme.colors.warning }]} />
              <Text style={styles.bmiRangeText}>Overweight</Text>
            </View>
            <View style={[styles.bmiRangeItem, { flex: 36 }]}>
              <View style={[styles.bmiRangeDot, { backgroundColor: Theme.colors.obeseDark }]} />
              <Text style={styles.bmiRangeText}>Obese</Text>
            </View>
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
    shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
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
    borderWidth: 2, borderColor: Theme.colors.border,
  },
  bmiHeader: {
    flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14,
  },
  bmiValue: {
    fontSize: 28, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  bmiCategory: {
    fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
  },
  bmiBarContainer: {
    position: 'relative', height: 14, marginBottom: 6,
  },
  bmiBar: {
    flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden',
  },
  bmiSegment: {
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.4)',
  },
  bmiMarker: {
    position: 'absolute', top: -2, marginLeft: -7,
  },
  bmiMarkerDot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2.5, borderColor: Theme.colors.surface,
  },
  bmiRangeLabels: {
    flexDirection: 'row', marginTop: 6,
  },
  bmiRangeItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  bmiRangeDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  bmiRangeText: {
    fontSize: 10, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark,
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
