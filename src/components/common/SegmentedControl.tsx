import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../../theme';

export type Segment<T extends string> = {
  value: T;
  label: string;
  /** Colours for the selected state (defaults to the accent container). */
  selectedBg?: string;
  selectedFg?: string;
};

type Props<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** A row of 2–4 options in one rounded track; one is always selected. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.track}
    >
      {segments.map(segment => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(segment.value)}
            style={[
              styles.segment,
              selected && {
                backgroundColor: segment.selectedBg ?? colors.accentContainer,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                selected && styles.labelSelected,
                selected && segment.selectedFg
                  ? { color: segment.selectedFg }
                  : null,
              ]}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.neutralText,
  },
  labelSelected: { fontFamily: fontFamily.semibold, color: colors.text },
});
