import { V9_COLORS } from '../services/v9/V9ColorStandards';

// src/components/PingOneAppConfig.tsx - Reusable PingOne Application Configuration Component

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { FiChevronDown } from '../icons';

import { logger } from '../utils/logger';

const CollapsibleSection = styled.div`
	margin: 1.5rem 0;
`;

const SectionToggle = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	padding: 1rem;
	background: ${V9_COLORS.BG.GRAY_MEDIUM};
	border-radius: 8px;
	border-left: 4px solid ${V9_COLORS.PRIMARY.BLUE};
	margin-bottom: 0.5rem;
	transition: all 0.2s ease;

	&:hover {
		background: ${V9_COLORS.TEXT.GRAY_LIGHTER};
	}
`;

const SectionContent = styled.div<{ $collapsed?: boolean }>`
	max-height: ${(props) => (props.$collapsed ? '0' : '2000px')};
	overflow: hidden;
	transition: max-height 0.3s ease;
	padding: ${(props) => (props.$collapsed ? '0 1rem' : '1rem')};
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	border-radius: 0 0 8px 8px;
`;

const SectionTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
`;

const ConfigGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-bottom: 1rem;
`;

const ConfigField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const ConfigLabel = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHT};
	border-radius: 6px;
	font-size: 0.875rem;
	color: ${V9_COLORS.TEXT.GRAY_DARK};

	&:focus {
		outline: none;
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHT};
	border-radius: 6px;
	font-size: 0.875rem;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	background: ${V9_COLORS.BG.WHITE};

	&:focus {
		outline: none;
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const CheckboxGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 1rem 0;
`;

const CheckboxItem = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	cursor: pointer;
`;

const Checkbox = styled.input`
	width: 1rem;
	height: 1rem;
	accent-color: ${V9_COLORS.PRIMARY.BLUE};
`;

const SubSection = styled.div`
	margin: 1rem 0;
	padding: 1rem;
	background: ${V9_COLORS.BG.WHITE};
	border-radius: 8px;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
`;

const SubSectionTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	margin-bottom: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
	padding: 0.75rem 2rem;
	font-size: 1rem;
	font-weight: 600;
	border-radius: 6px;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;

	${(props) =>
		props.variant === 'primary'
			? `
    background: ${V9_COLORS.PRIMARY.BLUE};
    color: ${V9_COLORS.TEXT.WHITE};
    
    &:hover {
      background: ${V9_COLORS.PRIMARY.BLUE_DARK};
    }
  `
			: props.variant === 'success'
				? `
    background: ${V9_COLORS.PRIMARY.GREEN};
    color: ${V9_COLORS.TEXT.WHITE};
    
    &:hover {
      background: ${V9_COLORS.PRIMARY.GREEN_DARK};
    }
  `
				: `
    background: ${V9_COLORS.TEXT.GRAY_LIGHTER};
    color: ${V9_COLORS.TEXT.GRAY_DARK};
    border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHT};
    
    &:hover {
      background: ${V9_COLORS.TEXT.GRAY_LIGHTER};
    }
  `}
`;

export interface PingOneConfig {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	tokenEndpointAuthMethod:
		| 'none'
		| 'client_secret_basic'
		| 'client_secret_post'
		| 'client_secret_jwt'
		| 'private_key_jwt';
	allowRedirectUriPatterns: boolean;
	responseTypes: {
		code: boolean;
		token: boolean;
		idToken: boolean;
	};
	grantTypes: {
		authorizationCode: boolean;
		implicit: boolean;
		clientCredentials: boolean;
		deviceAuthorization: boolean;
		refreshToken: boolean;
		ciba: boolean; // RFC 9436: Client Initiated Backchannel Authentication
	};
	pkceEnforcement: 'required' | 'optional' | 'not_required';
	refreshTokenDuration: number;
	refreshTokenDurationUnit: 'seconds' | 'minutes' | 'hours' | 'days';
	refreshTokenRollingDuration: number;
	refreshTokenRollingDurationUnit: 'seconds' | 'minutes' | 'hours' | 'days';
	refreshTokenRollingGracePeriod: number;
}

// Type for configuration values to avoid 'any' type
type ConfigValue = string | number | boolean | null;

