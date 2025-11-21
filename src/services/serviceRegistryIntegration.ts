// src/services/serviceRegistryIntegration.ts
/**
 * Service Registry Integration
 *
 * Integrates existing services with the new service registry pattern.
 * This module provides backward compatibility while enabling the new architecture.
 *
 * @version 1.0.0
 * @author OAuth Playground Team
 * @since 2024-01-01
 */

import ComprehensiveCredentialsService from './comprehensiveCredentialsService';
import { CredentialGuardService } from './credentialGuardService';
import { FlowCredentialService } from './flowCredentialService';
import { servicePerformanceMonitor } from './servicePerformanceMonitor';
import { ServiceCategory, serviceRegistry } from './serviceRegistry';
import { V7CredentialValidationService } from './v7CredentialValidationService';

/**
 * Initialize all services with the service registry
 *
 * This function registers all existing services with the new service registry
 * pattern, enabling dependency injection, performance monitoring, and
 * centralized service management.
 *
 * @example
 * ```typescript
 * // Initialize services on application startup
 * await initializeServiceRegistry();
 *
 * // Services are now available through the registry
 * const credentialService = await serviceRegistry.get('credential-validation-service');
 * ```
 */
export async function initializeServiceRegistry(): Promise<void> {
	// Prevent multiple initializations
	if (serviceRegistry.getAllServices().size > 0) {
		console.log('[ServiceRegistryIntegration] Service registry already initialized, skipping...');
		return;
	}

	console.log('[ServiceRegistryIntegration] Initializing service registry...');

	try {
		// Register V7 Credential Validation Service
		serviceRegistry.register('credential-validation-service', () => V7CredentialValidationService, {
			name: 'credential-validation-service',
			version: '1.0.0',
			description: 'Centralized credential validation for all V7 flows',
			dependencies: [],
			tags: ['validation', 'credentials', 'v7'],
			category: ServiceCategory.VALIDATION,
			priority: 10,
			singleton: true,
			lazy: true, // Load on demand to avoid startup delays
		});

		// Register Flow Credential Service
		serviceRegistry.register('flow-credential-service', () => FlowCredentialService, {
			name: 'flow-credential-service',
			version: '1.0.0',
			description: 'Unified credential management for OAuth/OIDC flows',
			dependencies: [],
			tags: ['credentials', 'flow', 'oauth', 'oidc'],
			category: ServiceCategory.CREDENTIAL,
			priority: 9,
			singleton: true,
			lazy: true, // Load on demand to avoid startup delays
		});

		// Register Credential Guard Service
		serviceRegistry.register('credential-guard-service', () => CredentialGuardService, {
			name: 'credential-guard-service',
			version: '1.0.0',
			description: 'Credential validation and security guard service',
			dependencies: [],
			tags: ['security', 'validation', 'guard'],
			category: ServiceCategory.SECURITY,
			priority: 8,
			singleton: true,
			lazy: true, // Load on demand to avoid startup delays
		});

		// Register Comprehensive Credentials Service
		serviceRegistry.register(
			'comprehensive-credentials-service',
			() => ComprehensiveCredentialsService,
			{
				name: 'comprehensive-credentials-service',
				version: '1.0.0',
				description: 'Comprehensive credential management and display service',
				dependencies: ['flow-credential-service'],
				tags: ['credentials', 'comprehensive', 'ui'],
				category: ServiceCategory.CREDENTIAL,
				priority: 7,
				singleton: true,
				lazy: true, // Load on demand since it's UI-heavy
			}
		);

		// Start performance monitoring
		servicePerformanceMonitor.startMonitoring();

		console.log('[ServiceRegistryIntegration] Service registry initialized successfully');

		// Log registry health
		const health = serviceRegistry.getRegistryHealth();
		console.log(
			`[ServiceRegistryIntegration] Registry health: ${health.healthy ? 'HEALTHY' : 'UNHEALTHY'}`
		);
		console.log(`[ServiceRegistryIntegration] Total services: ${health.totalServices}`);
	} catch (error) {
		console.error('[ServiceRegistryIntegration] Failed to initialize service registry:', error);
		throw error;
	}
}

/**
 * Get a service from the registry with type safety
 *
 * @template T The service type
 * @param name Service name
 * @returns Promise resolving to the service instance
 *
 * @example
 * ```typescript
 * const credentialService = await getService<typeof V7CredentialValidationService>('credential-validation-service');
 * ```
 */
