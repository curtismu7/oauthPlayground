// src/components/ConfigurationSummaryCard.tsx
import React, { useState } from 'react';
import { FiCheckCircle, FiChevronDown } from 'react-icons/fi';
import styled from 'styled-components';
import { useUISettings } from '../contexts/UISettingsContext';
import { showGlobalError, showGlobalSuccess } from '../hooks/useNotifications';

// Styled Components
const Card = styled.div`
	background: white;
	border-radius: 8px;
	box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
	overflow: hidden;
	margin: 1rem 0;
`;

const Section = styled.div`
	border-bottom: 1px solid #e5e7eb;
	
	&:last-child {
		border-bottom: none;
	}
`;

const SectionHeader = styled.button.withConfig({
	shouldForwardProp: (prop) => prop !== '$isExpanded' && prop !== 'isExpanded',
})<{ $isExpanded: boolean; $primaryColor: string }>`
	width: 100%;
	background: ${(props) => (props.$isExpanded ? props.$primaryColor : '#f0fdf4')};
	color: ${(props) => (props.$isExpanded ? 'white' : '#166534')};
	padding: 1rem 1.5rem;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-weight: 600;
	transition: all 0.2s ease;
	
	&:hover {
		background: ${(props) => (props.$isExpanded ? props.$primaryColor : '#dcfce7')};
	}
`;

const SectionTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1rem;
`;

const ChevronIcon = styled.div<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.5rem;
	height: 1.5rem;
	transition: transform 0.2s ease;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	color: ${({ theme }) => theme.colors.gray600};
`;

const SectionContent = styled.div.withConfig({
	shouldForwardProp: (prop) => prop !== '$isExpanded' && prop !== 'isExpanded',
})<{ $isExpanded: boolean }>`
	padding: ${({ $isExpanded }) => ($isExpanded ? '1.5rem' : '0')};
	max-height: ${({ $isExpanded }) => ($isExpanded ? '1000px' : '0')};
	overflow: hidden;
	transition: all 0.3s ease;
	background: #fafafa;
`;
const StatusSection = styled.div`
	padding: 1.5rem;
	background: white;
`;

const StatusTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
	font-size: 1rem;
`;

const StatusText = styled.div`
	color: #6b7280;
	font-size: 0.9rem;
	line-height: 1.5;
	margin-bottom: 0.5rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const EmptyState = styled.div`
	text-align: center;
	padding: 2rem;
	color: #9ca3af;
	font-style: italic;
	border: 2px dashed #d1d5db;
	border-radius: 6px;
	margin: 1rem 0;
`;

interface ConfigurationSummaryCardProps {
	// biome-ignore lint/suspicious/noExplicitAny: Configuration can be various credential types
	configuration?: any;
	hasConfiguration?: boolean;
	configurationDetails?: {
		environmentId?: string;
		clientId?: string;
		redirectUri?: string;
		scopes?: string[];
		loginHint?: string;
		responseType?: string;
		grantType?: string;
	};
	onSaveConfiguration?: () => void;
	// biome-ignore lint/suspicious/noExplicitAny: Configuration can be various credential types
	onLoadConfiguration?: (config?: any) => void;
	primaryColor?: string;
	flowType?: string;
}

