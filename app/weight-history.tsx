import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useWeightStore } from '@/store/weight-store';
import type { WeightEntry } from '@/types/data';

const CURRENT_YEAR = new Date().getFullYear();

function formatDate(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const day = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(day) || m < 1 || m > 12) return dateKey;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const base = `${months[m - 1]} ${day}`;
  return y !== CURRENT_YEAR ? `${base} '${String(y).slice(2)}` : base;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

export default function WeightHistoryScreen() {
  const router = useRouter();
  const entries = useWeightStore((s) => s.entries);
  const removeEntry = useWeightStore((s) => s.removeEntry);

  const handleEdit = useCallback(
    (entry: WeightEntry) => {
      router.push({ pathname: '/log-weight', params: { editEntryId: entry.id } });
    },
    [router],
  );

  const handleDelete = useCallback(
    (entry: WeightEntry) => {
      Alert.alert(
        'Delete Entry',
        `Delete ${entry.weight.toFixed(1)} ${entry.unit} from ${formatDate(entry.date)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeEntry(entry.id),
          },
        ],
      );
    },
    [removeEntry],
  );

  const renderItem = useCallback(
    ({ item }: { item: WeightEntry }) => {
      const dateStr = formatDate(item.date);
      return (
        <View
          style={styles.row}
          accessibilityLabel={`${item.weight.toFixed(1)} ${item.unit} on ${dateStr}`}
        >
          <View style={styles.rowInfo} accessible={false}>
            <Text style={styles.rowWeight}>
              {item.weight.toFixed(1)}{' '}
              <Text style={styles.rowUnit}>{item.unit}</Text>
            </Text>
            <Text style={styles.rowDate}>{dateStr}</Text>
          </View>
          <View style={styles.rowActions}>
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              hitSlop={HIT_SLOP}
              activeOpacity={0.7}
              accessibilityLabel={`Edit ${item.weight.toFixed(1)} ${item.unit} entry from ${dateStr}`}
              accessibilityRole="button"
              style={styles.actionBtn}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path
                  d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                  stroke={Theme.colors.textDark}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              hitSlop={HIT_SLOP}
              activeOpacity={0.7}
              accessibilityLabel={`Delete ${item.weight.toFixed(1)} ${item.unit} entry from ${dateStr}`}
              accessibilityRole="button"
              style={styles.actionBtn}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path
                  d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14"
                  stroke={Theme.colors.urgentRed}
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
    [handleEdit, handleDelete],
  );

  const keyExtractor = useCallback((item: WeightEntry) => item.id, []);

  const ITEM_HEIGHT = 62; // paddingVertical 14*2 + content ~26 + marginBottom 8
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }),
    [],
  );

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
        <Text style={styles.headerTitle} accessibilityRole="header">Weight History</Text>
        <View style={styles.backBtn} accessible={false} />
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon} accessible={false}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path
                d="M12 20V10M18 20V4M6 20v-4"
                stroke={Theme.colors.textMuted}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={styles.emptyTitle}>No Weigh-ins Yet</Text>
          <Text style={styles.emptySubtitle}>
            Log your first weight to start tracking your progress.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/log-weight')}
            activeOpacity={0.8}
            accessibilityLabel="Log weight"
            accessibilityRole="button"
          >
            <Text style={styles.emptyBtnText}>Log Weight</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={15}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },

  list: { paddingHorizontal: 20, paddingBottom: 40 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.small,
    borderWidth: 2, borderColor: Theme.colors.border,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8,
  },
  rowInfo: {
    flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 12,
  },
  rowWeight: {
    fontSize: 17, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  rowUnit: {
    fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
  },
  rowDate: {
    fontSize: 13, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark,
  },
  rowActions: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  actionBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Theme.colors.primaryActive,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 8, textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    textAlign: 'center', lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 20, backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.button,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  emptyBtnText: {
    fontSize: 14, fontFamily: Theme.fonts.extraBold, color: Theme.colors.white,
  },
});
