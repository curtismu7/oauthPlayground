# SDK Examples Usage Guide

## 🎯 **Purpose**

Comprehensive guide for using SDK examples in the OAuth Playground, including best practices, security considerations, and troubleshooting.

## 📚 **Available SDK Examples**

### **🔧 JWT SDK Examples**
**Status**: ✅ **IMPLEMENTED**  
**SDK**: jose@5.9.6 + Custom JWT services  
**Location**: `src/services/jwtAuthServiceV8.ts`, `src/services/pingOneJWTService.ts`

**Features**:
- **Private Key JWT**: RSA/ECDSA key generation and signing
- **Client Secret JWT**: HMAC-based JWT generation  
- **Token Validation**: JWT decoding and verification
- **Key Management**: Secure key storage and rotation
- **Client Authentication**: JWT-based authentication for OAuth flows

**Usage Example**:
```typescript
import { jwtAuthServiceV8 } from '../services/jwtAuthServiceV8';

// Generate Private Key JWT
const privateKeyConfig = {
  clientId: 'your-client-id',
  tokenEndpoint: 'https://auth.pingone.com/oauth2/token',
  privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
  keyId: 'your-key-id'
};

const result = await jwtAuthServiceV8.generatePrivateKeyJWT(privateKeyConfig);
if (result.success) {
  console.log('JWT generated:', result.jwt);
}
```

**Security Notes**:
- ✅ Private keys stored securely
- ✅ No sensitive data logged to console
- ✅ Proper key validation implemented
- ⚠️ Never log JWT tokens or claims

---

### **🔐 OIDC SDK Examples**
**Status**: ✅ **IMPLEMENTED**  
**SDK**: @pingidentity-developers-experience/ping-oidc-client-sdk@2.4.2  
**Location**: Multiple services using TokenManager

**Features**:
- **Token Management**: Automatic token storage, retrieval, and refresh
- **Centralized Login**: Redirect to server UI for authentication
- **Background Renewal**: Silent token renewal in iframe
- **OAuth Flow Completion**: Handle code and state parameters
- **Session Management**: Secure session handling

**Usage Example**:
```typescript
import { TokenManager } from '@pingidentity-developers-experience/ping-oidc-client-sdk';

// Initiate centralized login
const tokens = await TokenManager.getTokens({
  login: 'redirect',
  forceRenew: false,
  skipBackgroundRequest: false
});

// Complete OAuth flow with callback
const callbackTokens = await TokenManager.getTokens({
  query: {
    code: 'authorization-code-from-callback',
    state: 'state-from-callback'
  }
});
```

**Security Notes**:
- ✅ All API calls go through proxy
- ✅ No direct API calls to PingOne endpoints
- ✅ Tokens stored securely
- ⚠️ Never log tokens or sensitive data

---

### **🔄 DaVinci SDK Examples**
**Status**: 🟡 **PLANNED**  
**SDK**: @forgerock/davinci-client@1.3.0  
**Location**: `src/sdk-examples/davinci-todo-app/` (planned)

**Features**:
- **Dynamic Form Rendering**: React components that adapt to DaVinci collectors
- **Collector Type Support**: Text, Password, Checkbox, Combobox, Dropdown, Phone number
- **Flow Management**: Complete DaVinci flow lifecycle management
- **Token Integration**: OAuth 2.0 token handling with DaVinci flows
- **Todo Application**: Complete CRUD application with DaVinci authentication

**Planned Usage Example**:
```typescript
import { davinci } from '@forgerock/davinci-client';

// Initialize DaVinci client
const client = await davinci({
  url: 'https://your-pingone-url',
  realm: 'your-realm',
  clientId: 'your-client-id'
});

// Start DaVinci flow
const flow = await client.startFlow('your-flow-id');

// Handle dynamic form rendering
const renderCollector = (collector) => {
  switch (collector.type) {
    case 'TextCollector':
      return <TextInput collector={collector} />;
    case 'PasswordCollector':
      return <PasswordInput collector={collector} />;
    // ... other collector types
  }
};
```

