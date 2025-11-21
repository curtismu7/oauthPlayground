// src/services/v8StorageService.ts
// V8 Flow Storage Service
// Handles section-based storage for V8 flows (oauth-authorization-code-v8, implicit-v8, etc.)
//
// DEBUGGING NOTES:
// ================
// STORAGE ARCHITECTURE:
// - Uses CredentialStorageManager which implements 3-tier storage:
//   1. Memory cache (fastest, session-only)
//   2. Browser localStorage (survives refresh)
//   3. File storage (survives server restart) - stores in ~/.pingone-playground/credentials/
// - File storage uses backend API endpoints:
//   * POST /api/credentials/save
//   * GET /api/credentials/load
//   * DELETE /api/credentials/delete
// - Priority on load: Memory -> Browser -> File
// - If no browser storage found, automatically falls back to file storage
// - Saves to all three layers (best-effort, continues on partial failure)
// - File storage fallback is standard for all V8 flows

import { CredentialStorageManager } from './credentialStorageManager';

export interface V8DiscoveryData {
	issuerUrl?: string;
	authorizationEndpoint?: string;
	tokenEndpoint?: string;
	userInfoEndpoint?: string;
	jwksUrl?: string;
	endSessionEndpoint?: string;
	discoveryDocument?: any;
	discoveredAt?: number;
}

export interface V8CredentialsData {
	environmentId?: string;
	region?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	postLogoutRedirectUri?: string;
	scopes?: string | string[];
	loginHint?: string;
	clientAuthMethod?: string;
}

export interface V8AdvancedData {
	privateKey?: string;
	jwksUrl?: string;
	issuer?: string;
	subject?: string;
	tokenEndpointAuthMethod?: string;
	[key: string]: any;
}

export interface V8FlowData {
	flowType: string;
	discovery?: V8DiscoveryData;
	credentials?: V8CredentialsData;
	advanced?: V8AdvancedData;
	savedAt?: number;
}

// V8 Flow Types
export const V8_FLOW_TYPES = {
	OAUTH_AUTHORIZATION_CODE: 'oauth-authorization-code-v8',
	IMPLICIT: 'implicit-v8',
} as const;

export type V8FlowType = (typeof V8_FLOW_TYPES)[keyof typeof V8_FLOW_TYPES];

class V8StorageService {
	private storageManager: CredentialStorageManager;
	private readonly STORAGE_PREFIX = 'v8_flow_';

	constructor() {
		this.storageManager = new CredentialStorageManager({
			enableFileStorage: true,
			enableMemoryCache: true,
		});
	}

	/**
	 * Get storage key for a V8 flow
	 */
	private getFlowKey(flowType: string): string {
		return `${this.STORAGE_PREFIX}${flowType}`;
	}

	/**
	 * Get section key for a V8 flow section
	 */
	private getSectionKey(
		flowType: string,
		section: 'discovery' | 'credentials' | 'advanced'
	): string {
		return `${this.STORAGE_PREFIX}${flowType}_${section}`;
	}

	/**
	 * Save OIDC Discovery data
	 */
	async saveDiscovery(flowType: string, discoveryData: V8DiscoveryData): Promise<boolean> {
		try {
			const sectionKey = this.getSectionKey(flowType, 'discovery');
			const dataWithMetadata: V8DiscoveryData = {
				...discoveryData,
				discoveredAt: discoveryData.discoveredAt || Date.now(),
			};

			await this.storageManager.saveFlowCredentials(sectionKey, dataWithMetadata);

			// Also update the main flow data
			const flowData = await this.loadFlowData(flowType);
			const updatedFlowData: V8FlowData = {
				...flowData,
				flowType,
				discovery: dataWithMetadata,
				savedAt: Date.now(),
			};
			await this.storageManager.saveFlowCredentials(this.getFlowKey(flowType), updatedFlowData);

			console.log(`[V8StorageService] Saved discovery data for ${flowType}`);
			return true;
		} catch (error) {
			console.error(`[V8StorageService] Failed to save discovery for ${flowType}:`, error);
			return false;
		}
	}

	/**
	 * Save Credentials data
	 */
	async saveCredentials(flowType: string, credentialsData: V8CredentialsData): Promise<boolean> {
		try {
			const sectionKey = this.getSectionKey(flowType, 'credentials');
			await this.storageManager.saveFlowCredentials(sectionKey, credentialsData);

			// Also update the main flow data
			const flowData = await this.loadFlowData(flowType);
			const updatedFlowData: V8FlowData = {
				...flowData,
				flowType,
				credentials: credentialsData,
				savedAt: Date.now(),
			};
			await this.storageManager.saveFlowCredentials(this.getFlowKey(flowType), updatedFlowData);

			console.log(`[V8StorageService] Saved credentials for ${flowType}`);
			return true;
		} catch (error) {
			console.error(`[V8StorageService] Failed to save credentials for ${flowType}:`, error);
			return false;
		}
	}

