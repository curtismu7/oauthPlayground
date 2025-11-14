# Code Generator Implementation Plan

## Overview
Implement a comprehensive code generation system that produces working code examples for all 6 MFs  flow steps across Frontend, Backend, and Mobile categories with multiple implementation types including Ping SDK.

## Architecture

### 1. Code Generation Service
**File**: `src/services/codeGenerationService.ts`

```typescript
interface CodeGenerationConfig {
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

interface GeneratedCode {
  code: string;
  language: string;
  dependencies: string[];
  description: string;
  notes?: string;
}
```

**Responsibilities**:
- Generate code for all combinations of category/type/step
- Handle configuration injection
- Provide code templates
- Return dependencies and descriptions

### 2. Code Templates Structure

```
src/
  services/
    codeGeneration/
      index.ts                    # Main service
      templates/
        frontend/
          pingSDK.ts              # Ping SDK (JavaScript)
          restApiFetch.ts         # REST API (Fetch)
          restApiAxios.ts         # REST API (Axios)
          react.ts                # React implementation
          angular.ts              # Angular implementation
          vue.ts                  # Vue.js implementation
          nextjs.ts               # Next.js implementation
          vanillaJS.ts            # Vanilla JavaScript
        backend/
          pingSDKNode.ts          # Ping SDK (Node.js)
          restApiNode.ts          # REST API (Node.js)
          pythonRequests.ts       # Python (Requests)
          pingSDKPython.ts        # Ping SDK (Python)
          pingSDKJava.ts          # Ping SDK (Java)
          goHTTP.ts               # Go (HTTP)
          rubyHTTP.ts             # Ruby (HTTP)
          csharpHTTP.ts           # C# (HTTP)
        mobile/
          pingSDKiOS.ts           # Ping SDK (iOS)
          pingSDKAndroid.ts       # Ping SDK (Android)
          reactNative.ts          # React Native
          flutter.ts              # Flutter
          swiftNative.ts          # Swift (Native)
          kotlinNative.ts         # Kotlin (Native)
      utils/
        configInjector.ts         # Inject config values
        dependencyResolver.ts     # Resolve dependencies
        codeFormatter.ts          # Format code output
```

## Implementation Phases

### Phase 1: Core Service Setup (Day 1)
**Goal**: Create the foundation for code generation

**Tasks**:
1. Create `codeGenerationService.ts` with base interfaces
2. Implement configuration injection utility
3. Create template loader system
4. Add error handling and validation

**Deliverables**:
- Working service that can load and inject config
- Unit tests for config injection
- Template loading mechanism

### Phase 2: Frontend Templates (Days 2-3)
**Goal**: Implement all frontend code generation

**Priority Order**:
1. **Ping SDK (JavaScript)** - Highest priority
   - All 6 flow steps
   - Full PingOne SDK integration
   - Error handling
   
2. **REST API (Fetch)**
   - Direct API calls
   - Token management
   - Error handling
   
3. **REST API (Axios)**
   - Axios-based implementation
   - Interceptors for auth
   
4. **React**
   - Hooks-based implementation
   - Context for state management
   
5. **Angular**
   - Service-based architecture
   - RxJS observables
   
6. **Vue.js**
   - Composition API
   - Pinia for state
   
7. **Next.js**
   - Server-side + client-side
   - API routes
   
8. **Vanilla JavaScript**
   - Pure JS implementation
   - No framework dependencies

**Each Template Must Include**:
- Authorization flow
- Worker token acquisition
- Device selection/listing
- MFA challenge initiation
- MFA verification
- Device registration

### Phase 3: Backend Templates (Days 4-5)
**Goal**: Implement all backend code generation

**Priority Order**:
1. **Ping SDK (Node.js)** - Highest priority
2. **Ping SDK (Python)**
3. **Ping SDK (Java)**
4. **REST API (Node.js)**
5. **Python (Requests)**
6. **Go (HTTP)**
7. **Ruby (HTTP)**
8. **C# (HTTP)**

**Backend-Specific Considerations**:
- Server-to-server authentication
- Token caching strategies
- Webhook handling
- Database integration examples
- Environment variable management

