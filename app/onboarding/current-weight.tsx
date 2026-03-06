import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { UnitToggle } from '@/components/onboarding/UnitToggle';
import { ScrollPicker, PICKER_ITEM_HEIGHT, PICKER_CENTER } from '@/components/onboarding/ScrollPicker';
import { useOnboardingStore } from '@/store/onboarding-store';

const KG_VALUES = Array.from({ length: 201 }, (_, i) => i + 30); // 30-230
const LB_VALUES = Array.from({ length: 401 }, (_, i) => i + 66); // 66-466
const DECIMAL_VALUES = ['.0', '.1', '.2', '.3', '.4', '.5', '.6', '.7', '.8', '.9'];

export default function CurrentWeightScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const goal = useOnboardingStore((s) => s.payload.goal);
  const storedUnit = useOnboardingStore((s) => s.payload.weightUnit) || 'kg';

  const [unit, setUnit] = useState<string>(storedUnit);
  const [kgIndex, setKgIndex] = useState(24); // 54kg
  const [lbIndex, setLbIndex] = useState(53); // 119lb
  const [decimalIndex, setDecimalIndex] = useState(0); // .0

  const handleContinue = () => {
    const isKg = unit === 'kg';
    const wholeValues = isKg ? KG_VALUES : LB_VALUES;
    const wholeIndex = isKg ? kgIndex : lbIndex;
    const clampedIndex = Math.max(0, Math.min(wholeIndex, wholeValues.length - 1));
    const weight = wholeValues[clampedIndex];
    updatePayload({
      currentWeight: weight,
      weightDecimal: decimalIndex,
      weightUnit: unit as 'kg' | 'lb',
    });
    if (goal === 'maintain') {
      // For maintain, target weight = current weight, skip goal-weight/realistic-target/goal-speed
      updatePayload({ targetWeight: weight, targetWeightDecimal: decimalIndex, weeklyGoalSpeed: 0 });
      router.push('/onboarding/transition2');
    } else {
      router.push('/onboarding/goal-weight');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={2} progress={60} />
      <View style={styles.content}>
        <Text style={styles.title}>Current Weight</Text>
        <UnitToggle
          options={['lb', 'kg']}
          selected={unit}
          onSelect={(v) => setUnit(v)}
        />
        <View style={styles.pickerRow}>
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * PICKER_CENTER }]} />
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * (PICKER_CENTER + 1) }]} />
          <ScrollPicker items={unit === 'kg' ? KG_VALUES : LB_VALUES} selectedIndex={unit === 'kg' ? kgIndex : lbIndex} onSelect={unit === 'kg' ? setKgIndex : setLbIndex} width={80} hideLines />
          <ScrollPicker items={DECIMAL_VALUES} selectedIndex={decimalIndex} onSelect={setDecimalIndex} width={40} hideLines />
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
    gap: 10,
    marginTop: 20,
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
