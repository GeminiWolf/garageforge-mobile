import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Car, Settings as SettingsIcon, Wallet } from 'lucide-react-native';

import type { GarageStackParamList, RootTabParamList } from './types';
import {
  AboutScreen,
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
import { AddPartHeaderRight } from './components/AddPartHeaderRight';
import { AddPartTitle } from './components/AddPartTitle';
import { PartHeaderTitle } from './components/PartHeaderTitle';
import { VehicleHeaderTitle } from './components/VehicleHeaderTitle';

const Tab = createBottomTabNavigator<RootTabParamList>();
const GarageStack = createNativeStackNavigator<GarageStackParamList>();

function vehicleHeaderOptions(
  navigation: NativeStackNavigationProp<GarageStackParamList>,
  vehicleId: string,
) {
  return {
    headerTitle: () => <VehicleHeaderTitle vehicleId={vehicleId} />,
    headerRight: () => (
      <AddPartHeaderRight navigation={navigation} vehicleId={vehicleId} />
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

function GarageTabIcon({ color, size }: TabIconProps) {
  return <Car color={color} size={size} />;
}

function BudgetTabIcon({ color, size }: TabIconProps) {
  return <Wallet color={color} size={size} />;
}

function SettingsTabIcon({ color, size }: TabIconProps) {
  return <SettingsIcon color={color} size={size} />;
}

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
  return (
    <Tab.Navigator
      screenOptions={{
        header: renderTabHeader,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
          fontSize: 11,
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
          name="Licenses"
          component={LicensesScreen}
          options={{ title: 'Licenses' }}
        />
        <GarageStack.Screen
          name="ApiConnection"
          component={ApiConnectionScreen}
          options={{ title: 'Catalogue connection' }}
        />
      </GarageStack.Navigator>
    </NavigationContainer>
  );
}
