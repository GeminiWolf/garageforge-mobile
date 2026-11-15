import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fontFamily, spacing, typography } from '../../theme';
import { SkeletonList } from './Skeleton';
import { SheetFrame } from './SheetFrame';

export type SearchableOption = {
  key: string;
  label: string;
};

type Props = {
  visible: boolean;
  title: string;
  options: SearchableOption[];
  selectedKey?: string | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel?: string;
  loading?: boolean;
  closeOnSelect?: boolean;
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
  loading = false,
  closeOnSelect = true,
  onClose,
  onSelect,
}: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery('');
  }, [title, visible]);

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

  const selectOption = (item: SearchableOption) => {
    onSelect(item);
    if (closeOnSelect) {
      onClose();
    }
  };

  const renderOption = ({ item }: { item: SearchableOption }) => {
    const selected = item.key === selectedKey;
    return (
      <Pressable
        style={styles.option}
        onPress={() => selectOption(item)}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected }}
      >
        <Text
          style={[styles.optionText, selected && styles.optionTextSelected]}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SheetFrame
      visible={visible}
      title={title}
      onClose={onClose}
      compact={!searchable}
    >
      {searchable ? (
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
      ) : null}
      {loading ? (
        <SkeletonList count={6} />
      ) : searchable ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.key}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {query.trim() ? `No matches for “${query.trim()}”` : emptyLabel}
            </Text>
          }
          renderItem={renderOption}
        />
      ) : (
        <View>
          {filtered.map(item => (
            <View key={item.key}>{renderOption({ item })}</View>
          ))}
        </View>
      )}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 0,
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
    paddingVertical: spacing.xl,
  },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
  },
  optionTextSelected: {
    fontFamily: fontFamily.semibold,
  },
});
