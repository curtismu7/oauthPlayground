# Production Group Restore Guide

## Overview

This guide provides comprehensive instructions for restoring, resetting, and troubleshooting all flows in the **Production Group** section. It covers data restoration, configuration reset, and recovery procedures for production deployments.

## 📋 Table of Contents

- [Backup and Restore Overview](#backup-and-restore-overview)
- [Data Storage Locations](#data-storage-locations)
- [Restore Procedures](#restore-procedures)
- [Configuration Reset](#configuration-reset)
- [Troubleshooting](#troubleshooting)
- [Emergency Procedures](#emergency-procedures)

---

## 💾 Backup and Restore Overview

### Backup Types
- **Configuration Data**: Flow settings and preferences
- **User Data**: Saved credentials and tokens
- **Application State**: Current application state
- **Cache Data**: Browser and server caches

### Restore Scenarios
- **Data Loss**: Accidental data deletion
- **Configuration Issues**: Corrupted settings
- **Migration**: Moving between environments
- **Disaster Recovery**: System failure recovery

---

## 📁 Data Storage Locations

### Browser Storage
```typescript
// Local Storage Keys
const STORAGE_KEYS = {
  // Unified Worker Token Service
  'unified_worker_token': 'Worker token credentials and data',
  
  // Flow-Specific Credentials
  'v8u_unified_credentials': 'Unified flow credentials',
  'v8u_spiffe_credentials': 'SPIFFE flow credentials',
  'v8u_mfa_credentials': 'MFA flow credentials',
  
  // Application State
  'oauth_playground_credential_backup': 'Credential backup data',
  'sidebar_state': 'Navigation state',
  'theme_preferences': 'Theme settings',
  
  // Token Storage
  'worker_token': 'Legacy worker token',
  'access_token': 'Access token data',
  'refresh_token': 'Refresh token data'
};
```

### IndexedDB Storage
```typescript
// IndexedDB Databases
const INDEXED_DB = {
  'oauth_playground_unified': 'Main application database',
  'unified_worker_tokens': 'Worker token storage',
  'v8u_backup_db': 'V8U backup storage'
};
```

### Server Storage
```typescript
// Server Files
const SERVER_FILES = {
  'logs/server.log': 'Server application logs',
  'logs/pingone-api.log': 'PingOne API logs',
  'logs/client.log': 'Client-side logs',
  '.env': 'Environment configuration'
};
```

---

## 🔄 Restore Procedures

### 1. Browser Data Restore

#### Step 1: Clear Browser Data
```bash
# Clear browser cache and storage
# Chrome: Settings → Privacy → Clear browsing data
# Firefox: Settings → Privacy & Security → Clear Data
# Safari: Develop → Empty Caches
```

#### Step 2: Import Configuration Backup
```javascript
// Import from backup file
const importBackup = (backupData) => {
  try {
    const parsed = JSON.parse(backupData);
    
    // Restore unified worker token
    if (parsed.unifiedWorkerToken) {
      localStorage.setItem('unified_worker_token', 
        JSON.stringify(parsed.unifiedWorkerToken));
    }
    
    // Restore flow credentials
    if (parsed.flowCredentials) {
      Object.entries(parsed.flowCredentials).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
    }
    
    console.log('✅ Browser data restored successfully');
  } catch (error) {
    console.error('❌ Failed to restore browser data:', error);
  }
};
```

#### Step 3: Verify Restore
```javascript
// Verify data restoration
const verifyRestore = () => {
  const checks = {
    workerToken: !!localStorage.getItem('unified_worker_token'),
    unifiedCredentials: !!localStorage.getItem('v8u_unified_credentials'),
    backupData: !!localStorage.getItem('oauth_playground_credential_backup')
  };
  
  console.log('🔍 Restore verification:', checks);
  return Object.values(checks).every(Boolean);
};
```

### 2. Server Configuration Restore

#### Step 1: Restore Environment File
```bash
# Restore from backup
cp .env.production-backup .env

# Verify permissions
chmod 600 .env
```

#### Step 2: Restart Server
```bash
# Stop current server
pkill -f "node server.js"

# Start server
npm run dev
```

#### Step 3: Verify Server State
```bash
# Check server logs
tail -f logs/server.log

# Check API connectivity
curl http://localhost:3000/api/health
```

### 3. Database Restore

#### Step 1: Clear IndexedDB
```javascript
// Clear all IndexedDB databases
const clearIndexedDB = async () => {
  const databases = [
    'oauth_playground_unified',
    'unified_worker_tokens',
    'v8u_backup_db'
  ];
  
  for (const dbName of databases) {
    await indexedDB.deleteDatabase(dbName);
  }
  
  console.log('✅ IndexedDB cleared');
};
```

#### Step 2: Restore from Backup
```javascript
// Restore from backup service
const restoreFromBackup = async () => {
  try {
    const { IndexedDBBackupServiceV8U } = window;
    
    // Restore unified worker tokens
    const workerTokenBackup = await IndexedDBBackupServiceV8U.load('unified_worker_token');
    if (workerTokenBackup) {
      await unifiedWorkerTokenService.saveCredentials(workerTokenBackup);
    }
    
    // Restore flow credentials
    const flowCredentialsBackup = await IndexedDBBackupServiceV8U.load('v8u_unified_credentials');
    if (flowCredentialsBackup) {
      await CredentialsServiceV8.saveCredentials('unified', flowCredentialsBackup);
    }
    
    console.log('✅ Database restore completed');
  } catch (error) {
    console.error('❌ Database restore failed:', error);
  }
};
```

---

## ⚙️ Configuration Reset

### 1. Factory Reset
```javascript
// Reset to factory defaults
const factoryReset = async () => {
  // Clear all storage
  localStorage.clear();
  await clearIndexedDB();
  
  // Reset application state
  window.location.reload();
};
```

### 2. Selective Reset
```javascript
// Reset specific data types
const selectiveReset = {
  // Clear only tokens
  tokens: () => {
    localStorage.removeItem('unified_worker_token');
    localStorage.removeItem('worker_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  
  // Clear credentials
  credentials: () => {
    localStorage.removeItem('v8u_unified_credentials');
    localStorage.removeItem('v8u_spiffe_credentials');
    localStorage.removeItem('v8u_mfa_credentials');
  },
  
  // Clear application state
  state: () => {
    localStorage.removeItem('oauth_playground_credential_backup');
    localStorage.removeItem('sidebar_state');
    localStorage.removeItem('theme_preferences');
  }
};
```

### 3. Configuration Reset
```javascript
// Reset configuration to defaults
const resetConfiguration = {
  // Reset unified flow settings
  unifiedFlow: () => {
    const defaultConfig = {
      flowType: 'oauth-authz',
      specVersion: 'oidc',
      environmentId: '',
      clientId: '',
      redirectUri: 'http://localhost:3000/authz-callback'
    };
    
    localStorage.setItem('v8u_unified_credentials', 
      JSON.stringify(defaultConfig));
  },
  
  // Reset MFA settings
  mfaSettings: () => {
    const defaultMFA = {
      preferredMethod: 'sms',
      deviceManagement: true,
      oneTimeDevices: false
    };
    
    localStorage.setItem('v8u_mfa_settings', 
      JSON.stringify(defaultMFA));
  }
};
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: Worker Token Not Loading
```javascript
// Diagnosis
const diagnoseWorkerToken = () => {
  const checks = {
    localStorage: !!localStorage.getItem('unified_worker_token'),
    indexedDB: checkIndexedDB('unified_worker_tokens'),
    memoryCache: checkMemoryCache(),
    serviceAvailable: !!window.unifiedWorkerTokenService
  };
  
  console.log('🔍 Worker token diagnosis:', checks);
  return checks;
};

// Fix
const fixWorkerToken = async () => {
  // Try legacy storage migration
  const legacyToken = localStorage.getItem('worker_token');
  if (legacyToken) {
    await unifiedWorkerTokenService.saveCredentials(
      JSON.parse(legacyToken)
    );
  }
  
  // Clear and retry
  localStorage.removeItem('unified_worker_token');
  await unifiedWorkerTokenService.loadCredentials();
};
```

#### Issue: Flow Credentials Missing
```javascript
// Diagnosis
const diagnoseCredentials = (flowKey) => {
  const checks = {
    localStorage: !!localStorage.getItem(`v8u_${flowKey}_credentials`),
    indexedDB: checkIndexedDB(`v8u_${flowKey}_credentials`),
    backup: checkBackup(flowKey),
    serviceAvailable: !!window.CredentialsServiceV8
  };
  
  console.log(`🔍 ${flowKey} credentials diagnosis:`, checks);
  return checks;
};

// Fix
const fixCredentials = async (flowKey) => {
  // Try backup restoration
  const backup = await loadBackup(flowKey);
  if (backup) {
    await CredentialsServiceV8.saveCredentials(flowKey, backup);
  }
  
  // Try legacy storage
  const legacyKey = `v8:${flowKey}_credentials`;
  const legacyData = localStorage.getItem(legacyKey);
  if (legacyData) {
    await CredentialsServiceV8.saveCredentials(flowKey, JSON.parse(legacyData));
  }
};
```

#### Issue: Pre-flight Validation Failing
```javascript
// Diagnosis
const diagnosePreflight = async () => {
  try {
    const { PreFlightValidationServiceV8 } = await import('@/v8/services/preFlightValidationServiceV8');
    const workerToken = await workerTokenServiceV8.getToken();
    
    const checks = {
      serviceAvailable: !!PreFlightValidationServiceV8,
      workerTokenAvailable: !!workerToken,
      credentialsValid: !!workerTokenServiceV8.loadCredentials()
    };
    
    console.log('🔍 Pre-flight diagnosis:', checks);
    return checks;
  } catch (error) {
    console.error('❌ Pre-flight diagnosis failed:', error);
    return null;
  }
};

// Fix
const fixPreflight = async () => {
  // Ensure worker token is available
  const credentials = await workerTokenServiceV8.loadCredentials();
  if (!credentials) {
    throw new Error('No worker token credentials found');
  }
  
  // Test pre-flight service
  const { PreFlightValidationServiceV8 } = await import('@/v8/services/preFlightValidationServiceV8');
  const result = await PreFlightValidationServiceV8.validateOAuthConfig({
    specVersion: 'oauth2.0',
    flowType: 'client-credentials',
    credentials,
    workerToken: await workerTokenServiceV8.getToken()
  });
  
  console.log('✅ Pre-flight validation result:', result);
};
```

---

## 🚨 Emergency Procedures

### Complete System Reset
```bash
# Emergency reset script
#!/bin/bash

echo "🚨 EMERGENCY RESET IN PROGRESS..."

# 1. Stop all services
pkill -f "node server.js"
pkill -f "npm run dev"

# 2. Clear all browser data
echo "Clearing browser data..."
# Manual step: Clear browser cache and storage

# 3. Reset server configuration
echo "Resetting server configuration..."
cp .env.example .env

# 4. Clear logs
echo "Clearing logs..."
> logs/server.log
> logs/pingone-api.log
> logs/client.log

# 5. Restart services
echo "Restarting services..."
npm run dev

echo "✅ Emergency reset completed"
```

### Data Recovery from Backup
```javascript
// Emergency data recovery
const emergencyRecovery = async (backupData) => {
  try {
    console.log('🚨 Starting emergency data recovery...');
    
    // Validate backup data
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Invalid backup data');
    }
    
    // Priority 1: Restore worker token (critical)
    if (backupData.unifiedWorkerToken) {
      await unifiedWorkerTokenService.saveCredentials(
        backupData.unifiedWorkerToken
      );
      console.log('✅ Worker token restored');
    }
    
    // Priority 2: Restore flow credentials
    if (backupData.flowCredentials) {
      for (const [flowKey, credentials] of Object.entries(backupData.flowCredentials)) {
        await CredentialsServiceV8.saveCredentials(flowKey, credentials);
      }
      console.log('✅ Flow credentials restored');
    }
    
    // Priority 3: Restore application state
    if (backupData.applicationState) {
      Object.entries(backupData.applicationState).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      console.log('✅ Application state restored');
    }
    
    console.log('✅ Emergency recovery completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Emergency recovery failed:', error);
    return false;
  }
};
```

### Service Recovery
```javascript
// Service recovery procedures
const recoverServices = async () => {
  const services = [
    'unifiedWorkerTokenService',
    'CredentialsServiceV8',
    'PreFlightValidationServiceV8',
    'tokenMonitoringService'
  ];
  
  for (const serviceName of services) {
    try {
      const service = await import(`@/services/${serviceName}`);
      console.log(`✅ ${serviceName} recovered`);
    } catch (error) {
      console.error(`❌ ${serviceName} recovery failed:`, error);
    }
  }
};
```

---

## 📋 Verification Checklist

### Post-Restore Verification
- [ ] Browser data restored correctly
- [ ] Worker token available and valid
- [ ] Flow credentials loaded
- [ ] Pre-flight validation working
- [ ] UI components rendering correctly
- [ ] API connectivity restored
- [ ] Error handling functional
- [ ] Loading states working
- [ ] Responsive design intact

### Functionality Tests
- [ ] Unified OAuth flow works
- [ ] SPIFFE mock flow works
- [ ] MFA flows work
- [ ] Utility flows work
- [ ] Token generation works
- [ ] Pre-flight validation works
- [ ] Error handling works

### Security Verification
- [ ] HTTPS enforcement
- [ ] Token validation working
- [ ] Credential encryption
- [ ] CSRF protection
- [ ] Input validation
- [ ] Error message sanitization

---

## 📞 Support Resources

### Documentation
- [Production Group Flows Documentation](./PRODUCTION_GROUP_FLOWS_DOCUMENTATION.md)
- [UI Contract Documentation](./PRODUCTION_GROUP_UI_CONTRACT.md)
- [API Reference](./API_REFERENCE.md)
- [Security Guidelines](./SECURITY_GUIDELINES.md)

### Support Channels
- **Console Logging**: Check browser console for detailed error information
- **Server Logs**: Review `logs/server.log` for server-side issues
- **Community Support**: Check GitHub issues and discussions
- **Documentation**: Refer to comprehensive documentation

### Contact Information
- **Technical Support**: Provide detailed error logs and reproduction steps
- **Bug Reports**: Use GitHub issue templates for bug reporting
- **Feature Requests**: Submit feature requests through proper channels
- **Security Issues**: Report security vulnerabilities through secure channels

---

## 📝 Version Information

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-22  
**Status:** Active for Production Group flows

### Version History
- **v1.0.0**: Initial restore guide for Production Group
- **v0.9.0**: Beta testing feedback incorporation
- **v0.8.0**: Alpha release with core restore procedures

---

*This restore guide ensures that Production Group flows can be quickly recovered from data loss, configuration issues, or system failures. For specific restore scenarios, refer to the detailed procedures above.*
