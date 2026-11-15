import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { version } from '../../../package.json';
import { Button } from '../../components/common/Button';
import { SearchableBottomSheet } from '../../components/common/SearchableBottomSheet';
import { SheetFrame } from '../../components/common/SheetFrame';
import { useGarageStore } from '../../store/garageStore';
import type { CurrencyCode } from '../../types';
import { layout, spacing } from '../../theme';
import { List } from '../../components/common/List';
import { Text } from '../../components/common/Text';
import { Input } from '../../components/common/Input';
import { regionOptions } from '../../utils/constants';
import {
  formatMoney,
  getCurrencySymbol,
  parseMonthlyBudget,
} from '../../utils/formatMoney';
import { getUnitSystemLabel, isUnitSystem } from '../../utils/garageExport';
import {
  formatSpendingAlertThreshold,
  parseSpendingAlertThreshold,
  SPENDING_ALERT_THRESHOLDS,
} from '../../utils/spendingAlerts';

const CURRENCIES: CurrencyCode[] = ['ZAR', 'USD', 'EUR'];

const REGION_SHEET_OPTIONS = regionOptions.map(option => ({
  key: option.value,
  label: option.label,
}));

const CURRENCY_SHEET_OPTIONS = CURRENCIES.map(code => ({
  key: code,
  label: code,
}));

const SPENDING_ALERT_SHEET_OPTIONS = SPENDING_ALERT_THRESHOLDS.map(
  threshold => ({
    key: String(threshold),
    label: formatSpendingAlertThreshold(threshold),
  }),
);

const UNITS_SHEET_OPTIONS = [
  { key: 'metric', label: 'Metric' },
  { key: 'imperial', label: 'Imperial' },
];

function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCIES.includes(value as CurrencyCode);
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const settings = useGarageStore(s => s.settings);
  const updateSettings = useGarageStore(s => s.updateSettings);
  const clearGarage = useGarageStore(s => s.clearGarage);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openRegionSheet, setOpenRegionSheet] = useState(false);
  const [openUnitsSheet, setOpenUnitsSheet] = useState(false);
  const [openCurrencySheet, setOpenCurrencySheet] = useState(false);
  const [openBudgetSheet, setOpenBudgetSheet] = useState(false);
  const [openSpendingAlertSheet, setOpenSpendingAlertSheet] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(
    String(settings.monthlyBudget),
  );

  const unitsLabel = getUnitSystemLabel(settings.units);
  const regionLabel =
    regionOptions.find(option => option.value === settings.region)?.label ??
    settings.region;
  const monthlyBudgetLabel = formatMoney(
    settings.monthlyBudget,
    settings.currency,
  );
  const spendingAlertLabel = formatSpendingAlertThreshold(
    settings.spendingAlertThreshold,
  );

  const openMonthlyBudgetSheet = () => {
    setBudgetDraft(String(settings.monthlyBudget));
    setOpenBudgetSheet(true);
  };

  const saveMonthlyBudget = () => {
    const amount = parseMonthlyBudget(budgetDraft);
    if (amount == null) {
      Alert.alert('Invalid budget', 'Enter a valid amount of 0 or more.');
      return;
    }
    updateSettings({ monthlyBudget: amount });
    setOpenBudgetSheet(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View>
          <Text size="sm" tone="muted" style={styles.section}>
            Catalogue
          </Text>
          <List.View>
            <List.Item
              label="Region"
              value={regionLabel}
              onPress={() => setOpenRegionSheet(true)}
            />
            <List.Item
              label="Units"
              value={unitsLabel}
              onPress={() => setOpenUnitsSheet(true)}
            />
            <List.Item
              label="Currency"
              value={settings.currency}
              onPress={() => setOpenCurrencySheet(true)}
            />
            <List.Item
              label="Export a build"
              onPress={() => navigation.navigate('Export')}
            />
          </List.View>
        </View>

        <View>
          <Text size="sm" tone="muted" style={styles.section}>
            Spending
          </Text>
          <List.View>
            <List.Item
              label="Monthly cap"
              value={monthlyBudgetLabel}
              onPress={openMonthlyBudgetSheet}
            />
            <List.Item
              label="Alert when"
              value={spendingAlertLabel}
              onPress={() => setOpenSpendingAlertSheet(true)}
            />
          </List.View>
        </View>

        <View>
          <Text size="sm" tone="muted" style={styles.section}>
            Garage Forge
          </Text>
          <List.View>
            <List.Item
              label="About"
              value={version}
              onPress={() => navigation.navigate('About')}
            />
          </List.View>
        </View>

        {__DEV__ ? (
          <View>
            <List.View>
              <List.Item
                label="Advanced"
                description="Catalogue connection and developer settings"
                value={showAdvanced ? 'Hide' : undefined}
                onPress={() => setShowAdvanced(value => !value)}
              />
              {showAdvanced ? (
                <List.Item
                  label="Catalogue connection"
                  description="Check availability or configure the server"
                  onPress={() => navigation.navigate('ApiConnection')}
                />
              ) : null}
            </List.View>
          </View>
        ) : null}

        <Button
          label="Clear garage"
          variant="danger"
          onPress={() => {
            Alert.alert(
              'Clear garage',
              'Remove all vehicles and tracked parts? Settings stay.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: clearGarage,
                },
              ],
            );
          }}
        />
      </ScrollView>

      <SearchableBottomSheet
        visible={openUnitsSheet}
        title="Units"
        options={UNITS_SHEET_OPTIONS}
        selectedKey={settings.units}
        searchable={false}
        onClose={() => setOpenUnitsSheet(false)}
        onSelect={option => {
          if (isUnitSystem(option.key)) {
            updateSettings({ units: option.key });
          }
        }}
      />

      <SearchableBottomSheet
        visible={openCurrencySheet}
        title="Currency"
        options={CURRENCY_SHEET_OPTIONS}
        selectedKey={settings.currency}
        searchable={false}
        onClose={() => setOpenCurrencySheet(false)}
        onSelect={option => {
          if (isCurrencyCode(option.key)) {
            updateSettings({ currency: option.key });
          }
        }}
      />

      <SearchableBottomSheet
        visible={openRegionSheet}
        title="Region"
        options={REGION_SHEET_OPTIONS}
        selectedKey={settings.region}
        searchable={false}
        onClose={() => setOpenRegionSheet(false)}
        onSelect={option => updateSettings({ region: option.key })}
      />

      <SearchableBottomSheet
        visible={openSpendingAlertSheet}
        title="Spending alerts"
        options={SPENDING_ALERT_SHEET_OPTIONS}
        selectedKey={String(settings.spendingAlertThreshold)}
        searchable={false}
        onClose={() => setOpenSpendingAlertSheet(false)}
        onSelect={option => {
          const threshold = parseSpendingAlertThreshold(option.key);
          if (threshold != null) {
            updateSettings({ spendingAlertThreshold: threshold });
          }
        }}
      />

      <SheetFrame
        visible={openBudgetSheet}
        title="Monthly cap"
        compact
        onClose={() => setOpenBudgetSheet(false)}
      >
        <Input
          keyboardType="decimal-pad"
          leftSection={getCurrencySymbol(settings.currency)}
          value={budgetDraft}
          onChangeText={setBudgetDraft}
          accessibilityLabel="Monthly budget"
        />
        <Button
          label="Save"
          onPress={saveMonthlyBudget}
          style={styles.budgetSave}
        />
      </SheetFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    gap: spacing.xl,
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.sm,
  },
  hidden: {
    display: 'none',
  },
  budgetSave: {
    marginTop: spacing.md,
  },
});
