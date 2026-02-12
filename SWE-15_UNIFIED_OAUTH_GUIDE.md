# SWE-15 Unified OAuth Development Guide

**Last Updated**: February 11, 2026  
**Version**: 1.0.0  
**Purpose**: SWE-15 compliance guide for Unified OAuth flow development

---

## 🎯 SWE-15 Principles for Unified OAuth

### 1. Single Responsibility Principle
- **API Call Tracking**: Each API call should be tracked exactly once
- **Service Separation**: Clear separation between V8 services and V8U integration
- **Component Focus**: Each component should have a single, well-defined responsibility

### 2. Open/Closed Principle  
- **Extension Points**: Allow extension of OAuth flows without modifying core logic
- **Plugin Architecture**: Service interfaces should be open for extension
- **Configuration**: Behavior modification through configuration, not code changes

### 3. Liskov Substitution Principle
- **Service Interfaces**: V8U services should be substitutable for V8 services
- **Flow Compatibility**: All OAuth flows should follow the same interface patterns
- **API Consistency**: Consistent API patterns across all flow types

### 4. Interface Segregation Principle
- **Focused Interfaces**: Small, focused service interfaces
- **Flow-Specific**: Separate interfaces for different OAuth flow types
- **Minimal Dependencies**: Services should depend only on interfaces they use

### 5. Dependency Inversion Principle
- **Abstract Dependencies**: Depend on abstractions, not concrete implementations
- **Service Injection**: Use dependency injection for service dependencies
- **Configuration Injection**: Inject configuration rather than hard-coding values

---

## 🔍 Common Issues and Prevention

### Issue 1: API Call Duplication

**🎯 Problem**: API documentation page shows duplicate API calls (e.g., 2 `/token` calls for 1 actual token)

**🔍 Root Cause**: Multiple services tracking the same API call
- `unifiedFlowIntegrationV8U.ts` tracks token exchange
- `oauthIntegrationServiceV8.ts` also tracks the same token exchange
- Both services call `apiCallTrackerService.trackApiCall()` for the same endpoint

**🛡️ SWE-15 Solution**:
```typescript
// ❌ ANTI-PATTERN: Duplicate tracking
// In unifiedFlowIntegrationV8U.ts
const callId = apiCallTrackerService.trackApiCall({...});
await OAuthIntegrationServiceV8.exchangeCodeForTokens(...);

// In oauthIntegrationServiceV8.ts  
const callId = apiCallTrackerService.trackApiCall({...});
// Make actual API call

// ✅ SWE-15 COMPLIANT: Single tracking point
// In unifiedFlowIntegrationV8U.ts
const callId = apiCallTrackerService.trackApiCall({...});
await OAuthIntegrationServiceV8.exchangeCodeForTokens(callId);

// In oauthIntegrationServiceV8.ts
export async function exchangeCodeForTokens(
  credentials: OAuthCredentials,
  code: string,
  trackerCallId?: string // Optional tracking ID
) {
  // Use existing tracking ID if provided
  if (trackerCallId) {
    // Update existing call instead of creating new one
    apiCallTrackerService.updateApiCallResponse(trackerCallId, response);
  } else {
    // Create new tracking only if not already tracked
    const callId = apiCallTrackerService.trackApiCall({...});
  }
}
```

### Issue 3: Token Monitoring Integration

**🎯 Problem**: Token monitoring pages are not tracking user tokens (access, refresh, ID tokens)
- `/v8u/token-monitoring` - Token monitoring dashboard
- `/v8u/enhanced-state-management` - Enhanced state management dashboard

**🔍 Root Cause**: Unified flow integration service obtains tokens but doesn't add them to TokenMonitoringService
- `unifiedFlowIntegrationV8U.ts` calls `OAuthIntegrationServiceV8.exchangeCodeForTokens()` successfully
- Tokens are returned but not passed to `TokenMonitoringService.addOAuthTokens()`
- Both pages call `TokenMonitoringService.getInstance().getAllTokens()` correctly but no user tokens exist to retrieve

