# SWE-15 Production Applications Development Guide

**Last Updated**: February 12, 2026  
**Version**: 1.0.0  
**Purpose**: SWE-15 compliance guide for Production applications development

---

## 🎯 SWE-15 Principles for Production Applications

### 1. Single Responsibility Principle
- **Component Focus**: Each Production app component should have a single, well-defined responsibility
- **Service Separation**: Clear separation between token management, state management, and UI components
- **Feature Isolation**: Each app should focus on its specific feature domain (MFA, OAuth, Token Monitoring, etc.)

### 2. Open/Closed Principle  
- **App Extension**: Allow addition of new features to production apps without modifying existing components
- **Service Configuration**: Behavior modification through configuration, not code changes
- **Component Composition**: Build complex apps from simple, reusable components

### 3. Liskov Substitution Principle
- **Service Interface**: All production services should follow the same interface contract
- **Component Consistency**: Production components should be substitutable across different apps
- **Flow Compatibility**: All production flows should follow the same patterns

### 4. Interface Segregation Principle
- **Focused Props**: Components should only receive props they actually use
- **Service-Specific**: Separate interfaces for different service requirements
- **Minimal Dependencies**: Components should depend only on interfaces they use

### 5. Dependency Inversion Principle
- **Service Abstraction**: Components should depend on service abstractions, not concrete implementations
- **State Injection**: State management services should be injected, not hard-coded
- **Configuration Injection**: All configuration should be injected from external sources

---

## 🔍 Before Making Changes

### 1. Reference the Production Inventory
```bash
# Always check the production inventory first
cat PRODUCTION_INVENTORY.md | grep -A 10 "### Issues"
cat PRODUCTION_INVENTORY.md | grep -A 5 "####.*Issue"
```

### 2. Understand the Production Architecture
- **Token Management**: Understand how tokens flow through production apps
- **State Management**: Know how enhanced state management works across apps
- **Service Integration**: Understand how services are shared between production apps
- **Data Flow**: Know how data moves between production components

### 3. Check Dependencies
```bash
# Find what imports a production component
grep -r "import.*TokenMonitoringService" src/v8u/
grep -r "import.*EnhancedStateManagement" src/v8u/
grep -r "import.*TokenDisplayService" src/v8u/
```

---

## 🛡️ SWE-15 Best Practices for Production Apps

### **1. Single Responsibility Principle**
- Each production app has one clear purpose
- Don't mix token management with state management
- Keep components focused and testable
- Separate UI logic from business logic

### **2. Open/Closed Principle**
- Extend functionality without modifying existing code
- Use composition over inheritance
- Add new production features without changing base framework
- Implement new token types without breaking existing ones

### **3. Liskov Substitution**
- New production components should work as drop-in replacements
- Maintain interface contracts
- Don't break expected behavior
- Ensure service compatibility

### **4. Interface Segregation**
- Keep interfaces focused and minimal
- Don't force clients to depend on unused methods
- Use specific props for specific needs
- Separate token interfaces from state interfaces

### **5. Dependency Inversion**
- Depend on abstractions, not concretions
- Inject dependencies rather than creating them internally
- Use configuration to drive behavior
- Abstract external service dependencies

---

## 🎯 Key Production Components

### **Token Management Components**
- **TokenMonitoringService**: Main token tracking and management service
- **TokenDisplayService**: Secure JWT decoding and display utilities
- **TokenMonitoringPage**: Real-time token monitoring dashboard
- **TokenCard**: Individual token display component

### **State Management Components**
- **EnhancedStateManagement**: Advanced state management with persistence
- **useUnifiedFlowState**: Hook for state management integration
- **StateProvider**: Context provider for state management
- **StatePersistence**: localStorage integration for state persistence

### **Production App Components**
- **Unified OAuth & OIDC**: Single UI for all OAuth flows
- **New Unified MFA**: Enhanced MFA flow with all fixes
- **Protect Portal App**: Risk-based authentication portal
- **API Status**: Real-time API health monitoring
- **Flow Comparison Tool**: Compare OAuth flows with metrics

