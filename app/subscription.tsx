import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

const STORE_NAME = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

export default function SubscriptionScreen() {
  const router = useRouter();
  const plan = useSubscriptionStore((s) => s.plan);
  const isActive = useSubscriptionStore((s) => s.isActive);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);
  const [restoring, setRestoring] = useState(false);

  const isExpired = useMemo(() => {
    if (!isActive || !expiresAt) return false;
    const d = new Date(expiresAt);
    return !isNaN(d.getTime()) && d.getTime() < Date.now();
  }, [isActive, expiresAt]);

  const statusLabel = useMemo(() => {
    if (isExpired) return 'Expired';
    if (isActive) return 'Active';
    return 'Free';
  }, [isActive, isExpired]);

  const planLabel = useMemo(() => {
    if (!isActive) return 'Free Plan';
    if (isExpired) return 'Subscription Expired';
    return plan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan';
  }, [isActive, isExpired, plan]);

  const renewalLabel = useMemo(() => {
    if (!expiresAt || expiresAt.trim() === '') return null;
    try {
      const d = new Date(expiresAt);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return null;
    }
  }, [expiresAt]);

  const renewalPrefix = useMemo(() => {
    if (isExpired) return 'Expired on';
    return 'Next charge:';
  }, [isExpired]);

  const cardAccessibilityLabel = useMemo(() => {
    const parts = [`Subscription status: ${statusLabel}`, planLabel];
    if (renewalLabel) parts.push(`${renewalPrefix} ${renewalLabel}`);
    return parts.join('. ') + '.';
  }, [statusLabel, planLabel, renewalLabel, renewalPrefix]);

  const statusBadgeStyle = useMemo(() => {
    if (isExpired) return styles.statusBadgeExpired;
    if (isActive) return styles.statusBadgeActive;
    return null;
  }, [isActive, isExpired]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleManage = useCallback(() => {
    Alert.alert(
      'Manage Subscription',
      `This will open your ${STORE_NAME} subscription settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Settings',
          onPress: async () => {
            try {
              await Linking.openURL(MANAGE_URL);
            } catch {
              Alert.alert('Error', 'Could not open subscription settings.');
            }
          },
        },
      ],
    );
  }, []);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      Alert.alert(
        restored ? 'Restored!' : 'Nothing to Restore',
        restored
          ? 'Your subscription has been restored.'
          : 'No previous purchases found. If you purchased on a different account, sign in with that account first.',
      );
    } catch {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  }, []);

  const handleSubscribe = useCallback(() => {
    router.push('/onboarding/paywall');
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={HIT_SLOP}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backBtn}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" accessible={false}>
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={Theme.colors.textDark}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">Subscription</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View
          style={styles.card}
          accessible
          accessibilityLabel={cardAccessibilityLabel}
          accessibilityRole="summary"
        >
          <View style={styles.statusRow}>
            <Text style={styles.cardLabel} accessible={false}>Status</Text>
            <View style={[styles.statusBadge, statusBadgeStyle]}>
              <Text style={styles.statusBadgeText} accessible={false}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.planLabel} accessible={false}>{planLabel}</Text>

          {renewalLabel && (
            <Text style={styles.renewalText} accessible={false}>
              {renewalPrefix} {renewalLabel}
            </Text>
          )}
        </View>

        {/* Actions */}
        {isActive && !isExpired ? (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={handleManage}
            activeOpacity={0.7}
            accessibilityLabel={`Manage subscription in ${STORE_NAME}`}
            accessibilityRole="button"
            accessibilityHint="Opens your subscription settings"
          >
            <Text style={styles.manageBtnText}>Manage Subscription</Text>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
              <Path
                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                stroke={Theme.colors.white}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.subscribeBtn}
            onPress={handleSubscribe}
            activeOpacity={0.7}
            accessibilityLabel={isExpired ? 'Resubscribe to premium' : 'Subscribe to premium'}
            accessibilityRole="button"
            accessibilityHint="Opens the subscription plans"
          >
            <Text style={styles.subscribeBtnText}>
              {isExpired ? 'Resubscribe to Premium' : 'Subscribe to Premium'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
          activeOpacity={0.6}
          accessibilityLabel={restoring ? 'Restoring purchases' : 'Restore purchases'}
          accessibilityRole="button"
          accessibilityState={{ disabled: restoring }}
          accessibilityHint="Restores any previous subscriptions from your account"
        >
          <Text style={[styles.restoreBtnText, restoring && styles.restoreBtnTextDisabled]}>
            {restoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <Text style={styles.infoText}>
          {isActive && !isExpired
            ? `To cancel, go to your ${STORE_NAME} subscription settings. You will keep access until the end of your billing period.`
            : 'Subscribe to unlock premium features. You can restore a previous purchase if you already have one.'}
        </Text>
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

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  card: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card,
    padding: 24, borderWidth: 2, borderColor: Theme.colors.border, marginBottom: 24,
    shadowColor: Theme.colors.textDark, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 2,
  },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: { fontSize: 13, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
  statusBadge: {
    backgroundColor: Theme.colors.textDark, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Theme.borderRadius.tiny,
  },
  statusBadgeActive: { backgroundColor: Theme.colors.success },
  statusBadgeExpired: { backgroundColor: Theme.colors.calorieAlert },
  statusBadgeText: { fontSize: 11, fontFamily: Theme.fonts.extraBold, color: Theme.colors.white },
  planLabel: {
    fontSize: 22, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 6,
  },
  renewalText: { fontSize: 13, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textDark },

  manageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Theme.colors.primary, borderRadius: Theme.borderRadius.button,
    paddingVertical: 16, marginBottom: 12,
  },
  manageBtnText: { fontSize: 16, fontFamily: Theme.fonts.extraBold, color: Theme.colors.white },

  subscribeBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Theme.colors.primary, borderRadius: Theme.borderRadius.button,
    paddingVertical: 16, marginBottom: 12,
  },
  subscribeBtnText: { fontSize: 16, fontFamily: Theme.fonts.extraBold, color: Theme.colors.white },

  restoreBtn: { alignItems: 'center', paddingVertical: 16, marginBottom: 24 },
  restoreBtnText: { fontSize: 14, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark },
  restoreBtnTextDisabled: { opacity: 0.4 },

  infoText: {
    fontSize: 12, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    textAlign: 'center', lineHeight: 18,
  },
});
