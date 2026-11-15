import React from 'react';
import { Car, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { TrackedPart, Vehicle } from '../../types';
import { colors, radius, spacing, tabularNums } from '../../theme';
import { useGarageStore } from '../../store/garageStore';
import { getBudgetParts, sumEstimatedCost } from '../../utils/budgetPlanner';
import { getCommittedSpend } from '../../utils/budgetStatus';
import { formatMoney } from '../../utils/formatMoney';
import {
  formatVehicleMeta,
  formatVehicleName,
  formatVehicleTitle,
} from '../../utils/formatVehicleName';
import { getVehicleHealth } from '../../utils/healthSummary';
import { hasPartEstimate } from '../../utils/partEstimate';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { StatusPill } from '../common/StatusPill';
import { Text } from '../common/Text';

type Props = {
  vehicle: Vehicle;
  parts: TrackedPart[];
  onPress: () => void;
  onAddParts: () => void;
  onLongPress?: () => void;
};

export function VehicleCard({
  vehicle,
  parts,
  onPress,
  onAddParts,
  onLongPress,
}: Props) {
  const currency = useGarageStore(s => s.settings.currency);
  const health = getVehicleHealth(parts);
  const title = formatVehicleName(vehicle);
  const installed = parts.filter(part => part.status === 'installed').length;
  const toSource = health.neededCount + health.sourcingCount;
  const budgetParts = getBudgetParts(parts);
  const allUnestimated =
    budgetParts.length > 0 && budgetParts.every(part => !hasPartEstimate(part));
  const stillToBuy = sumEstimatedCost(budgetParts);
  const spentOrOrdered = getCommittedSpend(parts);
  const progressLabel = `${installed} of ${parts.length} installed`;

  return (
    <Pressable
      testID={`vehicle-${vehicle.id}`}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${
        parts.length ? progressLabel : 'no parts yet'
      }`}
      accessibilityHint="Opens this car. Touch and hold to remove."
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.identity}>
        <View style={styles.iconTile}>
          <Car size={26} color={colors.accent} strokeWidth={1.8} />
        </View>
        <View style={styles.body}>
          <Text
            variant="subtitle"
            weight="semibold"
            style={styles.name}
            numberOfLines={1}
          >
            {formatVehicleTitle(vehicle)}
          </Text>
          <Text size="md" tone="muted" numberOfLines={1}>
            {formatVehicleMeta(vehicle)}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textDim} />
      </View>

      {parts.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text size="md" tone="muted">
            No parts yet
          </Text>
          <Button
            label="Add parts"
            variant="secondary"
            size="sm"
            onPress={onAddParts}
          />
        </View>
      ) : (
        <>
          <View style={styles.progress}>
            <View style={styles.progressLabels}>
              <Text size="md">{progressLabel}</Text>
              <Text size="md" tone="muted" style={tabularNums}>
                {Math.round((installed / parts.length) * 100)}%
              </Text>
            </View>
            <ProgressBar
              value={installed}
              max={parts.length}
              accessibilityLabel={progressLabel}
            />
          </View>

          {health.urgentCount || health.orderedCount || toSource ? (
            <View style={styles.pills}>
              {health.urgentCount ? (
                <StatusPill
                  size="md"
                  tone="danger"
                  dot
                  label={`${health.urgentCount} urgent`}
                />
              ) : null}
              {health.orderedCount ? (
                <StatusPill
                  size="md"
                  tone="warning"
                  label={`${health.orderedCount} awaiting delivery`}
                />
              ) : null}
              {toSource ? (
                <StatusPill
                  size="md"
                  tone="neutral"
                  label={`${toSource} to source`}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.tiles}>
            <View style={styles.tile}>
              <Text size="md" tone="muted">
                Spent or ordered
              </Text>
              <Text weight="semibold" style={[styles.amount, tabularNums]}>
                {formatMoney(spentOrOrdered, currency)}
              </Text>
            </View>
            <View style={styles.tile}>
              <Text size="md" tone="muted">
                Still to buy
              </Text>
              <Text weight="semibold" style={[styles.amount, tabularNums]}>
                {allUnestimated
                  ? 'Not estimated'
                  : formatMoney(stillToBuy, currency)}
              </Text>
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 18, lineHeight: 24 },
  amount: { fontSize: 18, lineHeight: 24 },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 14,
  },
  progress: { gap: spacing.sm },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceSunken,
    gap: 2,
  },
});
