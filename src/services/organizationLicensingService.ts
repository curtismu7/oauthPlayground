// src/services/organizationLicensingService.ts
// Service for fetching and managing PingOne Organization licensing information

import { createPingOneClient, makeApiRequest, PingOneClient } from '../utils/apiClient';
import { logger } from '../utils/logger';

export interface OrganizationLicense {
	id: string;
	name: string;
	type: string;
	status: 'active' | 'expired' | 'trial' | 'pending';
	startDate: string;
	endDate?: string;
	features: string[];
	users?: {
		total: number;
		used: number;
		available: number;
	};
	applications?: {
		total: number;
		used: number;
		available: number;
	};
}

export interface OrganizationInfo {
	id: string;
	name: string;
	region: string;
	license: OrganizationLicense;
	environments: Array<{
		id: string;
		name: string;
		region: string;
	}>;
	createdAt: string;
	updatedAt: string;
}

export interface AllLicensesResponse {
	_embedded?: {
		licenses: OrganizationLicense[];
	};
	_count?: number;
}

/**
 * Get organization licensing information
 * Note: Requires organization admin token
 */
export async function getOrganizationLicensingInfo(
	accessToken: string,
	organizationId?: string
): Promise<OrganizationInfo | null> {
	logger.info('ORG-LICENSE', 'Fetching organization licensing info', {
		organizationId,
	});

	try {
		// Use API.PingOne for organization data (different from environment API)
		const baseUrl = 'https://api.pingone.com/v1';
		
		// First, get organization details
		let organizationInfo;
		if (organizationId) {
			organizationInfo = await fetch(`${baseUrl}/organizations/${organizationId}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			});

			if (!organizationInfo.ok) {
				logger.error('ORG-LICENSE', 'Failed to fetch organization', {
					status: organizationInfo.status,
					statusText: organizationInfo.statusText,
				});
				return null;
			}
		} else {
			// Get first organization if ID not provided
			const organizations = await fetch(`${baseUrl}/organizations?limit=1`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			});

			if (!organizations.ok) {
				logger.error('ORG-LICENSE', 'Failed to fetch organizations', {
					status: organizations.status,
					statusText: organizations.statusText,
				});
				return null;
			}

			const orgsData = await organizations.json();
			organizationInfo = orgsData._embedded?.organizations?.[0];

			if (!organizationInfo) {
				logger.error('ORG-LICENSE', 'No organization found');
				return null;
			}
		}

		// Get license information
		const licenseResponse = await fetch(
			`${baseUrl}/organizations/${organizationInfo.id}/licenses`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			}
		);

		const licensesData = await licenseResponse.json();
		const licenses = licensesData._embedded?.licenses || [];

		// Get environments
		const envResponse = await fetch(
			`${baseUrl}/organizations/${organizationInfo.id}/environments`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			}
		);

		const envData = await envResponse.json();
		const environments = envData._embedded?.environments || [];

		// Map the license data to our interface
		const license: OrganizationLicense = licenses[0] ? {
			id: licenses[0].id || 'unknown',
			name: licenses[0].name || 'Unknown License',
			type: licenses[0].type || 'standard',
			status: licenses[0].status || 'pending',
			startDate: licenses[0].startsAt || new Date().toISOString(),
			endDate: licenses[0].endsAt,
			features: licenses[0].features || [],
			users: licenses[0].users ? {
				total: licenses[0].users.total || 0,
				used: licenses[0].users.used || 0,
				available: (licenses[0].users.total || 0) - (licenses[0].users.used || 0),
			} : undefined,
			applications: licenses[0].applications ? {
				total: licenses[0].applications.total || 0,
				used: licenses[0].applications.used || 0,
				available: (licenses[0].applications.total || 0) - (licenses[0].applications.used || 0),
			} : undefined,
		} : {
			id: 'no-license',
			name: 'No License Found',
			type: 'none',
			status: 'pending',
			startDate: new Date().toISOString(),
			features: [],
		};

		const orgInfo: OrganizationInfo = {
			id: organizationInfo.id,
			name: organizationInfo.name,
			region: organizationInfo.region || 'unknown',
			license,
			environments: environments.map((env: any) => ({
				id: env.id,
				name: env.name,
				region: env.region || 'unknown',
			})),
			createdAt: organizationInfo.createdAt || new Date().toISOString(),
			updatedAt: organizationInfo.updatedAt || new Date().toISOString(),
		};

		logger.success('ORG-LICENSE', 'Organization info retrieved', {
			orgId: orgInfo.id,
			orgName: orgInfo.name,
			licenseStatus: orgInfo.license.status,
		});

		return orgInfo;
	} catch (error) {
		logger.error('ORG-LICENSE', 'Failed to fetch organization licensing', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		return null;
	}
}

/**
 * Get environment licensing information
 */
export async function getEnvironmentLicensingInfo(
	accessToken: string,
	environmentId: string
): Promise<OrganizationLicense | null> {
	logger.info('ORG-LICENSE', 'Fetching environment licensing info', {
		environmentId,
	});

	try {
		const response = await fetch(
			`https://api.pingone.com/v1/environments/${environmentId}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			}
		);

		if (!response.ok) {
			logger.error('ORG-LICENSE', 'Failed to fetch environment', {
				status: response.status,
			});
			return null;
		}

		const envData = await response.json();

		const license: OrganizationLicense = {
			id: envData.license?.id || 'unknown',
			name: envData.license?.name || 'No License',
			type: envData.license?.type || 'none',
			status: envData.license?.status || 'pending',
			startDate: envData.license?.startsAt || new Date().toISOString(),
			endDate: envData.license?.endsAt,
			features: envData.license?.features || [],
		};

		return license;
	} catch (error) {
		logger.error('ORG-LICENSE', 'Failed to fetch environment licensing', {
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

/**
 * Get all licenses from the organization
 */
export async function getAllLicenses(accessToken: string): Promise<OrganizationLicense[]> {
	logger.info('ORG-LICENSE', 'Fetching all licenses');
	
	try {
		const response = await fetch(
			'https://api.pingone.com/v1/licenses',
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			}
		);
		
		if (!response.ok) {
			logger.error('ORG-LICENSE', 'Failed to fetch licenses', {
				status: response.status,
				statusText: response.statusText,
			});
			return [];
		}
		
		const data: AllLicensesResponse = await response.json();
		const licenses = data._embedded?.licenses || [];
		
		logger.success('ORG-LICENSE', `Retrieved ${licenses.length} licenses`);
		
		return licenses.map((license: any) => ({
			id: license.id || 'unknown',
			name: license.name || 'Unknown License',
			type: license.type || 'standard',
			status: license.status || 'pending',
			startDate: license.startsAt || new Date().toISOString(),
			endDate: license.endsAt,
			features: license.features || [],
			users: license.users ? {
				total: license.users.total || 0,
				used: license.users.used || 0,
				available: (license.users.total || 0) - (license.users.used || 0),
			} : undefined,
			applications: license.applications ? {
				total: license.applications.total || 0,
				used: license.applications.used || 0,
				available: (license.applications.total || 0) - (license.applications.used || 0),
			} : undefined,
		}));
	} catch (error) {
		logger.error('ORG-LICENSE', 'Failed to fetch licenses', {
			error: error instanceof Error ? error.message : String(error),
		});
		return [];
	}
}

export default {
	getOrganizationLicensingInfo,
	getEnvironmentLicensingInfo,
	getAllLicenses,
};
