import React, {useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';
import {Input} from '../../components/common/Input';
import {NestedCategorySheet} from '../../components/common/NestedCategorySheet';
import {SectionHeader} from '../../components/common/SectionHeader';
import {SkeletonList} from '../../components/common/Skeleton';
import {Text} from '../../components/common/Text';
import type {GarageStackParamList} from '../../navigation/types';
import {getParts} from '../../services/api';
import {useGarageStore} from '../../store/garageStore';
import type {
  CatalogPartOption,
  PartCategoryOption,
  PartPriority,
  PartStatus,
} from '../../types';
import {formatCategoryPath} from '../../utils/formatCategoryPath';
import {getCatalogPartDefaults} from '../../utils/getCatalogPartDefaults';
import { colors, radius, spacing } from '../../theme';

type Props = NativeStackScreenProps<GarageStackParamList, 'AddPart'>;
type Tab = 'browse' | 'manual';

const PRIORITIES: PartPriority[] = ['urgent', 'soon', 'someday'];
const STATUSES: PartStatus[] = ['needed', 'sourcing', 'ordered', 'installed'];
const SAVE_VALIDATION_ERROR = 'Name and part number are required.';

export function AddPartScreen({navigation, route}: Props) {
  const { vehicleId } = route.params;
  const apiBaseUrl = useGarageStore(s => s.settings.apiBaseUrl);
  const addTrackedPart = useGarageStore(s => s.addTrackedPart);

  const [tab, setTab] = useState<Tab>('browse');
  const [query, setQuery] = useState('');
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [categoryPath, setCategoryPath] = useState<PartCategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<PartCategoryOption | null>(null);
  const [catalogParts, setCatalogParts] = useState<CatalogPartOption[]>([]);
  const [results, setResults] = useState<CatalogPartOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCatalog, setSelectedCatalog] =
    useState<CatalogPartOption | null>(null);

  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<PartPriority>('soon');
  const [status, setStatus] = useState<PartStatus>('needed');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (selectedCatalog) {
      const defaults = getCatalogPartDefaults(
        selectedCatalog,
        formatCategoryPath(categoryPath) ||
          selectedCategory?.name ||
          'Catalog',
      );
      setName(defaults.name);
      setPartNumber(defaults.partNumber);
      setCategory(defaults.category);
    }
  }, [selectedCatalog, categoryPath, selectedCategory]);

  const filterResults = (parts: CatalogPartOption[], search: string) => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return parts;
    }
    return parts.filter(part => part.name.toLowerCase().includes(q));
  };

  useEffect(() => {
    setResults(filterResults(catalogParts, query));
  }, [catalogParts, query]);

  const loadByCategory = async (
    cat: PartCategoryOption,
    path: PartCategoryOption[],
  ) => {
    setSelectedCategory(cat);
    setCategoryPath(path);
    setCategory(formatCategoryPath(path) || cat.name);
    setSelectedCatalog(null);
    setLoading(true);
    setError('');
    try {
      const data = await getParts(apiBaseUrl, cat.id);
      setCatalogParts(data);
      setResults(filterResults(data, query));
    } catch (err: any) {
      setError(err.message || 'Failed to load parts');
      setCatalogParts([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!name.trim() || !partNumber.trim()) {
      setError(SAVE_VALIDATION_ERROR);
      return;
    }
    const id = addTrackedPart({
      vehicleId,
      catalogPartId: selectedCatalog?.id,
      name: name.trim(),
      partNumber: partNumber.trim(),
      category: category.trim() || 'General',
      priority,
      status,
      estimatedCost: Number(estimatedCost) || 0,
      notes: notes.trim() || undefined,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      navigation.replace('PartDetail', {partId: id});
    }, 600);
  };

  const categoryLabel =
    formatCategoryPath(categoryPath) ||
    selectedCategory?.name ||
    'Choose category';
  const canRetryLoad =
    error !== '' &&
    error !== SAVE_VALIDATION_ERROR &&
    selectedCategory != null;

  return (
    <View style={styles.root}>
      <View style={[styles.flex, styles.sidePadding]}>
        <View style={styles.tabs}>
          {(['browse', 'manual'] as Tab[]).map(t => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text variant="caption" transform="capitalize">
                {t === 'browse' ? 'Browse' : 'Manual'}
              </Text>
            </Pressable>
          ))}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView style={styles.flex}>
            {error ? (
              <View style={styles.errorRow} accessibilityLiveRegion="assertive" accessibilityRole="alert">
                <Text variant="caption" tone="danger" style={styles.error}>
                  {error}
                </Text>
                {canRetryLoad ? (
                  <Button
                    label="Retry"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      if (selectedCategory == null) {
                        return;
                      }
                      loadByCategory(selectedCategory, categoryPath);
                    }}
                  />
                ) : null}
              </View>
            ) : null}
            {saveSuccess ? (
              <View style={styles.successRow} accessibilityLiveRegion="polite">
                <Text variant="caption" tone="accent" weight="semibold">
                  Part saved
                </Text>
              </View>
            ) : null}

            {tab === 'browse' ? (
              <View style={styles.block}>
                <Text variant="caption" tone="muted">
                  Browse parts by category
                </Text>
                <Pressable
                  style={styles.categoryField}
                  onPress={() => setCategorySheetOpen(true)}
                >
                  <Text variant="label" tone="muted" transform="uppercase">
                    Category
                  </Text>
                  <Text>{categoryLabel}</Text>
                </Pressable>

                {selectedCategory ? (
                  <Input
                    placeholder="Filter by name"
                    value={query}
                    onChangeText={setQuery}
                    accessibilityLabel="Filter catalog parts by name"
                  />
                ) : null}
                {loading ? (
                  <SkeletonList count={5} />
                ) : selectedCategory && results.length === 0 ? (
                  <Text
                    variant="caption"
                    tone="muted"
                    align="center"
                    style={styles.emptyResults}
                  >
                    No parts in this category match your search.
                  </Text>
                ) : (
                  results.map(part => (
                    <Pressable
                      key={part.id}
                      style={[
                        styles.result,
                        selectedCatalog?.id === part.id &&
                          styles.resultSelected,
                      ]}
                      onPress={() => setSelectedCatalog(part)}
                    >
                      <Text variant="subtitle">{part.name}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}

            {(tab === 'manual' || selectedCatalog) && (
              <>
                <SectionHeader
                  title="Details"
                  subtitle="Priority, notes, estimate"
                />
                <Input
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  containerStyle={styles.field}
                />
                <Input
                  label="Part number"
                  value={partNumber}
                  onChangeText={setPartNumber}
                  containerStyle={styles.field}
                />
                <Input
                  label="Category"
                  value={category}
                  onChangeText={setCategory}
                  containerStyle={styles.field}
                />
                <Input
                  label="Estimated cost"
                  value={estimatedCost}
                  onChangeText={setEstimatedCost}
                  keyboardType="decimal-pad"
                  containerStyle={styles.field}
                />
                <Input
                  label="Notes"
                  value={notes}
                  onChangeText={setNotes}
                  containerStyle={styles.field}
                />
                <Text
                  variant="label"
                  tone="muted"
                  transform="uppercase"
                  style={styles.chipLabel}
                >
                  Priority
                </Text>
                <View style={styles.chips}>
                  {PRIORITIES.map(p => (
                    <Chip
                      key={p}
                      label={p}
                      selected={priority === p}
                      onPress={() => setPriority(p)}
                    />
                  ))}
                </View>
                <Text
                  variant="label"
                  tone="muted"
                  transform="uppercase"
                  style={styles.chipLabel}
                >
                  Status
                </Text>
                <View style={styles.chips}>
                  {STATUSES.map(s => (
                    <Chip
                      key={s}
                      label={s}
                      selected={status === s}
                      onPress={() => setStatus(s)}
                    />
                  ))}
                </View>
                <Button label="Save tracked part" onPress={save} />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <NestedCategorySheet
        visible={categorySheetOpen}
        baseUrl={apiBaseUrl}
        selectedId={selectedCategory?.id}
        onClose={() => setCategorySheetOpen(false)}
        onSelect={loadByCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    marginVertical: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  flex: {
    flex: 1,
  },
  sidePadding: {
    paddingHorizontal: spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.accentSoft,
  },
  block: {
    flex: 1,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  categoryField: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipLabel: {
    marginBottom: 4,
  },
  emptyResults: {
    paddingVertical: spacing.lg,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  error: {
    flex: 1,
  },
  successRow: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  result: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  resultSelected: {
    borderColor: colors.accent,
  },
  field: {
    marginBottom: spacing.sm,
  },
});
