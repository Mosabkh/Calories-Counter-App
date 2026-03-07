import { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/theme';
import { useRemindersStore, type ReminderConfig } from '@/store/reminders-store';
import { requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import * as Notifications from 'expo-notifications';

type ReminderKey = 'breakfast' | 'lunch' | 'dinner' | 'weighIn';

const REMINDER_KEYS: readonly ReminderKey[] = ['breakfast', 'lunch', 'dinner', 'weighIn'];
const REMINDER_LABELS: Record<ReminderKey, string> = {
  breakfast: 'Breakfast Reminder',
  lunch: 'Lunch Reminder',
  dinner: 'Dinner Reminder',
  weighIn: 'Weigh-in Reminder',
};

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_VALUES = Array.from({ length: 12 }, (_, i) => i * 5);
const MINUTE_LABELS = MINUTE_VALUES.map((m) => String(m).padStart(2, '0'));
const AMPM_LABELS = ['AM', 'PM'];

const ITEM_H = 44;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);

function formatTime(hour: number, minute: number): string {
  const h12 = hour % 12 || 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function to12h(hour24: number) {
  const ampmIndex = hour24 >= 12 ? 1 : 0;
  const h12 = hour24 % 12 || 12;
  return { h12Index: h12 - 1, ampmIndex };
}

function to24h(h12Index: number, ampmIndex: number): number {
  const h12 = h12Index + 1;
  if (ampmIndex === 0) return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

function minuteToIndex(minute: number): number {
  return Math.round(minute / 5) % 12;
}

// ── Lightweight scroll wheel (uses ScrollView, not FlatList) ────────

interface TimeWheelProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width?: number;
  accessibilityLabel?: string;
}

const TimeWheel = memo(function TimeWheel({
  items,
  selectedIndex,
  onSelect,
  width = 52,
  accessibilityLabel,
}: TimeWheelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolled = useRef(false);
  const lastHapticIndex = useRef(selectedIndex);

  useEffect(() => {
    if (!hasScrolled.current && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
      }, 80);
      hasScrolled.current = true;
    }
  }, [selectedIndex]);

  const getIndex = useCallback(
    (offsetY: number) => Math.max(0, Math.min(Math.round(offsetY / ITEM_H), items.length - 1)),
    [items.length],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = getIndex(e.nativeEvent.contentOffset.y);
      if (lastHapticIndex.current !== idx) {
        lastHapticIndex.current = idx;
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onSelect(idx);
      }
    },
    [getIndex, onSelect],
  );

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = getIndex(e.nativeEvent.contentOffset.y);
      if (idx !== selectedIndex) onSelect(idx);
    },
    [getIndex, selectedIndex, onSelect],
  );

  const listHeight = ITEM_H * VISIBLE;

  return (
    <View
      style={{ width, height: listHeight }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={
        accessibilityLabel
          ? `${accessibilityLabel}: ${items[selectedIndex] ?? ''}`
          : `${items[selectedIndex] ?? ''}`
      }
      accessibilityHint="Swipe up or down to change value"
    >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="normal"
        bounces
        overScrollMode="always"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * CENTER }}
        nestedScrollEnabled
      >
        {items.map((item, index) => {
          const distance = Math.abs(index - selectedIndex);
          const isSelected = distance === 0;
          const opacity = isSelected ? 1 : distance === 1 ? 0.4 : 0.15;

          return (
            <View key={`${item}-${index}`} style={[wheelStyles.item, { width }]}>
              <Text
                style={[
                  wheelStyles.itemText,
                  isSelected && wheelStyles.activeText,
                  { opacity },
                ]}
                numberOfLines={1}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

const wheelStyles = StyleSheet.create({
  item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 22, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark },
  activeText: { fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
});

// ── Notification helpers ─────────────────────────────────────────────

async function ensurePermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleReminder(key: string, config: ReminderConfig): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(key).catch(() => {});

    if (!config.enabled) return;

    const granted = await ensurePermission();
    if (!granted) {
      Alert.alert('Notifications Disabled', 'Please enable notifications in your device settings.');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: key,
      content: {
        title: 'Calobite',
        body: key === 'weighIn'
          ? 'Time for your weekly weigh-in!'
          : `Time to log ${key}!`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: config.hour,
        minute: config.minute,
      },
    });
  } catch {
    // Notifications not fully supported in Expo Go — silently ignore
  }
}

// ── Main screen ──────────────────────────────────────────────────────

export default function RemindersScreen() {
  const router = useRouter();
  const store = useRemindersStore();
  const updateReminder = useRemindersStore((s) => s.updateReminder);
  const [expandedKey, setExpandedKey] = useState<ReminderKey | null>(null);

  const handleToggle = useCallback(
    async (key: ReminderKey, enabled: boolean) => {
      updateReminder(key, { enabled });
      const config = { ...store[key], enabled };
      await scheduleReminder(key, config);
    },
    [store, updateReminder],
  );

  const handleTimeChange = useCallback(
    async (key: ReminderKey, hour: number, minute: number) => {
      updateReminder(key, { hour, minute });
      if (store[key].enabled) {
        await scheduleReminder(key, { enabled: true, hour, minute });
      }
    },
    [store, updateReminder],
  );

  const toggleExpanded = useCallback((key: ReminderKey) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Hidden dummy Switch — absorbs the iOS first-Switch trackColor bug */}
      <Switch style={styles.hiddenSwitch} accessible={false} />
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
        <Text style={styles.headerTitle}>Reminders</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {REMINDER_KEYS.map((key) => {
          const config = store[key];
          const isExpanded = expandedKey === key;
          const { h12Index, ampmIndex } = to12h(config.hour);
          const minIndex = minuteToIndex(config.minute);

          return (
            <View key={key} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardLabel}>{REMINDER_LABELS[key]}</Text>
                <Switch
                  key={`switch-${key}`}
                  value={config.enabled}
                  onValueChange={(v) => handleToggle(key, v)}
                  trackColor={{ false: Theme.colors.surfaceAlt, true: Theme.colors.primary }}
                  thumbColor={Theme.colors.white}
                  ios_backgroundColor={Theme.colors.surfaceAlt}
                  accessibilityLabel={`${REMINDER_LABELS[key]} toggle`}
                  accessibilityRole="switch"
                />
              </View>

              <TouchableOpacity
                onPress={() => toggleExpanded(key)}
                style={styles.timeDisplay}
                accessibilityLabel={`${formatTime(config.hour, config.minute)}, tap to change`}
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <Text style={[styles.timeText, !config.enabled && styles.timeTextDisabled]}>
                  {formatTime(config.hour, config.minute)}
                </Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" accessible={false}>
                  <Path
                    d={isExpanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
                    stroke={Theme.colors.textMuted}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.pickerArea}>
                  <View style={styles.pickerRow}>
                    <View style={styles.separatorLine} />
                    <View style={[styles.separatorLine, { top: ITEM_H * (CENTER + 1) }]} />

                    <TimeWheel
                      items={HOURS_12}
                      selectedIndex={h12Index}
                      onSelect={(i) => {
                        const hour24 = to24h(i, ampmIndex);
                        handleTimeChange(key, hour24, MINUTE_VALUES[minIndex]);
                      }}
                      accessibilityLabel="Hour"
                    />
                    <Text style={styles.colon} accessible={false}>:</Text>
                    <TimeWheel
                      items={MINUTE_LABELS}
                      selectedIndex={minIndex}
                      onSelect={(i) => {
                        const hour24 = to24h(h12Index, ampmIndex);
                        handleTimeChange(key, hour24, MINUTE_VALUES[i]);
                      }}
                      accessibilityLabel="Minute"
                    />
                    <TimeWheel
                      items={AMPM_LABELS}
                      selectedIndex={ampmIndex}
                      onSelect={(i) => {
                        const hour24 = to24h(h12Index, i);
                        handleTimeChange(key, hour24, MINUTE_VALUES[minIndex]);
                      }}
                      accessibilityLabel="AM or PM"
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <Text style={styles.infoText}>
          Tap the time to adjust. Reminders repeat daily.
        </Text>
      </ScrollView>
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

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  card: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card,
    borderWidth: 2, borderColor: Theme.colors.border, padding: 18, marginTop: 16,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 4,
  },
  cardLabel: { fontSize: 15, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },

  timeDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 10,
  },
  timeText: {
    fontSize: 22, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center',
  },
  timeTextDisabled: { color: Theme.colors.textMuted },

  pickerArea: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: Theme.colors.separator,
    top: ITEM_H * CENTER,
    zIndex: 10,
  },
  colon: {
    fontSize: 22, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
    marginHorizontal: 2,
  },

  hiddenSwitch: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },

  infoText: {
    fontSize: 12, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'center', marginTop: 24, lineHeight: 18,
  },
});
