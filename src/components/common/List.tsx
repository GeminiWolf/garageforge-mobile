import React, { Children, Fragment, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing } from '../../theme';
import { getListItemAccessibilityLabel } from './listHelpers';
import { getListIcon, type ListIconName } from './listIcons';
import { Divider } from './Divider';
import { Text } from './Text';

export type { ListIconName } from './listIcons';
export { getListItemAccessibilityLabel } from './listHelpers';

type ListViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type ListItemProps = {
  icon?: ListIconName;
  label: string;
  description?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  rightSection?: ReactNode;
  value?: string;
};

function ListView({ children, style }: ListViewProps) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.view, style]}>
      {items.map((child, index) => (
        <Fragment key={index}>
          {child}
          {index < items.length - 1 ? (
            <Divider spacing={0} style={styles.divider} />
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}

function ListItem({
  icon,
  label,
  description,
  onPress,
  style,
  rightSection,
  value,
}: ListItemProps) {
  const Icon = icon != null ? getListIcon(icon) : null;
  const accessibilityLabel = getListItemAccessibilityLabel(label, description);
  const content = (
    <>
      {Icon != null ? (
        <View accessible={false}>
          <Icon size={18} color={colors.textDim} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text weight="medium">{label}</Text>
        {description != null && description !== '' ? (
          <Text size="sm" tone="muted" numberOfLines={1} ellipsizeMode="middle">
            {description}
          </Text>
        ) : null}
      </View>
      {rightSection ? (
        rightSection
      ) : (
        <View style={styles.chevronWrap}>
          {value && (
            <Text tone="muted" size="sm">
              {value}
            </Text>
          )}
          {onPress != null ? (
            <ChevronRight size={18} color={colors.textDim} accessible={false} />
          ) : null}
        </View>
      )}
    </>
  );

  if (onPress != null) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.item, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={[styles.item, style]}
    >
      {content}
    </View>
  );
}

export const List = {
  View: ListView,
  Item: ListItem,
};

const styles = StyleSheet.create({
  view: {
    alignSelf: 'stretch',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  pressed: {
    opacity: 0.72,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  divider: {
    marginVertical: 0,
  },
  chevronWrap: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
