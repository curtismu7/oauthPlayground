# LOCALHOST MIGRATION GUIDELINES - Production-Ready URL Configuration

**Date:** March 2, 2026  
**Status:** 🚨 **IMMEDIATE IMPLEMENTATION REQUIRED**  
**Priority:** 🔴 **CRITICAL** - Prevents production deployment issues  
**Applies to:** All V7→V9 migrations and new development

---

## 🚨 **CRITICAL ISSUE: HARDCODED LOCALHOST URLs**

### **Problem Statement**
Many flows and services contain hardcoded `localhost:3000` URLs that will fail in production environments. These MUST be migrated to use dynamic, environment-aware URL configuration.

### **Impact Assessment**
- ❌ **Production Failures**: Hardcoded localhost URLs will break in customer domains
- ❌ **Customer Deployment Issues**: Customers cannot use localhost URLs in their environments
- ❌ **SSL Certificate Problems**: localhost certificates won't work for customer domains
- ❌ **Proxy Configuration Failures**: Backend services won't be reachable from customer domains

---

## � **MANDATORY HTTPS AND PORT CONFIGURATION**

### **Rule #3: ALWAYS USE HTTPS**
**FORBIDDEN PATTERNS:**
```typescript
// ❌ FORBIDDEN - HTTP URLs
const baseUrl = 'http://localhost:3000';
const apiUrl = 'http://localhost:3001/api';
const redirectUri = 'http://localhost:3000/callback';

// ❌ FORBIDDEN - Protocol-relative URLs
const baseUrl = '//localhost:3000';
const apiUrl = '//localhost:3001/api';
```

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED - Always HTTPS
const getBaseUrl = () => {
  const protocol = 'https'; // ALWAYS HTTPS
  const host = window.location.host;
  return `${protocol}//${host}`;
};

const redirectUri = `${getBaseUrl()}/callback`;
const apiUrl = `${getBaseUrl()}/api`;
```

### **Rule #4: STANDARDIZED PORT CONFIGURATION**
**FORBIDDEN PATTERNS:**
```typescript
// ❌ FORBIDDEN - Dynamic or incorrect ports
const port = process.env.PORT || 3001;
const baseUrl = `https://localhost:${port}`;

// ❌ FORBIDDEN - Mixed port usage
const frontendPort = 3001;
const backendPort = 3000;
```

**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED - Standardized ports
const FRONTEND_PORT = 3000;  // ALWAYS 3000 for frontend
const BACKEND_PORT = 3001;   // ALWAYS 3001 for backend

// Frontend configuration
const frontendUrl = `https://localhost:${FRONTEND_PORT}`;

// Backend configuration  
const backendUrl = `https://localhost:${BACKEND_PORT}`;
const apiUrl = `${backendUrl}/api`;
```

---

## � **MANDATORY MIGRATION RULES**

### **Rule #1: NO HARDCODED LOCALHOST URLS**
**FORBIDDEN PATTERNS:**
```typescript
// ❌ FORBIDDEN - Hardcoded localhost
const redirectUri = 'https://localhost:3000/callback';
const apiUrl = 'http://localhost:3001/api';
const baseUrl = 'https://localhost:3000';

// ❌ FORBIDDEN - Mixed localhost/production
const callbackUrl = process.env.NODE_ENV === 'production' 
  ? 'https://customer-domain.com/callback' 
  : 'https://localhost:3000/callback';
```

### **Rule #2: USE ENVIRONMENT-AWARE URL CONFIGURATION**
**REQUIRED PATTERNS:**
```typescript
// ✅ REQUIRED - Dynamic URL configuration
const getBaseUrl = () => {
  const protocol = 'https'; // ALWAYS HTTPS
  const host = window.location.host;
  return `${protocol}//${host}`;
};

const redirectUri = `${getBaseUrl()}/callback`;
const apiUrl = `${getBaseUrl()}/api`;
```

---

## 🔧 **IMPLEMENTATION PATTERNS**

### **Pattern 1: Dynamic Base URL Service**
```typescript
// src/services/urlConfigurationService.ts
export class UrlConfigurationService {
  private static instance: UrlConfigurationService;
  
