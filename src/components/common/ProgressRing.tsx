import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontFamily } from '../../theme';
import { Text } from './Text';

type Props = {
  done: number;
  total: number;
  size?: number;
  stroke?: number;
};

/** A ring that fills as parts are installed, with the percentage inside. */
export function ProgressRing({ done, total, size = 72, stroke = 8 }: Props) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const share = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${done} of ${total} parts installed`}
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.track}
          strokeWidth={stroke}
          fill="none"
        />
        {share > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference * share} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.label}>{Math.round(share * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fontFamily.semibold, fontSize: 17, color: colors.text },
});
