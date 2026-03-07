// src/components/StandardizedCredentialExportImport.tsx
// Standardized credential export/import component for all Production apps

import { FiDownload, FiUpload } from '@icons';
import React from 'react';
import styled from 'styled-components';
import {
	exportStandardizedCredentials,
	importStandardizedCredentials,
	type StandardizedCredentialExport,
} from '@/services/standardizedCredentialExportService';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { logger } from '../utils/logger';

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
	background: V9_COLORS.PRIMARY.GREEN;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;

	&:hover {
		background: V9_COLORS.PRIMARY.GREEN_DARK;
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
	background: V9_COLORS.PRIMARY.BLUE;
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	transition: all 0.2s;

	&:hover {
		background: V9_COLORS.PRIMARY.BLUE_DARK;
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
export const StandardizedCredentialExportImport: React.FC<
	StandardizedCredentialExportImportProps
> = ({
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
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'No credentials to export',
				dismissible: true,
			});
			return;
		}

		try {
			exportStandardizedCredentials(appName, appType, credentials, metadata);
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Credentials exported successfully',
				duration: 3000,
			});
			onExport?.();
		} catch (error) {
			logger.error(
				'StandardizedCredentialExportImport',
				'[StandardizedCredentialExportImport] Export failed:',
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Failed to export credentials',
				dismissible: true,
			});
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
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message: `Invalid credential type. Expected ${appType}, got ${importedCredentials.appType}`,
						dismissible: true,
					});
					return;
				}
			}

			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Credentials imported successfully',
				duration: 3000,
			});
			onImport?.(importedCredentials);
		} catch (error) {
			logger.error(
				'StandardizedCredentialExportImport',
				'[StandardizedCredentialExportImport] Import failed:',
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: `Failed to import credentials: ${(error as Error).message}`,
				dismissible: true,
			});
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
	const exportCredentials = (
		credentials: Record<string, unknown>,
		metadata?: StandardizedCredentialExport['metadata']
	) => {
		exportStandardizedCredentials(appName, appType, credentials, metadata);
	};

	const importCredentials = (file: File): Promise<StandardizedCredentialExport> => {
		return importStandardizedCredentials(file);
	};

	return {
		exportCredentials,
		importCredentials,
		ExportImportComponent: (
			props: Omit<StandardizedCredentialExportImportProps, 'appName' | 'appType'>
		) => <StandardizedCredentialExportImport appName={appName} appType={appType} {...props} />,
	};
};
