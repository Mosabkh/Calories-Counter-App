import type { ActivityLevel } from '@/utils/calories';

// ── User Profile (graduated from onboarding) ──────────────────────

export interface UserProfile {
  name: string;
  gender: 'male' | 'female';
  birthYear: string;
  birthMonth: string;
  birthDay: string;

  heightCm: number;
  heightUnit: 'cm' | 'ft';
  startWeight: number;
  weightUnit: 'kg' | 'lb';
  activityLevel: ActivityLevel;

  goal: 'lose' | 'maintain' | 'gain';
  targetWeight: number;
  weeklyGoalSpeed: number;

  eatsMoreOnWeekends: boolean;
  weekendDays: string[];
  addBurnedCalories: boolean;
  rolloverCalories: boolean;
  enableNotifications: boolean;

  // Cached targets (recalculated on profile edit)
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

// ── Auth ───────────────────────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  provider: 'google' | 'apple' | 'anonymous' | null;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    photoUrl: string | null;
  } | null;
}

// ── Meal / Food Entry ──────────────────────────────────────────────

export interface MealEntry {
  id: string;
  date: string;                  // 'YYYY-MM-DD'
  timestamp: number;             // Unix ms
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUri?: string;
  servingSize?: string;
}

// ── Daily Summary (derived per day) ────────────────────────────────

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

// ── Exercise Entry ─────────────────────────────────────────────────

export interface ExerciseEntry {
  id: string;
  date: string;                  // 'YYYY-MM-DD'
  timestamp: number;
  name: string;
  durationMin: number;
  caloriesBurned: number;
}

// ── Weight Log ─────────────────────────────────────────────────────

export interface WeightEntry {
  id: string;
  date: string;                  // 'YYYY-MM-DD'
  timestamp: number;
  weight: number;
  unit: 'kg' | 'lb';
}

// ── Streak ─────────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null; // 'YYYY-MM-DD'
}
