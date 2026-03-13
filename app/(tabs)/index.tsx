import { useMemo, useState, useEffect, useCallback, useRef, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  withRepeat,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { useUserStore } from '@/store/user-store';
import { useDiaryStore } from '@/store/diary-store';
import { useStreakStore } from '@/store/streak-store';
import { useExerciseStore } from '@/store/exercise-store';
import { useWeightStore } from '@/store/weight-store';
import { usePhotoStore } from '@/store/photo-store';
import { toDateKey, daysAgoKey } from '@/utils/date';
import { getTargetDate } from '@/utils/target-date';
import { calculateDaySplit } from '@/utils/calories';
import { launchMealCamera } from '@/utils/camera';
import { MealListItem } from '@/components/MealListItem';
import type { MealEntry } from '@/types/data';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DAY_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const EMPTY_MEALS: MealEntry[] = [];
const EMPTY_EXERCISES: never[] = [];

function getWeekDays() {
  const today = new Date();
  const todayKey = toDateKey(today);
  const dayOfWeek = today.getDay(); // 0=Sun
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i); // start from Sunday
    const dk = toDateKey(d);
    days.push({
      name: DAY_NAMES[d.getDay()],
      num: d.getDate(),
      dateKey: dk,
      isToday: dk === todayKey,
      isFuture: dk > todayKey,
    });
  }
  return { days, todayKey };
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatPhotoDate(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  const base = `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  const currentYear = new Date().getFullYear();
  return d.getFullYear() !== currentYear ? `${base} '${String(d.getFullYear()).slice(2)}` : base;
}

