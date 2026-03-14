import { useOnboardingStore } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';
import { useWeightStore } from '@/store/weight-store';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateMacros,
  calculateAge,
} from '@/utils/calories';
import { toDateKey } from '@/utils/date';
import type { ActivityLevel } from '@/utils/calories';
import type { UserProfile } from '@/types/data';

/**
 * One-time graduation: copies onboarding payload into the persistent
 * user-store and seeds the initial weight entry. Call this at the end
 * of onboarding (paywall "Start" / "Skip" button).
 */
export function graduateOnboarding(): void {
  const payload = useOnboardingStore.getState().payload;

  // height.tsx already converts ft/in to cm before storing, so use directly
  const heightCm = payload.height ?? 170;

  // Combine whole number + decimal (stored as picker index 0-9)
  const cw = (payload.currentWeight ?? 70) + (payload.weightDecimal ?? 0) / 10;
  const unit = payload.weightUnit ?? 'kg';
  const weightKg = unit === 'lb' ? cw / 2.20462 : cw;
  const gender = payload.gender ?? 'male';
  const activity: ActivityLevel = payload.activityLevel ?? 'moderate';
  const goal = payload.goal ?? 'lose';
  const speed = payload.weeklyGoalSpeed ?? 0.5;

  const age = (payload.birthYear && payload.birthMonth && payload.birthDay)
    ? calculateAge(payload.birthYear, payload.birthMonth, payload.birthDay)
    : 25;

  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activity);
  const dailyCal = calculateDailyCalories(tdee, goal, speed, gender);
  const macros = calculateMacros(dailyCal, weightKg, activity);

  const profile: UserProfile = {
    name: payload.name ?? '',
    gender,
    birthYear: payload.birthYear ?? '',
    birthMonth: payload.birthMonth ?? '',
    birthDay: payload.birthDay ?? '',
    heightCm,
    heightUnit: payload.heightUnit ?? 'cm',
    startWeight: cw,
    weightUnit: unit,
    activityLevel: activity,
    goal,
    targetWeight: (payload.targetWeight ?? payload.currentWeight ?? 70) + (payload.targetWeightDecimal ?? 0) / 10,
    weeklyGoalSpeed: speed,
    eatsMoreOnWeekends: payload.eatsMoreOnWeekends ?? false,
    weekendDays: payload.weekendDays ?? [],
    addBurnedCalories: payload.addBurnedCalories ?? false,
    rolloverCalories: payload.rolloverCalories ?? false,
    enableNotifications: payload.enableNotifications ?? false,
    dailyCalorieTarget: macros.calories,
    proteinTarget: macros.protein,
    carbsTarget: macros.carbs,
    fatTarget: macros.fat,
  };

  useUserStore.getState().setProfile(profile);

  // Seed initial weight entry
  const today = toDateKey();
  useWeightStore.getState().addEntry({
    id: `initial-${Date.now()}`,
    date: today,
    timestamp: Date.now(),
    weight: cw,
    unit,
  });
}
