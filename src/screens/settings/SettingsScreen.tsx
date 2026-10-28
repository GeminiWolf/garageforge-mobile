import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { version } from '../../../package.json';
import { Button } from '../../components/common/Button';
import { SearchableBottomSheet } from '../../components/common/SearchableBottomSheet';
import { useGarageStore } from '../../store/garageStore';
import type { CurrencyCode } from '../../types';
import { colors, radius, spacing, typography } from '../../theme';
import { Card } from '../../components/common/Card';
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
import { withOpacity } from '../../utils/withOpacity';

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
  const insets = useSafeAreaInsets();
  const settings = useGarageStore(s => s.settings);
  const updateSettings = useGarageStore(s => s.updateSettings);
  const clearGarage = useGarageStore(s => s.clearGarage);

  const [openRegionSheet, setOpenRegionSheet] = useState(false);
  const [openUnitsSheet, setOpenUnitsSheet] = useState(false);
  const [openCurrencySheet, setOpenCurrencySheet] = useState(false);
  const [openBudgetSheet, setOpenBudgetSheet] = useState(false);
  const [openSpendingAlertSheet, setOpenSpendingAlertSheet] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(
    String(settings.monthlyBudget),
  );

  const unitsLabel = getUnitSystemLabel(settings.units);
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
        <View style={[styles.cardGap, styles.hidden]}>
          <Text size="xs" tone="dim" weight="bold">
            ACCOUNT
          </Text>
          <Card radius="md" padding="md">
            <List.View>
              <List.Item
                icon="User"
                label="Profile"
                description="Edit your profile information"
              />
              <List.Item
                icon="Mail"
                label="Email"
                description="user@example.com"
              />
              <List.Item
                icon="Lock"
                label="Change Password"
                description="Keep your account secure"
              />
            </List.View>
          </Card>
        </View>

        <View style={styles.cardGap}>
          <Text size="xs" tone="dim" weight="bold">
            GARAGE
          </Text>
          <Card radius="md" padding="md">
            <List.View>
              <List.Item
                icon="Ruler"
                label="Units"
                description="Metric or Imperial"
                value={unitsLabel}
                onPress={() => setOpenUnitsSheet(true)}
              />
              <List.Item
                icon="DollarSign"
                label="Currency"
                description="USD or EUR"
                value={settings.currency}
                onPress={() => setOpenCurrencySheet(true)}
              />
              <List.Item
                icon="Download"
                label="Export"
                description="Export your Garage data"
                onPress={() => navigation.navigate('Export')}
              />
            </List.View>
          </Card>
        </View>

        <View style={styles.cardGap}>
          <Text size="xs" tone="dim" weight="bold">
            BUDGET & EXPENSES
          </Text>
          <Card radius="md" padding="md">
            <List.View>
              <List.Item
                icon="CalendarPlus"
                label="Monthly Budget"
                description="Set your monthly budget"
                value={monthlyBudgetLabel}
                onPress={openMonthlyBudgetSheet}
              />
              {/* <List.Item
                icon="RefreshCw"
                label="Budget Rollover"
                description="Carry over unused budget"
                rightSection={
                  <Switch
                    value={settings.budgetRollover}
                    onValueChange={value =>
                      updateSettings({ budgetRollover: value })
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.accentDim,
                    }}
                    thumbColor={
                      settings.budgetRollover ? colors.accent : colors.textDim
                    }
                    accessibilityLabel="Budget Rollover"
                  />
                }
              /> */}
              <List.Item
                icon="Bell"
                label="Spending Alerts"
                description="Notify when budget is low"
                value={spendingAlertLabel}
                onPress={() => setOpenSpendingAlertSheet(true)}
              />
            </List.View>
          </Card>
        </View>

        <View style={styles.cardGap}>
          <Text size="xs" tone="dim" weight="bold">
            PREFERENCES
          </Text>
          <Card radius="md" padding="md">
            <List.View>
              {/* <List.Item
                icon="Globe"
                label="Language"
                description="English"
              /> */}
              {/* <List.Item
                icon="Globe"
                label="Data & storage"
                description="Manage local data"
                onPress={() => navigation.navigate('DataAndStorage')}
              /> */}
              <List.Item
                icon="Info"
                label="About Garage Forge"
                description={`Version ${version}`}
                // onPress={() => navigation.navigate('About')}
              />
            </List.View>
          </Card>
        </View>

        <View style={[styles.cardGap, !__DEV__ && styles.hidden]}>
          <Text size="xs" tone="dim" weight="bold">
            API & CONNECTION
          </Text>
          <Card radius="md" padding="md">
            <List.View>
              <List.Item
                icon="Server"
                label="Base Endpoint"
                description={settings.apiBaseUrl}
                onPress={() => navigation.navigate('ApiConnection')}
              />
            </List.View>
          </Card>
        </View>

        <Button
          label="Clear garage"
          variant="danger"
          size="lg"
          onPress={() => {
            Alert.alert(
              'Clear garage',
              'Remove all vehicles and tracked parts? Settings kept except garage data.',
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
        title="Spending Alerts"
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

      <Modal
        visible={openBudgetSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setOpenBudgetSheet(false)}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setOpenBudgetSheet(false)}
          />
          <View
            style={[
              styles.budgetSheet,
              { paddingBottom: Math.max(insets.bottom, spacing.md) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text tone="white" weight="semibold">
              Monthly Budget
            </Text>
            <Input
              keyboardType="decimal-pad"
              leftSection={getCurrencySymbol(settings.currency)}
              value={budgetDraft}
              onChangeText={setBudgetDraft}
              accessibilityLabel="Monthly budget"
            />
            <Button label="Save" onPress={saveMonthlyBudget} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  cardGap: {
    gap: spacing.md,
  },
  hidden: {
    display: 'none',
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  budgetSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  container: {
    flex: 1,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerContainer: {
    gap: spacing.xs,
  },
  sidePadding: {
    paddingHorizontal: spacing.md,
  },
  contentContainer: {
    gap: spacing.lg,
    marginHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  dangerCard: {
    backgroundColor: withOpacity(colors.danger, 0.1),
    borderColor: colors.danger,
    gap: spacing.md,
  },
  dangerButtonContainer: {
    gap: spacing.sm,
  },
  brand: {
    ...typography.hero,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: spacing.md,
    textTransform: 'uppercase',
  },
  helper: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dot_idle: {
    backgroundColor: colors.borderSubtle,
  },
  dot_ok: {
    backgroundColor: colors.accent,
  },
  dot_fail: {
    backgroundColor: colors.warning,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  switchTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  switchSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  probe: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    minHeight: 24,
    justifyContent: 'center',
  },
  probeText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  ok: {
    color: colors.accent,
  },
  fail: {
    color: colors.warning,
  },
});
