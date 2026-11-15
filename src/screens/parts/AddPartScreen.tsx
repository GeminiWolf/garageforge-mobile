import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  TextInput,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/common/Button';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import { Input } from '../../components/common/Input';
import { NestedCategorySheet } from '../../components/common/NestedCategorySheet';
import { SkeletonList } from '../../components/common/Skeleton';
import { Text } from '../../components/common/Text';
import type { GarageStackParamList } from '../../navigation/types';
import { getParts } from '../../services/api';
import { useGarageStore } from '../../store/garageStore';
import type {
  CatalogPartOption,
  PartCategoryOption,
  PartPriority,
} from '../../types';
import { formatCategoryPath } from '../../utils/formatCategoryPath';
import { getCurrencySymbol } from '../../utils/formatMoney';
import { getCatalogPartDefaults } from '../../utils/getCatalogPartDefaults';
import { colors, fontFamily, layout, radius, spacing } from '../../theme';
import { PRIORITY_LABELS } from '../../utils/partStatus';
import { Check, ChevronRight, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<GarageStackParamList, 'AddPart'>;

const PRIORITIES: PartPriority[] = ['urgent', 'soon', 'someday'];
const SAVE_VALIDATION_ERROR = 'Name is required.';

export function AddPartScreen({ navigation, route }: Props) {
  const viewportRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = {
    name: useRef<TextInput>(null),
    number: useRef<TextInput>(null),
    cost: useRef<TextInput>(null),
    notes: useRef<TextInput>(null),
  };
  const activeInput = useRef<TextInput | null>(null);
  const scrollOffset = useRef(0);
  const revealFocusedInput = useCallback(() => {
    const input = activeInput.current;
    const scroll = scrollRef.current;
    if (!input || !scroll || !viewportRef.current) return;
    viewportRef.current.measureInWindow((_x, top, _width, height) => {
      input.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
        if (activeInput.current !== input || height <= 0) return;
        const lowerOverflow =
          inputTop + inputHeight + spacing.lg - (top + height);
        const upperOverflow = inputTop - spacing.lg - top;
        const delta =
          lowerOverflow > 0
            ? lowerOverflow
            : upperOverflow < 0
            ? upperOverflow
            : 0;
        if (delta)
          scroll.scrollTo({
            y: Math.max(0, scrollOffset.current + delta),
            animated: true,
          });
      });
    });
  }, []);
  useEffect(() => {
    const subscription = Keyboard.addListener(
      'keyboardDidShow',
      revealFocusedInput,
    );
    return () => subscription.remove();
  }, [revealFocusedInput]);
  const headerHeight = useHeaderHeight();
  const { bottom } = useSafeAreaInsets();
  const { vehicleId } = route.params;
  const currency = useGarageStore(s => s.settings.currency);
  const apiBaseUrl = useGarageStore(s => s.settings.apiBaseUrl);
  const addTrackedPart = useGarageStore(s => s.addTrackedPart);

  const [manual, setManual] = useState(false);
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
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');

  const showDetails = manual || selectedCatalog != null;

  useEffect(() => {
    if (selectedCatalog) {
      const defaults = getCatalogPartDefaults(
        selectedCatalog,
        formatCategoryPath(categoryPath) || selectedCategory?.name || 'Catalog',
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
    setManual(false);
    setLoading(true);
    setError('');
    try {
      const data = await getParts(apiBaseUrl, cat.id);
      setCatalogParts(data);
      setResults(filterResults(data, query));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load parts';
      setError(message);
      setCatalogParts([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!name.trim()) {
      setError(SAVE_VALIDATION_ERROR);
      return;
    }
    addTrackedPart({
      vehicleId,
      name: name.trim(),
      partNumber: partNumber.trim(),
      category: category.trim() || 'General',
      priority,
      status: 'needed',
      estimatedCost: Number(estimatedCost) || 0,
      estimateProvided: estimatedCost.trim() !== '',
      notes: notes.trim() || undefined,
    });
    navigation.goBack();
  };

  const categoryLabel =
    formatCategoryPath(categoryPath) ||
    selectedCategory?.name ||
    'Choose a category';
  const canRetryLoad =
    error !== '' && error !== SAVE_VALIDATION_ERROR && selectedCategory != null;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={headerHeight}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View
          ref={viewportRef}
          style={styles.flex}
          onLayout={() => requestAnimationFrame(revealFocusedInput)}
        >
          <ScrollView
            ref={scrollRef}
            onScroll={event => {
              scrollOffset.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            keyboardDismissMode="interactive"
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingBottom: bottom }]}
            keyboardShouldPersistTaps="handled"
          >
            {error && error !== SAVE_VALIDATION_ERROR ? (
              <View style={styles.errorRow}>
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

            {manual ? (
              <View style={styles.manualIntro}>
                <Text variant="title">Enter a part</Text>
                <Text variant="caption" tone="muted">
                  Only the name is required. Add other details when you have
                  them.
                </Text>
              </View>
            ) : (
              <Text size="md" tone="muted">
                Pick a category, then the part. Not listed? Enter it yourself.
              </Text>
            )}

            {!manual ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Category: ${categoryLabel}. Change`}
                style={({ pressed }) => [
                  styles.panel,
                  styles.pickerRow,
                  pressed && styles.pressed,
                ]}
                onPress={() => setCategorySheetOpen(true)}
              >
                <View style={styles.pickerText}>
                  <Text size="md" tone="muted">
                    Category
                  </Text>
                  <Text
                    weight="medium"
                    tone={selectedCategory ? 'default' : 'accent'}
                    numberOfLines={2}
                  >
                    {categoryLabel}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textDim} />
              </Pressable>
            ) : null}

            {selectedCategory && !manual && selectedCatalog == null ? (
              <Input
                appearance="outlined"
                size="lg"
                leftSection={<Search size={18} color={colors.textMuted} />}
                placeholder="Filter by name"
                value={query}
                onChangeText={setQuery}
                accessibilityLabel="Filter catalog parts by name"
              />
            ) : null}

            {!manual && loading ? <SkeletonList count={5} /> : null}

            {!manual &&
            selectedCategory &&
            !loading &&
            selectedCatalog == null &&
            results.length > 0 ? (
              <View style={[styles.panel, styles.resultsPanel]}>
                {results.map((part, index) => (
                  <Pressable
                    key={part.id}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.result,
                      index > 0 && styles.resultDivider,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setSelectedCatalog(part)}
                  >
                    <Text style={styles.flex}>{part.name}</Text>
                    <ChevronRight size={18} color={colors.textDim} />
                  </Pressable>
                ))}
              </View>
            ) : null}

            {!manual && selectedCatalog ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Selected ${selectedCatalog.name}. Choose a different part`}
                onPress={() => setSelectedCatalog(null)}
                style={({ pressed }) => [
                  styles.panel,
                  styles.pickerRow,
                  styles.selected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.selectedIcon}>
                  <Check size={16} color={colors.bg} strokeWidth={3} />
                </View>
                <View style={styles.pickerText}>
                  <Text weight="medium">{selectedCatalog.name}</Text>
                  <Text size="md" tone="muted">
                    From the catalogue
                  </Text>
                </View>
                <Text size="md" weight="semibold" tone="accent">
                  Change
                </Text>
              </Pressable>
            ) : null}

            {!manual &&
            selectedCategory &&
            !loading &&
            selectedCatalog == null &&
            results.length === 0 ? (
              <Text variant="caption" tone="muted" style={styles.emptyResults}>
                Nothing in this category matches.
              </Text>
            ) : null}

            {!manual ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setManual(true);
                  setSelectedCatalog(null);
                }}
                style={styles.manualLink}
              >
                <Text weight="semibold" tone="accent">
                  Can’t find it? Enter it yourself
                </Text>
              </Pressable>
            ) : null}

            {showDetails ? (
              <View style={styles.details}>
                <Input
                  appearance="outlined"
                  size="lg"
                  label="Part name"
                  testID="part-name"
                  inputRef={inputRefs.name}
                  onFocus={() => {
                    activeInput.current = inputRefs.name.current;
                    requestAnimationFrame(revealFocusedInput);
                  }}
                  onBlur={() => {
                    if (activeInput.current === inputRefs.name.current)
                      activeInput.current = null;
                  }}
                  placeholder="e.g. Front brake pads"
                  error={error === SAVE_VALIDATION_ERROR ? error : undefined}
                  value={name}
                  onChangeText={setName}
                  containerStyle={styles.field}
                />
                <Input
                  appearance="outlined"
                  size="lg"
                  label="Part number (optional)"
                  testID="part-number"
                  inputRef={inputRefs.number}
                  onFocus={() => {
                    activeInput.current = inputRefs.number.current;
                    requestAnimationFrame(revealFocusedInput);
                  }}
                  onBlur={() => {
                    if (activeInput.current === inputRefs.number.current)
                      activeInput.current = null;
                  }}
                  placeholder="e.g. 8V0 698 151"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={partNumber}
                  onChangeText={setPartNumber}
                  containerStyle={styles.field}
                />
                <Input
                  appearance="outlined"
                  size="lg"
                  label="Estimated cost (optional)"
                  testID="part-cost"
                  inputRef={inputRefs.cost}
                  onFocus={() => {
                    activeInput.current = inputRefs.cost.current;
                    requestAnimationFrame(revealFocusedInput);
                  }}
                  onBlur={() => {
                    if (activeInput.current === inputRefs.cost.current)
                      activeInput.current = null;
                  }}
                  placeholder="0.00"
                  leftSection={getCurrencySymbol(currency)}
                  value={estimatedCost}
                  onChangeText={setEstimatedCost}
                  keyboardType="decimal-pad"
                  containerStyle={styles.field}
                />
                <Input
                  appearance="outlined"
                  size="lg"
                  label="Notes (optional)"
                  testID="part-notes"
                  inputRef={inputRefs.notes}
                  onFocus={() => {
                    activeInput.current = inputRefs.notes.current;
                    requestAnimationFrame(revealFocusedInput);
                  }}
                  onBlur={() => {
                    if (activeInput.current === inputRefs.notes.current)
                      activeInput.current = null;
                  }}
                  placeholder="Supplier, fitment or installation notes"
                  multiline
                  inputStyle={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  containerStyle={styles.field}
                />
                <View style={styles.prioritySection}>
                  <Text style={styles.sectionTitle}>PRIORITY</Text>
                  <SegmentedControl
                    accessibilityLabel="Priority"
                    value={priority}
                    onChange={setPriority}
                    segments={PRIORITIES.map(p => ({
                      value: p,
                      label: PRIORITY_LABELS[p],
                      ...(p === 'urgent'
                        ? {
                            selectedBg: colors.dangerSoft,
                            selectedFg: colors.dangerText,
                          }
                        : {}),
                    }))}
                  />
                </View>
                {manual ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setManual(false)}
                    style={styles.manualLink}
                  >
                    <Text weight="semibold" tone="accent">
                      Choose from the catalogue instead
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
        {showDetails ? (
          <View style={[styles.footer, { paddingBottom: bottom + spacing.md }]}>
            <Button label="Save to this car" size="lg" onPress={save} />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <NestedCategorySheet
        visible={categorySheetOpen}
        baseUrl={apiBaseUrl}
        selectedId={selectedCategory?.id}
        onClose={() => setCategorySheetOpen(false)}
        onManualEntry={() => {
          setCategorySheetOpen(false);
          setSelectedCatalog(null);
          setManual(true);
          setError('');
        }}
        onSelect={loadByCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  manualIntro: { gap: spacing.xs },
  notesInput: { minHeight: 88, textAlignVertical: 'top' },
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  pressed: { opacity: 0.72 },
  content: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  panel: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pickerText: { flex: 1, minWidth: 0, gap: 2 },
  selected: { borderColor: colors.accent },
  selectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsPanel: { paddingHorizontal: spacing.lg },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingVertical: spacing.md,
  },
  resultDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  emptyResults: {
    paddingVertical: spacing.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  error: {
    flex: 1,
  },
  field: {
    marginBottom: 0,
  },
  details: {
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  prioritySection: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
  manualLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
  },
});
