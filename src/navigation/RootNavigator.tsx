import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Car, Settings as SettingsIcon, Wallet } from 'lucide-react-native';

import type { GarageStackParamList, RootTabParamList } from './types';
import {
  AboutScreen,
  AccountScreen,
  WelcomeScreen,
  AddPartScreen,
  AddVehicleScreen,
  ApiConnectionScreen,
  BudgetScreen,
  CarDashboardScreen,
  ExportScreen,
  GarageHomeScreen,
  LicensesScreen,
  PartDetailScreen,
  SettingsScreen,
} from '../screens';
import { colors, fontFamily } from '../theme';
import Header from './components/Header';
import { StackHeader } from './components/AppHeader';
import { AddPartTitle } from './components/AddPartTitle';
import { PartHeaderTitle } from './components/PartHeaderTitle';
import { VehicleHeaderTitle } from './components/VehicleHeaderTitle';
import { VehicleOptionsHeaderRight } from './components/VehicleOptionsHeaderRight';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAutoSync } from '../hooks/useAutoSync';

const Tab = createBottomTabNavigator<RootTabParamList>();
const GarageStack = createNativeStackNavigator<GarageStackParamList>();

function vehicleHeaderOptions(
  navigation: NativeStackNavigationProp<GarageStackParamList>,
  vehicleId: string,
) {
  return {
    headerTitle: () => <VehicleHeaderTitle vehicleId={vehicleId} />,
    headerRight: () => (
      <VehicleOptionsHeaderRight
        navigation={navigation}
        vehicleId={vehicleId}
      />
    ),
  };
}

function addPartHeaderOptions(vehicleId: string) {
  return {
    headerTitle: () => <AddPartTitle vehicleId={vehicleId} />,
  };
}

function partDetailHeaderOptions(partId: string) {
  return {
    headerTitle: () => <PartHeaderTitle partId={partId} />,
  };
}

const renderTabHeader = (props: React.ComponentProps<typeof Header>) => (
  <Header {...props} />
);

type TabIconProps = { color: string; size: number; focused?: boolean };

/** Android-style tab icon: the active tab sits in a soft green pill. */
function TabIcon({
  Icon,
  focused,
  color,
}: TabIconProps & { Icon: typeof Car }) {
  return (
    <View style={[tabStyles.pill, focused && tabStyles.pillActive]}>
      <Icon color={focused ? colors.accent : color} size={22} />
    </View>
  );
}

function GarageTabIcon(props: TabIconProps) {
  return <TabIcon {...props} Icon={Car} />;
}

function BudgetTabIcon(props: TabIconProps) {
  return <TabIcon {...props} Icon={Wallet} />;
}

function SettingsTabIcon(props: TabIconProps) {
  return <TabIcon {...props} Icon={SettingsIcon} />;
}

const tabStyles = StyleSheet.create({
  pill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: colors.accentContainer },
});

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.borderSubtle,
    primary: colors.accent,
  },
};

function MainTabs() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        header: renderTabHeader,
        tabBarStyle: {
          backgroundColor: colors.surfaceSunken,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 72 + bottom,
          paddingTop: 10,
          paddingBottom: bottom + 8,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fontFamily.semibold,
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="GarageTab"
        component={GarageHomeScreen}
        options={{
          title: 'Garage',
          tabBarIcon: GarageTabIcon,
        }}
      />
      <Tab.Screen
        name="BudgetTab"
        component={BudgetScreen}
        options={{
          title: 'Budget',
          tabBarIcon: BudgetTabIcon,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: SettingsTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  useAutoSync();
  return (
    <NavigationContainer theme={navTheme}>
      <GarageStack.Navigator
        screenOptions={{
          header: StackHeader,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <GarageStack.Screen
          name="GarageHome"
          component={MainTabs}
          options={{ title: 'Garage', headerShown: false }}
        />
        <GarageStack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        <GarageStack.Screen
          name="AddVehicle"
          component={AddVehicleScreen}
          options={{
            title: 'Add vehicle',
          }}
        />
        <GarageStack.Screen
          name="CarDashboard"
          component={CarDashboardScreen}
          options={({ navigation, route }) =>
            vehicleHeaderOptions(navigation, route.params.vehicleId)
          }
        />
        <GarageStack.Screen
          name="AddPart"
          component={AddPartScreen}
          options={({ route }) => addPartHeaderOptions(route.params.vehicleId)}
        />
        <GarageStack.Screen
          name="PartDetail"
          component={PartDetailScreen}
          options={({ route }) => partDetailHeaderOptions(route.params.partId)}
        />
        <GarageStack.Screen
          name="Export"
          component={ExportScreen}
          options={{ title: 'Export' }}
        />
        <GarageStack.Screen
          name="About"
          component={AboutScreen}
          options={{ title: 'About' }}
        />
        <GarageStack.Screen
          name="Account"
          component={AccountScreen}
          options={{ title: 'Account' }}
        />
        <GarageStack.Screen
          name="Licenses"
          component={LicensesScreen}
          options={{ title: 'Licenses' }}
        />
        {__DEV__ ? (
          <GarageStack.Screen
            name="ApiConnection"
            component={ApiConnectionScreen}
            options={{ title: 'Catalogue connection' }}
          />
        ) : null}
      </GarageStack.Navigator>
    </NavigationContainer>
  );
}
