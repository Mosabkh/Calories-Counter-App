import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { searchFoods, searchOnline, getCategories, getFoodsByCategory, calculateMacros } from '@/utils/food-search';
import { useFavoritesStore } from '@/store/favorites-store';
import type { FoodItem } from '@/types/food';

type ListItem = FoodItem | { type: 'section-header'; title: string } | { type: 'loading' };

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [onlineResults, setOnlineResults] = useState<FoodItem[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const categories = useMemo(() => getCategories(), []);

  const localResults = useMemo(() => {
    if (query.trim()) return searchFoods(query, 30);
    if (selectedCategory) return getFoodsByCategory(selectedCategory);
    return [];
  }, [query, selectedCategory]);

  // Debounced online search with stale-result prevention
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setOnlineResults([]);
      setOnlineLoading(false);
      return;
    }
    setOnlineLoading(true);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const results = await searchOnline(q);
      if (!controller.signal.aborted) {
        setOnlineResults(results);
        setOnlineLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  // Merge local + online into a single list with section headers
  const listData = useMemo((): ListItem[] => {
    if (!query.trim()) return localResults;

    const items: ListItem[] = [];

    if (localResults.length > 0) {
      items.push({ type: 'section-header', title: 'Local Results' });
      items.push(...localResults);
    }

    if (onlineLoading) {
      items.push({ type: 'section-header', title: 'Online Results' });
      items.push({ type: 'loading' });
    } else if (onlineResults.length > 0) {
      items.push({ type: 'section-header', title: 'Online Results' });
      items.push(...onlineResults);
    }

    return items;
  }, [query, localResults, onlineResults, onlineLoading]);

  const handleSelectFood = useCallback(
    (food: FoodItem) => {
      router.push({
        pathname: '/log-meal',
        params: {
          foodId: food.id,
          date: params.date,
          foodData: food.id.startsWith('off_') ? JSON.stringify(food) : undefined,
        },
      });
    },
    [router, params.date],
  );

  const getItemKey = useCallback((item: ListItem, index: number) => {
    if ('type' in item) return `${item.type}-${index}`;
    return item.id;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if ('type' in item) {
        if (item.type === 'section-header') {
          return (
            <Text style={styles.sectionHeader}>{item.title}</Text>
          );
        }
        if (item.type === 'loading') {
          return (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Searching online...</Text>
            </View>
          );
        }
        return null;
      }

      const macros = calculateMacros(item, item.defaultServingG);
      const isFav = favoriteIds.includes(item.id);
      return (
        <TouchableOpacity
          style={styles.foodRow}
          onPress={() => handleSelectFood(item)}
          activeOpacity={0.7}
          accessibilityLabel={`${item.name}, ${macros.calories} calories per ${item.defaultServingLabel}`}
          accessibilityRole="button"
        >
          <View style={styles.foodInfo}>
            <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.foodMeta}>
              {item.defaultServingLabel} · P {macros.protein}g · C {macros.carbs}g · F {macros.fat}g
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id, item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isFav ? `Remove ${item.name} from favorites` : `Save ${item.name} to favorites`}
            accessibilityRole="button"
            style={styles.favBtn}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill={isFav ? Theme.colors.calorieAlert : 'none'}>
              <Path
                d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                stroke={isFav ? Theme.colors.calorieAlert : Theme.colors.textMuted}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <View style={styles.calBadge}>
            <Text style={styles.calBadgeText}>{macros.calories}</Text>
            <Text style={styles.calBadgeUnit}>kcal</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelectFood, favoriteIds, toggleFavorite],
  );

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
          <Text style={styles.headerTitle} accessibilityRole="header">Food Database</Text>
          <View style={styles.backBtn} accessible={false} />
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIcon} accessible={false}>
            <Path
              d="M21 21L16.65 16.65M11 19A8 8 0 1 0 11 3A8 8 0 0 0 11 19Z"
              stroke={Theme.colors.textMuted}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (text.trim()) setSelectedCategory(null);
            }}
            placeholder="Search foods..."
            placeholderTextColor={Theme.colors.textMuted}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6l12 12" stroke={Theme.colors.textMuted} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* Category pills (show when no query) */}
        {!query.trim() && (
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
            style={styles.catList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.catPill, selectedCategory === item && styles.catPillActive]}
                onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedCategory === item }}
              >
                <Text style={[styles.catPillText, selectedCategory === item && styles.catPillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Results */}
        <FlatList
          data={listData}
          keyExtractor={getItemKey}
          renderItem={renderItem}
          style={styles.resultsList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            query.trim() || selectedCategory ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No foods found</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Search or pick a category</Text>
              </View>
            )
          }
        />

        {/* Manual entry shortcut */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => router.push({ pathname: '/log-meal', params: { date: params.date } })}
            activeOpacity={0.7}
            accessibilityLabel="Log manually"
            accessibilityRole="button"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M12 5v14M5 12h14" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
            <Text style={styles.manualBtnText}>Log manually</Text>
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

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.small,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchIcon: { marginTop: 1 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textDark,
  },

  catList: { maxHeight: 48, marginTop: 12 },
  catRow: { paddingHorizontal: 20, gap: 8 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.button,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  catPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  catPillText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
  },
  catPillTextActive: { color: Theme.colors.white },

  resultsList: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 10 },

  sectionHeader: {
    fontSize: 13,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
    marginLeft: 4,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textMuted,
  },

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
  favBtn: { marginLeft: 10, padding: 4 },
  calBadge: { alignItems: 'flex-end', marginLeft: 8 },
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

  empty: { paddingTop: 40, alignItems: 'center' },
  emptyText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textMuted,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.button,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    paddingVertical: 14,
  },
  manualBtnText: {
    fontSize: 15,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.primary,
  },
});
