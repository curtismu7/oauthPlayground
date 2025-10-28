// src/services/flowCredentialIsolationService.ts
/**
 * Flow-Specific Credential Isolation Service
 * 
 * Implements per-flow-first credential storage to prevent credential bleeding
 * between different OAuth/OIDC flows.
 * 
 * Key Features:
 * - Each flow gets its own isolated storage namespace
 * - Optional shared fallback (opt-in only)
 * - Migration helper for existing data
 * - Complete isolation by default
 */

import { StepCredentials } from '../components/steps/CommonSteps';
import { showGlobalSuccess, showGlobalError } from '../hooks/useNotifications';

export interface FlowCredentialConfig {
	flowKey: string;
	defaultCredentials?: Partial<StepCredentials>;
	useSharedFallback?: boolean; // Opt-in to shared credential fallback
}

export interface FlowCredentialResult {
	credentials: StepCredentials | null;
	hasFlowSpecificCredentials: boolean;
	hasSharedCredentials: boolean;
	credentialSource: 'flow-specific' | 'shared-fallback' | 'none';
	flowSpecificData?: any;
	sharedData?: any;
}

class FlowCredentialIsolationService {
	private readonly FLOW_STORAGE_PREFIX = 'pingone_flow_credentials';
	private readonly SHARED_STORAGE_KEY = 'pingone_permanent_credentials';
	
	/**
	 * Generate isolated storage key for a specific flow
	 */
	private getFlowStorageKey(flowKey: string): string {
		return `${this.FLOW_STORAGE_PREFIX}:${flowKey}`;
	}
	
	/**
	 * Save credentials ONLY for this specific flow (no shared contamination)
	 */
	saveFlowCredentials(
		flowKey: string, 
		credentials: StepCredentials,
		options: { 
			showToast?: boolean;
			useSharedFallback?: boolean;
		} = { showToast: true, useSharedFallback: false }
	): boolean {
		try {
			console.group(`🔒 [CREDENTIAL ISOLATION] Saving credentials for flow: ${flowKey}`);
			console.log(`📋 Flow Key: ${flowKey}`);
			console.log(`📋 Credentials:`, credentials);
			console.log(`📋 Use Shared Fallback: ${options.useSharedFallback}`);
			
			// Save to flow-specific storage (ALWAYS)
			const flowStorageKey = this.getFlowStorageKey(flowKey);
			const flowData = {
				credentials,
				timestamp: Date.now(),
				flowKey,
				version: '1.0'
			};
			
			localStorage.setItem(flowStorageKey, JSON.stringify(flowData));
			console.log(`✅ Saved to flow-specific storage: ${flowStorageKey}`);
			
			// Optionally save to shared storage (OPT-IN ONLY)
			if (options.useSharedFallback) {
				console.log(`📋 Saving to shared storage (opt-in)`);
				localStorage.setItem(this.SHARED_STORAGE_KEY, JSON.stringify(credentials));
				console.log(`✅ Saved to shared storage: ${this.SHARED_STORAGE_KEY}`);
			} else {
				console.log(`🔒 NOT saving to shared storage (isolation mode)`);
			}
			
			// Verify the save
			const savedData = localStorage.getItem(flowStorageKey);
			console.log(`📋 Verification - Flow data saved:`, !!savedData);
			
			if (options.showToast) {
				showGlobalSuccess(`Credentials saved for ${flowKey} (isolated)`);
			}
			
			console.groupEnd();
			return true;
			
		} catch (error) {
			console.error(`❌ [CREDENTIAL ISOLATION] Failed to save credentials for ${flowKey}:`, error);
			if (options.showToast) {
				showGlobalError(`Failed to save credentials for ${flowKey}`);
			}
			return false;
		}
	}
	
