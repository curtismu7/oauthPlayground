// src/hooks/useCredentialBackup.ts
// V7 Credential Backup Hook - Provides backup functionality for all V7 flows

import { useEffect } from 'react';
import { StepCredentials } from '../components/steps/CommonSteps';
import { credentialBackupService } from '../services/credentialBackupService';

interface UseCredentialBackupProps {
	flowKey: string;
	credentials: StepCredentials | null | undefined;
	setCredentials: (credentials: StepCredentials) => void;
	enabled?: boolean;
}

/**
 * Hook to handle credential backup and restoration for V7 flows
 * Automatically backs up non-sensitive credentials and restores them when needed
 */
export const useCredentialBackup = ({
	flowKey,
	credentials,
	setCredentials,
	enabled = true,
}: UseCredentialBackupProps) => {
	// Backup credentials whenever they change
	useEffect(() => {
		if (!enabled) return;

		// Only backup if we have meaningful credentials
		if (credentials && (credentials.environmentId || credentials.clientId)) {
			console.log(`🔧 [CredentialBackup] Saving backup for flow: ${flowKey}`, {
				flowKey,
				hasEnvironmentId: !!credentials.environmentId,
				hasClientId: !!credentials.clientId,
				hasRedirectUri: !!credentials.redirectUri,
				scopes: credentials.scopes?.length || 0,
			});

			credentialBackupService.saveCredentialBackup(flowKey, credentials);
		}
	}, [flowKey, credentials, enabled]);

	// Restore credentials from backup on mount if needed
	useEffect(() => {
		if (!enabled) return;

		// Check if we need to restore from backup (when storage is cleared)
		const normalizedCredentials = credentials ?? ({} as StepCredentials);
		if (!normalizedCredentials.environmentId && !normalizedCredentials.clientId) {
			const backupCredentials = credentialBackupService.restoreFromBackup(flowKey);
			if (backupCredentials.environmentId || backupCredentials.clientId) {
				console.log(
					`🔧 [CredentialBackup] Restoring credentials from backup for flow: ${flowKey}`,
					{
						flowKey,
						hasEnvironmentId: !!backupCredentials.environmentId,
						hasClientId: !!backupCredentials.clientId,
						hasRedirectUri: !!backupCredentials.redirectUri,
						scopes: backupCredentials.scopes?.length || 0,
					}
				);

				// Update credentials with restored data
				setCredentials({
					...normalizedCredentials,
					...backupCredentials,
				});
			}
		}
	}, [
		flowKey,
		enabled,
		credentials, // Update credentials with restored data
		setCredentials,
	]); // Only run when flowKey/enabled change or credentials reset

	// Clear backup when flow is reset
	const clearBackup = () => {
		if (enabled) {
			credentialBackupService.clearFlowBackup(flowKey);
			console.log(`🔧 [CredentialBackup] Cleared backup for flow: ${flowKey}`);
		}
	};

	// Get backup stats for this flow
	const getBackupStats = () => {
		return credentialBackupService.getBackupStats();
	};

	// Download .env file with all backups
	const downloadEnvFile = () => {
		credentialBackupService.downloadEnvFile();
	};

	return {
		clearBackup,
		getBackupStats,
		downloadEnvFile,
	};
};

export default useCredentialBackup;
