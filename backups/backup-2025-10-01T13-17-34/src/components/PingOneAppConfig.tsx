// src/components/PingOneAppConfig.tsx - Reusable PingOne Application Configuration Component

import React, { useCallback, useEffect, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';

const CollapsibleSection = styled.div`
  margin: 1.5rem 0;
`;

const SectionToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 1rem;
  background: #f1f5f9;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
  }
`;

const SectionContent = styled.div<{ $collapsed?: boolean }>`
  max-height: ${(props) => (props.$collapsed ? '0' : '2000px')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: ${(props) => (props.$collapsed ? '0 1rem' : '1rem')};
  background: #f8fafc;
  border-radius: 0 0 8px 8px;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1f2937;
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
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
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
  color: #374151;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: #3b82f6;
`;

const SubSection = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const SubSectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
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
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  `
			: `
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background: #e5e7eb;
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
	};
	pkceEnforcement: 'required' | 'optional' | 'not_required';
	refreshTokenDuration: number;
	refreshTokenDurationUnit: 'seconds' | 'minutes' | 'hours' | 'days';
	refreshTokenRollingDuration: number;
	refreshTokenRollingDurationUnit: 'seconds' | 'minutes' | 'hours' | 'days';
	refreshTokenRollingGracePeriod: number;
}

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
				console.error('Failed to load saved configuration:', err);
			}
		}
	}, [storageKey]);

	// Handle configuration changes
	const handleConfigChange = useCallback(
		(field: string, value: any) => {
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
				v4ToastManager.showSaveValidationError(requiredFields);
				return;
			}

			// Show saving toast
			v4ToastManager.showSaveStart();

			// Save to localStorage
			localStorage.setItem(storageKey, JSON.stringify(config));

			// Show success toast
			v4ToastManager.showSaveSuccess();
		} catch (error) {
			// Show error toast
			v4ToastManager.showSaveError(error instanceof Error ? error.message : 'Unknown error');
		}
	}, [config, storageKey]);

	const toggleCollapse = useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

	return (
		<CollapsibleSection>
			<SectionToggle onClick={toggleCollapse}>
				<SectionTitle>
					<FiSettings />
					PingOne Application Configuration
				</SectionTitle>
				{isCollapsed ? <FiChevronDown /> : <FiChevronUp />}
			</SectionToggle>

			<SectionContent $collapsed={isCollapsed}>
				{/* Basic Configuration */}
				<SubSection>
					<SubSectionTitle>Basic Settings</SubSectionTitle>
					<ConfigGrid>
						<ConfigField>
							<Label>Environment ID</Label>
							<Input
								type="text"
								placeholder="b9817c16-9910-4415-b67e-4ac687da74d9"
								value={config.environmentId}
								onChange={(e) => handleConfigChange('environmentId', e.target.value)}
							/>
						</ConfigField>

						<ConfigField>
							<Label>Client ID</Label>
							<Input
								type="text"
								placeholder="a4f963ea-0736-456a-be72-b1fa4f63f81f"
								value={config.clientId}
								onChange={(e) => handleConfigChange('clientId', e.target.value)}
							/>
						</ConfigField>

						<ConfigField>
							<Label>Client Secret</Label>
							<Input
								type="password"
								placeholder="Your client secret"
								value={config.clientSecret}
								onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
							/>
						</ConfigField>

						<ConfigField>
							<Label>Redirect URI</Label>
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
							<Label>Token Endpoint Authentication Method</Label>
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
					<p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
						Configure OIDC settings for the application.
					</p>

					<div style={{ marginBottom: '1rem' }}>
						<Label>Response Type</Label>
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
						<Label>Grant Type</Label>
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
						</CheckboxGroup>
					</div>

					<ConfigGrid>
						<ConfigField>
							<Label>PKCE Enforcement</Label>
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
							<Label>Refresh Token Settings</Label>
							<ConfigGrid>
								<ConfigField>
									<Label>Refresh Token Duration</Label>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<Input
											type="number"
											value={config.refreshTokenDuration}
											onChange={(e) =>
												handleConfigChange('refreshTokenDuration', parseInt(e.target.value) || 0)
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
									<Label>Refresh Token Rolling Duration</Label>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<Input
											type="number"
											value={config.refreshTokenRollingDuration}
											onChange={(e) =>
												handleConfigChange(
													'refreshTokenRollingDuration',
													parseInt(e.target.value) || 0
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
								<Label>Refresh Token Rolling Grace Period</Label>
								<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
									<Input
										type="number"
										value={config.refreshTokenRollingGracePeriod}
										onChange={(e) =>
											handleConfigChange(
												'refreshTokenRollingGracePeriod',
												parseInt(e.target.value) || 0
											)
										}
										style={{ width: '100px' }}
									/>
									<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Seconds</span>
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
					<Button variant="primary" onClick={handleSaveConfiguration}>
						Save Configuration
					</Button>
				</div>
			</SectionContent>
		</CollapsibleSection>
	);
};

export default PingOneAppConfig;
