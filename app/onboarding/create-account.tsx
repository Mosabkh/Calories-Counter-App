import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';

export default function CreateAccountScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={100} />
      <View style={styles.content}>
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.subtitle}>Save your plan and start tracking today.</Text>
        <OnboardingButton
          title="Sign in with Google"
          variant="outline"
          onPress={() => router.push('/onboarding/try-free')}
          style={{ marginTop: 40 }}
        />
        <OnboardingButton
          title="Skip"
          variant="text"
          onPress={() => router.push('/onboarding/try-free')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: {
    flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'center', marginTop: 5, marginBottom: 40,
  },
});
