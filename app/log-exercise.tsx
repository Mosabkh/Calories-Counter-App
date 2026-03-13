import { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/theme';
import { useExerciseStore } from '@/store/exercise-store';
import { toDateKey } from '@/utils/date';
import type { ExerciseEntry } from '@/types/data';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const QUICK_EXERCISES = [
  { name: 'Walking', calsPerMin: 5 },
  { name: 'Running', calsPerMin: 12 },
  { name: 'Cycling', calsPerMin: 8 },
  { name: 'Swimming', calsPerMin: 10 },
  { name: 'Strength Training', calsPerMin: 7 },
  { name: 'Yoga', calsPerMin: 4 },
] as const;

const MAX_CALORIES = 9999;

function formatDisplayDate(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return 'Today';
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateKey;
  const [y, m, d] = parts;
  if (m < 1 || m > 12) return dateKey;
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export default function LogExerciseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editEntryId?: string; date?: string }>();
  const addExercise = useExerciseStore((s) => s.addExercise);
  const updateExercise = useExerciseStore((s) => s.updateExercise);
  const allEntries = useExerciseStore((s) => s.entries);

  const todayKey = useMemo(() => toDateKey(), []);

  // Edit mode
  const existingEntry = useMemo((): ExerciseEntry | null => {
    if (!params.editEntryId) return null;
    const dateKey = params.date || todayKey;
    const dayEntries = allEntries[dateKey] || [];
    return dayEntries.find((e) => e.id === params.editEntryId) ?? null;
  }, [params.editEntryId, params.date, allEntries, todayKey]);

  const isEditing = existingEntry !== null;

  // Date picker state
  const [selectedDate, setSelectedDate] = useState(existingEntry?.date ?? params.date ?? todayKey);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const formattedDate = useMemo(() => formatDisplayDate(selectedDate, todayKey), [selectedDate, todayKey]);

  const [name, setName] = useState(existingEntry?.name ?? '');
  const [duration, setDuration] = useState(existingEntry ? String(existingEntry.durationMin) : '');
  const [calories, setCalories] = useState(existingEntry ? String(existingEntry.caloriesBurned) : '');

  const canSave = name.trim().length > 0 && parseInt(calories || '0', 10) > 0;
  const hasChanges = name.trim().length > 0 || duration.length > 0 || calories.length > 0;

  const isSavingRef = useRef(false);

  const selectQuick = useCallback((exercise: typeof QUICK_EXERCISES[number]) => {
    setName(exercise.name);
    const mins = parseInt(duration, 10) || 30;
    setDuration(String(mins));
    const estimated = Math.min(MAX_CALORIES, Math.round(exercise.calsPerMin * mins));
    setCalories(String(estimated));
  }, [duration]);

  const updateDuration = useCallback((text: string) => {
    setDuration(text);
    const match = QUICK_EXERCISES.find((e) => e.name === name);
    if (match) {
      const mins = parseInt(text, 10) || 0;
      if (mins > 0) {
        const estimated = Math.min(MAX_CALORIES, Math.round(match.calsPerMin * mins));
        setCalories(String(estimated));
      }
    }
  }, [name]);

  const updateCalories = useCallback((text: string) => {
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > MAX_CALORIES) {
      setCalories(String(MAX_CALORIES));
    } else {
      setCalories(text);
    }
  }, []);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, date: Date | undefined) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(toDateKey(date));
  }, []);

  const handleBack = useCallback(() => {
    if (!isEditing && hasChanges) {
      Alert.alert('Discard Changes?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [isEditing, hasChanges, router]);

  const handleSave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    if (isEditing && existingEntry) {
      updateExercise(existingEntry.date, existingEntry.id, {
        name: name.trim(),
        durationMin: parseInt(duration, 10) || 0,
        caloriesBurned: Math.min(MAX_CALORIES, parseInt(calories, 10) || 0),
        timestamp: Date.now(),
      });
    } else {
      const entry: ExerciseEntry = {
        id: Crypto.randomUUID(),
        date: selectedDate,
        timestamp: Date.now(),
        name: name.trim(),
        durationMin: parseInt(duration, 10) || 0,
        caloriesBurned: Math.min(MAX_CALORIES, parseInt(calories, 10) || 0),
      };
      addExercise(entry);
    }

    if (Platform.OS !== 'web') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    }
    router.back();
  }, [isEditing, existingEntry, updateExercise, addExercise, name, duration, calories, selectedDate, router]);

  const dateObj = useMemo(() => {
    const parts = selectedDate.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={Theme.colors.textDark}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {isEditing ? 'Edit Exercise' : 'Log Exercise'}
          </Text>
          <View style={styles.backBtn} accessible={false} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Date picker row (hidden in edit mode) */}
          {!isEditing && (
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.datePill}
                onPress={() => setShowDatePicker(!showDatePicker)}
                activeOpacity={0.7}
                accessibilityLabel={`Date: ${formattedDate}. Tap to change`}
                accessibilityRole="button"
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
                  <Path
                    d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                    stroke={Theme.colors.textDark}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.dateText}>{formattedDate}</Text>
              </TouchableOpacity>
            </View>
          )}

          {showDatePicker && !isEditing && (
            Platform.OS === 'ios' ? (
              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  value={dateObj}
                  mode="date"
                  display="inline"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                  accentColor={Theme.colors.primary}
                />
                <TouchableOpacity
                  style={styles.dateDoneBtn}
                  onPress={() => setShowDatePicker(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )
          )}

          {/* Common exercises */}
          <Text style={styles.sectionLabel}>Common exercises</Text>
          <View style={styles.quickGrid} accessibilityRole="radiogroup">
            {QUICK_EXERCISES.map((ex) => (
              <TouchableOpacity
                key={ex.name}
                style={[styles.quickPill, name === ex.name && styles.quickPillActive]}
                onPress={() => selectQuick(ex)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected: name === ex.name }}
              >
                <Text
                  style={[styles.quickPillText, name === ex.name && styles.quickPillTextActive]}
                  accessible={false}
                >
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
            accessibilityLabel="Exercise name"
          />

          {/* Duration */}
          <Text style={styles.sectionLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={updateDuration}
            placeholder="e.g. 30"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="number-pad"
            accessibilityLabel="Duration in minutes"
          />

          {/* Calories */}
          <Text style={styles.sectionLabel}>Calories burned (kcal)</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={updateCalories}
            placeholder="e.g. 150"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="number-pad"
            accessibilityLabel="Calories burned"
          />
        </ScrollView>

        {/* Save button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.8}
            accessibilityLabel={isEditing ? 'Update exercise' : 'Save exercise'}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            <Text style={styles.saveBtnText}>
              {isEditing ? 'Update Exercise' : 'Save Exercise'}
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  dateRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.button,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  dateText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
  },
  datePickerWrap: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  dateDoneBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  dateDoneText: {
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
  },

  sectionLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
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
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.button,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    minHeight: 44,
    justifyContent: 'center',
  },
  quickPillActive: {
    backgroundColor: Theme.colors.primaryHover,
    borderColor: Theme.colors.primaryHover,
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
    paddingTop: 12,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primaryHover,
    borderRadius: Theme.borderRadius.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
  },
});