interface PingOneAppConfigProps {
	onConfigChange?: (config: PingOneConfig) => void;
	initialConfig?: Partial<PingOneConfig>;
	storageKey?: string;
}

const defaultConfig: PingOneConfig = {
	environmentId: '',
	clientId: '',
	clientSecret: '',
	redirectUri: 'https://localhost:3000/authz-callback',
	tokenEndpointAuthMethod: 'client_secret_basic',
	allowRedirectUriPatterns: false,
	responseTypes: {
		code: true,
		token: false,
		idToken: true,
	},
	grantTypes: {
		authorizationCode: true,
		implicit: false,
		clientCredentials: false,
		deviceAuthorization: false,
		refreshToken: true,
		ciba: false,
	},
	pkceEnforcement: 'required',
	refreshTokenDuration: 30,
	refreshTokenDurationUnit: 'days',
	refreshTokenRollingDuration: 180,
	refreshTokenRollingDurationUnit: 'days',
	refreshTokenRollingGracePeriod: 0,
};

export const PingOneAppConfig: React.FC<PingOneAppConfigProps> = ({
	onConfigChange,
	initialConfig,
	storageKey = 'pingone-app-config',
}) => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [config, setConfig] = useState<PingOneConfig>(() => ({
		...defaultConfig,
		...(initialConfig || {}),
	}));

	// Load saved configuration on mount
	useEffect(() => {
		const savedConfig = localStorage.getItem(storageKey);
		if (savedConfig) {
			try {
				const parsed = JSON.parse(savedConfig);
				setConfig((prev) => ({ ...prev, ...parsed }));
			} catch (err) {
				logger.error(
					'PingOneAppConfig',
					'Failed to load saved configuration:',
					undefined,
					err as Error
				);
			}
		}
	}, [storageKey]);

	// Handle configuration changes
	const handleConfigChange = useCallback(
		(field: string, value: ConfigValue) => {
			setConfig((prev) => {
				const newConfig = { ...prev, [field]: value };
				onConfigChange?.(newConfig);
				return newConfig;
			});
		},
		[onConfigChange]
	);

	// Handle nested object changes (responseTypes, grantTypes)
	const handleNestedChange = useCallback(
		(parent: keyof PingOneConfig, field: string, value: boolean) => {
			setConfig((prev) => {
				const parentObj = prev[parent] as Record<string, boolean>;
				const newConfig = {
					...prev,
					[parent]: {
						...parentObj,
						[field]: value,
					},
				};
				onConfigChange?.(newConfig);
				return newConfig;
			});
		},
		[onConfigChange]
	);

	// Save configuration
	const handleSaveConfiguration = useCallback(() => {
		try {
			// Validate required fields
			const requiredFields = [];
			if (!config.environmentId.trim()) requiredFields.push('Environment ID');
			if (!config.clientId.trim()) requiredFields.push('Client ID');
			if (!config.redirectUri.trim()) requiredFields.push('Redirect URI');

			if (requiredFields.length > 0) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Validation Error',
					message: `Please fill in required fields: ${requiredFields.join(', ')}`,
					dismissible: true,
				});
				return;
			}

			// Show saving toast
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Saving configuration...',
				duration: 3000,
			});

			// Save to localStorage
			localStorage.setItem(storageKey, JSON.stringify(config));

			// Show success toast
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Configuration saved successfully',
				duration: 4000,
			});
		} catch (error) {
			// Show error toast
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
				dismissible: true,
			});
		}
	}, [config, storageKey]);

	const toggleCollapse = useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

	return (
		<CollapsibleSection>
			<SectionToggle onClick={toggleCollapse}>
				<SectionTitle>
					<span>⚙️</span>
					PingOne Application Configuration
				</SectionTitle>
				<FiChevronDown
					style={{
						transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
						transition: 'transform 0.2s ease',
					}}
				/>
			</SectionToggle>

			<SectionContent $collapsed={isCollapsed}>
				{/* Basic Configuration */}
				<SubSection>
					<SubSectionTitle>Basic Settings</SubSectionTitle>
					<ConfigGrid>
						<ConfigField>
							<ConfigLabel>Environment ID</ConfigLabel>
							<Input
								type="text"
								placeholder="b9817c16-9910-4415-b67e-4ac687da74d9"
								value={config.environmentId}
								onChange={(e) => handleConfigChange('environmentId', e.target.value)}
							/>
						</ConfigField>

						<ConfigField>
							<ConfigLabel>Client ID</ConfigLabel>
							<Input
								type="text"
								placeholder="a4f963ea-0736-456a-be72-b1fa4f63f81f"
								value={config.clientId}
								onChange={(e) => handleConfigChange('clientId', e.target.value)}
							/>
						</ConfigField>

						<ConfigField>
							<ConfigLabel>Client Secret</ConfigLabel>
							<Input
								type="password"
								placeholder="Your client secret"
								value={config.clientSecret}
								onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
							/>
						</ConfigField>

						<ConfigField>
							<ConfigLabel>Redirect URI</ConfigLabel>
							<Input
								type="text"
								placeholder="https://localhost:3000/authz-callback"
								value={config.redirectUri}
								onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
							/>
						</ConfigField>
					</ConfigGrid>

					<ConfigGrid>
						<ConfigField>
							<ConfigLabel>Token Endpoint Authentication Method</ConfigLabel>
							<Select
								value={config.tokenEndpointAuthMethod}
								onChange={(e) => handleConfigChange('tokenEndpointAuthMethod', e.target.value)}
							>
								<option value="none">None</option>
								<option value="client_secret_basic">Client Secret Basic</option>
								<option value="client_secret_post">Client Secret Post</option>
								<option value="client_secret_jwt">Client Secret JWT</option>
								<option value="private_key_jwt">Private Key JWT</option>
							</Select>
						</ConfigField>

						<ConfigField></ConfigField>
					</ConfigGrid>
				</SubSection>

				{/* OIDC Settings */}
				<SubSection>
					<SubSectionTitle>OIDC Settings</SubSectionTitle>
					<p
						style={{
							fontSize: '0.875rem',
							color: V9_COLORS.TEXT.GRAY_MEDIUM,
							marginBottom: '1rem',
						}}
					>
						Configure OIDC settings for the application.
					</p>

					<div style={{ marginBottom: '1rem' }}>
						<ConfigLabel>Response Type</ConfigLabel>
						<CheckboxGroup>
							<CheckboxItem>
								<Checkbox
									type="checkbox"
									checked={config.responseTypes.code}
									onChange={(e) => handleNestedChange('responseTypes', 'code', e.target.checked)}
								/>
								Code
							</CheckboxItem>
							<CheckboxItem>
								<Checkbox
									type="checkbox"
									checked={config.responseTypes.token}
									onChange={(e) => handleNestedChange('responseTypes', 'token', e.target.checked)}
								/>
								Token
							</CheckboxItem>
							<CheckboxItem>
								<Checkbox
									type="checkbox"
									checked={config.responseTypes.idToken}
									onChange={(e) => handleNestedChange('responseTypes', 'idToken', e.target.checked)}
								/>
								ID Token
							</CheckboxItem>
						</CheckboxGroup>
					</div>

					<div style={{ marginBottom: '1rem' }}>
						<ConfigLabel>Grant Type</ConfigLabel>
						<CheckboxGroup>
							<CheckboxItem>
								<Checkbox
									type="checkbox"
									checked={config.grantTypes.authorizationCode}
									onChange={(e) =>
										handleNestedChange('grantTypes', 'authorizationCode', e.target.checked)
									}
								/>
								Authorization Code
							</CheckboxItem>
							<CheckboxItem>
								<Checkbox
									type="checkbox"
									checked={config.grantTypes.implicit}
									onChange={(e) => handleNestedChange('grantTypes', 'implicit', e.target.checked)}
								/>
								Implicit
							</CheckboxItem>
							<CheckboxItem>
								<Checkbox
									type="checkbox"
									checked={config.grantTypes.clientCredentials}
									onChange={(e) =>
										handleNestedChange('grantTypes', 'clientCredentials', e.target.checked)
									}
								/>
								Client Credentials
							</CheckboxItem>
							<CheckboxItem>
								<Checkbox
									type="checkbox"
									checked={config.grantTypes.deviceAuthorization}
									onChange={(e) =>
										handleNestedChange('grantTypes', 'deviceAuthorization', e.target.checked)
									}
								/>
								Device Authorization
							</CheckboxItem>
							<CheckboxItem>
								<Checkbox
									type="checkbox"
									checked={config.grantTypes.refreshToken}
									onChange={(e) =>
										handleNestedChange('grantTypes', 'refreshToken', e.target.checked)
									}
								/>
								Refresh Token
							</CheckboxItem>
							<CheckboxItem>
								<Checkbox
									type="checkbox"
									checked={config.grantTypes.ciba}
									onChange={(e) => handleNestedChange('grantTypes', 'ciba', e.target.checked)}
								/>
								CIBA (Client Initiated Backchannel Authentication)
							</CheckboxItem>
						</CheckboxGroup>
					</div>

					<ConfigGrid>
						<ConfigField>
							<ConfigLabel>PKCE Enforcement</ConfigLabel>
							<Select
								value={config.pkceEnforcement}
								onChange={(e) => handleConfigChange('pkceEnforcement', e.target.value)}
							>
								<option value="required">REQUIRED</option>
								<option value="optional">OPTIONAL</option>
								<option value="not_required">NOT REQUIRED</option>
							</Select>
						</ConfigField>
					</ConfigGrid>

					{config.grantTypes.refreshToken && (
						<div style={{ marginTop: '1rem' }}>
							<ConfigLabel>Refresh Token Settings</ConfigLabel>
							<ConfigGrid>
								<ConfigField>
									<ConfigLabel>Refresh Token Duration</ConfigLabel>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<Input
											type="number"
											value={config.refreshTokenDuration}
											onChange={(e) =>
												handleConfigChange(
													'refreshTokenDuration',
													parseInt(e.target.value, 10) || 0
												)
											}
											style={{ flex: 1 }}
										/>
										<Select
											value={config.refreshTokenDurationUnit}
											onChange={(e) =>
												handleConfigChange('refreshTokenDurationUnit', e.target.value)
											}
											style={{ flex: 1 }}
										>
											<option value="seconds">Seconds</option>
											<option value="minutes">Minutes</option>
											<option value="hours">Hours</option>
											<option value="days">Days</option>
										</Select>
									</div>
								</ConfigField>

								<ConfigField>
									<ConfigLabel>Refresh Token Rolling Duration</ConfigLabel>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<Input
											type="number"
											value={config.refreshTokenRollingDuration}
											onChange={(e) =>
												handleConfigChange(
													'refreshTokenRollingDuration',
													parseInt(e.target.value, 10) || 0
												)
											}
											style={{ flex: 1 }}
										/>
										<Select
											value={config.refreshTokenRollingDurationUnit}
											onChange={(e) =>
												handleConfigChange('refreshTokenRollingDurationUnit', e.target.value)
											}
											style={{ flex: 1 }}
										>
											<option value="seconds">Seconds</option>
											<option value="minutes">Minutes</option>
											<option value="hours">Hours</option>
											<option value="days">Days</option>
										</Select>
									</div>
								</ConfigField>
							</ConfigGrid>

							<ConfigField style={{ marginTop: '1rem' }}>
								<ConfigLabel>Refresh Token Rolling Grace Period</ConfigLabel>
								<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
									<Input
										type="number"
										value={config.refreshTokenRollingGracePeriod}
										onChange={(e) =>
											handleConfigChange(
												'refreshTokenRollingGracePeriod',
												parseInt(e.target.value, 10) || 0
											)
										}
										style={{ width: '100px' }}
									/>
									<span style={{ fontSize: '0.875rem', color: V9_COLORS.TEXT.GRAY_MEDIUM }}>
										Seconds
									</span>
								</div>
							</ConfigField>
						</div>
					)}
				</SubSection>

				<div
					style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}
				>
					<Button variant="secondary" onClick={() => setConfig(defaultConfig)}>
						Reset to Defaults
					</Button>
					<Button variant="success" onClick={handleSaveConfiguration}>
						Save Configuration
					</Button>
				</div>
			</SectionContent>
		</CollapsibleSection>
	);
};

export default PingOneAppConfig;
