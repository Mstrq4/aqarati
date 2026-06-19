// Aqarati Design System — inspired by chic-salmiakki-7c2612.netlify.app
// Dark theme as default with full light mode support

export const colors = {
  // Primary palette
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',  // Main accent
    500: '#14b8a6',  // Primary button
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },

  // Dark theme backgrounds
  dark: {
    bg: '#020907',           // Main bg
    surface: '#141f1a',      // Cards (40% opacity equivalent)
    surfaceHover: '#1a2a23', // Hover
    border: '#1e3028',       // Borders
    muted: '#0a1a14',        // Muted sections
    elevated: '#1c2d26',     // Elevated surfaces
  },

  // Light theme backgrounds
  light: {
    bg: '#f8fafc',
    surface: '#ffffff',
    surfaceHover: '#f0fdfa',
    border: '#e2e8f0',
    muted: '#f1f5f9',
    elevated: '#ffffff',
  },

  // Text
  text: {
    dark: {
      primary: '#ffffff',
      secondary: 'rgba(255,255,255,0.7)',
      muted: 'rgba(255,255,255,0.4)',
      inverse: '#020907',
    },
    light: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
      inverse: '#ffffff',
    },
  },

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Property types
  property: {
    sale: '#14b8a6',
    rent: '#8b5cf6',
    investment: '#f59e0b',
  },

  // Status
  status: {
    draft: '#64748b',
    active: '#22c55e',
    reserved: '#f59e0b',
    sold: '#3b82f6',
    rented: '#8b5cf6',
    archived: '#94a3b8',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 6px rgba(0,0,0,0.4)',
  lg: '0 10px 15px rgba(0,0,0,0.5)',
  xl: '0 20px 25px rgba(0,0,0,0.6)',
  glow: '0 0 20px rgba(20,184,166,0.15)',
} as const;

export const typography = {
  fontFamily: {
    arabic: "'Tajawal', 'Cairo', sans-serif",
    latin: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
} as const;
