import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/common/EmptyState';
import { Screen } from '../../components/common/Screen';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import { CarHistoryPanel } from '../../components/garage/CarHistoryPanel';
import { JobBanner } from '../../components/garage/JobBanner';
import { VehicleDetailsPanel } from '../../components/garage/VehicleDetailsPanel';
import { VehiclePartsWorkspace } from '../../components/parts/VehiclePartsWorkspace';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import { openJobFor } from '../../store/jobs';
import { layout, spacing } from '../../theme';

type Props = NativeStackScreenProps<GarageStackParamList, 'CarDashboard'>;

type Tab = 'job' | 'details' | 'history';

const TABS = [
  { value: 'job' as const, label: 'Job' },
  { value: 'details' as const, label: 'Details' },
  { value: 'history' as const, label: 'History' },
];

export function CarDashboardScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const vehicle = useGarageStore(s => s.vehicles.find(v => v.id === vehicleId));
  const openJob = useGarageStore(s => openJobFor(s.jobs, vehicleId));
  // A car that isn't in the workshop opens on its history.
  const [tab, setTab] = useState<Tab>(() =>
    openJobFor(useGarageStore.getState().jobs, vehicleId) ? 'job' : 'history',
  );

  if (!vehicle) {
    return (
      <Screen>
        <EmptyState
          title="This car isn’t in the garage"
          actionLabel="Back to garage"
          onAction={() => navigation.navigate('GarageHome')}
        />
      </Screen>
    );
  }

  const startJob = () => navigation.navigate('StartJob', { vehicleId });

  const switcher = (
    <View>
      <SegmentedControl
        accessibilityLabel="Car sections"
        segments={TABS}
        value={tab}
        onChange={setTab}
      />
    </View>
  );

  if (tab === 'details') {
    return (
      <VehicleDetailsPanel
        vehicleId={vehicleId}
        header={switcher}
        onStartJob={startJob}
      />
    );
  }

  if (tab === 'history') {
    return (
      <CarHistoryPanel
        vehicleId={vehicleId}
        header={switcher}
        onOpenJob={job =>
          job.status === 'open'
            ? setTab('job')
            : navigation.navigate('JobDetail', { jobId: job.id })
        }
      />
    );
  }

  if (!openJob) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        {switcher}
        <EmptyState
          title="Not in the workshop"
          subtitle="Start a job when this car comes in. Its earlier jobs are in History."
          actionLabel="Start a job"
          onAction={startJob}
        />
      </ScrollView>
    );
  }

  return (
    <VehiclePartsWorkspace
      vehicleId={vehicleId}
      jobId={openJob.id}
      navigation={navigation}
      header={
        <View style={styles.header}>
          {switcher}
          <JobBanner job={openJob} onFinished={() => setTab('history')} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  header: { gap: 14 },
});