**🛡️ SWE-15 Solution**:
```typescript
// ❌ ANTI-PATTERN: Tokens not tracked
// In unifiedFlowIntegrationV8U.ts
const result = await OAuthIntegrationServiceV8.exchangeCodeForTokens(
  oauthCredentials,
  code,
  codeVerifier || ''
);
return result; // Tokens obtained but not tracked

// ✅ SWE-15 COMPLIANT: Track tokens after successful exchange
// In unifiedFlowIntegrationV8U.ts
const result = await OAuthIntegrationServiceV8.exchangeCodeForTokens(
  oauthCredentials,
  code,
  codeVerifier || ''
);

// Track tokens in monitoring service for both pages
if (result.access_token) {
  const { TokenMonitoringService } = await import('./tokenMonitoringService');
  const tokenService = TokenMonitoringService.getInstance();
  tokenService.addOAuthTokens(result, 'unified-oauth', flowKey);
  
  logger.info(`🔄 TRACKING: Added OAuth tokens to monitoring service`, {
    hasAccessToken: !!result.access_token,
    hasRefreshToken: !!result.refresh_token,
    hasIdToken: !!result.id_token,
    flowKey
  });
}

return result;
```

---

## 📋 Prevention Commands

### API Call Duplication Prevention

```bash
# === API CALL DUPLICATION PREVENTION ===
# 1. Check for duplicate API call tracking
echo "🔍 CHECKING API CALL DUPLICATION:"
grep -rn "trackApiCall.*token" src/v8u/services/ src/v8/services/ --include="*.ts" | grep -v test && echo "⚠️  MULTIPLE TOKEN TRACKING FOUND" || echo "✅ NO DUPLICATE TOKEN TRACKING"

# 2. Check for OAuthIntegrationServiceV8 tracking
grep -rn "trackApiCall" src/v8/services/oauthIntegrationServiceV8.ts && echo "❌ OAUTH SERVICE TRACKING API CALLS" || echo "✅ OAUTH SERVICE NOT TRACKING"

# 3. Check unified flow integration tracking
grep -rn "trackApiCall" src/v8u/services/unifiedFlowIntegrationV8U.ts | wc -l && echo "UNIFIED FLOW TRACKING CALLS"

# 4. Verify tracking ID passing patterns
grep -rn "trackerCallId\|trackingId" src/v8/services/ --include="*.ts" && echo "✅ TRACKING ID PATTERNS FOUND" || echo "❌ MISSING TRACKING ID PATTERNS"

# 5. Check for apiCallTrackerService imports
grep -rn "apiCallTrackerService.*import" src/v8/ --include="*.ts" --include="*.tsx" | wc -l && echo "API CALL TRACKER IMPORTS"
```

### Component Size Prevention

```bash
# === COMPONENT SIZE PREVENTION ===
# 6. Check component line counts
echo "🔍 CHECKING COMPONENT SIZES:"
wc -l src/v8u/components/UnifiedFlowSteps.tsx && echo "UnifiedFlowSteps lines"
wc -l src/v8u/flows/UnifiedOAuthFlowV8U.tsx && echo "UnifiedOAuthFlow lines"

# 7. Check for component composition opportunities
grep -rn "export.*Component" src/v8u/components/ --include="*.tsx" | wc -l && echo "V8U COMPONENT COUNT"

# 8. Verify service dependency complexity
find src/v8u/services -name "*.ts" -exec wc -l {} + | sort -nr | head -5 && echo "LARGEST V8U SERVICES"

# === TOKEN MONITORING INTEGRATION PREVENTION ===
# 9. Check for token tracking in unified flow integration
echo "🔍 CHECKING TOKEN MONITORING INTEGRATION:"
grep -rn "addOAuthTokens\|TokenMonitoringService.*addToken" src/v8u/services/unifiedFlowIntegrationV8U.ts && echo "✅ TOKEN TRACKING FOUND" || echo "❌ MISSING TOKEN TRACKING"

# 10. Verify token monitoring service usage in both pages
echo "Checking TokenMonitoringPage:"
grep -rn "TokenMonitoringService.*getAllTokens" src/v8u/pages/TokenMonitoringPage.tsx && echo "✅ TOKEN MONITORING PAGE USAGE FOUND" || echo "❌ MISSING TOKEN MONITORING PAGE USAGE"
echo "Checking EnhancedStateManagementPage:"
grep -rn "TokenMonitoringService.*getAllTokens" src/v8u/pages/EnhancedStateManagementPage.tsx && echo "✅ ENHANCED STATE MANAGEMENT PAGE USAGE FOUND" || echo "❌ MISSING ENHANCED STATE MANAGEMENT PAGE USAGE"

# 11. Check for OAuth token tracking patterns
grep -rn "access_token.*refresh_token.*id_token" src/v8u/services/ --include="*.ts" | head -3 && echo "✅ OAUTH TOKEN PATTERNS FOUND" || echo "❌ MISSING OAUTH TOKEN PATTERNS"

# 12. Verify token exchange result handling
grep -A 10 -B 5 "exchangeCodeForTokens" src/v8u/services/unifiedFlowIntegrationV8U.ts | grep -E "result\.|addOAuthTokens|TokenMonitoring" && echo "✅ TOKEN EXCHANGE RESULT HANDLING FOUND" || echo "❌ MISSING TOKEN EXCHANGE HANDLING"

# 13. Check for flow key tracking
grep -rn "flowKey\|flow.*key" src/v8u/services/unifiedFlowIntegrationV8U.ts | head -3 && echo "✅ FLOW KEY TRACKING FOUND" || echo "❌ MISSING FLOW KEY TRACKING"

# 14. Verify token monitoring service method calls
grep -rn "getInstance.*addToken\|addOAuthTokens" src/v8u/services/ --include="*.ts" && echo "✅ TOKEN MONITORING METHOD CALLS FOUND" || echo "❌ MISSING TOKEN MONITORING METHOD CALLS"

# 15. Check for token filtering in enhanced state management
grep -rn "filter.*type.*access_token\|filter.*type.*refresh_token\|filter.*type.*id_token" src/v8u/pages/EnhancedStateManagementPage.tsx && echo "✅ TOKEN FILTERING FOUND" || echo "❌ MISSING TOKEN FILTERING"
```

