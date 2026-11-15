import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MoreHorizontal } from 'lucide-react-native';

import type { GarageStackParamList } from '../types';
import { useGarageStore } from '../../store/garageStore';
import { colors } from '../../theme';
import { confirmRemoveVehicle } from '../../utils/confirmRemoveVehicle';
import { formatVehicleName } from '../../utils/formatVehicleName';

type Props = {
  navigation: NativeStackNavigationProp<GarageStackParamList>;
  vehicleId: string;
};

/** "⋯" menu on a car's screen. */
export function VehicleOptionsHeaderRight({ navigation, vehicleId }: Props) {
  const vehicle = useGarageStore(s => s.vehicles.find(v => v.id === vehicleId));
  const removeVehicle = useGarageStore(s => s.removeVehicle);
  if (!vehicle) {
    return null;
  }
  const name = formatVehicleName(vehicle);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Vehicle options"
      hitSlop={8}
      style={styles.menu}
      onPress={() =>
        Alert.alert(name, undefined, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove from garage',
            style: 'destructive',
            onPress: () =>
              confirmRemoveVehicle(name, () => {
                removeVehicle(vehicleId);
                navigation.navigate('GarageHome');
              }),
          },
        ])
      }
    >
      <MoreHorizontal size={24} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
});
