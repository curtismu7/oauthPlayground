/**
 * @file ProtectPortalConfigModal.tsx
 * @module protect-app/components
 * @description Configuration modal for Protect Portal credentials and settings
 * @version 9.6.6
 * @since 2026-02-12
 *
 * This component provides a modal for users to configure Protect Portal settings
 * when environment variables are not available or need to be updated.
 */

import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiInfo, FiSave, FiX } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useProtectPortal } from '../contexts/ProtectPortalContext';

interface ProtectPortalConfigModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfigurationSaved?: (config: ProtectPortalConfiguration) => void;
}

export interface ProtectPortalConfiguration {
	apiBaseUrl: string;
	environmentId: string;
	region: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
}

export const ProtectPortalConfigModal: React.FC<ProtectPortalConfigModalProps> = ({
	isOpen,
	onClose,
	onConfigurationSaved,
}) => {
	const { currentTheme } = useTheme();
	const { updateConfiguration } = useProtectPortal();
	
	const [config, setConfig] = useState<ProtectPortalConfiguration>({
		apiBaseUrl: '',
		environmentId: '',
		region: 'us',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
	});
	
	const [isSaving, setIsSaving] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load current configuration when modal opens
	useEffect(() => {
		if (isOpen) {
			// Try to load from environment variables first
			const envConfig = {
				apiBaseUrl: process.env.REACT_APP_API_BASE_URL || '/api/pingone',
				environmentId: process.env.REACT_APP_ENVIRONMENT_ID || '',
				region: process.env.REACT_APP_REGION || 'us',
				clientId: process.env.REACT_APP_CLIENT_ID || '',
				clientSecret: process.env.REACT_APP_CLIENT_SECRET || '',
				redirectUri: process.env.REACT_APP_REDIRECT_URI || 'https://localhost:3000/callback',
			};
			
			setConfig(envConfig);
		}
	}, [isOpen]);

	const handleSave = async () => {
		if (!config.environmentId.trim()) {
			setError('Environment ID is required');
			return;
		}

		setIsSaving(true);
		
		try {
			// Update the Protect Portal configuration
			updateConfiguration({
				apiBaseUrl: config.apiBaseUrl,
				environmentId: config.environmentId,
				region: config.region,
			});

			// Store in localStorage for persistence
			localStorage.setItem('protect_portal_config', JSON.stringify(config));

			onConfigurationSaved?.(config);
			onClose();
		} catch (error) {
			console.error('Failed to save configuration:', error);
			setError('Failed to save configuration. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleTestConnection = async () => {
		if (!config.environmentId.trim()) {
			setError('Environment ID is required to test connection');
			return;
		}

		try {
			// Test API connectivity
			const response = await fetch(`${config.apiBaseUrl}/health`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				setError('✅ Connection successful!');
			} else {
				setError('❌ Connection failed. Please check your configuration.');
			}
		} catch (error) {
			setError('❌ Connection failed. Please check your API URL and network connectivity.');
		}
	};

	if (!isOpen) return null;

	const modalOverlayStyle: React.CSSProperties = {
		position: 'fixed',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		background: 'rgba(0, 0, 0, 0.5)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1000,
	};

	const modalContentStyle: React.CSSProperties = {
		background: currentTheme.colors.surface,
		borderRadius: currentTheme.borderRadius.lg,
		padding: '2rem',
		maxWidth: '500px',
		width: '90%',
		maxHeight: '80vh',
		overflowY: 'auto',
		boxShadow: currentTheme.shadows.xl,
	};

	const modalHeaderStyle: React.CSSProperties = {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '1.5rem',
	};

	const modalTitleStyle: React.CSSProperties = {
		fontSize: '1.5rem',
		fontWeight: 700,
		color: currentTheme.colors.text,
		margin: 0,
	};

	const modalCloseStyle: React.CSSProperties = {
		background: 'transparent',
		border: 'none',
		cursor: 'pointer',
		padding: '0.5rem',
		borderRadius: currentTheme.borderRadius.sm,
		color: currentTheme.colors.textSecondary,
		transition: 'all 0.2s',
	};

	const formSectionStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
		marginBottom: '1.5rem',
	};

	const formFieldStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem',
	};

	const formLabelStyle: React.CSSProperties = {
		fontWeight: 600,
		color: currentTheme.colors.text,
		fontSize: '0.875rem',
	};

	const inputStyle: React.CSSProperties = {
		padding: '0.75rem',
		border: `2px solid #e5e7eb`,
		borderRadius: currentTheme.borderRadius.sm,
		fontSize: '0.875rem',
		transition: 'border-color 0.2s',
		background: currentTheme.colors.surface,
		color: currentTheme.colors.text,
	};

	const inputFocusStyle: React.CSSProperties = {
		outline: 'none',
		borderColor: currentTheme.colors.primary,
		boxShadow: `0 0 0 3px ${currentTheme.colors.primary}20`,
	};

	const buttonGroupStyle: React.CSSProperties = {
		display: 'flex',
		gap: '0.75rem',
		justifyContent: 'flex-end',
	};

	const primaryButtonStyle: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.75rem 1.5rem',
		borderRadius: '0.375rem',
		border: 'none',
		background: currentTheme.colors.primary,
		color: 'white',
		fontWeight: 600,
		cursor: 'pointer',
		transition: 'background 0.2s',
		fontSize: '0.875rem',
	};

	const secondaryButtonStyle: React.CSSProperties = {
		...primaryButtonStyle,
		background: '#e5e7eb',
		color: '#374151',
	};

	const warningBoxStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.5rem',
		padding: '0.75rem',
		borderRadius: currentTheme.borderRadius.sm,
		background: `${currentTheme.colors.error}10`,
		border: `1px solid ${currentTheme.colors.error}30`,
		marginBottom: '1rem',
	};

	const infoBoxStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.5rem',
		padding: '0.75rem',
		borderRadius: currentTheme.borderRadius.sm,
		background: `${currentTheme.colors.primary}10`,
		border: `1px solid ${currentTheme.colors.primary}30`,
		marginBottom: '1rem',
	};

	return (
		<div style={modalOverlayStyle}>
			<div style={modalContentStyle}>
				<div style={modalHeaderStyle}>
					<h2 style={modalTitleStyle}>Protect Portal Configuration</h2>
					<button
						type="button"
						style={modalCloseStyle}
						onClick={onClose}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = currentTheme.colors.background;
							e.currentTarget.style.color = currentTheme.colors.text;
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'transparent';
							e.currentTarget.style.color = currentTheme.colors.textSecondary;
						}}
					>
						<FiX size={20} />
					</button>
				</div>

				{!process.env.REACT_APP_ENVIRONMENT_ID && (
					<div style={warningBoxStyle}>
						<FiAlertTriangle />
						<div style={{ fontSize: '0.8125rem', color: currentTheme.colors.error, lineHeight: '1.5' }}>
							<strong>No Environment Configuration Found</strong><br />
							Environment variables are not configured. Please enter your PingOne 
							environment details below to continue using the Protect Portal.
						</div>
					</div>
				)}

				{error && (
					<div style={{
						backgroundColor: `${currentTheme.colors.error}15`,
						border: `1px solid ${currentTheme.colors.error}`,
						borderRadius: '6px',
						padding: '12px',
						marginBottom: '16px',
						display: 'flex',
						alignItems: 'center',
						gap: '8px'
					}}>
						<FiAlertTriangle color={currentTheme.colors.error} />
						<div style={{ fontSize: '0.8125rem', color: currentTheme.colors.error, lineHeight: '1.5' }}>
							{error}
						</div>
					</div>
				)}

				<div style={infoBoxStyle}>
					<FiInfo />
					<div style={{ fontSize: '0.8125rem', color: currentTheme.colors.primary, lineHeight: '1.5' }}>
						<strong>Required Fields:</strong> Environment ID is required for basic functionality.<br />
						<strong>Optional Fields:</strong> Client credentials are needed for OAuth flows.<br />
						<strong>Note:</strong> Configuration will be saved locally for this session.
					</div>
				</div>

				<div style={formSectionStyle}>
					<div style={formFieldStyle}>
						<label htmlFor="apiBaseUrl" style={formLabelStyle}>API Base URL</label>
						<input
							id="apiBaseUrl"
							style={inputStyle}
							type="text"
							value={config.apiBaseUrl}
							onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
							placeholder="e.g., /api/pingone or https://api.pingone.com"
							onFocus={(e) => {
								Object.assign(e.target.style, inputFocusStyle);
							}}
							onBlur={(e) => {
								e.target.style.borderColor = '#e5e7eb';
								e.target.style.boxShadow = 'none';
							}}
						/>
					</div>

					<div style={formFieldStyle}>
						<label htmlFor="region" style={formLabelStyle}>Region</label>
						<select
							id="region"
							style={{ ...inputStyle, cursor: 'pointer' }}
							value={config.region}
							onChange={(e) => setConfig({ ...config, region: e.target.value })}
							onFocus={(e) => {
								Object.assign(e.target.style, inputFocusStyle);
							}}
							onBlur={(e) => {
								e.target.style.borderColor = '#e5e7eb';
								e.target.style.boxShadow = 'none';
							}}
						>
							<option value="us">United States</option>
							<option value="eu">Europe</option>
							<option value="ap">Asia Pacific</option>
							<option value="ca">Canada</option>
						</select>
					</div>

					<div style={formFieldStyle}>
						<label style={formLabelStyle}>
							<button
								type="button"
								onClick={() => setShowAdvanced(!showAdvanced)}
								style={{
									background: 'none',
									border: 'none',
									color: currentTheme.colors.primary,
									cursor: 'pointer',
									fontSize: '0.875rem',
									fontWeight: '600',
								}}
							>
								{showAdvanced ? '▼' : '▶'} Advanced Configuration
							</button>
						</label>
					</div>

					{showAdvanced && (
						<>
							<div style={formFieldStyle}>
								<label htmlFor="clientId" style={formLabelStyle}>Client ID</label>
								<input
									id="clientId"
									style={inputStyle}
									type="text"
									value={config.clientId}
									onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
									placeholder="OAuth Client ID"
									onFocus={(e) => {
										Object.assign(e.target.style, inputFocusStyle);
									}}
									onBlur={(e) => {
										e.target.style.borderColor = '#e5e7eb';
										e.target.style.boxShadow = 'none';
									}}
								/>
							</div>

							<div style={formFieldStyle}>
								<label htmlFor="clientSecret" style={formLabelStyle}>Client Secret</label>
								<input
									id="clientSecret"
									style={inputStyle}
									type="password"
									value={config.clientSecret}
									onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
									placeholder="OAuth Client Secret"
									onFocus={(e) => {
										Object.assign(e.target.style, inputFocusStyle);
									}}
									onBlur={(e) => {
										e.target.style.borderColor = '#e5e7eb';
										e.target.style.boxShadow = 'none';
									}}
								/>
							</div>

							<div style={formFieldStyle}>
								<label htmlFor="redirectUri" style={formLabelStyle}>Redirect URI</label>
								<input
									id="redirectUri"
									style={inputStyle}
									type="text"
									value={config.redirectUri}
									onChange={(e) => setConfig({ ...config, redirectUri: e.target.value })}
									placeholder="https://localhost:3000/callback"
									onFocus={(e) => {
										Object.assign(e.target.style, inputFocusStyle);
									}}
									onBlur={(e) => {
										e.target.style.borderColor = '#e5e7eb';
										e.target.style.boxShadow = 'none';
									}}
								/>
							</div>
						</>
					)}
				</div>

				<div style={buttonGroupStyle}>
					<button
						type="button"
						style={secondaryButtonStyle}
						onClick={handleTestConnection}
						disabled={!config.environmentId.trim()}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#d1d5db';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#e5e7eb';
						}}
					>
						Test Connection
					</button>
					<button
						type="button"
						style={secondaryButtonStyle}
						onClick={onClose}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#d1d5db';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#e5e7eb';
						}}
					>
						Cancel
					</button>
					<button
						type="submit"
						style={{
							...primaryButtonStyle,
							opacity: (isSaving || !config.environmentId.trim()) ? 0.6 : 1,
							cursor: (isSaving || !config.environmentId.trim()) ? 'not-allowed' : 'pointer',
						}}
						onClick={handleSave}
						disabled={isSaving || !config.environmentId.trim()}
						onMouseEnter={(e) => {
							if (!isSaving && config.environmentId.trim()) {
								e.currentTarget.style.background = `${currentTheme.colors.primary}dd`;
							}
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = currentTheme.colors.primary;
						}}
					>
						{isSaving ? (
							<>
								<div style={{
									width: '16px',
									height: '16px',
									border: '2px solid white',
									borderTop: '2px solid transparent',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite',
								}} />
								Saving...
							</>
						) : (
							<>
								<FiSave />
								Save Configuration
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ProtectPortalConfigModal;
