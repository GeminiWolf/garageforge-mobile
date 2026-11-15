import React from 'react';
import { View } from 'react-native';
import { Text } from '../../components/common/Text';
import { useGarageStore } from '../../store/garageStore';
import { carSubtitle, carTitle } from '../../utils/carInfo';

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
        {carTitle(vehicle)}
      </Text>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {[carSubtitle(vehicle), vehicle.plate].filter(Boolean).join(' · ')}
      </Text>
    </View>
  );
}
