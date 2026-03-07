import { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useFavoritesStore } from '@/store/favorites-store';
import { getFoodById, calculateMacros } from '@/utils/food-search';
import type { FoodItem } from '@/types/food';

export default function SavedFoodsScreen() {
  const router = useRouter();
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const cachedFoods = useFavoritesStore((s) => s.cachedFoods);
  const toggle = useFavoritesStore((s) => s.toggle);

  const foods = useMemo(
    () => favoriteIds
      .map((id) => getFoodById(id) ?? cachedFoods[id])
      .filter((f): f is FoodItem => f != null),
    [favoriteIds, cachedFoods],
  );

  const handleSelect = useCallback(
    (food: FoodItem) => {
      router.push({ pathname: '/log-meal', params: { foodId: food.id } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: FoodItem }) => {
      const macros = calculateMacros(item, item.defaultServingG);
      return (
        <View style={styles.foodRow}>
          <TouchableOpacity
            style={styles.foodInfo}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
            accessibilityLabel={`${item.name}, ${macros.calories} calories`}
            accessibilityRole="button"
          >
            <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.foodMeta}>
              {item.defaultServingLabel} · P {macros.protein}g · C {macros.carbs}g · F {macros.fat}g
            </Text>
          </TouchableOpacity>
          <View style={styles.rowRight}>
            <View style={styles.calBadge}>
              <Text style={styles.calBadgeText}>{macros.calories}</Text>
              <Text style={styles.calBadgeUnit}>kcal</Text>
            </View>
            <TouchableOpacity
              onPress={() => toggle(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Remove ${item.name} from favorites`}
              accessibilityRole="button"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill={Theme.colors.calorieAlert}>
                <Path
                  d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                  stroke={Theme.colors.calorieAlert}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [handleSelect, toggle],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
        <Text style={styles.headerTitle}>Saved Foods</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path
                  d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                  stroke={Theme.colors.textMuted}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>No saved foods yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon on any food to save it here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },

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

  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 10 },

  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Theme.colors.border,
  },
  foodInfo: { flex: 1, gap: 3 },
  foodName: {
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
  },
  foodMeta: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
  },
  rowRight: { alignItems: 'flex-end', marginLeft: 12, gap: 8 },
  calBadge: { alignItems: 'flex-end' },
  calBadgeText: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
  },
  calBadgeUnit: {
    fontSize: 11,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
  },

  empty: { paddingTop: 80, alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.primaryActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
});