---

## 🔧 Production App Architecture

### **Service Layer Architecture**
```typescript
// Service abstraction following SWE-15 principles
interface ITokenService {
  trackToken(token: TokenInfo): void;
  getToken(tokenId: string): TokenInfo | null;
  getAllTokens(): TokenInfo[];
  subscribe(listener: (tokens: TokenInfo[]) => void): () => void;
}

interface IStateService {
  setTokenMetrics(metrics: TokenMetrics): void;
  getState(): ProductionState;
  subscribe(listener: (state: ProductionState) => void): () => void;
}
```

### **Component Architecture**
```typescript
// Component with single responsibility
const TokenMonitoringPage: React.FC = () => {
  // Only handles token monitoring display
  const { tokens, actions } = useTokenMonitoring();
  
  return (
    <PageContainer>
      <TokenStats tokens={tokens} />
      <TokenGrid tokens={tokens} actions={actions} />
    </PageContainer>
  );
};
```

### **Dependency Injection Pattern**
```typescript
// Service injection following dependency inversion
const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tokenService = useMemo(() => TokenMonitoringService.getInstance(), []);
  const stateService = useMemo(() => EnhancedStateManagement.getInstance(), []);
  
  return (
    <TokenContext.Provider value={tokenService}>
      <StateContext.Provider value={stateService}>
        {children}
      </StateContext.Provider>
    </TokenContext.Provider>
  );
};
```

---

## 📋 Production App Development Guidelines

### **Token Management Development**
```typescript
// ✅ SWE-15 COMPLIANT: Single responsibility token service
class TokenMonitoringService {
  private static instance: TokenMonitoringService;
  private tokens: Map<string, TokenInfo> = new Map();
  private listeners: Set<(tokens: TokenInfo[]) => void> = new Set();
  
  // Single responsibility: token tracking only
  public trackToken(token: TokenInfo): void {
    this.tokens.set(token.id, token);
    this.notifyListeners();
  }
  
  // Single responsibility: token retrieval
  public getToken(tokenId: string): TokenInfo | null {
    return this.tokens.get(tokenId) || null;
  }
  
  // Single responsibility: subscription management
  public subscribe(listener: (tokens: TokenInfo[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

### **State Management Development**
```typescript
// ✅ SWE-15 COMPLIANT: Interface segregation for state
interface TokenMetrics {
  tokenCount: number;
  featureCount: number;
  lastApiCall: number;
}

interface ProductionState {
  tokenMetrics: TokenMetrics;
  appMetrics: AppMetrics;
  userMetrics: UserMetrics;
}

// ✅ SWE-15 COMPLIANT: Dependency inversion
class EnhancedStateManagement {
  constructor(
    private tokenService: ITokenService,
    private storageService: IStorageService
  ) {}
  
  public setTokenMetrics(metrics: TokenMetrics): void {
    this.tokenService.updateMetrics(metrics);
    this.storageService.persist(metrics);
  }
}
```

### **Component Development**
```typescript
// ✅ SWE-15 COMPLIANT: Interface segregation
interface TokenCardProps {
  token: TokenInfo;
  onRefresh?: (tokenId: string) => void;
  onRevoke?: (tokenId: string) => void;
  onCopy?: (token: string) => void;
  onDecode?: (token: TokenInfo) => void;
}

// ✅ SWE-15 COMPLIANT: Single responsibility component
const TokenCard: React.FC<TokenCardProps> = ({ 
  token, 
  onRefresh, 
  onRevoke, 
  onCopy, 
  onDecode 
}) => {
  // Only handles individual token display and actions
  return (
    <Card>
      <TokenHeader token={token} />
      <TokenContent token={token} />
      <TokenActions 
        token={token} 
        onRefresh={onRefresh}
        onRevoke={onRevoke}
        onCopy={onCopy}
        onDecode={onDecode}
      />
    </Card>
  );
};
```

---

## 🔍 Production App Patterns

### **Token Service Pattern**
```typescript
// ✅ SWE-15 COMPLIANT: Open/Closed Principle
abstract class BaseTokenService implements ITokenService {
  protected tokens: Map<string, TokenInfo> = new Map();
  protected listeners: Set<(tokens: TokenInfo[]) => void> = new Set();
  
