import { Platform, TextStyle } from 'react-native';

export const colors = {
  bg: '#1A1A2E',
  surface: '#232332',
  surfaceRaised: '#2E2E40',
  border: '#3A3A4A',
  borderSubtle: '#2E2E40',
  text: '#F5F5F0',
  textMuted: '#B5ACA0',
  textDim: '#A89F94',
  accent: '#EC7E32',
  accentDim: '#C8681F',
  accentSoft: '#3A2418',
  danger: '#E87A6B',
  warning: '#E8A857',
  info: '#7BA8C0',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(26, 26, 46, 0.75)',
  chipBg: '#2A2A3A',
  chipActive: '#3A2418',
  urgent: '#E87A6B',
  soon: '#E8A857',
  someday: '#A89F94',
  needed: '#7BA8C0',
  sourcing: '#A895B8',
  ordered: '#D8B870',
  installed: '#7BA87F',
  graySoft: '#A89F94',
  slate200: '#E5E0DA',
  slate300: '#C8BEB2',
  slate400: '#B5ACA0',
  slate500: '#A89F94',
  slate600: '#2E2E40',
  slate700: '#3A3A4A',
  slate800: '#282838',
  slate900: '#232332',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const fontFamily = {
  regular: 'Outfit-Regular',
  medium: 'Outfit-Medium',
  semibold: 'Outfit-SemiBold',
  bold: 'Outfit-Bold',
};

export const typography = {
  hero: { fontFamily: fontFamily.bold, fontSize: 30, letterSpacing: -0.6 } as TextStyle,
  title: { fontFamily: fontFamily.bold, fontSize: 20, letterSpacing: -0.3 } as TextStyle,
  subtitle: { fontFamily: fontFamily.semibold, fontSize: 15 } as TextStyle,
  body: { fontFamily: fontFamily.regular, fontSize: 14 } as TextStyle,
  caption: { fontFamily: fontFamily.medium, fontSize: 12 } as TextStyle,
  label: { fontFamily: fontFamily.bold, fontSize: 11, letterSpacing: 0.6 } as TextStyle,
  mono: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  } as TextStyle,
};

export const shadows = {
  soft: Platform.select({
    ios: {
      shadowColor: colors.bg,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
  }),
};

export const theme = { colors, spacing, radius, fontFamily, typography, shadows };
