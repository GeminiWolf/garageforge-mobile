import React, { useMemo, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGarageStore } from '../../store/garageStore';
import { jobsForVehicle } from '../../store/jobs';
import type { Job } from '../../types/garage';
import {
  colors,
  fontFamily,
  layout,
  radius,
  spacing,
  tabularNums,
} from '../../theme';
import { jobDates, jobTitle, jobTotals } from '../../utils/carInfo';
import { formatMoney } from '../../utils/formatMoney';
import {
  formatDuration,
  formatMileage,
  formatShortDate,
} from '../../utils/vehicleDetails';
import { StatusPill } from '../common/StatusPill';
import { Text } from '../common/Text';

type Props = {
  vehicleId: string;
  header?: ReactNode;
  onOpenJob: (job: Job) => void;
};

/** Every job this car has been in for, newest first. */
export function CarHistoryPanel({ vehicleId, header, onOpenJob }: Props) {
  const insets = useSafeAreaInsets();
  const allJobs = useGarageStore(s => s.jobs);
  const parts = useGarageStore(s => s.trackedParts);
  const timeEntries = useGarageStore(s => s.timeEntries);
  const units = useGarageStore(s => s.settings.units);
  const currency = useGarageStore(s => s.settings.currency);

  const jobs = useMemo(
    () =>
      jobsForVehicle(allJobs, vehicleId).map(job => ({
        job,
        totals: jobTotals(job.id, parts, timeEntries),
      })),
    [allJobs, vehicleId, parts, timeEntries],
  );
  const all = jobs.reduce(
    (sum, { totals }) => ({
      cost: sum.cost + totals.cost,
      minutes: sum.minutes + totals.minutes,
    }),
    { cost: 0, minutes: 0 },
  );
  const first = jobs[jobs.length - 1]?.job;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: spacing.xxl + insets.bottom },
      ]}
    >
      {header}
      <View style={styles.stats}>
        <Stat label="Jobs" value={String(jobs.length)} />
        <Stat label="Parts cost" value={formatMoney(all.cost, currency)} />
        <Stat label="Time" value={formatDuration(all.minutes)} />
      </View>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          JOBS
        </Text>
        {first ? (
          <Text size="sm" tone="muted">
            First job {formatShortDate(first.openedAt)}
          </Text>
        ) : null}
      </View>
      {jobs.map(({ job, totals }) => {
        const facts = [
          `${totals.parts} ${totals.parts === 1 ? 'part' : 'parts'}`,
          totals.cost ? formatMoney(totals.cost, currency) : null,
          totals.minutes ? formatDuration(totals.minutes) : null,
        ]
          .filter(Boolean)
          .join(' · ');
        const dates = [
          jobDates(job),
          job.mileageIn != null ? formatMileage(job.mileageIn, units) : null,
        ]
          .filter(Boolean)
          .join(' · ');
        const open = job.status === 'open';
        return (
          <Pressable
            key={job.id}
            accessibilityRole="button"
            accessibilityLabel={`${jobTitle(job)}, ${
              open ? 'in progress' : 'done'
            }, ${dates}, ${facts}`}
            onPress={() => onOpenJob(job)}
            style={({ pressed }) => [
              styles.job,
              open && styles.jobOpen,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.jobBody}>
              <View style={styles.jobHead}>
                <Text weight="semibold" style={styles.shrink} numberOfLines={1}>
                  {jobTitle(job)}
                </Text>
                {open ? (
                  <StatusPill tone="accent" label="In progress" />
                ) : (
                  <Text size="sm" tone="muted">
                    Done
                  </Text>
                )}
              </View>
              <Text size="sm" tone="muted">
                {dates}
              </Text>
              <Text size="sm" style={[styles.facts, tabularNums]}>
                {facts}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textDim} />
          </Pressable>
        );
      })}
    </ScrollView>
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
  content: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
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
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
  },
  job: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    paddingRight: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceRaised,
  },
  jobOpen: { borderColor: colors.accentDim },
  pressed: { opacity: 0.8 },
  jobBody: { flex: 1, gap: 4 },
  jobHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  shrink: { flexShrink: 1 },
  facts: { color: colors.neutralText },
});
