import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { useSubscriptionStore } from '@/store/subscription-store';
import { restorePurchases } from '@/utils/revenue-cat';

const MANAGE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

export default function SubscriptionScreen() {
  const router = useRouter();
  const plan = useSubscriptionStore((s) => s.plan);
  const isActive = useSubscriptionStore((s) => s.isActive);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);

  const statusLabel = isActive ? 'Active' : 'Free';
  const planLabel = useMemo(() => {
    if (!isActive) return 'No active subscription';
    return plan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan';
  }, [isActive, plan]);

  const renewalLabel = useMemo(() => {
    if (!expiresAt) return null;
    try {
      const d = new Date(expiresAt);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return expiresAt;
    }
  }, [expiresAt]);

  const handleManage = useCallback(() => {
    Linking.openURL(MANAGE_URL);
  }, []);

  const handleRestore = useCallback(async () => {
    const restored = await restorePurchases();
    Alert.alert(
      restored ? 'Restored!' : 'Nothing to Restore',
      restored
        ? 'Your subscription has been restored.'
        : 'No previous purchases found.',
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={Theme.colors.textDark}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.cardLabel}>Status</Text>
            <View style={[styles.statusBadge, isActive && styles.statusBadgeActive]}>
              <Text style={[styles.statusBadgeText, isActive && styles.statusBadgeTextActive]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.planLabel}>{planLabel}</Text>

          {renewalLabel && (
            <Text style={styles.renewalText}>
              {isActive ? 'Renews on' : 'Expired on'} {renewalLabel}
            </Text>
          )}
        </View>

        {/* Actions */}
        {isActive && (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={handleManage}
            activeOpacity={0.7}
            accessibilityLabel="Manage subscription"
            accessibilityRole="button"
          >
            <Text style={styles.manageBtnText}>Manage Subscription</Text>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path
                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                stroke={Theme.colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.7}
          accessibilityLabel="Restore purchases"
          accessibilityRole="button"
        >
          <Text style={styles.restoreBtnText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Info */}
        <Text style={styles.infoText}>
          {isActive
            ? `To cancel, go to your ${Platform.OS === 'ios' ? 'App Store' : 'Google Play'} subscription settings. You will keep access until the end of your billing period.`
            : 'Subscribe to unlock premium features. You can restore a previous purchase if you already have one.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 18,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
  },

  content: { paddingHorizontal: 20, paddingTop: 10 },

  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.card,
    padding: 24,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    marginBottom: 24,
    shadowColor: Theme.colors.textDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.textMuted,
  },
  statusBadge: {
    backgroundColor: Theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: Theme.colors.success,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
  },
  statusBadgeTextActive: {
    color: Theme.colors.white,
  },
  planLabel: {
    fontSize: 22,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    marginBottom: 6,
  },
  renewalText: {
    fontSize: 13,
    fontFamily: Theme.fonts.semiBold,
    color: Theme.colors.textMuted,
  },

  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.button,
    paddingVertical: 16,
    marginBottom: 12,
  },
  manageBtnText: {
    fontSize: 16,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
  },

  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 24,
  },
  restoreBtnText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
  },

  infoText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
