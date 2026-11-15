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
import { List } from '../../components/common/List';
import { SheetFrame } from '../../components/common/SheetFrame';
import { StatusPill } from '../../components/common/StatusPill';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Screen } from '../../components/common/Screen';
import { Text } from '../../components/common/Text';
import type {
  GarageStackParamList,
  RootTabParamList,
} from '../../navigation/types';
import { useBudgetOverview } from '../../hooks/useBudgetOverview';
import { useGarageStore } from '../../store/garageStore';
import {
  colors,
  fontFamily,
  layout,
  radius,
  spacing,
  tabularNums,
} from '../../theme';
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
              <Text size="md" tone="muted">
                {monthLabel} · whole garage
              </Text>
              <View style={styles.hero}>
                <Text size="md" tone="muted">
                  {monthlyCap === 0
                    ? 'No monthly cap set'
                    : isOverCap
                    ? 'Over this month’s cap by'
                    : 'Left to spend this month'}
                </Text>
                <Text
                  style={[
                    styles.heroAmount,
                    tabularNums,
                    isOverCap && styles.heroOver,
                  ]}
                >
                  {formatMoney(Math.abs(remaining), currency)}
                </Text>
                <ProgressBar
                  value={used}
                  max={monthlyCap}
                  height={10}
                  warning={isSpendingAlert && !isOverCap}
                  accessibilityLabel="Spent and ordered versus monthly cap"
                  style={styles.bar}
                />
                <View style={styles.barScale}>
                  <Text size="md" tone="muted" style={tabularNums}>
                    {formatMoney(used, currency)} used
                  </Text>
                  <Text size="md" tone="muted" style={tabularNums}>
                    {formatMoney(monthlyCap, currency)} cap
                  </Text>
                </View>
                <View style={styles.tiles}>
                  <View style={styles.tile}>
                    <Text size="md" tone="muted">
                      Spent
                    </Text>
                    <Text style={[styles.tileAmount, tabularNums]}>
                      {formatMoney(spent, currency)}
                    </Text>
                  </View>
                  <View style={styles.tile}>
                    <Text size="md" tone="muted">
                      Ordered
                    </Text>
                    <Text style={[styles.tileAmount, tabularNums]}>
                      {formatMoney(committed, currency)}
                    </Text>
                  </View>
                </View>
                <Text size="md" tone="muted">
                  {formatMoney(totalNeeded, currency)} estimated for parts still
                  to buy
                </Text>
                {isSpendingAlert && !isOverCap ? (
                  <StatusPill
                    tone="warning"
                    size="md"
                    label={`${Math.round(
                      usagePercent,
                    )}% of the cap is spoken for`}
                  />
                ) : null}
                {missingEstimates ? (
                  <StatusPill
                    tone="warning"
                    size="md"
                    label={`${missingEstimates} ${
                      missingEstimates === 1 ? 'part needs' : 'parts need'
                    } a price`}
                  />
                ) : null}
                {undatedCount ? (
                  <StatusPill
                    tone="neutral"
                    size="md"
                    label={`${undatedCount} undated costs not counted`}
                  />
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showDetails }}
                  onPress={() => setShowDetails(value => !value)}
                  style={styles.detailsAction}
                >
                  <Text size="md" weight="semibold" tone="accent">
                    {showDetails
                      ? 'Hide explanation'
                      : 'How this is calculated'}
                  </Text>
                </Pressable>
                {showDetails ? (
                  <Text size="md" tone="muted">
                    Spent is what you’ve paid this month. Ordered parts count at
                    their estimate until you add what you paid. Parts you still
                    need to buy don’t count yet.
                  </Text>
                ) : null}
              </View>

              <List.View>
                <List.Item
                  label="Monthly cap"
                  value={
                    monthlyCap === 0
                      ? 'Not set'
                      : formatMoney(monthlyCap, currency)
                  }
                  onPress={() => {
                    setCapDraft(String(settings.monthlyBudget));
                    setCapError('');
                    setEditingCap(true);
                  }}
                />
                <List.Item
                  label="Parts from"
                  value={filterLabel}
                  onPress={() => setVehicleSheet(true)}
                />
              </List.View>

              <Text style={styles.sectionTitle}>
                PARTS TO BUY · MOST URGENT FIRST
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyExtractor={item => item.id}
          data={neededParts}
          style={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyPanel}>
              <Text weight="semibold">Nothing left to buy</Text>
              <Text size="md" tone="muted">
                Parts marked To source or Sourcing show up here, most urgent
                first.
              </Text>
            </View>
          }
          renderItem={({ index, item }) => (
            <View
              style={[
                styles.rowWrap,
                index === 0 && styles.rowFirst,
                index === neededParts.length - 1 && styles.rowLast,
              ]}
            >
              <BudgetPartItem
                index={index + 1}
                part={item}
                vehicleLabel={vehicleLabelById.get(item.vehicleId) ?? ''}
                currency={currency}
                divider={index < neededParts.length - 1}
                onPress={() =>
                  navigation.navigate('PartDetail', { partId: item.id })
                }
              />
            </View>
          )}
        />
      )}
      <SheetFrame
        visible={editingCap}
        title="Monthly cap"
        compact
        onClose={() => setEditingCap(false)}
      >
        <View style={styles.sheetBody}>
          <Input
            appearance="outlined"
            size="lg"
            autoFocus
            keyboardType="decimal-pad"
            leftSection={getCurrencySymbol(currency)}
            value={capDraft}
            onChangeText={setCapDraft}
            error={capError || undefined}
            accessibilityLabel="Monthly cap"
            helper="How much you plan to spend on parts each month."
          />
          <Button
            testID="save-monthly-cap"
            label="Save"
            size="lg"
            onPress={saveCap}
          />
        </View>
      </SheetFrame>
      <SearchableBottomSheet
        visible={vehicleSheet}
        title="Show parts from"
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
  container: {
    flex: 1,
    paddingHorizontal: layout.gutter,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xl },
  content: {
    gap: 14,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  hero: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  heroAmount: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: colors.text,
  },
  heroOver: { color: colors.dangerText },
  bar: { marginTop: spacing.xs },
  barScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  tile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceSunken,
    gap: 2,
  },
  tileAmount: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24 },
  detailsAction: { minHeight: 44, justifyContent: 'center' },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.textMuted,
    paddingHorizontal: 4,
    marginTop: spacing.xs,
  },
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
  emptyPanel: {
    padding: 18,
    gap: spacing.xs,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sheetBody: { gap: spacing.md },
});