### Phase 4: Mobile Templates (Days 6-7)
**Goal**: Implement all mobile code generation

**Priority Order**:
1. **Ping SDK (iOS)** - Highest priority
2. **Ping SDK (Android)** - Highest priority
3. **React Native**
4. **Flutter**
5. **Swift (Native)**
6. **Kotlin (Native)**

**Mobile-Specific Considerations**:
- Biometric authentication
- Keychain/Keystore integration
- Deep linking
- Push notification setup
- Platform-specific UI components

### Phase 5: Integration & Testing (Day 8)
**Goal**: Connect everything and test thoroughly

**Tasks**:
1. Integrate service with InteractiveCodeEditor
2. Add callback handling for category/type changes
3. Implement code caching for performance
4. Test all combinations (6 steps × 22 types = 132 code samples)
5. Verify config injection works correctly
6. Test download functionality with all file types

**Testing Matrix**:
```
Category  | Code Types | Flow Steps | Total Tests
----------|------------|------------|------------
Frontend  | 8          | 6          | 48
Backend   | 8          | 6          | 48
Mobile    | 6          | 6          | 36
----------|------------|------------|------------
TOTAL     | 22         | 6          | 132
```

### Phase 6: Documentation & Polish (Day 9)
**Goal**: Complete documentation and refinements

**Tasks**:
1. Add inline code comments to all templates
2. Create developer documentation
3. Add usage examples
4. Create troubleshooting guide
5. Performance optimization
6. Add loading states during code generation

## Technical Specifications

### Code Template Format

```typescript
export const authorizationTemplate = (config: CodeGenerationConfig): GeneratedCode => {
  const { environmentId, clientId, redirectUri } = config.config;
  
  return {
    code: `
// Initialize PingOne SDK
import { PingOneClient } from '@pingidentity/pingone-js-sdk';

const client = new PingOneClient({
  environmentId: '${environmentId}',
  clientId: '${clientId}',
  redirectUri: '${redirectUri}',
});

// Start authorization flow
async function authorize() {
  try {
    const authUrl = await client.authorize({
      scope: 'openid profile email',
      responseType: 'code',
    });
    
    // Redirect user to authorization URL
    window.location.href = authUrl;
  } catch (error) {
    console.error('Authorization failed:', error);
  }
}

authorize();
    `.trim(),
    language: 'typescript',
    dependencies: ['@pingidentity/pingone-js-sdk'],
    description: 'Initialize PingOne SDK and start the authorization flow',
    notes: 'Make sure to handle the callback at your redirect URI',
  };
};
```

### Configuration Injection

```typescript
export class ConfigInjector {
  static inject(template: string, config: Record<string, string>): string {
    let result = template;
    
    Object.entries(config).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(placeholder, value);
    });
    
    return result;
  }
  
  static validate(config: Record<string, string>): boolean {
    const required = ['environmentId', 'clientId', 'redirectUri', 'userId'];
    return required.every(key => config[key] && config[key].length > 0);
  }
}
```

### Dependency Resolution

```typescript
export class DependencyResolver {
  private static packageVersions: Record<string, string> = {
    '@pingidentity/pingone-js-sdk': '^1.0.0',
    'axios': '^1.6.0',
    'react': '^18.2.0',
    // ... more packages
  };
  
  static resolve(dependencies: string[]): Record<string, string> {
    return dependencies.reduce((acc, dep) => {
      acc[dep] = this.packageVersions[dep] || 'latest';
      return acc;
    }, {} as Record<string, string>);
  }
  
  static generateInstallCommand(dependencies: string[]): string {
    return `npm install ${dependencies.join(' ')}`;
  }
}
```

## API Design

### Main Service Interface

```typescript
class CodeGenerationService {
  // Generate code for specific configuration
  generate(config: CodeGenerationConfig): GeneratedCode;
  
  // Get all code for a flow step across all types
  generateForStep(step: FlowStep, category: CodeCategory): Map<CodeType, GeneratedCode>;
  
  // Get all code for a specific type across all steps
  generateForType(type: CodeType): Map<FlowStep, GeneratedCode>;
  
  // Validate configuration
  validateConfig(config: Record<string, string>): boolean;
  
  // Get available code types for category
  getCodeTypesForCategory(category: CodeCategory): CodeType[];
  
  // Get dependencies for code type
  getDependencies(type: CodeType): string[];
}
```

