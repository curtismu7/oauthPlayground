// src/services/comprehensiveFlowDataService.ts
/**
 * Comprehensive Flow Data Service
 * 
 * Unified service for managing both shared and flow-specific data across all OAuth/OIDC flows.
 * 
 * Key Features:
 * - Shared data (Environment ID, Discovery, Global Config) - accessible by all flows
 * - Flow-specific data (Credentials, State, Config) - isolated per flow
 * - Smart data management with proper isolation
 * - Migration support for existing data
 * - Comprehensive debugging and auditing
 */

import { StepCredentials } from '../components/steps/CommonSteps';
import { showGlobalSuccess, showGlobalError } from '../hooks/useNotifications';
import { OIDCDiscoveryDocument } from './comprehensiveDiscoveryService';

// ============================================
// SHARED DATA INTERFACES
// ============================================

export interface SharedEnvironmentData {
	environmentId: string;
	region: string;
	issuerUrl: string;
	lastUpdated: number;
}

export interface SharedDiscoveryData {
	environmentId: string;
	discoveryDocument: OIDCDiscoveryDocument;
	timestamp: number;
	provider: string;
	region?: string;
}

export interface SharedGlobalConfig {
	preferences: {
		autoDiscovery: boolean;
		cacheDiscovery: boolean;
		showAdvancedOptions: boolean;
		defaultRegion: string;
	};
	lastUpdated: number;
}

export interface SharedUserSession {
	isAuthenticated: boolean;
	userInfo?: Record<string, any>;
	sessionId?: string;
	lastActivity: number;
}

// ============================================
// FLOW-SPECIFIC DATA INTERFACES
// ============================================

export interface FlowSpecificCredentials {
	environmentId?: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string[];
	additionalParams?: Record<string, string>;
	// Additional flow-specific fields
	logoutUrl?: string;
	loginHint?: string;
	tokenEndpointAuthMethod?: string;
	// Metadata
	lastUpdated: number;
}

export interface FlowSpecificState {
	currentStep: number;
	flowConfig: Record<string, any>;
	tokens?: Record<string, any>;
	nonce?: string;
	state?: string;
	pkceVerifier?: string;
	pkceChallenge?: string;
	lastUpdated: number;
}

export interface FlowSpecificConfig {
	flowVariant?: string;
	responseType?: string;
	responseMode?: string;
	grantType?: string;
	authMethod?: string;
	tokenEndpointAuthMethod?: string;
	pkceEnforcement?: 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED';
	customParams?: Record<string, string>;
	lastUpdated: number;
}

// ============================================
// MAIN SERVICE INTERFACES
// ============================================

export interface FlowDataConfig {
	flowKey: string;
	defaultCredentials?: Partial<StepCredentials>;
	useSharedEnvironment?: boolean; // Opt-in to shared environment data
	useSharedDiscovery?: boolean; // Opt-in to shared discovery data
}

export interface FlowDataResult {
	// Shared data
	sharedEnvironment: SharedEnvironmentData | null;
	sharedDiscovery: SharedDiscoveryData | null;
	sharedGlobalConfig: SharedGlobalConfig | null;
	sharedUserSession: SharedUserSession | null;
	
	// Flow-specific data
	flowCredentials: FlowSpecificCredentials | null;
	flowState: FlowSpecificState | null;
	flowConfig: FlowSpecificConfig | null;
	
	// Metadata
	hasSharedEnvironment: boolean;
	hasSharedDiscovery: boolean;
	hasFlowCredentials: boolean;
	hasFlowState: boolean;
	credentialSource: 'flow-specific' | 'shared-environment' | 'none';
}

// ============================================
// COMPREHENSIVE FLOW DATA SERVICE
// ============================================

class ComprehensiveFlowDataService {
	// Storage keys
	private readonly SHARED_ENVIRONMENT_KEY = 'pingone_shared_environment';
	private readonly SHARED_DISCOVERY_KEY = 'pingone_shared_discovery';
	private readonly SHARED_GLOBAL_CONFIG_KEY = 'pingone_shared_global_config';
	private readonly SHARED_USER_SESSION_KEY = 'pingone_shared_user_session';
	private readonly FLOW_DATA_PREFIX = 'pingone_flow_data';
	
