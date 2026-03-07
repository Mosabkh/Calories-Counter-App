import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Theme } from '@/constants/theme';

interface ListButtonProps {
  label: string;
  desc?: string;
  icon?: React.ReactNode;
  active?: boolean;
  onPress: () => void;
  rightContent?: React.ReactNode;
}

export function ListButton({ label, desc, icon, active, onPress, rightContent }: ListButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, active && styles.active]}
      activeOpacity={0.7}
      accessibilityLabel={desc ? `${label}, ${desc}` : label}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!active }}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <View style={styles.textWrap}>
        <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
        {desc && <Text style={styles.desc}>{desc}</Text>}
      </View>
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
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
  },
  desc: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: Theme.colors.textDark,
  },
  right: {
    marginLeft: 'auto',
  },
});
