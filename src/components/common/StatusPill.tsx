import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, fontFamily } from '../../theme';
import type { PillTone } from '../../utils/partStatus';
import { Text } from './Text';

const TONES: Record<PillTone, { bg: string; fg: string; dot: string }> = {
  danger: { bg: colors.dangerSoft, fg: colors.dangerText, dot: colors.danger },
  warning: {
    bg: colors.warningSoft,
    fg: colors.warningText,
    dot: colors.warning,
  },
  accent: {
    bg: colors.accentTint,
    fg: colors.onAccentContainer,
    dot: colors.accent,
  },
  neutral: {
    bg: colors.neutralSoft,
    fg: colors.neutralText,
    dot: colors.textMuted,
  },
  info: { bg: colors.infoSoft, fg: colors.infoText, dot: colors.infoText },
};

type Props = {
  label: string;
  tone?: PillTone;
  /** Small coloured dot before the label (used for "urgent"). */
  dot?: boolean;
  size?: 'sm' | 'md';
};

export function StatusPill({
  label,
  tone = 'neutral',
  dot,
  size = 'sm',
}: Props) {
  const palette = TONES[tone];
  return (
    <View
      style={[
        styles.pill,
        size === 'md' ? styles.md : styles.sm,
        { backgroundColor: palette.bg },
      ]}
    >
      {dot ? (
        <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      ) : null}
      <Text
        style={[
          styles.label,
          size === 'md' ? styles.labelMd : null,
          { color: palette.fg },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 999,
  },
  sm: { height: 22, paddingHorizontal: 8 },
  md: { height: 28, paddingHorizontal: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  labelMd: { fontSize: 13 },
});
