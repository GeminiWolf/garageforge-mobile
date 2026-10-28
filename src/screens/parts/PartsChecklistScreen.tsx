import { FlatList, StyleSheet, View } from 'react-native';
import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/common/EmptyState';
import { Screen } from '../../components/common/Screen';
import { TrackedPartRow } from '../../components/parts/TrackedPartRow';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import { colors, spacing } from '../../theme';
import {
  getChecklistParts,
  type ChecklistSort,
} from '../../utils/filterChecklistParts';
import { statusFromChecklistChecked } from '../../utils/partsChecklistStatus';
import { Card } from '../../components/common/Card';
import { Search } from 'lucide-react-native';
import { Text } from '../../components/common/Text';
import { Input } from '../../components/common/Input';
import { Dropdown } from '../../components/common/Dropdown';
import type { DropdownOption } from '../../components/common/Dropdown';
import { useDebounce } from '../../hooks/useDebounce';
import type { PartPriority, PartStatus } from '../../types';
import { useBudgetOverview } from '../../hooks/useBudgetOverview';
import { formatMoney } from '../../utils/formatMoney';

type Props = NativeStackScreenProps<GarageStackParamList, 'PartsChecklist'>;

const PRIORITIES: Array<PartPriority | 'all'> = [
  'all',
  'urgent',
  'soon',
  'someday',
];

const STATUSES: Array<PartStatus | 'all'> = [
  'all',
  'needed',
  'sourcing',
  'ordered',
  'installed',
];

const SORTS = ['priority', 'cost', 'name'] as const;

function formatOptionLabel(value: string): string {
  return value === 'all'
    ? 'All'
    : value.charAt(0).toUpperCase() + value.slice(1);
}

const prioritiesOptions: DropdownOption[] = PRIORITIES.map(priority => ({
  value: priority,
  label: formatOptionLabel(priority),
}));

const statusOptions: DropdownOption[] = STATUSES.map(status => ({
  value: status,
  label: formatOptionLabel(status),
}));

const sortOptions: DropdownOption[] = SORTS.map(sort => ({
  value: sort,
  label: formatOptionLabel(sort),
}));

export function PartsChecklistScreen({ navigation, route }: Props) {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<PartPriority | 'all'>('all');
  const [status, setStatus] = useState<PartStatus | 'all'>('all');
  const [sort, setSort] = useState<ChecklistSort>('priority');
  const debouncedSearch = useDebounce(search, 500);

  const { vehicleId } = route.params;
  const vehicle = useGarageStore(s => s.vehicles.find(v => v.id === vehicleId));
  const monthlyBudget = useGarageStore(s => s.settings.monthlyBudget);
  const trackedParts = useGarageStore(s => s.trackedParts);
  const updateTrackedPart = useGarageStore(s => s.updateTrackedPart);
  const currency = useGarageStore(s => s.settings.currency);

  const parts = useMemo(
    () => trackedParts.filter(p => p.vehicleId === vehicleId),
    [trackedParts, vehicleId],
  );

  const checklist = useMemo(
    () =>
      getChecklistParts(parts, {
        query: debouncedSearch,
        priority,
        status,
        sort,
      }),
    [parts, debouncedSearch, priority, status, sort],
  );

  const hasActiveFilters =
    search.trim() !== '' ||
    priority !== 'all' ||
    status !== 'all' ||
    sort !== 'priority';

  const clearFilters = () => {
    setSearch('');
    setPriority('all');
    setStatus('all');
    setSort('priority');
  };

  const handlePartCheckedChange = (partId: string, checked: boolean) => {
    updateTrackedPart(partId, { status: statusFromChecklistChecked(checked) });
  };

  const { totalNeeded, usagePercent } = useBudgetOverview(parts);

  if (!vehicle) {
    return (
      <Screen>
        <EmptyState
          title="Vehicle not found"
          actionLabel="Back to garage"
          onAction={() => navigation.navigate('GarageHome')}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <Card gap={spacing.sm} style={styles.sideMargin}>
        <View style={[styles.row, styles.spaceBetween]}>
          <View>
            <Text weight="semibold" size="xs" transform="uppercase">
              Budget
            </Text>
            <View style={styles.budgetAmount}>
              <Text weight="semibold" size="xl" style={styles.tabularNums}>
                {formatMoney(totalNeeded, currency)}
              </Text>
              <Text tone="accent" style={styles.tabularNums}>{`/ ${formatMoney(
                monthlyBudget,
                currency,
              )}`}</Text>
            </View>
          </View>
          <View>
            <Text
              size="sm"
              transform="uppercase"
              tone="accent"
              weight="bold"
              style={styles.tabularNums}
            >{`${usagePercent.toFixed(0)}% Procured`}</Text>
          </View>
        </View>
      </Card>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search parts..."
          leftSection={<Search size={16} color={colors.graySoft} />}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.dropdownContainer}>
          <Dropdown
            placeholder="Priority"
            style={styles.dropdown}
            items={prioritiesOptions}
            value={priority}
            onChange={value => setPriority(value as PartPriority | 'all')}
          />
          <Dropdown
            placeholder="Status"
            style={styles.dropdown}
            items={statusOptions}
            value={status}
            onChange={value => setStatus(value as PartStatus | 'all')}
          />
          <Dropdown
            placeholder="Sort"
            style={styles.dropdown}
            items={sortOptions}
            value={sort}
            onChange={value => setSort(value as ChecklistSort)}
          />
        </View>
      </View>
      <FlatList
        keyExtractor={item => item.id}
        data={checklist}
        contentContainerStyle={styles.checklistContent}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${checklist.length} ${checklist.length === 1 ? 'part' : 'parts'} shown`}
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
              title="No parts tracked yet"
              subtitle="Add the parts this car still needs."
              actionLabel="Add part"
              onAction={() => navigation.navigate('AddPart', { vehicleId })}
            />
          ) : (
            <EmptyState
              title="No matching parts"
              subtitle="Try a different search or filter."
              actionLabel={hasActiveFilters ? 'Clear filters' : 'Add part'}
              onAction={
                hasActiveFilters
                  ? clearFilters
                  : () => navigation.navigate('AddPart', { vehicleId })
              }
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sideMargin: {
    marginHorizontal: spacing.lg,
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetAmount: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  summaryContainer: {
    marginHorizontal: spacing.lg,
    maxWidth: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  content: {
    padding: 0,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  checklistContent: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  searchContainer: {
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  dropdownContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dropdown: {
    flex: 1,
  },
  tabularNums: {
    fontVariant: ['tabular-nums'],
  },
});
