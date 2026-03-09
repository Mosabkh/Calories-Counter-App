import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/constants/theme';

const FAQ_ITEMS = [
  {
    q: 'Is my data private?',
    a: 'Your data is stored locally on your device and is never sent to external servers. We do not share your personal health data with third parties.',
  },
  {
    q: 'How does calorie tracking work?',
    a: 'Log your meals by taking a photo or searching our food database. Calobite calculates your daily calorie and macro intake automatically based on what you log.',
  },
  {
    q: 'How are my calorie targets calculated?',
    a: 'We calculate how many calories your body needs at rest based on your age, height, weight, and gender, then adjust for your activity level to find your daily energy needs. Your goal and weekly speed determine the final daily target.',
  },
  {
    q: 'How accurate are the calorie estimates?',
    a: 'We use the USDA food database for whole foods and Open Food Facts for packaged products. All food databases are estimates — actual nutrition varies by brand and preparation. Check package labels when available for the most accurate data.',
  },
  {
    q: 'Can I change my goals after onboarding?',
    a: 'Yes! Go to Profile > My Goals to update your goal type, target weight, and weekly speed. Your calorie and macro targets will be recalculated automatically.',
  },
  {
    q: 'How do I change my units?',
    a: 'Go to Profile > Units & Formatting to switch between kilograms and pounds. Your stored weights will be automatically converted.',
  },
  {
    q: 'How do streaks work?',
    a: 'Your streak increases for each consecutive calendar day you log at least one meal. If you miss a day, the streak resets to 1 and starts counting again. Your longest streak is always saved.',
  },
  {
    q: 'How often should I weigh in?',
    a: 'Once a week is plenty, but daily is great for spotting trends. Weight fluctuates day to day due to water, meals, and hormones — what matters is the trend over weeks, not any single reading.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'You can manage or cancel your subscription through your App Store or Google Play Store settings. Go to Profile > Subscription for a direct link.',
  },
];

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

export default function HelpScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContact = useCallback(async () => {
    try {
      await Linking.openURL('mailto:support@calobite.dev');
    } catch {
      Alert.alert('Error', 'Could not open email app. You can reach us at support@calobite.dev');
    }
  }, []);

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
        <Text style={styles.headerTitle} accessibilityRole="header">Help Center</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Frequently Asked Questions</Text>

        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <TouchableOpacity
              key={item.q}
              style={styles.faqCard}
              onPress={() => toggleItem(i)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${item.q}${isOpen ? `, ${item.a}` : ''}`}
              accessibilityState={{ expanded: isOpen }}
              accessibilityHint={isOpen ? 'Tap to collapse' : 'Tap to expand'}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion} accessible={false}>{item.q}</Text>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" accessible={false}>
                  <Path
                    d={isOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
                    stroke={Theme.colors.textDark}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              {isOpen && <Text style={styles.faqAnswer} accessible={false}>{item.a}</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle} accessibilityRole="header">Still need help?</Text>
          <Text style={styles.contactText}>
            Reach out to our support team and we{"'"}ll get back to you as soon as possible.
          </Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={handleContact}
            activeOpacity={0.7}
            accessibilityLabel="Contact support"
            accessibilityRole="button"
            accessibilityHint="Opens your email app to send us a message"
          >
            <Text style={styles.contactBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
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

  sectionTitle: {
    fontSize: 13, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8,
  },

  faqCard: {
    backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.card,
    borderWidth: 2, borderColor: Theme.colors.border, padding: 16, marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  faqQuestion: {
    flex: 1, fontSize: 14, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    marginTop: 12, lineHeight: 20,
  },

  contactCard: {
    backgroundColor: Theme.colors.accentBackground, borderRadius: Theme.borderRadius.card,
    padding: 24, marginTop: 16, alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textDark,
    textAlign: 'center', marginBottom: 16, lineHeight: 20,
  },
  contactBtn: {
    backgroundColor: Theme.colors.primary, borderRadius: Theme.borderRadius.button,
    paddingHorizontal: 24, paddingVertical: 16,
  },
  contactBtnText: {
    fontSize: 14, fontFamily: Theme.fonts.extraBold, color: Theme.colors.white,
  },
});
