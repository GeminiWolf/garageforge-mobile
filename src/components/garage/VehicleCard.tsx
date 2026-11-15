import { hasPartEstimate } from '../../utils/partEstimate';
import React from 'react';
import { ChevronRight } from 'lucide-react-native';
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
import { getCommittedSpend } from '../../utils/budgetStatus';
import { makeBadge } from '../../utils/makeBadge';

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
  const spentOrOrdered = getCommittedSpend(parts);
  const showSpent =
    budgetParts.length === 0 && spentOrOrdered > 0 && parts.length > 0;
  const badge = makeBadge(vehicle.make);

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
        <View
          style={[styles.vehicleIcon, { backgroundColor: badge.color }]}
          accessible={false}
        >
          <Text variant="title" style={styles.initial}>
            {badge.initial}
          </Text>
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
          <View style={styles.statusRow}>
            {health.urgentCount ? <View style={styles.urgentDot} /> : null}
            <Text variant="caption" tone="muted">
              {health.urgentCount ? `${health.urgentCount} urgent · ` : ''}
              {parts.length
                ? `${openParts.length} ${
                    openParts.length === 1 ? 'part' : 'parts'
                  } to go`
                : 'No parts added'}
            </Text>
          </View>
          <Text variant="caption" tone="muted">
            {parts.length === 0
              ? 'Add the parts this car needs'
              : health.orderedCount
              ? `${health.orderedCount} awaiting delivery`
              : openParts.length
              ? `${health.neededCount + health.sourcingCount} to source`
              : 'All parts installed'}
          </Text>
        </View>
        <View style={styles.cost}>
          <Text variant="label" tone="muted">
            {showSpent
              ? 'Spent or ordered'
              : missingEstimates
              ? 'Known estimates'
              : 'Still to buy'}
          </Text>
          <Text variant="subtitle" style={tabularNums}>
            {showSpent
              ? formatMoney(spentOrOrdered, currency)
              : budgetParts.length && missingEstimates === budgetParts.length
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: '#FFFFFF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  divider: { height: layout.hairline, backgroundColor: colors.border },
  details: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cost: { alignItems: 'flex-end', gap: spacing.xs },
  pressed: { opacity: 0.72 },
  body: { flex: 1, gap: 4 },
});
