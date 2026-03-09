import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { Theme } from '@/constants/theme';
import {
  ScrollPicker,
  PICKER_ITEM_HEIGHT,
  PICKER_VISIBLE_ITEMS,
  PICKER_CENTER,
} from '@/components/onboarding/ScrollPicker';
import { useWeightStore } from '@/store/weight-store';
import { useUserStore } from '@/store/user-store';
import { usePhotoStore, type ProgressPhoto } from '@/store/photo-store';
import { toDateKey } from '@/utils/date';
import type { WeightEntry } from '@/types/data';

export default function LogWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editEntryId?: string }>();
  const profile = useUserStore((s) => s.profile);
  const addEntry = useWeightStore((s) => s.addEntry);
  const updateEntry = useWeightStore((s) => s.updateEntry);
  const allEntries = useWeightStore((s) => s.entries);
  const latestWeight = useMemo(() => allEntries[0], [allEntries]);
  const addPhoto = usePhotoStore((s) => s.addPhoto);

  const todayKey = toDateKey();

  // Editing an existing entry?
  const existingEntry = useMemo(() => {
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

  const decimalItems = useMemo(() => {
    const items: string[] = [];
    for (let i = 0; i <= 9; i++) items.push(String(i));
    return items;
  }, []);

  const initialWhole = Math.floor(currentWeight);
  const initialDecimal = Math.round((currentWeight - initialWhole) * 10) % 10;

  const [photoAdded, setPhotoAdded] = useState(false);

  const [wholePart, setWholePart] = useState(
    Math.max(0, Math.min(wholeItems.length - 1, initialWhole - minWhole)),
  );
  const [decimalPart, setDecimalPart] = useState(initialDecimal);

  const selectedWeight = Math.round((minWhole + wholePart + decimalPart / 10) * 10) / 10;

  const pickPhoto = useCallback(async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera access is required to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [3, 4],
      });
      if (result.canceled || !result.assets[0]) return;
      return result.assets[0].uri;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    return result.assets[0].uri;
  }, []);

  const savePhoto = useCallback(async (useCamera: boolean) => {
    const uri = await pickPhoto(useCamera);
    if (!uri) return;
    const photo: ProgressPhoto = {
      id: Crypto.randomUUID(),
      date: todayKey,
      timestamp: Date.now(),
      uri,
    };
    addPhoto(photo);
    setPhotoAdded(true);
    Alert.alert('Photo Saved', 'Progress photo added successfully.');
  }, [addPhoto, todayKey, pickPhoto]);

  const handleAddPhoto = useCallback(() => {
    Alert.alert('Add Progress Photo', 'Choose a source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: () => savePhoto(true) },
      { text: 'Choose from Library', onPress: () => savePhoto(false) },
    ]);
  }, [savePhoto]);

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
          <Text style={styles.headerTitle}>Edit Weight</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Entry Not Found</Text>
          <Text style={styles.notFoundSubtitle}>This entry may have been deleted.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    if (isEditing && existingEntry) {
      updateEntry(existingEntry.id, { weight: selectedWeight, unit });
      router.back();
      return;
    }

    const entry: WeightEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: todayKey,
      timestamp: Date.now(),
      weight: selectedWeight,
      unit,
    };
    addEntry(entry);

    if (photoAdded) {
      router.back();
      return;
    }

    Alert.alert(
      'Weight Saved',
      `${selectedWeight.toFixed(1)} ${unit} logged.`,
      [
        { text: 'Done', onPress: () => router.back() },
        {
          text: 'Add Progress Photo',
          onPress: () => handleAddPhoto(),
        },
      ],
    );
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
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Weight' : 'Log Weight'}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <Text style={styles.valueDisplay}>
          {selectedWeight.toFixed(1)}{' '}
          <Text style={styles.unitText}>{unit}</Text>
        </Text>

        <View style={styles.pickerArea}>
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

      {/* Add progress photo button (hidden in edit mode) */}
      {!isEditing && <TouchableOpacity
        style={styles.photoBtn}
        onPress={handleAddPhoto}
        activeOpacity={0.7}
        accessibilityLabel="Add progress photo"
        accessibilityRole="button"
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
          <Path
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
            stroke={Theme.colors.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="13" r="4" stroke={Theme.colors.primary} strokeWidth={2} />
        </Svg>
        <Text style={styles.photoBtnText}>Add Progress Photo</Text>
      </TouchableOpacity>}

      {/* Save button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
          accessibilityLabel={`Save weight ${selectedWeight.toFixed(1)} ${unit}`}
          accessibilityRole="button"
        >
          <Text style={styles.saveBtnText}>{isEditing ? 'Update' : 'Save'}</Text>
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
    color: Theme.colors.textMuted,
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
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.button,
    backgroundColor: Theme.colors.surface,
  },
  photoBtnText: {
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
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
