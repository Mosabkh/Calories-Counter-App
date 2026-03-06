import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Theme } from '@/constants/theme';

const TIME_TABS = ['90 Days', '6 Months', '1 Year', 'All time'];
const WEEK_TABS = ['This Week', 'Last Week', '2 wks. ago', '3 wks. ago'];
const STREAK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const BMI_LEGEND = [
  { label: 'Underweight', color: Theme.colors.infoBlue },
  { label: 'Healthy', color: Theme.colors.success },
  { label: 'Overweight', color: Theme.colors.warning },
  { label: 'Obese', color: Theme.colors.calorieAlert },
];

const MACRO_LEGEND = [
  { label: 'Protein', color: '#C76750' },
  { label: 'Carbs', color: '#E89D88' },
  { label: 'Fats', color: Theme.colors.infoBlue },
];

export default function ProgressScreen() {
  const [timeTab, setTimeTab] = useState(0);
  const [weekTab, setWeekTab] = useState(0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Top Cards */}
        <View style={styles.topCards}>
          {/* Weight Card */}
          <View style={[styles.progCard, { paddingBottom: 0 }]}>
            <Text style={styles.cardLabel}>My Weight</Text>
            <Text style={styles.weightValue}>82 kg</Text>
            <View style={styles.weightProgressBg}>
              <View style={styles.weightProgressFill} />
            </View>
            <Text style={styles.goalText}>
              Goal <Text style={{ color: Theme.colors.textDark }}>72.9 kg</Text>
            </Text>
            <View style={styles.weightFooter}>
              <Text style={styles.footerText}>Next weigh-in: 7d</Text>
            </View>
          </View>

          {/* Streak Card */}
          <View style={styles.progCard}>
            <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2c0 0-3 3.5-3 5.5s1.5 3.5 3 3.5s3-1.5 3-3.5S12 2 12 2z" stroke={Theme.colors.warning} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M12 22c4.418 0 8-3.582 8-8c0-2.209-1-4.109-2.5-5.5C16 11 14 13 12 13s-4-2-5.5-4.5C5 9.891 4 11.791 4 14c0 4.418 3.582 8 8 8z" stroke={Theme.colors.warning} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.streakTitle}>Day streak</Text>
            <View style={styles.streakDays}>
              {STREAK_DAYS.map((d, i) => (
                <View key={i} style={styles.streakDay}>
                  <Text style={styles.streakDayLabel}>{d}</Text>
                  <View style={styles.streakDot} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Time Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={{ gap: 8 }}>
          {TIME_TABS.map((t, i) => (
            <TouchableOpacity key={t} onPress={() => setTimeTab(i)} style={[styles.tab, i === timeTab && styles.tabActive]}>
              <Text style={[styles.tabText, i === timeTab && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Goal Progress Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Goal Progress</Text>
            <View style={styles.flagPill}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Line x1={4} y1={22} x2={4} y2={15} stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
              <Text style={styles.flagPillText}>0% of goal</Text>
            </View>
          </View>
          <View style={styles.lineChartArea}>
            <View style={styles.yAxis}>
              {['82.5', '82.3', '82.0', '81.8', '81.5'].map((v) => (
                <Text key={v} style={styles.yLabel}>{v}</Text>
              ))}
            </View>
            <View style={styles.gridLines}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>
            <Svg style={styles.svgChart} viewBox="0 0 200 100" preserveAspectRatio="none">
              <Path d="M 0,50 L 200,50" stroke={Theme.colors.textDark} strokeWidth={2} fill="none" />
            </Svg>
          </View>
        </View>

        {/* Progress Photos */}
        <View style={styles.chartCard}>
          <Text style={[styles.chartTitle, { marginBottom: 15 }]}>Progress Photos</Text>
          <View style={styles.photoCard}>
            <View style={styles.photoPlaceholder}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={12} cy={7} r={4} stroke={Theme.colors.primary} strokeWidth={2.5} />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.photoText}>Want to add a photo to track your progress?</Text>
              <TouchableOpacity style={styles.btnUpload}>
                <Text style={styles.btnUploadText}>+ Upload a Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Week Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={{ gap: 8 }}>
          {WEEK_TABS.map((t, i) => (
            <TouchableOpacity key={t} onPress={() => setWeekTab(i)} style={[styles.tab, i === weekTab && styles.tabActive]}>
              <Text style={[styles.tabText, i === weekTab && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Total Calories Chart */}
        <View style={styles.chartCard}>
          <Text style={[styles.chartTitle, { marginBottom: 5 }]}>Total calories</Text>
          <Text style={styles.calValue}>0.0 <Text style={styles.calUnit}>cals</Text></Text>
          <View style={styles.lineChartArea}>
            <View style={styles.yAxis}>
              {['0', '0', '0', '0', '0'].map((v, i) => (
                <Text key={i} style={styles.yLabel}>{v}</Text>
              ))}
            </View>
            <View style={styles.gridLines}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>
          </View>
          <View style={styles.xAxis}>
            {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
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
              Getting started is the hardest part. You're ready for this!
            </Text>
          </View>
        </View>

        {/* BMI Card */}
        <View style={styles.chartCard}>
          <Text style={[styles.chartTitle, { marginBottom: 10 }]}>Your BMI</Text>
          <View style={styles.bmiHeader}>
            <Text style={styles.bmiValue}>30.49</Text>
            <Text style={styles.bmiLabel}>Your weight is</Text>
            <View style={styles.bmiBadge}>
              <Text style={styles.bmiBadgeText}>Obese</Text>
            </View>
          </View>
          <View style={styles.bmiBarContainer}>
            <View style={styles.bmiBar} />
            <View style={[styles.bmiIndicator, { left: '80%' }]} />
          </View>
          <View style={styles.bmiLegend}>
            {BMI_LEGEND.map((b) => (
              <View key={b.label} style={styles.bmiLegendItem}>
                <View style={[styles.bDot, { backgroundColor: b.color }]} />
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

  // Top cards
  topCards: { flexDirection: 'row', gap: 12, marginBottom: 20, marginTop: 10 },
  progCard: {
    flex: 1, backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 2,
  },
  cardLabel: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  weightValue: { fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, marginVertical: 5 },
  weightProgressBg: {
    width: '100%', height: 6, backgroundColor: Theme.colors.background, borderRadius: 3,
    marginVertical: 8, overflow: 'hidden',
  },
  weightProgressFill: { width: '30%', height: '100%', backgroundColor: Theme.colors.primary, borderRadius: 3 },
  goalText: { fontSize: 11, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  weightFooter: {
    width: '132%', marginTop: 10, marginBottom: -16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Theme.colors.border, backgroundColor: Theme.colors.background,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, alignItems: 'center',
  },
  footerText: { fontSize: 11, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },

  streakTitle: { fontSize: 14, fontFamily: Theme.fonts.extraBold, color: Theme.colors.warning, marginBottom: 10 },
  streakDays: { flexDirection: 'row', gap: 4, justifyContent: 'center', width: '100%' },
  streakDay: { alignItems: 'center', gap: 4 },
  streakDayLabel: { fontSize: 8, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textMuted },
  streakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.border },

  // Tabs
  tabsScroll: { marginBottom: 15, paddingBottom: 5 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border,
  },
  tabActive: { backgroundColor: Theme.colors.textDark, borderColor: Theme.colors.textDark },
  tabText: { fontSize: 12, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textMuted },
  tabTextActive: { color: '#FFFFFF' },

  // Chart Card
  chartCard: {
    backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 25,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 2,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, textAlign: 'left' },
  flagPill: {
    backgroundColor: 'rgba(84, 49, 40, 0.05)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
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
    width: 60, height: 75, backgroundColor: 'rgba(226, 133, 110, 0.05)',
    borderWidth: 2, borderStyle: 'dashed', borderColor: Theme.colors.border, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  photoText: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted },
  btnUpload: {
    backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, marginTop: 10,
    alignSelf: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
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
    backgroundColor: 'rgba(123, 158, 135, 0.15)', padding: 10, borderRadius: 12, marginTop: 20,
  },
  encouragementText: {
    fontSize: 11, fontFamily: Theme.fonts.extraBold, color: '#4A6B54', textAlign: 'center',
  },

  // BMI
  bmiHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 15 },
  bmiValue: { fontSize: 28, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, lineHeight: 28 },
  bmiLabel: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted, marginBottom: 4 },
  bmiBadge: {
    backgroundColor: Theme.colors.calorieAlert, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  bmiBadgeText: {
    color: '#FFFFFF', fontSize: 10, fontFamily: Theme.fonts.extraBold, textTransform: 'uppercase',
  },
  bmiBarContainer: { position: 'relative', height: 25, marginVertical: 15 },
  bmiBar: {
    width: '100%', height: 8, borderRadius: 4, position: 'absolute', top: 8,
    // Approximate the gradient with a solid - could use LinearGradient from expo-linear-gradient
    backgroundColor: Theme.colors.warning,
  },
  bmiIndicator: {
    position: 'absolute', top: 0, width: 2, height: 24, backgroundColor: Theme.colors.textDark, borderRadius: 1,
  },
  bmiLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  bmiLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bDot: { width: 6, height: 6, borderRadius: 3 },
  bmiLegendText: { fontSize: 9, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textMuted },
});