### Integration with InteractiveCodeEditor

```typescript
// In MfaFlowCodeGenerator.tsx
const codeGenService = new CodeGenerationService();

const handleCategoryChange = (category: CodeCategory, type: CodeType) => {
  const newCodeByStep: Record<FlowStep, string> = {};
  
  flowSteps.forEach(step => {
    const generated = codeGenService.generate({
      category,
      codeType: type,
      flowStep: step,
      language: selectedLanguage,
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
  setDependencies(generated.dependencies);
  setDescription(generated.description);
};
```

## Code Quality Standards

### All Templates Must:
1. ✅ Be production-ready (not just examples)
2. ✅ Include proper error handling
3. ✅ Have TypeScript types (where applicable)
4. ✅ Include comments explaining key steps
5. ✅ Follow language-specific best practices
6. ✅ Be testable
7. ✅ Handle edge cases
8. ✅ Include security considerations
9. ✅ Be properly formatted
10. ✅ Work with the provided configuration

### Security Checklist:
- ✅ No hardcoded secrets
- ✅ Proper token storage recommendations
- ✅ HTTPS enforcement
- ✅ PKCE for public clients
- ✅ State parameter for CSRF protection
- ✅ Token expiration handling
- ✅ Secure storage (Keychain/Keystore for mobile)

## Performance Considerations

### Caching Strategy
```typescript
class CodeCache {
  private cache: Map<string, GeneratedCode> = new Map();
  
  getCacheKey(config: CodeGenerationConfig): string {
    return `${config.category}-${config.codeType}-${config.flowStep}`;
  }
  
  get(config: CodeGenerationConfig): GeneratedCode | null {
    return this.cache.get(this.getCacheKey(config)) || null;
  }
  
  set(config: CodeGenerationConfig, code: GeneratedCode): void {
    this.cache.set(this.getCacheKey(config), code);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

### Lazy Loading
- Load templates on-demand
- Pre-generate common combinations
- Cache generated code
- Debounce config changes

## Success Metrics

### Functionality
- ✅ All 132 code combinations generate successfully
- ✅ All generated code is syntactically valid
- ✅ Configuration injection works for all templates
- ✅ Dependencies are correctly identified
- ✅ File extensions match code type

### Performance
- ✅ Code generation < 100ms
- ✅ Category switch < 50ms (cached)
- ✅ Initial load < 200ms
- ✅ Memory usage < 50MB

### User Experience
- ✅ Smooth transitions between categories
- ✅ No flickering during code updates
- ✅ Clear loading states
- ✅ Helpful error messages
- ✅ Copy/download works reliably

## Rollout Plan

### Week 1: Foundation + Frontend
- Days 1-3: Core service + Frontend templates
- Day 4: Frontend testing
- Day 5: Frontend refinement

### Week 2: Backend + Mobile
- Days 1-2: Backend templates
- Days 3-4: Mobile templates
- Day 5: Integration testing

### Week 3: Polish + Launch
- Days 1-2: Bug fixes and optimization
- Days 3-4: Documentation
- Day 5: Launch preparation

## Risk Mitigation

### Risks & Solutions

**Risk**: Templates become outdated
**Solution**: Version control templates, automated testing against SDK versions

**Risk**: Too many code combinations to maintain
**Solution**: Template inheritance, shared utilities, automated generation where possible

**Risk**: Generated code doesn't work
**Solution**: Automated testing, manual QA, user feedback loop

**Risk**: Performance issues with 132 templates
**Solution**: Lazy loading, caching, code splitting

**Risk**: SDK API changes break templates
**Solution**: Pin SDK versions, automated dependency updates, CI/CD testing

## Future Enhancements

### Phase 2 Features (Post-Launch)
1. **Custom Templates**: Allow users to save custom templates
2. **Code Playground**: Test generated code in browser
3. **Export Projects**: Generate full project scaffolding
4. **AI Assistance**: AI-powered code suggestions
5. **Version History**: Track code generation history
6. **Sharing**: Share code snippets with team
7. **Comments**: Add inline comments to generated code
8. **Diff View**: Compare different implementations
9. **Performance Metrics**: Show performance characteristics
10. **Security Scan**: Automated security analysis

## Appendix

### Example: Complete Ping SDK (JavaScript) Template

```typescript
// src/services/codeGeneration/templates/frontend/pingSDK.ts

