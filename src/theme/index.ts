import { Platform, StyleSheet, TextStyle } from 'react-native';

export const colors = {
  bg: '#121417',
  surface: '#121417',
  surfaceRaised: '#1A1E22',
  border: '#2C3236',
  borderSubtle: '#24292D',
  text: '#E7E4DC',
  textMuted: '#9BA097',
  /** Faintest text; still at least 4.5:1 on surfaces. */
  textDim: '#858B83',
  accent: '#8FB089',
  accentDim: '#6F8C6A',
  accentSoft: '#1B231C',
  /** Selected chips, active tab pill, secondary filled buttons. */
  accentContainer: '#263026',
  /** Icon tiles and catalogue tags. */
  accentTint: '#1F2A20',
  onAccentContainer: '#CFE3CA',
  /** Inner tiles inside a panel. */
  surfaceSunken: '#16191C',
  borderStrong: '#3A423D',
  dangerSoft: 'rgba(212, 106, 106, 0.14)',
  dangerText: '#E8A3A3',
  warningSoft: 'rgba(212, 176, 106, 0.14)',
  warningText: '#E2C68C',
  infoSoft: 'rgba(120, 160, 210, 0.16)',
  infoText: '#A9C4E6',
  neutralSoft: '#24292D',
  neutralText: '#C9C6BE',
  track: '#2A3035',
  danger: '#D46A6A',
  warning: '#D4B06A',
  info: '#8F948C',
  white: '#E7E4DC',
  black: '#0B0D0F',
  overlay: 'rgba(10, 12, 14, 0.72)',
  chipBg: 'transparent',
  chipActive: 'transparent',
  urgent: '#D46A6A',
  soon: '#8F948C',
  someday: '#6D736C',
  needed: '#8F948C',
  sourcing: '#8F948C',
  ordered: '#D4B06A',
  installed: '#6D736C',
  graySoft: '#8F948C',
  slate200: '#E7E4DC',
  slate300: '#C4C7C0',
  slate400: '#8F948C',
  slate500: '#6D736C',
  slate600: '#2C3236',
  slate700: '#24292D',
  slate800: '#1A1E22',
  slate900: '#121417',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 40,
};

/** Controls 12, buttons and inputs 12–16, panels 20, pills fully round. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const layout = {
  gutter: 20,
  rowMinHeight: 64,
  /** Space under scroll content so the floating action button never covers it. */
  fabClearance: 96,
  hairline: StyleSheet.hairlineWidth,
};

export const fontFamily = {
  regular: 'Outfit-Regular',
  medium: 'Outfit-Medium',
  semibold: 'Outfit-SemiBold',
  bold: 'Outfit-Bold',
};

export const typography = {
  hero: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    letterSpacing: -0.8,
    lineHeight: 36,
  } as TextStyle,
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 26,
  } as TextStyle,
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    letterSpacing: -0.2,
    lineHeight: 22,
  } as TextStyle,
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  } as TextStyle,
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    letterSpacing: 0.2,
    lineHeight: 16,
  } as TextStyle,
  mono: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontVariant: ['tabular-nums'],
  } as TextStyle,
};

export const tabularNums: TextStyle = {
  fontVariant: ['tabular-nums'],
};

export const shadows = {
  soft: Platform.select({
    ios: {
      shadowColor: colors.bg,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
  }),
};

export const theme = {
  colors,
  spacing,
  radius,
  layout,
  fontFamily,
  typography,
  shadows,
};
