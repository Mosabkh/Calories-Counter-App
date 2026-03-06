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

const CM_VALUES = Array.from({ length: 121 }, (_, i) => i + 100); // 100-220
const FT_VALUES = Array.from({ length: 5 }, (_, i) => i + 4); // 4-8
const IN_VALUES = Array.from({ length: 12 }, (_, i) => i); // 0-11

export default function HeightScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const storedUnit = useOnboardingStore((s) => s.payload.heightUnit) || 'cm';

  const [unit, setUnit] = useState<string>(storedUnit);
  const [cmIndex, setCmIndex] = useState(64); // 164cm
  const [ftIndex, setFtIndex] = useState(1); // 5ft
  const [inIndex, setInIndex] = useState(5); // 5in

  const handleContinue = () => {
    const height = unit === 'cm'
      ? CM_VALUES[cmIndex]
      : FT_VALUES[ftIndex] * 30.48 + IN_VALUES[inIndex] * 2.54;
    updatePayload({ height: Math.round(height), heightUnit: unit as 'cm' | 'ft' });
    router.push('/onboarding/current-weight');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={2} progress={45} />
      <View style={styles.content}>
        <Text style={styles.title}>Height</Text>
        <UnitToggle
          options={['ft in', 'cm']}
          selected={unit === 'ft' ? 'ft in' : 'cm'}
          onSelect={(v) => setUnit(v === 'ft in' ? 'ft' : 'cm')}
        />
        <View style={styles.pickerRow}>
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * PICKER_CENTER }]} />
          <View style={[styles.pickerLine, { top: PICKER_ITEM_HEIGHT * (PICKER_CENTER + 1) }]} />
          {unit === 'cm' ? (
            <ScrollPicker items={CM_VALUES} selectedIndex={cmIndex} onSelect={setCmIndex} width={100} suffix="cm" hideLines />
          ) : (
            <>
              <ScrollPicker items={FT_VALUES} selectedIndex={ftIndex} onSelect={setFtIndex} width={60} suffix="ft" hideLines />
              <ScrollPicker items={IN_VALUES} selectedIndex={inIndex} onSelect={setInIndex} width={60} suffix="in" hideLines />
            </>
          )}
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
