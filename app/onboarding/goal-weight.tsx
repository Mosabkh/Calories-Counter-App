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
import { BouncyView } from '@/components/onboarding/BouncyView';

const KG_MIN = 40;
const KG_MAX = 180;
const LB_MIN = 88;
const LB_MAX = 397;
const DECIMAL_VALUES = ['.0', '.1', '.2', '.3', '.4', '.5', '.6', '.7', '.8', '.9'];

export default function GoalWeightScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const weightUnit = useOnboardingStore((s) => s.payload.weightUnit) || 'kg';
  const currentWeight = useOnboardingStore((s) => s.payload.currentWeight);
  const goal = useOnboardingStore((s) => s.payload.goal);

  const [unit, setUnit] = useState<'kg' | 'lb'>(weightUnit);
  const [decimalIndex, setDecimalIndex] = useState(0);

  // Convert currentWeight to both kg and lb for picker range computation
  const cwKg = useMemo(() => {
    if (currentWeight == null) return null;
    return weightUnit === 'lb' ? Math.round(currentWeight / 2.20462) : currentWeight;
  }, [currentWeight, weightUnit]);

  const cwLb = useMemo(() => {
    if (currentWeight == null) return null;
    return weightUnit === 'kg' ? Math.round(currentWeight * 2.20462) : currentWeight;
  }, [currentWeight, weightUnit]);

  const kgValues = useMemo(() => {
    if (goal === 'lose' && cwKg != null) {
      const max = Math.max(KG_MIN, Math.min(cwKg - 1, KG_MAX));
      return Array.from({ length: max - KG_MIN + 1 }, (_, i) => i + KG_MIN);
    }
    if (goal === 'gain' && cwKg != null) {
      const min = Math.max(KG_MIN, Math.min(cwKg + 1, KG_MAX));
      return Array.from({ length: KG_MAX - min + 1 }, (_, i) => i + min);
    }
    return Array.from({ length: KG_MAX - KG_MIN + 1 }, (_, i) => i + KG_MIN);
  }, [goal, cwKg]);

  const lbValues = useMemo(() => {
    if (goal === 'lose' && cwLb != null) {
      const max = Math.max(LB_MIN, Math.min(cwLb - 1, LB_MAX));
      return Array.from({ length: max - LB_MIN + 1 }, (_, i) => i + LB_MIN);
    }
    if (goal === 'gain' && cwLb != null) {
      const min = Math.max(LB_MIN, Math.min(cwLb + 1, LB_MAX));
      return Array.from({ length: LB_MAX - min + 1 }, (_, i) => i + min);
    }
    return Array.from({ length: LB_MAX - LB_MIN + 1 }, (_, i) => i + LB_MIN);
  }, [goal, cwLb]);

  const defaultKgIdx = Math.min(20, kgValues.length - 1);
  const defaultLbIdx = Math.min(44, lbValues.length - 1);

  const [kgIndex, setKgIndex] = useState(defaultKgIdx);
  const [lbIndex, setLbIndex] = useState(defaultLbIdx);

  const handleContinue = () => {
    const isKg = unit === 'kg';
    const wholeValues = isKg ? kgValues : lbValues;
    const wholeIndex = isKg ? kgIndex : lbIndex;
    const clampedIndex = Math.max(0, Math.min(wholeIndex, wholeValues.length - 1));
    updatePayload({
      targetWeight: wholeValues[clampedIndex],
      targetWeightDecimal: decimalIndex,
    });
    router.push('/onboarding/realistic-target');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={2} progress={75} />
      <View style={styles.content}>
        <Text style={styles.title}>{goal === 'gain' ? 'What is your target weight?' : 'What is your desired weight?'}</Text>
        <UnitToggle
          options={['lb', 'kg']}
          selected={unit}
          onSelect={(v) => setUnit(v as 'kg' | 'lb')}
        />
        <View style={styles.pickerRow}>
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * PICKER_CENTER }]} />
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * (PICKER_CENTER + 1) }]} />
          <ScrollPicker items={unit === 'kg' ? kgValues : lbValues} selectedIndex={unit === 'kg' ? kgIndex : lbIndex} onSelect={unit === 'kg' ? setKgIndex : setLbIndex} width={80} hideLines accessibilityLabel="Goal weight" />
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
    textAlign: 'center',
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
