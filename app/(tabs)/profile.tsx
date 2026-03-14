import { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useUserStore } from '@/store/user-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { restorePurchases } from '@/utils/revenue-cat';
import { signOut } from '@/utils/auth';

const SETTINGS = {
  subscription: {
    iconPath: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2',
    label: 'Subscription',
    badge: 'FREE',
  },
  goals: {
    iconPath: 'M12 22A10 10 0 1 0 12 2A10 10 0 0 0 12 22Z',
    label: 'My Goals',
    extraPaths: ['M12 18A6 6 0 1 0 12 6A6 6 0 0 0 12 18Z', 'M12 14A2 2 0 1 0 12 10A2 2 0 0 0 12 14Z'],
  },
  reminders: {
    iconPath: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
    label: 'Reminders',
    extraPaths: ['M13.73 21a2 2 0 0 1-3.46 0'],
  },
  units: {
    iconPath: 'M3 3h18v18H3V3z',
    label: 'Units & Formatting',
    extraPaths: ['M3 9h18', 'M9 21V9'],
  },
  help: {
    iconPath: 'M12 22A10 10 0 1 0 12 2A10 10 0 0 0 12 22Z',
    label: 'Help Center',
    extraPaths: ['M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h0.01'],
  },
};

interface SettingItemProps {
  iconPath: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  extraPaths?: readonly string[];
  isLast?: boolean;
  onPress?: () => void;
}

const BADGE_STYLES = {
  success: StyleSheet.create({ bg: { backgroundColor: Theme.colors.success } }),
  textDark: StyleSheet.create({ bg: { backgroundColor: Theme.colors.textDark } }),
};

