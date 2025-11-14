# Code Generator Quick Start Guide

## Current Status Summary

✅ **UI is 100% complete and working**
❌ **Code generation service needs to be built**

## What You Have Right Now

When you select categories and code types in the UI, it shows placeholder code from the existing `mfaCodeExamplesService.ts` which only has TypeScript examples for the authorization step.

## What Needs to Happen

Build a comprehensive code generation service that produces actual working code for all 22 code types across 6 flow steps.

---

## Quick Start: Build Ping SDK Templates First

### Step 1: Create the Service Structure (30 minutes)

```bash
# Create directory structure
mkdir -p src/services/codeGeneration/templates/frontend
mkdir -p src/services/codeGeneration/templates/backend
mkdir -p src/services/codeGeneration/templates/mobile
mkdir -p src/services/codeGeneration/utils
```

### Step 2: Create Core Service (1 hour)

**File**: `src/services/codeGeneration/codeGenerationService.ts`

```typescript
import { CodeCategory, CodeType, FlowStep, LanguageOption } from '../../components/InteractiveCodeEditor';

export interface CodeGenerationConfig {
  category: CodeCategory;
  codeType: CodeType;
  flowStep: FlowStep;
  language: LanguageOption;
  config: {
    environmentId: string;
    clientId: string;
    redirectUri: string;
    userId: string;
  };
}

export interface GeneratedCode {
  code: string;
  language: string;
  dependencies: string[];
  description: string;
  notes?: string;
}

export class CodeGenerationService {
  generate(config: CodeGenerationConfig): GeneratedCode {
    // Route to appropriate template based on category and type
    const templateKey = `${config.category}-${config.codeType}`;
    
    switch (templateKey) {
      case 'frontend-ping-sdk-js':
        return this.generateFrontendPingSDK(config);
      case 'backend-ping-sdk-node':
        return this.generateBackendPingSDKNode(config);
      // Add more cases...
      default:
        return this.generatePlaceholder(config);
    }
  }

  private generateFrontendPingSDK(config: CodeGenerationConfig): GeneratedCode {
    const { flowStep, config: userConfig } = config;
    
    switch (flowStep) {
      case 'authorization':
        return {
          code: this.getPingSDKAuthorizationCode(userConfig),
          language: 'typescript',
          dependencies: ['@pingidentity/pingone-js-sdk'],
          description: 'Initialize PingOne SDK and start authorization flow',
        };
      // Add other flow steps...
      default:
        return this.generatePlaceholder(config);
    }
  }

  private getPingSDKAuthorizationCode(config: any): string {
    return `
// PingOne SDK - Authorization Flow
import { PingOneClient } from '@pingidentity/pingone-js-sdk';

const client = new PingOneClient({
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
});

async function startAuthorization() {
  try {
    const authUrl = await client.authorize({
      scope: 'openid profile email',
      responseType: 'code',
      usePKCE: true,
    });
    
    window.location.href = authUrl;
  } catch (error) {
    console.error('Authorization failed:', error);
  }
}

startAuthorization();
    `.trim();
  }

  private generatePlaceholder(config: CodeGenerationConfig): GeneratedCode {
    return {
      code: `// ${config.codeType} - ${config.flowStep}\n// Coming soon...`,
      language: 'typescript',
      dependencies: [],
      description: 'Template not yet implemented',
    };
  }
}
```

### Step 3: Update MfaFlowCodeGenerator (30 minutes)

**File**: `src/components/MfaFlowCodeGenerator.tsx`

Add this import:
```typescript
import { CodeGenerationService } from '../services/codeGeneration/codeGenerationService';
```

Replace the code generation logic:
```typescript
const codeGenService = new CodeGenerationService();

const handleCategoryChange = (category: CodeCategory, type: CodeType) => {
  const newCodeByStep: Record<FlowStep, string> = {};
  
  flowSteps.forEach(step => {
    const generated = codeGenService.generate({
      category,
      codeType: type,
      flowStep: step,
      language: 'typescript',
      config: {
        environmentId,
        clientId,
        redirectUri,
        userId,
      },
    });
    
    newCodeByStep[step] = generated.code;
  });
  
  setCodeByStep(newCodeByStep);
};
```

### Step 4: Test It (15 minutes)

1. Start your dev server
2. Navigate to the Kroger MFA flow
3. Select "Frontend" category
4. Select "Ping SDK (JavaScript)" code type
5. Click through the 6 flow tabs
6. Verify code appears for each step

---

## Incremental Implementation Plan

### Week 1: Ping SDK Only (30 samples)

**Day 1-2: Frontend Ping SDK**
- Authorization
- Worker Token
- Device Selection
- MFA Challenge
- MFA Verification
- Device Registration

**Day 3: Backend Ping SDK (Node.js)**
- All 6 steps

**Day 4: Backend Ping SDK (Python)**
- All 6 steps

**Day 5: Mobile Ping SDK (iOS & Android)**
- All 6 steps each

**Result**: 30 working code samples (5 Ping SDKs × 6 steps)

### Week 2: REST API Templates (48 samples)

**Day 1-2: Frontend REST API**
- Fetch implementation - 6 steps
- Axios implementation - 6 steps

**Day 3-4: Backend REST API**
- Node.js - 6 steps
- Python Requests - 6 steps
- Go HTTP - 6 steps
- Ruby HTTP - 6 steps
- C# HTTP - 6 steps

**Result**: 48 additional samples

### Week 3: Framework Templates (54 samples)

**Day 1-2: Frontend Frameworks**
- React - 6 steps
- Angular - 6 steps
- Vue - 6 steps
- Next.js - 6 steps
- Vanilla JS - 6 steps

**Day 3-4: Mobile Frameworks**
- React Native - 6 steps
- Flutter - 6 steps
- Swift Native - 6 steps
- Kotlin Native - 6 steps

**Result**: 54 additional samples

**Total**: 132 samples complete

---

## Template Example: Full Implementation

Here's a complete example for Ping SDK JavaScript Authorization:

```typescript
// src/services/codeGeneration/templates/frontend/pingSDK.ts

