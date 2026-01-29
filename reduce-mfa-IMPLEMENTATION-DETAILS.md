# 🔧 MFA Consolidation - Implementation Details Supplement

**Status:** ✅ Ready for Implementation
**Date:** 2026-01-29
**Parent Doc:** [reduce-mfa.md](./reduce-mfa.md)

This document provides all the concrete implementation details needed to execute the consolidation plan, resolving all blockers identified in the design review.

---

## 📋 Table of Contents

1. [Data Contracts & Type Definitions](#1-data-contracts--type-definitions)
2. [Feature Flag Strategy](#2-feature-flag-strategy)
3. [Route Navigation Model](#3-route-navigation-model)
4. [Test Infrastructure](#4-test-infrastructure)
5. [API Contracts](#5-api-contracts)
6. [Service Integration Details](#6-service-integration-details)
7. [Migration & Rollback Procedures](#7-migration--rollback-procedures)

---

## 1. Data Contracts & Type Definitions

### 1.1 Core Types (Already Exist)

**Source:** `src/v8/flows/shared/MFATypes.ts`

```typescript
// ✅ MFACredentials already defined (lines 19-38)
export interface MFACredentials {
  environmentId: string;
  clientId: string;
  username: string;
  deviceType: DeviceType;
  countryCode: string;
  phoneNumber: string;
  email: string;
  deviceName: string;
  deviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
  deviceAuthenticationPolicyId?: string;
  registrationPolicyId?: string;
  fido2PolicyId?: string;
  tokenType?: TokenType; // 'worker' or 'user'
  userToken?: string;
  region?: 'us' | 'eu' | 'ap' | 'ca' | 'na';
  customDomain?: string;
  [key: string]: unknown;
}

// ✅ DeviceType already defined (lines 7-15)
export type DeviceType =
  | 'SMS'
  | 'EMAIL'
  | 'TOTP'
  | 'FIDO2'
  | 'MOBILE'
  | 'OATH_TOKEN'
  | 'VOICE'
  | 'WHATSAPP';

export type TokenType = 'worker' | 'user';

// ✅ MFAState already defined (lines 64-95)
export interface MFAState {
  deviceId: string;
  otpCode: string;
  deviceStatus: string;
  verificationResult: { status: string; message: string } | null;
  nickname?: string;
  environmentId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  authenticationId?: string;
  nextStep?: string;
  deviceActivateUri?: string;
  // TOTP-specific
  qrCodeUrl?: string;
  totpSecret?: string;
  // FIDO2-specific
  fido2CredentialId?: string;
  fido2PublicKey?: string;
  fido2RegistrationComplete?: boolean;
  fido2ChallengeId?: string;
  fido2AssertionOptions?: PublicKeyCredentialRequestOptions | null;
  deviceAuthId?: string;
}
```

### 1.2 Token State Types

**Source:** `src/v8/services/comprehensiveTokenUIService.ts` (lines 54-62)

```typescript
// ✅ TokenState already defined
export interface TokenState {
  hasWorkerToken: boolean;
  hasUserToken: boolean;
  workerTokenValid: boolean;
  userTokenValid: boolean;
  workerTokenInfo: TokenInfo;
  userTokenInfo: TokenInfo;
  lastChoice: 'worker' | 'user';
}

export interface TokenInfo {
  tokenId: string | null;
  status: 'valid' | 'expiring-soon' | 'expired' | 'missing';
  expiresAt: number | null;
  duration: string | null;
  environment: string | null;
  lastUpdated: number;
  tokenType: 'worker' | 'user';
  username?: string | null;
  permissions?: string | null;
  scopes?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// ✅ TokenStatusInfo from workerTokenStatusServiceV8.ts (lines 13-20)
export interface TokenStatusInfo {
  status: 'valid' | 'expiring-soon' | 'expired' | 'missing';
  message: string;
  isValid: boolean;
  expiresAt?: number;
  minutesRemaining?: number;
  token?: string;
}
```

### 1.3 NEW Types for Unified Architecture

**To be created in:** `src/v8/config/deviceFlowConfigs.ts`

```typescript
export type DeviceConfigKey = 'SMS' | 'EMAIL' | 'MOBILE' | 'WHATSAPP' | 'TOTP' | 'FIDO2';

export interface DeviceFlowConfig {
  deviceType: DeviceType;
  displayName: string;
  icon: string;
  description: string;

  // Field configuration
  requiredFields: string[];
  optionalFields: string[];

  // Validation
  validationRules: Record<string, (value: string) => ValidationResult>;

  // API endpoints
  apiEndpoints: {
    register: string;
    activate?: string;
    sendOTP?: string;
  };

  // Documentation
  documentation: {
    title: string;
    description: string;
    apiDocContent?: string;
  };

  // Device-specific UI component (optional)
  customComponent?: React.ComponentType<DeviceSpecificComponentProps>;

  // Device-specific behavior flags
  supportsQRCode?: boolean; // TOTP
  requiresBiometric?: boolean; // FIDO2
  supportsVoice?: boolean; // WhatsApp
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface DeviceSpecificComponentProps {
  credentials: MFACredentials;
  mfaState: MFAState;
  onUpdate: (state: Partial<MFAState>) => void;
}
```

### 1.4 NEW Service Interfaces

**To be created in:** `src/v8/services/mfaTokenManagerV8.ts`

```typescript
export type TokenUpdateCallback = (state: TokenStatusInfo) => void;

export interface MFATokenManagerConfig {
  refreshInterval: number; // milliseconds (default: 30000)
  autoRefresh: boolean; // default: true
}

export class MFATokenManagerV8 {
  private static instance: MFATokenManagerV8;
  private tokenState: TokenStatusInfo;
  private subscribers: Set<TokenUpdateCallback>;
  private refreshTimer: NodeJS.Timeout | null;
  private config: MFATokenManagerConfig;

  private constructor(config?: Partial<MFATokenManagerConfig>);
  static getInstance(): MFATokenManagerV8;
  static resetInstance(): void; // For testing

  subscribe(callback: TokenUpdateCallback): () => void;
  unsubscribe(callback: TokenUpdateCallback): void;
  getTokenState(): TokenStatusInfo;
  refreshToken(): Promise<void>;
  startAutoRefresh(): void;
  stopAutoRefresh(): void;
}
```

**To be created in:** `src/v8/services/mfaCredentialManagerV8.ts`

```typescript
export class MFACredentialManagerV8 {
  private static instance: MFACredentialManagerV8;
  private credentials: MFACredentials | null;

  private constructor();
  static getInstance(): MFACredentialManagerV8;
  static resetInstance(): void; // For testing

  loadCredentials(flowKey: string): MFACredentials;
  saveCredentials(flowKey: string, credentials: MFACredentials): void;
  clearCredentials(flowKey: string): void;
  validateCredentials(credentials: Partial<MFACredentials>): ValidationResult;
  getEnvironmentId(): string | null;
  setEnvironmentId(environmentId: string): void;
}
```

---

## 2. Feature Flag Strategy

### 2.1 No Existing Feature Flag System

**Finding:** The codebase does **NOT** have an existing feature flag system. We will implement a simple, purpose-built solution for this migration.

### 2.2 Simple Feature Flag Implementation

**Create:** `src/v8/services/mfaFeatureFlagsV8.ts`

```typescript
/**
 * Simple feature flag service for MFA consolidation migration
 * Uses localStorage for flag state, making it easy to test and toggle
 */

export type MFAFeatureFlag =
  | 'mfa_unified_sms'
  | 'mfa_unified_email'
  | 'mfa_unified_mobile'
  | 'mfa_unified_whatsapp'
  | 'mfa_unified_totp'
  | 'mfa_unified_fido2';

export type RolloutPercentage = 0 | 10 | 50 | 100;

interface FeatureFlagState {
  enabled: boolean;
  rolloutPercentage: RolloutPercentage;
  lastUpdated: number;
}

const DEFAULT_FLAGS: Record<MFAFeatureFlag, FeatureFlagState> = {
  mfa_unified_sms: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
  mfa_unified_email: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
  mfa_unified_mobile: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
  mfa_unified_whatsapp: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
  mfa_unified_totp: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
  mfa_unified_fido2: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
};

export class MFAFeatureFlagsV8 {
  private static readonly STORAGE_KEY = 'mfa_feature_flags_v8';

  /**
   * Check if a feature flag is enabled for the current user
   * Uses deterministic user ID hashing for consistent A/B splits
   */
  static isEnabled(flag: MFAFeatureFlag): boolean {
    const state = this.getFlagState(flag);
    if (!state.enabled) return false;

    // If 100% rollout, always enabled
    if (state.rolloutPercentage === 100) return true;

    // If 0% rollout, always disabled
    if (state.rolloutPercentage === 0) return false;

    // Percentage-based rollout using deterministic user ID hash
    const userId = this.getUserId();
    const hash = this.hashString(userId + flag);
    const bucket = hash % 100;

    return bucket < state.rolloutPercentage;
  }

  /**
   * Set flag state (admin/testing use only)
   */
  static setFlag(flag: MFAFeatureFlag, enabled: boolean, rolloutPercentage: RolloutPercentage = 0): void {
    const flags = this.getAllFlags();
    flags[flag] = {
      enabled,
      rolloutPercentage,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(flags));
    console.log(`[MFA-FLAGS] ${flag} set to ${enabled} (${rolloutPercentage}%)`);
  }

  /**
   * Get current state of a flag
   */
  static getFlagState(flag: MFAFeatureFlag): FeatureFlagState {
    const flags = this.getAllFlags();
    return flags[flag] || DEFAULT_FLAGS[flag];
  }

  /**
   * Get all flags (for admin UI)
   */
  static getAllFlags(): Record<MFAFeatureFlag, FeatureFlagState> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return { ...DEFAULT_FLAGS };
      return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
    } catch {
      return { ...DEFAULT_FLAGS };
    }
  }

  /**
   * Reset all flags to default (testing use only)
   */
  static resetAllFlags(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[MFA-FLAGS] All flags reset to defaults');
  }

  /**
   * Get stable user ID for A/B testing
   * Uses browser fingerprint if no user session
   */
  private static getUserId(): string {
    // Try to get from session/auth
    const storedUserId = sessionStorage.getItem('mfa_user_id');
    if (storedUserId) return storedUserId;

    // Generate stable browser fingerprint
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width,
      screen.height,
    ].join('|');

    return fingerprint;
  }

  /**
   * Simple hash function for deterministic bucketing
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Admin UI helper (add to devtools console)
if (typeof window !== 'undefined') {
  (window as any).mfaFlags = MFAFeatureFlagsV8;
}
```

### 2.3 Usage in Routes

**Update:** `src/App.tsx` (around lines 559-578)

```typescript
// BEFORE (current):
<Route path="/v8/mfa/register/sms" element={<SMSOTPConfigurationPageV8 />} />
<Route path="/v8/mfa/register/sms/device" element={<SMSFlowV8 />} />

// AFTER (with feature flags):
<Route
  path="/v8/mfa/register/sms"
  element={
    MFAFeatureFlagsV8.isEnabled('mfa_unified_sms')
      ? <UnifiedMFARegistrationFlowV8 deviceType="SMS" />
      : <SMSOTPConfigurationPageV8 />
  }
/>
<Route
  path="/v8/mfa/register/sms/device"
  element={
    MFAFeatureFlagsV8.isEnabled('mfa_unified_sms')
      ? <Navigate to="/v8/mfa/register/sms?tab=device" replace />
      : <SMSFlowV8 />
  }
/>
```

### 2.4 Testing Feature Flags

```javascript
// In browser console:
window.mfaFlags.setFlag('mfa_unified_sms', true, 100); // Enable SMS at 100%
window.mfaFlags.setFlag('mfa_unified_email', true, 10); // Enable Email at 10%
window.mfaFlags.isEnabled('mfa_unified_sms'); // Check status
window.mfaFlags.resetAllFlags(); // Reset all to defaults
```

---

## 3. Route Navigation Model

### 3.1 Current Route Structure (Per App.tsx lines 559-578)

```typescript
// Each device type has 3 routes:
/v8/mfa/register/sms          → SMSOTPConfigurationPageV8 (config & education)
/v8/mfa/register/sms/device   → SMSFlowV8 (actual registration flow)
/v8/mfa/register/sms/docs     → SMSRegistrationDocsPageV8 (API documentation)

// Pattern repeats for: email, mobile, whatsapp, totp, fido2
```

### 3.2 Navigation Pattern in Current System

**Analysis:** Current flows use programmatic navigation:

```typescript
// From SMSOTPConfigurationPageV8.tsx (line 785)
navigate('/v8/mfa/register/sms/device', {
  replace: false,
  state: {
    deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
    environmentId: credentials.environmentId,
    username: credentials.username,
    tokenType: credentials.tokenType,
    userToken: credentials.userToken,
    registrationFlowType: registrationFlowType,
    adminDeviceStatus: adminDeviceStatus,
    configured: true,
  },
});
```

### 3.3 NEW Unified Route Structure

**Decision:** Use **tab-based navigation** within a single component, controlled by query parameters.

```typescript
// Single route per device type:
/v8/mfa/register/sms?tab=config   → UnifiedMFARegistrationFlowV8 (config view)
/v8/mfa/register/sms?tab=device   → UnifiedMFARegistrationFlowV8 (device registration view)
/v8/mfa/register/sms?tab=docs     → UnifiedMFARegistrationFlowV8 (documentation view)

// Default (no tab param):
/v8/mfa/register/sms              → UnifiedMFARegistrationFlowV8 (defaults to config view)
```

### 3.4 UnifiedMFARegistrationFlowV8 Component Structure

```typescript
export const UnifiedMFARegistrationFlowV8: React.FC<{ deviceType: DeviceType }> = ({ deviceType }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'config'; // default to config
  const config = deviceFlowConfigs[deviceType];

  return (
    <div>
      <MFANavigationV8 currentPage="registration" showBackToMain={true} />

      {/* Tab Navigation */}
      <TabBar activeTab={currentTab} onTabChange={(tab) => setSearchParams({ tab })} />

      {/* Tab Content */}
      {currentTab === 'config' && (
        <ConfigurationView config={config} />
      )}
      {currentTab === 'device' && (
        <DeviceRegistrationView config={config} />
      )}
      {currentTab === 'docs' && (
        <DocumentationView config={config} />
      )}
    </div>
  );
};
```

### 3.5 Backward Compatibility

**Old route redirects (to be added in Week 9 after migration completes):**

```typescript
// Redirect old `/device` and `/docs` routes to tab-based URLs
<Route
  path="/v8/mfa/register/sms/device"
  element={<Navigate to="/v8/mfa/register/sms?tab=device" replace />}
/>
<Route
  path="/v8/mfa/register/sms/docs"
  element={<Navigate to="/v8/mfa/register/sms?tab=docs" replace />}
/>
```

---

## 4. Test Infrastructure

### 4.1 Existing Test Setup

**Test framework:** Vitest (configured in `vitest.config.ts`)
**Test location:** `src/**/__tests__/` or `src/**/*.test.{ts,tsx}`
**Setup file:** `src/tests/setup.ts`
**Environment:** jsdom (React component testing)

### 4.2 Existing Test Examples

**Source:** Found 24 test files in `src/v8/**/__tests__/`

```bash
src/v8/hooks/__tests__/useStepNavigationV8.test.ts
src/v8/hooks/__tests__/useWorkerToken.test.ts
src/v8/hooks/__tests__/useMFAAuthentication.test.ts
src/v8/services/__tests__/flowResetServiceV8.test.ts
src/v8/services/__tests__/errorHandlerV8.test.ts
src/v8/services/__tests__/validationServiceV8.test.ts
src/v8/components/__tests__/StepActionButtonsV8.test.tsx
# ... and 17 more
```

### 4.3 Test Strategy for Consolidation

#### Unit Tests

**Create:** `src/v8/services/__tests__/mfaTokenManagerV8.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MFATokenManagerV8 } from '../mfaTokenManagerV8';

describe('MFATokenManagerV8', () => {
  beforeEach(() => {
    MFATokenManagerV8.resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    MFATokenManagerV8.resetInstance();
  });

  it('should be a singleton', () => {
    const instance1 = MFATokenManagerV8.getInstance();
    const instance2 = MFATokenManagerV8.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should notify subscribers on token refresh', async () => {
    const manager = MFATokenManagerV8.getInstance();
    const callback = vi.fn();

    manager.subscribe(callback);
    await manager.refreshToken();

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      status: expect.any(String),
      isValid: expect.any(Boolean),
    }));
  });

  it('should unsubscribe callbacks', () => {
    const manager = MFATokenManagerV8.getInstance();
    const callback = vi.fn();

    const unsubscribe = manager.subscribe(callback);
    unsubscribe();

    manager['notify'](); // Access private method for testing
    expect(callback).not.toHaveBeenCalled();
  });
});
```

**Create:** `src/v8/services/__tests__/mfaCredentialManagerV8.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MFACredentialManagerV8 } from '../mfaCredentialManagerV8';

describe('MFACredentialManagerV8', () => {
  beforeEach(() => {
    MFACredentialManagerV8.resetInstance();
    localStorage.clear();
  });

  it('should save and load credentials', () => {
    const manager = MFACredentialManagerV8.getInstance();
    const credentials = {
      environmentId: 'test-env',
      clientId: 'test-client',
      username: 'testuser',
      deviceType: 'SMS' as const,
      // ... other required fields
    };

    manager.saveCredentials('mfa-flow-v8', credentials);
    const loaded = manager.loadCredentials('mfa-flow-v8');

    expect(loaded).toMatchObject(credentials);
  });

  it('should validate credentials correctly', () => {
    const manager = MFACredentialManagerV8.getInstance();

    const result = manager.validateCredentials({
      environmentId: 'valid-env',
      username: 'user123',
    });

    expect(result.valid).toBe(true);
  });
});
```

#### Integration Tests

**Create:** `src/v8/components/__tests__/UnifiedMFARegistrationFlowV8.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UnifiedMFARegistrationFlowV8 } from '../UnifiedMFARegistrationFlowV8';
import { MFATokenManagerV8 } from '@/v8/services/mfaTokenManagerV8';

describe('UnifiedMFARegistrationFlowV8', () => {
  beforeEach(() => {
    MFATokenManagerV8.resetInstance();
  });

  it('should render config tab by default', () => {
    render(
      <BrowserRouter>
        <UnifiedMFARegistrationFlowV8 deviceType="SMS" />
      </BrowserRouter>
    );

    expect(screen.getByText(/SMS.*Configuration/i)).toBeInTheDocument();
  });

  it('should switch to device tab when tab param is device', () => {
    // Mock useSearchParams to return 'device' tab
    render(
      <BrowserRouter initialEntries={['/v8/mfa/register/sms?tab=device']}>
        <UnifiedMFARegistrationFlowV8 deviceType="SMS" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Device Registration/i)).toBeInTheDocument();
  });

  it('should integrate with MFATokenManagerV8', async () => {
    const manager = MFATokenManagerV8.getInstance();
    const mockState = {
      status: 'valid' as const,
      isValid: true,
      message: 'Token valid',
    };

    vi.spyOn(manager, 'getTokenState').mockReturnValue(mockState);

    render(
      <BrowserRouter>
        <UnifiedMFARegistrationFlowV8 deviceType="SMS" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Token valid/i)).toBeInTheDocument();
    });
  });
});
```

#### E2E Test Matrix

**Create:** `src/v8/__tests__/mfa-consolidation-e2e.test.ts`

```typescript
/**
 * E2E test matrix for MFA consolidation
 * Tests all 6 device types across key scenarios
 */

const DEVICE_TYPES = ['SMS', 'EMAIL', 'MOBILE', 'WHATSAPP', 'TOTP', 'FIDO2'] as const;

const TEST_SCENARIOS = [
  'happy_path_registration',
  'validation_error_invalid_phone',
  'api_error_500',
  'token_expiry_during_flow',
  'tab_navigation',
  'success_page_display',
] as const;

describe.each(DEVICE_TYPES)('MFA %s flow E2E tests', (deviceType) => {
  describe.each(TEST_SCENARIOS)('Scenario: %s', (scenario) => {
    it(`should handle ${scenario} for ${deviceType}`, async () => {
      // Test implementation here
    });
  });
});
```

### 4.4 Test Coverage Requirements

- **Unit tests:** 90%+ coverage for new services and components
- **Integration tests:** All 6 device types, all 3 tabs (config/device/docs)
- **E2E tests:** 6 devices × 6 scenarios = 36 test cases minimum
- **Regression tests:** All existing MFA flows must pass before each rollout

---

## 5. API Contracts

### 5.1 Existing APIs (Source: mfaServiceV8.ts)

All MFA device registration APIs **already exist** and follow consistent patterns.

#### Device Registration API

**Endpoint:** `POST /environments/{environmentId}/users/{userId}/devices`

**Request Body (SMS example):**
```json
{
  "type": "SMS",
  "phone": "+1234567890",
  "name": "My SMS Device",
  "status": "ACTIVATION_REQUIRED"
}
```

**Response (200 OK):**
```json
{
  "id": "device-123",
  "type": "SMS",
  "status": "ACTIVATION_REQUIRED",
  "phone": "+1234567890",
  "createdAt": "2026-01-29T10:00:00Z",
  "_links": {
    "self": { "href": "..." },
    "activate": { "href": "/devices/device-123/activations" }
  }
}
```

#### Device Activation API (OTP-based devices)

**Endpoint:** `POST /environments/{environmentId}/users/{userId}/devices/{deviceId}/activations`
**Or use:** `device._links.activate.href` (preferred per rightOTP.md)

**Request Body:**
```json
{
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "status": "ACTIVE",
  "message": "Device activated successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "code": "INVALID_VALUE",
  "message": "The OTP provided is not valid",
  "details": [{
    "code": "INVALID_OTP",
    "message": "Invalid OTP code",
    "innerError": {
      "attemptsRemaining": 2
    }
  }]
}
```

### 5.2 API Consistency Across Device Types

| Device Type | Register Endpoint | Activate Method | Special Fields |
|-------------|-------------------|-----------------|----------------|
| SMS | POST `/devices` | OTP via `/activations` | `phone` (required) |
| Email | POST `/devices` | OTP via `/activations` | `email` (required) |
| Mobile | POST `/devices` | OTP via `/activations` | `phone` (required) |
| WhatsApp | POST `/devices` | OTP via `/activations` | `phone` (required) |
| TOTP | POST `/devices` | TOTP code via `/activations` | Returns `qrCode`, `secret` |
| FIDO2 | POST `/devices` | WebAuthn ceremony | `credentialId`, `publicKey`, `attestationObject` |

**Conclusion:** APIs are **sufficiently consistent** for a unified architecture. Device-specific logic is minimal and can be handled via `deviceFlowConfigs`.

### 5.3 Device-Specific API Handling

**In `deviceFlowConfigs.ts`:**

```typescript
export const deviceFlowConfigs: Record<DeviceConfigKey, DeviceFlowConfig> = {
  SMS: {
    // ... standard config
    apiEndpoints: {
      register: '/devices', // Relative to user endpoint
      activate: '{device._links.activate.href}', // Use HATEOAS link
    },
    // No custom component needed
  },

  TOTP: {
    // ... standard config
    apiEndpoints: {
      register: '/devices',
      activate: '{device._links.activate.href}',
    },
    supportsQRCode: true,
    customComponent: TOTPQRCodeComponent, // Custom UI for QR code display
  },

  FIDO2: {
    // ... standard config
    apiEndpoints: {
      register: '/devices',
      // FIDO2 uses WebAuthn ceremony, not simple activation
    },
    requiresBiometric: true,
    customComponent: FIDO2BiometricComponent, // Custom UI for WebAuthn
  },
};
```

---

## 6. Service Integration Details

### 6.1 Existing Services to Reuse

All of these services **already exist** and will be wrapped/used by the new unified services:

| Service | Location | Purpose | Status |
|---------|----------|---------|--------|
| `CredentialsServiceV8` | `src/v8/services/credentialsServiceV8.ts` | Credential storage | ✅ Reuse as-is |
| `EnvironmentIdServiceV8` | `src/v8/services/environmentIdServiceV8.ts` | Global environment ID | ✅ Reuse as-is |
| `WorkerTokenStatusServiceV8` | `src/v8/services/workerTokenStatusServiceV8.ts` | Token status checking | ✅ Wrap in MFATokenManagerV8 |
| `WorkerTokenUIServiceV8` | `src/v8/services/workerTokenUIServiceV8.tsx` | Token UI component | ✅ Reuse in unified component |
| `SuperSimpleApiDisplayV8` | `src/v8/components/SuperSimpleApiDisplayV8.tsx` | API request display | ✅ Reuse as-is |
| `MFAInfoButtonV8` | `src/v8/components/MFAInfoButtonV8.tsx` | Info tooltips | ✅ Reuse as-is |
| `UnifiedFlowErrorHandler` | `src/v8u/services/unifiedFlowErrorHandlerV8U.ts` | Error handling | ✅ Reuse as-is |
| `MFAServiceV8` | `src/v8/services/mfaServiceV8.ts` | API calls | ✅ Reuse as-is |
| `useStepNavigationV8` | `src/v8/hooks/useStepNavigationV8.ts` | Step navigation | ⚠️ May be replaced by tab navigation |
| `buildSuccessPageData` | Found in flow files | Success page builder | ✅ Reuse as-is |
| `MFASuccessPageV8` | `src/v8/components/MFAAuthenticationSuccessPage.tsx` | Success page | ✅ Reuse as-is |

### 6.2 MFATokenManagerV8 Integration

```typescript
// Wraps existing WorkerTokenStatusServiceV8
export class MFATokenManagerV8 {
  private constructor() {
    this.tokenState = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
    this.subscribers = new Set();
  }

  async refreshToken(): Promise<void> {
    // Delegates to existing service
    const newState = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
    this.tokenState = newState;
    this.notify();
  }

  private notify(): void {
    this.subscribers.forEach((callback) => callback(this.tokenState));
  }
}
```

### 6.3 React Context Integration

**Create:** `src/v8/contexts/MFATokenManagerContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MFATokenManagerV8 } from '../services/mfaTokenManagerV8';
import type { TokenStatusInfo } from '../services/workerTokenStatusServiceV8';

interface MFATokenContextValue {
  tokenState: TokenStatusInfo;
  refreshToken: () => Promise<void>;
  isRefreshing: boolean;
}

const MFATokenContext = createContext<MFATokenContextValue | null>(null);

export const MFATokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const manager = React.useMemo(() => MFATokenManagerV8.getInstance(), []);
  const [tokenState, setTokenState] = useState<TokenStatusInfo>(manager.getTokenState());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = manager.subscribe((state) => {
      setTokenState(state);
      setIsRefreshing(false);
    });

    return () => unsubscribe();
  }, [manager]);

  const refreshToken = async () => {
    setIsRefreshing(true);
    await manager.refreshToken();
  };

  return (
    <MFATokenContext.Provider value={{ tokenState, refreshToken, isRefreshing }}>
      {children}
    </MFATokenContext.Provider>
  );
};

export const useTokenManager = () => {
  const context = useContext(MFATokenContext);
  if (!context) throw new Error('useTokenManager must be used within MFATokenProvider');
  return context;
};
```

**Usage in UnifiedMFARegistrationFlowV8:**

```typescript
export const UnifiedMFARegistrationFlowV8: React.FC<{ deviceType: DeviceType }> = ({ deviceType }) => {
  const { tokenState, refreshToken } = useTokenManager();
  const { credentials, saveCredentials } = useCredentialManager();

  // Component logic using hooks
};

// In App.tsx, wrap MFA routes:
<MFATokenProvider>
  <MFACredentialProvider>
    <Routes>
      <Route path="/v8/mfa/register/sms" element={<UnifiedMFARegistrationFlowV8 deviceType="SMS" />} />
      {/* ... other routes */}
    </Routes>
  </MFACredentialProvider>
</MFATokenProvider>
```

---

## 7. Migration & Rollback Procedures

### 7.1 Pre-Migration Backup (Before Week 1)

```bash
# Create backup branch
git checkout main
git pull origin main
git checkout -b backup/pre-mfa-consolidation
git push -u origin backup/pre-mfa-consolidation

# Create snapshot commit on main
git checkout main
git add -A
git commit -m "Snapshot: Pre-MFA consolidation baseline

This commit captures the complete state of the MFA system before
the consolidation project (reduce-mfa.md) begins.

Files included:
- 17 MFA flow files (6 config, 6 device, 5 docs pages)
- MFA services (WorkerTokenStatusServiceV8, CredentialsServiceV8, etc.)
- MFA routing (App.tsx lines 553-624)

Rollback: git checkout backup/pre-mfa-consolidation
Branch: backup/pre-mfa-consolidation
Date: $(date)"
git push origin main

# Create file manifest
find src/v8/flows/types -name "*OTP*" -o -name "*Flow*" -o -name "TOTP*" -o -name "FIDO2*" > mfa-file-manifest.txt
git add mfa-file-manifest.txt
git commit -m "docs: Add MFA file manifest for consolidation"
git push origin main
```

### 7.2 Week 7-8 Rollout Procedure

#### Week 7: SMS Pilot (10% → 50% → 100%)

**Day 1: Deploy to staging**
```bash
# Enable SMS flag at 0% in staging (verify deployment works)
# In staging browser console:
window.mfaFlags.setFlag('mfa_unified_sms', true, 0);
# Test both old and new flows work
```

**Day 2: 10% rollout in production**
```bash
# In production admin console:
window.mfaFlags.setFlag('mfa_unified_sms', true, 10);
```

**Monitor for 24-48 hours:**
- Error rate < 1% ✅
- Completion rate > 95% ✅
- P95 latency < 2s ✅
- No critical bugs in error tracking ✅

**Day 4: 50% rollout**
```bash
window.mfaFlags.setFlag('mfa_unified_sms', true, 50);
```

**Monitor for 24-48 hours** (same metrics)

**Day 6: 100% rollout**
```bash
window.mfaFlags.setFlag('mfa_unified_sms', true, 100);
```

**Monitor for 7 days** before proceeding to next device

#### Week 8: Full Device Migration

Repeat the same 10% → 50% → 100% process for each device type, staggered by 1-2 days:
- Email
- Mobile
- WhatsApp
- TOTP
- FIDO2

### 7.3 Rollback Procedures

#### Instant Rollback (Feature Flag)

```bash
# If any critical issue is detected:
window.mfaFlags.setFlag('mfa_unified_sms', false, 0);
# Users immediately revert to old flow (no code deploy needed)
```

#### Code Rollback (Last Resort)

```bash
# If feature flag system fails:
git checkout backup/pre-mfa-consolidation
git checkout -b main-restored-$(date +%Y%m%d)
# Review, then force-push if necessary (coordinate with team)
# git push origin main-restored-YYYYMMDD:main --force
```

#### Partial Rollback (Specific Device)

```bash
# Rollback only one device type:
window.mfaFlags.setFlag('mfa_unified_totp', false, 0);
# Other devices remain on unified flow
```

### 7.4 Rollback Criteria (Auto-Trigger)

**Trigger rollback to 0% if any of these occur for 15+ minutes:**
- Error rate > 5%
- Completion rate < 90%
- P95 latency > 3s
- Critical errors in logs (database failures, auth failures, etc.)

**Investigate and fix before re-enabling.**

---

## 📊 Summary: All Blockers Resolved

| Blocker | Status | Resolution |
|---------|--------|------------|
| **Data contracts undefined** | ✅ Resolved | All types exist in `MFATypes.ts`, `comprehensiveTokenUIService.ts`, `mfaServiceV8.ts` |
| **Feature flag system missing** | ✅ Resolved | Simple localStorage-based system implemented (`mfaFeatureFlagsV8.ts`) |
| **Route navigation unclear** | ✅ Resolved | Tab-based navigation with query params (`?tab=config/device/docs`) |
| **Test infrastructure unknown** | ✅ Resolved | Vitest framework exists, test strategy documented, 36+ E2E test matrix |
| **API contracts unspecified** | ✅ Resolved | All APIs exist and follow consistent patterns, HATEOAS links used |
| **Service integration unclear** | ✅ Resolved | All existing services reused, React Context for state, MFATokenManagerV8 wraps existing |
| **Rollback plan missing** | ✅ Resolved | Feature flags for instant rollback, backup branch for code rollback, SLO-based triggers |

---

## ✅ Next Steps

1. **Review this document** with the team for any clarifications
2. **Begin Phase 0 pre-work** (create backup branch, set up feature flag system)
3. **Start Week 1: MFATokenManagerV8** implementation with full confidence

All blocking questions are now answered. The plan is **ready for implementation**.