	// ============================================
	// SHARED DATA METHODS
	// ============================================
	
	/**
	 * Save shared environment data (Environment ID, Region, Issuer URL)
	 * This is shared across ALL flows
	 */
	saveSharedEnvironment(data: Partial<SharedEnvironmentData>): boolean {
		try {
			console.group(`🌐 [SHARED DATA] Saving environment data`);
			console.log(`📋 Environment Data:`, data);
			
			const existing = this.loadSharedEnvironment();
			const updated: SharedEnvironmentData = {
				environmentId: data.environmentId || existing?.environmentId || '',
				region: data.region || existing?.region || 'us',
				issuerUrl: data.issuerUrl || existing?.issuerUrl || '',
				lastUpdated: Date.now(),
			};
			
			localStorage.setItem(this.SHARED_ENVIRONMENT_KEY, JSON.stringify(updated));
			console.log(`✅ Saved shared environment data:`, updated);
			console.groupEnd();
			
			return true;
		} catch (error) {
			console.error(`❌ Failed to save shared environment data:`, error);
			return false;
		}
	}
	
	/**
	 * Load shared environment data
	 */
	loadSharedEnvironment(): SharedEnvironmentData | null {
		try {
			const data = localStorage.getItem(this.SHARED_ENVIRONMENT_KEY);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error(`❌ Failed to load shared environment data:`, error);
			return null;
		}
	}
	
	/**
	 * Save shared discovery data (OIDC Discovery Results)
	 * This is shared across ALL flows for the same environment
	 */
	saveSharedDiscovery(data: SharedDiscoveryData): boolean {
		try {
			console.group(`🌐 [SHARED DATA] Saving discovery data`);
			console.log(`📋 Discovery Data:`, data);
			
			localStorage.setItem(this.SHARED_DISCOVERY_KEY, JSON.stringify(data));
			console.log(`✅ Saved shared discovery data for environment: ${data.environmentId}`);
			console.groupEnd();
			
			return true;
		} catch (error) {
			console.error(`❌ Failed to save shared discovery data:`, error);
			return false;
		}
	}
	
	/**
	 * Load shared discovery data
	 */
	loadSharedDiscovery(): SharedDiscoveryData | null {
		try {
			const data = localStorage.getItem(this.SHARED_DISCOVERY_KEY);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error(`❌ Failed to load shared discovery data:`, error);
			return null;
		}
	}
	
	/**
	 * Save shared global configuration
	 */
	saveSharedGlobalConfig(config: Partial<SharedGlobalConfig>): boolean {
		try {
			const existing = this.loadSharedGlobalConfig();
			const updated: SharedGlobalConfig = {
				preferences: {
					autoDiscovery: config.preferences?.autoDiscovery ?? existing?.preferences?.autoDiscovery ?? true,
					cacheDiscovery: config.preferences?.cacheDiscovery ?? existing?.preferences?.cacheDiscovery ?? true,
					showAdvancedOptions: config.preferences?.showAdvancedOptions ?? existing?.preferences?.showAdvancedOptions ?? false,
					defaultRegion: config.preferences?.defaultRegion ?? existing?.preferences?.defaultRegion ?? 'us',
				},
				lastUpdated: Date.now(),
			};
			
			localStorage.setItem(this.SHARED_GLOBAL_CONFIG_KEY, JSON.stringify(updated));
			return true;
		} catch (error) {
			console.error(`❌ Failed to save shared global config:`, error);
			return false;
		}
	}
	
	/**
	 * Load shared global configuration
	 */
	loadSharedGlobalConfig(): SharedGlobalConfig | null {
		try {
			const data = localStorage.getItem(this.SHARED_GLOBAL_CONFIG_KEY);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error(`❌ Failed to load shared global config:`, error);
			return null;
		}
	}
	
	// ============================================
	// FLOW-SPECIFIC DATA METHODS
	// ============================================
	
	/**
	 * Generate flow-specific storage key
	 */
	private getFlowStorageKey(flowKey: string): string {
		return `${this.FLOW_DATA_PREFIX}:${flowKey}`;
	}
	
