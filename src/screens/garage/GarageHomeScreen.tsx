import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Search } from 'lucide-react-native';

import { EmptyState } from '../../components/common/EmptyState';
import { Fab } from '../../components/common/Fab';
import { Input } from '../../components/common/Input';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import { CarRow } from '../../components/garage/CarRow';
import { Screen } from '../../components/common/Screen';
import { Text } from '../../components/common/Text';
import { VehicleCard } from '../../components/garage/VehicleCard';
import type {
  GarageStackParamList,
  RootTabParamList,
} from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import { jobsForVehicle } from '../../store/jobs';
import type { Job, Vehicle } from '../../types/garage';
import { carMatches, carTitle, lastVisit } from '../../utils/carInfo';
import { formatShortDate } from '../../utils/vehicleDetails';
import { confirmRemoveVehicle } from '../../utils/confirmRemoveVehicle';
import { describeSyncLine } from '../../utils/syncLine';
import { syncNow, useSyncStatus } from '../../services/accountController';
import { colors, layout, radius, spacing } from '../../theme';
import {
  dismissBackupHint,
  hasSeenWelcome,
  isBackupHintDismissed,
  markWelcomeSeen,
} from '../../utils/onboarding';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'GarageTab'>,
  NativeStackScreenProps<GarageStackParamList>
>;

type View_ = 'workshop' | 'all';

type Row =
  | { kind: 'section'; key: string; label: string }
  | {
      kind: 'card';
      key: string;
      vehicle: Vehicle;
      job: Job;
    }
  | {
      kind: 'row';
      key: string;
      vehicle: Vehicle;
      inNow: boolean;
      lastLabel?: string;
      first: boolean;
      last: boolean;
    };

const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

/** "THIS MONTH", "OCTOBER", "MARCH 2025", or "NOT YET IN" for no visits. */
function sectionFor(time: string | undefined, now: Date): string {
  if (!time) return 'NO JOBS YET';
  const date = new Date(time);
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  ) {
    return 'THIS MONTH';
  }
  const month = MONTHS[date.getMonth()];
  return date.getFullYear() === now.getFullYear()
    ? month
    : `${month} ${date.getFullYear()}`;
}

