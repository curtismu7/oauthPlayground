/**
 * PingOne flow API: username/password check (stateful flow step).
 * POST to flow URL with application/vnd.pingidentity.usernamePassword.check+json.
 */

import axios, { AxiosError } from 'axios';

export interface CheckUsernamePasswordRequest {
	flowUrl: string;
	username: string;
	password: string;
	/** Optional Cookie header value or array of Set-Cookie name=value strings. */
	cookies?: string[] | string;
}

export interface CheckUsernamePasswordResult {
	success: boolean;
	response?: Record<string, unknown>;
	raw?: unknown;
	error?: { code?: string; message: string };
}

/**
 * Validate username/password in a PingOne flow context. Sends credentials to PingOne only.
 * Flow URL is from the flow response (e.g. step action URL). Cookies from initial authorize may be required.
 */
export async function checkUsernamePassword(
	request: CheckUsernamePasswordRequest
): Promise<CheckUsernamePasswordResult> {
	try {
		const flowUrl = request.flowUrl?.trim();
		if (!flowUrl) {
			return { success: false, error: { message: 'flowUrl is required' } };
		}
		if (!request.username || !request.password) {
			return { success: false, error: { message: 'username and password are required' } };
		}

		const body = JSON.stringify({
			action: 'usernamePassword.check',
			username: request.username,
			password: request.password,
		});

		const headers: Record<string, string> = {
			Accept: 'application/json',
			'Content-Type': 'application/vnd.pingidentity.usernamePassword.check+json',
			'User-Agent': 'PingOne-MCP/1.0',
		};

		if (request.cookies) {
			const cookieStr = Array.isArray(request.cookies)
				? request.cookies.map((c) => c.split(';')[0].trim()).filter(Boolean).join('; ')
				: request.cookies;
			if (cookieStr) headers['Cookie'] = cookieStr;
		}

		const response = await axios.post(flowUrl, body, {
			headers,
			validateStatus: () => true,
		});

		const data = response.data as Record<string, unknown> | undefined;
		if (!response.ok) {
			return {
				success: false,
				response: data,
				raw: data,
				error: {
					code: String(response.status),
					message: (data?.message as string) ?? (data?.error_description as string) ?? `HTTP ${response.status}`,
				},
			};
		}
		return { success: true, response: data, raw: data };
	} catch (err) {
		const axiosError = err as AxiosError;
		const status = axiosError.response?.status;
		const data = axiosError.response?.data as Record<string, unknown> | undefined;
		const message =
			(data?.message as string) ??
			(data?.error_description as string) ??
			axiosError.message ??
			'Check username/password failed';
		return {
			success: false,
			error: { code: status ? String(status) : undefined, message },
		};
	}
}
