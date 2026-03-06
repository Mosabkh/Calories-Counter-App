import { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { UnitToggle } from '@/components/onboarding/UnitToggle';
import { useOnboardingStore } from '@/store/onboarding-store';

interface SpeedOption {
  speed: number;
  lbSpeed: string;
  icon: string;
  label: string;
  desc: string;
  warning?: string;
}

const LOSE_OPTIONS: SpeedOption[] = [
  {
    speed: 0.5, lbSpeed: '1.1', icon: '🚶',
    label: 'Slow & Steady',
    desc: 'Sustainable and easy to maintain. Best for long-term results.',
  },
  {
    speed: 1.0, lbSpeed: '2.2', icon: '🏃',
    label: 'Recommended',
    desc: 'The sweet spot between speed and comfort. Most popular choice.',
  },
  {
    speed: 1.5, lbSpeed: '3.3', icon: '⚡',
    label: 'Aggressive',
    desc: 'Fast results, but you may feel tired and experience loose skin.',
    warning: 'You may feel fatigued and experience muscle loss or loose skin.',
  },
];

const GAIN_OPTIONS: SpeedOption[] = [
  {
    speed: 0.25, lbSpeed: '0.55', icon: '🌱',
    label: 'Lean Gain',
    desc: 'Maximizes muscle-to-fat ratio. Best for staying lean while building muscle.',
  },
  {
    speed: 0.5, lbSpeed: '1.1', icon: '💪',
    label: 'Recommended',
    desc: 'Ideal for beginners with high muscle growth potential. The sweet spot for most people.',
  },
  {
    speed: 0.75, lbSpeed: '1.65', icon: '🔥',
    label: 'Aggressive',
    desc: 'Faster results, but expect more fat gain alongside muscle.',
    warning: 'Higher fat gain expected. Best for underweight individuals or experienced lifters.',
  },
];

const SpeedIcon = memo(function SpeedIcon({ icon, active }: { icon: string; active: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = 0;
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
          withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      progress.value = withTiming(0, { duration: 200 });
    }
  }, [active]);

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 0.6, 1], [1, 1.05, 1.2]);
    return {
      transform: [{ scale }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.6, 1], [0, 0.15, 0.3]);
    const scale = interpolate(progress.value, [0, 0.6, 1], [0.8, 1, 1.3]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.iconGlow, glowStyle]} />
      <Animated.Text style={[styles.speedIcon, iconStyle]}>
        {icon}
      </Animated.Text>
    </View>
  );
});

export default function GoalSpeedScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const storedUnit = useOnboardingStore((s) => s.payload.weightUnit) || 'kg';
  const goal = useOnboardingStore((s) => s.payload.goal);
  const isGaining = goal === 'gain';
  const options = isGaining ? GAIN_OPTIONS : LOSE_OPTIONS;

  const [selectedIndex, setSelectedIndex] = useState(1);
  const [unit, setUnit] = useState(storedUnit);

  const selected = options[selectedIndex];
  const displaySpeed = unit === 'lb' ? selected.lbSpeed : selected.speed.toFixed(1);

  const handleContinue = () => {
    updatePayload({ weeklyGoalSpeed: selected.speed });
    router.push('/onboarding/transition2');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={2} progress={100} />
      <View style={styles.content}>
        <Text style={styles.title}>How fast do you want to reach your goal?</Text>
        <Text style={styles.subtitle}>{isGaining ? 'Gain' : 'Lose'} weight speed per week</Text>
        <UnitToggle
          options={['lb', 'kg']}
          selected={unit}
          onSelect={(v) => setUnit(v)}
        />
        <Text style={styles.speedValue}>
          {displaySpeed} {unit}/week
        </Text>

        <View style={styles.optionsContainer}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt.speed}
              style={[styles.optionCard, selectedIndex === i && styles.optionCardActive]}
              onPress={() => setSelectedIndex(i)}
              activeOpacity={0.7}
              accessibilityLabel={`${opt.label}, ${unit === 'lb' ? opt.lbSpeed : opt.speed.toFixed(1)} ${unit} per week`}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedIndex === i }}
            >
              <View style={styles.optionTop}>
                <SpeedIcon icon={opt.icon} active={selectedIndex === i} />
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, selectedIndex === i && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionSpeed}>
                    {unit === 'lb' ? opt.lbSpeed : opt.speed.toFixed(1)} {unit}/week
                  </Text>
                </View>
                <View style={[styles.radio, selectedIndex === i && styles.radioActive]}>
                  {selectedIndex === i && <View style={styles.radioDot} />}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View key={selectedIndex} entering={FadeIn.duration(250)} style={styles.descCard}>
          <Text style={styles.descText}>{selected.desc}</Text>
          {selected.warning && (
            <Text style={styles.warningText}>⚠️ {selected.warning}</Text>
          )}
        </Animated.View>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    textAlign: 'left',
    marginTop: 20,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    textAlign: 'left',
    marginTop: 5,
  },
  speedValue: {
    fontSize: 32,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginVertical: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: 16,
    padding: 16,
  },
  optionCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryActive,
  },
  optionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
  },
  speedIcon: {
    fontSize: 26,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
  },
  optionLabelActive: {
    color: Theme.colors.textDark,
  },
  optionSpeed: {
    fontSize: 13,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: {
    borderColor: Theme.colors.primary,
  },
  radioDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Theme.colors.primary,
  },
  descCard: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  descText: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textDark,
    lineHeight: 21,
  },
  warningText: {
    fontSize: 13,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.calorieAlert,
    marginTop: 8,
    lineHeight: 19,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
