import { getBudgetParts } from '../../utils/budgetPlanner';
import { hasPartEstimate } from '../../utils/partEstimate';
import React, { useMemo, useState, type ReactNode } from 'react';
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
import { useDebounce } from '../../hooks/useDebounce';
import { getVehicleHealth } from '../../utils/healthSummary';
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
  const openCount = parts.filter(part => part.status !== 'installed').length;
  const hasQuery = search.trim() !== '';

  const handlePartCheckedChange = (partId: string, checked: boolean) => {
    updateTrackedPart(partId, { status: statusFromChecklistChecked(checked) });
  };

  return (
    <View style={styles.root}>
      {header}
      <View style={styles.summary}>
        <View style={styles.summaryHeading}>
          <Text variant="label" tone="accent">
            BUILD OVERVIEW
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
                  Open parts
                </Text>
              </View>
              <View style={styles.summaryCost}>
                <Text variant="title" style={tabularNums}>
                  {budgetParts.length && missingEstimates === budgetParts.length
                    ? 'Not estimated'
                    : formatMoney(totalNeeded, currency)}
                </Text>
                <Text variant="caption" tone="muted">
                  {missingEstimates
                    ? `${missingEstimates} ${
                        missingEstimates === 1 ? 'part' : 'parts'
                      } without estimates`
                    : 'Estimated to source'}
                </Text>
              </View>
            </View>
            <View style={styles.statusLine}>
              <Text
                variant="caption"
                tone={health.urgentCount ? 'danger' : 'muted'}
              >
                {health.urgentCount} urgent
              </Text>
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
        ListFooterComponent={
          <View>
            {parts.length > 0 ? (
              <Pressable
                onPress={() => navigation.navigate('AddPart', { vehicleId })}
                accessibilityRole="button"
                accessibilityLabel="Add part"
                style={({ pressed }) => [
                  styles.footerAdd,
                  pressed && styles.pressed,
                ]}
              >
                <Text weight="medium">Add part</Text>
              </Pressable>
            ) : null}
          </View>
        }
      />
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
  footerAdd: {
    minHeight: layout.rowMinHeight,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  filterEmpty: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