  static getInstance(): UrlConfigurationService {
    if (!UrlConfigurationService.instance) {
      UrlConfigurationService.instance = new UrlConfigurationService();
    }
    return UrlConfigurationService.instance;
  }
  
  getBaseUrl(): string {
    // ALWAYS HTTPS, ALWAYS DYNAMIC HOST
    const protocol = 'https';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }
  
  getApiUrl(): string {
    return `${this.getBaseUrl()}/api`;
  }
  
  getCallbackUrl(path: string = '/callback'): string {
    return `${this.getBaseUrl()}${path}`;
  }
  
  // For specific flow callbacks
  getFlowCallbackUrl(flowType: string): string {
    const callbackPaths = {
      'oauth': '/oauth-callback',
      'oidc': '/oidc-callback', 
      'par': '/par-callback',
      'device': '/device-callback',
      'implicit': '/implicit-callback'
    };
    
    const path = callbackPaths[flowType] || '/callback';
    return `${this.getBaseUrl()}${path}`;
  }
  
  // Standardized port configuration
  getFrontendPort(): number {
    return 3000; // ALWAYS 3000 for frontend
  }
  
  getBackendPort(): number {
    return 3001; // ALWAYS 3001 for backend
  }
}
```

### **Pattern 2: Environment Configuration Hook**
```typescript
// src/hooks/useEnvironmentConfiguration.ts
export const useEnvironmentConfiguration = () => {
  const getBaseUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      // ALWAYS HTTPS, ALWAYS DYNAMIC HOST
      const protocol = 'https';
      const host = window.location.host;
      return `${protocol}//${host}`;
    }
    return 'https://localhost:3000'; // Fallback for SSR/build time
  }, []);
  
  const getApiUrl = useCallback(() => {
    return `${getBaseUrl()}/api`;
  }, [getBaseUrl]);
  
  const getRedirectUri = useCallback((path: string = '/callback') => {
    return `${getBaseUrl()}${path}`;
  }, [getBaseUrl]);
  
  // Standardized port configuration
  const getFrontendPort = useCallback(() => 3000, []); // ALWAYS 3000
  const getBackendPort = useCallback(() => 3001, []); // ALWAYS 3001
  
  return {
    getBaseUrl,
    getApiUrl,
    getRedirectUri,
    getFrontendPort,
    getBackendPort,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production'
  };
};
```

### **Pattern 3: Service Integration**
```typescript
// src/services/v9/V9FlowCredentialService.ts
export class V9FlowCredentialService {
  private urlService = UrlConfigurationService.getInstance();
  
  getDefaultCredentials(flowType: string) {
    const baseUrl = this.urlService.getBaseUrl();
    
    return {
      redirectUri: this.urlService.getFlowCallbackUrl(flowType),
      issuerUrl: this.getIssuerUrl(),
      tokenEndpoint: `${this.urlService.getApiUrl()}/token`,
      // ... other configuration
    };
  }
  
  private getIssuerUrl(): string {
    // For PingOne, use environment ID from current domain
    const currentHost = window.location.host;
    if (currentHost.includes('pingone.com') || currentHost.includes('pingidentity.com')) {
      return `https://auth.pingone.com/${this.getEnvironmentId()}`;
    }
    return `${this.urlService.getBaseUrl()}/oauth`;
  }
}
```

---

## 🔄 **MIGRATION CHECKLIST**

### **Phase 1: Identify Localhost Usage**
```bash
# Find all hardcoded localhost references
grep -r "localhost:3000" src/
grep -r "localhost:3001" src/
grep -r "http://localhost" src/
grep -r "https://localhost" src/

# Find HTTP URLs (should all be HTTPS)
grep -r "http://" src/

# Find dynamic port configurations
grep -r "PORT.*=" src/
grep -r "process\.env\.PORT" src/

# Find callback URL patterns
grep -r "redirectUri.*localhost" src/
grep -r "callback.*localhost" src/
```

### **Phase 2: Replace with Dynamic URLs**
For each file with localhost usage:

1. **Import URL Configuration Service**
```typescript
import { UrlConfigurationService } from '../../services/urlConfigurationService';
```

2. **Replace hardcoded URLs**
```typescript
// Before
const redirectUri = 'https://localhost:3000/par-callback';

