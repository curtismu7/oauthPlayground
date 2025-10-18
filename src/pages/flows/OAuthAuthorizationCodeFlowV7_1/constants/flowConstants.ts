// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/constants/flowConstants.ts
// V7.1 Flow Constants - Extracted from OAuthAuthorizationCodeFlowV7_1.tsx

export const FLOW_CONSTANTS = {
  // Timing constants
  ADVANCED_PARAMS_SAVE_DURATION: 3000,
  MODAL_AUTO_CLOSE_DELAY: 5000,
  TOKEN_INTROSPECTION_DELAY: 500,
  COPY_FEEDBACK_DURATION: 1000,
  
  // PKCE constants
  PKCE_CODE_VERIFIER_LENGTH: 43,
  PKCE_CODE_VERIFIER_MAX_LENGTH: 128,
  PKCE_CHALLENGE_METHOD: 'S256',
  
  // Default values
  DEFAULT_REDIRECT_URI: 'https://localhost:3000/authz-callback',
  DEFAULT_SCOPE: 'openid',
  DEFAULT_RESPONSE_TYPE: 'code id_token',
  DEFAULT_PROFILE_SCOPE: 'openid profile',
  
  // Storage keys
  STORAGE_KEYS: {
    CURRENT_STEP: 'oauth-authorization-code-v7-current-step',
    APP_CONFIG: 'oauth-authorization-code-v7-app-config',
    PKCE_CODES: 'oauth-authorization-code-v7-pkce-codes',
    AUTH_CODE: 'oauth_auth_code',
    FLOW_SOURCE: 'flow_source',
  },
  
  // Flow configuration
  TOTAL_STEPS: 8,
  DEFAULT_FLOW_VARIANT: 'oidc' as const,
  FLOW_KEY: 'oauth-authorization-code-v7',
  FALLBACK_FLOW_ID: 'oauth-authz-v7',
  
  // UI constants
  UI: {
    STEP_HEADER_HEIGHT: 72,
    COLLAPSIBLE_ANIMATION_DURATION: 200,
    BUTTON_HOVER_SCALE: 1.1,
    CONTAINER_MAX_WIDTH: '64rem',
    CONTAINER_PADDING: '0 1rem',
    MAIN_CARD_BORDER_RADIUS: '1rem',
    SECTION_BORDER_RADIUS: '0.75rem',
    BADGE_BORDER_RADIUS: '9999px',
    BUTTON_BORDER_RADIUS: '0.5rem',
  },
  
  // Color constants
  COLORS: {
    // OIDC colors
    OIDC_PRIMARY: '#3b82f6',
    OIDC_SECONDARY: '#1d4ed8',
    OIDC_GRADIENT_START: '#3b82f6',
    OIDC_GRADIENT_END: '#1d4ed8',
    OIDC_BORDER: '#60a5fa',
    OIDC_BACKGROUND: 'rgba(59, 130, 246, 0.2)',
    
    // OAuth colors
    OAUTH_PRIMARY: '#16a34a',
    OAUTH_SECONDARY: '#15803d',
    OAUTH_GRADIENT_START: '#16a34a',
    OAUTH_GRADIENT_END: '#15803d',
    OAUTH_BORDER: '#4ade80',
    OAUTH_BACKGROUND: 'rgba(22, 163, 74, 0.2)',
    
    // Common colors
    SUCCESS: '#10b981',
    SUCCESS_GRADIENT_START: '#10b981',
    SUCCESS_GRADIENT_END: '#059669',
    WARNING: '#f59e0b',
    WARNING_GRADIENT_START: '#fef3c7',
    WARNING_GRADIENT_END: '#fde68a',
    ERROR: '#ef4444',
    ERROR_GRADIENT_START: '#f87171',
    ERROR_GRADIENT_END: '#ef4444',
    
    // Neutral colors
    WHITE: '#ffffff',
    GRAY_50: '#f9fafb',
    GRAY_100: '#f3f4f6',
    GRAY_200: '#e5e7eb',
    GRAY_300: '#d1d5db',
    GRAY_400: '#9ca3af',
    GRAY_500: '#6b7280',
    GRAY_600: '#4b5563',
    GRAY_700: '#374151',
    GRAY_800: '#1f2937',
    GRAY_900: '#111827',
    
    // Border colors
    BORDER_LIGHT: '#e2e8f0',
    BORDER_MEDIUM: '#cbd5e1',
    BORDER_DARK: '#94a3b8',
    
    // Background colors
    BACKGROUND_LIGHT: '#f8fafc',
    BACKGROUND_MEDIUM: '#f1f5f9',
    BACKGROUND_DARK: '#e2e8f0',
  },
  
  // Typography constants
  TYPOGRAPHY: {
    FONT_SIZES: {
      XS: '0.75rem',
      SM: '0.875rem',
      BASE: '1rem',
      LG: '1.125rem',
      XL: '1.25rem',
      '2XL': '1.5rem',
      '3XL': '1.875rem',
      '4XL': '2.25rem',
    },
    FONT_WEIGHTS: {
      NORMAL: '400',
      MEDIUM: '500',
      SEMIBOLD: '600',
      BOLD: '700',
    },
    LETTER_SPACING: {
      TIGHT: '0.05em',
      NORMAL: '0.08em',
    },
    LINE_HEIGHTS: {
      TIGHT: '1.25',
      NORMAL: '1.35',
      RELAXED: '1.5',
    },
  },
  
  // Spacing constants
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '0.75rem',
    LG: '1rem',
    XL: '1.25rem',
    '2XL': '1.5rem',
    '3XL': '1.75rem',
    '4XL': '2rem',
    '5XL': '2.5rem',
    '6XL': '3rem',
  },
  
  // Shadow constants
  SHADOWS: {
    SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    CARD: '0 20px 40px rgba(15, 23, 42, 0.1)',
    BUTTON: '0 4px 12px rgba(16, 185, 129, 0.3)',
    BUTTON_HOVER: '0 6px 16px rgba(16, 185, 129, 0.4)',
  },
  
  // Animation constants
  ANIMATIONS: {
    DURATION_FAST: '150ms',
    DURATION_NORMAL: '200ms',
    DURATION_SLOW: '300ms',
    EASING_EASE: 'ease',
    EASING_EASE_IN: 'ease-in',
    EASING_EASE_OUT: 'ease-out',
    EASING_EASE_IN_OUT: 'ease-in-out',
  },
  
  // Breakpoint constants
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
  
  // Grid constants
  GRID: {
    AUTO_FIT_MIN: '280px',
    GAP_SM: '0.5rem',
    GAP_MD: '1rem',
    GAP_LG: '1.5rem',
  },
  
  // Z-index constants
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
  },
} as const;

// Type definitions for better TypeScript support
export type FlowVariant = typeof FLOW_CONSTANTS.DEFAULT_FLOW_VARIANT;
export type StorageKey = keyof typeof FLOW_CONSTANTS.STORAGE_KEYS;
export type ColorKey = keyof typeof FLOW_CONSTANTS.COLORS;
export type FontSize = keyof typeof FLOW_CONSTANTS.TYPOGRAPHY.FONT_SIZES;
export type FontWeight = keyof typeof FLOW_CONSTANTS.TYPOGRAPHY.FONT_WEIGHTS;
export type Spacing = keyof typeof FLOW_CONSTANTS.SPACING;
export type Shadow = keyof typeof FLOW_CONSTANTS.SHADOWS;
export type AnimationDuration = keyof typeof FLOW_CONSTANTS.ANIMATIONS;
export type Breakpoint = keyof typeof FLOW_CONSTANTS.BREAKPOINTS;
export type ZIndex = keyof typeof FLOW_CONSTANTS.Z_INDEX;
