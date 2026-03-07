import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

interface UnitToggleProps {
  options: [string, string];
  selected: string;
  onSelect: (option: string) => void;
}

export function UnitToggle({ options, selected, onSelect }: UnitToggleProps) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel="Unit selection">
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => onSelect(option)}
          style={[styles.option, selected === option && styles.active]}
          activeOpacity={0.7}
          accessibilityLabel={option}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === option }}>
          <Text style={[styles.text, selected === option && styles.activeText]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: 25,
    alignSelf: 'center',
    padding: 4,
    marginVertical: 10,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  active: {
    backgroundColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  text: {
    fontFamily: Theme.fonts.extraBold,
    fontSize: 14,
    color: Theme.colors.textMuted,
  },
  activeText: {
    color: Theme.colors.white,
  },
});
