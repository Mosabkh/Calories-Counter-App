import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useUserStore } from '@/store/user-store';
import { recalculateTargets } from '@/utils/recalculate-targets';
import type { ActivityLevel } from '@/utils/calories';

const GENDER_OPTIONS = ['male', 'female'] as const;
const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Lightly Active' },
  { value: 'moderate', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [name, setName] = useState(profile?.name ?? '');
  const [gender, setGender] = useState<'male' | 'female'>(profile?.gender ?? 'male');
  const [heightCm, setHeightCm] = useState(String(profile?.heightCm ?? 170));
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activityLevel ?? 'moderate');

  const handleSave = useCallback(() => {
    if (!profile) return;
    const heightVal = parseInt(heightCm, 10) || profile.heightCm;
    const patch = recalculateTargets(profile, {
      name: name.trim(),
      gender,
      heightCm: heightVal,
      activityLevel: activity,
    });
    updateProfile(patch);
    router.back();
  }, [profile, name, gender, heightCm, activity, updateProfile, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
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

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Theme.colors.textMuted}
          />

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pillRow}>
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.pill, gender === g && styles.pillActive]}
                onPress={() => setGender(g)}
                accessibilityRole="radio"
                accessibilityState={{ selected: gender === g }}
              >
                <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Height */}
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="number-pad"
            placeholder="170"
            placeholderTextColor={Theme.colors.textMuted}
          />

          {/* Activity Level */}
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.activityList}>
            {ACTIVITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.activityRow, activity === opt.value && styles.activityRowActive]}
                onPress={() => setActivity(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: activity === opt.value }}
              >
                <View style={[styles.radio, activity === opt.value && styles.radioActive]} />
                <Text style={[styles.activityText, activity === opt.value && styles.activityTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  flex: { flex: 1 },

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
  input: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.small,
    borderWidth: 2, borderColor: Theme.colors.border, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textDark,
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

  activityList: { gap: 8 },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.small,
    borderWidth: 2, borderColor: Theme.colors.border, paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activityRowActive: { borderColor: Theme.colors.primary },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Theme.colors.border,
  },
  radioActive: {
    borderColor: Theme.colors.primary, backgroundColor: Theme.colors.primary,
  },
  activityText: { fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
  activityTextActive: { color: Theme.colors.primary },
});
