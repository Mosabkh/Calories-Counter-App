import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useOnboardingStore } from '@/store/onboarding-store';

interface SettingItemProps {
  iconPath: string;
  label: string;
  badge?: string;
  extraPaths?: string[];
}

function SettingItem({ iconPath, label, badge, extraPaths }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} activeOpacity={0.6}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d={iconPath} stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {extraPaths?.map((p, i) => (
              <Path key={i} d={p} stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </Svg>
        </View>
        <Text style={styles.settingName}>{label}</Text>
        {badge && (
          <View style={styles.settingBadge}>
            <Text style={styles.settingBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5 }}>
        <Path d="M9 18L15 12L9 6" stroke={Theme.colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const name = useOnboardingStore((s) => s.payload.name) || 'Sam';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
              <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={Theme.colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={12} cy={7} r={4} stroke={Theme.colors.primary} strokeWidth={2.5} />
            </Svg>
          </View>
          <View>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{name.toLowerCase()}@example.com</Text>
            <TouchableOpacity style={styles.btnEdit}>
              <Text style={styles.btnEditText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.groupTitle}>Account</Text>
        <View style={styles.settingsCard}>
          <SettingItem
            iconPath="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2"
            label="Subscription"
            badge="FREE"
          />
          <SettingItem
            iconPath="M12 22A10 10 0 1 0 12 2A10 10 0 0 0 12 22Z"
            label="My Goals"
            extraPaths={['M12 18A6 6 0 1 0 12 6A6 6 0 0 0 12 18Z', 'M12 14A2 2 0 1 0 12 10A2 2 0 0 0 12 14Z']}
          />
        </View>

        {/* Preferences */}
        <Text style={styles.groupTitle}>Preferences</Text>
        <View style={styles.settingsCard}>
          <SettingItem
            iconPath="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
            label="Reminders"
            extraPaths={['M13.73 21a2 2 0 0 1-3.46 0']}
          />
          <SettingItem
            iconPath="M3 3h18v18H3V3z"
            label="Units & Formatting"
            extraPaths={['M3 9h18', 'M9 21V9']}
          />
        </View>

        {/* Support */}
        <Text style={styles.groupTitle}>Support</Text>
        <View style={styles.settingsCard}>
          <SettingItem
            iconPath="M12 22A10 10 0 1 0 12 2A10 10 0 0 0 12 22Z"
            label="Help Center"
            extraPaths={['M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h0.01']}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.btnLogout}>
          <Text style={styles.btnLogoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.accentBackground },
  container: { flex: 1, backgroundColor: Theme.colors.background, paddingHorizontal: 20 },
  pageTitle: {
    fontSize: 18, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', marginTop: 10, marginBottom: 25,
  },

  // User Card
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: Theme.colors.surface,
    padding: 20, borderRadius: 20, borderWidth: 1, borderColor: Theme.colors.border,
    marginBottom: 25, shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 2,
  },
  avatar: {
    width: 65, height: 65, borderRadius: 33, backgroundColor: Theme.colors.accentBackground,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Theme.colors.primary,
  },
  userName: { fontSize: 20, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  userEmail: { fontSize: 12, fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted, marginTop: 2 },
  btnEdit: {
    backgroundColor: 'rgba(226, 133, 110, 0.1)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, marginTop: 8, alignSelf: 'flex-start',
  },
  btnEditText: { fontSize: 11, fontFamily: Theme.fonts.extraBold, color: Theme.colors.primary },

  // Settings
  groupTitle: {
    fontSize: 14, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 5,
  },
  settingsCard: {
    backgroundColor: Theme.colors.surface, borderRadius: 20, borderWidth: 1,
    borderColor: Theme.colors.border, overflow: 'hidden', marginBottom: 25,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02, shadowRadius: 10, elevation: 1,
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  settingIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: Theme.colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  settingName: { fontSize: 15, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark },
  settingBadge: {
    backgroundColor: Theme.colors.textDark, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, marginLeft: 10,
  },
  settingBadgeText: { color: '#FFFFFF', fontSize: 10, fontFamily: Theme.fonts.extraBold },

  // Logout
  btnLogout: {
    borderWidth: 2, borderColor: Theme.colors.border, padding: 16, borderRadius: 20,
    marginBottom: 20, alignItems: 'center',
  },
  btnLogoutText: {
    fontSize: 15, fontFamily: Theme.fonts.extraBold, color: Theme.colors.calorieAlert,
  },
});
