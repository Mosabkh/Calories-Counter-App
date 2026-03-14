import { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useDiaryStore } from '@/store/diary-store';
import { toDateKey, inferMealType } from '@/utils/date';
import { getFoodById, calculateMacros } from '@/utils/food-search';
import type { MealEntry } from '@/types/data';

type MealType = MealEntry['mealType'];

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export default function LogMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    foodId?: string;
    foodData?: string;
    date?: string;
    imageUri?: string;
    editMealId?: string;
  }>();

  const dateKey = params.date || toDateKey();
  const addMeal = useDiaryStore((s) => s.addMeal);
  const updateMeal = useDiaryStore((s) => s.updateMeal);
  const removeMeal = useDiaryStore((s) => s.removeMeal);

  // Editing an existing meal?
  const existingMeal = useMemo(() => {
    if (!params.editMealId || !params.date) return null;
    const meals = useDiaryStore.getState().getMealsForDate(params.date);
    return meals.find((m) => m.id === params.editMealId) ?? null;
  }, [params.editMealId, params.date]);

  const isEditing = existingMeal !== null;

  // Pre-fill from food database if foodId provided (online foods passed via foodData)
  const prefillFood = useMemo(() => {
    if (params.foodData) {
      try { return JSON.parse(params.foodData) as import('@/types/food').FoodItem; } catch { return null; }
    }
    return params.foodId ? getFoodById(params.foodId) : null;
  }, [params.foodId, params.foodData]);

  const defaultMacros = useMemo(() => {
    if (!prefillFood) return null;
    return calculateMacros(prefillFood, prefillFood.defaultServingG);
  }, [prefillFood]);

  const [name, setName] = useState(existingMeal?.name ?? prefillFood?.name ?? '');
  const [mealType, setMealType] = useState<MealType>(existingMeal?.mealType ?? inferMealType());
  const [calories, setCalories] = useState(
    existingMeal ? String(existingMeal.calories) : defaultMacros ? String(defaultMacros.calories) : '',
  );
  const [protein, setProtein] = useState(
    existingMeal ? String(existingMeal.protein) : defaultMacros ? String(defaultMacros.protein) : '',
  );
  const [carbs, setCarbs] = useState(
    existingMeal ? String(existingMeal.carbs) : defaultMacros ? String(defaultMacros.carbs) : '',
  );
  const [fat, setFat] = useState(
    existingMeal ? String(existingMeal.fat) : defaultMacros ? String(defaultMacros.fat) : '',
  );
  const [servingSize, setServingSize] = useState(
    existingMeal?.servingSize ?? (prefillFood ? `${prefillFood.defaultServingG}g (${prefillFood.defaultServingLabel})` : ''),
  );

  const canSave = name.trim().length > 0 && Number(calories) > 0;

  const isSavingRef = useRef(false);

  const handleSave = useCallback(() => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    if (isEditing && existingMeal) {
      updateMeal(existingMeal.date, existingMeal.id, {
        mealType,
        name: name.trim(),
        calories: Math.round(Number(calories) || 0),
        protein: Math.round((Number(protein) || 0) * 10) / 10,
        carbs: Math.round((Number(carbs) || 0) * 10) / 10,
        fat: Math.round((Number(fat) || 0) * 10) / 10,
        servingSize: servingSize || undefined,
      });
    } else {
      const meal: MealEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        date: dateKey,
        timestamp: Date.now(),
        mealType,
        name: name.trim(),
        calories: Math.round(Number(calories) || 0),
        protein: Math.round((Number(protein) || 0) * 10) / 10,
        carbs: Math.round((Number(carbs) || 0) * 10) / 10,
        fat: Math.round((Number(fat) || 0) * 10) / 10,
        imageUri: params.imageUri || undefined,
        servingSize: servingSize || undefined,
      };
      addMeal(meal); // addMeal auto-triggers recordActivity via diary store
    }
    router.back();
  }, [isEditing, existingMeal, updateMeal, addMeal, mealType, name, calories, protein, carbs, fat, servingSize, dateKey, params.imageUri, router]);

  const handleDelete = useCallback(() => {
    if (!existingMeal) return;
    Alert.alert(
      'Delete Meal',
      `Delete "${existingMeal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeMeal(existingMeal.date, existingMeal.id);
            router.back();
          },
        },
      ],
    );
  }, [existingMeal, removeMeal, router]);

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
          <Text style={styles.headerTitle} accessibilityRole="header">{isEditing ? 'Edit Meal' : 'Log Meal'}</Text>
          <View style={styles.backBtn} accessible={false} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image preview */}
          {params.imageUri && (
            <Image source={{ uri: params.imageUri }} style={styles.preview} accessible={false} />
          )}

          {/* Food name */}
          <Text style={styles.label}>Food name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Grilled Chicken Breast"
            placeholderTextColor={Theme.colors.textMuted}
            returnKeyType="next"
            accessibilityLabel="Food name"
          />

          {/* Meal type pills */}
          <Text style={styles.label}>Meal type</Text>
          <View style={styles.pillRow} accessibilityRole="radiogroup">
            {MEAL_TYPES.map((mt) => (
              <TouchableOpacity
                key={mt.value}
                style={[styles.pill, mealType === mt.value && styles.pillActive]}
                onPress={() => setMealType(mt.value)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected: mealType === mt.value }}
              >
                <Text
                  style={[styles.pillText, mealType === mt.value && styles.pillTextActive]}
                >
                  {mt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Serving size */}
          <Text style={styles.label}>Serving size</Text>
          <TextInput
            style={styles.input}
            value={servingSize}
            onChangeText={setServingSize}
            placeholder="e.g. 150g, 1 cup"
            placeholderTextColor={Theme.colors.textMuted}
            accessibilityLabel="Serving size"
          />

          {/* Macros */}
          <Text style={styles.label}>Nutrition</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroInput}>
              <Text style={styles.macroLabel}>Calories</Text>
              <TextInput
                style={styles.macroField}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Theme.colors.textMuted}
                accessibilityLabel="Calories"
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.macroLabel}>Protein (g)</Text>
              <TextInput
                style={styles.macroField}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Theme.colors.textMuted}
                accessibilityLabel="Protein in grams"
              />
            </View>
          </View>
          <View style={styles.macroRow}>
            <View style={styles.macroInput}>
              <Text style={styles.macroLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.macroField}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Theme.colors.textMuted}
                accessibilityLabel="Carbs in grams"
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.macroLabel}>Fat (g)</Text>
              <TextInput
                style={styles.macroField}
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Theme.colors.textMuted}
                accessibilityLabel="Fat in grams"
              />
            </View>
          </View>
        </ScrollView>

        {/* Save / Delete buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.8}
            accessibilityLabel={isEditing ? 'Update meal' : 'Save meal'}
            accessibilityRole="button"
          >
            <Text style={styles.saveBtnText}>{isEditing ? 'Update Meal' : 'Save Meal'}</Text>
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.7}
              accessibilityLabel="Delete meal"
              accessibilityRole="button"
            >
              <Text style={styles.deleteBtnText}>Delete Meal</Text>
            </TouchableOpacity>
          )}
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

  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 20 },

  preview: {
    width: '100%',
    height: 200,
    borderRadius: Theme.borderRadius.card,
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
    marginBottom: 8,
    marginTop: 16,
  },
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

  pillRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.button,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  pillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
  },
  pillTextActive: {
    color: Theme.colors.white,
  },

  macroRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  macroInput: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textDark,
    marginBottom: 6,
  },
  macroField: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.small,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
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
  deleteBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteBtnText: {
    fontSize: 15,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.urgentRed,
  },
});
