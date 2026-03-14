import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
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
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/theme';
import { useRemindersStore, type ReminderConfig, type ReminderFrequency } from '@/store/reminders-store';
import { requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import * as Notifications from 'expo-notifications';

type ReminderKey = 'breakfast' | 'lunch' | 'dinner' | 'weighIn';

const MEAL_KEYS: readonly ReminderKey[] = ['breakfast', 'lunch', 'dinner'];
const FREQUENCY_OPTIONS: readonly ReminderFrequency[] = ['daily', 'weekly'];

const REMINDER_META: Record<ReminderKey, { label: string; subtitle: string }> = {
  breakfast: { label: 'Breakfast', subtitle: 'Start your day right' },
  lunch: { label: 'Lunch', subtitle: 'Midday fuel-up' },
  dinner: { label: 'Dinner', subtitle: 'Evening meal' },
  weighIn: { label: 'Weigh-in', subtitle: 'Track your progress' },
};

// SVG icon paths (Lucide-style, 24x24 viewBox)
const REMINDER_ICONS: Record<ReminderKey, { d: string; hasCircle?: boolean }> = {
  // Sun (sunrise)
  breakfast: {
    d: 'M12 2v2M4.93 4.93l1.41 1.41M20 12h2M2 12h2M19.07 4.93l-1.41 1.41M12 8a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4ZM4 18h16',
  },
  // Utensils
  lunch: {
    d: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
  },
  // Moon
  dinner: {
    d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  },
  // Scale
  weighIn: {
    d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-13 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 1.5 2.5Z',
  },
};

// Weekday labels for weekly weigh-in (1=Sun … 7=Sat per expo-notifications)
const WEEKDAY_LABELS: { value: number; short: string; long: string }[] = [
  { value: 1, short: 'Sun', long: 'Sunday' },
  { value: 2, short: 'Mon', long: 'Monday' },
  { value: 3, short: 'Tue', long: 'Tuesday' },
  { value: 4, short: 'Wed', long: 'Wednesday' },
  { value: 5, short: 'Thu', long: 'Thursday' },
  { value: 6, short: 'Fri', long: 'Friday' },
  { value: 7, short: 'Sat', long: 'Saturday' },
];

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

function to12h(hour24: number): { h12Index: number; ampmIndex: number } {
  const ampmIndex = hour24 >= 12 ? 1 : 0;
  const h12 = hour24 % 12 || 12;
  return { h12Index: h12 - 1, ampmIndex };
}

function to24h(h12Index: number, ampmIndex: number): number {
  const h12 = h12Index + 1;
  if (ampmIndex === 0) return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

// NaN-safe clamp — defaults to 0 on invalid input
function minuteToIndex(minute: number): number {
  if (!Number.isFinite(minute)) return 0;
  return Math.min(11, Math.max(0, Math.round(minute / 5)));
}

// ── Animated reminder icon ───────────────────────────────────────────

// Each icon type gets a unique animation on toggle:
//   breakfast (sun)    → 360° spin
//   lunch (utensils)   → wiggle tilt left/right
//   dinner (moon)      → gentle rock
//   weighIn (flame)    → gentle rock

interface ReminderIconProps {
  reminderKey: ReminderKey;
  enabled: boolean;
}

const AnimatedView = Animated.View;

const ReminderIcon = memo(function ReminderIcon({ reminderKey, enabled }: ReminderIconProps) {
  const icon = REMINDER_ICONS[reminderKey];
  const color = enabled ? Theme.colors.primary : Theme.colors.textMuted;

  // Shared values for animation
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const bgProgress = useSharedValue(enabled ? 1 : 0);
  const isFirstRender = useRef(true);

  // #7 perf fix: only depend on enabled & reminderKey, not shared value objects
  useEffect(() => {
    // Animate background color transition
    bgProgress.value = withTiming(enabled ? 1 : 0, { duration: 300 });

    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (enabled) {
      // Trigger per-icon animation on enable
      switch (reminderKey) {
        case 'breakfast':
          // Full spin
          rotation.value = 0;
          rotation.value = withTiming(360, { duration: 600, easing: Easing.out(Easing.cubic) });
          break;
        case 'lunch':
          // Wiggle tilt
          rotation.value = withSequence(
            withTiming(-18, { duration: 80 }),
            withTiming(18, { duration: 80 }),
            withTiming(-12, { duration: 80 }),
            withTiming(12, { duration: 80 }),
            withTiming(0, { duration: 100 }),
          );
          break;
        case 'dinner':
        case 'weighIn':
          // Gentle rock
          rotation.value = withSequence(
            withTiming(-15, { duration: 150, easing: Easing.out(Easing.quad) }),
            withTiming(10, { duration: 150, easing: Easing.out(Easing.quad) }),
            withTiming(-5, { duration: 120 }),
            withTiming(0, { duration: 120 }),
          );
          break;
      }
    } else {
      // Subtle shrink on disable
      scale.value = withSequence(
        withTiming(0.85, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
      rotation.value = withTiming(0, { duration: 200 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reminderKey]);

  const wrapStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      bgProgress.value,
      [0, 1],
      [Theme.colors.surfaceAlt, Theme.colors.accentBackground],
    ),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <AnimatedView style={[iconStyles.wrap, wrapStyle]} accessible={false}>
      <AnimatedView style={iconStyle}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          {icon.hasCircle && <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />}
          <Path d={icon.d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </AnimatedView>
    </AnimatedView>
  );
});

const iconStyles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
  const [liveIndex, setLiveIndex] = useState(selectedIndex);

  useEffect(() => {
    setLiveIndex(selectedIndex);
  }, [selectedIndex]);

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
      setLiveIndex(idx);
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
      setLiveIndex(idx);
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
          const distance = Math.abs(index - liveIndex);
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

async function scheduleReminder(key: ReminderKey, config: ReminderConfig): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(key).catch(() => {});

    if (!config.enabled) return;

    const granted = await ensurePermission();
    if (!granted) {
      Alert.alert('Notifications Disabled', 'Please enable notifications in your device settings.');
      return;
    }

    const frequency = config.frequency ?? 'daily';
    const isWeekly = key === 'weighIn' && frequency === 'weekly';

    await Notifications.scheduleNotificationAsync({
      identifier: key,
      content: {
        title: 'Calobite',
        body: key === 'weighIn'
          ? "Time to step on the scale!"
          : `Time to log ${key}!`,
      },
      // Hour/minute are interpreted in the device's current local timezone.
      // If the user travels, reminders will fire at the new local time.
      trigger: isWeekly
        ? {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: config.weekday ?? 2,
            hour: config.hour,
            minute: config.minute,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: config.hour,
            minute: config.minute,
          },
    });
  } catch (e) {
    // Notifications not fully supported in Expo Go — log in dev for debugging
    if (__DEV__) console.warn(`Failed to schedule ${key} reminder:`, e);
  }
}

// ── Main screen ──────────────────────────────────────────────────────

export default function RemindersScreen() {
  const router = useRouter();
  const breakfast = useRemindersStore((s) => s.breakfast);
  const lunch = useRemindersStore((s) => s.lunch);
  const dinner = useRemindersStore((s) => s.dinner);
  const weighIn = useRemindersStore((s) => s.weighIn);
  const updateReminder = useRemindersStore((s) => s.updateReminder);
  const [expandedKey, setExpandedKey] = useState<ReminderKey | null>(null);

  const configs = useMemo<Record<ReminderKey, ReminderConfig>>(
    () => ({ breakfast, lunch, dinner, weighIn }),
    [breakfast, lunch, dinner, weighIn],
  );

  // #2 critical fix: check permission BEFORE updating store
  const handleToggle = useCallback(
    async (key: ReminderKey, enabled: boolean) => {
      if (enabled) {
        const granted = await ensurePermission();
        if (!granted) {
          Alert.alert('Notifications Disabled', 'Please enable notifications in your device settings.');
          return; // Don't update store if permission denied
        }
      }
      updateReminder(key, { enabled });
      // Use store.getState() to avoid capturing stale configs
      const liveConfig = { ...useRemindersStore.getState()[key], enabled };
      await scheduleReminder(key, liveConfig);
      // Collapse time picker when disabling
      if (!enabled) setExpandedKey(null);
    },
    [updateReminder],
  );

  const handleTimeChange = useCallback(
    async (key: ReminderKey, hour: number, minute: number) => {
      updateReminder(key, { hour, minute });
      const liveConfig = useRemindersStore.getState()[key];
      if (liveConfig.enabled) {
        await scheduleReminder(key, { ...liveConfig, hour, minute });
      }
    },
    [updateReminder],
  );

  const toggleExpanded = useCallback((key: ReminderKey) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const handleFrequencyChange = useCallback(
    async (freq: ReminderFrequency) => {
      updateReminder('weighIn', { frequency: freq });
      const liveConfig = useRemindersStore.getState().weighIn;
      if (liveConfig.enabled) {
        await scheduleReminder('weighIn', { ...liveConfig, frequency: freq });
      }
    },
    [updateReminder],
  );

  const handleWeekdayChange = useCallback(
    async (weekday: number) => {
      updateReminder('weighIn', { weekday });
      const liveConfig = useRemindersStore.getState().weighIn;
      if (liveConfig.enabled && liveConfig.frequency === 'weekly') {
        await scheduleReminder('weighIn', { ...liveConfig, weekday });
      }
    },
    [updateReminder],
  );

  const renderCard = (key: ReminderKey) => {
    const config = configs[key];
    const meta = REMINDER_META[key];
    const isExpanded = expandedKey === key;
    const { h12Index, ampmIndex } = to12h(config.hour);
    const minIndex = minuteToIndex(config.minute);
    const isWeighIn = key === 'weighIn';
    const freq = config.frequency ?? 'daily';

    return (
      <View key={key} style={styles.card}>
        <View style={styles.cardTop}>
          <ReminderIcon reminderKey={key} enabled={config.enabled} />
          <View style={styles.cardLabels}>
            <Text style={styles.cardLabel}>{meta.label}</Text>
            <Text style={styles.cardSubtitle}>{meta.subtitle}</Text>
          </View>
          <Switch
            key={`switch-${key}`}
            value={config.enabled}
            onValueChange={(v) => handleToggle(key, v)}
            trackColor={{ false: Theme.colors.surfaceAlt, true: Theme.colors.primary }}
            thumbColor={Theme.colors.white}
            ios_backgroundColor={Theme.colors.surfaceAlt}
            accessibilityLabel={`${meta.label} reminder toggle`}
            accessibilityRole="switch"
            accessibilityState={{ checked: config.enabled }}
          />
        </View>

        {isWeighIn && (
          <View style={[styles.freqSection, !config.enabled && styles.freqSectionDisabled]}>
            <View
              style={styles.freqPillRow}
              accessibilityRole="radiogroup"
              accessibilityLabel="Weigh-in frequency"
            >
              {FREQUENCY_OPTIONS.map((f) => {
                const active = freq === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqPill, active && styles.freqPillActive]}
                    onPress={() => handleFrequencyChange(f)}
                    disabled={!config.enabled}
                    accessibilityRole="radio"
                    accessibilityLabel={f === 'daily' ? 'Daily frequency' : 'Weekly frequency'}
                    accessibilityState={{ selected: active, disabled: !config.enabled }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.freqPillText, active && styles.freqPillTextActive]}>
                      {f === 'daily' ? 'Daily' : 'Weekly'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {freq === 'weekly' && (
              <View
                style={styles.weekdayRow}
                accessibilityLiveRegion="polite"
              >
                {WEEKDAY_LABELS.map(({ value, short, long }) => {
                  const active = (config.weekday ?? 2) === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.weekdayChip, active && styles.weekdayChipActive]}
                      onPress={() => handleWeekdayChange(value)}
                      disabled={!config.enabled}
                      hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
                      accessibilityLabel={`${long}${active ? ', selected' : ''}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active, disabled: !config.enabled }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.weekdayText, active && styles.weekdayTextActive]}>
                        {short}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={() => toggleExpanded(key)}
          disabled={!config.enabled}
          style={[styles.timeDisplay, !config.enabled && styles.timeDisplayDisabled]}
          accessibilityLabel={formatTime(config.hour, config.minute)}
          accessibilityRole="button"
          accessibilityHint={config.enabled ? 'Double-tap to change time' : 'Enable reminder to change time'}
          accessibilityState={{ expanded: isExpanded, disabled: !config.enabled }}
          activeOpacity={0.7}
        >
          <Text style={[styles.timeText, !config.enabled && styles.timeTextDisabled]}>
            {formatTime(config.hour, config.minute)}
          </Text>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d={isExpanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
              stroke={config.enabled ? Theme.colors.primary : Theme.colors.border}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {isExpanded && config.enabled && (
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
  };

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
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">Reminders</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View accessibilityRole="summary" accessibilityLabel="Tracking reminders section">
          <Text style={styles.sectionTitle} accessibilityRole="header">Tracking</Text>
          <Text style={styles.sectionHint}>Weigh-in can be daily or weekly. Pick your preferred day if weekly.</Text>
          {renderCard('weighIn')}
        </View>

        <View accessibilityRole="summary" accessibilityLabel="Meal reminders section">
          <Text style={[styles.sectionTitle, { marginTop: 28 }]} accessibilityRole="header">Meals</Text>
          <Text style={styles.sectionHint}>Set the time you want to be reminded for each meal.</Text>
          {MEAL_KEYS.map(renderCard)}
        </View>
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

  sectionTitle: {
    fontSize: 13, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 20, marginBottom: 0, marginLeft: 4,
  },
  sectionHint: {
    fontSize: 12, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    marginTop: 2, marginLeft: 4,
  },

  card: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card,
    borderWidth: 2, borderColor: Theme.colors.border, padding: 18, marginTop: 16,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  cardLabels: { flex: 1 },
  cardLabel: { fontSize: 15, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  cardSubtitle: { fontSize: 12, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark, marginTop: 1 },

  timeDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, marginTop: 4,
  },
  timeDisplayDisabled: { opacity: 0.4 },
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

  freqSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: 16,
  },
  freqSectionDisabled: { opacity: 0.4 },
  freqPillRow: {
    flexDirection: 'row', gap: 10,
  },
  freqPill: {
    flex: 1, paddingVertical: 14, borderRadius: Theme.borderRadius.button,
    borderWidth: 2, borderColor: Theme.colors.border, alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  freqPillActive: {
    backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary,
  },
  freqPillText: {
    fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
  },
  freqPillTextActive: { color: Theme.colors.white },

  weekdayRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 16,
  },
  weekdayChip: {
    width: 40, height: 40, borderRadius: Theme.borderRadius.button,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 2, borderColor: Theme.colors.border,
  },
  weekdayChipActive: {
    backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary,
  },
  weekdayText: {
    fontSize: 12, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
  },
  weekdayTextActive: { color: Theme.colors.white },

  hiddenSwitch: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },

});
