import React, { useMemo } from 'react';
import { Card } from '../common/Card';
import { colors, spacing } from '../../theme';
import { Text } from '../common/Text';
import { Vehicle } from '../../types';
import { Divider } from '../common/Divider';
import { Badge } from '../common/Badge';
import { StyleSheet, View } from 'react-native';
import { Banknote } from 'lucide-react-native';
import { useGarageStore } from '../../store/garageStore';
import { formatMoney } from '../../utils/formatMoney';
import { useBudgetOverview } from '../../hooks/useBudgetOverview';
import { getStoredVehicleProvenanceLabel } from '../../utils/catalogProvenance';

type Props = {
  vehicle: Vehicle;
};

export default function VehicleDashboardCard({ vehicle }: Props) {
  const {
    settings: { currency },
    partsForVehicle,
  } = useGarageStore();

  const parts = useMemo(
    () => partsForVehicle(vehicle.id),
    [partsForVehicle, vehicle.id],
  );

  const { monthlyCap } = useBudgetOverview(parts);
  const provenanceLabel = getStoredVehicleProvenanceLabel(vehicle);

  return (
    <Card padding={spacing.md} gap={spacing.sm}>
      <Text weight="bold" size="2xl">
        {vehicle.year} {vehicle.make}
      </Text>
      <Text size="sm">{vehicle.trim}</Text>
      {provenanceLabel ? (
        <Text size="sm" tone="muted">
          {provenanceLabel}
        </Text>
      ) : null}
      <Divider spacing={spacing.xs} thickness={0.2} />
      <View>
        <Badge
          label={formatMoney(monthlyCap, currency)}
          tone="muted"
          style={styles.badgeContainer}
          color="default"
          leftSection={<Banknote size={16} color={colors.accent} />}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
});