	/**
	 * Save flow-specific data (credentials, state, config)
	 * This is isolated per flow
	 */
	saveFlowData(
		flowKey: string,
		data: {
			credentials?: Partial<FlowSpecificCredentials>;
			state?: Partial<FlowSpecificState>;
			config?: Partial<FlowSpecificConfig>;
		},
		options: { showToast?: boolean } = { showToast: true }
	): boolean {
		try {
			console.group(`🔒 [FLOW DATA] Saving data for flow: ${flowKey}`);
			console.log(`📋 Flow Key: ${flowKey}`);
			console.log(`📋 Data:`, data);
			
			const storageKey = this.getFlowStorageKey(flowKey);
			const existing = this.loadFlowData(flowKey);
			
			const updated = {
				credentials: {
					...existing?.credentials,
					...data.credentials,
					lastUpdated: Date.now(),
				},
				state: {
					...existing?.state,
					...data.state,
					lastUpdated: Date.now(),
				},
				config: {
					...existing?.config,
					...data.config,
					lastUpdated: Date.now(),
				},
				flowKey,
				version: '1.0',
				lastUpdated: Date.now(),
			};
			
			localStorage.setItem(storageKey, JSON.stringify(updated));
			console.log(`✅ Saved flow-specific data: ${storageKey}`);
			console.groupEnd();
			
			if (options.showToast) {
				showGlobalSuccess(`Flow data saved for ${flowKey}`);
			}
			
			return true;
		} catch (error) {
			console.error(`❌ Failed to save flow data for ${flowKey}:`, error);
			if (options.showToast) {
				showGlobalError(`Failed to save flow data for ${flowKey}`);
			}
			return false;
		}
	}
	
	/**
	 * Load flow-specific data
	 */
	loadFlowData(flowKey: string): {
		credentials?: FlowSpecificCredentials;
		state?: FlowSpecificState;
		config?: FlowSpecificConfig;
		flowKey: string;
		version: string;
		lastUpdated: number;
	} | null {
		try {
			const storageKey = this.getFlowStorageKey(flowKey);
			const data = localStorage.getItem(storageKey);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error(`❌ Failed to load flow data for ${flowKey}:`, error);
			return null;
		}
	}
	
	// ============================================
	// UNIFIED FLOW DATA METHODS
	// ============================================
	
	/**
	 * Load all data for a flow (shared + flow-specific)
	 * This is the main method flows should use
	 */
	loadFlowDataComprehensive(config: FlowDataConfig): FlowDataResult {
		const { flowKey, useSharedEnvironment = true, useSharedDiscovery = true } = config;
		
		console.group(`🔍 [COMPREHENSIVE FLOW DATA] Loading data for flow: ${flowKey}`);
		console.log(`📋 Flow Key: ${flowKey}`);
		console.log(`📋 Use Shared Environment: ${useSharedEnvironment}`);
		console.log(`📋 Use Shared Discovery: ${useSharedDiscovery}`);
		
		// Load shared data
		const sharedEnvironment = useSharedEnvironment ? this.loadSharedEnvironment() : null;
		const sharedDiscovery = useSharedDiscovery ? this.loadSharedDiscovery() : null;
		const sharedGlobalConfig = this.loadSharedGlobalConfig();
		const sharedUserSession = this.loadSharedUserSession();
		
		// Load flow-specific data
		const flowData = this.loadFlowData(flowKey);
		
		// Determine credential source
		let credentialSource: 'flow-specific' | 'shared-environment' | 'none' = 'none';
		if (flowData?.credentials?.clientId) {
			credentialSource = 'flow-specific';
		} else if (sharedEnvironment?.environmentId) {
			credentialSource = 'shared-environment';
		}
		
		const result: FlowDataResult = {
			// Shared data
			sharedEnvironment,
			sharedDiscovery,
			sharedGlobalConfig,
			sharedUserSession,
			
			// Flow-specific data
			flowCredentials: flowData?.credentials || null,
			flowState: flowData?.state || null,
			flowConfig: flowData?.config || null,
			
			// Metadata
			hasSharedEnvironment: !!sharedEnvironment,
			hasSharedDiscovery: !!sharedDiscovery,
			hasFlowCredentials: !!flowData?.credentials,
			hasFlowState: !!flowData?.state,
			credentialSource,
		};
		
		console.log(`📋 Result:`, result);
		console.groupEnd();
		
		return result;
	}
	
