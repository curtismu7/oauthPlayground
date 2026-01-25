# Incremental Refactor Plan: Phase 1-2 Only

_Created: 2026-01-25_  
_Scope: Foundation + OIDC Core (Reduced from 9-week full refactor)_  
_Timeline: 4-6 weeks_  
_Risk Level: MEDIUM (vs VERY HIGH for full refactor)_

---

## Executive Summary

This document outlines an **incremental refactor approach** implementing only Phase 1-2 from the full architecture plan. This reduces scope, timeline, and risk while still delivering critical security improvements and foundational architecture.

### Why Incremental?

**Defers High-Risk Items**:
- ❌ Worker token V2→V8 migration (PingOne APIs)
- ❌ MFA API client wrapper
- ❌ Flow integration consolidation
- ❌ Token service consolidation

**Focuses on Critical Needs**:
- ✅ Foundation infrastructure (HttpClient, Storage, Credentials)
- ✅ Security compliance (State/Nonce managers)
- ✅ OIDC core services (Discovery, ID token validation)
- ✅ PKCE consolidation

### Key Metrics

| Metric | Incremental | Full Refactor | Reduction |
|--------|-------------|---------------|-----------|
| **Timeline** | 4-6 weeks | 9-12 weeks | **50% faster** |
| **Files Modified** | ~350 files | ~811 files | **57% fewer** |
| **Risk Level** | MEDIUM | VERY HIGH | **Significantly lower** |
| **Services Created** | 9 services | 12 services | 25% fewer |
| **PingOne API Risk** | None | Critical | **Eliminated** |
| **Effort** | 24 dev days | 50 dev days | **52% less** |

---

## Phase 1: Foundation (Weeks 1-2)

### Objectives
- Create shared infrastructure for all services
- Consolidate credentials storage (4 services → 1)
- Establish patterns for Phase 2

### Services to Create

#### 1.1 HttpClient (`src/services/httpClient.ts`)

**Purpose**: Centralized HTTP wrapper with retry, error mapping, timeout handling

**Interface**:
```typescript
interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface HttpClientResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

interface HttpClientError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

class HttpClient {
  async get<T>(url: string, options?: HttpClientOptions): Promise<HttpClientResponse<T>>;
  async post<T>(url: string, body: unknown, options?: HttpClientOptions): Promise<HttpClientResponse<T>>;
  async put<T>(url: string, body: unknown, options?: HttpClientOptions): Promise<HttpClientResponse<T>>;
  async delete<T>(url: string, options?: HttpClientOptions): Promise<HttpClientResponse<T>>;
  
  private async retry<T>(fn: () => Promise<T>, retries: number): Promise<T>;
  private mapError(error: unknown): HttpClientError;
}
```

**Features**:
- Exponential backoff retry (3 attempts by default)
- Timeout handling (30s default)
- Standardized error mapping
- Request/response logging (dev mode)
- AbortController support

**Files to Modify**: 0 (new service, not yet integrated)

**Tests Required**:
- Unit tests: Timeout, retry, error mapping, abort
- Integration tests: Real HTTP calls (mocked)

---

#### 1.2 StorageRepository (`src/services/storageRepository.ts`)

**Purpose**: Abstraction over localStorage + IndexedDB fallback

**Interface**:
```typescript
interface StorageOptions {
  prefix?: string;
  useIndexedDB?: boolean;
}

class StorageRepository {
  constructor(options?: StorageOptions);
  
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(prefix?: string): void;
  keys(prefix?: string): string[];
  
  // Migration helpers
  migrate(oldKey: string, newKey: string): void;
  migrateAll(keyMap: Record<string, string>): void;
}
```

**Features**:
- Automatic IndexedDB fallback if localStorage full
- Prefix support for namespacing
- Migration utilities for key changes
- JSON serialization/deserialization
- Error handling for quota exceeded

**Files to Modify**: 0 (new service, not yet integrated)

