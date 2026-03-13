/**
 * PingOne Organization Licensing API client (worker token).
 * Fetches organization info, license catalog, and environment license assignments.
 * PingOne API: /organizations, /organizations/{orgId}/licenses, /licenses/{licId}/environments
 */

import axios, { AxiosError } from 'axios';

function resolveWorkerToken(token?: string): string {
	const t = token?.trim() ?? process.env.PINGONE_WORKER_TOKEN?.trim();
	if (!t) throw new Error('workerToken is required for licensing API.');
	return t;
}

/** Extract region TLD from a worker token JWT issuer claim. */
function regionFromToken(token: string): string {
	try {
		const parts = token.split('.');
		if (parts.length < 2) return 'com';
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8')) as Record<string, unknown>;
		const iss = payload.iss as string | undefined;
		if (iss) {
			const m = iss.match(/auth\.pingone\.([a-z0-9.-]+)/i);
			if (m?.[1]) return m[1];
		}
	} catch {
		// ignore
	}
	return 'com';
}

function buildBaseUrl(token: string): string {
	const tld = regionFromToken(token);
	return `https://api.pingone.${tld}/v1`;
}

function extractError(err: unknown): { code?: string; message: string } {
	const axiosError = err as AxiosError;
	const status = axiosError.response?.status;
	const data = axiosError.response?.data as Record<string, unknown> | undefined;
	const message =
		(data?.message as string) ??
		(data?.error_description as string) ??
		axiosError.message ??
		'Unknown error';
	return { code: status ? String(status) : undefined, message };
}

export interface License {
	id?: string;
	name?: string;
	status?: string;
	type?: string;
	expiresAt?: string;
	assignedEnvironments?: string[];
	[key: string]: unknown;
}

export interface OrgInfo {
	id?: string;
	name?: string;
	region?: string;
	[key: string]: unknown;
}

export interface GetOrganizationLicensesRequest {
	workerToken?: string;
	/** Optional: specify an org ID directly. If omitted, uses the first org accessible from the token. */
	organizationId?: string;
}

export interface GetOrganizationLicensesResult {
	success: boolean;
	organization?: OrgInfo;
	licenses?: License[];
	environmentLicenseMap?: Record<string, { licenseId: string; licenseName: string; licenseStatus: string; licenseType?: string }>;
	raw?: {
		organization?: unknown;
		licenses?: unknown;
	};
	error?: { code?: string; message: string };
}

export async function getOrganizationLicenses(
	req: GetOrganizationLicensesRequest
): Promise<GetOrganizationLicensesResult> {
	try {
		const token = resolveWorkerToken(req.workerToken);
		const baseUrl = buildBaseUrl(token);
		const headers = {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		};

		// 1. Resolve organization
		let orgInfo: OrgInfo;
		if (req.organizationId) {
			const { data } = await axios.get<OrgInfo>(`${baseUrl}/organizations/${req.organizationId}`, { headers });
			orgInfo = data;
		} else {
			const { data } = await axios.get<Record<string, unknown>>(`${baseUrl}/organizations?limit=1`, { headers });
			const orgs = ((data._embedded as Record<string, unknown>)?.organizations as OrgInfo[]) ?? [];
			if (orgs.length === 0) {
				return { success: false, error: { message: 'No organizations found for this token.' } };
			}
			orgInfo = orgs[0];
		}

		if (!orgInfo.id) {
			return { success: false, error: { message: 'Organization data did not include an id.' } };
		}

		// 2. Fetch licenses for the organization
		let licenses: License[] = [];
		let rawLicenses: unknown;
		try {
			const { data } = await axios.get<Record<string, unknown>>(
				`${baseUrl}/organizations/${orgInfo.id}/licenses`,
				{ headers }
			);
			rawLicenses = data;
			licenses = ((data._embedded as Record<string, unknown>)?.licenses as License[]) ?? [];
		} catch {
			// Licensing API may be restricted; return org info with empty licenses
		}

		// 3. Build environment → license map
		const environmentLicenseMap: GetOrganizationLicensesResult['environmentLicenseMap'] = {};
		await Promise.allSettled(
			licenses.map(async (lic) => {
				if (!lic.id) return;
				try {
					const { data } = await axios.get<Record<string, unknown>>(
						`${baseUrl}/licenses/${lic.id}/environments?limit=200`,
						{ headers }
					);
					const envs = ((data._embedded as Record<string, unknown>)?.environments as Array<Record<string, unknown>>) ?? [];
					for (const env of envs) {
						const envId = (env.id ?? (env.environment as Record<string, unknown>)?.id) as string | undefined;
						if (envId) {
							environmentLicenseMap[envId] = {
								licenseId: lic.id,
								licenseName: (lic.name as string) ?? 'Unknown License',
								licenseStatus: (lic.status as string) ?? 'unknown',
								licenseType: lic.type as string | undefined,
							};
						}
					}
				} catch {
					// Individual license assignment fetch failure; skip
				}
			})
		);

		return {
			success: true,
			organization: orgInfo,
			licenses,
			environmentLicenseMap,
			raw: { organization: orgInfo, licenses: rawLicenses },
		};
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}
