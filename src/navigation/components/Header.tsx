import React from 'react';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { AppHeader } from './AppHeader';

type HeaderProps = BottomTabHeaderProps;

/** Tab screens get one large page title; their main action is a floating button. */
export default function Header({ route, options }: HeaderProps) {
  return <AppHeader title={options.title ?? route.name} large />;
}