**Security Notes**:
- ✅ All API calls through proxy
- ✅ Dynamic form rendering prevents hardcoded UI
- ✅ Server-side flow management
- ⚠️ Never log flow responses or user input

---

## 🔧 **Getting Started**

### **Prerequisites**
- **Node.js**: 18+ (required for DaVinci SDK)
- **PingOne Application**: Properly configured OAuth 2.0 client
- **Environment Variables**: Proper configuration for SDK examples
- **Proxy Setup**: All API calls must go through proxy endpoints

### **Installation**

```bash
# JWT SDK (already installed)
npm install jose@5.9.6

# OIDC SDK (already installed)  
npm install @pingidentity-developers-experience/ping-oidc-client-sdk@2.4.2

# DaVinci SDK (planned)
npm install @forgerock/davinci-client@1.3.0
```

### **Environment Configuration**

Create `.env` file with SDK configuration:

```bash
# PingOne Configuration
REACT_APP_PINGONE_URL=https://auth.pingone.com
REACT_APP_PINGONE_REALM=your-realm-id
REACT_APP_CLIENT_ID=your-client-id

# SDK Configuration
REACT_APP_DAVINCI_FLOW_ID=your-davinci-flow-id
REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/callback

# Security Configuration
REACT_APP_PROXY_URL=http://localhost:3001
REACT_APP_LOG_LEVEL=error  # Never use 'debug' in production
```

### **Security Configuration**

```typescript
// src/config/sdkConfig.ts
export const sdkConfig = {
  pingone: {
    url: process.env.REACT_APP_PINGONE_URL,
    realm: process.env.REACT_APP_PINGONE_REALM,
    clientId: process.env.REACT_APP_CLIENT_ID,
  },
  davinci: {
    flowId: process.env.REACT_APP_DAVINCI_FLOW_ID,
    redirectUri: process.env.REACT_APP_OIDC_REDIRECT_URI,
  },
  security: {
    logLevel: process.env.REACT_APP_LOG_LEVEL || 'error',
    enableDebugLogging: false, // Never enable in production
  }
};
```

## 📖 **Usage Examples**

### **JWT Authentication Flow**

```typescript
// 1. Generate RSA Key Pair
import { PingOneJWTService } from '../services/pingOneJWTService';

const keyPair = await PingOneJWTService.generateRSAKeyPair(2048);
console.log('Key ID:', keyPair.keyId);
console.log('Private Key:', keyPair.privateKey);

// 2. Generate Private Key JWT
const jwtConfig = {
  clientId: 'your-client-id',
  tokenEndpoint: 'https://auth.pingone.com/oauth2/token',
  privateKey: keyPair.privateKey,
  keyId: keyPair.keyId,
  audience: 'https://auth.pingone.com/oauth2/token'
};

const jwt = await PingOneJWTService.createPrivateKeyJWT(jwtConfig);

// 3. Use JWT for Client Authentication
const authResponse = await fetch('/api/oauth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: jwt,
  })
});
```

### **OIDC Centralized Login Flow**

```typescript
// 1. Initiate Centralized Login
import { TokenManager } from '@pingidentity-developers-experience/ping-oidc-client-sdk';

const initiateLogin = async () => {
  try {
    // This will redirect to PingOne server UI
    await TokenManager.getTokens({
      login: 'redirect',
      forceRenew: false,
      skipBackgroundRequest: false
    });
  } catch (error) {
    console.error('Login initiation failed:', error);
  }
};

// 2. Handle OAuth Callback
const handleCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  
  if (code && state) {
    try {
      const tokens = await TokenManager.getTokens({
        query: { code, state }
      });
      
      // Store tokens securely
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('id_token', tokens.id_token);
      
      // Redirect to protected content
      window.location.href = '/protected';
    } catch (error) {
      console.error('Token exchange failed:', error);
    }
  }
};

// 3. Background Token Renewal
const renewTokensSilently = async () => {
  try {
    const tokens = await TokenManager.getTokens({
      login: 'redirect',
      forceRenew: false,
      skipBackgroundRequest: false
    });
    
    if (tokens) {
      localStorage.setItem('access_token', tokens.access_token);
      return true;
    }
  } catch (error) {
    console.warn('Silent renewal failed:', error);
    return false;
  }
  
  return false;
};
```