	/**
	 * Save Advanced data
	 */
	async saveAdvanced(flowType: string, advancedData: V8AdvancedData): Promise<boolean> {
		try {
			const sectionKey = this.getSectionKey(flowType, 'advanced');
			await this.storageManager.saveFlowCredentials(sectionKey, advancedData);

			// Also update the main flow data
			const flowData = await this.loadFlowData(flowType);
			const updatedFlowData: V8FlowData = {
				...flowData,
				flowType,
				advanced: advancedData,
				savedAt: Date.now(),
			};
			await this.storageManager.saveFlowCredentials(this.getFlowKey(flowType), updatedFlowData);

			console.log(`[V8StorageService] Saved advanced data for ${flowType}`);
			return true;
		} catch (error) {
			console.error(`[V8StorageService] Failed to save advanced for ${flowType}:`, error);
			return false;
		}
	}

	/**
	 * Save all sections at once
	 */
	async saveAll(
		flowType: string,
		data: {
			discovery?: V8DiscoveryData;
			credentials?: V8CredentialsData;
			advanced?: V8AdvancedData;
		}
	): Promise<boolean> {
		try {
			const promises: Promise<boolean>[] = [];

			if (data.discovery) {
				promises.push(this.saveDiscovery(flowType, data.discovery));
			}

			if (data.credentials) {
				promises.push(this.saveCredentials(flowType, data.credentials));
			}

			if (data.advanced) {
				promises.push(this.saveAdvanced(flowType, data.advanced));
			}

			const results = await Promise.all(promises);
			const allSucceeded = results.every((r) => r === true);

			// Update main flow data with all sections
			const flowData: V8FlowData = {
				flowType,
				discovery: data.discovery,
				credentials: data.credentials,
				advanced: data.advanced,
				savedAt: Date.now(),
			};
			await this.storageManager.saveFlowCredentials(this.getFlowKey(flowType), flowData);

			console.log(`[V8StorageService] Saved all sections for ${flowType}`);
			return allSucceeded;
		} catch (error) {
			console.error(`[V8StorageService] Failed to save all sections for ${flowType}:`, error);
			return false;
		}
	}

	/**
	 * Load OIDC Discovery data
	 */
	async loadDiscovery(flowType: string): Promise<V8DiscoveryData | null> {
		try {
			const sectionKey = this.getSectionKey(flowType, 'discovery');
			const result = await this.storageManager.loadFlowCredentials(sectionKey);
			return result.success && result.data ? (result.data as V8DiscoveryData) : null;
		} catch (error) {
			console.error(`[V8StorageService] Failed to load discovery for ${flowType}:`, error);
			return null;
		}
	}

	/**
	 * Load Credentials data
	 */
	async loadCredentials(flowType: string): Promise<V8CredentialsData | null> {
		try {
			const sectionKey = this.getSectionKey(flowType, 'credentials');
			const result = await this.storageManager.loadFlowCredentials(sectionKey);
			return result.success && result.data ? (result.data as V8CredentialsData) : null;
		} catch (error) {
			console.error(`[V8StorageService] Failed to load credentials for ${flowType}:`, error);
			return null;
		}
	}

	/**
	 * Load Advanced data
	 */
	async loadAdvanced(flowType: string): Promise<V8AdvancedData | null> {
		try {
			const sectionKey = this.getSectionKey(flowType, 'advanced');
			const result = await this.storageManager.loadFlowCredentials(sectionKey);
			return result.success && result.data ? (result.data as V8AdvancedData) : null;
		} catch (error) {
			console.error(`[V8StorageService] Failed to load advanced for ${flowType}:`, error);
			return null;
		}
	}

	/**
	 * Load all flow data
	 */
	async loadFlowData(flowType: string): Promise<V8FlowData> {
		try {
			const flowKey = this.getFlowKey(flowType);
			const result = await this.storageManager.loadFlowCredentials(flowKey);

			if (result.success && result.data) {
				return result.data as V8FlowData;
			}

			// Fallback: load individual sections
			const [discovery, credentials, advanced] = await Promise.all([
				this.loadDiscovery(flowType),
				this.loadCredentials(flowType),
				this.loadAdvanced(flowType),
			]);

			return {
				flowType,
				discovery: discovery || undefined,
				credentials: credentials || undefined,
				advanced: advanced || undefined,
			};
		} catch (error) {
			console.error(`[V8StorageService] Failed to load flow data for ${flowType}:`, error);
			return {
				flowType,
			};
		}
	}

	/**
	 * Clear all data for a flow
	 */
	async clearFlow(flowType: string): Promise<void> {
		try {
			await Promise.all([
				this.storageManager.clearFlowCredentials(this.getFlowKey(flowType)),
				this.storageManager.clearFlowCredentials(this.getSectionKey(flowType, 'discovery')),
				this.storageManager.clearFlowCredentials(this.getSectionKey(flowType, 'credentials')),
				this.storageManager.clearFlowCredentials(this.getSectionKey(flowType, 'advanced')),
			]);
			console.log(`[V8StorageService] Cleared all data for ${flowType}`);
		} catch (error) {
			console.error(`[V8StorageService] Failed to clear flow ${flowType}:`, error);
		}
	}

	/**
	 * Check if a flow has saved data
	 */
	async hasSavedData(flowType: string): Promise<boolean> {
		try {
			const flowData = await this.loadFlowData(flowType);
			return !!(flowData.discovery || flowData.credentials || flowData.advanced);
		} catch {
			return false;
		}
	}
}

// Export singleton instance
export const v8StorageService = new V8StorageService();
export default v8StorageService;
