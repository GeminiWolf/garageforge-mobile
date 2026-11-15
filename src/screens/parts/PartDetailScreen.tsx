import { toDateKey } from '../../utils/vehicleDetails';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Check } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { Screen } from '../../components/common/Screen';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import { SheetFrame } from '../../components/common/SheetFrame';
import { Text } from '../../components/common/Text';
import { StatusStepper } from '../../components/parts/StatusStepper';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import type { PartPriority, PartStatus } from '../../types';
import { hasPartEstimate } from '../../utils/partEstimate';
import { colors, fontFamily, radius, spacing } from '../../theme';
import { PRIORITY_LABELS } from '../../utils/partStatus';
import { getCurrencySymbol } from '../../utils/formatMoney';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<GarageStackParamList, 'PartDetail'>;

const PRIORITIES: PartPriority[] = ['urgent', 'soon', 'someday'];
const SAVE_DEBOUNCE_MS = 500;

type PartDraft = {
  name: string;
  partNumber: string;
  estimatedCost: string;
  actualCost: string;
  source: string;
  paidDate: string;
  notes: string;
};

export function PartDetailScreen({ navigation, route }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { partId } = route.params;
  const part = useGarageStore(s => s.trackedParts.find(p => p.id === partId));
  const updateTrackedPart = useGarageStore(s => s.updateTrackedPart);
  const removeTrackedPart = useGarageStore(s => s.removeTrackedPart);

  const [draft, setDraft] = useState<PartDraft>({
    name: '',
    partNumber: '',
    estimatedCost: '',
    actualCost: '',
    source: '',
    paidDate: '',
    notes: '',
  });
  const [savedVisible, setSavedVisible] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const currency = useGarageStore(s => s.settings.currency);
  const currencySymbol = getCurrencySymbol(currency);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDraft = useRef<PartDraft | null>(null);
  const flushPending = useRef<() => void>(() => {});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadedPartId = useRef<string | null>(null);

  useEffect(() => {
    if (!part || loadedPartId.current === partId) {
      return;
    }
    loadedPartId.current = partId;
    setDraft({
      name: part.name,
      partNumber: part.partNumber,
      estimatedCost: hasPartEstimate(part) ? String(part.estimatedCost) : '',
      actualCost: part.actualCost != null ? String(part.actualCost) : '',
      source: part.source || '',
      paidDate: part.paidAt?.slice(0, 10) ?? '',
      notes: part.notes || '',
    });
  }, [part, partId]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      flushPending.current();
    };
  }, []);

  const flashSaved = () => {
    setSavedVisible(true);
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = setTimeout(() => setSavedVisible(false), 1500);
  };

  const persistDraft = (next: PartDraft, showSaved = true) => {
    if (!part) {
      return;
    }
    updateTrackedPart(part.id, {
      name: next.name.trim() || part.name,
      partNumber: next.partNumber.trim() || part.partNumber,
      estimatedCost: Number(next.estimatedCost) || 0,
      estimateProvided: next.estimatedCost.trim() !== '',
      actualCost:
        next.actualCost.trim() === ''
          ? undefined
          : Number(next.actualCost) || 0,
      ...(next.actualCost.trim() &&
      /^\d{4}-\d{2}-\d{2}$/.test(next.paidDate) &&
      Number.isFinite(Date.parse(next.paidDate))
        ? { paidAt: `${next.paidDate}T12:00:00` }
        : {}),
      source: next.source.trim() || undefined,
      notes: next.notes.trim() || undefined,
    });
    if (showSaved) {
      flashSaved();
    }
  };

  flushPending.current = () => {
    if (pendingDraft.current) {
      persistDraft(pendingDraft.current, false);
      pendingDraft.current = null;
    }
  };

  const queueDraftSave = (next: PartDraft) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    pendingDraft.current = next;
    debounceRef.current = setTimeout(() => {
      pendingDraft.current = null;
      persistDraft(next);
    }, SAVE_DEBOUNCE_MS);
  };

  const updateDraftField = <K extends keyof PartDraft>(
    key: K,
    value: PartDraft[K],
  ) => {
    setDraft(prev => {
      const next = { ...prev, [key]: value };
      queueDraftSave(next);
      return next;
    });
  };

  const paidDate = /^\d{4}-\d{2}-\d{2}$/.test(draft.paidDate)
    ? new Date(`${draft.paidDate}T12:00:00`)
    : new Date();
  const paidLabel = paidDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (!part) {
    return (
      <Screen>
        <EmptyState
          title="Part not found"
          actionLabel="Back"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const setStatus = (status: PartStatus) => {
    updateTrackedPart(part.id, { status });
    flashSaved();
  };

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <Text size="md" tone="muted">
          {part.category || 'Part'}
        </Text>
        {savedVisible ? (
          <Text size="md" tone="accent" weight="semibold">
            Saved
          </Text>
        ) : null}
      </View>

      <View style={[styles.panel, styles.section]}>
        <Text style={styles.sectionTitle}>STATUS</Text>
        <StatusStepper value={part.status} onChange={setStatus} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRIORITY</Text>
        <SegmentedControl
          accessibilityLabel="Priority"
          value={part.priority}
          onChange={priority => {
            updateTrackedPart(part.id, { priority });
            flashSaved();
          }}
          segments={PRIORITIES.map(priority => ({
            value: priority,
            label: PRIORITY_LABELS[priority],
            ...(priority === 'urgent'
              ? { selectedBg: colors.dangerSoft, selectedFg: colors.dangerText }
              : {}),
          }))}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>COST</Text>
        <View style={styles.costRow}>
          <Input
            appearance="outlined"
            size="lg"
            label="Estimated"
            leftSection={currencySymbol}
            value={draft.estimatedCost}
            onChangeText={v => updateDraftField('estimatedCost', v)}
            keyboardType="decimal-pad"
            containerStyle={styles.flex}
          />
          <Input
            appearance="outlined"
            size="lg"
            label="Actual"
            leftSection={currencySymbol}
            placeholder="When paid"
            value={draft.actualCost}
            onChangeText={v => updateDraftField('actualCost', v)}
            keyboardType="decimal-pad"
            containerStyle={styles.flex}
          />
        </View>
        {draft.actualCost.trim() !== '' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Paid on ${paidLabel}. Change date`}
            onPress={() => setDatePickerOpen(true)}
            style={({ pressed }) => [
              styles.panel,
              styles.dateRow,
              pressed && styles.pressed,
            ]}
          >
            <View>
              <Text size="md" tone="muted">
                Paid on
              </Text>
              <Text>{paidLabel}</Text>
            </View>
            <Text weight="semibold" tone="accent">
              Change
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DETAILS</Text>
        <Input
          appearance="outlined"
          size="lg"
          label="Name"
          value={draft.name}
          onChangeText={v => updateDraftField('name', v)}
        />
        <Input
          appearance="outlined"
          size="lg"
          label="Part number"
          placeholder="Optional"
          value={draft.partNumber}
          onChangeText={v => updateDraftField('partNumber', v)}
        />
        <Input
          appearance="outlined"
          size="lg"
          label="Where to buy"
          placeholder="Optional: shop or link"
          value={draft.source}
          onChangeText={v => updateDraftField('source', v)}
        />
        <Input
          appearance="outlined"
          size="lg"
          label="Notes"
          placeholder="Optional"
          multiline
          value={draft.notes}
          onChangeText={v => updateDraftField('notes', v)}
          inputStyle={styles.notes}
        />
      </View>

      {datePickerOpen && Platform.OS === 'android' ? (
        <DateTimePicker
          value={paidDate}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, date) => {
            setDatePickerOpen(false);
            if (event.type === 'set' && date) {
              updateDraftField('paidDate', toDateKey(date));
            }
          }}
        />
      ) : null}
      <SheetFrame
        visible={datePickerOpen && Platform.OS === 'ios'}
        title="Paid on"
        compact
        onClose={() => setDatePickerOpen(false)}
      >
        <DateTimePicker
          value={paidDate}
          mode="date"
          display="inline"
          maximumDate={new Date()}
          themeVariant="dark"
          onChange={(_event, date) => {
            if (date) {
              updateDraftField('paidDate', toDateKey(date));
            }
          }}
        />
        <Button label="Done" onPress={() => setDatePickerOpen(false)} />
      </SheetFrame>

      <View style={[styles.actions, { marginBottom: bottom + spacing.md }]}>
        {part.status !== 'installed' ? (
          <Button
            label="Mark as installed"
            size="lg"
            leftIcon={<Check size={20} color={colors.bg} strokeWidth={2.6} />}
            onPress={() => setStatus('installed')}
          />
        ) : null}
        <Button
          label="Remove from this car"
          variant="danger"
          onPress={() => {
            Alert.alert('Delete part', 'Remove this part from this car?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  removeTrackedPart(part.id);
                  navigation.goBack();
                },
              },
            ]);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  section: { gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  panel: {
    padding: 18,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  costRow: { flexDirection: 'row', gap: spacing.sm },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  notes: { minHeight: 88, textAlignVertical: 'top' },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  pressed: {
    opacity: 0.72,
  },
});
