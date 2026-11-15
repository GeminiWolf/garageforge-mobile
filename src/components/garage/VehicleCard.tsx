import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { TrackedPart, Vehicle } from '../../types';
import { colors, radius, spacing, tabularNums } from '../../theme';
import { useGarageStore } from '../../store/garageStore';
import { getCommittedSpend } from '../../utils/budgetStatus';
import { formatMoney } from '../../utils/formatMoney';
import { carSubtitle, carTitle } from '../../utils/carInfo';
import { getVehicleHealth } from '../../utils/healthSummary';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';
import { StatusPill } from '../common/StatusPill';
import { Text } from '../common/Text';
import { PlateChip } from './PlateChip';

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
  const title = carTitle(vehicle);
  const installed = parts.filter(part => part.status === 'installed').length;
  const toSource = health.neededCount + health.sourcingCount;
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
        <View style={styles.body}>
          <Text
            variant="subtitle"
            weight="semibold"
            style={styles.name}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View style={styles.subtitleRow}>
            <Text
              size="md"
              tone="muted"
              numberOfLines={1}
              style={styles.shrink}
            >
              {carSubtitle(vehicle)}
            </Text>
            {vehicle.plate ? <PlateChip plate={vehicle.plate} /> : null}
          </View>
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
              <Text
                size="md"
                tone="muted"
                style={tabularNums}
                accessibilityLabel={`${formatMoney(
                  spentOrOrdered,
                  currency,
                )} spent or ordered`}
              >
                {formatMoney(spentOrOrdered, currency)}
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
  body: { flex: 1, minWidth: 0, gap: 4 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  shrink: { flexShrink: 1 },
  name: { fontSize: 18, lineHeight: 24 },
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
});
