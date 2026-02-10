/**
 * @file protectPortal.config.ts
 * @module protect-portal/config
 * @description Configuration for Protect Portal application
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This file contains all configuration settings for the Protect Portal
 * including risk policies, MFA settings, token configuration, and UI settings.
 */

import type { ProtectPortalConfig, RiskThresholds, MFADevice } from '../types/protectPortal.types';

// ============================================================================
// RISK POLICY CONFIGURATION
// ============================================================================

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  low: {
    maxScore: 30,
    action: 'ALLOW'
  },
  medium: {
    minScore: 31,
    maxScore: 70,
    action: 'CHALLENGE_MFA'
  },
  high: {
    minScore: 71,
    action: 'BLOCK'
  }
};

export const CUSTOM_RISK_POLICIES = {
  // Low risk: Standard business hours, known device, trusted location
  lowRisk: {
    maxScore: 30,
    factors: ['known_ip', 'business_hours', 'trusted_device'],
    action: 'ALLOW'
  },
  
  // Medium risk: New device, unusual location, off-hours
  mediumRisk: {
    minScore: 31,
    maxScore: 70,
    factors: ['new_device', 'unusual_location', 'off_hours'],
    action: 'CHALLENGE_MFA'
  },
  
  // High risk: Multiple failed attempts, suspicious patterns
  highRisk: {
    minScore: 71,
    factors: ['multiple_failures', 'suspicious_pattern', 'blacklisted_ip'],
    action: 'BLOCK'
  }
};

// ============================================================================
// MFA CONFIGURATION
// ============================================================================

export const MFA_DEVICE_TYPES = [
  'SMS',
  'EMAIL', 
  'WHATSAPP',
  'TOTP',
  'FIDO2',
  'MOBILE'
] as const;

export const MFA_CONFIG = {
  // Allowed device types for registration and authentication
  allowedDeviceTypes: ['SMS', 'EMAIL', 'TOTP', 'FIDO2'] as MFADevice['type'][],
  
  // Require device registration for new users
  requireDeviceRegistration: true,
  
  // OTP settings
  otpTimeout: 300000, // 5 minutes in milliseconds
  otpLength: 6,
  otpResendCooldown: 60000, // 1 minute
  otpMaxAttempts: 3,
  
  // FIDO2 settings
  fido2Timeout: 300000, // 5 minutes in milliseconds
  fido2UserVerification: 'required' as const,
  fido2AuthenticatorAttachment: 'platform' as const,
  
  // Device management
  maxDevicesPerUser: 10,
  deviceInactivityTimeout: 86400000, // 24 hours
};

// ============================================================================
// TOKEN CONFIGURATION
// ============================================================================

export const TOKEN_CONFIG = {
  // Display settings
  displaySensitiveData: false, // Don't show full tokens
  tokenPreviewLength: 20, // Show first 20 characters
  showTokenClaims: true, // Show parsed token claims
  
  // Token management
  autoRefresh: false, // Don't auto-refresh tokens
  refreshBufferTime: 300000, // 5 minutes before expiry
  
  // Storage settings
  useSessionStorage: true, // Use sessionStorage for tokens
  tokenEncryptionEnabled: false, // Token encryption disabled for demo
  
  // Validation settings
  validateTokens: true,
  checkTokenExpiry: true,
  validateTokenSignature: false, // Skip signature validation for demo
};

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
  // Theme settings
  theme: 'corporate' as const,
  
  // Educational content
  showEducationalContent: true,
  educationalContentPosition: 'sidebar' as const,
  
  // Animations and transitions
  enableAnimations: true,
  animationDuration: 300, // milliseconds
  
  // Loading states
  showLoadingSpinners: true,
  loadingDelay: 200, // milliseconds before showing spinner
  
  // Error handling
  showDetailedErrors: false, // Hide technical details from users
  enableErrorRecovery: true,
  
  // Accessibility
  enableKeyboardNavigation: true,
  enableScreenReaderSupport: true,
  highContrastMode: false,
  
  // Responsive design
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1440,
};

// ============================================================================
// CORPORATE PORTAL THEME
// ============================================================================

export const CORPORATE_THEME = {
  colors: {
    primary: '#1e40af',      // Blue 800
    primaryLight: '#3b82f6', // Blue 500
    primaryDark: '#1e3a8a',  // Blue 900
    
    success: '#059669',      // Emerald 600
    successLight: '#10b981', // Emerald 500
    
    warning: '#d97706',      // Amber 600
    warningLight: '#f59e0b', // Amber 500
    
    error: '#dc2626',        // Red 600
    errorLight: '#ef4444',   // Red 500
    
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    
    white: '#ffffff',
    black: '#000000',
  },
  
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    base: '0.25rem', // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
};

// ============================================================================
// EDUCATIONAL CONTENT CONFIGURATION
// ============================================================================