  // Template method pattern - open for extension
  public trackToken(token: TokenInfo): void {
    this.validateToken(token);
    this.storeToken(token);
    this.notifyListeners();
  }
  
  // Hooks for extension
  protected abstract validateToken(token: TokenInfo): void;
  protected abstract storeToken(token: TokenInfo): void;
}

// ✅ SWE-15 COMPLIANT: Extension without modification
class ProductionTokenService extends BaseTokenService {
  protected validateToken(token: TokenInfo): void {
    if (!token.id || !token.value) {
      throw new Error('Invalid token');
    }
  }
  
  protected storeToken(token: TokenInfo): void {
    this.tokens.set(token.id, token);
  }
}
```

### **State Management Pattern**
```typescript
// ✅ SWE-15 COMPLIANT: Dependency Inversion
interface IStateManager {
  getState(): ProductionState;
  setState(state: Partial<ProductionState>): void;
  subscribe(listener: (state: ProductionState) => void): () => void;
}

// ✅ SWE-15 COMPLIANT: Liskov Substitution
class EnhancedStateManager implements IStateManager {
  constructor(private storage: IStorageService) {}
  
  public getState(): ProductionState {
    return this.storage.load() || this.getDefaultState();
  }
  
  public setState(state: Partial<ProductionState>): void {
    const currentState = this.getState();
    const newState = { ...currentState, ...state };
    this.storage.save(newState);
    this.notifyListeners(newState);
  }
  
  // Can be substituted with any IStateManager implementation
  public subscribe(listener: (state: ProductionState) => void): () => void {
    return this.storage.subscribe(listener);
  }
}
```

### **Component Composition Pattern**
```typescript
// ✅ SWE-15 COMPLIANT: Composition over inheritance
interface ProductionAppComponent {
  render(): React.ReactNode;
}

// ✅ SWE-15 COMPLIANT: Component composition
const TokenMonitoringApp: ProductionAppComponent = {
  render: () => (
    <TokenProvider>
      <StateProvider>
        <ErrorBoundary>
          <TokenMonitoringPage />
        </ErrorBoundary>
      </StateProvider>
    </TokenProvider>
  )
};

// ✅ SWE-15 COMPLIANT: Same interface, different implementation
const UnifiedOAuthApp: ProductionAppComponent = {
  render: () => (
    <TokenProvider>
      <StateProvider>
        <ErrorBoundary>
          <UnifiedOAuthPage />
        </ErrorBoundary>
      </StateProvider>
    </TokenProvider>
  )
};
```

---

## 🚨 Common Production Development Issues

### **Issue PROD-001: Token Service State Loss**
**Problem**: Token service loses state during page refresh

**SWE-15 Solution**: 
```typescript
// ✅ Single Responsibility: Service only handles token tracking
// ✅ Open/Closed: Can extend persistence without modifying core logic
class TokenMonitoringService {
  private static instance: TokenMonitoringService;
  private readonly STORAGE_KEY = 'production.tokens';
  
  // Template method for persistence
  protected persistTokens(): void {
    if (typeof window !== 'undefined') {
      const tokenData = Array.from(this.tokens.values());
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokenData));
    }
  }
  
  protected loadTokens(): void {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const tokenData = JSON.parse(stored) as TokenInfo[];
        tokenData.forEach(token => this.tokens.set(token.id, token));
      }
    }
  }
}
```

### **Issue PROD-002: JWT Decoding Security**
**Problem**: JWT tokens decoded without proper validation

**SWE-15 Solution**:
```typescript
// ✅ Interface Segregation: Focused JWT interface
interface JWTValidator {
  isValidJWT(token: string): boolean;
  decodeJWT(token: string): DecodedJWT | null;
}

