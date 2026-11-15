import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../common/EmptyState';
import { Fab } from '../common/Fab';
import { Input } from '../common/Input';
import { ProgressRing } from '../common/ProgressRing';
import { StatusPill } from '../common/StatusPill';
import { Text } from '../common/Text';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import {
  colors,
  fontFamily,
  layout,
  radius,
  spacing,
  tabularNums,
} from '../../theme';
import { getBudgetParts } from '../../utils/budgetPlanner';
import { getCommittedSpend } from '../../utils/budgetStatus';
import { getChecklistParts } from '../../utils/filterChecklistParts';
import { formatMoney } from '../../utils/formatMoney';
import { getVehicleHealth } from '../../utils/healthSummary';
import { hasPartEstimate } from '../../utils/partEstimate';
import { statusFromChecklistChecked } from '../../utils/partsChecklistStatus';
import { useBudgetOverview } from '../../hooks/useBudgetOverview';
import { useDebounce } from '../../hooks/useDebounce';
import type { PartStatus } from '../../types/garage';
import { TrackedPartRow } from './TrackedPartRow';

type Scope = 'open' | 'urgent' | 'all';

type Props = {
  vehicleId: string;
  /** Only this job's parts (the car's current job). */
  jobId?: string;
  navigation: NativeStackNavigationProp<GarageStackParamList>;
  /** Shown above the overview (the Parts / Details switch). */
  header?: ReactNode;
};

