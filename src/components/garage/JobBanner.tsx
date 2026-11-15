import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useGarageStore } from '../../store/garageStore';
import type { Job } from '../../types/garage';
import { colors, radius, spacing } from '../../theme';
import { jobDates, jobTitle, jobTotals } from '../../utils/carInfo';
import { formatDuration, formatMileage } from '../../utils/vehicleDetails';
import { Button } from '../common/Button';
import { StatusPill } from '../common/StatusPill';
import { Text } from '../common/Text';

type Props = {
  job: Job;
  /** Called after the job is finished (to show the car's history). */
  onFinished: () => void;
};

/** The job the car is in for: name, when it came in, and Finish job. */
export function JobBanner({ job, onFinished }: Props) {
  const units = useGarageStore(s => s.settings.units);
  const parts = useGarageStore(s => s.trackedParts);
  const timeEntries = useGarageStore(s => s.timeEntries);
  const finishJob = useGarageStore(s => s.finishJob);
  const totals = jobTotals(job.id, parts, timeEntries);
  const notInstalled = parts.filter(
    part => part.jobId === job.id && part.status !== 'installed',
  ).length;

  const facts = [
    jobDates(job),
    job.mileageIn != null
      ? `came in at ${formatMileage(job.mileageIn, units)}`
      : null,
    totals.minutes ? `${formatDuration(totals.minutes)} logged` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const confirmFinish = () =>
    Alert.alert(
      'Finish this job?',
      notInstalled
        ? `${notInstalled} ${
            notInstalled === 1 ? 'part isn’t' : 'parts aren’t'
          } installed yet. The job moves to this car’s history either way.`
        : 'The job moves to this car’s history. You can reopen it from there.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish job',
          onPress: () => {
            finishJob(job.id);
            onFinished();
          },
        },
      ],
    );

  return (
    <View style={styles.banner}>
      <View style={styles.head}>
        <Text
          weight="semibold"
          style={styles.title}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {jobTitle(job)}
        </Text>
        <StatusPill tone="accent" label="In progress" />
      </View>
      <Text size="md" tone="muted">
        {facts}
      </Text>
      <Button
        label="Finish job"
        variant="secondary"
        size="md"
        onPress={confirmFinish}
        style={styles.finish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.accentDim,
    backgroundColor: colors.surfaceRaised,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: 18, lineHeight: 24 },
  finish: { marginTop: spacing.xs },
});
