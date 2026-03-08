import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingIcon } from '@/components/onboarding/OnboardingIcon';
import { BouncyView } from '@/components/onboarding/BouncyView';

export default function Transition2Screen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backTouchable} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Go back" accessibilityRole="button">
            <Text style={styles.backBtn} accessible={false}>{'<'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <OnboardingIcon name="search" size={64} color={Theme.colors.white} />
          </View>
          <Text style={styles.title}>Almost there.</Text>
          <Text style={styles.subtitle}>
            We just need a few details about your lifestyle to customize your daily and weekly settings.
          </Text>
        </View>
        <View style={styles.bottomAction}>
          <OnboardingButton
            title="Continue"
            onPress={() => router.push('/onboarding/roadblocks')}
            style={{ backgroundColor: Theme.colors.white }}
            textStyle={{ color: Theme.colors.primary }}
          />
        </View>
      </BouncyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  header: {
    paddingHorizontal: 16, paddingTop: 10,
  },
  backTouchable: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  backBtn: {
    fontSize: 22, fontFamily: Theme.fonts.bold, color: Theme.colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconWrap: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.accentBackground,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
