import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getCategories } from '../../services/api';
import type { PartCategoryOption } from '../../types';
import { formatCategoryPath } from '../../utils/formatCategoryPath';
import { colors, fontFamily, spacing, typography } from '../../theme';
import { Button } from './Button';
import { SkeletonList } from './Skeleton';
import { SheetFrame } from './SheetFrame';
import { Text as AppText } from './Text';

type Props = {
  visible: boolean;
  baseUrl: string;
  selectedId?: string | null;
  onClose: () => void;
  onManualEntry?: () => void;
  onSelect: (category: PartCategoryOption, path: PartCategoryOption[]) => void;
};

export function NestedCategorySheet({
  visible,
  baseUrl,
  selectedId,
  onClose,
  onManualEntry,
  onSelect,
}: Props) {
  const [path, setPath] = useState<PartCategoryOption[]>([]);
  const [options, setOptions] = useState<PartCategoryOption[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const parentId = path.length > 0 ? path[path.length - 1].id : undefined;

  useEffect(() => {
    if (!visible) {
      return;
    }
    setQuery('');
    setError('');
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    getCategories(baseUrl, parentId)
      .then(data => {
        if (!cancelled) {
          setOptions(data);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Failed to load categories');
          setOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [visible, baseUrl, parentId, reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter(opt => opt.name.toLowerCase().includes(q));
  }, [options, query]);

  const breadcrumb = formatCategoryPath(path);

  const goBack = () => {
    setQuery('');
    setPath(prev => prev.slice(0, -1));
  };

  const selectCategory = (
    category: PartCategoryOption,
    nextPath: PartCategoryOption[],
  ) => {
    onSelect(category, nextPath);
    onClose();
  };

  const openCategory = async (category: PartCategoryOption) => {
    setLoading(true);
    setError('');
    try {
      const children = await getCategories(baseUrl, category.id);
      if (children.length > 0) {
        setQuery('');
        setPath(prev => [...prev, category]);
      } else {
        selectCategory(category, [...path, category]);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to open category';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SheetFrame
      visible={visible}
      title="Category"
      onClose={onClose}
      leading={
        path.length > 0 ? (
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <AppText weight="medium">Back</AppText>
          </Pressable>
        ) : null
      }
    >
      {breadcrumb ? (
        <Text style={styles.breadcrumb} numberOfLines={2}>
          {breadcrumb}
        </Text>
      ) : null}

      {path.length > 0 ? (
        <Pressable
          style={styles.useCurrent}
          onPress={() => selectCategory(path[path.length - 1], path)}
        >
          <Text style={styles.useCurrentText}>
            Use “{path[path.length - 1].name}”
          </Text>
        </Pressable>
      ) : null}

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search this level"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        accessibilityLabel="Search categories"
      />

      {loading ? (
        <View accessibilityLiveRegion="polite">
          <AppText variant="caption" tone="muted">
            Loading categories…
          </AppText>
          <SkeletonList />
        </View>
      ) : error ? (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          <AppText variant="subtitle">Catalogue unavailable</AppText>
          <AppText variant="caption" tone="muted">
            We couldn’t load categories. Try again or enter the part yourself.
          </AppText>
          {onManualEntry ? (
            <Button
              label="Enter part manually"
              variant="ghost"
              onPress={onManualEntry}
            />
          ) : null}
          <Button
            label="Retry"
            variant="ghost"
            onPress={() => setReloadKey(key => key + 1)}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          ListEmptyComponent={
            <View style={styles.feedback}>
              <AppText variant="subtitle">
                {query.trim()
                  ? 'No matching categories'
                  : 'No categories available'}
              </AppText>
              <AppText variant="caption" tone="muted">
                {query.trim()
                  ? 'Try another search or enter the part yourself.'
                  : 'You can still add a part manually.'}
              </AppText>
              {query.trim() ? (
                <Button
                  label="Clear search"
                  variant="ghost"
                  onPress={() => {
                    setQuery('');
                    Keyboard.dismiss();
                  }}
                />
              ) : (
                <Button
                  label="Retry"
                  variant="ghost"
                  onPress={() => setReloadKey(key => key + 1)}
                />
              )}
              {onManualEntry ? (
                <Button
                  label="Enter part manually"
                  variant="ghost"
                  onPress={onManualEntry}
                />
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const selected = item.id === selectedId;
            return (
              <Pressable
                style={styles.option}
                onPress={() => openCategory(item)}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
      {onManualEntry && !error && (loading || filtered.length > 0) ? (
        <Button
          label="Enter part manually"
          variant="ghost"
          onPress={onManualEntry}
        />
      ) : null}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  feedback: { paddingVertical: spacing.xl, gap: spacing.md },
  back: {
    minHeight: 44,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  breadcrumb: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  useCurrent: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  useCurrentText: {
    ...typography.body,
    color: colors.text,
    fontFamily: fontFamily.medium,
  },
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
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