	/**
	 * Save comprehensive flow data (shared + flow-specific)
	 * This is the main method flows should use
	 */
	saveFlowDataComprehensive(
		flowKey: string,
		data: {
			// Shared data (optional)
			sharedEnvironment?: Partial<SharedEnvironmentData>;
			sharedDiscovery?: SharedDiscoveryData;
			
			// Flow-specific data
			flowCredentials?: Partial<FlowSpecificCredentials>;
			flowState?: Partial<FlowSpecificState>;
			flowConfig?: Partial<FlowSpecificConfig>;
		},
		options: { showToast?: boolean } = { showToast: true }
	): boolean {
		try {
			console.group(`💾 [COMPREHENSIVE FLOW DATA] Saving data for flow: ${flowKey}`);
			console.log(`📋 Flow Key: ${flowKey}`);
			console.log(`📋 Data:`, data);
			
			let success = true;
			
			// Save shared data if provided
			if (data.sharedEnvironment) {
				success = this.saveSharedEnvironment(data.sharedEnvironment) && success;
			}
			
			if (data.sharedDiscovery) {
				success = this.saveSharedDiscovery(data.sharedDiscovery) && success;
			}
			
			// Save flow-specific data
			if (data.flowCredentials || data.flowState || data.flowConfig) {
				success = this.saveFlowData(flowKey, {
					credentials: data.flowCredentials,
					state: data.flowState,
					config: data.flowConfig,
				}, { showToast: false }) && success;
			}
			
			if (options.showToast) {
				if (success) {
					showGlobalSuccess(`Flow data saved for ${flowKey}`);
				} else {
					showGlobalError(`Failed to save some flow data for ${flowKey}`);
				}
			}
			
			console.log(`📋 Overall Success: ${success}`);
			console.groupEnd();
			
			return success;
		} catch (error) {
			console.error(`❌ Failed to save comprehensive flow data for ${flowKey}:`, error);
			if (options.showToast) {
				showGlobalError(`Failed to save flow data for ${flowKey}`);
			}
			return false;
		}
	}
	
	// ============================================
	// UTILITY METHODS
	// ============================================
	
	/**
	 * Load shared user session
	 */
	private loadSharedUserSession(): SharedUserSession | null {
		try {
			const data = localStorage.getItem(this.SHARED_USER_SESSION_KEY);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error(`❌ Failed to load shared user session:`, error);
			return null;
		}
	}
	
	/**
	 * Clear flow-specific data
	 */
	clearFlowData(flowKey: string): boolean {
		try {
			const storageKey = this.getFlowStorageKey(flowKey);
			localStorage.removeItem(storageKey);
			console.log(`🗑️ Cleared flow data for: ${flowKey}`);
			return true;
		} catch (error) {
			console.error(`❌ Failed to clear flow data for ${flowKey}:`, error);
			return false;
		}
	}
	
	/**
	 * Clear all shared data
	 */
	clearAllSharedData(): boolean {
		try {
			localStorage.removeItem(this.SHARED_ENVIRONMENT_KEY);
			localStorage.removeItem(this.SHARED_DISCOVERY_KEY);
			localStorage.removeItem(this.SHARED_GLOBAL_CONFIG_KEY);
			localStorage.removeItem(this.SHARED_USER_SESSION_KEY);
			console.log(`🗑️ Cleared all shared data`);
			return true;
		} catch (error) {
			console.error(`❌ Failed to clear shared data:`, error);
			return false;
		}
	}
	
