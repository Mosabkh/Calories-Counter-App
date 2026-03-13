import { useState, useRef, memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, useWindowDimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
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
    label: 'Food database',
    iconPaths: ['M21 21L16.65 16.65M11 19A8 8 0 1 0 11 3A8 8 0 0 0 11 19Z'],
  },
  {
    label: 'Log weight',
    iconPaths: ['M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z'],
    circle: { cx: 12, cy: 5, r: 3 },
  },
  {
    label: 'Log exercise',
    iconPaths: [
      'M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1',
      'M15 14a5 5 0 0 0-7.584 2',
      'M9.964 6.825C8.019 7.977 9.5 13 8 15',
    ],
  },
  {
    label: 'Saved foods',
    iconPaths: ['M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  },
  {
    label: 'Scan food',
    iconPaths: ['M4 7V4h3M4 17v3h3M20 7V4h-3M20 17v3h-3M12 12h.01'],
  },
];

const ACTION_GRID_GAP = 14;
const ACTION_COLUMNS = 2;

const FAB_SIZE = 56;
const NOTCH_RADIUS = FAB_SIZE / 2 + 10; // curve radius around FAB
const BAR_CORNER = 24; // top corner radius of the bar
const BAR_TOP_PADDING = 10;
const ACTIVE_OPACITY = 0.7;
const SPRING_CONFIG = { damping: 14, stiffness: 200 } as const;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const CustomTabBar = memo(function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);
  const isNavigatingRef = useRef(false);
  const fabRotation = useSharedValue(0);
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const safeBottom = Math.max(bottomInset, 10);

  const barHeight = BAR_TOP_PADDING + 4 + 8 + 30 + 3 + 14 + 8 + safeBottom;

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

  const cardWidth = useMemo(() => {
    const gridPadding = 20 * 2; // paddingHorizontal on actionGrid
    const totalGap = ACTION_GRID_GAP;
    return (screenWidth - gridPadding - totalGap) / ACTION_COLUMNS;
  }, [screenWidth]);

  const fabPosition = useMemo(() => ({
    bottom: barHeight - FAB_SIZE / 2 + 2,
  }), [barHeight]);

  const dynamicStyles = useMemo(() => ({
    overlay: { paddingBottom: barHeight + FAB_SIZE / 2 + 20 } as const,
    card: { width: cardWidth } as const,
  }), [barHeight, cardWidth]);

  const toggleOverlay = useCallback(() => {
    setShowOverlay((prev) => {
      const next = !prev;
      fabRotation.value = withSpring(next ? 45 : 0, SPRING_CONFIG);
      return next;
    });
  }, [fabRotation]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }],
  }));

  const handleAction = useCallback(async (label: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    if (label === 'Scan food') {
      // Show tip before launching camera
      Alert.alert(
        'Quick Tip',
        'Place your meal on a flat surface with good lighting for best results.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => { isNavigatingRef.current = false; } },
          {
            text: 'Open Camera',
            onPress: async () => {
              try {
                const uri = await launchMealCamera();
                if (uri) {
                  toggleOverlay();
                  router.push({ pathname: '/log-meal', params: { imageUri: uri } });
                }
              } catch {
                // Camera failed — overlay stays open, user can retry
              }
              isNavigatingRef.current = false;
            },
          },
        ],
      );
      return;
    } else {
      toggleOverlay();
      if (label === 'Food database') {
        router.push('/food-search');
      } else if (label === 'Log weight') {
        router.push('/log-weight');
      } else if (label === 'Log exercise') {
        router.push('/log-exercise');
      } else if (label === 'Saved foods') {
        router.push('/saved-foods');
      }
    }

    isNavigatingRef.current = false;
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
        activeOpacity={ACTIVE_OPACITY}
        accessibilityLabel={`${label} tab`}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}>
        <View style={styles.iconWrap}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d={icon.paths[0]}
              stroke={isFocused ? Theme.colors.primaryHover : Theme.colors.textMuted}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {icon.extraPath && (
              <Path
                d={icon.extraPath}
                stroke={isFocused ? Theme.colors.primaryHover : Theme.colors.textMuted}
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
          style={styles.overlayBg}
          accessibilityViewIsModal={true}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={toggleOverlay}
            accessible={true}
            accessibilityLabel="Close menu"
            accessibilityRole="button"
          />
          <View style={[styles.actionGrid, dynamicStyles.overlay]}>
            {ACTION_ITEMS.map((item, i) => (
              <AnimatedTouchable
                key={item.label}
                entering={FadeIn.delay(i * 40).duration(200).withInitialValues({ transform: [{ translateY: 24 }] })}
                style={[styles.actionCard, dynamicStyles.card]}
                activeOpacity={ACTIVE_OPACITY}
                accessibilityLabel={item.label}
                accessibilityRole="button"
                onPress={() => handleAction(item.label)}
              >
                <View style={styles.actionIconCircle}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" accessible={false}>
                    {item.iconPaths.map((d, pi) => (
                      <Path
                        key={pi}
                        d={d}
                        stroke={Theme.colors.primaryHover}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    {'circle' in item && item.circle && (
                      <Circle
                        cx={item.circle.cx}
                        cy={item.circle.cy}
                        r={item.circle.r}
                        stroke={Theme.colors.primaryHover}
                        strokeWidth={2.2}
                        fill="none"
                      />
                    )}
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
        <Animated.View style={[styles.fabWrap, fabPosition, fabAnimatedStyle, showOverlay && styles.fabActive]}>
          <TouchableOpacity
            onPress={toggleOverlay}
            activeOpacity={ACTIVE_OPACITY}
            style={styles.fabInner}
            accessibilityLabel={showOverlay ? 'Close menu' : 'Add item'}
            accessibilityRole="button"
            accessibilityState={{ expanded: showOverlay }}
            accessibilityHint={showOverlay ? 'Closes the menu' : 'Opens menu with food logging options'}>
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
        <View style={[styles.tabRow, { paddingBottom: safeBottom }]} accessibilityRole="tablist">
          {renderTab(state.routes[0], 0)}
          <View style={styles.fabSpacer} accessible={false} />
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
    fontSize: 12,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textMuted,
    lineHeight: 14,
  },
  tabLabelActive: {
    color: Theme.colors.primaryHover,
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
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: ACTION_GRID_GAP,
  },
  actionCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.card,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 12,
    shadowColor: Theme.colors.textDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.accentBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    textAlign: 'center',
  },
});
