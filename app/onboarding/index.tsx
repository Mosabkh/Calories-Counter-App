import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroImg}>
        <Text style={{ fontSize: 70 }}>📸</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Calorie tracking made simple</Text>
        <Text style={styles.subtitle}>
          Just snap a quick photo of your meal and we'll do the rest
        </Text>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Next" onPress={() => router.push('/onboarding/name')} />
        <Text style={styles.signInText}>
          Purchased on the web?{' '}
          <Text style={styles.signInLink}>Sign in</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  heroImg: {
    height: 280,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: Theme.colors.accentBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.border,
  },
  dotActive: {
    width: 20,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  signInText: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    marginTop: 15,
  },
  signInLink: {
    color: Theme.colors.primary,
    fontFamily: Theme.fonts.bold,
  },
});
