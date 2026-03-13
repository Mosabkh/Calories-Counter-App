/**
 * Calorie & macro calculations based on the Mifflin-St Jeor equation (1990).
 * Recommended by the Academy of Nutrition and Dietetics as the most accurate
 * predictive equation for estimating BMR in healthy individuals.
 *
 * References:
 * - Mifflin MD et al. "A new predictive equation for resting energy expenditure
 *   in healthy individuals." Am J Clin Nutr. 1990;51(2):241-247.
 * - ACSM's Guidelines for Exercise Testing and Prescription (11th ed.)
 * - ISSN Position Stand on Diets and Body Composition (2017)
 */

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/**
 * NEAT-only multipliers (Non-Exercise Activity Thermogenesis).
 * These reflect daily occupation/lifestyle movement — NOT intentional exercise.
 * Intentional exercise is tracked separately via the exercise log and added on top.
 *
 * Based on adjusted Mifflin-St Jeor multipliers with exercise component removed:
 * - Original 1.2 (sedentary) stays — baseline with minimal NEAT
 * - Higher tiers lowered ~0.1-0.2 vs traditional multipliers since exercise is logged separately
 */
const ACTIVITY_MULTIPLIERS: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1.2,     // Desk job, mostly sitting
  light: 1.3,         // Mostly standing (teacher, retail)
  moderate: 1.45,     // On your feet most of the day (nurse, waiter)
  active: 1.6,        // Physical labor (construction, warehouse)
  very_active: 1.75,  // Very physical job (farming, heavy labor)
};

/**
 * Mifflin-St Jeor BMR (kcal/day)
 * Men:   10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
 * Women: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: 'male' | 'female',
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return gender === 'male' ? base + 5 : base - 161;
}

/** TDEE = BMR × activity multiplier */
export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

/**
 * Daily calorie target based on goal.
 * - Lose: deficit derived from weekly speed (1 kg fat ≈ 7700 kcal)
 * - Gain: surplus derived from weekly speed, capped at TDEE + 500 kcal
 * - Maintain: TDEE as-is
 *
 * Safety: floors at 1200 (women) / 1500 (men); gain capped at TDEE + 500.
 * Ref: Iraki et al. (2019) recommend 10-20% surplus for lean gains (~300-500 kcal).
 */
export function calculateDailyCalories(
  tdee: number,
  goal: 'lose' | 'maintain' | 'gain',
  weeklySpeedKg: number,
  gender: 'male' | 'female',
): number {
  const minCal = gender === 'male' ? 1500 : 1200;
  const maxGainSurplus = 500; // Cap surplus at 500 kcal/day for healthy gains

  if (goal === 'maintain') return Math.max(minCal, tdee);

  // 1 kg body fat ≈ 7700 kcal → daily delta = speed × 7700 / 7
  const dailyDelta = Math.round((weeklySpeedKg * 7700) / 7);

  if (goal === 'lose') return Math.max(minCal, tdee - dailyDelta);
  return Math.min(tdee + maxGainSurplus, tdee + dailyDelta); // gain, capped
}

/**
 * Macro split (evidence-based, activity-adjusted):
 * - Protein: 1.2 g/kg (sedentary) to 2.0 g/kg (active) — ISSN position stand
 * - Fat: 25% of total calories (minimum for hormonal health)
 * - Carbs: remaining calories
 *
 * 1g protein = 4 kcal, 1g carb = 4 kcal, 1g fat = 9 kcal
 */
export function calculateMacros(
  dailyCalories: number,
  weightKg: number,
  activity: ActivityLevel = 'moderate',
): { protein: number; fat: number; carbs: number; calories: number } {
  // Protein scaled by occupation activity; users who exercise heavily
  // will naturally eat more via the exercise calorie budget
  const proteinPerKg = activity === 'sedentary' ? 1.2
    : activity === 'light' ? 1.3
    : activity === 'moderate' ? 1.5
    : activity === 'active' ? 1.7
    : 1.9; // very_active — high physical labor (ISSN position stand, Jager et al. 2017)
  let protein = Math.round(weightKg * proteinPerKg);
  const fatCal = Math.round(dailyCalories * 0.25);
  const fat = Math.round(fatCal / 9);
  const actualFatCal = fat * 9;

  // Cap protein so protein + fat never exceeds 90% of calories, leaving a carb floor
  const maxProteinCal = Math.floor(dailyCalories * 0.9) - actualFatCal;
  if (protein * 4 > maxProteinCal) {
    protein = Math.max(0, Math.round(maxProteinCal / 4));
  }
  const proteinCal = protein * 4;

  const remainingCal = dailyCalories - proteinCal - actualFatCal;
  const carbs = Math.max(0, Math.round(remainingCal / 4));

  // Reconcile: adjust carbs so macro calories exactly match target
  const macroSum = proteinCal + actualFatCal + carbs * 4;
  const finalCarbs = macroSum !== dailyCalories
    ? carbs + Math.round((dailyCalories - macroSum) / 4)
    : carbs;

  return { protein, fat, carbs: Math.max(0, finalCarbs), calories: dailyCalories };
}

/**
 * Split daily calories into normal-day and high-day targets.
 * Weekly total stays the same. High days get a ~20% bump; normal days absorb the deficit.
 */
export function calculateDaySplit(
  dailyCalories: number,
  highDayCount: number,
): { normalDayCal: number; highDayCal: number } {
  if (highDayCount <= 0 || highDayCount >= 7) {
    return { normalDayCal: dailyCalories, highDayCal: dailyCalories };
  }
  const weeklyTotal = dailyCalories * 7;
  const BUMP = 0.20; // 20% extra on high days
  const highDayCal = Math.round(dailyCalories * (1 + BUMP));
  const normalDayCal = Math.round((weeklyTotal - highDayCal * highDayCount) / (7 - highDayCount));
  return { normalDayCal, highDayCal };
}

/**
 * BMI = weight(kg) / height(m)^2
 * WHO categories: Underweight <18.5, Healthy 18.5-24.9, Overweight 25-29.9, Obese 30+
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  const result = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  return isNaN(result) ? 0 : result;
}

export function getBMICategory(bmi: number): 'Underweight' | 'Healthy' | 'Overweight' | 'Obese' {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

const MONTH_ABBREVS: Readonly<Record<string, number>> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** Calculate age from birth year/month/day. Month can be abbreviation ('Jan') or number string ('1'). */
/**
 * Calculate age from birth components. Returns clamped age 18-78 (validated Mifflin-St Jeor range).
 * Falls back to 25 only if parsing completely fails.
 */
export function calculateAge(birthYear: string, birthMonth: string, birthDay: string): number {
  const now = new Date();
  const year = parseInt(birthYear, 10);
  if (isNaN(year)) return 25;
  const day = parseInt(birthDay, 10);
  if (isNaN(day)) return 25;
  const month = MONTH_ABBREVS[birthMonth] ?? (parseInt(birthMonth, 10) - 1);
  if (isNaN(month) || month < 0 || month > 11) return 25;

  const birth = new Date(year, month, day);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  // Clamp to scientifically validated range for Mifflin-St Jeor
  return Math.max(18, Math.min(78, age));
}
