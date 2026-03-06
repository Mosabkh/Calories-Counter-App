import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function Transition1Screen() {
  const router = useRouter();
  const name = useOnboardingStore((s) => s.payload.name) || 'there';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backTouchable} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backBtn}>{'<'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.icon}>🙌</Text>
        <Text style={styles.title}>Great job, {name}!</Text>
        <Text style={styles.subtitle}>
          Now, let's talk about your body and goals so we can calculate your perfect plan.
        </Text>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton
          title="Let's go"
          onPress={() => router.push('/onboarding/goal')}
          style={{ backgroundColor: '#FFFFFF' }}
          textStyle={{ color: Theme.colors.primary }}
        />
      </View>
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
    fontSize: 22, fontFamily: Theme.fonts.bold, color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: Theme.fonts.extraBold,
    color: '#FFFFFF',
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
