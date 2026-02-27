# MFA Hub V8 Logging Implementation Plan

## Overview
Based on Phase 1 inventory analysis, implement comprehensive logging system for MFA Hub V8 to capture all PingOne API calls with runId correlation.

## Implementation Components

### 1. HTTP Interception Enhancement
**File:** `src/locked/mfa-hub-v8/dependencies/utils/workerToken.ts`
- Enhance `requestClientCredentialsToken()` function with comprehensive logging
- Add request/response logging with timestamps
- Include runId correlation
- Log authentication method and headers (redacted)
- Capture error details and retry attempts

### 2. RunId Generation & Threading
**File:** `src/locked/mfa-hub-v8/dependencies/v8/services/workerTokenServiceV8.ts`
- Generate unique runId on first worker token load
- Store runId in IndexedDB alongside worker tokens
- Add runId to all `safeAnalyticsFetch()` calls
- Implement runId propagation to all MFA services

### 3. Logger Enhancement
**File:** `src/locked/mfa-hub-v8/dependencies/utils/logger.ts`
- Add runId field to LogEntry interface
- Enhance addToHistory() to include runId
- Add API-specific logging methods (apiRequest, apiResponse)
- Implement log export with runId filtering

### 4. Server Log Integration
**New File:** `src/locked/mfa-hub-v8/dependencies/services/logShipperService.ts`
- Create service to POST client logs to server endpoint
- Implement batching for performance
- Add retry logic for failed shipments
- Include runId in all log payloads

### 5. Storage Enhancement
**File:** `src/locked/mfa-hub-v8/dependencies/v8/services/workerTokenServiceV8.ts`
- Add runId field to WorkerTokenData interface
- Update IndexedDB schema to include runId
- Implement runId persistence across sessions
- Add runId retrieval methods

## Implementation Order

### Phase 1: Core Logging Infrastructure
1. Enhance logger.ts with runId support
2. Update workerTokenServiceV8.ts for runId generation/storage
3. Modify workerToken.ts HTTP interception

### Phase 2: Integration & Shipping
4. Create logShipperService.ts for server integration
5. Update all MFA services to include runId
6. Implement log batching and retry logic

### Phase 3: Verification & Testing
7. Implement smoke-test verification
8. Add runId grep verification commands
9. Test end-to-end logging flow

## Key Technical Details

### RunId Format
```
${timestamp}-${randomString(8)}-${environmentId}
```

### Log Entry Structure
```typescript
interface LogEntry {
  timestamp: string;
  level: string;
  component: string;
  message: string;
  runId?: string;
  data?: LogData;
  error?: Error;
}
```

### HTTP Interception Points
- Primary: `requestClientCredentialsToken()` in workerToken.ts
- Secondary: All `safeAnalyticsFetch()` calls
- Tertiary: Direct fetch() calls in MFA services

### Storage Schema Updates
```typescript
interface WorkerTokenData {
  // existing fields...
  runId: string;
  sessionStart: number;
}
```

## Verification Plan

### Smoke Test Steps
1. Load MFA Hub → verify runId generation
2. Get worker token → verify HTTP logging
3. Navigate to MFA feature → verify runId propagation
4. Perform MFA action → verify API call logging
5. Check server logs → verify runId correlation

### Grep Verification Commands
```bash
# Verify runId in server logs
grep "runId" server.log | tail -10

# Verify specific runId flow
grep "runId-xyz" server.log | jq '.'

# Check HTTP interception logs
grep "requestClientCredentialsToken" server.log
```

## Success Criteria

1. ✅ All PingOne API calls logged with runId
2. ✅ RunId persists across browser sessions
3. ✅ Server logs receive client logs with correlation
4. ✅ Performance impact < 50ms per request
5. ✅ No breaking changes to existing MFA flows
6. ✅ Comprehensive test coverage

## Risk Mitigation

### Performance
- Implement log batching (100 entries max)
- Use async logging where possible
- Add configurable log levels

### Privacy
- Redact sensitive headers (Authorization, client_secret)
- Implement log retention policies
- Add opt-out mechanisms

### Reliability
- Graceful fallback if server unavailable
- Local log backup with retry
- Circuit breaker for log shipping

## Next Steps

1. Review and approve this plan
2. Create implementation branches for each phase
3. Set up development environment with server.log endpoint
4. Begin Phase 1 implementation
5. Continuous testing after each phase
