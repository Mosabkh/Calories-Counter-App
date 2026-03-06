import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

interface CardOptionProps {
  icon: string;
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
      <Text style={styles.icon} accessible={false}>{icon}</Text>
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
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  label: {
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  labelActive: {
    color: Theme.colors.textDark,
  },
});
