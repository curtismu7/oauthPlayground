// src/services/serviceRegistry.ts
/**
 * Service Registry Pattern Implementation
 *
 * Provides centralized service management, dependency injection, and lifecycle management
 * for all OAuth/OIDC services in the application.
 *
 * Features:
 * - Service registration and discovery
 * - Dependency injection
 * - Service lifecycle management
 * - Performance monitoring
 * - Health checks
 * - Service versioning
 */

// Browser-compatible EventEmitter implementation
class EventEmitter {
	private listeners = new Map<string, Function[]>();

	on(event: string, listener: Function): this {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)!.push(listener);
		return this;
	}

	emit(event: string, ...args: any[]): boolean {
		const eventListeners = this.listeners.get(event);
		if (!eventListeners || eventListeners.length === 0) {
			return false;
		}

		eventListeners.forEach((listener) => {
			try {
				listener(...args);
			} catch (error) {
				console.error(`Error in event listener for ${event}:`, error);
			}
		});

		return true;
	}

	removeListener(event: string, listener: Function): this {
		const eventListeners = this.listeners.get(event);
		if (eventListeners) {
			const index = eventListeners.indexOf(listener);
			if (index > -1) {
				eventListeners.splice(index, 1);
			}
		}
		return this;
	}

	removeAllListeners(event?: string): this {
		if (event) {
			this.listeners.delete(event);
		} else {
			this.listeners.clear();
		}
		return this;
	}

	setMaxListeners(_max: number): this {
		// Simple implementation - in a real EventEmitter this would be more complex
		return this;
	}
}

// Service lifecycle states
export enum ServiceState {
	UNREGISTERED = 'unregistered',
	REGISTERED = 'registered',
	INITIALIZING = 'initializing',
	READY = 'ready',
	ERROR = 'error',
	SHUTDOWN = 'shutdown',
}

// Service metadata interface
export interface ServiceMetadata {
	name: string;
	version: string;
	description?: string;
	dependencies: string[];
	tags: string[];
	category: ServiceCategory;
	priority: number; // Higher number = higher priority
	singleton: boolean;
	lazy: boolean; // Load on demand vs eager loading
}

// Service categories for organization
export enum ServiceCategory {
	CREDENTIAL = 'credential',
	FLOW = 'flow',
	UI = 'ui',
	API = 'api',
	VALIDATION = 'validation',
	ERROR_HANDLING = 'error_handling',
	SECURITY = 'security',
	UTILITY = 'utility',
}

// Service instance interface
export interface ServiceInstance<T = any> {
	metadata: ServiceMetadata;
	instance: T;
	state: ServiceState;
	createdAt: Date;
	lastAccessed: Date;
	accessCount: number;
	errorCount: number;
	performanceMetrics: ServicePerformanceMetrics;
}

// Performance metrics interface
export interface ServicePerformanceMetrics {
	averageResponseTime: number;
	totalRequests: number;
	errorRate: number;
	memoryUsage: number;
	lastResponseTime: number;
	slowestRequest: number;
	fastestRequest: number;
}

// Service factory function type
export type ServiceFactory<T = any> = (registry: ServiceRegistry) => T | Promise<T>;

// Service registry class
export class ServiceRegistry extends EventEmitter {
	private services = new Map<string, ServiceInstance>();
	private factories = new Map<string, ServiceFactory>();
	private dependencies = new Map<string, string[]>();
	private metadata = new Map<string, ServiceMetadata>(); // Store metadata
	private initializationOrder: string[] = [];

	constructor() {
		super();
		// Prevent memory leaks by limiting listeners
		this.setMaxListeners(50);
	}

	/**
	 * Register a service factory
	 * @param name Service name
	 * @param factory Service factory function
	 * @param metadata Service metadata
	 */
	register<T>(
		name: string,
		factory: ServiceFactory<T>,
		metadata: Partial<ServiceMetadata> & { name: string }
	): void {
		const fullMetadata: ServiceMetadata = {
			name,
			version: '1.0.0',
			description: '',
			dependencies: [],
			tags: [],
			category: ServiceCategory.UTILITY,
			priority: 0,
			singleton: true,
			lazy: false,
			...metadata,
		};

		this.factories.set(name, factory);
		this.dependencies.set(name, fullMetadata.dependencies);
		this.metadata.set(name, fullMetadata); // Store metadata

		console.log(`[ServiceRegistry] Registered service: ${name} v${fullMetadata.version}`);
		this.emit('serviceRegistered', { name, metadata: fullMetadata });
	}

	/**
	 * Get a service instance
	 * @param name Service name
	 * @returns Service instance
	 */
	async get<T>(name: string): Promise<T> {
		// Check if service exists
		if (!this.factories.has(name)) {
			throw new Error(`Service '${name}' is not registered`);
		}

		// Return existing singleton instance
		if (this.services.has(name)) {
			const service = this.services.get(name)!;
			service.lastAccessed = new Date();
			service.accessCount++;
			return service.instance as T;
		}

		// Create new instance
		return this.createService<T>(name);
	}

