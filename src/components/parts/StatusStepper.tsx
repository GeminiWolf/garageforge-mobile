import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { PartStatus } from '../../types';
import { colors, fontFamily } from '../../theme';
import { STATUS_LABELS, STATUS_ORDER } from '../../utils/partStatus';
import { Text } from '../common/Text';

type Props = {
  value: PartStatus;
  onChange: (status: PartStatus) => void;
};

/** To source → Sourcing → Awaiting delivery → Installed. Tap a step to set it. */
export function StatusStepper({ value, onChange }: Props) {
  const current = STATUS_ORDER.indexOf(value);
  const fill = current / (STATUS_ORDER.length - 1);
  return (
    <View
      style={styles.root}
      accessibilityRole="radiogroup"
      accessibilityLabel="Status"
    >
      <View style={styles.track} />
      <View style={[styles.trackFill, { width: `${fill * 75}%` }]} />
      {STATUS_ORDER.map((status, index) => {
        const done = index < current || value === 'installed';
        const active = index === current && value !== 'installed';
        return (
          <Pressable
            key={status}
            accessibilityRole="radio"
            accessibilityState={{ selected: index === current }}
            accessibilityLabel={STATUS_LABELS[status]}
            onPress={() => onChange(status)}
            style={styles.step}
          >
            <View
              style={[
                styles.dot,
                done && styles.dotDone,
                active && styles.dotActive,
              ]}
            >
              {done ? (
                <Check size={14} color={colors.bg} strokeWidth={3} />
              ) : null}
            </View>
            <Text
              style={[styles.label, index === current && styles.labelCurrent]}
              numberOfLines={2}
            >
              {STATUS_LABELS[status]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const DOT = 24;

const styles = StyleSheet.create({
  root: { flexDirection: 'row' },
  // Runs from the centre of the first step to the centre of the last.
  track: {
    position: 'absolute',
    left: '12.5%',
    right: '12.5%',
    top: DOT / 2 - 1,
    height: 2,
    backgroundColor: colors.track,
  },
  trackFill: {
    position: 'absolute',
    left: '12.5%',
    top: DOT / 2 - 1,
    height: 2,
    backgroundColor: colors.accent,
  },
  step: { flex: 1, alignItems: 'center', gap: 8, minHeight: 56 },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  dotActive: {
    borderWidth: 3,
    borderColor: colors.warning,
    backgroundColor: colors.bg,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelCurrent: { fontFamily: fontFamily.semibold, color: colors.text },
});
