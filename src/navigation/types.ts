import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  GarageTab: undefined;
  BudgetTab: undefined;
  SettingsTab: undefined;
};

export type GarageStackParamList = {
  GarageHome: NavigatorScreenParams<RootTabParamList> | undefined;
  AddVehicle: undefined;
  CarDashboard: { vehicleId: string };
  AddPart: { vehicleId: string };
  PartDetail: { partId: string };
  Export: undefined;
  About: undefined;
  Licenses: undefined;
  Account: undefined;
  Welcome: undefined;
  ApiConnection: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends GarageStackParamList {}
  }
}
