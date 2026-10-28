import { View, StyleSheet } from 'react-native';
import React from 'react';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/common/Text';
import { colors, spacing } from '../../theme';
import { Badge } from '@react-navigation/elements';
import { Button } from '../../components/common/Button';
import { PlusIcon } from 'lucide-react-native';

type HeaderProps = BottomTabHeaderProps;

export default function Header({ route, navigation, options }: HeaderProps) {
  const { top } = useSafeAreaInsets();

  const addVehicle = () => {
    navigation.getParent()?.navigate('AddVehicle');
  };

  const addVehicleButton = () => {
    if (route.name === 'GarageTab') {
      return (
        <Button
          label="Add Vehicle"
          onPress={addVehicle}
          radius="full"
          leftIcon={<PlusIcon size={16} color={colors.bg} />}
          size="sm"
        />
      );
    }

    return null;
  };

  const renderTitle = () => {
    if (route.name === 'GarageTab') {
      return (
        <>
          <Text size="2xl" weight="bold">
            GARAGE
          </Text>
          <Text size="2xl" weight="bold" tone="accent">
            FORGE
          </Text>
        </>
      );
    }

    const title = options.title || route.name;
    return (
      <Text size="2xl" weight="bold" tone="accent">
        {title}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={[styles.row, { gap: spacing.sm }]}>
        <View style={styles.titleContainer}>
          {renderTitle()}
        </View>
        <Badge visible={false} size={12} style={styles.badge}>
          PRO
        </Badge>
      </View>
      {addVehicleButton()}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderSubtle,
  },
  titleContainer: {
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.accent,
    color: colors.bg,
  },
});
