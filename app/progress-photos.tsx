import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { usePhotoStore, type ProgressPhoto } from '@/store/photo-store';
import { useWeightStore } from '@/store/weight-store';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const GRID_GAP = 3;
const NUM_COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - 40 - GRID_GAP * (NUM_COLS - 1)) / NUM_COLS;

export default function ProgressPhotosScreen() {
  const router = useRouter();
  const photos = usePhotoStore((s) => s.photos);
  const removePhoto = usePhotoStore((s) => s.removePhoto);
  const weightEntries = useWeightStore((s) => s.entries);
  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null);

  // Build a map of date → closest weight for that date
  const weightByDate = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    for (const e of weightEntries) {
      // Keep the first (most recent) entry per date
      if (!(e.date in map)) {
        map[e.date] = e.weight;
      }
    }
    return map;
  }, [weightEntries]);

  const weightUnit = weightEntries[0]?.unit ?? 'kg';

  const handleLongPress = useCallback(
    (photo: ProgressPhoto) => {
      Alert.alert(
        'Delete Photo',
        'Remove this progress photo?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => removePhoto(photo.id) },
        ],
      );
    },
    [removePhoto],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProgressPhoto }) => {
      const w = weightByDate[item.date];
      return (
        <TouchableOpacity
          onPress={() => setViewingPhoto(item)}
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.8}
          accessibilityLabel={`Progress photo from ${item.date}`}
          accessibilityRole="image"
          accessibilityHint="Tap to view full size, long press to delete"
        >
          <Image
            source={{ uri: item.uri }}
            style={styles.tile}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.tileOverlay}>
            <Text style={styles.tileDate}>{formatFullDate(item.date)}</Text>
            {w !== undefined && (
              <Text style={styles.tileWeight}>{w.toFixed(1)} {weightUnit}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleLongPress, weightByDate, weightUnit],
  );

  const viewingWeight = viewingPhoto ? weightByDate[viewingPhoto.date] : undefined;

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
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={Theme.colors.textDark}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Photos</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={NUM_COLS}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" accessible={false}>
                <Path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke={Theme.colors.textMuted}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySubtitle}>
              Add progress photos when you log your weight
            </Text>
          </View>
        }
      />

      {/* Full-screen photo viewer */}
      <Modal
        visible={viewingPhoto !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewingPhoto(null)}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setViewingPhoto(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close photo"
            accessibilityRole="button"
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke={Theme.colors.white} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>

          {viewingPhoto && (
            <>
              <Image
                source={{ uri: viewingPhoto.uri }}
                style={styles.modalImage}
                contentFit="contain"
                transition={200}
              />
              <View style={styles.modalInfo}>
                <Text style={styles.modalDate}>{formatFullDate(viewingPhoto.date)}</Text>
                {viewingWeight !== undefined && (
                  <Text style={styles.modalWeight}>{viewingWeight.toFixed(1)} {weightUnit}</Text>
                )}
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.modalDeleteBtn}
            onPress={() => {
              if (!viewingPhoto) return;
              Alert.alert(
                'Delete Photo',
                'Remove this progress photo?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      removePhoto(viewingPhoto.id);
                      setViewingPhoto(null);
                    },
                  },
                ],
              );
            }}
            accessibilityLabel="Delete photo"
            accessibilityRole="button"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14"
                stroke={Theme.colors.white}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function formatFullDate(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
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

  grid: { paddingHorizontal: 20, paddingBottom: 40 },
  gridRow: { gap: GRID_GAP, marginBottom: GRID_GAP },

  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE * 1.3,
    borderRadius: Theme.borderRadius.small,
  },
  tileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderBottomLeftRadius: Theme.borderRadius.small,
    borderBottomRightRadius: Theme.borderRadius.small,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tileDate: {
    fontSize: 9,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
  tileWeight: {
    fontSize: 10,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
    marginTop: 1,
  },

  empty: { paddingTop: 80, alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.primaryActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },

  // Full-screen modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.65,
  },
  modalInfo: {
    marginTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  modalDate: {
    fontSize: 16,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
  modalWeight: {
    fontSize: 20,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
  },
  modalDeleteBtn: {
    position: 'absolute',
    top: 54,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
