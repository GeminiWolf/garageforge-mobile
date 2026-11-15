import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radius, spacing } from '../../theme';
import { WINDOW_HEIGHT } from '../../utils/device';
import { Text } from './Text';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  compact?: boolean;
  leading?: ReactNode;
};

export function SheetFrame({
  visible,
  title,
  onClose,
  children,
  compact = false,
  leading,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Lifts the sheet above the keyboard so its buttons stay reachable. */}
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View
          style={[
            styles.sheet,
            compact ? styles.compact : { height: WINDOW_HEIGHT - insets.top },
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            {leading}
            <View style={styles.titleWrap} accessibilityRole="header">
              <Text variant="subtitle" numberOfLines={1}>
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={spacing.sm}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <Text weight="medium">Close</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.sm,
  },
  compact: {
    height: undefined,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  close: {
    minHeight: 44,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
