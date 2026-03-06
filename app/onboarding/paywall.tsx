import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';

const TIMER_DURATION = 15 * 60; // 15 minutes in seconds

const TIMELINE = [
  { icon: '🔓', title: 'Today', desc: "Unlock all the app's features.", dark: false },
  { icon: '🔔', title: 'In 2 Days - Reminder', desc: "We'll send you a reminder.", dark: false },
  { icon: '👑', title: 'In 3 Days - Billing Starts', desc: "You'll be charged unless you cancel.", dark: true },
];

export default function PaywallScreen() {
  const router = useRouter();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(TIMER_DURATION);
  const timerStartRef = useRef<number | null>(null);

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

  const handleSubscribe = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleClose = () => {
    setShowModal(true);
  };

  const handleDismissModal = () => {
    setShowModal(false);
  };

  const handleSkipToApp = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
                <Text style={styles.timelineIconText}>{item.icon}</Text>
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
              {selectedPlan === 'monthly' && <Text style={styles.radioCheck}>✔</Text>}
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
              {selectedPlan === 'yearly' && <Text style={styles.radioCheck}>✔</Text>}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomAction}>
        <OnboardingButton
          title="Start My 3-Day Free Trial"
          onPress={handleSubscribe}
          style={styles.subscribeBtn}
          textStyle={styles.subscribeBtnText}
        />
        <Text style={styles.cancelText}>Cancel anytime from the App Store.</Text>
      </View>

      {showModal && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleDismissModal} accessibilityLabel="Dismiss offer" accessibilityRole="button" />
          <Animated.View entering={SlideInDown.springify().damping(28).stiffness(200)} style={styles.downsellSheet}>
            <Text style={styles.modalTitle}>Wait! 🛑</Text>
            <Text style={styles.modalSubtitle}>Don't leave your custom plan behind.</Text>
            <Text style={styles.modalBody}>
              Claim this one-time offer to get your first full year for{' '}
              <Text style={styles.modalDiscount}>60% off</Text>.
            </Text>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>Offer expires in: {formatTime(countdown)}</Text>
            </View>
            <View style={styles.offerCard}>
              <Text style={styles.offerOriginal}>Normally JOD 21.30 / year</Text>
              <Text style={styles.offerPrice}>Only JOD 8.50</Text>
              <Text style={styles.offerPer}>That's JOD 0.70 / month!</Text>
            </View>
            <OnboardingButton title="Claim 60% Off Now" onPress={handleSubscribe} />
            <OnboardingButton
              title="No thanks, I'll lose my plan"
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
  timelineIconText: { fontSize: 14 },
  timelineTitle: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 15,
  },
  timelineDesc: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
  },
  pricingGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pricingCard: {
    flex: 1, borderWidth: 2, borderColor: Theme.colors.border, borderRadius: 16,
    padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Theme.colors.surface, position: 'relative',
  },
  pricingCardActive: {
    borderColor: Theme.colors.textDark, borderWidth: 3, padding: 14,
    backgroundColor: 'rgba(84, 49, 40, 0.03)',
  },
  pricingBadge: {
    position: 'absolute', top: -12, left: '50%', transform: [{ translateX: -40 }],
    backgroundColor: Theme.colors.textDark, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  pricingBadgeText: {
    color: '#FFFFFF', fontSize: 10, fontFamily: Theme.fonts.extraBold,
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
  radioCheck: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' as const },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
  subscribeBtn: { backgroundColor: '#000000' },
  subscribeBtnText: { color: '#FFFFFF' },
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
  modalTitle: {
    fontSize: 28, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 5,
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
