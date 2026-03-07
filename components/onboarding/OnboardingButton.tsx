import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '@/constants/theme';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function OnboardingButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
  textStyle,
}: OnboardingButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'text' && styles.text,
        disabled && variant === 'primary' && styles.primaryDisabled,
        style,
      ]}
      activeOpacity={0.8}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}>
      <Text
        style={[
          styles.baseText,
          variant === 'primary' && styles.primaryText,
          variant === 'outline' && styles.outlineText,
          variant === 'text' && styles.textText,
          textStyle,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: 16,
    borderRadius: Theme.borderRadius.button,
    width: '100%',
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Theme.colors.primary,
  },
  primaryDisabled: {
    opacity: 0.45,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Theme.colors.border,
  },
  text: {
    backgroundColor: 'transparent',
    padding: 12,
    marginTop: 5,
  },
  baseText: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
  },
  primaryText: {
    color: Theme.colors.white,
  },
  outlineText: {
    color: Theme.colors.textDark,
  },
  textText: {
    color: Theme.colors.textMuted,
    fontSize: 15,
    fontFamily: Theme.fonts.bold,
  },
});
