import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useUserStore } from '@/store/user-store';
import { recalculateTargets } from '@/utils/recalculate-targets';
import type { ActivityLevel } from '@/utils/calories';

const GENDER_OPTIONS = ['male', 'female'] as const;
const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'light', label: 'Lightly Active', desc: 'Light exercise 1–3 days/week' },
  { value: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3–5 days/week' },
  { value: 'active', label: 'Active', desc: 'Hard exercise 6–7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Very hard exercise, physical job' },
];

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };
const NAME_MAX_LENGTH = 50;

export default function EditProfileScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [name, setName] = useState(profile?.name ?? '');
  const [nameError, setNameError] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>(profile?.gender ?? 'male');
  const heightUnit: 'cm' | 'ft' = profile?.heightUnit ?? 'cm';
  const [heightInput, setHeightInput] = useState(() => {
    const cm = profile?.heightCm ?? 170;
    if (heightUnit === 'ft') {
      const totalInches = cm / 2.54;
      let ft = Math.floor(totalInches / 12);
      let inches = Math.round(totalInches % 12);
      if (inches === 12) { ft += 1; inches = 0; }
      return `${ft}'${inches}`;
    }
    return String(cm);
  });
  const [heightError, setHeightError] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activityLevel ?? 'moderate');

  // Note: heightUnit is NOT editable here — it's set via the Units screen
  const hasChanged = useMemo(() => {
    if (!profile) return false;
    if (name.trim() !== profile.name) return true;
    if (gender !== profile.gender) return true;
    if (activity !== profile.activityLevel) return true;
    if (heightUnit === 'ft') {
      const totalInches = profile.heightCm / 2.54;
      let ft = Math.floor(totalInches / 12);
      let inches = Math.round(totalInches % 12);
      if (inches === 12) { ft += 1; inches = 0; }
      if (heightInput !== `${ft}'${inches}`) return true;
    } else {
      if (heightInput !== String(profile.heightCm)) return true;
    }
    return false;
  }, [profile, name, gender, activity, heightInput, heightUnit]);

  const handleNameChange = useCallback((v: string) => {
    setName(v);
    setNameError('');
  }, []);

  const handleHeightChange = useCallback((v: string) => {
    setHeightInput(v);
    setHeightError('');
  }, []);

  const handleSave = useCallback(() => {
    if (!profile) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name cannot be empty');
      return;
    }
    setNameError('');

    let heightCm: number;
    if (heightUnit === 'ft') {
      const match = heightInput.match(/^(\d+)'(\d+)$/);
      if (match && match[1] && match[2]) {
        const ft = parseInt(match[1], 10);
        const inches = parseInt(match[2], 10);
        if (inches > 11) {
          setHeightError('Inches must be 0\u201311');
          return;
        }
        if (ft < 3 || ft > 8) {
          setHeightError('Height must be between 3\'0" and 8\'0"');
          return;
        }
        heightCm = Math.round(ft * 30.48 + inches * 2.54);
      } else {
        setHeightError("Enter as 5'9 (feet'inches)");
        return;
      }
    } else {
      const parsed = parseInt(heightInput, 10);
      if (isNaN(parsed) || parsed < 91 || parsed > 244) {
        setHeightError('Height must be 91\u2013244 cm');
        return;
      }
      heightCm = parsed;
    }

    setHeightError('');
    const patch = recalculateTargets(profile, {
      name: trimmedName,
      gender,
      heightCm,
      activityLevel: activity,
    });
    updateProfile(patch);
    router.back();
  }, [profile, name, gender, heightInput, heightUnit, activity, updateProfile, router]);

  const handleBack = useCallback(() => {
    if (hasChanged) {
      Alert.alert('Discard Changes?', 'Your profile changes will not be saved.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [hasChanged, router]);

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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.border} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={12} cy={7} r={4} stroke={Theme.colors.border} strokeWidth={2} />
          </Svg>
          <Text style={styles.emptyTitle}>No Profile</Text>
          <Text style={styles.emptySubtitle}>Complete onboarding to edit your profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
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

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            value={name}
            onChangeText={handleNameChange}
            placeholder="Your name"
            placeholderTextColor={Theme.colors.textMuted}
            maxLength={NAME_MAX_LENGTH}
            accessibilityLabel="Name"
            accessibilityRole="text"
            accessibilityState={nameError ? { invalid: true } : undefined}
          />
          {nameError !== '' && (
            <Text style={styles.inputErrorText}>{nameError}</Text>
          )}

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pillRow} accessibilityRole="radiogroup" accessibilityLabel="Gender">
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.pill, gender === g && styles.pillActive]}
                onPress={() => setGender(g)}
                accessibilityRole="radio"
                accessibilityLabel={g.charAt(0).toUpperCase() + g.slice(1)}
                accessibilityState={{ selected: gender === g }}
              >
                <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Height */}
          <Text style={styles.label}>
            {heightUnit === 'ft' ? 'Height (Feet & Inches)' : 'Height (cm)'}
          </Text>
          <TextInput
            style={[styles.input, heightError ? styles.inputError : null]}
            value={heightInput}
            onChangeText={handleHeightChange}
            keyboardType={heightUnit === 'ft' ? 'default' : 'number-pad'}
            placeholder={heightUnit === 'ft' ? "5'9" : '170'}
            placeholderTextColor={Theme.colors.textMuted}
            accessibilityLabel={heightUnit === 'ft' ? "Height in feet and inches, enter as 5'9" : 'Height in centimeters'}
            accessibilityRole="text"
            accessibilityState={heightError ? { invalid: true } : undefined}
          />
          {!heightError && (
            <Text style={styles.inputHint}>
              {heightUnit === 'ft' ? "Format: 5'9 (feet, then inches)" : 'Range: 91\u2013244 cm'}
            </Text>
          )}
          {heightError !== '' && (
            <Text style={styles.inputErrorText}>{heightError}</Text>
          )}

          {/* Activity Level */}
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.activityList} accessibilityRole="radiogroup" accessibilityLabel="Activity level">
            {ACTIVITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.activityRow, activity === opt.value && styles.activityRowActive]}
                onPress={() => setActivity(opt.value)}
                accessibilityRole="radio"
                accessibilityLabel={`${opt.label}, ${opt.desc}`}
                accessibilityState={{ selected: activity === opt.value }}
              >
                <View style={[styles.radio, activity === opt.value && styles.radioActive]} />
                <View style={styles.activityContent}>
                  <Text style={[styles.activityText, activity === opt.value && styles.activityTextActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.activityDesc}>{opt.desc}</Text>
                </View>
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
  saveTextDisabled: { opacity: 0.35 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  emptySubtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    textAlign: 'center',
  },

  label: {
    fontSize: 13, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 8, marginTop: 24,
  },
  input: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.small,
    borderWidth: 2, borderColor: Theme.colors.border, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textDark,
  },
  inputError: {
    borderColor: Theme.colors.urgentRed,
  },
  inputHint: {
    fontSize: 12, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    marginTop: 4, marginLeft: 4,
  },
  inputErrorText: {
    fontSize: 12, fontFamily: Theme.fonts.semiBold, color: Theme.colors.urgentRed,
    marginTop: 4, marginLeft: 4,
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
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
  activityTextActive: { color: Theme.colors.primary, fontFamily: Theme.fonts.extraBold },
  activityDesc: { fontSize: 12, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark, marginTop: 2 },
});
