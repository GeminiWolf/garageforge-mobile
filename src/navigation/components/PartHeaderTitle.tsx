import React from 'react';
import { View } from 'react-native';
import { formatVehicleName } from '../../utils/formatVehicleName';
import { Text } from '../../components/common/Text';
import { useGarageStore } from '../../store/garageStore';

type Props = {
  partId: string;
};

export function PartHeaderTitle({ partId }: Props) {
  const part = useGarageStore(s => s.trackedParts.find(p => p.id === partId));

  const vehicle = useGarageStore(s =>
    s.vehicles.find(v => v.id === part?.vehicleId),
  );
  return (
    <View>
      <Text variant="subtitle" numberOfLines={1}>
        {part?.name ?? 'Part'}
      </Text>
      {vehicle ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {formatVehicleName(vehicle)}
        </Text>
      ) : null}
    </View>
  );
}
