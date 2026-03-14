import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function launchMealCamera(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Camera access is needed to photograph your meals.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0].uri;
  } catch {
    return null;
  }
}
