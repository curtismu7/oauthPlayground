import axios, { AxiosError } from 'axios';

export type MfaDeviceType = 'SMS' | 'EMAIL' | 'TOTP' | 'VOICE' | 'FIDO2' | 'MOBILE';

export interface MfaDevice {
	id: string;
	type: MfaDeviceType;
	status: 'ACTIVE' | 'ACTIVATION_REQUIRED' | 'PENDING_ACTIVATION' | 'BLOCKED';
	phoneNumber?: string;
	emailAddress?: string;
	deviceName?: string;
	nickname?: string;
	activationRequired?: boolean;
	secret?: string;
	pairingKey?: string;
	createdAt?: string;
	updatedAt?: string;
	lastUsed?: string;
	[key: string]: unknown;
}

export interface MfaChallengeResponse {
	id?: string;
	status?: string;
	expiresAt?: string;
	deliveryStatus?: string;
	retryAllowed?: boolean;
	nextRetryAt?: string;
	type?: string;
	[key: string]: unknown;
}

export interface MfaCredentials {
	environmentId?: string;
	workerToken: string;
	userId: string;
}

export interface RegisterDeviceRequest {
	credentials: MfaCredentials;
	type: MfaDeviceType;
	phoneNumber?: string;
	emailAddress?: string;
	nickname?: string;
	deviceName?: string;
}

export interface RegisterDeviceResult {
	success: boolean;
	device?: MfaDevice;
	error?: string;
}

export interface ActivateDeviceRequest {
	credentials: MfaCredentials;
	deviceId: string;
	otp: string;
}

export interface ChallengeRequest {
	credentials: MfaCredentials;
	deviceId: string;
	method?: 'SMS' | 'EMAIL' | 'VOICE';
}

export interface ValidateChallengeRequest {
	credentials: MfaCredentials;
	challengeId: string;
	code: string;
}

export interface DeleteDeviceRequest {
	credentials: MfaCredentials;
	deviceId: string;
}

export interface MfaErrorPayload {
	status?: number;
	code?: string;
	message: string;
	description?: string;
	details?: unknown;
}

export class MfaApiError extends Error {
	status?: number;
	code?: string;
	description?: string;
	details?: unknown;

	constructor(message: string, payload: MfaErrorPayload = { message }) {
		super(message);
		this.name = 'MfaApiError';
		this.status = payload.status;
		this.code = payload.code;
		this.description = payload.description;
		this.details = payload.details;
	}
}

function resolveEnvironmentId(value?: string): string {
	const envId =
		value ?? process.env.PINGONE_ENVIRONMENT_ID ?? process.env.VITE_PINGONE_ENVIRONMENT_ID;
	if (!envId) {
		throw new MfaApiError('PingOne environment ID is not configured.', {
			code: 'missing_environment_id',
			message: 'PingOne environment ID is required.',
			description:
				'Set PINGONE_ENVIRONMENT_ID (or VITE_PINGONE_ENVIRONMENT_ID) in the environment.',
		});
	}
	return envId;
}

function determineRegion(environmentId: string): string {
	const lower = environmentId.toLowerCase();
	if (lower.includes('eu')) return 'eu';
	if (lower.includes('asia')) return 'asia';
	return 'com';
}

function buildApiBaseUrl(environmentId: string): string {
	const region = determineRegion(environmentId);
	return `https://api.pingone.${region}/v1/environments/${environmentId}`;
}

function createApiError(error: unknown, fallback: string): MfaApiError {
	if (error instanceof MfaApiError) {
		return error;
	}

	if ((axios as { isAxiosError?: (value: unknown) => value is AxiosError }).isAxiosError?.(error)) {
		const axiosError = error as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, any> | undefined;
		const code = (data?.error as string | undefined) ?? axiosError.code;
		const description =
			(data?.error_description as string | undefined) ?? (data?.message as string | undefined);
		const message = description ?? fallback;

		return new MfaApiError(message, {
			status,
			code,
			message,
			description,
			details: data,
		});
	}

	if (error instanceof Error) {
		return new MfaApiError(error.message);
	}

	return new MfaApiError(fallback);
}

function buildHeaders(credentials: MfaCredentials) {
	return {
		Authorization: `Bearer ${credentials.workerToken}`,
		Accept: 'application/json',
		'Content-Type': 'application/json',
	};
}