	/**
	 * Audit all flow data
	 */
	auditAllFlowData(): Record<string, FlowDataResult> {
		const v7Flows = [
			'oauth-authorization-code-v7',
			'oidc-hybrid-v7',
			'worker-token-v7',
			'client-credentials-v7',
			'device-authorization-v7',
			'implicit-flow-v7',
			'ciba-flow-v7',
			'redirectless-v7-real',
			'pingone-par-flow-v7'
		];
		
		console.group(`🔍 [COMPREHENSIVE AUDIT] Auditing all V7 flows`);
		
		const results: Record<string, FlowDataResult> = {};
		
		v7Flows.forEach(flowKey => {
			results[flowKey] = this.loadFlowDataComprehensive({ flowKey });
		});
		
		// Detect flows using shared environment data
		const flowsUsingSharedEnvironment = Object.entries(results)
			.filter(([_, result]) => result.credentialSource === 'shared-environment')
			.map(([flowKey, _]) => flowKey);
		
		if (flowsUsingSharedEnvironment.length > 0) {
			console.log(`🌐 Flows using shared environment data:`, flowsUsingSharedEnvironment);
		}
		
		// Detect flows with flow-specific credentials
		const flowsWithFlowCredentials = Object.entries(results)
			.filter(([_, result]) => result.credentialSource === 'flow-specific')
			.map(([flowKey, _]) => flowKey);
		
		console.log(`🔒 Flows with flow-specific credentials:`, flowsWithFlowCredentials);
		
		console.groupEnd();
		
		return results;
	}
	
	/**
	 * Get all flow storage keys
	 */
	getAllFlowStorageKeys(): string[] {
		return Object.keys(localStorage).filter(key => 
			key.startsWith(this.FLOW_DATA_PREFIX)
		);
	}
	
	/**
	 * Clear all flow-specific data (for testing)
	 */
	clearAllFlowData(): void {
		const flowKeys = this.getAllFlowStorageKeys();
		flowKeys.forEach(key => {
			localStorage.removeItem(key);
			console.log(`🗑️ Cleared: ${key}`);
		});
		console.log(`✅ Cleared ${flowKeys.length} flow-specific data stores`);
	}
	
	// ============================================
	// CREDENTIAL ISOLATION METHODS
	// ============================================
	
	/**
	 * Save credentials with COMPLETE isolation (no sharing, even if same values)
	 * Each flow gets its own isolated credential store
	 */
	saveFlowCredentialsIsolated(
		flowKey: string,
		credentials: FlowSpecificCredentials,
		options: { 
			showToast?: boolean;
			backupToEnv?: boolean;
		} = { showToast: true, backupToEnv: false }
	): boolean {
		try {
			console.group(`🔒 [CREDENTIAL ISOLATION] Saving isolated credentials for flow: ${flowKey}`);
			console.log(`📋 Flow Key: ${flowKey}`);
			console.log(`📋 Credentials:`, credentials);
			console.log(`📋 Backup to .env: ${options.backupToEnv}`);
			
			// Save to flow-specific storage (ALWAYS isolated)
			const success = this.saveFlowData(flowKey, {
				credentials: {
					...credentials,
					lastUpdated: Date.now(),
				}
			}, { showToast: false });
			
			// Optional .env backup
			if (options.backupToEnv && success) {
				this.backupCredentialsToEnv(flowKey, credentials);
			}
			
			if (options.showToast && success) {
				showGlobalSuccess(`Credentials saved for ${flowKey} (isolated)`);
			} else if (!success && options.showToast) {
				showGlobalError(`Failed to save credentials for ${flowKey}`);
			}
			
			console.log(`📋 Save Success: ${success}`);
			console.groupEnd();
			
			return success;
		} catch (error) {
			console.error(`❌ Failed to save isolated credentials for ${flowKey}:`, error);
			if (options.showToast) {
				showGlobalError(`Failed to save credentials for ${flowKey}`);
			}
			return false;
		}
	}
	
	/**
	 * Load credentials with COMPLETE isolation (no shared fallback)
	 * Each flow only gets its own credentials
	 */
	loadFlowCredentialsIsolated(flowKey: string): FlowSpecificCredentials | null {
		try {
			console.group(`🔒 [CREDENTIAL ISOLATION] Loading isolated credentials for flow: ${flowKey}`);
			console.log(`📋 Flow Key: ${flowKey}`);
			
			const flowData = this.loadFlowData(flowKey);
			const credentials = flowData?.credentials || null;
			
			if (credentials) {
				console.log(`✅ Found isolated credentials for ${flowKey}`);
			} else {
				console.log(`📋 No isolated credentials found for ${flowKey}`);
			}
			
			console.log(`📋 Credentials:`, credentials);
			console.groupEnd();
			
			return credentials;
		} catch (error) {
			console.error(`❌ Failed to load isolated credentials for ${flowKey}:`, error);
			return null;
		}
	}
	