**Tests Required**:
- Unit tests: Get/set/remove, prefix filtering, migration
- Integration tests: localStorage + IndexedDB fallback

---

#### 1.3 CredentialsRepository (`src/services/credentialsRepository.ts`)

**Purpose**: Consolidate 4 credential services into single repository

**Consolidates**:
- `CredentialsServiceV8` (117 imports)
- `SharedCredentialsServiceV8` (20+ imports)
- `FlowCredentialService` (30+ imports)
- `credentialReloadServiceV8U` (10+ imports)

**Interface**:
```typescript
interface Credentials {
  clientId?: string;
  clientSecret?: string;
  environmentId?: string;
  issuerUrl?: string;
  redirectUri?: string;
  scopes?: string[];
  // ... other credential fields
}

interface SharedCredentials {
  environmentId?: string;
  defaultClientId?: string;
  defaultIssuerUrl?: string;
}

class CredentialsRepository {
  // Flow-specific
  getFlowCredentials(flowKey: string): Credentials | null;
  setFlowCredentials(flowKey: string, credentials: Credentials): void;
  clearFlowCredentials(flowKey: string): void;
  
  // Shared/global
  getSharedCredentials(): SharedCredentials | null;
  setSharedCredentials(credentials: SharedCredentials): void;
  
  // Environment ID (special case - globally shared)
  getEnvironmentId(): string | null;
  setEnvironmentId(environmentId: string): void;
  
  // Reload after reset
  reloadFlowCredentials(flowKey: string): Credentials | null;
  
  // Migration from old keys
  migrate(): void;
  
  // Events
  onCredentialsChanged(flowKey: string, callback: (creds: Credentials) => void): () => void;
  onEnvironmentIdChanged(callback: (envId: string) => void): () => void;
}
```

**Migration Strategy**:
```typescript
// Old keys → New keys
const MIGRATION_MAP = {
  'credentials_v8_unified-oauth': 'credentials_repo_flow_unified-oauth',
  'credentials_v8_mfa-sms': 'credentials_repo_flow_mfa-sms',
  'shared_credentials_v8': 'credentials_repo_shared',
  'environment_id': 'credentials_repo_environment_id',
};
```

**Backward Compatibility**:
- Read from both old and new keys (1 release cycle)
- Write to both old and new keys (1 release cycle)
- Feature flag: `USE_NEW_CREDENTIALS_REPO` (default: false)

**Files to Modify**: ~200 files
- 117 files importing `CredentialsServiceV8`
- 20+ files importing `SharedCredentialsServiceV8`
- 30+ files importing `FlowCredentialService`
- 10+ files importing `credentialReloadServiceV8U`
- All locked dependency copies

**Tests Required**:
- Unit tests: Get/set/clear, shared credentials, environment ID, reload, migration
- Integration tests: Event listeners, storage persistence
- Migration tests: Old keys → new keys, backward compatibility

---

### Phase 1 Implementation Steps

#### Week 1: Create Foundation Services

**Day 1-2: HttpClient**
1. Create `src/services/httpClient.ts`
2. Implement retry logic with exponential backoff
3. Implement error mapping
4. Write unit tests (timeout, retry, error mapping)
5. Write integration tests (mocked HTTP)

**Day 3-4: StorageRepository**
1. Create `src/services/storageRepository.ts`
2. Implement localStorage wrapper
3. Implement IndexedDB fallback
4. Implement migration utilities
5. Write unit tests (get/set/remove, prefix, migration)
6. Write integration tests (localStorage + IndexedDB)

**Day 5: CredentialsRepository (Part 1)**
1. Create `src/services/credentialsRepository.ts`
2. Implement flow-specific methods
3. Implement shared credentials methods
4. Implement environment ID methods
5. Write unit tests (basic get/set/clear)

#### Week 2: Integrate CredentialsRepository

**Day 6-7: CredentialsRepository (Part 2)**
1. Implement reload functionality
2. Implement migration logic
3. Implement event listeners
4. Write migration tests
5. Write integration tests

