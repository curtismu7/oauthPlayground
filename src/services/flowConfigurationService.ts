// src/services/flowConfigurationService.ts
import { v4ToastManager } from '../utils/v4ToastMessages';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { FlowRedirectUriService } from './flowRedirectUriService';

export interface FlowConfigurationServiceOptions {
	flowKey: string;
	requiredFields: Array<keyof StepCredentials>;
	defaultCredentials: Partial<StepCredentials>;
}

export class FlowConfigurationService {
	private flowKey: string;
	private requiredFields: Array<keyof StepCredentials>;
	private defaultCredentials: Partial<StepCredentials>;

	constructor(options: FlowConfigurationServiceOptions) {
		this.flowKey = options.flowKey;
		this.requiredFields = options.requiredFields;
		this.defaultCredentials = options.defaultCredentials;
	}

	/**
	 * Creates a field change handler that updates credentials and manages validation state
	 */
	createFieldChangeHandler(
		setCredentials: (credentials: StepCredentials) => void,
		setEmptyRequiredFields: (updater: (prev: Set<string>) => Set<string>) => void
	) {
		return (field: keyof StepCredentials, value: string) => {
			const updatedCredentials = {
				...this.getCurrentCredentials(),
				[field]: value,
			};
			setCredentials(updatedCredentials as StepCredentials);

			// Update validation state
			if (value.trim()) {
				setEmptyRequiredFields((prev) => {
					const next = new Set(prev);
					next.delete(field as string);
					return next;
				});
			} else {
				setEmptyRequiredFields((prev) => new Set(prev).add(field as string));
			}
		};
	}

	/**
	 * Creates a configuration save handler with validation
	 */
	createSaveConfigurationHandler(
		getCredentials: () => StepCredentials,
		setEmptyRequiredFields: (fields: Set<string>) => void
	) {
		return async () => {
			const credentials = getCredentials();
			const missing = this.requiredFields.filter((field) => {
				const value = credentials[field];
				return !value || (typeof value === 'string' && !value.trim());
			});

			if (missing.length > 0) {
				setEmptyRequiredFields(new Set(missing.map((field) => field as string)));
				v4ToastManager.showError(
					'Missing required fields: Complete all required fields before saving.'
				);
				return false;
			}

			try {
				// Save to sessionStorage
				sessionStorage.setItem(`${this.flowKey}-credentials`, JSON.stringify(credentials));
				v4ToastManager.showSuccess('Configuration saved successfully!');
				return true;
			} catch (error) {
				console.error(`[${this.flowKey}] Failed to save configuration:`, error);
				v4ToastManager.showError('Failed to save configuration');
				return false;
			}
		};
	}

	/**
	 * Creates a configuration clear handler
	 */
	createClearConfigurationHandler(
		setCredentials: (credentials: StepCredentials) => void,
		setEmptyRequiredFields: (fields: Set<string>) => void
	) {
		return () => {
			const clearedCredentials = {
				...this.defaultCredentials,
			} as StepCredentials;

			setCredentials(clearedCredentials);
			setEmptyRequiredFields(new Set(this.requiredFields.map((field) => field as string)));

			// Clear from sessionStorage
			sessionStorage.removeItem(`${this.flowKey}-credentials`);

			v4ToastManager.showSuccess('Configuration cleared. Enter credentials to continue.');
		};
	}

	/**
	 * Loads configuration from sessionStorage
	 */
	loadConfiguration(): StepCredentials | null {
		try {
			const stored = sessionStorage.getItem(`${this.flowKey}-credentials`);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (error) {
			console.warn(`[${this.flowKey}] Failed to load stored configuration:`, error);
		}
		return null;
	}

	/**
	 * Validates if all required fields are filled
	 */
	validateRequiredFields(credentials: StepCredentials): { isValid: boolean; missing: string[] } {
		const missing = this.requiredFields.filter((field) => {
			const value = credentials[field];
			return !value || (typeof value === 'string' && !value.trim());
		});

		return {
			isValid: missing.length === 0,
			missing: missing.map((field) => field as string),
		};
	}

	/**
	 * Gets current credentials from sessionStorage or returns defaults
	 */
	private getCurrentCredentials(): StepCredentials {
		const stored = this.loadConfiguration();
		if (stored) {
			return stored;
		}
		return this.defaultCredentials as StepCredentials;
	}

	/**
	 * Static factory methods for common flow configurations
	 */
	static createOAuthImplicitConfig(): FlowConfigurationService {
		return new FlowConfigurationService({
			flowKey: 'oauth-implicit-v5',
			requiredFields: ['environmentId', 'clientId', 'redirectUri'],
			defaultCredentials: {
				environmentId: '',
				clientId: '',
				clientSecret: '',
				redirectUri: FlowRedirectUriService.getDefaultRedirectUri('implicit-v3'),
				scope: 'openid',
				scopes: 'openid',
				responseType: 'token',
				grantType: '',
				clientAuthMethod: 'none',
			},
		});
	}

	static createOAuthImplicitV6Config(): FlowConfigurationService {
		return new FlowConfigurationService({
			flowKey: 'oauth-implicit-v6',
			requiredFields: ['environmentId', 'clientId', 'redirectUri'],
			defaultCredentials: {
				environmentId: '',
				clientId: '',
				clientSecret: '',
				redirectUri: FlowRedirectUriService.getDefaultRedirectUri('oauth-implicit-v6'),
				scope: 'openid profile email',
				scopes: 'openid profile email',
				responseType: 'token',
				grantType: '',
				clientAuthMethod: 'none',
			},
		});
	}

	static createOAuthAuthorizationCodeConfig(): FlowConfigurationService {
		return new FlowConfigurationService({
			flowKey: 'oauth-authorization-code-v5',
			requiredFields: ['environmentId', 'clientId', 'clientSecret', 'redirectUri'],
			defaultCredentials: {
				environmentId: '',
				clientId: '',
				clientSecret: '',
				redirectUri: FlowRedirectUriService.getDefaultRedirectUri('oauth-authorization-code-v5'),
				scope: 'openid',
				responseType: 'code',
				grantType: 'authorization_code',
				clientAuthMethod: 'client_secret_post',
			},
		});
	}
}