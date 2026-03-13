/**
 * PingOne Webhook Subscriptions API client (worker token).
 * Manages event subscriptions (webhooks) for a PingOne environment.
 * PingOne API: /environments/{envId}/subscriptions
 */

import axios, { AxiosError } from 'axios';

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

function resolveEnvironmentId(value?: string): string {
	const envId =
		value ?? process.env.PINGONE_ENVIRONMENT_ID ?? process.env.VITE_PINGONE_ENVIRONMENT_ID;
	if (!envId) {
		throw new Error('PingOne environment ID is required (PINGONE_ENVIRONMENT_ID or pass environmentId).');
	}
	return envId;
}

function buildSubscriptionsBaseUrl(environmentId: string, region?: string): string {
	const key = (region ?? '').toLowerCase().trim();
	const tld = REGION_MAP[key] ?? 'com';
	return `https://api.pingone.${tld}/v1/environments/${environmentId}/subscriptions`;
}

/** Shared error extraction from Axios errors. */
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

export interface SubscriptionsCredentials {
	environmentId?: string;
	workerToken: string;
	region?: string;
}

export interface Subscription {
	id?: string;
	name?: string;
	enabled?: boolean;
	httpEndpoint?: {
		url?: string;
		headers?: Record<string, string>;
	};
	filterTags?: string[];
	format?: string;
	verifyTlsCertificates?: boolean;
	[key: string]: unknown;
}

export interface ListSubscriptionsResult {
	success: boolean;
	subscriptions?: Subscription[];
	raw?: unknown;
	error?: { code?: string; message: string };
}

export async function listSubscriptions(
	req: SubscriptionsCredentials
): Promise<ListSubscriptionsResult> {
	try {
		const environmentId = resolveEnvironmentId(req.environmentId);
		const baseUrl = buildSubscriptionsBaseUrl(environmentId, req.region);
		const { data } = await axios.get<Record<string, unknown>>(baseUrl, {
			headers: { Authorization: `Bearer ${req.workerToken}`, Accept: 'application/json' },
		});
		const embedded = data._embedded as Record<string, unknown> | undefined;
		const subscriptions = (embedded?.subscriptions as Subscription[]) ?? [];
		return { success: true, subscriptions, raw: data };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}

export interface GetSubscriptionResult {
	success: boolean;
	subscription?: Subscription;
	raw?: unknown;
	error?: { code?: string; message: string };
}

export async function getSubscription(
	req: SubscriptionsCredentials & { subscriptionId: string }
): Promise<GetSubscriptionResult> {
	try {
		const environmentId = resolveEnvironmentId(req.environmentId);
		const url = `${buildSubscriptionsBaseUrl(environmentId, req.region)}/${req.subscriptionId}`;
		const { data } = await axios.get<Subscription>(url, {
			headers: { Authorization: `Bearer ${req.workerToken}`, Accept: 'application/json' },
		});
		return { success: true, subscription: data, raw: data };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}

export interface CreateSubscriptionRequest extends SubscriptionsCredentials {
	name: string;
	httpEndpointUrl: string;
	httpEndpointHeaders?: Record<string, string>;
	filterTags?: string[];
	enabled?: boolean;
	format?: string;
	verifyTlsCertificates?: boolean;
}

export interface CreateSubscriptionResult {
	success: boolean;
	subscription?: Subscription;
	raw?: unknown;
	error?: { code?: string; message: string };
}

export async function createSubscription(req: CreateSubscriptionRequest): Promise<CreateSubscriptionResult> {
	try {
		const environmentId = resolveEnvironmentId(req.environmentId);
		const baseUrl = buildSubscriptionsBaseUrl(environmentId, req.region);
		const body: Record<string, unknown> = {
			name: req.name,
			httpEndpoint: {
				url: req.httpEndpointUrl,
				...(req.httpEndpointHeaders ? { headers: req.httpEndpointHeaders } : {}),
			},
		};
		if (req.filterTags !== undefined) body.filterTags = req.filterTags;
		if (req.enabled !== undefined) body.enabled = req.enabled;
		if (req.format !== undefined) body.format = req.format;
		if (req.verifyTlsCertificates !== undefined) body.verifyTlsCertificates = req.verifyTlsCertificates;

		const { data } = await axios.post<Subscription>(baseUrl, body, {
			headers: {
				Authorization: `Bearer ${req.workerToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});
		return { success: true, subscription: data, raw: data };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}

export interface UpdateSubscriptionRequest extends SubscriptionsCredentials {
	subscriptionId: string;
	/** Partial or full subscription update payload. */
	updates: Partial<Omit<Subscription, 'id'>>;
}

export interface UpdateSubscriptionResult {
	success: boolean;
	subscription?: Subscription;
	raw?: unknown;
	error?: { code?: string; message: string };
}

export async function updateSubscription(req: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResult> {
	try {
		const environmentId = resolveEnvironmentId(req.environmentId);
		const url = `${buildSubscriptionsBaseUrl(environmentId, req.region)}/${req.subscriptionId}`;
		const { data } = await axios.put<Subscription>(url, req.updates, {
			headers: {
				Authorization: `Bearer ${req.workerToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});
		return { success: true, subscription: data, raw: data };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}

export interface DeleteSubscriptionResult {
	success: boolean;
	error?: { code?: string; message: string };
}

export async function deleteSubscription(
	req: SubscriptionsCredentials & { subscriptionId: string }
): Promise<DeleteSubscriptionResult> {
	try {
		const environmentId = resolveEnvironmentId(req.environmentId);
		const url = `${buildSubscriptionsBaseUrl(environmentId, req.region)}/${req.subscriptionId}`;
		await axios.delete(url, {
			headers: { Authorization: `Bearer ${req.workerToken}`, Accept: 'application/json' },
			// 204 No Content is success
			validateStatus: (s) => s === 204 || (s >= 200 && s < 300),
		});
		return { success: true };
	} catch (err) {
		return { success: false, error: extractError(err) };
	}
}
