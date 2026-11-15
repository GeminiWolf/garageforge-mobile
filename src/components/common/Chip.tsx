import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../../theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  stretch?: boolean;
};

export function Chip({ label, selected, onPress, stretch }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={spacing.xs}
      style={[
        styles.chip,
        selected && styles.selected,
        stretch && styles.stretch,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    marginRight: spacing.lg,
    marginBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  stretch: {
    flex: 1,
    alignItems: 'center',
    marginRight: 0,
  },
  selected: {
    borderBottomColor: colors.text,
  },
  label: {
    ...typography.body,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  labelSelected: {
    color: colors.text,
  },
});
