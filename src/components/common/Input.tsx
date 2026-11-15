import React, { ReactNode, useState } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type StyleProp,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, fontFamily, spacing } from '../../theme';
import { Text } from './Text';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Radius = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<RNTextInputProps, 'style'> & {
  inputRef?: React.Ref<RNTextInput>;
  appearance?: 'underline' | 'outlined';
  label?: string;
  helper?: string;
  error?: string;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  size?: Size;
  padding?: Padding | number;
  radius?: Radius;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

const SIZE_STYLES: Record<
  Size,
  { minHeight: number; fontSize: number; padding: Padding }
> = {
  sm: { minHeight: 36, fontSize: 12, padding: 'sm' },
  md: { minHeight: 48, fontSize: 14, padding: 'md' },
  lg: { minHeight: 56, fontSize: 16, padding: 'lg' },
};

export function Input({
  inputRef,
  appearance = 'underline',
  label,
  helper,
  error,
  leftSection,
  rightSection,
  size = 'md',
  padding: _padding,
  radius: _radius,
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

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="label" tone="muted" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            minHeight: sizeStyle.minHeight,
          },
          appearance === 'outlined' && styles.fieldOutlined,
          focused && styles.fieldFocused,
          focused && appearance === 'outlined' && styles.outlinedFocused,
          hasError && styles.fieldError,
          hasError && appearance === 'outlined' && styles.outlinedError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {leftSection != null ? (
          <View style={styles.section}>
            {typeof leftSection === 'string' ? (
              <Text
                tone="slate"
                weight="semibold"
                size={size === 'lg' ? 'md' : size}
              >
                {leftSection}
              </Text>
            ) : (
              leftSection
            )}
          </View>
        ) : null}

        <RNTextInput
          {...rest}
          ref={inputRef}
          editable={editable}
          accessibilityLabel={rest.accessibilityLabel ?? label}
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
              paddingVertical: spacing.sm,
              fontSize: sizeStyle.fontSize,
            },
            inputStyle,
          ]}
        />

        {rightSection != null ? (
          <View style={styles.section}>
            {typeof rightSection === 'string' ? (
              <Text
                tone="muted"
                weight="semibold"
                size={size === 'lg' ? 'md' : size}
              >
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
  outlinedFocused: { borderColor: colors.accent },
  outlinedError: { borderColor: colors.danger },
  field: {
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  fieldOutlined: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  fieldFocused: {
    borderBottomColor: colors.accent,
    borderBottomWidth: 1,
  },
  fieldError: {
    borderBottomColor: colors.danger,
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
