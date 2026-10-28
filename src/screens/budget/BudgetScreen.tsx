import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { ProgressBar } from '../../components/common/ProgressBar';
import { SkeletonList } from '../../components/common/Skeleton';
import { Text } from '../../components/common/Text';
import type {
  GarageStackParamList,
  RootTabParamList,
} from '../../navigation/types';
import { useBudgetOverview } from '../../hooks/useBudgetOverview';
import { useGarageStore } from '../../store/garageStore';
import { colors, spacing } from '../../theme';
import { Paperclip } from 'lucide-react-native';
import BudgetPartItem from '../../components/budget/BudgetPartItem';
import { suggestBuyOrder } from '../../utils/budgetPlanner';
import { formatMoney } from '../../utils/formatMoney';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'BudgetTab'>,
  NativeStackNavigationProp<GarageStackParamList>
>;

export function BudgetScreen() {
  const navigation = useNavigation<Nav>();
  const vehicles = useGarageStore(s => s.vehicles);
  const trackedParts = useGarageStore(s => s.trackedParts);
  const settings = useGarageStore(s => s.settings);
  const updateSettings = useGarageStore(s => s.updateSettings);
  const hasHydrated = useGarageStore(s => s.hasHydrated);
  const { totalNeeded, monthlyCap, overBy, isOverCap, isSpendingAlert, usagePercent } =
    useBudgetOverview(trackedParts);

  const neededParts = useMemo(
    () => suggestBuyOrder(trackedParts),
    [trackedParts],
  );

  const currency = settings.currency;
  const statusTone = isOverCap || isSpendingAlert ? 'warning' : 'accent';

  const vehicleLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const vehicle of vehicles) {
      map.set(vehicle.id, `${vehicle.make} ${vehicle.model}`);
    }
    return map;
  }, [vehicles]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, styles.sidePadding]}>
        <Text size="lg" tone="accent">
          Budget Planner
        </Text>
        <Text tone="white">
          Manage monthly sourcing spend across your garage
        </Text>
      </View>

      {!hasHydrated ? (
        <View style={styles.sidePadding} accessibilityLiveRegion="polite" accessibilityLabel="Loading budget">
          <SkeletonList count={4} itemHeight={80} />
        </View>
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles yet"
          subtitle="Budget rollup needs at least one car in the garage."
          actionLabel="Add vehicle"
          onAction={() => navigation.navigate('AddVehicle')}
        />
      ) : (
        <View style={styles.contentContainer}>
          <Card backgroundColor="slate800" gap="md">
            <Text size="xs">Monthly Sourcing Allowance (ZAR)</Text>
            <Input
              keyboardType="decimal-pad"
              leftSection="R"
              size="md"
              value={String(settings.monthlyBudget)}
              onChangeText={v =>
                updateSettings({ monthlyBudget: Number(v) || 0 })
              }
              accessibilityLabel="Monthly budget"
            />
          </Card>
          <Card backgroundColor="slate800" gap="lg">
            <View style={[styles.row, styles.spaceBetween]}>
              <Text>Total Needed across garage</Text>
              <Text>{formatMoney(totalNeeded, currency)}</Text>
            </View>
            <ProgressBar
              value={totalNeeded}
              max={monthlyCap}
              warning={isSpendingAlert && !isOverCap}
              accessibilityLabel="Budget used versus total cap"
            />
            <View style={[styles.row, styles.spaceBetween]}>
              <Text size="sm">
                Total Cap: {formatMoney(monthlyCap, currency)}
              </Text>
              <Text size="sm" tone={statusTone}>
                {isOverCap
                  ? `${formatMoney(overBy, currency)} over monthly cap`
                  : `${formatMoney(-overBy, currency)} remaining`}
              </Text>
            </View>
            {isSpendingAlert && !isOverCap ? (
              <Text size="sm" tone="warning">
                Spending alert: used {Math.round(usagePercent)}% of your budget
              </Text>
            ) : null}
          </Card>
          <View style={styles.priorityQueueContainer}>
            <View style={styles.row}>
              <Paperclip size={20} color={colors.accent} />
              <Text size="sm">Buy First Priority Queue</Text>
            </View>
            <FlatList
              keyExtractor={item => item.id}
              data={neededParts}
              style={styles.flatList}
              contentContainerStyle={styles.flatListContentContainer}
              renderItem={({ index, item }) => (
                <BudgetPartItem
                  index={index + 1}
                  part={item}
                  vehicleLabel={vehicleLabelById.get(item.vehicleId) ?? ''}
                  currency={currency}
                />
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  sidePadding: {
    paddingHorizontal: spacing.md,
  },
  headerContainer: {
    gap: spacing.xs,
  },
  contentContainer: {
    flex: 1,
    gap: spacing.lg,
    marginHorizontal: spacing.md,
  },
  flatListContentContainer: {
    gap: spacing.sm,
  },
  flatList: {
    flex: 1,
  },
  priorityQueueContainer: {
    flex: 1,
    gap: spacing.md,
  },
});
