import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { Theme } from '@/constants/theme';
import { usePhotoStore, type ProgressPhoto } from '@/store/photo-store';
import { toDateKey } from '@/utils/date';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 3;
const NUM_COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - 40 - GRID_GAP * (NUM_COLS - 1)) / NUM_COLS;

export default function ProgressPhotosScreen() {
  const router = useRouter();
  const photos = usePhotoStore((s) => s.photos);
  const addPhoto = usePhotoStore((s) => s.addPhoto);
  const removePhoto = usePhotoStore((s) => s.removePhoto);

  const handleAdd = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const photo: ProgressPhoto = {
      id: Crypto.randomUUID(),
      date: toDateKey(),
      timestamp: Date.now(),
      uri: result.assets[0].uri,
    };
    addPhoto(photo);
  }, [addPhoto]);

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
    ({ item }: { item: ProgressPhoto }) => (
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
        accessibilityLabel={`Progress photo from ${item.date}`}
        accessibilityRole="image"
        accessibilityHint="Long press to delete"
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.tile}
          contentFit="cover"
          transition={200}
        />
        <Text style={styles.tileDate}>{formatDate(item.date)}</Text>
      </TouchableOpacity>
    ),
    [handleLongPress],
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
        <TouchableOpacity
          onPress={handleAdd}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Add photo"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
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
              Track your progress visually by adding photos over time
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAdd}
              activeOpacity={0.7}
              accessibilityLabel="Add your first photo"
              accessibilityRole="button"
            >
              <Text style={styles.addBtnText}>+ Add Photo</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function formatDate(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
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
  tileDate: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    fontSize: 10,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
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
  addBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.button,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 24,
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
  },
});
