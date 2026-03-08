import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BouncyView } from '@/components/onboarding/BouncyView';
import { useUserStore } from '@/store/user-store';
import { useWeightStore } from '@/store/weight-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import {
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateMacros,
} from '@/utils/calories';
import { toDateKey } from '@/utils/date';
import type { UserProfile } from '@/types/data';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleSkip = () => {
    const weightKg = 75;
    const heightCm = 175;
    const age = 25;
    const gender = 'male' as const;
    const activity = 'moderate' as const;
    const goal = 'lose' as const;
    const speed = 0.5;

    const bmr = calculateBMR(weightKg, heightCm, age, gender);
    const tdee = calculateTDEE(bmr, activity);
    const dailyCal = calculateDailyCalories(tdee, goal, speed, gender);
    const macros = calculateMacros(dailyCal, weightKg, activity);

    const profile: UserProfile = {
      name: 'Dev',
      gender,
      birthYear: '2001',
      birthMonth: '01',
      birthDay: '01',
      heightCm,
      heightUnit: 'cm',
      startWeight: weightKg,
      weightUnit: 'kg',
      activityLevel: activity,
      goal,
      targetWeight: 68,
      weeklyGoalSpeed: speed,
      eatsMoreOnWeekends: false,
      weekendDays: [],
      addBurnedCalories: false,
      rolloverCalories: false,
      enableNotifications: false,
      dailyCalorieTarget: macros.calories,
      proteinTarget: macros.protein,
      carbsTarget: macros.carbs,
      fatTarget: macros.fat,
    };

    useUserStore.getState().setProfile(profile);
    useWeightStore.getState().addEntry({
      id: `dev-${Date.now()}`,
      date: toDateKey(),
      timestamp: Date.now(),
      weight: weightKg,
      unit: 'kg',
    });
    useOnboardingStore.getState().completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
        <View style={styles.heroImg}>
          <Image
            source={require('@/assets/images/hero-food.png')}
            style={styles.heroImage}
            resizeMode="cover"
            accessibilityLabel="A plate of food being scanned"
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Know exactly what you eat</Text>
          <Text style={styles.subtitle}>
            Snap your meals, get a personalized plan, and hit your goals without the guesswork.
          </Text>
        </View>
        <View style={styles.bottomAction}>
          <OnboardingButton title="Continue" onPress={() => router.push('/onboarding/name')} />
          <Text style={styles.signInText}>
            Purchased on the web?{' '}
            <Text style={styles.signInLink}>Sign in</Text>
          </Text>
          {__DEV__ && (
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>Skip Onboarding (DEV)</Text>
            </TouchableOpacity>
          )}
        </View>
      </BouncyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  heroImg: {
    height: 280,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: Theme.colors.accentBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  signInText: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    marginTop: 15,
  },
  signInLink: {
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.bold,
  },
  skipBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.urgentRed,
    borderRadius: Theme.borderRadius.button,
    borderStyle: 'dashed',
  },
  skipBtnText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.urgentRed,
  },
});
