import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';
import { BouncyView } from '@/components/onboarding/BouncyView';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DietAdjustmentScreen() {
  const router = useRouter();
  const goal = useOnboardingStore((s) => s.payload.goal);
  const weekendDays = useOnboardingStore((s) => s.payload.weekendDays) ?? [];

  // Guard: if no days selected, redirect back
  if (weekendDays.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <BouncyView>
        <ProgressHeader step={3} progress={60} />
        <View style={styles.content}>
          <Text style={styles.title}>No days selected</Text>
          <Text style={styles.subtitle}>Go back and pick which days you eat more so we can adjust your plan.</Text>
        </View>
        <View style={styles.bottomAction}>
          <OnboardingButton title="Go Back" onPress={() => router.back()} />
        </View>
        </BouncyView>
      </SafeAreaView>
    );
  }

  const isHighDay = (index: number) => weekendDays.includes(DAY_NAMES[index]);

  const getBarHeight = (index: number) => (isHighDay(index) ? 90 : 50);

  const highDayCount = weekendDays.length;
  const dayText =
    highDayCount === 1
      ? weekendDays[0] + 's'
      : weekendDays.length <= 3
        ? weekendDays.join(', ')
        : 'your chosen days';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={3} progress={60} />
      <View style={styles.content}>
        <Text style={styles.title}>We{"'"}ll take that into account!</Text>

        <View style={styles.chartContainer}>
          <View style={styles.barChart}>
            {DAY_LABELS.map((_, i) => (
              <View key={i} style={styles.barWrapper}>
                {isHighDay(i) && (
                  <View style={styles.barIcon} accessible={false}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 19V5M5 12L12 5L19 12" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                )}
                <View
                  style={[
                    styles.bar,
                    { height: `${getBarHeight(i)}%` },
                    isHighDay(i) && styles.barHigh,
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={styles.labels}>
            {DAY_LABELS.map((d, i) => (
              <Text
                key={i}
                style={[styles.label, isHighDay(i) && styles.labelActive]}>
                {d}
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.subtitle}>
          {goal === 'gain'
            ? `Your calorie surplus will be slightly higher on ${dayText} to help you hit your intake goals. The remaining days will have a steady target to keep your gains on track.`
            : `Your calorie budget will be slightly higher on ${dayText}. The remaining days will have a smaller calorie target to keep you on track. Enjoy guilt-free!`}
        </Text>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton
          title="Continue"
          onPress={() => router.push('/onboarding/burned-calories')}
        />
      </View>
      </BouncyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', marginTop: 20,
  },
  chartContainer: { marginVertical: 30 },
  barChart: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    gap: 8, height: 120, borderBottomWidth: 2, borderBottomColor: Theme.colors.border,
    paddingBottom: 10,
  },
  barWrapper: { alignItems: 'center', width: 25 },
  barIcon: { marginBottom: 5, alignItems: 'center' },
  bar: {
    width: 25, backgroundColor: Theme.colors.secondary, borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barHigh: { backgroundColor: Theme.colors.primary },
  labels: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  label: {
    width: 25, textAlign: 'center', fontSize: 12, fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
  },
  labelActive: { color: Theme.colors.textDark },
  subtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'center', marginTop: 10, lineHeight: 21,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
