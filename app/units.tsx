import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useUserStore } from '@/store/user-store';

type WeightUnit = 'kg' | 'lb';

const KG_TO_LB = 2.20462;

export default function UnitsScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile?.weightUnit ?? 'kg');

  const handleSave = useCallback(() => {
    if (!profile) return;

    // If unit actually changed, convert stored weight values
    if (weightUnit !== profile.weightUnit) {
      const convert = weightUnit === 'lb'
        ? (v: number) => Math.round(v * KG_TO_LB * 10) / 10
        : (v: number) => Math.round((v / KG_TO_LB) * 10) / 10;

      updateProfile({
        weightUnit,
        startWeight: convert(profile.startWeight),
        targetWeight: convert(profile.targetWeight),
      });
    }
    router.back();
  }, [profile, weightUnit, updateProfile, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Units & Formatting</Text>
        <TouchableOpacity
          onPress={handleSave}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Save"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Weight unit */}
        <Text style={styles.label}>Weight Unit</Text>
        <View style={styles.pillRow}>
          {(['kg', 'lb'] as const).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.pill, weightUnit === u && styles.pillActive]}
              onPress={() => setWeightUnit(u)}
              accessibilityRole="radio"
              accessibilityState={{ selected: weightUnit === u }}
            >
              <Text style={[styles.pillText, weightUnit === u && styles.pillTextActive]}>
                {u === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {weightUnit !== profile?.weightUnit && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Your stored weights will be converted when you save.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  saveText: { fontSize: 15, fontFamily: Theme.fonts.extraBold, color: Theme.colors.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  label: {
    fontSize: 13, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textMuted,
    marginBottom: 8, marginTop: 24,
  },

  pillRow: { gap: 10 },
  pill: {
    paddingVertical: 16, borderRadius: Theme.borderRadius.button,
    borderWidth: 2, borderColor: Theme.colors.border, alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  pillActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  pillText: { fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
  pillTextActive: { color: Theme.colors.white },

  infoCard: {
    backgroundColor: Theme.colors.primaryActive, borderRadius: Theme.borderRadius.card,
    padding: 14, marginTop: 20,
  },
  infoText: {
    fontSize: 13, fontFamily: Theme.fonts.semiBold, color: Theme.colors.primary,
    textAlign: 'center',
  },
});
