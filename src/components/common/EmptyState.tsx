import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="title">{title}</Text>
      {subtitle ? (
        <Text variant="body" tone="muted" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  subtitle: {
    maxWidth: 280,
  },
  button: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
