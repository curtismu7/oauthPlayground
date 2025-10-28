// src/services/__tests__/serviceRegistry.integration.test.ts
/**
 * Integration Tests for Service Registry Pattern
 * 
 * Tests the complete service registry functionality including service registration,
 * dependency injection, lifecycle management, and performance monitoring.
 * 
 * @version 1.0.0
 * @author OAuth Playground Team
 * @since 2024-01-01
 */

import { ServiceRegistry, ServiceCategory, ServiceState } from '../serviceRegistry';
import { ServicePerformanceMonitor, AlertLevel } from '../servicePerformanceMonitor';
import { vi } from 'vitest';

// Mock services for testing
class MockCredentialService {
  constructor(public name: string = 'MockCredentialService') {}
  
  async validateCredentials(credentials: any): Promise<boolean> {
    return credentials && credentials.clientId;
  }
}

class MockFlowService {
  constructor(
    private credentialService: MockCredentialService,
    public name: string = 'MockFlowService'
  ) {}
  
  async processFlow(flowData: any): Promise<any> {
    const isValid = await this.credentialService.validateCredentials(flowData.credentials);
    return { isValid, processed: true };
  }
}

class MockApiService {
  constructor(public name: string = 'MockApiService') {}
  
  async makeRequest(endpoint: string): Promise<any> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 10));
    return { endpoint, success: true };
  }
}

