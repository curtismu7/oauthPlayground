/**
 * @file environmentServiceV9.ts
 * @module services/v9
 * @description PingOne Environment Management Service V9 - Enhanced V8 service with full backward compatibility
 * @version 9.0.0
 * @since 2024-03-09
 *
 * V9 enhancements:
 * - Enhanced error handling and validation
 * - Improved caching and performance
 * - Better TypeScript support
 * - Enhanced logging and monitoring
 * - V8 interface compatibility preserved
 *
 * @example
 * // V8 compatible usage
 * const environments = EnvironmentServiceV9.getEnvironments();
 * const env = await EnvironmentServiceV9.getEnvironment('env-id');
 *
 * // V9 enhanced usage
 * const metrics = await EnvironmentServiceV9.getEnvironmentMetrics('env-id');
 * const validation = EnvironmentServiceV9.validateEnvironmentConfig(config);
 */

import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { logger } from '../../utils/logger';

// Re-export V8 types for full compatibility
export type EnvironmentType = 'PRODUCTION' | 'SANDBOX' | 'DEVELOPMENT';
export type EnvironmentStatus = 'ACTIVE' | 'INACTIVE' | 'DELETE_PENDING';

export interface PingOneEnvironment {
	id: string;
	name: string;
	description?: string;
	type: EnvironmentType;
	status: EnvironmentStatus;
	region?: string;
	createdAt: string;
	updatedAt: string;
	softDeletedAt?: string;
	hardDeleteAllowedAt?: string;
	enabledServices: string[];
	capabilities?: EnvironmentCapabilities;
	usage?: EnvironmentUsage;
	// V9 enhanced fields
	healthScore?: number;
	lastHealthCheck?: string;
	complianceStatus?: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';
	tags?: string[];
}

export interface EnvironmentCapabilities {
	applications: {
		enabled: boolean;
		maxApplications: number;
		currentApplications: number;
	};
	users: {
		enabled: boolean;
		maxUsers: number;
		currentUsers: number;
	};
	mfa: {
		enabled: boolean;
		supportedMethods: string[];
	};
	protect: {
		enabled: boolean;
		features: string[];
	};
	advancedIdentityVerification: {
		enabled: boolean;
		supportedMethods: string[];
	};
}

export interface EnvironmentUsage {
	apiCalls: number;
	activeUsers: number;
	storageUsed: number;
	bandwidthUsed: number;
	lastActivity: string;
}

export interface CreateEnvironmentRequest {
	name: string;
	description?: string;
	type: EnvironmentType;
	region?: string;
}

export interface UpdateEnvironmentRequest {
	name?: string;
	description?: string;
	region?: string;
}

export interface EnvironmentListOptions {
	type?: EnvironmentType;
	status?: EnvironmentStatus;
	region?: string;
	page?: number;
	perPage?: number;
	search?: string;
}

export interface EnvironmentListResponse {
	environments: PingOneEnvironment[];
	totalCount: number;
	page: number;
	perPage: number;
	totalPages: number;
}

export interface DeleteEnvironmentOptions {
	force?: boolean;
	reason?: string;
}

// V9 enhanced interfaces
export interface EnvironmentMetrics {
	apiCalls24h: number;
	apiCalls7d: number;
	activeUsers24h: number;
	activeUsers7d: number;
	errorRate: number;
	avgResponseTime: number;
	storageUsage: number;
	bandwidthUsage: number;
	healthScore: number;
}

export interface EnvironmentConfigValidation {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	suggestions: string[];
}

export interface EnhancedPingOneEnvironment extends PingOneEnvironment {
	metrics?: EnvironmentMetrics;
	validation?: EnvironmentConfigValidation;
	dependencies?: string[];
	linkedServices: string[];
}

class EnvironmentServiceV9 {
	private readonly MODULE_TAG = '[🌍 ENVIRONMENT-SERVICE-V9]';
	private readonly CACHE_KEY = 'environments_cache';
	private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	// V8 Compatibility Layer - All V8 methods preserved exactly

	/**
	 * Get all environments (V8 compatible)
	 * @returns Array of PingOneEnvironment objects
	 */
	static getEnvironments(): PingOneEnvironment[] {
		return EnvironmentServiceV9.getEnvironmentsV9();
	}

