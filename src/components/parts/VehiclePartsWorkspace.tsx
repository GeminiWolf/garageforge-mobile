import { getBudgetParts } from '../../utils/budgetPlanner';
import { hasPartEstimate } from '../../utils/partEstimate';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, MoreHorizontal } from 'lucide-react-native';

import { EmptyState } from '../common/EmptyState';
import { FilterTabs } from '../common/FilterTabs';
import { Input } from '../common/Input';
import { Text } from '../common/Text';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import { colors, layout, spacing, tabularNums } from '../../theme';
import { getChecklistParts } from '../../utils/filterChecklistParts';
import { statusFromChecklistChecked } from '../../utils/partsChecklistStatus';
import { useBudgetOverview } from '../../hooks/useBudgetOverview';
import { formatMoney } from '../../utils/formatMoney';
import { getCommittedSpend } from '../../utils/budgetStatus';
import { useDebounce } from '../../hooks/useDebounce';
import { getVehicleHealth } from '../../utils/healthSummary';
import type { PartStatus } from '../../types/garage';
import { TrackedPartRow } from './TrackedPartRow';

type Scope = 'open' | 'all' | 'urgent';

type Props = {
  vehicleId: string;
  navigation: NativeStackNavigationProp<GarageStackParamList>;
  header?: ReactNode;
  onRemoveVehicle?: () => void;
};

const SCOPE_OPTIONS: Array<{ value: Scope; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'all', label: 'All' },
];

export function VehiclePartsWorkspace({
  vehicleId,
  navigation,
  header,
  onRemoveVehicle,
}: Props) {
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<Scope>('open');
  const debouncedSearch = useDebounce(search, 300);

  const trackedParts = useGarageStore(s => s.trackedParts);
  const updateTrackedPart = useGarageStore(s => s.updateTrackedPart);
  const currency = useGarageStore(s => s.settings.currency);

  const parts = useMemo(
    () => trackedParts.filter(part => part.vehicleId === vehicleId),
    [trackedParts, vehicleId],
  );

  const scopedParts = useMemo(() => {
    if (scope === 'open') {
      return parts.filter(part => part.status !== 'installed');
    }
    if (scope === 'urgent') {
      return parts.filter(
        part => part.priority === 'urgent' && part.status !== 'installed',
      );
    }
    return parts;
  }, [parts, scope]);

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
  const openCount = parts.filter(part => part.status !== 'installed').length;
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

  return (
    <View style={styles.root}>
      {header}
      <View style={styles.summary}>
        <View style={styles.summaryHeading}>
          <Text variant="label" tone="accent">
            OVERVIEW
          </Text>
          {onRemoveVehicle ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vehicle options"
              style={styles.menu}
              onPress={() =>
                Alert.alert('Vehicle options', 'Manage this vehicle', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove from garage',
                    style: 'destructive',
                    onPress: onRemoveVehicle,
                  },
                ])
              }
            >
              <MoreHorizontal size={22} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        {parts.length > 0 ? (
          <>
            <View style={styles.summaryHeading}>
              <View>
                <Text variant="hero" style={tabularNums}>
                  {openCount}
                </Text>
                <Text variant="caption" tone="muted">
                  {openCount === 1 ? 'Part to go' : 'Parts to go'}
                </Text>
              </View>
              <View style={styles.summaryCost}>
                <Text variant="title" style={tabularNums}>
                  {formatMoney(spentOrOrdered, currency)}
                </Text>
                <Text variant="caption" tone="muted">
                  Spent or ordered
                </Text>
                <Text
                  variant="title"
                  style={[tabularNums, styles.secondFigure]}
                >
                  {budgetParts.length && missingEstimates === budgetParts.length
                    ? 'Not estimated'
                    : formatMoney(totalNeeded, currency)}
                </Text>
                <Text variant="caption" tone="muted">
                  {missingEstimates
                    ? `Still to buy · ${missingEstimates} without a price`
                    : 'Still to buy'}
                </Text>
              </View>
            </View>
            <View style={styles.statusLine}>
              <View style={styles.urgent}>
                {health.urgentCount ? <View style={styles.urgentDot} /> : null}
                <Text variant="caption" tone="muted">
                  {health.urgentCount} urgent
                </Text>
              </View>
              <Text variant="caption" tone="muted">
                {health.orderedCount} awaiting delivery
              </Text>
              <Text variant="caption" tone="muted">
                {parts.length - openCount} installed
              </Text>
            </View>
          </>
        ) : (
          <Text variant="caption" tone="muted">
            Track the parts, costs and work for this vehicle.
          </Text>
        )}
      </View>
      {parts.length > 0 ? (
        <View style={styles.tools}>
          <Input
            placeholder="Find a part"
            leftSection={<Search size={16} color={colors.textDim} />}
            value={search}
            onChangeText={setSearch}
          />
          <FilterTabs
            value={scope}
            options={SCOPE_OPTIONS}
            onChange={setScope}
          />
          <Text variant="caption" tone="muted">
            Tick a part when it’s installed.
          </Text>
        </View>
      ) : null}
      <FlatList
        keyExtractor={item => item.id}
        data={checklist}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TrackedPartRow
            part={item}
            currency={currency}
            checkbox
            checked={item.status === 'installed'}
            onCheckedChange={checked =>
              handlePartCheckedChange(item.id, checked)
            }
            onPress={() =>
              navigation.navigate('PartDetail', { partId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          parts.length === 0 ? (
            <EmptyState
              title="No parts on this build yet"
              subtitle="Add the pieces this car still needs. Checking one off marks it installed."
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
                <Text weight="medium">
                  {hasQuery ? 'Clear search' : 'Show all'}
                </Text>
              </Pressable>
            </View>
          )
        }
      />
      {undo ? (
        <View style={styles.undoBar} accessibilityLiveRegion="polite">
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  summary: {
    marginHorizontal: layout.gutter,
    marginVertical: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  summaryHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  undoBar: {
    position: 'absolute',
    left: layout.gutter,
    right: layout.gutter,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  undoText: {
    flex: 1,
  },
  secondFigure: {
    marginTop: spacing.sm,
  },
  urgent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  summaryCost: { flex: 1, alignItems: 'flex-end' },
  statusLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: layout.hairline,
    borderTopColor: colors.border,
  },
  menu: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -spacing.sm,
  },
  tools: {
    paddingHorizontal: layout.gutter,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  filterEmpty: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
