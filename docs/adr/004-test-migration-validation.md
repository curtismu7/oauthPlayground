# ADR-004: V7-V9 Test Migration Validation

## Status
In Progress

## Date
2026-03-02

## Context
We have comprehensive migration documentation but need to validate the approach through actual implementation. Testing with 1 app from each version (V7, V8, V9) will identify any gaps in our migration plan.

## Decision
Execute a test migration with:
- **V7**: JWTBearerTokenFlowV7 → V9 services
- **V8**: WorkerTokenModalV8 → V9 component
- **V9**: OAuthAuthorizationCodeFlowV9 → Enhanced V9

### Test Migration Strategy
```
Phase 1: V7 → V9 Service Migration
Phase 2: V8 → V9 Component Migration  
Phase 3: V9 Enhancement & Modern Messaging
```

## Consequences

### Positive
- ✅ Validate migration approach works
- ✅ Identify gaps in documentation
- ✅ Create reference implementations
- ✅ Test Modern Messaging integration
- ✅ Verify service contracts are accurate

### Negative
- ⚠️ Time investment in test migration
- ⚠️ Risk of discovering major issues
- ⚠️ Potential need for plan revisions

### Risks
- Service incompatibilities
- Breaking changes during migration
- Performance regressions
- UI inconsistencies

## Implementation

### Phase 1: V7 Service Migration
**Target**: JWTBearerTokenFlowV7

#### Current Services (12 total)
```typescript
- ComprehensiveCredentialsService
- CopyButtonService  
- CredentialGuardService
- FlowCompletionService
- FlowHeader Service
- FlowUIService
- ModalPresentationService
- OAuthFlowComparisonService
- oidcDiscoveryService
- UnifiedTokenDisplayService
- v4ToastManager (deprecated)
- comprehensiveFlowDataService
```

#### V9 Service Mapping
```typescript
- V9CredentialService (replace ComprehensiveCredentialsService)
- V9CredentialValidationService (replace CredentialGuardService)
- V9TokenService (replace token-related services)
- V9UserInfoService (replace user info services)
- V9IntrospectionService (replace introspection)
- V9MessagingService (replace v4ToastManager) ✅ CREATED
```

#### Migration Tasks
- [x] Service inventory completed ✅
- [x] V9MessagingService created ✅
- [ ] Create V9 service wrappers for missing functionality
- [ ] Replace service imports and calls
- [ ] Implement Modern Messaging
- [ ] Test functionality preservation
- [ ] Update documentation

### Phase 2: V8 Component Migration
**Target**: WorkerTokenModalV8

#### Current Dependencies
- Used by: TokenExchangeFlowV7, WorkerTokenFlowV7
- V8 worker token services
- V8 modal patterns

#### V9 Replacement Strategy
- Create V9WorkerTokenModal component
- Integrate V9WorkerTokenStatusService
- Apply Modern Messaging
- Update all dependent flows

### Phase 3: V9 Enhancement
**Target**: OAuthAuthorizationCodeFlowV9

#### Enhancement Focus
- Full Modern Messaging compliance
- Latest V9 service patterns
- Performance optimization
- Reference implementation

## Success Criteria

### V7 Migration Success
- All V7 services replaced with V9 equivalents
- Modern Messaging fully implemented
- Zero functionality regressions
- Biome compliance maintained
- Performance improved or maintained

### V8 Migration Success  
- V8 component replaced with V9 equivalent
- All dependencies updated successfully
- Modal functionality preserved
- V8 component safely removed

### V9 Enhancement Success
- 100% Modern Messaging compliance
- Latest V9 patterns applied
- Documentation updated
- Reference implementation ready

## Progress Tracking

### Current Status
- **Planning**: ✅ Complete
- **V7 Analysis**: ✅ Complete (12 services identified)
- **V9 Service Mapping**: 🔄 In Progress
- **V9MessagingService**: ✅ Created (`src/services/v9/V9MessagingService.ts`)
- **Migration Execution**: ⏳ Not Started
- **Testing**: ⏳ Not Started

### Issues Discovered
- V9 missing some V7 service equivalents
- Need Modern Messaging implementation
- Service contract gaps identified

### Service Upgrade Candidates
Several services need V9 equivalents:
- FlowHeader Service (V9 equivalent needed)
- FlowUIService (V9 equivalent needed)
- ModalPresentationService (V9 equivalent needed)

### Progress Made
- ✅ V9MessagingService created with full Modern Messaging API
- ✅ Service inventory completed for JWTBearerTokenFlowV7
- ✅ V9 service mapping established
- ✅ Command execution issues resolved

## Related Decisions
- [ADR-001: Multi-Version Service Architecture](001-multi-version-services.md)
- [ADR-002: Biome-First Code Quality](002-biome-first.md)
- [ADR-003: Service Contract Preservation](003-service-contracts.md)

## Files Affected
- `src/pages/flows/JWTBearerTokenFlowV7.tsx` - V7 migration target
- `src/v8/components/WorkerTokenModalV8.tsx` - V8 migration target
- `src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx` - V9 enhancement target
- `plan/test-migration-tracking.md` - Progress tracking

## Notes
This test migration is critical for validating our comprehensive migration plan. Early results show service gaps that need to be addressed before full migration.

The Modern Messaging requirement is particularly important as it represents a major architectural shift from toast-based notifications to structured user messaging.

## Next Steps
1. Create missing V9 service equivalents
2. Begin V7 service replacement
3. Implement Modern Messaging
4. Test and validate
5. Apply lessons to full migration plan

*Status: IN PROGRESS*