export function GarageHomeScreen({ navigation }: Props) {
  const hasHydrated = useGarageStore(s => s.hasHydrated);
  const vehicles = useGarageStore(s => s.vehicles);
  const jobs = useGarageStore(s => s.jobs);
  const trackedParts = useGarageStore(s => s.trackedParts);
  const removeVehicle = useGarageStore(s => s.removeVehicle);
  const signedIn = useGarageStore(s => s.account !== null);
  const lastSyncedAt = useGarageStore(s => s.sync.lastSyncedAt);
  const syncState = useSyncStatus(s => s.state);
  const syncLine = describeSyncLine(syncState, lastSyncedAt);
  const [showBackupHint, setShowBackupHint] = useState(false);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View_>('workshop');

  const { inWorkshop, allCars } = useMemo(() => {
    const workshop: Array<{ vehicle: Vehicle; job: Job }> = [];
    const all: Array<{ vehicle: Vehicle; open?: Job; last?: string }> = [];
    for (const vehicle of vehicles) {
      const own = jobsForVehicle(jobs, vehicle.id);
      const open = own.find(job => job.status === 'open');
      if (open) workshop.push({ vehicle, job: open });
      all.push({ vehicle, open, last: lastVisit(own) });
    }
    workshop.sort(
      (a, b) => Date.parse(b.job.openedAt) - Date.parse(a.job.openedAt),
    );
    all.sort((a, b) => {
      if (!!a.open !== !!b.open) return a.open ? -1 : 1;
      return Date.parse(b.last ?? '0') - Date.parse(a.last ?? '0');
    });
    return { inWorkshop: workshop, allCars: all };
  }, [vehicles, jobs]);

  const rows = useMemo<Row[]>(() => {
    if (view === 'workshop') {
      return inWorkshop
        .filter(item => carMatches(item.vehicle, query))
        .map(item => ({
          kind: 'card' as const,
          key: item.vehicle.id,
          ...item,
        }));
    }
    const now = new Date();
    const matches = allCars.filter(item => carMatches(item.vehicle, query));
    const out: Row[] = [];
    let section = '';
    matches.forEach((item, index) => {
      const label = item.open ? 'IN THE WORKSHOP' : sectionFor(item.last, now);
      const next = matches[index + 1];
      const nextLabel = next
        ? next.open
          ? 'IN THE WORKSHOP'
          : sectionFor(next.last, now)
        : '';
      if (label !== section) {
        out.push({ kind: 'section', key: `s-${label}`, label });
        section = label;
      }
      out.push({
        kind: 'row',
        key: item.vehicle.id,
        vehicle: item.vehicle,
        inNow: !!item.open,
        lastLabel: item.last
          ? `Done ${formatShortDate(item.last, now)}`
          : undefined,
        first: out[out.length - 1].kind === 'section',
        last: nextLabel !== label,
      });
    });
    return out;
  }, [view, inWorkshop, allCars, query]);

  const hiddenMatches =
    view === 'workshop' && query.trim() !== '' && rows.length === 0
      ? allCars.filter(item => carMatches(item.vehicle, query)).length
      : 0;

  const openCar = (vehicleId: string) =>
    navigation.navigate('CarDashboard', { vehicleId });
  const confirmRemove = (vehicle: Vehicle) =>
    confirmRemoveVehicle(carTitle(vehicle), () => removeVehicle(vehicle.id));
  const addCar = () => {
    if (vehicles.length > 0) navigation.navigate('FindCar');
    else navigation.navigate('AddVehicle');
  };

  // First launch: introduce the app once, before the first car is added.
  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    hasSeenWelcome().then(seen => {
      if (seen) {
        return;
      }
      if (vehicles.length === 0) {
        navigation.navigate('Welcome');
      } else {
        markWelcomeSeen().catch(() => undefined);
      }
    });
    // Only on load; not every time the garage changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  // Suggest an account once there's something worth backing up.
  useEffect(() => {
    if (signedIn || vehicles.length === 0) {
      setShowBackupHint(false);
      return;
    }
    isBackupHintDismissed().then(dismissed => setShowBackupHint(!dismissed));
  }, [signedIn, vehicles.length]);

  if (!hasHydrated) {
    return <Screen loading />;
  }

  return (
    <View style={styles.container}>
      {vehicles.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            title="No cars in the workshop"
            subtitle="Add the vehicle you’re building. Parts, spend, and what’s still missing live on that car."
            actionLabel="Add car"
            onAction={() => navigation.navigate('AddVehicle')}
          />
        </View>
      ) : (
        <FlatList
          keyExtractor={item => item.key}
          data={rows}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            if (item.kind === 'section') {
              return (
                <Text
                  size="sm"
                  weight="semibold"
                  tone="muted"
                  style={styles.section}
                >
                  {item.label}
                </Text>
              );
            }
            if (item.kind === 'card') {
              return (
                <View style={styles.cardGap}>
                  <VehicleCard
                    vehicle={item.vehicle}
                    parts={trackedParts.filter(p => p.jobId === item.job.id)}
                    onPress={() => openCar(item.vehicle.id)}
                    onAddParts={() => {
                      navigation.navigate('AddPart', {
                        vehicleId: item.vehicle.id,
                      });
                    }}
                    onLongPress={() => confirmRemove(item.vehicle)}
                  />
                </View>
              );
            }
            return (
              <View
                style={[
                  styles.rowWrap,
                  item.first && styles.rowFirst,
                  item.last && styles.rowLast,
                ]}
              >
                <CarRow
                  vehicle={item.vehicle}
                  inNow={item.inNow}
                  lastLabel={item.lastLabel}
                  divider={!item.last}
                  onPress={() => openCar(item.vehicle.id)}
                  onLongPress={() => confirmRemove(item.vehicle)}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            query.trim() ? (
              <View style={styles.noMatch}>
                <Text tone="muted">
                  {hiddenMatches
                    ? `Not in the workshop now. ${hiddenMatches} ${
                        hiddenMatches === 1 ? 'match' : 'matches'
                      } in All cars.`
                    : 'No car matches that.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={spacing.sm}
                  onPress={() =>
                    hiddenMatches ? setView('all') : setQuery('')
                  }
                >
                  <Text weight="semibold" tone="accent">
                    {hiddenMatches ? 'Show them' : 'Clear search'}
                  </Text>
                </Pressable>
              </View>
            ) : view === 'workshop' ? (
              <EmptyState
                title="No cars in the workshop"
                subtitle="When a car comes in, find it in All cars and start a job, or add a new car."
                actionLabel="Add car"
                onAction={addCar}
              />
            ) : null
          }
          ListFooterComponent={
            showBackupHint ? (
              <View style={styles.backupHint}>
                <Text weight="semibold">Back up your garage</Text>
                <Text tone="muted" variant="caption">
                  Create a free account to keep your cars safe and use them on
                  the Garage Forge website.
                </Text>
                <View style={styles.backupActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('Account')}
                    hitSlop={spacing.sm}
                  >
                    <Text weight="semibold" tone="accent">
                      Create account
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      dismissBackupHint().catch(() => undefined);
                      setShowBackupHint(false);
                    }}
                    hitSlop={spacing.sm}
                  >
                    <Text tone="muted">Not now</Text>
                  </Pressable>
                </View>
              </View>
            ) : null
          }
          ListHeaderComponent={
            <View style={styles.intro}>
              <Text size="md" tone="muted">
                {vehicles.length} {vehicles.length === 1 ? 'car' : 'cars'}
                {signedIn && !syncLine.problem ? ` · ${syncLine.text}` : ''}
              </Text>
              {signedIn && syncLine.problem ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Garage ${syncLine.text}. Try again`}
                  onPress={() => syncNow().catch(() => undefined)}
                  hitSlop={spacing.sm}
                  style={({ pressed }) => [
                    styles.syncProblem,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.syncDot} />
                  <Text size="md" style={styles.syncProblemText}>
                    {syncLine.text.charAt(0).toUpperCase() +
                      syncLine.text.slice(1)}
                  </Text>
                  <Text size="md" weight="semibold" tone="accent">
                    Try again
                  </Text>
                </Pressable>
              ) : null}
              <Input
                appearance="outlined"
                size="lg"
                placeholder="Search customer, plate or car"
                leftSection={<Search size={18} color={colors.textMuted} />}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                returnKeyType="search"
                containerStyle={styles.search}
              />
              <SegmentedControl
                accessibilityLabel="Which cars"
                segments={[
                  {
                    value: 'workshop' as const,
                    label: `In the workshop · ${inWorkshop.length}`,
                  },
                  {
                    value: 'all' as const,
                    label: `All cars · ${vehicles.length}`,
                  },
                ]}
                value={view}
                onChange={setView}
              />
            </View>
          }
        />
      )}
      {vehicles.length > 0 ? (
        <Fab aboveSystemBar={false} label="Add car" onPress={addCar} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backupHint: {
    marginTop: spacing.lg,
    padding: 18,
    gap: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceRaised,
  },
  backupActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  intro: { paddingBottom: spacing.lg, gap: spacing.md },
  search: { marginBottom: 0 },
  section: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.xs,
    letterSpacing: 0.4,
  },
  cardGap: { paddingBottom: spacing.md },
  rowWrap: {
    backgroundColor: colors.surfaceRaised,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
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
  noMatch: { paddingVertical: spacing.xl, gap: spacing.md },
  syncProblem: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.warningSoft,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  syncProblemText: { color: colors.warningText },
  pressed: { opacity: 0.72 },
  container: {
    flex: 1,
  },
  empty: {
    paddingHorizontal: layout.gutter,
  },
  list: {
    paddingHorizontal: layout.gutter,
    paddingBottom: layout.fabClearance,
  },
});
