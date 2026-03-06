import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CardOption } from '@/components/onboarding/CardOption';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function SexScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const storedGender = useOnboardingStore((s) => s.payload.gender);
  const [gender, setGender] = useState<'male' | 'female' | undefined>(storedGender);

  const handleContinue = () => {
    if (!gender) return;
    updatePayload({ gender });
    router.push('/onboarding/birthdate');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={1} progress={66} />
      <View style={styles.content}>
        <Text style={styles.title}>What is your sex?</Text>
        <Text style={styles.subtitle}>Enter your biological sex at birth.</Text>
        <View style={styles.cardGrid}>
          <CardOption
            icon="👩"
            label="Female"
            active={gender === 'female'}
            onPress={() => setGender('female')}
          />
          <CardOption
            icon="👨"
            label="Male"
            active={gender === 'male'}
            onPress={() => setGender('male')}
          />
        </View>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: Theme.fonts.extraBold,
    color: Theme.colors.textDark,
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 5,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
