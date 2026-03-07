import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingIcon } from '@/components/onboarding/OnboardingIcon';
import { ListButton } from '@/components/onboarding/ListButton';
import { useOnboardingStore } from '@/store/onboarding-store';
import { BouncyView } from '@/components/onboarding/BouncyView';

export default function WeekendsScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);
  const goal = useOnboardingStore((s) => s.payload.goal);
  const storedEatsMore = useOnboardingStore((s) => s.payload.eatsMoreOnWeekends);
  const [eatsMore, setEatsMore] = useState<boolean | undefined>(storedEatsMore);

  const handleContinue = () => {
    if (eatsMore === undefined) return;
    updatePayload({
      eatsMoreOnWeekends: eatsMore,
      ...(eatsMore ? {} : { weekendDays: [] }),
    });
    router.push(eatsMore ? '/onboarding/which-days' : '/onboarding/burned-calories');
  };

  const title = goal === 'gain'
    ? 'Do you find it harder to eat enough on certain days?'
    : goal === 'maintain'
      ? 'Do you tend to eat differently on certain days?'
      : 'Do you eat a bit more on weekends or other week days?';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={3} progress={30} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <ListButton
          label="Yes"
          active={eatsMore === true}
          onPress={() => setEatsMore(true)}
          rightContent={<OnboardingIcon name="check-circle" size={22} color={Theme.colors.success} />}
        />
        <ListButton
          label="No"
          active={eatsMore === false}
          onPress={() => setEatsMore(false)}
          rightContent={<OnboardingIcon name="x-circle" size={22} color={Theme.colors.textMuted} />}
        />
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Continue" onPress={handleContinue} disabled={eatsMore === undefined} />
      </View>
      </BouncyView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'left', marginTop: 20, marginBottom: 20, lineHeight: 32,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
