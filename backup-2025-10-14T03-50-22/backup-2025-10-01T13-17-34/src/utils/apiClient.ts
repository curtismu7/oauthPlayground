// PingOne Management API client utilities

import { logger } from './logger';
import { generateManagementApiUrl } from './workerToken';

export interface PingOneClient {
	token: string;
	environmentId: string;
	region: string;
	baseUrl: string;
}

export interface WorkerApp {
	id: string;
	name: string;
	description?: string;
	enabled: boolean;
	type: string;
	scopes: string[];
	redirect_uris: string[];
}

export interface Environment {
	id: string;
	name: string;
	description?: string;
	region: string;
	license: {
		name: string;
		status: string;
	};
	services: string[];
}

/**
 * Create PingOne Management API client
 */
export function createPingOneClient(
	token: string,
	environmentId: string,
	region: string = 'NA'
): PingOneClient {
	const baseUrl = generateManagementApiUrl(environmentId, region);

	logger.info('API-CLIENT', 'Created PingOne client', {
		environmentId,
		region,
		baseUrl,
	});

	return {
		token,
		environmentId,
		region,
		baseUrl,
	};
}

/**
 * Make authenticated API request to PingOne Management API
 */
export async function makeApiRequest<T = any>(
	client: PingOneClient,
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${client.baseUrl}${endpoint}`;

	logger.info('API-CLIENT', 'Making API request', {
		url,
		method: options.method || 'GET',
	});

	try {
		const response = await fetch(url, {
			...options,
			headers: {
				Authorization: `Bearer ${client.token}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`API request failed: ${response.status} ${response.statusText}. ${errorData.detail || errorData.message || 'Unknown error'}`
			);
		}

		const data = await response.json();

		logger.success('API-CLIENT', 'API request successful', {
			url,
			status: response.status,
			dataSize: JSON.stringify(data).length,
		});

		return data;
	} catch (error) {
		logger.error('API-CLIENT', 'API request failed', {
			url,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

/**
 * Discover worker application details
 */
export async function discoverWorkerApp(
	client: PingOneClient,
	clientId: string
): Promise<WorkerApp | null> {
	logger.info('API-CLIENT', 'Discovering worker app', {
		clientId: clientId.substring(0, 8) + '...',
		environmentId: client.environmentId,
	});

	try {
		// First, try to get the application by client ID
		const applications = await makeApiRequest<any[]>(client, '/applications');

		const workerApp = applications.find(
			(app) =>
				app.clientId === clientId ||
				app.id === clientId ||
				app.name?.toLowerCase().includes('worker')
		);

		if (!workerApp) {
			logger.warn('API-CLIENT', 'Worker app not found', { clientId });
			return null;
		}

		const appDetails: WorkerApp = {
			id: workerApp.id,
			name: workerApp.name || 'Unknown App',
			description: workerApp.description,
			enabled: workerApp.enabled !== false,
			type: workerApp.type || 'worker',
			scopes: workerApp.scopes || [],
			redirect_uris: workerApp.redirectUris || [],
		};

		logger.success('API-CLIENT', 'Worker app discovered', {
			appId: appDetails.id,
			appName: appDetails.name,
			enabled: appDetails.enabled,
			scopes: appDetails.scopes.length,
		});

		return appDetails;
	} catch (error) {
		logger.error('API-CLIENT', 'Failed to discover worker app', error);
		return null;
	}
}

/**
 * Get environment information
 */
export async function getEnvironmentInfo(client: PingOneClient): Promise<Environment | null> {
	logger.info('API-CLIENT', 'Getting environment info', {
		environmentId: client.environmentId,
	});

	try {
		const environment = await makeApiRequest<any>(client, '');

		const envInfo: Environment = {
			id: environment.id || client.environmentId,
			name: environment.name || 'Unknown Environment',
			description: environment.description,
			region: environment.region || client.region,
			license: {
				name: environment.license?.name || 'Unknown',
				status: environment.license?.status || 'Unknown',
			},
			services: environment.services || [],
		};

		logger.success('API-CLIENT', 'Environment info retrieved', {
			envId: envInfo.id,
			envName: envInfo.name,
			region: envInfo.region,
			licenseStatus: envInfo.license.status,
		});

		return envInfo;
	} catch (error) {
		logger.error('API-CLIENT', 'Failed to get environment info', error);
		return null;
	}
}

/**
 * Test API access with given scopes
 */
export async function testApiAccess(
	client: PingOneClient,
	scopes: string[]
): Promise<{
	success: boolean;
	accessibleEndpoints: string[];
	errors: string[];
}> {
	logger.info('API-CLIENT', 'Testing API access', {
		scopes: scopes.join(' '),
		environmentId: client.environmentId,
	});

	const accessibleEndpoints: string[] = [];
	const errors: string[] = [];

	// Test common endpoints based on scopes
	const testEndpoints = [
		{ endpoint: '/applications', scope: 'p1:read:application', description: 'Applications' },
		{ endpoint: '/users', scope: 'p1:read:user', description: 'Users' },
		{ endpoint: '/userGroups', scope: 'p1:read:userGroup', description: 'User Groups' },
		{ endpoint: '/environments', scope: 'p1:read:environment', description: 'Environment' },
	];

	for (const test of testEndpoints) {
		if (scopes.includes(test.scope)) {
			try {
				await makeApiRequest(client, test.endpoint);
				accessibleEndpoints.push(test.description);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : 'Unknown error';
				errors.push(`${test.description}: ${errorMsg}`);
			}
		}
	}

	const success = accessibleEndpoints.length > 0;

	logger.info('API-CLIENT', 'API access test completed', {
		success,
		accessibleEndpoints: accessibleEndpoints.length,
		errors: errors.length,
	});

	return {
		success,
		accessibleEndpoints,
		errors,
	};
}

/**
 * Get users list (if accessible)
 */
export async function getUsers(client: PingOneClient, limit: number = 10): Promise<any[]> {
	try {
		const response = await makeApiRequest<any>(client, `/users?limit=${limit}`);
		return response._embedded?.users || response.users || [];
	} catch (error) {
		logger.error('API-CLIENT', 'Failed to get users', error);
		throw error;
	}
}

/**
 * Get applications list (if accessible)
 */
export async function getApplications(client: PingOneClient, limit: number = 10): Promise<any[]> {
	try {
		const response = await makeApiRequest<any>(client, `/applications?limit=${limit}`);
		return response._embedded?.applications || response.applications || [];
	} catch (error) {
		logger.error('API-CLIENT', 'Failed to get applications', error);
		throw error;
	}
}

/**
 * Get user groups list (if accessible)
 */
export async function getUserGroups(client: PingOneClient, limit: number = 10): Promise<any[]> {
	try {
		const response = await makeApiRequest<any>(client, `/userGroups?limit=${limit}`);
		return response._embedded?.userGroups || response.userGroups || [];
	} catch (error) {
		logger.error('API-CLIENT', 'Failed to get user groups', error);
		throw error;
	}
}
