import { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/theme';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const CENTER = Math.floor(VISIBLE_ITEMS / 2);

export const PICKER_ITEM_HEIGHT = ITEM_HEIGHT;
export const PICKER_VISIBLE_ITEMS = VISIBLE_ITEMS;
export const PICKER_CENTER = CENTER;

interface ScrollPickerProps {
  items: (string | number)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width?: number;
  suffix?: string;
  hideLines?: boolean;
  accessibilityLabel?: string;
}

export function ScrollPicker({
  items,
  selectedIndex,
  onSelect,
  width = 80,
  suffix,
  hideLines,
  accessibilityLabel,
}: ScrollPickerProps) {
  const flatListRef = useRef<FlatList>(null);
  const hasScrolled = useRef(false);
  const lastHapticIndex = useRef(selectedIndex);

  useEffect(() => {
    if (!hasScrolled.current && flatListRef.current && selectedIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: false,
        });
      }, 100);
      hasScrolled.current = true;
    }
  }, [selectedIndex]);

  const getIndexFromOffset = useCallback((offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    return Math.max(0, Math.min(index, items.length - 1));
  }, [items.length]);

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = getIndexFromOffset(e.nativeEvent.contentOffset.y);
    if (index !== selectedIndex) {
      onSelect(index);
    }
  }, [getIndexFromOffset, selectedIndex, onSelect]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = getIndexFromOffset(e.nativeEvent.contentOffset.y);
    if (lastHapticIndex.current !== index) {
      lastHapticIndex.current = index;
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      onSelect(index);
    }
  }, [getIndexFromOffset, onSelect]);

  const renderItem = ({ item, index }: { item: string | number; index: number }) => {
    const distance = Math.abs(index - selectedIndex);
    const isSelected = distance === 0;
    const opacity = isSelected ? 1 : distance === 1 ? 0.4 : 0.15;

    return (
      <View style={[styles.item, { width }]}>
        <Text
          style={[
            styles.itemText,
            isSelected && styles.activeText,
            { opacity },
          ]}
          numberOfLines={1}>
          {item}
        </Text>
      </View>
    );
  };

  const listHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
  const contentPadding = { paddingVertical: ITEM_HEIGHT * CENTER };
  const listStyle = { height: listHeight };

  return (
    <View
      style={styles.outerWrap}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel ? `${accessibilityLabel}: ${items[selectedIndex] ?? ''}` : `${items[selectedIndex] ?? ''}`}
      accessibilityHint="Swipe up or down to change value"
    >
      <View style={[styles.container, { width, height: listHeight }]}>
        {!hideLines && (
          <>
            <View style={[styles.separatorLine, { top: ITEM_HEIGHT * CENTER }]} />
            <View style={[styles.separatorLine, { top: ITEM_HEIGHT * (CENTER + 1) }]} />
          </>
        )}
        <FlatList
          ref={flatListRef}
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item}-${index}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="normal"
          bounces={true}
          overScrollMode="always"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          contentContainerStyle={contentPadding}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          style={listStyle}
        />
      </View>
      {suffix && (
        <Text style={styles.suffix}>{suffix}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    position: 'relative',
  },
  separatorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Theme.colors.separator,
    zIndex: 10,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 22,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textDark,
  },
  activeText: {
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textDark,
  },
  suffix: {
    fontSize: 18,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textDark,
    marginLeft: 6,
  },
});
