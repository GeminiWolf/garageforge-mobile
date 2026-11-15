import React from 'react';
import { View } from 'react-native';
import { Text } from '../../components/common/Text';
import { useGarageStore } from '../../store/garageStore';
import { formatVehicleName } from '../../utils/formatVehicleName';

export function AddPartTitle({ vehicleId }: { vehicleId: string }) {
  const vehicle = useGarageStore(s => s.vehicles.find(v => v.id === vehicleId));
  return (
    <View>
      <Text variant="subtitle">Add part</Text>
      {vehicle ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {formatVehicleName(vehicle)}
        </Text>
      ) : null}
    </View>
  );
}
