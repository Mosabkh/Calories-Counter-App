import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useRemindersStore, type ReminderConfig } from '@/store/reminders-store';
import { requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import * as Notifications from 'expo-notifications';

const REMINDER_KEYS = ['breakfast', 'lunch', 'dinner', 'weighIn'] as const;
const REMINDER_LABELS: Record<typeof REMINDER_KEYS[number], string> = {
  breakfast: 'Breakfast Reminder',
  lunch: 'Lunch Reminder',
  dinner: 'Dinner Reminder',
  weighIn: 'Weigh-in Reminder',
};

function formatTime(hour: number, minute: number): string {
  const h12 = hour % 12 || 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

async function ensurePermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleReminder(key: string, config: ReminderConfig): Promise<void> {
  try {
    // Cancel existing notification for this key
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

export default function RemindersScreen() {
  const router = useRouter();
  const store = useRemindersStore();
  const updateReminder = useRemindersStore((s) => s.updateReminder);

  const handleToggle = useCallback(
    async (key: typeof REMINDER_KEYS[number], enabled: boolean) => {
      updateReminder(key, { enabled });
      const config = { ...store[key], enabled };
      await scheduleReminder(key, config);
    },
    [store, updateReminder],
  );

  const handleTimeAdjust = useCallback(
    async (key: typeof REMINDER_KEYS[number], delta: number) => {
      const current = store[key];
      let totalMin = current.hour * 60 + current.minute + delta;
      if (totalMin < 0) totalMin = 24 * 60 + totalMin;
      if (totalMin >= 24 * 60) totalMin = totalMin - 24 * 60;
      const hour = Math.floor(totalMin / 60);
      const minute = totalMin % 60;
      updateReminder(key, { hour, minute });
      if (current.enabled) {
        await scheduleReminder(key, { enabled: true, hour, minute });
      }
    },
    [store, updateReminder],
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
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {REMINDER_KEYS.map((key) => {
          const config = store[key];
          return (
            <View key={key} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardLabel}>{REMINDER_LABELS[key]}</Text>
                <Switch
                  value={config.enabled}
                  onValueChange={(v) => handleToggle(key, v)}
                  trackColor={{ false: Theme.colors.border, true: Theme.colors.primary }}
                  thumbColor={Theme.colors.white}
                  accessibilityLabel={`${REMINDER_LABELS[key]} toggle`}
                  accessibilityRole="switch"
                />
              </View>
              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => handleTimeAdjust(key, -30)}
                  accessibilityLabel="Decrease time by 30 minutes"
                  accessibilityRole="button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.timeBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.timeText, !config.enabled && styles.timeTextDisabled]}>
                  {formatTime(config.hour, config.minute)}
                </Text>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => handleTimeAdjust(key, 30)}
                  accessibilityLabel="Increase time by 30 minutes"
                  accessibilityRole="button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={styles.infoText}>
          Adjust times with the + / - buttons. Reminders repeat daily.
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
    marginBottom: 14,
  },
  cardLabel: { fontSize: 15, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },

  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  timeBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.colors.background,
    borderWidth: 2, borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'center',
  },
  timeBtnText: { fontSize: 20, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  timeText: { fontSize: 22, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, minWidth: 100, textAlign: 'center' },
  timeTextDisabled: { color: Theme.colors.textMuted },

  infoText: {
    fontSize: 12, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'center', marginTop: 24, lineHeight: 18,
  },
});
