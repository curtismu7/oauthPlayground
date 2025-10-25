// src/utils/updateV7FlowsCredentialBackup.ts
// Utility to help update all V7 flows with credential backup functionality

export const V7_FLOWS_TO_UPDATE = [
	{
		file: 'src/pages/flows/OAuthAuthorizationCodeFlowV7.tsx',
		flowKey: 'oauth-authorization-code-v7',
		description: 'OAuth Authorization Code Flow V7'
	},
	{
		file: 'src/pages/flows/OIDCHybridFlowV7.tsx',
		flowKey: 'oidc-hybrid-v7',
		description: 'OIDC Hybrid Flow V7'
	},
	{
		file: 'src/pages/flows/ClientCredentialsFlowV7_Complete.tsx',
		flowKey: 'client-credentials-v7',
		description: 'Client Credentials Flow V7'
	},
	{
		file: 'src/pages/flows/ImplicitFlowV7.tsx',
		flowKey: 'implicit-v7',
		description: 'Implicit Flow V7'
	},
	{
		file: 'src/pages/flows/DeviceAuthorizationFlowV7.tsx',
		flowKey: 'device-authorization-v7',
		description: 'Device Authorization Flow V7'
	}
];

export const CREDENTIAL_BACKUP_IMPORT = `import { useCredentialBackup } from '../../hooks/useCredentialBackup';`;

export const CREDENTIAL_BACKUP_HOOK_TEMPLATE = `
	// Use credential backup hook for automatic backup and restoration
	const { clearBackup, getBackupStats, downloadEnvFile } = useCredentialBackup({
		flowKey: 'FLOW_KEY_PLACEHOLDER',
		credentials: controller.credentials,
		setCredentials: controller.setCredentials,
		enabled: true
	});
`;

export const CREDENTIAL_BACKUP_RESET_TEMPLATE = `
		// Clear credential backup when flow is reset
		clearBackup();
`;

/**
 * Instructions for updating V7 flows with credential backup:
 * 
 * 1. Add import: import { useCredentialBackup } from '../../hooks/useCredentialBackup';
 * 
 * 2. Add the hook after credential saving useEffect:
 *    const { clearBackup, getBackupStats, downloadEnvFile } = useCredentialBackup({
 *      flowKey: 'your-flow-key',
 *      credentials: controller.credentials,
 *      setCredentials: controller.setCredentials,
 *      enabled: true
 *    });
 * 
 * 3. Add clearBackup() to the reset function:
 *    const handleReset = useCallback(() => {
 *      // ... existing reset logic ...
 *      clearBackup();
 *    }, [clearBackup]);
 * 
 * 4. Optional: Add backup management UI using CredentialBackupManager component
 */

export default {
	V7_FLOWS_TO_UPDATE,
	CREDENTIAL_BACKUP_IMPORT,
	CREDENTIAL_BACKUP_HOOK_TEMPLATE,
	CREDENTIAL_BACKUP_RESET_TEMPLATE
};
