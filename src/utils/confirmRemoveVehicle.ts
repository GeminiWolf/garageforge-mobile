import { Alert } from 'react-native';

export function confirmRemoveVehicle(
  vehicleLabel: string,
  onConfirm: () => void,
) {
  Alert.alert('Remove from garage', `Remove ${vehicleLabel} and its parts?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: onConfirm },
  ]);
}