### **DaVinci Flow Integration (Planned)**

```typescript
// 1. Initialize DaVinci Client
import { davinci } from '@forgerock/davinci-client';

const initializeDavinci = async () => {
  const client = await davinci({
    url: process.env.REACT_APP_PINGONE_URL,
    realm: process.env.REACT_APP_PINGONE_REALM,
    clientId: process.env.REACT_APP_CLIENT_ID,
  });
  
  return client;
};

// 2. Start DaVinci Flow
const startDavinciFlow = async (flowId: string) => {
  const client = await initializeDavinci();
  
  try {
    const flow = await client.startFlow(flowId);
    return flow;
  } catch (error) {
    console.error('Flow start failed:', error);
    throw error;
  }
};

// 3. Handle Dynamic Form Rendering
const DavinciForm = ({ flow }) => {
  const [collectors, setCollectors] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    if (flow && flow.collectors) {
      setCollectors(flow.collectors);
    }
  }, [flow]);
  
  const renderCollector = (collector) => {
    switch (collector.type) {
      case 'TextCollector':
        return (
          <TextInput
            key={collector.id}
            collector={collector}
            onChange={(value) => handleCollectorChange(collector.id, value)}
          />
        );
      case 'PasswordCollector':
        return (
          <PasswordInput
            key={collector.id}
            collector={collector}
            onChange={(value) => handleCollectorChange(collector.id, value)}
          />
        );
      case 'CheckboxCollector':
        return (
          <CheckboxInput
            key={collector.id}
            collector={collector}
            onChange={(value) => handleCollectorChange(collector.id, value)}
          />
        );
      // Add more collector types as needed
      default:
        return <div>Unsupported collector type: {collector.type}</div>;
    }
  };
  
  const handleSubmit = async () => {
    try {
      const response = await flow.submit(collectors);
      
      if (response.success) {
        // Flow completed successfully
        window.location.href = '/success';
      } else if (response.collectors) {
        // More steps required
        setCollectors(response.collectors);
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Flow submission failed:', error);
    }
  };
  
  return (
    <div className="davinci-form">
      <h2>Step {currentStep + 1}</h2>
      {collectors.map(renderCollector)}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```

## 🧪 **Testing SDK Examples**

### **Unit Tests**

```typescript
// JWT Service Tests
describe('JWTAuthService', () => {
  it('should generate private key JWT', async () => {
    const config = {
      clientId: 'test-client',
      tokenEndpoint: 'https://test.com/token',
      privateKey: 'test-private-key',
      keyId: 'test-key-id'
    };
    
    const result = await jwtAuthServiceV8.generatePrivateKeyJWT(config);
    expect(result.success).toBe(true);
    expect(result.jwt).toBeDefined();
  });
  
  it('should validate private key format', () => {
    const validKey = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';
    const invalidKey = 'invalid-key';
    
    expect(jwtAuthServiceV8.validatePrivateKey(validKey)).toBe(true);
    expect(jwtAuthServiceV8.validatePrivateKey(invalidKey)).toBe(false);
  });
});

// OIDC Service Tests
describe('TokenManager Integration', () => {
  it('should initiate redirect login', async () => {
    // Mock TokenManager
    const mockGetTokens = jest.fn();
    mockGetTokens.mockResolvedValue({ redirect: true });
    
    await initiateLogin();
    expect(mockGetTokens).toHaveBeenCalledWith({
      login: 'redirect',
      forceRenew: false,
      skipBackgroundRequest: false
    });
  });
});
```

### **Integration Tests**

```bash
# Run all SDK tests
npm test -- --testPathPattern=".*sdk.*"

# Run specific SDK tests
npm test -- --testPathPattern=".*jwt.*"
npm test -- --testPathPattern=".*oidc.*"

# Run with coverage
npm run test:coverage -- --testPathPattern=".*sdk.*"
```

### **Manual Testing**

1. **JWT Examples**:
   - Navigate to JWT example page
   - Test key generation
   - Verify JWT generation
   - Test token validation

