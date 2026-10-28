import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme';
import { Text } from './Text';

export type DropdownOption = {
  label: string;
  value: string;
};

type Props = {
  placeholder?: string;
  value?: string | null;
  options?: DropdownOption[];
  items?: DropdownOption[];
  onChange?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

type AnchorLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getDropdownLabel(
  options: DropdownOption[] | undefined,
  value: string | null | undefined,
  placeholder?: string,
): string {
  if (value != null && value !== '') {
    return options?.find(option => option.value === value)?.label ?? value;
  }
  return placeholder ?? '';
}

export function Dropdown({
  placeholder,
  value,
  options,
  items,
  onChange,
  style,
}: Props) {
  const resolvedOptions = items ?? options ?? [];
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorLayout | null>(null);
  const fieldRef = useRef<View>(null);
  const label = getDropdownLabel(resolvedOptions, value, placeholder);
  const showingPlaceholder = value == null || value === '';
  const windowSize = Dimensions.get('window');

  const close = () => {
    setOpen(false);
    setAnchor(null);
  };

  const openMenu = () => {
    if (resolvedOptions.length === 0) {
      return;
    }
    fieldRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  return (
    <View style={[styles.wrap, style]}>
      <View ref={fieldRef} collapsable={false}>
        <Pressable
          style={[styles.field, open && styles.fieldOpen]}
          onPress={() => {
            if (open) {
              close();
              return;
            }
            openMenu();
          }}
          accessibilityRole="button"
          accessibilityLabel={placeholder ?? 'Dropdown'}
          accessibilityState={{ expanded: open }}
        >
          <Text
            size="sm"
            tone={showingPlaceholder ? 'dim' : 'default'}
            numberOfLines={1}
            style={styles.label}
          >
            {label}
          </Text>
          <Text size="sm" tone="dim" accessible={false}>
            {open ? '▴' : '▾'}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={close}
        statusBarTranslucent
      >
        <Pressable
          style={[
            styles.backdrop,
            { width: windowSize.width, height: windowSize.height },
          ]}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dropdown"
        >
          {anchor ? (
            <View
              style={[
                styles.menu,
                {
                  top: anchor.y + anchor.height + spacing.xs,
                  left: anchor.x,
                  width: Math.max(anchor.width, 120),
                },
              ]}
              onStartShouldSetResponder={() => true}
              accessibilityRole="menu"
            >
              {resolvedOptions.map(option => {
                const selected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={event => {
                      event.stopPropagation?.();
                      onChange?.(option.value);
                      close();
                    }}
                    accessibilityRole="menuitem"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected }}
                  >
                    <Text
                      size="sm"
                      tone={selected ? 'accent' : 'default'}
                      weight={selected ? 'semibold' : 'regular'}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    zIndex: 1,
  },
  field: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  fieldOpen: {
    borderColor: colors.accent,
  },
  label: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: colors.overlay,
  },
  menu: {
    position: 'absolute',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    elevation: 8,
    ...shadows.soft,
  },
  option: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  optionSelected: {
    backgroundColor: colors.accentSoft,
  },
});
