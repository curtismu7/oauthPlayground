// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/constants/uiConstants.ts
// V7.1 UI Constants - Extracted from styled components and UI logic

export const UI_CONSTANTS = {
  // Layout constants
  LAYOUT: {
    CONTAINER_MIN_HEIGHT: '100vh',
    CONTAINER_BACKGROUND: '#f9fafb',
    CONTAINER_PADDING: '2rem 0 6rem',
    CONTENT_MAX_WIDTH: '64rem',
    CONTENT_PADDING: '0 1rem',
    MAIN_CARD_BACKGROUND: '#ffffff',
    MAIN_CARD_BORDER_RADIUS: '1rem',
    MAIN_CARD_BORDER: '1px solid #e2e8f0',
    MAIN_CARD_SHADOW: '0 20px 40px rgba(15, 23, 42, 0.1)',
  },
  
  // Header constants
  HEADER: {
    PADDING: '2rem',
    BORDER_RADIUS: '0.75rem',
    FONT_WEIGHT: '600',
    VERSION_BADGE_FONT_SIZE: '0.75rem',
    VERSION_BADGE_FONT_WEIGHT: '600',
    VERSION_BADGE_LETTER_SPACING: '0.08em',
    VERSION_BADGE_PADDING: '0.25rem 0.75rem',
    VERSION_BADGE_BORDER_RADIUS: '9999px',
    TITLE_FONT_WEIGHT: '700',
    SUBTITLE_OPACITY: '0.85',
  },
  
  // Spacing constants
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '0.75rem',
    LG: '1rem',
    XL: '1.5rem',
    '2XL': '2rem',
    '3XL': '3rem',
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
    },
    FONT_WEIGHTS: {
      NORMAL: '400',
      MEDIUM: '500',
      SEMIBOLD: '600',
      BOLD: '700',
    },
    LINE_HEIGHTS: {
      TIGHT: '1.25',
      NORMAL: '1.5',
      RELAXED: '1.75',
    },
    LETTER_SPACING: {
      TIGHT: '-0.025em',
      NORMAL: '0em',
      WIDE: '0.025em',
    },
  },
  
  // Color constants
  COLORS: {
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
    BLUE_600: '#2563eb',
    GREEN_600: '#16a34a',
  },
  
  // Animation constants
  ANIMATION: {
    DURATION_FAST: '0.15s',
    DURATION_NORMAL: '0.2s',
    DURATION_SLOW: '0.3s',
    EASING_EASE: 'ease',
    EASING_EASE_IN_OUT: 'ease-in-out',
    TRANSFORM_SCALE_HOVER: 'scale(1.05)',
    TRANSFORM_SCALE_ACTIVE: 'scale(0.95)',
  },
  
  // Variant selector constants
  VARIANT_SELECTOR: {
    BACKGROUND: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    BORDER_RADIUS: '0.75rem',
    GAP: '0.75rem',
    BUTTON_BORDER: '2px solid',
    BUTTON_BORDER_RADIUS: '0.5rem',
    BUTTON_PADDING: '1.25rem',
    BUTTON_FONT_WEIGHT_SELECTED: '600',
    BUTTON_FONT_WEIGHT_NORMAL: '500',
    TITLE_MARGIN_BOTTOM: '0.25rem',
    TITLE_FONT_SIZE: '0.875rem',
    DESCRIPTION_FONT_SIZE: '0.875rem',
    DESCRIPTION_OPACITY: '0.8',
  },
  
  // Section constants
  SECTION: {
    BACKGROUND: '#f8fafc',
    BORDER: '1px solid #e2e8f0',
    BORDER_RADIUS: '0.75rem',
    PADDING: '1.25rem 1.75rem',
    MARGIN_BOTTOM: '1.5rem',
    HEADER_FONT_WEIGHT: '600',
    HEADER_GAP: '0.75rem',
    HEADER_LINE_HEIGHT: '1.35',
    CARD_SHADOW: '0 10px 20px rgba(15, 23, 42, 0.05)',
  },
  
  // Collapsible constants
  COLLAPSIBLE: {
    ICON_SIZE: '1.25rem',
    ICON_COLOR: '#d97706',
    ICON_MARGIN_TOP: '0.125rem',
    TRANSFORM_ROTATE_COLLAPSED: '0deg',
    TRANSFORM_ROTATE_EXPANDED: '180deg',
    TRANSFORM_SCALE_HOVER: '1.1',
    TRANSITION_DURATION: '200ms',
  },
  
  // Button constants
  BUTTON: {
    PRIMARY_BACKGROUND: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    PRIMARY_COLOR: '#ffffff',
    PRIMARY_BORDER_RADIUS: '0.5rem',
    PRIMARY_PADDING: '0.75rem 1.5rem',
    PRIMARY_FONT_SIZE: '0.875rem',
    PRIMARY_FONT_WEIGHT: '600',
    PRIMARY_SHADOW: '0 4px 12px rgba(16, 185, 129, 0.3)',
    PRIMARY_HOVER_SHADOW: '0 6px 16px rgba(16, 185, 129, 0.4)',
    SECONDARY_BACKGROUND: 'transparent',
    SECONDARY_BORDER: '2px solid #e5e7eb',
    SECONDARY_COLOR: '#374151',
    SECONDARY_HOVER_BACKGROUND: '#f3f4f6',
  },
  
  // Form constants
  FORM: {
    INPUT_BORDER: '1px solid #d1d5db',
    INPUT_BORDER_RADIUS: '0.5rem',
    INPUT_PADDING: '0.75rem',
    INPUT_FONT_SIZE: '0.875rem',
    INPUT_FOCUS_BORDER: '#3b82f6',
    INPUT_ERROR_BORDER: '#ef4444',
    INPUT_SUCCESS_BORDER: '#10b981',
    LABEL_FONT_SIZE: '0.875rem',
    LABEL_FONT_WEIGHT: '500',
    LABEL_COLOR: '#374151',
    HELPER_TEXT_FONT_SIZE: '0.75rem',
    HELPER_TEXT_COLOR: '#6b7280',
  },
  
  // Modal constants
  MODAL: {
    BACKDROP_BACKGROUND: 'rgba(0, 0, 0, 0.5)',
    BACKGROUND: '#ffffff',
    BORDER_RADIUS: '0.75rem',
    PADDING: '1.5rem',
    MAX_WIDTH: '32rem',
    SHADOW: '0 10px 25px rgba(15, 23, 42, 0.08)',
    TITLE_FONT_SIZE: '1.25rem',
    TITLE_FONT_WEIGHT: '600',
    TITLE_COLOR: '#111827',
    CLOSE_BUTTON_SIZE: '1.5rem',
    CLOSE_BUTTON_COLOR: '#6b7280',
  },
  
  // Toast constants
  TOAST: {
    SUCCESS_BACKGROUND: '#10b981',
    SUCCESS_COLOR: '#ffffff',
    ERROR_BACKGROUND: '#ef4444',
    ERROR_COLOR: '#ffffff',
    WARNING_BACKGROUND: '#f59e0b',
    WARNING_COLOR: '#ffffff',
    INFO_BACKGROUND: '#3b82f6',
    INFO_COLOR: '#ffffff',
    BORDER_RADIUS: '0.5rem',
    PADDING: '0.75rem 1rem',
    FONT_SIZE: '0.875rem',
    FONT_WEIGHT: '500',
    SHADOW: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  
  // Navigation constants
  NAVIGATION: {
    STEP_BUTTON_SIZE: '2.5rem',
    STEP_BUTTON_BORDER_RADIUS: '50%',
    STEP_BUTTON_FONT_SIZE: '0.875rem',
    STEP_BUTTON_FONT_WEIGHT: '600',
    STEP_BUTTON_ACTIVE_BACKGROUND: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    STEP_BUTTON_ACTIVE_COLOR: '#ffffff',
    STEP_BUTTON_INACTIVE_BACKGROUND: 'transparent',
    STEP_BUTTON_INACTIVE_COLOR: '#6b7280',
    STEP_BUTTON_HOVER_BACKGROUND: '#e5e7eb',
    STEP_BUTTON_HOVER_COLOR: '#374151',
  },
  
  // Token display constants
  TOKEN_DISPLAY: {
    BACKGROUND: '#f8fafc',
    BORDER: '1px solid #e2e8f0',
    BORDER_RADIUS: '0.5rem',
    PADDING: '1rem',
    FONT_FAMILY: 'monospace',
    FONT_SIZE: '0.875rem',
    LINE_HEIGHT: '1.5',
    WORD_BREAK: 'break-all',
    COPY_BUTTON_SIZE: '1rem',
    COPY_BUTTON_COLOR: '#6b7280',
    COPY_BUTTON_HOVER_COLOR: '#374151',
  },
  
  // Status constants
  STATUS: {
    SUCCESS_COLOR: '#10b981',
    SUCCESS_BACKGROUND: '#ecfdf5',
    SUCCESS_BORDER: '#a7f3d0',
    ERROR_COLOR: '#ef4444',
    ERROR_BACKGROUND: '#fef2f2',
    ERROR_BORDER: '#fecaca',
    WARNING_COLOR: '#f59e0b',
    WARNING_BACKGROUND: '#fffbeb',
    WARNING_BORDER: '#fed7aa',
    INFO_COLOR: '#3b82f6',
    INFO_BACKGROUND: '#eff6ff',
    INFO_BORDER: '#bfdbfe',
  },
  
  // Animation constants
  ANIMATION: {
    DURATION_FAST: '150ms',
    DURATION_NORMAL: '200ms',
    DURATION_SLOW: '300ms',
    EASING_EASE: 'ease',
    EASING_EASE_IN: 'ease-in',
    EASING_EASE_OUT: 'ease-out',
    EASING_EASE_IN_OUT: 'ease-in-out',
    TRANSFORM_SCALE_HOVER: '1.02',
    TRANSFORM_SCALE_ACTIVE: '0.98',
  },
  
  // Responsive constants
  RESPONSIVE: {
    MOBILE_BREAKPOINT: '640px',
    TABLET_BREAKPOINT: '768px',
    DESKTOP_BREAKPOINT: '1024px',
    LARGE_DESKTOP_BREAKPOINT: '1280px',
    MOBILE_PADDING: '1rem',
    TABLET_PADDING: '1.5rem',
    DESKTOP_PADDING: '2rem',
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
    TOAST: 1080,
  },
} as const;

