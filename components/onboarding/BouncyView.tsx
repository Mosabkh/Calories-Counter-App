import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function BouncyView({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(28);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
