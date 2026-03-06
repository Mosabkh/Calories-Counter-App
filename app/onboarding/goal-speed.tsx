import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const MIN_SPEED = 0.1;
const MAX_SPEED = 1.5;
const TRACK_WIDTH = 280;

function getLabel(speed: number): string {
  if (speed <= 0.4) return 'Slow and Steady';
  if (speed <= 0.8) return 'Moderate';
  if (speed <= 1.2) return 'Fast';
  return 'Very Fast';
}

function getEmoji(speed: number): string {
  if (speed <= 0.4) return '🐢';
  if (speed <= 0.8) return '🐇';
  return '🐆';
}

export default function GoalSpeedScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const weightUnit = useOnboardingStore((s) => s.payload.weightUnit) || 'kg';

  const [speed, setSpeed] = useState(0.8);
  const thumbX = useSharedValue(
    ((0.8 - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * TRACK_WIDTH
  );

  const updateSpeed = useCallback((x: number) => {
    const clamped = Math.max(0, Math.min(x, TRACK_WIDTH));
    const value = MIN_SPEED + (clamped / TRACK_WIDTH) * (MAX_SPEED - MIN_SPEED);
    setSpeed(Math.round(value * 10) / 10);
  }, []);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      const newX = Math.max(0, Math.min(e.x, TRACK_WIDTH));
      thumbX.value = newX;
      runOnJS(updateSpeed)(newX);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - 12 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  const handleContinue = () => {
    updatePayload({ weeklyGoalSpeed: speed });
    router.push('/onboarding/transition2');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={2} progress={100} />
      <View style={styles.content}>
        <Text style={styles.title}>How fast do you want to reach your goal?</Text>
        <Text style={styles.subtitle}>Lose weight speed per week</Text>
        <Text style={styles.speedValue}>
          {speed.toFixed(1)} {weightUnit}
        </Text>

        <View style={styles.sliderWrapper}>
          <View style={styles.emojiRow}>
            <Text style={styles.emoji}>🐢</Text>
            <Text style={styles.emoji}>🐇</Text>
            <Text style={styles.emoji}>🐆</Text>
          </View>

          <GestureDetector gesture={gesture}>
            <View style={styles.sliderTrack}>
              <Animated.View style={[styles.sliderFill, fillStyle]} />
              <Animated.View style={[styles.sliderThumb, thumbStyle]} />
            </View>
          </GestureDetector>

          <View style={styles.labelRow}>
            <Text style={styles.rangeLabel}>0.1 {weightUnit}</Text>
            <Text style={styles.rangeLabel}>0.8 {weightUnit}</Text>
            <Text style={styles.rangeLabel}>1.5 {weightUnit}</Text>
          </View>
        </View>

        <View style={styles.paceCard}>
          <Text style={styles.paceText}>{getLabel(speed)}</Text>
        </View>
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
    fontSize: 36,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.primary,
    textAlign: 'center',
    marginVertical: 20,
  },
  sliderWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: TRACK_WIDTH,
    marginBottom: 10,
  },
  emoji: {
    fontSize: 24,
  },
  sliderTrack: {
    width: TRACK_WIDTH,
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 4,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    backgroundColor: Theme.colors.textDark,
    borderRadius: 12,
    position: 'absolute',
    top: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: TRACK_WIDTH,
    marginTop: 10,
  },
  rangeLabel: {
    fontSize: 12,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
  },
  paceCard: {
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 2,
    borderColor: Theme.colors.border,
  },
  paceText: {
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    fontSize: 16,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
