import { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import type { MealEntry } from '@/types/data';
import { formatTime } from '@/utils/date';

const MEAL_ICONS: Record<MealEntry['mealType'], string> = {
  breakfast: 'M12 3v1m-6.36.64l.71.71M3 12h1m16 0h1m-2.64-7.36l-.71.71M12 18a6 6 0 1 0 0-12',
  lunch: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3',
  dinner: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M7 7l2 2M15 7l-2 2M7 17l2-2M15 17l-2-2',
  snack: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
};

const MEAL_TYPE_LABELS: Record<MealEntry['mealType'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

interface MealListItemProps {
  meal: MealEntry;
  onPress: (meal: MealEntry) => void;
}

export const MealListItem = memo(function MealListItem({ meal, onPress }: MealListItemProps) {
  const handlePress = useCallback(() => onPress(meal), [onPress, meal]);
  const imageSource = useMemo(
    () => (meal.imageUri ? { uri: meal.imageUri } : null),
    [meal.imageUri],
  );
  const mealTypeLabel = MEAL_TYPE_LABELS[meal.mealType];
  const formattedTime = useMemo(() => formatTime(meal.timestamp), [meal.timestamp]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={`${meal.name}, ${mealTypeLabel}, ${meal.calories} calories, ${formattedTime}`}
      accessibilityRole="button"
    >
      {imageSource ? (
        <Image source={imageSource} style={styles.image} accessible={false} />
      ) : (
        <View style={styles.iconWrap} accessible={false}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d={MEAL_ICONS[meal.mealType]}
              stroke={Theme.colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      )}

      <View style={styles.info} accessible={false}>
        <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
        <Text style={styles.meta}>
          {mealTypeLabel} · {formattedTime}
        </Text>
      </View>

      <View style={styles.calsBlock} accessible={false}>
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
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(84, 49, 40, 0.18)',
    gap: 14,
    shadowColor: Theme.colors.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
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
    backgroundColor: Theme.colors.accentBackground,
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
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textDark,
  },
});
