import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Path, Line, Circle, Polyline } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useUserStore } from '@/store/user-store';
import { useWeightStore } from '@/store/weight-store';
import { useStreakStore } from '@/store/streak-store';
import { useDiaryStore } from '@/store/diary-store';
import { usePhotoStore } from '@/store/photo-store';
import { toDateKey, weekKeys, dayLabel, daysBetween } from '@/utils/date';
import { calculateBMI, getBMICategory } from '@/utils/calories';
import type { WeightEntry } from '@/types/data';

// ── Constants ──────────────────────────────────────────────────────

const TIME_TABS = ['30 Days', '60 Days', '90 Days', '6 Months', '1 Year', 'All time'];
const TIME_TAB_DAYS = [30, 60, 90, 180, 365, Infinity];
const WEEK_TABS = ['This Week', 'Last Week', '2 wks. ago', '3 wks. ago'];
const STREAK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

const HIT_SLOP_ACTION = { top: 10, bottom: 10, left: 10, right: 10 };

const BMI_LEGEND = [
  { label: 'Underweight', color: Theme.colors.infoBlue },
  { label: 'Healthy', color: Theme.colors.success },
  { label: 'Overweight', color: Theme.colors.warning },
  { label: 'Obese', color: Theme.colors.obeseDark },
];

const MACRO_LEGEND = [
  { label: 'Protein', color: Theme.colors.protein },
  { label: 'Carbs', color: Theme.colors.carbs },
  { label: 'Fats', color: Theme.colors.infoBlue },
];

const CHART_W = 200;
const CHART_H = 100;
const GRID_INDEXES = [0, 1, 2, 3, 4] as const;
const CURRENT_YEAR = new Date().getFullYear();

// ── Helpers ────────────────────────────────────────────────────────

/** Returns dateKeys for the current week (Sun..Sat) based on a reference date key. */
function currentWeekKeys(refDateKey: string): string[] {
  const today = new Date(refDateKey + 'T00:00:00');
  const dayOfWeek = today.getDay(); // 0=Sun
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    keys.push(toDateKey(d));
  }
  return keys;
}

/** Format date key to short label, e.g. 'Mar 9' or "Mar 9 '27" if different year. */
function formatShortDate(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const base = `${months[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() !== CURRENT_YEAR ? `${base} '${String(d.getFullYear()).slice(2)}` : base;
}

/** Build 5 evenly-spaced Y-axis labels from min..max. */
function yAxisLabels(min: number, max: number, decimals = 1): string[] {
  if (min === max) {
    const v = min.toFixed(decimals);
    return [v, v, v, v, v];
  }
  const step = (max - min) / 4;
  return Array.from({ length: 5 }, (_, i) => (max - i * step).toFixed(decimals));
}

function dateToMs(dateKey: string): number {
  return new Date(dateKey + 'T00:00:00').getTime();
}

/** Convert weight entries to SVG points, positioned by actual date within the time range. */
function toChartPoints(
  entries: { date: string; weight: number }[],
  min: number,
  max: number,
  startMs: number,
  endMs: number,
): { points: string; singlePoint: { x: number; y: number } | null } {
  if (entries.length === 0) return { points: '', singlePoint: null };
  const range = endMs - startMs || 1;

  if (entries.length === 1) {
    const xRatio = (dateToMs(entries[0].date) - startMs) / range;
    const x = Math.max(12, Math.min(CHART_W - 5, xRatio * CHART_W));
    const y = max === min ? CHART_H / 2 : CHART_H - ((entries[0].weight - min) / (max - min)) * CHART_H;
    return { points: `0,${y} ${x},${y}`, singlePoint: { x, y } };
  }

  const points = entries
    .map((e) => {
      const x = ((dateToMs(e.date) - startMs) / range) * CHART_W;
      const y = max === min ? CHART_H / 2 : CHART_H - ((e.weight - min) / (max - min)) * CHART_H;
      return `${x},${y}`;
    })
    .join(' ');
  return { points, singlePoint: null };
}

