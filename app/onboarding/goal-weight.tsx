import { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { UnitToggle } from '@/components/onboarding/UnitToggle';
import { ScrollPicker, PICKER_ITEM_HEIGHT, PICKER_CENTER } from '@/components/onboarding/ScrollPicker';
import { useOnboardingStore } from '@/store/onboarding-store';

const KG_MIN = 30;
const KG_MAX = 230;
const LB_MIN = 66;
const LB_MAX = 466;
const DECIMAL_VALUES = ['.0', '.1', '.2', '.3', '.4', '.5', '.6', '.7', '.8', '.9'];

export default function GoalWeightScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const weightUnit = useOnboardingStore((s) => s.payload.weightUnit) || 'kg';
  const currentWeight = useOnboardingStore((s) => s.payload.currentWeight);
  const goal = useOnboardingStore((s) => s.payload.goal);

  const [unit, setUnit] = useState<string>(weightUnit);
  const [decimalIndex, setDecimalIndex] = useState(0);

  const kgValues = useMemo(() => {
    const max = goal === 'lose' && currentWeight ? currentWeight - 1 : KG_MAX;
    const clamped = Math.max(KG_MIN, Math.min(max, KG_MAX));
    return Array.from({ length: clamped - KG_MIN + 1 }, (_, i) => i + KG_MIN);
  }, [goal, currentWeight]);

  const lbValues = useMemo(() => {
    const max = goal === 'lose' && currentWeight
      ? Math.round(currentWeight * 2.205) - 1
      : LB_MAX;
    const clamped = Math.max(LB_MIN, Math.min(max, LB_MAX));
    return Array.from({ length: clamped - LB_MIN + 1 }, (_, i) => i + LB_MIN);
  }, [goal, currentWeight]);

  const defaultKgIdx = Math.min(20, kgValues.length - 1);
  const defaultLbIdx = Math.min(44, lbValues.length - 1);

  const [kgIndex, setKgIndex] = useState(defaultKgIdx);
  const [lbIndex, setLbIndex] = useState(defaultLbIdx);

  const handleContinue = () => {
    const isKg = unit === 'kg';
    const wholeValues = isKg ? kgValues : lbValues;
    const wholeIndex = isKg ? kgIndex : lbIndex;
    updatePayload({
      targetWeight: wholeValues[wholeIndex],
      targetWeightDecimal: decimalIndex,
    });
    router.push('/onboarding/realistic-target');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={2} progress={75} />
      <View style={styles.content}>
        <Text style={styles.title}>What is your desired weight?</Text>
        <UnitToggle
          options={['lb', 'kg']}
          selected={unit}
          onSelect={(v) => setUnit(v)}
        />
        <View style={styles.pickerRow}>
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * PICKER_CENTER }]} />
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * (PICKER_CENTER + 1) }]} />
          <ScrollPicker items={unit === 'kg' ? kgValues : lbValues} selectedIndex={unit === 'kg' ? kgIndex : lbIndex} onSelect={unit === 'kg' ? setKgIndex : setLbIndex} width={80} hideLines />
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
    backgroundColor: 'rgba(60, 60, 67, 0.2)',
    zIndex: 10,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
