import React, { useState } from 'react';
import { View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/common/EmptyState';
import { Screen } from '../../components/common/Screen';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import { VehicleDetailsPanel } from '../../components/garage/VehicleDetailsPanel';
import { VehiclePartsWorkspace } from '../../components/parts/VehiclePartsWorkspace';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';

type Props = NativeStackScreenProps<GarageStackParamList, 'CarDashboard'>;

type Tab = 'parts' | 'details';

const TABS = [
  { value: 'parts' as const, label: 'Parts' },
  { value: 'details' as const, label: 'Details' },
];

export function CarDashboardScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const vehicle = useGarageStore(s => s.vehicles.find(v => v.id === vehicleId));
  const [tab, setTab] = useState<Tab>('parts');

  if (!vehicle) {
    return (
      <Screen>
        <EmptyState
          title="This car isn’t in the garage"
          actionLabel="Back to garage"
          onAction={() => navigation.navigate('GarageHome')}
        />
      </Screen>
    );
  }

  const switcher = (
    <View>
      <SegmentedControl
        accessibilityLabel="Vehicle sections"
        segments={TABS}
        value={tab}
        onChange={setTab}
      />
    </View>
  );

  return tab === 'parts' ? (
    <VehiclePartsWorkspace
      vehicleId={vehicleId}
      navigation={navigation}
      header={switcher}
    />
  ) : (
    <VehicleDetailsPanel vehicleId={vehicleId} header={switcher} />
  );
}
