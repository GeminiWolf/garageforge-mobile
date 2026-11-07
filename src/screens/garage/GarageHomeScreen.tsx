import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Car } from 'lucide-react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Badge } from '@react-navigation/elements';

import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import { Text } from '../../components/common/Text';
import { VehicleCard } from '../../components/garage/VehicleCard';
import type {
  GarageStackParamList,
  RootTabParamList,
} from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import { colors, spacing } from '../../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'GarageTab'>,
  NativeStackScreenProps<GarageStackParamList>
>;

export function GarageHomeScreen({ navigation }: Props) {
  const vehicles = useGarageStore(s => s.vehicles);
  const trackedParts = useGarageStore(s => s.trackedParts);
  const hasHydrated = useGarageStore(s => s.hasHydrated);

  return (
    <View style={styles.container}>
      <View style={[styles.header, styles.row, styles.spaceBetween]}>
        <View style={styles.headerContent}>
          <Text tone="info" style={styles.brand} size="2xl" weight="semibold">
            My Garage
          </Text>
          <Text size="sm">Track active car builds & missing components</Text>
        </View>
        <View>
          <Badge visible={true} size={25} style={styles.badge}>
            {`${vehicles.length} vehicles`}
          </Badge>
        </View>
      </View>
      {!hasHydrated ? (
        <View style={styles.contentContainer} accessibilityLiveRegion="polite" accessibilityLabel="Loading garage">
          <SkeletonList count={3} itemHeight={120} />
        </View>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={<Car size={40} color={colors.textDim} />}
          title="Garage is empty"
          subtitle="Add a vehicle to start tracking parts and budget."
          actionLabel="Add vehicle"
          onAction={() => navigation.navigate('AddVehicle')}
        />
      ) : (
        <FlatList
          keyExtractor={item => item.id}
          data={vehicles}
          contentContainerStyle={styles.contentContainer}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              parts={trackedParts.filter(p => p.vehicleId === item.id)}
              onPress={() => {
                useGarageStore.getState().setActiveVehicleId(item.id);
                navigation.navigate('CarDashboard', { vehicleId: item.id });
              }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    gap: spacing.xs,
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: colors.accentSoft,
    color: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
    fontSize: 14,
    paddingHorizontal: spacing.sm,
  },
  brand: {
    color: colors.white,
  },
  addBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  contentContainer: {
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
