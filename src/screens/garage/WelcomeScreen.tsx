import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck } from 'lucide-react-native';

import { Button } from '../../components/common/Button';
import { Text } from '../../components/common/Text';
import { colors, layout, spacing } from '../../theme';
import { markWelcomeSeen } from '../../utils/onboarding';

const POINTS = [
  {
    title: 'Add the car you’re working on',
    body: 'Pick it from the catalogue or type it in yourself.',
  },
  {
    title: 'List the parts it needs',
    body: 'Mark what’s urgent, track what’s ordered, tick off what’s fitted.',
  },
  {
    title: 'Keep spending in check',
    body: 'Set a monthly budget and see what’s left at a glance.',
  },
];

/** First-launch introduction. Shown once, before the first car is added. */
export default function WelcomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const finish = (next: 'AddVehicle' | 'Account' | null) => {
    markWelcomeSeen().catch(() => undefined);
    navigation.goBack();
    if (next) {
      navigation.navigate(next);
    }
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="hero">Welcome to Garage Forge</Text>
        <Text tone="muted" style={styles.lede}>
          A simple way to plan the parts and costs for the cars you’re working
          on.
        </Text>
        <View style={styles.points}>
          {POINTS.map(point => (
            <View key={point.title} style={styles.point}>
              <CircleCheck size={22} color={colors.accent} />
              <View style={styles.pointText}>
                <Text weight="semibold">{point.title}</Text>
                <Text tone="muted">{point.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Button
          label="Get started"
          testID="welcome-start"
          onPress={() => finish('AddVehicle')}
        />
        <Button
          label="I already have an account"
          variant="ghost"
          onPress={() => finish('Account')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: layout.gutter,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  lede: {
    marginTop: -spacing.sm,
  },
  points: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  point: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  pointText: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
});
