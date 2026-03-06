import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function BurnedCaloriesScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);

  const handleChoice = (addBurned: boolean) => {
    updatePayload({ addBurnedCalories: addBurned });
    router.push('/onboarding/rollover-calories');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={75} />
      <View style={styles.content}>
        <Text style={styles.title}>Add calories burned back to your daily goal?</Text>
        <View style={styles.card}>
          <View style={styles.cardImage}>
            <Text style={{ fontSize: 40 }}>🏃‍♂️</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>
              Today's goal: <Text style={styles.cardHighlight}>1600 Cals</Text>
            </Text>
            <Text style={styles.cardSub}>+ 200 cals from running</Text>
          </View>
        </View>
      </View>
      <View style={styles.bottomAction}>
        <View style={styles.rowBtns}>
          <OnboardingButton
            title="No"
            variant="outline"
            onPress={() => handleChoice(false)}
            style={{ flex: 1 }}
          />
          <OnboardingButton
            title="Yes"
            onPress={() => handleChoice(true)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'left', marginTop: 20, lineHeight: 32,
  },
  card: {
    backgroundColor: Theme.colors.surface, borderRadius: 20, overflow: 'hidden',
    borderWidth: 2, borderColor: Theme.colors.border, marginTop: 20,
  },
  cardImage: {
    height: 120, backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { padding: 15 },
  cardTitle: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 14,
  },
  cardHighlight: { color: Theme.colors.primary },
  cardSub: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted, marginTop: 5,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
  rowBtns: { flexDirection: 'row', gap: 15 },
});
