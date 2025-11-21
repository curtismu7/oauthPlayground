// src/services/parConfigurationService.tsx
// PAR (Pushed Authorization Request) Configuration Service
// Reusable service for configuring PAR authorization request parameters

import React, { useCallback, useState } from 'react';
import { FiCheckCircle, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import { CollapsibleHeader } from './collapsibleHeaderService';

// PAR Configuration Types
export interface PARConfiguration {
	acrValues?: string;
	prompt?: string;
	maxAge?: number;
	uiLocales?: string;
	claims?: any;
}

export interface PARConfigurationServiceProps {
	config: PARConfiguration;
	onConfigChange: (config: PARConfiguration) => void;
	defaultCollapsed?: boolean;
	title?: string;
	showEducationalContent?: boolean;
}

// Styled Components
const InfoBox = styled.div<{ $variant?: 'info' | 'success' | 'warning' | 'error' }>`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1rem;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return '#f0fdf4';
			case 'warning':
				return '#fffbeb';
			case 'error':
				return '#fef2f2';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return '#bbf7d0';
			case 'warning':
				return '#fed7aa';
			case 'error':
				return '#fecaca';
			default:
				return '#bfdbfe';
		}
	}};
`;

const InfoTitle = styled.div`
	font-weight: 600;
	font-size: 0.875rem;
	color: #1e40af;
	margin-bottom: 0.25rem;
`;

const InfoText = styled.div`
	font-size: 0.875rem;
	color: #374151;
	line-height: 1.5;
`;

const GeneratedContentBox = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const GeneratedLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #6b7280;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin-top: 0.5rem;
`;

const ParameterLabel = styled.div`
	font-size: 0.875rem;
	font-weight: 500;
	color: #374151;
	margin-bottom: 0.25rem;
`;

const ParameterValue = styled.div`
	width: 100%;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Textarea = styled.textarea`
	width: 100%;
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: white;
	transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

// PAR Configuration Service Component
export const PARConfigurationService: React.FC<PARConfigurationServiceProps> = ({
	config,
	onConfigChange,
	defaultCollapsed = true,
	title = 'PAR Authorization Request Configuration',
	showEducationalContent = true,
}) => {
	const [localConfig, setLocalConfig] = useState<PARConfiguration>(config);

	const handleConfigChange = useCallback(
		(field: keyof PARConfiguration, value: any) => {
			const newConfig = { ...localConfig, [field]: value };
			setLocalConfig(newConfig);
			onConfigChange(newConfig);
		},
		[localConfig, onConfigChange]
	);

	const handleFullConfigChange = useCallback(
		(newConfig: PARConfiguration) => {
			setLocalConfig(newConfig);
			onConfigChange(newConfig);
		},
		[onConfigChange]
	);

	const handleClaimsChange = useCallback(
		(value: string) => {
			try {
				const claims = value ? JSON.parse(value) : null;
				handleConfigChange('claims', claims);
			} catch (_error) {
				// Invalid JSON, keep the text but don't update claims
			}
		},
		[handleConfigChange]
	);

	return (
		<CollapsibleHeader
			title={title}
			icon={<FiShield />}
			defaultCollapsed={defaultCollapsed}
			showArrow={true}
		>
			{showEducationalContent && (
				<InfoBox $variant="info">
					<FiShield size={20} />
					<div>
						<InfoTitle>PAR (Pushed Authorization Request) Parameters</InfoTitle>
						<InfoText>
							Configure the authorization request parameters that will be pushed to PingOne's PAR
							endpoint via secure back-channel. These parameters enhance security by storing them
							server-side.
						</InfoText>
					</div>
				</InfoBox>
			)}

			<GeneratedContentBox>
				<GeneratedLabel>PAR Request Parameters</GeneratedLabel>

				{/* Quick-fill buttons for common configurations */}
				<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
					<button
						type="button"
						onClick={() => {
							const basicConfig = {
								acrValues: '1',
								prompt: 'consent',
								maxAge: 3600,
								uiLocales: 'en-US',
								claims: { id_token: { email: null, name: null } },
							};
							handleFullConfigChange(basicConfig);
						}}
						style={{
							padding: '0.5rem 1rem',
							backgroundColor: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							cursor: 'pointer',
						}}
					>
						📝 Basic Profile
					</button>
					<button
						type="button"
						onClick={() => {
							const secureConfig = {
								acrValues: '2',
								prompt: 'login',
								maxAge: 1800,
								uiLocales: 'en-US',
								claims: { id_token: { email: { essential: true }, email_verified: null } },
							};
							handleFullConfigChange(secureConfig);
						}}
						style={{
							padding: '0.5rem 1rem',
							backgroundColor: '#dc2626',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							cursor: 'pointer',
						}}
					>
						🔒 High Security
					</button>
					<button
						type="button"
						onClick={() => {
							const fullConfig = {
								acrValues: '1, 2',
								prompt: 'consent',
								maxAge: 3600,
								uiLocales: 'en-US, es-ES',
								claims: {
									id_token: { email: null, name: null, picture: null },
									userinfo: { phone_number: null },
								},
							};
							handleFullConfigChange(fullConfig);
						}}
						style={{
							padding: '0.5rem 1rem',
							backgroundColor: '#059669',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							cursor: 'pointer',
						}}
					>
						📋 Complete Profile
					</button>
					<button
						type="button"
						onClick={() => {
							const minimalConfig = {
								acrValues: '',
								prompt: 'none',
								maxAge: undefined,
								uiLocales: '',
								claims: null,
							};
							handleConfigChange(minimalConfig);
						}}
						style={{
							padding: '0.5rem 1rem',
							backgroundColor: '#6b7280',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							cursor: 'pointer',
						}}
					>
						⚡ Minimal
					</button>
				</div>

				<ParameterGrid>
					<div>
						<ParameterLabel>ACR Values (Authentication Context Class Reference)</ParameterLabel>
						<ParameterValue>
							<Input
								type="text"
								placeholder="1, 2, 3"
								value={localConfig.acrValues || ''}
								onChange={(e) => handleConfigChange('acrValues', e.target.value)}
							/>
							<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
								Specify required authentication assurance levels. Common values: 1 (basic), 2
								(multi-factor), 3 (high assurance)
							</div>
						</ParameterValue>
					</div>
					<div>
						<ParameterLabel>Prompt (Authentication & Consent Behavior)</ParameterLabel>
						<ParameterValue>
							<Select
								value={localConfig.prompt || ''}
								onChange={(e) => handleConfigChange('prompt', e.target.value)}
							>
								<option value="">None (use default behavior)</option>
								<option value="none">none (no prompt)</option>
								<option value="login">login (force re-authentication)</option>
								<option value="consent">consent (force consent screen)</option>
								<option value="select_account">select_account (account selection)</option>
							</Select>
							<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
								Controls user experience during authorization. Use 'consent' for sensitive apps,
								'login' for high-security scenarios
							</div>
						</ParameterValue>
					</div>
					<div>
						<ParameterLabel>Max Age (Maximum Authentication Age)</ParameterLabel>
						<ParameterValue>
							<Input
								type="number"
								placeholder="3600"
								value={localConfig.maxAge || ''}
								onChange={(e) =>
									handleConfigChange('maxAge', parseInt(e.target.value, 10) || undefined)
								}
							/>
							<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
								Forces re-authentication if user was authenticated longer ago (in seconds). Common:
								3600 (1 hour), 1800 (30 min)
							</div>
						</ParameterValue>
					</div>
					<div>
						<ParameterLabel>UI Locales (User Interface Language)</ParameterLabel>
						<ParameterValue>
							<Input
								type="text"
								placeholder="en-US, es-ES, fr-FR"
								value={localConfig.uiLocales || ''}
								onChange={(e) => handleConfigChange('uiLocales', e.target.value)}
							/>
							<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
								Preferred languages for the authorization interface. Use ISO 639-1 language codes
								with country codes
							</div>
						</ParameterValue>
					</div>
					<div style={{ gridColumn: '1 / -1' }}>
						<ParameterLabel>Claims Request (Request Specific User Information)</ParameterLabel>
						<ParameterValue>
							<Textarea
								placeholder='{"id_token": {"email": null, "email_verified": null, "name": null, "picture": null}, "userinfo": {"phone_number": null}}'
								value={localConfig.claims ? JSON.stringify(localConfig.claims, null, 2) : ''}
								onChange={(e) => handleClaimsChange(e.target.value)}
								rows={6}
							/>
							<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
								<strong>Real Examples:</strong>
								<br />• <code>{`{"id_token": {"email": null, "name": null}}`}</code> - Request email
								and name in ID token
								<br />• <code>{`{"userinfo": {"phone_number": null}}`}</code> - Request phone number
								from userinfo endpoint
								<br />• <code>{`{"id_token": {"email": {"essential": true}}}`}</code> - Require
								email (essential claim)
							</div>
						</ParameterValue>
					</div>
				</ParameterGrid>
			</GeneratedContentBox>

			{showEducationalContent && (
				<InfoBox $variant="success" style={{ marginTop: '1rem' }}>
					<FiCheckCircle size={20} />
					<div>
						<InfoTitle>PAR Security Benefits</InfoTitle>
						<InfoText>
							• Parameters stored server-side, not visible in browser URLs
							<br />• User cannot modify authorization parameters
							<br />• No browser URL length limitations
							<br />• Enhanced security for sensitive authorization requests
						</InfoText>
					</div>
				</InfoBox>
			)}
		</CollapsibleHeader>
	);
};

// PAR Configuration Service Utilities
export class PARConfigurationServiceUtils {
	/**
	 * Get default PAR configuration
	 */
	static getDefaultConfig(): PARConfiguration {
		return {
			acrValues: '',
			prompt: '',
			maxAge: undefined,
			uiLocales: '',
			claims: null,
		};
	}

	/**
	 * Validate PAR configuration
	 */
	static validateConfig(config: PARConfiguration): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Validate max age if provided
		if (config.maxAge !== undefined && (config.maxAge < 0 || config.maxAge > 86400)) {
			errors.push('Max age must be between 0 and 86400 seconds (24 hours)');
		}

		// Validate claims JSON if provided
		if (config.claims && typeof config.claims !== 'object') {
			errors.push('Claims must be a valid JSON object');
		}

		// Validate prompt values
		const validPrompts = ['', 'none', 'login', 'consent', 'select_account'];
		if (config.prompt && !validPrompts.includes(config.prompt)) {
			errors.push('Prompt must be one of: none, login, consent, select_account');
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Convert PAR configuration to URL parameters
	 */
	static configToUrlParams(config: PARConfiguration): Record<string, string> {
		const params: Record<string, string> = {};

		if (config.acrValues) params.acr_values = config.acrValues;
		if (config.prompt) params.prompt = config.prompt;
		if (config.maxAge !== undefined) params.max_age = config.maxAge.toString();
		if (config.uiLocales) params.ui_locales = config.uiLocales;
		if (config.claims) params.claims = JSON.stringify(config.claims);

		return params;
	}

	/**
	 * Convert URL parameters to PAR configuration
	 */
	static urlParamsToConfig(params: Record<string, string>): PARConfiguration {
		const config: PARConfiguration = {};

		if (params.acr_values) config.acrValues = params.acr_values;
		if (params.prompt) config.prompt = params.prompt;
		if (params.max_age) config.maxAge = parseInt(params.max_age, 10);
		if (params.ui_locales) config.uiLocales = params.ui_locales;
		if (params.claims) {
			try {
				config.claims = JSON.parse(params.claims);
			} catch (_error) {
				console.warn('Invalid claims JSON:', params.claims);
			}
		}

		return config;
	}

	/**
	 * Get PAR configuration for specific flow types
	 */
	static getFlowSpecificConfig(flowType: string): PARConfiguration {
		const baseConfig = PARConfigurationServiceUtils.getDefaultConfig();

		switch (flowType) {
			case 'authorization-code':
			case 'oidc-hybrid':
				return {
					...baseConfig,
					acrValues: '1',
					prompt: 'consent', // Force consent for authorization code flows
					maxAge: 3600, // 1 hour default
					uiLocales: 'en-US',
					claims: { id_token: { email: null, name: null } },
				};
			case 'implicit':
				return {
					...baseConfig,
					acrValues: '1',
					prompt: 'none', // No consent needed for implicit flows
					maxAge: 1800, // 30 minutes for implicit flows
					uiLocales: 'en-US',
					claims: { id_token: { email: null, name: null, picture: null } },
				};
			case 'device-authorization':
				return {
					...baseConfig,
					acrValues: '2',
					prompt: 'login', // Force login for device flows
					maxAge: 7200, // 2 hours for device flows
					uiLocales: 'en-US',
					claims: { id_token: { email: { essential: true }, email_verified: null } },
				};
			case 'rar':
				return {
					...baseConfig,
					acrValues: '1, 2',
					prompt: 'consent',
					maxAge: 3600,
					uiLocales: 'en-US, es-ES',
					claims: {
						id_token: { email: null, name: null, picture: null },
						userinfo: { phone_number: null },
					},
				};
			default:
				return {
					...baseConfig,
					acrValues: '1',
					prompt: 'consent',
					maxAge: 3600,
					uiLocales: 'en-US',
					claims: { id_token: { email: null, name: null } },
				};
		}
	}
}

export default PARConfigurationService;
