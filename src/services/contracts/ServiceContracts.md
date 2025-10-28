// src/services/contracts/ServiceContracts.md
# Service Contracts and Interfaces

This document defines the contracts, interfaces, and APIs for all services in the OAuth Playground application. These contracts ensure consistency, maintainability, and proper integration between services.

## Table of Contents

1. [Service Registry Contract](#service-registry-contract)
2. [Performance Monitoring Contract](#performance-monitoring-contract)
3. [Credential Validation Contract](#credential-validation-contract)
4. [Flow Management Contract](#flow-management-contract)
5. [API Service Contract](#api-service-contract)
6. [Error Handling Contract](#error-handling-contract)
7. [Service Lifecycle Contract](#service-lifecycle-contract)

---

## Service Registry Contract

### Interface: `ServiceRegistry`

The central service registry manages all service instances, dependencies, and lifecycle.

```typescript
interface ServiceRegistry {
  // Service Registration
  register<T>(name: string, factory: ServiceFactory<T>, metadata: ServiceMetadata): void;
  
  // Service Discovery
  get<T>(name: string): Promise<T>;
  getAllServices(): Map<string, ServiceInstance>;
  getServicesByCategory(category: ServiceCategory): ServiceInstance[];
  
  // Health Monitoring
  getServiceHealth(name: string): ServiceHealthStatus;
  getRegistryHealth(): RegistryHealthStatus;
  
  // Lifecycle Management
  shutdown(): Promise<void>;
}
```

### Service Metadata Contract

```typescript
interface ServiceMetadata {
  name: string;                    // Unique service identifier
  version: string;                 // Semantic version (e.g., "1.0.0")
  description?: string;            // Human-readable description
  dependencies: string[];          // Array of required service names
  tags: string[];                  // Searchable tags
  category: ServiceCategory;       // Service category for organization
  priority: number;                // Initialization priority (higher = first)
  singleton: boolean;             // Whether service is singleton
  lazy: boolean;                   // Load on demand vs eager loading
}
```

### Service Instance Contract

```typescript
interface ServiceInstance<T = any> {
  metadata: ServiceMetadata;       // Service metadata
  instance: T;                     // Actual service instance
  state: ServiceState;            // Current lifecycle state
  createdAt: Date;                // Creation timestamp
  lastAccessed: Date;             // Last access timestamp
  accessCount: number;            // Total access count
  errorCount: number;             // Total error count
  performanceMetrics: ServicePerformanceMetrics; // Performance data
}
```

---

## Performance Monitoring Contract

### Interface: `ServicePerformanceMonitor`

Monitors service performance, generates alerts, and collects metrics.

```typescript
interface ServicePerformanceMonitor {
  // Monitoring Control
  startMonitoring(): void;
  stopMonitoring(): void;
  
  // Metrics Collection
  getServiceMetrics(serviceName: string): ServicePerformanceMetrics | null;
  getMetricsHistory(serviceName: string, hours?: number): ServicePerformanceMetrics[];
  
  // Alert Management
  getActiveAlerts(): PerformanceAlert[];
  resolveAlert(alertId: string): void;
  
  // Reporting
  getPerformanceSummary(): PerformanceSummary;
  exportMetrics(): string;
}
```

### Performance Metrics Contract

```typescript
interface ServicePerformanceMetrics {
  averageResponseTime: number;     // Average response time in ms
  totalRequests: number;           // Total number of requests
  errorRate: number;               // Error rate as percentage
  memoryUsage: number;             // Memory usage in MB
  lastResponseTime: number;        // Last response time in ms
  slowestRequest: number;          // Slowest request time in ms
  fastestRequest: number;          // Fastest request time in ms
}
```

### Performance Alert Contract

```typescript
interface PerformanceAlert {
  id: string;                     // Unique alert identifier
  serviceName: string;            // Service that triggered alert
  level: AlertLevel;              // Alert severity level
  message: string;                // Human-readable message
  timestamp: Date;               // Alert creation time
  metrics: Partial<ServicePerformanceMetrics>; // Related metrics
  resolved: boolean;              // Whether alert is resolved
}
```

---

## Credential Validation Contract

### Interface: `V7CredentialValidationService`

Provides centralized credential validation for all V7 flows.

```typescript
interface V7CredentialValidationService {
  // Main Hook
  useValidation(options: UseV7CredentialValidationOptions): UseV7CredentialValidationReturn;
  
  // Utility Functions
  validateCredentials(flowKey: string, credentials: any, customConfig?: V7FlowCredentialConfig): ValidationResult;
  getFlowConfig(flowKey: string): V7FlowCredentialConfig | undefined;
  getAllFlowConfigs(): Record<string, V7FlowCredentialConfig>;
}
```

### Validation Options Contract

```typescript
interface UseV7CredentialValidationOptions {
  flowKey: string;                // Flow identifier
  credentials: any;               // Credentials to validate
  currentStep: number;            // Current step in flow
  onValidationSuccess?: () => void; // Success callback
  onValidationFailure?: (fields: string[]) => void; // Failure callback
  customConfig?: V7FlowCredentialConfig; // Custom validation rules
}
```

### Validation Return Contract

```typescript
interface UseV7CredentialValidationReturn {
  showMissingCredentialsModal: boolean;     // Modal visibility state
  missingCredentialFields: string[];        // Missing field names
  validateCredentialsAndProceed: (onProceed: () => void) => void; // Validation function
  closeModal: () => void;                   // Modal close function
  CredentialValidationModal: React.FC;      // Modal component
  isValidForStep: boolean;                  // Current validation state
  validationMessage: string;                // Current validation message
}
```

### Flow Configuration Contract

```typescript
interface V7FlowCredentialConfig {
  flowName: string;               // Human-readable flow name
  requiredFields: string[];       // Required credential fields
  fieldLabels: Record<string, string>; // Field display labels
  stepIndex: number;              // Step to validate (usually 0)
  showToastOnSuccess?: boolean;   // Whether to show success toast
  customValidation?: (credentials: any) => ValidationResult; // Custom validation function
}
```

---

## Flow Management Contract

### Interface: `FlowController`

Base contract for all flow controllers.

```typescript
interface FlowController {
  // Flow State
  credentials: FlowCredentials;   // Current credentials
  currentStep: number;           // Current step index
  isComplete: boolean;           // Whether flow is complete
  
  // Flow Control
  nextStep(): void;              // Move to next step
  previousStep(): void;          // Move to previous step
  reset(): void;                 // Reset flow state
  
  // Credential Management
  updateCredentials(credentials: Partial<FlowCredentials>): void;
  saveCredentials(): Promise<void>;
  loadCredentials(): Promise<void>;
  
  // Validation
  validateStep(step: number): boolean;
  getStepValidationMessage(step: number): string;
}
```

### Flow Credentials Contract

```typescript
interface FlowCredentials {
  environmentId: string;         // PingOne environment ID
  clientId: string;              // OAuth client ID
  clientSecret?: string;         // OAuth client secret
  redirectUri?: string;          // OAuth redirect URI
  scopes?: string[];             // OAuth scopes
  responseType?: string;         // OAuth response type
  state?: string;                // OAuth state parameter
  nonce?: string;                // OAuth nonce parameter
  pkceCodeVerifier?: string;     // PKCE code verifier
  pkceCodeChallenge?: string;    // PKCE code challenge
  [key: string]: any;           // Additional flow-specific fields
}
```

---

## API Service Contract

### Interface: `ApiService`

Base contract for all API services.

```typescript
interface ApiService {
  // Request Methods
  get<T>(endpoint: string, options?: RequestOptions): Promise<T>;
  post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>;
  put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T>;
  
  // Authentication
  setAuthToken(token: string): void;
  clearAuth(): void;
  
  // Error Handling
  setErrorHandler(handler: ErrorHandler): void;
  
  // Request Interceptors
  addRequestInterceptor(interceptor: RequestInterceptor): void;
  addResponseInterceptor(interceptor: ResponseInterceptor): void;
}
```

### Request Options Contract

```typescript
interface RequestOptions {
  headers?: Record<string, string>; // Custom headers
  timeout?: number;                 // Request timeout in ms
  retries?: number;                 // Number of retry attempts
  retryDelay?: number;              // Delay between retries in ms
  validateResponse?: boolean;        // Whether to validate response
}
```

---

## Error Handling Contract

### Interface: `ErrorHandler`

Standard error handling interface.

```typescript
interface ErrorHandler {
  handle(error: ServiceError): void;
  canHandle(error: ServiceError): boolean;
  getErrorCode(error: ServiceError): string;
  getErrorMessage(error: ServiceError): string;
}
```

### Service Error Contract

```typescript
interface ServiceError extends Error {
  code: string;                   // Error code
  service: string;                // Service that generated error
  timestamp: Date;                // Error timestamp
  context?: any;                  // Additional context
  recoverable: boolean;           // Whether error is recoverable
  retryable: boolean;             // Whether operation can be retried
}
```

---

## Service Lifecycle Contract

### Service States

```typescript
enum ServiceState {
  UNREGISTERED = 'unregistered',  // Service not registered
  REGISTERED = 'registered',       // Service registered but not instantiated
  INITIALIZING = 'initializing',   // Service being created
  READY = 'ready',                // Service ready for use
  ERROR = 'error',                // Service in error state
  SHUTDOWN = 'shutdown'          // Service shut down
}
```

### Lifecycle Events

```typescript
interface ServiceLifecycleEvents {
  'serviceRegistered': (event: ServiceRegisteredEvent) => void;
  'serviceCreated': (event: ServiceCreatedEvent) => void;
  'serviceError': (event: ServiceErrorEvent) => void;
  'serviceShutdown': (event: ServiceShutdownEvent) => void;
}
```

### Lifecycle Event Contracts

```typescript
interface ServiceRegisteredEvent {
  name: string;
  metadata: ServiceMetadata;
}

interface ServiceCreatedEvent {
  name: string;
  serviceInstance: ServiceInstance;
}

interface ServiceErrorEvent {
  name: string;
  error: Error;
  serviceInstance: ServiceInstance;
}

interface ServiceShutdownEvent {
  name: string;
  service: ServiceInstance;
}
```

---

## Service Categories

```typescript
enum ServiceCategory {
  CREDENTIAL = 'credential',       // Credential management services
  FLOW = 'flow',                   // OAuth/OIDC flow services
  UI = 'ui',                       // User interface services
  API = 'api',                     // API communication services
  VALIDATION = 'validation',       // Validation services
  ERROR_HANDLING = 'error_handling', // Error handling services
  SECURITY = 'security',           // Security services
  UTILITY = 'utility'              // Utility services
}
```

---

## Implementation Guidelines

### 1. Service Registration

All services must be registered with the service registry using the `@Service` decorator or manual registration:

```typescript
@Service({
  name: 'my-service',
  version: '1.0.0',
  dependencies: ['dependency-service'],
  category: ServiceCategory.UTILITY,
  singleton: true,
  lazy: false
})
class MyService {
  // Implementation
}
```

### 2. Error Handling

All services must implement proper error handling:

```typescript
class MyService {
  async performOperation(): Promise<Result> {
    try {
      // Service logic
      return result;
    } catch (error) {
      throw new ServiceError({
        code: 'OPERATION_FAILED',
        service: 'my-service',
        message: 'Operation failed',
        originalError: error,
        recoverable: true,
        retryable: true
      });
    }
  }
}
```

### 3. Performance Monitoring

Services should be designed with performance monitoring in mind:

```typescript
class MyService {
  async performOperation(): Promise<Result> {
    const startTime = performance.now();
    
    try {
      const result = await this.doWork();
      
      // Record success metrics
      this.recordMetrics(startTime, true);
      
      return result;
    } catch (error) {
      // Record error metrics
      this.recordMetrics(startTime, false);
      throw error;
    }
  }
  
  private recordMetrics(startTime: number, success: boolean): void {
    const duration = performance.now() - startTime;
    // Record metrics with performance monitor
  }
}
```

### 4. Dependency Injection

Services should use dependency injection through the service registry:

```typescript
class MyService {
  constructor(
    @Inject('dependency-service') private dependency: DependencyService,
    @Inject('api-service') private api: ApiService
  ) {}
}
```

---

## Testing Requirements

### 1. Unit Tests

Each service must have comprehensive unit tests covering:
- All public methods
- Error scenarios
- Edge cases
- Performance characteristics

### 2. Integration Tests

Integration tests must verify:
- Service registration and discovery
- Dependency resolution
- Lifecycle management
- Performance monitoring
- Error handling

### 3. Contract Compliance

All services must pass contract compliance tests that verify:
- Interface implementation
- Method signatures
- Error handling patterns
- Performance characteristics

---

## Versioning and Compatibility

### Semantic Versioning

Services use semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes to public API
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Backward Compatibility

Services must maintain backward compatibility within major versions:
- Public API methods cannot be removed
- Method signatures cannot change
- Return types cannot change in breaking ways

### Migration Guidelines

When breaking changes are necessary:
1. Deprecate old methods with `@deprecated` JSDoc
2. Provide migration path in documentation
3. Support both old and new APIs during transition
4. Remove deprecated APIs in next major version

---

This contract document serves as the authoritative reference for all service implementations in the OAuth Playground application. All services must comply with these contracts to ensure consistency, maintainability, and proper integration.

