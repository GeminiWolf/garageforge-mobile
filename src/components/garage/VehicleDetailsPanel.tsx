import React, { useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Clock, Gauge, Plus, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGarageStore } from '../../store/garageStore';
import { colors, fontFamily, layout, radius, spacing } from '../../theme';
import type { NoteKind, VehicleNote } from '../../types';
import {
  formatDuration,
  formatMileage,
  formatShortDate,
  parseDuration,
  parseMileage,
  toDateKey,
} from '../../utils/vehicleDetails';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { SegmentedControl } from '../common/SegmentedControl';
import { SheetFrame } from '../common/SheetFrame';
import { StatusPill } from '../common/StatusPill';
import { Text } from '../common/Text';

type Props = {
  vehicleId: string;
  /** Shown at the top (the Parts / Details switch). */
  header?: ReactNode;
};

type Sheet =
  | { kind: 'mileage' }
  | { kind: 'engineNumber' }
  | { kind: 'time' }
  | { kind: 'note'; note?: VehicleNote };

const NOTE_KINDS = [
  { value: 'customer' as const, label: 'From customer' },
  { value: 'personal' as const, label: 'Personal' },
];

const QUICK_TIMES = [15, 30, 60, 120];

/** Mileage, time spent, engine details and notes for one car. */
export function VehicleDetailsPanel({ vehicleId, header }: Props) {
  const vehicle = useGarageStore(s => s.vehicles.find(v => v.id === vehicleId));
  const units = useGarageStore(s => s.settings.units);
  const allNotes = useGarageStore(s => s.notes);
  const allTimeEntries = useGarageStore(s => s.timeEntries);
  const updateVehicle = useGarageStore(s => s.updateVehicle);
  const addNote = useGarageStore(s => s.addNote);
  const updateNote = useGarageStore(s => s.updateNote);
  const removeNote = useGarageStore(s => s.removeNote);
  const addTimeEntry = useGarageStore(s => s.addTimeEntry);
  const removeTimeEntry = useGarageStore(s => s.removeTimeEntry);

  const notes = useMemo(
    () =>
      allNotes
        .filter(note => note.vehicleId === vehicleId)
        .sort((a, b) => b.writtenAt.localeCompare(a.writtenAt)),
    [allNotes, vehicleId],
  );
  const timeEntries = useMemo(
    () =>
      allTimeEntries
        .filter(entry => entry.vehicleId === vehicleId)
        .sort(
          (a, b) =>
            b.workedOn.localeCompare(a.workedOn) ||
            b.updatedAt.localeCompare(a.updatedAt),
        ),
    [allTimeEntries, vehicleId],
  );
  const totalMinutes = timeEntries.reduce(
    (sum, entry) => sum + entry.minutes,
    0,
  );

  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [text, setText] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [noteKind, setNoteKind] = useState<NoteKind>('customer');
  const [error, setError] = useState<string | null>(null);

  if (!vehicle) {
    return null;
  }

  const open = (next: Sheet) => {
    setError(null);
    setHours('');
    setMinutes('');
    if (next.kind === 'mileage') {
      setText(
        vehicle.mileage != null
          ? formatMileage(vehicle.mileage, units).replace(/ (km|mi)$/, '')
          : '',
      );
    } else if (next.kind === 'engineNumber') {
      setText(vehicle.engineNumber ?? '');
    } else if (next.kind === 'note') {
      setText(next.note?.body ?? '');
      setNoteKind(next.note?.kind ?? 'customer');
    } else {
      setText('');
    }
    setSheet(next);
  };
  const close = () => setSheet(null);

  const save = () => {
    if (!sheet) return;
    switch (sheet.kind) {
      case 'mileage': {
        if (text.trim() === '') {
          updateVehicle(vehicleId, { mileage: undefined });
          break;
        }
        const km = parseMileage(text, units);
        if (km == null) {
          setError('Enter the reading as a number, like 84320.');
          return;
        }
        updateVehicle(vehicleId, { mileage: km });
        break;
      }
      case 'engineNumber':
        updateVehicle(vehicleId, { engineNumber: text.toUpperCase() });
        break;
      case 'time': {
        const total = parseDuration(hours, minutes);
        if (total == null) {
          setError('Enter up to 24 hours, like 1 h 30 min.');
          return;
        }
        addTimeEntry({
          vehicleId,
          minutes: total,
          workedOn: toDateKey(new Date()),
          note: text,
        });
        break;
      }
      case 'note': {
        if (text.trim() === '') {
          setError('Write the note first.');
          return;
        }
        if (sheet.note) {
          updateNote(sheet.note.id, { kind: noteKind, body: text });
        } else {
          addNote({ vehicleId, kind: noteKind, body: text });
        }
        break;
      }
    }
    close();
  };

  const confirmDeleteNote = (note: VehicleNote) =>
    Alert.alert('Delete note', 'This note will be removed from this car.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeNote(note.id);
          close();
        },
      },
    ]);

  const engineLabel = [vehicle.engine, vehicle.engineCode]
    .filter(Boolean)
    .join(' · ');
  const lastEntry = timeEntries[0];

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xxl + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {header}

        <View style={styles.tiles}>
          <View style={styles.tile}>
            <View style={styles.tileLabel}>
              <Gauge size={16} color={colors.textMuted} />
              <Text size="md" tone="muted">
                Mileage
              </Text>
            </View>
            <Text style={styles.tileValue}>
              {vehicle.mileage != null
                ? formatMileage(vehicle.mileage, units)
                : 'Not set'}
            </Text>
            <Text size="sm" tone="muted">
              {vehicle.mileageUpdatedAt
                ? `Updated ${formatShortDate(vehicle.mileageUpdatedAt)}`
                : 'Add the odometer reading'}
            </Text>
            <Button
              label={vehicle.mileage != null ? 'Update' : 'Add'}
              variant="secondary"
              onPress={() => open({ kind: 'mileage' })}
              style={styles.tileButton}
            />
          </View>
          <View style={styles.tile}>
            <View style={styles.tileLabel}>
              <Clock size={16} color={colors.textMuted} />
              <Text size="md" tone="muted">
                Time spent
              </Text>
            </View>
            <Text style={styles.tileValue}>{formatDuration(totalMinutes)}</Text>
            <Text size="sm" tone="muted" numberOfLines={1}>
              {lastEntry
                ? `Last: ${formatDuration(
                    lastEntry.minutes,
                  )}, ${formatShortDate(lastEntry.workedOn)}`
                : 'Nothing logged yet'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => open({ kind: 'time' })}
              style={({ pressed }) => [
                styles.logButton,
                pressed && styles.pressed,
              ]}
            >
              <Text weight="semibold" style={styles.logLabel}>
                Log time
              </Text>
            </Pressable>
          </View>
        </View>

        <Section title="Engine">
          <View style={styles.panel}>
            <View style={styles.row}>
              <Text tone="muted">Engine</Text>
              <Text style={styles.rowValue} numberOfLines={2}>
                {engineLabel || 'Not recorded'}
              </Text>
            </View>
            {engineLabel ? (
              <View style={[styles.row, styles.rowSmall, styles.rowDivider]}>
                <Text size="sm" tone="muted">
                  Filled in from the catalogue
                </Text>
                <StatusPill tone="accent" label="Catalogue" />
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                vehicle.engineNumber
                  ? `Engine number ${vehicle.engineNumber}. Edit`
                  : 'Add engine number'
              }
              onPress={() => open({ kind: 'engineNumber' })}
              style={({ pressed }) => [
                styles.row,
                styles.rowDivider,
                pressed && styles.pressed,
              ]}
            >
              <Text tone="muted">Engine number</Text>
              <Text
                style={styles.rowValue}
                tone={vehicle.engineNumber ? 'default' : 'accent'}
                weight={vehicle.engineNumber ? 'regular' : 'medium'}
              >
                {vehicle.engineNumber ?? 'Add engine number'}
              </Text>
            </Pressable>
          </View>
        </Section>

        <Section
          title="Notes"
          action={
            <Pressable
              accessibilityRole="button"
              onPress={() => open({ kind: 'note' })}
              hitSlop={spacing.sm}
              style={({ pressed }) => [
                styles.addAction,
                pressed && styles.pressed,
              ]}
            >
              <Plus size={16} color={colors.accent} strokeWidth={2.4} />
              <Text weight="semibold" tone="accent">
                Add note
              </Text>
            </Pressable>
          }
        >
          {notes.length === 0 ? (
            <Text tone="muted" style={styles.empty}>
              Write down what the customer reported, or a reminder for yourself.
            </Text>
          ) : (
            notes.map(note => (
              <Pressable
                key={note.id}
                accessibilityRole="button"
                accessibilityHint="Opens the note to edit it"
                onPress={() => open({ kind: 'note', note })}
                style={({ pressed }) => [
                  styles.note,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.noteHead}>
                  <StatusPill
                    tone={note.kind === 'customer' ? 'info' : 'neutral'}
                    label={
                      note.kind === 'customer' ? 'From customer' : 'Personal'
                    }
                  />
                  <Text size="sm" tone="muted">
                    {formatShortDate(note.writtenAt)}
                  </Text>
                </View>
                <Text style={styles.noteBody}>{note.body}</Text>
              </Pressable>
            ))
          )}
        </Section>

        {timeEntries.length > 0 ? (
          <Section title="Time log">
            <View style={styles.panel}>
              {timeEntries.map((entry, index) => (
                <View
                  key={entry.id}
                  style={[styles.row, index > 0 && styles.rowDivider]}
                >
                  <View style={styles.entryText}>
                    <Text weight="medium">{formatDuration(entry.minutes)}</Text>
                    <Text size="md" tone="muted" numberOfLines={1}>
                      {formatShortDate(entry.workedOn)}
                      {entry.note ? ` · ${entry.note}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${formatDuration(
                      entry.minutes,
                    )} on ${formatShortDate(entry.workedOn)}`}
                    hitSlop={spacing.sm}
                    onPress={() =>
                      Alert.alert('Delete time', 'Remove this entry?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => removeTimeEntry(entry.id),
                        },
                      ])
                    }
                    style={styles.iconButton}
                  >
                    <Trash2 size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>

      <SheetFrame
        visible={sheet !== null}
        compact
        onClose={close}
        title={
          sheet?.kind === 'mileage'
            ? 'Mileage'
            : sheet?.kind === 'engineNumber'
            ? 'Engine number'
            : sheet?.kind === 'time'
            ? 'Log time'
            : sheet?.kind === 'note' && sheet.note
            ? 'Edit note'
            : 'Add note'
        }
      >
        <View style={styles.sheetBody}>
          {sheet?.kind === 'mileage' ? (
            <Input
              appearance="outlined"
              size="lg"
              autoFocus
              keyboardType="number-pad"
              value={text}
              onChangeText={setText}
              rightSection={
                <Text tone="muted">{units === 'imperial' ? 'mi' : 'km'}</Text>
              }
              accessibilityLabel="Odometer reading"
              helper="Leave empty to clear it."
            />
          ) : null}

          {sheet?.kind === 'engineNumber' ? (
            <Input
              appearance="outlined"
              size="lg"
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={50}
              value={text}
              onChangeText={setText}
              accessibilityLabel="Engine number"
              helper="Stamped on the engine block. Leave empty to clear it."
            />
          ) : null}

          {sheet?.kind === 'time' ? (
            <>
              <View style={styles.quickTimes}>
                {QUICK_TIMES.map(value => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    onPress={() => {
                      setHours(String(Math.floor(value / 60)));
                      setMinutes(String(value % 60));
                    }}
                    style={({ pressed }) => [
                      styles.quickTime,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text weight="medium">{formatDuration(value)}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.durationRow}>
                <Input
                  appearance="outlined"
                  size="lg"
                  keyboardType="number-pad"
                  value={hours}
                  onChangeText={setHours}
                  rightSection={<Text tone="muted">h</Text>}
                  accessibilityLabel="Hours"
                  containerStyle={styles.flex}
                />
                <Input
                  appearance="outlined"
                  size="lg"
                  keyboardType="number-pad"
                  value={minutes}
                  onChangeText={setMinutes}
                  rightSection={<Text tone="muted">min</Text>}
                  accessibilityLabel="Minutes"
                  containerStyle={styles.flex}
                />
              </View>
              <Input
                appearance="outlined"
                size="lg"
                value={text}
                onChangeText={setText}
                placeholder="What was done (optional)"
                accessibilityLabel="What was done"
                maxLength={500}
              />
              <Text size="md" tone="muted">
                Logged for today.
              </Text>
            </>
          ) : null}

          {sheet?.kind === 'note' ? (
            <>
              <SegmentedControl
                accessibilityLabel="Note type"
                segments={NOTE_KINDS}
                value={noteKind}
                onChange={setNoteKind}
              />
              <Input
                appearance="outlined"
                size="lg"
                autoFocus={!sheet.note}
                multiline
                value={text}
                onChangeText={setText}
                placeholder={
                  noteKind === 'customer'
                    ? 'What the customer reported'
                    : 'A reminder for yourself'
                }
                accessibilityLabel="Note"
                maxLength={5000}
                inputStyle={styles.noteInput}
              />
            </>
          ) : null}

          {error ? (
            <Text size="md" tone="danger" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button label="Save" size="lg" onPress={save} />
          {sheet?.kind === 'note' && sheet.note ? (
            <Button
              label="Delete note"
              variant="danger"
              onPress={() => sheet.note && confirmDeleteNote(sheet.note)}
            />
          ) : null}
        </View>
      </SheetFrame>
    </>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title.toUpperCase()}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: 14,
  },
  flex: { flex: 1 },
  pressed: { opacity: 0.72 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    padding: 14,
    gap: 4,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tileLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileValue: { fontFamily: fontFamily.semibold, fontSize: 22, lineHeight: 28 },
  tileButton: { marginTop: 6, minHeight: 40 },
  logButton: {
    marginTop: 6,
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logLabel: { color: colors.onAccentContainer },
  section: { gap: spacing.sm },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    minHeight: 32,
  },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  addAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  panel: {
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowSmall: { minHeight: 40 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  entryText: { flex: 1, minWidth: 0, gap: 2 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  empty: { paddingHorizontal: 4 },
  note: {
    padding: 14,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteBody: { fontSize: 15, lineHeight: 21 },
  sheetBody: { gap: spacing.md },
  quickTimes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickTime: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
  },
  durationRow: { flexDirection: 'row', gap: spacing.sm },
  noteInput: { minHeight: 120, textAlignVertical: 'top' },
});
