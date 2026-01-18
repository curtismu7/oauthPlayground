// src/services/credentialExportImportService.ts
// Service for exporting and importing credentials

export interface AuthzCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes?: string[];
	authEndpoint?: string;
	tokenEndpoint?: string;
	userInfoEndpoint?: string;
	clientAuthMethod?: string;
	loginHint?: string;
	region?: 'us' | 'eu' | 'ap' | 'ca';
	customDomain?: string;
}

export interface WorkerTokenCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scopes: string[];
	region: 'us' | 'eu' | 'ap' | 'ca';
	authMethod: 'client_secret_basic' | 'client_secret_post';
	customDomain?: string;
}

export interface ExportedCredentials {
	version: string;
	exportDate: string;
	authz?: AuthzCredentials;
	workerToken?: WorkerTokenCredentials;
}

/**
 * Export authorization credentials to a JSON file
 */
export function exportAuthzCredentials(credentials: AuthzCredentials): void {
	try {
		const exported: ExportedCredentials = {
			version: '1.0.0',
			exportDate: new Date().toISOString(),
			authz: credentials,
		};

		const json = JSON.stringify(exported, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `pingone-authz-credentials-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('[CredentialExportImport] Error exporting authz credentials:', error);
		throw new Error('Failed to export credentials');
	}
}

/**
 * Export worker token credentials to a JSON file
 */
export function exportWorkerTokenCredentials(credentials: WorkerTokenCredentials): void {
	try {
		const exported: ExportedCredentials = {
			version: '1.0.0',
			exportDate: new Date().toISOString(),
			workerToken: credentials,
		};

		const json = JSON.stringify(exported, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `pingone-worker-token-credentials-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('[CredentialExportImport] Error exporting worker token credentials:', error);
		throw new Error('Failed to export credentials');
	}
}

/**
 * Import credentials from a JSON file
 */
export async function importCredentials(
	file: File
): Promise<{ authz?: AuthzCredentials; workerToken?: WorkerTokenCredentials }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const text = e.target?.result as string;
				const parsed = JSON.parse(text) as ExportedCredentials;

				// Validate structure
				if (!parsed.version || (!parsed.authz && !parsed.workerToken)) {
					reject(new Error('Invalid credential file format'));
					return;
				}

				resolve({
					authz: parsed.authz,
					workerToken: parsed.workerToken,
				});
			} catch (error) {
				console.error('[CredentialExportImport] Error parsing credential file:', error);
				reject(
					new Error('Failed to parse credential file. Please ensure it is a valid JSON file.')
				);
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsText(file);
	});
}

/**
 * Create a file input element and trigger file selection
 */
export function triggerFileImport(onFileSelected: (file: File) => void, accept = '.json'): void {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = accept;
	input.style.display = 'none';

	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) {
			onFileSelected(file);
		}
	};

	document.body.appendChild(input);
	input.click();
	document.body.removeChild(input);
}