---

## 🎯 Development Guidelines

### API Call Tracking Rules

1. **Single Point of Tracking**: Each API call should be tracked exactly once
2. **Pass Tracking IDs**: Pass tracking IDs to downstream services
3. **Avoid Double Tracking**: Don't track in both integration and core services
4. **Use Conditional Tracking**: Track only if not already tracked

### Token Monitoring Rules

1. **Track All User Tokens**: All OAuth tokens (access, refresh, ID) must be tracked in TokenMonitoringService
2. **Track After Exchange**: Call `TokenMonitoringService.addOAuthTokens()` immediately after successful token exchange
3. **Include Flow Context**: Pass flow type and flow key for proper token categorization
4. **Worker Token Sync**: Ensure worker tokens are synchronized with monitoring service

### Component Size Rules

1. **2,000 Line Limit**: Components should not exceed 2,000 lines
2. **Single Responsibility**: Each component should have one clear purpose
3. **Component Composition**: Break large components into smaller, focused components
4. **Service Delegation**: Move complex logic to services

### Service Design Rules

1. **Interface Segregation**: Small, focused service interfaces
2. **Dependency Injection**: Inject dependencies rather than creating them
3. **Configuration External**: Keep configuration external to services
4. **Error Handling**: Consistent error handling patterns

---

## 📚 Related Documentation

- **Unified OAuth Inventory**: `/Users/cmuir/P1Import-apps/oauth-playground/UNIFIED_OAUTH_INVENTORY.md`
- **Unified MFA Guide**: `/Users/cmuir/P1Import-apps/oauth-playground/SWE-15_UNIFIED_MFA_GUIDE.md`
- **API Call Tracker**: `/Users/cmuir/P1Import-apps/oauth-playground/src/services/apiCallTrackerService.ts`
- **Token Monitoring**: `/Users/cmuir/P1Import-apps/oauth-playground/src/v8u/services/tokenMonitoringService.ts`

---

## 🔧 Implementation Checklist

### Before Making Changes

- [ ] Run API call duplication prevention commands
- [ ] Check component sizes against SWE-15 limits
- [ ] Verify service dependency patterns
- [ ] Review interface segregation compliance

### After Making Changes

- [ ] Re-run all prevention commands
- [ ] Test API call tracking in documentation page
- [ ] Verify component functionality
- [ ] Update relevant inventory documentation

### Code Review Checklist

- [ ] No duplicate API call tracking
- [ ] Components under 2,000 lines
- [ ] Services follow SWE-15 principles
- [ ] Proper error handling patterns
- [ ] Configuration externalization
- [ ] Interface segregation compliance

---

**📋 Maintenance Notes:**
- This guide should be updated whenever new OAuth flows are added
- Prevention commands should be run after any OAuth service changes
- Component sizes should be monitored monthly
- API call tracking patterns should be reviewed quarterly
