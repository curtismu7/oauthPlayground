// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/constants/stepMetadata.ts
// V7.1 Step Metadata Constants - Extracted from OAuthAuthzCodeFlowV6.config.ts

export const STEP_METADATA = {
  // Step 0: Quick Start & Overview
  STEP_0: {
    title: 'Step 0: Quick Start & Overview',
    subtitle: 'Understand the OAuth Authorization Code Flow',
    description: 'Learn the fundamentals and get started quickly',
    icon: '📚',
    isOverview: true,
  },
  
  // Step 1: Introduction & Setup
  STEP_1: {
    title: 'Step 1: Introduction & Setup',
    subtitle: 'Understand the OAuth Authorization Code Flow',
    description: 'Learn the fundamentals and configure your application',
    icon: '🔧',
    isSetup: true,
  },
  
  // Step 2: PKCE Generation
  STEP_2: {
    title: 'Step 2: PKCE Generation',
    subtitle: 'Generate secure code verifier and challenge',
    description: 'Create PKCE parameters for secure authorization',
    icon: '🔐',
    isPKCE: true,
  },
  
  // Step 3: Authorization Request
  STEP_3: {
    title: 'Step 3: Authorization Request',
    subtitle: 'Build and send the authorization request',
    description: 'Construct the authorization URL and initiate the flow',
    icon: '🌐',
    isAuthorization: true,
  },
  
  // Step 4: Authorization Response
  STEP_4: {
    title: 'Step 4: Authorization Response',
    subtitle: 'Handle the authorization response',
    description: 'Process the authorization code from the callback',
    icon: '📨',
    isResponse: true,
  },
  
  // Step 5: Token Exchange
  STEP_5: {
    title: 'Step 5: Token Exchange',
    subtitle: 'Exchange authorization code for tokens',
    description: 'Request access and ID tokens using the authorization code',
    icon: '🔄',
    isTokenExchange: true,
  },
  
  // Step 6: Token Validation
  STEP_6: {
    title: 'Step 6: Token Validation',
    subtitle: 'Validate and introspect tokens',
    description: 'Verify token validity and extract claims',
    icon: '✅',
    isValidation: true,
  },
  
  // Step 7: User Info Request
  STEP_7: {
    title: 'Step 7: User Info Request',
    subtitle: 'Request user information',
    description: 'Fetch user profile information using the access token',
    icon: '👤',
    isUserInfo: true,
  },
  
  // Step 8: Complete
  STEP_8: {
    title: 'Step 8: Complete',
    subtitle: 'Flow completed successfully',
    description: 'Review the complete flow and results',
    icon: '🎉',
    isComplete: true,
  },
} as const;

// Step configuration array for easy iteration
export const STEP_CONFIGS = [
  STEP_METADATA.STEP_0,
  STEP_METADATA.STEP_1,
  STEP_METADATA.STEP_2,
  STEP_METADATA.STEP_3,
  STEP_METADATA.STEP_4,
  STEP_METADATA.STEP_5,
  STEP_METADATA.STEP_6,
  STEP_METADATA.STEP_7,
  STEP_METADATA.STEP_8,
];

// Step completion states
export const STEP_COMPLETION_STATES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const;

// Step navigation constants
export const STEP_NAVIGATION = {
  FIRST_STEP: 0,
  LAST_STEP: 8,
  OVERVIEW_STEP: 0,
  SETUP_STEP: 1,
  PKCE_STEP: 2,
  AUTHORIZATION_STEP: 3,
  RESPONSE_STEP: 4,
  TOKEN_EXCHANGE_STEP: 5,
  VALIDATION_STEP: 6,
  USER_INFO_STEP: 7,
  COMPLETE_STEP: 8,
} as const;

// Step validation rules
export const STEP_VALIDATION_RULES = {
  STEP_1: {
    requiredFields: ['clientId', 'redirectUri'],
    optionalFields: ['scope', 'state'],
  },
  STEP_2: {
    requiredFields: ['codeVerifier', 'codeChallenge'],
    optionalFields: ['codeChallengeMethod'],
  },
  STEP_3: {
    requiredFields: ['authorizationUrl'],
    optionalFields: ['state', 'nonce'],
  },
  STEP_4: {
    requiredFields: ['authorizationCode'],
    optionalFields: ['state', 'error'],
  },
  STEP_5: {
    requiredFields: ['accessToken'],
    optionalFields: ['idToken', 'refreshToken'],
  },
  STEP_6: {
    requiredFields: ['tokenValidation'],
    optionalFields: ['tokenIntrospection'],
  },
  STEP_7: {
    requiredFields: ['userInfo'],
    optionalFields: ['userClaims'],
  },
} as const;

// Step icons mapping
export const STEP_ICONS = {
  OVERVIEW: '📚',
  SETUP: '🔧',
  PKCE: '🔐',
  AUTHORIZATION: '🌐',
  RESPONSE: '📨',
  TOKEN_EXCHANGE: '🔄',
  VALIDATION: '✅',
  USER_INFO: '👤',
  COMPLETE: '🎉',
} as const;

// Step colors mapping
export const STEP_COLORS = {
  OVERVIEW: '#3b82f6',
  SETUP: '#16a34a',
  PKCE: '#f59e0b',
  AUTHORIZATION: '#8b5cf6',
  RESPONSE: '#06b6d4',
  TOKEN_EXCHANGE: '#ef4444',
  VALIDATION: '#10b981',
  USER_INFO: '#f97316',
  COMPLETE: '#84cc16',
} as const;

// Type definitions
export type StepKey = keyof typeof STEP_METADATA;
export type StepConfig = typeof STEP_METADATA[StepKey];
export type StepCompletionState = typeof STEP_COMPLETION_STATES[keyof typeof STEP_COMPLETION_STATES];
export type StepNavigationKey = keyof typeof STEP_NAVIGATION;
export type StepValidationRule = keyof typeof STEP_VALIDATION_RULES;
export type StepIcon = keyof typeof STEP_ICONS;
export type StepColor = keyof typeof STEP_COLORS;
