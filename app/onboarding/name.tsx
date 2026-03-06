import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function NameScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const storedName = useOnboardingStore((s) => s.payload.name);
  const [name, setName] = useState(storedName || '');

  const handleContinue = () => {
    updatePayload({ name: name.trim() || undefined });
    router.push('/onboarding/sex');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={1} progress={33} />
      <View style={styles.content}>
        <Text style={styles.title}>How do you prefer to be addressed?</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={Theme.colors.border}
          autoFocus
          accessibilityLabel="Enter your name"
        />
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} />
        <OnboardingButton
          title="Skip"
          variant="text"
          onPress={() => router.push('/onboarding/sex')}
        />
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
    lineHeight: 32,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.primary,
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    textAlign: 'center',
    padding: 10,
    color: Theme.colors.textDark,
    marginTop: 40,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
