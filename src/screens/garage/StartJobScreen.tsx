import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { Screen } from '../../components/common/Screen';
import { Text } from '../../components/common/Text';
import { PlateChip } from '../../components/garage/PlateChip';
import type { GarageStackParamList } from '../../navigation/types';
import { useGarageStore } from '../../store/garageStore';
import { colors, layout, spacing } from '../../theme';
import { carSubtitle, carTitle } from '../../utils/carInfo';
import {
  formatMileage,
  formatShortDate,
  parseMileage,
} from '../../utils/vehicleDetails';

type Props = NativeStackScreenProps<GarageStackParamList, 'StartJob'>;

/** A car comes in: name the job, read the odometer, note what's wrong. */
export function StartJobScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const insets = useSafeAreaInsets();
  const vehicle = useGarageStore(s => s.vehicles.find(v => v.id === vehicleId));
  const units = useGarageStore(s => s.settings.units);
  const startJob = useGarageStore(s => s.startJob);
  const [title, setTitle] = useState('');
  const [mileage, setMileage] = useState('');
  const [said, setSaid] = useState('');
  const [mileageError, setMileageError] = useState('');

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

  const unit = units === 'imperial' ? 'mi' : 'km';
  const lastReading =
    vehicle.mileage != null
      ? `Last time: ${formatMileage(vehicle.mileage, units)}${
          vehicle.mileageUpdatedAt
            ? ` on ${formatShortDate(vehicle.mileageUpdatedAt)}`
            : ''
        }`
      : 'Optional';

  const start = () => {
    let mileageIn: number | undefined;
    if (mileage.trim()) {
      const km = parseMileage(mileage, units);
      if (km == null) {
        setMileageError('Enter the reading as a number, like 84 320.');
        return;
      }
      mileageIn = km;
    }
    startJob({ vehicleId, title, mileageIn, customerNote: said });
    navigation.replace('CarDashboard', { vehicleId });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.car}>
          <Text variant="subtitle" weight="semibold">
            {carTitle(vehicle)}
          </Text>
          <View style={styles.carLine}>
            <Text tone="muted" style={styles.shrink} numberOfLines={1}>
              {carSubtitle(vehicle)}
            </Text>
            {vehicle.plate ? <PlateChip plate={vehicle.plate} /> : null}
          </View>
        </View>

        <Input
          appearance="outlined"
          size="lg"
          label="What’s the job?"
          helper="Optional, e.g. Service and front brakes"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          returnKeyType="next"
        />
        <Input
          appearance="outlined"
          size="lg"
          label="Mileage today"
          helper={mileageError ? undefined : lastReading}
          error={mileageError || undefined}
          value={mileage}
          onChangeText={text => {
            setMileage(text);
            setMileageError('');
          }}
          keyboardType="number-pad"
          rightSection={<Text tone="muted">{unit}</Text>}
        />
        <Input
          appearance="outlined"
          size="lg"
          label="What the customer said"
          helper="Optional. Saved as a customer note on this job."
          value={said}
          onChangeText={setSaid}
          multiline
          maxLength={5000}
        />
      </ScrollView>
      <View
        style={[styles.footer, { paddingBottom: spacing.lg + insets.bottom }]}
      >
        <Button label="Start job" size="lg" onPress={start} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  car: { gap: 4 },
  carLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  shrink: { flexShrink: 1 },
  footer: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.bg,
  },
});
