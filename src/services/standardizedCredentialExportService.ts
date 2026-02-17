// src/services/standardizedCredentialExportService.ts
// Standardized credential export/import service for all Production apps

import { exportWorkerTokenCredentials } from './credentialExportImportService';

// Re-export the standardized interfaces
export type {
	AuthzCredentials,
	WorkerTokenCredentials,
	ExportedCredentials,
} from './credentialExportImportService';

// Standardized export format for all Production apps
export interface StandardizedCredentialExport {
	version: '1.0.0';
	exportDate: string;
	appName: string;
	appType: 'oauth' | 'mfa' | 'worker-token' | 'protect-portal' | 'token-monitoring' | 'api-status';
	credentials: WorkerTokenCredentials | AuthzCredentials | Record<string, unknown>;
	metadata?: {
		flowType?: string;
		specVersion?: string;
		environment?: string;
		region?: string;
		additionalData?: Record<string, unknown>;
	};
}

/**
 * Export credentials in the standardized format
 */
export function exportStandardizedCredentials(
	appName: string,
	appType: StandardizedCredentialExport['appType'],
	credentials: Record<string, unknown>,
	metadata?: StandardizedCredentialExport['metadata']
): void {
	try {
		// For worker tokens, use the existing export function
		if (appType === 'worker-token') {
			exportWorkerTokenCredentials(credentials);
			return;
		}

		// For other app types, create standardized export
		const exported: StandardizedCredentialExport = {
			version: '1.0.0',
			exportDate: new Date().toISOString(),
			appName,
			appType,
			credentials,
			metadata,
		};

		const json = JSON.stringify(exported, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `pingone-${appName.toLowerCase().replace(/\s+/g, '-')}-credentials-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('[StandardizedCredentialExport] Error exporting credentials:', error);
		throw new Error('Failed to export credentials');
	}
}

/**
 * Import credentials from a file (supports both old and new formats)
 */
export async function importStandardizedCredentials(
	file: File
): Promise<StandardizedCredentialExport> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const data = JSON.parse(content);

				// Check if it's the old format (ExportedCredentials)
				if (data.version && (data.authz || data.workerToken)) {
					// Convert old format to new format
					const converted: StandardizedCredentialExport = {
						version: '1.0.0',
						exportDate: data.exportDate,
						appName: data.workerToken ? 'Worker Token' : 'OAuth',
						appType: data.workerToken ? 'worker-token' : 'oauth',
						credentials: data.workerToken || data.authz,
						metadata: {
							flowType: data.authz ? 'authorization_code' : undefined,
						},
					};
					resolve(converted);
				}
				// Check if it's already the new format
				else if (data.version && data.appType && data.credentials) {
					resolve(data as StandardizedCredentialExport);
				} else {
					reject(new Error('Invalid credential file format'));
				}
			} catch (error) {
				console.error('[StandardizedCredentialExport] Error parsing file:', error);
				reject(new Error('Failed to parse credential file'));
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsText(file);
	});
}

/**
 * Helper function to create file input for import
 */
export function createCredentialImport(
	onImport: (credentials: StandardizedCredentialExport) => void,
	onError?: (error: Error) => void
): void {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';

	input.onchange = async (e) => {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		try {
			const credentials = await importStandardizedCredentials(file);
			onImport(credentials);
		} catch (error) {
			console.error('[StandardizedCredentialExport] Import failed:', error);
			if (onError) {
				onError(error as Error);
			}
		}
	};

	input.click();
}