export async function listDevices(credentials: MfaCredentials): Promise<MfaDevice[]> {
	try {
		const environmentId = resolveEnvironmentId(credentials.environmentId);
		const baseUrl = buildApiBaseUrl(environmentId);

		const response = await axios.get(`${baseUrl}/users/${credentials.userId}/devices`, {
			headers: buildHeaders(credentials),
		});

		const data = response.data as Record<string, any>;
		return (data._embedded?.devices as MfaDevice[]) || [];
	} catch (error) {
		throw createApiError(error, 'Failed to retrieve PingOne MFA devices.');
	}
}

export async function registerDevice({
	credentials,
	type,
	phoneNumber,
	emailAddress,
	nickname,
	deviceName,
}: RegisterDeviceRequest): Promise<RegisterDeviceResult> {
	try {
		const environmentId = resolveEnvironmentId(credentials.environmentId);
		const baseUrl = buildApiBaseUrl(environmentId);

		const payload: Record<string, unknown> = { type };
		if (nickname) payload.nickname = nickname;
		if (deviceName) payload.deviceName = deviceName;

		if (type === 'SMS' || type === 'VOICE') {
			if (!phoneNumber) {
				return { success: false, error: 'phoneNumber is required for SMS/VOICE devices.' };
			}
			payload.phone = phoneNumber;
		}

		if (type === 'EMAIL') {
			if (!emailAddress) {
				return { success: false, error: 'emailAddress is required for EMAIL devices.' };
			}
			payload.email = emailAddress;
		}

		const response = await axios.post(`${baseUrl}/users/${credentials.userId}/devices`, payload, {
			headers: buildHeaders(credentials),
		});

		return {
			success: true,
			device: response.data as MfaDevice,
		};
	} catch (error) {
		const apiError = createApiError(error, 'Failed to register PingOne MFA device.');
		return {
			success: false,
			error: apiError.message,
		};
	}
}

export async function activateDevice({
	credentials,
	deviceId,
	otp,
}: ActivateDeviceRequest): Promise<void> {
	try {
		const environmentId = resolveEnvironmentId(credentials.environmentId);
		const baseUrl = buildApiBaseUrl(environmentId);

		await axios.post(
			`${baseUrl}/users/${credentials.userId}/devices/${deviceId}`,
			{ otp },
			{
				headers: {
					Authorization: `Bearer ${credentials.workerToken}`,
					Accept: 'application/json',
					'Content-Type': 'application/vnd.pingidentity.device.activate+json',
				},
			}
		);
	} catch (error) {
		throw createApiError(error, 'Failed to activate PingOne MFA device.');
	}
}

export async function sendChallenge({
	credentials,
	deviceId,
	method,
}: ChallengeRequest): Promise<MfaChallengeResponse> {
	try {
		const environmentId = resolveEnvironmentId(credentials.environmentId);
		const baseUrl = buildApiBaseUrl(environmentId);

		const response = await axios.post(
			`${baseUrl}/users/${credentials.userId}/devices/${deviceId}/authentications`,
			{
				type: method ?? 'SMS',
			},
			{
				headers: buildHeaders(credentials),
			}
		);

		return response.data as MfaChallengeResponse;
	} catch (error) {
		throw createApiError(error, 'Failed to send PingOne MFA challenge.');
	}
}

export async function validateChallenge({
	credentials,
	challengeId,
	code,
}: ValidateChallengeRequest): Promise<MfaChallengeResponse> {
	try {
		const environmentId = resolveEnvironmentId(credentials.environmentId);
		const baseUrl = buildApiBaseUrl(environmentId);

		const response = await axios.post(
			`${baseUrl}/users/${credentials.userId}/authentications/${challengeId}`,
			{ code },
			{
				headers: buildHeaders(credentials),
			}
		);

		return response.data as MfaChallengeResponse;
	} catch (error) {
		throw createApiError(error, 'Failed to validate PingOne MFA challenge.');
	}
}

export async function deleteDevice({ credentials, deviceId }: DeleteDeviceRequest): Promise<void> {
	try {
		const environmentId = resolveEnvironmentId(credentials.environmentId);
		const baseUrl = buildApiBaseUrl(environmentId);

		await axios.delete(`${baseUrl}/users/${credentials.userId}/devices/${deviceId}`, {
			headers: buildHeaders(credentials),
		});
	} catch (error) {
		throw createApiError(error, 'Failed to delete PingOne MFA device.');
	}
}

// ─── Region-aware URL builder (for new admin operations) ─────────────────────

const REGION_MAP: Record<string, string> = {
	us: 'com',
	na: 'com',
	eu: 'eu',
	ca: 'ca',
	ap: 'asia',
	asia: 'asia',
	au: 'com.au',
	sg: 'sg',
};

