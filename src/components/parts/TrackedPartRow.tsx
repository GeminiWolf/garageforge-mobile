import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CurrencyCode, TrackedPart } from '../../types';
import { hasPartEstimate } from '../../utils/partEstimate';
import { formatMoney } from '../../utils/formatMoney';
import { colors, layout, spacing, tabularNums } from '../../theme';
import { Checkbox } from '../common/Checkbox';
import { Text } from '../common/Text';

type Props = {
  part: TrackedPart;
  currency: CurrencyCode;
  onPress: () => void;
  checkbox?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function TrackedPartRow({
  part,
  currency,
  onPress,
  checkbox = false,
  checked = false,
  onCheckedChange,
}: Props) {
  const cost = hasPartEstimate(part)
    ? formatMoney(part.estimatedCost, currency)
    : 'Not estimated';
  const installed = part.status === 'installed';
  const statusLabel = {
    needed: 'To source',
    sourcing: 'Sourcing',
    ordered: 'Awaiting delivery',
    installed: 'Installed',
  }[part.status];
  const meta = [
    part.priority === 'urgent' && !installed ? 'Urgent' : null,
    statusLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        part.name,
        part.partNumber ? `part number ${part.partNumber}` : null,
        `${part.priority} priority`,
        statusLabel,
        hasPartEstimate(part) ? `estimated ${cost}` : cost,
      ]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {checkbox ? (
        <View style={styles.checkbox}>
          <Checkbox
            checked={checked}
            onChange={onCheckedChange}
            accessibilityLabel={`Mark ${part.name} installed`}
          />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text
          weight="medium"
          strike={installed}
          tone={installed ? 'dim' : 'default'}
        >
          {part.name}
        </Text>
        <Text
          variant="caption"
          tone={part.priority === 'urgent' && !installed ? 'danger' : 'muted'}
        >
          {meta}
        </Text>
        {part.partNumber ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            Part no. {part.partNumber}
          </Text>
        ) : null}
      </View>
      <Text
        size="sm"
        tone={installed ? 'dim' : 'muted'}
        style={[tabularNums, styles.cost]}
      >
        {cost}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.rowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.borderSubtle,
  },
  pressed: {
    opacity: 0.72,
  },
  checkbox: {
    marginRight: spacing.md,
  },
  cost: { maxWidth: 110, textAlign: 'right' },
  body: {
    flex: 1,
    marginRight: spacing.sm,
    gap: 2,
  },
});