// Type definitions
export type LayoutKey = keyof typeof UI_CONSTANTS.LAYOUT;
export type HeaderKey = keyof typeof UI_CONSTANTS.HEADER;
export type VariantSelectorKey = keyof typeof UI_CONSTANTS.VARIANT_SELECTOR;
export type SectionKey = keyof typeof UI_CONSTANTS.SECTION;
export type CollapsibleKey = keyof typeof UI_CONSTANTS.COLLAPSIBLE;
export type ButtonKey = keyof typeof UI_CONSTANTS.BUTTON;
export type FormKey = keyof typeof UI_CONSTANTS.FORM;
export type ModalKey = keyof typeof UI_CONSTANTS.MODAL;
export type ToastKey = keyof typeof UI_CONSTANTS.TOAST;
export type NavigationKey = keyof typeof UI_CONSTANTS.NAVIGATION;
export type TokenDisplayKey = keyof typeof UI_CONSTANTS.TOKEN_DISPLAY;
export type StatusKey = keyof typeof UI_CONSTANTS.STATUS;
export type AnimationKey = keyof typeof UI_CONSTANTS.ANIMATION;
export type ResponsiveKey = keyof typeof UI_CONSTANTS.RESPONSIVE;
export type ZIndexKey = keyof typeof UI_CONSTANTS.Z_INDEX;
