import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateMacros,
  calculateAge,
  type ActivityLevel,
} from '@/utils/calories';
import type { UserProfile } from '@/types/data';

/**
 * Given the current profile and a partial patch, recalculates
 * BMR/TDEE/macros and returns the patch with updated cached targets.
 * Use this whenever profile fields that affect calorie calculations change.
 */
export function recalculateTargets(
  current: UserProfile,
  patch: Partial<UserProfile>,
): Partial<UserProfile> {
  const merged = { ...current, ...patch };

  const weightKg =
    merged.weightUnit === 'lb'
      ? merged.startWeight / 2.20462
      : merged.startWeight;

  const age =
    merged.birthYear && merged.birthMonth && merged.birthDay
      ? calculateAge(merged.birthYear, merged.birthMonth, merged.birthDay)
      : 25;

  const bmr = calculateBMR(weightKg, merged.heightCm, age, merged.gender);
  const tdee = calculateTDEE(bmr, merged.activityLevel);
  const dailyCal = calculateDailyCalories(
    tdee,
    merged.goal,
    merged.weeklyGoalSpeed,
    merged.gender,
  );
  const macros = calculateMacros(dailyCal, weightKg, merged.activityLevel);

  return {
    ...patch,
    dailyCalorieTarget: macros.calories,
    proteinTarget: macros.protein,
    carbsTarget: macros.carbs,
    fatTarget: macros.fat,
  };
}
