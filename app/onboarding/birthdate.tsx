import { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ScrollPicker, PICKER_ITEM_HEIGHT, PICKER_CENTER } from '@/components/onboarding/ScrollPicker';
import { useOnboardingStore } from '@/store/onboarding-store';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const YEARS = Array.from({ length: 80 }, (_, i) => String(2010 - i));

export default function BirthdateScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);

  const [monthIndex, setMonthIndex] = useState(2); // Mar
  const [dayIndex, setDayIndex] = useState(1); // 02
  const [yearIndex, setYearIndex] = useState(10); // 2000

  const handleContinue = () => {
    const clampedMonth = Math.max(0, Math.min(monthIndex, MONTHS.length - 1));
    const clampedDay = Math.max(0, Math.min(dayIndex, DAYS.length - 1));
    const clampedYear = Math.max(0, Math.min(yearIndex, YEARS.length - 1));
    updatePayload({
      birthMonth: MONTHS[clampedMonth],
      birthDay: DAYS[clampedDay],
      birthYear: YEARS[clampedYear],
    });
    router.push('/onboarding/transition1');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={1} progress={100} />
      <View style={styles.content}>
        <Text style={styles.title}>When were you born?</Text>
        <View style={styles.pickerRow}>
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * PICKER_CENTER }]} />
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * (PICKER_CENTER + 1) }]} />
          <ScrollPicker items={MONTHS} selectedIndex={monthIndex} onSelect={setMonthIndex} width={70} hideLines />
          <ScrollPicker items={DAYS} selectedIndex={dayIndex} onSelect={setDayIndex} width={50} hideLines />
          <ScrollPicker items={YEARS} selectedIndex={yearIndex} onSelect={setYearIndex} width={80} hideLines />
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
    textAlign: 'center',
    marginTop: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 30,
    position: 'relative',
  },
  pickerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Theme.colors.separator,
    zIndex: 10,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
