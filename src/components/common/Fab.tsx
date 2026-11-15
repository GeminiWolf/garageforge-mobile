import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily } from '../../theme';

type Props = {
  label: string;
  onPress: () => void;
  /** Gap above the bottom edge (or above the tab bar on tab screens). */
  bottom?: number;
  /** Add the system navigation area. Off on tab screens, where the tab bar already does. */
  aboveSystemBar?: boolean;
  testID?: string;
};

/** Extended floating action button: the screen's main "add" action. */
export function Fab({
  label,
  onPress,
  bottom = 24,
  aboveSystemBar = true,
  testID,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom: bottom + (aboveSystemBar ? insets.bottom : 0) },
        pressed && styles.pressed,
      ]}
    >
      <Plus size={22} color={colors.bg} strokeWidth={2.4} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    height: 56,
    paddingLeft: 16,
    paddingRight: 20,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: colors.bg,
  },
});
