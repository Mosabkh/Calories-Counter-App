import { useState, memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Theme } from '@/constants/theme';
import { launchMealCamera } from '@/utils/camera';

type TabBarProps = BottomTabBarProps;

const TAB_ICONS = {
  index: {
    paths: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    extraPath: 'M9 22L9 12L15 12L15 22',
  },
  progress: {
    paths: ['M22 12L18 12L15 21L9 3L6 12L2 12'],
    extraPath: null,
  },
} as const;

type TabName = keyof typeof TAB_ICONS;

const TAB_NAMES: TabName[] = ['index', 'progress'];
const TAB_LABELS: Record<TabName, string> = { index: 'Home', progress: 'Progress' };

const isValidTabName = (name: string): name is TabName => name in TAB_ICONS;

const ACTION_ITEMS = [
  {
    label: 'Scan food',
    iconPath: 'M4 7V4h3M4 17v3h3M20 7V4h-3M20 17v3h-3',
  },
  {
    label: 'Food database',
    iconPath: 'M21 21L16.65 16.65M11 19A8 8 0 1 0 11 3A8 8 0 0 0 11 19Z',
  },
  {
    label: 'Log exercise',
    iconPath: 'M18 6L6 18M6 8V6h2M18 16v2h-2',
  },
  {
    label: 'Saved foods',
    iconPath: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  },
];

