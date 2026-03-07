import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { ScrollPicker, PICKER_ITEM_HEIGHT, PICKER_VISIBLE_ITEMS, PICKER_CENTER } from '@/components/onboarding/ScrollPicker';
import { useWeightStore } from '@/store/weight-store';
import { useUserStore } from '@/store/user-store';
import { toDateKey } from '@/utils/date';
import type { WeightEntry } from '@/types/data';

export default function LogWeightScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const addEntry = useWeightStore((s) => s.addEntry);
  const latestWeight = useWeightStore((s) => s.getLatest());

  const unit = profile?.weightUnit ?? 'kg';
  const currentWeight = latestWeight?.weight ?? profile?.startWeight ?? 70;

  // Build picker data: whole part + decimal part
  const isLb = unit === 'lb';
  const minWhole = isLb ? 66 : 30;
  const maxWhole = isLb ? 660 : 300;

  const wholeItems = useMemo(() => {
    const items: string[] = [];
    for (let i = minWhole; i <= maxWhole; i++) items.push(String(i));
    return items;
  }, [minWhole, maxWhole]);

  const decimalItems = useMemo(() => {
    const items: string[] = [];
    for (let i = 0; i <= 9; i++) items.push(String(i));
    return items;
  }, []);

  const initialWhole = Math.floor(currentWeight);
  const initialDecimal = Math.round((currentWeight - initialWhole) * 10);

  const [wholePart, setWholePart] = useState(
    Math.max(0, Math.min(wholeItems.length - 1, initialWhole - minWhole)),
  );
  const [decimalPart, setDecimalPart] = useState(initialDecimal);

  const selectedWeight = (minWhole + wholePart) + decimalPart / 10;

  const handleSave = () => {
    const dateKey = toDateKey();
    const entry: WeightEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: dateKey,
      timestamp: Date.now(),
      weight: selectedWeight,
      unit,
    };
    addEntry(entry);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
        <Text style={styles.headerTitle}>Log Weight</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <Text style={styles.valueDisplay}>
          {selectedWeight.toFixed(1)} <Text style={styles.unitText}>{unit}</Text>
        </Text>

        <View style={styles.pickerRow}>
          <View style={styles.pickerWrap}>
            <ScrollPicker
              items={wholeItems}
              selectedIndex={wholePart}
              onSelect={setWholePart}
              hideLines
            />
          </View>
          <Text style={styles.dot}>.</Text>
          <View style={styles.pickerWrapSmall}>
            <ScrollPicker
              items={decimalItems}
              selectedIndex={decimalPart}
              onSelect={setDecimalPart}
              hideLines
            />
          </View>
          <Text style={styles.unitLabel}>{unit}</Text>
        </View>

        {/* Shared separator lines */}
        <View style={styles.separatorContainer} pointerEvents="none">
          <View style={[styles.separatorLine, { top: PICKER_ITEM_HEIGHT * PICKER_CENTER }]} />
          <View style={[styles.separatorLine, { top: PICKER_ITEM_HEIGHT * (PICKER_CENTER + 1) }]} />
        </View>
      </View>

      {/* Save button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
          accessibilityLabel={`Save weight ${selectedWeight.toFixed(1)} ${unit}`}
          accessibilityRole="button"
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  valueDisplay: {
    fontSize: 42,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    marginBottom: 30,
  },
  unitText: {
    fontSize: 20,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PICKER_ITEM_HEIGHT * PICKER_VISIBLE_ITEMS,
    gap: 4,
  },
  pickerWrap: { width: 80 },
  pickerWrapSmall: { width: 50 },
  dot: {
    fontSize: 28,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
  },
  unitLabel: {
    fontSize: 18,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
    marginLeft: 8,
  },
  separatorContainer: {
    position: 'absolute',
    left: 40,
    right: 40,
    height: PICKER_ITEM_HEIGHT * PICKER_VISIBLE_ITEMS,
    top: '50%',
    marginTop: -(PICKER_ITEM_HEIGHT * PICKER_VISIBLE_ITEMS) / 2 + 50,
  },
  separatorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Theme.colors.separator,
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
  saveBtnText: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
  },
});