export class PingSDKJavaScriptTemplate {
  static authorization(config: any): string {
    return `
/**
 * PingOne SDK - OAuth 2.0 Authorization Code Flow with PKCE
 * 
 * This example demonstrates how to initiate an authorization flow
 * using the PingOne JavaScript SDK with PKCE for enhanced security.
 * 
 * Prerequisites:
 * - PingOne application configured with Authorization Code grant type
 * - Redirect URI registered in PingOne console
 * - npm install @pingidentity/pingone-js-sdk
 */

import { PingOneClient } from '@pingidentity/pingone-js-sdk';

// Configuration
const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  redirectUri: '${config.redirectUri}',
  scopes: 'openid profile email',
};

// Initialize PingOne client
const client = new PingOneClient({
  environmentId: config.environmentId,
  clientId: config.clientId,
  redirectUri: config.redirectUri,
});

/**
 * Start the authorization flow
 * This will redirect the user to PingOne for authentication
 */
async function startAuthorization() {
  try {
    // Generate authorization URL with PKCE
    const authUrl = await client.authorize({
      scope: config.scopes,
      responseType: 'code',
      usePKCE: true, // Enable PKCE for security
      state: generateRandomState(), // CSRF protection
    });
    
    // Store code verifier for token exchange
    sessionStorage.setItem('pkce_code_verifier', client.getCodeVerifier());
    
    // Redirect to PingOne authorization page
    window.location.href = authUrl;
  } catch (error) {
    console.error('Authorization failed:', error);
    throw error;
  }
}

/**
 * Generate random state parameter for CSRF protection
 */
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Start the flow
startAuthorization();
    `.trim();
  }

  static workerToken(config: any): string {
    return `
/**
 * PingOne SDK - Worker Token (Client Credentials)
 * 
 * Worker tokens are used for server-to-server API calls
 * to manage MFA devices and challenges.
 */

import { PingOneClient } from '@pingidentity/pingone-js-sdk';

const config = {
  environmentId: '${config.environmentId}',
  clientId: '${config.clientId}',
  clientSecret: 'YOUR_CLIENT_SECRET', // Never expose in frontend!
};

async function getWorkerToken() {
  try {
    const response = await fetch(
      \`https://auth.pingone.com/\${config.environmentId}/as/token\`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      }
    );

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Failed to get worker token:', error);
    throw error;
  }
}

getWorkerToken();
    `.trim();
  }

  // Add deviceSelection, mfaChallenge, mfaVerification, deviceRegistration...
}
```

---

## Testing Checklist

For each template, verify:

- [ ] Code is syntactically valid
- [ ] Configuration values are injected correctly
- [ ] Dependencies are listed
- [ ] Comments explain key concepts
- [ ] Error handling is included
- [ ] Security best practices are followed
- [ ] Code can be copied and run with minimal changes

---

## Success Criteria

### Minimum Viable Product (MVP)
- ✅ 5 Ping SDK implementations (JS, Node, Python, iOS, Android)
- ✅ All 6 flow steps for each
- ✅ 30 total working code samples
- ✅ Config injection working
- ✅ Copy/download functional

### Full Implementation
- ✅ All 22 code types
- ✅ All 6 flow steps
- ✅ 132 total working code samples
- ✅ All languages supported
- ✅ Framework-specific examples
- ✅ Mobile platform examples

---

## Quick Win: Start Here

1. Create `src/services/codeGeneration/codeGenerationService.ts`
2. Implement just the Ping SDK JavaScript authorization step
3. Update MfaFlowCodeGenerator to use it
4. Test in browser
5. Expand to other flow steps
6. Expand to other code types

**Time to first working demo**: 2-3 hours
**Time to MVP (30 samples)**: 1 week
**Time to full implementation (132 samples)**: 3 weeks