const FAB_SIZE = 56;
const NOTCH_RADIUS = FAB_SIZE / 2 + 10; // curve radius around FAB
const BAR_CORNER = 24; // top corner radius of the bar
const BAR_TOP_PADDING = 10;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const CustomTabBar = memo(function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);
  const fabRotation = useSharedValue(0);
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const safeBottom = Math.max(bottomInset, 10);

  const barHeight = BAR_TOP_PADDING + 4 + 8 + 28 + 3 + 14 + 8 + safeBottom; // paddingTop + tabItem padding + icon + gap + label + padding + safe area

  const barPath = useMemo(() => {
    const w = screenWidth;
    const h = barHeight;
    const cx = w / 2; // center x
    const r = NOTCH_RADIUS;
    const cr = BAR_CORNER;
    const spread = r + 14; // wider mouth for gentle entry
    const depth = r - 4;   // how deep the notch dips
    return [
      `M 0 ${cr}`,
      `Q 0 0 ${cr} 0`,                                        // top-left rounded corner
      `L ${cx - spread} 0`,                                    // straight to notch entry
      `C ${cx - spread + 16} 0 ${cx - r + 4} ${depth} ${cx} ${depth}`, // left: gentle S-curve into notch
      `C ${cx + r - 4} ${depth} ${cx + spread - 16} 0 ${cx + spread} 0`, // right: gentle S-curve out
      `L ${w - cr} 0`,                                        // straight to top-right corner
      `Q ${w} 0 ${w} ${cr}`,                                  // top-right rounded corner
      `L ${w} ${h}`,                                           // down right side
      `L 0 ${h}`,                                              // across bottom
      `Z`,
    ].join(' ');
  }, [screenWidth, barHeight]);

  const dynamicStyles = useMemo(() => ({
    overlay: { paddingBottom: 70 + safeBottom } as const,
  }), [safeBottom]);

  const toggleOverlay = useCallback(() => {
    setShowOverlay((prev) => {
      const next = !prev;
      fabRotation.value = withSpring(next ? 45 : 0, { damping: 12, stiffness: 180 });
      return next;
    });
  }, [fabRotation]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }],
  }));

  const handleAction = useCallback(async (label: string) => {
    toggleOverlay();
    if (label === 'Food database') {
      router.push('/food-search');
    } else if (label === 'Scan food') {
      const uri = await launchMealCamera();
      if (uri) {
        router.push({ pathname: '/log-meal', params: { imageUri: uri } });
      }
    } else if (label === 'Log exercise') {
      router.push('/log-exercise');
    } else if (label === 'Saved foods') {
      router.push('/saved-foods');
    }
  }, [toggleOverlay, router]);

  const renderTab = useCallback((route: (typeof state.routes)[number], index: number) => {
    const isFocused = state.index === index;
    const rawName = TAB_NAMES[index] ?? route.name;
    const tabName: TabName = isValidTabName(rawName) ? rawName : 'index';
    const icon = TAB_ICONS[tabName];
    const label = TAB_LABELS[tabName] ?? route.name;

    return (
      <TouchableOpacity
        key={route.key}
        onPress={() => {
          if (!isFocused) navigation.navigate(route.name);
        }}
        style={styles.tabItem}
        activeOpacity={0.7}
        accessibilityLabel={`${label} tab`}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}>
        <View style={styles.iconWrap}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d={icon.paths[0]}
              stroke={isFocused ? Theme.colors.primary : Theme.colors.textMuted}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {icon.extraPath && (
              <Path
                d={icon.extraPath}
                stroke={isFocused ? Theme.colors.primary : Theme.colors.textMuted}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }, [state, navigation]);

  return (
    <>
      {showOverlay && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.overlayBg}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={toggleOverlay}
            accessible={true}
            accessibilityLabel="Close menu"
            accessibilityRole="button"
          />
          <View style={[styles.actionColumn, dynamicStyles.overlay]}>
            {ACTION_ITEMS.map((item, i) => (
              <AnimatedTouchable
                key={item.label}
                entering={FadeIn.delay(i * 50).duration(200).withInitialValues({ transform: [{ translateY: 20 }] })}
                style={styles.actionRow}
                activeOpacity={0.8}
                accessibilityLabel={item.label}
                accessibilityRole="button"
                onPress={() => handleAction(item.label)}
              >
                <View style={styles.actionIcon}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
                    <Path
                      d={item.iconPath}
                      stroke={Theme.colors.white}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.actionLabel}>{item.label}</Text>
              </AnimatedTouchable>
            ))}
          </View>
        </Animated.View>
      )}

      <View style={[styles.container, showOverlay && styles.containerOnTop]}>
        {/* FAB positioned inside the notch curve */}
        <Animated.View style={[styles.fabWrap, { bottom: barHeight - FAB_SIZE / 2 + 2 }, fabAnimatedStyle, showOverlay && styles.fabActive]}>
          <TouchableOpacity
            onPress={toggleOverlay}
            activeOpacity={0.8}
            style={styles.fabInner}
            accessibilityLabel={showOverlay ? 'Close menu' : 'Add item'}
            accessibilityRole="button"
            accessibilityHint="Opens menu with food logging options">
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Line
                x1={12} y1={5} x2={12} y2={19}
                stroke={showOverlay ? Theme.colors.textDark : Theme.colors.white}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <Line
                x1={5} y1={12} x2={19} y2={12}
                stroke={showOverlay ? Theme.colors.textDark : Theme.colors.white}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </Animated.View>

        {/* SVG bar background with notch */}
        <Svg
          width={screenWidth}
          height={barHeight + NOTCH_RADIUS}
          style={styles.barSvg}
          accessible={false}
        >
          <Path
            d={barPath}
            fill={Theme.colors.surface}
            translateY={NOTCH_RADIUS}
          />
        </Svg>

        {/* Tab content overlaid on the SVG bar */}
        <View style={[styles.tabRow, { paddingBottom: safeBottom }]}>
          {renderTab(state.routes[0], 0)}
          <View style={styles.fabSpacer} />
          {renderTab(state.routes[1], 1)}
        </View>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    shadowColor: Theme.colors.textDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 10,
  },
  containerOnTop: {
    zIndex: 30,
  },
  barSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: BAR_TOP_PADDING + 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  iconWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textMuted,
  },
  tabLabelActive: {
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.extraBold,
  },

  // FAB — positioned to sit inside the notch curve
  fabWrap: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  fabActive: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    shadowColor: Theme.colors.textDark,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 8,
  },
  fabSpacer: {
    width: FAB_SIZE + 16,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Overlay
  overlayBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Theme.colors.overlay,
    zIndex: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionColumn: {
    alignItems: 'center',
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.textDark,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 22,
    gap: 14,
    width: 200,
    shadowColor: Theme.colors.textDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  actionIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
});
