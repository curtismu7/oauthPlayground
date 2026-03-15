/**
 * PingOne user management (worker token).
 * GET user by id, list users with optional filter.
 */

import axios, { AxiosError } from 'axios';
import { issueWorkerToken, type WorkerTokenRequest } from './pingoneManagementClient.js';

const DEFAULT_WORKER_SCOPE = 'p1:read:environment p1:read:application p1:read:resource p1:read:user';

function resolveEnvironmentId(value?: string): string {
	const envId =
		value ?? process.env.PINGONE_ENVIRONMENT_ID ?? process.env.VITE_PINGONE_ENVIRONMENT_ID;
	if (!envId) {
		throw new Error('PingOne environment ID is required (PINGONE_ENVIRONMENT_ID or pass environmentId).');
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

async function getWorkerToken(request: {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
}): Promise<string> {
	if (request.workerToken?.trim()) return request.workerToken.trim();
	const envId = resolveEnvironmentId(request.environmentId);
	const tokenResult = await issueWorkerToken({
		environmentId: envId,
		clientId: request.clientId ?? process.env.PINGONE_CLIENT_ID ?? process.env.VITE_PINGONE_CLIENT_ID,
		clientSecret:
			request.clientSecret ??
			process.env.PINGONE_CLIENT_SECRET ??
			process.env.VITE_PINGONE_CLIENT_SECRET,
		scope: DEFAULT_WORKER_SCOPE,
	} as WorkerTokenRequest);
	if (!tokenResult.success || !tokenResult.accessToken) {
		throw new Error('Failed to obtain worker token for user API.');
	}
	return tokenResult.accessToken;
}

export interface GetUserRequest {
	environmentId?: string;
	userId: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
	signal?: AbortSignal;
}

export interface GetUserResult {
	success: boolean;
	user?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

export async function getUser(request: GetUserRequest): Promise<GetUserResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		const url = `${baseUrl}/users/${request.userId}`;

		const { data } = await axios.get<Record<string, unknown>>(url, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
			signal: request.signal,
		});

		return { success: true, user: data, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.message as string) ??
			(data?.error_description as string) ??
			axiosError.message ??
			'Failed to get user';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}

export interface ListUsersRequest {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
	filter?: string;
	limit?: number;
	/** Next page URL from previous response (_links.next.href). Omit for first page. */
	nextPageUrl?: string;
	signal?: AbortSignal;
}

export interface ListUsersResult {
	success: boolean;
	users?: Record<string, unknown>[];
	/** Total count if returned by API (may be absent for large sets). */
	count?: number;
	/** Page size returned. */
	size?: number;
	/** Full URL for next page; pass back as nextPageUrl for subsequent requests. */
	nextPageUrl?: string;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Extracts next page href from PingOne _links.next. */
function extractNextPageUrl(data: Record<string, unknown>): string | undefined {
	const links = data._links as Record<string, { href?: string }> | undefined;
	const next = links?.next?.href;
	return typeof next === 'string' && next.trim() ? next : undefined;
}

export async function listUsers(request: ListUsersRequest): Promise<ListUsersResult> {
	try {
		const token = await getWorkerToken(request);
		let data: Record<string, unknown>;

		if (request.nextPageUrl?.trim()) {
			const { data: resp } = await axios.get<Record<string, unknown>>(request.nextPageUrl.trim(), {
				headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
				signal: request.signal,
			});
			data = resp;
		} else {
			const environmentId = resolveEnvironmentId(request.environmentId);
			const baseUrl = buildApiBaseUrl(environmentId, request.region);
			const limit = request.limit && request.limit > 0 ? Math.min(request.limit, 200) : 100;
			const params: Record<string, string> = { limit: String(limit) };
			if (request.filter?.trim()) params.filter = request.filter.trim();
			const url = `${baseUrl}/users`;
			const { data: resp } = await axios.get<Record<string, unknown>>(url, {
				headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
				params,
				signal: request.signal,
			});
			data = resp;
		}

		const embedded = data._embedded as Record<string, unknown> | undefined;
		const users = (embedded?.users as Record<string, unknown>[]) ?? [];
		const count = typeof data.count === 'number' ? data.count : undefined;
		const size = typeof data.size === 'number' ? data.size : users.length;
		const nextPageUrl = extractNextPageUrl(data);

		return { success: true, users, count, size, nextPageUrl, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.message as string) ??
			(data?.error_description as string) ??
			axiosError.message ??
			'Failed to list users';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}

/** Shared request for user-scoped and directory APIs (worker token). */
export interface WorkerTokenRequestBase {
	environmentId?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
}

export interface GetUserGroupsRequest extends WorkerTokenRequestBase {
	userId: string;
}

export interface GetUserGroupsResult {
	success: boolean;
	groups?: Record<string, unknown>[];
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Get groups for a user (memberOfGroups). */
export async function getUserGroups(request: GetUserGroupsRequest): Promise<GetUserGroupsResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		const url = `${baseUrl}/users/${request.userId}/memberOfGroups`;

		const { data } = await axios.get<Record<string, unknown>>(url, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});

		const embedded = data._embedded as Record<string, unknown> | undefined;
		const memberOfGroups = (embedded?.memberOfGroups ?? embedded?.groupMemberships) as Record<string, unknown>[] | undefined;
		const groups = (memberOfGroups ?? []).map((item) => {
			const group = (item as Record<string, unknown>).group;
			if (group && typeof group === 'object' && group !== null) return group as Record<string, unknown>;
			if ((item as Record<string, unknown>).id && ((item as Record<string, unknown>).name ?? (item as Record<string, unknown>).displayName))
				return item as Record<string, unknown>;
			return item as Record<string, unknown>;
		});
		return { success: true, groups, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.message as string) ??
			(data?.error_description as string) ??
			axiosError.message ??
			'Failed to get user groups';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}

export interface GetUserRolesRequest extends WorkerTokenRequestBase {
	userId: string;
}

export interface GetUserRolesResult {
	success: boolean;
	roles?: Record<string, unknown>[];
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Get role assignments for a user. */
export async function getUserRoles(request: GetUserRolesRequest): Promise<GetUserRolesResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		const url = `${baseUrl}/users/${request.userId}/roleAssignments`;

		const { data } = await axios.get<Record<string, unknown>>(url, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});

		const embedded = data._embedded as Record<string, unknown> | undefined;
		const roleAssignments = (embedded?.roleAssignments as Record<string, unknown>[]) ?? [];
		const roles = roleAssignments.map((item) => {
			const role = (item as Record<string, unknown>).role;
			if (role && typeof role === 'object' && role !== null) return role as Record<string, unknown>;
			return item as Record<string, unknown>;
		});
		return { success: true, roles, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.message as string) ??
			(data?.error_description as string) ??
			axiosError.message ??
			'Failed to get user roles';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface LookupUsersRequest extends WorkerTokenRequestBase {
	identifier: string;
}

export interface LookupUsersResult {
	success: boolean;
	users?: Record<string, unknown>[];
	user?: Record<string, unknown>;
	matchType?: 'id' | 'filter';
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Look up users by identifier (UUID → direct GET; otherwise SCIM filter on username/email). */
export async function lookupUsers(request: LookupUsersRequest): Promise<LookupUsersResult> {
	const trimmed = request.identifier?.trim();
	if (!trimmed) {
		return { success: false, error: { message: 'identifier is required' } };
	}
	if (UUID_REGEX.test(trimmed)) {
		const one = await getUser({ ...request, userId: trimmed });
		if (!one.success) return { success: false, error: one.error };
		return { success: true, user: one.user, users: one.user ? [one.user] : [], matchType: 'id', raw: one.raw };
	}
	const escape = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	const escaped = escape(trimmed);
	const filter = `(username eq "${escaped}" or email eq "${escaped}")`;
	const list = await listUsers({ ...request, filter, limit: 25 });
	if (!list.success) return { success: false, error: list.error };
	return { success: true, users: list.users ?? [], matchType: 'filter', raw: list.raw };
}

export interface GetPopulationRequest extends WorkerTokenRequestBase {
	populationId: string;
}

export interface GetPopulationResult {
	success: boolean;
	population?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Get a population by ID. */
export async function getPopulation(request: GetPopulationRequest): Promise<GetPopulationResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		const url = `${baseUrl}/populations/${request.populationId}`;

		const { data } = await axios.get<Record<string, unknown>>(url, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});

		return { success: true, population: data, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.message as string) ??
			(data?.error_description as string) ??
			axiosError.message ??
			'Failed to get population';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}

export interface ListPopulationsRequest extends WorkerTokenRequestBase {
	limit?: number;
	/** Next page URL from previous response (_links.next.href). Omit for first page. */
	nextPageUrl?: string;
}

export interface ListPopulationsResult {
	success: boolean;
	populations?: Record<string, unknown>[];
	count?: number;
	size?: number;
	nextPageUrl?: string;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** List populations in the environment. */
export async function listPopulations(request: ListPopulationsRequest): Promise<ListPopulationsResult> {
	try {
		const token = await getWorkerToken(request);
		let data: Record<string, unknown>;

		if (request.nextPageUrl?.trim()) {
			const { data: resp } = await axios.get<Record<string, unknown>>(request.nextPageUrl.trim(), {
				headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
			});
			data = resp;
		} else {
			const environmentId = resolveEnvironmentId(request.environmentId);
			const baseUrl = buildApiBaseUrl(environmentId, request.region);
			const limit = request.limit && request.limit > 0 ? Math.min(request.limit, 200) : 100;
			const url = `${baseUrl}/populations`;
			const { data: resp } = await axios.get<Record<string, unknown>>(url, {
				headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
				params: { limit: String(limit) },
			});
			data = resp;
		}

		const embedded = data._embedded as Record<string, unknown> | undefined;
		const populations = (embedded?.populations as Record<string, unknown>[]) ?? [];
		const count = typeof data.count === 'number' ? data.count : undefined;
		const size = typeof data.size === 'number' ? data.size : populations.length;
		const nextPageUrl = extractNextPageUrl(data);
		return { success: true, populations, count, size, nextPageUrl, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.message as string) ??
			(data?.error_description as string) ??
			axiosError.message ??
			'Failed to list populations';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}

export interface GetUserConsentsRequest {
	environmentId?: string;
	userId: string;
	/** An access token (user context) or worker token. Worker tokens may return 403 if lacking consent scope. */
	accessToken?: string;
	workerToken?: string;
	clientId?: string;
	clientSecret?: string;
	region?: string;
	limit?: number;
}

export interface GetUserConsentsResult {
	success: boolean;
	consents?: Record<string, unknown>[];
	raw?: unknown;
	error?: { code?: string; message: string };
}

// ─── User CRUD ───────────────────────────────────────────────────────────────

export interface CreateUserRequest extends WorkerTokenRequestBase {
	/** Full user object. Must include at least `username` and `population.id` (or just `email` for some envs). */
	user: Record<string, unknown>;
}

export interface CreateUserResult {
	success: boolean;
	user?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Create a new user. Requires a worker token with p1:create:user scope. */
export async function createUser(request: CreateUserRequest): Promise<CreateUserResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		const { data } = await axios.post<Record<string, unknown>>(
			`${baseUrl}/users`,
			request.user,
			{ headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' } }
		);
		return { success: true, user: data, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const errData = axiosError.response?.data as Record<string, unknown> | undefined;
		const message = (errData?.message as string) ?? (errData?.error_description as string) ?? axiosError.message ?? 'Failed to create user';
		return { success: false, error: { code: status ? String(status) : undefined, message } };
	}
}

export interface UpdateUserRequest extends WorkerTokenRequestBase {
	userId: string;
	/** Partial update fields (PATCH semantics — only specified fields are changed). */
	updates: Record<string, unknown>;
}

export interface UpdateUserResult {
	success: boolean;
	user?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Update a user (PATCH — partial update). Requires p1:update:user scope. */
export async function updateUser(request: UpdateUserRequest): Promise<UpdateUserResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		const { data } = await axios.patch<Record<string, unknown>>(
			`${baseUrl}/users/${request.userId}`,
			request.updates,
			{ headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' } }
		);
		return { success: true, user: data, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const errData = axiosError.response?.data as Record<string, unknown> | undefined;
		const message = (errData?.message as string) ?? (errData?.error_description as string) ?? axiosError.message ?? 'Failed to update user';
		return { success: false, error: { code: status ? String(status) : undefined, message } };
	}
}

export interface DeleteUserRequest extends WorkerTokenRequestBase {
	userId: string;
}

export interface DeleteUserResult {
	success: boolean;
	error?: { code?: string; message: string };
}

/** Delete a user. Requires p1:delete:user scope. */
export async function deleteUser(request: DeleteUserRequest): Promise<DeleteUserResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		await axios.delete(`${baseUrl}/users/${request.userId}`, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});
		return { success: true };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const errData = axiosError.response?.data as Record<string, unknown> | undefined;
		const message = (errData?.message as string) ?? (errData?.error_description as string) ?? axiosError.message ?? 'Failed to delete user';
		return { success: false, error: { code: status ? String(status) : undefined, message } };
	}
}

// ─── User group membership ────────────────────────────────────────────────────

export interface AddUserToGroupRequest extends WorkerTokenRequestBase {
	userId: string;
	groupId: string;
}

export interface AddUserToGroupResult {
	success: boolean;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/** Add a user to a group. Requires p1:update:userMembership scope. */
export async function addUserToGroup(request: AddUserToGroupRequest): Promise<AddUserToGroupResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		const { data } = await axios.post<Record<string, unknown>>(
			`${baseUrl}/users/${request.userId}/memberOfGroups`,
			{ group: { id: request.groupId } },
			{ headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' } }
		);
		return { success: true, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const errData = axiosError.response?.data as Record<string, unknown> | undefined;
		const message = (errData?.message as string) ?? (errData?.error_description as string) ?? axiosError.message ?? 'Failed to add user to group';
		return { success: false, error: { code: status ? String(status) : undefined, message } };
	}
}

export interface RemoveUserFromGroupRequest extends WorkerTokenRequestBase {
	userId: string;
	groupId: string;
}

export interface RemoveUserFromGroupResult {
	success: boolean;
	error?: { code?: string; message: string };
}

/** Remove a user from a group. Requires p1:delete:userMembership scope. */
export async function removeUserFromGroup(request: RemoveUserFromGroupRequest): Promise<RemoveUserFromGroupResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		const token = await getWorkerToken(request);
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		await axios.delete(`${baseUrl}/users/${request.userId}/memberOfGroups/${request.groupId}`, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		});
		return { success: true };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const errData = axiosError.response?.data as Record<string, unknown> | undefined;
		const message = (errData?.message as string) ?? (errData?.error_description as string) ?? axiosError.message ?? 'Failed to remove user from group';
		return { success: false, error: { code: status ? String(status) : undefined, message } };
	}
}

/** Get consent records for a user. Prefers accessToken (user context); falls back to workerToken. */
export async function getUserConsents(request: GetUserConsentsRequest): Promise<GetUserConsentsResult> {
	try {
		const environmentId = resolveEnvironmentId(request.environmentId);
		// Prefer accessToken (user context); fall back to workerToken / client credentials
		let token: string;
		if (request.accessToken?.trim()) {
			token = request.accessToken.trim();
		} else {
			token = await getWorkerToken(request);
		}
		const baseUrl = buildApiBaseUrl(environmentId, request.region);
		const limit = request.limit && request.limit > 0 ? Math.min(request.limit, 200) : 200;
		const url = `${baseUrl}/users/${request.userId}/consents`;

		const response = await axios.get<Record<string, unknown>>(url, {
			headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
			params: { limit: String(limit) },
			// 403 is expected when worker token lacks consent scope — handle gracefully
			validateStatus: (s) => s < 500,
		});

		if (response.status === 403) {
			// Worker token lacks consent permissions; return empty array gracefully
			return { success: true, consents: [], raw: { _embedded: { consents: [] } } };
		}

		if (response.status >= 400) {
			const errData = response.data as Record<string, unknown>;
			const message =
				(errData?.message as string) ??
				(errData?.error_description as string) ??
				`PingOne API returned ${response.status}`;
			return { success: false, error: { code: String(response.status), message } };
		}

		const embedded = response.data._embedded as Record<string, unknown> | undefined;
		const consents = (embedded?.consents as Record<string, unknown>[]) ?? [];
		return { success: true, consents, raw: response.data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.message as string) ??
			(data?.error_description as string) ??
			axiosError.message ??
			'Failed to get user consents';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}
