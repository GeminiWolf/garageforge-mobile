import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';

import { Text } from '../../components/common/Text';
import { colors, layout, spacing } from '../../theme';

type AppHeaderProps = {
  title: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  /** A large page title for top-level tabs. */
  large?: boolean;
};

export function HeaderAction({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Text weight="medium">{label}</Text>
    </Pressable>
  );
}

export function AppHeader({ title, onBack, right, large }: AppHeaderProps) {
  const { top } = useSafeAreaInsets();

  if (large) {
    return (
      <View style={[styles.largeBar, { paddingTop: top + spacing.lg }]}>
        <View style={styles.title} accessibilityRole="header">
          <Text variant="hero" numberOfLines={1}>
            {title}
          </Text>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    );
  }

  return (
    <View style={[styles.bar, { paddingTop: top + spacing.sm }]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <ChevronLeft color={colors.text} size={24} />
        </Pressable>
      ) : null}
      <View style={styles.title} accessibilityRole="header">
        {typeof title === 'string' ? (
          <Text variant="subtitle" numberOfLines={1} size="xl">
            {title}
          </Text>
        ) : (
          title
        )}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

function resolveStackTitle({
  options,
  route,
}: NativeStackHeaderProps): ReactNode {
  const { headerTitle, title } = options;
  if (typeof headerTitle === 'function') {
    return headerTitle({
      children: title ?? route.name,
      tintColor: colors.text,
    });
  }
  if (typeof headerTitle === 'string') {
    return headerTitle;
  }
  return title ?? route.name;
}

export function StackHeader(props: NativeStackHeaderProps) {
  const { navigation, options, back } = props;
  const right = options.headerRight?.({
    tintColor: colors.text,
    canGoBack: back != null,
  });

  return (
    <AppHeader
      title={resolveStackTitle(props)}
      onBack={back ? () => navigation.goBack() : undefined}
      right={right}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    minHeight: 44,
  },
  largeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  back: {
    minWidth: 44,
    minHeight: 44,
    marginLeft: -spacing.sm,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    justifyContent: 'center',
  },
  right: {
    marginLeft: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  action: {
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  pressed: {
    opacity: 0.72,
  },
});