	/**
	 * Create a new environment (V8 compatible)
	 * @param request - Environment creation data
	 * @returns Promise resolving to created environment
	 */
	static async createEnvironment(request: CreateEnvironmentRequest): Promise<PingOneEnvironment> {
		return EnvironmentServiceV9.createEnvironmentV9(request);
	}

	/**
	 * Update an existing environment (V8 compatible)
	 * @param id - Environment ID
	 * @param request - Update data
	 * @returns Promise resolving to updated environment
	 */
	static async updateEnvironment(
		id: string,
		request: UpdateEnvironmentRequest
	): Promise<PingOneEnvironment> {
		return EnvironmentServiceV9.updateEnvironmentV9(id, request);
	}

	/**
	 * Delete an environment (V8 compatible)
	 * @param id - Environment ID
	 * @param options - Delete options
	 * @returns Promise resolving when deletion is complete
	 */
	static async deleteEnvironment(id: string, options?: DeleteEnvironmentOptions): Promise<void> {
		return EnvironmentServiceV9.deleteEnvironmentV9(id, options);
	}

	/**
	 * Get a specific environment by ID (V8 compatible)
	 * @param id - Environment ID
	 * @returns Promise resolving to environment or null if not found
	 */
	static async getEnvironment(id: string): Promise<PingOneEnvironment | null> {
		return EnvironmentServiceV9.getEnvironmentV9(id);
	}

	// V9 Enhanced Methods

	/**
	 * Get all environments with enhanced features
	 * @param options - List options
	 * @returns Promise resolving to enhanced environment list
	 */
	static async getEnvironmentsV9(options?: EnvironmentListOptions): Promise<PingOneEnvironment[]> {
		const service = new EnvironmentServiceV9();

		try {
			// Check cache first
			const cached = service.getCachedEnvironments();
			if (cached && !options) {
				logger.info(service.MODULE_TAG, 'Returning cached environments');
				return cached;
			}

			// Mock API call - replace with actual implementation
			const mockEnvironments: PingOneEnvironment[] = [
				{
					id: 'env-prod-001',
					name: 'Production Environment',
					description: 'Main production environment',
					type: 'PRODUCTION',
					status: 'ACTIVE',
					region: 'us-east-1',
					createdAt: '2024-01-15T10:00:00Z',
					updatedAt: '2024-03-09T15:30:00Z',
					enabledServices: ['applications', 'users', 'mfa'],
					healthScore: 95,
					lastHealthCheck: new Date().toISOString(),
					complianceStatus: 'COMPLIANT',
					tags: ['production', 'critical'],
				},
				{
					id: 'env-dev-002',
					name: 'Development Environment',
					description: 'Development and testing environment',
					type: 'DEVELOPMENT',
					status: 'ACTIVE',
					region: 'us-west-2',
					createdAt: '2024-02-01T09:00:00Z',
					updatedAt: '2024-03-08T11:45:00Z',
					enabledServices: ['applications', 'users'],
					healthScore: 88,
					lastHealthCheck: new Date().toISOString(),
					complianceStatus: 'COMPLIANT',
					tags: ['development', 'testing'],
				},
			];

			// Apply filters if options provided
			let filteredEnvironments = mockEnvironments;
			if (options) {
				if (options.type) {
					filteredEnvironments = filteredEnvironments.filter((env) => env.type === options.type);
				}
				if (options.status) {
					filteredEnvironments = filteredEnvironments.filter(
						(env) => env.status === options.status
					);
				}
				if (options.region) {
					filteredEnvironments = filteredEnvironments.filter(
						(env) => env.region === options.region
					);
				}
				if (options.search) {
					const searchLower = options.search.toLowerCase();
					filteredEnvironments = filteredEnvironments.filter(
						(env) =>
							env.name.toLowerCase().includes(searchLower) ||
							env.description?.toLowerCase().includes(searchLower)
					);
				}
			}

			// Cache results if no filters
			if (!options) {
				service.setCachedEnvironments(filteredEnvironments);
			}

			logger.info(service.MODULE_TAG, `Retrieved ${filteredEnvironments.length} environments`);
			return filteredEnvironments;
		} catch (error) {
			logger.error(service.MODULE_TAG, 'Failed to retrieve environments', error);
			modernMessaging.showError('Failed to load environments');
			return [];
		}
	}

