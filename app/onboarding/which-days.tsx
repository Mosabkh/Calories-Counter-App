import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ListButton } from '@/components/onboarding/ListButton';
import { useOnboardingStore } from '@/store/onboarding-store';

const PRESET_OPTIONS = [
  { label: 'Saturdays and Sundays', days: ['Saturday', 'Sunday'] },
  { label: 'Fridays, Saturdays and Sundays', days: ['Friday', 'Saturday', 'Sunday'] },
  { label: 'Friday & Sunday', days: ['Friday', 'Sunday'] },
];

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WhichDaysScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customDays, setCustomDays] = useState<string[]>([]);

  const getSelectedDays = (): string[] => {
    if (showCustom) return customDays;
    if (selectedPreset !== null) return PRESET_OPTIONS[selectedPreset].days;
    return [];
  };

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    setShowCustom(false);
    setCustomDays([]);
  };

  const handleOthersSelect = () => {
    setSelectedPreset(null);
    setShowCustom(true);
  };

  const toggleDay = useCallback((day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const handleContinue = () => {
    const days = getSelectedDays();
    if (days.length === 0) return;
    updatePayload({ weekendDays: days });
    router.push('/onboarding/diet-adjustment');
  };

  const canContinue = showCustom ? customDays.length > 0 : selectedPreset !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={45} />
      <View style={styles.content}>
        <Text style={styles.title}>What days do you usually eat more?</Text>
        {PRESET_OPTIONS.map((opt, i) => (
          <ListButton
            key={opt.label}
            label={opt.label}
            active={selectedPreset === i && !showCustom}
            onPress={() => handlePresetSelect(i)}
          />
        ))}
        <ListButton
          label="Pick other days"
          active={showCustom}
          onPress={handleOthersSelect}
        />
        {showCustom && (
          <View style={styles.daysGrid}>
            {ALL_DAYS.map((day, i) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, customDays.includes(day) && styles.dayChipActive]}
                onPress={() => toggleDay(day)}
                activeOpacity={0.7}
                accessibilityLabel={day}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: customDays.includes(day) }}
              >
                <Text style={[styles.dayChipText, customDays.includes(day) && styles.dayChipTextActive]}>
                  {DAY_SHORT[i]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', marginBottom: 20, lineHeight: 32,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    justifyContent: 'center',
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  dayChipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryActive,
  },
  dayChipText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
  },
  dayChipTextActive: {
    color: Theme.colors.textDark,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
