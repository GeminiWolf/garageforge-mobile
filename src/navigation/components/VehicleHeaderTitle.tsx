import React from 'react';
import { View } from 'react-native';
import { Text } from '../../components/common/Text';
import { useGarageStore } from '../../store/garageStore';
import {
  formatVehicleTitle,
  formatVehicleMeta,
} from '../../utils/formatVehicleName';

type Props = {
  vehicleId: string;
};

export function VehicleHeaderTitle({ vehicleId }: Props) {
  const vehicle = useGarageStore(s => s.vehicles.find(v => v.id === vehicleId));

  if (!vehicle) {
    return null;
  }

  return (
    <View>
      <Text variant="subtitle" numberOfLines={1}>
        {formatVehicleTitle(vehicle)}
      </Text>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {formatVehicleMeta(vehicle)}
      </Text>
    </View>
  );
}
