// Aqarati Mobile — Theme system
import { colors as sharedColors, spacing as sharedSpacing, radius as sharedRadius, typography as sharedTypography } from '../../../shared/theme';
import type { ThemeMode } from '../types';

export const colors = sharedColors;
export const spacing = sharedSpacing;
export const radius = sharedRadius;
export const typography = sharedTypography;

export interface Theme {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  muted: string;
  elevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  tabBar: string;
  tabBarBorder: string;
  statusBar: 'light-content' | 'dark-content';
}

export const darkTheme: Theme = {
  mode: 'dark',
  bg: colors.dark.bg,
  surface: colors.dark.surface,
  surfaceHover: colors.dark.surfaceHover,
  border: colors.dark.border,
  muted: colors.dark.muted,
  elevated: colors.dark.elevated,
  text: colors.text.dark.primary,
  textSecondary: colors.text.dark.secondary,
  textMuted: colors.text.dark.muted,
  textInverse: colors.text.dark.inverse,
  accent: colors.primary[500],
  accentHover: colors.primary[400],
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  tabBar: '#0a1e17',
  tabBarBorder: '#1a2a23',
  statusBar: 'light-content',
};

export const lightTheme: Theme = {
  mode: 'light',
  bg: colors.light.bg,
  surface: colors.light.surface,
  surfaceHover: colors.light.surfaceHover,
  border: colors.light.border,
  muted: colors.light.muted,
  elevated: colors.light.elevated,
  text: colors.text.light.primary,
  textSecondary: colors.text.light.secondary,
  textMuted: colors.text.light.muted,
  textInverse: colors.text.light.inverse,
  accent: colors.primary[600],
  accentHover: colors.primary[500],
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  tabBar: '#ffffff',
  tabBarBorder: '#e2e8f0',
  statusBar: 'dark-content',
};

export function getTheme(mode: ThemeMode): Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
