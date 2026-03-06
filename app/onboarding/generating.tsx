import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { useOnboardingStore } from '@/store/onboarding-store';
import { getTargetDate } from '@/utils/target-date';

export default function GeneratingScreen() {
  const router = useRouter();
  const { currentWeight, targetWeight, weeklyGoalSpeed } = useOnboardingStore((s) => s.payload);
  const targetDate = getTargetDate(currentWeight || 0, targetWeight || 0, weeklyGoalSpeed || 0.5);
  const rotation = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const navigatedRef = useRef(false);

  const navigateNext = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    router.replace('/onboarding/custom-plan');
  };

  const handleBack = () => {
    navigatedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    router.back();
  };

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    timerRef.current = setTimeout(navigateNext, 3500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={styles.backTouchable} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backBtn}>{'<'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Animated.View style={[styles.spinner, spinnerStyle]} />
        <Text style={styles.title}>Creating your custom blueprint...</Text>
        <Text style={styles.applying}>
          Applying peer-reviewed nutritional frameworks...
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>🎯</Text>
          <Text style={styles.cardText}>
            If you follow this plan, you will reach your goal weight by:
          </Text>
          <Text style={styles.cardDate}>{targetDate}</Text>
        </View>
      </View>
      <View style={styles.bottomAction}>
        <TouchableOpacity onPress={navigateNext} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    paddingHorizontal: 16, paddingTop: 10,
  },
  backTouchable: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  backBtn: {
    fontSize: 22, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted,
  },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  spinner: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 6, borderColor: Theme.colors.border,
    borderTopColor: Theme.colors.primary, marginBottom: 30,
  },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', marginBottom: 15,
  },
  applying: {
    color: Theme.colors.primary, fontFamily: Theme.fonts.extraBold, fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Theme.colors.surface, padding: 15, borderRadius: 15,
    borderWidth: 2, borderColor: Theme.colors.border, marginTop: 20,
    alignItems: 'center',
  },
  cardIcon: { fontSize: 24, marginBottom: 5 },
  cardText: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 14,
    textAlign: 'center',
  },
  cardDate: {
    color: Theme.colors.primary, fontSize: 20, fontFamily: Theme.fonts.extraBold,
    marginTop: 5,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
  },
});