/** Generate ~5 evenly spaced date labels across a time range. */
function buildTimeXLabels(startMs: number, endMs: number): string[] {
  const count = 5;
  const step = (endMs - startMs) / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startMs + i * step);
    return formatShortDate(toDateKey(d));
  });
}

// ── Component ──────────────────────────────────────────────────────

export default function ProgressScreen() {
  const router = useRouter();
  const [timeTab, setTimeTab] = useState(0);
  const [weekTab, setWeekTab] = useState(0);
  const profile = useUserStore((s) => s.profile);
  const allWeightEntries = useWeightStore((s) => s.entries);
  const streakData = useStreakStore((s) => s.streak);
  const diaryEntries = useDiaryStore((s) => s.entries);
  const photos = usePhotoStore((s) => s.photos);

  const removeWeightEntry = useWeightStore((s) => s.removeEntry);
  const latestWeight = allWeightEntries[0] ?? null;

  const todayKey = useMemo(() => toDateKey(), []);

  // Which days this week have logged meals (for streak dots)
  const thisWeekKeys = useMemo(() => currentWeekKeys(todayKey), [todayKey]);
  const weekLogged = useMemo(
    () => thisWeekKeys.map((k) => !!(diaryEntries[k] && diaryEntries[k].length > 0)),
    [thisWeekKeys, diaryEntries],
  );

  // NOTE: These use optional chaining because hooks must run before the
  // `!profile` early return (Rules of Hooks). Fallbacks are only hit when
  // profile is null; the values are discarded by the early return below.
  const cw = latestWeight?.weight ?? profile?.startWeight ?? 70;
  const tw = profile?.targetWeight ?? cw;
  const unit = profile?.weightUnit ?? 'kg';
  const goal = profile?.goal ?? 'maintain';
  const weightKg = unit === 'lb' ? cw / 2.20462 : cw;
  const heightCm = profile?.heightCm ?? 170;

  // ── BMI ──────────────────────────────────────────────────────────

  const bmi = useMemo(() => calculateBMI(weightKg, heightCm), [weightKg, heightCm]);
  const bmiCategory = useMemo(() => getBMICategory(bmi), [bmi]);
  const bmiPercent = useMemo((): number => {
    if (isNaN(bmi) || bmi <= 0) return 0;
    if (bmi < 18.5) return Math.max(0, ((bmi - 10) / 8.5) * 14);
    if (bmi < 25) return 14 + ((bmi - 18.5) / 6.5) * 26;
    if (bmi < 30) return 40 + ((bmi - 25) / 5) * 20;
    return Math.min(100, 60 + ((bmi - 30) / 10) * 40);
  }, [bmi]);
  const bmiColor = useMemo(() =>
    bmi < 18.5 ? Theme.colors.infoBlue : bmi < 25 ? Theme.colors.success : bmi < 30 ? Theme.colors.warning : Theme.colors.calorieAlert,
    [bmi],
  );

  // ── Weight progress ──────────────────────────────────────────────

  const sw = profile?.startWeight ?? cw;
  const weightProgress = useMemo(() => {
    if (goal === 'maintain' || Math.abs(tw - sw) < 0.01) return 1;
    return Math.max(0, Math.min(1, (cw - sw) / (tw - sw)));
  }, [cw, sw, tw, goal]);

  const progressPercent = Math.round(weightProgress * 100);
  const weightProgressStyle = useMemo(
    () => ({ width: `${progressPercent}%` as const }),
    [progressPercent],
  );
  const bmiIndicatorStyle = useMemo(
    () => ({ left: `${Math.round(bmiPercent)}%` as const }),
    [bmiPercent],
  );

  // ── #7 Next weigh-in ────────────────────────────────────────────

  const nextWeighInLabel = useMemo(() => {
    if (!latestWeight) return 'Log your first weigh-in';
    const daysSince = daysBetween(latestWeight.date, todayKey);
    if (daysSince === 0) return 'Logged today';
    const nextIn = Math.max(0, 7 - daysSince);
    if (nextIn === 0) return 'Time to weigh in';
    return `Next weigh-in: ${nextIn}d`;
  }, [latestWeight, todayKey]);

  // ── #8 + #12 Weight chart data (filtered by time tab) ───────────

  const weightChartData = useMemo(() => {
    const days = TIME_TAB_DAYS[timeTab];
    const today = new Date();
    const todayStr = toDateKey(today);
    const todayMs = dateToMs(todayStr);

    // Time range: today → future (today + N days)
    const startMs = todayMs;
    let endMs: number;
    if (days === Infinity) {
      // All time: project to estimated goal date, or at least 90 days
      let goalDays = 90;
      if (profile && profile.goal !== 'maintain' && profile.weeklyGoalSpeed > 0) {
        const currentW = latestWeight?.weight ?? profile.startWeight;
        const diff = Math.abs(currentW - profile.targetWeight);
        goalDays = Math.max(90, Math.ceil(diff / profile.weeklyGoalSpeed) * 7);
      }
      endMs = todayMs + goalDays * 86400000;
    } else {
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + days);
      endMs = dateToMs(toDateKey(endDate));
    }

    // Filter entries from today onward
    const filtered = allWeightEntries
      .filter((e) => e.date >= todayStr)
      .reverse(); // oldest first

    if (filtered.length === 0) return null;

    const weights = filtered.map((e) => e.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = (max - min) * 0.1 || 0.5;
    const chartMin = min - padding;
    const chartMax = max + padding;

    const chart = toChartPoints(filtered, chartMin, chartMax, startMs, endMs);
    return {
      points: chart.points,
      singlePoint: chart.singlePoint,
      yLabels: yAxisLabels(chartMin, chartMax),
      xLabels: buildTimeXLabels(startMs, endMs),
      count: filtered.length,
    };
  }, [allWeightEntries, timeTab, profile, latestWeight]);

  // ── #13 Calorie chart data (filtered by week tab) ───────────────

  const calorieChartData = useMemo(() => {
    const keys = weekKeys(weekTab);
    const dailyCals = keys.map((k) => {
      const meals = diaryEntries[k] || [];
      return {
        dateKey: k,
        label: dayLabel(k),
        calories: meals.reduce((s, m) => s + m.calories, 0),
        protein: meals.reduce((s, m) => s + m.protein, 0),
        carbs: meals.reduce((s, m) => s + m.carbs, 0),
        fat: meals.reduce((s, m) => s + m.fat, 0),
      };
    });

    const cals = dailyCals.map((d) => d.calories);
    const maxCal = Math.max(...cals, 1);
    const totalCals = cals.reduce((a, b) => a + b, 0);

    return { days: dailyCals, maxCal, totalCals };
  }, [weekTab, diaryEntries]);

  const calYLabels = useMemo(() => {
    const max = calorieChartData.maxCal;
    return yAxisLabels(0, max, 0);
  }, [calorieChartData.maxCal]);

  const handleTimeTab = useCallback((i: number) => setTimeTab(i), []);
  const handleWeekTab = useCallback((i: number) => setWeekTab(i), []);

  const handleDeleteWeight = useCallback(
    (entry: WeightEntry) => {
      const dateStr = formatShortDate(entry.date);
      Alert.alert(
        'Delete Entry',
        `Remove ${entry.weight.toFixed(1)} ${entry.unit} from ${dateStr}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeWeightEntry(entry.id),
          },
        ],
      );
    },
    [removeWeightEntry],
  );

  const handleEditWeight = useCallback(
    (entry: WeightEntry) => {
      router.push({ pathname: '/log-weight', params: { editEntryId: entry.id } });
    },
    [router],
  );

  const RECENT_LIMIT = 3;
  const recentWeightEntries = useMemo(
    () => allWeightEntries.slice(0, RECENT_LIMIT),
    [allWeightEntries],
  );
  const hasMoreEntries = allWeightEntries.length > RECENT_LIMIT;

  const handleSeeAllWeighIns = useCallback(() => {
    router.push('/weight-history');
  }, [router]);

  // No-profile empty state
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.emptyStateCenter}>
          <Text style={styles.emptyStateTitle}>No Data Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Complete onboarding and start logging meals to see your progress here.
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
          <Text style={styles.headerTitle} accessibilityRole="header">Progress</Text>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Profile"
            accessibilityRole="button"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={12} cy={7} r={4} stroke={Theme.colors.primary} strokeWidth={2.5} />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Top Cards */}
        <View style={styles.topCards}>
          {/* Weight Card */}
          <View
            style={[styles.progCard, styles.progCardNoPadBottom]}
            accessible={true}
            accessibilityLabel={`My weight: ${cw} ${unit}, ${progressPercent}% of goal. Goal: ${tw} ${unit}. ${nextWeighInLabel}`}
          >
            <Text style={styles.cardLabel}>My Weight</Text>
            <Text style={styles.weightValue}>{cw} {unit}</Text>
            <View
              style={styles.weightProgressBg}
              accessible={true}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
              accessibilityLabel={`Weight progress: ${progressPercent}% of goal`}
            >
              <View style={[styles.weightProgressFill, weightProgressStyle]} />
            </View>
            <Text style={styles.goalText}>
              Goal <Text style={styles.goalValueText}>{tw} {unit}</Text>
            </Text>
            <View style={styles.weightFooter}>
              <Text style={styles.footerText}>{nextWeighInLabel}</Text>
            </View>
          </View>

          {/* Streak Card */}
          <View
            style={styles.progCard}
            accessible={true}
            accessibilityLabel={`${streakData.currentStreak > 0 ? `${streakData.currentStreak} day streak` : 'No streak yet'}. This week: ${STREAK_DAYS.map((d, i) => `${d} ${weekLogged[i] ? 'logged' : 'not logged'}`).join(', ')}.`}
          >
            <View style={styles.streakIconWrap} accessible={false}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={8} r={6} stroke={Theme.colors.warning} strokeWidth={2} />
                <Path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" stroke={Theme.colors.warning} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M12 5v6M9 8h6" stroke={Theme.colors.warning} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={streakData.currentStreak > 0 ? styles.streakTitle : styles.streakTitleEmpty}>
              {streakData.currentStreak > 0
                ? `${streakData.currentStreak}-day streak`
                : 'Log a meal to start!'}
            </Text>
            <View style={styles.streakDays}>
              {STREAK_DAYS.map((d, i) => (
                <View key={`${d}-${i}`} style={styles.streakDay}>
                  <Text style={styles.streakDayLabel}>{d}</Text>
                  <View style={[styles.streakDot, weekLogged[i] && styles.streakDotActive]} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Progress Photos */}
        <TouchableOpacity
          style={styles.chartCard}
          accessible={true}
          accessibilityLabel="Progress Photos section"
          activeOpacity={0.7}
          onPress={() => router.push('/progress-photos')}
        >
          <Text style={[styles.chartTitle, styles.chartTitleMb15]} accessibilityRole="header">Progress Photos</Text>
          {photos.length > 0 ? (
            <>
              <View style={styles.photoRow}>
                {photos.slice(0, 3).map((p) => (
                  <Image
                    key={p.id}
                    source={{ uri: p.uri }}
                    style={styles.photoThumb}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </View>
              <Text style={styles.photoHint}>Tap to view all progress photos</Text>
            </>
          ) : (
            <View style={styles.photoCard}>
              <View style={styles.photoPlaceholder}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" accessible={false}>
                  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                  <Circle cx={12} cy={7} r={4} stroke={Theme.colors.primary} strokeWidth={2.5} />
                </Svg>
              </View>
              <View style={styles.photoTextContainer}>
                <Text style={styles.photoText}>Add photos when you log your weight</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Time Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {TIME_TABS.map((t, i) => (
            <TouchableOpacity key={t} onPress={() => handleTimeTab(i)} style={[styles.tab, i === timeTab && styles.tabActive]} accessibilityRole="tab" accessibilityLabel={t} accessibilityState={{ selected: i === timeTab }}>
              <Text style={[styles.tabText, i === timeTab && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Goal Progress / Weight Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle} accessibilityRole="header">Weight Progress</Text>
            <View style={styles.flagPill}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Line x1={4} y1={22} x2={4} y2={15} stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
              <Text style={styles.flagPillText}>{progressPercent}% of goal</Text>
            </View>
          </View>

          <View style={styles.lineChartArea} accessible={true} accessibilityLabel={`Weight chart with ${weightChartData?.count ?? 0} entries`} accessibilityRole="image">
            <View style={styles.yAxis}>
              {(weightChartData?.yLabels ?? ['0', '0', '0', '0', '0']).map((v, i) => (
                <Text key={`wy-${i}`} style={styles.yLabel}>{v}</Text>
              ))}
            </View>
            <View style={styles.gridLines}>
              {GRID_INDEXES.map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>
            {weightChartData ? (
              <Svg style={styles.svgChart} viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
                <Polyline
                  points={weightChartData.points}
                  stroke={Theme.colors.primary}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {weightChartData.singlePoint && (
                  <Circle
                    cx={weightChartData.singlePoint.x}
                    cy={weightChartData.singlePoint.y}
                    r={4}
                    fill={Theme.colors.primary}
                  />
                )}
              </Svg>
            ) : (
              <View style={styles.emptyChartOverlay}>
                <Text style={styles.emptyChartText}>No weight data yet</Text>
              </View>
            )}
          </View>
          {weightChartData && weightChartData.xLabels.length > 0 && (
            <View style={[styles.xAxis, styles.weightXAxis]}>
              {weightChartData.xLabels.map((label, i) => (
                <Text key={`wx-${i}`} style={styles.xLabel}>{label}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Week Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {WEEK_TABS.map((t, i) => (
            <TouchableOpacity key={t} onPress={() => handleWeekTab(i)} style={[styles.tab, i === weekTab && styles.tabActive]} accessibilityRole="tab" accessibilityLabel={t} accessibilityState={{ selected: i === weekTab }}>
              <Text style={[styles.tabText, i === weekTab && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Total Calories Chart */}
        <View style={styles.chartCard}>
          <Text style={[styles.chartTitle, styles.chartTitleMb5]} accessibilityRole="header">Total calories</Text>
          <Text style={styles.calValue}>
            {calorieChartData.totalCals.toFixed(0)} <Text style={styles.calUnit}>cals</Text>
          </Text>

          <View style={styles.lineChartArea} accessible={true} accessibilityLabel={`Calorie chart for ${WEEK_TABS[weekTab]}`} accessibilityRole="image">
            <View style={styles.yAxis}>
              {calYLabels.map((v, i) => (
                <Text key={`cy-${i}`} style={styles.yLabel}>{v}</Text>
              ))}
            </View>
            <View style={styles.gridLines}>
              {GRID_INDEXES.map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>

            {/* Stacked bar chart */}
            <View style={styles.barChartArea}>
              {calorieChartData.days.map((day) => {
                const maxH = 120;
                const totalH = calorieChartData.maxCal > 0 ? (day.calories / calorieChartData.maxCal) * maxH : 0;
                const pRatio = day.calories > 0 ? day.protein * 4 / (day.calories || 1) : 0;
                const cRatio = day.calories > 0 ? day.carbs * 4 / (day.calories || 1) : 0;
                const fRatio = 1 - pRatio - cRatio;

                return (
                  <View key={day.dateKey} style={styles.barCol}>
                    <View style={[styles.barStack, { height: Math.max(totalH, 0) }]}>
                      {totalH > 0 && (
                        <>
                          <View style={[styles.barSegment, { flex: Math.max(fRatio, 0), backgroundColor: Theme.colors.infoBlue }]} />
                          <View style={[styles.barSegment, { flex: Math.max(cRatio, 0), backgroundColor: Theme.colors.carbs }]} />
                          <View style={[styles.barSegment, { flex: Math.max(pRatio, 0), backgroundColor: Theme.colors.protein, borderTopLeftRadius: 3, borderTopRightRadius: 3 }]} />
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.xAxis}>
            {calorieChartData.days.map((day) => (
              <Text key={day.dateKey} style={styles.xLabel}>{day.label}</Text>
            ))}
          </View>
          <View style={styles.macroLegend}>
            {MACRO_LEGEND.map((m) => (
              <View key={m.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                <Text style={styles.legendText}>{m.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.encouragementPill}>
            <Text style={styles.encouragementText}>
              {goal === 'gain'
                ? 'Building up takes consistency. Every meal counts toward your goal!'
                : goal === 'maintain'
                  ? "Staying balanced is a skill. You're doing great by tracking!"
                  : "Getting started is the hardest part. You're ready for this!"}
            </Text>
          </View>
        </View>

        {/* BMI Card */}
        <View style={styles.chartCard}>
          <Text style={[styles.chartTitle, styles.chartTitleMb10]} accessibilityRole="header">Your BMI</Text>
          <View style={styles.bmiHeader}>
            <Text style={[styles.bmiValue, { color: bmiColor }]}>{bmi}</Text>
            <Text style={styles.bmiLabel}>Your weight is</Text>
            <View style={[styles.bmiBadge, { backgroundColor: bmiColor }]}>
              <Text style={styles.bmiBadgeText}>{bmiCategory}</Text>
            </View>
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
            <View style={[styles.bmiIndicator, bmiIndicatorStyle]} />
          </View>
          <View style={styles.bmiLegend} accessible={true} accessibilityLabel={`BMI categories: ${BMI_LEGEND.map((b) => b.label).join(', ')}`}>
            {BMI_LEGEND.map((b) => (
              <View key={b.label} style={styles.bmiLegendItem}>
                <View style={[styles.bDot, { backgroundColor: b.color }]} accessible={false} />
                <Text style={styles.bmiLegendText}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Weigh-ins */}
        {recentWeightEntries.length > 0 && (
          <View style={styles.weightEntriesCard}>
            <Text style={styles.weightEntriesTitle}>Weigh-ins</Text>
            {recentWeightEntries.map((entry) => {
              const dateStr = formatShortDate(entry.date);
              return (
                <View
                  key={entry.id}
                  style={styles.weightEntryRow}
                  accessibilityLabel={`${entry.weight.toFixed(1)} ${entry.unit} on ${dateStr}`}
                  accessibilityRole="summary"
                >
                  <View style={styles.weightEntryInfo} accessible={false}>
                    <Text style={styles.weightEntryValue}>
                      {entry.weight.toFixed(1)}{' '}
                      <Text style={styles.weightEntryUnit}>{entry.unit}</Text>
                    </Text>
                    <Text style={styles.weightEntryDate}>{dateStr}</Text>
                  </View>
                  <View style={styles.weightEntryActions}>
                    <TouchableOpacity
                      onPress={() => handleEditWeight(entry)}
                      hitSlop={HIT_SLOP_ACTION}
                      accessibilityLabel={`Edit ${entry.weight.toFixed(1)} ${entry.unit} entry`}
                      accessibilityRole="button"
                      style={styles.weightEntryActionBtn}
                    >
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" accessible={false}>
                        <Path
                          d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                          stroke={Theme.colors.textDark}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteWeight(entry)}
                      hitSlop={HIT_SLOP_ACTION}
                      accessibilityLabel={`Delete ${entry.weight.toFixed(1)} ${entry.unit} entry`}
                      accessibilityRole="button"
                      style={styles.weightEntryActionBtn}
                    >
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" accessible={false}>
                        <Path
                          d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14"
                          stroke={Theme.colors.urgentRed}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {hasMoreEntries && (
              <TouchableOpacity
                onPress={handleSeeAllWeighIns}
                style={styles.seeAllBtn}
                activeOpacity={0.7}
                accessibilityLabel="See all weigh-ins"
                accessibilityRole="button"
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" accessible={false}>
                  <Path
                    d="M9 18l6-6-6-6"
                    stroke={Theme.colors.primary}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.accentBackground },
  container: { flex: 1, backgroundColor: Theme.colors.background, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 120 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.accentBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },

  // Top cards
  topCards: { flexDirection: 'row', gap: 12, marginBottom: 20, marginTop: 10 },
  progCard: {
    flex: 1, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card, padding: 16,
    alignItems: 'center', borderWidth: 2, borderColor: Theme.colors.border,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 2,
  },
  progCardNoPadBottom: { paddingBottom: 0 },
  cardLabel: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  weightValue: { fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, marginVertical: 5 },
  weightProgressBg: {
    width: '100%', height: 6, backgroundColor: Theme.colors.accentBackground, borderRadius: 3,
    marginVertical: 8, overflow: 'hidden',
  },
  weightProgressFill: { height: '100%', backgroundColor: Theme.colors.primary, borderRadius: 3 },
  goalText: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  goalValueText: { color: Theme.colors.textDark },
  weightFooter: {
    marginHorizontal: -16, marginTop: 10, paddingVertical: 12,
    backgroundColor: Theme.colors.surface,
    borderBottomLeftRadius: Theme.borderRadius.card - 2,
    borderBottomRightRadius: Theme.borderRadius.card - 2,
    alignItems: 'center',
  },
  footerText: { fontSize: 11, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },

  streakIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.warningLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  streakTitle: { fontSize: 14, fontFamily: Theme.fonts.extraBold, color: Theme.colors.warningDark, marginBottom: 10 },
  streakTitleEmpty: { fontSize: 14, fontFamily: Theme.fonts.extraBold, color: Theme.colors.primary, marginBottom: 10 },
  streakDays: { flexDirection: 'row', gap: 4, justifyContent: 'center', width: '100%' },
  streakDay: { alignItems: 'center', gap: 4 },
  streakDayLabel: { fontSize: 12, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  streakDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.border },
  streakDotActive: { backgroundColor: Theme.colors.warning, borderWidth: 1.5, borderColor: Theme.colors.warningDark },

  // Weight entries
  weightEntriesCard: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card, padding: 16,
    borderWidth: 2, borderColor: Theme.colors.border, marginBottom: 20,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 2,
  },
  weightEntriesTitle: {
    fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  weightEntryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Theme.colors.background, borderRadius: Theme.borderRadius.small,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 6,
  },
  weightEntryInfo: {
    flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 12,
  },
  weightEntryValue: {
    fontSize: 17, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  weightEntryUnit: {
    fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
  },
  weightEntryDate: {
    fontSize: 13, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark,
  },
  weightEntryActions: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  weightEntryActionBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, marginTop: 4,
  },
  seeAllText: {
    fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.primary,
  },

  // Tabs
  tabsScroll: { marginBottom: 15, paddingBottom: 5 },
  tabsContent: { gap: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Theme.borderRadius.button,
    backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: Theme.colors.border,
  },
  tabActive: { backgroundColor: Theme.colors.textDark, borderColor: Theme.colors.textDark },
  tabText: { fontSize: 12, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  tabTextActive: { color: Theme.colors.white },

  // Chart Card
  chartCard: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card, padding: 20,
    borderWidth: 2, borderColor: Theme.colors.border, marginBottom: 25,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 2,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, textAlign: 'left' },
  chartTitleMb5: { marginBottom: 5 },
  chartTitleMb10: { marginBottom: 10 },
  chartTitleMb15: { marginBottom: 15 },
  flagPill: {
    backgroundColor: Theme.colors.flagPillBg, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Theme.borderRadius.small, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  flagPillText: { fontSize: 11, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },

  lineChartArea: { position: 'relative', height: 140, width: '100%', marginTop: 10 },
  yAxis: {
    position: 'absolute', left: 0, top: 0, height: '100%', justifyContent: 'space-between', width: 30,
  },
  yLabel: { fontSize: 9, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  gridLines: {
    position: 'absolute', left: 35, right: 0, top: 5, height: '100%', justifyContent: 'space-between',
  },
  gridLine: { width: '100%', borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: Theme.colors.border },
  svgChart: { position: 'absolute', left: 35, right: 0, top: 5, height: 130 },

  emptyChartOverlay: {
    position: 'absolute', left: 35, right: 0, top: 0, height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyChartText: { fontSize: 13, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textMuted },

  // Bar chart
  barChartArea: {
    position: 'absolute', left: 35, right: 0, top: 5, height: 130,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barStack: {
    width: 18, borderRadius: 3, overflow: 'hidden',
  },
  barSegment: { width: '100%' },

  // X axis
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 35, marginTop: 5 },
  weightXAxis: { paddingLeft: 6 },
  xLabel: { fontSize: 9, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },

  // Photo
  photoRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  photoThumb: {
    flex: 1, height: 90, borderRadius: Theme.borderRadius.small,
  },
  photoHint: {
    fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted, textAlign: 'center',
  },
  photoCard: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  photoPlaceholder: {
    width: 60, height: 75, backgroundColor: Theme.colors.primaryActive,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.small,
    alignItems: 'center', justifyContent: 'center',
  },
  photoTextContainer: { flex: 1 },
  photoText: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
  // Calories
  calValue: { fontSize: 32, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, marginBottom: 15 },
  calUnit: { fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  macroLegend: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 14, height: 14, borderRadius: 7 },
  legendText: { fontSize: 11, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  encouragementPill: {
    backgroundColor: Theme.colors.encouragementBg, padding: 10, borderRadius: Theme.borderRadius.small, marginTop: 20,
  },
  encouragementText: {
    fontSize: 11, fontFamily: Theme.fonts.extraBold, color: Theme.colors.encouragementText, textAlign: 'center',
  },

  // BMI
  bmiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15, flexWrap: 'wrap' },
  bmiValue: { fontSize: 28, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  bmiLabel: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  bmiBadge: {
    backgroundColor: Theme.colors.calorieAlert, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.borderRadius.small,
  },
  bmiBadgeText: {
    color: Theme.colors.white, fontSize: 10, fontFamily: Theme.fonts.extraBold, textTransform: 'uppercase',
  },
  bmiBarContainer: { position: 'relative', height: 22, marginVertical: 15 },
  bmiBar: {
    flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', position: 'absolute', top: 5,
    width: '100%',
  },
  bmiSegment: {
    height: '100%',
  },
  bmiIndicator: {
    position: 'absolute', top: 3, width: 16, height: 16, borderRadius: 8,
    backgroundColor: Theme.colors.textDark, borderWidth: 2.5, borderColor: Theme.colors.surface,
    marginLeft: -8,
  },
  bmiLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  bmiLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bDot: { width: 6, height: 6, borderRadius: 3 },
  bmiLegendText: { fontSize: 10, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },

  // Empty state
  emptyStateCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
    backgroundColor: Theme.colors.background,
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
