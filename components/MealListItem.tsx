import { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import type { MealEntry } from '@/types/data';
import { formatTime } from '@/utils/date';

const MEAL_ICONS: Record<string, string> = {
  breakfast: 'M12 3v1m-6.36.64l.71.71M3 12h1m16 0h1m-2.64-7.36l-.71.71M12 18a6 6 0 1 0 0-12',
  lunch: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3',
  dinner: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3',
  snack: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
};

interface MealListItemProps {
  meal: MealEntry;
  onPress?: (meal: MealEntry) => void;
}

export const MealListItem = memo(function MealListItem({ meal, onPress }: MealListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(meal)}
      activeOpacity={0.7}
      accessibilityLabel={`${meal.name}, ${meal.calories} calories`}
      accessibilityRole="button"
    >
      {meal.imageUri ? (
        <Image source={{ uri: meal.imageUri }} style={styles.image} accessible={false} />
      ) : (
        <View style={styles.iconWrap}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d={MEAL_ICONS[meal.mealType] ?? MEAL_ICONS.snack}
              stroke={Theme.colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
        <Text style={styles.meta}>
          {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)} · {formatTime(meal.timestamp)}
        </Text>
      </View>

      <View style={styles.calsBlock}>
        <Text style={styles.cals}>{meal.calories}</Text>
        <Text style={styles.calsUnit}>kcal</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    gap: 14,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.small,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.small,
    backgroundColor: Theme.colors.primaryActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
  },
  meta: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textDark,
  },
  calsBlock: {
    alignItems: 'flex-end',
  },
  cals: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
  },
  calsUnit: {
    fontSize: 11,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textDark,
  },
});