**Day 8-9: Update Components (High-Impact)**
1. Update `UnifiedFlowSteps.tsx` (10,000+ lines)
2. Update `CredentialsFormV8U.tsx` (3,000+ lines)
3. Update `UnifiedOAuthFlowV8U.tsx` (2,300+ lines)
4. Add feature flag checks
5. Test manually

**Day 10: Update Remaining Components**
1. Update MFA flow components
2. Update locked dependencies (lockdown approval)
3. Run full test suite
4. Manual QA all flows

---

### Phase 1 Success Criteria

- [ ] All foundation services created and tested
- [ ] CredentialsRepository consolidates 4 services
- [ ] Migration script works (old keys → new keys)
- [ ] Backward compatibility maintained (1 release)
- [ ] Feature flag implemented: `USE_NEW_CREDENTIALS_REPO`
- [ ] All tests passing (unit + integration)
- [ ] No regressions in Unified/MFA flows
- [ ] Lockdown systems updated and verified

---

## Phase 2: OIDC Core (Weeks 3-4)

### Objectives
- Implement security-critical services (State/Nonce managers)
- Integrate existing OIDC services (Discovery, ID token validation)
- Consolidate PKCE services

### Services to Create/Integrate

#### 2.1 StateManager (`src/services/stateManager.ts`)

**Purpose**: CSRF protection for OAuth/OIDC flows

**Interface**:
```typescript
class StateManager {
  generate(): string; // crypto.randomBytes(32).toString('hex')
  store(state: string, flowKey: string): void;
  retrieve(flowKey: string): string | null;
  validate(received: string, flowKey: string): boolean;
  clear(flowKey: string): void;
}
```

**Security Requirements**:
- Cryptographically random state (32 bytes)
- Storage in sessionStorage (not localStorage)
- Automatic cleanup after validation
- Reject mismatched state (throw error)

**Files to Modify**: ~60 files
- All authorization URL builders
- All callback handlers
- All flow components

**Tests Required**:
- Unit tests: Generate, store, retrieve, validate, clear
- Security tests: CSRF attack simulation, replay attack
- Integration tests: Full flow with state validation

---

#### 2.2 NonceManager (`src/services/nonceManager.ts`)

**Purpose**: Replay protection for OIDC ID tokens

**Interface**:
```typescript
class NonceManager {
  generate(): string; // crypto.randomBytes(32).toString('hex')
  store(nonce: string, flowKey: string): void;
  retrieve(flowKey: string): string | null;
  validate(received: string, flowKey: string): boolean;
  clear(flowKey: string): void;
}
```

**Security Requirements**:
- Cryptographically random nonce (32 bytes)
- Storage in sessionStorage (not localStorage)
- One-time use (clear after validation)
- Reject reused nonce (throw error)

**Files to Modify**: ~40 files
- All OIDC authorization URL builders
- All ID token validation calls
- All OIDC flow components

**Tests Required**:
- Unit tests: Generate, store, retrieve, validate, clear
- Security tests: Nonce replay attack, missing nonce
- Integration tests: Full OIDC flow with nonce validation

---

#### 2.3 DiscoveryService Integration (`src/v8/services/oidcDiscoveryServiceV8.ts`)

**Purpose**: Integrate existing discovery service into architecture

**Current Status**: ✅ EXISTS but not integrated

**Interface** (existing):
```typescript
interface OIDCMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
  response_types_supported: string[];
  grant_types_supported?: string[];
  // ... other OIDC metadata
}

class OidcDiscoveryServiceV8 {
  async discover(issuer: string): Promise<DiscoveryResult>;
  getCached(issuer: string): OIDCMetadata | null;
  invalidateCache(issuer: string): void;
}
```

**Changes Needed**:
- Add caching strategy (TTL: 1 hour)
- Add error handling for network failures
- Add to service inventory
- Document usage patterns