// After
const urlService = UrlConfigurationService.getInstance();
const redirectUri = urlService.getFlowCallbackUrl('par');
```

3. **Update API endpoints**
```typescript
// Before
const apiUrl = 'http://localhost:3001/api/health';

// After
const urlService = UrlConfigurationService.getInstance();
const apiUrl = urlService.getApiUrl();
```

4. **Replace HTTP with HTTPS**
```typescript
// Before
const baseUrl = 'http://localhost:3000';

// After
const urlService = UrlConfigurationService.getInstance();
const baseUrl = urlService.getBaseUrl(); // Always HTTPS
```

5. **Standardize port configuration**
```typescript
// Before
const port = process.env.PORT || 3001;
const frontendPort = 3001;

// After
const urlService = UrlConfigurationService.getInstance();
const frontendPort = urlService.getFrontendPort(); // Always 3000
const backendPort = urlService.getBackendPort(); // Always 3001
```

### **Phase 3: Testing Validation**
```typescript
// Test cases for URL configuration
describe('UrlConfigurationService', () => {
  it('should use current domain for production', () => {
    // Mock window.location for production domain
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:',
        host: 'customer-domain.com'
      },
      writable: true
    });
    
    const urlService = UrlConfigurationService.getInstance();
    expect(urlService.getBaseUrl()).toBe('https://customer-domain.com');
    expect(urlService.getApiUrl()).toBe('https://customer-domain.com/api');
  });
  
  it('should work with localhost in development', () => {
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:',
        host: 'localhost:3000'
      },
      writable: true
    });
    
    const urlService = UrlConfigurationService.getInstance();
    expect(urlService.getBaseUrl()).toBe('https://localhost:3000');
  });
  
  it('should always use HTTPS', () => {
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'http:', // Even if protocol is HTTP
        host: 'localhost:3000'
      },
      writable: true
    });
    
    const urlService = UrlConfigurationService.getInstance();
    expect(urlService.getBaseUrl()).toBe('https://localhost:3000'); // Force HTTPS
  });
  
  it('should use standardized ports', () => {
    const urlService = UrlConfigurationService.getInstance();
    expect(urlService.getFrontendPort()).toBe(3000);
    expect(urlService.getBackendPort()).toBe(3001);
  });
});
```

---

## 📁 **FILES REQUIRING IMMEDIATE UPDATES**

### **High Priority - Critical Path Files**
1. **Flow Configuration Files**
   - `src/pages/flows/v9/*FlowV9.tsx` - All V9 flow implementations
   - `src/services/v9/V9FlowCredentialService.ts` - Credential management
   - `src/services/parConfigurationService.tsx` - PAR flow configuration

2. **Service Integration Files**
   - `src/services/flowCredentialService.ts` - Legacy credential service
   - `src/services/comprehensiveFlowDataService.ts` - Flow data management
   - `src/hooks/useAuthorizationCodeFlowController.ts` - OAuth flow controller

3. **Callback URL Management**
   - `src/utils/callbackUrls.ts` - Callback URL utilities
   - `src/services/callbackUriService.ts` - Callback URI service

### **Medium Priority - Supporting Files**
1. **Configuration Files**
   - `src/config/oauthConfig.ts` - OAuth configuration
   - `src/config/environmentConfig.ts` - Environment settings

2. **Testing Files**
   - `src/tests/**/*.test.ts` - Unit tests with hardcoded URLs
   - `src/e2e/**/*.spec.ts` - E2E tests with localhost references

---

## 🧪 **VALIDATION PROCEDURES**

### **Pre-Deployment Validation**
```bash
# 1. Check for remaining localhost references
echo "🔍 Checking for localhost references..."
if grep -r "localhost:" src/; then
  echo "❌ Localhost references found - MIGRATION REQUIRED"
  exit 1
fi

# 2. Check for HTTP URLs (should all be HTTPS)
echo "🔒 Checking for HTTP URLs..."
if grep -r "http://" src/; then
  echo "❌ HTTP URLs found - MUST USE HTTPS"
  exit 1
