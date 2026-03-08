import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useUserStore } from '@/store/user-store';
import { recalculateTargets } from '@/utils/recalculate-targets';

const GOAL_OPTIONS = [
  { value: 'lose' as const, label: 'Lose Weight', emoji: '' },
  { value: 'maintain' as const, label: 'Maintain Weight', emoji: '' },
  { value: 'gain' as const, label: 'Gain Weight', emoji: '' },
];

const LOSE_SPEED_OPTIONS = [
  { value: 0.5, label: '0.5 kg/week', lbLabel: '1.1 lb/week', desc: 'Slow & steady' },
  { value: 1.0, label: '1.0 kg/week', lbLabel: '2.2 lb/week', desc: 'Recommended' },
  { value: 1.5, label: '1.5 kg/week', lbLabel: '3.3 lb/week', desc: 'Aggressive' },
];

const GAIN_SPEED_OPTIONS = [
  { value: 0.25, label: '0.25 kg/week', lbLabel: '0.55 lb/week', desc: 'Lean gain' },
  { value: 0.5, label: '0.5 kg/week', lbLabel: '1.1 lb/week', desc: 'Recommended' },
  { value: 0.75, label: '0.75 kg/week', lbLabel: '1.65 lb/week', desc: 'Aggressive' },
];

export default function MyGoalsScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>(profile?.goal ?? 'lose');
  const [targetWeight, setTargetWeight] = useState(String(profile?.targetWeight ?? ''));
  const [speed, setSpeed] = useState(profile?.weeklyGoalSpeed ?? 0.5);

  const unit = profile?.weightUnit ?? 'kg';
  const isMaintain = goal === 'maintain';
  const speedOptions = goal === 'gain' ? GAIN_SPEED_OPTIONS : LOSE_SPEED_OPTIONS;
  const currentWeight = profile?.startWeight ?? 70;
  const defaultStep = unit === 'lb' ? 10 : 5;

  const parsedTarget = parseFloat(targetWeight);
  const isTargetValid = isMaintain || (
    !isNaN(parsedTarget) && parsedTarget > 0 &&
    (goal === 'lose' ? parsedTarget < currentWeight : parsedTarget > currentWeight)
  );

  const handleGoalChange = useCallback((newGoal: 'lose' | 'maintain' | 'gain') => {
    setGoal(newGoal);
    const tw = parseFloat(targetWeight) || currentWeight;
    // Reset speed to the "Recommended" middle option for the new goal
    if (newGoal === 'gain') {
      setSpeed(0.5);
      // Reset target if it doesn't make sense for gaining
      if (tw <= currentWeight) {
        setTargetWeight(String(currentWeight + defaultStep));
      }
    } else if (newGoal === 'lose') {
      setSpeed(1.0);
      // Reset target if it doesn't make sense for losing
      if (tw >= currentWeight) {
        setTargetWeight(String(currentWeight - defaultStep));
      }
    }
  }, [currentWeight, targetWeight, defaultStep]);

  const handleSave = useCallback(() => {
    if (!profile) return;
    const tw = isMaintain
      ? profile.startWeight
      : parseFloat(targetWeight) || profile.targetWeight;

    const patch = recalculateTargets(profile, {
      goal,
      targetWeight: tw,
      weeklyGoalSpeed: isMaintain ? 0 : speed,
    });
    updateProfile(patch);
    router.back();
  }, [profile, goal, targetWeight, speed, isMaintain, updateProfile, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={styles.backBtn}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Goals</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isTargetValid}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Save"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isTargetValid }}
            style={styles.backBtn}
          >
            <Text style={[styles.saveText, !isTargetValid && styles.saveTextDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Goal type */}
          <Text style={styles.label}>Goal</Text>
          <View style={styles.goalList}>
            {GOAL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.goalRow, goal === opt.value && styles.goalRowActive]}
                onPress={() => handleGoalChange(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: goal === opt.value }}
              >
                <View style={[styles.radio, goal === opt.value && styles.radioActive]} />
                <Text style={[styles.goalText, goal === opt.value && styles.goalTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Target weight (hidden for maintain) */}
          {!isMaintain && (
            <>
              <Text style={styles.label}>Target Weight ({unit})</Text>
              <TextInput
                style={[styles.input, !isTargetValid && targetWeight.length > 0 && styles.inputError]}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="decimal-pad"
                placeholder={String(profile?.targetWeight ?? '')}
                placeholderTextColor={Theme.colors.textMuted}
              />
              {!isTargetValid && targetWeight.length > 0 && (
                <Text style={styles.errorHint}>
                  {goal === 'lose'
                    ? `Must be less than your current weight (${currentWeight} ${unit})`
                    : `Must be more than your current weight (${currentWeight} ${unit})`}
                </Text>
              )}
            </>
          )}

          {/* Weekly speed (hidden for maintain) */}
          {!isMaintain && (
            <>
              <Text style={styles.label}>Weekly Goal Speed</Text>
              <View style={styles.speedList}>
                {speedOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.speedRow, speed === opt.value && styles.speedRowActive]}
                    onPress={() => setSpeed(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: speed === opt.value }}
                  >
                    <View style={styles.speedLeft}>
                      <View style={[styles.radio, speed === opt.value && styles.radioActive]} />
                      <Text style={[styles.speedLabel, speed === opt.value && styles.speedLabelActive]}>
                        {unit === 'lb' ? opt.lbLabel : opt.label}
                      </Text>
                    </View>
                    <Text style={styles.speedDesc}>{opt.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Summary */}
          {profile && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Updated Targets Preview</Text>
              <Text style={styles.summaryLine}>
                Daily calories: {(() => {
                  const tw = isMaintain ? profile.startWeight : parseFloat(targetWeight) || profile.targetWeight;
                  const patch = recalculateTargets(profile, { goal, targetWeight: tw, weeklyGoalSpeed: isMaintain ? 0 : speed });
                  return patch.dailyCalorieTarget;
                })()} kcal
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  saveText: { fontSize: 15, fontFamily: Theme.fonts.extraBold, color: Theme.colors.primary },
  saveTextDisabled: { opacity: 0.35 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  label: {
    fontSize: 13, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textMuted,
    marginBottom: 8, marginTop: 24,
  },
  input: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.small,
    borderWidth: 2, borderColor: Theme.colors.border, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textDark,
  },
  inputError: { borderColor: Theme.colors.urgentRed },
  errorHint: {
    fontSize: 12, fontFamily: Theme.fonts.semiBold, color: Theme.colors.urgentRed,
    marginTop: 6,
  },

  goalList: { gap: 8 },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.small,
    borderWidth: 2, borderColor: Theme.colors.border, paddingHorizontal: 16,
    paddingVertical: 14,
  },
  goalRowActive: { borderColor: Theme.colors.primary },
  goalText: { fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
  goalTextActive: { color: Theme.colors.primary },

  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Theme.colors.border,
  },
  radioActive: { borderColor: Theme.colors.primary, backgroundColor: Theme.colors.primary },

  speedList: { gap: 8 },
  speedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.small,
    borderWidth: 2, borderColor: Theme.colors.border, paddingHorizontal: 16,
    paddingVertical: 14,
  },
  speedRowActive: { borderColor: Theme.colors.primary },
  speedLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speedLabel: { fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
  speedLabelActive: { color: Theme.colors.primary },
  speedDesc: { fontSize: 12, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted },

  summaryCard: {
    backgroundColor: Theme.colors.primaryActive, borderRadius: Theme.borderRadius.card,
    padding: 16, marginTop: 28,
  },
  summaryTitle: {
    fontSize: 13, fontFamily: Theme.fonts.extraBold, color: Theme.colors.primary,
    marginBottom: 6,
  },
  summaryLine: {
    fontSize: 14, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark,
  },
});
