import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plus, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Text } from '../../components/common/Text';
import { CarRow } from '../../components/garage/CarRow';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import { jobsForVehicle } from '../../store/jobs';
import { colors, layout, radius, spacing } from '../../theme';
import { carMatches, lastVisit } from '../../utils/carInfo';
import { formatShortDate } from '../../utils/vehicleDetails';

type Props = NativeStackScreenProps<GarageStackParamList, 'FindCar'>;

/** How many recent cars to show before anything is typed. */
const RECENT = 6;

/**
 * "Add car" starts here: find a returning car so its history stays in one
 * place, or go on to add a new one.
 */
export function FindCarScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const vehicles = useGarageStore(s => s.vehicles);
  const jobs = useGarageStore(s => s.jobs);
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';

  const cars = useMemo(() => {
    const list = vehicles.map(vehicle => {
      const own = jobsForVehicle(jobs, vehicle.id);
      return {
        vehicle,
        inNow: own.some(job => job.status === 'open'),
        last: lastVisit(own),
      };
    });
    list.sort((a, b) => Date.parse(b.last ?? '0') - Date.parse(a.last ?? '0'));
    return searching
      ? list.filter(item => carMatches(item.vehicle, query))
      : list.filter(item => !item.inNow).slice(0, RECENT);
  }, [vehicles, jobs, query, searching]);

  const pick = (vehicleId: string, inNow: boolean) => {
    if (inNow) {
      navigation.replace('CarDashboard', { vehicleId });
    } else {
      navigation.replace('StartJob', { vehicleId });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <FlatList
        data={cars}
        keyExtractor={item => item.vehicle.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text tone="muted">
              Been here before? Find the car so its history stays in one place.
            </Text>
            <Input
              appearance="outlined"
              size="lg"
              autoFocus
              placeholder="Customer, plate or car"
              leftSection={<Search size={18} color={colors.textMuted} />}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {cars.length > 0 ? (
              <Text
                size="sm"
                weight="semibold"
                tone="muted"
                style={styles.section}
              >
                {searching
                  ? `${cars.length} ${cars.length === 1 ? 'MATCH' : 'MATCHES'}`
                  : 'RECENT CARS'}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.rowWrap,
              index === 0 && styles.rowFirst,
              index === cars.length - 1 && styles.rowLast,
            ]}
          >
            <CarRow
              vehicle={item.vehicle}
              inNow={item.inNow}
              lastLabel={
                item.last
                  ? `Last visit ${formatShortDate(item.last)}`
                  : undefined
              }
              divider={index < cars.length - 1}
              onPress={() => pick(item.vehicle.id, item.inNow)}
            />
          </View>
        )}
        ListEmptyComponent={
          searching ? (
            <Text tone="muted" style={styles.empty}>
              No car matches that. It may be new: add it below.
            </Text>
          ) : null
        }
      />
      <View
        style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}
      >
        <Button
          label="Add a new car"
          variant="secondary"
          size="lg"
          leftIcon={<Plus size={20} color={colors.text} />}
          onPress={() => navigation.replace('AddVehicle')}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  section: {
    paddingTop: spacing.sm,
    paddingLeft: spacing.xs,
    letterSpacing: 0.4,
  },
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
  empty: { paddingVertical: spacing.lg },
  footer: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.bg,
  },
});