export const EDUCATIONAL_CONTENT = {
  riskEvaluation: {
    title: 'Risk-Based Authentication',
    description: 'We evaluate your login attempt in real-time to determine the appropriate level of security.',
    keyPoints: [
      'Analyzes login patterns, device information, and location',
      'Uses machine learning to detect suspicious activity',
      'Adapts security requirements based on risk level',
      'Protects your account while minimizing friction'
    ],
    learnMore: {
      title: 'Learn About Risk Evaluation',
      url: 'https://docs.pingidentity.com/pingone/p1_cloud__risk_evaluations.html'
    }
  },
  
  mfaAuthentication: {
    title: 'Multi-Factor Authentication',
    description: 'Add an extra layer of security to verify your identity beyond just a password.',
    keyPoints: [
      'Choose from SMS, Email, Authenticator App, or Security Key',
      'Each method provides different levels of security',
      'Register multiple devices for backup options',
      'MFA significantly reduces the risk of unauthorized access'
    ],
    learnMore: {
      title: 'Learn About MFA',
      url: 'https://docs.pingidentity.com/pingone/p1_cloud__mfa_overview.html'
    }
  },
  
  tokenDisplay: {
    title: 'OAuth & OIDC Tokens',
    description: 'Your login generates secure tokens that grant access to applications and services.',
    keyPoints: [
      'Access tokens grant permission to access resources',
      'ID tokens contain your user information',
      'Tokens are cryptographically signed for security',
      'Tokens automatically expire for enhanced security'
    ],
    learnMore: {
      title: 'Learn About OAuth Tokens',
      url: 'https://docs.pingidentity.com/pingone/p1_cloud__tokens.html'
    }
  },
};

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  // PingOne Protect API
  protectApi: {
    baseUrl: 'https://api.pingone.com',
    version: 'v1',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
  
  // PingOne OAuth API
  oauthApi: {
    baseUrl: 'https://auth.pingone.com',
    tokenEndpoint: '/oauth/token',
    authorizeEndpoint: '/oauth/authorize',
    userInfoEndpoint: '/oauth/userinfo',
    timeout: 30000,
  },
  
  // Rate limiting
  rateLimiting: {
    maxRequestsPerMinute: 60,
    maxConcurrentRequests: 5,
    enableBackoff: true,
    backoffMultiplier: 2,
  },
};

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_PROTECT_PORTAL_CONFIG: ProtectPortalConfig = {
  riskPolicies: DEFAULT_RISK_THRESHOLDS,
  mfaConfig: MFA_CONFIG,
  tokenConfig: TOKEN_CONFIG,
  uiConfig: UI_CONFIG,
};

// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATION
// ============================================================================

export const getEnvironmentConfig = (): ProtectPortalConfig => {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return {
        ...DEFAULT_PROTECT_PORTAL_CONFIG,
        riskPolicies: {
          low: { maxScore: 25, action: 'ALLOW' },
          medium: { minScore: 26, maxScore: 65, action: 'CHALLENGE_MFA' },
          high: { minScore: 66, action: 'BLOCK' }
        },
        mfaConfig: {
          ...MFA_CONFIG,
          otpTimeout: 240000, // 4 minutes in production
          fido2Timeout: 240000,
        },
        tokenConfig: {
          ...TOKEN_CONFIG,
          displaySensitiveData: false,
          tokenPreviewLength: 15,
        },
        uiConfig: {
          ...UI_CONFIG,
          showDetailedErrors: false,
          enableAnimations: false, // Reduce animations in production
        }
      };
      
    case 'development':
      return {
        ...DEFAULT_PROTECT_PORTAL_CONFIG,
        riskPolicies: {
          low: { maxScore: 40, action: 'ALLOW' },      // More permissive in dev
          medium: { minScore: 41, maxScore: 80, action: 'CHALLENGE_MFA' },
          high: { minScore: 81, action: 'BLOCK' }
        },
        mfaConfig: {
          ...MFA_CONFIG,
          otpTimeout: 600000, // 10 minutes in development
          fido2Timeout: 600000,
          otpMaxAttempts: 5, // More attempts in development
        },
        tokenConfig: {
          ...TOKEN_CONFIG,
          displaySensitiveData: true,   // Show more data for debugging
          tokenPreviewLength: 50,
        },
        uiConfig: {
          ...UI_CONFIG,
          showDetailedErrors: true,     // Show errors for debugging
          enableAnimations: true,
        }
      };
      
    default:
      return DEFAULT_PROTECT_PORTAL_CONFIG;
  }
};

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================

export const validateConfig = (config: ProtectPortalConfig): boolean => {
  try {
    // Validate risk policies
    if (config.riskPolicies.low.maxScore >= config.riskPolicies.medium.minScore) {
      throw new Error('Low risk max score must be less than medium risk min score');
    }
    
    if (config.riskPolicies.medium.maxScore >= config.riskPolicies.high.minScore) {
      throw new Error('Medium risk max score must be less than high risk min score');
    }
    
    // Validate MFA config
    if (config.mfaConfig.allowedDeviceTypes.length === 0) {
      throw new Error('At least one MFA device type must be allowed');
    }
    
    // Validate token config
    if (config.tokenConfig.tokenPreviewLength < 5 || config.tokenConfig.tokenPreviewLength > 100) {
      throw new Error('Token preview length must be between 5 and 100 characters');
    }
    
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  DEFAULT_RISK_THRESHOLDS,
  CUSTOM_RISK_POLICIES,
  MFA_CONFIG,
  TOKEN_CONFIG,
  UI_CONFIG,
  CORPORATE_THEME,
  EDUCATIONAL_CONTENT,
  API_CONFIG,
  DEFAULT_PROTECT_PORTAL_CONFIG,
  getEnvironmentConfig,
  validateConfig,
};