export async function getService<T>(name: string): Promise<T> {
	return serviceRegistry.get<T>(name);
}

/**
 * Get all services by category
 *
 * @param category Service category
 * @returns Array of service instances
 *
 * @example
 * ```typescript
 * const credentialServices = getServicesByCategory(ServiceCategory.CREDENTIAL);
 * ```
 */
export function getServicesByCategory(category: ServiceCategory) {
	return serviceRegistry.getServicesByCategory(category);
}

/**
 * Get service health status
 *
 * @param name Service name
 * @returns Service health status
 *
 * @example
 * ```typescript
 * const health = getServiceHealth('credential-validation-service');
 * console.log(`Service is ${health.healthy ? 'healthy' : 'unhealthy'}`);
 * ```
 */
export function getServiceHealth(name: string) {
	return serviceRegistry.getServiceHealth(name);
}

/**
 * Get overall registry health
 *
 * @returns Registry health status
 *
 * @example
 * ```typescript
 * const health = getRegistryHealth();
 * if (!health.healthy) {
 *   console.error(`Registry has ${health.unhealthyServices} unhealthy services`);
 * }
 * ```
 */
export function getRegistryHealth() {
	return serviceRegistry.getRegistryHealth();
}

/**
 * Get performance summary
 *
 * @returns Performance summary for all services
 *
 * @example
 * ```typescript
 * const summary = getPerformanceSummary();
 * console.log(`Average response time: ${summary.averageResponseTime}ms`);
 * console.log(`Health score: ${summary.healthScore}/100`);
 * ```
 */
export function getPerformanceSummary() {
	return servicePerformanceMonitor.getPerformanceSummary();
}

/**
 * Export performance metrics
 *
 * @returns JSON string of performance metrics
 *
 * @example
 * ```typescript
 * const metrics = exportPerformanceMetrics();
 * fs.writeFileSync('performance-metrics.json', metrics);
 * ```
 */
export function exportPerformanceMetrics(): string {
	return servicePerformanceMonitor.exportMetrics();
}

/**
 * Shutdown all services
 *
 * @example
 * ```typescript
 * // Shutdown services on application exit
 * await shutdownServiceRegistry();
 * ```
 */
export async function shutdownServiceRegistry(): Promise<void> {
	console.log('[ServiceRegistryIntegration] Shutting down service registry...');

	servicePerformanceMonitor.stopMonitoring();
	await serviceRegistry.shutdown();

	console.log('[ServiceRegistryIntegration] Service registry shut down successfully');
}

/**
 * Service registry health check endpoint
 *
 * This function provides a comprehensive health check that can be used
 * by monitoring systems or health check endpoints.
 *
 * @returns Comprehensive health status
 *
 * @example
 * ```typescript
 * // Use in health check endpoint
 * app.get('/health', (req, res) => {
 *   const health = performHealthCheck();
 *   res.status(health.healthy ? 200 : 503).json(health);
 * });
 * ```
 */
export function performHealthCheck(): {
	healthy: boolean;
	timestamp: string;
	registry: ReturnType<typeof getRegistryHealth>;
	performance: ReturnType<typeof getPerformanceSummary>;
	services: Array<{
		name: string;
		healthy: boolean;
		state: string;
		metrics: any;
	}>;
} {
	const registry = getRegistryHealth();
	const performance = getPerformanceSummary();
	const services = Array.from(serviceRegistry.getAllServices().entries()).map(
		([name, service]) => ({
			name,
			healthy: service.state === 'ready' && service.errorCount === 0,
			state: service.state,
			metrics: service.performanceMetrics,
		})
	);

	const healthy = registry.healthy && performance.healthScore > 80;

	return {
		healthy,
		timestamp: new Date().toISOString(),
		registry,
		performance,
		services,
	};
}

// Export the service registry and performance monitor for direct access
export { serviceRegistry, servicePerformanceMonitor };

export { AlertLevel } from './servicePerformanceMonitor';
// Export service categories for convenience
export { ServiceCategory } from './serviceRegistry';

export default {
	initializeServiceRegistry,
	getService,
	getServicesByCategory,
	getServiceHealth,
	getRegistryHealth,
	getPerformanceSummary,
	exportPerformanceMetrics,
	shutdownServiceRegistry,
	performHealthCheck,
};
