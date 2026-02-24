/**
 * @file pingOneAPIServiceV9.ts
 * @module v9/services
 * @description V9 PingOne API Service
 * @version 9.25.1
 * @since 2026-02-23
 */

export interface APIResponse<T = any> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: any;
	};
}

export interface Application {
	id: string;
	name: string;
	description?: string;
	enabled: boolean;
	redirectUris: string[];
	logoutUris: string[];
	createdAt: string;
	updatedAt: string;
}

export class PingOneAPIServiceV9 {
	private static readonly BASE_URL = 'https://api.pingone.com/v1';

	static async getApplications(
		environmentId: string,
		options: {
			workerToken: string;
			include?: string[];
		}
	): Promise<APIResponse<Application[]>> {
		try {
			const includeParams = options.include?.join(',') || '';
			const url = `${this.BASE_URL}/environments/${environmentId}/applications${includeParams ? `?include=${includeParams}` : ''}`;

			const response = await fetch(url, {
				headers: {
					'Authorization': `Bearer ${options.workerToken}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();

			return {
				success: true,
				data: data._embedded?.applications || [],
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: 'API_ERROR',
					message: error instanceof Error ? error.message : 'Unknown error',
				},
			};
		}
	}
}