const DonutChart = memo(function DonutChart({
  size,
  strokeWidth,
  progress,
  color,
  delay = 0,
  children,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  delay?: number;
  children?: React.ReactNode;
}): React.ReactElement {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);
  const hasAnimated = useRef(false);

  // Spiral Reveal: opacity, scale, rotation for intro
  const revealOpacity = useSharedValue(0);
  const revealScale = useSharedValue(0.8);
  const revealRotation = useSharedValue(90);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;

      // Spiral reveal: fade in + scale up + rotate into place
      const opacityAnim = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      const scaleAnim = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      const rotationAnim = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });

      // Ring fill starts slightly after the reveal begins
      const fillTarget = progress > 0 ? progress : 0.12;
      const fillAnim = withSequence(
        withTiming(fillTarget, { duration: 600, easing: Easing.out(Easing.cubic) }),
        // Settle: if progress is 0, sweep back to 0; otherwise hold
        withTiming(progress, { duration: 300, easing: Easing.inOut(Easing.cubic) }),
      );

      if (delay > 0) {
        revealOpacity.value = withDelay(delay, opacityAnim);
        revealScale.value = withDelay(delay, scaleAnim);
        revealRotation.value = withDelay(delay, rotationAnim);
        animatedProgress.value = withDelay(delay + 100, fillAnim);
      } else {
        revealOpacity.value = opacityAnim;
        revealScale.value = scaleAnim;
        revealRotation.value = rotationAnim;
        animatedProgress.value = withDelay(100, fillAnim);
      }
    } else {
      // Subsequent updates: simple smooth tween
      animatedProgress.value = withTiming(progress, { duration: 400, easing: Easing.inOut(Easing.cubic) });
    }
  }, [progress, animatedProgress, delay, revealOpacity, revealScale, revealRotation]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
    transform: [
      { scale: revealScale.value },
      { rotate: `${revealRotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.donutContainer, { width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size} style={styles.donutSvg} accessible={false}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Theme.colors.background}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </Animated.View>
  );
});

const MAX_MATCH_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function HomeScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const weightEntries = useWeightStore((s) => s.entries);
  const streak = useStreakStore((s) => s.streak);
  const streakCount = useMemo(() => {
    const { currentStreak, lastLoggedDate } = streak;
    if (currentStreak === 0 || !lastLoggedDate) return 0;
    const today = toDateKey(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDateKey(yesterday);
    // Streak is valid if last logged today or yesterday
    if (lastLoggedDate === today || lastLoggedDate === yesterdayStr) return currentStreak;
    return 0;
  }, [streak]);

  const latestWeight = weightEntries[0] ?? null;

  // Refresh weekDays when app comes to foreground (handles midnight crossing)
  const [todayStr, setTodayStr] = useState(() => toDateKey(new Date()));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const newToday = toDateKey(new Date());
        setTodayStr((prev) => (prev !== newToday ? newToday : prev));
      }
    });
    return () => sub.remove();
  }, []);

  const { days: weekDays, todayKey } = useMemo(() => getWeekDays(), [todayStr]);

  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Re-sync selected date to today when todayKey changes (e.g., app open across midnight)
  useEffect(() => {
    setSelectedDateKey((prev) => {
      // Only auto-sync if the previous selection was the old "today"
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return prev === toDateKey(yesterday) ? todayKey : prev;
    });
  }, [todayKey]);

  // Narrow selectors: only re-render when the viewed date's data changes
  const dayMeals = useDiaryStore((s) => s.entries[selectedDateKey] ?? EMPTY_MEALS);
  const dayExercises = useExerciseStore((s) => s.entries[selectedDateKey] ?? EMPTY_EXERCISES);
  const sortedMeals = useMemo(() => dayMeals.slice().sort((a, b) => b.timestamp - a.timestamp), [dayMeals]);

  const handleMealPress = useCallback((m: MealEntry) => {
    router.push({ pathname: '/log-meal', params: { editMealId: m.id, date: m.date } });
  }, [router]);
  const handleProfilePress = useCallback(() => {
    router.navigate('/(tabs)/profile');
  }, [router]);
  const handleStreakPress = useCallback(() => {
    router.navigate('/(tabs)/progress');
  }, [router]);
  const handleDayPress = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
  }, []);
  const handleEmptyMealPress = useCallback(async () => {
    const uri = await launchMealCamera();
    if (uri) {
      router.push({ pathname: '/log-meal', params: { imageUri: uri, date: selectedDateKey } });
    }
  }, [router, selectedDateKey]);
  const daySummary = useMemo(() => {
    const meals = dayMeals;
    if (meals.length === 0) return { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 };
    return {
      totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
      totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
      totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
      totalFat: meals.reduce((sum, m) => sum + m.fat, 0),
      mealCount: meals.length,
    };
  }, [dayMeals]);
  const caloriesBurned = useMemo(() => {
    if (dayExercises.length === 0) return 0;
    return dayExercises.reduce((sum: number, e: { caloriesBurned: number }) => sum + e.caloriesBurned, 0);
  }, [dayExercises]);
  const addBurnedCalories = profile?.addBurnedCalories ?? false;

  // Targets from profile (pre-calculated at graduation)
  const profileCalorieTarget = profile?.dailyCalorieTarget ?? 2000;
  const proteinTarget = profile?.proteinTarget ?? 150;
  const carbsTarget = profile?.carbsTarget ?? 200;
  const fatTarget = profile?.fatTarget ?? 55;

  // B9: Apply day-split (zigzag) if user chose high days in onboarding
  const baseCalorieTarget = useMemo(() => {
    const hasHighDays = profile?.eatsMoreOnWeekends && profile.weekendDays.length > 0 && profile.weekendDays.length < 7;
    if (!hasHighDays) return profileCalorieTarget;
    const { normalDayCal, highDayCal } = calculateDaySplit(profileCalorieTarget, profile.weekendDays.length);
    const selectedDay = new Date(selectedDateKey + 'T00:00:00').getDay();
    const dayName = FULL_DAY_NAMES[selectedDay];
    return profile.weekendDays.includes(dayName) ? highDayCal : normalDayCal;
  }, [profileCalorieTarget, profile?.eatsMoreOnWeekends, profile?.weekendDays, selectedDateKey]);

  const burnAdjustedTarget = addBurnedCalories ? baseCalorieTarget + caloriesBurned : baseCalorieTarget;

  // Over-budget spreading: if user exceeded budget in past 2 days, reduce today's target
  // Narrow selectors: only subscribe to the 2 specific days we need (not all entries)
  const yesterdayKey = useMemo(() => daysAgoKey(1), [todayStr]);
  const twoDaysAgoKey = useMemo(() => daysAgoKey(2), [todayStr]);
  const yesterdayMeals = useDiaryStore((s) => s.entries[yesterdayKey] ?? EMPTY_MEALS);
  const twoDaysAgoMeals = useDiaryStore((s) => s.entries[twoDaysAgoKey] ?? EMPTY_MEALS);
  const { calorieTarget, budgetReduction } = useMemo(() => {
    let deficit = 0;
    for (const meals of [yesterdayMeals, twoDaysAgoMeals]) {
      if (meals.length > 0) {
        const dayTotal = meals.reduce((sum, m) => sum + m.calories, 0);
        const excess = dayTotal - burnAdjustedTarget;
        if (excess > 0) deficit += Math.round(excess / 2);
      }
    }
    // Floor: never go below safety minimum (1200 women / 1500 men)
    const minCal = profile?.gender === 'female' ? 1200 : 1500;
    const adjusted = Math.max(minCal, burnAdjustedTarget - deficit);
    return { calorieTarget: adjusted, budgetReduction: deficit > 0 ? burnAdjustedTarget - adjusted : 0 };
  }, [yesterdayMeals, twoDaysAgoMeals, burnAdjustedTarget, profile?.gender]);

  // Over-budget detection
  const isOverBudget = daySummary.totalCalories > calorieTarget;
  const caloriesOver = isOverBudget ? daySummary.totalCalories - calorieTarget : 0;
  const calRemaining = isOverBudget ? 0 : calorieTarget - daySummary.totalCalories;

  // B12: Goal-met encouragement (90-100% of target consumed, at least 1 meal logged)
  const calRatio = calorieTarget > 0 ? daySummary.totalCalories / calorieTarget : 0;
  const isGoalMet = !isOverBudget && daySummary.mealCount > 0 && calRatio >= 0.9;
  const proteinRemaining = Math.max(0, proteinTarget - daySummary.totalProtein);
  const carbsRemaining = Math.max(0, carbsTarget - daySummary.totalCarbs);
  const fatRemaining = Math.max(0, fatTarget - daySummary.totalFat);

  // Progress ratios for donut charts (clamped 0-1, guarded against division by zero)
  const calProgress = calorieTarget > 0 ? Math.min(1, daySummary.totalCalories / calorieTarget) : 0;
  const proteinProgress = proteinTarget > 0 ? Math.min(1, daySummary.totalProtein / proteinTarget) : 0;
  const carbsProgress = carbsTarget > 0 ? Math.min(1, daySummary.totalCarbs / carbsTarget) : 0;
  const fatProgress = fatTarget > 0 ? Math.min(1, daySummary.totalFat / fatTarget) : 0;

  const goalDateLabel = useMemo(() => {
    if (!profile) return null;
    if (profile.goal === 'maintain') return null;
    if (profile.targetWeight === profile.startWeight) return null;
    // Use latest weigh-in if available, otherwise start weight
    const currentWeight = latestWeight?.weight ?? profile.startWeight;
    // Already at or past goal
    const isLose = profile.goal === 'lose';
    if (isLose && currentWeight <= profile.targetWeight) return null;
    if (!isLose && currentWeight >= profile.targetWeight) return null;
    const diff = Math.abs(currentWeight - profile.targetWeight).toFixed(1);
    const unit = profile.weightUnit;
    const action = isLose ? 'Lose' : 'Gain';
    const dateStr = getTargetDate(currentWeight, profile.targetWeight, profile.weeklyGoalSpeed, profile.weightUnit);
    return { action, diff, unit, date: dateStr };
  }, [profile, latestWeight]);

  // Goal prediction bar — celebrative entrance
  const goalEntry = useSharedValue(0);
  const goalScale = useSharedValue(0);
  const goalGlow = useSharedValue(0);
  const goalShimmer = useSharedValue(0);

  useEffect(() => {
    if (goalDateLabel) {
      // 1. Bounce in from below
      goalScale.value = withDelay(1200, withSpring(1, { damping: 10, stiffness: 120, mass: 0.8 }));
      goalEntry.value = withDelay(1200, withSpring(1, { damping: 12, stiffness: 100 }));
      // 2. Glow pulse after arrival
      goalGlow.value = withDelay(1800,
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
      );
      // 3. Shimmer sweep across text
      goalShimmer.value = withDelay(2000,
        withRepeat(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          2,
          false,
        ),
      );
    }
  }, [goalDateLabel, goalEntry, goalScale, goalGlow, goalShimmer]);

  const goalBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(goalEntry.value, [0, 0.5, 1], [0, 0.8, 1]),
    transform: [
      { translateY: interpolate(goalEntry.value, [0, 1], [30, 0]) },
      { scale: interpolate(goalScale.value, [0, 1], [0.9, 1]) },
    ],
  }));
  const goalGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(goalGlow.value, [0, 1], [0.03, 0.25]),
    shadowRadius: interpolate(goalGlow.value, [0, 1], [10, 30]),
    borderColor: interpolateColor(goalGlow.value, [0, 0.5, 1], [Theme.colors.border, Theme.colors.primary, Theme.colors.primary]),
  }));
  const goalTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(goalShimmer.value, [0, 0.4, 0.6, 1], [
      Theme.colors.textDark, Theme.colors.primary, Theme.colors.primary, Theme.colors.textDark,
    ]),
  }));
  const goalBoldTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(goalShimmer.value, [0, 0.4, 0.6, 1], [
      Theme.colors.textDark, Theme.colors.urgentRed, Theme.colors.urgentRed, Theme.colors.textDark,
    ]),
  }));

  // Before & After card (0 photos → sketch, 1 photo → half-filled, 2+ → both real)
  const photos = usePhotoStore((s) => s.photos);
  const photoCount = photos.length;
  const firstPhoto = useMemo(() => (photos.length > 0 ? photos[photos.length - 1] : null), [photos]);
  const latestPhoto = useMemo(() => (photos.length >= 2 ? photos[0] : null), [photos]);
  // Match each photo to the closest weight entry by timestamp (max 24h gap)
  const getWeightForPhoto = useCallback((photoTimestamp: number): { weight: number; unit: 'kg' | 'lb' } | null => {
    if (weightEntries.length === 0) return null;
    let closest = weightEntries[0];
    let closestDiff = Math.abs(photoTimestamp - closest.timestamp);
    for (let i = 1; i < weightEntries.length; i++) {
      const diff = Math.abs(photoTimestamp - weightEntries[i].timestamp);
      if (diff < closestDiff) {
        closest = weightEntries[i];
        closestDiff = diff;
      }
    }
    if (closestDiff > MAX_MATCH_MS) return null;
    return { weight: closest.weight, unit: closest.unit };
  }, [weightEntries]);

  const firstPhotoWeight = useMemo(
    () => (firstPhoto ? getWeightForPhoto(firstPhoto.timestamp) : null),
    [firstPhoto, getWeightForPhoto],
  );
  const latestPhotoWeight = useMemo(
    () => (latestPhoto ? getWeightForPhoto(latestPhoto.timestamp) : null),
    [latestPhoto, getWeightForPhoto],
  );

  const greeting = profile?.name ? `Hi, ${profile.name}` : 'Hi there';

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.container, styles.emptyStateCenter]}>
          <Text style={styles.emptyStateTitle}>Welcome to Calobite</Text>
          <Text style={styles.emptyStateSubtitle}>
            Complete the onboarding to set up your profile and start tracking.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo} accessible={true} accessibilityLabel="Calobite">
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path
                d="M12 21.6C16.8 21.6 20.4 18 20.4 13.2C20.4 9.6 18 6 15.6 3.6L12 1.2L8.4 3.6C6 6 3.6 9.6 3.6 13.2C3.6 18 7.2 21.6 12 21.6Z"
                stroke={Theme.colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.logoText} accessible={false}>Calobite</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.streakPill}
              onPress={handleStreakPress}
              activeOpacity={0.7}
              accessibilityLabel={`${streakCount} day streak`}
              accessibilityRole="button"
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Circle cx={12} cy={8} r={6} stroke={Theme.colors.warning} strokeWidth={2.5} />
                <Path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" stroke={Theme.colors.warning} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M12 5v6M9 8h6" stroke={Theme.colors.warning} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
              <Text style={styles.streakText} accessible={false}>{streakCount}d</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={handleProfilePress}
              activeOpacity={0.7}
              accessibilityLabel="Open profile settings"
              accessibilityRole="button"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={12} cy={7} r={4} stroke={Theme.colors.primary} strokeWidth={2.5} />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting} accessibilityRole="header">{greeting}</Text>

        {/* Calendar Strip */}
        <View style={styles.calendarRow} accessibilityRole="radiogroup" accessibilityLabel="Week calendar">
          {weekDays.map((day) => {
            const isSelected = day.dateKey === selectedDateKey;
            const monthLabel = SHORT_MONTHS[new Date(day.dateKey + 'T00:00:00').getMonth()];
            return (
              <TouchableOpacity
                key={day.dateKey}
                style={[styles.dayCol, day.isFuture && styles.dayColFuture]}
                hitSlop={DAY_HIT_SLOP}
                accessible={true}
                accessibilityLabel={`${day.name} ${monthLabel} ${day.num}${day.isToday ? ', today' : ''}${day.isFuture ? ', future' : ''}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected, disabled: day.isFuture }}
                activeOpacity={day.isFuture ? 1 : 0.7}
                onPress={day.isFuture ? undefined : () => handleDayPress(day.dateKey)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameActive, day.isFuture && styles.dayTextFuture]}>{day.name}</Text>
                <View style={[styles.dayCircle, isSelected && styles.dayCircleActive, day.isFuture && styles.dayCircleFuture]}>
                  <Text style={[styles.dayNum, isSelected && styles.dayNumActive, day.isFuture && styles.dayTextFuture]}>{day.num}</Text>
                </View>
                {day.isToday && <View style={[styles.todayDot, isSelected && styles.todayDotActive]} accessible={false} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Calorie Card */}
        <View style={[styles.mainCard, isOverBudget && styles.mainCardOver]} accessible={true} accessibilityLabel={isOverBudget ? `${caloriesOver} Calories over budget` : `${calRemaining} of ${calorieTarget} Calories left`}>
          <View>
            <Text style={[styles.calorieValue, isOverBudget && styles.calorieValueOver]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{isOverBudget ? caloriesOver : calRemaining}</Text>
            <Text style={[styles.calorieLabel, isOverBudget && styles.calorieLabelOver]}>
              Calories <Text style={[styles.calorieLabelBold, isOverBudget && styles.calorieLabelOver]}>{isOverBudget ? 'over' : 'left'}</Text>
            </Text>
          </View>
          <DonutChart size={65} strokeWidth={7} progress={calProgress} color={isOverBudget ? Theme.colors.urgentRed : Theme.colors.calorieAlert}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={isOverBudget ? Theme.colors.urgentRed : Theme.colors.calorieAlert} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </DonutChart>
        </View>

        {/* Over-budget notice: excess will be spread across the next 2 days */}
        {isOverBudget && (
          <View style={styles.overBudgetNotice} accessible={true} accessibilityLabel={`${caloriesOver} calories over budget will be spread across the next 2 days`}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Circle cx={12} cy={12} r={10} stroke={Theme.colors.urgentRed} strokeWidth={2} />
              <Path d="M12 8v4M12 16h.01" stroke={Theme.colors.urgentRed} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={styles.overBudgetText}>
              <Text style={styles.overBudgetBold}>{caloriesOver} cal</Text> over — will be split across the next 2 days
            </Text>
          </View>
        )}

        {/* Adjusted budget notice: today's target was reduced due to past overages */}
        {!isOverBudget && budgetReduction > 0 && (
          <View style={styles.adjustedBudgetNotice} accessible={true} accessibilityLabel={`Budget reduced by ${budgetReduction} calories due to recent overages`}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Circle cx={12} cy={12} r={10} stroke={Theme.colors.warning} strokeWidth={2} />
              <Path d="M12 8v4M12 16h.01" stroke={Theme.colors.warning} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={styles.adjustedBudgetText}>
              Budget reduced by <Text style={styles.adjustedBudgetBold}>{budgetReduction} cal</Text> due to recent overages
            </Text>
          </View>
        )}

        {/* B12: Encouragement when daily calorie goal is met */}
        {isGoalMet && (
          <View style={styles.encouragementNotice} accessible={true} accessibilityLabel="Great job, you hit your calorie goal">
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={Theme.colors.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M22 4L12 14.01l-3-3" stroke={Theme.colors.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.encouragementText}>
              {profile?.goal === 'gain'
                ? 'Nice — you hit your calorie target!'
                : 'Well done — right on track!'}
            </Text>
          </View>
        )}

        {/* Macros Grid */}
        <View style={styles.macrosGrid} accessibilityLabel="Daily macro breakdown">
          <View style={styles.macroCard} accessible={true} accessibilityLabel={`${proteinRemaining}g of ${proteinTarget}g Protein left`}>
            <View style={styles.macroTextBlock}>
              <Text style={styles.macroValue}>{proteinRemaining}g</Text>
              <Text style={styles.macroLabel}>Protein <Text style={styles.macroLabelBold}>left</Text></Text>
            </View>
            <DonutChart size={44} strokeWidth={5} progress={proteinProgress} color={Theme.colors.protein} delay={75}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path d="M6 7v10M18 7v10M2 9v6M22 9v6M2 12h20" stroke={Theme.colors.protein} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            </DonutChart>
          </View>
          <View style={styles.macroCard} accessible={true} accessibilityLabel={`${carbsRemaining}g of ${carbsTarget}g Carbs left`}>
            <View style={styles.macroTextBlock}>
              <Text style={styles.macroValue}>{carbsRemaining}g</Text>
              <Text style={styles.macroLabel}>Carbs <Text style={styles.macroLabelBold}>left</Text></Text>
            </View>
            <DonutChart size={44} strokeWidth={5} progress={carbsProgress} color={Theme.colors.protein} delay={150}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path d="M12 3v19" stroke={Theme.colors.protein} strokeWidth={2.5} strokeLinecap="round" />
                <Path d="M7 7l5-4 5 4" stroke={Theme.colors.protein} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M7 12l5-4 5 4" stroke={Theme.colors.protein} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M7 17l5-4 5 4" stroke={Theme.colors.protein} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </DonutChart>
          </View>
          <View style={styles.macroCard} accessible={true} accessibilityLabel={`${fatRemaining}g of ${fatTarget}g Fats left`}>
            <View style={styles.macroTextBlock}>
              <Text style={styles.macroValue}>{fatRemaining}g</Text>
              <Text style={styles.macroLabel}>Fats <Text style={styles.macroLabelBold}>left</Text></Text>
            </View>
            <DonutChart size={44} strokeWidth={5} progress={fatProgress} color={Theme.colors.success} delay={225}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path d="M12 2.7c-2.8 4.3-7 8.3-7 12.3a7 7 0 0 0 14 0c0-4-4.2-8-7-12.3z" stroke={Theme.colors.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </DonutChart>
          </View>
        </View>

        {/* Goal Prediction */}
        {goalDateLabel && (
          <Animated.View style={[styles.goalPredictionBar, goalBarStyle, goalGlowStyle]} accessible={true} accessibilityLabel={`Target: ${goalDateLabel.action} ${goalDateLabel.diff} ${goalDateLabel.unit} by ${goalDateLabel.date}`}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={Theme.colors.calorieAlert} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <Line x1={4} y1={22} x2={4} y2={15} stroke={Theme.colors.calorieAlert} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
            <Animated.Text style={[styles.goalPredictionText, goalTextStyle]}>
              Target: {goalDateLabel.action} <Animated.Text style={[styles.goalPredictionBold, goalBoldTextStyle]}>{goalDateLabel.diff} {goalDateLabel.unit}</Animated.Text> by <Animated.Text style={[styles.goalPredictionBold, goalBoldTextStyle]}>{goalDateLabel.date}</Animated.Text>
            </Animated.Text>
          </Animated.View>
        )}

        {/* Before & After card — hidden for maintain goal */}
        {profile.goal !== 'maintain' && (
          <TouchableOpacity
            style={styles.thenNowCard}
            activeOpacity={0.7}
            onPress={() => router.push(photoCount >= 2 ? '/progress-photos' : '/log-weight')}
            accessibilityLabel={
              photoCount >= 2
                ? 'View your progress photos, day 1 versus latest'
                : photoCount === 1
                  ? 'Weigh in to add another progress photo'
                  : 'Weigh in to capture your starting point'
            }
            accessibilityRole="button"
          >
            {/* Title row */}
            <View style={styles.thenNowTitleRow} accessible={false}>
              <Text style={styles.thenNowTitle}>Your Transformation</Text>
              {photoCount < 5 && (
                <Text style={styles.thenNowSubtitle}>Latest side updates automatically with each new photo</Text>
              )}
            </View>

            {/* Photos row */}
            <View style={styles.thenNowPhotosRow}>
              {/* Day 1 (left) */}
              <View style={styles.thenNowPhotoWrap}>
                {firstPhoto ? (
                  <View style={styles.thenNowPhotoContainer}>
                    <Image source={{ uri: firstPhoto.uri }} style={styles.thenNowPhoto} contentFit="cover" transition={200} accessible={false} />
                    <View style={styles.thenNowDateBadge}>
                      <Text style={styles.thenNowDateText}>{formatPhotoDate(firstPhoto.date)}</Text>
                      {firstPhotoWeight && <Text style={styles.thenNowWeightText}>{firstPhotoWeight.weight.toFixed(1)} {firstPhotoWeight.unit}</Text>}
                    </View>
                  </View>
                ) : (
                  <View style={styles.thenNowPlaceholder}>
                    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" accessible={false}>
                      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.textDark} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />
                      <Circle cx={12} cy={7} r={4} stroke={Theme.colors.textDark} strokeWidth={1.5} strokeDasharray="3 3" />
                    </Svg>
                    <View style={styles.thenNowAddBadge}>
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" accessible={false}>
                        <Path d="M12 5v14M5 12h14" stroke={Theme.colors.white} strokeWidth={3} strokeLinecap="round" />
                      </Svg>
                    </View>
                  </View>
                )}
                <Text style={styles.thenNowLabel}>Day 1</Text>
              </View>

              {/* Arrow */}
              <View style={styles.thenNowArrow} accessible={false}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" accessible={false}>
                  <Path d="M5 12h14M12 5l7 7-7 7" stroke={photoCount >= 2 ? Theme.colors.primary : Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>

              {/* Latest (right) — star icon for aspiration */}
              <View style={styles.thenNowPhotoWrap}>
                {latestPhoto ? (
                  <View style={styles.thenNowPhotoContainer}>
                    <Image source={{ uri: latestPhoto.uri }} style={styles.thenNowPhoto} contentFit="cover" transition={200} accessible={false} />
                    <View style={styles.thenNowDateBadge}>
                      <Text style={styles.thenNowDateText}>{formatPhotoDate(latestPhoto.date)}</Text>
                      {latestPhotoWeight && <Text style={styles.thenNowWeightText}>{latestPhotoWeight.weight.toFixed(1)} {latestPhotoWeight.unit}</Text>}
                    </View>
                  </View>
                ) : (
                  <View style={styles.thenNowPlaceholder}>
                    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" accessible={false}>
                      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.textDark} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />
                      <Circle cx={12} cy={7} r={4} stroke={Theme.colors.textDark} strokeWidth={1.5} strokeDasharray="3 3" />
                    </Svg>
                    {photoCount === 1 && (
                      <View style={styles.thenNowAddBadge}>
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" accessible={false}>
                          <Path d="M12 5v14M5 12h14" stroke={Theme.colors.white} strokeWidth={3} strokeLinecap="round" />
                        </Svg>
                      </View>
                    )}
                  </View>
                )}
                <Text style={styles.thenNowLabel}>Latest</Text>
              </View>
            </View>

            {/* Hint for empty/partial states */}
            {photoCount < 2 && (
              <Text style={styles.thenNowHint}>
                {photoCount === 0 ? 'Weigh in today to capture your starting point' : 'Add one more photo to unlock your progress view'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Meals list or empty state */}
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {selectedDateKey === todayKey ? 'Recently uploaded' : `Meals on ${formatPhotoDate(selectedDateKey)}`}
        </Text>
        {sortedMeals.length > 0 ? (
          <View style={styles.mealsListWrap}>
            {sortedMeals.map((meal) => (
                <MealListItem
                  key={meal.id}
                  meal={meal}
                  onPress={handleMealPress}
                />
              ))}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyCard}
            activeOpacity={0.7}
            accessibilityLabel="Snap your first meal"
            accessibilityRole="button"
            onPress={handleEmptyMealPress}
          >
            <View style={styles.cameraIconWrap}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={Theme.colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={12} cy={13} r={4} stroke={Theme.colors.primary} strokeWidth={2} />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>Snap your first meal</Text>
            <Text style={styles.emptySubtitle}>Take a photo of your food to start tracking</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.accentBackground,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 20,
  },
  scrollContent: { paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.accentBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  streakPill: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: Theme.colors.border,
  },
  streakText: {
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    fontSize: 14,
  },
  greeting: {
    fontSize: 22,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    marginTop: 20,
    marginBottom: 16,
  },

  // Calendar
  calendarRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16,
  },
  dayCol: { alignItems: 'center', gap: 6, flex: 1 },
  dayName: { fontSize: 12, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark },
  dayNameActive: { color: Theme.colors.primary, fontFamily: Theme.fonts.extraBold },
  dayCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Theme.colors.border,
  },
  dayCircleActive: {
    backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  dayNum: { fontFamily: Theme.fonts.extraBold, fontSize: 14, color: Theme.colors.textDark },
  dayNumActive: { color: Theme.colors.white },
  todayDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: Theme.colors.primary, marginTop: 2,
  },
  todayDotActive: {
    backgroundColor: Theme.colors.white,
  },
  dayColFuture: { opacity: 0.35 },
  dayCircleFuture: { borderColor: Theme.colors.separator },
  dayTextFuture: { color: Theme.colors.separator },

  // Main Card
  mainCard: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card, paddingHorizontal: 20,
    paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05, shadowRadius: 20, elevation: 3, borderWidth: 2,
    borderColor: Theme.colors.border, marginBottom: 12,
  },
  calorieValue: {
    fontSize: 32, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  calorieLabel: {
    fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark, marginTop: 3,
  },
  calorieLabelBold: { color: Theme.colors.textDark },
  mainCardOver: { borderColor: Theme.colors.urgentRed },
  calorieValueOver: { color: Theme.colors.urgentRed },
  calorieLabelOver: { color: Theme.colors.urgentRed },
  overBudgetNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.08)', borderRadius: Theme.borderRadius.small,
    paddingHorizontal: 14, paddingVertical: 10, marginTop: -4, marginBottom: 12,
  },
  overBudgetText: {
    flex: 1, fontSize: 12, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark, lineHeight: 17,
  },
  overBudgetBold: { fontFamily: Theme.fonts.extraBold, color: Theme.colors.urgentRed },
  adjustedBudgetNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Theme.colors.warningLight, borderRadius: Theme.borderRadius.small,
    paddingHorizontal: 14, paddingVertical: 10, marginTop: -4, marginBottom: 12,
  },
  adjustedBudgetText: {
    flex: 1, fontSize: 12, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark, lineHeight: 17,
  },
  adjustedBudgetBold: { fontFamily: Theme.fonts.extraBold, color: Theme.colors.warningDark },
  encouragementNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Theme.colors.encouragementBg, borderRadius: Theme.borderRadius.small,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
  },
  encouragementText: {
    flex: 1, fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.encouragementText,
  },

  // Macros
  macrosGrid: {
    flexDirection: 'row', gap: 12, marginBottom: 25,
  },
  macroCard: {
    flex: 1, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card,
    paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center',
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 2, borderWidth: 2,
    borderColor: Theme.colors.border,
  },
  macroTextBlock: {
    minHeight: 40, justifyContent: 'center', marginBottom: 10, alignItems: 'center',
  },
  macroValue: {
    fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center',
  },
  macroLabel: {
    fontSize: 12, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
    textAlign: 'center', marginTop: 2, lineHeight: 18,
  },
  macroLabelBold: { color: Theme.colors.textDark },
  donutContainer: { alignItems: 'center', justifyContent: 'center' },
  donutSvg: { position: 'absolute' as const },

  // Goal Prediction
  goalPredictionBar: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card, paddingVertical: 14,
    paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
    borderWidth: 2, borderColor: Theme.colors.border,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 1,
  },
  goalPredictionText: {
    flex: 1, fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted, lineHeight: 20,
  },
  goalPredictionBold: { fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },

  // Before & After
  thenNowCard: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card,
    paddingVertical: 16, paddingHorizontal: 18, marginBottom: 20,
    borderWidth: 2, borderColor: Theme.colors.border,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 10, elevation: 1,
  },
  thenNowTitleRow: { alignItems: 'center', marginBottom: 12 },
  thenNowTitle: {
    fontSize: 16, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  thenNowSubtitle: {
    fontSize: 11, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark,
    marginTop: 3,
  },
  thenNowPhotosRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  thenNowPhotoWrap: { flex: 1, alignItems: 'center', gap: 6 },
  thenNowPhotoContainer: { width: '100%' },
  thenNowPhoto: {
    width: '100%', aspectRatio: 3 / 4, borderRadius: Theme.borderRadius.small,
    borderWidth: 2, borderColor: Theme.colors.border,
  },
  thenNowPlaceholder: {
    width: '100%', aspectRatio: 3 / 4, borderRadius: Theme.borderRadius.small, overflow: 'hidden',
    borderWidth: 2, borderColor: Theme.colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Theme.colors.background,
  },
  thenNowAddBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  thenNowDateBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  thenNowDateText: {
    fontSize: 8, fontFamily: Theme.fonts.bold, color: Theme.colors.white,
  },
  thenNowWeightText: {
    fontSize: 8, fontFamily: Theme.fonts.extraBold, color: Theme.colors.white,
  },
  thenNowLabel: {
    fontSize: 12, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  thenNowArrow: { paddingHorizontal: 2 },
  thenNowHint: {
    fontSize: 12, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark,
    textAlign: 'center', marginTop: 12,
  },

  // Recently uploaded — empty state
  sectionTitle: {
    fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 15, textAlign: 'left',
  },
  mealsListWrap: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card, padding: 30,
    alignItems: 'center', borderWidth: 2, borderColor: Theme.colors.border,
    borderStyle: 'dashed',
  },
  cameraIconWrap: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: Theme.colors.primaryActive,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  emptySubtitle: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    textAlign: 'center', marginTop: 4,
  },

  // No-profile empty state
  emptyStateCenter: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 22, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 10, textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    textAlign: 'center', lineHeight: 20,
  },
});
