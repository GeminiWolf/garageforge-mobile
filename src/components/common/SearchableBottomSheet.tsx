import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, radius, spacing, typography } from '../../theme';
import { WINDOW_HEIGHT } from '../../utils/device';
import ButtonIcon from './ButtonIcon';
import { getListItemAccessibilityLabel } from './listHelpers';

export type SearchableOption = {
  key: string;
  label: string;
  detail?: string;
};

type Props = {
  visible: boolean;
  title: string;
  options: SearchableOption[];
  selectedKey?: string | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  onClose: () => void;
  onSelect: (option: SearchableOption) => void;
};

export function SearchableBottomSheet({
  visible,
  title,
  options,
  selectedKey,
  searchable = true,
  searchPlaceholder = 'Search…',
  emptyLabel = 'No matches',
  onClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      setQuery('');
    }
  }, [visible]);

  const filtered = useMemo(() => {
    if (!searchable) {
      return options;
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter(opt => opt.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const renderOption = (item: SearchableOption) => {
    const selected = item.key === selectedKey;
    return (
      <Pressable
        key={item.key}
        style={[styles.option, selected && styles.optionSelected]}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        accessibilityRole="button"
        accessibilityLabel={getListItemAccessibilityLabel(
          item.label,
          item.detail,
        )}
        accessibilityState={{ selected }}
      >
        <Text
          style={[styles.optionText, selected && styles.optionTextSelected]}
        >
          {item.label}
        </Text>
        {item.detail ? (
          <Text style={styles.optionDetail}>{item.detail}</Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { height: WINDOW_HEIGHT - insets.top },
            !searchable && styles.sheetCompact,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <ButtonIcon icon="X" variant="secondary" onPress={onClose} />
          </View>
          {searchable ? (
            <>
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                accessibilityLabel={`Search ${title}`}
              />
              <FlatList
                data={filtered}
                keyExtractor={item => item.key}
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                ListEmptyComponent={
                  <Text style={styles.empty}>{emptyLabel}</Text>
                }
                renderItem={({ item }) => renderOption(item)}
              />
            </>
          ) : (
            <View>{filtered.map(renderOption)}</View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetCompact: {
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
  title: {
    ...typography.subtitle,
    color: colors.text,
  },
  search: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontFamily: fontFamily.regular,
    marginBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  optionSelected: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    borderBottomWidth: 0,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.accent,
    fontFamily: fontFamily.semibold,
  },
  optionDetail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
