// src/services/configurationSummaryService.tsx
import React, { useCallback, useState } from 'react';
import { FiCheck, FiChevronDown, FiCopy, FiDownload, FiSave, FiUpload, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { FlowLayoutService } from './flowLayoutService';

// ============================================================================
// TYPES
// ============================================================================

export interface ConfigSummary {
	environmentId: string;
	clientId: string;
	clientSecret?: string;
	redirectUri: string;
	scope: string;
	responseType: string;
	responseMode?: string;
	nonce?: string;
	state?: string;
	loginHint?: string;
	prompt?: string;
	maxAge?: string;
	acrValues?: string;
}

export interface ConfigurationSummaryCardProps {
	config: ConfigSummary;
	onSave?: () => Promise<void>;
	onExport?: (config: ConfigSummary) => Promise<void>;
	onImport?: (config: ConfigSummary) => Promise<void>;
	flowType?: string;
	showAdvancedFields?: boolean;
	className?: string;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const SummaryContainer = styled.div`
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	margin: 0.5rem 0;
`;

// Use existing collapsible components from FlowLayoutService
const CollapsibleSection = FlowLayoutService.getCollapsibleSectionStyles();
const CollapsibleHeaderButton = FlowLayoutService.getCollapsibleHeaderButtonStyles();
const CollapsibleContent = FlowLayoutService.getCollapsibleContentStyles();
const CollapsibleToggleIcon = FlowLayoutService.getCollapsibleToggleIconStyles();

const SummaryGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	gap: 1rem;
	padding: 1.5rem;
`;

const SummaryField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
`;

const FieldLabel = styled.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0;
`;

const FieldValue = styled.div`
	position: relative;
	width: 100%;
	padding: 0.75rem 0.875rem;
	padding-right: 2.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background: #ffffff;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
	color: #1f2937;
	word-break: break-all;
	line-height: 1.5;
	transition: all 0.2s ease;

	&:hover {
		border-color: #9ca3af;
		background: #f9fafb;
	}
`;

const CopyButton = styled.button`
	position: absolute;
	top: 50%;
	right: 0.5rem;
	transform: translateY(-50%);
	padding: 0.375rem;
	background: #f3f4f6;
	border: 1px solid #d1d5db;
	cursor: pointer;
	color: #6b7280;
	border-radius: 0.375rem;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: #e5e7eb;
		color: #374151;
		border-color: #9ca3af;
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.75rem;
	padding: 0 1.5rem 1.5rem 1.5rem;
	justify-content: flex-end;
	border-top: 1px solid #e5e7eb;
	padding-top: 1rem;
	margin-top: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 0.625rem 1.125rem;
	font-size: 0.875rem;
	font-weight: 500;
	border-radius: 0.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

	background: ${({ variant }) => (variant === 'primary' ? '#3b82f6' : '#ffffff')};
	color: ${({ variant }) => (variant === 'primary' ? '#ffffff' : '#374151')};
	border: ${({ variant }) => (variant === 'primary' ? 'none' : '1px solid #d1d5db')};

	&:hover {
		background: ${({ variant }) => (variant === 'primary' ? '#2563eb' : '#f9fafb')};
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`;

const ImportModal = styled.div<{ isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

const ModalContent = styled.div`
	background: white;
	border-radius: 8px;
	padding: 1.5rem;
	width: 90%;
	max-width: 600px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalTitle = styled.h3`
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	color: #1e293b;
`;

const ModalTextArea = styled.textarea`
	width: 100%;
	min-height: 300px;
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
	font-size: 0.875rem;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const ModalButtons = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	margin-top: 1rem;
`;

// ============================================================================
// SERVICE
// ============================================================================

export const ConfigurationSummaryService = {
	// Generate a summary from credentials
	generateSummary: (credentials: any, flowType?: string): ConfigSummary => {
		return {
			environmentId: credentials.environmentId || '',
			clientId: credentials.clientId || '',
			clientSecret: credentials.clientSecret || '',
			redirectUri: credentials.redirectUri || '',
			scope: credentials.scope || credentials.scopes || '',
			responseType: credentials.responseType || '',
			responseMode: credentials.responseMode || '',
			nonce: credentials.nonce || '',
			state: credentials.state || '',
			loginHint: credentials.loginHint || '',
			prompt: credentials.prompt || '',
			maxAge: credentials.maxAge || '',
			acrValues: credentials.acrValues || '',
		};
	},

	// Download configuration as JSON file
	downloadConfig: (config: ConfigSummary, filename: string = 'config.json') => {
		const jsonString = JSON.stringify(config, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	},

	// Import configuration from JSON string
	importConfig: (jsonString: string): ConfigSummary => {
		return JSON.parse(jsonString);
	},

	// Copy text to clipboard
	copyToClipboard: async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess('Copied to clipboard');
		} catch (error) {
			console.error('Failed to copy:', error);
			v4ToastManager.showError('Failed to copy to clipboard');
		}
	},
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ConfigurationSummaryCard: React.FC<ConfigurationSummaryCardProps> = ({
	config,
	onSave,
	onExport,
	onImport,
	flowType,
	showAdvancedFields = false,
	className,
}) => {
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [importText, setImportText] = useState('');

	const handleCopy = useCallback(async (text: string) => {
		await ConfigurationSummaryService.copyToClipboard(text);
	}, []);

	const handleSave = useCallback(async () => {
		if (onSave) {
			setIsLoading(true);
			try {
				await onSave();
			} catch (error) {
				console.error('Save failed:', error);
				v4ToastManager.showError('Save failed');
			} finally {
				setIsLoading(false);
			}
		}
	}, [onSave]);

	const handleExport = useCallback(async () => {
		setIsLoading(true);
		try {
			ConfigurationSummaryService.downloadConfig(config, `${flowType || 'config'}.json`);
			if (onExport) {
				await onExport(config);
			}
		} catch (error) {
			console.error('Export failed:', error);
			v4ToastManager.showError('Export failed');
		} finally {
			setIsLoading(false);
		}
	}, [config, onExport, flowType]);

	const handleImport = useCallback(async () => {
		if (!importText.trim()) {
			v4ToastManager.showError('Please paste configuration JSON');
			return;
		}

		try {
			const importedConfig = ConfigurationSummaryService.importConfig(importText);
			if (onImport) {
				setIsLoading(true);
				try {
					await onImport(importedConfig);
					setShowImportModal(false);
					setImportText('');
					v4ToastManager.showSuccess('Configuration imported successfully');
				} catch (error) {
					console.error('Import failed:', error);
					v4ToastManager.showError('Import failed');
				} finally {
					setIsLoading(false);
				}
			}
		} catch (error) {
			console.error('Invalid configuration:', error);
			v4ToastManager.showError('Invalid configuration JSON');
		}
	}, [importText, onImport]);

	const basicFields = [
		{ label: 'Environment ID', value: config.environmentId },
		{ label: 'Client ID', value: config.clientId },
		{ label: 'Redirect URI', value: config.redirectUri },
		{ label: 'Scope', value: config.scope },
		{ label: 'Response Type', value: config.responseType },
	];

	const advancedFields = [
		{ label: 'Response Mode', value: config.responseMode },
		{ label: 'Nonce', value: config.nonce },
		{ label: 'State', value: config.state },
	];

	const allFields = showAdvanced ? [...basicFields, ...advancedFields] : basicFields;

	return (
		<>
			<SummaryContainer className={className}>
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => setShowAdvanced(!showAdvanced)}
						aria-expanded={showAdvanced}
					>
						<FiCheck size={14} />
						Configuration Summary
						<CollapsibleToggleIcon $collapsed={!showAdvanced}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>

					{showAdvanced && (
						<CollapsibleContent>
							<SummaryGrid>
								{allFields.map((field, index) => (
									<SummaryField key={index}>
										<FieldLabel>{field.label}:</FieldLabel>
										<FieldValue title={field.value || 'Not set'}>
											{field.value || 'Not set'}
											<CopyButton
												onClick={() => handleCopy(field.value || '')}
												title="Copy to clipboard"
											>
												<FiCopy size={12} />
											</CopyButton>
										</FieldValue>
									</SummaryField>
								))}
							</SummaryGrid>

							<ActionButtons>
								<ActionButton variant="secondary" onClick={handleExport} disabled={isLoading}>
									<FiDownload size={14} />
									Export
								</ActionButton>

								<ActionButton variant="primary" onClick={handleSave} disabled={isLoading}>
									<FiSave size={14} />
									Save
								</ActionButton>

								<ActionButton
									variant="secondary"
									onClick={() => {
										const input = document.createElement('input');
										input.type = 'file';
										input.accept = '.json';
										input.onchange = (e) => {
											const file = (e.target as HTMLInputElement).files?.[0];
											if (file) {
												const reader = new FileReader();
												reader.onload = (e) => {
													try {
														const jsonString = e.target?.result as string;
														const importedConfig =
															ConfigurationSummaryService.importConfig(jsonString);
														if (onImport) {
															onImport(importedConfig);
															v4ToastManager.showSuccess('Configuration imported successfully');
														}
													} catch (error) {
														console.error('Import failed:', error);
														v4ToastManager.showError('Invalid JSON file');
													}
												};
												reader.readAsText(file);
											}
										};
										input.click();
									}}
									disabled={isLoading}
								>
									<FiUpload size={14} />
									Import
								</ActionButton>
							</ActionButtons>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			</SummaryContainer>

			<ImportModal isOpen={showImportModal}>
				<ModalContent>
					<ModalTitle>Import Configuration</ModalTitle>
					<ModalTextArea
						value={importText}
						onChange={(e) => setImportText(e.target.value)}
						placeholder="Paste your configuration JSON here..."
					/>
					<ModalButtons>
						<ActionButton variant="secondary" onClick={() => setShowImportModal(false)}>
							<FiX size={14} />
							Cancel
						</ActionButton>
						<ActionButton variant="primary" onClick={handleImport} disabled={isLoading}>
							<FiUpload size={14} />
							Import
						</ActionButton>
					</ModalButtons>
				</ModalContent>
			</ImportModal>
		</>
	);
};

export default ConfigurationSummaryService;
