// src/services/cibaFlowSharedService.ts
// V7.0.0 CIBA Flow Shared Service - Centralized service management for CIBA flows

import { v4ToastManager } from '../utils/v4ToastMessages';

/**
 * CIBA Flow Shared Service
 * Provides centralized service management for CIBA flows
 */
export class CibaFlowSharedService {
	/**
	 * Toast Notification Manager
	 * Provides consistent toast messages across CIBA flows
	 */
	static Toast = {
		/**
		 * Show success toast for CIBA request initiation
		 */
		showRequestInitiated(): void {
			v4ToastManager.showSuccess('CIBA authentication request initiated successfully');
		},

		/**
		 * Show success toast for user approval
		 */
		showUserApproved(): void {
			v4ToastManager.showSuccess('User approved CIBA authentication');
		},

		/**
		 * Show success toast for credentials save
		 */
		showCredentialsSaved(): void {
			v4ToastManager.showSuccess('Credentials saved successfully!');
		},

		/**
		 * Show success toast for flow completion
		 */
		showFlowCompleted(): void {
			v4ToastManager.showSuccess('CIBA flow completed successfully!');
		},

		/**
		 * Show error toast for CIBA request failure
		 */
		showRequestFailed(error: string): void {
			v4ToastManager.showError(`CIBA request failed: ${error}`);
		},

		/**
		 * Show error toast for credentials save failure
		 */
		showCredentialsSaveFailed(): void {
			v4ToastManager.showError('Failed to save credentials');
		},

		/**
		 * Show info toast for flow reset
		 */
		showFlowReset(): void {
			v4ToastManager.showInfo('CIBA flow reset');
		},

		/**
		 * Show error toast for request expiration
		 */
		showRequestExpired(): void {
			v4ToastManager.showError('CIBA request expired');
		},

		/**
		 * Show success toast for copy to clipboard
		 */
		showCopiedToClipboard(label: string): void {
			v4ToastManager.showSuccess(`${label} copied to clipboard`);
		}
	};

	/**
	 * Configuration Manager
	 * Handles CIBA-specific configuration validation
	 */
	static Config = {
		/**
		 * Validate CIBA configuration
		 */
		validateConfig(config: any): string[] {
			const errors: string[] = [];
			
			if (!config.environmentId?.trim()) {
				errors.push('Environment ID is required');
			}
			
			if (!config.clientId?.trim()) {
				errors.push('Client ID is required');
			}
			
			if (!config.scope?.trim()) {
				errors.push('Scope is required');
			}
			
			if (!config.loginHint?.trim()) {
				errors.push('Login hint is required');
			}
			
			if (!config.authMethod) {
				errors.push('Authentication method is required');
			}
			
			// CIBA-specific validation
			if (config.scope && !config.scope.includes('openid')) {
				errors.push('Scope must include "openid" for OIDC CIBA flow');
			}
			
			if (config.bindingMessage && config.bindingMessage.length > 255) {
				errors.push('Binding message must be 255 characters or less');
			}
			
			return errors;
		}
	};

	/**
	 * Flow State Manager
	 * Handles CIBA flow state transitions
	 */
	static FlowState = {
		/**
		 * Get flow stage display name
		 */
		getStageDisplayName(stage: string): string {
			switch (stage) {
				case 'idle':
					return 'Ready to Start';
				case 'initiating':
					return 'Initiating Request';
				case 'awaiting-approval':
					return 'Awaiting User Approval';
				case 'polling':
					return 'Polling for Approval';
				case 'completed':
					return 'Authentication Complete';
				case 'failed':
					return 'Authentication Failed';
				case 'expired':
					return 'Request Expired';
				default:
					return 'Unknown Stage';
			}
		},

		/**
		 * Get flow stage status color
		 */
		getStageStatusColor(stage: string): string {
			switch (stage) {
				case 'idle':
					return '#6b7280';
				case 'initiating':
					return '#3b82f6';
				case 'awaiting-approval':
					return '#f59e0b';
				case 'polling':
					return '#8b5cf6';
				case 'completed':
					return '#10b981';
				case 'failed':
					return '#ef4444';
				case 'expired':
					return '#f97316';
				default:
					return '#6b7280';
			}
		}
	};
}

export default CibaFlowSharedService;
