# Cross-App Service Dependency Management

## 🎯 Overview

This document describes the cross-app service dependency management system that helps identify which apps are impacted when services are updated in the modular app architecture.

## 🏗️ Architecture

```
src/
├── apps/
│   ├── oauth/     # OAuth-specific components and services
│   ├── mfa/       # MFA-specific components and services  
│   ├── flows/     # Flow management components
│   └── unified/   # Unified app components
└── shared/
    ├── services/  # Shared services
    ├── types/     # Shared types
    ├── config/    # Shared configuration
    └── design/    # Shared design system
```

## 🔧 Cross-App Service Checker

A command-line tool that analyzes service dependencies across all apps and provides impact analysis for service updates.

### 📦 Available Commands

```bash
# Show overall dependency summary
npm run check:services

# Check impact of updating a specific service
npm run check:service -- <serviceName>

# Show services used by a specific app
npm run check:app -- <appName>

# List all services and their dependencies
npm run check:services:list

# List all apps and their dependencies
npm run check:apps:list

# Generate detailed dependency report
npm run check:services:report
```

### 🚨 High-Risk Services

Services used by 3+ apps are considered high-risk:

- **unifiedFlowLoggerServiceV8U** (4 apps)
- **specVersionServiceV8** (3 apps)

## 📋 Service Update Workflow

### Before Updating a Service

1. **Check Impact:**
   ```bash
   npm run check:service -- <serviceName>
   ```

2. **Review Affected Apps:**
   - Note which apps will be impacted
   - Check if affected apps have test directories
   - Identify specific files that use the service

3. **Plan Testing Strategy:**
   - Run tests for each affected app
   - Plan manual testing for apps without tests
   - Consider rollback strategy

### During Service Update

1. **Make Changes:**
   - Update the service implementation
   - Maintain backward compatibility if possible
   - Update service version if API changes

2. **Update Documentation:**
   - Document API changes
   - Update service version in package.json
   - Note breaking changes

### After Service Update

1. **Verify Build:**
   ```bash
   npm run build
   ```

2. **Run Tests:**
   ```bash
   npm run test
   # Or run specific app tests
   ```

3. **Test Affected Apps:**
   - Test functionality in each affected app
   - Verify cross-app integrations work
   - Check for regressions

4. **Update Documentation:**
   - Update service documentation
   - Update affected app documentation
   - Update master prompts document

## 📊 Service Categories

### 🟢 App-Specific Services
- Live in `src/apps/{app}/services/`
- Only used by their respective app
- Low risk for cross-app impact

### 🟡 Shared Services
- Live in `src/shared/services/`
- Used by multiple apps
- Medium to high risk for cross-app impact

### 🔴 Legacy Services
- Live in `src/v8/services/`
- Used across apps
- High risk - consider migrating to shared structure

## 🎯 Best Practices

### Service Design
1. **Version Your Services:** Use semantic versioning
2. **Maintain Compatibility:** Avoid breaking changes when possible
3. **Document APIs:** Clear documentation for service interfaces
4. **Write Tests:** Comprehensive test coverage for services

### Service Updates
1. **Check Dependencies First:** Always run impact analysis
2. **Test Thoroughly:** Test all affected apps
3. **Update Documentation:** Keep docs in sync with code
4. **Communicate Changes:** Notify team of service updates

### Risk Mitigation
1. **Feature Flags:** Use feature flags for risky changes
2. **Gradual Rollout:** Deploy changes incrementally
3. **Monitoring:** Monitor service health after updates
4. **Rollback Plan:** Have rollback strategy ready

## 📈 Dependency Report

Generate a comprehensive dependency report:

```bash
npm run check:services:report
```

This creates `service-dependency-report.json` with:
- Service dependency mapping
- Risk level assessment
- App dependency analysis
- High-risk service identification

## 🔍 Examples

### Example 1: Updating MFA Service
```bash
# Check impact
npm run check:service -- mfaServiceV8

# Output shows:
# - 1 app affected (mfa)
# - 12 files using the service
# - No test directory found
```

### Example 2: Updating Shared Service
```bash
# Check impact
npm run check:service -- specVersionServiceV8

# Output shows:
# - 3 apps affected (oauth, mfa, flows)
# - High-risk service
# - Multiple files across apps
```

### Example 3: Checking App Dependencies
```bash
# Check MFA app dependencies
npm run check:app -- mfa

# Output shows:
# - 51 services used by MFA app
# - Mix of shared and app-specific services
# - High dependency count
```

## 🚨 Emergency Procedures

### Service Update Breaks Apps
1. **Stop Deployment:** Immediately stop any ongoing deployments
2. **Assess Impact:** Use checker to identify affected apps
3. **Rollback:** Revert service changes if necessary
4. **Test:** Verify rollback fixes issues
5. **Communicate:** Notify team of issues and resolution

### Critical Service Failure
1. **Identify Service:** Determine which service is failing
2. **Check Dependencies:** Find all apps using the service
3. **Implement Fix:** Apply emergency fix or rollback
4. **Verify:** Test all affected apps
5. **Monitor:** Watch for continued issues

## 📚 Additional Resources

- [Master Prompts Document](../master3-prompts.with-all-inventories.regression-hardened.md)
- [Modular Architecture Guide](../SRC_CLEANUP_SIMPLIFIED_PLAN.md)
- [Service Registry Documentation](../src/services/serviceRegistry.ts)

## 🔄 Maintenance

- **Regular Scans:** Run dependency checks weekly
- **Report Updates:** Keep dependency reports current
- **Documentation:** Update docs when architecture changes
- **Tool Updates:** Maintain and improve checker tool

---

*Last Updated: 2025-02-19*
*Version: 1.0*