	/**
	 * Create environment with enhanced validation
	 * @param request - Environment creation data
	 * @returns Promise resolving to created environment
	 */
	static async createEnvironmentV9(request: CreateEnvironmentRequest): Promise<PingOneEnvironment> {
		const service = new EnvironmentServiceV9();

		try {
			// Validate request
			const validation = service.validateEnvironmentConfig(request);
			if (!validation.isValid) {
				throw new Error(`Invalid environment config: ${validation.errors.join(', ')}`);
			}

			// Mock API call - replace with actual implementation
			const newEnvironment: PingOneEnvironment = {
				id: `env-${Date.now()}`,
				name: request.name,
				description: request.description,
				type: request.type,
				status: 'ACTIVE',
				region: request.region || 'us-east-1',
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				enabledServices: ['applications'],
				healthScore: 100,
				lastHealthCheck: new Date().toISOString(),
				complianceStatus: 'PENDING',
				tags: [],
			};

			// Invalidate cache
			service.invalidateCache();

			logger.info(service.MODULE_TAG, `Created environment: ${newEnvironment.id}`);
			modernMessaging.showSuccess(`Environment "${newEnvironment.name}" created successfully`);

			return newEnvironment;
		} catch (error) {
			logger.error(service.MODULE_TAG, 'Failed to create environment', error);
			modernMessaging.showError('Failed to create environment');
			throw error;
		}
	}

	/**
	 * Update environment with enhanced tracking
	 * @param id - Environment ID
	 * @param request - Update data
	 * @returns Promise resolving to updated environment
	 */
	static async updateEnvironmentV9(
		id: string,
		request: UpdateEnvironmentRequest
	): Promise<PingOneEnvironment> {
		const service = new EnvironmentServiceV9();

		try {
			// Get existing environment
			const existing = await service.getEnvironmentV9(id);
			if (!existing) {
				throw new Error(`Environment not found: ${id}`);
			}

			// Mock update - replace with actual implementation
			const updatedEnvironment: PingOneEnvironment = {
				...existing,
				...request,
				updatedAt: new Date().toISOString(),
			};

			// Invalidate cache
			service.invalidateCache();

			logger.info(service.MODULE_TAG, `Updated environment: ${id}`);
			modernMessaging.showSuccess(`Environment "${updatedEnvironment.name}" updated successfully`);

			return updatedEnvironment;
		} catch (error) {
			logger.error(service.MODULE_TAG, 'Failed to update environment', error);
			modernMessaging.showError('Failed to update environment');
			throw error;
		}
	}

	/**
	 * Delete environment with enhanced safety checks
	 * @param id - Environment ID
	 * @param options - Delete options
	 * @returns Promise resolving when deletion is complete
	 */
	static async deleteEnvironmentV9(id: string, options?: DeleteEnvironmentOptions): Promise<void> {
		const service = new EnvironmentServiceV9();

		try {
			// Get existing environment
			const existing = await service.getEnvironmentV9(id);
			if (!existing) {
				throw new Error(`Environment not found: ${id}`);
			}

			// Safety check for production environments
			if (existing.type === 'PRODUCTION' && !options?.force) {
				throw new Error('Cannot delete production environment without force flag');
			}

			// Mock deletion - replace with actual implementation
			logger.info(service.MODULE_TAG, `Deleted environment: ${id} (${existing.name})`);

			if (options?.reason) {
				logger.info(service.MODULE_TAG, `Deletion reason: ${options.reason}`);
			}

			// Invalidate cache
			service.invalidateCache();

			modernMessaging.showSuccess(`Environment "${existing.name}" deleted successfully`);
		} catch (error) {
			logger.error(service.MODULE_TAG, 'Failed to delete environment', error);
			modernMessaging.showError('Failed to delete environment');
			throw error;
		}
	}

	/**
	 * Get environment with enhanced data
	 * @param id - Environment ID
	 * @returns Promise resolving to enhanced environment or null
	 */
	static async getEnvironmentV9(id: string): Promise<PingOneEnvironment | null> {
		const service = new EnvironmentServiceV9();

		try {
			const environments = await service.getEnvironmentsV9();
			const environment = environments.find((env) => env.id === id);

			if (!environment) {
				logger.warn(service.MODULE_TAG, `Environment not found: ${id}`);
				return null;
			}

			return environment;
		} catch (error) {
			logger.error(service.MODULE_TAG, 'Failed to get environment', error);
			return null;
		}
	}

