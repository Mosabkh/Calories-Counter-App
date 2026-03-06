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

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,     // Little or no exercise
  light: 1.375,       // Light exercise 1-3 days/week
  moderate: 1.55,     // Moderate exercise 3-5 days/week
  active: 1.725,      // Hard exercise 6-7 days/week
  very_active: 1.9,   // Very hard exercise, physical job
};

/**
 * Mifflin-St Jeor BMR (kcal/day)
 * Men:   10 × weight(kg) + 6.25 × height(cm) - 5 × age - 5 + 166  → simplified: 10w + 6.25h - 5a + 5
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

  if (goal === 'maintain') return tdee;

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
  const proteinPerKg = activity === 'sedentary' ? 1.2
    : activity === 'light' ? 1.4
    : activity === 'moderate' ? 1.6
    : 2.0; // active & very_active
  const protein = Math.round(weightKg * proteinPerKg);
  const proteinCal = protein * 4;

  const fatCal = Math.round(dailyCalories * 0.25);
  const fat = Math.round(fatCal / 9);

  const carbCal = Math.max(0, dailyCalories - proteinCal - fatCal);
  const carbs = Math.round(carbCal / 4);

  return { protein, fat, carbs, calories: dailyCalories };
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
 * WHO categories: Underweight <18.5, Normal 18.5-24.9, Overweight 25-29.9, Obese 30+
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

const MONTH_ABBREVS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** Calculate age from birth year/month/day. Month can be abbreviation ('Jan') or number string ('1'). */
export function calculateAge(birthYear: string, birthMonth: string, birthDay: string): number {
  const now = new Date();
  const year = parseInt(birthYear, 10);
  const day = parseInt(birthDay, 10);
  const month = MONTH_ABBREVS[birthMonth] ?? (parseInt(birthMonth, 10) - 1);

  if (isNaN(year) || isNaN(day) || isNaN(month)) return 25; // safe fallback

  const birth = new Date(year, month, day);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(1, age);
}
