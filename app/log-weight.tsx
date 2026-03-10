import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Path, Circle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/theme';
import {
  ScrollPicker,
  PICKER_ITEM_HEIGHT,
  PICKER_VISIBLE_ITEMS,
  PICKER_CENTER,
} from '@/components/onboarding/ScrollPicker';
import { useWeightStore } from '@/store/weight-store';
import { useUserStore } from '@/store/user-store';
import { usePhotoStore } from '@/store/photo-store';
import { toDateKey } from '@/utils/date';
import type { WeightEntry } from '@/types/data';

const DECIMAL_ITEMS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDisplayDate(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return 'Today';
  const [y, m, d] = dateKey.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export default function LogWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editEntryId?: string }>();
  const profile = useUserStore((s) => s.profile);
  const addEntry = useWeightStore((s) => s.addEntry);
  const updateEntry = useWeightStore((s) => s.updateEntry);
  const allEntries = useWeightStore((s) => s.entries);
  const latestWeight = allEntries[0];
  const addPhoto = usePhotoStore((s) => s.addPhoto);
  const todayKey = useMemo(() => toDateKey(), []);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const formattedDate = useMemo(() => formatDisplayDate(selectedDate, todayKey), [selectedDate, todayKey]);

  // Editing an existing entry?
  const existingEntry = useMemo((): WeightEntry | null => {
    if (!params.editEntryId) return null;
    return allEntries.find((e) => e.id === params.editEntryId) ?? null;
  }, [params.editEntryId, allEntries]);

  const isEditing = existingEntry !== null;

  // Preserve original entry's unit when editing to prevent unit corruption
  const unit = existingEntry?.unit ?? profile?.weightUnit ?? 'kg';
  const currentWeight = existingEntry?.weight ?? latestWeight?.weight ?? profile?.startWeight ?? 70;

  // Build picker data: whole part + decimal part
  const isLb = unit === 'lb';
  const minWhole = isLb ? 66 : 30;
  const maxWhole = isLb ? 660 : 300;

  const wholeItems = useMemo(() => {
    const items: string[] = [];
    for (let i = minWhole; i <= maxWhole; i++) items.push(String(i));
    return items;
  }, [minWhole, maxWhole]);

  const initialWhole = Math.floor(currentWeight);
  const initialDecimal = Math.min(9, Math.floor((currentWeight - initialWhole) * 10));

  const [sessionPhotoUri, setSessionPhotoUri] = useState<string | null>(null);

  const [wholePart, setWholePart] = useState(
    Math.max(0, Math.min(wholeItems.length - 1, initialWhole - minWhole)),
  );
  const [decimalPart, setDecimalPart] = useState(initialDecimal);

  const selectedWeight = Math.round((minWhole + wholePart + decimalPart / 10) * 10) / 10;

  // Disable Update button when weight hasn't changed in edit mode
  const hasChanged = !isEditing || selectedWeight !== existingEntry?.weight;

  const pickPhoto = useCallback(async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Camera access is required to take a photo.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (result.canceled || !result.assets[0]) return;
        setSessionPhotoUri(result.assets[0].uri);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Photo library access is required to choose a photo.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
        if (result.canceled || !result.assets[0]) return;
        setSessionPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not access photos. Please try again.');
    }
  }, []);

  const handleAddPhoto = useCallback(() => {
    Alert.alert('Add Progress Photo', 'Choose a source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => pickPhoto(true) },
      { text: 'Choose from Library', onPress: () => pickPhoto(false) },
    ]);
  }, [pickPhoto]);

  const handleDateChange = useCallback((_event: unknown, date: Date | undefined) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(toDateKey(date));
  }, []);

  const handleSave = useCallback(() => {
    if (isEditing && existingEntry) {
      updateEntry(existingEntry.id, { weight: selectedWeight, unit });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      return;
    }

    const entry: WeightEntry = {
      id: Crypto.randomUUID(),
      date: selectedDate,
      timestamp: Date.now(),
      weight: selectedWeight,
      unit,
    };
    addEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (sessionPhotoUri) {
      addPhoto({
        id: Crypto.randomUUID(),
        date: selectedDate,
        timestamp: Date.now(),
        uri: sessionPhotoUri,
      });
    }

    router.back();
  }, [isEditing, existingEntry, selectedWeight, unit, selectedDate, updateEntry, addEntry, addPhoto, sessionPhotoUri, router]);

  // Guard: editEntryId provided but entry not found (deleted between navigation)
  if (params.editEntryId && !existingEntry) {
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
          <Text style={styles.headerTitle} accessibilityRole="header">Edit Weight</Text>
          <View style={styles.backBtn} accessible={false} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Entry Not Found</Text>
          <Text style={styles.notFoundSubtitle}>This entry may have been deleted.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle} accessibilityRole="header">
          {isEditing ? `Edit Weight · ${formatDisplayDate(existingEntry?.date ?? '', todayKey)}` : 'Log Weight'}
        </Text>
        <View style={styles.backBtn} accessible={false} />
      </View>

      {/* Date selector (hidden in edit mode) */}
      {!isEditing && (
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => setShowDatePicker((v) => !v)}
          activeOpacity={0.7}
          accessibilityLabel={`Date: ${formattedDate}. Tap to change.`}
          accessibilityRole="button"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
              stroke={Theme.colors.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d="M6 9l6 6 6-6"
              stroke={Theme.colors.textDark}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      )}
      {showDatePicker && (
        <>
          <DateTimePicker
            value={new Date(selectedDate + 'T12:00:00')}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={new Date()}
            onChange={handleDateChange}
            accentColor={Theme.colors.primary}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.datePickerDone}
              onPress={() => setShowDatePicker(false)}
              accessibilityLabel="Done selecting date"
              accessibilityRole="button"
            >
              <Text style={styles.datePickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={styles.content}>
        <Text style={styles.valueDisplay} accessibilityLiveRegion="polite" accessibilityRole="text">
          {selectedWeight.toFixed(1)}{' '}
          <Text style={styles.unitText} accessible={false}>{unit}</Text>
        </Text>

        <View style={styles.pickerArea}>
          <View style={styles.pickerRow}>
            <View style={styles.pickerWrap}>
              <ScrollPicker
                items={wholeItems}
                selectedIndex={wholePart}
                onSelect={setWholePart}
                hideLines
                accessibilityLabel={`Whole ${unit}`}
              />
            </View>
            <Text style={styles.dot} accessible={false}>.</Text>
            <View style={styles.pickerWrapSmall}>
              <ScrollPicker
                items={DECIMAL_ITEMS}
                selectedIndex={decimalPart}
                onSelect={setDecimalPart}
                hideLines
                accessibilityLabel={`Decimal ${unit}`}
              />
            </View>
            <Text style={styles.unitLabel}>{unit}</Text>
          </View>

          {/* Shared separator lines */}
          <View style={styles.separatorContainer} pointerEvents="none" accessible={false}>
            <View
              style={[
                styles.separatorLine,
                { top: PICKER_ITEM_HEIGHT * PICKER_CENTER },
              ]}
            />
            <View
              style={[
                styles.separatorLine,
                { top: PICKER_ITEM_HEIGHT * (PICKER_CENTER + 1) },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Photo thumbnail strip (hidden in edit mode) */}
      {!isEditing && (
        <TouchableOpacity
          style={styles.photoStrip}
          onPress={handleAddPhoto}
          activeOpacity={0.7}
          accessibilityLabel={sessionPhotoUri ? 'Change progress photo' : 'Add progress photo'}
          accessibilityRole="button"
        >
          <View style={styles.photoThumbWrap}>
            {sessionPhotoUri ? (
              <Image
                source={{ uri: sessionPhotoUri }}
                style={styles.photoThumb}
                contentFit="cover"
                transition={200}
                accessible={false}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" accessible={false}>
                  <Path
                    d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                    stroke={Theme.colors.primary}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx="12" cy="13" r="4" stroke={Theme.colors.primary} strokeWidth={2} />
                </Svg>
              </View>
            )}
            {sessionPhotoUri && (
              <View style={styles.photoCheckBadge} accessible={false}>
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" accessible={false}>
                  <Path
                    d="M20 6L9 17l-5-5"
                    stroke={Theme.colors.white}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            )}
          </View>
          <View style={styles.photoStripInfo}>
            <Text style={styles.photoStripTitle}>
              {sessionPhotoUri ? 'Photo added' : 'Add progress photo'}
            </Text>
            <Text style={styles.photoStripHint}>
              {sessionPhotoUri ? 'Tap to replace' : 'Capture your progress today'}
            </Text>
          </View>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d="M9 18l6-6-6-6"
              stroke={Theme.colors.textDark}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      )}

      {/* Save button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, isEditing && !hasChanged && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={isEditing && !hasChanged}
          accessibilityLabel={`${isEditing ? 'Update' : 'Save'} weight ${selectedWeight.toFixed(1)} ${unit}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: isEditing && !hasChanged }}
        >
          <Text style={[styles.saveBtnText, isEditing && !hasChanged && styles.saveBtnTextDisabled]}>
            {isEditing ? 'Update' : 'Save'}
          </Text>
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
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.small,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  dateText: {
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
  },
  datePickerDone: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 4,
  },
  datePickerDoneText: {
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
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
    color: Theme.colors.textDark,
  },
  pickerArea: {
    position: 'relative',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  unitLabel: {
    fontSize: 18,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
    marginLeft: 8,
  },
  separatorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: PICKER_ITEM_HEIGHT * PICKER_VISIBLE_ITEMS,
  },
  separatorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Theme.colors.separator,
  },

  // Photo thumbnail strip
  photoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.card,
    backgroundColor: Theme.colors.surface,
    gap: 12,
  },
  photoThumbWrap: {
    position: 'relative',
  },
  photoThumb: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.small,
  },
  photoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.small,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.background,
  },
  photoCheckBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.surface,
  },
  photoStripInfo: {
    flex: 1,
    gap: 2,
  },
  photoStripTitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
  },
  photoStripHint: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textDark,
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
    opacity: 0.4,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
  },
  saveBtnTextDisabled: {
    opacity: 0.7,
  },
  notFound: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  notFoundTitle: {
    fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 8, textAlign: 'center',
  },
  notFoundSubtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    textAlign: 'center', lineHeight: 20,
  },
});
