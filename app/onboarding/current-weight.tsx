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
import { BouncyView } from '@/components/onboarding/BouncyView';

const KG_VALUES = Array.from({ length: 141 }, (_, i) => i + 40); // 40-180 kg
const LB_VALUES = Array.from({ length: 310 }, (_, i) => i + 88); // 88-397 lb
const DECIMAL_VALUES = ['.0', '.1', '.2', '.3', '.4', '.5', '.6', '.7', '.8', '.9'];

export default function CurrentWeightScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const goal = useOnboardingStore((s) => s.payload.goal);
  const storedUnit = useOnboardingStore((s) => s.payload.weightUnit) || 'kg';

  const [unit, setUnit] = useState<'kg' | 'lb'>(storedUnit);
  const [kgIndex, setKgIndex] = useState(30); // 70kg
  const [lbIndex, setLbIndex] = useState(66); // 154lb
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
      weightUnit: unit,
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
      <BouncyView>
      <ProgressHeader step={2} progress={60} />
      <View style={styles.content}>
        <Text style={styles.title}>Current Weight</Text>
        <UnitToggle
          options={['lb', 'kg']}
          selected={unit}
          onSelect={(v) => setUnit(v as 'kg' | 'lb')}
        />
        <View style={styles.pickerRow}>
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * PICKER_CENTER }]} />
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * (PICKER_CENTER + 1) }]} />
          <ScrollPicker items={unit === 'kg' ? KG_VALUES : LB_VALUES} selectedIndex={unit === 'kg' ? kgIndex : lbIndex} onSelect={unit === 'kg' ? setKgIndex : setLbIndex} width={80} hideLines accessibilityLabel="Weight" />
          <ScrollPicker items={DECIMAL_VALUES} selectedIndex={decimalIndex} onSelect={setDecimalIndex} width={40} hideLines accessibilityLabel="Weight decimal" />
        </View>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} />
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
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
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
