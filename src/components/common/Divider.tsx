import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

type Props = {
  thickness?: number;
  color?: string;
  vertical?: boolean;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
};

export function Divider({
  thickness = 0.5,
  color = colors.borderSubtle,
  vertical = false,
  spacing: gap = spacing.md,
  style,
}: Props) {
  return (
    <View
      accessible={false}
      style={[
        vertical
          ? {
              ...styles.alignSelfStretch,
              width: thickness,
              marginHorizontal: gap,
              backgroundColor: color,
            }
          : {
              ...styles.alignSelfStretch,
              height: thickness,
              marginVertical: gap,
              backgroundColor: color,
            },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  alignSelfStretch: {
    alignSelf: 'stretch',
  },
});