fi

# 3. Check for dynamic port configurations
echo "🔢 Checking port configurations..."
if grep -r "PORT.*=" src/ || grep -r "process\.env\.PORT" src/; then
  echo "❌ Dynamic port configurations found - USE STANDARDIZED PORTS"
  exit 1
fi

# 4. Test URL configuration service
echo "🧪 Testing URL configuration..."
npm test -- --testNamePattern="UrlConfigurationService"

# 5. Build validation
echo "🏗️ Build validation..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed - URL migration issues"
  exit 1
fi

# 6. Production domain simulation
echo "🌐 Production domain simulation..."
# Test with mock production domain
```

### **Runtime Validation**
```typescript
// Add to main app initialization
const validateUrlConfiguration = () => {
  const urlService = UrlConfigurationService.getInstance();
  const baseUrl = urlService.getBaseUrl();
  
  // Validate no localhost in production
  if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {
    console.error('🚨 PRODUCTION ERROR: Localhost URL detected in production');
    throw new Error('Localhost URLs not allowed in production');
  }
  
  // Validate HTTPS usage
  if (!baseUrl.startsWith('https://')) {
    console.error('🚨 SECURITY ERROR: HTTP URL detected - MUST USE HTTPS');
    throw new Error('HTTP URLs not allowed - use HTTPS only');
  }
  
  // Validate standardized ports
  const frontendPort = urlService.getFrontendPort();
  const backendPort = urlService.getBackendPort();
  
  if (frontendPort !== 3000) {
    console.error('🚨 CONFIGURATION ERROR: Frontend port must be 3000');
    throw new Error('Frontend port must be 3000');
  }
  
  if (backendPort !== 3001) {
    console.error('🚨 CONFIGURATION ERROR: Backend port must be 3001');
    throw new Error('Backend port must be 3001');
  }
  
  console.log('✅ URL configuration validated:', baseUrl);
  console.log('✅ Port configuration validated: Frontend=3000, Backend=3001');
};
```

---

## 🚀 **IMPLEMENTATION TIMELINE**

### **Phase 1: Foundation (IMMEDIATE)**
- [ ] Create `UrlConfigurationService`
- [ ] Create `useEnvironmentConfiguration` hook
- [ ] Update all V9 flow implementations
- [ ] Update V9 credential services

### **Phase 2: Integration (NEXT SPRINT)**
- [ ] Update remaining service files
- [ ] Update configuration files
- [ ] Migrate callback URL management
- [ ] Update testing files

### **Phase 3: Validation (CONTINUOUS)**
- [ ] Add automated localhost detection
- [ ] Add production domain validation
- [ ] Update CI/CD pipeline checks
- [ ] Add deployment-time validation

---

## 📞 **SUPPORT AND ESCALATION**

### **If Issues Occur:**
1. **Check URL Configuration**: Verify `UrlConfigurationService` is properly imported
2. **Validate Environment**: Ensure `window.location` is available
3. **Check Callback Paths**: Verify callback paths match routing configuration
4. **Test in Multiple Domains**: Validate in both development and production-like domains

### **Emergency Rollback:**
If URL migration causes critical issues:
1. Revert to environment-based URL configuration as temporary fix
2. Create hotfix with proper URL service integration
3. Schedule immediate follow-up migration

---

## 📝 **COMPLIANCE REQUIREMENTS**

### **Code Review Checklist:**
- [ ] No hardcoded localhost URLs
- [ ] Dynamic URL configuration implemented
- [ ] Proper error handling for URL generation
- [ ] Tests cover multiple domain scenarios
- [ ] Documentation updated with new patterns

### **Deployment Checklist:**
- [ ] URL configuration tests passing
- [ ] No localhost references in production build
- [ ] Production domain validation working
- [ ] Callback URLs properly configured
- [ ] SSL certificates compatible with new domains

---

**⚠️ CRITICAL NOTICE:** This migration is **MANDATORY** for all production deployments. Any code containing hardcoded localhost URLs will be **BLOCKED** from deployment until properly migrated.
