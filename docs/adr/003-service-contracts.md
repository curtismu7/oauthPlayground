# ADR-003: Service Contract Preservation

## Status
Active

## Date
2026-03-02

## Context
During V7→V9 migration, there's a high risk of breaking existing functionality when updating services. We need a systematic approach to preserve service contracts while enabling modernization.

## Decision
Document and preserve all service contracts before any migration changes.

### Contract Preservation Strategy
```
1. Document current service interfaces
2. Identify breaking changes
3. Create migration-safe equivalents
4. Maintain backward compatibility
5. Gradual service replacement
```

### Contract Categories
- **Critical Services**: Cannot break (used by active flows)
- **Important Services**: Can enhance but must maintain compatibility
- **Version-Specific Services**: Can replace with migration path

## Consequences

### Positive
- ✅ Migration safety with documented contracts
- ✅ Clear API boundaries and expectations
- ✅ Ability to plan migration systematically
- ✅ Reduced risk of breaking changes
- ✅ Better testing and validation

### Negative
- ⚠️ Documentation maintenance overhead
- ⚠️ Increased initial planning effort
- ⚠️ More complex migration process

### Risks
- Documentation drift from implementation
- Over-engineering of service contracts
- Analysis paralysis from too much detail

## Implementation

### Service Documentation
Created comprehensive service contracts for:

#### V7 Services (23 total)
- **Critical (7)**: ComprehensiveCredentialsService, CopyButtonService, CredentialGuardService, FlowHeader, FlowUIService, UnifiedTokenDisplayService, v4ToastManager
- **Important (1)**: FlowCompletionService  
- **V7-Specific (4)**: V7SharedService, HybridFlowSharedService, useHybridFlowControllerV7, useResourceOwnerPasswordFlowV7

#### V8 Services (25+ total)
- **Core (5)**: WorkerTokenModalV8, WorkerTokenExpiryBannerV8, useCredentialStoreV8, TokenDisplayV8, JWTConfigV8
- **Locked (20+)**: Email V8, Device Code V8 services

#### V9 Services (15 total)
- **Critical (10)**: V9TokenService, V9StateStore, V9CredentialService, V9CredentialValidationService, V9WorkerTokenStatusService, V9AuthorizeService, V9IntrospectionService, V9UserInfoService, V9DeviceAuthorizationService, V9PKCEGenerationService
- **Supporting (5)**: V9SpecVersionService, V9OAuthErrorHandlingService, V9FlowCredentialService, V8ToV9WorkerTokenStatusAdapter, V9TokenGenerator

### Migration Rules

#### ✅ DO NOT BREAK
- Never remove props or methods used by active flows
- Never change prop types or method signatures
- Never change core behavior of critical services
- Always maintain backward compatibility during transition

#### ⚠️ CAN CHANGE  
- Add new props or methods (backward compatible)
- Improve performance without changing behavior
- Add new features as optional enhancements
- Update styling without affecting functionality

#### 🔄 MIGRATION PATH
- Complete V9 services before migration
- Test V9 services with existing flows
- Gradually migrate V7 → V9
- Replace V8 dependencies with V9
- Archive old services when safe

## Results

### Documentation Created
- `V7_V8_V9_SERVICES_CONTRACTS.md` - Complete service contracts
- `V7_TO_V9_MIGRATION_MAPPING.md` - Flow migration guide
- Individual ADRs for major decisions

### Migration Safety
- All service contracts documented
- Breaking changes identified
- Migration paths defined
- Risk mitigation strategies in place

### Development Experience
- Clear service boundaries
- Predictable migration process
- Reduced risk of regressions
- Better testing coverage

## Related Decisions
- [ADR-001: Multi-Version Service Architecture](001-multi-version-services.md)
- [ADR-002: Biome-First Code Quality](002-biome-first.md)

## Files Affected
- `V7_V8_V9_SERVICES_CONTRACTS.md` - Service documentation
- `V7_TO_V9_MIGRATION_MAPPING.md` - Flow mapping
- `docs/adr/` - Architecture decisions
- All service files across V7, V8, V9

## Notes
This decision proved crucial for safe migration. The comprehensive service contracts prevented breaking changes and provided clear migration guidance. The documentation effort was substantial but paid off in migration confidence and reduced risk.

## Future Considerations
- Maintain contracts as services evolve
- Consider automated contract testing
- Expand to other parts of codebase
- Review and update contracts periodically