const SettingItem = memo(function SettingItem({ iconPath, label, badge, badgeColor, extraPaths, isLast, onPress }: SettingItemProps): React.ReactElement {
  const badgeStyle = badgeColor === Theme.colors.success ? BADGE_STYLES.success.bg : BADGE_STYLES.textDark.bg;

  return (
    <TouchableOpacity
      style={[styles.settingItem, isLast && styles.settingItemLast]}
      activeOpacity={0.7}
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      accessibilityRole="button"
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path d={iconPath} stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {extraPaths?.map((p) => (
              <Path key={p} d={p} stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </Svg>
        </View>
        <Text style={styles.settingName}>{label}</Text>
        {badge && (
          <View style={[styles.settingBadge, badgeStyle]}>
            <Text style={styles.settingBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.chevron} accessible={false}>
        <Path d="M9 18L15 12L9 6" stroke={Theme.colors.textDark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </TouchableOpacity>
  );
});

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };
const AVATAR_SIZE = 65;

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const authUser = useUserStore((s) => s.auth.user);
  const subPlan = useSubscriptionStore((s) => s.plan);
  const subIsActive = useSubscriptionStore((s) => s.isActive);
  const subExpiresAt = useSubscriptionStore((s) => s.expiresAt);

  const name = profile?.name || 'User';
  const email = authUser?.email || 'No email linked';
  const hasEmail = !!authUser?.email;

  const { subscriptionBadge, badgeColor } = useMemo(() => {
    if (subIsActive) {
      if (subExpiresAt) {
        const d = new Date(subExpiresAt);
        if (!isNaN(d.getTime()) && d.getTime() < Date.now()) {
          return { subscriptionBadge: 'EXPIRED', badgeColor: Theme.colors.textDark };
        }
      }
      return {
        subscriptionBadge: subPlan === 'yearly' ? 'YEARLY' : 'MONTHLY',
        badgeColor: Theme.colors.success,
      };
    }
    return { subscriptionBadge: 'FREE', badgeColor: Theme.colors.textDark };
  }, [subIsActive, subPlan, subExpiresAt]);

  const handleRestore = useCallback(async () => {
    try {
      const restored = await restorePurchases();
      Alert.alert(
        restored ? 'Restored!' : 'Nothing to Restore',
        restored
          ? 'Your subscription has been restored.'
          : 'No previous purchases found.',
      );
    } catch {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/');
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  }, [router]);

  const handleEmailLink = useCallback(() => {
    Alert.alert('Coming Soon', 'Email linking will be available when cloud accounts are enabled.');
  }, []);

  const handleStartOver = useCallback(() => {
    Alert.alert('Start Over', 'This will reset your onboarding data so you can set up a new profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start Over',
        style: 'destructive',
        onPress: () => {
          useOnboardingStore.getState().reset();
          router.replace('/onboarding');
        },
      },
    ]);
  }, [router]);

  const goToSubscription = useCallback(() => router.push('/subscription'), [router]);
  const goToGoals = useCallback(() => router.push('/my-goals'), [router]);
  const goToReminders = useCallback(() => router.push('/reminders'), [router]);
  const goToUnits = useCallback(() => router.push('/units'), [router]);
  const goToHelp = useCallback(() => router.push('/help'), [router]);
  const goToEditProfile = useCallback(() => router.push('/edit-profile'), [router]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.pageTitle} accessibilityRole="header">Profile</Text>
          <View style={styles.emptyState}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.border} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={12} cy={7} r={4} stroke={Theme.colors.border} strokeWidth={2} />
            </Svg>
            <Text style={styles.emptyTitle}>No Profile</Text>
            <Text style={styles.emptySubtitle}>Complete onboarding to set up your profile.</Text>
            <TouchableOpacity
              style={styles.btnStartOver}
              onPress={handleStartOver}
              activeOpacity={0.7}
              accessibilityLabel="Start Over"
              accessibilityRole="button"
              accessibilityHint="Resets onboarding so you can create a new profile"
            >
              <Text style={styles.btnStartOverText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle} accessibilityRole="header">Profile</Text>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={12} cy={7} r={4} stroke={Theme.colors.primary} strokeWidth={2.5} />
            </Svg>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} accessibilityRole="header">{name}</Text>
            <TouchableOpacity
              disabled={hasEmail}
              onPress={handleEmailLink}
              accessibilityLabel={hasEmail ? email : 'Link email'}
              accessibilityRole={hasEmail ? 'text' : 'button'}
              accessibilityState={{ disabled: hasEmail }}
              hitSlop={HIT_SLOP}
            >
              <Text style={[styles.userEmail, !hasEmail && styles.userEmailLink]}>{email}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnEdit}
              hitSlop={HIT_SLOP}
              accessibilityLabel="Edit Profile"
              accessibilityRole="button"
              onPress={goToEditProfile}
            >
              <Text style={styles.btnEditText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.groupTitle} accessibilityRole="header">Account</Text>
        <View style={styles.settingsCard}>
          <SettingItem {...SETTINGS.subscription} badge={subscriptionBadge} badgeColor={badgeColor} onPress={goToSubscription} />
          <SettingItem {...SETTINGS.goals} isLast onPress={goToGoals} />
        </View>

        {/* Preferences */}
        <Text style={styles.groupTitle} accessibilityRole="header">Preferences</Text>
        <View style={styles.settingsCard}>
          <SettingItem {...SETTINGS.reminders} onPress={goToReminders} />
          <SettingItem {...SETTINGS.units} isLast onPress={goToUnits} />
        </View>

        {/* Support */}
        <Text style={styles.groupTitle} accessibilityRole="header">Support</Text>
        <View style={styles.settingsCard}>
          <SettingItem {...SETTINGS.help} isLast onPress={goToHelp} />
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity style={styles.btnRestore} onPress={handleRestore} accessibilityLabel="Restore Purchases" accessibilityRole="button">
          <Text style={styles.btnRestoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity style={styles.btnLogout} onPress={handleSignOut} accessibilityLabel="Sign Out" accessibilityRole="button">
          <Text style={styles.btnLogoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.accentBackground },
  container: { flex: 1, backgroundColor: Theme.colors.background, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 120 },
  pageTitle: {
    fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', marginTop: 10, marginBottom: 25,
  },

  // Empty state
  emptyContainer: { flex: 1, backgroundColor: Theme.colors.background, paddingHorizontal: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  emptySubtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    textAlign: 'center',
  },

  // User Card
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: Theme.colors.surface,
    padding: 20, borderRadius: Theme.borderRadius.card, borderWidth: 2, borderColor: Theme.colors.border,
    marginBottom: 25, shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 2,
  },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: Theme.colors.accentBackground,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Theme.colors.primary,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  userEmail: { fontSize: 12, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark, marginTop: 2 },
  userEmailLink: { color: Theme.colors.primaryHover, textDecorationLine: 'underline' },
  btnEdit: {
    backgroundColor: Theme.colors.accentBackground, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Theme.borderRadius.small, marginTop: 8, alignSelf: 'flex-start',
  },
  btnEditText: { fontSize: 12, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },

  // Settings
  groupTitle: {
    fontSize: 13, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 5,
  },
  settingsCard: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card, borderWidth: 2,
    borderColor: Theme.colors.border, overflow: 'hidden', marginBottom: 25,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 10, elevation: 1,
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  settingItemLast: { borderBottomWidth: 0 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  settingIcon: {
    width: 36, height: 36, borderRadius: Theme.borderRadius.small, backgroundColor: Theme.colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  settingName: { fontSize: 15, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  settingBadge: {
    backgroundColor: Theme.colors.textDark, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Theme.borderRadius.tiny, marginLeft: 10,
  },
  settingBadgeText: { color: Theme.colors.white, fontSize: 10, fontFamily: Theme.fonts.extraBold },
  chevron: { opacity: 0.7 },

  // Restore
  btnRestore: {
    borderWidth: 2, borderColor: Theme.colors.border, padding: 16,
    borderRadius: Theme.borderRadius.card, marginBottom: 12, alignItems: 'center',
  },
  btnRestoreText: {
    fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
  },

  // Logout
  btnLogout: {
    borderWidth: 2, borderColor: Theme.colors.border, padding: 16, borderRadius: Theme.borderRadius.card,
    marginBottom: 20, alignItems: 'center',
  },
  btnLogoutText: {
    fontSize: 15, fontFamily: Theme.fonts.extraBold, color: Theme.colors.urgentRed,
  },

  // Start Over (empty state)
  btnStartOver: {
    backgroundColor: Theme.colors.primary, borderRadius: Theme.borderRadius.button,
    paddingHorizontal: 24, paddingVertical: 14, marginTop: 16,
  },
  btnStartOverText: {
    fontSize: 14, fontFamily: Theme.fonts.extraBold, color: Theme.colors.white,
  },
});