**Files to Modify**: ~30 files
- All authorization URL builders (use discovery for endpoints)
- All token exchange calls (use discovery for token_endpoint)
- All OIDC flows

**Tests Required**:
- Unit tests: Discovery, caching, invalidation
- Integration tests: Real OIDC provider (mocked)
- Error tests: Network failure, invalid metadata

---

#### 2.4 IDTokenValidationService Integration (`src/v8/services/idTokenValidationServiceV8.ts`)

**Purpose**: Integrate existing ID token validation service

**Current Status**: ✅ EXISTS but not integrated

**Interface** (existing):
```typescript
interface IDTokenValidationResult {
  valid: boolean;
  errors: string[];
  claims?: IDTokenClaims;
}

interface IDTokenClaims {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  nonce?: string;
  azp?: string;
  // ... other claims
}

class IDTokenValidationServiceV8 {
  async validate(
    idToken: string,
    options: IDTokenValidationOptions
  ): Promise<IDTokenValidationResult>;
}
```

**Changes Needed**:
- Integrate with NonceManager for nonce validation
- Integrate with DiscoveryService for JWKS URI
- Add to OIDC flows
- Document validation requirements

**Files to Modify**: ~40 files
- All OIDC flows (Implicit, Hybrid, Auth Code with OIDC)
- All ID token display components
- Token response handlers

**Tests Required**:
- Unit tests: Signature verification, claim validation
- Security tests: Tampered signature, expired token, invalid issuer, nonce mismatch
- Integration tests: Full OIDC flow with ID token validation

---

#### 2.5 JWKSCacheService (`src/services/jwksCacheService.ts`)

**Purpose**: Cache JWKS for ID token signature verification

**Interface**:
```typescript
interface JWK {
  kty: string;
  use?: string;
  kid?: string;
  alg?: string;
  n?: string; // RSA modulus
  e?: string; // RSA exponent
  // ... other JWK fields
}

class JWKSCacheService {
  async getKeys(jwksUri: string): Promise<JWK[]>;
  invalidateCache(jwksUri: string): void;
  clearAll(): void;
}
```

**Features**:
- Cache with TTL (1 hour)
- Automatic refresh on key rotation
- Error handling for network failures

**Files to Modify**: 1 file
- `IDTokenValidationServiceV8` (use JWKS cache)

**Tests Required**:
- Unit tests: Caching, TTL, invalidation
- Integration tests: Key rotation, network failure

---

#### 2.6 PkceManager (`src/services/pkceManager.ts`)

**Purpose**: Consolidate PKCE generation and storage

**Consolidates**:
- `pkceService` (40+ imports)
- `pkceStorageServiceV8U` (20+ imports)
- Inline PKCE generation in components

**Interface**:
```typescript
interface PkceCodes {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
}

class PkceManager {
  generate(): PkceCodes;
  store(codes: PkceCodes, flowKey: string): void;
  retrieve(flowKey: string): PkceCodes | null;
  clear(flowKey: string): void;
}
```

**Features**:
- SHA-256 challenge generation
- Storage in sessionStorage
- Automatic cleanup after token exchange

**Files to Modify**: ~40 files
- All authorization URL builders using PKCE
- All token exchange calls
- All flow components

**Tests Required**:
- Unit tests: Generate, store, retrieve, clear, SHA-256 challenge
- Integration tests: Full PKCE flow

---

### Phase 2 Implementation Steps

#### Week 3: Security Services

**Day 11-12: StateManager + NonceManager**
1. Create `src/services/stateManager.ts`
2. Create `src/services/nonceManager.ts`
3. Implement crypto random generation
4. Implement sessionStorage persistence
5. Write unit tests
6. Write security tests (CSRF, replay attacks)

**Day 13-14: DiscoveryService Integration**
1. Update `src/v8/services/oidcDiscoveryServiceV8.ts`
2. Add caching strategy (TTL: 1 hour)
3. Add error handling
4. Write integration tests
5. Update authorization URL builders to use discovery

