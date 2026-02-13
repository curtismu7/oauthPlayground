// src/components/StandardizedCredentialExportImport.tsx
// Standardized credential export/import component for all Production apps

import React from 'react';
import { FiDownload, FiUpload } from 'react-icons/fi';
import styled from 'styled-components';
import { 
	exportStandardizedCredentials, 
	importStandardizedCredentials,
	type StandardizedCredentialExport 
} from '@/services/standardizedCredentialExportService';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// Styled components
const ButtonContainer = styled.div`
	display: flex;
	gap: 10px;
	margin-top: 15px;
`;

const ExportButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: #10b981;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;

	&:hover {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`;

const ImportButton = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;

	&:hover {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`;

// Props interface
interface StandardizedCredentialExportImportProps {
	// App identification
	appName: string;
	appType: StandardizedCredentialExport['appType'];
	
	// Current credentials
	credentials?: Record<string, unknown>;
	metadata?: StandardizedCredentialExport['metadata'];
	
	// Callbacks
	onExport?: () => void;
	onImport?: (credentials: StandardizedCredentialExport) => void;
	onError?: (error: Error) => void;
	
	// UI options
	disabled?: boolean;
	exportButtonText?: string;
	importButtonText?: string;
	showExportOnly?: boolean;
	showImportOnly?: boolean;
}

/**
 * Standardized Credential Export/Import Component
 * 
 * This component provides a consistent export/import interface for all Production apps.
 * It uses the standardized credential format to ensure compatibility across apps.
 */
export const StandardizedCredentialExportImport: React.FC<StandardizedCredentialExportImportProps> = ({
	appName,
	appType,
	credentials,
	metadata,
	onExport,
	onImport,
	onError,
	disabled = false,
	exportButtonText = 'Export Credentials',
	importButtonText = 'Import Credentials',
	showExportOnly = false,
	showImportOnly = false,
}) => {
	// Handle export
	const handleExport = () => {
		if (!credentials) {
			toastV8.error('No credentials to export');
			return;
		}

		try {
			exportStandardizedCredentials(appName, appType, credentials, metadata);
			toastV8.success('Credentials exported successfully');
			onExport?.();
		} catch (error) {
			console.error('[StandardizedCredentialExportImport] Export failed:', error);
			toastV8.error('Failed to export credentials');
			onError?.(error as Error);
		}
	};

	// Handle import
	const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const importedCredentials = await importStandardizedCredentials(file);
			
			// Validate that the imported credentials match the app type
			if (importedCredentials.appType !== appType) {
				// Allow OAuth apps to import worker tokens and vice versa for flexibility
				if (appType === 'oauth' && importedCredentials.appType === 'worker-token') {
					// Allow this cross-import
				} else if (appType === 'worker-token' && importedCredentials.appType === 'oauth') {
					// Allow this cross-import
				} else {
					toastV8.error(`Invalid credential type. Expected ${appType}, got ${importedCredentials.appType}`);
					return;
				}
			}

			toastV8.success('Credentials imported successfully');
			onImport?.(importedCredentials);
		} catch (error) {
			console.error('[StandardizedCredentialExportImport] Import failed:', error);
			toastV8.error(`Failed to import credentials: ${(error as Error).message}`);
			onError?.(error as Error);
		}

		// Reset file input
		const fileInput = event.target;
		setTimeout(() => {
			if (fileInput) {
				fileInput.value = '';
			}
		}, 0);
	};

	// Store event target to avoid race condition

	// Render export button only
	if (showExportOnly) {
		return (
			<ExportButton
				onClick={handleExport}
				disabled={disabled || !credentials}
				title={`Export ${appName} credentials to a file`}
			>
				<FiDownload size={16} />
				{exportButtonText}
			</ExportButton>
		);
	}

	// Render import button only
	if (showImportOnly) {
		return (
			<ImportButton
				onClick={() => {
					const input = document.createElement('input');
					input.type = 'file';
					input.accept = '.json';
					input.onchange = (e) => {
						const file = (e.target as HTMLInputElement).files?.[0];
						if (file) {
							handleImport({ target: e.target } as React.ChangeEvent<HTMLInputElement>);
						}
					};
					input.click();
				}}
				disabled={disabled}
				title={`Import ${appName} credentials from a file`}
			>
				<FiUpload size={16} />
				{importButtonText}
			</ImportButton>
		);
	}

	// Render both buttons
	return (
		<ButtonContainer>
			<ExportButton
				onClick={handleExport}
				disabled={disabled || !credentials}
				title={`Export ${appName} credentials to a file`}
			>
				<FiDownload size={16} />
				{exportButtonText}
			</ExportButton>

			<ImportButton
				onClick={() => {
					const input = document.createElement('input');
					input.type = 'file';
					input.accept = '.json';
					input.onchange = (e) => {
						const file = (e.target as HTMLInputElement).files?.[0];
						if (file) {
							handleImport({ target: e.target } as React.ChangeEvent<HTMLInputElement>);
						}
					};
					input.click();
				}}
				disabled={disabled}
				title={`Import ${appName} credentials from a file`}
			>
				<FiUpload size={16} />
				{importButtonText}
			</ImportButton>
		</ButtonContainer>
	);
};

// Export a hook for easy integration
export const useStandardizedCredentialExportImport = (
	appName: string,
	appType: StandardizedCredentialExport['appType']
) => {
	const exportCredentials = (credentials: Record<string, unknown>, metadata?: StandardizedCredentialExport['metadata']) => {
		exportStandardizedCredentials(appName, appType, credentials, metadata);
	};

	const importCredentials = (file: File): Promise<StandardizedCredentialExport> => {
		return importStandardizedCredentials(file);
	};

	return {
		exportCredentials,
		importCredentials,
		ExportImportComponent: (props: Omit<StandardizedCredentialExportImportProps, 'appName' | 'appType'>) => (
			<StandardizedCredentialExportImport
				appName={appName}
				appType={appType}
				{...props}
			/>
		)
	};
};