export function VehiclePartsWorkspace({
  vehicleId,
  jobId,
  navigation,
  header,
}: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<Scope>('open');
  const debouncedSearch = useDebounce(search, 300);

  const trackedParts = useGarageStore(s => s.trackedParts);
  const updateTrackedPart = useGarageStore(s => s.updateTrackedPart);
  const currency = useGarageStore(s => s.settings.currency);

  const parts = useMemo(
    () =>
      trackedParts.filter(
        part =>
          part.vehicleId === vehicleId && (!jobId || part.jobId === jobId),
      ),
    [trackedParts, vehicleId, jobId],
  );
  const openParts = parts.filter(part => part.status !== 'installed');
  const urgentParts = openParts.filter(part => part.priority === 'urgent');
  const scopedParts =
    scope === 'open' ? openParts : scope === 'urgent' ? urgentParts : parts;

  const checklist = useMemo(
    () =>
      getChecklistParts(scopedParts, {
        query: debouncedSearch,
        sort: 'priority',
      }),
    [scopedParts, debouncedSearch],
  );

  const { totalNeeded } = useBudgetOverview(parts);
  const budgetParts = getBudgetParts(parts);
  const missingEstimates = budgetParts.filter(
    part => !hasPartEstimate(part),
  ).length;
  const health = getVehicleHealth(parts);
  const spentOrOrdered = getCommittedSpend(parts);
  const installed = parts.length - openParts.length;
  const hasQuery = search.trim() !== '';

  const [undo, setUndo] = useState<{
    partId: string;
    name: string;
    previous: PartStatus;
  } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const handlePartCheckedChange = (partId: string, checked: boolean) => {
    const part = parts.find(item => item.id === partId);
    updateTrackedPart(partId, { status: statusFromChecklistChecked(checked) });
    clearTimeout(undoTimer.current);
    if (checked && part) {
      // Ticked parts leave the Open view, so offer a way back.
      setUndo({ partId, name: part.name, previous: part.status });
      undoTimer.current = setTimeout(() => setUndo(null), 5000);
    } else {
      setUndo(null);
    }
  };

  const scopes: Array<{ value: Scope; label: string }> = [
    { value: 'open', label: `Open · ${openParts.length}` },
    { value: 'urgent', label: `Urgent · ${urgentParts.length}` },
    { value: 'all', label: `All · ${parts.length}` },
  ];

  const overview =
    parts.length > 0 ? (
      <View style={styles.panel}>
        <View style={styles.overviewTop}>
          <ProgressRing done={installed} total={parts.length} />
          <View style={styles.overviewText}>
            <Text style={styles.toGo}>
              {openParts.length === 0
                ? 'All parts installed'
                : `${installed} of ${parts.length} installed`}
            </Text>
            <View style={styles.pills}>
              {health.urgentCount ? (
                <StatusPill
                  tone="danger"
                  dot
                  size="md"
                  label={`${health.urgentCount} urgent`}
                />
              ) : null}
              {health.orderedCount ? (
                <StatusPill
                  tone="warning"
                  size="md"
                  label={`${health.orderedCount} awaiting delivery`}
                />
              ) : null}
            </View>
          </View>
        </View>
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text size="md" tone="muted">
              Spent or ordered
            </Text>
            <Text weight="semibold" style={[styles.amount, tabularNums]}>
              {formatMoney(spentOrOrdered, currency)}
            </Text>
          </View>
          <View style={styles.tile}>
            <Text size="md" tone="muted">
              Still to buy
            </Text>
            <Text weight="semibold" style={[styles.amount, tabularNums]}>
              {budgetParts.length && missingEstimates === budgetParts.length
                ? 'Not estimated'
                : formatMoney(totalNeeded, currency)}
            </Text>
            {missingEstimates && missingEstimates < budgetParts.length ? (
              <Text size="sm" tone="muted">
                {missingEstimates} without a price
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    ) : null;

  const tools =
    parts.length > 0 ? (
      <View style={styles.tools}>
        <Input
          appearance="outlined"
          size="lg"
          placeholder="Find a part"
          leftSection={<Search size={18} color={colors.textMuted} />}
          value={search}
          onChangeText={setSearch}
        />
        <View
          style={styles.chips}
          accessibilityRole="tablist"
          accessibilityLabel="Filter parts"
        >
          {scopes.map(option => {
            const selected = option.value === scope;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setScope(option.value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    selected && styles.chipLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      <FlatList
        keyExtractor={item => item.id}
        data={checklist}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: layout.fabClearance + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerStack}>
            {header}
            {overview}
            {tools}
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.rowWrap,
              index === 0 && styles.rowFirst,
              index === checklist.length - 1 && styles.rowLast,
            ]}
          >
            <TrackedPartRow
              part={item}
              currency={currency}
              checkbox
              checked={item.status === 'installed'}
              divider={index < checklist.length - 1}
              onCheckedChange={checked =>
                handlePartCheckedChange(item.id, checked)
              }
              onPress={() =>
                navigation.navigate('PartDetail', { partId: item.id })
              }
            />
          </View>
        )}
        ListFooterComponent={
          checklist.length > 0 ? (
            <Text size="md" tone="muted" style={styles.hint}>
              Tick a part when it’s installed
            </Text>
          ) : null
        }
        ListEmptyComponent={
          parts.length === 0 ? (
            <EmptyState
              title="No parts on this job yet"
              subtitle="Add the parts this job needs. Tick one off when it’s installed."
              actionLabel="Add part"
              onAction={() => navigation.navigate('AddPart', { vehicleId })}
            />
          ) : (
            <View style={styles.filterEmpty}>
              <Text tone="muted">
                {hasQuery ? 'Nothing matches' : 'Nothing in this view'}
              </Text>
              <Pressable
                onPress={() => {
                  if (hasQuery) {
                    setSearch('');
                    return;
                  }
                  setScope('all');
                }}
                accessibilityRole="button"
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text weight="semibold" tone="accent">
                  {hasQuery ? 'Clear search' : 'Show all'}
                </Text>
              </Pressable>
            </View>
          )
        }
      />
      {undo ? (
        <View
          style={[styles.undoBar, { bottom: spacing.xl + insets.bottom }]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.undoText} numberOfLines={1}>
            {undo.name} marked installed
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Undo marking ${undo.name} installed`}
            hitSlop={spacing.sm}
            onPress={() => {
              updateTrackedPart(undo.partId, { status: undo.previous });
              clearTimeout(undoTimer.current);
              setUndo(null);
            }}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text weight="semibold" tone="accent">
              Undo
            </Text>
          </Pressable>
        </View>
      ) : parts.length > 0 ? (
        <Fab
          label="Add part"
          onPress={() => navigation.navigate('AddPart', { vehicleId })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: {
    paddingHorizontal: layout.gutter,
    paddingBottom: layout.fabClearance,
    flexGrow: 1,
  },
  headerStack: { gap: 14, paddingTop: spacing.md, paddingBottom: 14 },
  panel: {
    padding: 18,
    gap: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  overviewTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  overviewText: { flex: 1, gap: 6 },
  toGo: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 26 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceSunken,
    gap: 2,
  },
  amount: { fontSize: 18, lineHeight: 24 },
  tools: { gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.accentContainer,
    borderColor: colors.accent,
  },
  chipLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.neutralText,
  },
  chipLabelSelected: { fontFamily: fontFamily.semibold, color: colors.text },
  rowWrap: {
    backgroundColor: colors.surfaceRaised,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
  },
  rowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  hint: { textAlign: 'center', marginTop: spacing.md },
  undoBar: {
    position: 'absolute',
    left: layout.gutter,
    right: layout.gutter,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  undoText: { flex: 1 },
  filterEmpty: { paddingVertical: spacing.xl, gap: spacing.md },
  pressed: { opacity: 0.72 },
});