**Day 15: JWKSCacheService**
1. Create `src/services/jwksCacheService.ts`
2. Implement caching with TTL
3. Implement key rotation handling
4. Write unit tests
5. Integrate with IDTokenValidationService

#### Week 4: OIDC Integration + PKCE

**Day 16-17: IDTokenValidationService Integration**
1. Update `src/v8/services/idTokenValidationServiceV8.ts`
2. Integrate NonceManager
3. Integrate JWKSCacheService
4. Update OIDC flows to validate ID tokens
5. Write security tests

**Day 18-19: PkceManager**
1. Create `src/services/pkceManager.ts`
2. Consolidate PKCE generation logic
3. Update all flows to use PkceManager
4. Write unit tests
5. Write integration tests

**Day 20: Integration + Testing**
1. Update all authorization URL builders (State + Nonce + PKCE)
2. Update all callback handlers (State + Nonce validation)
3. Run full test suite
4. Manual QA all OIDC flows
5. Security audit

---

### Phase 2 Success Criteria

- [ ] StateManager implemented and tested
- [ ] NonceManager implemented and tested
- [ ] DiscoveryService integrated with caching
- [ ] IDTokenValidationService integrated with Nonce + JWKS
- [ ] JWKSCacheService created and integrated
- [ ] PkceManager consolidates 2 services
- [ ] All OIDC flows validate state + nonce
- [ ] All OIDC flows validate ID tokens
- [ ] Security tests passing (CSRF, replay, signature tampering)
- [ ] OIDC conformance tests passing
- [ ] No regressions in Unified/MFA flows

---

## What's Deferred (Phase 3-5)

### Phase 3: Protocol Services (DEFERRED)
- TokenExchangeService consolidation
- TokenIntrospectionService
- TokenRevocationService
- AuthorizationService refactor
- PushedAuthorizationService
- ResponseModeService audit

**Why Deferred**: Lower priority, can use existing integration services

---

### Phase 4: Platform Integration (DEFERRED)
- Worker token V2→V8 migration
- MFAApiClient wrapper
- Flow integration migration

**Why Deferred**: High risk (PingOne APIs), requires explicit approval

---

### Phase 5: Cleanup (DEFERRED)
- Delete deprecated services
- Remove feature flags
- Final conformance testing

**Why Deferred**: Only needed after full refactor complete

---

## Timeline & Effort

### Incremental Refactor (Phase 1-2 Only)

| Phase | Duration | Dev Days | Calendar Weeks |
|-------|----------|----------|----------------|
| **Phase 1: Foundation** | 10 days | 10 days | 2 weeks |
| **Phase 2: OIDC Core** | 10 days | 10 days | 2 weeks |
| **Buffer** | 4 days | 4 days | 1 week |
| **Total** | **24 days** | **24 days** | **4-5 weeks** |

**Assumptions**:
- 2 engineers working full-time
- 5 dev days per week
- Includes coding, testing, code review, lockdown approval

### QA Effort

| Phase | QA Hours | Calendar Weeks |
|-------|----------|----------------|
| **Phase 1** | 40 hours | 1 week |
| **Phase 2** | 60 hours | 1.5 weeks |
| **Total** | **100 hours** | **2.5 weeks** |

**Overlaps with Dev**: QA starts mid-phase

### Total Project Timeline

**Optimistic**: 4-5 weeks (all phases sequential, no blockers)

**Realistic**: 5-6 weeks (accounting for):
- Lockdown approval overhead
- Bug fixes during QA
- Security audit for Phase 2

**Pessimistic**: 7-8 weeks (if major issues discovered)

---

## Risk Assessment

### Incremental Refactor Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Security regression** | Medium | CRITICAL | Security audit, comprehensive tests, OIDC conformance |
| **Data loss (credentials)** | Low | CRITICAL | Migration script, backward compatibility, backup |
| **Lockdown system conflicts** | High | HIGH | Approval workflow, snapshot verification |
| **Breaking changes** | High | HIGH | Compatibility shims, feature flags |
| **Test coverage gaps** | Medium | HIGH | 85% coverage requirement, security test suite |

