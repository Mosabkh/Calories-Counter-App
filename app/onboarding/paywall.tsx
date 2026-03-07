import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, AppState, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingIcon } from '@/components/onboarding/OnboardingIcon';
import { useOnboardingStore } from '@/store/onboarding-store';
import { BouncyView } from '@/components/onboarding/BouncyView';
import { graduateOnboarding } from '@/utils/graduate-onboarding';
import { fetchOfferings, purchase, type StubPackage } from '@/utils/revenue-cat';

const TIMER_DURATION = 15 * 60; // 15 minutes in seconds

const TIMELINE_ICONS = ['unlock', 'bell', 'crown'] as const;
const TIMELINE = [
  { iconName: TIMELINE_ICONS[0], title: 'Today - No Payment', desc: "Unlock all the app's features for free.", dark: false },
  { iconName: TIMELINE_ICONS[1], title: 'In 2 Days - Reminder', desc: "We'll send you a reminder.", dark: false },
  { iconName: TIMELINE_ICONS[2], title: 'In 3 Days - Billing Starts', desc: "You'll be charged unless you cancel.", dark: true },
];

export default function PaywallScreen() {
  const router = useRouter();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(TIMER_DURATION);
  const timerStartRef = useRef<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [packages, setPackages] = useState<{ monthly?: StubPackage; yearly?: StubPackage }>({});

  // Fetch RevenueCat offerings on mount
  useEffect(() => {
    (async () => {
      const offerings = await fetchOfferings();
      const current = offerings?.current;
      if (current) {
        const monthly = current.availablePackages.find((p) => p.identifier.includes('monthly') || p.identifier === '$rc_monthly');
        const yearly = current.availablePackages.find((p) => p.identifier.includes('annual') || p.identifier === '$rc_annual');
        setPackages({ monthly, yearly });
      }
    })();
  }, []);

  const getRemaining = useCallback(() => {
    if (!timerStartRef.current) return TIMER_DURATION;
    const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
    return Math.max(0, TIMER_DURATION - elapsed);
  }, []);

  // Start timer when modal opens
  useEffect(() => {
    if (!showModal) return;
    if (!timerStartRef.current) {
      timerStartRef.current = Date.now();
    }
    setCountdown(getRemaining());
    const interval = setInterval(() => {
      setCountdown(getRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [showModal, getRemaining]);

  // Recalculate on app foreground (handles background/suspend)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && showModal && timerStartRef.current) {
        setCountdown(getRemaining());
      }
    });
    return () => sub.remove();
  }, [showModal, getRemaining]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSubscribe = async () => {
    const pkg = selectedPlan === 'yearly' ? packages.yearly : packages.monthly;

    // If no packages loaded (no RevenueCat keys yet), fall through to free access
    if (!pkg) {
      graduateOnboarding();
      completeOnboarding();
      router.replace('/(tabs)');
      return;
    }

    setPurchasing(true);
    try {
      const success = await purchase(pkg);
      if (success) {
        graduateOnboarding();
        completeOnboarding();
        router.replace('/(tabs)');
      }
      // If !success, user cancelled — stay on screen
    } catch {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const [hasSeenModal, setHasSeenModal] = useState(false);

  const handleClose = () => {
    if (!hasSeenModal && countdown > 0) {
      setShowModal(true);
      setHasSeenModal(true);
    } else {
      handleSkipToApp();
    }
  };

  const handleDismissModal = () => {
    setShowModal(false);
  };

  const handleSkipToApp = () => {
    graduateOnboarding();
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerFlex} />
        <TouchableOpacity onPress={handleClose} accessibilityLabel="Close" accessibilityRole="button" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeBtn} accessible={false}>X</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Start your 3-day FREE trial to continue.</Text>

        <View style={styles.timeline}>
          <View style={styles.timelineLine} />
          {TIMELINE.map((item, i) => (
            <View key={i} style={styles.timelineItem}>
              <View style={[styles.timelineIcon, item.dark && styles.timelineIconDark]}>
                <OnboardingIcon name={item.iconName} size={16} color={Theme.colors.white} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pricingGrid}>
          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'monthly' && styles.pricingCardActive]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.7}
            accessibilityLabel="Monthly plan, JOD 7.10 per month"
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedPlan === 'monthly' }}>
            <View>
              <Text style={styles.pricingName}>Monthly</Text>
              <Text style={styles.pricingPrice}>JOD7.10<Text style={styles.pricingPer}>/mo</Text></Text>
            </View>
            <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioActive]}>
              {selectedPlan === 'monthly' && <OnboardingIcon name="check-circle" size={14} color={Theme.colors.white} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pricingCard, selectedPlan === 'yearly' && styles.pricingCardActive]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.7}
            accessibilityLabel="Yearly plan, JOD 1.77 per month, 3 days free trial"
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedPlan === 'yearly' }}>
            <View style={styles.pricingBadge}>
              <Text style={styles.pricingBadgeText}>3 DAYS FREE</Text>
            </View>
            <View>
              <Text style={styles.pricingName}>Yearly</Text>
              <Text style={styles.pricingPrice}>JOD1.77<Text style={styles.pricingPer}>/mo</Text></Text>
            </View>
            <View style={[styles.radio, selectedPlan === 'yearly' && styles.radioActive]}>
              {selectedPlan === 'yearly' && <OnboardingIcon name="check-circle" size={14} color={Theme.colors.white} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomAction}>
        <OnboardingButton
          title={purchasing ? 'Processing...' : 'Start My 3-Day Free Trial'}
          onPress={handleSubscribe}
          disabled={purchasing}
          style={styles.subscribeBtn}
          textStyle={styles.subscribeBtnText}
        />
        <Text style={styles.cancelText}>Cancel anytime from the {Platform.OS === 'android' ? 'Google Play Store' : 'App Store'}.</Text>
      </View>

      </BouncyView>
      {showModal && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.modalOverlay}
          accessibilityViewIsModal={true}>
          <Pressable style={styles.modalBackdrop} onPress={handleDismissModal} accessibilityLabel="Dismiss offer" accessibilityRole="button" />
          <Animated.View entering={SlideInDown.springify().damping(28).stiffness(200)} style={styles.downsellSheet}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Wait!</Text>
              <OnboardingIcon name="alert-octagon" size={28} color={Theme.colors.urgentRed} />
            </View>
            <Text style={styles.modalSubtitle}>Your custom plan is ready and waiting.</Text>
            <Text style={styles.modalBody}>
              Claim this one-time offer to get your first full year for{' '}
              <Text style={styles.modalDiscount}>60% off</Text>.
            </Text>
            <View style={styles.timerBadge} accessibilityLiveRegion="polite" accessibilityLabel={`Offer expires in ${formatTime(countdown)}`}>
              <Text style={styles.timerText} accessible={false}>Offer expires in: {formatTime(countdown)}</Text>
            </View>
            <View style={styles.offerCard}>
              <Text style={styles.offerOriginal}>Normally JOD 21.30 / year</Text>
              <Text style={styles.offerPrice}>Only JOD 8.50</Text>
              <Text style={styles.offerPer}>That{"'"}s JOD 0.70 / month!</Text>
            </View>
            <OnboardingButton title={purchasing ? 'Processing...' : 'Claim 60% Off Now'} onPress={handleSubscribe} disabled={purchasing} />
            <OnboardingButton
              title="Maybe later"
              variant="text"
              onPress={handleSkipToApp}
              style={styles.noThanksBtn}
            />
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20,
  },
  headerSpacer: { width: 44 },
  headerFlex: { flex: 1 },
  backTouchable: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  backBtn: {
    fontSize: 22, fontFamily: Theme.fonts.bold, color: Theme.colors.textDark,
  },
  closeBtn: {
    fontFamily: Theme.fonts.bold, color: Theme.colors.textMuted, padding: 5,
    fontSize: 16,
  },
  content: { flex: 1, paddingHorizontal: 24 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', marginVertical: 20, lineHeight: 32,
  },
  timeline: { position: 'relative', paddingLeft: 35, marginBottom: 20 },
  timelineLine: {
    position: 'absolute', left: 13, top: 15, bottom: 15, width: 4,
    backgroundColor: Theme.colors.primary, borderRadius: 2,
  },
  timelineItem: {
    flexDirection: 'row', gap: 15, marginBottom: 20, position: 'relative', zIndex: 2,
  },
  timelineIcon: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineIconDark: { backgroundColor: Theme.colors.textDark },
  timelineTitle: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 15,
  },
  timelineDesc: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
  },
  pricingGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pricingCard: {
    flex: 1, borderWidth: 2, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.card,
    padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Theme.colors.surface, position: 'relative',
  },
  pricingCardActive: {
    borderColor: Theme.colors.textDark, borderWidth: 3, padding: 14,
    backgroundColor: Theme.colors.pricingCardActiveBg,
  },
  pricingBadge: {
    position: 'absolute', top: -12, left: '50%', transform: [{ translateX: -40 }],
    backgroundColor: Theme.colors.textDark, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  pricingBadgeText: {
    color: Theme.colors.white, fontSize: 10, fontFamily: Theme.fonts.extraBold,
  },
  pricingName: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 17,
  },
  pricingPrice: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 18, marginTop: 5,
  },
  pricingPer: { fontSize: 13, fontFamily: Theme.fonts.semiBold },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: {
    borderColor: Theme.colors.primary, backgroundColor: Theme.colors.primary,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
  subscribeBtn: { backgroundColor: Theme.colors.textDark },
  subscribeBtnText: { color: Theme.colors.white },
  noThanksBtn: { marginTop: 10 },
  cancelText: {
    fontSize: 11, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'center', marginTop: 15,
  },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 100,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Theme.colors.overlay,
  },
  downsellSheet: {
    backgroundColor: Theme.colors.surface, width: '100%', padding: 30, paddingHorizontal: 24,
    borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  modalTitle: {
    fontSize: 28, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  modalSubtitle: {
    fontSize: 16, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textMuted,
    marginBottom: 20,
  },
  modalBody: {
    textAlign: 'center', fontSize: 14, fontFamily: Theme.fonts.regular,
    color: Theme.colors.textDark, marginBottom: 15,
  },
  modalDiscount: {
    color: Theme.colors.urgentRed, fontFamily: Theme.fonts.extraBold,
    textDecorationLine: 'underline',
  },
  timerBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)', borderWidth: 1,
    borderColor: Theme.colors.urgentRed, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginVertical: 15,
  },
  timerText: {
    color: Theme.colors.urgentRed, fontFamily: Theme.fonts.extraBold, fontSize: 18,
  },
  offerCard: {
    width: '100%', borderWidth: 2, borderStyle: 'dashed', borderColor: Theme.colors.primary,
    borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 20,
    backgroundColor: Theme.colors.primaryActive,
  },
  offerOriginal: {
    textDecorationLine: 'line-through', color: Theme.colors.textMuted, fontSize: 14,
    fontFamily: Theme.fonts.regular,
  },
  offerPrice: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
  },
  offerPer: {
    fontSize: 12, fontFamily: Theme.fonts.bold, color: Theme.colors.primary,
  },
});
