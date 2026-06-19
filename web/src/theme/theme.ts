// Aqarati Design System — inspired by chic-salmiakki-7c2612.netlify.app
// Dark theme as default with full light mode support
// Exports TS tokens AND generateCSSVariables() for runtime use

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

// ─── CSS Variable Generation ─────────────────────────────
// Generates a CSS string with all design tokens as custom properties
// Can be injected into <style> or written to a CSS file

export function generateCSSVariables(theme: 'dark' | 'light'): string {
  const t = theme;
  const c = colors;

  return `
:root[data-theme="${t}"] {
  /* Background */
  --aq-bg: ${t === 'dark' ? c.dark.bg : c.light.bg};
  --aq-bg-secondary: ${t === 'dark' ? c.dark.muted : c.light.muted};
  --aq-surface: ${t === 'dark' ? c.dark.surface : c.light.surface};
  --aq-surface-glass: ${t === 'dark' ? 'rgba(20, 31, 26, 0.4)' : 'rgba(255, 255, 255, 0.8)'};
  --aq-surface-hover: ${t === 'dark' ? c.dark.surfaceHover : c.light.surfaceHover};
  --aq-surface-elevated: ${t === 'dark' ? c.dark.elevated : c.light.elevated};

  /* Borders */
  --aq-border: ${t === 'dark' ? c.dark.border : c.light.border};
  --aq-border-subtle: ${t === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'};
  --aq-border-focus: ${c.primary[400]}80;

  /* Text */
  --aq-text-primary: ${c.text[t].primary};
  --aq-text-secondary: ${c.text[t].secondary};
  --aq-text-muted: ${c.text[t].muted};
  --aq-text-inverse: ${c.text[t].inverse};

  /* Brand */
  --aq-brand: ${c.primary[500]};
  --aq-brand-hover: ${c.primary[600]};
  --aq-brand-muted: ${c.primary[500]}20;
  --aq-brand-border: ${c.primary[500]}30;

  /* Semantic */
  --aq-success: ${c.success};
  --aq-success-muted: ${c.success}15;
  --aq-success-border: ${c.success}30;
  --aq-warning: ${c.warning};
  --aq-warning-muted: ${c.warning}15;
  --aq-warning-border: ${c.warning}30;
  --aq-danger: ${c.error};
  --aq-danger-muted: ${c.error}20;
  --aq-danger-border: ${c.error}30;
  --aq-info: ${c.info};
  --aq-info-muted: ${c.info}15;
  --aq-info-border: ${c.info}30;

  /* Buttons */
  --aq-btn-primary-bg: ${c.primary[500]};
  --aq-btn-primary-text: #ffffff;
  --aq-btn-primary-hover: ${c.primary[600]};
  --aq-btn-secondary-bg: ${t === 'dark' ? c.dark.surface : c.light.muted};
  --aq-btn-secondary-text: ${c.text[t].primary};
  --aq-btn-secondary-border: ${t === 'dark' ? c.dark.border : c.light.border};
  --aq-btn-danger-bg: ${c.error}20;
  --aq-btn-danger-text: ${c.error};

  /* Inputs */
  --aq-input-bg: ${t === 'dark' ? c.dark.muted : c.light.bg};
  --aq-input-border: ${t === 'dark' ? c.dark.border : c.light.border};
  --aq-input-text: ${c.text[t].primary};
  --aq-input-placeholder: ${c.text[t].muted};

  /* Sidebar */
  --aq-sidebar-bg: ${t === 'dark' ? c.dark.muted : c.light.surface};
  --aq-sidebar-border: ${t === 'dark' ? c.dark.border : c.light.border};
  --aq-sidebar-text: ${c.text[t].secondary};
  --aq-sidebar-active-bg: ${c.primary[500]}15;
  --aq-sidebar-active-text: ${c.primary[400]};

  /* Topbar */
  --aq-topbar-bg: ${t === 'dark' ? 'rgba(2,9,7,0.8)' : 'rgba(255,255,255,0.8)'};
  --aq-topbar-border: ${t === 'dark' ? c.dark.border : c.light.border};

  /* Shadows */
  --aq-shadow-sm: ${t === 'dark' ? shadows.sm : '0 1px 2px rgba(0,0,0,0.05)'};
  --aq-shadow-md: ${t === 'dark' ? shadows.md : '0 4px 6px rgba(0,0,0,0.06)'};
  --aq-shadow-lg: ${t === 'dark' ? shadows.lg : '0 10px 15px rgba(0,0,0,0.08)'};
  --aq-shadow-glow: ${shadows.glow};

  /* Radius */
  --aq-radius-sm: ${radius.sm}px;
  --aq-radius-md: ${radius.md}px;
  --aq-radius-lg: ${radius.lg}px;
  --aq-radius-xl: ${radius.xl}px;
  --aq-radius-full: ${radius.full}px;

  /* Spacing */
  --aq-space-xs: ${spacing.xs}px;
  --aq-space-sm: ${spacing.sm}px;
  --aq-space-md: ${spacing.md}px;
  --aq-space-lg: ${spacing.lg}px;
  --aq-space-xl: ${spacing.xl}px;
  --aq-space-2xl: ${spacing['2xl']}px;

  /* Typography */
  --aq-font-arabic: ${typography.fontFamily.arabic};
  --aq-font-latin: ${typography.fontFamily.latin};
  --aq-font-mono: ${typography.fontFamily.mono};
  --aq-text-xs: ${typography.fontSize.xs}px;
  --aq-text-sm: ${typography.fontSize.sm}px;
  --aq-text-base: ${typography.fontSize.base}px;
  --aq-text-lg: ${typography.fontSize.lg}px;
  --aq-text-xl: ${typography.fontSize.xl}px;
  --aq-text-2xl: ${typography.fontSize['2xl']}px;

  /* Transitions */
  --aq-transition-fast: 150ms ease;
  --aq-transition-normal: 250ms ease;

  /* Skeleton/Loading */
  --aq-skeleton-bg: ${t === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'};
  --aq-skeleton-shine: ${t === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
}
`.trim();
}

// ─── Helper: inject CSS variables into document ──────────

export function injectThemeVariables(theme: 'dark' | 'light'): void {
  const id = 'aq-theme-vars';
  let style = document.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    document.head.appendChild(style);
  }
  style.textContent = generateCSSVariables(theme);
}
