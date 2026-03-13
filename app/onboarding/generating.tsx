import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { OnboardingIcon } from '@/components/onboarding/OnboardingIcon';
import { useOnboardingStore } from '@/store/onboarding-store';
import { getTargetDate } from '@/utils/target-date';

const STEPS = [
  'Calculating your BMR',
  'Setting calorie target',
  'Balancing macros',
  'Analyzing your body metrics',
  'Finalizing your plan',
];

const STEP_INTERVAL = 650;
const CHECK_DELAY = 450;

function StepRow({ label, index }: { label: string; index: number }) {
  const rowOpacity = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0.5);
  const spinnerOpacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  const showAt = index * STEP_INTERVAL;
  const checkAt = showAt + CHECK_DELAY;

  useEffect(() => {
    // Row fades in + slides up
    rowOpacity.value = withDelay(showAt, withTiming(1, { duration: 250 }));
    translateY.value = withDelay(showAt, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }));

    // Spinner shows briefly then hides when check appears
    spinnerOpacity.value = withDelay(
      showAt,
      withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(CHECK_DELAY - 150, withTiming(0, { duration: 150 }))
      )
    );

    // Check pops in
    checkOpacity.value = withDelay(checkAt, withTiming(1, { duration: 200 }));
    checkScale.value = withDelay(
      checkAt,
      withSequence(
        withTiming(1.2, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.inOut(Easing.quad) })
      )
    );
  }, [rowOpacity, translateY, spinnerOpacity, checkOpacity, checkScale, showAt, checkAt]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: rowOpacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View style={[styles.stepRow, rowStyle]}>
      <View style={styles.stepIconWrap}>
        <Animated.View style={[styles.stepSpinnerWrap, spinnerStyle]}>
          <View style={styles.stepSpinner} />
        </Animated.View>
        <Animated.View style={[styles.stepCheckWrap, checkStyle]}>
          <OnboardingIcon name="check-circle" size={20} color={Theme.colors.success} />
        </Animated.View>
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function GeneratingScreen() {
  const router = useRouter();
  const { currentWeight, targetWeight, weightUnit, weeklyGoalSpeed, goal } = useOnboardingStore((s) => s.payload);
  const isMaintain = goal === 'maintain';
  const targetDate = isMaintain ? '' : getTargetDate(currentWeight || 0, targetWeight || 0, weeklyGoalSpeed || 0.5, weightUnit || 'kg');
  const rotation = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(16);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const navigatedRef = useRef(false);

  const totalTime = STEPS.length * STEP_INTERVAL + CHECK_DELAY + 600;

  const navigateNext = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
    router.replace('/onboarding/custom-plan');
  };

  useEffect(() => {
    navigatedRef.current = false;
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    // Show card after last step checks off
    const cardShowAt = (STEPS.length - 1) * STEP_INTERVAL + CHECK_DELAY + 200;
    cardOpacity.value = withDelay(cardShowAt, withTiming(1, { duration: 300 }));
    cardTranslateY.value = withDelay(
      cardShowAt,
      withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })
    );

    timerRef.current = setTimeout(navigateNext, totalTime);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = undefined;
    };
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Animated.View style={[styles.spinner, spinnerStyle]} />
        <Text style={styles.title}>Creating your custom blueprint...</Text>

        <View style={styles.stepsList}>
          {STEPS.map((label, i) => (
            <StepRow key={label} label={label} index={i} />
          ))}
        </View>

        <Animated.View style={[styles.card, cardStyle]}>
          {isMaintain ? (
            <>
              <OnboardingIcon name="target" size={24} color={Theme.colors.primary} />
              <Text style={styles.cardText}>
                Your personalized maintenance plan is being created to keep you at your best.
              </Text>
            </>
          ) : (
            <>
              <OnboardingIcon name="target" size={24} color={Theme.colors.primary} />
              <Text style={styles.cardText}>
                If you follow this plan, you will reach your goal weight by:
              </Text>
              <Text style={styles.cardDate}>{targetDate}</Text>
            </>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  spinner: {
    width: 70, height: 70, borderRadius: 35,
    borderWidth: 5, borderColor: Theme.colors.border,
    borderTopColor: Theme.colors.primary, marginBottom: 24,
  },
  title: {
    fontSize: 22, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', marginBottom: 24,
  },
  stepsList: {
    width: '100%', gap: 14,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8,
  },
  stepIconWrap: {
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  stepSpinnerWrap: {
    position: 'absolute',
  },
  stepSpinner: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2.5, borderColor: Theme.colors.border,
    borderTopColor: Theme.colors.primary,
  },
  stepCheckWrap: {
    position: 'absolute',
  },
  stepLabel: {
    fontSize: 14, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textMuted,
  },
  card: {
    backgroundColor: Theme.colors.surface, padding: 20, borderRadius: Theme.borderRadius.card,
    borderWidth: 2, borderColor: Theme.colors.border, marginTop: 24,
    alignItems: 'center', width: '100%',
  },
  cardText: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 14,
    textAlign: 'center', lineHeight: 21,
  },
  cardDate: {
    color: Theme.colors.primary, fontSize: 20, fontFamily: Theme.fonts.extraBold,
    marginTop: 5,
  },
});
