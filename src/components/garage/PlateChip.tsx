import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, fontFamily } from '../../theme';
import { Text } from '../common/Text';

/** A number plate, drawn as a small outlined plate. */
export function PlateChip({ plate }: { plate: string }) {
  return (
    <View
      style={styles.plate}
      accessible
      accessibilityLabel={`Number plate ${plate}`}
    >
      <Text style={styles.text} numberOfLines={1}>
        {plate}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.neutralText,
  },
});
