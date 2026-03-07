import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Theme } from '@/constants/theme';

interface CardOptionProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onPress: () => void;
}

export function CardOption({ icon, label, active, onPress }: CardOptionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, active && styles.active]}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!active }}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  active: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryActive,
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  labelActive: {
    color: Theme.colors.textDark,
  },
});