describe('Service Registry Integration Tests', () => {
  let registry: ServiceRegistry;
  let performanceMonitor: ServicePerformanceMonitor;

  beforeEach(() => {
    registry = new ServiceRegistry();
    performanceMonitor = new ServicePerformanceMonitor({
      enabled: true,
      samplingRate: 1.0,
      alertThresholds: {
        maxResponseTime: 50, // Lower threshold for testing
        maxErrorRate: 0,
        maxMemoryUsage: 10,
        minThroughput: 1,
      },
      metricsRetentionDays: 1,
      enableRealTimeAlerts: true,
    });
  });

  afterEach(async () => {
    await registry.shutdown();
    performanceMonitor.stopMonitoring();
  });

  describe('Service Registration and Discovery', () => {
    it('should register services with metadata', () => {
      registry.register(
        'credential-service',
        () => new MockCredentialService(),
        {
          name: 'credential-service',
          version: '1.0.0',
          description: 'Mock credential validation service',
          dependencies: [],
          tags: ['auth', 'validation'],
          category: ServiceCategory.CREDENTIAL,
          priority: 1,
          singleton: true,
          lazy: false,
        }
      );

      const services = registry.getAllServices();
      expect(services.size).toBe(0); // Not instantiated yet
    });

    it('should create service instances on demand', async () => {
      registry.register(
        'credential-service',
        () => new MockCredentialService(),
        {
          name: 'credential-service',
          dependencies: [],
          category: ServiceCategory.CREDENTIAL,
        }
      );

      const service = await registry.get<MockCredentialService>('credential-service');
      
      expect(service).toBeInstanceOf(MockCredentialService);
      expect(service.name).toBe('MockCredentialService');
    });

    it('should resolve service dependencies', async () => {
      // Register credential service first
      registry.register(
        'credential-service',
        () => new MockCredentialService(),
        {
          name: 'credential-service',
          dependencies: [],
          category: ServiceCategory.CREDENTIAL,
        }
      );

      // Register flow service with dependency
      registry.register(
        'flow-service',
        (reg) => {
          const credentialService = reg.get<MockCredentialService>('credential-service');
          return new MockFlowService(credentialService);
        },
        {
          name: 'flow-service',
          dependencies: ['credential-service'],
          category: ServiceCategory.FLOW,
        }
      );

      const flowService = await registry.get<MockFlowService>('flow-service');
      
      expect(flowService).toBeInstanceOf(MockFlowService);
      expect(flowService.name).toBe('MockFlowService');
    });

    it('should handle circular dependencies gracefully', async () => {
      registry.register(
        'service-a',
        (reg) => {
          const serviceB = reg.get('service-b');
          return { name: 'ServiceA', dependency: serviceB };
        },
        {
          name: 'service-a',
          dependencies: ['service-b'],
          category: ServiceCategory.UTILITY,
        }
      );

      registry.register(
        'service-b',
        (reg) => {
          const serviceA = reg.get('service-a');
          return { name: 'ServiceB', dependency: serviceA };
        },
        {
          name: 'service-b',
          dependencies: ['service-a'],
          category: ServiceCategory.UTILITY,
        }
      );

      // This should throw an error due to circular dependency
      await expect(registry.get('service-a')).rejects.toThrow();
    });
  });

  describe('Service Lifecycle Management', () => {
    it('should track service states correctly', async () => {
      registry.register(
        'test-service',
        () => new MockCredentialService(),
        {
          name: 'test-service',
          dependencies: [],
          category: ServiceCategory.UTILITY,
        }
      );

      // Service should be unregistered initially
      let health = registry.getServiceHealth('test-service');
      expect(health.state).toBe(ServiceState.UNREGISTERED);

      // Create service instance
      await registry.get('test-service');

      // Service should be ready
      health = registry.getServiceHealth('test-service');
      expect(health.state).toBe(ServiceState.READY);
      expect(health.healthy).toBe(true);
    });

    it('should handle service creation errors', async () => {
      registry.register(
        'error-service',
        () => {
          throw new Error('Service creation failed');
        },
        {
          name: 'error-service',
          dependencies: [],
          category: ServiceCategory.UTILITY,
        }
      );

      await expect(registry.get('error-service')).rejects.toThrow('Service creation failed');

      const health = registry.getServiceHealth('error-service');
      expect(health.state).toBe(ServiceState.ERROR);
      expect(health.healthy).toBe(false);
    });

    it('should shutdown all services correctly', async () => {
      registry.register(
        'service-1',
        () => new MockCredentialService('Service1'),
        { name: 'service-1', dependencies: [], category: ServiceCategory.UTILITY }
      );

      registry.register(
        'service-2',
        () => new MockCredentialService('Service2'),
        { name: 'service-2', dependencies: [], category: ServiceCategory.UTILITY }
      );

      await registry.get('service-1');
      await registry.get('service-2');

      expect(registry.getAllServices().size).toBe(2);

      await registry.shutdown();

      expect(registry.getAllServices().size).toBe(0);
    });
  });

  describe('Service Categorization and Filtering', () => {
    beforeEach(async () => {
      registry.register(
        'credential-service',
        () => new MockCredentialService(),
        {
          name: 'credential-service',
          dependencies: [],
          category: ServiceCategory.CREDENTIAL,
        }
      );

      registry.register(
        'flow-service',
        () => new MockFlowService(new MockCredentialService()),
        {
          name: 'flow-service',
          dependencies: [],
          category: ServiceCategory.FLOW,
        }
      );

      registry.register(
        'api-service',
        () => new MockApiService(),
        {
          name: 'api-service',
          dependencies: [],
          category: ServiceCategory.API,
        }
      );

      // Create all services
      await registry.get('credential-service');
      await registry.get('flow-service');
      await registry.get('api-service');
    });

    it('should filter services by category', () => {
      const credentialServices = registry.getServicesByCategory(ServiceCategory.CREDENTIAL);
      const flowServices = registry.getServicesByCategory(ServiceCategory.FLOW);
      const apiServices = registry.getServicesByCategory(ServiceCategory.API);

      expect(credentialServices).toHaveLength(1);
      expect(credentialServices[0].metadata.name).toBe('credential-service');

      expect(flowServices).toHaveLength(1);
      expect(flowServices[0].metadata.name).toBe('flow-service');

      expect(apiServices).toHaveLength(1);
      expect(apiServices[0].metadata.name).toBe('api-service');
    });

    it('should return empty array for non-existent category', () => {
      const securityServices = registry.getServicesByCategory(ServiceCategory.SECURITY);
      expect(securityServices).toHaveLength(0);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should monitor service performance metrics', async () => {
      registry.register(
        'slow-service',
        async () => {
          // Simulate slow service creation
          await new Promise(resolve => setTimeout(resolve, 100));
          return new MockCredentialService();
        },
        {
          name: 'slow-service',
          dependencies: [],
          category: ServiceCategory.UTILITY,
        }
      );

      const service = await registry.get('slow-service');
      expect(service).toBeDefined();

      // Wait for metrics collection
      await new Promise(resolve => setTimeout(resolve, 100));

      const health = registry.getServiceHealth('slow-service');
      expect(health.metrics.lastResponseTime).toBeGreaterThan(90);
      expect(health.metrics.totalRequests).toBe(1);
    });

    it('should track service access patterns', async () => {
      registry.register(
        'access-tracked-service',
        () => new MockCredentialService(),
        {
          name: 'access-tracked-service',
          dependencies: [],
          category: ServiceCategory.UTILITY,
        }
      );

      // Access service multiple times
      await registry.get('access-tracked-service');
      await registry.get('access-tracked-service');
      await registry.get('access-tracked-service');

      const service = registry.getAllServices().get('access-tracked-service');
      expect(service?.accessCount).toBe(3);
      expect(service?.lastAccessed).toBeDefined();
    });

    it('should generate performance alerts', async () => {
      const alertCallback = vi.fn();
      performanceMonitor.on('alert', alertCallback);

      registry.register(
        'alert-service',
        async () => {
          // Simulate very slow service
          await new Promise(resolve => setTimeout(resolve, 200));
          return new MockCredentialService();
        },
        {
          name: 'alert-service',
          dependencies: [],
          category: ServiceCategory.UTILITY,
        }
      );

      await registry.get('alert-service');

      // Wait for alert generation
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(alertCallback).toHaveBeenCalled();
      const alert = alertCallback.mock.calls[0][0];
      expect(alert.level).toBe(AlertLevel.WARNING);
      expect(alert.serviceName).toBe('alert-service');
    });
  });

  describe('Registry Health Monitoring', () => {
    it('should report overall registry health', async () => {
      registry.register(
        'healthy-service',
        () => new MockCredentialService(),
        {
          name: 'healthy-service',
          dependencies: [],
          category: ServiceCategory.UTILITY,
        }
      );

      registry.register(
        'unhealthy-service',
        () => {
          throw new Error('Service error');
        },
        {
          name: 'unhealthy-service',
          dependencies: [],
          category: ServiceCategory.UTILITY,
        }
      );

      await registry.get('healthy-service');
      
      try {
        await registry.get('unhealthy-service');
      } catch (error) {
        // Expected to fail
      }

      const health = registry.getRegistryHealth();
      expect(health.totalServices).toBe(2);
      expect(health.healthyServices).toBe(1);
      expect(health.unhealthyServices).toBe(1);
      expect(health.healthy).toBe(false);
    });

    it('should report healthy registry when all services are healthy', async () => {
      registry.register(
        'service-1',
        () => new MockCredentialService(),
        { name: 'service-1', dependencies: [], category: ServiceCategory.UTILITY }
      );

      registry.register(
        'service-2',
        () => new MockCredentialService(),
        { name: 'service-2', dependencies: [], category: ServiceCategory.UTILITY }
      );

      await registry.get('service-1');
      await registry.get('service-2');

      const health = registry.getRegistryHealth();
      expect(health.totalServices).toBe(2);
      expect(health.healthyServices).toBe(2);
      expect(health.unhealthyServices).toBe(0);
      expect(health.healthy).toBe(true);
    });
  });

  describe('Real-world OAuth Flow Integration', () => {
    it('should handle complete OAuth flow service chain', async () => {
      // Register services in dependency order
      registry.register(
        'credential-service',
        () => new MockCredentialService(),
        {
          name: 'credential-service',
          dependencies: [],
          category: ServiceCategory.CREDENTIAL,
        }
      );

      registry.register(
        'api-service',
        () => new MockApiService(),
        {
          name: 'api-service',
          dependencies: [],
          category: ServiceCategory.API,
        }
      );

      registry.register(
        'flow-service',
        (reg) => {
          const credentialService = reg.get<MockCredentialService>('credential-service');
          return new MockFlowService(credentialService);
        },
        {
          name: 'flow-service',
          dependencies: ['credential-service'],
          category: ServiceCategory.FLOW,
        }
      );

      // Simulate OAuth flow execution
      const flowService = await registry.get<MockFlowService>('flow-service');
      const apiService = await registry.get<MockApiService>('api-service');

      const flowResult = await flowService.processFlow({
        credentials: { clientId: 'test-client' }
      });

      const apiResult = await apiService.makeRequest('/oauth/token');

      expect(flowResult.isValid).toBe(true);
      expect(apiResult.success).toBe(true);

      // Verify all services are healthy
      const health = registry.getRegistryHealth();
      expect(health.healthy).toBe(true);
      expect(health.totalServices).toBe(3);
    });
  });
});
