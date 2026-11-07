import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Car } from 'lucide-react-native';

import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { List } from '../../components/common/List';
import { SkeletonList } from '../../components/common/Skeleton';
import { Text } from '../../components/common/Text';
import { ApiError, exportVehiclePdf } from '../../services/api';
import { useGarageStore } from '../../store/garageStore';
import { colors, spacing } from '../../theme';
import type { Vehicle } from '../../types';
import {
  buildGarageExportPayload,
  getPartsExportDescription,
  getTrackedPartsForVehicle,
  getVehicleExportLabel,
} from '../../utils/garageExport';
import { sharePdfFile } from '../../utils/sharePdf';

export default function ExportScreen() {
  const vehicles = useGarageStore(s => s.vehicles);
  const trackedParts = useGarageStore(s => s.trackedParts);
  const settings = useGarageStore(s => s.settings);
  const hasHydrated = useGarageStore(s => s.hasHydrated);
  const [exportingVehicleId, setExportingVehicleId] = useState<string | null>(
    null,
  );

  const runExport = async (vehicle: Vehicle) => {
    if (exportingVehicleId != null) {
      return;
    }

    setExportingVehicleId(vehicle.id);
    try {
      const vehicleParts = getTrackedPartsForVehicle(trackedParts, vehicle.id);
      const payload = buildGarageExportPayload({
        vehicles: [vehicle],
        trackedParts: vehicleParts,
        settings,
      });
      const { path, filename } = await exportVehiclePdf(
        settings.apiBaseUrl,
        payload,
      );
      await sharePdfFile(path, filename);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Could not export this vehicle.';
      Alert.alert('Export failed', message);
    } finally {
      setExportingVehicleId(null);
    }
  };

  const exportVehicle = (vehicle: Vehicle) => {
    if (exportingVehicleId != null) {
      return;
    }

    Alert.alert(
      'Export vehicle',
      'This sends this vehicle, its tracked parts, and related budget settings to the server to generate a PDF.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            runExport(vehicle);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {!hasHydrated ? (
        <View style={styles.contentContainer} accessibilityLiveRegion="polite" accessibilityLabel="Loading vehicles">
          <SkeletonList count={3} itemHeight={60} />
        </View>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={<Car size={40} color={colors.textDim} />}
          title="No vehicles to export"
          subtitle="Add a vehicle to your garage before exporting."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text size="xs" tone="dim" weight="bold">
            VEHICLES
          </Text>
          <Card radius="md" padding="md">
            <List.View>
              {vehicles.map(vehicle => {
                const partCount = getTrackedPartsForVehicle(
                  trackedParts,
                  vehicle.id,
                ).length;
                const isExporting = exportingVehicleId === vehicle.id;
                return (
                  <List.Item
                    key={vehicle.id}
                    icon="Car"
                    label={getVehicleExportLabel(vehicle)}
                    description={getPartsExportDescription(partCount)}
                    onPress={() => exportVehicle(vehicle)}
                    rightSection={
                      isExporting ? (
                        <ActivityIndicator color={colors.accent} />
                      ) : undefined
                    }
                  />
                );
              })}
            </List.View>
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