function buildRegionBaseUrl(environmentId: string, region?: string): string {
	const tld =
		(region ? REGION_MAP[region.toLowerCase()] : undefined) ?? determineRegion(environmentId);
	return `https://api.pingone.${tld}/v1/environments/${environmentId}`;
}

// ─── New interfaces ───────────────────────────────────────────────────────────

export interface MfaPolicyRequest {
	/** PingOne environment ID — falls back to PINGONE_ENVIRONMENT_ID env var */
	environmentId?: string;
	workerToken: string;
	/** PingOne region code: us/na, eu, ca, ap/asia, au, sg (default: na) */
	region?: string;
}

export interface MfaDeviceStatusRequest {
	environmentId?: string;
	workerToken: string;
	userId: string;
	deviceId: string;
	region?: string;
}

export interface MfaDeviceNicknameRequest {
	environmentId?: string;
	workerToken: string;
	userId: string;
	deviceId: string;
	nickname: string;
	region?: string;
}

export interface MfaBypassRequest {
	environmentId?: string;
	workerToken: string;
	userId: string;
	region?: string;
}

export interface MfaDeviceOrderRequest {
	environmentId?: string;
	workerToken: string;
	userId: string;
	deviceIds: string[];
	region?: string;
}

export interface MfaOtpRequest {
	environmentId?: string;
	workerToken: string;
	userId: string;
	deviceId: string;
	region?: string;
}

// ─── Device Authentication Policy operations ─────────────────────────────────

export async function listDeviceAuthPolicies(request: MfaPolicyRequest): Promise<unknown[]> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		const response = await axios.get(`${baseUrl}/deviceAuthenticationPolicies`, {
			headers: buildHeaders({ workerToken: request.workerToken, userId: '', environmentId }),
		});
		const data = response.data as Record<string, unknown>;
		return (data._embedded as Record<string, unknown[]> | undefined)?.deviceAuthenticationPolicies ?? [];
	} catch (error) {
		throw createApiError(error, 'Failed to list device authentication policies.');
	}
}

export async function getDeviceAuthPolicy(
	request: MfaPolicyRequest,
	policyId: string
): Promise<unknown> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		const response = await axios.get(
			`${baseUrl}/deviceAuthenticationPolicies/${policyId}`,
			{ headers: buildHeaders({ workerToken: request.workerToken, userId: '', environmentId }) }
		);
		return response.data as unknown;
	} catch (error) {
		throw createApiError(error, 'Failed to get device authentication policy.');
	}
}

export async function createDeviceAuthPolicy(
	request: MfaPolicyRequest,
	policy: Record<string, unknown>
): Promise<unknown> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		const response = await axios.post(
			`${baseUrl}/deviceAuthenticationPolicies`,
			{ ...policy, type: policy.type ?? 'DEFAULT' },
			{ headers: buildHeaders({ workerToken: request.workerToken, userId: '', environmentId }) }
		);
		return response.data as unknown;
	} catch (error) {
		throw createApiError(error, 'Failed to create device authentication policy.');
	}
}

export async function updateDeviceAuthPolicy(
	request: MfaPolicyRequest,
	policyId: string,
	policy: Record<string, unknown>
): Promise<unknown> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		const response = await axios.put(
			`${baseUrl}/deviceAuthenticationPolicies/${policyId}`,
			policy,
			{ headers: buildHeaders({ workerToken: request.workerToken, userId: '', environmentId }) }
		);
		return response.data as unknown;
	} catch (error) {
		throw createApiError(error, 'Failed to update device authentication policy.');
	}
}

// ─── Device status operations (block / unlock / unblock) ─────────────────────

async function postDeviceAction(
	request: MfaDeviceStatusRequest,
	contentType: string,
	action: string
): Promise<void> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		await axios.post(
			`${baseUrl}/users/${request.userId}/devices/${request.deviceId}`,
			null,
			{
				headers: {
					Authorization: `Bearer ${request.workerToken}`,
					'Content-Type': contentType,
				},
				// 204 is a success; axios raises on non-2xx by default
				validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
			}
		);
	} catch (error) {
		throw createApiError(error, `Failed to ${action} MFA device.`);
	}
}

export async function blockDevice(request: MfaDeviceStatusRequest): Promise<void> {
	return postDeviceAction(request, 'application/vnd.pingidentity.device.block+json', 'block');
}

export async function unlockDevice(request: MfaDeviceStatusRequest): Promise<void> {
	return postDeviceAction(request, 'application/vnd.pingidentity.device.unlock+json', 'unlock');
}

