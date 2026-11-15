import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { getProgressBarState } from '../../utils/getProgressBarState';

type Props = {
  value: number;
  max: number;
  height?: number;
  color?: string;
  trackColor?: string;
  warning?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function ProgressBar({
  value,
  max,
  height = 2,
  color,
  trackColor = colors.slate600,
  warning = false,
  style,
  accessibilityLabel = 'Progress',
}: Props) {
  const { fill, isOver } = getProgressBarState(value, max);
  const fillColor =
    color ??
    (isOver ? colors.danger : warning ? colors.warning : colors.accent);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{
        min: 0,
        max: Math.max(0, max),
        now: Math.max(0, value),
      }}
      style={[styles.track, { height, backgroundColor: trackColor }, style]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${fill * 100}%`,
            height,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    minWidth: 0,
  },
});