// ✅ Single Responsibility: Only handles JWT validation
class SecureJWTValidator implements JWTValidator {
  public isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }
  
  public decodeJWT(token: string): DecodedJWT | null {
    if (!this.isValidJWT(token)) return null;
    
    try {
      const parts = token.split('.');
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return { header, payload, signature: parts[2] };
    } catch (error) {
      console.error('[JWT-VALIDATOR] Failed to decode JWT:', error);
      return null;
    }
  }
}
```

### **Issue PROD-003: State Management Synchronization**
**Problem**: State not synchronized across production apps

**SWE-15 Solution**:
```typescript
// ✅ Dependency Inversion: Depend on abstraction
interface IStateSynchronizer {
  syncState(state: ProductionState): void;
  subscribeToSync(listener: (state: ProductionState) => void): () => void;
}

// ✅ Liskov Substitution: Can be substituted with different implementations
class ProductionStateSynchronizer implements IStateSynchronizer {
  constructor(private storage: IStorageService) {}
  
  public syncState(state: ProductionState): void {
    this.storage.save(state);
    this.notifySubscribers(state);
  }
  
  public subscribeToSync(listener: (state: ProductionState) => void): () => void {
    return this.storage.subscribe(listener);
  }
}
```

---

## 📋 Production App Testing Guidelines

### **Unit Testing**
```typescript
// ✅ SWE-15 COMPLIANT: Test single responsibility
describe('TokenMonitoringService', () => {
  let service: TokenMonitoringService;
  
  beforeEach(() => {
    service = TokenMonitoringService.getInstance();
  });
  
  // ✅ Test single responsibility
  it('should track token correctly', () => {
    const token: TokenInfo = {
      id: 'test-token',
      type: 'access_token',
      value: 'test-value',
      status: 'active',
      expiresAt: null,
      issuedAt: Date.now(),
      scope: [],
      introspectionData: null,
      isVisible: true
    };
    
    service.trackToken(token);
    expect(service.getToken('test-token')).toEqual(token);
  });
  
  // ✅ Test interface contract
  it('should notify listeners when token is tracked', () => {
    const listener = jest.fn();
    const unsubscribe = service.subscribe(listener);
    
    const token: TokenInfo = createMockToken();
    service.trackToken(token);
    
    expect(listener).toHaveBeenCalledWith([token]);
    unsubscribe();
  });
});
```

### **Integration Testing**
```typescript
// ✅ SWE-15 COMPLIANT: Test component integration
describe('TokenMonitoringPage Integration', () => {
  it('should integrate with TokenMonitoringService', () => {
    const service = TokenMonitoringService.getInstance();
    const token = createMockToken();
    
    service.trackToken(token);
    
    render(
      <TokenProvider>
        <TokenMonitoringPage />
      </TokenProvider>
    );
    
    expect(screen.getByText(token.id)).toBeInTheDocument();
  });
  
  it('should integrate with EnhancedStateManagement', () => {
    const stateService = EnhancedStateManagement.getInstance();
    
    render(
      <StateProvider>
        <TokenMonitoringPage />
      </StateProvider>
    );
    
    // Test state synchronization
    expect(stateService.getState().tokenMetrics).toBeDefined();
  });
});
```

### **E2E Testing**
```typescript
// ✅ SWE-15 COMPLIANT: Test complete user flows
describe('Production App E2E', () => {
  it('should complete token monitoring flow', async () => {
    // Navigate to token monitoring
    await page.goto('/v8u/token-monitoring');
    
    // Verify tokens are displayed
    await expect(page.locator('[data-testid="token-grid"]')).toBeVisible();
    
    // Test token decoding
    await page.click('[data-testid="decode-button"]');
    await expect(page.locator('[data-testid="decoded-content"]')).toBeVisible();
    
    // Test token copying
    await page.click('[data-testid="copy-button"]');
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
  });
});
```

---

## 🔍 Production App Quality Checklist

### **Before Production Release Checklist:**
- [ ] **Single Responsibility**: Each component has one clear purpose
- [ ] **Open/Closed**: Can extend functionality without modifying existing code
- [ ] **Liskov Substitution**: Components can be substituted without breaking functionality
- [ ] **Interface Segregation**: Components only depend on interfaces they use
- [ ] **Dependency Inversion**: Components depend on abstractions, not concretions
- [ ] **Token Security**: JWT validation and secure handling implemented
- [ ] **State Persistence**: State properly persisted across page refreshes
- [ ] **Error Handling**: Comprehensive error handling with user feedback
- [ ] **Performance**: Optimized rendering and memory management
- [ ] **Testing**: Unit, integration, and E2E tests completed

### **Code Review Checklist:**
- [ ] **Component Focus**: Does each component have a single responsibility?
- [ ] **Interface Design**: Are interfaces focused and minimal?
- [ ] **Dependency Management**: Are dependencies injected rather than hard-coded?
- [ ] **Error Boundaries**: Are error boundaries properly implemented?
- [ ] **Performance**: Are React optimizations used appropriately?
- [ ] **Security**: Are tokens handled securely without exposure?
- [ ] **Testing**: Are all components properly tested?
- [ ] **Documentation**: Is the code properly documented?

---

## 🚀 Production App Deployment Guidelines

### **Pre-Deployment Validation:**
```bash
# Run SWE-15 compliance checks
npm run lint:production
npm run test:unit
npm run test:integration
npm run test:e2e

