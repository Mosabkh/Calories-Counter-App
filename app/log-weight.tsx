import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Path, Circle } from 'react-native-svg';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/theme';
import { useWeightStore } from '@/store/weight-store';
import { useUserStore } from '@/store/user-store';
import { usePhotoStore } from '@/store/photo-store';
import { useStreakStore } from '@/store/streak-store';
import { toDateKey } from '@/utils/date';
import type { WeightEntry } from '@/types/data';

const DECIMAL_ITEMS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Lightweight scroll-based picker (plain ScrollView, no FlatList) to avoid nesting errors
const WHEEL_ITEM_H = 44;
const WHEEL_VISIBLE = 5;
const WHEEL_CENTER = Math.floor(WHEEL_VISIBLE / 2);

interface WeightWheelProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width?: number;
  accessibilityLabel?: string;
}

const WeightWheel = memo(function WeightWheel({
  items,
  selectedIndex,
  onSelect,
  width = 80,
  accessibilityLabel,
}: WeightWheelProps) {
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
        scrollRef.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_H, animated: false });
      }, 100);
      hasScrolled.current = true;
    }
  }, [selectedIndex]);

  const getIndex = useCallback(
    (offsetY: number) => Math.max(0, Math.min(Math.round(offsetY / WHEEL_ITEM_H), items.length - 1)),
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

  const listHeight = WHEEL_ITEM_H * WHEEL_VISIBLE;

  return (
    <View
      style={{ width, height: listHeight }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel ? `${accessibilityLabel}: ${items[selectedIndex] ?? ''}` : `${items[selectedIndex] ?? ''}`}
      accessibilityHint="Swipe up or down to change value"
    >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="normal"
        bounces
        overScrollMode="always"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: WHEEL_ITEM_H * WHEEL_CENTER }}
        nestedScrollEnabled
      >
        {items.map((item, index) => {
          const distance = Math.abs(index - liveIndex);
          const isSelected = distance === 0;
          const opacity = isSelected ? 1 : distance === 1 ? 0.4 : 0.15;

          return (
            <View key={`${item}-${index}`} style={[wheelStyles.item, { width }]}>
              <Text
                style={[wheelStyles.itemText, isSelected && wheelStyles.activeText, { opacity }]}
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
  item: { height: WHEEL_ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemText: { fontSize: 22, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark },
  activeText: { fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
});

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

function formatDisplayDate(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return 'Today';
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateKey;
  const [y, m, d] = parts;
  if (m < 1 || m > 12) return dateKey;
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
  const initialDecimal = Math.min(9, Math.round((currentWeight - initialWhole) * 10) % 10);

  const [sessionPhotoUri, setSessionPhotoUri] = useState<string | null>(null);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const isSaving = useRef(false);

  // Slide-in + bounce animation for photo strip
  const photoStripY = useSharedValue(30);
  const photoStripOpacity = useSharedValue(0);
  useEffect(() => {
    if (!isEditing) {
      photoStripY.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 120 }));
      photoStripOpacity.value = withDelay(300, withSpring(1, { damping: 20, stiffness: 100 }));
    }
  }, [isEditing, photoStripY, photoStripOpacity]);
  const photoStripAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: photoStripY.value }],
    opacity: photoStripOpacity.value,
  }));

  const [wholePart, setWholePart] = useState(
    Math.max(0, Math.min(wholeItems.length - 1, initialWhole - minWhole)),
  );
  const [decimalPart, setDecimalPart] = useState(initialDecimal);

  const selectedWeight = Math.round((minWhole + wholePart + decimalPart / 10) * 10) / 10;

  // Disable Update button when weight hasn't changed in edit mode
  const hasChanged = !isEditing || selectedWeight !== existingEntry?.weight;

  const pickPhoto = useCallback(async (useCamera: boolean) => {
    if (isPickingPhoto) return;
    setIsPickingPhoto(true);
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
    } finally {
      setIsPickingPhoto(false);
    }
  }, [isPickingPhoto]);

  const handleAddPhoto = useCallback(() => {
    if (isPickingPhoto) return;
    Alert.alert('Add Progress Photo', 'Choose a source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => pickPhoto(true) },
      { text: 'Choose from Library', onPress: () => pickPhoto(false) },
    ]);
  }, [isPickingPhoto, pickPhoto]);

  const handleDateChange = useCallback((_event: DateTimePickerEvent, date: Date | undefined) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(toDateKey(date));
  }, []);

  const handleSave = useCallback(() => {
    if (isSaving.current) return;
    isSaving.current = true;

    if (isEditing) {
      // Guard: verify entry still exists (may have been deleted between navigation)
      const currentEntry = allEntries.find((e) => e.id === params.editEntryId);
      if (!currentEntry) {
        isSaving.current = false;
        Alert.alert('Entry Deleted', 'This entry no longer exists.');
        router.back();
        return;
      }
      updateEntry(currentEntry.id, { weight: selectedWeight, unit });
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      isSaving.current = false;
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
    useStreakStore.getState().recordActivity(toDateKey());
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

    if (sessionPhotoUri) {
      addPhoto({
        id: Crypto.randomUUID(),
        date: selectedDate,
        timestamp: Date.now(),
        uri: sessionPhotoUri,
      });
    }

    isSaving.current = false;
    router.back();
  }, [isEditing, allEntries, params.editEntryId, selectedWeight, unit, selectedDate, updateEntry, addEntry, addPhoto, sessionPhotoUri, router]);

  const handleBack = useCallback(() => {
    if (sessionPhotoUri) {
      Alert.alert('Discard Photo?', 'Your progress photo will not be saved.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [sessionPhotoUri, router]);

  // Guard: editEntryId provided but entry not found (deleted between navigation)
  if (params.editEntryId && !existingEntry) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={HIT_SLOP}
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
    <SafeAreaView style={styles.safe} edges={['top']} accessibilityViewIsModal>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={HIT_SLOP}
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

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
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
          <View style={styles.datePickerWrap}>
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
                hitSlop={HIT_SLOP}
                accessibilityLabel="Done selecting date"
                accessibilityRole="button"
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.valueDisplay} accessibilityLiveRegion="polite" accessibilityRole="text">
            {selectedWeight.toFixed(1)}{' '}
            <Text style={styles.unitText} accessible={false}>{unit}</Text>
          </Text>

          <View style={styles.pickerArea}>
            <View style={styles.pickerRow}>
              <WeightWheel
                items={wholeItems}
                selectedIndex={wholePart}
                onSelect={setWholePart}
                width={80}
                accessibilityLabel={`Whole ${unit}`}
              />
              <Text style={styles.dot} accessible={false}>.</Text>
              <WeightWheel
                items={DECIMAL_ITEMS}
                selectedIndex={decimalPart}
                onSelect={setDecimalPart}
                width={50}
                accessibilityLabel={`Decimal ${unit}`}
              />
              <Text style={styles.unitLabel}>{unit}</Text>
            </View>

            {/* Shared separator lines */}
            <View style={styles.separatorContainer} pointerEvents="none" accessible={false}>
              <View
                style={[
                  styles.separatorLine,
                  { top: WHEEL_ITEM_H * WHEEL_CENTER },
                ]}
              />
              <View
                style={[
                  styles.separatorLine,
                  { top: WHEEL_ITEM_H * (WHEEL_CENTER + 1) },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Photo thumbnail strip (hidden in edit mode) */}
        {!isEditing && (
        <Animated.View style={photoStripAnimStyle}>
        <TouchableOpacity
          style={styles.photoStrip}
          onPress={handleAddPhoto}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
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
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
                  <Path
                    d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                    stroke={Theme.colors.white}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx="12" cy="13" r="4" stroke={Theme.colors.white} strokeWidth={2} />
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
        </Animated.View>
      )}
      </ScrollView>

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
          <Text style={styles.saveBtnText}>
            {isEditing ? 'Update' : 'Save'}
          </Text>
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
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  datePickerWrap: {
    marginBottom: 16,
  },
  datePickerDone: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center' as const,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.button,
  },
  datePickerDoneText: {
    fontSize: 15,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
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
    height: WHEEL_ITEM_H * WHEEL_VISIBLE,
    gap: 4,
  },
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
    height: WHEEL_ITEM_H * WHEEL_VISIBLE,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.card,
    backgroundColor: Theme.colors.primaryActive,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
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
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
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
