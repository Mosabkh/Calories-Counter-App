import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useOnboardingStore } from '@/store/onboarding-store';
import { calculateBMI, getBMICategory } from '@/utils/calories';

const TIME_TABS = ['30 Days', '60 Days', '90 Days', '6 Months', '1 Year', 'All time'];
const WEEK_TABS = ['This Week', 'Last Week', '2 wks. ago', '3 wks. ago'];
const STREAK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const Y_AXIS_PLACEHOLDER = ['82.5', '82.3', '82.0', '81.8', '81.5'] as const;
const Y_AXIS_ZEROS = ['0', '0', '0', '0', '0'] as const;
const GRID_INDEXES = [0, 1, 2, 3, 4] as const;
const X_AXIS_DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

const BMI_LEGEND = [
  { label: 'Underweight', color: Theme.colors.infoBlue },
  { label: 'Healthy', color: Theme.colors.success },
  { label: 'Overweight', color: Theme.colors.warning },
  { label: 'Obese', color: Theme.colors.calorieAlert },
];

const MACRO_LEGEND = [
  { label: 'Protein', color: Theme.colors.protein },
  { label: 'Carbs', color: Theme.colors.carbs },
  { label: 'Fats', color: Theme.colors.infoBlue },
];

export default function ProgressScreen() {
  const [timeTab, setTimeTab] = useState(0);
  const [weekTab, setWeekTab] = useState(0);
  const { currentWeight, startWeight, targetWeight, weightUnit, height: storedHeight, goal } = useOnboardingStore((s) => s.payload);

  const cw = currentWeight || 70;
  const tw = targetWeight || cw;
  const unit = weightUnit || 'kg';
  const weightKg = unit === 'lb' ? cw / 2.20462 : cw;
  const heightCm = storedHeight || 170;

  const bmi = useMemo(() => calculateBMI(weightKg, heightCm), [weightKg, heightCm]);
  const bmiCategory = useMemo(() => getBMICategory(bmi), [bmi]);
  // Segments: Underweight flex:14 (0-14%), Healthy flex:26 (14-40%), Overweight flex:20 (40-60%), Obese flex:40 (60-100%)
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

  const sw = startWeight || cw;
  const weightProgress = useMemo(() => {
    if (goal === 'maintain' || sw === tw) return 1;
    const totalChange = tw - sw;
    if (totalChange === 0) return 0;
    return Math.max(0, Math.min(1, (cw - sw) / totalChange));
  }, [cw, sw, tw, goal]);

  const weightProgressStyle = useMemo(
    () => ({ width: `${Math.round(weightProgress * 100)}%` as const }),
    [weightProgress],
  );
  const bmiIndicatorStyle = useMemo(
    () => ({ left: `${Math.round(bmiPercent)}%` as const }),
    [bmiPercent],
  );

  const handleTimeTab = useCallback((i: number) => setTimeTab(i), []);
  const handleWeekTab = useCallback((i: number) => setWeekTab(i), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Cards */}
        <View style={styles.topCards}>
          {/* Weight Card */}
          <View style={[styles.progCard, styles.progCardNoPadBottom]} accessible={true} accessibilityLabel={`My weight: ${cw} ${unit}, Goal: ${tw} ${unit}`}>
            <Text style={styles.cardLabel}>My Weight</Text>
            <Text style={styles.weightValue}>{cw} {unit}</Text>
            <View style={styles.weightProgressBg}>
              <View style={[styles.weightProgressFill, weightProgressStyle]} />
            </View>
            <Text style={styles.goalText}>
              Goal <Text style={styles.goalValueText}>{tw} {unit}</Text>
            </Text>
            <View style={styles.weightFooter}>
              <Text style={styles.footerText}>Next weigh-in: 7d</Text>
            </View>
          </View>

          {/* Streak Card */}
          <View style={styles.progCard}>
            <View style={styles.streakIconWrap} accessible={false}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={8} r={6} stroke={Theme.colors.warning} strokeWidth={2} />
                <Path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" stroke={Theme.colors.warning} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M12 5v6M9 8h6" stroke={Theme.colors.warning} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={styles.streakTitle}>Day streak</Text>
            <View style={styles.streakDays} accessible={true} accessibilityLabel={`Streak days: ${STREAK_DAYS.join(', ')}`}>
              {STREAK_DAYS.map((d, i) => (
                <View key={`${d}-${i}`} style={styles.streakDay}>
                  <Text style={styles.streakDayLabel}>{d}</Text>
                  <View style={styles.streakDot} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Time Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {TIME_TABS.map((t, i) => (
            <TouchableOpacity key={t} onPress={() => handleTimeTab(i)} style={[styles.tab, i === timeTab && styles.tabActive]} accessibilityRole="tab" accessibilityLabel={t} accessibilityState={{ selected: i === timeTab }}>
              <Text style={[styles.tabText, i === timeTab && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Goal Progress Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle} accessibilityRole="header">Goal Progress</Text>
            <View style={styles.flagPill}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Line x1={4} y1={22} x2={4} y2={15} stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
              <Text style={styles.flagPillText}>{Math.round(weightProgress * 100)}% of goal</Text>
            </View>
          </View>
          <View style={styles.lineChartArea} accessible={true} accessibilityLabel={`Weight progress chart, range ${cw} to ${tw} ${unit}`} accessibilityRole="image">
            <View style={styles.yAxis}>
              {Y_AXIS_PLACEHOLDER.map((v) => (
                <Text key={v} style={styles.yLabel}>{v}</Text>
              ))}
            </View>
            <View style={styles.gridLines}>
              {GRID_INDEXES.map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>
            <Svg style={styles.svgChart} viewBox="0 0 200 100" preserveAspectRatio="none">
              <Path d="M 0,50 L 200,50" stroke={Theme.colors.textDark} strokeWidth={2} fill="none" />
            </Svg>
          </View>
        </View>

        {/* Progress Photos */}
        <View style={styles.chartCard} accessible={true} accessibilityLabel="Progress Photos section">
          <Text style={[styles.chartTitle, styles.chartTitleMb15]} accessibilityRole="header">Progress Photos</Text>
          <View style={styles.photoCard}>
            <View style={styles.photoPlaceholder}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={12} cy={7} r={4} stroke={Theme.colors.primary} strokeWidth={2.5} />
              </Svg>
            </View>
            <View style={styles.photoTextContainer}>
              <Text style={styles.photoText}>Want to add a photo to track your progress?</Text>
              <TouchableOpacity style={styles.btnUpload} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Upload a photo" accessibilityRole="button">
                <Text style={styles.btnUploadText}>+ Upload a Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
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
          <Text style={styles.calValue}>0.0 <Text style={styles.calUnit}>cals</Text></Text>
          <View style={styles.lineChartArea} accessible={true} accessibilityLabel="Calorie intake chart, no data yet" accessibilityRole="image">
            <View style={styles.yAxis}>
              {Y_AXIS_ZEROS.map((v, i) => (
                <Text key={`cal-y-${i}`} style={styles.yLabel}>{v}</Text>
              ))}
            </View>
            <View style={styles.gridLines}>
              {GRID_INDEXES.map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>
          </View>
          <View style={styles.xAxis}>
            {X_AXIS_DAYS.map((d) => (
              <Text key={d} style={styles.xLabel}>{d}</Text>
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
              <View style={[styles.bmiSegment, { flex: 40, backgroundColor: Theme.colors.calorieAlert }]} />
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.accentBackground },
  container: { flex: 1, backgroundColor: Theme.colors.background, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 120 },

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
    width: '100%', height: 6, backgroundColor: Theme.colors.background, borderRadius: 3,
    marginVertical: 8, overflow: 'hidden',
  },
  weightProgressFill: { height: '100%', backgroundColor: Theme.colors.primary, borderRadius: 3 },
  goalText: { fontSize: 11, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  goalValueText: { color: Theme.colors.textDark },
  weightFooter: {
    marginHorizontal: -16, marginTop: 10, paddingVertical: 12,
    backgroundColor: Theme.colors.background,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18, alignItems: 'center',
  },
  footerText: { fontSize: 11, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },

  streakIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.warningLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  streakTitle: { fontSize: 14, fontFamily: Theme.fonts.extraBold, color: Theme.colors.warningDark, marginBottom: 10 },
  streakDays: { flexDirection: 'row', gap: 4, justifyContent: 'center', width: '100%' },
  streakDay: { alignItems: 'center', gap: 4 },
  streakDayLabel: { fontSize: 10, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  streakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.border },

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
    position: 'absolute', left: 0, top: 0, height: '100%', justifyContent: 'space-between', width: 25,
  },
  yLabel: { fontSize: 10, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  gridLines: {
    position: 'absolute', left: 30, right: 0, top: 5, height: '100%', justifyContent: 'space-between',
  },
  gridLine: { width: '100%', borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: Theme.colors.border },
  svgChart: { position: 'absolute', left: 30, right: 0, top: 0, height: '100%' },

  // Photo
  photoCard: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  photoPlaceholder: {
    width: 60, height: 75, backgroundColor: Theme.colors.primaryActive,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.small,
    alignItems: 'center', justifyContent: 'center',
  },
  photoTextContainer: { flex: 1 },
  photoText: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  btnUpload: {
    backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: Theme.colors.border,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Theme.borderRadius.button, marginTop: 10,
    alignSelf: 'flex-start', shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02, shadowRadius: 5, elevation: 1,
  },
  btnUploadText: { fontSize: 12, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },

  // Calories
  calValue: { fontSize: 32, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, marginBottom: 15 },
  calUnit: { fontSize: 14, color: Theme.colors.textMuted },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 30, marginTop: 5 },
  xLabel: { fontSize: 10, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
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
  bmiHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 15 },
  bmiValue: { fontSize: 28, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, lineHeight: 34 },
  bmiLabel: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted, marginBottom: 4 },
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
});