2. **OIDC Examples**:
   - Test centralized login flow
   - Verify callback handling
   - Test background renewal
   - Check token storage

3. **DaVinci Examples** (when implemented):
   - Test flow initialization
   - Verify dynamic form rendering
   - Test collector types
   - Check flow completion

## 🔍 **Troubleshooting**

### **Common Issues**

#### **SDK Installation Issues**
```bash
# Error: Module not found
npm install @forgerock/davinci-client@1.3.0

# Error: Peer dependency conflicts
npm install --force @forgerock/davinci-client@1.3.0

# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### **Authentication Issues**
```typescript
// Check environment variables
if (!process.env.REACT_APP_PINGONE_URL) {
  throw new Error('REACT_APP_PINGONE_URL is required');
}

// Verify PingOne configuration
const validateConfig = () => {
  const required = ['REACT_APP_PINGONE_URL', 'REACT_APP_PINGONE_REALM', 'REACT_APP_CLIENT_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
```

#### **Network Issues**
```typescript
// Check proxy configuration
const testProxyConnection = async () => {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch (error) {
    console.error('Proxy connection failed:', error);
    return false;
  }
};

// Fallback to direct connection (development only)
const useDirectConnection = process.env.NODE_ENV === 'development';
```

#### **Token Issues**
```typescript
// Check token expiration
const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    return true; // Assume expired if can't parse
  }
};

// Refresh token if expired
const refreshTokenIfNeeded = async () => {
  const token = localStorage.getItem('access_token');
  
  if (!token || isTokenExpired(token)) {
    await renewTokensSilently();
  }
};
```

### **Getting Help**

1. **Check SDK Inventory**: Always reference `SDK_EXAMPLES_INVENTORY.md`
2. **Review Prevention Commands**: Run security checks
3. **Check Logs**: Look for error messages (but not sensitive data)
4. **Verify Configuration**: Ensure environment variables are correct
5. **Test Network**: Verify proxy and API connectivity

## 📊 **SDK Version Compatibility**

| SDK | Version | Node.js | Browser | Notes |
|-----|---------|---------|---------|-------|
| DaVinci | 1.3.0 | 18+ | Modern | Requires ES6+, Web Crypto API |
| OIDC | 2.4.2 | 16+ | Modern | IE11+ support with polyfills |
| JWT | 5.9.6 | 14+ | Modern | Web Crypto API required |

## 🔄 **Best Practices**

### **Security**
- ✅ Never log tokens or sensitive data
- ✅ Use proxy endpoints for API calls
- ✅ Validate all inputs
- ✅ Handle errors gracefully
- ✅ Use HTTPS in production
- ✅ Implement proper session management

### **Performance**
- ✅ Implement proper caching
- ✅ Use background token renewal
- ✅ Optimize SDK initialization
- ✅ Handle network failures
- ✅ Use lazy loading for SDK components

### **Maintainability**
- ✅ Follow naming conventions
- ✅ Document SDK usage
- ✅ Write comprehensive tests
- ✅ Keep dependencies updated
- ✅ Use TypeScript for type safety

### **Development**
- ✅ Use environment variables for configuration
- ✅ Implement proper error boundaries
- ✅ Add loading states
- ✅ Provide user feedback
- ✅ Test in multiple browsers

## 📞 **Support and Resources**

### **Documentation**
- **Primary**: `SDK_EXAMPLES_INVENTORY.md`
- **Secondary**: `PROTECT_PORTAL_INVENTORY.md`
- **Guide**: `SWE-15_UNIFIED_MFA_GUIDE.md`

### **External Resources**
- **PingOne Documentation**: https://docs.pingidentity.com/
- **DaVinci SDK Docs**: https://docs.pingidentity.com/sdks/latest/davinci/
- **OIDC SDK Docs**: https://docs.pingidentity.com/sdks/latest/oidc/

### **Community**
- **GitHub Issues**: Report SDK-specific issues
- **PingOne Community**: Get help from other developers
- **Stack Overflow**: Tag questions with relevant SDK tags

This guide provides comprehensive information for using SDK examples in the OAuth Playground while maintaining security best practices and following established development patterns.
