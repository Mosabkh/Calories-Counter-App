import { useState } from 'react';
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
import * as Crypto from 'expo-crypto';
import { Theme } from '@/constants/theme';
import { useExerciseStore } from '@/store/exercise-store';
import { toDateKey } from '@/utils/date';
import type { ExerciseEntry } from '@/types/data';

const QUICK_EXERCISES = [
  { name: 'Walking', calsPerMin: 5 },
  { name: 'Running', calsPerMin: 12 },
  { name: 'Cycling', calsPerMin: 8 },
  { name: 'Swimming', calsPerMin: 10 },
  { name: 'Strength Training', calsPerMin: 7 },
  { name: 'Yoga', calsPerMin: 4 },
] as const;

export default function LogExerciseScreen() {
  const router = useRouter();
  const addExercise = useExerciseStore((s) => s.addExercise);

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');

  const canSave = name.trim().length > 0 && parseInt(calories || '0', 10) > 0;

  function selectQuick(exercise: typeof QUICK_EXERCISES[number]) {
    setName(exercise.name);
    const mins = parseInt(duration, 10) || 30;
    setCalories(String(Math.round(exercise.calsPerMin * mins)));
  }

  function updateDuration(text: string) {
    setDuration(text);
    // Auto-estimate calories if a quick exercise is selected
    const match = QUICK_EXERCISES.find((e) => e.name === name);
    if (match) {
      const mins = parseInt(text, 10) || 0;
      if (mins > 0) setCalories(String(Math.round(match.calsPerMin * mins)));
    }
  }

  async function handleSave() {
    const entry: ExerciseEntry = {
      id: Crypto.randomUUID(),
      date: toDateKey(),
      timestamp: Date.now(),
      name: name.trim(),
      durationMin: parseInt(duration, 10) || 0,
      caloriesBurned: parseInt(calories, 10) || 0,
    };
    addExercise(entry);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={styles.backBtn}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={Theme.colors.textDark}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Exercise</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick select */}
          <Text style={styles.sectionLabel}>Quick select</Text>
          <View style={styles.quickGrid}>
            {QUICK_EXERCISES.map((ex) => (
              <TouchableOpacity
                key={ex.name}
                style={[styles.quickPill, name === ex.name && styles.quickPillActive]}
                onPress={() => selectQuick(ex)}
                accessibilityRole="radio"
                accessibilityState={{ selected: name === ex.name }}
              >
                <Text style={[styles.quickPillText, name === ex.name && styles.quickPillTextActive]}>
                  {ex.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name input */}
          <Text style={styles.sectionLabel}>Exercise name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Morning jog"
            placeholderTextColor={Theme.colors.textMuted}
          />

          {/* Duration */}
          <Text style={styles.sectionLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={updateDuration}
            placeholder="30"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="number-pad"
          />

          {/* Calories */}
          <Text style={styles.sectionLabel}>Calories burned</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="0"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="number-pad"
          />
        </ScrollView>

        {/* Save button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.7}
            accessibilityLabel="Save exercise"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
              Save Exercise
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 18,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  sectionLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
    marginBottom: 8,
    marginTop: 20,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.button,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  quickPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  quickPillText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
  },
  quickPillTextActive: { color: Theme.colors.white },

  input: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.small,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textDark,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Theme.colors.border,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
  },
  saveBtnTextDisabled: {
    color: Theme.colors.textMuted,
  },
});
