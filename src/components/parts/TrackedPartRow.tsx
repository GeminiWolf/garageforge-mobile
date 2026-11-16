import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CurrencyCode, TrackedPart } from '../../types';
import { colors, spacing, tabularNums } from '../../theme';
import { formatMoney } from '../../utils/formatMoney';
import { partPrice } from '../../utils/partEstimate';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  statusTone,
} from '../../utils/partStatus';
import { Checkbox } from '../common/Checkbox';
import { StatusPill } from '../common/StatusPill';
import { Text } from '../common/Text';

type Props = {
  part: TrackedPart;
  currency: CurrencyCode;
  onPress: () => void;
  checkbox?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Thin line under the row (off for the last row in a panel). */
  divider?: boolean;
};

export function TrackedPartRow({
  part,
  currency,
  onPress,
  checkbox = false,
  checked = false,
  onCheckedChange,
  divider = true,
}: Props) {
  const price = partPrice(part);
  const cost = price ? formatMoney(price.amount, currency) : 'No price';
  const installed = part.status === 'installed';
  const urgent = part.priority === 'urgent' && !installed;
  const statusLabel = STATUS_LABELS[part.status];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        part.name,
        part.partNumber ? `part number ${part.partNumber}` : null,
        `${PRIORITY_LABELS[part.priority]} priority`,
        statusLabel,
        price ? `${price.paid ? 'cost' : 'estimated'} ${cost}` : 'no price yet',
      ]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => [
        styles.row,
        divider && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      {checkbox ? (
        <Checkbox
          checked={checked}
          onChange={onCheckedChange}
          accessibilityLabel={`Mark ${part.name} installed`}
        />
      ) : null}
      <View style={styles.body}>
        <Text
          weight="medium"
          strike={installed}
          tone={installed ? 'dim' : 'default'}
          style={styles.name}
        >
          {part.name}
        </Text>
        <View style={styles.pills}>
          {urgent ? <StatusPill tone="danger" label="Urgent" /> : null}
          <StatusPill tone={statusTone(part.status)} label={statusLabel} />
        </View>
        {part.partNumber ? (
          <Text size="md" tone="muted" numberOfLines={1}>
            Part no. {part.partNumber}
          </Text>
        ) : null}
      </View>
      <Text
        weight="medium"
        tone={installed ? 'dim' : price ? 'default' : 'muted'}
        style={[tabularNums, styles.cost]}
      >
        {cost}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  pressed: { opacity: 0.72 },
  body: { flex: 1, minWidth: 0, gap: 6 },
  name: { fontSize: 16, lineHeight: 22 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cost: { maxWidth: 110, textAlign: 'right', marginLeft: spacing.xs },
});
