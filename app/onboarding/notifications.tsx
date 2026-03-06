import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';
import { requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';

export default function NotificationsScreen() {
  const router = useRouter();
  const updatePayload = useOnboardingStore((s) => s.updatePayload);

  const handleEnable = async () => {
    const { status } = await requestPermissionsAsync();
    updatePayload({ enableNotifications: status === 'granted' });
    router.push('/onboarding/generating');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={100} />
      <View style={styles.content}>
        <Text style={styles.title}>Enable Notifications</Text>
        <View style={styles.notifCard}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifApp}>App Name</Text>
            <Text style={styles.notifTime}>now</Text>
          </View>
          <Text style={styles.notifTitle}>It's lunchtime</Text>
          <Text style={styles.notifBody}>
            Log your lunch! Remember that consistent actions get results.
          </Text>
        </View>
        <Text style={styles.subtitle}>
          According to our data, users who receive reminders are more likely to achieve goals.
        </Text>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton title="Enable Notifications" onPress={handleEnable} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'center', marginTop: 20,
  },
  notifCard: {
    backgroundColor: Theme.colors.surface, borderRadius: 15, padding: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05,
    shadowRadius: 15, elevation: 3, marginVertical: 30,
  },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5,
  },
  notifApp: {
    fontFamily: Theme.fonts.bold, fontSize: 12, color: Theme.colors.textMuted,
  },
  notifTime: {
    fontSize: 12, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
  },
  notifTitle: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 14,
  },
  notifBody: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted, marginTop: 3,
    lineHeight: 19,
  },
  subtitle: {
    fontSize: 14, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
    textAlign: 'center', lineHeight: 21,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
