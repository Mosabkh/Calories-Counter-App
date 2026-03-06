import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ListButton } from '@/components/onboarding/ListButton';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function WeekendsScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const [eatsMore, setEatsMore] = useState<boolean | undefined>();

  const handleContinue = () => {
    if (eatsMore === undefined) return;
    updatePayload({ eatsMoreOnWeekends: eatsMore });
    router.push(eatsMore ? '/onboarding/which-days' : '/onboarding/burned-calories');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={30} />
      <View style={styles.content}>
        <Text style={styles.title}>Do you eat a bit more on weekends or other week days?</Text>
        <ListButton
          label="Yes"
          active={eatsMore === true}
          onPress={() => setEatsMore(true)}
          rightContent={<Text style={{ fontSize: 20 }}>✔️</Text>}
        />
        <ListButton
          label="No"
          active={eatsMore === false}
          onPress={() => setEatsMore(false)}
          rightContent={<Text style={{ fontSize: 20 }}>✖️</Text>}
        />
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', marginBottom: 30,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
