import { hasPartEstimate } from '../../utils/partEstimate';
import React, { useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { SearchableBottomSheet } from '../../components/common/SearchableBottomSheet';
import { Input } from '../../components/common/Input';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Screen } from '../../components/common/Screen';
import { Text } from '../../components/common/Text';
import type {
  GarageStackParamList,
  RootTabParamList,
} from '../../navigation/types';
import { useBudgetOverview } from '../../hooks/useBudgetOverview';
import { useGarageStore } from '../../store/garageStore';
import { colors, layout, spacing, tabularNums } from '../../theme';
import BudgetPartItem from '../../components/budget/BudgetPartItem';
import { suggestBuyOrder } from '../../utils/budgetPlanner';
import {
  formatMoney,
  getCurrencySymbol,
  parseMonthlyBudget,
} from '../../utils/formatMoney';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, 'BudgetTab'>,
  NativeStackNavigationProp<GarageStackParamList>
>;

export function BudgetScreen() {
  const [showDetails, setShowDetails] = useState(false);
  const [editingCap, setEditingCap] = useState(false);
  const [capDraft, setCapDraft] = useState('');
  const [capError, setCapError] = useState('');
  const [vehicleId, setVehicleId] = useState('all');
  const [vehicleSheet, setVehicleSheet] = useState(false);
  const navigation = useNavigation<Nav>();
  const hasHydrated = useGarageStore(s => s.hasHydrated);
  const vehicles = useGarageStore(s => s.vehicles);
  const trackedParts = useGarageStore(s => s.trackedParts);
  const settings = useGarageStore(s => s.settings);
  const updateSettings = useGarageStore(s => s.updateSettings);
  const {
    totalNeeded,
    spent,
    committed,
    used,
    undatedCount,
    monthlyCap,
    remaining,
    isOverCap,
    isSpendingAlert,
    usagePercent,
  } = useBudgetOverview(trackedParts);

  const neededParts = useMemo(
    () =>
      suggestBuyOrder(
        trackedParts.filter(
          part => vehicleId === 'all' || part.vehicleId === vehicleId,
        ),
      ),
    [trackedParts, vehicleId],
  );

  const missingEstimates = trackedParts.filter(
    part =>
      part.status !== 'installed' &&
      part.actualCost == null &&
      !hasPartEstimate(part),
  ).length;
  const currency = settings.currency;

  const vehicleLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const vehicle of vehicles) {
      map.set(vehicle.id, `${vehicle.make} ${vehicle.model}`);
    }
    return map;
  }, [vehicles]);

  const monthLabel = new Date().toLocaleDateString('en-ZA', {
    month: 'long',
    year: 'numeric',
  });
  const filterLabel =
    vehicleId === 'all'
      ? 'All vehicles'
      : vehicleLabelById.get(vehicleId) ?? 'All vehicles';
  const saveCap = () => {
    const amount = parseMonthlyBudget(capDraft);
    if (amount == null) {
      setCapError('Enter an amount of 0 or more.');
      return;
    }
    updateSettings({ monthlyBudget: amount });
    setEditingCap(false);
    Keyboard.dismiss();
  };

  if (!hasHydrated) {
    return <Screen loading />;
  }

  return (
    <View style={styles.container}>
      {vehicles.length === 0 ? (
        <EmptyState
          title="Nothing to budget yet"
          subtitle="Add a car first. This screen is for what still needs buying, against this month’s cap."
          actionLabel="Add vehicle"
          onAction={() => navigation.navigate('AddVehicle')}
        />
      ) : (
        <FlatList
          ListHeaderComponent={
            <View style={styles.content}>
              <Text tone="muted">{monthLabel} · Whole garage</Text>
              <View style={styles.hero}>
                <Text variant="label" tone="muted">
                  {monthlyCap === 0
                    ? 'Set your monthly cap'
                    : isOverCap
                    ? 'Over this month’s cap'
                    : 'Left to spend this month'}
                </Text>
                <Text variant="title" style={tabularNums}>
                  {formatMoney(Math.abs(remaining), currency)}
                </Text>
                <Text tone="muted">
                  Spent {formatMoney(spent, currency)} · Ordered{' '}
                  {formatMoney(committed, currency)}
                </Text>
                <Text size="sm" tone="muted">
                  {formatMoney(totalNeeded, currency)} estimated for parts still
                  to buy
                </Text>
                {undatedCount ? (
                  <Text size="sm" tone="warning">
                    {undatedCount} undated costs excluded.
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showDetails }}
                  onPress={() => setShowDetails(value => !value)}
                  style={styles.detailsAction}
                >
                  <Text variant="caption" tone="accent">
                    {showDetails
                      ? 'Hide budget details'
                      : 'How this is calculated'}
                  </Text>
                </Pressable>
                {showDetails ? (
                  <Text variant="caption" tone="muted">
                    Spent is what you’ve paid this month. Ordered parts count at
                    their estimate until you add what you paid. Parts you still
                    need to buy don’t count yet.
                  </Text>
                ) : null}
                {missingEstimates ? (
                  <Text size="sm" tone="warning">
                    {missingEstimates}{' '}
                    {missingEstimates === 1 ? 'part needs' : 'parts need'} an
                    estimate.
                  </Text>
                ) : null}
                <ProgressBar
                  value={used}
                  max={monthlyCap}
                  warning={isSpendingAlert && !isOverCap}
                  accessibilityLabel="Spent and committed versus monthly cap"
                  style={styles.bar}
                />
                <View style={styles.barScale}>
                  <Text variant="caption" tone="muted" style={tabularNums}>
                    {formatMoney(used, currency)} used
                  </Text>
                  <Text variant="caption" tone="muted" style={tabularNums}>
                    {formatMoney(monthlyCap, currency)} cap
                  </Text>
                </View>
                {isSpendingAlert && !isOverCap ? (
                  <Text size="sm" tone="warning">
                    {Math.round(usagePercent)}% of this month’s cap is spoken
                    for
                  </Text>
                ) : null}
              </View>

              <Pressable
                testID="edit-monthly-cap"
                accessibilityRole="button"
                onPress={() => {
                  setCapDraft(String(settings.monthlyBudget));
                  setCapError('');
                  setEditingCap(true);
                }}
                style={styles.capAction}
              >
                <Text variant="caption" tone="muted">
                  Monthly cap · {formatMoney(monthlyCap, currency)}
                </Text>
                <Text variant="caption" tone="accent">
                  {monthlyCap === 0 ? 'Set cap' : 'Edit cap'}
                </Text>
              </Pressable>
              {editingCap ? (
                <View style={styles.editor}>
                  <Input
                    label="Monthly cap"
                    keyboardType="decimal-pad"
                    leftSection={getCurrencySymbol(currency)}
                    value={capDraft}
                    onChangeText={setCapDraft}
                    error={capError}
                  />
                  <View style={styles.actions}>
                    <Button
                      label="Cancel"
                      variant="ghost"
                      onPress={() => {
                        setEditingCap(false);
                        Keyboard.dismiss();
                      }}
                    />
                    <Button label="Save cap" onPress={saveCap} />
                  </View>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => setVehicleSheet(true)}
                style={styles.capAction}
              >
                <Text weight="medium">{filterLabel}</Text>
                <Text tone="accent">Change</Text>
              </Pressable>

              <Text variant="label" tone="muted" style={styles.queueLabel}>
                Parts to buy · Priority first
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyExtractor={item => item.id}
          data={neededParts}
          style={styles.list}
          ListEmptyComponent={
            <Text tone="muted">No parts waiting to be bought.</Text>
          }
          renderItem={({ index, item }) => (
            <BudgetPartItem
              index={index + 1}
              part={item}
              vehicleLabel={vehicleLabelById.get(item.vehicleId) ?? ''}
              currency={currency}
              onPress={() =>
                navigation.navigate('PartDetail', { partId: item.id })
              }
            />
          )}
        />
      )}
      <SearchableBottomSheet
        visible={vehicleSheet}
        title="Filter parts by vehicle"
        options={[
          { key: 'all', label: 'All vehicles' },
          ...vehicles.map(vehicle => ({
            key: vehicle.id,
            label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          })),
        ]}
        selectedKey={vehicleId}
        onClose={() => setVehicleSheet(false)}
        onSelect={option => {
          setVehicleId(option.key);
          setVehicleSheet(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  barScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  detailsAction: { minHeight: 32, justifyContent: 'center' },
  editor: { gap: spacing.sm },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  container: {
    flex: 1,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  capAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  hero: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  bar: {
    marginTop: spacing.sm,
  },
  queueLabel: {
    marginTop: spacing.sm,
  },
  list: {
    flex: 1,
  },
});