export class PingSDKJavaScriptTemplate {
  static authorization(config: CodeGenerationConfig): GeneratedCode {
    return {
      code: `
import { PingOneClient } from '@pingidentity/pingone-js-sdk';

// Initialize PingOne client
const client = new PingOneClient({
  environmentId: '${config.config.environmentId}',
  clientId: '${config.config.clientId}',
  redirectUri: '${config.config.redirectUri}',
});

// Start authorization flow with PKCE
async function startAuthorization() {
  try {
    const authUrl = await client.authorize({
      scope: 'openid profile email',
      responseType: 'code',
      usePKCE: true,
    });
    
    // Redirect to PingOne authorization page
    window.location.href = authUrl;
  } catch (error) {
    console.error('Authorization failed:', error);
    throw error;
  }
}

// Handle callback after authorization
async function handleCallback() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (!code) {
      throw new Error('Authorization code not found');
    }
    
    const tokens = await client.exchangeCodeForTokens(code);
    
    // Store tokens securely
    sessionStorage.setItem('access_token', tokens.accessToken);
    sessionStorage.setItem('id_token', tokens.idToken);
    
    return tokens;
  } catch (error) {
    console.error('Token exchange failed:', error);
    throw error;
  }
}

export { startAuthorization, handleCallback };
      `.trim(),
      language: 'typescript',
      dependencies: ['@pingidentity/pingone-js-sdk'],
      description: 'Initialize PingOne SDK and handle OAuth 2.0 authorization flow with PKCE',
      notes: 'Ensure your redirect URI is registered in PingOne console',
    };
  }
  
  static workerToken(config: CodeGenerationConfig): GeneratedCode {
    // Implementation for worker token step
  }
  
  static deviceSelection(config: CodeGenerationConfig): GeneratedCode {
    // Implementation for device selection step
  }
  
  static mfaChallenge(config: CodeGenerationConfig): GeneratedCode {
    // Implementation for MFA challenge step
  }
  
  static mfaVerification(config: CodeGenerationConfig): GeneratedCode {
    // Implementation for MFA verification step
  }
  
  static deviceRegistration(config: CodeGenerationConfig): GeneratedCode {
    // Implementation for device registration step
  }
}
```

### Dependencies Reference

```json
{
  "frontend": {
    "ping-sdk-js": ["@pingidentity/pingone-js-sdk"],
    "rest-api-fetch": [],
    "rest-api-axios": ["axios"],
    "react": ["react", "react-dom"],
    "angular": ["@angular/core", "@angular/common"],
    "vue": ["vue"],
    "next-js": ["next", "react", "react-dom"],
    "vanilla-js": []
  },
  "backend": {
    "ping-sdk-node": ["@pingidentity/pingone-node-sdk"],
    "rest-api-node": ["node-fetch"],
    "python-requests": ["requests"],
    "ping-sdk-python": ["pingone-python-sdk"],
    "ping-sdk-java": ["com.pingidentity:pingone-java-sdk"],
    "go-http": [],
    "ruby-http": ["httparty"],
    "csharp-http": ["System.Net.Http"]
  },
  "mobile": {
    "ping-sdk-ios": ["PingOneSDK"],
    "ping-sdk-android": ["com.pingidentity:pingone-android-sdk"],
    "react-native": ["react-native", "@react-native-async-storage/async-storage"],
    "flutter": ["http", "flutter_secure_storage"],
    "swift-native": [],
    "kotlin-native": []
  }
}
```

## Conclusion

This implementation plan provides a comprehensive roadmap for building a production-ready code generation system. The phased approach ensures steady progress while maintaining quality, and the focus on Ping SDK implementations aligns with business priorities.

**Estimated Timeline**: 3 weeks
**Team Size**: 2-3 developers
**Priority**: High (Ping SDK templates first)
