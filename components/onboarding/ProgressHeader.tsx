import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/theme';

interface ProgressHeaderProps {
  step: 1 | 2 | 3;
  progress: number; // 0-100
}

const STEP_LABELS = {
  1: 'STEP 1: BASICS',
  2: 'STEP 2: BODY & GOALS',
  3: 'STEP 3: LIFESTYLE',
};

export function ProgressHeader({ step, progress }: ProgressHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Go back" accessibilityRole="button">
        <Text style={styles.backText} accessible={false}>{'<'}</Text>
      </TouchableOpacity>
      <View style={styles.progressWrapper}>
        <Text style={styles.stepLabel} accessibilityRole="header">{STEP_LABELS[step]}</Text>
        <View style={styles.barContainer} accessible={true} accessibilityRole="progressbar" accessibilityLabel={`Step ${step}, ${progress}% complete`} accessibilityValue={{ min: 0, max: 100, now: progress }}>
          <View style={[styles.bar, { width: `${progress}%` }]} />
        </View>
      </View>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: Theme.colors.textDark,
    fontFamily: Theme.fonts.bold,
  },
  progressWrapper: {
    flex: 1,
    gap: 5,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    letterSpacing: 1,
  },
  spacer: {
    width: 44,
  },
  barContainer: {
    width: '100%',
    height: 6,
    backgroundColor: Theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 4,
  },
});