	/**
	 * Load credentials ONLY for this specific flow (no shared fallback by default)
	 */
	loadFlowCredentials(config: FlowCredentialConfig): FlowCredentialResult {
		const { flowKey, defaultCredentials = {}, useSharedFallback = false } = config;
		
		console.group(`🔒 [CREDENTIAL ISOLATION] Loading credentials for flow: ${flowKey}`);
		console.log(`📋 Flow Key: ${flowKey}`);
		console.log(`📋 Use Shared Fallback: ${useSharedFallback}`);
		
		// Try flow-specific storage FIRST (PRIMARY SOURCE)
		const flowStorageKey = this.getFlowStorageKey(flowKey);
		const flowData = localStorage.getItem(flowStorageKey);
		
		let credentials: StepCredentials | null = null;
		let credentialSource: 'flow-specific' | 'shared-fallback' | 'none' = 'none';
		let hasFlowSpecificCredentials = false;
		let hasSharedCredentials = false;
		
		if (flowData) {
			try {
				const parsed = JSON.parse(flowData);
				if (parsed.credentials && (parsed.credentials.environmentId || parsed.credentials.clientId)) {
					credentials = { ...defaultCredentials, ...parsed.credentials };
					credentialSource = 'flow-specific';
					hasFlowSpecificCredentials = true;
					console.log(`✅ Using flow-specific credentials from: ${flowStorageKey}`);
				}
			} catch (error) {
				console.error(`❌ Failed to parse flow-specific data for ${flowKey}:`, error);
			}
		}
		
		// Only try shared storage if no flow-specific credentials AND opt-in enabled
		if (!hasFlowSpecificCredentials && useSharedFallback) {
			console.log(`📋 No flow-specific credentials, trying shared fallback (opt-in)`);
			const sharedData = localStorage.getItem(this.SHARED_STORAGE_KEY);
			
			if (sharedData) {
				try {
					const parsed = JSON.parse(sharedData);
					if (parsed.environmentId || parsed.clientId) {
						credentials = { ...defaultCredentials, ...parsed };
						credentialSource = 'shared-fallback';
						hasSharedCredentials = true;
						console.log(`⚠️ Using shared credentials (opt-in fallback)`);
					}
				} catch (error) {
					console.error(`❌ Failed to parse shared data:`, error);
				}
			}
		} else if (!hasFlowSpecificCredentials) {
			console.log(`🔒 No flow-specific credentials and shared fallback disabled (isolation mode)`);
		}
		
		console.log(`📋 Final credential source: ${credentialSource}`);
		console.log(`📋 Final credentials:`, credentials);
		console.groupEnd();
		
		return {
			credentials,
			hasFlowSpecificCredentials,
			hasSharedCredentials,
			credentialSource,
			flowSpecificData: flowData ? JSON.parse(flowData) : undefined,
			sharedData: useSharedFallback ? (localStorage.getItem(this.SHARED_STORAGE_KEY) ? JSON.parse(localStorage.getItem(this.SHARED_STORAGE_KEY)!) : undefined) : undefined
		};
	}
	
	/**
	 * Clear credentials ONLY for this specific flow
	 */
	clearFlowCredentials(flowKey: string): boolean {
		try {
			const flowStorageKey = this.getFlowStorageKey(flowKey);
			localStorage.removeItem(flowStorageKey);
			console.log(`🗑️ [CREDENTIAL ISOLATION] Cleared credentials for flow: ${flowKey}`);
			return true;
		} catch (error) {
			console.error(`❌ [CREDENTIAL ISOLATION] Failed to clear credentials for ${flowKey}:`, error);
			return false;
		}
	}
	