# Run production-specific checks
npm run check:token-security
npm run check:state-persistence
npm run check:error-handling
npm run check:performance
```

### **Deployment Checklist:**
- [ ] **Version Synchronization**: All version fields updated together
- [ ] **Environment Configuration**: Production environment properly configured
- [ ] **Service Dependencies**: All external services available and configured
- [ ] **State Persistence**: localStorage properly configured for production
- [ ] **Error Monitoring**: Error tracking properly configured
- [ ] **Performance Monitoring**: Performance metrics collection enabled
- [ ] **Security Validation**: Security headers and configurations verified
- [ ] **Backup Strategy**: Data backup and recovery procedures in place

---

## 📚 Production App Documentation

### **Required Documentation:**
- **Component Documentation**: Each component documented with purpose and usage
- **Service Documentation**: Each service documented with interface and behavior
- **Integration Documentation**: How components integrate with services
- **Testing Documentation**: Test coverage and testing strategies
- **Deployment Documentation**: Deployment procedures and requirements

### **Documentation Standards:**
```typescript
/**
 * TokenMonitoringService
 * 
 * Purpose: Real-time tracking and management of OAuth tokens
 * 
 * Responsibilities:
 * - Track token lifecycle (creation, refresh, expiry, revocation)
 * - Provide token state persistence across page refreshes
 * - Emit token updates to subscribed components
 * - Maintain token metadata and status information
 * 
 * Interface: ITokenService
 * Dependencies: EnhancedStateManagement, TokenDisplayService
 * 
 * Usage:
 * ```typescript
 * const service = TokenMonitoringService.getInstance();
 * service.trackToken(token);
 * const tokens = service.getAllTokens();
 * ```
 * 
 * SWE-15 Compliance:
 * - Single Responsibility: Only handles token tracking
 * - Open/Closed: Can extend persistence without modifying core logic
 * - Liskov Substitution: Implements ITokenService interface
 * - Interface Segregation: Focused token service interface
 * - Dependency Inversion: Depends on abstractions, not concretions
 */
```

---

**Remember**: Always follow SWE-15 principles when developing Production applications. This guide ensures:
- **Consistent Architecture**: All production apps follow the same patterns
- **Maintainable Code**: Components and services are easy to maintain and extend
- **Secure Implementation**: Tokens and state are handled securely
- **Performance Optimization**: Apps are optimized for production use
- **Quality Assurance**: Comprehensive testing and validation

---

**Last Updated**: February 12, 2026  
**Next Review**: February 19, 2026  
**Maintainers**: Production Development Team
