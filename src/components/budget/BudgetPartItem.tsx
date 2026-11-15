import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CurrencyCode, TrackedPart } from '../../types';
import { colors, layout, spacing, tabularNums } from '../../theme';
import { Text } from '../common/Text';
import { hasPartEstimate } from '../../utils/partEstimate';
import { formatMoney } from '../../utils/formatMoney';

const PRIORITY_LABELS: Record<TrackedPart['priority'], string> = {
  urgent: 'Urgent',
  soon: 'Soon',
  someday: 'Someday',
};

type Props = {
  index?: number;
  part: TrackedPart;
  vehicleLabel: string;
  currency?: CurrencyCode;
  onPress?: () => void;
};

export default function BudgetPartItem({
  index,
  part,
  vehicleLabel,
  currency = 'ZAR',
  onPress,
}: Props) {
  const content = (
    <>
      <Text tone="dim" style={styles.index}>
        {index != null ? String(index).padStart(2, '0') : ''}
      </Text>
      <View style={styles.body}>
        <Text weight="medium">{part.name}</Text>
        <Text size="sm" tone="dim">
          {vehicleLabel}
          {part.priority === 'urgent'
            ? ` · ${PRIORITY_LABELS[part.priority]}`
            : ''}
        </Text>
      </View>
      <Text size="sm" tone="muted" style={tabularNums}>
        {hasPartEstimate(part)
          ? formatMoney(part.estimatedCost, currency)
          : 'Not estimated'}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${part.name}, ${vehicleLabel}`}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
  index: {
    width: 28,
    fontVariant: ['tabular-nums'],
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
