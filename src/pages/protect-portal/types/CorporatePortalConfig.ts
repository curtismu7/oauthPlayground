/**
 * @file CorporatePortalConfig.ts
 * @module protect-portal/types
 * @description Configuration interfaces for unified corporate portal architecture
 * @version 9.11.58
 * @since 2026-02-15
 *
 * This file defines the configuration interfaces for the unified corporate portal
 * architecture that supports multiple login patterns and company customizations.
 */

export type LoginPattern = 
  | 'right-popout'     // Right-side slide-out panel (United Airlines)
  | 'new-page'         // Separate dedicated login page (American Airlines, FedEx)
  | 'dropdown'         // Header dropdown form (Southwest Airlines)
  | 'embedded'         // Form within main page (Bank of America)
  | 'two-step-otp'     // Username → OTP flow (PingIdentity - default);

export interface AnimationConfig {
  type: 'slideIn' | 'slideDown' | 'fadeIn';
  duration: string;
  easing?: string;
}

export interface LogoConfig {
  url: string;
  alt: string;
  width: string;
  height: string;
  text: string;
  colors: Record<string, string>;
}

export interface ColorPalette {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  muted: string;
  border: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  primaryLight?: string;
  secondaryLight?: string;
  secondaryDark?: string;
  errorLight?: string;
  warningLight?: string;
  successLight?: string;
}

export interface TypographyConfig {
  heading: string;
  body: string;
  mono?: string;
}

export interface SpacingConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface FeatureConfig {
  title: string;
  description: string;
  icon: string;
  link?: string;
}

export interface CorporatePortalConfig {
  company: {
    name: string;
    displayName: string;
    industry: 'aviation' | 'banking' | 'tech' | 'logistics' | 'other';
    logo: LogoConfig;
  };
  login: {
    pattern: LoginPattern;
    route?: string;                    // For new-page pattern
    position?: 'header' | 'right' | 'hero'; // For dropdown/pop-out/embedded
    animation?: AnimationConfig;
    passwordless?: boolean;            // For OTP pattern
    security?: 'standard' | 'high-trust'; // For embedded pattern
    fullPage?: boolean;                // For new-page pattern
  };
  navigation: {
    style: 'corporate' | 'modern' | 'friendly' | 'professional';
    showBrandSelector: boolean;
    stickyHeader: boolean;
  };
  content: {
    customerTerminology: boolean;
    tone: 'corporate' | 'friendly' | 'professional' | 'modern' | 'professional-trustworthy';
    heroTitle: string;
    heroSubtitle: string;
    tagline?: string;
    features: FeatureConfig[];
  };
  branding: {
    colors: ColorPalette;
    typography: TypographyConfig;
    spacing: SpacingConfig;
  };
}

export interface IndustryTemplate {
  name: string;
  displayName: string;
  industries: string[];
  baseConfig: Partial<CorporatePortalConfig>;
  defaultLoginPattern: LoginPattern;
}
