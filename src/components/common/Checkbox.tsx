import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';

type Props = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: number;
  accessibilityLabel?: string;
};

export function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  size = 20,
  accessibilityLabel = 'Checkbox',
}: Props) {
  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          onChange?.(!checked);
        }
      }}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      hitSlop={spacing.sm}
      style={({ pressed }) => [
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.max(radius.sm - 2, 4),
        },
        checked && styles.checked,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {checked ? (
        <Check size={Math.round(size * 0.7)} color={colors.bg} strokeWidth={3} />
      ) : (
        <View />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  checked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
});
