import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/common/EmptyState';
import { Fab } from '../../components/common/Fab';
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
import { describeSyncLine } from '../../utils/syncLine';
import { syncNow, useSyncStatus } from '../../services/accountController';
import { colors, layout, radius, spacing } from '../../theme';
import {
  dismissBackupHint,
  hasSeenWelcome,
  isBackupHintDismissed,
  markWelcomeSeen,
} from '../../utils/onboarding';

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
  const signedIn = useGarageStore(s => s.account !== null);
  const lastSyncedAt = useGarageStore(s => s.sync.lastSyncedAt);
  const syncState = useSyncStatus(s => s.state);
  const syncLine = describeSyncLine(syncState, lastSyncedAt);
  const [showBackupHint, setShowBackupHint] = useState(false);

  // First launch: introduce the app once, before the first car is added.
  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    hasSeenWelcome().then(seen => {
      if (seen) {
        return;
      }
      if (vehicles.length === 0) {
        navigation.navigate('Welcome');
      } else {
        markWelcomeSeen().catch(() => undefined);
      }
    });
    // Only on load; not every time the garage changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  // Suggest an account once there's something worth backing up.
  useEffect(() => {
    if (signedIn || vehicles.length === 0) {
      setShowBackupHint(false);
      return;
    }
    isBackupHintDismissed().then(dismissed => setShowBackupHint(!dismissed));
  }, [signedIn, vehicles.length]);

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
              onAddParts={() => {
                navigation.navigate('AddPart', { vehicleId: item.id });
              }}
              onLongPress={() => {
                confirmRemoveVehicle(formatVehicleName(item), () => {
                  removeVehicle(item.id);
                });
              }}
            />
          )}
          ListFooterComponent={
            showBackupHint ? (
              <View style={styles.backupHint}>
                <Text weight="semibold">Back up your garage</Text>
                <Text tone="muted" variant="caption">
                  Create a free account to keep your cars safe and use them on
                  the Garage Forge website.
                </Text>
                <View style={styles.backupActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('Account')}
                    hitSlop={spacing.sm}
                  >
                    <Text weight="semibold" tone="accent">
                      Create account
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      dismissBackupHint().catch(() => undefined);
                      setShowBackupHint(false);
                    }}
                    hitSlop={spacing.sm}
                  >
                    <Text tone="muted">Not now</Text>
                  </Pressable>
                </View>
              </View>
            ) : null
          }
          ListHeaderComponent={
            <View style={styles.intro}>
              <Text size="md" tone="muted">
                {vehicles.length}{' '}
                {vehicles.length === 1 ? 'vehicle' : 'vehicles'}
                {signedIn && !syncLine.problem ? ` · ${syncLine.text}` : ''}
              </Text>
              {signedIn && syncLine.problem ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Garage ${syncLine.text}. Try again`}
                  onPress={() => syncNow().catch(() => undefined)}
                  hitSlop={spacing.sm}
                  style={({ pressed }) => [
                    styles.syncProblem,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.syncDot} />
                  <Text size="md" style={styles.syncProblemText}>
                    {syncLine.text.charAt(0).toUpperCase() +
                      syncLine.text.slice(1)}
                  </Text>
                  <Text size="md" weight="semibold" tone="accent">
                    Try again
                  </Text>
                </Pressable>
              ) : null}
            </View>
          }
          ItemSeparatorComponent={VehicleSeparator}
        />
      )}
      {vehicles.length > 0 ? (
        <Fab
          aboveSystemBar={false}
          label="Add vehicle"
          onPress={() => navigation.navigate('AddVehicle')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backupHint: {
    marginTop: spacing.lg,
    padding: 18,
    gap: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceRaised,
  },
  backupActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  intro: { paddingBottom: spacing.lg, gap: spacing.sm },
  syncProblem: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.warningSoft,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  syncProblemText: { color: colors.warningText },
  pressed: { opacity: 0.72 },
  container: {
    flex: 1,
  },
  empty: {
    paddingHorizontal: layout.gutter,
  },
  list: {
    paddingHorizontal: layout.gutter,
    paddingBottom: layout.fabClearance,
  },
});
