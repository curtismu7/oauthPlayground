import PingOneAPI from '../api/pingone';
import { logger } from '../utils/logger';

export interface PingOneSamlApp {
	id: string;
	name: string;
	entityId: string;
	assertionConsumerService: {
		allowSignedRequestOverride: boolean;
		default: string;
		endpoints: Array<{
			binding: string;
			url: string;
			index?: number;
		}>;
	};
}

export interface PingOneAdminCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
}

export interface UpdateDynamicAcsOptions {
	credentials: PingOneAdminCredentials;
	applicationId: string;
	allowOverride: boolean;
	signingCertificate?: string;
}

export class PingOneSamlService {
	private async ensureAuthenticated(credentials: PingOneAdminCredentials): Promise<void> {
		const { environmentId, clientId, clientSecret } = credentials;
		if (!environmentId || !clientId || !clientSecret) {
			throw new Error(
				'Missing PingOne admin credentials. Please supply environment ID, client ID, and client secret.'
			);
		}

		if (PingOneAPI.isTokenExpired()) {
			logger.info('[PingOneSamlService]', 'Authenticating with PingOne');
			await PingOneAPI.authenticate(clientId, clientSecret, environmentId);
		}
	}

	async fetchApplications(credentials: PingOneAdminCredentials): Promise<PingOneSamlApp[]> {
		await this.ensureAuthenticated(credentials);
		const { environmentId } = credentials;
		logger.info('[PingOneSamlService]', 'Fetching SAML applications', { environmentId });
		try {
			const response = await PingOneAPI.request(
				`/v1/environments/${environmentId}/applications?type=SAML`
			);
			return response._embedded?.applications ?? [];
		} catch (error) {
			logger.error('[PingOneSamlService]', 'Failed to fetch SAML applications', { error });
			throw this.normalizeError(error, 'Unable to load PingOne applications');
		}
	}

	async fetchApplication(
		credentials: PingOneAdminCredentials,
		applicationId: string
	): Promise<PingOneSamlApp> {
		await this.ensureAuthenticated(credentials);
		const { environmentId } = credentials;
		logger.info('[PingOneSamlService]', 'Fetching SAML application', {
			environmentId,
			applicationId,
		});
		try {
			return await PingOneAPI.request(
				`/v1/environments/${environmentId}/applications/${applicationId}`
			);
		} catch (error) {
			logger.error('[PingOneSamlService]', 'Failed to fetch SAML application', { error });
			throw this.normalizeError(error, 'Unable to load PingOne application');
		}
	}

	async updateDynamicAcs(options: UpdateDynamicAcsOptions): Promise<PingOneSamlApp> {
		const { credentials, applicationId, allowOverride, signingCertificate } = options;
		await this.ensureAuthenticated(credentials);
		const { environmentId } = credentials;
		logger.info('[PingOneSamlService]', 'Updating dynamic ACS toggle', {
			environmentId,
			applicationId,
			allowOverride,
		});

		const payload: Record<string, unknown> = {
			assertionConsumerService: {
				allowSignedRequestOverride: allowOverride,
			},
		};

		const trimmedCertificate = signingCertificate?.trim();
		if (trimmedCertificate) {
			payload.signingCertificate = {
				format: 'X509PEM',
				value: trimmedCertificate,
			};
		}

		try {
			return await PingOneAPI.request(
				`/v1/environments/${environmentId}/applications/${applicationId}`,
				{
					method: 'PATCH',
					body: JSON.stringify(payload),
				}
			);
		} catch (error) {
			logger.error('[PingOneSamlService]', 'Failed to update dynamic ACS toggle', { error });
			throw this.normalizeError(error, 'Unable to update PingOne application');
		}
	}

	private normalizeError(error: unknown, fallbackMessage: string): Error {
		if (error instanceof Error) {
			return new Error(error.message || fallbackMessage);
		}
		if (typeof error === 'object' && error && 'message' in (error as Record<string, unknown>)) {
			const message = String((error as Record<string, unknown>).message);
			return new Error(message || fallbackMessage);
		}
		return new Error(fallbackMessage);
	}
}

export const pingOneSamlService = new PingOneSamlService();