	/**
	 * Create a service instance
	 * @param name Service name
	 * @returns Service instance
	 */
	private async createService<T>(name: string): Promise<T> {
		const factory = this.factories.get(name)!;
		const metadata = this.getServiceMetadata(name);

		const serviceInstance: ServiceInstance<T> = {
			metadata,
			instance: null as T,
			state: ServiceState.INITIALIZING,
			createdAt: new Date(),
			lastAccessed: new Date(),
			accessCount: 0,
			errorCount: 0,
			performanceMetrics: {
				averageResponseTime: 0,
				totalRequests: 0,
				errorRate: 0,
				memoryUsage: 0,
				lastResponseTime: 0,
				slowestRequest: 0,
				fastestRequest: Infinity,
			},
		};

		try {
			// Resolve dependencies first
			await this.resolveDependencies(name);

			// Create service instance
			const startTime = performance.now();
			serviceInstance.instance = await factory(this);
			const endTime = performance.now();

			serviceInstance.state = ServiceState.READY;
			serviceInstance.performanceMetrics.lastResponseTime = endTime - startTime;
			serviceInstance.performanceMetrics.averageResponseTime =
				serviceInstance.performanceMetrics.lastResponseTime;
			serviceInstance.performanceMetrics.totalRequests = 1;

			this.services.set(name, serviceInstance);

			console.log(
				`[ServiceRegistry] Created service: ${name} (${serviceInstance.performanceMetrics.lastResponseTime.toFixed(2)}ms)`
			);
			this.emit('serviceCreated', { name, serviceInstance });

			return serviceInstance.instance;
		} catch (error) {
			serviceInstance.state = ServiceState.ERROR;
			serviceInstance.errorCount++;
			serviceInstance.performanceMetrics.errorRate = 1;

			console.error(`[ServiceRegistry] Failed to create service: ${name}`, error);
			this.emit('serviceError', { name, error, serviceInstance });

			throw error;
		}
	}

	/**
	 * Resolve service dependencies
	 * @param name Service name
	 */
	private async resolveDependencies(name: string): Promise<void> {
		const dependencies = this.dependencies.get(name) || [];
		const resolvingStack = new Set<string>();

		await this.resolveDependencyRecursive(name, dependencies, resolvingStack);
	}

	/**
	 * Recursively resolve dependencies with circular dependency detection
	 * @param serviceName Service name
	 * @param dependencies Dependencies to resolve
	 * @param resolvingStack Current resolution stack for cycle detection
	 */
	private async resolveDependencyRecursive(
		serviceName: string,
		dependencies: string[],
		resolvingStack: Set<string>
	): Promise<void> {
		// Check for circular dependency
		if (resolvingStack.has(serviceName)) {
			const cycle = `${Array.from(resolvingStack).join(' -> ')} -> ${serviceName}`;
			throw new Error(`Circular dependency detected: ${cycle}`);
		}

		resolvingStack.add(serviceName);

		try {
			for (const dep of dependencies) {
				if (!this.services.has(dep)) {
					const depDependencies = this.dependencies.get(dep) || [];
					await this.resolveDependencyRecursive(dep, depDependencies, resolvingStack);
					await this.get(dep);
				}
			}
		} finally {
			resolvingStack.delete(serviceName);
		}
	}

	/**
	 * Get service metadata
	 * @param name Service name
	 * @returns Service metadata
	 */
	private getServiceMetadata(name: string): ServiceMetadata {
		const metadata = this.metadata.get(name);
		if (!metadata) {
			throw new Error(`Service metadata not found for: ${name}`);
		}
		return metadata;
	}

	/**
	 * Get all registered services
	 * @returns Map of service instances
	 */
	getAllServices(): Map<string, ServiceInstance> {
		return new Map(this.services);
	}

	/**
	 * Get services by category
	 * @param category Service category
	 * @returns Array of service instances
	 */
	getServicesByCategory(category: ServiceCategory): ServiceInstance[] {
		return Array.from(this.services.values()).filter(
			(service) => service.metadata.category === category
		);
	}

	/**
	 * Get service health status
	 * @param name Service name
	 * @returns Health status
	 */
	getServiceHealth(name: string): {
		healthy: boolean;
		state: ServiceState;
		metrics: ServicePerformanceMetrics;
	} {
		const service = this.services.get(name);
		if (!service) {
			return {
				healthy: false,
				state: ServiceState.UNREGISTERED,
				metrics: {} as ServicePerformanceMetrics,
			};
		}

		const healthy = service.state === ServiceState.READY && service.errorCount === 0;
		return {
			healthy,
			state: service.state,
			metrics: service.performanceMetrics,
		};
	}

	/**
	 * Get overall registry health
	 * @returns Registry health status
	 */
	getRegistryHealth(): {
		healthy: boolean;
		totalServices: number;
		healthyServices: number;
		unhealthyServices: number;
	} {
		const services = Array.from(this.services.values());
		const healthyServices = services.filter(
			(s) => s.state === ServiceState.READY && s.errorCount === 0
		).length;
		const unhealthyServices = services.length - healthyServices;

		return {
			healthy: unhealthyServices === 0,
			totalServices: services.length,
			healthyServices,
			unhealthyServices,
		};
	}

	/**
	 * Shutdown all services
	 */
	async shutdown(): Promise<void> {
		console.log('[ServiceRegistry] Shutting down all services...');

		// Shutdown services in reverse order of initialization
		const shutdownOrder = [...this.initializationOrder].reverse();

		for (const name of shutdownOrder) {
			const service = this.services.get(name);
			if (service) {
				service.state = ServiceState.SHUTDOWN;
				this.emit('serviceShutdown', { name, service });
			}
		}

		this.services.clear();
		this.isInitialized = false;

		console.log('[ServiceRegistry] All services shut down');
	}
}

// Global service registry instance
export const serviceRegistry = new ServiceRegistry();

// Service decorator for automatic registration
export function Service(metadata: Partial<ServiceMetadata> & { name: string }) {
	return <T extends new (...args: any[]) => any>(constructor: T) => {
		serviceRegistry.register(metadata.name, () => new constructor(), metadata);
		return constructor;
	};
}

// Service injection decorator
export function Inject(_serviceName: string) {
	return (_target: any, _propertyKey: string | symbol | undefined, _parameterIndex: number) => {
		// This would be implemented with a more sophisticated DI system
		// For now, it's a placeholder for future enhancement
	};
}

export default serviceRegistry;
