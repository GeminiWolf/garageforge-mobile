import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CurrencyCode, TrackedPart } from '../../types';
import { colors, fontFamily, spacing, tabularNums } from '../../theme';
import { Text } from '../common/Text';
import { StatusPill } from '../common/StatusPill';
import { hasPartEstimate } from '../../utils/partEstimate';
import { formatMoney } from '../../utils/formatMoney';
import { STATUS_LABELS } from '../../utils/partStatus';

type Props = {
  index?: number;
  part: TrackedPart;
  vehicleLabel: string;
  currency?: CurrencyCode;
  onPress?: () => void;
  /** Thin line under the row (off for the last row in a panel). */
  divider?: boolean;
};

export default function BudgetPartItem({
  index,
  part,
  vehicleLabel,
  currency = 'ZAR',
  onPress,
  divider = false,
}: Props) {
  const estimated = hasPartEstimate(part);
  const urgent = part.priority === 'urgent';
  const content = (
    <>
      <View style={styles.indexBubble}>
        <Text style={styles.index}>{index ?? ''}</Text>
      </View>
      <View style={styles.body}>
        <Text weight="medium" style={styles.name}>
          {part.name}
        </Text>
        <Text size="md" tone="muted" numberOfLines={1}>
          {vehicleLabel} · {STATUS_LABELS[part.status]}
        </Text>
        {urgent ? <StatusPill tone="danger" label="Urgent" /> : null}
      </View>
      <Text
        weight="medium"
        tone={estimated ? 'default' : 'muted'}
        style={tabularNums}
      >
        {estimated ? formatMoney(part.estimatedCost, currency) : 'No price'}
      </Text>
    </>
  );

  const rowStyle = [styles.row, divider && styles.divider];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={[
          `${index ?? ''}. ${part.name}`,
          vehicleLabel,
          urgent ? 'urgent' : null,
          estimated
            ? formatMoney(part.estimatedCost, currency)
            : 'no price yet',
        ]
          .filter(Boolean)
          .join(', ')}
        style={({ pressed }) => [...rowStyle, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: 14,
    gap: spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  pressed: { opacity: 0.72 },
  indexBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    color: colors.neutralText,
    fontVariant: ['tabular-nums'],
  },
  body: { flex: 1, minWidth: 0, gap: 4 },
  name: { fontSize: 16, lineHeight: 22 },
});