	/**
	 * Migrate existing credentials from shared storage to flow-specific storage
	 */
	migrateSharedToFlowSpecific(flowKey: string): boolean {
		try {
			console.group(`🔄 [CREDENTIAL MIGRATION] Migrating shared credentials to flow-specific for: ${flowKey}`);
			
			const sharedData = localStorage.getItem(this.SHARED_STORAGE_KEY);
			if (!sharedData) {
				console.log(`📋 No shared credentials to migrate`);
				console.groupEnd();
				return false;
			}
			
			const parsed = JSON.parse(sharedData);
			if (!parsed.environmentId && !parsed.clientId) {
				console.log(`📋 Shared credentials are empty, nothing to migrate`);
				console.groupEnd();
				return false;
			}
			
			// Check if flow-specific credentials already exist
			const flowStorageKey = this.getFlowStorageKey(flowKey);
			const existingFlowData = localStorage.getItem(flowStorageKey);
			
			if (existingFlowData) {
				console.log(`📋 Flow-specific credentials already exist, skipping migration`);
				console.groupEnd();
				return false;
			}
			
			// Migrate shared credentials to flow-specific storage
			const flowData = {
				credentials: parsed,
				timestamp: Date.now(),
				flowKey,
				version: '1.0',
				migrated: true,
				migrationTimestamp: Date.now()
			};
			
			localStorage.setItem(flowStorageKey, JSON.stringify(flowData));
			console.log(`✅ Migrated shared credentials to flow-specific storage: ${flowStorageKey}`);
			console.groupEnd();
			
			return true;
			
		} catch (error) {
			console.error(`❌ [CREDENTIAL MIGRATION] Failed to migrate credentials for ${flowKey}:`, error);
			return false;
		}
	}
	
	/**
	 * Audit all flows for credential isolation status
	 */
	auditAllFlows(): Record<string, FlowCredentialResult> {
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
		
		console.group(`🔍 [CREDENTIAL ISOLATION AUDIT] Auditing all V7 flows`);
		
		const results: Record<string, FlowCredentialResult> = {};
		
		v7Flows.forEach(flowKey => {
			results[flowKey] = this.loadFlowCredentials({ flowKey });
		});
		
		// Detect flows using shared fallback (potential bleeding)
		const flowsUsingSharedFallback = Object.entries(results)
			.filter(([_, result]) => result.credentialSource === 'shared-fallback')
			.map(([flowKey, _]) => flowKey);
		
		if (flowsUsingSharedFallback.length > 0) {
			console.warn(`🚨 POTENTIAL CREDENTIAL BLEEDING DETECTED!`);
			console.warn(`📋 Flows using shared fallback:`, flowsUsingSharedFallback);
		} else {
			console.log(`✅ All flows are properly isolated!`);
		}
		
		console.groupEnd();
		
		return results;
	}
	
	/**
	 * Get all flow-specific storage keys
	 */
	getAllFlowStorageKeys(): string[] {
		return Object.keys(localStorage).filter(key => 
			key.startsWith(this.FLOW_STORAGE_PREFIX)
		);
	}
	
	/**
	 * Clear all flow-specific credentials (for testing)
	 */
	clearAllFlowCredentials(): void {
		const flowKeys = this.getAllFlowStorageKeys();
		flowKeys.forEach(key => {
			localStorage.removeItem(key);
			console.log(`🗑️ Cleared: ${key}`);
		});
		console.log(`✅ Cleared ${flowKeys.length} flow-specific credential stores`);
	}
}

// Export singleton instance
export const flowCredentialIsolationService = new FlowCredentialIsolationService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
	(window as any).FlowCredentialIsolationService = flowCredentialIsolationService;
	console.log(`🔒 FlowCredentialIsolationService available globally`);
	console.log(`🔒 Available commands:`);
	console.log(`  - FlowCredentialIsolationService.auditAllFlows()`);
	console.log(`  - FlowCredentialIsolationService.loadFlowCredentials({flowKey: "flow-key"})`);
	console.log(`  - FlowCredentialIsolationService.saveFlowCredentials("flow-key", credentials)`);
	console.log(`  - FlowCredentialIsolationService.migrateSharedToFlowSpecific("flow-key")`);
	console.log(`  - FlowCredentialIsolationService.clearAllFlowCredentials()`);
}

export default flowCredentialIsolationService;
