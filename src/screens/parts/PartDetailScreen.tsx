import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { Screen } from '../../components/common/Screen';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SheetFrame } from '../../components/common/SheetFrame';
import { Text } from '../../components/common/Text';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import type { PartPriority, PartStatus } from '../../types';
import { hasPartEstimate } from '../../utils/partEstimate';
import { colors, spacing } from '../../theme';
import { getCurrencySymbol } from '../../utils/formatMoney';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<GarageStackParamList, 'PartDetail'>;

const PRIORITIES: PartPriority[] = ['urgent', 'soon', 'someday'];
const STATUSES: PartStatus[] = ['needed', 'sourcing', 'ordered', 'installed'];
const SAVE_DEBOUNCE_MS = 500;

const STATUS_LABELS: Record<PartStatus, string> = {
  needed: 'To source',
  sourcing: 'Sourcing',
  ordered: 'Awaiting delivery',
  installed: 'Installed',
};

const PRIORITY_LABELS: Record<PartPriority, string> = {
  urgent: 'Urgent',
  soon: 'Soon',
  someday: 'Someday',
};

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

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

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <Text variant="caption" tone="dim">
          {part.category}
        </Text>
        {savedVisible ? (
          <Text variant="caption" tone="accent" weight="semibold">
            Saved
          </Text>
        ) : null}
      </View>

      <SectionHeader title="Status" />
      <View style={styles.chips}>
        {STATUSES.map(s => (
          <Chip
            key={s}
            label={STATUS_LABELS[s]}
            selected={part.status === s}
            onPress={() => {
              updateTrackedPart(part.id, { status: s });
              flashSaved();
            }}
          />
        ))}
      </View>

      <SectionHeader title="Priority" />
      <View style={styles.chips}>
        {PRIORITIES.map(p => (
          <Chip
            key={p}
            label={PRIORITY_LABELS[p]}
            selected={part.priority === p}
            onPress={() => {
              updateTrackedPart(part.id, { priority: p });
              flashSaved();
            }}
          />
        ))}
      </View>

      <SectionHeader title="Cost" />
      <Input
        label="Estimated cost"
        leftSection={currencySymbol}
        value={draft.estimatedCost}
        onChangeText={v => updateDraftField('estimatedCost', v)}
        keyboardType="decimal-pad"
        containerStyle={styles.field}
      />
      <Input
        label="Actual cost"
        leftSection={currencySymbol}
        placeholder="Add when you’ve paid"
        value={draft.actualCost}
        onChangeText={v => updateDraftField('actualCost', v)}
        keyboardType="decimal-pad"
        containerStyle={styles.field}
      />
      {draft.actualCost.trim() !== '' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Paid on ${paidLabel}. Change date`}
          onPress={() => setDatePickerOpen(true)}
          style={({ pressed }) => [styles.dateRow, pressed && styles.pressed]}
        >
          <View>
            <Text variant="caption" tone="muted">
              Paid on
            </Text>
            <Text>{paidLabel}</Text>
          </View>
          <Text weight="medium" tone="accent">
            Change
          </Text>
        </Pressable>
      ) : null}

      <SectionHeader title="Details" />
      <Input
        label="Name"
        value={draft.name}
        onChangeText={v => updateDraftField('name', v)}
        containerStyle={styles.field}
      />
      <Input
        label="Part number"
        placeholder="Optional"
        value={draft.partNumber}
        onChangeText={v => updateDraftField('partNumber', v)}
        containerStyle={styles.field}
      />
      <Input
        label="Where to buy"
        placeholder="Optional: shop or link"
        value={draft.source}
        onChangeText={v => updateDraftField('source', v)}
        containerStyle={styles.field}
      />
      <Input
        label="Notes"
        placeholder="Optional"
        value={draft.notes}
        onChangeText={v => updateDraftField('notes', v)}
        containerStyle={styles.field}
      />

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

      <Button
        label="Remove from this build"
        variant="danger"
        onPress={() => {
          Alert.alert('Delete part', 'Remove this part from the tracker?', [
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
        style={{ marginTop: spacing.xl, marginBottom: bottom + spacing.md }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.72,
  },
});
