/**
 * Design Token System for OAuth Authz V2 UI
 * Comprehensive color, typography, and spacing scale
 * Supports light and dark mode via CSS variables
 */

export const tokens = {
  colors: {
    light: {
      bgPrimary: '#f5f3ff',
      bgSecondary: '#ffffff',
      bgTertiary: '#ede9fe',
      bgDark: '#0f172a',
      textPrimary: '#1d2e3f',
      textSecondary: '#64748b',
      textTertiary: '#9ca3af',
      textLight: '#e2e8f0',
      borderColor: '#e9d5ff',
      borderDark: '#334155',
      accent: '#1d4ed8',
      accentLight: '#fbbf24',
      accentSuccess: '#059669',
      accentError: '#dc2626',
      accentWarning: '#f59e0b',
      codeBg: '#0f172a',
      codeText: '#06b6d4',
    },
    dark: {
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      bgDark: '#0a0f1f',
      textPrimary: '#e2e8f0',
      textSecondary: '#cbd5e1',
      textTertiary: '#94a3b8',
      textLight: '#f1f5f9',
      borderColor: '#334155',
      borderDark: '#475569',
      accent: '#60a5fa',
      accentLight: '#fbbf24',
      accentSuccess: '#34d399',
      accentError: '#f87171',
      accentWarning: '#fbbf24',
      codeBg: '#0a0f1f',
      codeText: '#06b6d4',
    },
  },

  typography: {
    fontFamily: {
      primary: "'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'Fira Code', monospace",
      monoCourier: "'Courier Prime', monospace",
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  },

  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },
} as const;

export type Theme = 'light' | 'dark';