const ConfigurationSummaryCard: React.FC<ConfigurationSummaryCardProps> = ({
	configuration,
	hasConfiguration = false,
	configurationDetails,
	onSaveConfiguration,
	onLoadConfiguration,
	primaryColor = '#0070cc',
	flowType,
}) => {
	const { settings } = useUISettings();
	const computedPrimaryColor =
		primaryColor ||
		(settings.colorScheme === 'blue'
			? '#0070cc'
			: settings.colorScheme === 'green'
				? '#10b981'
				: settings.colorScheme === 'purple'
					? '#8b5cf6'
					: settings.colorScheme === 'orange'
						? '#f97316'
						: settings.colorScheme === 'red'
							? '#ef4444'
							: '#0070cc');
	const [isSummaryExpanded, setIsSummaryExpanded] = useState(true); // Start expanded

	const handleSaveConfiguration = () => {
		onSaveConfiguration?.();
	};

	const handleExportConfiguration = async () => {
		try {
			if (!configuration) {
				showGlobalError('No configuration to export');
				return;
			}

			console.log('🔄 [ConfigurationSummaryCard] Starting export...', configuration);

			// Create a copy of the configuration
			const configToExport = {
				...configuration,
				exportedAt: new Date().toISOString(),
				version: '1.0',
			};

			// Encrypt the client secret if it exists
			if (configToExport.clientSecret?.trim()) {
				console.log('🔐 [ConfigurationSummaryCard] Encrypting client secret...');
				configToExport.clientSecret = await encryptSecret(configToExport.clientSecret);
				configToExport.isEncrypted = true;
			}

			console.log('📝 [ConfigurationSummaryCard] Creating JSON blob...', configToExport);

			// Create JSON blob
			const jsonString = JSON.stringify(configToExport, null, 2);
			const blob = new Blob([jsonString], { type: 'application/json' });

			// Create download link
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${flowType ? `${flowType}-` : ''}oauth-config-${new Date().toISOString().split('T')[0]}.json`;
			link.style.display = 'none';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			console.log('✅ [ConfigurationSummaryCard] Export completed successfully');
			showGlobalSuccess('Configuration exported successfully!');
		} catch (error) {
			console.error('❌ [ConfigurationSummaryCard] Export failed:', error);
			showGlobalError('Failed to export configuration');
		}
	};

	const handleImportConfiguration = async () => {
		try {
			console.log('🔄 [ConfigurationSummaryCard] Starting import...');

			// Create file input element
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.json';
			input.onchange = async (event) => {
				try {
					const file = (event.target as HTMLInputElement).files?.[0];
					if (!file) return;

					console.log('📁 [ConfigurationSummaryCard] File selected:', file.name);

					const text = await file.text();
					const importedConfig = JSON.parse(text);

					console.log('📝 [ConfigurationSummaryCard] Config parsed:', importedConfig);

					// Decrypt the client secret if it's encrypted
					if (importedConfig.isEncrypted && importedConfig.clientSecret) {
						try {
							console.log('🔓 [ConfigurationSummaryCard] Decrypting client secret...');
							importedConfig.clientSecret = await decryptSecret(importedConfig.clientSecret);
							delete importedConfig.isEncrypted;
							console.log('✅ [ConfigurationSummaryCard] Client secret decrypted successfully');
						} catch (error) {
							console.error('❌ [ConfigurationSummaryCard] Failed to decrypt secret:', error);
							showGlobalError('Failed to decrypt the imported configuration');
							return;
						}
					}

					// Load the configuration
					onLoadConfiguration?.(importedConfig);
					showGlobalSuccess('Configuration imported successfully!');
				} catch (error) {
					console.error('❌ [ConfigurationSummaryCard] Import processing failed:', error);
					showGlobalError('Failed to process imported configuration');
				}
			};
			input.click();
		} catch (error) {
			console.error('❌ [ConfigurationSummaryCard] Import failed:', error);
			showGlobalError('Failed to import configuration');
		}
	};

	// Simple encryption/decryption functions
	const encryptSecret = async (secret: string): Promise<string> => {
		// Generate a random key (in production, use a more secure method)
		const key = crypto.getRandomValues(new Uint8Array(32));
		const iv = crypto.getRandomValues(new Uint8Array(12));

		// Import the key
		const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
			'encrypt',
		]);

		// Encrypt the secret
		const encrypted = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			cryptoKey,
			new TextEncoder().encode(secret)
		);

		// Combine key, iv, and encrypted data
		const combined = new Uint8Array(key.length + iv.length + encrypted.byteLength);
		combined.set(key, 0);
		combined.set(iv, key.length);
		combined.set(new Uint8Array(encrypted), key.length + iv.length);

		// Return as base64
		return btoa(String.fromCharCode(...combined));
	};

	const decryptSecret = async (encryptedSecret: string): Promise<string> => {
		// Convert from base64
		const combined = new Uint8Array(
			atob(encryptedSecret)
				.split('')
				.map((c) => c.charCodeAt(0))
		);

		// Extract key, iv, and encrypted data
		const key = combined.slice(0, 32);
		const iv = combined.slice(32, 44);
		const encrypted = combined.slice(44);

		// Import the key
		const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
			'decrypt',
		]);

		// Decrypt the secret
		const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encrypted);

		return new TextDecoder().decode(decrypted);
	};
	return (
		<Card>
			<Section>
				<SectionHeader
					$primaryColor={computedPrimaryColor}
					$isExpanded={isSummaryExpanded}
					onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
					style={{ display: isSummaryExpanded ? 'block' : 'none' }}
				>
					<SectionTitle>
						<FiCheckCircle size={18} />
						Saved Configuration Summary
					</SectionTitle>
					<ChevronIcon $collapsed={!isSummaryExpanded}>
						<FiChevronDown size={20} />
					</ChevronIcon>
				</SectionHeader>
				<SectionContent $isExpanded={isSummaryExpanded}>
					{(hasConfiguration && configurationDetails) || configuration ? (
						<div>
							<div
								style={{
									display: 'grid',
									gap: '0.75rem 1rem',
									marginBottom: '1rem',
								}}
							>
								<div style={{ fontWeight: '600', color: '#374151' }}>Environment ID:</div>
								<div
									style={{
										fontFamily: 'monospace',
										background: '#f1f5f9',
										padding: '0.25rem 0.5rem',
										borderRadius: '4px',
									}}
								>
									{configuration?.environmentId || configurationDetails?.environmentId || 'Not set'}
								</div>

								<div style={{ fontWeight: '600', color: '#374151' }}>Client ID:</div>
								<div
									style={{
										fontFamily: 'monospace',
										background: '#f1f5f9',
										padding: '0.25rem 0.5rem',
										borderRadius: '4px',
									}}
								>
									{configuration?.clientId || configurationDetails?.clientId || 'Not set'}
								</div>

								{(configuration?.redirectUri || configurationDetails?.redirectUri) && (
									<>
										<div style={{ fontWeight: '600', color: '#374151' }}>Redirect URI:</div>
										<div
											style={{
												fontFamily: 'monospace',
												background: '#f1f5f9',
												padding: '0.25rem 0.5rem',
												borderRadius: '4px',
												wordBreak: 'break-all',
											}}
										>
											{configuration?.redirectUri || configurationDetails?.redirectUri || 'Not set'}
										</div>
									</>
								)}

								{((configuration?.scopes && typeof configuration.scopes === 'string') ||
									(configurationDetails?.scopes &&
										Array.isArray(configurationDetails.scopes) &&
										configurationDetails.scopes.length > 0)) && (
									<>
										<div style={{ fontWeight: '600', color: '#374151' }}>Scopes:</div>
										<div
											style={{
												fontFamily: 'monospace',
												background: '#f1f5f9',
												padding: '0.25rem 0.5rem',
												borderRadius: '4px',
											}}
										>
											{configuration?.scopes ||
												(configurationDetails?.scopes
													? configurationDetails.scopes.join(', ')
													: '')}
										</div>
									</>
								)}

								{(configuration?.loginHint || configurationDetails?.loginHint) && (
									<>
										<div style={{ fontWeight: '600', color: '#374151' }}>Login Hint:</div>
										<div
											style={{
												fontFamily: 'monospace',
												background: '#f1f5f9',
												padding: '0.25rem 0.5rem',
												borderRadius: '4px',
											}}
										>
											{configuration?.loginHint || configurationDetails?.loginHint}
										</div>
									</>
								)}

								{(configuration?.responseType || configurationDetails?.responseType) && (
									<>
										<div style={{ fontWeight: '600', color: '#374151' }}>Response Type:</div>
										<div
											style={{
												fontFamily: 'monospace',
												background: '#f1f5f9',
												padding: '0.25rem 0.5rem',
												borderRadius: '4px',
											}}
										>
											{configuration?.responseType || configurationDetails?.responseType}
										</div>
									</>
								)}

								{(configuration?.grantType || configurationDetails?.grantType) && (
									<>
										<div style={{ fontWeight: '600', color: '#374151' }}>Grant Type:</div>
										<div
											style={{
												fontFamily: 'monospace',
												background: '#f1f5f9',
												padding: '0.25rem 0.5rem',
												borderRadius: '4px',
											}}
										>
											{configuration?.grantType || configurationDetails?.grantType}
										</div>
									</>
								)}
							</div>

							<div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
								<button
									type="button"
									onClick={handleSaveConfiguration}
									style={{
										background: '#10b981',
										color: 'white',
										border: 'none',
										padding: '0.5rem 1rem',
										borderRadius: '6px',
										cursor: 'pointer',
										fontWeight: '500',
										fontSize: '0.9rem',
									}}
								>
									Save Configuration
								</button>
								<button
									type="button"
									onClick={handleExportConfiguration}
									style={{
										background: '#3b82f6',
										color: 'white',
										border: 'none',
										padding: '0.5rem 1rem',
										borderRadius: '6px',
										cursor: 'pointer',
										fontWeight: '500',
										fontSize: '0.9rem',
									}}
								>
									Export Configuration
								</button>
								<button
									type="button"
									onClick={handleImportConfiguration}
									style={{
										background: '#8b5cf6',
										color: 'white',
										border: 'none',
										padding: '0.5rem 1rem',
										borderRadius: '6px',
										cursor: 'pointer',
										fontWeight: '500',
										fontSize: '0.9rem',
									}}
								>
									Import Configuration
								</button>
							</div>
						</div>
					) : (
						<EmptyState>
							No configuration saved yet. Complete the flow and save your settings to see them here.
						</EmptyState>
					)}
				</SectionContent>
			</Section>

			<StatusSection>
				<StatusTitle>
					<FiCheckCircle size={18} />
					Configuration Status
				</StatusTitle>
				<StatusText>
					Save your PingOne credentials so they auto-populate in subsequent steps.
				</StatusText>
				<StatusText>Save your configuration above to persist it for future sessions.</StatusText>
			</StatusSection>
		</Card>
	);
};

export default ConfigurationSummaryCard;
