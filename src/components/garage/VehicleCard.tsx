import { hasPartEstimate } from '../../utils/partEstimate';
import React from 'react';
import { CarFront, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Vehicle } from '../../types';
import { getVehicleHealth } from '../../utils/healthSummary';
import type { TrackedPart } from '../../types';
import { colors, layout, spacing, tabularNums } from '../../theme';
import { Text } from '../common/Text';
import { getBudgetParts, sumEstimatedCost } from '../../utils/budgetPlanner';
import { formatMoney } from '../../utils/formatMoney';
import {
  formatVehicleName,
  formatVehicleTitle,
  formatVehicleMeta,
} from '../../utils/formatVehicleName';
import { useGarageStore } from '../../store/garageStore';

type Props = {
  vehicle: Vehicle;
  parts: TrackedPart[];
  onPress: () => void;
  onLongPress?: () => void;
};

export function VehicleCard({ vehicle, parts, onPress, onLongPress }: Props) {
  const health = getVehicleHealth(parts);
  const title = formatVehicleName(vehicle);
  const meta = formatVehicleMeta(vehicle);
  const currency = useGarageStore(s => s.settings.currency);
  const openParts = parts.filter(part => part.status !== 'installed');
  const budgetParts = getBudgetParts(parts);
  const missingEstimates = budgetParts.filter(
    part => !hasPartEstimate(part),
  ).length;
  const totalEstimatedCost = sumEstimatedCost(getBudgetParts(parts));

  return (
    <Pressable
      testID={`vehicle-${vehicle.id}`}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${health.summary}`}
      accessibilityHint="Opens this build. Touch and hold to remove."
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.identity}>
        <View style={styles.vehicleIcon}>
          <CarFront size={30} color={colors.accent} strokeWidth={1.5} />
        </View>
        <View style={styles.body}>
          <Text variant="subtitle">{formatVehicleTitle(vehicle)}</Text>
          <Text variant="caption" tone="muted">
            {meta}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textMuted} />
      </View>
      <View style={styles.divider} />
      <View style={styles.details}>
        <View style={styles.body}>
          <Text
            variant="caption"
            tone={health.urgentCount ? 'danger' : 'muted'}
          >
            {health.urgentCount ? `${health.urgentCount} urgent · ` : ''}
            {parts.length ? `${openParts.length} open parts` : 'No parts added'}
          </Text>
          <Text variant="caption" tone="muted">
            {parts.length === 0
              ? 'Add parts to start tracking this build'
              : health.orderedCount
              ? `${health.orderedCount} awaiting delivery`
              : openParts.length
              ? `${health.neededCount + health.sourcingCount} to source`
              : 'All parts installed'}
          </Text>
        </View>
        <View style={styles.cost}>
          <Text variant="label" tone="muted">
            {missingEstimates ? 'Known estimates' : 'To source'}
          </Text>
          <Text variant="subtitle" style={tabularNums}>
            {budgetParts.length && missingEstimates === budgetParts.length
              ? 'Not estimated'
              : formatMoney(totalEstimatedCost, currency)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.lg,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: layout.hairline, backgroundColor: colors.border },
  details: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cost: { alignItems: 'flex-end', gap: spacing.xs },
  pressed: { opacity: 0.72 },
  body: { flex: 1, gap: 4 },
});
