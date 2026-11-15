import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Vehicle } from '../../types/garage';
import { colors, fontFamily, spacing } from '../../theme';
import { carInitials, carSubtitle, carTitle } from '../../utils/carInfo';
import { Text } from '../common/Text';

type Props = {
  vehicle: Vehicle;
  /** In the workshop now, or when its last job ended. */
  inNow: boolean;
  lastLabel?: string;
  divider?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

/** One compact line per car, for the All cars list and search results. */
export function CarRow({
  vehicle,
  inNow,
  lastLabel,
  divider,
  onPress,
  onLongPress,
}: Props) {
  const title = carTitle(vehicle);
  const subtitle = [carSubtitle(vehicle), vehicle.plate]
    .filter(Boolean)
    .join(' · ');
  const status = inNow ? 'In the workshop now' : lastLabel ?? '';
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, status].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.badge}>
        <Text style={styles.initials}>{carInitials(vehicle)}</Text>
      </View>
      <View style={[styles.body, divider && styles.divider]}>
        <View style={styles.text}>
          <Text weight="medium" numberOfLines={1}>
            {title}
          </Text>
          <Text size="sm" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {inNow ? (
          <View style={styles.inNow}>
            <View style={styles.dot} />
            <Text size="sm" style={styles.inNowText}>
              In now
            </Text>
          </View>
        ) : lastLabel ? (
          <Text size="sm" tone="muted">
            {lastLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.lg,
  },
  pressed: { backgroundColor: colors.surfaceSunken },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: colors.accent,
  },
  body: {
    flex: 1,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
  inNow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  inNowText: { color: colors.onAccentContainer },
});
