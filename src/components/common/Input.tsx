import React, { ReactNode, useState } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type StyleProp,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, fontFamily, radius as themeRadius, spacing } from '../../theme';
import { Text } from './Text';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Radius = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<RNTextInputProps, 'style'> & {
  label?: string;
  helper?: string;
  error?: string;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  size?: Size;
  padding?: Padding | number;
  radius?: Radius;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
};

const PADDING: Record<Padding, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

const RADIUS: Record<Radius, number> = {
  sm: themeRadius.sm,
  md: themeRadius.md,
  lg: themeRadius.lg,
  xl: themeRadius.xl,
  full: 9999,
};

const SIZE_STYLES: Record<
  Size,
  {minHeight: number; fontSize: number; padding: Padding}
> = {
  sm: {minHeight: 36, fontSize: 12, padding: 'sm'},
  md: {minHeight: 48, fontSize: 14, padding: 'md'},
  lg: {minHeight: 56, fontSize: 16, padding: 'lg'},
};

function resolvePadding(padding: Padding | number): number {
  return typeof padding === 'number' ? padding : PADDING[padding];
}

export function Input({
  label,
  helper,
  error,
  leftSection,
  rightSection,
  size = 'md',
  padding,
  radius = 'md',
  containerStyle,
  inputStyle,
  editable = true,
  placeholderTextColor = colors.textDim,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);
  const sizeStyle = SIZE_STYLES[size];
  const resolvedPadding = resolvePadding(padding ?? sizeStyle.padding);

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          variant="label"
          tone="muted"
          transform="uppercase"
          style={styles.label}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            borderRadius: RADIUS[radius],
            paddingHorizontal: resolvedPadding,
            minHeight: sizeStyle.minHeight,
          },
          focused && styles.fieldFocused,
          hasError && styles.fieldError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {leftSection != null ? (
          <View style={styles.section}>
            {typeof leftSection === 'string' ? (
              <Text tone="slate" weight="semibold" size={size === 'lg' ? 'md' : size}>
                {leftSection}
              </Text>
            ) : (
              leftSection
            )}
          </View>
        ) : null}

        <RNTextInput
          {...rest}
          editable={editable}
          placeholderTextColor={placeholderTextColor}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            {
              paddingVertical: resolvedPadding,
              fontSize: sizeStyle.fontSize,
            },
            inputStyle,
          ]}
        />

        {rightSection != null ? (
          <View style={styles.section}>
            {typeof rightSection === 'string' ? (
              <Text tone="muted" weight="semibold" size={size === 'lg' ? 'md' : size}>
                {rightSection}
              </Text>
            ) : (
              rightSection
            )}
          </View>
        ) : null}
      </View>

      {error ? (
        <Text size="sm" tone="danger" style={styles.caption}>
          {error}
        </Text>
      ) : helper ? (
        <Text size="sm" tone="muted" style={styles.caption}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  fieldFocused: {
    borderColor: colors.accent,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  fieldDisabled: {
    opacity: 0.55,
  },
  section: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamily.regular,
  },
  caption: {
    marginTop: spacing.xs,
  },
});
