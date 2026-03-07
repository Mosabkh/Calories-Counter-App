import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BouncyView } from '@/components/onboarding/BouncyView';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
        <View style={styles.heroImg}>
          <Image
            source={require('@/assets/images/hero-food.png')}
            style={styles.heroImage}
            resizeMode="cover"
            accessibilityLabel="A plate of food being scanned"
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Know exactly what you eat</Text>
          <Text style={styles.subtitle}>
            Snap your meals, get a personalized plan, and hit your goals without the guesswork.
          </Text>
        </View>
        <View style={styles.bottomAction}>
          <OnboardingButton title="Continue" onPress={() => router.push('/onboarding/name')} />
          <Text style={styles.signInText}>
            Purchased on the web?{' '}
            <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </View>
      </BouncyView>
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
  heroImage: {
    width: '100%',
    height: '100%',
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
