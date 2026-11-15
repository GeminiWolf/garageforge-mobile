import React, { useLayoutEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Screen } from '../../components/common/Screen';
import { StatusPill } from '../../components/common/StatusPill';
import { Text } from '../../components/common/Text';
import { TrackedPartRow } from '../../components/parts/TrackedPartRow';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import { openJobFor } from '../../store/jobs';
import {
  colors,
  fontFamily,
  layout,
  radius,
  spacing,
  tabularNums,
} from '../../theme';
import {
  carSubtitle,
  carTitle,
  jobDates,
  jobTitle,
  jobTotals,
} from '../../utils/carInfo';
import { formatMoney } from '../../utils/formatMoney';
import {
  formatDuration,
  formatMileage,
  formatShortDate,
} from '../../utils/vehicleDetails';

type Props = NativeStackScreenProps<GarageStackParamList, 'JobDetail'>;

/** One past (or current) job: what was fitted, notes and time. */
export function JobDetailScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const insets = useSafeAreaInsets();
  const job = useGarageStore(s => s.jobs.find(item => item.id === jobId));
  const vehicle = useGarageStore(s =>
    job ? s.vehicles.find(v => v.id === job.vehicleId) : undefined,
  );
  const allParts = useGarageStore(s => s.trackedParts);
  const allNotes = useGarageStore(s => s.notes);
  const allTime = useGarageStore(s => s.timeEntries);
  const units = useGarageStore(s => s.settings.units);
  const currency = useGarageStore(s => s.settings.currency);
  const reopenJob = useGarageStore(s => s.reopenJob);
  const otherOpenJob = useGarageStore(s =>
    job ? openJobFor(s.jobs, job.vehicleId) : undefined,
  );

  const parts = useMemo(
    () => allParts.filter(part => part.jobId === jobId),
    [allParts, jobId],
  );
  const notes = useMemo(
    () =>
      allNotes
        .filter(note => note.jobId === jobId)
        .sort((a, b) => b.writtenAt.localeCompare(a.writtenAt)),
    [allNotes, jobId],
  );
  const time = useMemo(
    () =>
      allTime
        .filter(entry => entry.jobId === jobId)
        .sort((a, b) => b.workedOn.localeCompare(a.workedOn)),
    [allTime, jobId],
  );

  useLayoutEffect(() => {
    if (job && vehicle) {
      navigation.setOptions({
        title: jobTitle(job),
      });
    }
  }, [navigation, job, vehicle]);

  if (!job || !vehicle) {
    return (
      <Screen>
        <EmptyState
          title="This job isn’t here any more"
          actionLabel="Back to garage"
          onAction={() => navigation.navigate('GarageHome')}
        />
      </Screen>
    );
  }

  const totals = jobTotals(job.id, allParts, allTime);
  const open = job.status === 'open';
  const canReopen = !open && !otherOpenJob;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xxl + insets.bottom },
        ]}
      >
        <View style={styles.car}>
          <Text weight="semibold">{carTitle(vehicle)}</Text>
          <Text size="md" tone="muted">
            {[carSubtitle(vehicle), vehicle.plate].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View style={styles.statusLine}>
          <StatusPill
            tone={open ? 'accent' : 'neutral'}
            label={open ? 'In progress' : 'Done'}
          />
          <Text size="md" tone="muted">
            {jobDates(job)}
          </Text>
        </View>

        <View style={styles.stats}>
          <Stat
            label="Came in at"
            value={
              job.mileageIn != null ? formatMileage(job.mileageIn, units) : '—'
            }
          />
          <Stat label="Parts" value={formatMoney(totals.cost, currency)} />
          <Stat label="Time" value={formatDuration(totals.minutes)} />
        </View>

        <SectionTitle>{open ? 'PARTS' : 'PARTS ON THIS JOB'}</SectionTitle>
        {parts.length === 0 ? (
          <Text tone="muted">No parts on this job.</Text>
        ) : (
          <View style={styles.panel}>
            {parts.map((part, index) => (
              <TrackedPartRow
                key={part.id}
                part={part}
                currency={currency}
                divider={index < parts.length - 1}
                onPress={() =>
                  navigation.navigate('PartDetail', { partId: part.id })
                }
              />
            ))}
          </View>
        )}

        {notes.length > 0 ? (
          <>
            <SectionTitle>NOTES</SectionTitle>
            {notes.map(note => (
              <View key={note.id} style={styles.note}>
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
              </View>
            ))}
          </>
        ) : null}

        {time.length > 0 ? (
          <>
            <SectionTitle>TIME LOG</SectionTitle>
            <View style={styles.panel}>
              {time.map((entry, index) => (
                <View
                  key={entry.id}
                  style={[styles.timeRow, index > 0 && styles.rowDivider]}
                >
                  <Text weight="medium" style={tabularNums}>
                    {formatDuration(entry.minutes)}
                  </Text>
                  <Text
                    size="md"
                    tone="muted"
                    numberOfLines={1}
                    style={styles.shrink}
                  >
                    {formatShortDate(entry.workedOn)}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {open ? (
          <Button
            label="Go to this job"
            variant="secondary"
            size="lg"
            onPress={() =>
              navigation.navigate('CarDashboard', { vehicleId: vehicle.id })
            }
            style={styles.action}
          />
        ) : canReopen ? (
          <Button
            label="Reopen this job"
            variant="ghost"
            size="lg"
            onPress={() => {
              reopenJob(job.id);
              navigation.navigate('CarDashboard', { vehicleId: vehicle.id });
            }}
            style={styles.action}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text weight="semibold" style={[styles.statValue, tabularNums]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  car: { gap: 2 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    padding: spacing.md,
    gap: 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceRaised,
  },
  statValue: { fontSize: 17, lineHeight: 22 },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    color: colors.textMuted,
    paddingLeft: spacing.xs,
    marginTop: spacing.xs,
  },
  panel: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceRaised,
  },
  note: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceRaised,
  },
  noteHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteBody: { fontSize: 15, lineHeight: 21 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  shrink: { flexShrink: 1 },
  action: { marginTop: spacing.sm },
});