export async function unblockDevice(request: MfaDeviceStatusRequest): Promise<void> {
	return postDeviceAction(request, 'application/vnd.pingidentity.device.unblock+json', 'unblock');
}

// ─── Device nickname ──────────────────────────────────────────────────────────

export async function updateDeviceNickname(request: MfaDeviceNicknameRequest): Promise<unknown> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		const response = await axios.put(
			`${baseUrl}/users/${request.userId}/devices/${request.deviceId}/nickname`,
			{ nickname: request.nickname.trim() },
			{ headers: buildHeaders({ workerToken: request.workerToken, userId: request.userId, environmentId }) }
		);
		return response.data as unknown;
	} catch (error) {
		throw createApiError(error, 'Failed to update device nickname.');
	}
}

// ─── MFA Bypass ───────────────────────────────────────────────────────────────

export async function allowMfaBypass(request: MfaBypassRequest): Promise<unknown> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		const response = await axios.put(
			`${baseUrl}/users/${request.userId}/mfaBypass`,
			{ enabled: true },
			{ headers: buildHeaders({ workerToken: request.workerToken, userId: request.userId, environmentId }) }
		);
		return response.data as unknown;
	} catch (error) {
		throw createApiError(error, 'Failed to allow MFA bypass.');
	}
}

export async function checkMfaBypass(request: MfaBypassRequest): Promise<unknown> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		const response = await axios.get(
			`${baseUrl}/users/${request.userId}/mfaBypass`,
			{ headers: buildHeaders({ workerToken: request.workerToken, userId: request.userId, environmentId }) }
		);
		return response.data as unknown;
	} catch (error) {
		throw createApiError(error, 'Failed to check MFA bypass status.');
	}
}

// ─── Device order ─────────────────────────────────────────────────────────────

export async function setDeviceOrder(request: MfaDeviceOrderRequest): Promise<void> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		await axios.post(
			`${baseUrl}/users/${request.userId}/devices/order`,
			{ order: request.deviceIds.map((id) => ({ id })) },
			{
				headers: {
					Authorization: `Bearer ${request.workerToken}`,
					'Content-Type': 'application/vnd.pingidentity.devices.reorder+json',
				},
				validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
			}
		);
	} catch (error) {
		throw createApiError(error, 'Failed to set device order.');
	}
}

export async function removeDeviceOrder(
	request: Omit<MfaDeviceOrderRequest, 'deviceIds'>
): Promise<void> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		await axios.post(
			`${baseUrl}/users/${request.userId}/devices/order`,
			null,
			{
				headers: {
					Authorization: `Bearer ${request.workerToken}`,
					'Content-Type': 'application/vnd.pingidentity.devices.order.remove+json',
				},
				validateStatus: (s) => (s >= 200 && s < 300) || s === 204,
			}
		);
	} catch (error) {
		throw createApiError(error, 'Failed to remove device order.');
	}
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export async function sendOtp(request: MfaOtpRequest): Promise<unknown> {
	const environmentId = resolveEnvironmentId(request.environmentId);
	const baseUrl = buildRegionBaseUrl(environmentId, request.region);
	try {
		const response = await axios.post(
			`${baseUrl}/users/${request.userId}/devices/${request.deviceId}/otp`,
			{},
			{ headers: buildHeaders({ workerToken: request.workerToken, userId: request.userId, environmentId }) }
		);
		return response.data as unknown;
	} catch (error) {
		throw createApiError(error, 'Failed to send OTP.');
	}
}

// ─── Error serialization ──────────────────────────────────────────────────────

export function toMfaErrorPayload(error: unknown): MfaErrorPayload {
	if (error instanceof MfaApiError) {
		return {
			status: error.status,
			code: error.code,
			message: error.message,
			description: error.description,
			details: error.details,
		};
	}

	if ((axios as { isAxiosError?: (value: unknown) => value is AxiosError }).isAxiosError?.(error)) {
		const axiosError = error as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, any> | undefined;
		return {
			status,
			code: (data?.error as string | undefined) ?? axiosError.code,
			message:
				(data?.error_description as string | undefined) ??
				axiosError.message ??
				'PingOne MFA request failed',
			description:
				(data?.error_description as string | undefined) ?? (data?.message as string | undefined),
			details: data,
		};
	}

	if (error instanceof Error) {
		return {
			message: error.message,
		};
	}

	return {
		message: 'Unknown PingOne MFA error',
	};
}
