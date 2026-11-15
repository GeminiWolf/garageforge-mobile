import React, { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius as themeRadius, shadows, spacing } from '../../theme';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Radius = 'sm' | 'md' | 'lg' | 'xl';
type Tone = 'surface' | 'raised' | 'transparent';
type ThemeColor = keyof typeof colors;

type Props = {
  children: ReactNode;
  padding?: Padding | number;
  gap?: Padding | number;
  radius?: Radius;
  tone?: Tone;
  /** Theme color key (e.g. `"surface"`) or any CSS/hex color string. Overrides `tone`. */
  backgroundColor?: ThemeColor | (string & {});
  bordered?: boolean;
  shadowed?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SPACING: Record<Padding, number> = {
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
};

const TONE_BG: Record<Tone, string> = {
  surface: colors.surface,
  raised: colors.surfaceRaised,
  transparent: 'transparent',
};

function resolveSpacing(value: Padding | number): number {
  return typeof value === 'number' ? value : SPACING[value];
}

function resolveBackgroundColor(
  backgroundColor: ThemeColor | (string & {}) | undefined,
  tone: Tone,
): string {
  if (backgroundColor == null) {
    return TONE_BG[tone];
  }
  if (backgroundColor in colors) {
    return colors[backgroundColor as ThemeColor];
  }
  return backgroundColor;
}

export function Card({
  children,
  padding = 'lg',
  gap,
  radius = 'sm',
  tone = 'surface',
  backgroundColor,
  bordered = false,
  shadowed = false,
  style,
}: Props) {
  return (
    <View
      style={[
        styles.base,
        {
          padding: resolveSpacing(padding),
          borderRadius: RADIUS[radius],
          backgroundColor: resolveBackgroundColor(backgroundColor, tone),
          ...(gap != null ? { gap: resolveSpacing(gap) } : null),
        },
        bordered && styles.bordered,
        shadowed && shadows.soft,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
});
