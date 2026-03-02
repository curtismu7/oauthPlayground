# ADR-001: Multi-Version Service Architecture

## Status
Active

## Date
2026-03-02

## Context
The OAuth Playground application has evolved through multiple versions (V7, V8, V9) with overlapping service dependencies. We need to maintain functionality during migration while ensuring clean separation of concerns.

## Decision
Implement version-specific services with clear contracts and migration paths.

### Architecture
```
src/
├── services/
│   ├── v7/          # Legacy services (maintain compatibility)
│   ├── v8/          # Transitional services (migration dependencies)
│   └── v9/          # Modern services (target architecture)
```

### Service Categories
- **Critical Services**: Must maintain backward compatibility
- **Version-Specific Services**: Create V9 equivalents
- **Legacy Services**: Archive after migration

## Consequences

### Positive
- ✅ Safe migration without breaking changes
- ✅ Clear service boundaries and contracts
- ✅ Ability to test migration incrementally
- ✅ Preserved functionality during transition

### Negative
- ⚠️ Increased complexity during transition
- ⚠️ Multiple service versions to maintain
- ⚠️ Documentation overhead

### Risks
- Service version drift
- Migration dependency conflicts
- Legacy service accumulation

## Implementation

### Phase 1: Service Inventory
- Document all V7 services used by side menu flows
- Identify V8 dependencies
- Complete V9 service implementations

### Phase 2: Migration Preparation
- Create service contracts
- Implement V9 equivalents
- Test compatibility

### Phase 3: Gradual Migration
- Update V7 flows to use V9 services
- Replace V8 dependencies
- Maintain backward compatibility

### Phase 4: Cleanup
- Archive unused V7 services
- Remove V8 dependencies
- Update documentation

## Related Decisions
- [ADR-002: Biome-First Code Quality](002-biome-first.md)
- [ADR-003: Service Contract Preservation](003-service-contracts.md)

## Files Affected
- `src/services/v7/` - Legacy services
- `src/services/v8/` - Transitional services  
- `src/services/v9/` - Modern services
- `V7_V8_V9_SERVICES_CONTRACTS.md` - Service documentation

## Notes
This decision enables safe migration while maintaining functionality. The multi-version approach provides flexibility during the transition period.