	/**
	 * Backup credentials to .env format (for development/testing)
	 */
	private backupCredentialsToEnv(flowKey: string, credentials: FlowSpecificCredentials): void {
		try {
			console.group(`💾 [ENV BACKUP] Backing up credentials for flow: ${flowKey}`);
			
			const envContent = this.generateEnvContent(flowKey, credentials);
			
			// Log .env content to console instead of auto-downloading
			// Users can manually copy this if needed
			console.log(`📋 .env backup content for ${flowKey}:\n\n${envContent}\n`);
			
			// NOTE: Auto-download disabled to prevent unwanted file downloads on page load
			// If you want to download, uncomment the code below:
			/*
			const blob = new Blob([envContent], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `.env.${flowKey}.backup`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			*/
			
			console.log(`✅ Credentials backed up to console for ${flowKey}`);
			console.groupEnd();
			
		} catch (error) {
			console.error(`❌ Failed to backup credentials to .env for ${flowKey}:`, error);
		}
	}
	
	/**
	 * Generate .env content for credentials backup
	 */
	private generateEnvContent(flowKey: string, credentials: FlowSpecificCredentials): string {
		const timestamp = new Date().toISOString();
		const envKey = flowKey.toUpperCase().replace(/-/g, '_');
		
		return `# OAuth Playground Credentials Backup
# Flow: ${flowKey}
# Generated: ${timestamp}
# 
# IMPORTANT: This file contains sensitive credentials!
# Keep this file secure and never commit it to version control.

# Flow-specific credentials for ${flowKey}
${envKey}_CLIENT_ID=${credentials.clientId}
${envKey}_CLIENT_SECRET=${credentials.clientSecret}
${envKey}_REDIRECT_URI=${credentials.redirectUri}
${envKey}_SCOPES=${credentials.scopes.join(' ')}

# Additional flow-specific fields
${envKey}_LOGOUT_URL=${credentials.logoutUrl || ''}
${envKey}_LOGIN_HINT=${credentials.loginHint || ''}
${envKey}_TOKEN_ENDPOINT_AUTH_METHOD=${credentials.tokenEndpointAuthMethod || 'client_secret_basic'}

# Additional parameters
${Object.entries(credentials.additionalParams || {}).map(([key, value]) => 
	`${envKey}_${key.toUpperCase()}=${value}`
).join('\n')}

# End of backup for ${flowKey}
`;
	}
	
	/**
	 * Restore credentials from .env content
	 */
	restoreCredentialsFromEnv(flowKey: string, envContent: string): boolean {
		try {
			console.group(`🔄 [ENV RESTORE] Restoring credentials for flow: ${flowKey}`);
			
			const credentials = this.parseEnvContent(flowKey, envContent);
			
			if (credentials) {
				const success = this.saveFlowCredentialsIsolated(flowKey, credentials, {
					showToast: true,
					backupToEnv: false
				});
				
				console.log(`📋 Restore Success: ${success}`);
				console.groupEnd();
				
				return success;
			} else {
				console.error(`❌ Failed to parse .env content for ${flowKey}`);
				console.groupEnd();
				return false;
			}
		} catch (error) {
			console.error(`❌ Failed to restore credentials from .env for ${flowKey}:`, error);
			console.groupEnd();
			return false;
		}
	}
	
