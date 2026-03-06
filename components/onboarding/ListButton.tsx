import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Theme } from '@/constants/theme';

interface ListButtonProps {
  label: string;
  icon?: string;
  active?: boolean;
  onPress: () => void;
  rightContent?: React.ReactNode;
}

export function ListButton({ label, icon, active, onPress, rightContent }: ListButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, active && styles.active]}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!active }}>
      {icon && <Text style={styles.icon} accessible={false}>{icon}</Text>}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      {rightContent && <View style={styles.right}>{rightContent}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.card,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  active: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryActive,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
    flex: 1,
  },
  labelActive: {
    color: Theme.colors.textDark,
  },
  right: {
    marginLeft: 'auto',
  },
});
