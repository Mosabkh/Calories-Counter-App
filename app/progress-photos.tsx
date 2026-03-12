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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
const ROW_HEIGHT = TILE_SIZE * 1.3 + GRID_GAP;
const MAX_MATCH_DISTANCE = 86_400_000; // 24 hours in ms

export default function ProgressPhotosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const photos = usePhotoStore((s) => s.photos);
  const removePhoto = usePhotoStore((s) => s.removePhoto);
  const weightEntries = useWeightStore((s) => s.entries);
  const [viewingPhoto, setViewingPhoto] = useState<ProgressPhoto | null>(null);

  // Match each photo to the closest weight entry by timestamp (max 24h distance)
  const getWeightForPhoto = useMemo(() => {
    return (photoTimestamp: number): { weight: number; unit: string } | null => {
      if (weightEntries.length === 0) return null;
      let closest = weightEntries[0];
      let closestDiff = Math.abs(photoTimestamp - closest.timestamp);
      for (let i = 1; i < weightEntries.length; i++) {
        const diff = Math.abs(photoTimestamp - weightEntries[i].timestamp);
        if (diff < closestDiff) {
          closest = weightEntries[i];
          closestDiff = diff;
        }
      }
      if (closestDiff > MAX_MATCH_DISTANCE) return null;
      return { weight: closest.weight, unit: closest.unit };
    };
  }, [weightEntries]);

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

  const handleModalDelete = useCallback(() => {
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
  }, [viewingPhoto, removePhoto]);

  const keyExtractor = useCallback((item: ProgressPhoto) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: TILE_SIZE * 1.3,
      offset: Math.floor(index / NUM_COLS) * ROW_HEIGHT,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProgressPhoto }) => {
      const match = getWeightForPhoto(item.timestamp);
      return (
        <TouchableOpacity
          onPress={() => setViewingPhoto(item)}
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.8}
          accessibilityLabel={`Progress photo from ${item.date}${match ? `, ${match.weight.toFixed(1)} ${match.unit}` : ''}`}
          accessibilityRole="image"
          accessibilityHint="Tap to view full size, long press to delete"
        >
          <Image
            source={{ uri: item.uri }}
            style={styles.tile}
            contentFit="cover"
            transition={200}
            accessible={false}
          />
          <View style={styles.tileOverlay} accessible={false}>
            <Text style={styles.tileDate} numberOfLines={1}>{formatFullDate(item.date)}</Text>
            {match && (
              <Text style={styles.tileWeight} numberOfLines={1}>{match.weight.toFixed(1)} {match.unit}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleLongPress, getWeightForPhoto],
  );

  const viewingMatch = viewingPhoto ? getWeightForPhoto(viewingPhoto.timestamp) : null;

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
        <Text style={styles.headerTitle} accessibilityRole="header">Progress Photos</Text>
        <View style={styles.backBtn} accessible={false} />
      </View>

      <FlatList
        data={photos}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        numColumns={NUM_COLS}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon} accessible={false}>
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
        <View style={styles.modalBg} accessibilityViewIsModal>
          <TouchableOpacity
            style={[styles.modalClose, { top: insets.top + 10 }]}
            onPress={() => setViewingPhoto(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close photo"
            accessibilityRole="button"
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" accessible={false}>
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
                accessible={false}
              />
              <View style={styles.modalInfo}>
                <Text style={styles.modalDate}>{formatFullDate(viewingPhoto.date)}</Text>
                {viewingMatch && (
                  <Text style={styles.modalWeight}>{viewingMatch.weight.toFixed(1)} {viewingMatch.unit}</Text>
                )}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.modalDeleteBtn, { top: insets.top + 10 }]}
            onPress={handleModalDelete}
            accessibilityLabel="Delete photo"
            accessibilityRole="button"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
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
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const day = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(day) || m < 1 || m > 12) return dateKey;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[m - 1]} ${y}`;
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
    backgroundColor: Theme.colors.photoOverlay,
  },
  tileDate: {
    fontSize: 9,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tileWeight: {
    fontSize: 10,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    color: Theme.colors.textDark,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.button,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
  },

  // Full-screen modal
  modalBg: {
    flex: 1,
    backgroundColor: Theme.colors.modalBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
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
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.modalButtonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
