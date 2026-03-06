import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TAB_ICONS: Record<string, { viewBox: string; paths: string[] }> = {
  index: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    ],
  },
  progress: {
    viewBox: '0 0 24 24',
    paths: ['M22 12L18 12L15 21L9 3L6 12L2 12'],
  },
  profile: {
    viewBox: '0 0 24 24',
    paths: [
      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
    ],
  },
};

const ACTION_ITEMS = [
  {
    label: 'Food database',
    iconPath: 'M21 21L16.65 16.65M11 19A8 8 0 1 0 11 3A8 8 0 0 0 11 19Z',
  },
  {
    label: 'Log exercise',
    iconPath: 'M12 20h9M16.5 14c-1.5-1.5-3-3-3-3l-2.5 2.5',
  },
  {
    label: 'Scan food',
    iconPath: 'M4 7V4h3M4 17v3h3M20 7V4h-3M20 17v3h-3',
  },
  {
    label: 'Saved Foods',
    iconPath: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  },
];

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const fabRotation = useSharedValue(0);

  const toggleOverlay = () => {
    setShowOverlay((prev) => {
      const next = !prev;
      fabRotation.value = withSpring(next ? 45 : 0, { damping: 15 });
      return next;
    });
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }],
  }));

  const tabNames = ['index', 'progress', 'profile'];

  return (
    <>
      {showOverlay && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.overlayBg}>
          <Pressable style={StyleSheet.absoluteFill} onPress={toggleOverlay} />
          <Animated.View
            entering={SlideInDown.springify().damping(18)}
            style={styles.actionGrid}>
            {ACTION_ITEMS.map((item) => (
              <TouchableOpacity key={item.label} style={styles.actionBtn} activeOpacity={0.8}>
                <View style={styles.actionBtnIcon}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                    <Path
                      d={item.iconPath}
                      stroke={Theme.colors.textDark}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.actionBtnText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Animated.View>
      )}

      <View style={[styles.container, showOverlay && styles.containerOnTop]}>
        <Svg
          width={SCREEN_WIDTH}
          height={100}
          viewBox="0 0 320 100"
          preserveAspectRatio="none"
          style={styles.navBg}>
          <Path
            d="M 0,30 C 0,15 15,0 30,0 L 195,0 C 215,0 215,55 257.5,55 C 300,55 300,0 320,0 L 320,100 L 0,100 Z"
            fill={Theme.colors.surface}
          />
        </Svg>

        <View style={styles.navItems}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const tabName = tabNames[index] || route.name;
            const label = route.name === 'index' ? 'Home' : route.name.charAt(0).toUpperCase() + route.name.slice(1);

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  if (!isFocused) {
                    navigation.navigate(route.name);
                  }
                }}
                style={styles.navItem}
                activeOpacity={0.7}>
                <View style={styles.navIconContainer}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Path
                      d={TAB_ICONS[tabName]?.paths[0] || ''}
                      stroke={isFocused ? Theme.colors.primary : Theme.colors.textMuted}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {tabName === 'profile' && (
                      <Path
                        d="M12 11A4 4 0 1 0 12 3A4 4 0 0 0 12 11Z"
                        stroke={isFocused ? Theme.colors.primary : Theme.colors.textMuted}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {tabName === 'index' && (
                      <Path
                        d="M9 22L9 12L15 12L15 22"
                        stroke={isFocused ? Theme.colors.primary : Theme.colors.textMuted}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </Svg>
                </View>
                <Text style={[styles.navLabel, isFocused && styles.navLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Animated.View style={[styles.fab, fabAnimatedStyle, showOverlay && styles.fabActive]}>
          <TouchableOpacity onPress={toggleOverlay} activeOpacity={0.8} style={styles.fabInner}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Line
                x1={12} y1={5} x2={12} y2={19}
                stroke={showOverlay ? Theme.colors.textDark : '#FFFFFF'}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <Line
                x1={5} y1={12} x2={19} y2={12}
                stroke={showOverlay ? Theme.colors.textDark : '#FFFFFF'}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 10,
  },
  containerOnTop: {
    zIndex: 30,
  },
  navBg: {
    position: 'absolute',
    bottom: -5,
    left: 0,
  },
  navItems: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '75%',
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navIconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
  },
  navLabelActive: {
    color: Theme.colors.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 35,
    right: 25,
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: Theme.colors.textDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.textDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 3,
  },
  fabActive: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
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
    backgroundColor: 'rgba(84, 49, 40, 0.6)',
    zIndex: 20,
    justifyContent: 'flex-end',
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionBtn: {
    width: '47%',
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 15,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
  actionBtnIcon: {
    width: 32,
    height: 32,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    textAlign: 'center',
  },
});
