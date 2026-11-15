import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/common/EmptyState';
import { Screen } from '../../components/common/Screen';
import { Text } from '../../components/common/Text';
import { VehicleCard } from '../../components/garage/VehicleCard';
import type {
  GarageStackParamList,
  RootTabParamList,
} from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import { confirmRemoveVehicle } from '../../utils/confirmRemoveVehicle';
import { formatVehicleName } from '../../utils/formatVehicleName';
import { layout, spacing } from '../../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'GarageTab'>,
  NativeStackScreenProps<GarageStackParamList>
>;

function VehicleSeparator() {
  return <View style={{ height: spacing.md }} />;
}

export function GarageHomeScreen({ navigation }: Props) {
  const hasHydrated = useGarageStore(s => s.hasHydrated);
  const vehicles = useGarageStore(s => s.vehicles);
  const trackedParts = useGarageStore(s => s.trackedParts);
  const removeVehicle = useGarageStore(s => s.removeVehicle);

  if (!hasHydrated) {
    return <Screen loading />;
  }

  return (
    <View style={styles.container}>
      {vehicles.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            title="No cars in the workshop"
            subtitle="Add the vehicle you’re building. Parts, spend, and what’s still missing live on that car."
            actionLabel="Add vehicle"
            onAction={() => navigation.navigate('AddVehicle')}
          />
        </View>
      ) : (
        <FlatList
          keyExtractor={item => item.id}
          data={vehicles}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              parts={trackedParts.filter(p => p.vehicleId === item.id)}
              onPress={() => {
                navigation.navigate('CarDashboard', { vehicleId: item.id });
              }}
              onLongPress={() => {
                confirmRemoveVehicle(formatVehicleName(item), () => {
                  removeVehicle(item.id);
                });
              }}
            />
          )}
          ListHeaderComponent={
            <View style={styles.intro}>
              <Text variant="hero">Your builds</Text>
              <Text variant="caption" tone="muted">
                {vehicles.length}{' '}
                {vehicles.length === 1 ? 'vehicle' : 'vehicles'} in the garage ·
                Parts and progress, in one place
              </Text>
            </View>
          }
          ItemSeparatorComponent={VehicleSeparator}
          ListFooterComponent={
            <Pressable
              onPress={() => navigation.navigate('AddVehicle')}
              accessibilityRole="button"
              accessibilityLabel="Add another vehicle"
              style={({ pressed }) => [
                styles.footerAdd,
                pressed && styles.pressed,
              ]}
            >
              <Text weight="medium">Add another vehicle</Text>
            </Pressable>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  container: {
    flex: 1,
  },
  empty: {
    paddingHorizontal: layout.gutter,
  },
  list: {
    paddingHorizontal: layout.gutter,
    paddingBottom: layout.gutter,
  },
  footerAdd: {
    minHeight: layout.rowMinHeight,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
