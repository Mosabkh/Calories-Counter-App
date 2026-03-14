import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useUserStore } from '@/store/user-store';
import { useWeightStore } from '@/store/weight-store';
import { recalculateTargets } from '@/utils/recalculate-targets';

const WEIGHT_UNITS = ['kg', 'lb'] as const;
type WeightUnit = (typeof WEIGHT_UNITS)[number];

const HEIGHT_UNITS = ['cm', 'ft'] as const;
type HeightUnit = (typeof HEIGHT_UNITS)[number];

const KG_TO_LB = 2.20462;
const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

/** Convert cm to ft′in″ display string */
function cmToFtIn(cm: number): string {
  const totalInches = cm / 2.54;
  let ft = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  // Handle rounding to 12 inches
  if (inches === 12) {
    ft += 1;
    inches = 0;
  }
  return `${ft}'${inches}"`;
}

export default function UnitsScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const convertAll = useWeightStore((s) => s.convertAll);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile?.weightUnit ?? 'kg');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(profile?.heightUnit ?? 'cm');

  const hasChanged = useMemo(
    () => profile != null && (weightUnit !== profile.weightUnit || heightUnit !== profile.heightUnit),
    [profile, weightUnit, heightUnit],
  );

  const handleSave = useCallback(() => {
    if (!profile || !hasChanged) return;

    const weightChanged = weightUnit !== profile.weightUnit;

    if (weightChanged) {
      const convert = weightUnit === 'lb'
        ? (v: number) => Math.round(v * KG_TO_LB * 10) / 10
        : (v: number) => Math.round((v / KG_TO_LB) * 10) / 10;

      const convertedPatch = {
        weightUnit,
        heightUnit,
        startWeight: convert(profile.startWeight),
        targetWeight: convert(profile.targetWeight),
      };
      // Recalculate BMR/TDEE/macros with the converted weights
      const recalculated = recalculateTargets(profile, convertedPatch);
      updateProfile(recalculated);
      convertAll(weightUnit, convert);
    } else {
      updateProfile({ heightUnit });
    }

    router.back();
  }, [profile, hasChanged, weightUnit, heightUnit, updateProfile, convertAll, router]);

  const handleBack = useCallback(() => {
    if (hasChanged) {
      Alert.alert('Discard Changes?', 'Your unit changes will not be saved.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [hasChanged, router]);

  // Preview: show current height in selected unit
  const heightPreview = useMemo(() => {
    if (!profile) return '';
    return heightUnit === 'cm'
      ? `${profile.heightCm} cm`
      : cmToFtIn(profile.heightCm);
  }, [profile, heightUnit]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={HIT_SLOP}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={styles.backBtn}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Units & Formatting</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Profile</Text>
          <Text style={styles.emptySubtitle}>Complete onboarding to configure units.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={HIT_SLOP}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Units & Formatting</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanged}
          hitSlop={HIT_SLOP}
          accessibilityLabel="Save"
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasChanged }}
          style={styles.backBtn}
        >
          <Text style={[styles.saveText, !hasChanged && styles.saveTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Weight unit */}
        <Text style={styles.label}>Weight Unit</Text>
        <View style={styles.pillRow} accessibilityRole="radiogroup" accessibilityLabel="Weight unit">
          {WEIGHT_UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.pill, weightUnit === u && styles.pillActive]}
              onPress={() => setWeightUnit(u)}
              accessibilityRole="radio"
              accessibilityLabel={u === 'kg' ? 'Kilograms' : 'Pounds'}
              accessibilityState={{ selected: weightUnit === u }}
            >
              <Text style={[styles.pillText, weightUnit === u && styles.pillTextActive]}>
                {u === 'kg' ? 'Kilograms' : 'Pounds'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Height unit */}
        <Text style={styles.label}>Height Unit</Text>
        <View style={styles.pillRow} accessibilityRole="radiogroup" accessibilityLabel="Height unit">
          {HEIGHT_UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.pill, heightUnit === u && styles.pillActive]}
              onPress={() => setHeightUnit(u)}
              accessibilityRole="radio"
              accessibilityLabel={u === 'cm' ? 'Centimeters' : 'Feet and inches'}
              accessibilityState={{ selected: heightUnit === u }}
            >
              <Text style={[styles.pillText, heightUnit === u && styles.pillTextActive]}>
                {u === 'cm' ? 'Centimeters' : 'Feet & Inches'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {profile && heightUnit !== profile.heightUnit && (
          <View style={styles.previewCard}>
            <Text style={styles.previewText}>
              Your height will display as {heightPreview}
            </Text>
          </View>
        )}

        {profile && weightUnit !== profile.weightUnit && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Your stored weights and all logged entries will be converted when you save.
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
  saveTextDisabled: { opacity: 0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  label: {
    fontSize: 13, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 8, marginTop: 24,
  },

  pillRow: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1, paddingVertical: 14, borderRadius: Theme.borderRadius.button,
    borderWidth: 2, borderColor: Theme.colors.border, alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  pillActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  pillText: { fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
  pillTextActive: { color: Theme.colors.white },

  previewCard: {
    backgroundColor: Theme.colors.surfaceAlt, borderRadius: Theme.borderRadius.card,
    padding: 16, marginTop: 16,
  },
  previewText: {
    fontSize: 13, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark,
    textAlign: 'center',
  },

  infoCard: {
    backgroundColor: Theme.colors.warningLight, borderRadius: Theme.borderRadius.card,
    padding: 16, marginTop: 16,
  },
  infoText: {
    fontSize: 13, fontFamily: Theme.fonts.semiBold, color: Theme.colors.warningDark,
    textAlign: 'center',
  },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    textAlign: 'center',
  },
});