	/**
	 * Parse .env content to extract credentials
	 */
	private parseEnvContent(flowKey: string, envContent: string): FlowSpecificCredentials | null {
		try {
			const envKey = flowKey.toUpperCase().replace(/-/g, '_');
			const lines = envContent.split('\n');
			const credentials: Partial<FlowSpecificCredentials> = {};
			
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
				
				const [key, value] = trimmed.split('=', 2);
				if (!key || !value) continue;
				
				const cleanKey = key.replace(`${envKey}_`, '').toLowerCase();
				const cleanValue = value.trim();
				
				switch (cleanKey) {
					case 'client_id':
						credentials.clientId = cleanValue;
						break;
					case 'client_secret':
						credentials.clientSecret = cleanValue;
						break;
					case 'redirect_uri':
						credentials.redirectUri = cleanValue;
						break;
					case 'scopes':
						credentials.scopes = cleanValue.split(' ').filter(s => s.length > 0);
						break;
					case 'logout_url':
						credentials.logoutUrl = cleanValue;
						break;
					case 'login_hint':
						credentials.loginHint = cleanValue;
						break;
					case 'token_endpoint_auth_method':
						credentials.tokenEndpointAuthMethod = cleanValue;
						break;
					default:
						// Additional parameters
						if (!credentials.additionalParams) {
							credentials.additionalParams = {};
						}
						credentials.additionalParams[cleanKey] = cleanValue;
						break;
				}
			}
			
			// Validate required fields
			if (!credentials.clientId || !credentials.clientSecret || !credentials.redirectUri) {
				console.error(`❌ Missing required credential fields`);
				return null;
			}
			
			return {
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes || [],
				logoutUrl: credentials.logoutUrl,
				loginHint: credentials.loginHint,
				tokenEndpointAuthMethod: credentials.tokenEndpointAuthMethod,
				additionalParams: credentials.additionalParams,
				lastUpdated: Date.now(),
			};
		} catch (error) {
			console.error(`❌ Failed to parse .env content:`, error);
			return null;
		}
	}
	
	/**
	 * Test credential isolation between flows
	 */
	testCredentialIsolation(flow1Key: string, flow2Key: string): boolean {
		console.group(`🧪 [ISOLATION TEST] Testing credential isolation between ${flow1Key} and ${flow2Key}`);
		
		// Load credentials for both flows
		const flow1Creds = this.loadFlowCredentialsIsolated(flow1Key);
		const flow2Creds = this.loadFlowCredentialsIsolated(flow2Key);
		
		// Check if they're isolated
		const isIsolated = !flow1Creds || !flow2Creds || 
			flow1Creds.clientId !== flow2Creds.clientId ||
			flow1Creds.clientSecret !== flow2Creds.clientSecret;
		
		console.log(`📋 Flow 1 (${flow1Key}) credentials:`, flow1Creds);
		console.log(`📋 Flow 2 (${flow2Key}) credentials:`, flow2Creds);
		console.log(`📋 Isolated: ${isIsolated}`);
		
		if (!isIsolated) {
			console.warn(`🚨 CREDENTIAL BLEEDING DETECTED! Flows are sharing credentials`);
		} else {
			console.log(`✅ Credentials are properly isolated`);
		}
		
		console.groupEnd();
		
		return isIsolated;
	}
}

// Export singleton instance
export const comprehensiveFlowDataService = new ComprehensiveFlowDataService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
	(window as any).ComprehensiveFlowDataService = comprehensiveFlowDataService;
	console.log(`🔍 ComprehensiveFlowDataService available globally`);
	console.log(`🔍 Available commands:`);
	console.log(`  - ComprehensiveFlowDataService.auditAllFlowData()`);
	console.log(`  - ComprehensiveFlowDataService.loadFlowDataComprehensive({flowKey: "flow-key"})`);
	console.log(`  - ComprehensiveFlowDataService.saveFlowDataComprehensive("flow-key", data)`);
	console.log(`  - ComprehensiveFlowDataService.saveFlowCredentialsIsolated("flow-key", credentials, {backupToEnv: true})`);
	console.log(`  - ComprehensiveFlowDataService.loadFlowCredentialsIsolated("flow-key")`);
	console.log(`  - ComprehensiveFlowDataService.testCredentialIsolation("flow1", "flow2")`);
	console.log(`  - ComprehensiveFlowDataService.clearAllFlowData()`);
	console.log(`  - ComprehensiveFlowDataService.clearAllSharedData()`);
}

export default comprehensiveFlowDataService;
