import { useMemo, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useOnboardingStore } from '@/store/onboarding-store';
import type { ActivityLevel } from '@/utils/calories';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateMacros,
  calculateAge,
} from '@/utils/calories';

const DAY_HIT_SLOP = { top: 2, bottom: 2, left: 2, right: 2 } as const;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDays() {
  const today = new Date();
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      name: DAY_NAMES[d.getDay()],
      num: d.getDate(),
      active: i === 0,
    });
  }
  return days;
}

const DonutChart = memo(function DonutChart({
  size,
  strokeWidth,
  progress,
  color,
  children,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  children?: React.ReactNode;
}): React.ReactElement {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.donutContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.donutSvg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Theme.colors.background}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
});

export default function HomeScreen() {
  const {
    name, currentWeight, weightUnit, gender, birthYear, birthMonth, birthDay,
    height: storedHeight, activityLevel, goal, weeklyGoalSpeed,
  } = useOnboardingStore((s) => s.payload);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const weekDays = useMemo(() => getWeekDays(), [new Date().toDateString()]);

  const plan = useMemo(() => {
    const cw = currentWeight || 70;
    const unit = weightUnit || 'kg';
    const weightKg = unit === 'lb' ? cw / 2.20462 : cw;
    const heightCm = storedHeight || 170;
    const age = (birthYear && birthMonth && birthDay)
      ? calculateAge(birthYear, birthMonth, birthDay)
      : 25;
    const sex: 'male' | 'female' = gender || 'male';
    const activity: ActivityLevel = activityLevel || 'moderate';
    const speed = weeklyGoalSpeed ?? 0.5;

    const bmr = calculateBMR(weightKg, heightCm, age, sex);
    const tdee = calculateTDEE(bmr, activity);
    const dailyCal = calculateDailyCalories(tdee, goal || 'lose', speed, sex);
    const macros = calculateMacros(dailyCal, weightKg, activity);
    return macros;
  }, [currentWeight, weightUnit, storedHeight, birthYear, birthMonth, birthDay, gender, activityLevel, goal, weeklyGoalSpeed]);

  const greeting = name ? `Hi, ${name}` : 'Hi there';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo} accessible={true} accessibilityRole="image" accessibilityLabel="Calobite logo">
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 21.6C16.8 21.6 20.4 18 20.4 13.2C20.4 9.6 18 6 15.6 3.6L12 1.2L8.4 3.6C6 6 3.6 9.6 3.6 13.2C3.6 18 7.2 21.6 12 21.6Z"
                stroke={Theme.colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.logoText}>Calobite</Text>
          </View>
          <View style={styles.streakPill} accessible={true} accessibilityLabel="0 day streak">
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M12 2c0 0-3 3.5-3 5.5s1.5 3.5 3 3.5s3-1.5 3-3.5S12 2 12 2z" stroke={Theme.colors.calorieAlert} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M12 22c4.418 0 8-3.582 8-8c0-2.209-1-4.109-2.5-5.5C16 11 14 13 12 13s-4-2-5.5-4.5C5 9.891 4 11.791 4 14c0 4.418 3.582 8 8 8z" stroke={Theme.colors.calorieAlert} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.streakText}>0</Text>
          </View>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting} accessibilityRole="header">{greeting}</Text>

        {/* Calendar Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendar} contentContainerStyle={styles.calendarContent}>
          {weekDays.map((day) => (
            <TouchableOpacity key={day.num} style={styles.dayCol} hitSlop={DAY_HIT_SLOP} accessible={true} accessibilityLabel={`${day.name} ${day.num}${day.active ? ', today' : ''}`} accessibilityRole="button" activeOpacity={0.7}>
              <Text style={[styles.dayName, day.active && styles.dayNameActive]}>{day.name}</Text>
              <View style={[styles.dayCircle, day.active && styles.dayCircleActive]}>
                <Text style={[styles.dayNum, day.active && styles.dayNumActive]}>{day.num}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Calorie Card */}
        <View style={styles.mainCard} accessible={true} accessibilityLabel={`${plan.calories} Calories daily target`}>
          <View>
            <Text style={styles.calorieValue}>{plan.calories}</Text>
            <Text style={styles.calorieLabel}>
              Calories <Text style={styles.calorieLabelBold}>left</Text>
            </Text>
          </View>
          <DonutChart size={65} strokeWidth={7} progress={0} color={Theme.colors.calorieAlert}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={Theme.colors.calorieAlert} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </DonutChart>
        </View>

        {/* Macros Grid */}
        <View style={styles.macrosGrid}>
          <View style={styles.macroCard} accessible={true} accessibilityLabel={`${plan.protein}g Protein target`}>
            <View style={styles.macroTextBlock}>
              <Text style={styles.macroValue}>{plan.protein}g</Text>
              <Text style={styles.macroLabel}>Protein <Text style={styles.macroLabelBold}>left</Text></Text>
            </View>
            <DonutChart size={44} strokeWidth={5} progress={0} color={Theme.colors.protein}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M16 4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4z" stroke={Theme.colors.protein} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </DonutChart>
          </View>
          <View style={styles.macroCard} accessible={true} accessibilityLabel={`${plan.carbs}g Carbs target`}>
            <View style={styles.macroTextBlock}>
              <Text style={styles.macroValue}>{plan.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs <Text style={styles.macroLabelBold}>left</Text></Text>
            </View>
            <DonutChart size={44} strokeWidth={5} progress={0} color={Theme.colors.carbs}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M4 22L12 2l8 20" stroke={Theme.colors.carbs} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Line x1={8} y1={12} x2={16} y2={12} stroke={Theme.colors.carbs} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            </DonutChart>
          </View>
          <View style={styles.macroCard} accessible={true} accessibilityLabel={`${plan.fat}g Fats target`}>
            <View style={styles.macroTextBlock}>
              <Text style={styles.macroValue}>{plan.fat}g</Text>
              <Text style={styles.macroLabel}>Fats <Text style={styles.macroLabelBold}>left</Text></Text>
            </View>
            <DonutChart size={44} strokeWidth={5} progress={0} color={Theme.colors.success}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3-4-4-5.5c-1 1.5-2 3.9-4 5.5S5 13 5 15a7 7 0 0 0 7 7z" stroke={Theme.colors.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </DonutChart>
          </View>
        </View>

        {/* Recently Uploaded — Empty State */}
        <Text style={styles.sectionTitle} accessibilityRole="header">Recently uploaded</Text>
        <TouchableOpacity style={styles.emptyCard} activeOpacity={0.7} accessibilityLabel="Snap your first meal" accessibilityRole="button">
          <View style={styles.cameraIconWrap}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={Theme.colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={12} cy={13} r={4} stroke={Theme.colors.primary} strokeWidth={2} />
            </Svg>
          </View>
          <Text style={styles.emptyTitle}>Snap your first meal</Text>
          <Text style={styles.emptySubtitle}>Take a photo of your food to start tracking</Text>
        </TouchableOpacity>
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
    marginTop: 5,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 19,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
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
    shadowColor: Theme.colors.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  streakText: {
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    fontSize: 13,
  },
  greeting: {
    fontSize: 22,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    marginTop: 20,
    marginBottom: 18,
  },

  // Calendar
  calendar: { marginBottom: 12 },
  calendarContent: { gap: 12 },
  dayCol: { alignItems: 'center', gap: 8, minWidth: 45 },
  dayName: { fontSize: 12, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textMuted },
  dayNameActive: { color: Theme.colors.textDark },
  dayCircle: {
    width: 40, height: 40, borderRadius: Theme.borderRadius.button, borderWidth: 2, borderStyle: 'dashed',
    borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: Theme.colors.primary, borderWidth: 0,
    shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 4,
  },
  dayNum: { fontFamily: Theme.fonts.extraBold, fontSize: 14, color: Theme.colors.textMuted },
  dayNumActive: { color: Theme.colors.white },

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
    fontSize: 12, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted, marginTop: 3,
  },
  calorieLabelBold: { color: Theme.colors.textDark },

  // Macros
  macrosGrid: {
    flexDirection: 'row', gap: 12, marginBottom: 25,
  },
  macroCard: {
    flex: 1, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card,
    paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center',
    minHeight: 125, shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
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
    fontSize: 11, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted,
    textAlign: 'center', marginTop: 2, lineHeight: 14,
  },
  macroLabelBold: { color: Theme.colors.textDark },
  donutContainer: { alignItems: 'center', justifyContent: 'center' },
  donutSvg: { position: 'absolute' as const },

  // Recently uploaded — empty state
  sectionTitle: {
    fontSize: 17, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 15, textAlign: 'left',
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
    fontSize: 16, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  emptySubtitle: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'center', marginTop: 4,
  },
});
