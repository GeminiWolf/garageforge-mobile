import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  colors,
  radius as themeRadius,
  spacing,
  typography,
} from '../../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
type Radius = 'sm' | 'md' | 'lg' | 'xl' | 'full';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  radius?: Radius;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
};

const RADIUS_VALUES: Record<Radius, number> = {
  sm: themeRadius.sm,
  md: themeRadius.md,
  lg: themeRadius.lg,
  xl: themeRadius.xl,
  full: 9999,
};

const DEFAULT_RADIUS: Record<Size, Radius> = {
  sm: 'full',
  md: 'md',
  lg: 'lg',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  radius,
  leftIcon,
  rightIcon,
  disabled,
  loading,
  style,
  testID,
}: Props) {
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'secondary' || variant === 'ghost'
      ? colors.accent
      : colors.white;
  const borderRadius = RADIUS_VALUES[radius ?? DEFAULT_RADIUS[size]];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        sizeStyles[size],
        { borderRadius },
        pressed && !isDisabled && styles.pressed,
        isDisabled &&
          (variant === 'primary' ? styles.disabledPrimary : styles.disabled),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <Text
            style={[
              styles.label,
              labelSizeStyles[size],
              (variant === 'secondary' || variant === 'ghost') &&
                styles.labelDark,
              variant === 'danger' && styles.labelDanger,
              isDisabled && variant === 'primary' && styles.labelDisabled,
            ]}
          >
            {label}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 36,
    paddingHorizontal: spacing.md + 2,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
  },
});

const labelSizeStyles = StyleSheet.create({
  sm: {
    fontSize: 14,
  },
  md: {
    fontSize: 15,
  },
  lg: {
    fontSize: 16,
  },
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
  // A greyed-out button, not a muddy green one.
  disabledPrimary: {
    backgroundColor: colors.neutralSoft,
  },
  labelDisabled: {
    color: colors.textDim,
  },
  label: {
    ...typography.subtitle,
    color: colors.bg,
  },
  labelDark: {
    color: colors.text,
  },
  labelDanger: {
    color: colors.danger,
  },
});