	/**
	 * Get environment metrics (V9 enhanced)
	 * @param id - Environment ID
	 * @returns Promise resolving to environment metrics
	 */
	static async getEnvironmentMetrics(id: string): Promise<EnvironmentMetrics | null> {
		const service = new EnvironmentServiceV9();

		try {
			// Mock metrics - replace with actual implementation
			const metrics: EnvironmentMetrics = {
				apiCalls24h: 15420,
				apiCalls7d: 108500,
				activeUsers24h: 1240,
				activeUsers7d: 8900,
				errorRate: 0.02,
				avgResponseTime: 145,
				storageUsage: 2.3, // GB
				bandwidthUsage: 15.7, // GB
				healthScore: 95,
			};

			logger.info(service.MODULE_TAG, `Retrieved metrics for environment: ${id}`);
			return metrics;
		} catch (error) {
			logger.error(service.MODULE_TAG, 'Failed to get environment metrics', error);
			return null;
		}
	}

	/**
	 * Validate environment configuration (V9 enhanced)
	 * @param config - Environment configuration
	 * @returns Validation result
	 */
	static validateEnvironmentConfig(
		config: CreateEnvironmentRequest | UpdateEnvironmentRequest
	): EnvironmentConfigValidation {
		const _service = new EnvironmentServiceV9();
		const errors: string[] = [];
		const warnings: string[] = [];
		const suggestions: string[] = [];

		// Name validation
		if ('name' in config) {
			if (!config.name || config.name.trim().length === 0) {
				errors.push('Environment name is required');
			} else if (config.name.length < 3) {
				errors.push('Environment name must be at least 3 characters');
			} else if (config.name.length > 100) {
				errors.push('Environment name must be less than 100 characters');
			} else if (!/^[a-zA-Z0-9\s-_]+$/.test(config.name)) {
				errors.push(
					'Environment name can only contain letters, numbers, spaces, hyphens, and underscores'
				);
			}
		}

		// Description validation
		if ('description' in config && config.description && config.description.length > 500) {
			warnings.push('Description should be less than 500 characters for better readability');
		}

		// Type validation
		if ('type' in config) {
			const validTypes: EnvironmentType[] = ['PRODUCTION', 'SANDBOX', 'DEVELOPMENT'];
			if (!validTypes.includes(config.type as EnvironmentType)) {
				errors.push('Invalid environment type');
			}
		}

		// Region validation
		if ('region' in config && config.region) {
			const validRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-2'];
			if (!validRegions.includes(config.region)) {
				warnings.push('Region may not be supported in all locations');
			}
		}

		// Suggestions
		if ('name' in config && config.name) {
			if (
				!config.name.toLowerCase().includes('env') &&
				!config.name.toLowerCase().includes('environment')
			) {
				suggestions.push('Consider including "env" or "environment" in the name for clarity');
			}
		}

		if ('type' in config && config.type === 'PRODUCTION') {
			suggestions.push(
				'Ensure production environments have proper monitoring and backup strategies'
			);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			suggestions,
		};
	}

	// Private helper methods

	private getCachedEnvironments(): PingOneEnvironment[] | null {
		try {
			const cached = localStorage.getItem(this.CACHE_KEY);
			if (!cached) return null;

			const { data, timestamp } = JSON.parse(cached);
			if (Date.now() - timestamp > this.CACHE_DURATION) {
				localStorage.removeItem(this.CACHE_KEY);
				return null;
			}

			return data;
		} catch (error) {
			logger.warn(this.MODULE_TAG, 'Failed to read cache', error);
			return null;
		}
	}

	private setCachedEnvironments(environments: PingOneEnvironment[]): void {
		try {
			const cacheData = {
				data: environments,
				timestamp: Date.now(),
			};
			localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
		} catch (error) {
			logger.warn(this.MODULE_TAG, 'Failed to write cache', error);
		}
	}

	private invalidateCache(): void {
		try {
			localStorage.removeItem(this.CACHE_KEY);
		} catch (error) {
			logger.warn(this.MODULE_TAG, 'Failed to invalidate cache', error);
		}
	}
}

export default EnvironmentServiceV9;