### Risks Eliminated (vs Full Refactor)

- ✅ **PingOne API breakage**: No worker token changes
- ✅ **MFA flow regression**: No MFA API changes
- ✅ **Token exchange bugs**: No token service changes
- ✅ **Flow integration issues**: No flow consolidation

---

## Feature Flags

| Flag | Default | Phase | Purpose |
|------|---------|-------|---------|
| `USE_NEW_CREDENTIALS_REPO` | false | 1 | Credentials migration |
| `USE_NEW_OIDC_CORE` | false | 2 | OIDC security services |

**Flag Management**:
- Stored in: `localStorage` + environment variable override
- UI toggle: Admin settings page (optional)
- Gradual rollout: 25% → 50% → 100%
- Monitoring: Track error rates per flag state

---

## Success Criteria

### Phase 1 Success
- [ ] Foundation services created (HttpClient, StorageRepository, CredentialsRepository)
- [ ] Credentials consolidated (4 services → 1)
- [ ] Migration script works
- [ ] Backward compatibility maintained
- [ ] All tests passing
- [ ] No regressions

### Phase 2 Success
- [ ] Security services created (StateManager, NonceManager)
- [ ] OIDC services integrated (Discovery, IDToken, JWKS)
- [ ] PKCE consolidated (2 services → 1)
- [ ] All OIDC flows secure (state + nonce + ID token validation)
- [ ] Security tests passing
- [ ] OIDC conformance tests passing
- [ ] No regressions

### Overall Success
- [ ] 9 new services created/integrated
- [ ] 350 files updated
- [ ] Test coverage >85%
- [ ] Security compliance achieved
- [ ] Foundation for future phases established
- [ ] Documentation complete

---

## Next Steps After Incremental Refactor

### Option 1: Stop Here (Recommended)
- Foundation and security in place
- Deferred items remain as-is
- Revisit Phase 3-5 in 6-12 months

### Option 2: Continue to Phase 3
- Implement protocol services (TokenExchange, etc.)
- Timeline: +2 weeks
- Risk: Medium

### Option 3: Continue to Phase 4
- Implement worker token migration
- Timeline: +2 weeks
- Risk: High (PingOne APIs)
- **Requires explicit approval**

---

## Comparison: Incremental vs Full

| Aspect | Incremental (Phase 1-2) | Full (Phase 1-5) |
|--------|-------------------------|------------------|
| **Timeline** | 4-6 weeks | 9-12 weeks |
| **Files Modified** | ~350 | ~811 |
| **Services Created** | 9 | 12 |
| **Risk Level** | MEDIUM | VERY HIGH |
| **PingOne API Risk** | None | Critical |
| **Security Compliance** | ✅ Achieved | ✅ Achieved |
| **Code Consolidation** | Partial | Complete |
| **Effort** | 24 dev days | 50 dev days |
| **QA Effort** | 100 hours | 240 hours |

---

## Recommendation

**✅ PROCEED WITH INCREMENTAL REFACTOR**

**Rationale**:
1. **Achieves critical goals**: Security compliance + foundation
2. **Reduces risk**: No PingOne API changes
3. **Faster delivery**: 4-6 weeks vs 9-12 weeks
4. **Lower effort**: 24 dev days vs 50 dev days
5. **Establishes patterns**: Foundation for future work
6. **Defers high-risk items**: Worker token, MFA client, flow integration

**When to Continue to Phase 3-5**:
- After 6-12 months of stable operation
- When resources available (2 engineers + 1 QA for 5+ weeks)
- When PingOne API approval process established
- When risk tolerance increases

---

**Document Status**: ✅ READY FOR IMPLEMENTATION  
**Next Action**: Review with team, get approval, begin Phase 1  
**Restore Point**: `pre-refactor-v8-v8u-full` tag available  
**Prepared By**: Cascade AI (Architecture Analysis)
