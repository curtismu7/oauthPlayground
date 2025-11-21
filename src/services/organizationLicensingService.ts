// src/services/organizationLicensingService.ts
// Service for fetching and managing PingOne Organization licensing information

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
		licenseName?: string;
		licenseStatus?: string;
		licenseId?: string;
		licenseType?: string;
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
 * Uses backend proxy to avoid CORS issues
 */
export async function getOrganizationLicensingInfo(
	accessToken: string,
	organizationId?: string
): Promise<OrganizationInfo | null> {
	logger.info('ORG-LICENSE', 'Fetching organization licensing info via backend proxy', {
		organizationId,
	});

	try {
		// Use backend proxy endpoint to avoid CORS issues
		const response = await fetch('/api/pingone/organization-licensing', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				workerToken: accessToken,
				organizationId,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			logger.error('ORG-LICENSE', 'Backend API request failed', {
				status: response.status,
				error: errorData.error_description || errorData.error || 'Unknown error',
			});
			return null;
		}

		const orgInfo: OrganizationInfo = await response.json();

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
		const response = await fetch(`https://api.pingone.com/v1/environments/${environmentId}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});

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
 * Uses backend proxy to avoid CORS issues
 */
export async function getAllLicenses(
	accessToken: string,
	organizationId?: string
): Promise<OrganizationLicense[]> {
	logger.info('ORG-LICENSE', 'Fetching all licenses via backend proxy', {
		hasOrganizationId: Boolean(organizationId),
		organizationId,
	});

	try {
		const response = await fetch('/api/pingone/all-licenses', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ workerToken: accessToken, organizationId }),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			logger.error('ORG-LICENSE', 'Backend API request failed', {
				status: response.status,
				error: errorData.error_description || errorData.error || 'Unknown error',
			});
			return [];
		}

		const licenses: OrganizationLicense[] = await response.json();

		logger.success('ORG-LICENSE', `Retrieved ${licenses.length} licenses`);

		return licenses;
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
