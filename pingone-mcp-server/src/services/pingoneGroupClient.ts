/**
 * PingOne group management (worker token).
 * CRUD operations for directory groups.
 */

import axios, { AxiosError } from 'axios';
import { issueWorkerToken, type WorkerTokenRequest } from './pingoneManagementClient.js';

const DEFAULT_GROUP_SCOPE =
	'p1:read:environment p1:read:group p1:create:group p1:update:group p1:delete:group';

function resolveEnvironmentId(value?: string): string {
	const envId =
		value ?? process.env.PINGONE_ENVIRONMENT_ID ?? process.env.VITE_PINGONE_ENVIRONMENT_ID;
	if (!envId) {
		throw new Error(
			'PingOne environment ID is required (PINGONE_ENVIRONMENT_ID or pass environmentId).'
		);
	}
	return envId;
}

function determineRegion(environmentId: string, override?: string): string {
	if (override && override.trim().length > 0) return override.trim();
	const lower = environmentId.toLowerCase();
	if (lower.includes('eu')) return 'eu';
	if (lower.includes('asia')) return 'asia';
	return 'com';
}

function buildApiBaseUrl(environmentId: string, region?: string): string {
	const r = determineRegion(environmentId, region);
	return `https://api.pingone.${r}/v1/environments/${environmentId}`;
}

interface GroupTokenRequest {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
}

async function getWorkerToken(request: GroupTokenRequest): Promise<string> {
	if (request.workerToken?.trim()) return request.workerToken.trim();
	const envId = resolveEnvironmentId(request.environmentId);
	const tokenResult = await issueWorkerToken({
		environmentId: envId,
		clientId:
			request.clientId ?? process.env.PINGONE_CLIENT_ID ?? process.env.VITE_PINGONE_CLIENT_ID,
		clientSecret:
			request.clientSecret ??
			process.env.PINGONE_CLIENT_SECRET ??
			process.env.VITE_PINGONE_CLIENT_SECRET,
		scope: DEFAULT_GROUP_SCOPE,
	} as WorkerTokenRequest);
	if (!tokenResult.success || !tokenResult.accessToken) {
		throw new Error('Failed to obtain worker token for group API.');
	}
	return tokenResult.accessToken;
}

function extractError(err: unknown): { code?: string; message: string } {
	const axiosErr = err as AxiosError;
	const status = axiosErr.response?.status;
	const data = axiosErr.response?.data as Record<string, unknown> | undefined;
	const message =
		(data?.message as string) ??
		(data?.detail as string) ??
		axiosErr.message ??
		'Unknown group API error';
	return { code: status ? String(status) : undefined, message };
}

// ─── List Groups ──────────────────────────────────────────────────────────────

export interface ListGroupsRequest {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
	/** SCIM filter string, e.g. "name eq \"Admins\"" */
	filter?: string;
	limit?: number;
}

export interface ListGroupsResult {
	success: boolean;
	groups?: Record<string, unknown>[];
	count?: number;
	raw?: unknown;
	error?: { code?: string; message: string };
}

export async function listGroups(request: ListGroupsRequest): Promise<ListGroupsResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		const limit = request.limit && request.limit > 0 ? request.limit : 100;
		const url =
			`${baseUrl}/groups?limit=${limit}` +
			(request.filter ? `&filter=${encodeURIComponent(request.filter)}` : '');

		const { data } = await axios.get<Record<string, unknown>>(url, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});

		const embedded = data?._embedded as Record<string, unknown> | undefined;
		const groups = (embedded?.groups ?? []) as Record<string, unknown>[];
		return { success: true, groups, count: groups.length, raw: data };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}

// ─── Get Group ────────────────────────────────────────────────────────────────

export interface GetGroupRequest {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
	groupId: string;
}

export interface GetGroupResult {
	success: boolean;
	group?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

export async function getGroup(request: GetGroupRequest): Promise<GetGroupResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);

		const { data } = await axios.get<Record<string, unknown>>(
			`${baseUrl}/groups/${request.groupId}`,
			{ headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
		);

		return { success: true, group: data, raw: data };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}

// ─── Create Group ─────────────────────────────────────────────────────────────

export interface CreateGroupRequest {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
	/** Must include at minimum `name`. May also include `description` and `population.id`. */
	group: Record<string, unknown>;
}

export interface CreateGroupResult {
	success: boolean;
	group?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

export async function createGroup(request: CreateGroupRequest): Promise<CreateGroupResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);

		const { data } = await axios.post<Record<string, unknown>>(
			`${baseUrl}/groups`,
			request.group,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
			}
		);

		return { success: true, group: data, raw: data };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}

// ─── Update Group ─────────────────────────────────────────────────────────────

export interface UpdateGroupRequest {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
	groupId: string;
	/** Fields to update (PATCH semantics). */
	updates: Record<string, unknown>;
}

export interface UpdateGroupResult {
	success: boolean;
	group?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

export async function updateGroup(request: UpdateGroupRequest): Promise<UpdateGroupResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);

		const { data } = await axios.patch<Record<string, unknown>>(
			`${baseUrl}/groups/${request.groupId}`,
			request.updates,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
			}
		);

		return { success: true, group: data, raw: data };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}

// ─── Delete Group ─────────────────────────────────────────────────────────────

export interface DeleteGroupRequest {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
	groupId: string;
}

export interface DeleteGroupResult {
	success: boolean;
	error?: { code?: string; message: string };
}

export async function deleteGroup(request: DeleteGroupRequest): Promise<DeleteGroupResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);

		await axios.delete(`${baseUrl}/groups/${request.groupId}`, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});

		return { success: true };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}
